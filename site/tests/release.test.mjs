import {test} from 'node:test';
import assert from 'node:assert/strict';
import {publishObject} from '../ci/release.mjs';

test('R2 creates only after 404, compares existing bytes and handles conditional races', async () => {
  const data = Buffer.from('package'), calls = [];
  const client = statuses => ({fetch: async (_url, init) => {
    calls.push(init);
    const status = statuses.shift();
    return new Response(status === 200 ? data : null, {status});
  }});
  assert.equal(await publishObject(client([200]), 'https://r2.test/key', data, 'application/gzip'), 'kept');
  assert.equal(calls.length, 1);
  calls.length = 0;
  assert.equal(await publishObject(client([404, 200]), 'https://r2.test/key', data, 'application/gzip'), 'published');
  assert.equal(calls[1].headers['if-none-match'], '*');
  assert.equal(await publishObject(client([404, 412, 200]), 'https://r2.test/key', data, 'application/gzip'), 'kept');
  for (const status of [401, 403, 429, 500]) {
    calls.length = 0;
    await assert.rejects(publishObject(client([status]), 'https://r2.test/key', data, 'application/gzip'));
    assert.equal(calls.length, 1, `no PUT after ${status}`);
  }
  await assert.rejects(publishObject(client([200]), 'https://r2.test/key', Buffer.from('changed'), 'application/gzip'));
});
