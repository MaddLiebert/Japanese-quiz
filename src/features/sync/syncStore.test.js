import test from 'node:test';
import assert from 'node:assert/strict';
import {
  readBundle, writeBundle, readMeta, touchMeta, ensureDeviceId,
  bundleToProfile, profileToBundle, SYNC_KEYS, SYNCED_KEYS, META_KEY, DEVICE_KEY,
} from './syncStore.js';

// Storage palsu (Map) — cukup untuk API localStorage yang dipakai modul ini.
const fakeStorage = () => {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    _map: m,
  };
};

test('SYNCED_KEYS: 6 key sinkron, konsisten dengan SYNC_KEYS', () => {
  assert.deepEqual(SYNCED_KEYS, [
    'username', 'user_progress_v2', 'item_progress_v2',
    'achievements_unlocked_v2', 'selected_badges', 'user_avatar_v1',
  ]);
  assert.equal(SYNCED_KEYS.length, 6);
});

test('ensureDeviceId: dibuat sekali lalu stabil', () => {
  const s = fakeStorage();
  const id1 = ensureDeviceId(s);
  const id2 = ensureDeviceId(s);
  assert.ok(id1 && id1.length > 3);
  assert.equal(id1, id2);
  assert.equal(s.getItem(DEVICE_KEY), id1);
});

test('writeBundle → readBundle: round-trip (username mentah, sisanya JSON)', () => {
  const s = fakeStorage();
  ensureDeviceId(s);
  const bundle = {
    version: 1, username: 'Madd',
    progress: { xp: 123, level: 2, medaru: 40 },
    itemProgress: { hira_a: { lastReviewed: '2026-01-01', correctCount: 3 } },
    achievements: ['novice'],
    selectedBadges: ['novice'],
    avatar: 'data:image/jpeg;base64,ZZZ',
    updatedAt: 1000,
    deviceId: 'dev1',
  };
  writeBundle(s, bundle);
  // username disimpan MENTAH (bukan JSON-quoted) agar cocok ProgressContext.
  assert.equal(s.getItem('username'), 'Madd');
  const back = readBundle(s);
  assert.equal(back.username, 'Madd');
  assert.equal(back.progress.xp, 123);
  assert.equal(back.itemProgress.hira_a.correctCount, 3);
  assert.deepEqual(back.achievements, ['novice']);
  assert.deepEqual(back.selectedBadges, ['novice']);
  assert.equal(back.avatar, 'data:image/jpeg;base64,ZZZ');
});

test('touchMeta + readMeta: updatedAt naik, deviceId ikut terisi', () => {
  const s = fakeStorage();
  touchMeta(s, 5000);
  const meta = readMeta(s);
  assert.equal(meta.updatedAt, 5000);
  assert.ok(meta.deviceId);
  assert.ok(JSON.parse(s.getItem(META_KEY)).updatedAt === 5000);
});

test('readBundle: data korup / kosong → fallback aman (tanpa crash)', () => {
  const s = fakeStorage();
  s.setItem('user_progress_v2', '{bukan json');
  s.setItem('item_progress_v2', 'null');
  const b = readBundle(s);
  assert.deepEqual(b.progress, {});
  assert.deepEqual(b.itemProgress, {});
  assert.deepEqual(b.achievements, []);
  assert.equal(b.username, '');
});

test('bundleToProfile: denormalisasi kolom skor + data JSONB', () => {
  const row = bundleToProfile({
    version: 1, username: 'Madd', updatedAt: 1710000000000,
    progress: { xp: 500, level: 6, streak: 4, maxStreak: 9, accuracy: 88, totalAnswered: 50 },
    itemProgress: {}, achievements: [], selectedBadges: [],
  }, 'user-1');
  assert.equal(row.id, 'user-1');
  assert.equal(row.display_name, 'Madd');
  assert.equal(row.xp, 500);
  assert.equal(row.level, 6);
  assert.equal(row.streak, 4);
  assert.equal(row.max_streak, 9);
  assert.equal(row.total_answered, 50);
  assert.equal(row.data.progress.xp, 500);
});

test('bundleToProfile: username kosong → "旅人" (default)', () => {
  const row = bundleToProfile({ username: '   ', progress: {} }, 'u');
  assert.equal(row.display_name, '旅人');
});

// ── Profil publik 訪問 (docs/public-profile.md §5.4) ────────────────────────
// `is_public` HARUS ditulis dari progress.publicProfile — satu sumber kebenaran.
// Default TERTUTUP: apa pun yang bukan true → false.
test('bundleToProfile: is_public dari progress.publicProfile (default false)', () => {
  assert.equal(bundleToProfile({ progress: {} }, 'u').is_public, false);
  assert.equal(bundleToProfile({ progress: { publicProfile: false } }, 'u').is_public, false);
  assert.equal(bundleToProfile({ progress: { publicProfile: true } }, 'u').is_public, true);
});

test('bundleToProfile: is_public = Boolean(publicProfile) — nilai truthy/kotor jadi boolean', () => {
  assert.equal(bundleToProfile({ progress: { publicProfile: 1 } }, 'u').is_public, true);
  assert.equal(bundleToProfile({ progress: { publicProfile: 0 } }, 'u').is_public, false);
  assert.equal(bundleToProfile({ progress: { publicProfile: null } }, 'u').is_public, false);
  assert.equal(bundleToProfile({ progress: { publicProfile: 'yes' } }, 'u').is_public, true);
});

test('profileToBundle: kebalikan dari bundleToProfile (round-trip inti)', () => {
  const original = {
    version: 1, username: 'Madd', updatedAt: 1710000000000,
    progress: { xp: 500, level: 6 },
    itemProgress: { a: { lastReviewed: '2026-01-01' } },
    achievements: ['novice'], selectedBadges: ['novice'],
    avatar: 'data:image/jpeg;base64,QQ',
  };
  const bundle = profileToBundle(bundleToProfile(original, 'u1'));
  assert.equal(bundle.username, 'Madd');
  assert.equal(bundle.progress.xp, 500);
  assert.deepEqual(bundle.achievements, ['novice']);
  assert.equal(bundle.itemProgress.a.lastReviewed, '2026-01-01');
  assert.equal(bundle.avatar, 'data:image/jpeg;base64,QQ');
});

test('profileToBundle: baris kosong → bundle default (tanpa crash)', () => {
  const b = profileToBundle({});
  assert.deepEqual(b.progress, {});
  assert.equal(b.updatedAt, 0);
  assert.deepEqual(b.achievements, []);
});

test('readBundle: username tidak tersimpan sebagai JSON-array → tetap string aman', () => {
  const s = fakeStorage();
  s.setItem(SYNC_KEYS.username, '[object Object]');
  assert.equal(readBundle(s).username, '[object Object]');
});
