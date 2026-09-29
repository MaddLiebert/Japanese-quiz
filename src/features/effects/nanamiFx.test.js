import test from 'node:test';
import assert from 'node:assert/strict';
import {
  NANAMI_MILESTONES, isNanamiMilestone, nanamiTechniqueFor,
  NANAMI_LADDER, NANAMI_TOP, NANAMI_NON_STREAK_CYCLE, nanamiNonStreakIndex,
  NANAMI_ULT_THRESHOLD, nanamiCurseCharge, nanamiUltReady,
  NANAMI_ULT_DURATION_S, NANAMI_TIMELINE, NANAMI_QUOTE,
  NANAMI_OVERTIME_S, NANAMI_RUBBLE_MAX, NANAMI_ULT_MIN_WRONG,
  nanamiRubbleGain, nanamiRubbleCut, nanamiOvertimeOutcome,
  NANAMI_STYLE, NANAMI_MOTION, NANAMI_STAGGER, NANAMI_COLORS,
  NANAMI_WHITE, NANAMI_GOLD, NANAMI_GOLD_DEEP, NANAMI_NAVY, NANAMI_BLACK, NANAMI_RED,
  NANAMI_MIN_HOLD_MS, nanamiAnswerHoldMs,
  nanamiRatioLine, nanamiRubble, nanamiAura, nanamiCracks,
} from './nanamiFx.js';
import { GOJO_MILESTONES } from './gojoFx.js';

test('milestone Nanami = sama persis Gojo (konsisten JJK)', () => {
  assert.deepEqual(NANAMI_MILESTONES, GOJO_MILESTONES);
  assert.ok(isNanamiMilestone(3) && isNanamiMilestone(100));
  assert.ok(!isNanamiMilestone(4));
});

test('nanamiTechniqueFor: non-streak ROTASI shichisan → oonata → shichisan … (deterministik)', () => {
  assert.equal(nanamiTechniqueFor('correct', 1), 'shichisan');
  assert.equal(nanamiTechniqueFor('correct', 2), 'oonata');
  assert.equal(nanamiTechniqueFor('correct', 3), 'shichisan');
  assert.equal(nanamiTechniqueFor('correct', 4), 'oonata');
  assert.equal(nanamiTechniqueFor('correct', 9), 'shichisan');
  // 11..19 = non-momen (ladder 10 sudah lewat) → lanjut rotasi
  assert.equal(nanamiTechniqueFor('correct', 11), 'oonata');
  assert.equal(nanamiTechniqueFor('correct', 12), 'shichisan');
});

test('nanamiTechniqueFor: TIDAK PERNAH null utk streak benar > 0', () => {
  const valid = ['shichisan', 'oonata', 'garagara', 'kokusen', 'jikangai'];
  for (let s = 1; s <= 200; s++) {
    const t = nanamiTechniqueFor('correct', s);
    assert.ok(typeof t === 'string' && valid.includes(t), `streak ${s} -> ${t}`);
  }
});

test('nanamiTechniqueFor: momen TEPAT di 10 (瓦落瓦落) & 20 (黒閃); 30+ 時間外労働 (puncak)', () => {
  assert.equal(nanamiTechniqueFor('streak', 10), 'garagara');
  assert.equal(nanamiTechniqueFor('streak', 20), 'kokusen');
  // spec menulis "30" → 30, 31, 45, 100 tetap 時間外労働 (jurus puncak, bukan sekali lewat)
  for (const s of [30, 31, 45, 100, 150]) {
    assert.equal(nanamiTechniqueFor('streak', s), 'jikangai', `streak ${s}`);
  }
  // 21..29 = non-momen → rotasi (bukan null)
  for (const s of [21, 29]) {
    const t = nanamiTechniqueFor('streak', s);
    assert.ok(t === 'shichisan' || t === 'oonata', `streak ${s} harus rotasi, dapat ${t}`);
  }
});

test('nanamiNonStreakIndex: hitung jawaban benar non-momen (momen tidak menggeser)', () => {
  assert.equal(nanamiNonStreakIndex(0), 0);
  assert.equal(nanamiNonStreakIndex(1), 1);
  assert.equal(nanamiNonStreakIndex(9), 9);
  assert.equal(nanamiNonStreakIndex(10), 9, 'streak 10 = momen, index tidak naik');
  assert.equal(nanamiNonStreakIndex(11), 10, 'streak 11 = non-momen ke-10');
  assert.equal(nanamiNonStreakIndex(20), 18);
  assert.equal(nanamiNonStreakIndex(NaN), 0);
  assert.equal(nanamiNonStreakIndex(-5), 0);
});

test('NANAMI_NON_STREAK_CYCLE & NANAMI_LADDER = spec (rotasi deterministik)', () => {
  assert.deepEqual(NANAMI_NON_STREAK_CYCLE, ['shichisan', 'oonata']);
  assert.deepEqual(NANAMI_LADDER, { 10: 'garagara', 20: 'kokusen' });
  assert.equal(NANAMI_TOP, 30);
});

test('nanamiTechniqueFor: salah = null & TIDAK PERNAH ult (ult = bar, bukan streak)', () => {
  assert.equal(nanamiTechniqueFor('wrong', 0), null);
  for (let s = 1; s <= 200; s++) {
    assert.notEqual(nanamiTechniqueFor('streak', s), 'ult', `streak ${s}`);
  }
});

test('nanamiTechniqueFor: input kotor aman (null, bukan efek nyasar)', () => {
  assert.equal(nanamiTechniqueFor('correct', NaN), null);
  assert.equal(nanamiTechniqueFor('correct', -3), null);
  assert.equal(nanamiTechniqueFor('correct', undefined), null);
  assert.equal(nanamiTechniqueFor('correct', 0), null);
});

test('nanamiCurseCharge: 0..20 clamp, input aneh -> 0', () => {
  assert.equal(nanamiCurseCharge(0), 0);
  assert.equal(nanamiCurseCharge(5), 5);
  assert.equal(nanamiCurseCharge(20), 20);
  assert.equal(nanamiCurseCharge(999), NANAMI_ULT_THRESHOLD);
  for (const bad of [NaN, -1, null, undefined, 'x']) assert.equal(nanamiCurseCharge(bad), 0, String(bad));
});

test('nanamiUltReady: penuh di 20', () => {
  assert.ok(!nanamiUltReady(19));
  assert.ok(nanamiUltReady(20));
  assert.ok(nanamiUltReady(50));
  assert.ok(!nanamiUltReady(NaN));
});

test('NANAMI_ULT_DURATION_S = 2.4s cinematic (lalu state lembur 30 dtk)', () => {
  assert.equal(NANAMI_ULT_DURATION_S, 2.4);
  // timeline urut naik & settle = durasi
  const t = NANAMI_TIMELINE;
  assert.ok(t.veilAt < t.watchAt && t.watchAt < t.tieAt && t.tieAt < t.quoteAt);
  assert.ok(t.quoteAt < t.auraAt && t.auraAt < t.lineAt && t.lineAt < t.settleAt);
  assert.equal(t.settleAt, NANAMI_ULT_DURATION_S);
  // quote per-frasa selesai SEBELUM aura meledak
  assert.ok(t.quoteAt + t.quotePer * NANAMI_QUOTE.length <= t.auraAt, 'frasa selesai sebelum aura');
  assert.equal(NANAMI_OVERTIME_S, 30);
});

test('NANAMI_QUOTE: 3 frasa kanon (join = kalimat penuh spec)', () => {
  assert.equal(NANAMI_QUOTE.length, 3);
  assert.equal(NANAMI_QUOTE.join(''), '残念ですがここからは時間外労働です');
});

test('nanamiRubbleGain: +1 puing per benar, cap NANAMI_RUBBLE_MAX = 3', () => {
  assert.equal(NANAMI_RUBBLE_MAX, 3);
  assert.equal(nanamiRubbleGain(0), 1);
  assert.equal(nanamiRubbleGain(1), 2);
  assert.equal(nanamiRubbleGain(2), 3);
  assert.equal(nanamiRubbleGain(3), 3, 'cap — tidak pernah 4');
  assert.equal(nanamiRubbleGain(99), 3);
  for (const bad of [NaN, -1, null, undefined, 'x']) assert.equal(nanamiRubbleGain(bad), 1, String(bad));
});

test('nanamiRubbleCut: puing menghancurkan opsi salah, SELALU sisakan ≥1 salah', () => {
  assert.equal(NANAMI_ULT_MIN_WRONG, 1);
  const options = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
  // 1 benar → soal berikut 1 opsi salah hancur (4 opsi → sisa 3)
  assert.deepEqual(nanamiRubbleCut(options, 'a', 1), ['b']);
  // 2 benar beruntun → 2 opsi hancur (4 opsi → sisa 2)
  assert.deepEqual(nanamiRubbleCut(options, 'a', 2), ['b', 'c']);
  // puing 3 (cap) → tetap sisa ≥1 salah → hanya 2 yang bisa hancur dari 3 salah
  assert.deepEqual(nanamiRubbleCut(options, 'a', 3), ['b', 'c']);
  // benar TIDAK pernah masuk daftar cut
  const cutB = nanamiRubbleCut(options, 'b', 2);
  assert.ok(!cutB.includes('b'), 'benar tidak boleh dipotong');
});

test('nanamiRubbleCut: input kotor aman', () => {
  assert.deepEqual(nanamiRubbleCut(null, 'a', 2), []);
  assert.deepEqual(nanamiRubbleCut([], 'a', 2), []);
  assert.deepEqual(nanamiRubbleCut(['a', 'b'], 'a', 5), [], '2 opsi → 1 salah → sisakan 1 → cut 0');
  assert.deepEqual(nanamiRubbleCut(['a', 'b', 'c'], 'a', 0), [], 'puing 0 → tidak ada cut');
  assert.deepEqual(nanamiRubbleCut(['a', 'b', 'c'], 'a', 99), ['b'], 'puing besar → tetap sisakan 1 (dari 2 salah hanya 1 boleh hancur)');
});

test('nanamiOvertimeOutcome: benar → stack (+1 cap), salah → kontrak batal, timeout → padam', () => {
  assert.deepEqual(nanamiOvertimeOutcome('correct', 0), { piles: 1, outcome: 'stack' });
  assert.deepEqual(nanamiOvertimeOutcome('correct', 2), { piles: 3, outcome: 'stack' });
  assert.deepEqual(nanamiOvertimeOutcome('correct', 3), { piles: 3, outcome: 'stack' });
  // salah = kontrak batal (縛り破棄): state bubar + puing rontok + streak hangus
  assert.deepEqual(nanamiOvertimeOutcome('wrong', 2), { piles: 0, outcome: 'contract' });
  // timeout = padam alami (streak tetap)
  assert.deepEqual(nanamiOvertimeOutcome('timeout', 2), { piles: 0, outcome: 'expire' });
  // input kotor aman
  assert.deepEqual(nanamiOvertimeOutcome('wrong', NaN), { piles: 0, outcome: 'contract' });
  assert.deepEqual(nanamiOvertimeOutcome('correct', NaN), { piles: 1, outcome: 'stack' });
});

test('palet: 3 lapis + navy + 黒閃 (design token ui-ux-pro-max)', () => {
  assert.equal(NANAMI_WHITE, '#ffffff');
  assert.equal(NANAMI_GOLD, '#F59E0B');
  assert.equal(NANAMI_GOLD_DEEP, '#B45309');
  assert.equal(NANAMI_NAVY, '#1E3A8A');
  assert.equal(NANAMI_BLACK, '#0a0a0a');
  assert.equal(NANAMI_RED, '#dc2626');
  assert.deepEqual(NANAMI_COLORS, {
    core: NANAMI_WHITE, gold: NANAMI_GOLD, goldDeep: NANAMI_GOLD_DEEP,
    navy: NANAMI_NAVY, black: NANAMI_BLACK, red: NANAMI_RED,
  });
});

test('NANAMI_STYLE: kanji + warna utk tiap jurus', () => {
  const kanji = { shichisan: '七三', oonata: '大鉈', garagara: '瓦落瓦落', kokusen: '黒閃', jikangai: '時間外労働', ult: '時間外労働・全開' };
  for (const k of Object.keys(kanji)) {
    assert.ok(NANAMI_STYLE[k], `style ${k} harus ada`);
    assert.equal(NANAMI_STYLE[k].kanji, kanji[k], `kanji ${k}`);
    assert.ok(NANAMI_STYLE[k].color, `color ${k}`);
  }
});

test('NANAMI_MOTION: easing beda per peran (anti-slop) + durasi bertingkat', () => {
  assert.notEqual(NANAMI_MOTION.line, NANAMI_MOTION.impact, 'line ≠ impact');
  assert.notEqual(NANAMI_MOTION.impact, NANAMI_MOTION.exit);
  assert.notEqual(NANAMI_MOTION.exit, NANAMI_MOTION.reveal);
  assert.ok(NANAMI_MOTION.durFast < NANAMI_MOTION.durMid);
  assert.ok(NANAMI_MOTION.durMid < NANAMI_MOTION.durCine);
});

test('NANAMI_STAGGER: garis 0 → titik 120 → tebasan 200 → percikan 280 → puing 360 (anti-slop #4)', () => {
  assert.equal(NANAMI_STAGGER.line, 0);
  assert.equal(NANAMI_STAGGER.point, 0.12);
  assert.equal(NANAMI_STAGGER.slash, 0.2);
  assert.equal(NANAMI_STAGGER.spark, 0.28);
  assert.equal(NANAMI_STAGGER.rubble, 0.36);
});

test('nanamiAnswerHoldMs: min hold rare; clipMs eksplisit menang', () => {
  assert.equal(NANAMI_MIN_HOLD_MS, 1400);
  assert.equal(nanamiAnswerHoldMs(), 1400, 'tanpa klip (T5 nunggu) → min hold');
  assert.equal(nanamiAnswerHoldMs(300), 1400, 'klip pendek + 400ms tetap di bawah min');
  assert.equal(nanamiAnswerHoldMs(5000), 5400, 'klip panjang + 400ms');
  assert.equal(nanamiAnswerHoldMs(0, 3000), 3000, 'baseHold menang');
});

// ── Determinisme (pola redesign Megumi v2.1: tanpa rng — hasil identik) ─────
test('generator DETERMINISTIK: panggilan sama → hasil identik', () => {
  const gens = [nanamiRatioLine, nanamiRubble, nanamiAura, nanamiCracks];
  for (const gen of gens) {
    assert.deepEqual(gen(7), gen(7), `${gen.name} harus deterministik`);
  }
});

test('nanamiRatioLine: garis 7:3 — tumbuh dari tepi, titik di 70%, notch presisi', () => {
  const l = nanamiRatioLine(1);
  assert.notEqual(l.x0, l.x1, 'garis, bukan titik');
  assert.notEqual(l.y0, l.y1);
  assert.ok(l.x0 < 0, 'mulai dari luar kartu (kiri)');
  assert.equal(l.ratio, 0.7);
  assert.equal(l.growTo, 0.7, 'tumbuh berhenti DI titik 7:3');
  // titik 7:3 = 70% sepanjang garis & ADA di dalam kartu (0-100)
  assert.ok(Math.abs(l.px - (l.x0 + l.ratio * (l.x1 - l.x0))) < 0.02, 'px = 70% sepanjang garis');
  assert.ok(Math.abs(l.py - (l.y0 + l.ratio * (l.y1 - l.y0))) < 0.02, 'py = 70% sepanjang garis');
  assert.ok(l.px > 0 && l.px < 100 && l.py > 0 && l.py < 100, 'titik 7:3 di dalam kartu');
  assert.ok(Math.abs(l.angle) > 8 && Math.abs(l.angle) < 25, 'kemiringan konsisten (bukan acak)');
  assert.ok(l.notch.len > 0 && l.notch.w > 0, 'notch tanda 7:3');
  assert.equal(l.dur, 0.22, 'power2.out 220ms — presisi, bukan bounce');
});

test('nanamiRubble: poligon tak beraturan, radial dari titik hancur, rotasi searah luncuran', () => {
  const rb = nanamiRubble(1, 6);
  assert.equal(rb.length, 6);
  for (const p of rb) {
    assert.ok(p.sides >= 5 && p.sides <= 7, 'poligon tak beraturan 5-7 sisi');
    assert.ok(Math.hypot(p.dx, p.dy) > 0, 'meluncur radial (bukan diam)');
    assert.equal(Math.sign(p.spin), Math.sign(p.dx), 'rotasi searah luncuran (fisika)');
  }
  assert.equal(rb[0].delay, 0.36, 'mulai dari stagger puing 360ms');
  assert.ok(Math.abs(rb[1].delay - rb[0].delay - 0.03) < 0.001, 'stagger 30ms');
});

test('nanamiAura: partikel naik bergelombang (sin) — bukan glow statis', () => {
  const au = nanamiAura(1, 10);
  assert.equal(au.length, 10);
  for (const p of au) {
    assert.ok(p.sway > 0, 'amplitudo gelombang sinus > 0');
    assert.ok(p.rise > 0, 'naik dari bawah');
  }
  for (let i = 1; i < au.length; i++) {
    assert.ok(au[i].x > au[i - 1].x, 'sebaran horizontal merata');
  }
  assert.ok(new Set(au.map((p) => p.phase)).size >= 8, 'fase beda → gelombang, bukan garis');
});

test('nanamiCracks: retakan dinding punya cabang & makin tipis (w0 > w1)', () => {
  const ck = nanamiCracks(1, 4);
  assert.equal(ck.length, 4);
  for (const c of ck) {
    assert.ok(c.branch.length >= 1 && c.branch.length <= 2, 'cabang 1-2 per retakan utama');
    assert.ok(c.w0 > c.w1, 'pangkal lebih tebal dari ujung');
  }
});
