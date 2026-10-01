import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePath } from './path.js';

test('normalizePath: buang trailing slash (kecuali root)', () => {
  assert.equal(normalizePath('/learn/'), '/learn');
  assert.equal(normalizePath('/learn'), '/learn');
  assert.equal(normalizePath('/'), '/');
  assert.equal(normalizePath('///'), '/');
});

test('normalizePath: buang query & hash', () => {
  assert.equal(normalizePath('/n5-exam?x=1'), '/n5-exam');
  assert.equal(normalizePath('/n5-exam#top'), '/n5-exam');
  assert.equal(normalizePath('/shop/?a=1#b'), '/shop');
});

test('normalizePath: input bukan string → root', () => {
  assert.equal(normalizePath(undefined), '/');
  assert.equal(normalizePath(null), '/');
  assert.equal(normalizePath(123), '/');
  assert.equal(normalizePath(''), '/');
});
