// motionhub.dev's Worker. The pages and files come from the static build (dist/); packages come from the R2 bucket,
// where every version ever published stays (HUB.md), since the build only holds the newest ones.
export default {
  async fetch(request, env) {
    const {pathname} = new URL(request.url);
    // /m/<id>/<version>.tgz, the id being <slug> or @<scope>/<slug>
    const m = /^\/m\/((?:@[a-z0-9-]+\/)?[a-z0-9-]+)\/([0-9A-Za-z.+-]+)\.tgz$/.exec(pathname);
    if (!m) return env.ASSETS.fetch(request);
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', {status: 405, headers: {allow: 'GET, HEAD'}});
    const object = await env.PACKAGES.get(pathname.slice(1));
    if (!object) {
      const page = await env.ASSETS.fetch(new Request(new URL('/404.html', request.url)));
      return new Response(page.body, {status: 404, headers: page.headers});
    }
    const headers = new Headers({
      'content-type': 'application/gzip',
      'content-disposition': `attachment; filename="${m[1].replace('@', '').replace('/', '-')}-${m[2]}.tgz"`,
      'cache-control': 'public, max-age=31536000, immutable',
      'access-control-allow-origin': '*',
      etag: object.httpEtag,
    });
    return new Response(request.method === 'HEAD' ? null : object.body, {headers});
  },
};
