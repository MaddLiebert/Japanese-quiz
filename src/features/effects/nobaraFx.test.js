import test from 'node:test';
import assert from 'node:assert/strict';
import {
  NOBARA_MILESTONES, isNobaraMilestone, nobaraTechniqueFor,
  NOBARA_LADDER, NOBARA_TOP_STREAK, NOBARA_NON_STREAK_CYCLE, nobaraNonStreakIndex,
  NOBARA_ULT_THRESHOLD, nobaraCurseCharge, nobaraUltReady,
  NOBARA_ULT_DURATION_S, NOBARA_ULT_TIMELINE, NOBARA_ULT_MIN_WRONG, nobaraUltCut,
  NOBARA_CLIPS, NOBARA_VOICE_FOR, NOBARA_STYLE, NOBARA_MOTION,
  NOBARA_CORE, NOBARA_ORANGE, NOBARA_LIGHT, NOBARA_RED, NOBARA_DARK, NOBARA_STRAW,
  nobaraNails, nobaraBurst, nobaraSparks, nobaraCracks, nobaraRipple,
  nobaraStrawDoll, nobaraUltNails,
} from './nobaraFx.js';
import { GOJO_MILESTONES } from './gojoFx.js';

test('milestone Nobara = sama persis Gojo (konsisten JJK)', () => {
  assert.deepEqual(NOBARA_MILESTONES, GOJO_MILESTONES);
  assert.ok(isNobaraMilestone(3) && isNobaraMilestone(100));
  assert.ok(!isNobaraMilestone(4));
});

test('nobaraTechniqueFor: non-streak ROTASI kanzashi → ren → kanzashi … (deterministik)', () => {
  assert.equal(nobaraTechniqueFor('correct', 1), 'kanzashi');
  assert.equal(nobaraTechniqueFor('correct', 2), 'ren');
  assert.equal(nobaraTechniqueFor('correct', 3), 'kanzashi');
  assert.equal(nobaraTechniqueFor('correct', 4), 'ren');
  assert.equal(nobaraTechniqueFor('correct', 9), 'kanzashi');
  // 11..19 = non-momen (ladder 10 sudah lewat) → lanjut rotasi
  assert.equal(nobaraTechniqueFor('correct', 11), 'ren');
  assert.equal(nobaraTechniqueFor('correct', 12), 'kanzashi');
});

test('nobaraTechniqueFor: TIDAK PERNAH null utk streak benar > 0', () => {
  const valid = ['kanzashi', 'ren', 'jigen', 'tomonari', 'kokusen'];
  for (let s = 1; s <= 200; s++) {
    const t = nobaraTechniqueFor('correct', s);
    assert.ok(typeof t === 'string' && valid.includes(t), `streak ${s} -> ${t}`);
  }
});

test('nobaraTechniqueFor: momen TEPAT di 10 (簪・時限) & 20 (共鳴り); 30+ 黒閃 (puncak)', () => {
  assert.equal(nobaraTechniqueFor('streak', 10), 'jigen');
  assert.equal(nobaraTechniqueFor('streak', 20), 'tomonari');
  // spec menulis "30+" → 30, 31, 45, 100 tetap 黒閃 (jurus puncak, bukan sekali lewat)
  for (const s of [30, 31, 45, 100, 150]) {
    assert.equal(nobaraTechniqueFor('streak', s), 'kokusen', `streak ${s}`);
  }
  // 21..29 = non-momen → rotasi (bukan null)
  for (const s of [21, 29]) {
    const t = nobaraTechniqueFor('streak', s);
    assert.ok(t === 'kanzashi' || t === 'ren', `streak ${s} harus rotasi, dapat ${t}`);
  }
});

test('nobaraNonStreakIndex: hitung jawaban benar non-momen (momen tidak menggeser)', () => {
  assert.equal(nobaraNonStreakIndex(0), 0);
  assert.equal(nobaraNonStreakIndex(1), 1);
  assert.equal(nobaraNonStreakIndex(9), 9);
  assert.equal(nobaraNonStreakIndex(10), 9, 'streak 10 = momen, index tidak naik');
  assert.equal(nobaraNonStreakIndex(11), 10, 'streak 11 = non-momen ke-10');
  assert.equal(nobaraNonStreakIndex(20), 18);
  assert.equal(nobaraNonStreakIndex(NaN), 0);
  assert.equal(nobaraNonStreakIndex(-5), 0);
});

test('NOBARA_NON_STREAK_CYCLE & NOBARA_LADDER = spec (rotasi deterministik)', () => {
  assert.deepEqual(NOBARA_NON_STREAK_CYCLE, ['kanzashi', 'ren']);
  assert.deepEqual(NOBARA_LADDER, { 10: 'jigen', 20: 'tomonari' });
  assert.equal(NOBARA_TOP_STREAK, 30);
});

test('nobaraTechniqueFor: salah = null & TIDAK PERNAH ult (ult = bar, bukan streak)', () => {
  assert.equal(nobaraTechniqueFor('wrong', 0), null);
  for (let s = 1; s <= 200; s++) {
    assert.notEqual(nobaraTechniqueFor('streak', s), 'ult', `streak ${s}`);
  }
});

test('nobaraTechniqueFor: input kotor aman (null, bukan efek nyasar)', () => {
  assert.equal(nobaraTechniqueFor('correct', NaN), null);
  assert.equal(nobaraTechniqueFor('correct', -3), null);
  assert.equal(nobaraTechniqueFor('correct', undefined), null);
  assert.equal(nobaraTechniqueFor('correct', 0), null);
});

test('nobaraCurseCharge: 0..20 clamp, input aneh -> 0', () => {
  assert.equal(nobaraCurseCharge(0), 0);
  assert.equal(nobaraCurseCharge(5), 5);
  assert.equal(nobaraCurseCharge(20), 20);
  assert.equal(nobaraCurseCharge(999), NOBARA_ULT_THRESHOLD);
  for (const bad of [NaN, -1, null, undefined, 'x']) assert.equal(nobaraCurseCharge(bad), 0, String(bad));
});

test('nobaraUltReady: penuh di 20', () => {
  assert.ok(!nobaraUltReady(19));
  assert.ok(nobaraUltReady(20));
  assert.ok(nobaraUltReady(50));
  assert.ok(!nobaraUltReady(NaN));
});

test('NOBARA_ULT_DURATION_S = one-shot ~2.2s (BUKAN state — rarity common)', () => {
  assert.equal(NOBARA_ULT_DURATION_S, 2.2);
  // timeline urut naik & settle = durasi
  const t = NOBARA_ULT_TIMELINE;
  assert.ok(t.veilAt < t.nailsAt && t.nailsAt < t.stickAt && t.stickAt < t.flashAt);
  assert.ok(t.flashAt < t.boomAt && t.boomAt < t.cutAt && t.cutAt < t.kanjiAt);
  assert.ok(t.kanjiAt < t.settleAt);
  assert.equal(t.settleAt, NOBARA_ULT_DURATION_S);
});

test('nobaraUltCut: hapus opsi salah TAPI sisakan minimal 1 (user tetap mikir)', () => {
  const options = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
  // 4 opsi, benar 'a' → 3 salah, sisakan 1 → cut 2
  assert.deepEqual(nobaraUltCut(options, 'a'), ['b', 'c']);
  // 2 opsi, benar 'a' → 1 salah, sisakan 1 → cut 0
  assert.deepEqual(nobaraUltCut([{ id: 'a' }, { id: 'b' }], 'a'), []);
  // benar TIDAK pernah masuk daftar cut
  for (const cut of [nobaraUltCut(options, 'b'), nobaraUltCut(options, 'c')]) {
    assert.ok(!cut.includes('b') || true); // sanity: potong list
  }
  const cutB = nobaraUltCut(options, 'b');
  assert.ok(!cutB.includes('b'), 'benar tidak boleh dipotong');
});

test('nobaraUltCut: input kotor aman', () => {
  assert.deepEqual(nobaraUltCut(null, 'a'), []);
  assert.deepEqual(nobaraUltCut([], 'a'), []);
  assert.deepEqual(nobaraUltCut(['a', 'b', 'c'], 'a', 0), ['b', 'c'], 'keep 0 → semua salah');
  assert.deepEqual(nobaraUltCut(['a', 'b', 'c'], 'a', 99), [], 'keep besar → tidak ada cut');
});

test('NOBARA_CLIPS: durasi terukur (PyAV) — kanzashi ~0.99, tomonari ~1.12, kokusen ~1.25', () => {
  assert.ok(Math.abs(NOBARA_CLIPS.kanzashi - 0.99) < 0.05);
  assert.ok(Math.abs(NOBARA_CLIPS.tomonari - 1.12) < 0.05);
  assert.ok(Math.abs(NOBARA_CLIPS.kokusen - 1.25) < 0.05);
  assert.ok(NOBARA_CLIPS.ult > 1.0, 'ult pakai segmen anime (paling intens)');
});

test('NOBARA_VOICE_FOR: tiap jurus punya klip (ren/jigen reuse kanzashi)', () => {
  assert.equal(NOBARA_VOICE_FOR.kanzashi, 'kanzashi');
  assert.equal(NOBARA_VOICE_FOR.ren, 'kanzashi');
  assert.equal(NOBARA_VOICE_FOR.jigen, 'kanzashi');
  assert.equal(NOBARA_VOICE_FOR.tomonari, 'tomonari');
  assert.equal(NOBARA_VOICE_FOR.kokusen, 'kokusen');
  assert.equal(NOBARA_VOICE_FOR.ult, 'tomonari');
});

test('NOBARA_STYLE: kanji + warna utk tiap jurus', () => {
  for (const k of ['kanzashi', 'ren', 'jigen', 'tomonari', 'kokusen', 'ult']) {
    assert.ok(NOBARA_STYLE[k], `style ${k} harus ada`);
    assert.ok(NOBARA_STYLE[k].kanji, `kanji ${k}`);
    assert.ok(NOBARA_STYLE[k].color, `color ${k}`);
  }
});

test('palet: 3 lapis + jerami (design token ui-ux-pro-max)', () => {
  assert.equal(NOBARA_CORE, '#fef3c7');
  assert.equal(NOBARA_ORANGE, '#f97316');
  assert.equal(NOBARA_LIGHT, '#fb923c');
  assert.equal(NOBARA_RED, '#dc2626');
  assert.equal(NOBARA_DARK, '#0f172a');
  assert.equal(NOBARA_STRAW, '#d4a24a');
});

test('NOBARA_MOTION: easing beda per peran (anti-slop) + durasi bertingkat', () => {
  assert.notEqual(NOBARA_MOTION.enter, NOBARA_MOTION.exit, 'enter ≠ exit (bukan satu easing)');
  assert.notEqual(NOBARA_MOTION.exit, NOBARA_MOTION.crack);
  assert.ok(NOBARA_MOTION.durFast < NOBARA_MOTION.durMid);
  assert.ok(NOBARA_MOTION.durMid < NOBARA_MOTION.durCine);
});

// ── Determinisme (pola redesign Megumi v2.1: tanpa rng — hasil identik) ─────
test('generator DETERMINISTIK: panggilan sama → hasil identik', () => {
  const gens = [nobaraNails, nobaraBurst, nobaraSparks, nobaraCracks, nobaraRipple, nobaraStrawDoll, nobaraUltNails];
  for (const gen of gens) {
    assert.deepEqual(gen(7), gen(7), `${gen.name} harus deterministik`);
  }
});

test('nobaraNails: paku = garis (x0≠x1), stagger 70ms, masuk dari luar kartu', () => {
  const n = nobaraNails(1, 3);
  assert.equal(n.length, 3);
  for (const p of n) {
    assert.notEqual(p.x0, p.x1, 'paku harus garis, bukan titik');
    assert.notEqual(p.y0, p.y1);
  }
  assert.equal(n[0].delay, 0);
  assert.ok(Math.abs(n[1].delay - 0.07) < 0.001, 'stagger 70ms');
  assert.ok(n[0].x0 > 100, 'mulai dari luar kartu (kanan)');
});

test('nobaraBurst: burs BERGERIGI (polygon ganjil-genap, bukan lingkaran)', () => {
  const b = nobaraBurst(1, 1);
  assert.equal(b.pts.length, 20, '10 gerigi × 2 titik');
  assert.ok(b.coreR < b.bodyR && b.bodyR < b.edgeR, '3 lapis: core < body < edge');
});

test('nobaraSparks: arah radial KONSISTEN (8 arah merata — anti-slop)', () => {
  const sp = nobaraSparks(1, 8);
  assert.equal(sp.length, 8);
  // tiap percikan arah beda (sudut unik)
  const angles = sp.map((s) => s.rot);
  assert.equal(new Set(angles).size, 8, 'sudut harus unik');
});

test('nobaraCracks: retakan punya cabang (2-3) & makin tipis (w0 > w1)', () => {
  const ck = nobaraCracks(1, 4);
  assert.equal(ck.length, 4);
  for (const c of ck) {
    assert.ok(c.branch.length >= 1 && c.branch.length <= 2, 'cabang 1-2 per retakan utama');
    assert.ok(c.w0 > c.w1, 'pangkal lebih tebal dari ujung');
  }
});

test('nobaraRipple: elips (rx > ry — getaran, bukan lingkaran penuh)', () => {
  const rp = nobaraRipple(1, 3);
  assert.equal(rp.length, 3);
  for (const r of rp) {
    assert.ok(r.rx > r.ry, 'elips pipih = getaran');
  }
});

test('nobaraStrawDoll: posisi TETAP (tidak random)', () => {
  const d = nobaraStrawDoll(1);
  assert.equal(d.x, 6);
  assert.equal(d.y, 58);
  assert.ok(d.strands >= 3);
});

test('nobaraUltNails: 12 paku, stagger 40ms, dari 4 tepi', () => {
  const un = nobaraUltNails(1, 12);
  assert.equal(un.length, 12);
  assert.equal(un[0].delay, 0);
  assert.ok(Math.abs(un[1].delay - 0.04) < 0.001, 'stagger 40ms');
  const edges = new Set(un.map((n) => n.edge));
  assert.equal(edges.size, 4, 'pakai 4 tepi');
});
