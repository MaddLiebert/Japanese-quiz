import test from 'node:test';
import assert from 'node:assert/strict';
import { clearFxIfCurrent, isCurrentToken } from './fxLifecycle.js';

// Keluhan user: "suara sama efek murasaki gak match, efek kecepetan".
// Akar masalah: timer hold efek LAMA (mis. 蒼 2.2s) masih berjalan dan
// memanggil setFx(null) saat efek 茈 BARU sudah tampil → 茈 mati prematur.

test('clearFxIfCurrent: timer lama TIDAK boleh mematikan fx baru', () => {
  const fx = { id: 7 };
  // timer milik fx yang masih tampil → bersihkan
  assert.equal(clearFxIfCurrent(fx, 7), null);
  // fx sudah digantikan yang baru (id beda) → JANGAN sentuh
  assert.equal(clearFxIfCurrent(fx, 6), fx);
  // tidak ada fx → tetap null (idempoten)
  assert.equal(clearFxIfCurrent(null, 7), null);
});

test('isCurrentToken: hanya generasi terbaru yang boleh apply', () => {
  assert.equal(isCurrentToken(5, 5), true);
  assert.equal(isCurrentToken(5, 4), false);
  assert.equal(isCurrentToken(0, 0), true);
});
