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

test('eraName: Meiji memetakan nama UI zaman modern (文明開化)', () => {
  assert.equal(eraName('shop', 'meiji'), '商店');
  assert.equal(eraName('gacha', 'meiji'), '福引');
  assert.equal(eraName('medaru', 'meiji'), '円');
  assert.equal(eraName('inventory', 'meiji'), '鞄');
  assert.equal(eraName('profile', 'meiji'), '戸籍');
  assert.equal(eraName('quest', 'meiji'), '課業');
  assert.equal(eraName('rank', 'meiji'), '階級');
});

test('eraName: Shōwa memetakan nama UI kota beton & ujian (PRD §8)', () => {
  assert.equal(eraName('shop', 'showa'), '商店街');
  assert.equal(eraName('gacha', 'showa'), 'ガチャガチャ');
  assert.equal(eraName('medaru', 'showa'), '円');
  assert.equal(eraName('inventory', 'showa'), 'ランドセル');
  assert.equal(eraName('profile', 'showa'), '履歴書');
  assert.equal(eraName('quest', 'showa'), '宿題');
  assert.equal(eraName('rank', 'showa'), '偏差値');
});

test('eraName: era lain → fallback (nama sekarang)', () => {
  assert.equal(eraName('shop', 'cyberpunk', 'Warung'), 'Warung');
  assert.equal(eraName('shop', 'anime', 'Warung'), 'Warung');
});

test('eraName: default fallback = string kosong', () => {
  assert.equal(eraName('shop', 'cyberpunk'), '');
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
