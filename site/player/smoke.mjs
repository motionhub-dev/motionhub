#!/usr/bin/env node
// A smoke test of every reel's player, as a viewer gets it: after player/build.mjs, each /play/<id>/ is opened in a headless
// Chrome under the same content security policy the site serves it with (dist/_headers), and scrubbed to four moments. A reel
// fails when its page throws or logs an error, a request fails or is refused, a moment draws nothing, or all four draw the same
// picture. It is what tells, when the runtime, the player or a motion changes, which reels it broke (HUB.md, "Reels").
//
//   node player/smoke.mjs [id …]   from site/, after npm run build; ids test only those. CHROME names the browser, else
//                                  the system's Chrome
import {createServer} from 'node:http';
import {existsSync, readFileSync, readdirSync, statSync} from 'node:fs';
import {extname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
import sharp from 'sharp';

const HERE = resolve(fileURLToPath(import.meta.url), '..');
const DIST = resolve(HERE, '../../dist');
const PLAY = join(DIST, 'play');
const TYPES = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.ttf': 'font/ttf', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.glb': 'model/gltf-binary'};
/** When in a reel to look, as fractions of its length */
const MOMENTS = [0.12, 0.37, 0.62, 0.87];

/** The headers dist/_headers gives a path under /play/: the policy the site serves a reel with */
function playHeaders() {
  const lines = readFileSync(join(DIST, '_headers'), 'utf8').split('\n');
  const headers = {};
  let inPlay = false;
  for (const line of lines) {
    if (!/^\s/.test(line)) { inPlay = line.trim() === '/play/*'; continue; }
    const m = /^\s+([^:]+):\s*(.*)$/.exec(line);
    if (inPlay && m) headers[m[1]] = m[2];
  }
  return headers;
}

/** The reels the build wrote: play/<id>/ and play/@<scope>/<slug>/, each with its index.html */
function reels() {
  const ids = [];
  for (const d of readdirSync(PLAY)) {
    if (d.startsWith('@')) for (const s of readdirSync(join(PLAY, d))) ids.push(`${d}/${s}`);
    else ids.push(d);
  }
  return ids.filter((id) => existsSync(join(PLAY, id, 'index.html'))).sort();
}

/** dist/ over HTTP, with the reels' policy on /play/ */
function serve() {
  const policy = playHeaders();
  const server = createServer((req, res) => {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (path.endsWith('/')) path += 'index.html';
    const file = resolve(DIST, `.${path}`);
    if (!file.startsWith(DIST) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, {'content-type': TYPES[extname(file)] ?? 'application/octet-stream', ...(path.startsWith('/play/') ? policy : {})});
    res.end(readFileSync(file));
  });
  return new Promise((done) => server.listen(0, '127.0.0.1', () => done(server)));
}

/** A small grey picture of a screenshot, and how much it varies: a frame with nothing drawn barely does */
async function look(png) {
  const img = sharp(png);
  const {channels} = await img.stats();
  const grey = await img.clone().greyscale().resize(64, 36, {fit: 'fill'}).raw().toBuffer();
  return {spread: Math.max(...channels.map((c) => c.stdev)), grey};
}
const differ = (a, b) => a.reduce((s, v, i) => s + Math.abs(v - b[i]), 0) / a.length > 1.5;

async function test(browser, base, id) {
  const page = await browser.newPage({viewport: {width: 960, height: 540}});
  // a reel thick with blur draws slowly in software: slow is not broken here, but stuck is
  page.setDefaultTimeout(120_000);
  const problems = [];
  page.on('pageerror', (e) => problems.push(`throws: ${e.message}`));
  // the browser's own request for a favicon is not the reel's
  page.on('console', (m) => { if (m.type() === 'error' && !m.location().url?.endsWith('/favicon.ico')) problems.push(`logs an error: ${m.text()}`); });
  page.on('requestfailed', (r) => problems.push(`a request fails: ${r.url().replace(base, '')} (${r.failure()?.errorText})`));
  page.on('response', (r) => { if (r.status() >= 400) problems.push(`a request fails: ${r.url().replace(base, '')} (HTTP ${r.status()})`); });
  try {
    // asked to play, as the motion's page asks: a reel in 3D does not wait for a tap
    await page.goto(`${base}/play/${id}/?autoplay=1`, {waitUntil: 'load', timeout: 60_000});
    await page.waitForSelector('.scrub', {timeout: 30_000});
    await page.keyboard.press('k');
    const length = Number(await page.getAttribute('.scrub', 'max'));
    if (!(length > 0)) problems.push('has no length');
    const frames = [];
    for (const at of MOMENTS) {
      await page.evaluate((t) => {
        const s = document.querySelector('.scrub');
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(s, String(t));
        s.dispatchEvent(new Event('input', {bubbles: true}));
      }, length * at);
      await page.waitForTimeout(400);
      // the controls are the player's, not the reel's
      await page.evaluate(() => { for (const el of document.querySelectorAll('.bar, .big')) el.style.visibility = 'hidden'; });
      const shot = await look(await page.screenshot());
      await page.evaluate(() => { for (const el of document.querySelectorAll('.bar, .big')) el.style.visibility = ''; });
      if (shot.spread < 3) problems.push(`draws nothing at ${(length * at).toFixed(1)} s`);
      frames.push(shot.grey);
    }
    if (frames.length && !frames.some((f) => differ(f, frames[0]))) problems.push('draws the same picture at every moment');
  } catch (e) {
    problems.push(`does not play: ${e.message.split('\n')[0]}`);
  }
  await page.close();
  return problems;
}

const asked = process.argv.slice(2);
const ids = asked.length ? asked : reels();
if (!ids.length) { console.error('no reels in dist/play: run npm run build first'); process.exit(1); }
const server = await serve();
const base = `http://127.0.0.1:${server.address().port}`;
const executablePath = process.env.CHROME ?? ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(existsSync);
// software WebGL, so a reel that draws in 3D draws on a machine with no graphics card
const browser = await chromium.launch({executablePath, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required']});
let failed = 0;
for (const id of ids) {
  const problems = await test(browser, base, id);
  if (problems.length) { failed++; for (const p of [...new Set(problems)]) console.log(`${id}  ${p}`); }
  else console.log(`${id}  ok`);
}
await browser.close();
server.close();
console.log(`${ids.length} reel(s), ${failed} failed`);
process.exit(failed ? 1 : 0);
