import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequestCache, DEFAULT_TTL_MS } from './requestCache.js';

test('run: memanggil fn sekali, lalu menyajikan cache dalam TTL', async () => {
  let t = 1000;
  let calls = 0;
  const cache = createRequestCache({ ttlMs: 60000, now: () => t });
  const fn = async () => { calls += 1; return { rows: [1, 2] }; };

  const a = await cache.run('lb', fn);
  assert.equal(calls, 1);
  assert.equal(a.cached, false);
  assert.deepEqual(a.value, { rows: [1, 2] });

  t = 30000; // masih dalam TTL
  const b = await cache.run('lb', fn);
  assert.equal(calls, 1);          // TIDAK memanggil ulang
  assert.equal(b.cached, true);
  assert.deepEqual(b.value, a.value);
});

test('run: kedaluwarsa setelah TTL → memanggil ulang', async () => {
  let t = 0;
  let calls = 0;
  const cache = createRequestCache({ ttlMs: 1000, now: () => t });
  const fn = async () => { calls += 1; return calls; };

  await cache.run('x', fn);
  t = 1500; // lewat TTL
  await cache.run('x', fn);
  assert.equal(calls, 2);
});

test('run: force melewati cache (tombol Segarkan)', async () => {
  let calls = 0;
  const cache = createRequestCache({ ttlMs: 60000, now: () => 0 });
  const fn = async () => { calls += 1; return calls; };
  await cache.run('x', fn);
  await cache.run('x', fn, { force: true });
  assert.equal(calls, 2);
});

test('run: request paralel dengan key sama digabung (dedup) → fn sekali', async () => {
  let calls = 0;
  let resolveFn;
  const cache = createRequestCache({ ttlMs: 60000, now: () => 0 });
  const fn = () => { calls += 1; return new Promise((res) => { resolveFn = res; }); };

  const p1 = cache.run('k', fn);
  const p2 = cache.run('k', fn);
  await Promise.resolve(); // beri kesempatan fn() (microtask) terpanggil
  resolveFn('hasil');
  const [r1, r2] = await Promise.all([p1, p2]);
  assert.equal(calls, 1);            // hanya satu request
  assert.equal(r1.value, 'hasil');
  assert.equal(r2.deduped, true);    // yang kedua menandai dedup
  assert.equal(r2.value, 'hasil');
});

test('run: fn gagal → error dilempar, tidak di-cache, in-flight dibersihkan', async () => {
  let calls = 0;
  const cache = createRequestCache({ ttlMs: 60000, now: () => 0 });
  const fn = async () => { calls += 1; throw new Error('boom'); };

  await assert.rejects(() => cache.run('e', fn), /boom/);
  // Setelah gagal, boleh dicoba lagi (tidak nyangkut di cache).
  await assert.rejects(() => cache.run('e', fn), /boom/);
  assert.equal(calls, 2);
  assert.equal(cache.size(), 0);
});

test('age & peek: melaporkan umur & nilai cache', async () => {
  let t = 100;
  const cache = createRequestCache({ ttlMs: 60000, now: () => t });
  await cache.run('k', async () => 'v');
  t = 700;
  assert.equal(cache.age('k'), 600);
  assert.equal(cache.peek('k'), 'v');
  assert.equal(cache.age('belum-ada'), Infinity);
});

test('clear: mengosongkan cache', async () => {
  const cache = createRequestCache({ ttlMs: 60000, now: () => 0 });
  await cache.run('k', async () => 'v');
  assert.equal(cache.size(), 1);
  cache.clear();
  assert.equal(cache.size(), 0);
});

test('DEFAULT_TTL_MS wajar (1 menit)', () => {
  assert.equal(DEFAULT_TTL_MS, 60000);
});
