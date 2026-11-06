// motionhub.dev from the command line, with no dependencies: search its index, get a motion into the project (its
// package checked against the SHA-256 the index gives, unpacked with no link and no path outside the motion), start a
// new motion, and share one by pull request (HUB.md, CONTRIBUTING.md). A project keeps its motions in ./motions/
// (SPEC.md §13) and records what it took from the hub in ./motions.lock.json (docs/cli.md).
//
//   motionhub search [words ...]                one line per motion that has every word in its id, names, line, fit or tags
//   motionhub get <id> [--out <dir>]            the newest version of `@iamsuosi/lab-notebook` into ./motions/<id>/,
//                                               recorded in ./motions.lock.json; with --out, into <dir> (which must not
//                                               exist yet) and not recorded
//   motionhub get                               every motion ./motions.lock.json records, at its version: one missing is
//                                               taken, one there is checked to be the copy as published
//   motionhub init <slug> [--github <login>]    ./motions/<slug>/ with every required file but the poster, to fill in,
//                                               scoped to the account gh is signed in as (or --github): its id is
//                                               @<login>/<slug>
//   motionhub tokens [MOTION.md] [--out <file>] a motion in one file's tokens, as tokens.json; by default the project's
//                                               (./MOTION.md, else ./motion/MOTION.md), to standard output
//   motionhub share <dir> [--wait]              the pull request's checks, then the motion uploaded to motionhub.dev and a
//                                               link (and a code) where the person signs in with GitHub and opens the
//                                               pull request; nothing of git, gh or a GitHub token is needed here. With
//                                               --wait, waits for the pull request and prints its address
//   motionhub share <dir> --pr [--github <login>]
//                                               the pull request from the fork of the account gh is signed in as, with
//                                               git (--github must then name that account); --github alone runs the
//                                               checks as that account and opens nothing

import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join, relative, resolve} from 'node:path';
import {gunzipSync} from 'node:zlib';
import {ID, SPEC, checkMotion, expandTokens, listMotions, motionId, parseFrontMatter} from './check.mjs';
import {files as filesOf, tgz} from './pack.mjs';

export const HUB = 'https://motionhub.dev';

/** Where a project keeps its motions (SPEC.md §13), and the file that records the ones it took from a hub. */
export const MOTIONS = 'motions';
export const LOCK = 'motions.lock.json';
const LOCK_VERSION = 1;

/** Where a motion taken from a hub sits in a project: motions/<id>/, so motions/@<scope>/<slug>/. */
export const motionPath = (id, root = '.') => join(root, MOTIONS, ...id.split('/'));

/** The project's lock: `{lockfileVersion, motions: {<id>: {version, sha256}}}`, with no motions when there is none. */
export function readLock(root = '.') {
  const file = join(root, LOCK);
  if (!existsSync(file)) return {lockfileVersion: LOCK_VERSION, motions: {}};
  let lock;
  try { lock = JSON.parse(readFileSync(file, 'utf8')); } catch (error) { throw new Error(`${file} is not JSON: ${error.message}`); }
  if (lock?.lockfileVersion !== LOCK_VERSION || !lock.motions || typeof lock.motions !== 'object') throw new Error(`${file} is in a format this version does not know: update with npx @motionhub/cli@latest`);
  // an entry names where a motion is written, so it must be an id, and its package a SHA-256
  for (const [id, m] of Object.entries(lock.motions)) {
    if (!ID.test(id) || !id.startsWith('@') || typeof m?.version !== 'string' || !/^[0-9A-Za-z.+-]+$/.test(m.version) || !/^[0-9a-f]{64}$/.test(m?.sha256 ?? '')) throw new Error(`${file}: "${id}" is not a motion this file can record ({"version", "sha256"} under an id @<scope>/<slug>)`);
  }
  return lock;
}

/** Write the project's lock, its motions in the order of their ids, so the file only changes where a motion does. */
export function writeLock(lock, root = '.') {
  const motions = Object.fromEntries(Object.keys(lock.motions).sort().map((id) => [id, {version: lock.motions[id].version, sha256: lock.motions[id].sha256}]));
  writeFileSync(join(root, LOCK), `${JSON.stringify({lockfileVersion: LOCK_VERSION, motions}, null, 2)}\n`);
}

/** The SHA-256 of a motion's directory packed the way the hub packs it under `id`: its package's when it is the copy as published. */
export const packedSha256 = (dir, id) => createHash('sha256').update(tgz(filesOf(dir).map((n) => [`${id}/${n}`, readFileSync(join(dir, n))]))).digest('hex');

/** The motion a project holds, as SPEC.md §11 says a tool looks for one, or undefined. */
export const projectMotion = (root = '.') => ['MOTION.md', 'motion/MOTION.md'].map((f) => join(root, f)).find((f) => existsSync(f));

/** A motion in one file's tokens, in the form of tokens.json; a file that is not a valid one is refused, with why. */
export function motionTokens(path) {
  const issues = checkMotion(path, {hub: false});
  if (issues.length) throw new Error(`${path} is not a valid motion in one file:\n${issues.map((i) => `  ${i.code}  ${i.message}`).join('\n')}`);
  return expandTokens(parseFrontMatter(readFileSync(path, 'utf8')).data.tokens);
}

async function get(url) {
  let res;
  try { res = await fetch(url, {signal: AbortSignal.timeout(20_000)}); }
  catch (error) { throw new Error(`motionhub.dev could not be reached: ${error.message}`); }
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res;
}

/** The index's rows. */
export async function index(base = HUB) {
  const body = await (await get(`${base}/api/motions.json`)).json();
  if (body.spec !== 'motion/0.1' || !Array.isArray(body.motions)) throw new Error(`the index is in a format this version does not know (${body.spec}): update with npx @motionhub/cli@latest`);
  return body.motions;
}

/** The rows that contain every word. */
export function search(rows, words) {
  const wanted = words.map((w) => w.toLowerCase()).filter(Boolean);
  return rows.filter((m) => {
    const text = [m.slug, ...Object.values(m.name), ...Object.values(m.line), ...Object.values(m.fit?.for ?? {}), m.fit?.kind ?? '', ...m.tags].join(' ').toLowerCase();
    return wanted.every((w) => text.includes(w));
  });
}

/** The regular files of a ustar archive, by path; a link or other special entry is refused. */
export function untar(tar) {
  const files = new Map();
  const text = (at, width) => tar.subarray(at, at + width).toString('utf8').replace(/\0.*$/s, '');
  for (let at = 0; at + 512 <= tar.length;) {
    if (tar.subarray(at, at + 512).every((b) => b === 0)) break;
    const name = text(at, 100), prefix = text(at + 345, 155), size = parseInt(text(at + 124, 12).trim() || '0', 8), type = String.fromCharCode(tar[at + 156] || 48);
    if (!Number.isFinite(size) || size < 0 || at + 512 + size > tar.length) throw new Error('the package is not a valid archive');
    const path = prefix ? `${prefix}/${name}` : name;
    if (type === '0') files.set(path, tar.subarray(at + 512, at + 512 + size));
    else if (type !== '5') throw new Error(`the package holds a link or special file: ${path}`);
    at += 512 + Math.ceil(size / 512) * 512;
  }
  return files;
}

/** A motion's files from its package, checked against its index row, by path within the motion. */
export function unpack(row, gz) {
  if (createHash('sha256').update(gz).digest('hex') !== row.package.sha256) throw new Error(`${row.slug} ${row.version}: the package does not match the index's SHA-256`);
  const files = new Map(), root = `${row.slug}/`;
  for (const [path, data] of untar(gunzipSync(gz))) {
    if (!path.startsWith(root) || path.split('/').some((p) => !p || p === '.' || p === '..')) throw new Error(`the package holds a file outside its motion: ${path}`);
    files.set(path.slice(root.length), data);
  }
  return files;
}

/** Write the package `row` names (its `slug` the motion's id, `package.url` and `package.sha256`) into `out`, which must not exist yet. */
async function take(row, out, base) {
  if (existsSync(out)) throw new Error(`${out} already exists: a project keeps the copy it took, so remove it first or choose --out`);
  const files = unpack(row, Buffer.from(await (await get(new URL(row.package.url, base).href)).arrayBuffer()));
  for (const [path, data] of files) { mkdirSync(dirname(join(out, path)), {recursive: true}); writeFileSync(join(out, path), data); }
}

/** Write the newest version of the motion `id` (`<slug>` or `@<scope>/<slug>`) into `out`, which must not exist yet. Returns its index row. */
export async function getMotion(id, out, base = HUB, rows) {
  const row = (rows ?? await index(base)).find((m) => m.slug === id);
  if (!row) throw new Error(`no motion "${id}" on ${base}${id.startsWith('@') ? '' : ` (a community motion's id starts with its creator: @<login>/${id})`}: motionhub search <words>`);
  await take(row, out, base);
  return row;
}

/**
 * Bring the project's motions to what its lock records (`motionhub get` with no id): a motion missing from motions/ is
 * taken at the recorded version and checked against the recorded SHA-256; one already there is packed the hub's way and
 * compared with it. Returns one line per motion and how many are not the copy as published.
 */
export async function restore(root = '.', base = HUB) {
  const lock = readLock(root), lines = [];
  let changed = 0;
  for (const [id, {version, sha256}] of Object.entries(lock.motions)) {
    const out = motionPath(id, root), at = relative(root, out);
    if (!existsSync(out)) {
      await take({slug: id, version, package: {url: `/m/${id}/${version}.tgz`, sha256}}, out, base);
      lines.push(`${id} ${version}  taken into ${at}`);
    } else if (packedSha256(out, id) === sha256) lines.push(`${id} ${version}  ok`);
    else {
      lines.push(`${id} ${version}  changed: ${at} is not the copy as published. A motion of your own goes in a directory of its own (motions/<name>/); remove this one and run motionhub get to take it back`);
      changed++;
    }
  }
  return {lines, changed};
}

/** The command line for search and get: `args` after the command's name. Returns the exit status. */
export async function main(command, args, base = HUB) {
  if (command === 'search') {
    const rows = search(await index(base), args.filter((a) => !a.startsWith('--')));
    for (const m of rows) console.log(`${m.slug}  ${m.version}  ${m.line.en ?? Object.values(m.line)[0]}  (${m.fit ? `${m.fit.kind}: ${m.fit.for.en ?? Object.values(m.fit.for)[0]}; ` : ''}looks: ${m.tags.join(', ')}; by ${m.authors.map((a) => a.github).join(', ')}; ${m.license.text}${m.tools.length ? `; for ${m.tools.join(', ')}` : ''})`);
    console.log(rows.length ? `${rows.length} motion(s); get one with: motionhub get <id>` : 'No motion has every one of those words');
    return 0;
  }
  const value = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
  const slug = args.find((a, i) => !a.startsWith('--') && !['--out', '--github'].includes(args[i - 1]));
  if (command === 'tokens') {
    if (args.includes('--out') && (!value('--out') || value('--out').startsWith('--'))) { console.error('usage: motionhub tokens [MOTION.md] [--out <file>]: --out needs a path'); return 2; }
    const file = slug ?? projectMotion();
    if (!file) {
      const held = listMotions(resolve(MOTIONS)).map((d) => `  motionhub tokens ${join(MOTIONS, d, 'MOTION.md')}`);
      console.error(`no MOTION.md here or in ./motion: usage: motionhub tokens [MOTION.md] [--out <file>]${held.length ? `\nthe project holds several motions; name one:\n${held.join('\n')}` : ''}`);
      return 2;
    }
    const json = `${JSON.stringify(motionTokens(file), null, 2)}\n`;
    if (value('--out')) { writeFileSync(value('--out'), json); console.log(`${value('--out')}, the tokens of ${file}`); } else process.stdout.write(json);
    return 0;
  }
  if (command === 'share') {
    if (!slug) { console.error('usage: motionhub share <dir> [--wait] | motionhub share <dir> --pr [--github <login>]'); return 2; }
    // through motionhub.dev unless asked for gh and a fork (--pr), or only for the checks as someone (--github)
    if (args.includes('--pr') || value('--github')) console.log(await share(resolve(slug), {pr: args.includes('--pr'), github: value('--github')}, base));
    else console.log(await shareLink(resolve(slug), {wait: args.includes('--wait'), log: (l) => console.log(l)}, base));
    return 0;
  }
  if (command === 'init') {
    if (!slug || !/^(?=.{3,40}$)[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) { console.error('usage: motionhub init <slug> [--github <login>]  (3 to 40 characters of a-z, 0-9 and single hyphens)'); return 2; }
    const out = resolve(MOTIONS, slug);
    if (existsSync(out)) throw new Error(`${out} already exists`);
    const account = value('--github') ? {login: value('--github')} : githubAccount();
    for (const [path, data] of scaffold(slug, account)) { mkdirSync(dirname(join(out, path)), {recursive: true}); writeFileSync(join(out, path), data); }
    console.log(`${out}, the motion @${account?.login ? account.login.toLowerCase() : 'your-github-login'}/${slug}, authored by ${account?.login ? `${account.login}${value('--github') ? '' : ' (the account gh is signed in as)'}` : 'nobody yet: set scope and authors in motion.json'}: fill in motion.json, MOTION.md, tokens.json and CREDITS.md, add poster.jpg (a frame of a film made in it, 960 to 3840 pixels wide, at most 500 KB) and any tool directory, then: motionhub share ${relative(process.cwd(), out)}`);
    return 0;
  }
  if (!slug) {
    if (args.includes('--out')) { console.error('usage: motionhub get <id> [--out <dir>]: --out takes one motion'); return 2; }
    if (!Object.keys(readLock().motions).length) { console.error(`usage: motionhub get <id> [--out <dir>], or motionhub get to take every motion ${LOCK} records: there is none here yet`); return 2; }
    const {lines, changed} = await restore('.', base);
    for (const line of lines) console.log(line);
    return changed ? 1 : 0;
  }
  const custom = value('--out');
  const out = resolve(custom ?? motionPath(slug)), at = relative(process.cwd(), out);
  const rows = await index(base);
  const lock = readLock();
  // a copy already in the project stays: it is the version the film was made in
  if (!custom && existsSync(out)) {
    const held = lock.motions[slug], newest = rows.find((m) => m.slug === slug);
    if (held && newest && held.version === newest.version) { console.log(`${slug} ${held.version} is in ${at}, the newest version`); return 0; }
    throw new Error(`${at} already exists${held ? ` at ${held.version}` : ''}${newest ? `; the newest is ${newest.version}: remove ${at} and get it again to take that one` : ''}`);
  }
  const row = await getMotion(slug, out, base, rows);
  if (!custom) { lock.motions[row.slug] = {version: row.version, sha256: row.package.sha256}; writeLock(lock); }
  console.log(`${row.slug} ${row.version} in ${at}${custom ? '' : `, recorded in ${LOCK}`}: read its MOTION.md and tokens.json before drawing. Credit: ${row.name.en} by ${row.authors.map((a) => a.name).join(', ')}, ${base}/m/${row.slug}/, ${row.license.text}`);
  return 0;
}

const REPO = 'motionhub-dev/motions';
const run = (cmd, args, cwd) => spawnSync(cmd, args, {cwd, encoding: 'utf8'});
/** A command that must succeed; its error names the step and gives its own message. */
function must(cmd, args, cwd) {
  const r = run(cmd, args, cwd);
  if (r.error || r.status !== 0) throw new Error(`${cmd} ${args.slice(0, 2).join(' ')} failed: ${(r.stderr || r.error?.message || '').trim()}`);
  return r.stdout.trim();
}

/** The GitHub account gh is signed in as, or undefined. */
export function githubAccount() {
  const r = run('gh', ['api', 'user']);
  return r.error || r.status !== 0 ? undefined : JSON.parse(r.stdout);
}

/** A GitHub account by login, as GitHub gives it now ({login, id, …}), or undefined. */
export function githubUser(login) {
  const r = run('gh', ['api', `users/${encodeURIComponent(login)}`]);
  return r.error || r.status !== 0 ? undefined : JSON.parse(r.stdout);
}

/** A new motion's starting files, by path: every required file but the poster, with what each part is for, scoped to its author. */
export function scaffold(slug, author) {
  const title = slug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
  const color = (hex) => ({colorSpace: 'srgb', components: [1, 3, 5].map((i) => Math.round((parseInt(hex.slice(i, i + 2), 16) / 255) * 10000) / 10000), hex});
  return new Map([
    ['motion.json', JSON.stringify({spec: SPEC, scope: (author?.login || 'your-github-login').toLowerCase(), slug, version: '1.0.0', name: {en: title}, line: {en: `One sentence: what ${title} looks like and what it is for.`},
      authors: [{name: author?.name || author?.login || 'Your name', github: author?.login || 'your-github-login'}], license: {text: 'CC-BY-4.0', code: 'MIT'}, tags: [],
      fit: {kind: 'general', for: {en: `The subjects and kinds of film ${title} is for; "general" if it carries many, "topic" if it is made for one, "overlay" if it is drawn over the maker's own footage.`}, not: {en: 'What it handles badly.'}}}, null, 2) + '\n'],
    ['MOTION.md', `# ${title}\n\nWhat a film in this motion feels like, in a sentence or two. Describe the look and the motion, never a particular film.\n\n## Essence\n\nThe few traits that make a frame read as ${title} at a glance, and what it is easily confused with.\n\n## Colour\n\nWhat each colour token is for, and what is never coloured.\n\n## Type\n\nThe faces and their roles, sizes, and how words sit in the frame.\n\n## Motion\n\nHow things arrive, change and leave; the easing and the durations in seconds; how motion follows the narration or music; what never moves.\n\n## Avoid\n\nThe mistakes this look invites, and what to do instead.\n`],
    ['tokens.json', JSON.stringify({
      color: {$type: 'color', ground: {$value: color('#FBFAF5'), $description: 'the ground'}, ink: {$value: color('#1B2A47'), $description: 'every line and word'}, accent: {$value: color('#CF4F33'), $description: 'the one thing that matters'}},
      font: {$type: 'fontFamily', sans: {$value: ['Inter', 'sans-serif']}},
      duration: {$type: 'duration', enter: {$value: {value: 0.6, unit: 's'}}},
      easing: {$type: 'cubicBezier', arrive: {$value: [0.22, 1, 0.36, 1]}},
    }, null, 2) + '\n'],
    ['CREDITS.md', `# Credits\n\n${title} is an original motion.\n\n## Fonts\n\n- Inter: SIL Open Font License 1.1, https://github.com/rsms/inter\n\n## Assets\n\n- None.\n`],
  ]);
}

/**
 * Share a motion through motionhub.dev, with no git, gh or GitHub token here: check it as its pull request will be
 * checked (all but who you are, which the site and the pull request judge), pack it, upload it, and say where to open
 * the pull request: a link to sign in with GitHub at and a code to type there. With `wait`, ask until the pull request
 * is open (or `log` says it is not yet) and give its address. `ask` is the time between asks, in ms.
 */
export async function shareLink(dir, {wait = false, log = () => {}, ask = 5000, most = 30 * 60 * 1000} = {}, base = HUB) {
  if (!existsSync(join(dir, 'motion.json'))) throw new Error(`${dir} has no motion.json: share a motion's directory (motionhub init <slug> makes one)`);
  const manifest = JSON.parse(readFileSync(join(dir, 'motion.json'), 'utf8'));
  const id = motionId(manifest);
  const published = (await index(base)).find((m) => m.slug === id);
  const was = published ? await (await get(`${base}/m/${id}/motion.json`)).json() : undefined;
  const issues = checkMotion(dir, {was, shared: true});
  if (issues.length) throw new Error(`${dir} does not pass the hub's checks:\n${issues.map((i) => `${i.at}  ${i.code}  ${i.message}`).join('\n')}`);
  const bytes = tgz(filesOf(dir).map((n) => [`${id}/${n}`, readFileSync(join(dir, n))]));
  if (bytes.length > 1024 * 1024) throw new Error(`${id} packs to ${bytes.length} bytes: a motion is at most 1 MB, its poster included`);
  const res = await fetch(`${base}/api/submissions`, {method: 'POST', headers: {'content-type': 'application/gzip', 'user-agent': 'motionhub-cli'}, body: bytes});
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`motionhub.dev did not take it (${res.status}): ${body.error ?? res.statusText}`);
  const lines = [
    `${id} ${manifest.version} passes the checks and is uploaded${published ? `, after ${published.version}` : ''}. Nothing is published yet. To open its pull request under your GitHub name:`,
    `  1. Open ${body.url}`,
    `  2. Sign in with GitHub, check the motion, and type this code: ${body.code}`,
    `The link works until ${body.expires}. Never type the code on a page you did not open from this terminal.`,
  ];
  if (!wait) return lines.join('\n');
  log(lines.join('\n'));
  for (const until = Date.now() + most; Date.now() < until;) {
    await new Promise((r) => setTimeout(r, ask));
    // a moment without the network, or an answer that is not one, is asked again next time
    const res = await fetch(`${base}/api/submissions/${body.id}?poll=${encodeURIComponent(body.poll)}`, {headers: {'user-agent': 'motionhub-cli'}}).catch(() => undefined);
    if (res?.status === 404) throw new Error('motionhub.dev no longer knows this share: share again');
    const s = res?.ok ? await res.json().catch(() => ({})) : {};
    if (s.prUrl) return `The pull request is open: ${s.prUrl}`;
    if (s.status === 'expired') throw new Error('the share link expired before it was submitted: share again');
  }
  return `Not submitted yet; the link still works until ${body.expires}: ${body.url}`;
}

/**
 * Check a motion for the hub as its pull request will be checked, under the person's GitHub account and against what
 * is published for its id; with `pr`, fork this repository, commit it signed off as the person's git identity and
 * open the pull request from their fork. Nothing is published without `pr`.
 */
export async function share(dir, {pr = false, github} = {}, base = HUB) {
  // the pull request is made by whoever gh is signed in as, so --github may only name that account; without --pr it says whose checks to run
  const signedIn = github && !pr ? undefined : githubAccount();
  if (pr && !signedIn?.login) throw new Error('opening the pull request needs gh signed in as you: gh auth login');
  if (pr && github && signedIn.login.toLowerCase() !== github.toLowerCase()) throw new Error(`gh is signed in as ${signedIn.login}, not ${github}: the pull request would be theirs. Sign in as ${github} (gh auth login), or leave out --github`);
  const account = signedIn ?? (github ? {login: github} : undefined);
  if (!account?.login) throw new Error('sharing needs your GitHub account: sign in with gh (gh auth login), or pass --github <login>');
  const manifest = JSON.parse(readFileSync(join(dir, 'motion.json'), 'utf8'));
  const id = motionId(manifest);
  const published = (await index(base)).find((m) => m.slug === id);
  const was = published ? await (await get(`${base}/m/${id}/motion.json`)).json() : undefined;
  const issues = checkMotion(dir, {author: account.login, authorId: account.id, was});
  if (issues.length) throw new Error(`${dir} does not pass the hub's checks:\n${issues.map((i) => `${i.at}  ${i.code}  ${i.message}`).join('\n')}`);
  const what = `${published ? 'Update' : 'Add'} ${manifest.name.en} ${manifest.version}`;
  if (!pr) return `${id} ${manifest.version} passes the hub's checks as ${account.login}${published ? `, after ${published.version}` : ''}. Nothing is published yet: run again with --pr to open "${what}" on github.com/${REPO}.`;
  const clone = mkdtempSync(join(tmpdir(), 'motionhub-'));
  try {
    const branch = `motion/${id.replace('@', '')}-${manifest.version}`;
    run('gh', ['repo', 'fork', REPO, '--clone=false']);
    must('git', ['clone', '--quiet', `https://github.com/${REPO}.git`, clone]);
    must('git', ['checkout', '--quiet', '-b', branch], clone);
    rmSync(join(clone, 'motions', id), {recursive: true, force: true});
    cpSync(dir, join(clone, 'motions', id), {recursive: true});
    must('git', ['add', join('motions', id)], clone);
    // every login the motion names is recorded with its account's id (accounts/, CONTRIBUTING.md), once
    for (const login of new Set([manifest.scope, ...manifest.authors.map((a) => a.github)].filter(Boolean).map((l) => l.toLowerCase()))) {
      const file = join(clone, 'accounts', `${login}.json`);
      if (existsSync(file)) continue;
      const user = login === account.login.toLowerCase() ? account : githubUser(login);
      if (!Number.isSafeInteger(user?.id)) throw new Error(`GitHub has no account ${login}: check the scope and authors in motion.json`);
      mkdirSync(dirname(file), {recursive: true});
      writeFileSync(file, `${JSON.stringify({login, id: user.id})}\n`);
      must('git', ['add', join('accounts', `${login}.json`)], clone);
    }
    must('git', ['commit', '--quiet', '--signoff', '-m', what], clone);
    must('git', ['-c', 'credential.helper=', '-c', 'credential.helper=!gh auth git-credential', 'push', '--quiet', `https://github.com/${account.login}/motions.git`, `HEAD:refs/heads/${branch}`], clone);
    return must('gh', ['pr', 'create', '--repo', REPO, '--head', `${account.login}:${branch}`, '--title', what, '--body', `${manifest.line.en}\n\nChecked with @motionhub/cli.`], clone);
  } finally { rmSync(clone, {recursive: true, force: true}); }
}
