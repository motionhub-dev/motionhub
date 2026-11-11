#!/usr/bin/env node
// Smaller copies of each motion's poster for the pages: poster-480.webp and poster-960.webp beside poster.jpg in
// ../dist/m/<id>/, which tools/build.mjs wrote. The posters stay the motions' own; these are only how the site shows
// them in a grid. Runs after tools/build.mjs and before astro build (prebuild.mjs); npm run dev names the directory it
// built into instead.
import {existsSync, readFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import sharp from 'sharp';
import {DIST as BUILT} from './paths.mjs';

export const WIDTHS = [480, 960];
const DIST = resolve(process.argv[2] ?? BUILT);

const {motions} = JSON.parse(readFileSync(join(DIST, 'api/motions.json'), 'utf8'));
let made = 0;
for (const m of motions) {
  const poster = join(DIST, m.poster);
  if (!existsSync(poster)) continue;
  for (const w of WIDTHS) {
    await sharp(poster).resize({width: w, withoutEnlargement: true}).webp({quality: 78}).toFile(poster.replace(/\.jpg$/, `-${w}.webp`));
    made++;
  }
}
console.log(`${made} poster thumbnail(s) for ${motions.length} motion(s)`);
