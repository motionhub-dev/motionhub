#!/usr/bin/env node
// Renders a reel to the video a motion's page plays by default: 1920×1080 at 30 frames a second, H.264 (High, level 4.1,
// BT.709) with its sound in AAC, a key frame every two seconds and the index ahead of the frames, so it plays on a phone while
// it downloads. The player built by player/build.mjs is opened with ?render=1, held at each frame's time in turn and
// photographed; the sound is react/sound.json on the reel's cues, synthesised here by the same renderSound the player uses.
// Nothing runs on a clock: the picture at a time is the reel's at that time (HUB.md, "Reels").
//
//   node player/render.mjs [id …] [--out dir] [--force]   from site/, after npm run build. Writes <out>/m/<id>/<version>.mp4
//                                                         (out is .cache/render), the path the site serves it at, for the
//                                                         version the player was built from; a video already there is kept
//                                                         unless --force. CHROME names the browser
import {spawn} from 'node:child_process';
import {existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {renderSound} from '../../packages/runtime/sound.js';
import {PLAY, blank, differ, launch, look, reels, serve, watch} from './chrome.mjs';

const FPS = 30, RATE = 48000;
const SITE_CACHE = resolve(fileURLToPath(import.meta.url), '../../.cache');
/** How long one frame may take to draw before the render is given up as stuck */
const FRAME_MS = 120_000;
/** Frames the finished video is checked at, as fractions of its length: none blank, not all the same */
const CHECKS = [0.05, 0.37, 0.62, 0.95];
/** The picture's encoding: High profile at level 4.1 (what phones decode in hardware), BT.709 like any HD video, a key frame every 2 s for seeking */
const VIDEO = ['-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
  '-color_range', 'tv', '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-profile:v', 'high', '-level:v', '4.1', '-g', String(FPS * 2), '-r', String(FPS)];

/** The version the player of `id` in dist/play was built from (player/build.mjs) */
export function builtVersion(id) {
  const html = readFileSync(join(PLAY, id, 'index.html'), 'utf8');
  const version = /data-version="([^"]+)"/.exec(html)?.[1];
  if (!version) throw new Error(`play/${id}/ names no version: build it again`);
  return version;
}
/** Where the video of `id` at `version` goes under `out`: the path the site serves it at */
export const videoPath = (out, id, version) => join(out, 'm', id, `${version}.mp4`);

/**
 * Runs `cmd` to its end, `feed` writing its input; rejects with the command's last lines of output when it fails. A command
 * that quits while it is fed (bad input, a full disk) fails with its own words, not with the broken pipe the feed meets
 */
function run(cmd, args, feed) {
  return new Promise((done, fail) => {
    const p = spawn(cmd, args, {stdio: [feed ? 'pipe' : 'ignore', 'pipe', 'pipe']});
    let out = '', err = '', fed = Promise.resolve();
    p.stdout.on('data', (d) => { out += d; });
    p.stderr.on('data', (d) => { err = (err + d).slice(-4000); });
    p.on('error', fail);
    if (feed) {
      p.stdin.on('error', () => {});
      fed = feed(p.stdin).catch((e) => { p.kill('SIGKILL'); return e; });
    }
    p.on('close', async (code) => {
      const e = await fed;
      if (code === 0 && !e) done(out);
      else fail(code ? new Error(`${cmd} exited ${code}: ${err.trim().split('\n').slice(-3).join(' / ')}`) : e);
    });
  });
}

/** Writes one frame to a command's input, waiting when its pipe is full */
const write = (stream, buf) => new Promise((done, fail) => { stream.write(buf, (e) => (e ? fail(e) : done())); });

/** Renders motion `id` into `file`; resolves to what it found wrong (nothing when the video is in place) and how long it took */
async function render(browser, base, id, file) {
  const started = Date.now();
  const page = await browser.newPage({viewport: {width: 1920, height: 1080}, deviceScaleFactor: 1});
  page.setDefaultTimeout(FRAME_MS);
  const problems = watch(page, base);
  // the work sits beside the video, so moving it into place is a rename on one disk
  mkdirSync(dirname(file), {recursive: true});
  const work = mkdtempSync(join(dirname(file), '.render-'));
  // a reel that throws stops drawing, so a frame it was asked for never comes: it fails at once rather than waiting
  let stop;
  const stopped = new Promise((_, fail) => { stop = fail; });
  stopped.catch(() => {});
  page.on('pageerror', (e) => stop(new Error(`throws: ${e.message}`)));
  const frame = (t) => {
    let timer;
    return Promise.race([page.evaluate((at) => window.__motionhub.seek(at), t), stopped,
      new Promise((_, fail) => { timer = setTimeout(() => fail(new Error(`the frame at ${t.toFixed(2)} s did not draw in ${FRAME_MS / 1000} s`)), FRAME_MS); })])
      .finally(() => clearTimeout(timer));
  };
  try {
    await page.goto(`${base}/play/${id}/?render=1`, {waitUntil: 'networkidle', timeout: FRAME_MS});
    await page.waitForFunction(() => window.__motionhub);
    await page.evaluate(() => document.fonts.ready);
    if (problems.length) return {problems, seconds: 0};
    const reel = await page.evaluate(() => { const {seek, ...rest} = window.__motionhub; return rest; });
    if (reel.width !== 1920 || reel.height !== 1080) return {problems: [`is ${reel.width}×${reel.height}, not 1920×1080`], seconds: 0};
    const frames = Math.round(reel.seconds * FPS);
    const args = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-'];
    if (reel.sound) {
      const samples = renderSound({seconds: reel.seconds, cues: reel.cues, sound: reel.sound, rate: RATE});
      writeFileSync(join(work, 'sound.f32'), Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength));
      args.push('-f', 'f32le', '-ar', String(RATE), '-ac', '1', '-i', join(work, 'sound.f32'), '-c:a', 'aac', '-b:a', '128k');
    }
    const video = join(work, 'reel.mp4');
    args.push(...VIDEO, '-frames:v', String(frames), '-movflags', '+faststart', '-shortest', video);
    const checks = new Map(CHECKS.map((f) => [Math.min(frames - 1, Math.round(f * frames)), null]));
    await run('ffmpeg', args, async (stdin) => {
      for (let i = 0; i < frames; i++) {
        await frame(i / FPS);
        // a CSS transition or animation would run on the wall clock: held at its end, it is the same in every render
        const png = await page.screenshot({type: 'png', animations: 'disabled'});
        if (checks.has(i)) checks.set(i, await look(png));
        await write(stdin, png);
      }
      stdin.end();
    });
    const seconds = Number(await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video]));
    if (Math.abs(seconds - reel.seconds) > 2 / FPS) problems.push(`lasts ${seconds.toFixed(2)} s, not ${reel.seconds} s`);
    const shots = [...checks];
    for (const [i, shot] of shots) if (blank(shot)) problems.push(`draws nothing at ${(i / FPS).toFixed(1)} s`);
    if (!shots.some(([, s]) => differ(s.grey, shots[0][1].grey))) problems.push('draws the same picture throughout');
    if (!problems.length) renameSync(video, file);
    return {problems, seconds: (Date.now() - started) / 1000};
  } finally {
    await page.close();
    rmSync(work, {recursive: true, force: true});
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
  const argv = process.argv.slice(2);
  const o = argv.indexOf('--out');
  if (o >= 0 && !argv[o + 1]) { console.error('--out names a directory'); process.exit(2); }
  // outside dist/, which the site deploys as it is: a video there would be served whole, at the wrong address
  const out = resolve(o >= 0 ? argv[o + 1] : join(SITE_CACHE, 'render'));
  const force = argv.includes('--force');
  const asked = argv.filter((a, i) => !a.startsWith('--') && (o < 0 || i !== o + 1));
  const ids = asked.length ? asked : reels();
  if (!ids.length) { console.error('no reels in dist/play: run npm run build first'); process.exit(1); }
  const server = await serve(), browser = await launch({exact: true});
  let failed = 0;
  for (const id of ids) {
    try {
      if (!existsSync(join(PLAY, id, 'index.html'))) throw new Error(`there is no play/${id}/: build it first`);
      const file = videoPath(out, id, builtVersion(id));
      if (existsSync(file) && !force) { console.log(`${id}  kept ${file}`); continue; }
      const {problems, seconds} = await render(browser, server.base, id, file);
      if (problems.length) { failed++; for (const p of new Set(problems)) console.log(`${id}  ${p}`); }
      else console.log(`${id}  ${file} in ${seconds.toFixed(0)} s`);
    } catch (e) {
      failed++;
      console.log(`${id}  does not render: ${e.message.split('\n')[0]}`);
    }
  }
  await browser.close();
  server.close();
  console.log(`${ids.length} reel(s), ${failed} failed`);
  process.exit(failed ? 1 : 0);
}
