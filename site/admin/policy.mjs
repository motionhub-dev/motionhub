export const enabled = (env) => env.ADMIN_ENABLED === "on";
export async function state(env, entity, id) {
  return enabled(env) && env.DB
    ? env.DB.prepare("SELECT * FROM admin_states WHERE entity = ? AND id = ?")
        .bind(entity, String(id))
        .first()
    : null;
}
export async function blocked(env, entity, id) {
  return (await state(env, entity, id))?.status === "blocked";
}
export async function featureOff(env, id) {
  return (await state(env, "setting", id))?.status === "off";
}
export async function artifactBlocked(env, id) {
  if (!enabled(env)) return false;
  const row = await env.DB.prepare("SELECT person FROM artifacts WHERE id = ?")
    .bind(id)
    .first();
  return (
    (await blocked(env, "artifact", id)) ||
    Boolean(row && (await blocked(env, "person", row.person)))
  );
}
export async function versionBlocked(env, version) {
  if (!enabled(env)) return false;
  const row = await env.DB.prepare(
    "SELECT artifact FROM artifact_versions WHERE id = ?",
  )
    .bind(version)
    .first();
  return !row || artifactBlocked(env, row.artifact);
}
export async function hiddenMotions(env) {
  if (!enabled(env)) return new Set();
  const { results } = await env.DB.prepare(
    "SELECT id FROM admin_states WHERE entity = 'motion' AND status = 'blocked'",
  ).all();
  return new Set(results.map((row) => row.id));
}
export function filterCatalogue(value, hidden) {
  if (Array.isArray(value))
    return value.filter((row) => !hidden.has(row.slug ?? row.id));
  if (value && typeof value === "object") {
    const next = { ...value };
    if (Array.isArray(next.motions)) {
      next.motions = filterCatalogue(next.motions, hidden);
      if ("count" in next) next.count = next.motions.length;
    } else if (next.motions && typeof next.motions === "object")
      next.motions = Object.fromEntries(
        Object.entries(next.motions).filter(([id]) => !hidden.has(id)),
      );
    return next;
  }
  return value;
}

export const quotaDefaults = {
  upload_mib: 8,
  artifacts_per_account: 20,
  versions_per_artifact: 20,
};
export async function quotas(env) {
  const limits = { ...quotaDefaults };
  if (!enabled(env) || !env.DB) return limits;
  const { results } = await env.DB.prepare(
    "SELECT id,status FROM admin_states WHERE entity='quota'",
  ).all();
  for (const row of results)
    if (Object.hasOwn(limits, row.id)) {
      const n = Number(row.status);
      if (Number.isSafeInteger(n) && n >= 1 && n <= quotaDefaults[row.id])
        limits[row.id] = n;
    }
  return limits;
}
