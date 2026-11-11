// The videos the render workflow makes: every scoped motion with a reel whose version has none yet, and nothing it
// cannot tell is missing.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {missing, reelVersions} from '../player/missing.mjs';

test('every scoped motion with a reel, at its version', () => {
  const rows = reelVersions();
  assert.ok(rows.length > 0);
  for (const [id, version] of rows) {
    assert.match(id, /^@[a-z0-9-]+\/[a-z0-9-]+$/);
    assert.match(version, /^\d+\.\d+\.\d+/);
  }
});

test('missing: a published version with no video; a 404 is no, a 200 yes, anything else stops the run', async () => {
  const rows = [['@a/one', '1.0.0'], ['@a/two', '2.1.0'], ['@a/new', '3.0.0']];
  const site = {'/m/@a/one/1.0.0.tgz': 200, '/m/@a/one/1.0.0.mp4': 404, '/m/@a/two/2.1.0.tgz': 200, '/m/@a/two/2.1.0.mp4': 200, '/m/@a/new/3.0.0.tgz': 404};
  const asked = [];
  const answer = (codes) => async (url, init) => { asked.push(init.method); return {status: codes[new URL(url).pathname] ?? 500}; };
  assert.deepEqual(await missing('https://x.dev', rows, answer(site)), ['@a/one'], 'the one not yet published is not rendered');
  assert.ok(asked.every((m) => m === 'HEAD'));
  await assert.rejects(missing('https://x.dev', rows, answer({...site, '/m/@a/two/2.1.0.mp4': 503})), /answers 503/);
});
