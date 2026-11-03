// A motion's sample video: samples.json as the index carries it, the checks a video passes, and the Worker serving it
// from R2 with byte ranges.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {sampleFile, samples} from '../tools/build.mjs';
import {mp4Seconds, sampleIssues} from '../tools/samples.mjs';
import worker from '../site/worker.mjs';

const SHA = 'ab'.repeat(32);

/** The smallest MP4 the checks read: an ftyp box, a movie header of `seconds` at 1000 a second, and an avc1 sample entry */
function mp4(seconds, pad = 0) {
  const ftyp = Buffer.from('....ftypisom....isomiso2', 'latin1');
  ftyp.writeUInt32BE(0x18, 0);
  const mvhd = Buffer.alloc(108);
  mvhd.writeUInt32BE(108, 0); mvhd.write('mvhd', 4, 'latin1'); mvhd.writeUInt32BE(1000, 20); mvhd.writeUInt32BE(Math.round(seconds * 1000), 24);
  return Buffer.concat([ftyp, Buffer.from('....moov', 'latin1'), mvhd, Buffer.from('avc1', 'latin1'), Buffer.alloc(pad)]);
}

test('a sample is an H.264 MP4 of at most 20 seconds and 8 MB', () => {
  assert.equal(mp4Seconds(mp4(19.5)), 19.5);
  assert.deepEqual(sampleIssues(mp4(19.5)), []);
  assert.match(sampleIssues(mp4(31)).join(), /31\.0 seconds/);
  assert.match(sampleIssues(mp4(10, 8e6)).join(), /bytes/);
  assert.match(sampleIssues(Buffer.from('not a video at all')).join(), /not an MP4/);
});

test('samples.json names a motion that is here, within bounds; its URL is named by the video\'s hash', () => {
  const root = mkdtempSync(join(tmpdir(), 'samples-'));
  assert.deepEqual(samples(root, ['red-pencil']), {});
  writeFileSync(join(root, 'samples.json'), JSON.stringify({'red-pencil': {sha256: SHA, bytes: 500000, seconds: 20}}));
  assert.equal(samples(root, ['red-pencil'])['red-pencil'].bytes, 500000);
  assert.throws(() => samples(root, ['ink-scroll']), /not a motion here/);
  writeFileSync(join(root, 'samples.json'), JSON.stringify({'red-pencil': {sha256: SHA, bytes: 500000, seconds: 45}}));
  assert.throws(() => samples(root, ['red-pencil']), /20 seconds/);
  assert.equal(sampleFile(SHA), 'sample-abababababab.mp4');
});

test('the Worker serves a sample from R2, and a range of it for a player seeking', async () => {
  const body = 'abcdefghij';
  const store = {get: async (key, {range} = {}) => {
    if (key !== 'm/red-pencil/sample-abababababab.mp4') return null;
    const r = range?.get?.('range'), m = r && /bytes=(\d+)-(\d+)?/.exec(r);
    const offset = m ? +m[1] : undefined, length = m ? (m[2] ? +m[2] - +m[1] + 1 : body.length - +m[1]) : undefined;
    return {body: m ? body.slice(offset, offset + length) : body, size: body.length, httpEtag: '"e"', ...(m && {range: {offset, length}})};
  }};
  const env = {PACKAGES: store, ASSETS: {fetch: async () => new Response('page')}};
  const get = (path, headers = {}) => worker.fetch(new Request(`https://motionhub.dev${path}`, {headers}), env, {waitUntil() {}});
  const whole = await get('/m/red-pencil/sample-abababababab.mp4');
  assert.equal(whole.status, 200);
  assert.equal(whole.headers.get('content-type'), 'video/mp4');
  assert.equal(await whole.text(), body);
  const part = await get('/m/red-pencil/sample-abababababab.mp4', {range: 'bytes=2-5'});
  assert.equal(part.status, 206);
  assert.equal(part.headers.get('content-range'), 'bytes 2-5/10');
  assert.equal(await part.text(), 'cdef');
  assert.equal((await get('/m/red-pencil/sample-000000000000.mp4')).status, 404);
});
