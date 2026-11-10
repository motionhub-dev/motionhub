import { enabled } from "./policy.mjs";
import { adminIdentity } from "./auth.mjs";
import { api, json } from "./api.mjs";
import { page, styles, navigation } from "./ui.mjs";
import { client } from "./client.mjs";
const privateHeaders = {
  "cache-control": "private, no-store",
  "x-robots-tag": "noindex, nofollow",
  "x-content-type-options": "nosniff",
  "referrer-policy": "same-origin",
  "x-frame-options": "DENY",
};
export async function admin(request, env) {
  const url = new URL(request.url);
  if (!/^\/(admin|api\/admin)(\/|$)/.test(url.pathname)) return null;
  if (!enabled(env))
    return new Response("Admin console is not enabled.", {
      status: 404,
      headers: privateHeaders,
    });
  if (!env.DB)
    return new Response("Admin database is not configured.", {
      status: 503,
      headers: privateHeaders,
    });
  let actor;
  try {
    actor = await adminIdentity(request, env);
  } catch {
    return json(
      {
        error: "Apply the admin database migration before opening the console.",
      },
      503,
    );
  }
  if (!actor)
    return new Response(
      "Administrator access required. Configure Cloudflare Access and an administrator role.",
      { status: 403, headers: privateHeaders },
    );
  let response;
  if (url.pathname.startsWith("/api/admin/"))
    response = await api(
      request,
      env,
      actor,
      url.pathname.slice("/api/admin/".length),
    );
  else if (url.pathname === "/api/admin")
    response = json({ error: "Not found." }, 404);
  else if (!["GET", "HEAD"].includes(request.method))
    response = new Response("Method not allowed.", { status: 405 });
  else if (url.pathname === "/admin" || url.pathname === "/admin/")
    response = Response.redirect(new URL("/admin/dashboard", url), 302);
  else if (url.pathname === "/admin/assets/console.css")
    response = new Response(styles, {
      headers: { "content-type": "text/css; charset=utf-8" },
    });
  else if (url.pathname === "/admin/assets/console.js")
    response = new Response(client, {
      headers: { "content-type": "text/javascript; charset=utf-8" },
    });
  else {
    const section = url.pathname.split("/")[2],
      tail = url.pathname.split("/").slice(3).join("/");
    if (
      !navigation.some((g) => g[1].some((n) => n[1] === section)) ||
      (tail &&
        tail !== "detail" &&
        !(section === "collections" && tail === "new"))
    )
      response = new Response("Not found.", { status: 404 });
    else
      response = new Response(page(actor, section, url.origin), {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "content-security-policy": `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src ${validContentOrigin(env, url.origin)}; base-uri 'none'; form-action 'self'; frame-ancestors 'none'`,
        },
      });
  }
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(privateHeaders))
    headers.set(key, value);
  return new Response(request.method === "HEAD" ? null : response.body, {
    status: response.status,
    headers,
  });
}
function validContentOrigin(env, site) {
  try {
    const u = new URL(env.ARTIFACT_CONTENT_ORIGIN);
    return u.protocol === "https:" && u.origin !== site ? u.origin : "'none'";
  } catch {
    return "'none'";
  }
}

export async function sweepAdmin(env) {
  if (enabled(env) && env.DB)
    await env.DB.prepare(
      "DELETE FROM admin_review_grants WHERE expires_at <= ?",
    )
      .bind(Math.floor(Date.now() / 1000))
      .run();
}
