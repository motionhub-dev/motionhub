// motionhub.dev from the command line, with no dependencies: search its index, get a motion (its package checked
// against the SHA-256 the index gives, unpacked with no link and no path outside the motion), start a new motion, and
// share one by pull request (HUB.md, CONTRIBUTING.md).
//
//   motionhub search [words ...]                one line per motion that has every word in its slug, names, line or tags
//   motionhub get <slug> [--out <dir>]          the newest version, into <dir> (default ./motion), which must not exist yet
//   motionhub init <slug> [--github <login>]    ./<slug>/ with every required file but the poster, to fill in
//   motionhub share <dir> [--github <login>] [--pr]
//                                               the pull request's checks, as the person and against what is published;
//                                               with --pr, the pull request itself, from the fork of the account gh is
//                                               signed in as (--github must then name that account)

import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {basename, dirname, join, resolve} from 'node:path';
import {gunzipSync} from 'node:zlib';
import {checkMotion} from './check.mjs';

export const HUB = 'https://motionhub.dev';

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
    const text = [m.slug, ...Object.values(m.name), ...Object.values(m.line), ...m.tags].join(' ').toLowerCase();
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

/** Write the newest version of `slug` into `out`, which must not exist yet. Returns its index row. */
export async function getMotion(slug, out, base = HUB) {
  const row = (await index(base)).find((m) => m.slug === slug);
  if (!row) throw new Error(`no motion "${slug}" on ${base}: motionhub search <words>`);
  if (existsSync(out)) throw new Error(`${out} already exists: a project keeps the copy it took, so remove it first or choose --out`);
  const files = unpack(row, Buffer.from(await (await get(new URL(row.package.url, base).href)).arrayBuffer()));
  for (const [path, data] of files) { mkdirSync(dirname(join(out, path)), {recursive: true}); writeFileSync(join(out, path), data); }
  return row;
}

/** The command line for search and get: `args` after the command's name. Returns the exit status. */
export async function main(command, args, base = HUB) {
  if (command === 'search') {
    const rows = search(await index(base), args.filter((a) => !a.startsWith('--')));
    for (const m of rows) console.log(`${m.slug}  ${m.version}  ${m.line.en ?? Object.values(m.line)[0]}  (looks: ${m.tags.join(', ')}; by ${m.authors.map((a) => a.github).join(', ')}; ${m.license.text}${m.tools.length ? `; for ${m.tools.join(', ')}` : ''})`);
    console.log(rows.length ? `${rows.length} motion(s); get one with: motionhub get <slug>` : 'No motion has every one of those words');
    return 0;
  }
  const value = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
  const slug = args.find((a, i) => !a.startsWith('--') && !['--out', '--github'].includes(args[i - 1]));
  if (command === 'share') {
    if (!slug) { console.error('usage: motionhub share <dir> [--github <login>] [--pr]'); return 2; }
    console.log(await share(resolve(slug), {pr: args.includes('--pr'), github: value('--github')}, base));
    return 0;
  }
  if (command === 'init') {
    if (!slug || !/^(?=.{3,40}$)[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) { console.error('usage: motionhub init <slug>  (3 to 40 characters of a-z, 0-9 and single hyphens)'); return 2; }
    const out = resolve(slug);
    if (existsSync(out)) throw new Error(`${out} already exists`);
    const account = value('--github') ? {login: value('--github')} : githubAccount();
    for (const [path, data] of scaffold(slug, account)) { mkdirSync(dirname(join(out, path)), {recursive: true}); writeFileSync(join(out, path), data); }
    console.log(`${out}, authored by ${account?.login ? `${account.login}${value('--github') ? '' : ' (the account gh is signed in as)'}` : 'nobody yet: set authors in motion.json'}: fill in motion.json, MOTION.md, tokens.json and CREDITS.md, add poster.jpg (a frame of a film made in it, 960 to 3840 pixels wide, at most 500 KB) and any tool directory, then: motionhub share ${basename(out)}`);
    return 0;
  }
  if (!slug) { console.error('usage: motionhub get <slug> [--out <dir>]'); return 2; }
  const out = resolve(value('--out') ?? 'motion');
  const row = await getMotion(slug, out, base);
  console.log(`${row.slug} ${row.version} in ${out}: read its MOTION.md and tokens.json before drawing. Credit: ${row.name.en} by ${row.authors.map((a) => a.name).join(', ')}, ${base}/m/${row.slug}/, ${row.license.text}`);
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

/** A new motion's starting files, by path: every required file but the poster, with what each part is for. */
export function scaffold(slug, author) {
  const title = slug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
  const color = (hex) => ({colorSpace: 'srgb', components: [1, 3, 5].map((i) => Math.round((parseInt(hex.slice(i, i + 2), 16) / 255) * 10000) / 10000), hex});
  return new Map([
    ['motion.json', JSON.stringify({spec: 'motion/0.1', slug, version: '1.0.0', name: {en: title}, line: {en: `One sentence: what ${title} looks like and what it is for.`},
      authors: [{name: author?.name || author?.login || 'Your name', github: author?.login || 'your-github-login'}], license: {text: 'CC-BY-4.0', code: 'MIT'}, tags: []}, null, 2) + '\n'],
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
 * Check a motion for the hub as its pull request will be checked, under the person's GitHub account and against what
 * is published for its slug; with `pr`, fork this repository, commit it signed off as the person's git identity and
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
  const published = (await index(base)).find((m) => m.slug === manifest.slug);
  const was = published ? await (await get(`${base}/m/${published.slug}/motion.json`)).json() : undefined;
  const issues = checkMotion(dir, {author: account.login, was});
  if (issues.length) throw new Error(`${dir} does not pass the hub's checks:\n${issues.map((i) => `${i.at}  ${i.code}  ${i.message}`).join('\n')}`);
  const what = `${published ? 'Update' : 'Add'} ${manifest.name.en} ${manifest.version}`;
  if (!pr) return `${manifest.slug} ${manifest.version} passes the hub's checks as ${account.login}${published ? `, after ${published.version}` : ''}. Nothing is published yet: run again with --pr to open "${what}" on github.com/${REPO}.`;
  const clone = mkdtempSync(join(tmpdir(), 'motionhub-'));
  try {
    const branch = `motion/${manifest.slug}-${manifest.version}`;
    run('gh', ['repo', 'fork', REPO, '--clone=false']);
    must('git', ['clone', '--quiet', `https://github.com/${REPO}.git`, clone]);
    must('git', ['checkout', '--quiet', '-b', branch], clone);
    rmSync(join(clone, 'motions', manifest.slug), {recursive: true, force: true});
    cpSync(dir, join(clone, 'motions', manifest.slug), {recursive: true});
    must('git', ['add', join('motions', manifest.slug)], clone);
    must('git', ['commit', '--quiet', '--signoff', '-m', what], clone);
    must('git', ['-c', 'credential.helper=', '-c', 'credential.helper=!gh auth git-credential', 'push', '--quiet', `https://github.com/${account.login}/motions.git`, `HEAD:refs/heads/${branch}`], clone);
    return must('gh', ['pr', 'create', '--repo', REPO, '--head', `${account.login}:${branch}`, '--title', what, '--body', `${manifest.line.en}\n\nChecked with @motionhub/cli.`], clone);
  } finally { rmSync(clone, {recursive: true, force: true}); }
}
