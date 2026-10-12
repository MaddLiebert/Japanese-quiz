// Tes modul backup (murni) — `node --test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BACKUP_APP, BACKUP_VERSION, BACKUP_KEYS, EXCLUDED_KEYS,
  buildBackup, serializeBackup, validateBackup, parseBackup,
  backupSummary, applyBackup,
} from './backup.js';

// Storage palsu (Map-backed) — meniru localStorage.
const fakeStorage = (init = {}) => {
  const m = new Map(Object.entries(init));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    _map: m,
  };
};

test('buildBackup: hanya menyertakan key yang ada & dalam allowlist', () => {
  const s = fakeStorage({
    username: 'Madd',
    user_progress_v2: JSON.stringify({ xp: 120, level: 3, streak: 5 }),
    'sb-abc-auth-token': 'RAHASIA',       // TIDAK boleh ikut
    net_quota_v1: '{"write":1}',          // TIDAK boleh ikut
    sync_device_id_v1: 'dev-123',         // TIDAK boleh ikut
  });
  const b = buildBackup(s, { now: 1700000000000, origin: 'https://lama.vercel.app' });
  assert.equal(b.app, BACKUP_APP);
  assert.equal(b.version, BACKUP_VERSION);
  assert.equal(b.origin, 'https://lama.vercel.app');
  assert.equal(b.keys.username, 'Madd');
  assert.ok(b.keys.user_progress_v2);
  assert.equal(b.keys['sb-abc-auth-token'], undefined);
  assert.equal(b.keys.net_quota_v1, undefined);
  assert.equal(b.keys.sync_device_id_v1, undefined);
});

test('buildBackup: storage null → null (aman saat SSR)', () => {
  assert.equal(buildBackup(null), null);
});

test('serialize → parse: round-trip utuh', () => {
  const s = fakeStorage({
    username: 'Madd',
    user_progress_v2: JSON.stringify({ xp: 42 }),
    selected_badges: JSON.stringify(['a', 'b']),
  });
  const text = serializeBackup(buildBackup(s));
  const r = parseBackup(text);
  assert.equal(r.ok, true);
  assert.equal(r.backup.keys.username, 'Madd');
  assert.equal(r.backup.keys.user_progress_v2, JSON.stringify({ xp: 42 }));
});

test('validateBackup: tolak app lain / versi tak dikenal / kosong', () => {
  assert.equal(validateBackup(null).error, 'NOT_OBJECT');
  assert.equal(validateBackup([]).error, 'NOT_OBJECT');
  assert.equal(validateBackup({ app: 'lain', version: 1, keys: {} }).error, 'WRONG_APP');
  assert.equal(validateBackup({ app: BACKUP_APP, version: 99, keys: {} }).error, 'UNSUPPORTED_VERSION');
  assert.equal(validateBackup({ app: BACKUP_APP, version: 1, keys: {} }).error, 'EMPTY_BACKUP');
  assert.equal(validateBackup({ app: BACKUP_APP, version: 1, keys: { nope: 'x' } }).error, 'EMPTY_BACKUP');
});

test('validateBackup: buang key di luar allowlist (anti tulis key liar)', () => {
  const r = validateBackup({
    app: BACKUP_APP, version: 1,
    keys: { username: 'A', net_quota_v1: 'x', 'sb-x-auth-token': 'y' },
  });
  assert.equal(r.ok, true);
  assert.deepEqual(Object.keys(r.backup.keys), ['username']);
});

test('parseBackup: JSON rusak / kosong', () => {
  assert.equal(parseBackup('').error, 'EMPTY');
  assert.equal(parseBackup('  ').error, 'EMPTY');
  assert.equal(parseBackup('{bukan json').error, 'INVALID_JSON');
  assert.equal(parseBackup(null).error, 'EMPTY');
});

test('applyBackup: overwrite menimpa, fill hanya mengisi yang kosong', () => {
  const s = fakeStorage({ username: 'Lama' });
  const backup = {
    app: BACKUP_APP, version: 1,
    keys: { username: 'Baru', user_progress_v2: JSON.stringify({ xp: 7 }) },
  };
  const n1 = applyBackup(s, backup, 'overwrite');
  assert.equal(n1, 2);
  assert.equal(s.getItem('username'), 'Baru');

  const s2 = fakeStorage({ username: 'Lama' });
  const n2 = applyBackup(s2, backup, 'fill');
  assert.equal(n2, 1); // username dilewati (sudah ada)
  assert.equal(s2.getItem('username'), 'Lama');
  assert.equal(s2.getItem('user_progress_v2'), JSON.stringify({ xp: 7 }));
});

test('applyBackup: tidak pernah menulis key di luar allowlist', () => {
  const s = fakeStorage();
  const n = applyBackup(s, {
    app: BACKUP_APP, version: 1,
    keys: { username: 'A', net_quota_v1: 'x', 'sb-x-auth-token': 'y' },
  }, 'overwrite');
  assert.equal(n, 1);
  assert.equal(s.getItem('net_quota_v1'), null);
  assert.equal(s.getItem('sb-x-auth-token'), null);
});

test('backupSummary: baca xp/level/streak dari progres', () => {
  const s = fakeStorage({
    username: 'Madd',
    user_progress_v2: JSON.stringify({ xp: 250, level: 4, streak: 9 }),
  });
  const sum = backupSummary(buildBackup(s));
  assert.equal(sum.hasProgress, true);
  assert.equal(sum.username, 'Madd');
  assert.equal(sum.xp, 250);
  assert.equal(sum.level, 4);
  assert.equal(sum.streak, 9);
});

test('BACKUP_KEYS & EXCLUDED_KEYS tidak tumpang tindih', () => {
  const overlap = BACKUP_KEYS.filter((k) => EXCLUDED_KEYS.includes(k));
  assert.deepEqual(overlap, []);
});
