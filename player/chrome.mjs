// What player/smoke.mjs and player/render.mjs share: dist/ served over HTTP with the policy the site gives /play/*, a
// headless Chrome that draws 3D in software, the list of reels the build wrote, and a look at a screenshot that tells a
// frame with nothing drawn from one with something on it.
import {createServer} from 'node:http';
import {existsSync, readFileSync, readdirSync, statSync} from 'node:fs';
import {extname, join, resolve} from 'node:path';
import {homedir} from 'node:os';
import {chromium} from 'playwright-core';
import sharp from 'sharp';
import {DIST} from './paths.mjs';

export {DIST};
export const PLAY = join(DIST, 'play');
const TYPES = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.ttf': 'font/ttf', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.glb': 'model/gltf-binary'};

/** The headers dist/_headers gives a path under /play/: the policy the site serves a reel with */
function playHeaders() {
  const headers = {};
  let inPlay = false;
  for (const line of readFileSync(join(DIST, '_headers'), 'utf8').split('\n')) {
    if (!/^\s/.test(line)) { inPlay = line.trim() === '/play/*'; continue; }
    const m = /^\s+([^:]+):\s*(.*)$/.exec(line);
    if (inPlay && m) headers[m[1]] = m[2];
  }
  return headers;
}

/** The reels the build wrote: play/<id>/ and play/@<scope>/<slug>/, each with its index.html */
export function reels() {
  const ids = [];
  for (const d of readdirSync(PLAY)) {
    if (d.startsWith('@')) for (const s of readdirSync(join(PLAY, d))) ids.push(`${d}/${s}`);
    else ids.push(d);
  }
  return ids.filter((id) => existsSync(join(PLAY, id, 'index.html'))).sort();
}

/** dist/ over HTTP on a free port, with the reels' policy on /play/: resolves to {base, close} */
export function serve() {
  const policy = playHeaders();
  const server = createServer((req, res) => {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (path.endsWith('/')) path += 'index.html';
    const file = resolve(DIST, `.${path}`);
    if (!file.startsWith(DIST) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, {'content-type': TYPES[extname(file)] ?? 'application/octet-stream', ...(path.startsWith('/play/') ? policy : {})});
    res.end(readFileSync(file));
  });
  return new Promise((done) => server.listen(0, '127.0.0.1', () => done({base: `http://127.0.0.1:${server.address().port}`, close: () => server.close()})));
}

/**
 * Headless Chrome (CHROME, else the system's), with software WebGL so a reel in 3D draws on a machine with no graphics card.
 * `exact` rasterises on one thread: slower, but the same frame comes out the same pixels every time, which several threads do not promise
 */
export function launch({exact = false} = {}) {
  const cache = process.env.PLAYWRIGHT_BROWSERS_PATH ?? join(homedir(), '.cache/ms-playwright');
  const cached = existsSync(cache) ? readdirSync(cache).filter(n => /^chromium-\d+$/.test(n)).sort((a, b) => Number(b.slice(9)) - Number(a.slice(9))).flatMap(n => ['chrome-linux64/chrome', 'chrome-linux/chrome'].map(p => join(cache, n, p))) : [];
  const executablePath = process.env.CHROME ?? ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', chromium.executablePath(), ...cached].find(existsSync);
  return chromium.launch({executablePath, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required',
    ...(exact ? ['--num-raster-threads=1', '--disable-gpu-rasterization'] : [])]});
}

/** Collects what goes wrong on `page`, one sentence each: it throws, logs an error, or a request fails or is refused */
export function watch(page, base) {
  const problems = [];
  page.on('pageerror', (e) => problems.push(`throws: ${e.message}`));
  // the browser's own request for a favicon is not the reel's
  page.on('console', (m) => { if (m.type() === 'error' && !m.location().url?.endsWith('/favicon.ico')) problems.push(`logs an error: ${m.text()}`); });
  page.on('requestfailed', (r) => problems.push(`a request fails: ${r.url().replace(base, '')} (${r.failure()?.errorText})`));
  page.on('response', (r) => { if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) problems.push(`a request fails: ${r.url().replace(base, '')} (HTTP ${r.status()})`); });
  return problems;
}

/** A small grey picture of a screenshot, and how much it varies: a frame with nothing drawn barely does */
export async function look(png) {
  const img = sharp(png);
  const {channels} = await img.stats();
  const grey = await img.clone().greyscale().resize(64, 36, {fit: 'fill'}).raw().toBuffer();
  return {spread: Math.max(...channels.map((c) => c.stdev)), grey};
}
/** Whether two looks show different pictures */
export const differ = (a, b) => a.reduce((s, v, i) => s + Math.abs(v - b[i]), 0) / a.length > 1.5;
/** Whether a look shows nothing drawn */
export const blank = (shot) => shot.spread < 3;
