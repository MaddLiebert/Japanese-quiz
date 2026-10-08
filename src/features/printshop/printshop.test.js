import test from 'node:test';
import assert from 'node:assert/strict';
import { PRINT_SHOP_ARTIFACTS, isPrintShopUnlocked, artifactById } from './printshop.js';

test('isPrintShopUnlocked: hanya saat kondisi terpenuhi', () => {
  assert.equal(isPrintShopUnlocked({ era: 'meiji', level: 50, editionsPrinted: 5 }), true);
  assert.equal(isPrintShopUnlocked({ era: 'edo', level: 50, editionsPrinted: 5 }), false);
  assert.equal(isPrintShopUnlocked({ era: 'meiji', level: 40, editionsPrinted: 5 }), false);
  assert.equal(isPrintShopUnlocked({ era: 'meiji', level: 50, editionsPrinted: 2 }), false);
});

test('isPrintShopUnlocked: progress kosong → false', () => {
  assert.equal(isPrintShopUnlocked(), false);
  assert.equal(isPrintShopUnlocked({}), false);
});

test('artifacts: ada heian/edo/future', () => {
  const ids = PRINT_SHOP_ARTIFACTS.map((a) => a.id);
  assert.deepEqual(ids, ['heian', 'edo', 'future']);
  assert.equal(artifactById('future').id_text, '??? — Cyberpunk');
});
