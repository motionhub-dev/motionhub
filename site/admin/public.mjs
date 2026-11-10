import { enabled, hiddenMotions, filterCatalogue, blocked } from "./policy.mjs";
import { escapeHtml as e } from "../shell.mjs";
const headers = {
  "cache-control": "private, no-store",
  "x-content-type-options": "nosniff",
};
// a motion's page is at its id, /@<scope>/<slug>/, and its files and reel under /m/<id>/ and /play/<id>/ (site/worker.mjs)
const MOTION_PATH = /^\/(?:(?:m|play)\/)?(@[a-z0-9-]+\/[a-z0-9-]+)(?:\/|$)/;
const FILTERED_JSON = ["/api/motions.json", "/api/catalogs.json", "/api/stats.json"];
const INDEXES = ["/llms.txt", "/sitemap.xml"];
/** A path the static build answers with a page: a directory or an .html file (a 304 carries no content type). */
const pagePath = (path) => path.endsWith("/") || path.endsWith(".html") || !/\.[A-Za-z0-9]+$/.test(path);
/** Whether a line of llms.txt or sitemap.xml names a motion by its id: the id whole, never as the start of a longer one. */
export function namesMotion(line, id) {
  for (const spelling of [id, id.replace("@", "%40")]) {
    for (let at = line.indexOf(spelling); at >= 0; at = line.indexOf(spelling, at + 1)) {
      if (!/[a-z0-9-]/.test(line[at + spelling.length] ?? "")) return true;
    }
  }
  return false;
}
export async function publicCollections(env, hidden) {
  const { results } = await env.DB.prepare(
    "SELECT slug,title,description,items_json,position FROM admin_collections WHERE status='published' ORDER BY position,slug",
  ).all();
  return results
    .map(({ items_json, ...row }) => ({
      ...row,
      motions: JSON.parse(items_json).filter((id) => !hidden.has(id)),
    }))
    .filter((row) => row.motions.length);
}
export async function publicGate(request, env) {
  if (!enabled(env)) return null;
  const url = new URL(request.url);
  let path;
  try {
    path = decodeURIComponent(url.pathname);
  } catch {
    return new Response("Invalid path", { status: 400, headers });
  }
  const match = MOTION_PATH.exec(path);
  if (match && (await blocked(env, "motion", match[1])))
    return new Response("Not found", { status: 404, headers });
  if (path === "/api/collections.json")
    return Response.json(
      { collections: await publicCollections(env, await hiddenMotions(env)) },
      { headers },
    );
  return null;
}
/**
 * Takes hidden motions out of the public pages and indexes and adds the published collections to the home page.
 * When there is nothing to take out or add, the response is passed on as it is, with its own caching and validators.
 * `refetch` asks again without the request's validators: a 304 for a copy served before a motion was hidden (a
 * rewritten response is never stored and carries no validator) is answered with the filtered response instead.
 */
export async function publicResponse(request, env, response, refetch) {
  if (!enabled(env) || !["GET", "HEAD"].includes(request.method))
    return response;
  const notModified = response.status === 304;
  if (!response.ok && !notModified) return response;
  const url = new URL(request.url);
  const isJSON = FILTERED_JSON.includes(url.pathname);
  const isIndex = INDEXES.includes(url.pathname);
  const isHTML =
    !isJSON &&
    !isIndex &&
    (notModified
      ? pagePath(url.pathname)
      : (response.headers.get("content-type") ?? "").includes("text/html"));
  if (!isJSON && !isHTML && !isIndex) return response;
  const hidden = await hiddenMotions(env);
  const collections =
    isHTML && url.pathname === "/" ? await publicCollections(env, hidden) : [];
  if (!hidden.size && !collections.length) return response;
  if (notModified) {
    if (!refetch) return response;
    response = await refetch();
    if (!response.ok) return response;
    if (isHTML && !(response.headers.get("content-type") ?? "").includes("text/html"))
      return response;
  }
  const h = new Headers(response.headers);
  h.set("cache-control", "private, no-store");
  h.delete("etag");
  h.delete("last-modified");
  h.delete("content-length");
  if (request.method === "HEAD")
    return new Response(null, { status: response.status, headers: h });
  if (isJSON) {
    let data = await response.json();
    if (url.pathname === "/api/catalogs.json")
      data = {
        ...data,
        catalogs: data.catalogs.map((c) => ({
          ...c,
          motions: c.motions.filter((id) => !hidden.has(id)),
        })),
      };
    else data = filterCatalogue(data, hidden);
    return Response.json(data, { headers: h });
  }
  if (isIndex) {
    const text = await response.text();
    return new Response(
      text
        .split("\n")
        .filter(
          (line) =>
            ![...hidden].some((id) => namesMotion(line, id)),
        )
        .join("\n"),
      { headers: h },
    );
  }
  // Explicit HTML elements carry the IDs used by the static gallery's client search.
  // Rewrite on the server, including the embedded search index, before any public JS runs.
  const out = new HTMLRewriter();
  if (hidden.size) {
    out.on("[data-id]", {
      element(el) {
        if (hidden.has(el.getAttribute("data-id"))) el.remove();
      },
    });
    out.on("a[href],img[src]", {
      element(el) {
        const value = el.getAttribute("href") ?? el.getAttribute("src");
        let path;
        try {
          path = decodeURIComponent(new URL(value, url).pathname);
        } catch {
          return;
        }
        const match = MOTION_PATH.exec(path);
        if (match && hidden.has(match[1])) el.remove();
      },
    });
    let buffer = "";
    out.on("script#motionindex", {
      text(chunk) {
        buffer += chunk.text;
        chunk.remove();
        if (chunk.lastInTextNode) {
          let rows;
          try {
            rows = JSON.parse(buffer);
          } catch {
            return;
          }
          chunk.after(
            JSON.stringify(rows.filter((r) => !hidden.has(r.id))).replace(
              /</g,
              "\\u003c",
            ),
            { html: true },
          );
          buffer = "";
        }
      },
    });
  }
  if (collections.length)
    out.on("main", {
        element(el) {
          el.prepend(
            `<section class="shelf"><div class="lead"><h2>Curated collections</h2></div>${collections.map((c) => `<section><h3>${e(c.title)}</h3><p>${e(c.description)}</p><ul>${c.motions.map((id) => `<li><a href="/${e(id)}/">${e(id)}</a></li>`).join("")}</ul></section>`).join("")}</section>`,
            { html: true },
          );
        },
      });
  return out.transform(new Response(response.body, { headers: h }));
}
