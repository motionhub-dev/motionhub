#!/usr/bin/env node
// Adds the pages Astro built (./dist) to the served files prebuild.mjs wrote (../dist). A page never replaces a
// served file: a clash is an error, since it would hide an index, a package or a motion's own file.
import {cpSync, existsSync, readdirSync, statSync} from 'node:fs';
import {join, relative} from 'node:path';
import {DIST, SITE} from './paths.mjs';

const from = join(SITE, 'dist'), to = DIST;

function walk(dir) {
  return readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]));
}

const pages = walk(from);
const clashes = pages.filter((f) => existsSync(join(to, relative(from, f))));
if (clashes.length) {
  console.error(`not merged, these pages would replace served files:\n${clashes.map((f) => relative(from, f)).join('\n')}`);
  process.exit(1);
}
cpSync(from, to, {recursive: true});
console.log(`${pages.length} page file(s) added to ${relative(process.cwd(), to)}`);
