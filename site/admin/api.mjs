import { proposalArchive } from "./package.mjs";
import { can, bootstrapEmails } from "./auth.mjs";
import { limitedBytes } from "../artifact-files.mjs";
import { state, hiddenMotions, quotas, quotaDefaults } from "./policy.mjs";
import { sameOrigin } from "../people.mjs";
import { loadPackage, eligibility } from "../submissions.mjs";
import { commitSubmission } from "../github-app.mjs";
import { REPO } from "../repo.mjs";

export const json = (data, status = 200) =>
  Response.json(data, {
    status,
    headers: { "cache-control": "private, no-store" },
  });
const now = () => Math.floor(Date.now() / 1000);
const idPattern = /^@[a-z0-9-]+\/[a-z0-9-]+$/;
export const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};
const need = (actor, permission) => {
  if (!can(actor, permission))
    fail("This role cannot perform that action.", 403);
};
const text = (value, max, required = false) => {
  if (
    typeof value !== "string" ||
    value.length > max ||
    (required && !value.trim())
  )
    fail("Check the required fields and their lengths.");
  return value.trim();
};
const version = (value) => {
  if (!Number.isSafeInteger(value) || value < 0)
    fail("A current record version is required.");
  return value;
};
const all = async (env, sql, ...args) =>
  (
    await env.DB.prepare(sql)
      .bind(...args)
      .all()
  ).results;
export async function catalogue(request, env) {
  const response = await env.ASSETS.fetch(
    new Request(new URL("/api/motions.json", request.url)),
  );
  if (!response.ok)
    fail("Build the catalogue before using the admin console.", 503);
  return (await response.json()).motions;
}
const safeSubmission =
  "s.id,s.motion,s.version,s.status,s.person,s.pr,s.created_at,s.expires_at,s.sha256,s.bytes,p.login";
const pageRows = (rows, url) => {
  const q = (url.searchParams.get("q") ?? "").toLowerCase().slice(0, 150),
    status = url.searchParams.get("status") ?? "";
  const filtered = rows.filter(
    (r) =>
      (!q || JSON.stringify(r).toLowerCase().includes(q)) &&
      (!status || r.status === status || r.admin_status === status),
  );
  const sort = url.searchParams.get("sort");
  if (sort === "az") {
    const name = (r) => {
      const v =
        r.name ??
        r.title ??
        r.motion ??
        r.login ??
        r.slug ??
        r.entity_id ??
        r.id;
      return typeof v === "object" ? String(v.en ?? "") : String(v ?? "");
    };
    filtered.sort((a, b) => name(a).localeCompare(name(b)));
  }
  if (sort === "oldest" || sort === "newest")
    filtered.sort(
      (a, b) =>
        (Number(a.created_at ?? a.updated_at ?? a.seen_at ?? 0) -
          Number(b.created_at ?? b.updated_at ?? b.seen_at ?? 0)) *
        (sort === "oldest" ? 1 : -1),
    );
  const page = Math.max(
    1,
    Math.min(10000, Number(url.searchParams.get("page")) || 1),
  );
  const start = (Math.floor(page) - 1) * 20;
  return {
    rows: filtered.slice(start, start + 20),
    total: filtered.length,
    page: Math.floor(page),
    pages: Math.max(1, Math.ceil(filtered.length / 20)),
  };
};
const attach = async (env, rows, entity) => {
  const states = new Map(
    (await all(env, "SELECT * FROM admin_states WHERE entity = ?", entity)).map(
      (s) => [s.id, s],
    ),
  );
  return rows.map((row) => ({
    ...row,
    moderation: states.get(String(row.id ?? row.slug)) ?? null,
    admin_status: states.get(String(row.id ?? row.slug))?.status ?? "active",
  }));
};
const auditStatement = (
  env,
  actor,
  entity,
  id,
  action,
  reason,
  before,
  after,
  op,
) =>
  env.DB.prepare(
    `INSERT INTO admin_audit
  (id,actor,entity,entity_id,action,reason,before_json,after_json,created_at) SELECT ?,?,?,?,?,?,?,?,? WHERE changes()>0`,
  ).bind(
    op,
    actor.email,
    entity,
    String(id),
    action,
    reason,
    JSON.stringify(before),
    JSON.stringify(after),
    now(),
  );
async function commit(
  env,
  mutation,
  actor,
  entity,
  id,
  action,
  reason,
  before,
  after,
  extras = [],
) {
  const op = crypto.randomUUID();
  const results = await env.DB.batch([
    mutation,
    auditStatement(env, actor, entity, id, action, reason, before, after, op),
    ...extras.map((make) => make(op)),
  ]);
  if (!results[0].meta.changes)
    fail("This record changed. Reload and review before saving.", 409);
  return { ok: true };
}
export async function editState(env, actor, data) {
  const entity = data.entity,
    id = text(data.id, 150, true),
    v = version(data.version);
  const permission = {
    motion: "moderate",
    artifact: "moderate",
    person: "people",
    submission: "moderate",
    setting: "settings",
    quota: "settings",
  }[entity];
  if (!permission) fail("Unknown entity.");
  need(actor, permission);
  const statuses = {
    motion: ["active", "blocked"],
    artifact: ["active", "blocked"],
    person: ["active", "blocked"],
    submission: ["pending", "approved", "rejected", "changes_requested"],
    setting: ["on", "off"],
  };
  if (entity === "quota") {
    if (
      !Object.hasOwn(quotaDefaults, id) ||
      !/^\d+$/.test(data.status) ||
      Number(data.status) < 1 ||
      Number(data.status) > quotaDefaults[id]
    )
      fail("Quota exceeds its supported range.");
  } else if (!statuses[entity].includes(data.status))
    fail("Unsupported status.");
  const reason = text(data.reason, 1000, true),
    before = await state(env, entity, id);
  if ((before?.version ?? 0) !== v)
    fail("This record changed. Reload before saving.", 409);
  if (entity === "setting" && !["submissions", "artifacts"].includes(id))
    fail("Unknown setting.");
  if (entity === "motion" && !idPattern.test(id)) fail("Invalid motion ID.");
  if (["artifact", "person", "submission"].includes(entity)) {
    const table = {
      artifact: "artifacts",
      person: "people",
      submission: "submissions",
    }[entity];
    if (
      !(await env.DB.prepare(`SELECT id FROM ${table} WHERE id = ?`)
        .bind(id)
        .first())
    )
      fail("Record not found.", 404);
  }
  const mutation = env.DB
    .prepare(`INSERT INTO admin_states(entity,id,status,note,version,updated_at)
    SELECT ?,?,?,?,1,? WHERE ?=0
    ON CONFLICT(entity,id) DO UPDATE SET status=excluded.status,note=excluded.note,version=admin_states.version+1,updated_at=excluded.updated_at WHERE admin_states.version=?`);
  // UPDATE and first INSERT are separate: INSERT's SELECT must also produce a row for existing versions.
  const update = before
    ? env.DB.prepare(
        "UPDATE admin_states SET status=?,note=?,version=version+1,updated_at=? WHERE entity=? AND id=? AND version=?",
      ).bind(data.status, reason, now(), entity, id, v)
    : mutation.bind(entity, id, data.status, reason, now(), v, v);
  if (entity === "submission" && data.status === "approved") {
    const row = await env.DB.prepare(
      "SELECT status,pr FROM submissions WHERE id=?",
    )
      .bind(id)
      .first();
    if (row.status !== "submitted" || !row.pr)
      fail("Approval requires an already submitted pull request.", 409);
  }
  const extras =
    entity === "person" && data.status === "blocked"
      ? [
          (op) =>
            env.DB.prepare(
              "DELETE FROM sessions WHERE person=? AND EXISTS(SELECT 1 FROM admin_audit WHERE id=?)",
            ).bind(id, op),
          (op) =>
            env.DB.prepare(
              "DELETE FROM cli_devices WHERE person=? AND EXISTS(SELECT 1 FROM admin_audit WHERE id=?)",
            ).bind(id, op),
        ]
      : [];
  return commit(
    env,
    update,
    actor,
    entity,
    id,
    "status",
    reason,
    before,
    { status: data.status, version: v + 1 },
    extras,
  );
}
async function collection(request, env, actor, data) {
  need(actor, "collections");
  const slug = text(data.slug, 80, true),
    title = text(data.title, 160, true),
    description = text(data.description ?? "", 1000);
  if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
    !["draft", "published", "archived"].includes(data.status)
  )
    fail("Invalid collection.");
  const items = data.items;
  if (
    !Array.isArray(items) ||
    items.length > 50 ||
    new Set(items).size !== items.length ||
    items.some((id) => typeof id !== "string" || !idPattern.test(id))
  )
    fail("Select up to 50 unique motion IDs.");
  const rows = await catalogue(request, env),
    ids = new Set(rows.map((r) => r.slug));
  if (items.some((id) => !ids.has(id)))
    fail("A selected motion no longer exists.");
  const hidden = await hiddenMotions(env);
  if (
    data.status === "published" &&
    (!items.length || items.some((id) => hidden.has(id)))
  )
    fail("Publishing requires visible motions.");
  if (
    !Number.isSafeInteger(data.position) ||
    data.position < 0 ||
    data.position > 9999
  )
    fail("Invalid position.");
  const v = version(data.version),
    reason = text(data.reason, 1000, true);
  const before = await env.DB.prepare(
    "SELECT * FROM admin_collections WHERE slug=?",
  )
    .bind(slug)
    .first();
  if ((before?.version ?? 0) !== v)
    fail("Collection changed. Reload before saving.", 409);
  const values = [
    title,
    description,
    JSON.stringify(items),
    data.status,
    data.position,
    now(),
  ];
  const mutation = before
    ? env.DB.prepare(
        "UPDATE admin_collections SET title=?,description=?,items_json=?,status=?,position=?,updated_at=?,version=version+1 WHERE slug=? AND version=?",
      ).bind(...values, slug, v)
    : env.DB.prepare(
        "INSERT OR IGNORE INTO admin_collections(title,description,items_json,status,position,updated_at,slug) VALUES (?,?,?,?,?,?,?)",
      ).bind(...values, slug);
  return commit(
    env,
    mutation,
    actor,
    "collection",
    slug,
    "save",
    reason,
    before,
    { ...data, version: v + 1 },
  );
}
async function role(env, actor, data) {
  need(actor, "roles");
  const email = text(data.email, 254, true).toLowerCase(),
    v = version(data.version),
    reason = text(data.reason, 1000, true);
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !["viewer", "reviewer", "operator", "superadmin", "remove"].includes(
      data.role,
    )
  )
    fail("Invalid email or role.");
  if (email === actor.email || bootstrapEmails(env).includes(email))
    fail(
      "Manage bootstrap administrators in environment settings; you cannot change your own role.",
    );
  const before = await env.DB.prepare("SELECT * FROM admin_roles WHERE email=?")
    .bind(email)
    .first();
  if ((before?.version ?? 0) !== v)
    fail("Role changed. Reload before saving.", 409);
  const mutation =
    data.role === "remove"
      ? env.DB.prepare(
          "DELETE FROM admin_roles WHERE email=? AND version=?",
        ).bind(email, v)
      : before
        ? env.DB.prepare(
            "UPDATE admin_roles SET role=?,version=version+1 WHERE email=? AND version=?",
          ).bind(data.role, email, v)
        : env.DB.prepare(
            "INSERT OR IGNORE INTO admin_roles(email,role) VALUES (?,?)",
          ).bind(email, data.role);
  return commit(
    env,
    mutation,
    actor,
    "role",
    email,
    data.role,
    reason,
    before,
    { role: data.role },
  );
}
async function revoke(env, actor, data) {
  need(actor, "people");
  const id = text(data.id, 30, true),
    reason = text(data.reason, 1000, true);
  if (
    !(await env.DB.prepare("SELECT id FROM people WHERE id=?").bind(id).first())
  )
    fail("Person not found.", 404);
  const op = crypto.randomUUID();
  await env.DB.batch([
    env.DB.prepare("DELETE FROM sessions WHERE person=?").bind(id),
    env.DB.prepare("DELETE FROM cli_devices WHERE person=?").bind(id),
    env.DB.prepare("INSERT INTO admin_audit VALUES (?,?,?,?,?,?,?,?,?)").bind(
      op,
      actor.email,
      "person",
      id,
      "revoke-sessions",
      reason,
      "{}",
      "{}",
      now(),
    ),
  ]);
  return { ok: true };
}
async function revokeShares(env, actor, data) {
  need(actor, "moderate");
  const id = text(data.id, 80, true),
    reason = text(data.reason, 1000, true);
  const before = await env.DB.prepare("SELECT id FROM artifacts WHERE id=?")
    .bind(id)
    .first();
  if (!before) fail("Artifact not found.", 404);
  await env.DB.batch([
    env.DB.prepare(
      "DELETE FROM admin_review_grants WHERE version IN (SELECT id FROM artifact_versions WHERE artifact=?)",
    ).bind(id),
    env.DB.prepare(
      "DELETE FROM artifact_shares WHERE version IN (SELECT id FROM artifact_versions WHERE artifact=?)",
    ).bind(id),
    env.DB.prepare(
      "DELETE FROM artifact_preview_grants WHERE version IN (SELECT id FROM artifact_versions WHERE artifact=?)",
    ).bind(id),
    env.DB.prepare("INSERT INTO admin_audit VALUES (?,?,?,?,?,?,?,?,?)").bind(
      crypto.randomUUID(),
      actor.email,
      "artifact",
      id,
      "revoke-links",
      reason,
      "{}",
      "{}",
      now(),
    ),
  ]);
  return { ok: true };
}
async function preview(env, actor, data) {
  need(actor, "preview");
  const id = text(data.id, 80, true),
    reason = text(data.reason, 1000, true);
  const row = await env.DB.prepare(
    "SELECT a.id,a.person,v.id AS version FROM artifacts a JOIN artifact_versions v ON v.artifact=a.id WHERE a.id=? AND v.id=? AND v.ready=1",
  )
    .bind(id, data.artifact_version)
    .first();
  if (!row) fail("Ready version not found.", 404);
  let origin;
  try {
    origin = new URL(env.ARTIFACT_CONTENT_ORIGIN);
  } catch {
    fail("Artifact content origin is not configured.", 503);
  }
  if (
    !env.ARTIFACTS ||
    origin.protocol !== "https:" ||
    origin.origin !== env.ARTIFACT_CONTENT_ORIGIN ||
    origin.origin === (env.ARTIFACT_SITE_ORIGIN ?? "https://motionhub.dev")
  )
    fail("Separate HTTPS artifact origin required.", 503);
  const token =
    crypto.randomUUID().replaceAll("-", "") +
    crypto.randomUUID().replaceAll("-", "");
  const { sha256 } = await import("../people.mjs");
  await env.DB.batch([
    env.DB.prepare("INSERT INTO admin_review_grants VALUES (?,?,?)").bind(
      await sha256(token),
      row.version,
      now() + 900,
    ),
    env.DB.prepare("INSERT INTO admin_audit VALUES (?,?,?,?,?,?,?,?,?)").bind(
      crypto.randomUUID(),
      actor.email,
      "artifact",
      id,
      "private-preview",
      reason,
      "{}",
      JSON.stringify({ version: row.version }),
      now(),
    ),
  ]);
  return {
    url: `${origin.origin}/review/${token}/index.html`,
    expires_at: now() + 900,
  };
}
async function github(env, path, method = "GET") {
  const res = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
    method,
    headers: {
      accept: "application/vnd.github+json",
      "user-agent": "motionhub-admin",
      ...(env.ADMIN_GITHUB_TOKEN
        ? { authorization: `Bearer ${env.ADMIN_GITHUB_TOKEN}` }
        : {}),
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok)
    fail(
      `GitHub returned HTTP ${res.status}. Check the configured repository access.`,
      502,
    );
  return res.status === 204 ? {} : res.json();
}
async function retry(env, actor, data) {
  need(actor, "jobs");
  const id = text(data.id, 30, true),
    reason = text(data.reason, 1000, true);
  if (!/^\d+$/.test(id)) fail("Invalid run ID.");
  if (!env.ADMIN_GITHUB_TOKEN)
    fail(
      "Configure ADMIN_GITHUB_TOKEN with Actions write access to retry workflows.",
      503,
    );
  const run = await github(env, `/actions/runs/${id}`);
  if (
    run.status !== "completed" ||
    !["failure", "timed_out", "cancelled"].includes(run.conclusion) ||
    ![
      ".github/workflows/check.yml",
      ".github/workflows/render.yml",
      ".github/workflows/deploy.yml",
    ].includes(run.path)
  )
    fail("Only failed check, render and deploy workflows can be retried.", 409);
  return recordedJob(
    env,
    actor,
    "workflow-retry",
    { id, attempt: run.run_attempt },
    reason,
    () => github(env, `/actions/runs/${id}/rerun-failed-jobs`, "POST"),
    `retry-${id}-${run.run_attempt}`,
  );
}
async function recordedJob(
  env,
  actor,
  kind,
  input,
  reason,
  action,
  id = crypto.randomUUID(),
) {
  // A retained reservation prevents duplicate remote writes, including after a lost response.
  const at = now();
  const reserved = await env.DB.prepare(
    "INSERT OR IGNORE INTO admin_jobs(id,kind,status,actor,input_json,created_at,updated_at) VALUES (?,?,'running',?,?,?,?)",
  )
    .bind(id, kind, actor.email, JSON.stringify(input), at, at)
    .run();
  if (!reserved.meta.changes)
    fail(
      "This operation was already requested. Inspect its job record before trying again.",
      409,
    );
  await env.DB.prepare("INSERT INTO admin_audit VALUES (?,?,?,?,?,?,?,?,?)")
    .bind(
      crypto.randomUUID(),
      actor.email,
      "job",
      id,
      kind,
      reason,
      "{}",
      JSON.stringify(input),
      at,
    )
    .run();
  try {
    const result = await action();
    await env.DB.prepare(
      "UPDATE admin_jobs SET status=?,result_json=?,updated_at=? WHERE id=?",
    )
      .bind("succeeded", JSON.stringify(result), now(), id)
      .run();
    return { ok: true, ...result, job: id };
  } catch (error) {
    await env.DB.prepare(
      "UPDATE admin_jobs SET status=?,result_json=?,updated_at=? WHERE id=?",
    )
      .bind(
        "needs_review",
        JSON.stringify({
          error:
            "Remote operation was not confirmed. Inspect GitHub before retrying.",
        }),
        now(),
        id,
      )
      .run();
    throw error;
  }
}
async function proposal(request, env, actor, data) {
  need(actor, "proposal");
  if (!env.GITHUB_APP_ID || !env.GITHUB_APP_PRIVATE_KEY)
    fail("GitHub App is not configured.", 503);
  if (data.dco !== true)
    fail(
      "Certify the Developer Certificate of Origin before proposing a change.",
    );
  const id = text(data.id, 100, true),
    reason = text(data.reason, 1000, true);
  const rows = await catalogue(request, env),
    row = rows.find((r) => r.slug === id);
  if (!row) fail("Motion not found.", 404);
  // Explicit out-of-band identity mapping prevents an Access user impersonating a motion author.
  let identities;
  try {
    identities = JSON.parse(env.ADMIN_GITHUB_IDENTITIES ?? "{}");
  } catch {
    fail("Invalid administrator GitHub identity configuration.", 503);
  }
  const me = identities[actor.email];
  if (
    !me ||
    !Number.isSafeInteger(me.id) ||
    !/^[a-zA-Z0-9-]+$/.test(me.login ?? "")
  )
    fail(
      "Map this Access identity to a verified GitHub account in ADMIN_GITHUB_IDENTITIES first.",
      403,
    );
  const check = await fetch(`https://api.github.com/users/${me.login}`, {
    headers: { "user-agent": "motionhub-admin" },
    signal: AbortSignal.timeout(5000),
  });
  if (!check.ok || (await check.json()).id !== me.id)
    fail("GitHub identity mapping could not be verified.", 403);
  return proposalPackage(env, actor, data, row, me, reason);
}
async function proposalPackage(env, actor, data, row, me, reason) {
  const obj = await env.PACKAGES.get(`m/${data.id}/${row.version}.tgz`);
  if (!obj) fail("Published package is unavailable.", 503);
  const bytes = new Uint8Array(await obj.arrayBuffer());
  const { readPackage, compareVersions } = await import("../submissions.mjs");
  const pkg = await readPackage(bytes);
  if (
    !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(
      data.new_version ?? "",
    ) ||
    compareVersions(data.new_version, row.version) <= 0
  )
    fail("Choose a stable version higher than the published version.");
  if (
    !eligibility(
      me,
      { ...pkg.manifest, version: data.new_version },
      pkg.manifest,
      new Map(),
    ).may
  )
    fail("Only a published author may propose a new version.", 403);
  const manifest = structuredClone(pkg.manifest);
  manifest.version = data.new_version;
  manifest.name = { ...manifest.name, en: text(data.name, 120, true) };
  manifest.line = { ...manifest.line, en: text(data.line, 300, true) };
  if (data.tags !== undefined) {
    if (
      !Array.isArray(data.tags) ||
      data.tags.length > 20 ||
      new Set(data.tags).size !== data.tags.length ||
      data.tags.some(
        (t) =>
          typeof t !== "string" ||
          !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(t) ||
          t.length > 40,
      )
    )
      fail("Use up to 20 unique lowercase tags.");
    manifest.tags = data.tags;
  }
  const doc = text(data.document, 60000, true);
  const files = pkg.files.map((f) =>
    f.path === "motion.json"
      ? {
          ...f,
          data: new TextEncoder().encode(
            JSON.stringify(manifest, null, 2) + "\n",
          ),
        }
      : f.path === "MOTION.md"
        ? { ...f, data: new TextEncoder().encode(doc + "\n") }
        : f,
  );
  const { bytes: archive, digest } = await proposalArchive(data.id, files);
  if (archive.length > 1024 * 1024)
    fail("Proposal package exceeds the submission size limit.");
  const jobId = `proposal-${digest}`;
  return recordedJob(
    env,
    actor,
    "motion-proposal",
    { id: data.id, version: data.new_version, digest },
    reason,
    async () => {
      await env.PACKAGES.put(`admin/proposals/${jobId}.tgz`, archive);
      const result = await commitSubmission(env, {
        id: data.id,
        manifest,
        published: true,
        files,
        me,
        accounts: new Map(),
        submission: jobId,
        sha256: digest,
      });
      return {
        pr: result.pr,
        url: result.url,
        status: "pull_request_opened",
        sha256: digest,
      };
    },
    jobId,
  );
}
async function read(request, env, actor, resource, url) {
  const id = url.searchParams.get("id");
  if (resource === "me")
    return {
      actor,
      permissions: [
        "read",
        "moderate",
        "preview",
        "proposal",
        "collections",
        "people",
        "roles",
        "settings",
        "jobs",
      ].filter((p) => can(actor, p)),
    };
  if (resource === "dashboard") {
    const count = async (table) =>
      (await env.DB.prepare(`SELECT count(*) AS n FROM ${table}`).first()).n;
    const rows = await catalogue(request, env),
      hidden = await hiddenMotions(env);
    const counts = {
      motions: rows.length,
      visible: rows.filter((r) => !hidden.has(r.slug)).length,
      artifacts: await count("artifacts"),
      people: await count("people"),
      submissions: await count("submissions"),
    };
    counts.pending = (
      await env.DB.prepare(
        "SELECT count(*) AS n FROM submissions s LEFT JOIN admin_states a ON a.entity='submission' AND a.id=s.id WHERE s.status='submitted' AND (a.status IS NULL OR a.status IN ('pending','changes_requested'))",
      ).first()
    ).n;
    let activity = [],
      analytics_error = null;
    if (env.ANALYTICS_SQL)
      try {
        const days = url.searchParams.get("days") === "7" ? 7 : 30;
        activity = (
          await env.ANALYTICS_SQL.query({
            query: `SELECT toDate(timestamp) AS day, blob1 AS kind, COUNT(*) AS total FROM events.analyticsEngine.motionhub_events WHERE timestamp >= $from GROUP BY day, kind ORDER BY day`,
            params: {
              from: new Date(Date.now() - days * 86400000).toISOString(),
            },
          })
        ).data;
      } catch {
        analytics_error =
          "Analytics is unavailable; inventory counts remain current.";
      }
    else analytics_error = "Analytics binding is not configured.";
    return {
      counts,
      activity,
      analytics_error,
      recent: await all(
        env,
        "SELECT * FROM admin_audit ORDER BY created_at DESC,id DESC LIMIT 8",
      ),
      failures: await all(
        env,
        "SELECT * FROM admin_jobs WHERE status IN ('needs_review','failed') ORDER BY created_at DESC LIMIT 8",
      ),
    };
  }
  if (resource === "motions") {
    const rows = await attach(env, await catalogue(request, env), "motion");
    if (id) {
      const row = rows.find((r) => r.slug === id);
      if (!row) fail("Motion not found.", 404);
      const get = async (file) => {
        const r = await env.ASSETS.fetch(
          new Request(
            new URL(`/m/${id.replace("@", "%40")}/${file}`, request.url),
          ),
        );
        return r.ok ? r.text() : "";
      };
      return {
        row,
        manifest: await get("motion.json"),
        document: await get("MOTION.md"),
        credits: await get("CREDITS.md"),
        tokens: await get("tokens.json"),
      };
    }
    return pageRows(rows, url);
  }
  if (resource === "submissions") {
    if (id) {
      const row = await env.DB.prepare(
        `SELECT ${safeSubmission} FROM submissions s LEFT JOIN people p ON p.id=s.person WHERE s.id=?`,
      )
        .bind(id)
        .first();
      if (!row) fail("Submission not found.", 404);
      let pkg,
        package_error = null;
      try {
        pkg = await loadPackage(env, row);
      } catch {
        package_error = "Stored package could not be validated.";
      }
      return {
        row: (await attach(env, [row], "submission"))[0],
        manifest: pkg?.manifest,
        files: pkg?.files.map((f) => ({ path: f.path, bytes: f.data.length })),
        document: pkg
          ? new TextDecoder().decode(
              pkg.files.find((f) => f.path === "MOTION.md")?.data ??
                new Uint8Array(),
            )
          : "",
        package_error:
          package_error ??
          (!pkg
            ? "Package expired or unavailable. Review the linked PR."
            : null),
      };
    }
    const rows = await all(
      env,
      `SELECT ${safeSubmission} FROM submissions s LEFT JOIN people p ON p.id=s.person ORDER BY s.created_at DESC LIMIT 2000`,
    );
    return {
      ...pageRows(await attach(env, rows, "submission"), url),
      bounded: rows.length === 2000,
    };
  }
  if (resource === "artifacts") {
    const rows = await all(
      env,
      `SELECT a.*,p.login,(SELECT count(*) FROM artifact_versions v WHERE v.artifact=a.id) AS versions FROM artifacts a LEFT JOIN people p ON p.id=a.person ${id ? "WHERE a.id=?" : ""} ORDER BY a.updated_at DESC LIMIT 2000`,
      ...(id ? [id] : []),
    );
    const decorated = await attach(env, rows, "artifact");
    if (id) {
      if (!rows.length) fail("Artifact not found.", 404);
      return {
        row: decorated[0],
        versions: await all(
          env,
          "SELECT id,created_at,ready FROM artifact_versions WHERE artifact=? ORDER BY created_at DESC",
          id,
        ),
        shares: await all(
          env,
          "SELECT count(*) AS count FROM artifact_shares WHERE version IN (SELECT id FROM artifact_versions WHERE artifact=?) AND expires_at>?",
          id,
          now(),
        ),
      };
    }
    return { ...pageRows(decorated, url), bounded: rows.length === 2000 };
  }
  if (resource === "people") {
    const rows = await all(
      env,
      `SELECT p.*,(SELECT count(*) FROM artifacts a WHERE a.person=p.id) AS artifacts,(SELECT count(*) FROM submissions s WHERE s.person=p.id) AS submissions FROM people p ${id ? "WHERE p.id=?" : ""} ORDER BY p.seen_at DESC LIMIT 2000`,
      ...(id ? [id] : []),
    );
    const decorated = await attach(env, rows, "person");
    if (id) {
      if (!rows.length) fail("Person not found.", 404);
      return {
        row: decorated[0],
        artifacts: await all(
          env,
          "SELECT id,title,public_version FROM artifacts WHERE person=?",
          id,
        ),
        submissions: await all(
          env,
          "SELECT id,motion,status,pr FROM submissions WHERE person=?",
          id,
        ),
      };
    }
    return { ...pageRows(decorated, url), bounded: rows.length === 2000 };
  }
  if (resource === "collections") {
    if (id)
      return {
        row: await env.DB.prepare(
          "SELECT * FROM admin_collections WHERE slug=?",
        )
          .bind(id)
          .first(),
      };
    return pageRows(
      await all(env, "SELECT * FROM admin_collections ORDER BY position,slug"),
      url,
    );
  }
  if (resource === "audit") {
    const rows = await all(
      env,
      "SELECT * FROM admin_audit ORDER BY created_at DESC,id DESC LIMIT 2000",
    );
    return { ...pageRows(rows, url), bounded: rows.length === 2000 };
  }
  if (resource === "jobs") {
    let workflows = [],
      github_error = null;
    try {
      workflows = (
        await github(env, "/actions/runs?per_page=30")
      ).workflow_runs.map((r) => ({
        id: r.id,
        name: r.name,
        status: r.status,
        conclusion: r.conclusion,
        url: r.html_url,
        path: r.path,
        updated_at: r.updated_at,
        attempt: r.run_attempt,
      }));
    } catch (error) {
      github_error = error.message;
    }
    return {
      rows: await all(
        env,
        "SELECT * FROM admin_jobs ORDER BY created_at DESC LIMIT 100",
      ),
      workflows,
      github_error,
      retry_enabled: Boolean(env.ADMIN_GITHUB_TOKEN),
    };
  }
  if (resource === "settings") {
    need(actor, "settings");
    return {
      states: await all(
        env,
        "SELECT * FROM admin_states WHERE entity IN ('setting','quota')",
      ),
      roles: await all(env, "SELECT * FROM admin_roles ORDER BY email"),
      bootstrap: bootstrapEmails(env),
      capabilities: {
        database: Boolean(env.DB),
        packages: Boolean(env.PACKAGES),
        artifacts: Boolean(env.ARTIFACTS),
        github_app: Boolean(env.GITHUB_APP_ID && env.GITHUB_APP_PRIVATE_KEY),
        workflow_retry: Boolean(env.ADMIN_GITHUB_TOKEN),
        access: Boolean(env.ACCESS_TEAM_DOMAIN && env.ACCESS_AUD),
        submissions: env.SUBMISSIONS !== "off",
        artifact_origin: env.ARTIFACT_CONTENT_ORIGIN ?? null,
      },
      limits: await quotas(env),
      quota_maxima: quotaDefaults,
    };
  }
  fail("Not found.", 404);
}
export async function api(request, env, actor, resource) {
  try {
    if (request.method === "GET")
      return json(
        await read(request, env, actor, resource, new URL(request.url)),
      );
    if (request.method !== "POST")
      return json({ error: "Method not allowed." }, 405);
    if (!sameOrigin(request))
      return json({ error: "Same-origin request required." }, 403);
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      fail("JSON required.", 415);
    let data;
    try {
      data = JSON.parse(
        new TextDecoder().decode(await limitedBytes(request.body, 100000)),
      );
    } catch {
      fail("Invalid or oversized JSON.");
    }
    if (!data || typeof data !== "object" || Array.isArray(data))
      fail("JSON object required.");
    const handlers = {
      state: async () => {
        if (
          data.entity === "motion" &&
          !(await catalogue(request, env)).some((r) => r.slug === data.id)
        )
          fail("Motion not found.", 404);
        return editState(env, actor, data);
      },
      collections: () => collection(request, env, actor, data),
      roles: () => role(env, actor, data),
      "revoke-sessions": () => revoke(env, actor, data),
      "revoke-links": () => revokeShares(env, actor, data),
      preview: () => preview(env, actor, data),
      retry: () => retry(env, actor, data),
      proposal: () => proposal(request, env, actor, data),
    };
    if (!handlers[resource]) fail("Not found.", 404);
    return json(await handlers[resource]());
  } catch (error) {
    if (!error.status) console.error("admin operation failed", error?.name);
    return json(
      {
        error: error.status
          ? error.message
          : "Operation unavailable. Check database migrations and service bindings.",
      },
      error.status ?? 503,
    );
  }
}
