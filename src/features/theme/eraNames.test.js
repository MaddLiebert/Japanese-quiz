import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eraName } from './eraNames.js';

test('eraName: Heian memetakan nama UI klasik', () => {
  assert.equal(eraName('shop', 'heian'), '市');
  assert.equal(eraName('gacha', 'heian'), '貝合わせ');
  assert.equal(eraName('medaru', 'heian'), '文');
  assert.equal(eraName('inventory', 'heian'), '箪笥');
  assert.equal(eraName('profile', 'heian'), '系図');
  assert.equal(eraName('quest', 'heian'), '日課');
  assert.equal(eraName('rank', 'heian'), '位');
});

test('eraName: era lain → fallback (nama sekarang)', () => {
  assert.equal(eraName('shop', 'edo', 'Warung'), 'Warung');
  assert.equal(eraName('shop', 'showa', 'Warung'), 'Warung');
});

test('eraName: default fallback = string kosong', () => {
  assert.equal(eraName('shop', 'edo'), '');
  assert.equal(eraName('shop', 'era-belum-ada'), '');
});

test('eraName: key tak dikenal → fallback', () => {
  assert.equal(eraName('tidak-ada', 'heian', 'X'), 'X');
  assert.equal(eraName('tidak-ada', 'heian'), '');
});

test('eraName: eraId aneh → fallback, tidak melempar', () => {
  assert.equal(eraName('shop', undefined, 'W'), 'W');
  assert.equal(eraName('shop', null, 'W'), 'W');
});
