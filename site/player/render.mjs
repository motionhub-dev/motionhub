#!/usr/bin/env node
// Renders a reel to the video a motion's page plays by default: 1920×1080 at 30 frames a second, H.264 with its sound in
// AAC, moov first so it plays while it downloads. The player built by player/build.mjs is opened with ?render=1, held at
// each frame's time in turn and photographed; the sound is react/sound.json on the reel's cues, synthesised here by the
// same renderSound the player uses. Nothing runs on a clock, so the same motion gives the same video (HUB.md, "Reels").
//
//   node player/render.mjs [id …] [--out dir] [--force]   from site/, after npm run build. Writes <out>/m/<id>/<version>.mp4
//                                                         (out is ../dist/render), the path the site serves it at; a video
//                                                         already there is kept unless --force. CHROME names the browser
import {spawn} from 'node:child_process';
import {existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {renderSound} from '../../packages/runtime/sound.js';
import {DIST, ROOT, blank, differ, launch, look, reels, serve} from './chrome.mjs';

export const FPS = 30;
const RATE = 48000;
/** Frames the finished video is checked at, as fractions of its length: none blank, not all the same */
const CHECKS = [0.05, 0.37, 0.62, 0.95];

/** Runs a command to its end; rejects with its last lines of output when it fails */
function run(cmd, args, feed) {
  return new Promise((done, fail) => {
    const p = spawn(cmd, args, {stdio: [feed ? 'pipe' : 'ignore', 'pipe', 'pipe']});
    let out = '', err = '';
    p.stdout.on('data', (d) => { out += d; });
    p.stderr.on('data', (d) => { err = (err + d).slice(-4000); });
    p.on('error', fail);
    p.on('close', (code) => (code === 0 ? done(out) : fail(new Error(`${cmd} exited ${code}: ${err.trim().split('\n').slice(-3).join(' / ')}`))));
    if (feed) feed(p.stdin).catch((e) => { p.kill(); fail(e); });
  });
}

/** Writes one frame to ffmpeg's input, waiting when its pipe is full */
const write = (stream, buf) => new Promise((done, fail) => { stream.write(buf, (e) => (e ? fail(e) : done())); });

/** Renders motion `id` into `file`; returns how long it took and what it found wrong with the result */
async function render(browser, base, id, file) {
  const started = Date.now();
  const page = await browser.newPage({viewport: {width: 1920, height: 1080}, deviceScaleFactor: 1});
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // a reel thick with blur draws slowly in software: slow is not broken here, but stuck is
  page.setDefaultTimeout(120_000);
  const work = mkdtempSync(join(tmpdir(), 'motionhub-render-'));
  try {
    await page.goto(`${base}/play/${id}/?render=1`, {waitUntil: 'networkidle', timeout: 120_000});
    await page.waitForFunction(() => window.__motionhub);
    await page.evaluate(() => document.fonts.ready);
    const reel = await page.evaluate(() => { const {seek, ...rest} = window.__motionhub; return rest; });
    if (reel.width !== 1920 || reel.height !== 1080) throw new Error(`the reel is ${reel.width}×${reel.height}, not 1920×1080`);
    const frames = Math.round(reel.seconds * FPS);
    const args = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-'];
    if (reel.sound) {
      const samples = renderSound({seconds: reel.seconds, cues: reel.cues, sound: reel.sound, rate: RATE});
      writeFileSync(join(work, 'sound.f32'), Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength));
      args.push('-f', 'f32le', '-ar', String(RATE), '-ac', '1', '-i', join(work, 'sound.f32'), '-c:a', 'aac', '-b:a', '128k');
    }
    const video = join(work, 'reel.mp4');
    args.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-r', String(FPS),
      '-frames:v', String(frames), '-movflags', '+faststart', '-shortest', video);
    const checks = new Map(CHECKS.map((f) => [Math.min(frames - 1, Math.round(f * frames)), null]));
    await run('ffmpeg', args, async (stdin) => {
      for (let i = 0; i < frames; i++) {
        await page.evaluate((t) => window.__motionhub.seek(t), i / FPS);
        const png = await page.screenshot({type: 'png'});
        if (checks.has(i)) checks.set(i, await look(png));
        await write(stdin, png);
      }
      stdin.end();
    });
    const problems = errors.map((e) => `throws: ${e}`);
    const seconds = Number(await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video]));
    if (Math.abs(seconds - reel.seconds) > 2 / FPS) problems.push(`lasts ${seconds.toFixed(2)} s, not ${reel.seconds} s`);
    const shots = [...checks];
    for (const [i, shot] of shots) if (blank(shot)) problems.push(`draws nothing at ${(i / FPS).toFixed(1)} s`);
    if (!shots.some(([, s]) => differ(s.grey, shots[0][1].grey))) problems.push('draws the same picture throughout');
    if (!problems.length) { mkdirSync(dirname(file), {recursive: true}); renameSync(video, file); }
    return {problems, seconds: (Date.now() - started) / 1000};
  } finally {
    await page.close();
    rmSync(work, {recursive: true, force: true});
  }
}

/** The version a motion is published at: its motion.json's */
export const versionOf = (id) => JSON.parse(readFileSync(join(ROOT, 'motions', id, 'motion.json'), 'utf8')).version;
/** Where the video of `id` at its version goes, under `out` */
export const videoPath = (out, id) => join(out, 'm', id, `${versionOf(id)}.mp4`);

if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2);
  const force = argv.includes('--force');
  const o = argv.indexOf('--out');
  const out = resolve(o >= 0 ? argv[o + 1] : join(DIST, 'render'));
  const asked = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--out');
  const ids = asked.length ? asked : reels();
  if (!ids.length) { console.error('no reels in dist/play: run npm run build first'); process.exit(1); }
  const server = await serve(), browser = await launch({exact: true});
  let failed = 0;
  for (const id of ids) {
    const file = videoPath(out, id);
    if (existsSync(file) && !force) { console.log(`${id}  kept ${file}`); continue; }
    try {
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
