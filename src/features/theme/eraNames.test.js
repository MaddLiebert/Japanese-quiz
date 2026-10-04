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

test('eraName: Edo memetakan nama UI kota cetak (chōnin)', () => {
  assert.equal(eraName('shop', 'edo'), '問屋');
  assert.equal(eraName('gacha', 'edo'), '富くじ');
  assert.equal(eraName('medaru', 'edo'), '両');
  assert.equal(eraName('inventory', 'edo'), '風呂敷');
  assert.equal(eraName('profile', 'edo'), '人別帳');
  assert.equal(eraName('quest', 'edo'), '奉公');
  assert.equal(eraName('rank', 'edo'), '番付');
});

test('eraName: era lain → fallback (nama sekarang)', () => {
  assert.equal(eraName('shop', 'meiji', 'Warung'), 'Warung');
  assert.equal(eraName('shop', 'showa', 'Warung'), 'Warung');
});

test('eraName: default fallback = string kosong', () => {
  assert.equal(eraName('shop', 'meiji'), '');
  assert.equal(eraName('shop', 'era-belum-ada'), '');
});

test('eraName: key tak dikenal → fallback', () => {
  assert.equal(eraName('tidak-ada', 'heian', 'X'), 'X');
  assert.equal(eraName('tidak-ada', 'heian'), '');
  assert.equal(eraName('tidak-ada', 'edo', 'X'), 'X');
});

test('eraName: eraId aneh → fallback, tidak melempar', () => {
  assert.equal(eraName('shop', undefined, 'W'), 'W');
  assert.equal(eraName('shop', null, 'W'), 'W');
});
