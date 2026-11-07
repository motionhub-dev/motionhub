// The pages the Worker writes (site/shell.mjs) take the site's built layout: its placeholders filled, the text
// escaped, and its inline script allowed by its hash and nothing else.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {shellPage} from '../site/shell.mjs';

const layout = `<!doctype html><html><head><script>document.documentElement.classList.remove('no-js');</script>
<title>%%MH_TITLE%%</title><meta name="description" content="%%MH_DESCRIPTION%%"><link rel="canonical" href="https://motionhub.dev/%%MH_PATH%%"><!--mh:head--></head>
<body><header>site</header><main><!--mh:body--></main><script type="module" src="/_astro/base.js"></script></body></html>`;
const assets = (html) => ({fetch: async (request) => new URL(request.url).pathname === '/app-shell/' ? new Response(html) : new Response('', {status: 404})});
const request = new Request('https://motionhub.dev/artifacts/');

test('a page fills the layout, escapes its text and allows only the layout\'s inline script', async () => {
  const response = await shellPage(request, {ASSETS: assets(layout)}, {
    title: 'A <b> & "c"', description: 'd', path: '/works/x', body: '<p>$& $1 body</p>', head: '<meta name="robots" content="noindex">', frame: 'https://artifacts.motionhub.dev',
  });
  const html = await response.text();
  assert.match(html, /<title>A &lt;b&gt; &amp; &quot;c&quot;<\/title>/);
  assert.match(html, /<header>site<\/header><main><p>\$& \$1 body<\/p><\/main>/);
  assert.match(html, /href="https:\/\/motionhub\.dev\/works\/x"/);
  assert.match(html, /<meta name="robots" content="noindex"><\/head>/);
  const policy = response.headers.get('content-security-policy');
  const hash = createHash('sha256').update("document.documentElement.classList.remove('no-js');").digest('base64');
  assert.match(policy, new RegExp(`script-src 'self' 'sha256-${hash.replace(/[+/]/g, '\\$&')}';`));
  assert.doesNotMatch(policy, /script-src[^;]*unsafe-inline/);
  assert.match(policy, /frame-src https:\/\/artifacts\.motionhub\.dev;/);
  assert.equal(response.headers.get('referrer-policy'), 'same-origin');
});

test('without the built layout a page still renders, plainly', async () => {
  const html = await (await shellPage(request, {}, {title: 'T', body: '<p>b</p>'})).text();
  assert.match(html, /<title>T<\/title>/);
  assert.match(html, /<main><p>b<\/p><\/main>/);
});

test('the built layout has every placeholder', {skip: !existsSync(new URL('../dist/app-shell/index.html', import.meta.url))}, () => {
  const html = readFileSync(new URL('../dist/app-shell/index.html', import.meta.url), 'utf8');
  for (const mark of ['%%MH_TITLE%%', '%%MH_DESCRIPTION%%', '/%%MH_PATH%%', '<!--mh:head-->', '<!--mh:body-->']) assert.ok(html.includes(mark), mark);
});

test('the layout is not a page of its own', async () => {
  const {default: worker} = await import('../site/worker.mjs');
  const env = {ASSETS: {fetch: async (r) => new URL(r.url).pathname === '/404.html' ? new Response('missing', {status: 404}) : new Response(layout)}};
  for (const path of ['/app-shell/', '/app-shell', '/app-shell/index.html']) assert.equal((await worker.fetch(new Request('https://motionhub.dev' + path), env, {})).status, 404, path);
});
