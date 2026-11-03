// motionhub.dev/docs: every page's document exists and has a title, links resolve to pages, twins or GitHub, and a
// twin holds no link that only works inside the repository.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {PAGES, pagePath, readDoc, resolveLink, twin, twinPath} from '../tools/docs.mjs';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');

test('every page is a document in the repository with a # title, at a route of its own', () => {
  assert.equal(new Set(PAGES.map((p) => p.slug)).size, PAGES.length);
  assert.equal(PAGES[0].slug, 'index');
  for (const p of PAGES) {
    assert.ok(existsSync(join(ROOT, p.file)), p.file);
    assert.match(readFileSync(join(ROOT, p.file), 'utf8').replace(/^---\n[\s\S]*?\n---\n+/, ''), /^# \S/, `${p.file} starts with its title`);
    assert.match(p.slug, /^[a-z]+$/);
  }
  assert.equal(pagePath(PAGES[0]), '/docs/');
  assert.equal(twinPath(PAGES[0]), '/docs/index.md');
});

test('links resolve to a page, a twin, GitHub or stay as they are', () => {
  assert.equal(resolveLink(ROOT, 'CONTRIBUTING.md', 'SPEC.md#7-extensions'), '/docs/spec/#7-extensions');
  assert.equal(resolveLink(ROOT, 'CONTRIBUTING.md', 'SPEC.md', 'md'), 'https://motionhub.dev/docs/spec.md');
  assert.equal(resolveLink(ROOT, 'packages/runtime/README.md', '../remotion/README.md'), '/docs/remotion/');
  assert.equal(resolveLink(ROOT, 'skills/motionhub/SKILL.md', 'https://github.com/motionhub-dev/motions/blob/main/SPEC.md'), '/docs/spec/');
  assert.equal(resolveLink(ROOT, 'README.md', 'LICENSE'), 'https://github.com/motionhub-dev/motions/blob/main/LICENSE');
  assert.equal(resolveLink(ROOT, 'README.md', 'skills/motionhub'), 'https://github.com/motionhub-dev/motions/tree/main/skills/motionhub');
  assert.equal(resolveLink(ROOT, 'SPEC.md', 'https://semver.org'), 'https://semver.org');
  assert.equal(resolveLink(ROOT, 'SPEC.md', '#2-files'), '#2-files');
});

test('a twin names its page and source, and every link in it works outside the repository', () => {
  for (const p of PAGES) {
    const text = twin(ROOT, p);
    assert.match(text, new RegExp(`^# ${readDoc(ROOT, p).title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n\\n> https://motionhub\\.dev/docs/`), p.file);
    const outside = text.replace(/```[\s\S]*?```/g, '');
    for (const [, href] of outside.matchAll(/\]\(([^)\s]+)\)/g)) assert.match(href, /^(https?:|mailto:|#)/, `${p.file}: ${href}`);
  }
});
