import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CINEMATICS, emptyCinematics, ensureCinematics, hasSeenCinematic,
  markCinematicSeen, cinematicForEra, nextCinematic, getCinematic,
} from './cinematics.js';

test('registry: setiap cinematic punya id/era/kind, id cocok dengan key', () => {
  const entries = Object.entries(CINEMATICS);
  assert.ok(entries.length >= 1);
  for (const [key, c] of entries) {
    assert.equal(c.id, key);
    assert.ok(c.era && typeof c.era === 'string');
    assert.ok(['history', 'emakimono'].includes(c.kind));
  }
});

test('ensureCinematics: sampah → {}, objek valid apa adanya, array ditolak', () => {
  assert.deepEqual(ensureCinematics(null), {});
  assert.deepEqual(ensureCinematics(undefined), {});
  assert.deepEqual(ensureCinematics('x'), {});
  assert.deepEqual(ensureCinematics([]), {});
  assert.deepEqual(ensureCinematics({ a: true }), { a: true });
});

test('hasSeenCinematic: hanya true kalau benar-benar === true', () => {
  assert.equal(hasSeenCinematic({}, 'heian'), false);
  assert.equal(hasSeenCinematic({ heian: true }, 'heian'), true);
  assert.equal(hasSeenCinematic({ heian: 1 }, 'heian'), false);
  assert.equal(hasSeenCinematic(null, 'heian'), false);
});

test('markCinematicSeen: immutable + idempoten (tandai 2× sama)', () => {
  const before = emptyCinematics();
  const once = markCinematicSeen(before, 'heian');
  assert.deepEqual(before, {}, 'tidak mengubah objek asal');
  assert.equal(once.heian, true);
  const twice = markCinematicSeen(once, 'heian');
  assert.equal(twice, once, 'tandai ulang mengembalikan objek yang sama');
});

test('markCinematicSeen: id kosong diabaikan (tidak menambah key hantu)', () => {
  const r = markCinematicSeen({}, '');
  assert.deepEqual(r, {});
  assert.deepEqual(markCinematicSeen({}, null), {});
});

test('cinematicForEra / nextCinematic: auto-play HANYA kalau belum dilihat', () => {
  assert.equal(cinematicForEra('heian')?.id, 'heian');
  assert.equal(cinematicForEra('edo')?.id, 'edo');
  assert.equal(cinematicForEra('meiji')?.id, 'meiji');
  assert.equal(cinematicForEra('anime')?.id, 'anime');
  assert.equal(cinematicForEra('nope'), null);

  assert.equal(nextCinematic('heian', {}), 'heian', 'belum dilihat → putar');
  assert.equal(nextCinematic('heian', { heian: true }), null, 'sudah dilihat → jangan');
  assert.equal(nextCinematic('edo', {}), 'edo', 'Edo punya cinematic → putar');
  assert.equal(nextCinematic('edo', { edo: true }), null, 'Edo sudah dilihat → jangan');
  assert.equal(nextCinematic('meiji', {}), 'meiji', 'Meiji punya cinematic → putar');
  assert.equal(nextCinematic('meiji', { meiji: true }), null, 'Meiji sudah dilihat → jangan');
  assert.equal(nextCinematic('showa', {}), 'showa', 'Shōwa punya cinematic → putar');
  assert.equal(nextCinematic('showa', { showa: true }), null, 'Shōwa sudah dilihat → jangan');
  assert.equal(nextCinematic('anime', {}), 'anime', '多元 punya cinematic → putar');
  assert.equal(nextCinematic('anime', { anime: true }), null, '多元 sudah dilihat → jangan');
  assert.equal(nextCinematic('cyberpunk', {}), null, 'era tanpa cinematic → null');
});

test('getCinematic: ambil by id, id tak dikenal → null', () => {
  assert.equal(getCinematic('heian')?.era, 'heian');
  assert.equal(getCinematic('edo')?.route, '/edo-history');
  assert.equal(getCinematic('meiji')?.route, '/meiji-history');
  assert.equal(getCinematic('showa')?.route, '/showa-history');
  assert.equal(getCinematic('anime')?.route, '/anime-history');
  assert.equal(getCinematic('nope'), null);
});
