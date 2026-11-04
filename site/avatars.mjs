// GitHub avatars, from motionhub.dev itself: GET /avatar/<GitHub account id>?s=<size>. The Worker (worker.mjs) routes
// it here.
//
// GitHub asks browsers to check an avatar again after five minutes, from a second host, so a page with avatars waited
// on GitHub on most visits. Here an avatar is fetched once a day at most and kept at Cloudflare's edge; a browser keeps
// it a day and shows it a week longer while it checks. When GitHub cannot be reached, the last copy (kept a month) is
// served, and failing that an empty picture, so the page's own ground shows instead of a broken image.
//
// Only the avatars motionhub shows: an account recorded in accounts/ (api/accounts.json) or one that has signed in
// (D1). Sizes are a few fixed ones, so the cache holds a few copies of each.

const SIZES = [32, 56, 64, 96, 128, 160, 192, 320];
const FRESH = 86400, KEEP = 30 * 86400;
const BROWSER = `public, max-age=${FRESH}, stale-while-revalidate=${7 * 86400}`;
const EMPTY = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>';

/** The size served for one asked for: the smallest fixed size at least that large, else the largest. */
export const size = (asked) => SIZES.find((s) => s >= (Number(asked) || 0)) ?? SIZES[SIZES.length - 1];

/** Whether motionhub shows this account's avatar: it is recorded in accounts/ or has signed in. */
async function known(request, env, id) {
  const r = await env.ASSETS.fetch(new Request(new URL('/api/accounts.json', request.url))).catch(() => undefined);
  const accounts = r?.ok ? await r.json().catch(() => ({})) : {};
  if (Object.values(accounts).includes(id)) return true;
  return Boolean(env.DB && (await env.DB.prepare('SELECT 1 AS ok FROM people WHERE id = ?').bind(id).first()));
}

const picture = (body, type, cache = BROWSER) => new Response(body, {headers: {'content-type': type, 'cache-control': cache, 'x-content-type-options': 'nosniff'}});

/** GET /avatar/<id>?s=<size>. */
export async function avatar(request, env, ctx, idText) {
  if (!/^[1-9]\d{0,11}$/.test(idText)) return new Response('no such avatar', {status: 404});
  const id = Number(idText), s = size(new URL(request.url).searchParams.get('s'));
  const cache = globalThis.caches?.default;
  const fresh = new Request(new URL(`/avatar/${id}?s=${s}`, request.url)), kept = new Request(new URL(`/avatar/${id}?s=${s}&kept`, request.url));
  const hit = await cache?.match(fresh);
  if (hit) return picture(hit.body, hit.headers.get('content-type') ?? 'image/jpeg');
  if (!(await known(request, env, id))) return new Response('no such avatar', {status: 404});
  const res = await fetch(`https://avatars.githubusercontent.com/u/${id}?s=${s}&v=4`, {headers: {'user-agent': 'motionhub.dev'}}).catch(() => undefined);
  const type = res?.headers.get('content-type') ?? '';
  if (res?.ok && type.startsWith('image/')) {
    const bytes = await res.arrayBuffer();
    if (cache) {
      ctx?.waitUntil?.(cache.put(fresh, new Response(bytes, {headers: {'content-type': type, 'cache-control': `public, max-age=${FRESH}`}})));
      ctx?.waitUntil?.(cache.put(kept, new Response(bytes, {headers: {'content-type': type, 'cache-control': `public, max-age=${KEEP}`}})));
    }
    return picture(bytes, type);
  }
  // GitHub could not give it: the last copy, else nothing for a short while
  const old = await cache?.match(kept);
  if (old) return picture(old.body, old.headers.get('content-type') ?? 'image/jpeg', 'public, max-age=300');
  return picture(EMPTY, 'image/svg+xml', 'public, max-age=300');
}
