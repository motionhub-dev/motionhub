// motionhub.dev/docs: the repository's own documents, each served as a page (site/) and as its Markdown twin at the
// same address with .md (this module, from tools/build.mjs). A document is written once, where it lives in the
// repository; the docs never hold a copy that could drift from it. No dependencies.

import {existsSync, mkdirSync, readFileSync, statSync, writeFileSync} from 'node:fs';
import {join, normalize, posix} from 'node:path';
import {REPO, SITE} from './site.mjs';

/** The docs' pages, in the order the sidebar shows them: the route under /docs/, the source and its label. */
export const DOCS = [
  {group: 'Get started', pages: [
    {slug: 'index', file: 'docs/index.md', label: 'Overview'},
    {slug: 'motion-md', file: 'docs/motion-md.md', label: 'What is MOTION.md'},
    {slug: 'use', file: 'docs/use.md', label: 'Use a motion'},
    {slug: 'cli', file: 'docs/cli.md', label: 'Command line'},
  ]},
  {group: 'Make and share', pages: [
    {slug: 'contribute', file: 'CONTRIBUTING.md', label: 'Share a motion'},
  ]},
  {group: 'Reference', pages: [
    {slug: 'spec', file: 'SPEC.md', label: 'Specification'},
    {slug: 'hub', file: 'HUB.md', label: 'The hub and its files'},
    {slug: 'skill', file: 'skills/motionhub/SKILL.md', label: 'Agent skill', title: 'Agent skill'},
  ]},
  {group: 'Engines', pages: [
    {slug: 'remotion', file: 'docs/remotion.md', label: 'Remotion', engine: 'Remotion'},
    {slug: 'hyperframes', file: 'docs/hyperframes.md', label: 'HyperFrames', engine: 'HyperFrames'},
    {slug: 'remotion-binding', file: 'packages/remotion/README.md', label: 'Remotion binding'},
    {slug: 'hyperframes-binding', file: 'packages/hyperframes/README.md', label: 'HyperFrames binding'},
    {slug: 'runtime', file: 'packages/runtime/README.md', label: 'Runtime'},
  ]},
  {group: 'About', pages: [
    {slug: 'brand', file: 'brand/BRAND.md', label: 'Brand'},
  ]},
];

export const PAGES = DOCS.flatMap((g) => g.pages.map((p) => ({...p, group: g.group})));
const BY_FILE = new Map(PAGES.map((p) => [p.file, p]));

/** A page's address on the site, and its Markdown twin's. */
export const pagePath = (p) => (p.slug === 'index' ? '/docs/' : `/docs/${p.slug}/`);
export const twinPath = (p) => `/docs/${p.slug}.md`;

/** A document's text without front matter, split into its title (the first # heading) and the rest. */
export function readDoc(root, p) {
  const text = readFileSync(join(root, p.file), 'utf8').replace(/\r\n/g, '\n').replace(/^---\n[\s\S]*?\n---\n+/, '');
  const m = /^# (.+)\n+/.exec(text);
  // a page may name itself (title) where its document's own heading speaks to another reader, as the skill's does
  return {title: p.title ?? (m ? m[1].replace(/`/g, '') : p.label), body: m ? text.slice(m[0].length) : text};
}

const BLOB = `${REPO}/blob/main/`;

/**
 * Where a link in a document goes once it is on the site: another document becomes its page (`html`) or its twin
 * (`md`); any other file in the repository its place on GitHub; everything else is left as it is.
 */
export function resolveLink(root, fromFile, href, mode = 'html') {
  if (!href || /^(#|mailto:)/.test(href)) return href;
  let path;
  const at = href.indexOf('#');
  const [target, hash] = at < 0 ? [href, ''] : [href.slice(0, at), href.slice(at)];
  if (target.startsWith(BLOB)) path = target.slice(BLOB.length);
  else if (target.startsWith(`${REPO}/tree/main/`)) path = target.slice(`${REPO}/tree/main/`.length);
  else if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('/')) return href;
  else path = normalize(posix.join(posix.dirname(fromFile), target)).replace(/\\/g, '/');
  path = path.replace(/\/$/, '');
  const page = BY_FILE.get(path) ?? BY_FILE.get(`${path}/README.md`);
  if (page) return mode === 'md' ? `${SITE}${twinPath(page)}${hash}` : `${pagePath(page)}${hash}`;
  if (path.startsWith('..')) return href;
  const full = join(root, path);
  const kind = existsSync(full) && statSync(full).isDirectory() ? 'tree' : 'blob';
  return `${REPO}/${kind}/main/${path}${hash}`;
}

/** A document's Markdown twin: its title, where it comes from, and its body with every link made absolute. */
export function twin(root, p) {
  const {title, body} = readDoc(root, p);
  const linked = body.replace(/(```[\s\S]*?```)|\]\(([^)\s]+)\)/g, (all, code, href) => (code ? code : `](${resolveLink(root, p.file, href, 'md')})`));
  return `# ${title}\n\n> ${SITE}${pagePath(p)} · from ${BLOB}${p.file}\n\n${linked.trimEnd()}\n`;
}

/** The section llms.txt ends with: every docs page's twin, by group. */
export function llmsIndex(root) {
  const lines = ['', '## Docs', '', 'Every page of motionhub.dev/docs as Markdown; all of them in one file: ' + `${SITE}/llms-full.txt`, ''];
  for (const g of DOCS) {
    lines.push(`### ${g.group}`, '');
    for (const p of g.pages) lines.push(`- [${readDoc(root, p).title}](${SITE}${twinPath(p)})`);
    lines.push('');
  }
  return lines.join('\n');
}

/** Writes /docs/<slug>.md for every page and /llms-full.txt, all of them in order. Returns the pages' paths. */
export function writeDocs(root, out) {
  mkdirSync(join(out, 'docs'), {recursive: true});
  const all = [];
  for (const p of PAGES) {
    const text = twin(root, p);
    writeFileSync(join(out, twinPath(p).slice(1)), text);
    all.push(text);
  }
  writeFileSync(join(out, 'llms-full.txt'), `# motionhub docs\n\n> Every page of ${SITE}/docs, in order.\n\n${all.map(demote).join('\n')}`);
  return PAGES.map(pagePath);
}

/** Every heading one level down, outside code blocks: a page's title becomes a section of llms-full.txt. */
function demote(text) {
  return text.split(/(```[\s\S]*?```)/).map((part, i) => (i % 2 ? part : part.replace(/^(#{1,5}) /gm, '#$1 '))).join('');
}
