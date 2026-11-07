import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';

test('artifact upload prints only the canonical Preview link', async () => {
  const root = await mkdtemp(join(tmpdir(), 'motionhub-cli-'));
  try {
    await mkdir(join(root, '.motionhub'));
    await writeFile(join(root, '.motionhub/artifact-token'), 'test-credential');
    const html = join(root, 'index.html'), mock = join(root, 'mock.mjs');
    await writeFile(html, '<h1>Example</h1>');
    const id = '12345678-1234-1234-1234-123456789abc';
    await writeFile(mock, `
      import assert from 'node:assert/strict';
      globalThis.fetch = async (url, options) => {
        assert.equal(url, 'https://motionhub.dev/api/artifacts');
        assert.equal(options.method, 'POST');
        assert.equal(options.headers.authorization, 'Bearer test-credential');
        return Response.json({id: '${id}', preview: '/artifact/${id}/preview'});
      };
    `);
    const {stdout} = await promisify(execFile)(process.execPath, ['--import', mock,
      fileURLToPath(new URL('../bin/motionhub.mjs', import.meta.url)), 'artifact', 'upload', html],
      {env: {...process.env, HOME: root, MOTIONHUB_ARTIFACT_ORIGIN: 'https://motionhub.dev'}});
    assert.equal(stdout, `Preview: https://motionhub.dev/artifact/${id}/preview\n`);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});
