// Private motions from the command line (tools/private-cli.mjs, tools/hub.mjs get --private): the real motionhub
// command in a child process, signed in with a token in a home of its own, against motionhub.dev's /api/private/ as a
// stand-in fetch records and answers it (motionhub-dev/motionhub-web site/private-motions.mjs is the service).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';
import {packPrivate} from '../tools/private-cli.mjs';

const BIN = fileURLToPath(new URL('../bin/motionhub.mjs', import.meta.url));
const RED = fileURLToPath(new URL('../motions/@iamsuosi/red-pencil', import.meta.url));
const sha = (b) => createHash('sha256').update(b).digest('hex');

// the stand-in: it logs each request (method, path, authorization, body's SHA-256) and answers from TEST_STATE
const MOCK = `
import {appendFileSync, readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
globalThis.fetch = async (url, options = {}) => {
  const {pathname} = new URL(url), method = options.method ?? 'GET';
  const body = options.body ? Buffer.from(options.body) : null;
  appendFileSync(process.env.TEST_LOG, JSON.stringify({method, path: pathname, auth: options.headers?.authorization, type: options.headers?.['content-type'], sha256: body && createHash('sha256').update(body).digest('hex')}) + '\\n');
  const state = JSON.parse(readFileSync(process.env.TEST_STATE, 'utf8'));
  const answer = state[method + ' ' + pathname];
  if (!answer) return Response.json({error: 'not found'}, {status: 404});
  if (answer.file) return new Response(readFileSync(answer.file));
  return Response.json(answer.json, {status: answer.status ?? 200});
};
`;

function setup() {
  const root = mkdtempSync(join(tmpdir(), 'motionhub-private-'));
  mkdirSync(join(root, 'home/.motionhub'), {recursive: true});
  writeFileSync(join(root, 'home/.motionhub/artifact-token'), 'test-credential');
  writeFileSync(join(root, 'mock.mjs'), MOCK);
  // a motion of Ana's own, in the format: red-pencil's files under her scope and authorship
  const dir = join(root, 'ledger');
  cpSync(RED, dir, {recursive: true});
  const m = JSON.parse(readFileSync(join(dir, 'motion.json'), 'utf8'));
  writeFileSync(join(dir, 'motion.json'), JSON.stringify({...m, scope: 'ana', slug: 'ledger', version: '1.0.0', authors: [{...m.authors[0], name: 'Ana', github: 'ana'}]}, null, 2));
  mkdirSync(join(root, 'project'));
  const state = (s) => writeFileSync(join(root, 'state.json'), JSON.stringify(s));
  state({});
  const run = (args, cwd = root) => promisify(execFile)(process.execPath, ['--import', join(root, 'mock.mjs'), BIN, ...args],
    {cwd, env: {...process.env, HOME: join(root, 'home'), MOTIONHUB_ARTIFACT_ORIGIN: 'https://motionhub.dev', TEST_LOG: join(root, 'log'), TEST_STATE: join(root, 'state.json')}})
    .then(({stdout}) => ({code: 0, stdout}), (e) => ({code: e.code, stdout: e.stdout, stderr: e.stderr}));
  const log = () => existsSync(join(root, 'log')) ? readFileSync(join(root, 'log'), 'utf8').trim().split('\n').map((l) => JSON.parse(l)) : [];
  return {root, dir, state, run, log, done: () => rmSync(root, {recursive: true, force: true})};
}

test('push checks the motion against the format, packs it under its id and keeps it signed in', async () => {
  const t = setup();
  try {
    const {bytes, id, version} = packPrivate(t.dir);
    assert.deepEqual([id, version], ['@ana/ledger', '1.0.0']);
    t.state({'POST /api/private/motions': {status: 201, json: {id, version, sha256: sha(bytes), bytes: bytes.length, kept: false}}});
    const r = await t.run(['private', 'push', t.dir]);
    assert.equal(r.code, 0, r.stderr);
    assert.match(r.stdout, /@ana\/ledger 1\.0\.0 kept privately on https:\/\/motionhub\.dev, for you alone/);
    assert.deepEqual(t.log(), [{method: 'POST', path: '/api/private/motions', auth: 'Bearer test-credential', type: 'application/gzip', sha256: sha(bytes)}]);
    t.state({'POST /api/private/motions': {json: {id, version, kept: true}}});
    assert.match((await t.run(['private', 'push', t.dir])).stdout, /kept privately already, these same files/);
  } finally { t.done(); }
});

test('push refuses a directory that is not a motion in the format, and asks nothing of motionhub.dev', async () => {
  const t = setup();
  try {
    rmSync(join(t.dir, 'tokens.json'));
    let r = await t.run(['private', 'push', t.dir]);
    assert.equal(r.code, 1);
    assert.match(r.stderr, /is not a motion in the format yet/);
    r = await t.run(['private', 'push', join(t.root, 'project')]);
    assert.equal(r.code, 1);
    assert.match(r.stderr, /has no motion\.json/);
    assert.deepEqual(t.log(), []);
  } finally { t.done(); }
});

test('the server\'s refusal is shown as it is', async () => {
  const t = setup();
  try {
    t.state({'POST /api/private/motions': {status: 409, json: {error: '@ana/ledger 1.0.0 is kept already, with other files: raise version in motion.json to keep this one'}}});
    const r = await t.run(['private', 'push', t.dir]);
    assert.equal(r.code, 1);
    assert.match(r.stderr, /raise version in motion\.json/);
  } finally { t.done(); }
});

test('list prints each private motion, newest version first; delete removes a version or a motion', async () => {
  const t = setup();
  try {
    t.state({
      'GET /api/private/motions.json': {json: {motions: [{slug: '@ana/ledger', version: '1.1.0', versions: [{version: '1.1.0'}, {version: '1.0.0'}]}]}},
      'DELETE /api/private/motions/@ana/ledger/1.0.0': {json: {deleted: 1}},
    });
    assert.equal((await t.run(['private', 'list'])).stdout, '@ana/ledger  1.1.0  (also 1.0.0)\n1 private motion(s); take one with: motionhub get <id> --private\n');
    let r = await t.run(['private', 'delete', '@ana/ledger@1.0.0']);
    assert.match(r.stdout, /@ana\/ledger 1\.0\.0: 1 version\(s\) deleted/);
    r = await t.run(['private', 'delete', '@ana/board']);
    assert.equal(r.code, 1);
    assert.match(r.stderr, /you keep no @ana\/board privately/);
    assert.deepEqual(t.log().map((l) => `${l.method} ${l.path}`), ['GET /api/private/motions.json', 'DELETE /api/private/motions/@ana/ledger/1.0.0', 'DELETE /api/private/motions/@ana/board']);
    for (const args of [['private'], ['private', 'push'], ['private', 'list', 'x'], ['private', 'delete', 'ledger']]) assert.notEqual((await t.run(args)).code, 0, args.join(' '));
  } finally { t.done(); }
});

test('get --private takes a private motion into the project, recorded as private, and get takes it back signed in', async () => {
  const t = setup();
  try {
    const {bytes} = packPrivate(t.dir);
    writeFileSync(join(t.root, 'ledger.tgz'), bytes);
    const row = {slug: '@ana/ledger', version: '1.0.0', private: true, package: {url: '/api/private/m/@ana/ledger/1.0.0.tgz', sha256: sha(bytes)}, versions: [{version: '1.0.0'}]};
    t.state({
      'GET /api/private/motions.json': {json: {motions: [row]}},
      'GET /api/private/m/@ana/ledger/1.0.0.tgz': {file: join(t.root, 'ledger.tgz')},
    });
    const project = join(t.root, 'project');
    let r = await t.run(['get', '@ana/ledger', '--private'], project);
    assert.equal(r.code, 0, r.stderr);
    assert.match(r.stdout, /your private motion, in motions\/@ana\/ledger, recorded in motions\.lock\.json as private/);
    assert.deepEqual(readFileSync(join(project, 'motions/@ana/ledger/motion.json')), readFileSync(join(t.dir, 'motion.json')));
    assert.deepEqual(JSON.parse(readFileSync(join(project, 'motions.lock.json'), 'utf8')), {lockfileVersion: 1, motions: {'@ana/ledger': {version: '1.0.0', sha256: sha(bytes), private: true}}});
    assert.ok(t.log().every((l) => l.auth === 'Bearer test-credential'));
    // on another computer: the lock alone brings it back, from the private motions, checked against its SHA-256
    rmSync(join(project, 'motions'), {recursive: true});
    r = await t.run(['get'], project);
    assert.equal(r.code, 0, r.stderr);
    assert.match(r.stdout, /@ana\/ledger 1\.0\.0 {2}taken into motions\/@ana\/ledger/);
    assert.equal(t.log().at(-1).path, '/api/private/m/@ana/ledger/1.0.0.tgz');
    assert.match((await t.run(['get'], project)).stdout, /@ana\/ledger 1\.0\.0 {2}ok/);
    // a package that is not the one recorded is refused, and nothing of it written
    rmSync(join(project, 'motions'), {recursive: true});
    writeFileSync(join(t.root, 'ledger.tgz'), packPrivate(t.dir).bytes.subarray(0, 40));
    r = await t.run(['get'], project);
    assert.equal(r.code, 1);
    assert.match(r.stderr, /does not match the index's SHA-256/);
    assert.ok(!existsSync(join(project, 'motions/@ana/ledger')));
    r = await t.run(['get', '@ana/other', '--private'], project);
    assert.match(r.stderr, /you keep no @ana\/other privately/);
  } finally { t.done(); }
});

test('a lock with a private entry that is not true is refused', async () => {
  const t = setup();
  try {
    const project = join(t.root, 'project');
    writeFileSync(join(project, 'motions.lock.json'), JSON.stringify({lockfileVersion: 1, motions: {'@ana/ledger': {version: '1.0.0', sha256: 'a'.repeat(64), private: 'yes'}}}));
    const r = await t.run(['get'], project);
    assert.equal(r.code, 1);
    assert.match(r.stderr, /"private": true for one of your own/);
  } finally { t.done(); }
});
