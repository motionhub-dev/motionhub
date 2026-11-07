// The pages the Worker writes itself (Artifacts, signing the command line in) in the site's own layout: the header,
// footer, theme and fonts of every other page. The layout is the built page /app-shell/ (src/pages/app-shell.astro),
// read from the static assets; its placeholders take the page's title, description, address, head and body. Its one
// inline script (the theme, before the first paint) is allowed by its hash, so the policy needs no 'unsafe-inline'
// for scripts.

const SHELL = '/app-shell/';
export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));

async function sha256Base64(text) {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
  return btoa(String.fromCharCode(...digest));
}

// without the built layout (tests, or a build that lost it) the page still renders, plainly
const plain = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>%%MH_TITLE%%</title><meta name="description" content="%%MH_DESCRIPTION%%"><!--mh:head--></head><body><main><!--mh:body--></main></body></html>`;

async function layout(request, env) {
  try {
    const response = await env.ASSETS?.fetch(new Request(new URL(SHELL, request.url)));
    if (response?.ok) return await response.text();
  } catch {}
  return plain;
}

/**
 * A page in the site's layout. `body` and `head` are HTML the caller has escaped; `title`, `description` and `path`
 * are text. `frame` is the origin a page may frame, `headers` more response headers.
 */
export async function shellPage(request, env, {title, description = '', path = '', body, head = '', status = 200, frame = "'none'", headers = {}}) {
  const template = await layout(request, env);
  const html = template
    .replaceAll('%%MH_TITLE%%', escapeHtml(title))
    .replaceAll('%%MH_DESCRIPTION%%', escapeHtml(description))
    .replaceAll('/%%MH_PATH%%', escapeHtml(path || new URL(request.url).pathname))
    .replace('<!--mh:head-->', () => head)
    .replace('<!--mh:body-->', () => body);
  const inline = [...template.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
  const hashes = (await Promise.all(inline.map(sha256Base64))).map((hash) => ` 'sha256-${hash}'`).join('');
  return new Response(html, {status, headers: {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'private, no-store',
    'x-content-type-options': 'nosniff',
    // same-origin, not no-referrer: these pages' forms are checked by their Origin, which a browser sends as null
    // from a no-referrer page
    'referrer-policy': 'same-origin',
    'content-security-policy': `default-src 'none'; script-src 'self'${hashes}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; manifest-src 'self'; frame-src ${frame}; frame-ancestors 'none'; base-uri 'none'; form-action 'self'`,
    ...headers,
  }});
}
