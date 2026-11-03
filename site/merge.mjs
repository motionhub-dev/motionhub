#!/usr/bin/env node
// Adds the pages Astro built (./dist) to the served files tools/build.mjs wrote (../dist). A page never replaces a
// served file: a clash is an error, since it would hide an index, a package or a motion's own file.
import {cpSync, existsSync, readdirSync, statSync} from 'node:fs';
import {join, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const HERE = resolve(fileURLToPath(import.meta.url), '..');
const from = join(HERE, 'dist'), to = resolve(HERE, '../dist');

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
