// The videos the render workflow makes: every scoped motion with a reel whose version has none yet, and nothing it
// cannot tell is missing.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {missing, reelVersions} from '../site/player/missing.mjs';

test('every scoped motion with a reel, at its version', () => {
  const rows = reelVersions();
  assert.ok(rows.length > 0);
  for (const [id, version] of rows) {
    assert.match(id, /^@[a-z0-9-]+\/[a-z0-9-]+$/);
    assert.match(version, /^\d+\.\d+\.\d+/);
  }
});

test('missing: a 404 is missing, a 200 is made, anything else stops the run', async () => {
  const rows = [['@a/one', '1.0.0'], ['@a/two', '2.1.0']];
  const asked = [];
  const answer = (codes) => async (url, init) => { asked.push([url, init.method]); return {status: codes[asked.length - 1]}; };
  assert.deepEqual(await missing('https://x.dev', rows, answer([404, 200])), ['@a/one']);
  assert.deepEqual(asked, [['https://x.dev/m/@a/one/1.0.0.mp4', 'HEAD'], ['https://x.dev/m/@a/two/2.1.0.mp4', 'HEAD']]);
  asked.length = 0;
  await assert.rejects(missing('https://x.dev', rows, answer([503, 404])), /answers 503/);
});
