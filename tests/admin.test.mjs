import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
import worker from "../site/worker.mjs";
import { api } from "../site/admin/api.mjs";
import { verifyAccess, localAdmin } from "../site/admin/auth.mjs";
import { person, sha256 } from "../site/people.mjs";
import { cliPerson } from "../site/cli-auth.mjs";
import { proposalArchive } from "../site/admin/package.mjs";
import { untgz } from "../site/tar.mjs";
const actor = { email: "owner@example.test", role: "superadmin" };
function fixture() {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys=ON");
  for (const f of readdirSync(
    new URL("../site/migrations/", import.meta.url),
  ).sort())
    db.exec(
      readFileSync(new URL("../site/migrations/" + f, import.meta.url), "utf8"),
    );
  const statement = (sql, args = []) => ({
    bind: (...p) => statement(sql, p),
    first: async () => db.prepare(sql).get(...args) ?? null,
    all: async () => ({ results: db.prepare(sql).all(...args) }),
    run: async () => ({ meta: db.prepare(sql).run(...args) }),
  });
  const objects = new Map();
  const env = {
    ADMIN_ENABLED: "on",
    ENVIRONMENT: "local",
    DB: {
      prepare: statement,
      batch: async (list) => {
        db.exec("BEGIN");
        try {
          const r = [];
          for (const s of list) r.push(await s.run());
          db.exec("COMMIT");
          return r;
        } catch (e) {
          db.exec("ROLLBACK");
          throw e;
        }
      },
    },
    ASSETS: {
      fetch: async (r) =>
        new Response(
          JSON.stringify({
            spec: "motionhub/1",
            motions: [
              {
                slug: "@alice/demo",
                name: { en: "Demo" },
                version: "1.0.0",
                catalogs: [],
                tags: [],
                authors: [{ github: "alice" }],
              },
            ],
          }),
          { headers: { "content-type": "application/json" } },
        ),
    },
    ARTIFACT_CONTENT_ORIGIN: "https://artifacts.motionhub.dev",
    ARTIFACT_SITE_ORIGIN: "https://motionhub.dev",
    ARTIFACTS: {
      get: async (k) => (objects.has(k) ? { body: objects.get(k) } : null),
    },
    PACKAGES: { get: async () => null },
  };
  db.prepare(
    "INSERT INTO people(id,login,created_at,seen_at) VALUES (1,'alice',0,0)",
  ).run();
  const artifact = "11111111-1111-4111-8111-111111111111",
    version = "22222222-2222-4222-8222-222222222222";
  db.prepare(
    "INSERT INTO artifacts(id,person,title,draft_version,public_version,updated_at) VALUES (?,1,'Demo',?,NULL,0)",
  ).run(artifact, version);
  db.prepare(
    "INSERT INTO artifact_versions(id,artifact,created_at,ready) VALUES (?,?,0,1)",
  ).run(version, artifact);
  db.prepare("UPDATE artifacts SET public_version=? WHERE id=?").run(
    version,
    artifact,
  );
  db.prepare("INSERT INTO artifact_shares VALUES (?,?,?)").run(
    "a".repeat(64),
    version,
    Math.floor(Date.now() / 1000) + 10000,
  );
  objects.set(
    "versions/" + version + "/index.html",
    "<h1>Private content</h1>",
  );
  return { db, env, artifact, version };
}
const post = (resource, data, origin = "http://localhost:8787") =>
  new Request("http://localhost:8787/api/admin/" + resource, {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(data),
  });
const action = (env, resource, data, who = actor) =>
  api(post(resource, data), env, who, resource);
const state = (entity, id, status, version = 0) => ({
  entity,
  id,
  status,
  version,
  reason: "Reviewed by administrator",
});

test("admin routes deny GitHub cookies and unsigned Access headers; local bypass needs both gates", async () => {
  const { env } = fixture();
  assert.equal(
    localAdmin(new Request("https://motionhub.dev/admin"), env),
    false,
  );
  for (const path of [
    "/admin",
    "/admin/motions",
    "/api/admin/me",
    "/admin/assets/console.js",
  ]) {
    const r = await worker.fetch(
      new Request("https://motionhub.dev" + path, {
        headers: {
          "cf-access-authenticated-user-email": "owner@example.test",
          cookie: "__Host-mh_session=alice",
        },
      }),
      env,
      {},
    );
    assert.equal(r.status, 403);
    assert.equal(r.headers.get("cache-control"), "private, no-store");
  }
  assert.equal(
    (
      await worker.fetch(
        new Request("http://localhost:8787/api/admin/me"),
        env,
        {},
      )
    ).status,
    200,
  );
  env.ENVIRONMENT = "production";
  assert.equal(
    (await worker.fetch(new Request("http://localhost:8787/admin"), env, {}))
      .status,
    403,
  );
  assert.equal(
    (
      await worker.fetch(
        new Request("https://artifacts.motionhub.dev/admin"),
        env,
        {},
      )
    ).status,
    404,
  );
});
test("Access checks signature, issuer, audience, expiry, algorithm and required identity", async () => {
  const key = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  );
  const jwk = {
    ...(await crypto.subtle.exportKey("jwk", key.publicKey)),
    kid: "admin-test-key",
  };
  const env = {
    ACCESS_TEAM_DOMAIN: "admin-test.cloudflareaccess.com",
    ACCESS_AUD: "aud",
  };
  const b64 = (v) =>
    Buffer.from(typeof v === "string" ? v : v).toString("base64url");
  const claims = {
    iss: "https://" + env.ACCESS_TEAM_DOMAIN,
    aud: ["aud"],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 300,
    email: "Editor@example.test",
  };
  const token = async (p = {}, h = {}) => {
    const input =
      b64(JSON.stringify({ alg: "RS256", kid: jwk.kid, ...h })) +
      "." +
      b64(JSON.stringify({ ...claims, ...p }));
    return (
      input +
      "." +
      b64(
        await crypto.subtle.sign(
          "RSASSA-PKCS1-v1_5",
          key.privateKey,
          new TextEncoder().encode(input),
        ),
      )
    );
  };
  const fetcher = async () => Response.json({ keys: [jwk] });
  assert.equal(
    await verifyAccess(await token(), env, fetcher),
    "editor@example.test",
  );
  for (const p of [
    { iss: "https://evil.test" },
    { aud: "other" },
    { exp: 0 },
    { exp: undefined },
    { iat: undefined },
    { nbf: claims.exp + 100 },
    { email: null },
  ])
    assert.equal(await verifyAccess(await token(p), env, fetcher), null);
  assert.equal(
    await verifyAccess(await token({}, { alg: "none" }), env, fetcher),
    null,
  );
  const valid = await token();
  assert.equal(
    await verifyAccess(valid.slice(0, -10) + "invalidxxx", env, fetcher),
    null,
  );
});
test("roles and origin checks protect writes without modifying data", async () => {
  const { env, db } = fixture(),
    data = state("motion", "@alice/demo", "blocked");
  assert.equal(
    (
      await action(env, "state", data, {
        email: "v@example.test",
        role: "viewer",
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await action(env, "state", data, {
        email: "o@example.test",
        role: "operator",
      })
    ).status,
    403,
  );
  assert.equal(
    (await api(post("state", data, "https://evil.test"), env, actor, "state"))
      .status,
    403,
  );
  assert.equal(db.prepare("SELECT count(*) AS n FROM admin_audit").get().n, 0);
});
test("moderation updates use optimistic versions and atomic audits, with a single winner", async () => {
  const { env, db } = fixture();
  assert.equal(
    (await action(env, "state", state("motion", "@alice/demo", "blocked")))
      .status,
    200,
  );
  assert.equal(
    (await action(env, "state", state("motion", "@alice/demo", "active")))
      .status,
    409,
  );
  assert.equal(db.prepare("SELECT count(*) AS n FROM admin_audit").get().n, 1);
  assert.equal(
    (await action(env, "state", state("motion", "@alice/demo", "active", 1)))
      .status,
    200,
  );
  const row = db.prepare("SELECT * FROM admin_states").get();
  assert.equal(row.version, 2);
  assert.equal(row.status, "active");
  assert.equal(
    (await action(env, "state", state("motion", "@alice/missing", "blocked")))
      .status,
    404,
  );
});
test("motion blocking prevents every package, page and reel path, including encoded IDs; catalogue filters immediately", async () => {
  const { env } = fixture();
  await action(env, "state", state("motion", "@alice/demo", "blocked"));
  for (const path of [
    "/m/@alice/demo/",
    "/m/%40alice/demo/motion.json",
    "/m/@alice/demo/1.0.0.tgz",
    "/m/@alice/demo/1.0.0.mp4",
    "/play/@alice/demo/index.html",
  ]) {
    const r = await worker.fetch(
      new Request("https://motionhub.dev" + path),
      env,
      {},
    );
    assert.equal(r.status, 404);
    assert.match(r.headers.get("cache-control"), /no-store/);
  }
  const r = await worker.fetch(
    new Request("https://motionhub.dev/api/motions.json"),
    env,
    {},
  );
  assert.equal((await r.json()).motions.length, 0);
});
test("artifact blocking covers public work, shared and published content, and persists despite author publication state", async () => {
  const { env, artifact, version } = fixture();
  const content =
      "https://artifacts.motionhub.dev/published/" + version + "/index.html",
    shared =
      "https://artifacts.motionhub.dev/shared/" +
      "a".repeat(64) +
      "/index.html";
  assert.equal((await worker.fetch(new Request(content), env, {})).status, 200);
  await action(env, "state", state("artifact", artifact, "blocked"));
  for (const url of [
    content,
    shared,
    "https://motionhub.dev/works/" + artifact,
    "https://motionhub.dev/artifact-share/" + "a".repeat(64),
    "https://motionhub.dev/artifact/" + artifact + "/preview",
  ])
    assert.equal((await worker.fetch(new Request(url), env, {})).status, 404);
  await action(env, "state", state("artifact", artifact, "active", 1));
  assert.equal((await worker.fetch(new Request(content), env, {})).status, 200);
});
test("private previews are role checked, short lived, sandboxed and audited; revocation invalidates old links", async () => {
  const { env, db, artifact, version } = fixture();
  const data = {
    id: artifact,
    artifact_version: version,
    reason: "Review a reported work",
  };
  assert.equal(
    (
      await action(env, "preview", data, {
        email: "op@example.test",
        role: "operator",
      })
    ).status,
    403,
  );
  const result = await (await action(env, "preview", data)).json();
  assert.match(result.url, /^https:\/\/artifacts.motionhub.dev\/review\//);
  await action(env, "state", state("artifact", artifact, "blocked"));
  const r = await worker.fetch(new Request(result.url), env, {});
  assert.equal(r.status, 200);
  assert.match(
    r.headers.get("content-security-policy"),
    /sandbox allow-scripts/,
  );
  assert.doesNotMatch(
    r.headers.get("content-security-policy"),
    /allow-same-origin/,
  );
  assert.equal(
    db
      .prepare(
        "SELECT count(*) AS n FROM admin_audit WHERE action='private-preview'",
      )
      .get().n,
    1,
  );
  await action(env, "revoke-links", {
    id: artifact,
    reason: "Revoke exposed links",
  });
  assert.equal(
    (await worker.fetch(new Request(result.url), env, {})).status,
    404,
  );
  assert.equal(
    db.prepare("SELECT count(*) AS n FROM artifact_shares").get().n,
    0,
  );
});
test("account restriction revokes web and CLI credentials and blocks the account’s public artifact bytes", async () => {
  const { env, db, version } = fixture();
  const hash = await sha256("alice"),
    token = "b".repeat(64),
    at = Math.floor(Date.now() / 1000) + 300;
  db.prepare("INSERT INTO sessions VALUES (?,1,0,?)").run(hash, at);
  db.prepare(
    "INSERT INTO cli_devices(code_hash,secret_hash,user_code_hash,person,expires_at,token_hash) VALUES ('a','b','c',1,?,?)",
  ).run(at, await sha256(token));
  const req = new Request("https://motionhub.dev/api/me", {
    headers: { cookie: "__Host-mh_session=alice" },
  });
  assert.equal((await person(req, env)).id, 1);
  assert.equal(
    (
      await cliPerson(
        new Request(req, { headers: { authorization: "Bearer " + token } }),
        env,
      )
    ).id,
    1,
  );
  await action(env, "state", state("person", "1", "blocked"));
  assert.equal(await person(req, env), null);
  assert.equal(db.prepare("SELECT count(*) AS n FROM cli_devices").get().n, 0);
  assert.equal(
    (
      await worker.fetch(
        new Request(
          "https://artifacts.motionhub.dev/published/" +
            version +
            "/index.html",
        ),
        env,
        {},
      )
    ).status,
    404,
  );
});
test("collections validate items, prevent stale edits, publish ordered visible selections and preserve drafts", async () => {
  const { env } = fixture(),
    data = {
      slug: "selected",
      title: "Selected",
      description: "Editorial",
      items: ["@alice/demo"],
      status: "draft",
      position: 2,
      version: 0,
      reason: "Create a collection",
    };
  assert.equal((await action(env, "collections", data)).status, 200);
  const url = "https://motionhub.dev/api/collections.json";
  const fetch = () => worker.fetch(new Request(url), env, {});
  assert.equal((await (await fetch()).json()).collections.length, 0);
  assert.equal(
    (
      await action(env, "collections", {
        ...data,
        status: "published",
        version: 1,
      })
    ).status,
    200,
  );
  assert.deepEqual((await (await fetch()).json()).collections[0].motions, [
    "@alice/demo",
  ]);
  assert.equal(
    (
      await action(env, "collections", {
        ...data,
        status: "archived",
        version: 1,
      })
    ).status,
    409,
  );
  await action(env, "state", state("motion", "@alice/demo", "blocked"));
  assert.equal((await (await fetch()).json()).collections.length, 0);
  assert.equal(
    (
      await action(env, "collections", {
        ...data,
        status: "published",
        version: 2,
      })
    ).status,
    400,
  );
});
test("administrator management prevents self and bootstrap changes and stale writes", async () => {
  const { env, db } = fixture();
  env.ADMIN_BOOTSTRAP_EMAILS = "bootstrap@example.test";
  const data = {
    email: "reviewer@example.test",
    role: "reviewer",
    version: 0,
    reason: "Grant review access",
  };
  assert.equal((await action(env, "roles", data)).status, 200);
  assert.equal((await action(env, "roles", data)).status, 409);
  for (const email of [actor.email, "bootstrap@example.test"])
    assert.equal((await action(env, "roles", { ...data, email })).status, 400);
  assert.equal(
    (await action(env, "roles", { ...data, role: "remove", version: 1 }))
      .status,
    200,
  );
  assert.equal(db.prepare("SELECT count(*) AS n FROM admin_roles").get().n, 0);
});
test("submission detail never discloses poll tokens or terminal codes", async () => {
  const { env, db } = fixture();
  db.prepare(
    "INSERT INTO submissions(id,poll_hash,code,motion,version,sha256,bytes,status,created_at,expires_at) VALUES ('demo','poll-secret','SECRET-CODE','@alice/demo','1.0.0','hash',5,'uploaded',0,0)",
  ).run();
  const r = await api(
    new Request("http://localhost/api/admin/submissions?id=demo"),
    env,
    actor,
    "submissions",
  );
  assert.equal(r.status, 200);
  const body = await r.text();
  assert.doesNotMatch(body, /poll-secret|SECRET-CODE|poll_hash/);
  assert.equal(
    (await action(env, "state", state("submission", "demo", "approved")))
      .status,
    409,
  );
});
test("feature switches gate submission and artifact operations; malformed writes leave no audit", async () => {
  const { env, db } = fixture();
  await action(env, "state", state("setting", "submissions", "off"));
  assert.equal(
    (
      await worker.fetch(
        new Request("https://motionhub.dev/api/submissions", {
          method: "POST",
          body: "bytes",
        }),
        env,
        {},
      )
    ).status,
    503,
  );
  await action(env, "state", state("setting", "artifacts", "off"));
  assert.equal(
    (
      await worker.fetch(
        new Request("https://motionhub.dev/artifacts"),
        env,
        {},
      )
    ).status,
    503,
  );
  const before = db.prepare("SELECT count(*) AS n FROM admin_audit").get().n;
  assert.equal(
    (
      await action(env, "state", {
        ...state("person", "1", "blocked"),
        version: -1,
      })
    ).status,
    400,
  );
  assert.equal(
    db.prepare("SELECT count(*) AS n FROM admin_audit").get().n,
    before,
  );
});
test("proposal digest covers a valid gzip tar containing the exact proposed files", async () => {
  const files = [
    {
      path: "motion.json",
      data: new TextEncoder().encode('{"version":"2.0.0"}'),
    },
    { path: "MOTION.md", data: new TextEncoder().encode("A proposed look.") },
  ];
  const { bytes, digest } = await proposalArchive("@alice/demo", files);
  const entries = await untgz(bytes);
  assert.equal(entries.length, 2);
  assert.equal(
    new TextDecoder().decode(
      entries.find((e) => e.path.endsWith("MOTION.md")).data,
    ),
    "A proposed look.",
  );
  assert.equal(
    digest,
    Buffer.from(await crypto.subtle.digest("SHA-256", bytes)).toString("hex"),
  );
});

test("quota settings validate supported maxima and enforce account, version and byte limits", async () => {
  const { env, db, artifact } = fixture();
  for (const [id, status] of [
    ["upload_mib", "9"],
    ["artifacts_per_account", "0"],
    ["versions_per_artifact", "invalid"],
  ])
    assert.equal(
      (await action(env, "state", state("quota", id, status))).status,
      400,
    );
  await action(env, "state", state("quota", "artifacts_per_account", "1"));
  const at = Math.floor(Date.now() / 1000) + 300;
  db.prepare("INSERT INTO sessions VALUES (?,1,0,?)").run(
    await sha256("quota-user"),
    at,
  );
  const send = (path, body) =>
    worker.fetch(
      new Request("https://motionhub.dev" + path, {
        method: "POST",
        headers: {
          origin: "https://motionhub.dev",
          cookie: "__Host-mh_session=quota-user",
          "content-type": "text/html",
        },
        body,
      }),
      env,
      {},
    );
  assert.equal((await send("/api/artifacts", "new work")).status, 429);
  await action(env, "state", state("quota", "versions_per_artifact", "1"));
  assert.equal(
    (await send("/api/artifacts/" + artifact, "new version")).status,
    429,
  );
  await action(env, "state", state("quota", "upload_mib", "1"));
  assert.equal(
    (await send("/api/artifacts/" + artifact, "x".repeat(1024 * 1024 + 1)))
      .status,
    400,
  );
});

test("workflow retries reserve each attempt, audit it and refuse duplicate dispatch", async () => {
  const { env, db } = fixture();
  env.ADMIN_GITHUB_TOKEN = "local-test-placeholder";
  const original = globalThis.fetch;
  let dispatched = 0;
  globalThis.fetch = async (url, init) =>
    init?.method === "POST"
      ? (dispatched++, new Response(null, { status: 204 }))
      : Response.json({
          status: "completed",
          conclusion: "failure",
          path: ".github/workflows/check.yml",
          run_attempt: 1,
        });
  try {
    const data = { id: "12345", reason: "Retry failed check" };
    assert.equal(
      (
        await action(env, "retry", data, {
          email: "reviewer@example.test",
          role: "reviewer",
        })
      ).status,
      403,
    );
    assert.equal((await action(env, "retry", data)).status, 200);
    assert.equal((await action(env, "retry", data)).status, 409);
    assert.equal(dispatched, 1);
    assert.equal(
      db.prepare("SELECT status FROM admin_jobs WHERE id='retry-12345-1'").get()
        .status,
      "succeeded",
    );
  } finally {
    globalThis.fetch = original;
  }
});
test("a version proposal opens an author-attributed PR, retains its digest archive, and never writes main", async () => {
  const { env, db } = fixture();
  const { tgz } = await import("../tools/pack.mjs");
  const { forgetToken } = await import("../site/github-app.mjs");
  forgetToken();
  const manifest = {
    scope: "alice",
    slug: "demo",
    version: "1.0.0",
    name: { en: "Demo" },
    line: { en: "Original" },
    authors: [{ github: "alice" }],
    tags: ["light"],
  };
  const objects = new Map([
    [
      "m/@alice/demo/1.0.0.tgz",
      tgz([
        ["@alice/demo/motion.json", Buffer.from(JSON.stringify(manifest))],
        ["@alice/demo/MOTION.md", Buffer.from("Original look.")],
      ]),
    ],
  ]);
  env.PACKAGES = {
    get: async (key) =>
      objects.has(key) ? { arrayBuffer: async () => objects.get(key) } : null,
    put: async (key, bytes) => objects.set(key, bytes),
  };
  const key = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  );
  env.GITHUB_APP_ID = "123";
  env.GITHUB_APP_PRIVATE_KEY =
    "-----BEGIN PRIVATE KEY-----\n" +
    Buffer.from(
      await crypto.subtle.exportKey("pkcs8", key.privateKey),
    ).toString("base64") +
    "\n-----END PRIVATE KEY-----";
  env.ADMIN_GITHUB_IDENTITIES = JSON.stringify({
    [actor.email]: { id: 1, login: "alice", name: "Alice" },
  });
  const original = globalThis.fetch,
    calls = [];
  globalThis.fetch = async (url, init = {}) => {
    const u = new URL(url),
      method = init.method ?? "GET",
      body = init.body ? JSON.parse(init.body) : null;
    calls.push({ path: u.pathname, method, body });
    if (u.pathname === "/users/alice") return Response.json({ id: 1 });
    if (u.pathname.endsWith("/installation"))
      return Response.json({ id: 7, app_slug: "motionhub" });
    if (u.pathname.endsWith("/access_tokens"))
      return Response.json({
        token: "local-fake-installation",
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      });
    if (u.pathname.endsWith("/git/ref/heads/main"))
      return Response.json({ object: { sha: "main" } });
    if (u.pathname.includes("/git/ref/heads/share/"))
      return new Response("", { status: 404 });
    if (u.pathname.endsWith("/git/commits/main"))
      return Response.json({ tree: { sha: "base" } });
    if (u.pathname.endsWith("/git/trees/base"))
      return Response.json({
        truncated: false,
        tree: [
          { type: "blob", path: "accounts/alice.json" },
          { type: "blob", path: "motions/@alice/demo/MOTION.md" },
        ],
      });
    if (u.pathname.endsWith("/git/trees"))
      return Response.json({ sha: "new-tree" });
    if (u.pathname.endsWith("/git/commits"))
      return Response.json({ sha: "new-commit" });
    if (u.pathname.endsWith("/git/refs"))
      return Response.json({ ref: body.ref });
    if (u.pathname.endsWith("/pulls"))
      return Response.json({
        number: 42,
        html_url: "https://github.com/motionhub-dev/motions/pull/42",
      });
    if (u.pathname.endsWith("/labels")) return Response.json([]);
    throw Error("Unexpected mocked GitHub call: " + u.pathname);
  };
  try {
    const data = {
      id: "@alice/demo",
      new_version: "2.0.0",
      name: "New look",
      line: "Updated description",
      document: "Updated look.",
      tags: ["light", "hand-drawn"],
      reason: "Improve motion guidance",
      dco: true,
    };
    assert.equal(
      (await action(env, "proposal", { ...data, dco: false })).status,
      400,
    );
    const response = await action(env, "proposal", data);
    assert.equal(response.status, 200, await response.clone().text());
    const result = await response.json();
    assert.equal(result.pr, 42);
    const archive = objects.get("admin/proposals/" + result.job + ".tgz");
    assert.ok(archive);
    assert.equal(
      result.sha256,
      Buffer.from(await crypto.subtle.digest("SHA-256", archive)).toString(
        "hex",
      ),
    );
    const packed = await untgz(archive);
    const proposed = JSON.parse(
      new TextDecoder().decode(
        packed.find((f) => f.path.endsWith("motion.json")).data,
      ),
    );
    assert.equal(proposed.version, "2.0.0");
    assert.deepEqual(proposed.tags, data.tags);
    const commit = calls.find(
      (c) => c.path.endsWith("/git/commits") && c.method === "POST",
    );
    assert.match(commit.body.message, /Signed-off-by: Alice/);
    assert.match(commit.body.message, /Motionhub-Submitted-By: 1 alice/);
    assert.ok(commit.body.message.includes(result.sha256));
    assert.ok(
      !calls.some((c) => c.method !== "GET" && c.path.includes("/heads/main")),
    );
    assert.equal(
      db.prepare("SELECT status FROM admin_jobs").get().status,
      "succeeded",
    );
  } finally {
    globalThis.fetch = original;
    forgetToken();
  }
});
