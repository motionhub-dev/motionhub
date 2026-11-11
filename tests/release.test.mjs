import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createManifest, verifyManifest} from '../tools/release.mjs';

const sha = 'a'.repeat(40);
function artifact() {
  const root = mkdtempSync(join(tmpdir(), 'release-'));
  mkdirSync(join(root, 'worker'));
  mkdirSync(join(root, 'assets'));
  writeFileSync(join(root, 'worker/worker.mjs'), 'export default {};');
  writeFileSync(join(root, 'assets/index.html'), '<html></html>');
  mkdirSync(join(root, 'player-assets/play/@test/demo'), {recursive: true});
  writeFileSync(join(root, 'player-assets/_headers'), 'sandbox');
  writeFileSync(join(root, 'player-assets/play/@test/demo/index.html'), '<html></html>');
  createManifest(root, 'site', sha, '12');
  return root;
}
test('publishing rejects changed, extra, linked, or wrong-source artifacts', () => {
  const root = artifact();
  assert.equal(verifyManifest(root, 'site', sha, '12').sourceSha, sha);
  assert.throws(() => verifyManifest(root, 'site', 'b'.repeat(40), '12'));
  assert.throws(() => verifyManifest(root, 'site', sha, '13'));
  writeFileSync(join(root, 'assets/index.html'), 'changed');
  assert.throws(() => verifyManifest(root, 'site', sha, '12'));
  const extra = artifact(); writeFileSync(join(extra, 'extra.js'), '');
  assert.throws(() => verifyManifest(extra, 'site', sha, '12'));
  const linked = artifact(); symlinkSync('/etc/hostname', join(linked, 'assets/link'));
  assert.throws(() => verifyManifest(linked, 'site', sha, '12'));
});
