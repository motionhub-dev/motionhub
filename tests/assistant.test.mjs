import {test, beforeEach, afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, writeFileSync, readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {prepare, infer, publish} from '../.github/scripts/assistant.mjs';
let root, saved, originalFetch;
const variables = ['GH_TOKEN', 'GITHUB_REPOSITORY', 'GITHUB_EVENT_PATH', 'ANTHROPIC_API_KEY', 'CLAUDE_MODEL'];
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'assistant-'));
  originalFetch = globalThis.fetch;
  saved = new Map(variables.map(k => [k, process.env[k]]));
  process.env.GH_TOKEN = 'synthetic-token';
  process.env.GITHUB_REPOSITORY = 'owner/repo';
  process.env.GITHUB_EVENT_PATH = join(root, 'event.json');
  process.env.ANTHROPIC_API_KEY = 'synthetic-api-key';
  process.env.CLAUDE_MODEL = 'configured-model';
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const [key, value] of saved) if (value === undefined) delete process.env[key]; else process.env[key] = value;
});
const context = () => ({repo: 'owner/repo', number: 1, isPR: true, head: 'original-sha', files: []});
const inputs = (c = context()) => {
  const input = join(root, 'context.json'), output = join(root, 'result.json');
  writeFileSync(input, JSON.stringify(c));
  writeFileSync(output, JSON.stringify({summary: 'Advice @org/team', comments: [], patch: '', repo: 'evil/repo', number: 999}));
  return [input, output];
};
test('comment publication ignores model-selected targets and uses only the captured PR', async () => {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({url, init});
    return Response.json(init.method === 'POST' ? {} : {state: 'open', head: {sha: 'original-sha'}});
  };
  await publish(...inputs());
  assert.equal(calls.length, 2);
  assert.equal(calls[1].url, 'https://api.github.com/repos/owner/repo/issues/1/comments');
  assert.ok(!JSON.parse(calls[1].init.body).body.includes('@org'));
});
test('a changed PR head prevents all comment writes', async () => {
  const calls = [];
  globalThis.fetch = async (url, init) => { calls.push(init.method); return Response.json({state: 'open', head: {sha: 'new-sha'}}); };
  await publish(...inputs());
  assert.deepEqual(calls, ['GET']);
});
test('inference has no tools, no GitHub token in its prompt, and writes only validated data', async () => {
  let request;
  globalThis.fetch = async (url, init) => {
    assert.equal(url, 'https://api.anthropic.com/v1/messages');
    request = JSON.parse(init.body);
    return Response.json({stop_reason: 'end_turn', content: [{type: 'text', text: JSON.stringify({summary: 'Advice', comments: [], patch: ''})}]});
  };
  const [input, output] = inputs();
  await infer(input, output);
  assert.equal(request.tools, undefined);
  assert.equal(request.model, 'configured-model');
  assert.ok(!JSON.stringify(request).includes('synthetic-token'));
  assert.ok(!JSON.stringify(request).includes('synthetic-api-key'));
  assert.deepEqual(JSON.parse(readFileSync(output)), {summary: 'Advice', comments: [], patch: ''});
});
test('a forged author association does not replace a live repository permission check', async () => {
  writeFileSync(process.env.GITHUB_EVENT_PATH, JSON.stringify({issue: {number: 1}, sender: {login: 'outsider'}, comment: {body: '/review', author_association: 'OWNER'}}));
  globalThis.fetch = async () => Response.json({permission: 'read'});
  await assert.rejects(prepare(join(root, 'context.json')));
});
