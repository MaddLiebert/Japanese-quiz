// leaderboardApi.test.js — `fetchPublicProfile` 訪問 (docs/public-profile.md §8).
//
// Modul ini menyentuh Supabase + localStorage, jadi di sini supabaseClient
// DIGANTI (module hook) dengan klien palsu, dan localStorage di-stub. Yang
// dibuktikan: RPC yang dipanggil benar, whitelist lewat apa adanya, cache TTL
// 60 dtk benar-benar memakai jalur yang sudah ada, dan KUOTA read terpakai
// (consume('read')) — termasuk bukti cache-hit TIDAK memakan kuota.
import test from 'node:test';
import assert from 'node:assert/strict';
import module from 'node:module';

// ── localStorage palsu (kuota disimpan di sini) ─────────────────────────────
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

// ── Supabase palsu — perilaku diatur per-test ───────────────────────────────
const calls = [];
let rpcImpl = async () => ({ data: [], error: null });
globalThis.__FAKE_SB__ = {
  rpc: (name, args) => { calls.push([name, args]); return rpcImpl(name, args); },
};

// Resolusi import tanpa ekstensi (pola repo) + ganti supabaseClient dengan palsu.
module.registerHooks({
  resolve(spec, ctx, next) {
    if (spec.startsWith('.') && !/\.[a-z]+$/i.test(spec)) {
      try { return next(spec + '.js', ctx); } catch { /* fallthrough */ }
    }
    return next(spec, ctx);
  },
  load(url, ctx, next) {
    if (url.endsWith('/sync/supabaseClient.js')) {
      return {
        format: 'module',
        shortCircuit: true,
        source: `
          export const isSupabaseConfigured = true;
          export const supabase = globalThis.__FAKE_SB__;
        `,
      };
    }
    return next(url, ctx);
  },
});

const { fetchPublicProfile, clearLeaderboardCache } = await import('./leaderboardApi.js');
const { QUOTA_KEY, readQuota } = await import('../sync/rateLimit.js');

const reset = () => { calls.length = 0; store.clear(); clearLeaderboardCache(); };

const ROW = {
  id: 'aaaa1111-0000-0000-0000-000000000001',
  display_name: 'Hina',
  avatar: 'data:image/jpeg;base64,ZZ',
  xp: 4321,
  level: 44,
  streak: 9,
  accuracy: 87,
  updated_at: '2026-10-14T00:00:00.000Z',
};

test('fetchPublicProfile: memanggil RPC public_profile dgn { p_id: id }', async () => {
  reset();
  rpcImpl = async () => ({ data: [ROW], error: null });
  const { row, error, cached } = await fetchPublicProfile(ROW.id);
  assert.deepEqual(calls, [['public_profile', { p_id: ROW.id }]]);
  assert.equal(error, null);
  assert.equal(cached, false);
  // Baris lewat APA ADANYA (whitelist ditegakkan server-side oleh SQL).
  assert.deepEqual(row, ROW);
});

test('fetchPublicProfile: kembalian KOSONG → row === null (privat / tak ada)', async () => {
  reset();
  rpcImpl = async () => ({ data: [], error: null });
  const { row, error } = await fetchPublicProfile('bbbb2222-0000-0000-0000-000000000002');
  assert.equal(row, null);
  assert.equal(error, null);
});

test('fetchPublicProfile: error RPC → diteruskan sebagai string, row null', async () => {
  reset();
  rpcImpl = async () => ({ data: null, error: { message: 'permission denied' } });
  const { row, error } = await fetchPublicProfile('cccc3333-0000-0000-0000-000000000003');
  assert.equal(row, null);
  assert.equal(error, 'permission denied');
});

test('fetchPublicProfile: id kosong → tidak memanggil RPC', async () => {
  reset();
  const { row, error } = await fetchPublicProfile('');
  assert.equal(row, null);
  assert.equal(error, null);
  assert.equal(calls.length, 0);
});

test('fetchPublicProfile: CACHE 60 dtk — panggilan kedua tidak memanggil RPC & tak makan kuota', async () => {
  reset();
  rpcImpl = async () => ({ data: [ROW], error: null });

  await fetchPublicProfile(ROW.id);
  const afterFirst = readQuota(localStorage).read;
  assert.equal(afterFirst, 1, 'panggilan pertama makan 1 kuota read');

  const second = await fetchPublicProfile(ROW.id);
  assert.equal(second.cached, true, 'panggilan kedua dilayani cache');
  assert.equal(calls.length, 1, 'RPC tidak dipanggil ulang');
  assert.equal(readQuota(localStorage).read, afterFirst, 'cache-hit TIDAK menambah kuota');
});

test('fetchPublicProfile: force melewati cache → RPC dipanggil lagi + kuota naik', async () => {
  reset();
  rpcImpl = async () => ({ data: [ROW], error: null });

  await fetchPublicProfile(ROW.id);
  const afterFirst = readQuota(localStorage).read;

  const forced = await fetchPublicProfile(ROW.id, { force: true });
  assert.equal(forced.cached, false);
  assert.equal(calls.length, 2, 'force memanggil RPC lagi');
  assert.equal(readQuota(localStorage).read, afterFirst + 1, 'force tetap dihitung kuota');
  assert.equal(store.has(QUOTA_KEY), true);
});

test('fetchPublicProfile: cache PER-ID — id berbeda tidak saling menimpa', async () => {
  reset();
  rpcImpl = async () => ({ data: [ROW], error: null });
  await fetchPublicProfile('id-1');
  await fetchPublicProfile('id-2');
  assert.equal(calls.length, 2, 'dua id berbeda → dua RPC');
});
