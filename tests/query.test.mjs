// The gallery's search and filters (site/src/lib/query.mjs).
import assert from 'node:assert/strict';
import test from 'node:test';
import {countWith, meetsPicks, meetsQuery, parseQuery} from '../site/src/lib/query.mjs';

const clay = {text: 'clay world a small tabletop world iamsuosi', facets: {tag: ['clay', 'light'], by: ['iamsuosi'], colour: ['red'], type: ['sans']}};
const ink = {text: 'ink scroll hand-drawn brush iamsuosi', facets: {tag: ['ink-wash', 'light'], by: ['iamsuosi'], colour: ['blue'], type: ['serif']}};
const night = {text: 'night diagram glowing lines someone', facets: {tag: ['dark', 'line-art'], by: ['someone'], colour: ['blue', 'green'], type: ['mono']}};
const all = [clay, ink, night];
const found = (q, picks = {}) => all.filter((m) => meetsQuery(m, parseQuery(q)) && meetsPicks(m, picks));

test('a search reads words, phrases, exclusions and fields', () => {
  assert.deepEqual(parseQuery('  Clay "Small World" -retro tag:dark -by:Me '), [
    {value: 'clay'}, {value: 'small world'}, {value: 'retro', not: true}, {value: 'dark', field: 'tag'}, {value: 'me', field: 'by', not: true},
  ]);
  assert.deepEqual(parseQuery('color:blue'), [{value: 'blue', field: 'colour'}]);
  assert.deepEqual(parseQuery(''), []);
  assert.deepEqual(parseQuery(undefined), []);
});

test('a word before a colon that names no field stays a word, and an unclosed phrase still counts', () => {
  assert.deepEqual(parseQuery('https://x'), [{value: 'https://x'}]);
  assert.deepEqual(parseQuery('"tabletop wor'), [{value: 'tabletop wor'}]);
});

test('every term must hold', () => {
  assert.deepEqual(found('world'), [clay]);
  assert.deepEqual(found('iamsuosi -clay'), [ink]);
  assert.deepEqual(found('"small tabletop"'), [clay]);
  assert.deepEqual(found('"tabletop small"'), []);
  assert.deepEqual(found('tag:light -colour:red'), [ink]);
  assert.deepEqual(found('by:someone'), [night]);
  assert.deepEqual(found('tag:someone'), [], 'a field looks in that field only');
});

test('tags narrow, and any other facet widens within itself', () => {
  assert.deepEqual(found('', {tag: ['light']}), [clay, ink]);
  assert.deepEqual(found('', {tag: ['light', 'clay']}), [clay]);
  assert.deepEqual(found('', {colour: ['red', 'green']}), [clay, night]);
  assert.deepEqual(found('', {colour: ['blue'], type: ['serif']}), [ink]);
  assert.deepEqual(found('', {tag: []}), all);
});

test('a filter counts what picking it would leave, given the search and the other filters', () => {
  assert.equal(countWith(all, [], {}, 'tag', 'light'), 2);
  assert.equal(countWith(all, [], {tag: ['light']}, 'tag', 'dark'), 0);
  assert.equal(countWith(all, [], {colour: ['red']}, 'colour', 'blue'), 3);
  assert.equal(countWith(all, parseQuery('-clay'), {}, 'tag', 'light'), 1);
  assert.equal(countWith(all, [], {tag: ['light']}, 'tag', 'light'), 2, 'what is already picked counts once');
});
