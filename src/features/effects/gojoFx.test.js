import test from 'node:test';
import assert from 'node:assert/strict';
import {
  gojoTechniqueFor, isGojoMilestone, gojoCrackCount, gojoParticles, GOJO_STYLE,
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
