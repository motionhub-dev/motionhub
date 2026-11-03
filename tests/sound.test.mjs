// A motion's sound: the checker and @motionhub/runtime/sound agree on the names, a palette draws the same samples every time,
// and a cue lands where it says.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SOUND_KIT, SOUND_ROLES, SOUND_VOICES} from '../tools/check.mjs';
import {KIT, ROLES, VOICES, renderSound, soundIssues} from '../packages/runtime/sound.js';

const SOUND = {bpm: 90, root: 147, kit: ['kick', 'hat'], roles: {land: {voice: 'click', lo: 1500, hi: 5000, len: 0.03}, move: {voice: 'swish'}, count: [{voice: 'tone', freq: 440}, {voice: 'thump', gain: 0.4}]}};

test('the checker knows the roles, voices and instruments the synthesiser draws', () => {
  assert.deepEqual(SOUND_ROLES, ROLES);
  assert.deepEqual(SOUND_VOICES, VOICES);
  assert.deepEqual(SOUND_KIT, KIT);
  assert.deepEqual(soundIssues(SOUND), []);
  assert.match(soundIssues({roles: {land: {voice: 'violin'}}}).join(), /violin/);
});

test('the same palette and cues give the same samples, finite, and a cue sounds where it says', () => {
  const quiet = {...SOUND, kit: []};
  const a = renderSound({seconds: 4, cues: [{at: 2, role: 'land'}], sound: quiet, rate: 8000});
  const b = renderSound({seconds: 4, cues: [{at: 2, role: 'land'}], sound: quiet, rate: 8000});
  assert.equal(a.length, 32000);
  assert.ok(a.every((v, i) => Number.isFinite(v) && v === b[i]));
  const energy = (from, to) => a.subarray(from * 8000, to * 8000).reduce((s, v) => s + v * v, 0);
  assert.ok(energy(2, 2.1) > 100 * energy(1, 1.9), 'the land cue is heard at 2 s and not before');
});
