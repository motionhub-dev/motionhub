#!/usr/bin/env node
// A motion's sample video (HUB.md, "Sample videos"): records it in samples.json and, with --upload, puts it in the R2
// bucket the site serves it from. The video itself never enters the repository.
//
//   node tools/samples.mjs <dir> [--upload]
//
// <dir> holds <id>.mp4 for each motion that has a sample (`@scope-slug.mp4` for a scoped one). Each is checked (H.264
// in an MP4, at most 20 seconds and 8 MB), and its SHA-256, size and length are written to samples.json; its URL is
// /m/<id>/sample-<first 12 hex digits>.mp4, so a new video is a new URL. --upload runs wrangler, signed in to the
// account that holds the bucket (npx wrangler login), and puts each video at that key; the same bytes go to the same
// key, so running it again changes nothing. Upload before merging the samples.json that names them.

import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {existsSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {SAMPLE_BYTES, SAMPLE_SECONDS, sampleFile} from './build.mjs';
import {listMotions, motionId} from './check.mjs';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const WRANGLER = ['--yes', 'wrangler@4.154.0'];

/** An MP4's length in seconds, from its movie header; undefined when it has none */
export function mp4Seconds(buf) {
  const at = buf.indexOf('mvhd');
  if (at < 4) return undefined;
  const v = buf[at + 4];
  const scale = v === 1 ? buf.readUInt32BE(at + 24) : buf.readUInt32BE(at + 16);
  const length = v === 1 ? Number(buf.readBigUInt64BE(at + 28)) : buf.readUInt32BE(at + 20);
  return scale ? length / scale : undefined;
}

/** What is wrong with a sample, in one sentence each */
export function sampleIssues(buf) {
  const issues = [];
  if (buf.subarray(4, 8).toString('latin1') !== 'ftyp') issues.push('it is not an MP4');
  if (!buf.includes('avc1')) issues.push('its video is not H.264');
  const seconds = mp4Seconds(buf);
  if (!(seconds > 0 && seconds <= SAMPLE_SECONDS + 0.05)) issues.push(`it is ${seconds?.toFixed(1) ?? 'of unknown length'} seconds: at most ${SAMPLE_SECONDS}`);
  if (buf.length > SAMPLE_BYTES) issues.push(`it is ${buf.length} bytes: at most ${SAMPLE_BYTES}`);
  return issues;
}

export function main(args) {
  const dir = args.find((a) => !a.startsWith('--'));
  if (!dir) { console.error('usage: node tools/samples.mjs <dir> [--upload]'); return 2; }
  const motions = join(ROOT, 'motions');
  const ids = listMotions(motions).map((d) => motionId(JSON.parse(readFileSync(join(motions, d, 'motion.json'), 'utf8'))));
  const path = join(ROOT, 'samples.json');
  const list = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {};
  let failed = 0;
  for (const name of readdirSync(dir).filter((n) => n.endsWith('.mp4')).sort()) {
    const id = name.slice(0, -4).replace(/^@([^-]+)-/, '@$1/');
    if (!ids.includes(id)) { console.error(`${name}: no motion ${id} here`); failed++; continue; }
    const buf = readFileSync(join(dir, name));
    const issues = sampleIssues(buf);
    if (issues.length) { console.error(`${name}: ${issues.join('; ')}`); failed++; continue; }
    const sha256 = createHash('sha256').update(buf).digest('hex');
    list[id] = {sha256, bytes: buf.length, seconds: +mp4Seconds(buf).toFixed(2)};
    if (args.includes('--upload')) {
      const key = `motionhub/m/${id}/${sampleFile(sha256)}`;
      const r = spawnSync('npx', [...WRANGLER, 'r2', 'object', 'put', key, '--remote', '--file', join(dir, name), '--content-type', 'video/mp4'], {stdio: ['ignore', 'ignore', 'inherit']});
      if (r.status !== 0) { console.error(`${name}: the upload failed`); failed++; continue; }
    }
    console.log(`${id}  ${sampleFile(sha256)}  ${(buf.length / 1e6).toFixed(1)} MB  ${list[id].seconds} s${args.includes('--upload') ? '  uploaded' : ''}`);
  }
  const sorted = Object.fromEntries(Object.entries(list).sort(([a], [b]) => (a < b ? -1 : 1)));
  writeFileSync(path, JSON.stringify(sorted, null, 2) + '\n');
  return failed ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main(process.argv.slice(2));
