// Cloudflare Access identity is independent of the public GitHub session.
const sets = new Map();
const decode = (s) =>
  Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) =>
    c.charCodeAt(0),
  );
export const localAdmin = (request, env) =>
  env.ENVIRONMENT === "local" &&
  ["localhost", "127.0.0.1", "[::1]"].includes(new URL(request.url).hostname);
export const bootstrapEmails = (env) =>
  String(env.ADMIN_BOOTSTRAP_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
export async function verifyAccess(token, env, fetcher = fetch) {
  if (
    !/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(env.ACCESS_TEAM_DOMAIN ?? "") ||
    !env.ACCESS_AUD ||
    !token ||
    token.length > 16384
  )
    return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const header = JSON.parse(new TextDecoder().decode(decode(parts[0])));
    if (header.alg !== "RS256" || typeof header.kid !== "string") return null;
    const issuer = `https://${env.ACCESS_TEAM_DOMAIN}`;
    let cached = sets.get(issuer);
    if (!cached || cached.until < Date.now()) {
      const response = await fetcher(`${issuer}/cdn-cgi/access/certs`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) return null;
      const body = await response.json();
      if (!Array.isArray(body.keys)) return null;
      cached = { keys: body.keys, until: Date.now() + 300000 };
      sets.set(issuer, cached);
    }
    const jwk = cached.keys.find(
      (key) =>
        key.kid === header.kid &&
        key.kty === "RSA" &&
        (!key.alg || key.alg === "RS256"),
    );
    if (!jwk) {
      sets.delete(issuer);
      return null;
    }
    const key = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    if (
      !(await crypto.subtle.verify(
        "RSASSA-PKCS1-v1_5",
        key,
        decode(parts[2]),
        new TextEncoder().encode(parts.slice(0, 2).join(".")),
      ))
    )
      return null;
    const p = JSON.parse(new TextDecoder().decode(decode(parts[1]))),
      at = Math.floor(Date.now() / 1000);
    const aud = Array.isArray(p.aud) ? p.aud : [p.aud];
    if (
      p.iss !== issuer ||
      !aud.includes(env.ACCESS_AUD) ||
      !Number.isFinite(p.exp) ||
      p.exp <= at ||
      (p.nbf !== undefined && (!Number.isFinite(p.nbf) || p.nbf > at)) ||
      !Number.isFinite(p.iat) ||
      p.iat > at + 30 ||
      typeof p.email !== "string" ||
      !p.email.includes("@")
    )
      return null;
    return p.email.toLowerCase();
  } catch {
    return null;
  }
}
export async function adminIdentity(request, env) {
  if (localAdmin(request, env))
    return { email: "local-editor", role: "superadmin", local: true };
  const email = await verifyAccess(
    request.headers.get("cf-access-jwt-assertion"),
    env,
  );
  if (!email) return null;
  // Bootstrap access is configured out of band and cannot be removed by a UI edit.
  if (bootstrapEmails(env).includes(email))
    return { email, role: "superadmin" };
  const row = await env.DB.prepare(
    "SELECT role FROM admin_roles WHERE email = ?",
  )
    .bind(email)
    .first();
  return row ? { email, role: row.role } : null;
}
const permissions = {
  viewer: ["read"],
  reviewer: ["read", "moderate", "preview", "proposal"],
  operator: ["read", "collections", "proposal"],
  superadmin: [
    "read",
    "moderate",
    "preview",
    "proposal",
    "collections",
    "people",
    "roles",
    "settings",
    "jobs",
  ],
};
export const can = (actor, permission) =>
  Boolean(permissions[actor?.role]?.includes(permission));
