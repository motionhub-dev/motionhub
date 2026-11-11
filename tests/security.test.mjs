// Regression tests for authorization and credential disclosure, using synthetic values only.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {authorProblem, ownerId} from '../tools/security/ownership.mjs';
import {sensitiveFile} from '../tools/security/package.mjs';

const motion = login => ({authors: [{github: login}]});
const accounts = new Map([['old', 7], ['renamed', 7], ['other', 8]]);
test('one author can rename but cannot grant or transfer ownership', () => {
  assert.equal(authorProblem(motion('renamed'), motion('old'), accounts), null);
  assert.equal(ownerId(motion('renamed'), accounts), 7);
  assert.ok(authorProblem(motion('other'), motion('old'), accounts));
  assert.ok(authorProblem({authors: [{github: 'old'}, {github: 'other'}]}, motion('old'), accounts));
  assert.ok(authorProblem(motion('missing'), motion('old'), accounts));
  assert.equal(ownerId(motion('missing'), accounts), undefined);
});
test('credential scanning blocks nested paths and values without echoing them', () => {
  for (const path of ['react/.env', 'react/.env.production', 'react/.AWS/credentials', 'react/id_ed25519', 'react/private.key', 'react/node_modules/a.js']) {
    assert.equal(sensitiveFile(path, new Uint8Array())?.code, 'hub.secret', path);
  }
  for (const value of ['-----BEGIN ' + 'PRIVATE KEY-----', 'ghp_' + 'A'.repeat(36)]) {
    const issue = sensitiveFile('react/config.txt', new TextEncoder().encode(value));
    assert.equal(issue.code, 'hub.secret');
    assert.ok(!JSON.stringify(issue).includes(value));
  }
  assert.equal(sensitiveFile('react/picture.png', new Uint8Array([0xff, 0x89])), null);
});
