import test from 'node:test';
import assert from 'node:assert/strict';
import {
  gojoTechniqueFor, isGojoMilestone, gojoCrackCount, gojoParticles, GOJO_STYLE, gojoSpheres,
} from './gojoFx.js';

// ── Teknik per jawaban (kanon 蒼 → 赫 → 茈 → Domain) ─────────────────────────

test('gojoTechniqueFor: benar#1 = ao, benar#2 = aka', () => {
  assert.equal(gojoTechniqueFor('correct', 1), 'ao');
  assert.equal(gojoTechniqueFor('correct', 2), 'aka');
});

test('gojoTechniqueFor: streak 3 = murasaki (penyatuan ao+aka)', () => {
  assert.equal(gojoTechniqueFor('streak', 3), 'murasaki');
});

test('gojoTechniqueFor: milestone 5/10/20/… = murasaki', () => {
  for (const m of [5, 10, 20, 30, 40, 60, 70, 80, 90]) {
    assert.equal(gojoTechniqueFor('streak', m), 'murasaki', `milestone ${m}`);
  }
});

test('gojoTechniqueFor: non-milestone setelah 3 = ao/aka selang-seling', () => {
  assert.equal(gojoTechniqueFor('streak', 4), 'ao');
  assert.equal(gojoTechniqueFor('streak', 6), 'aka');
  assert.equal(gojoTechniqueFor('streak', 7), 'ao');
  assert.equal(gojoTechniqueFor('streak', 8), 'aka');
  assert.equal(gojoTechniqueFor('streak', 9), 'ao');
});

test('gojoTechniqueFor: 50 = domain, 100 = domain_zenith', () => {
  assert.equal(gojoTechniqueFor('streak', 50), 'domain');
  assert.equal(gojoTechniqueFor('streak', 100), 'domain_zenith');
  assert.equal(gojoTechniqueFor('streak', 150), 'domain_zenith');
});

test('gojoTechniqueFor: salah = null (menyusul, tanpa retak)', () => {
  assert.equal(gojoTechniqueFor('wrong', 0), null);
  assert.equal(gojoTechniqueFor('wrong', 7), null);
});

// ── Milestone helper ────────────────────────────────────────────────────────

test('isGojoMilestone: cocok dengan MILESTONES app', () => {
  for (const m of [3, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]) {
    assert.equal(isGojoMilestone(m), true, `${m} harus milestone`);
  }
  for (const n of [0, 1, 2, 4, 6, 7, 9, 11, 99]) {
    assert.equal(isGojoMilestone(n), false, `${n} bukan milestone`);
  }
});

// ── Retak (HANYA streak) ────────────────────────────────────────────────────

test('gojoCrackCount: naik per level, ada batas atas', () => {
  assert.ok(gojoCrackCount(3) < gojoCrackCount(20));
  assert.ok(gojoCrackCount(100) <= 14);
  assert.ok(gojoCrackCount(3) >= 3);
});

// ── Partikel (deterministik dengan rng inject) ──────────────────────────────

test('gojoParticles: jumlah wajar & deterministik dengan rng inject', () => {
  const a = gojoParticles('ao', 1, () => 0.5);
  const b = gojoParticles('ao', 1, () => 0.5);
  assert.ok(a.length >= 12 && a.length <= 30);
  assert.deepEqual(a, b);
});

test('gojoParticles: murasaki = spiral, aka = ledak keluar, ao = hisap masuk', () => {
  const ao = gojoParticles('ao', 1, () => 0.5);
  const aka = gojoParticles('aka', 1, () => 0.5);
  const mura = gojoParticles('murasaki', 1, () => 0.5);
  assert.equal(ao[0].out, false, 'ao = hisap (tidak keluar)');
  assert.equal(aka[0].out, true, 'aka = ledak keluar');
  assert.equal(mura[0].spiral, true, 'murasaki = spiral');
});

// ── Style ───────────────────────────────────────────────────────────────────

test('GOJO_STYLE punya warna & kanji untuk tiap teknik', () => {
  for (const t of ['ao', 'aka', 'murasaki', 'domain', 'domain_zenith']) {
    assert.ok(GOJO_STYLE[t].color, `${t} tanpa warna`);
    assert.ok(GOJO_STYLE[t].kanji, `${t} tanpa kanji`);
  }
  assert.equal(GOJO_STYLE.ao.kanji, '蒼');
  assert.equal(GOJO_STYLE.aka.kanji, '赫');
  assert.equal(GOJO_STYLE.murasaki.kanji, '茈');
  assert.equal(GOJO_STYLE.domain.kanji, '無量空処');
});

// ── Bola (permintaan user: ao dari kanan, aka dari kiri, murasaki tabrakan) ──

test('gojoSpheres: ao = 1 bola dari KANAN menuju tengah', () => {
  const s = gojoSpheres('ao');
  assert.equal(s.length, 1);
  assert.ok(s[0].fromVw > 0, 'ao harus datang dari kanan (fromVw > 0)');
  assert.equal(s[0].toVw, 0, 'ao berakhir di tengah');
});

test('gojoSpheres: aka = 1 bola dari KIRI menuju tengah', () => {
  const s = gojoSpheres('aka');
  assert.equal(s.length, 1);
  assert.ok(s[0].fromVw < 0, 'aka harus datang dari kiri (fromVw < 0)');
  assert.equal(s[0].toVw, 0, 'aka berakhir di tengah');
});

test('gojoSpheres: murasaki = DUA bola (kanan + kiri) tabrakan di tengah', () => {
  const s = gojoSpheres('murasaki');
  assert.equal(s.length, 2);
  assert.equal(s.filter((b) => b.fromVw > 0).length, 1, 'satu dari kanan');
  assert.equal(s.filter((b) => b.fromVw < 0).length, 1, 'satu dari kiri');
  for (const b of s) assert.equal(b.toVw, 0, 'semua berakhir di tengah (titik tabrakan)');
});

test('gojoSpheres: warna bola = warna kanon (ao biru, aka merah)', () => {
  assert.equal(gojoSpheres('ao')[0].color, GOJO_STYLE.ao.color);
  assert.equal(gojoSpheres('aka')[0].color, GOJO_STYLE.aka.color);
  const mura = gojoSpheres('murasaki');
  assert.equal(mura.find((b) => b.id === 'ao').color, GOJO_STYLE.ao.color);
  assert.equal(mura.find((b) => b.id === 'aka').color, GOJO_STYLE.aka.color);
});

test('gojoSpheres: domain & teknik lain tidak pakai bola', () => {
  assert.deepEqual(gojoSpheres('domain'), []);
  assert.deepEqual(gojoSpheres('domain_zenith'), []);
  assert.deepEqual(gojoSpheres(null), []);
});
