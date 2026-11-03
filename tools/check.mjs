#!/usr/bin/env node
// The motion checker: the rules of SPEC.md (code `format.*` and the rest without a `hub.` prefix) and the hub's
// acceptance rules of CONTRIBUTING.md (`hub.*`), with no dependencies.
//
//   node tools/check.mjs [dir ...] [--format-only] [--author <github-login>] [--author-id <github-id>] [--was <motion.json>]
//   node tools/check.mjs --accounts-was <dir>
//   npx @motionhub/cli check ...                  the same, from the published package (bin/motionhub.mjs)
//
// With no directory it checks the current directory when it is a motion, else every motion under ./motions/ (a scoped
// motion sits in ./motions/@<scope>/<slug>/), and the accounts under ./accounts/.
// `--format-only` skips the hub's rules (a tool checking a motion it did not get from this repository wants only the
// format). `--author` also requires that login among the motion's authors (the pull request's checks pass the opener's
// login, and `--author-id` their GitHub account's numeric id). `--was` names the motion.json already published for
// this slug: a change must then come from one of its authors and carry a higher version (SPEC.md §9).
//
// Accounts: a GitHub login can change, and the old one can then be taken by someone else, so in this repository each
// login a motion names (its scope and its authors) is recorded once with its account's numeric id, which never
// changes, in accounts/<login>.json. Who owns a scope or a motion is decided by that id. `--accounts-was` names the
// accounts/ directory before the pull request: a record is only ever added, never changed or removed, and an added one
// must name the id GitHub gives that login now. Exit status 1 when any issue is found.

import {readFileSync, readdirSync, statSync, existsSync} from 'node:fs';
import {join, basename, dirname, resolve, relative, extname} from 'node:path';
import {fileURLToPath} from 'node:url';

/** The newest version of the format; every version before it is still read (SPEC.md §9). */
export const SPEC = 'motion/0.3';
export const SPECS = ['motion/0.1', 'motion/0.2', 'motion/0.3'];
const SCOPE = /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}$/;
const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LANG = /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{1,8})*$/;
const GITHUB = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/;
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const MEMBERS = new Set(['spec', 'slug', 'version', 'name', 'line', 'authors', 'license', 'lang', 'tags']);
const MEMBERS_SINCE = {scope: 'motion/0.2', basedOn: 'motion/0.3'};
const ID = /^(?:@[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}\/)?[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FILES = ['motion.json', 'MOTION.md', 'tokens.json', 'poster.jpg', 'CREDITS.md'];
const HEADINGS = [['essence'], ['colour', 'color'], ['type'], ['motion'], ['avoid']];
const DOC_BYTES = 16 * 1024;
const POSTER_BYTES = 500 * 1024;

// The hub's rules (CONTRIBUTING.md)
const REEL_SECONDS = 30;
// a motion's sound (react/sound.json): the names @motionhub/runtime/sound draws (tests/sound.test.mjs holds the two together)
export const SOUND_ROLES = ['land', 'move', 'draw', 'count', 'cut', 'out'];
export const SOUND_VOICES = ['click', 'thump', 'tone', 'pluck', 'swish', 'scratch', 'chime', 'marimba', 'square', 'squares', 'swell', 'keys', 'noise'];
export const SOUND_KIT = ['kick', 'hat', 'rim', 'bass', 'arp', 'pluck', 'chip', 'pad', 'room'];
const FONT_BYTES = 300 * 1024;
const TEXT_LICENSES = new Set(['CC-BY-4.0', 'CC-BY-SA-4.0', 'CC0-1.0']);
const CODE_LICENSES = new Set(['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', '0BSD']);
const MOTION_BYTES = 1024 * 1024;
const AUDIO_BYTES = 500 * 1024;
const VIDEO = new Set(['.mp4', '.webm', '.mov', '.mkv', '.avi', '.m4v']);
const AUDIO = new Set(['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac', '.opus']);
const CODE = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.mts', '.cts', '.html', '.htm', '.svg']);
const FORBIDDEN_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'out', '.next']);
const UNSAFE = [
  [/\bfetch\s*\(/, 'reaches the network (fetch)'],
  [/\bXMLHttpRequest\b/, 'reaches the network (XMLHttpRequest)'],
  [/\bWebSocket\b/, 'reaches the network (WebSocket)'],
  [/\bEventSource\b/, 'reaches the network (EventSource)'],
  [/\bsendBeacon\b/, 'reaches the network (sendBeacon)'],
  [/\beval\s*\(/, 'evaluates text as code (eval)'],
  [/\bnew\s+Function\b/, 'evaluates text as code (new Function)'],
  [/\bset(?:Timeout|Interval)\s*\(\s*['"`]/, 'evaluates text as code (a string timer)'],
  [/\bimport\s*\(/, 'imports at run time (import())'],
  [/\bdocument\.cookie\b/, 'touches cookies'],
  [/\b(?:localStorage|sessionStorage|indexedDB)\b/, 'touches storage'],
];

/** Check one motion directory; returns its issues, each `{code, at, message}` with `at` relative to the directory. */
export function checkMotion(dir, {hub = true, author, authorId, was, accounts} = {}) {
  const issues = [];
  const add = (code, at, message) => issues.push({code, at, message});
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return add('format.dir', '.', 'not a directory'), issues;

  const entries = readdirSync(dir, {withFileTypes: true});
  for (const file of FILES) if (!entries.some((e) => e.isFile() && e.name === file)) add('format.missing', file, `${file} is required`);
  for (const e of entries) {
    if (e.isFile() && (FILES.includes(e.name) || /^MOTION\.[A-Za-z0-9-]+\.md$/.test(e.name))) continue;
    if (e.isDirectory() && NAME.test(e.name) && e.name.length >= 2 && e.name.length <= 40) continue;
    add('format.extra', e.name, e.isDirectory() ? 'a tool directory is named with 2 to 40 characters of a-z, 0-9 and single hyphens' : 'no other file may sit at the top of a motion');
  }

  const manifest = readJson(join(dir, 'motion.json'), 'motion.json', add);
  if (manifest) checkManifest(manifest, add);
  const tokens = readJson(join(dir, 'tokens.json'), 'tokens.json', add);
  if (tokens) checkTokens(tokens, add);
  for (const e of entries) if (e.isFile() && /^MOTION(\.[A-Za-z0-9-]+)?\.md$/.test(e.name)) checkDoc(join(dir, e.name), e.name, add);
  if (entries.some((e) => e.name === 'poster.jpg' && e.isFile())) checkPoster(join(dir, 'poster.jpg'), add);
  if (entries.some((e) => e.name === 'CREDITS.md' && e.isFile()) && !readFileSync(join(dir, 'CREDITS.md'), 'utf8').trim()) add('format.credits', 'CREDITS.md', 'CREDITS.md is empty: name every asset, or say there is none');
  if (manifest?.license && typeof manifest.license === 'object' && !manifest.license.code) {
    const code = walk(dir).filter((f) => f.split('/').length > 1 && CODE.has(extname(f).toLowerCase()) && !['.svg', '.html', '.htm'].includes(extname(f).toLowerCase()));
    if (code.length) add('format.license.code', 'motion.json', `license.code is required: the motion has code (${code[0]})`);
  }

  const who = {author, authorId: authorId === undefined || authorId === null || authorId === '' ? undefined : Number(authorId), accounts};
  if (hub) checkHub(dir, manifest, {...who, was}, add);
  if (hub && was) checkUpdate(manifest, was, who, add);
  return issues;
}

function readJson(path, at, add) {
  if (!existsSync(path)) return null;
  try {
    const value = JSON.parse(readFileSync(path, 'utf8'));
    if (value && typeof value === 'object' && !Array.isArray(value)) return value;
    add('format.json', at, 'must be a JSON object');
  } catch (e) {
    add('format.json', at, `not valid JSON: ${e.message}`);
  }
  return null;
}

function checkManifest(m, add) {
  const at = 'motion.json';
  const known = SPECS.includes(m.spec);
  for (const key of Object.keys(m)) {
    if (MEMBERS.has(key)) continue;
    if (key in MEMBERS_SINCE) {
      if (known && SPECS.indexOf(m.spec) < SPECS.indexOf(MEMBERS_SINCE[key])) add('manifest.member', at, `"${key}" is a member since ${MEMBERS_SINCE[key]}; spec is ${m.spec}`);
      continue;
    }
    if (/^x-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key)) continue;
    add('manifest.member', at, `unknown member "${key}" (a tool's own members go under "x-<tool>")`);
  }
  if (!known) add('manifest.spec', at, `spec must be one of ${SPECS.map((v) => `"${v}"`).join(', ')}`);
  if (m.scope !== undefined && (typeof m.scope !== 'string' || !SCOPE.test(m.scope))) add('manifest.scope', at, 'scope is a GitHub username in lowercase');
  if (typeof m.slug !== 'string' || !NAME.test(m.slug) || m.slug.length < 3 || m.slug.length > 40) add('manifest.slug', at, 'slug is 3 to 40 characters of a-z, 0-9 and single hyphens');
  if (typeof m.version !== 'string' || !SEMVER.test(m.version)) add('manifest.version', at, 'version is a Semantic Versioning 2.0 version such as "1.0.0"');
  localized(m.name, 'name', 60, at, add);
  localized(m.line, 'line', 160, at, add);
  if (!Array.isArray(m.authors) || !m.authors.length) add('manifest.authors', at, 'authors is a non-empty array of {name, github}');
  else m.authors.forEach((a, i) => {
    if (!a || typeof a !== 'object' || typeof a.name !== 'string' || !a.name.trim()) add('manifest.authors', at, `authors[${i}].name is required`);
    if (!a || typeof a.github !== 'string' || !GITHUB.test(a.github)) add('manifest.authors', at, `authors[${i}].github is a GitHub username`);
  });
  if (!m.license || typeof m.license !== 'object' || Array.isArray(m.license)) add('manifest.license', at, 'license is {text, code}, each an SPDX license expression');
  else {
    for (const key of Object.keys(m.license)) if (key !== 'text' && key !== 'code') add('manifest.license', at, `license has only "text" and "code", not "${key}"`);
    if (!spdx(m.license.text)) add('manifest.license', at, 'license.text is an SPDX license expression such as "CC-BY-4.0"');
    if (m.license.code !== undefined && !spdx(m.license.code)) add('manifest.license', at, 'license.code is an SPDX license expression such as "MIT"');
  }
  if (m.lang !== undefined && (typeof m.lang !== 'string' || !LANG.test(m.lang))) add('manifest.lang', at, 'lang is a BCP 47 language tag such as "en" or "zh-CN"');
  if (m.basedOn !== undefined) {
    if (!Array.isArray(m.basedOn) || !m.basedOn.length || m.basedOn.length > 10) add('manifest.basedOn', at, 'basedOn is an array of 1 to 10 {id, version}');
    else {
      const seen = new Set();
      m.basedOn.forEach((b, i) => {
        if (!b || typeof b !== 'object' || Array.isArray(b)) return add('manifest.basedOn', at, `basedOn[${i}] is {id, version}`);
        for (const key of Object.keys(b)) if (key !== 'id' && key !== 'version') add('manifest.basedOn', at, `basedOn[${i}] has only "id" and "version", not "${key}"`);
        if (typeof b.id !== 'string' || !ID.test(b.id)) add('manifest.basedOn', at, `basedOn[${i}].id is a motion's id, such as "@iamsuosi/red-pencil"`);
        else if (seen.has(b.id)) add('manifest.basedOn', at, `basedOn names ${b.id} twice`);
        else if (typeof m.slug === 'string' && b.id === motionId(m)) add('manifest.basedOn', at, 'a motion is not based on itself');
        seen.add(b.id);
        if (b.version !== undefined && (typeof b.version !== 'string' || !SEMVER.test(b.version))) add('manifest.basedOn', at, `basedOn[${i}].version is a Semantic Versioning 2.0 version`);
      });
    }
  }
  if (m.tags !== undefined) {
    if (!Array.isArray(m.tags) || m.tags.length > 10) add('manifest.tags', at, 'tags is an array of at most 10 keywords');
    else m.tags.forEach((t) => { if (typeof t !== 'string' || !NAME.test(t)) add('manifest.tags', at, `tag "${t}" is a keyword of a-z, 0-9 and single hyphens`); });
  }
}

function localized(value, key, max, at, add) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return add(`manifest.${key}`, at, `${key} is an object of BCP 47 tags to text, with "en"`);
  if (typeof value.en !== 'string' || !value.en.trim()) add(`manifest.${key}`, at, `${key}.en is required`);
  for (const [lang, text] of Object.entries(value)) {
    if (!LANG.test(lang)) add(`manifest.${key}`, at, `${key} key "${lang}" is not a BCP 47 language tag`);
    else if (typeof text !== 'string' || !text.trim()) add(`manifest.${key}`, at, `${key}.${lang} is text`);
    else if ([...text].length > max) add(`manifest.${key}`, at, `${key}.${lang} is longer than ${max} characters`);
  }
}

/** Whether a string is an SPDX license expression: identifiers (optionally with "+") joined by AND, OR and WITH, with parentheses. */
export function spdx(expr) {
  if (typeof expr !== 'string' || !expr.trim()) return false;
  const tokens = expr.match(/\(|\)|[^\s()]+/g) ?? [];
  let i = 0;
  const id = () => /^(?:LicenseRef-|DocumentRef-[A-Za-z0-9.-]+:LicenseRef-)?[A-Za-z0-9][A-Za-z0-9.-]*\+?$/.test(tokens[i] ?? '') && !['AND', 'OR', 'WITH'].includes(tokens[i]) ? (i++, true) : false;
  const primary = () => {
    if (tokens[i] === '(') { i++; if (!expression() || tokens[i] !== ')') return false; i++; return true; }
    if (!id()) return false;
    if (tokens[i] === 'WITH') { i++; return id(); }
    return true;
  };
  const expression = () => { if (!primary()) return false; while (tokens[i] === 'AND' || tokens[i] === 'OR') { i++; if (!primary()) return false; } return true; };
  return expression() && i === tokens.length;
}

const spdxIds = (expr) => (expr.match(/[^\s()]+/g) ?? []).filter((t) => !['AND', 'OR', 'WITH'].includes(t));

function checkTokens(tokens, add) {
  const at = 'tokens.json';
  const found = new Map();
  const visit = (node, path, inherited) => {
    const type = typeof node.$type === 'string' ? node.$type : inherited;
    if ('$value' in node) return found.set(path.join('.'), {node, type});
    for (const [key, child] of Object.entries(node)) {
      if (key.startsWith('$')) continue;
      if (/[{}.]/.test(key)) add('tokens.name', at, `"${[...path, key].join('/')}" has a name with "{", "}" or "."`);
      if (!child || typeof child !== 'object' || Array.isArray(child)) { add('tokens.group', at, `"${[...path, key].join('.')}" is neither a group nor a token`); continue; }
      visit(child, [...path, key], type);
    }
  };
  visit(tokens, [], undefined);
  for (const [group, type] of [['color', 'color'], ['font', 'fontFamily']]) {
    if (![...found].some(([path, t]) => path.startsWith(`${group}.`) && t.type === type)) add('tokens.required', at, `a "${group}" group with at least one ${type} token is required`);
  }
  for (const [path, {node, type}] of found) {
    if (path.startsWith('color.') && type !== 'color') add('tokens.type', at, `${path} is in the color group but its type is ${type ?? 'missing'}`);
    if (path.startsWith('font.') && type !== 'fontFamily') add('tokens.type', at, `${path} is in the font group but its type is ${type ?? 'missing'}`);
    const value = node.$value;
    if (typeof value === 'string' && /^\{[^{}]+\}$/.test(value)) {
      if (!found.has(value.slice(1, -1))) add('tokens.alias', at, `${path} refers to ${value}, which is not a token`);
      continue;
    }
    if (JSON.stringify(value).match(/"(?:https?:|data:|file:|\.{0,2}\/)[^"]*"/)) add('tokens.url', at, `${path} refers to a file or a URL`);
    const problem = TYPE_CHECKS[type]?.(value);
    if (problem) add('tokens.value', at, `${path}: ${problem}`);
  }
}

const num = (v) => typeof v === 'number' && Number.isFinite(v);
const TYPE_CHECKS = {
  color: (v) => {
    if (!v || typeof v !== 'object' || Array.isArray(v)) return 'a color is {colorSpace, components, alpha?, hex?}';
    if (typeof v.colorSpace !== 'string') return 'colorSpace is required';
    if (!Array.isArray(v.components) || v.components.length !== 3 || !v.components.every((c) => num(c) || c === 'none')) return 'components is three numbers';
    if (v.alpha !== undefined && !(num(v.alpha) && v.alpha >= 0 && v.alpha <= 1)) return 'alpha is between 0 and 1';
    if (v.hex !== undefined && !/^#[0-9A-Fa-f]{6}$/.test(v.hex)) return 'hex is #RRGGBB';
  },
  fontFamily: (v) => (typeof v === 'string' && v.trim()) || (Array.isArray(v) && v.length && v.every((s) => typeof s === 'string' && s.trim())) ? undefined : 'a font family is a name or a list of names',
  duration: (v) => v && num(v.value) && v.value >= 0 && ['ms', 's'].includes(v.unit) ? undefined : 'a duration is {value, unit: "ms" | "s"}',
  dimension: (v) => v && num(v.value) && ['px', 'rem'].includes(v.unit) ? undefined : 'a dimension is {value, unit: "px" | "rem"}',
  cubicBezier: (v) => Array.isArray(v) && v.length === 4 && v.every(num) && v[0] >= 0 && v[0] <= 1 && v[2] >= 0 && v[2] <= 1 ? undefined : 'a cubic Bézier is [x1, y1, x2, y2] with x1 and x2 between 0 and 1',
};

function checkDoc(path, at, add) {
  const bytes = statSync(path).size;
  if (bytes > DOC_BYTES) add('doc.size', at, `${bytes} bytes: at most ${DOC_BYTES}`);
  const text = readFileSync(path, 'utf8');
  const words = [...text.replace(/```[\s\S]*?```/g, '').matchAll(/^##[ \t]+([A-Za-z]+)/gm)].map((m) => m[1].toLowerCase());
  for (const names of HEADINGS) if (!names.some((n) => words.includes(n))) add('doc.heading', at, `a "## ${names[0][0].toUpperCase()}${names[0].slice(1)}" heading is required`);
}

/** The width and height of a JPEG, read from its first start-of-frame marker; null when it is not a JPEG. */
export function jpegSize(buf) {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) { i++; continue; }
    const marker = buf[i + 1];
    if (marker === 0xff) { i++; continue; }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
    const length = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return {height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7)};
    i += 2 + length;
  }
  return null;
}

function checkPoster(path, add) {
  const buf = readFileSync(path);
  if (buf.length > POSTER_BYTES) add('poster.size', 'poster.jpg', `${buf.length} bytes: at most ${POSTER_BYTES}`);
  const size = jpegSize(buf);
  if (!size) return add('poster.format', 'poster.jpg', 'not a JPEG');
  if (size.width < 960 || size.width > 3840) add('poster.size', 'poster.jpg', `${size.width} pixels wide: between 960 and 3840`);
}

function walk(dir, prefix = '') {
  const out = [];
  for (const e of readdirSync(dir, {withFileTypes: true})) {
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(rel + '/', ...walk(join(dir, e.name), rel));
    else out.push(rel);
  }
  return out;
}

/** `a` compared with `b`, two valid semantic versions: negative, zero or positive. Build metadata is ignored. */
export function compareVersions(a, b) {
  const parse = (v) => { const [core, pre] = v.split('+')[0].split(/-(.*)/s); return {core: core.split('.').map(Number), pre: pre?.split('.') ?? []}; };
  const x = parse(a), y = parse(b);
  for (let i = 0; i < 3; i++) if (x.core[i] !== y.core[i]) return x.core[i] - y.core[i];
  if (!x.pre.length || !y.pre.length) return y.pre.length - x.pre.length;
  for (let i = 0; i < Math.max(x.pre.length, y.pre.length); i++) {
    const p = x.pre[i], q = y.pre[i];
    if (p === undefined || q === undefined) return p === undefined ? -1 : 1;
    if (p === q) continue;
    const pn = /^\d+$/.test(p), qn = /^\d+$/.test(q);
    if (pn && qn) return Number(p) - Number(q);
    if (pn !== qn) return pn ? -1 : 1;
    return p < q ? -1 : 1;
  }
  return 0;
}

/**
 * Whether the pull request's author is the account a login names: by numeric id when both are known (the login's
 * record in accounts/ and the author's id), else by login, without regard to case.
 */
function isAccount(login, {author, authorId, accounts}) {
  if (typeof login !== 'string' || !author) return false;
  const id = accounts?.get(login.toLowerCase());
  if (id !== undefined && authorId !== undefined) return id === authorId;
  return login.toLowerCase() === author.toLowerCase();
}

/** A change to a published motion: only one of its authors makes it, and it is a new, higher version. */
function checkUpdate(manifest, was, who, add) {
  const {author} = who;
  const github = (list) => (Array.isArray(list) ? list : []).map((a) => String(a?.github ?? '').toLowerCase());
  if (author && !(Array.isArray(was.authors) ? was.authors : []).some((a) => isAccount(a?.github, who))) {
    add('hub.owner', 'motion.json', `this motion is published by ${github(was.authors).join(', ') || 'nobody'}; only one of them may change it (make your own under your own scope and credit it in CREDITS.md)`);
  }
  if (typeof manifest?.version === 'string' && SEMVER.test(manifest.version) && typeof was.version === 'string' && SEMVER.test(was.version) && compareVersions(manifest.version, was.version) <= 0) {
    add('hub.version', 'motion.json', `version ${manifest.version} is not above the published ${was.version}: a published version never changes`);
  }
}

/** A motion's id on a hub: `@<scope>/<slug>` with a scope, else `<slug>` (SPEC.md §3). */
export const motionId = (manifest) => (manifest?.scope ? `@${manifest.scope}/${manifest.slug}` : manifest?.slug);

/** The motion directories under a collection's root: `<slug>/` and `@<scope>/<slug>/`, as paths relative to it, sorted. */
export function listMotions(root) {
  if (!existsSync(root)) return [];
  const dirs = (dir) => readdirSync(dir, {withFileTypes: true}).filter((e) => e.isDirectory()).map((e) => e.name);
  return dirs(root).flatMap((d) => (d.startsWith('@') ? dirs(join(root, d)).map((s) => `${d}/${s}`) : [d])).sort();
}

function checkHub(dir, manifest, {author, authorId, accounts, was}, add) {
  const who = {author, authorId, accounts};
  // in the catalogue a motion is motions/<id>/: motions/<slug>/ or motions/@<scope>/<slug>/ (HUB.md); a copy in a
  // project (./motion/) may be named otherwise
  const path = resolve(dir), name = basename(path), parent = basename(dirname(path));
  const inCatalogue = parent === 'motions' || (parent.startsWith('@') && basename(dirname(dirname(path))) === 'motions');
  const at = parent.startsWith('@') ? `${parent}/${name}` : name;
  if (inCatalogue && typeof manifest?.slug === 'string' && motionId(manifest) !== at) add('hub.slug', 'motion.json', `the motion ${motionId(manifest)} sits at motions/${motionId(manifest)}/ in the catalogue, not motions/${at}/`);
  // a motion it is based on is one in the catalogue, so the site can link and credit it
  if (inCatalogue && Array.isArray(manifest?.basedOn)) {
    const root = parent.startsWith('@') ? dirname(dirname(path)) : dirname(path);
    for (const b of manifest.basedOn) if (typeof b?.id === 'string' && ID.test(b.id) && !existsSync(join(root, b.id, 'motion.json'))) add('hub.basedOn', 'motion.json', `basedOn names ${b.id}, which is not in the catalogue`);
  }
  if (manifest?.license && typeof manifest.license === 'object') {
    if (spdx(manifest.license.text) && !spdxIds(manifest.license.text).every((id) => TEXT_LICENSES.has(id))) add('hub.license', 'motion.json', `license.text must be one of ${[...TEXT_LICENSES].join(', ')}`);
    if (spdx(manifest.license.code) && !spdxIds(manifest.license.code).every((id) => CODE_LICENSES.has(id))) add('hub.license', 'motion.json', `license.code must be one of ${[...CODE_LICENSES].join(', ')}`);
  }
  if (author && Array.isArray(manifest?.authors) && !manifest.authors.some((a) => isAccount(a?.github, who))) {
    add('hub.author', 'motion.json', `the pull request's author "${author}" must be among the authors`);
  }
  // every motion on motionhub is published under its author's GitHub name: an id is @<scope>/<slug>, and a new one
  // only by the scope's owner; a change is checkUpdate's
  if (manifest && typeof manifest === 'object') {
    const login = author ? author.toLowerCase() : '<your GitHub login>';
    if (manifest.scope === undefined) add('hub.scope', 'motion.json', `a motion on motionhub is published under its author's GitHub name: give it "scope": "${login}", for the id @${login}/${manifest.slug ?? '<slug>'}`);
    else if (author && !was && typeof manifest.scope === 'string' && !isAccount(manifest.scope, who)) add('hub.scope', 'motion.json', `the scope "${manifest.scope}" belongs to that GitHub account; publish yours as @${login}/${manifest.slug ?? '<slug>'}`);
  }
  // in this repository every login a motion names is recorded with its account's id, so that a login given up and
  // taken by someone else never brings the motion with it
  if (accounts && manifest && typeof manifest === 'object') {
    const logins = [manifest.scope, ...(Array.isArray(manifest.authors) ? manifest.authors.map((a) => a?.github) : [])];
    for (const name of new Set(logins.filter((l) => typeof l === 'string' && GITHUB.test(l)).map((l) => l.toLowerCase()))) {
      if (accounts.has(name)) continue;
      const mine = author && name === author.toLowerCase() && authorId !== undefined;
      add('hub.account', 'motion.json', `${name} is not recorded: add accounts/${name}.json with ${mine ? `{"login": "${name}", "id": ${authorId}}` : `{"login": "${name}", "id": <the numeric id of that GitHub account>}`} (npx @motionhub/cli share --pr adds it)`);
    }
  }
  let total = 0;
  for (const rel of walk(dir)) {
    if (rel.endsWith('/')) {
      const name = rel.slice(0, -1).split('/').pop();
      if (FORBIDDEN_DIRS.has(name)) add('hub.build', rel, 'no build output, dependencies or repositories in a motion');
      continue;
    }
    const size = statSync(join(dir, rel)).size;
    total += size;
    const ext = extname(rel).toLowerCase();
    if (VIDEO.has(ext)) add('hub.video', rel, 'no video in the repository: samples are published by the hub');
    if (AUDIO.has(ext) && size > AUDIO_BYTES) add('hub.audio', rel, `${size} bytes: audio is at most ${AUDIO_BYTES}`);
    if (CODE.has(ext) && rel.includes('/')) {
      const text = readFileSync(join(dir, rel), 'utf8');
      if (ext === '.svg' && /<script\b/i.test(text)) add('hub.code', rel, 'an SVG carries a script');
      for (const [pattern, what] of UNSAFE) {
        const line = text.split('\n').findIndex((l) => pattern.test(l));
        if (line >= 0) add('hub.code', `${rel}:${line + 1}`, `code ${what}`);
      }
    }
  }
  if (total > MOTION_BYTES) add('hub.size', '.', `${total} bytes: a motion is at most ${MOTION_BYTES}`);
  // faces a motion carries for its components (react/fonts/): WOFF2, each named in fonts.json and credited
  const fontDir = join(dir, 'react/fonts');
  if (existsSync(fontDir)) {
    let list = [];
    try { list = JSON.parse(readFileSync(join(fontDir, 'fonts.json'), 'utf8')); } catch { add('hub.font', 'react/fonts/fonts.json', 'react/fonts/ needs fonts.json: [{family, file, weight, style}]'); }
    const credits = existsSync(join(dir, 'CREDITS.md')) ? readFileSync(join(dir, 'CREDITS.md'), 'utf8') : '';
    const files = readdirSync(fontDir).filter((n) => n !== 'fonts.json');
    for (const n of files) {
      const buf = readFileSync(join(fontDir, n));
      if (!n.endsWith('.woff2') || buf.subarray(0, 4).toString('latin1') !== 'wOF2') add('hub.font', `react/fonts/${n}`, 'a face is a WOFF2 file');
      else if (buf.length > FONT_BYTES) add('hub.font', `react/fonts/${n}`, `${buf.length} bytes: a face is at most ${FONT_BYTES}; cut it to the characters it draws`);
      if (!Array.isArray(list) || !list.some((f) => f?.file === n)) add('hub.font', `react/fonts/${n}`, 'fonts.json does not name it');
    }
    for (const f of Array.isArray(list) ? list : []) {
      if (typeof f?.family !== 'string' || typeof f?.file !== 'string' || !files.includes(f.file)) add('hub.font', 'react/fonts/fonts.json', `an entry needs a family and a file that is here (${f?.file})`);
      else if (!credits.includes(f.family)) add('hub.font', 'CREDITS.md', `CREDITS.md must name the face ${f.family} and its licence`);
    }
  }
  // a motion's sound: the bed and a voice for each role its reel's cues name
  if (existsSync(join(dir, 'react/sound.json'))) {
    let sound;
    try { sound = JSON.parse(readFileSync(join(dir, 'react/sound.json'), 'utf8')); } catch { add('hub.sound', 'react/sound.json', 'not valid JSON'); }
    if (sound && typeof sound === 'object') {
      if (sound.bpm !== undefined && !(sound.bpm >= 40 && sound.bpm <= 200)) add('hub.sound', 'react/sound.json', 'bpm is 40 to 200');
      if (sound.root !== undefined && !(sound.root >= 40 && sound.root <= 2000)) add('hub.sound', 'react/sound.json', 'root is a note in Hz, 40 to 2000');
      for (const k of [].concat(sound.kit ?? [])) if (!SOUND_KIT.includes(k)) add('hub.sound', 'react/sound.json', `kit has no "${k}": ${SOUND_KIT.join(', ')}`);
      for (const [role, spec] of Object.entries(sound.roles ?? {})) {
        if (!SOUND_ROLES.includes(role)) add('hub.sound', 'react/sound.json', `roles has no "${role}": ${SOUND_ROLES.join(', ')}`);
        for (const l of [].concat(spec)) if (!SOUND_VOICES.includes(l?.voice)) add('hub.sound', 'react/sound.json', `${role} has no voice "${l?.voice}": ${SOUND_VOICES.join(', ')}`);
      }
    }
  }
  // a reel is what the motion's page plays live: a default export and how long it runs
  if (existsSync(join(dir, 'react/reel.tsx'))) {
    const reel = readFileSync(join(dir, 'react/reel.tsx'), 'utf8');
    const seconds = Number(/export\s+const\s+reel\s*=\s*\{[^}]*\bseconds\s*:\s*([\d.]+)/.exec(reel)?.[1]);
    if (!/export\s+default\b/.test(reel)) add('hub.reel', 'react/reel.tsx', 'a reel has a default export: the component the player draws');
    if (!(seconds > 0 && seconds <= REEL_SECONDS)) add('hub.reel', 'react/reel.tsx', `a reel exports \`const reel = {seconds}\`, at most ${REEL_SECONDS}`);
  }
}

/** The accounts recorded in a directory, as a Map of login in lowercase to numeric id; files that are not records are left out (checkAccounts reports them). */
export function readAccounts(dir) {
  const accounts = new Map();
  if (!dir || !existsSync(dir)) return accounts;
  for (const name of readdirSync(dir)) {
    const login = /^(.+)\.json$/.exec(name)?.[1];
    if (!login) continue;
    try {
      const record = JSON.parse(readFileSync(join(dir, name), 'utf8'));
      if (Number.isSafeInteger(record?.id) && record.id > 0) accounts.set(login.toLowerCase(), record.id);
    } catch { /* reported by checkAccounts */ }
  }
  return accounts;
}

/** A login's numeric id as GitHub gives it now, or undefined: what an added record is checked against. */
export async function githubId(login, {token = process.env.GITHUB_TOKEN, fetch: get = fetch} = {}) {
  const res = await get(`https://api.github.com/users/${encodeURIComponent(login)}`, {headers: {accept: 'application/vnd.github+json', 'user-agent': 'motionhub-check', ...(token ? {authorization: `Bearer ${token}`} : {})}}).catch(() => undefined);
  if (!res?.ok) return undefined;
  const user = await res.json().catch(() => undefined);
  return Number.isSafeInteger(user?.id) ? user.id : undefined;
}

/**
 * The accounts directory's issues, each `{code, at, message}` with `at` relative to it. Every record is
 * accounts/<login>.json, the login in lowercase, holding `{"login", "id"}`. With `was` (the directory before a change),
 * a record is only ever added: one changed or removed is an issue, and with `lookup` (login → id, or undefined) an
 * added one must name the id GitHub gives that login now.
 */
export async function checkAccounts(dir, {was, lookup} = {}) {
  const issues = [];
  const add = (code, at, message) => issues.push({code, at, message});
  const files = (d) => (d && existsSync(d) ? readdirSync(d).filter((n) => !n.startsWith('.')).sort() : []);
  const read = (d, name) => { try { return JSON.parse(readFileSync(join(d, name), 'utf8')); } catch { return undefined; } };
  for (const name of files(dir)) {
    const login = /^(.+)\.json$/.exec(name)?.[1];
    const record = read(dir, name);
    if (!login || login !== login.toLowerCase() || !GITHUB.test(login)) { add('hub.accounts', name, 'a record is accounts/<login>.json, the GitHub login in lowercase'); continue; }
    if (!record || typeof record !== 'object' || Object.keys(record).sort().join() !== 'id,login' || typeof record.login !== 'string' || record.login.toLowerCase() !== login || !Number.isSafeInteger(record.id) || record.id <= 0) {
      add('hub.accounts', name, `a record holds {"login": "${login}", "id": <the account's numeric id>} and nothing else`);
      continue;
    }
    if (!was) continue;
    const before = existsSync(join(was, name)) ? read(was, name) : undefined;
    if (before !== undefined) {
      if (before?.id !== record.id || before?.login !== record.login) add('hub.accounts', name, 'a recorded account never changes: a login given up and taken by someone else would take its motions with it');
      continue;
    }
    if (!lookup) continue;
    const id = await lookup(login);
    if (id === undefined) add('hub.accounts', name, `GitHub has no account ${login}, or could not be asked: the record cannot be confirmed`);
    else if (id !== record.id) add('hub.accounts', name, `GitHub gives ${login} the id ${id}, not ${record.id}`);
  }
  for (const name of files(was)) if (/\.json$/.test(name) && !existsSync(join(dir, name))) add('hub.accounts', name, 'a recorded account is never removed');
  return issues;
}

/** The command line: `args` as after `node tools/check.mjs`. Resolves to the exit status. */
export async function main(args) {
  const hub = !args.includes('--format-only');
  const value = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
  const author = value('--author'), authorId = value('--author-id'), wasPath = value('--was'), accountsWas = value('--accounts-was');
  // this repository's accounts, when it is run at its root; a motion checked anywhere else has none to look up
  const accountsDir = existsSync(resolve('motions')) && existsSync(resolve('accounts')) ? resolve('accounts') : undefined;
  if (accountsWas !== undefined) {
    const issues = await checkAccounts(resolve('accounts'), {was: resolve(accountsWas), lookup: (login) => githubId(login)});
    for (const i of issues) console.log(`accounts/${i.at}  ${i.code}  ${i.message}`);
    console.log(`accounts, ${issues.length} issue(s)`);
    return issues.length ? 1 : 0;
  }
  const was = wasPath ? JSON.parse(readFileSync(wasPath, 'utf8')) : undefined;
  let dirs = args.filter((a, i) => !a.startsWith('--') && !['--author', '--author-id', '--was'].includes(args[i - 1]));
  let count = 0;
  if (!dirs.length) {
    const root = resolve('motions');
    dirs = existsSync('motion.json') ? ['.'] : listMotions(root).map((d) => join(root, d));
    if (hub && accountsDir && !existsSync('motion.json')) {
      for (const i of await checkAccounts(accountsDir)) { console.log(`accounts/${i.at}  ${i.code}  ${i.message}`); count++; }
    }
  }
  const accounts = hub && accountsDir ? readAccounts(accountsDir) : undefined;
  for (const dir of dirs) {
    const issues = checkMotion(dir, {hub, author, authorId, was, accounts});
    const name = relative(process.cwd(), resolve(dir)) || '.';
    for (const i of issues) console.log(`${name}/${i.at}  ${i.code}  ${i.message}`);
    if (!issues.length) console.log(`${name}  ok`);
    count += issues.length;
  }
  if (!dirs.length) console.log('no motions to check');
  console.log(`${dirs.length} motion(s), ${count} issue(s)`);
  return count ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = await main(process.argv.slice(2));
