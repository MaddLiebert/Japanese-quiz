import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dayKey, emptyQuota, readQuota, writeQuota, consume, writeCooldown, markWrite,
  backoffDelay, canReload, markReload, quotaSummary,
  QUOTA_KEY, RELOAD_KEY, DAILY_LIMIT, MIN_INTERVAL, BACKOFF_BASE, BACKOFF_MAX,
} from './rateLimit.js';

// Storage palsu minimal (Map) untuk tes murni.
const fakeStorage = () => {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    _map: m,
  };
};

test('dayKey: format UTC YYYY-MM-DD', () => {
  assert.equal(dayKey(Date.UTC(2026, 9, 12, 23, 59)), '2026-10-12');
});

test('readQuota: storage null → kuota kosong (fail-open, tidak crash)', () => {
  const q = readQuota(null, 1000);
  assert.equal(q.write, 0);
  assert.equal(q.day, dayKey(1000));
});

test('consume: menaikkan hitungan & mengembalikan sisa', () => {
  const s = fakeStorage();
  const r1 = consume(s, 'write', 1000);
  assert.equal(r1.ok, true);
  assert.equal(r1.remaining, DAILY_LIMIT.write - 1);
  const r2 = consume(s, 'write', 2000);
  assert.equal(r2.quota.write, 2);
});

test('consume: menolak setelah limit harian tercapai', () => {
  const s = fakeStorage();
  // Isi kuota sampai penuh.
  writeQuota(s, { day: dayKey(5000), write: DAILY_LIMIT.write, read: 0, auth: 0, lastWrite: 0 });
  const r = consume(s, 'write', 5000);
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'quota');
  assert.equal(r.remaining, 0);
});

test('consume: reset otomatis saat hari UTC berganti', () => {
  const s = fakeStorage();
  writeQuota(s, { day: '2020-01-01', write: 999, read: 0, auth: 0, lastWrite: 0 });
  const r = consume(s, 'write', Date.UTC(2026, 9, 12, 6));
  assert.equal(r.ok, true);
  assert.equal(r.quota.write, 1); // hari baru → hitungan mulai dari 0
});

test('consume: kind tanpa limit → selalu ok (remaining Infinity)', () => {
  const s = fakeStorage();
  const r = consume(s, 'unknown-kind', 1000, {});
  assert.equal(r.ok, true);
  assert.equal(r.remaining, Infinity);
});

test('writeCooldown: 0 saat belum pernah tulis, lalu positif setelah markWrite', () => {
  const s = fakeStorage();
  assert.equal(writeCooldown(s, 1000), 0); // lastWrite 0 → elapsed besar
  markWrite(s, 10000);
  assert.equal(writeCooldown(s, 12000, 15000), 13000); // 15000 - (12000-10000)
  assert.equal(writeCooldown(s, 30000, 15000), 0);      // sudah lewat jeda
});

test('backoffDelay: 0 saat tak ada gagal, naik eksponensial & dibatasi max', () => {
  assert.equal(backoffDelay(0), 0);
  const d1 = backoffDelay(1, { rand: () => 0.5 });
  const d2 = backoffDelay(2, { rand: () => 0.5 });
  assert.equal(d1, BACKOFF_BASE);        // 15 dtk
  assert.equal(d2, BACKOFF_BASE * 2);    // 30 dtk
  const big = backoffDelay(20, { rand: () => 0.5 });
  assert.equal(big, BACKOFF_MAX);        // mentok di 15 menit
});

test('backoffDelay: jitter menjaga dalam rentang ±20%', () => {
  const lo = backoffDelay(1, { rand: () => 0 });
  const hi = backoffDelay(1, { rand: () => 1 });
  assert.equal(lo, Math.round(BACKOFF_BASE * 0.8));
  assert.equal(hi, Math.round(BACKOFF_BASE * 1.2));
});

test('canReload: menolak reload kedua dalam jeda, izinkan setelahnya', () => {
  const s = fakeStorage();
  assert.equal(canReload(s, 1000, 60000), true); // belum pernah reload
  markReload(s, 1000);
  assert.equal(canReload(s, 30000, 60000), false); // masih dalam jeda
  assert.equal(canReload(s, 62000, 60000), true);  // sudah lewat jeda
});

test('canReload: storage null → selalu boleh (fail-open)', () => {
  assert.equal(canReload(null), true);
});

test('quotaSummary: bentuk ringkasan untuk UI', () => {
  const s = fakeStorage();
  consume(s, 'write', 1000);
  consume(s, 'read', 1000);
  consume(s, 'read', 1000);
  const sum = quotaSummary(s, 1000);
  assert.equal(sum.write.used, 1);
  assert.equal(sum.write.limit, DAILY_LIMIT.write);
  assert.equal(sum.read.used, 2);
  assert.equal(sum.read.remaining, DAILY_LIMIT.read - 2);
});

test('konstanta: limit & jeda wajar (di bawah kuota gratis)', () => {
  assert.equal(DAILY_LIMIT.write, 300);
  assert.equal(DAILY_LIMIT.read, 900);
  assert.equal(MIN_INTERVAL.write, 15000);
  assert.equal(QUOTA_KEY, 'net_quota_v1');
  assert.equal(RELOAD_KEY, 'sync_reload_guard_v1');
});
