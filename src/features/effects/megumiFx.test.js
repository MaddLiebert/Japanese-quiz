import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MEGUMI_MILESTONES, isMegumiMilestone, megumiTechniqueFor,
  MEGUMI_LADDER, MEGUMI_TOP_STREAK, MEGUMI_NON_STREAK_CYCLE, megumiNonStreakIndex,
  MEGUMI_ULT_THRESHOLD, megumiCurseCharge, megumiUltReady,
  MEGUMI_SUMMON_DURATION_S, megumiSummonLeft, megumiSummonStartDelayMs,
  MEGUMI_CAST_VOICE, MEGUMI_SUMMON_TIMELINE,
  MEGUMI_WHEEL_NOTCHES, MEGUMI_ADAPT_CUT,
  megumiSwordReady, megumiWrongOutcome, megumiAdaptCut, megumiSwordCut, megumiWheelNotchPlan,
  MEGUMI_STYLE,
  megumiPoolBlobs, megumiWolfRise, megumiFlankSlot, megumiClawSlashes, megumiClawPath, megumiShadowBolts, megumiWingSpread,
  megumiSerpentCoils, megumiScales, megumiCracks, megumiWaterJet, megumiRipples,
  megumiTigerLeap, megumiFangCracks, megumiShadowMotes,
} from './megumiFx.js';
import { GOJO_MILESTONES } from './gojoFx.js';

test('milestone Megumi = sama persis Gojo (konsisten JJK)', () => {
  assert.deepEqual(MEGUMI_MILESTONES, GOJO_MILESTONES);
  assert.ok(isMegumiMilestone(3) && isMegumiMilestone(100));
  assert.ok(!isMegumiMilestone(4));
});

test('megumiTechniqueFor: non-streak ROTASI gyokuken → nue → gyokuken … (deterministik)', () => {
  assert.equal(megumiTechniqueFor('correct', 1), 'gyokuken');
  assert.equal(megumiTechniqueFor('correct', 2), 'nue');
  assert.equal(megumiTechniqueFor('correct', 3), 'gyokuken');
  assert.equal(megumiTechniqueFor('correct', 4), 'nue');
  assert.equal(megumiTechniqueFor('correct', 9), 'gyokuken');
  // 11..19 = non-momen (ladder 10 sudah lewat) → lanjut rotasi
  assert.equal(megumiTechniqueFor('correct', 11), 'nue');
  assert.equal(megumiTechniqueFor('correct', 12), 'gyokuken');
});

test('megumiTechniqueFor: TIDAK PERNAH null utk streak benar > 0 (anti suara default)', () => {
  const valid = ['gyokuken', 'nue', 'orochi', 'bansou', 'kosou'];
  for (let s = 1; s <= 200; s++) {
    const t = megumiTechniqueFor('correct', s);
    assert.ok(typeof t === 'string' && valid.includes(t), `streak ${s} -> ${t}`);
  }
});

test('megumiTechniqueFor: momen TEPAT di 10 (大蛇) & 20 (満象); 30+ 虎葬 (puncak)', () => {
  assert.equal(megumiTechniqueFor('streak', 10), 'orochi');
  assert.equal(megumiTechniqueFor('streak', 20), 'bansou');
  // spec menulis "30+" → 30, 31, 45, 100 tetap 虎葬 (jurus puncak, bukan sekali lewat)
  for (const s of [30, 31, 45, 100, 150]) {
    assert.equal(megumiTechniqueFor('streak', s), 'kosou', `streak ${s}`);
  }
  // 21..29 = non-momen → rotasi (bukan null)
  for (const s of [21, 29]) {
    const t = megumiTechniqueFor('streak', s);
    assert.ok(t === 'gyokuken' || t === 'nue', `streak ${s} harus rotasi, dapat ${t}`);
  }
});

test('megumiNonStreakIndex: hitung jawaban benar non-momen (momen tidak menggeser)', () => {
  assert.equal(megumiNonStreakIndex(0), 0);
  assert.equal(megumiNonStreakIndex(1), 1);
  assert.equal(megumiNonStreakIndex(9), 9);
  assert.equal(megumiNonStreakIndex(10), 9, 'streak 10 = momen, index tidak naik');
  assert.equal(megumiNonStreakIndex(11), 10, 'streak 11 = non-momen ke-10');
  assert.equal(megumiNonStreakIndex(20), 18);
  assert.equal(megumiNonStreakIndex(NaN), 0);
  assert.equal(megumiNonStreakIndex(-5), 0);
});

test('MEGUMI_NON_STREAK_CYCLE & MEGUMI_LADDER = spec (rotasi deterministik)', () => {
  assert.deepEqual(MEGUMI_NON_STREAK_CYCLE, ['gyokuken', 'nue']);
  assert.deepEqual(MEGUMI_LADDER, { 10: 'orochi', 20: 'bansou' });
  assert.equal(MEGUMI_TOP_STREAK, 30);
});

test('megumiTechniqueFor: salah = null & TIDAK PERNAH mahoraga (mahoraga = bar, bukan streak)', () => {
  assert.equal(megumiTechniqueFor('wrong', 0), null);
  for (let s = 1; s <= 200; s++) {
    assert.notEqual(megumiTechniqueFor('streak', s), 'mahoraga', `streak ${s}`);
  }
});

test('megumiTechniqueFor: input kotor aman (null, bukan efek nyasar)', () => {
  assert.equal(megumiTechniqueFor('correct', NaN), null);
  assert.equal(megumiTechniqueFor('correct', -3), null);
  assert.equal(megumiTechniqueFor('correct', undefined), null);
  assert.equal(megumiTechniqueFor('correct', 0), null);
});

test('megumiCurseCharge: 0..20 clamp, input aneh -> 0', () => {
  assert.equal(megumiCurseCharge(0), 0);
  assert.equal(megumiCurseCharge(5), 5);
  assert.equal(megumiCurseCharge(20), 20);
  assert.equal(megumiCurseCharge(999), MEGUMI_ULT_THRESHOLD);
  for (const bad of [NaN, -1, null, undefined, 'x']) assert.equal(megumiCurseCharge(bad), 0, String(bad));
});

test('megumiUltReady: penuh di 20', () => {
  assert.ok(!megumiUltReady(19));
  assert.ok(megumiUltReady(20));
  assert.ok(megumiUltReady(50));
  assert.ok(!megumiUltReady(NaN));
});

test('megumiSummonLeft: clamp 0..30, input aneh -> 0', () => {
  const now = 1000000;
  assert.equal(megumiSummonLeft(now + 30000, now), 30);
  assert.equal(megumiSummonLeft(now + 10500, now), 11);
  assert.equal(megumiSummonLeft(now - 1, now), 0);
  for (const bad of [NaN, Infinity, null, undefined]) assert.equal(megumiSummonLeft(bad, now), 0, String(bad));
  assert.equal(megumiSummonLeft(now + 30000, NaN), 0);
});

test('MEGUMI_SUMMON_DURATION_S = 30 (timer JALAN, pola rare — bukan beku)', () => {
  assert.equal(MEGUMI_SUMMON_DURATION_S, 30);
});

test('megumiSummonStartDelayMs: tunggu settle cinematic (>= 5 dtk — klip chant 4.96s)', () => {
  assert.ok(megumiSummonStartDelayMs() >= 5000);
  assert.equal(
    megumiSummonStartDelayMs(),
    Math.round((MEGUMI_SUMMON_TIMELINE.settleAt + MEGUMI_SUMMON_TIMELINE.settleDur) * 1000),
  );
});

test('MEGUMI_CAST_VOICE = hasil ukur RMS klip mahoraga (JANGAN ditebak)', () => {
  assert.equal(MEGUMI_CAST_VOICE.dur, 4.959);
  assert.equal(MEGUMI_CAST_VOICE.furubeStart, 0.32);
  assert.equal(MEGUMI_CAST_VOICE.furubeEnd, 0.67);
  assert.equal(MEGUMI_CAST_VOICE.yuraStart, 1.14);
  assert.equal(MEGUMI_CAST_VOICE.yuraEnd, 1.66);
  assert.equal(MEGUMI_CAST_VOICE.midStart, 2.60);
  assert.equal(MEGUMI_CAST_VOICE.mahoragaStart, 3.01);
  assert.equal(MEGUMI_CAST_VOICE.mahoragaEnd, 4.71);
});

test('timeline summon sync ke klip: chant, roda, siluet, flash semua di dalam durasi', () => {
  const t = MEGUMI_SUMMON_TIMELINE;
  const v = MEGUMI_CAST_VOICE;
  // kanji 布瑠部 mulai bersama frasa 1; 由良由良 bersama frasa 2; 魔虚羅 bersama frasa 3
  assert.ok(Math.abs(t.kanji1At - v.furubeStart) < 0.05, 'kanji1 sync frasa 1');
  assert.ok(Math.abs(t.kanji2At - v.yuraStart) < 0.05, 'kanji2 sync frasa 2');
  assert.ok(Math.abs(t.riseAt - v.midStart) < 0.05, 'siluet bangkit di segmen mid');
  assert.ok(Math.abs(t.kanji3At - v.mahoragaStart) < 0.05, 'kanji3 sync frasa 魔虚羅');
  // flash + boom setelah frasa 魔虚羅 selesai (4.71) tapi sebelum klip habis
  assert.ok(t.flashAt >= v.mahoragaEnd && t.flashAt <= v.dur, 'flash di akhir klip');
  assert.equal(t.boomAt, t.flashAt);
  // urutan lengkap: veil → pool → kanji1 → kanji2 → roda → rise → kanji3 → shake → flash → settle
  assert.ok(t.veilAt < t.poolAt);
  assert.ok(t.poolAt < t.kanji1At);
  assert.ok(t.kanji1At < t.kanji2At);
  assert.ok(t.kanji2At < t.wheelAt);
  assert.ok(t.wheelAt < t.riseAt);
  assert.ok(t.riseAt < t.kanji3At);
  assert.ok(t.kanji3At < t.shakeAt);
  assert.ok(t.shakeAt < t.flashAt);
  assert.ok(t.flashAt <= t.settleAt);
  assert.ok(t.settleAt + t.settleDur >= v.dur - 0.2, 'settle selesai sekitar durasi klip');
});

test('kanji per-karakter: 布瑠部 3 karakter & 由良由良 4 karakter (sync hasil ukur)', () => {
  const t = MEGUMI_SUMMON_TIMELINE;
  const v = MEGUMI_CAST_VOICE;
  assert.ok(t.kanji1Per > 0 && t.kanji1Per < 0.3);
  assert.ok(t.kanji2Per > 0 && t.kanji2Per < 0.3);
  // frasa 1 ≈0.32–0.67 (0.35s / 3 ≈ 0.12) & frasa 2 ≈1.14–1.66 (0.52s / 4 = 0.13)
  assert.ok(Math.abs(t.kanji1Per - (v.furubeEnd - v.furubeStart) / 3) < 0.02);
  assert.ok(Math.abs(t.kanji2Per - (v.yuraEnd - v.yuraStart) / 4) < 0.02);
});

test('roda 八握剣 = 8 takik (MEGUMI_WHEEL_NOTCHES) & 適応 cut = 1 (spec konstanta)', () => {
  assert.equal(MEGUMI_WHEEL_NOTCHES, 8);
  assert.equal(MEGUMI_ADAPT_CUT, 1);
});

test('megumiSwordReady: penuh di 8 (八握), clamp input aneh', () => {
  assert.ok(!megumiSwordReady(7));
  assert.ok(megumiSwordReady(8));
  assert.ok(megumiSwordReady(9));
  assert.ok(!megumiSwordReady(NaN));
  assert.ok(!megumiSwordReady(0));
});

test('megumiWrongOutcome: roda belum penuh → 適応 (+1); salah ke-9 → 輪砕け', () => {
  assert.deepEqual(megumiWrongOutcome(0), { notches: 1, outcome: 'adapt' });
  assert.deepEqual(megumiWrongOutcome(7), { notches: 8, outcome: 'adapt' });
  assert.deepEqual(megumiWrongOutcome(8), { notches: 8, outcome: 'shatter' });
  assert.deepEqual(megumiWrongOutcome(9), { notches: 8, outcome: 'shatter' });
  // input kotor → aman (dianggap 0 takik → adapt)
  assert.deepEqual(megumiWrongOutcome(NaN), { notches: 1, outcome: 'adapt' });
  assert.deepEqual(megumiWrongOutcome(-4), { notches: 1, outcome: 'adapt' });
});

test('megumiAdaptCut: 1 opsi salah deterministik, jawaban benar TIDAK pernah masuk', () => {
  const opts = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
  assert.deepEqual(megumiAdaptCut(opts, 'a'), ['b']);
  assert.deepEqual(megumiAdaptCut(opts, 'b'), ['a']);
  // stabil: panggilan berulang hasil sama (bukan acak)
  assert.deepEqual(megumiAdaptCut(opts, 'a'), megumiAdaptCut(opts, 'a'));
  // count bisa dinaikkan (tuning) & input aneh aman
  assert.deepEqual(megumiAdaptCut(opts, 'a', 2), ['b', 'c']);
  assert.deepEqual(megumiAdaptCut(opts, 'a', 0), []);
  assert.deepEqual(megumiAdaptCut(null, 'a'), []);
  assert.deepEqual(megumiAdaptCut(['a', 'b', 'c'], 'a'), ['b']);
});

test('megumiSwordCut: 八握剣 = SEMUA opsi salah, jawaban benar aman', () => {
  const opts = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
  assert.deepEqual(megumiSwordCut(opts, 'a'), ['b', 'c', 'd']);
  assert.deepEqual(megumiSwordCut(opts, 'c'), ['a', 'b', 'd']);
  assert.deepEqual(megumiSwordCut(null, 'a'), []);
  assert.deepEqual(megumiSwordCut([], 'a'), []);
  assert.deepEqual(megumiSwordCut(['a', 'b', 'c'], 'a'), ['b', 'c']);
});

test('megumiWheelNotchPlan: 8 entri { id, on } sesuai jumlah takik', () => {
  const plan = megumiWheelNotchPlan(3);
  assert.equal(plan.length, 8);
  assert.deepEqual(plan.map((p) => p.on), [true, true, true, false, false, false, false, false]);
  assert.equal(plan[0].id, 'notch-0');
  // clamp: notches > max → semua on; notches aneh → semua off
  assert.ok(megumiWheelNotchPlan(99).every((p) => p.on));
  assert.ok(megumiWheelNotchPlan(NaN).every((p) => !p.on));
});

test('MEGUMI_STYLE lengkap: 5 jurus + mahoraga + adapt/sword/shatter, kanji & warna', () => {
  const keys = ['gyokuken', 'nue', 'orochi', 'bansou', 'kosou', 'mahoraga', 'adapt', 'sword', 'shatter'];
  assert.deepEqual(Object.keys(MEGUMI_STYLE).sort(), keys.slice().sort());
  for (const k of keys) {
    assert.ok(MEGUMI_STYLE[k].kanji && MEGUMI_STYLE[k].color && MEGUMI_STYLE[k].label, k);
  }
  assert.equal(MEGUMI_STYLE.gyokuken.kanji, '玉犬');
  assert.equal(MEGUMI_STYLE.nue.kanji, '鵺');
  assert.equal(MEGUMI_STYLE.orochi.kanji, '大蛇');
  assert.equal(MEGUMI_STYLE.bansou.kanji, '満象');
  assert.equal(MEGUMI_STYLE.kosou.kanji, '虎葬');
  assert.equal(MEGUMI_STYLE.mahoraga.kanji, '魔虚羅');
  assert.equal(MEGUMI_STYLE.adapt.kanji, '適応');
  assert.equal(MEGUMI_STYLE.sword.kanji, '八握剣');
  assert.equal(MEGUMI_STYLE.shatter.kanji, '輪砕け');
  // GIF cut-in kanon milik Megumi sendiri (anti-nabrak: bukan punya Sukuna)
  assert.equal(MEGUMI_STYLE.bansou.gif, '/effects/megumi_bansou.gif');
  assert.equal(MEGUMI_STYLE.mahoraga.gif, '/effects/megumi_mahoraga.gif');
  // warna identitas: tinta hitam + perak + 藍 indigo (spec §Identitas visual)
  assert.equal(MEGUMI_STYLE.gyokuken.color, '#cbd5e1');
  assert.equal(MEGUMI_STYLE.nue.color, '#4338ca');
});

test('generator partikel: pola TETAP (redesign v2.1 — bukan random) & bentuk valid', () => {
  const blobs = megumiPoolBlobs(7, 3);
  assert.equal(blobs.length, 3);
  assert.equal(blobs[0].id, '7-pb0');
  assert.ok(blobs.every((b) => b.x >= 0 && b.x <= 100 && b.w > 0 && b.dur > 0));
  // deterministik: panggilan berulang hasil SAMA (dulu rng → beda tiap kali)
  assert.deepEqual(megumiPoolBlobs(7, 3), megumiPoolBlobs(7, 3));

  const wolves = megumiWolfRise(1);
  assert.equal(wolves.length, 2);
  assert.deepEqual(wolves.map((w) => w.side), ['left', 'right']);
  // posisi TETAP di tepi — tidak ada properti x acak lagi
  assert.ok(!('x' in wolves[0]) || wolves[0].x === undefined);

  const claws = megumiClawSlashes(1);
  assert.equal(claws.length, 5, 'cakar = 3 goresan utama + 2 jejak kuku sekunder');
  assert.deepEqual(megumiClawSlashes(1), megumiClawSlashes(1), 'geometri cakar TETAP');
  // tiap goresan punya bow (lengkung) + thick (tebal) → bentuk sabit organik,
  // bukan stroke rata; dan menyeberang kartu (x0 → x1 hampir penuh)
  assert.ok(claws.every((s) => s.bow < 0 && s.thick > 0));
  assert.ok(claws.every((s) => s.x1 - s.x0 >= 25), 'goresan punya panjang nyata');
  // goresan sengaja TIDAK sejajar (mengipas): kemiringan antar goresan beda
  const slopes = claws.map((s) => (s.y1 - s.y0) / (s.x1 - s.x0));
  assert.ok(new Set(slopes.map((v) => v.toFixed(2))).size > 1, 'goresan tidak sejajar');
  // path alur: tertutup (Z) poligon tersapu, koordinat px dari ukuran kartu
  const p = megumiClawPath(claws[0], 300, 100);
  assert.ok(p.trench.startsWith('M') && p.trench.endsWith('Z'), 'trench = alur tertutup');
  assert.ok((p.trench.match(/L/g) || []).length > 20, 'alur tersapu (banyak titik)');
  assert.ok(p.lit.startsWith('M') && p.lit.endsWith('Z'), 'lit = pita dinding (tertutup)');
  assert.ok(p.core.startsWith('M') && !p.core.endsWith('Z'), 'core = garis terbuka');
  assert.notEqual(p.trench, p.lit, 'trench & lit beda (kedalaman, bukan garis rata)');
  assert.deepEqual(megumiClawPath(claws[0], 300, 100), megumiClawPath(claws[0], 300, 100));
  // wobble mengubah jalur: alur tidak simetris sempurna (organik, bukan rapi)
  const straight = megumiClawPath({ ...claws[0], wobble: 0, phase: 0 }, 300, 100);
  assert.notEqual(straight.trench, p.trench, 'wobble/chatter bikin jalur goyang');
  const bolts = megumiShadowBolts(1, 3);
  assert.equal(bolts.length, 3);
  // petir mulai DI ATAS layar (y negatif) lalu BERHENTI di atas soal (y ≤ 36)
  // — redesign v2: dulu turun sampai bawah (>= 95) & nembus karakter soal.
  assert.ok(bolts[0].pts[0][1] < 0);
  const lastY = bolts[0].pts[bolts[0].pts.length - 1][1];
  assert.ok(lastY > 20 && lastY <= 36, `petir berhenti di band atas (dapat ${lastY})`);
  // sambaran tersebar kiri → tengah → kanan
  assert.ok(bolts[0].pts[0][0] < bolts[2].pts[0][0]);

  assert.ok(megumiWingSpread(1).dur > 0);
  assert.equal(megumiSerpentCoils(1, 5).length, 5);
  assert.equal(megumiScales(1, 9).length, 9);
  assert.equal(megumiCracks(1, 5).length, 5);
  assert.ok(megumiWaterJet(1).len > 0);
  assert.equal(megumiRipples(1, 4).length, 4);
  const tiger = megumiTigerLeap(1);
  assert.ok(tiger.lunge > 0, 'harimau menerkam maju setelah bangkit');
  assert.equal(megumiFangCracks(1, 6).length, 6);
  const motes = megumiShadowMotes(1, 8);
  assert.equal(motes.length, 8);
  assert.ok(motes.every((m) => m.drift < 0), 'bara naik (drift negatif)');
});

test('generator partikel: hasil KONSISTEN antar panggilan (redesign v2.1 — deterministik)', () => {
  // Dulu generator pakai rng → tiap jawaban posisi beda ("random"). User minta
  // posisi tetap di pinggir; generator sekarang murni pola → panggilan berulang
  // harus IDENTIK (kontrak baru).
  const a = megumiPoolBlobs(1, 4);
  const b = megumiPoolBlobs(1, 4);
  assert.deepEqual(a.map((p) => p.x), b.map((p) => p.x));
  assert.deepEqual(megumiWolfRise(3), megumiWolfRise(3));
  assert.deepEqual(megumiSerpentCoils(9, 5), megumiSerpentCoils(9, 5));
  assert.deepEqual(megumiShadowMotes(2, 6), megumiShadowMotes(2, 6));
});

// ── v2.5 "PENJAGA SOAL": hewan di SAYAP soal, bukan tepi layar ───────────────
// Kritik user 29/09: 鵺 nempel tepi kiri + nabrak banner "✓ Correct!".
// Kontrak: (1) hewan rapat ke SOAL (bukan tepi layar), (2) sejajar tengah soal,
// (3) tidak masuk area konten (bounds), (4) sayap sempit → null (jangan gambar).
test('megumiFlankSlot: hewan rapat SOAL, bukan tepi layar (kasus HP 390×844)', () => {
  const vp = { w: 390, h: 844 };
  const q = { x: 159, y: 241, w: 72, h: 72 };          // あ ukuran nyata (ukur DOM)
  const L = megumiFlankSlot(vp, q, 'left', { aspect: 0.72 });
  const R = megumiFlankSlot(vp, q, 'right', { aspect: 0.72 });
  assert.ok(L && R);
  // Kiri: sisi KANAN hewan menempel ke soal (jarak ~gap), BUKAN menempel tepi layar
  assert.ok(L.left >= 12, `kiri tidak melewati tepi aman (left=${L.left})`);
  assert.ok(Math.abs((L.left + L.w) - (q.x - 10)) <= 0.5, 'kiri rapat ke soal (gap 10)');
  // Kanan: mulai setelah soal + gap, tidak melewati tepi aman
  assert.ok(Math.abs(R.left - (q.x + q.w + 10)) <= 0.5, 'kanan rapat ke soal (gap 10)');
  assert.ok(R.left + R.w <= vp.w - 12, 'kanan tidak melewati tepi');
  // Sejajar TENGAH soal (toleransi 1px — clamp tepi aman boleh geser sedikit)
  const cyL = L.top + L.h / 2;
  const cyR = R.top + R.h / 2;
  assert.ok(Math.abs(cyL - (q.y + q.h / 2)) <= 1, `kiri sejajar tengah soal (cy=${cyL})`);
  assert.ok(Math.abs(cyR - (q.y + q.h / 2)) <= 1, 'kanan sejajar tengah soal');
  // Ukuran proporsional: tidak kerdil, tidak lebih tinggi dari maxH·vh
  assert.ok(L.w >= 64 && L.h >= 80);
  assert.ok(L.h <= vp.h * 0.30 + 0.01, 'tinggi ≤ 30% vh');
  // Deterministik
  assert.deepEqual(megumiFlankSlot(vp, q, 'left', { aspect: 0.72 }), L);
});

test('megumiFlankSlot: tidak masuk area konten (bounds) & sayap sempit → null', () => {
  const vp = { w: 390, h: 844 };
  const q = { x: 159, y: 241, w: 72, h: 72 };
  // bounds = bawah header (y 200) s/d atas grid jawaban (y 377) — hewan wajib
  // berada di dalam band ini (tidak nabrak header/jawaban/banner).
  const s = megumiFlankSlot(vp, q, 'left', { aspect: 0.72, bounds: { top: 200, bottom: 377 } });
  assert.ok(s.top >= 200 - 0.01, `top di bawah bounds.top (top=${s.top})`);
  assert.ok(s.top + s.h <= 377 + 0.01, 'tidak masuk grid jawaban');
  // Soal LEBAR (grammar) → sayap kiri sempit → null (lebih baik tidak muncul)
  const wide = { x: 20, y: 300, w: 350, h: 60 };
  assert.equal(megumiFlankSlot(vp, wide, 'left', { aspect: 0.72 }), null);
  assert.equal(megumiFlankSlot(vp, wide, 'right', { aspect: 0.72 }), null);
  // Input kotor → null (tidak pernah crash / salah posisi)
  assert.equal(megumiFlankSlot(null, q, 'left'), null);
  assert.equal(megumiFlankSlot(vp, null, 'left'), null);
  assert.equal(megumiFlankSlot(vp, q, 'middle'), null);
  assert.equal(megumiFlankSlot({ w: 0, h: 844 }, q, 'left'), null);
  assert.equal(megumiFlankSlot(vp, { x: NaN, y: 1, w: 2, h: 2 }, 'left'), null);
});
