// backNav.test.js — tombol kembali /u/:id tidak boleh bikin riwayat loop.
//
// Regresi yang dijaga: dulu tombol 「← Papan Peringkat」 PUSH /leaderboard
// sehingga back browser memantul /leaderboard → /u/A → /leaderboard → ...
// Aturan: mundur (navigate(-1)) hanya bila ada riwayat SPA (history.state.idx > 0);
// kalau halaman dibuka dari tautan bersama, replace (bukan push) ke fallback.
import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldGoBack, goBackOr } from './backNav.js';

test('shouldGoBack: hanya true bila ada riwayat SPA (idx > 0)', () => {
  assert.equal(shouldGoBack({ idx: 2 }), true);
  assert.equal(shouldGoBack({ idx: 1 }), true);
  // Entri pertama SPA → tak ada yang bisa dimunduri.
  assert.equal(shouldGoBack({ idx: 0 }), false);
  assert.equal(shouldGoBack(null), false);
  assert.equal(shouldGoBack(undefined), false);
  assert.equal(shouldGoBack({}), false);
  assert.equal(shouldGoBack('nope'), false);
  assert.equal(shouldGoBack({ idx: '2' }), false); // string bukan angka
});

test('goBackOr: mundur bila ada riwayat, replace bila tidak (TIDAK pernah push)', () => {
  const calls = [];
  const navigate = (...args) => calls.push(args);

  // Kasus 1: datang dari leaderboard (idx > 0) → navigate(-1).
  globalThis.window = { history: { state: { idx: 3 } } };
  goBackOr(navigate);
  assert.deepEqual(calls.at(-1), [-1]);

  // Kasus 2: dibuka dari tautan bersama (idx 0) → replace, bukan push.
  globalThis.window = { history: { state: { idx: 0 } } };
  goBackOr(navigate, '/leaderboard');
  assert.deepEqual(calls.at(-1), ['/leaderboard', { replace: true }]);

  // Kasus 3: tanpa state sama sekali → tetap replace.
  globalThis.window = { history: { state: null } };
  goBackOr(navigate, '/leaderboard');
  assert.deepEqual(calls.at(-1), ['/leaderboard', { replace: true }]);

  // Tak ada pemanggilan yang PUSH /leaderboard tanpa replace.
  const pushed = calls.filter((c) => c[0] === '/leaderboard' && !(c[1] && c[1].replace));
  assert.equal(pushed.length, 0);

  delete globalThis.window;
});
