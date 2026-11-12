// The page a private motion's reel is previewed in (player/preview.js, /play/_preview/): framed by motionhub.dev, which
// sends it a reel's script built in the browser, it plays it as every reel plays, in a sandbox with no origin, cookie,
// storage, network or pop-up; it takes a script only from the page that framed it, once; and no other site may frame it.
// A published reel's own script and tokens stand in for one built in the browser: the same plugin makes both
// (player/reel-plugin.mjs).
//
//   node player/preview-test.mjs   after player/build.mjs (npm run smoke runs it)
import assert from 'node:assert/strict';
import {existsSync, readFileSync, readdirSync, statSync} from 'node:fs';
import {extname, join, resolve, sep} from 'node:path';
import {DIST, PLAY, blank, headersFor, launch, look, reels} from './chrome.mjs';

const SITE = 'https://motionhub.dev', PLAYER = 'https://player.motionhub.dev';
const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2'};

/** A published reel as the site would send it: its script, its tokens' custom properties (no faces: they are files), heavy or not. */
function payload(id) {
  const dir = join(PLAY, id);
  const script = readdirSync(dir).find((f) => /^reel-[0-9a-f]{12}\.js$/.test(f));
  const html = readFileSync(join(dir, 'index.html'), 'utf8');
  const css = readFileSync(join(dir, 'reel.css'), 'utf8').replace(/@font-face\s*\{[^}]*\}\s*/g, '');
  return {motionhubPreview: 1, js: readFileSync(join(dir, script), 'utf8'), css, heavy: html.includes('data-heavy="1"')};
}

/**
 * The framing page: it frames the preview and, when the preview says it is ready, sends it `message`. With `stray`, it
 * sends nothing itself: a second frame of its own sends the same message, which the preview must ignore.
 */
function parent(message, {stray = false} = {}) {
  const json = JSON.stringify(message).replace(/</g, '\\u003c');
  // the second frame's own page, given as srcdoc: its script closes there; written into this page's script, `</` is escaped
  const strayFrame = `<script>parent.frames[0].postMessage(${json}, '*');</script>`;
  return `<!doctype html><body style="margin:0">
<iframe id="pv" sandbox="allow-scripts" src="${PLAYER}/play/_preview/?autoplay=1" style="border:0;width:960px;height:540px"></iframe>
<script>
addEventListener('message', (e) => {
  if (e.source !== document.getElementById('pv').contentWindow || e.data?.motionhubPreview !== 'ready') return;
  ${stray
    ? `const other = document.createElement('iframe'); other.sandbox = 'allow-scripts'; other.srcdoc = ${JSON.stringify(strayFrame).replace(/<\//g, '<\\/')}; document.body.append(other);`
    : `e.source.postMessage(${json}, '*');`}
});
</script>`;
}

const browser = await launch();
let failed = 0;
try {
  const context = await browser.newContext({viewport: {width: 960, height: 540}});
  await context.addCookies([{name: 'securityProbe', value: 'private', url: PLAYER}]);
  let page = '';
  await context.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.origin === SITE) return route.fulfill({contentType: 'text/html; charset=utf-8', body: page});
    if (url.origin === 'https://elsewhere.example') return route.fulfill({contentType: 'text/html; charset=utf-8', body: `<iframe id="pv" src="${PLAYER}/play/_preview/"></iframe>`});
    if (url.origin !== PLAYER) return route.abort();
    let path = decodeURIComponent(url.pathname);
    if (path.endsWith('/')) path += 'index.html';
    const file = resolve(DIST, '.' + path);
    if (!file.startsWith(DIST + sep) || !existsSync(file) || !statSync(file).isFile()) return route.fulfill({status: 404, body: ''});
    return route.fulfill({body: readFileSync(file), headers: {'content-type': TYPES[extname(file)] ?? 'application/octet-stream', ...headersFor(path)}});
  });

  // a reel in 2D and one in 3D, each drawn: the first frame that is not blank within its first seconds
  const all = reels().map((id) => ({id, ...payload(id)}));
  for (const sample of [all.find((r) => !r.heavy), all.find((r) => r.heavy)].filter(Boolean)) {
    const tab = await context.newPage();
    const problems = [];
    tab.on('pageerror', (e) => problems.push(String(e)));
    tab.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
    page = parent(sample);
    await tab.goto(SITE, {waitUntil: 'load'});
    const frame = tab.frameLocator('#pv');
    await frame.locator('.scrub').waitFor({timeout: 60_000});
    let drew = false;
    for (let i = 0; i < 20 && !drew; i++) {
      await tab.waitForTimeout(500);
      drew = !blank(await look(await tab.locator('#pv').screenshot()));
    }
    if (!drew || problems.length) { failed++; console.log(`${sample.id} (${sample.heavy ? '3D' : '2D'})  FAILED: ${drew ? problems.join('; ') : 'draws nothing'}`); }
    else console.log(`${sample.id} (${sample.heavy ? '3D' : '2D'})  plays in the preview`);
    // inside the preview: no cookie, storage, network or pop-up, as on every reel's page
    const denied = await tab.frames().find((f) => f.url().startsWith(PLAYER)).evaluate(async () => {
      const refused = (fn) => { try { fn(); return false; } catch (e) { return e.name === 'SecurityError'; } };
      let network = false;
      try { await fetch('/play/_preview/'); } catch { network = true; }
      return {cookie: refused(() => document.cookie), storage: refused(() => localStorage.getItem('x')), network, popup: window.open('/') === null};
    });
    assert.deepEqual(denied, {cookie: true, storage: true, network: true, popup: true}, `${sample.id}: the preview reached past its sandbox`);
    await tab.close();
  }

  // a script from anything but the framing page is ignored: the reel never mounts
  const tab = await context.newPage();
  page = parent(all[0], {stray: true});
  await tab.goto(SITE, {waitUntil: 'load'});
  await tab.waitForTimeout(3000);
  assert.equal(await tab.frameLocator('#pv').locator('.scrub').count(), 0, 'a script from another frame was run');
  console.log('a script from another frame than the one that framed it is ignored');

  // only motionhub.dev (and the player's own origin) may frame it
  const other = await context.newPage();
  const blocked = [];
  other.on('console', (m) => { if (/frame-ancestors|Refused to frame/i.test(m.text())) blocked.push(m.text()); });
  await other.goto('https://elsewhere.example/', {waitUntil: 'load'});
  await other.waitForTimeout(1500);
  assert.ok(blocked.length > 0, 'another site framed the preview');
  console.log('another site may not frame it');
} catch (e) {
  failed++;
  console.error(e.message);
} finally {
  await browser.close();
}
if (failed) process.exitCode = 1;
