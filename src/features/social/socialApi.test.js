// socialApi.test.js — akses RPC 友達 (docs/friends.md §8).
//
// SupabaseClient DIGANTI (module hook) dengan klien palsu + localStorage di-stub.
// Yang dibuktikan: RPC yang dipanggil benar, cache TTL 60 dtk memakai jalur yang
// sudah ada, KUOTA read terpakai (cache-hit TIDAK makan kuota), dan TULIS memakai
// kuota write + jeda min tulis.
import test from 'node:test';
import assert from 'node:assert/strict';
import module from 'node:module';

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const calls = [];
let rpcImpl = async () => ({ data: [], error: null });
globalThis.__FAKE_SB__ = {
  rpc: (name, args) => { calls.push([name, args]); return rpcImpl(name, args); },
};

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

const {
  fetchFriendCode, searchPlayers, fetchPlayerCard, fetchConnections,
  requestFollow, respondFollow, unfollow, clearSocialCache,
} = await import('./socialApi.js');
const { QUOTA_KEY, readQuota } = await import('../sync/rateLimit.js');

const reset = () => { calls.length = 0; store.clear(); clearSocialCache(); };

const CARD = {
  id: 'aaaa1111-0000-0000-0000-000000000001',
  display_name: 'Hina', avatar: '', level: 44, is_public: true, state: 'none',
};

test('searchPlayers: memanggil RPC search_players dgn { p_q }', async () => {
  reset();
  rpcImpl = async () => ({ data: [CARD], error: null });
  const { rows, error, cached } = await searchPlayers('482913');
  assert.deepEqual(calls, [['search_players', { p_q: '482913' }]]);
  assert.equal(error, null);
  assert.equal(cached, false);
  assert.deepEqual(rows, [CARD]);
});

test('searchPlayers: query < 2 huruf → tidak memanggil RPC', async () => {
  reset();
  const { rows } = await searchPlayers('a');
  assert.equal(rows.length, 0);
  assert.equal(calls.length, 0);
});

test('searchPlayers: cache 60 dtk → panggilan kedua tidak memanggil RPC & tak makan kuota', async () => {
  reset();
  rpcImpl = async () => ({ data: [CARD], error: null });
  await searchPlayers('hina');
  const after = readQuota(localStorage).read;
  assert.equal(after, 1);
  const second = await searchPlayers('hina');
  assert.equal(second.cached, true);
  assert.equal(calls.length, 1);
  assert.equal(readQuota(localStorage).read, after);
});

test('fetchFriendCode: RPC skalar → code string', async () => {
  reset();
  rpcImpl = async () => ({ data: '482913', error: null });
  const { code, error } = await fetchFriendCode();
  assert.equal(code, '482913');
  assert.equal(error, null);
  assert.deepEqual(calls, [['my_friend_code', undefined]]);
});

test('fetchPlayerCard: kembalian kosong → row null', async () => {
  reset();
  rpcImpl = async () => ({ data: [], error: null });
  const { row } = await fetchPlayerCard('zzz');
  assert.equal(row, null);
});

test('fetchConnections: error RPC diteruskan, rows kosong', async () => {
  reset();
  rpcImpl = async () => ({ data: null, error: { message: 'PGRST202' } });
  const { rows, error } = await fetchConnections();
  assert.equal(rows.length, 0);
  assert.equal(error, 'PGRST202');
});

test('requestFollow: RPC tulis pakai kuota write + clear cache', async () => {
  reset();
  rpcImpl = async () => ({ data: 'following', error: null });
  const { data, error } = await requestFollow(CARD.id);
  assert.equal(data, 'following');
  assert.equal(error, null);
  assert.deepEqual(calls, [['request_follow', { p_target: CARD.id }]]);
  assert.equal(readQuota(localStorage).write, 1);
  assert.equal(store.has(QUOTA_KEY), true);
});

test('respondFollow/unfollow: arg benar', async () => {
  reset();
  rpcImpl = async () => ({ data: 'friends', error: null });
  await respondFollow('req-1', true);
  assert.deepEqual(calls.at(-1), ['respond_follow', { p_requester: 'req-1', p_accept: true }]);

  // Jeda min tulis 15 dtk → bersihkan jejak tulis dulu supaya aksi kedua jalan.
  store.clear();
  clearSocialCache();
  await unfollow('tgt-1', true);
  assert.deepEqual(calls.at(-1), ['unfollow', { p_target: 'tgt-1', p_both: true }]);
});

test('tulis: jeda min tulis aktif → aksi kedua kena cooldown (tanpa RPC)', async () => {
  reset();
  rpcImpl = async () => ({ data: 'ok', error: null });
  await requestFollow('a');
  const n = calls.length;
  const second = await requestFollow('b');
  assert.equal(second.error, 'cooldown');
  assert.equal(calls.length, n, 'tidak ada RPC baru saat cooldown');
});
