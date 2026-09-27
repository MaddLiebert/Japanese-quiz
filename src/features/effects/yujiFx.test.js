import test from 'node:test';
import assert from 'node:assert/strict';
import {
  YUJI_MILESTONES, isYujiMilestone, yujiTechniqueFor,
  YUJI_ULT_THRESHOLD, yujiCurseCharge, yujiUltReady,
  YUJI_TAKEOVER_DURATION_S, yujiTakeoverLeft, yujiTakeoverStartDelayMs, YUJI_TAKEOVER_TIMELINE,
  yujiComboNext, yujiComboClip, yujiComboKanji, YUJI_COMBO_KANJI,
  YUJI_FINISHER_XP_MULT, yujiBurnedIds,
  YUJI_STYLE,
  yujiSparks, yujiCracks, yujiEmbers, yujiBeam, yujiWindLines, yujiScissorLines,
} from './yujiFx.js';
import { GOJO_MILESTONES } from './gojoFx.js';

test('milestone Yuji = sama persis Gojo', () => {
  assert.deepEqual(YUJI_MILESTONES, GOJO_MILESTONES);
  assert.ok(isYujiMilestone(3) && isYujiMilestone(100));
  assert.ok(!isYujiMilestone(4));
});

test('yujiTechniqueFor: 1 = keiteiken, 2 = manjigeri (gantian)', () => {
  assert.equal(yujiTechniqueFor('correct', 1), 'keiteiken');
  assert.equal(yujiTechniqueFor('correct', 2), 'manjigeri');
});

test('yujiTechniqueFor: 3..59 = kokusen (termasuk milestone)', () => {
  for (const s of [3, 4, 5, 10, 20, 50, 59]) assert.equal(yujiTechniqueFor('streak', s), 'kokusen', `streak ${s}`);
});

test('yujiTechniqueFor: >=60 = senketsu (kekuatan Yuji sendiri)', () => {
  for (const s of [60, 70, 80, 90, 100, 200]) assert.equal(yujiTechniqueFor('correct', s), 'senketsu', `streak ${s}`);
});

test('yujiTechniqueFor: salah = null & TIDAK PERNAH domain/takeover', () => {
  assert.equal(yujiTechniqueFor('wrong', 0), null);
  for (let s = 1; s <= 200; s++) {
    const t = yujiTechniqueFor('streak', s);
    assert.ok(t !== 'domain' && t !== 'takeover', `streak ${s} -> ${t}`);
  }
});

test('yujiTechniqueFor: input kotor aman', () => {
  assert.equal(yujiTechniqueFor('correct', NaN), 'keiteiken');
  assert.equal(yujiTechniqueFor('correct', -3), 'keiteiken');
  assert.equal(yujiTechniqueFor('correct', undefined), 'keiteiken');
});

test('yujiCurseCharge: 0..20 clamp, input aneh -> 0', () => {
  assert.equal(yujiCurseCharge(0), 0);
  assert.equal(yujiCurseCharge(5), 5);
  assert.equal(yujiCurseCharge(20), 20);
  assert.equal(yujiCurseCharge(999), YUJI_ULT_THRESHOLD);
  for (const bad of [NaN, -1, null, undefined, 'x']) assert.equal(yujiCurseCharge(bad), 0, String(bad));
});

test('yujiUltReady: penuh di 20', () => {
  assert.ok(!yujiUltReady(19));
  assert.ok(yujiUltReady(20));
  assert.ok(yujiUltReady(50));
  assert.ok(!yujiUltReady(NaN));
});

test('yujiTakeoverLeft: clamp 0..30, input aneh -> 0', () => {
  const now = 1000000;
  assert.equal(yujiTakeoverLeft(now + 30000, now), 30);
  assert.equal(yujiTakeoverLeft(now + 10500, now), 11);
  assert.equal(yujiTakeoverLeft(now - 1, now), 0);
  for (const bad of [NaN, Infinity, null, undefined]) assert.equal(yujiTakeoverLeft(bad, now), 0, String(bad));
  assert.equal(yujiTakeoverLeft(now + 30000, NaN), 0);
});

test('yujiTakeoverStartDelayMs: tunggu settle cinematic (>= 2 dtk)', () => {
  assert.ok(yujiTakeoverStartDelayMs() >= 2000);
  assert.equal(
    yujiTakeoverStartDelayMs(),
    Math.round((YUJI_TAKEOVER_TIMELINE.settleStart + YUJI_TAKEOVER_TIMELINE.settleDur) * 1000),
  );
});

test('timeline takeover urut: tato -> mata -> kanji -> settle', () => {
  const t = YUJI_TAKEOVER_TIMELINE;
  assert.ok(t.tattooStart <= t.eyesAt);
  assert.ok(t.eyesAt <= t.kanjiAt);
  assert.ok(t.kanjiAt < t.settleStart);
});

test('yujiComboNext: naik 1, cap 3, input aneh aman', () => {
  assert.equal(yujiComboNext(0), 1);
  assert.equal(yujiComboNext(1), 2);
  assert.equal(yujiComboNext(2), 3);
  assert.equal(yujiComboNext(3), 3);
  assert.equal(yujiComboNext(NaN), 1);
  assert.equal(yujiComboNext(-5), 1);
});

test('yujiComboClip & kanji: 解 -> 捌 -> 開', () => {
  assert.equal(yujiComboClip(1), '/voices/yuji/kai.mp3');
  assert.equal(yujiComboClip(2), '/voices/yuji/hachi.mp3');
  assert.equal(yujiComboClip(3), '/voices/yuji/fuga.mp3');
  assert.equal(yujiComboClip(0), null);
  assert.equal(yujiComboClip(4), null);
  assert.deepEqual(YUJI_COMBO_KANJI, ['解', '捌', '開']);
  assert.equal(yujiComboKanji(3), '開');
});

test('yujiBurnedIds: 2 opsi salah, bukan jawaban benar, deterministik dgn rng', () => {
  const opts = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
  const rng = () => 0.999;
  const a = yujiBurnedIds(opts, 'a', rng);
  const b = yujiBurnedIds(opts, 'a', rng);
  assert.equal(a.length, 2);
  assert.ok(!a.includes('a'), 'jawaban benar tidak boleh ikut dibakar');
  assert.deepEqual(a, b, 'rng sama -> hasil sama');
  assert.notEqual(a[0], a[1], 'dua id berbeda');
});

test('yujiBurnedIds: opsi salah < 2 / input aneh -> aman', () => {
  assert.deepEqual(yujiBurnedIds([{ id: 'a' }, { id: 'b' }], 'a', () => 0), ['b']);
  assert.deepEqual(yujiBurnedIds([], 'a'), []);
  assert.deepEqual(yujiBurnedIds(null, 'a'), []);
  assert.deepEqual(yujiBurnedIds([{ id: 'a' }], 'a'), []);
  assert.deepEqual(yujiBurnedIds(['x', 'y', 'z'], 'x', () => 0.999).length, 2);
});

test('YUJI_FINISHER_XP_MULT = 2 (XP soal 開 dobel)', () => {
  assert.equal(YUJI_FINISHER_XP_MULT, 2);
});

test('YUJI_STYLE lengkap 8 teknik + kanji & warna', () => {
  const keys = ['keiteiken', 'manjigeri', 'kokusen', 'senketsu', 'kai', 'hachi', 'fuga', 'takeover'];
  assert.deepEqual(Object.keys(YUJI_STYLE).sort(), keys.slice().sort());
  for (const k of keys) {
    assert.ok(YUJI_STYLE[k].kanji && YUJI_STYLE[k].color && YUJI_STYLE[k].label, k);
  }
  assert.equal(YUJI_STYLE.fuga.kanji, '開');
  assert.equal(YUJI_STYLE.takeover.kanji, '宿儺の器');
  assert.equal(YUJI_STYLE.kokusen.color, '#111111');
  assert.equal(YUJI_STYLE.senketsu.color, '#8b0000');
});

test('generator partikel: jumlah, id unik, deterministik dgn rng inject', () => {
  const rng = () => 0.5;
  const sp = yujiSparks(7, 5, rng);
  assert.equal(sp.length, 5);
  assert.equal(new Set(sp.map((p) => p.id)).size, 5);
  assert.deepEqual(sp, yujiSparks(7, 5, rng));
  assert.equal(yujiCracks(1, 6, rng).length, 6);
  assert.equal(yujiEmbers(1, 7, rng).length, 7);
  assert.equal(yujiWindLines(1, 12, rng).length, 12);
  assert.equal(yujiScissorLines(1, 5, rng).length, 5);
  const beam = yujiBeam(3, rng);
  assert.ok(beam.y > 30 && beam.y < 70);
  assert.ok(beam.thickness > 0 && beam.dur > 0);
});

test('generator partikel: nilai dalam rentang wajar (tidak NaN)', () => {
  for (const p of yujiSparks(1, 20)) {
    assert.ok(Number.isFinite(p.angle) && Number.isFinite(p.dist) && p.dist > 0);
    assert.ok(Number.isFinite(p.size) && p.size > 0 && Number.isFinite(p.dur) && p.dur > 0);
  }
  for (const e of yujiEmbers(2, 10)) {
    assert.ok(e.x >= 0 && e.x <= 100);
    assert.ok(Number.isFinite(e.drift) && e.drift < 0, 'bara naik = drift negatif');
  }
});
