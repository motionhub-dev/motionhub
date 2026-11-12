// What check.yml runs for a pull request, by the files it changes (.github/scripts/changed.mjs): a slow step is
// skipped only when no changed file can reach it, and nothing known means everything runs.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {plan} from '../.github/scripts/changed.mjs';

const ALL = {runtime: true, remotion: true, players: true}, NONE = {runtime: false, remotion: false, players: false};

test('documents, records and the command line skip every slow step', () => {
  assert.deepEqual(plan(['SPEC.md', 'docs/cli.md', 'accounts/ana.json', 'catalogs.json', 'tools/hub.mjs', 'tools/private-cli.mjs', 'bin/motionhub.mjs', 'tests/hub.test.mjs', 'skills/motionhub/SKILL.md', '.github/workflows/publish.yaml', 'brand/BRAND.md']), NONE);
});

test('a motion, the player, the hub\'s build or its policy plays every reel', () => {
  for (const f of ['motions/@iamsuosi/red-pencil/react/reel.tsx', 'motions/@iamsuosi/red-pencil/MOTION.md', 'player/build.mjs', 'player/package-lock.json', 'tools/build.mjs', 'tools/site.mjs', 'tools/check.mjs', 'tools/security/package.mjs', 'packages/runtime/index.js'])
    assert.equal(plan(['docs/cli.md', f]).players, true, f);
});

test('the runtime runs its tests and the binding\'s; the binding runs its own alone', () => {
  assert.deepEqual(plan(['packages/runtime/sound.js']), ALL);
  assert.deepEqual(plan(['packages/remotion/index.js']), {runtime: false, remotion: true, players: false});
  assert.deepEqual(plan(['packages/hyperframes/faces.js']), NONE);
});

test('check.yml, its actions and this plan run everything; a file nobody named runs the players', () => {
  for (const f of ['.github/workflows/check.yml', '.github/actions/security-scan/action.yml', '.github/scripts/changed.mjs']) assert.deepEqual(plan([f]), ALL, f);
  assert.equal(plan(['something-new.json']).players, true);
  assert.equal(plan(['docs/nested/x.png', 'README.md']).players, false);
});

test('nothing known to have changed runs everything', () => {
  assert.deepEqual(plan([]), ALL);
});

test('from the command line, the files between two commits, and all true without them', () => {
  const dir = mkdtempSync(join(tmpdir(), 'changed-'));
  const script = fileURLToPath(new URL('../.github/scripts/changed.mjs', import.meta.url));
  const git = (...a) => execFileSync('git', a, {cwd: dir, encoding: 'utf8'}).trim();
  try {
    git('init', '-q'); git('config', 'user.email', 't@example.com'); git('config', 'user.name', 't');
    execFileSync('sh', ['-c', 'mkdir docs && echo a > docs/a.md && git add . && git commit -qm a'], {cwd: dir});
    const base = git('rev-parse', 'HEAD');
    execFileSync('sh', ['-c', 'echo b > docs/a.md && git commit -qam b'], {cwd: dir});
    const head = git('rev-parse', 'HEAD');
    const out = join(dir, 'out');
    execFileSync(process.execPath, [script, base, head], {cwd: dir, env: {...process.env, GITHUB_OUTPUT: out}});
    assert.equal(readFileSync(out, 'utf8'), 'runtime=false\nremotion=false\nplayers=false\n');
    execFileSync(process.execPath, [script, 'not-a-commit', head], {cwd: dir, env: {...process.env, GITHUB_OUTPUT: out}});
    assert.match(readFileSync(out, 'utf8'), /runtime=true\nremotion=true\nplayers=true\n$/);
  } finally { rmSync(dir, {recursive: true, force: true}); }
});
