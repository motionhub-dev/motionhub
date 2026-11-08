import { enabled, hiddenMotions, filterCatalogue, blocked } from "./policy.mjs";
import { escapeHtml as e } from "../shell.mjs";
const headers = {
  "cache-control": "private, no-store",
  "x-content-type-options": "nosniff",
};
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
  const match = /^\/(?:m|play)\/(@[a-z0-9-]+\/[a-z0-9-]+)(?:\/|$)/.exec(path);
  if (match && (await blocked(env, "motion", match[1])))
    return new Response("Not found", { status: 404, headers });
  if (path === "/api/collections.json")
    return Response.json(
      { collections: await publicCollections(env, await hiddenMotions(env)) },
      { headers },
    );
  return null;
}
export async function publicResponse(request, env, response) {
  if (
    !enabled(env) ||
    !response.ok ||
    !["GET", "HEAD"].includes(request.method)
  )
    return response;
  const url = new URL(request.url),
    type = response.headers.get("content-type") ?? "";
  const isJSON = [
    "/api/motions.json",
    "/api/catalogs.json",
    "/api/stats.json",
  ].includes(url.pathname);
  const isHTML = type.includes("text/html");
  const isIndex = ["/llms.txt", "/sitemap.xml"].includes(url.pathname);
  if (!isJSON && !isHTML && !isIndex) return response;
  const hidden = await hiddenMotions(env);
  const h = new Headers(response.headers);
  h.set("cache-control", "private, no-store");
  h.delete("etag");
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
            ![...hidden].some(
              (id) =>
                line.includes(id) || line.includes(id.replace("@", "%40")),
            ),
        )
        .join("\n"),
      { headers: h },
    );
  }
  if (!hidden.size && url.pathname !== "/")
    return new Response(response.body, { headers: h });
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
        const match = /^\/(?:m|play)\/(@[^/]+\/[^/]+)(?:\/|$)/.exec(path);
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
  if (url.pathname === "/") {
    const collections = await publicCollections(env, hidden);
    if (collections.length)
      out.on("main", {
        element(el) {
          el.prepend(
            `<section class="shelf"><div class="lead"><h2>Curated collections</h2></div>${collections.map((c) => `<section><h3>${e(c.title)}</h3><p>${e(c.description)}</p><ul>${c.motions.map((id) => `<li><a href="/m/${e(id)}/">${e(id)}</a></li>`).join("")}</ul></section>`).join("")}</section>`,
            { html: true },
          );
        },
      });
  }
  return out.transform(new Response(response.body, { headers: h }));
}
