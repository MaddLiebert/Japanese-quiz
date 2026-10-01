import test from 'node:test';
import assert from 'node:assert/strict';
import {
  YUTA_MILESTONES, isYutaMilestone,
  YUTA_COPY_POOL, YUTA_COPY_META, isValidYutaCopy, yutaCopyMeta, yutaCopyPool,
  yutaDrawKatanas, YUTA_KATANA_COUNT,
  yutaTechniqueFor, yutaNonStreakIndex, YUTA_LADDER, YUTA_TOP, YUTA_NON_STREAK_CYCLE,
  YUTA_ULT_THRESHOLD, yutaCurseCharge, yutaUltReady,
  YUTA_DOMAIN_DURATION_S, yutaCopyDurationS, yutaCopyLeft,
  yutaCopyFreezes, yutaCopyPerQuestionCut, yutaCopyCut, yutaCopyCutDelayMs,
  yutaCopyMechanic, yutaCopyInit, yutaCopyOutcome, YUTA_COPY_LIMITS,
  YUTA_STYLE, yutaKatana, yutaRipples, yutaCopyRings, yutaSwordField,
  YUTA_COPY_EMBLEM, yutaCopyEmblem, yutaCopyTint, YUTA_DOMAIN,
} from './yutaFx.js';
import { SUKUNA_HITSUME_DELAY_MS, SUKUNA_BLOOD } from './sukunaFx.js';
import { NOBARA_ULT_TIMELINE, NOBARA_STRAW } from './nobaraFx.js';
import { TOJI_AMMO_MAX, TOJI_STEEL } from './tojiFx.js';
import { GOJO_RIM } from './gojoFx.js';
import { YUJI_FIRE_COLORS } from './yujiFx.js';
import { MEGUMI_INDIGO } from './megumiFx.js';
import { NANAMI_GOLD } from './nanamiFx.js';

test('milestone Yuta = sama persis pack JJK lain (konsisten)', () => {
  assert.deepEqual(YUTA_MILESTONES, [3, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
  assert.ok(isYutaMilestone(3) && isYutaMilestone(100));
  assert.ok(!isYutaMilestone(4));
});

test('pool copy = 7 ultimate voicepack; meta lengkap; validasi', () => {
  assert.deepEqual(YUTA_COPY_POOL, ['gojo', 'sukuna', 'nobara', 'yuji', 'megumi', 'nanami', 'toji']);
  assert.equal(yutaCopyPool().length, 7);
  for (const id of YUTA_COPY_POOL) {
    const m = YUTA_COPY_META[id];
    assert.ok(m.kanji && m.label && m.mechanic && m.color && m.blurb, id);
  }
  assert.equal(yutaCopyMeta('gojo').kanji, '無量空処');
  assert.equal(yutaCopyMeta('sukuna').kanji, '伏魔御廚子');
  assert.equal(yutaCopyMeta('nobara').kanji, '共鳴り');
  assert.equal(yutaCopyMeta('yuji').kanji, '宿儺の器');
  assert.equal(yutaCopyMeta('megumi').kanji, '魔虚羅');
  assert.equal(yutaCopyMeta('nanami').kanji, '時間外労働');
  assert.equal(yutaCopyMeta('toji').kanji, '天与呪縛');
  assert.ok(isValidYutaCopy('toji') && !isValidYutaCopy('hina') && !isValidYutaCopy(null));
  assert.equal(yutaCopyMeta('zzz'), null);
  assert.equal(yutaCopyMechanic('toji'), 'ammo');
  assert.equal(yutaCopyMechanic('zzz'), null);
});

test('yutaDrawKatanas: 3 unik dari 7, deterministik (seed sama → sama)', () => {
  const a = yutaDrawKatanas(42);
  const b = yutaDrawKatanas(42);
  assert.deepEqual(a, b);
  assert.equal(a.length, YUTA_KATANA_COUNT);
  assert.equal(new Set(a).size, 3, 'unik, tanpa duplikat');
  for (const id of a) assert.ok(YUTA_COPY_POOL.includes(id), id);
  // semua id sah untuk banyak seed; count bisa di-override & di-clamp
  for (let s = 1; s <= 50; s++) {
    const d = yutaDrawKatanas(s);
    assert.equal(d.length, 3);
    assert.equal(new Set(d).size, 3);
    for (const id of d) assert.ok(isValidYutaCopy(id), `seed ${s} -> ${id}`);
  }
  assert.equal(yutaDrawKatanas(1, 99).length, 7, 'count di-clamp ke ukuran pool');
  assert.equal(yutaDrawKatanas(1, 1).length, 1);
  // rng injectable (deterministik di tes)
  const seq = [0.9, 0.1, 0.5, 0.3, 0.7, 0.2, 0.4]; let i = 0;
  const d = yutaDrawKatanas(0, 3, () => seq[i++ % seq.length]);
  assert.equal(new Set(d).size, 3);
});

test('yutaTechniqueFor: rotasi non-streak deterministik, ladder 10/20, TOP 30', () => {
  assert.equal(yutaTechniqueFor('wrong', 5), null);
  assert.equal(yutaTechniqueFor('correct', 0), null);
  assert.equal(yutaTechniqueFor('correct', NaN), null);
  assert.equal(yutaTechniqueFor('correct', 1), 'katana');
  assert.equal(yutaTechniqueFor('correct', 2), 'ripples');
  assert.equal(yutaTechniqueFor('correct', 3), 'katana');
  assert.equal(yutaTechniqueFor('streak', 10), 'reversal');
  assert.equal(yutaTechniqueFor('streak', 20), 'mimic');
  assert.equal(yutaTechniqueFor('streak', 30), 'ult');
  assert.equal(yutaTechniqueFor('streak', 99), 'ult');
  for (let s = 1; s <= 120; s++) {
    const t = yutaTechniqueFor('correct', s);
    assert.ok(typeof t === 'string' && t.length > 0, `streak ${s} -> ${t}`);
  }
});

test('yutaNonStreakIndex: momen tidak menggeser hitungan', () => {
  assert.equal(yutaNonStreakIndex(0), 0);
  assert.equal(yutaNonStreakIndex(1), 1);
  assert.equal(yutaNonStreakIndex(10), 9);
  assert.equal(yutaNonStreakIndex(11), 10);
  assert.equal(yutaNonStreakIndex(20), 18);
  assert.equal(yutaNonStreakIndex(21), 19);
  assert.equal(yutaNonStreakIndex(NaN), 0);
  assert.deepEqual(YUTA_LADDER, { 10: 'reversal', 20: 'mimic' });
  assert.equal(YUTA_TOP, 30);
  assert.deepEqual(YUTA_NON_STREAK_CYCLE, ['katana', 'ripples']);
});

test('yutaCurseCharge 0..20 clamp; yutaUltReady di 20', () => {
  assert.equal(yutaCurseCharge(0), 0);
  assert.equal(yutaCurseCharge(7), 7);
  assert.equal(yutaCurseCharge(999), YUTA_ULT_THRESHOLD);
  for (const bad of [NaN, -1, null, undefined, 'x']) assert.equal(yutaCurseCharge(bad), 0, String(bad));
  assert.ok(!yutaUltReady(19) && yutaUltReady(20) && yutaUltReady(50));
});

test('durasi copy = SELALU 30 dtk domain Yuta (keputusan user), bukan durasi asli', () => {
  assert.equal(YUTA_DOMAIN_DURATION_S, 30);
  for (const id of YUTA_COPY_POOL) assert.equal(yutaCopyDurationS(id), 30, id);
  assert.equal(yutaCopyDurationS('zzz'), 0);
});

test('yutaCopyLeft: clamp 0..30, input aneh → 0', () => {
  const now = 1_000_000;
  assert.equal(yutaCopyLeft(now + 30000, now), 30);
  assert.equal(yutaCopyLeft(now + 10500, now), 11);
  assert.equal(yutaCopyLeft(now - 1, now), 0);
  for (const bad of [NaN, Infinity, null, undefined]) assert.equal(yutaCopyLeft(bad, now), 0, String(bad));
});

test('DELEGASI: freeze hanya gojo; per-question cut sukuna=all, nobara=keep1', () => {
  assert.equal(yutaCopyFreezes('gojo'), true);
  for (const id of ['sukuna', 'nobara', 'yuji', 'megumi', 'nanami', 'toji', 'zzz']) {
    assert.equal(yutaCopyFreezes(id), false, id);
  }
  assert.equal(yutaCopyPerQuestionCut('sukuna'), 'all');
  assert.equal(yutaCopyPerQuestionCut('nobara'), 'keep1');
  assert.equal(yutaCopyPerQuestionCut('gojo'), null);

  const opts = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
  // sukuna → SEMUA opsi salah (jawaban benar aman)
  assert.deepEqual(yutaCopyCut('sukuna', opts, 'a'), ['b', 'c', 'd']);
  assert.deepEqual(yutaCopyCut('sukuna', opts, 'c'), ['a', 'b', 'd']);
  // nobara → sisa ≥1 opsi salah (keepWrong default 1)
  assert.deepEqual(yutaCopyCut('nobara', opts, 'a'), ['b', 'c']);
  assert.deepEqual(yutaCopyCut('nobara', opts, 'a', 2), ['b']);
  // lainnya → tidak ada potongan
  for (const id of ['gojo', 'yuji', 'megumi', 'nanami', 'toji', 'zzz']) {
    assert.deepEqual(yutaCopyCut(id, opts, 'a'), [], id);
  }
  assert.deepEqual(yutaCopyCut('sukuna', null, 'a'), []);

  assert.equal(yutaCopyCutDelayMs('sukuna'), SUKUNA_HITSUME_DELAY_MS);
  assert.equal(yutaCopyCutDelayMs('nobara'), Math.round(NOBARA_ULT_TIMELINE.cutAt * 1000));
  assert.equal(yutaCopyCutDelayMs('gojo'), 0);
});

test('DELEGASI ekonomi: init & outcome per copy (ammo/puing/takik/combo)', () => {
  // init state
  assert.deepEqual(yutaCopyInit('gojo'), {});
  assert.deepEqual(yutaCopyInit('sukuna'), {});
  assert.equal(yutaCopyInit('toji').ammo, 2);              // tojiStateStartAmmo()
  assert.equal(yutaCopyInit('nanami').piles, 0);
  assert.equal(yutaCopyInit('megumi').wheel, 0);
  assert.equal(yutaCopyInit('yuji').combo, 0);

  // toji: benar → +1 ammo; salah → spend (bunuh soal); salah saat 0 → break
  assert.deepEqual(yutaCopyOutcome('toji', 'correct', { ammo: 0 }), { ammo: 1, outcome: 'load' });
  assert.deepEqual(yutaCopyOutcome('toji', 'wrong', { ammo: 2 }), { ammo: 1, outcome: 'spend' });
  assert.deepEqual(yutaCopyOutcome('toji', 'wrong', { ammo: 0 }), { ammo: 0, outcome: 'break' });
  // nanami: benar → +1 puing; salah → kontrak batal
  assert.deepEqual(yutaCopyOutcome('nanami', 'correct', { piles: 1 }), { piles: 2, outcome: 'stack' });
  assert.deepEqual(yutaCopyOutcome('nanami', 'wrong', { piles: 2 }), { piles: 0, outcome: 'contract' });
  // megumi: salah → takik +1 (adapt); roda penuh → shatter
  assert.equal(yutaCopyOutcome('megumi', 'wrong', { wheel: 0 }).outcome, 'adapt');
  assert.equal(yutaCopyOutcome('megumi', 'wrong', { wheel: 0 }).notches, 1);
  assert.equal(yutaCopyOutcome('megumi', 'wrong', { wheel: 8 }).outcome, 'shatter');
  // yuji: benar → combo naik (cap 3)
  assert.equal(yutaCopyOutcome('yuji', 'correct', { combo: 0 }).combo, 1);
  assert.equal(yutaCopyOutcome('yuji', 'correct', { combo: 3 }).combo, 3);
  // aman untuk id/state aneh
  assert.deepEqual(yutaCopyOutcome('zzz', 'correct', {}), {});
  assert.deepEqual(yutaCopyOutcome('toji', 'correct', {}), { ammo: 1, outcome: 'load' });
  // cap delegasi = konstanta pack sumber (bukan angka duplikat)
  assert.equal(YUTA_COPY_LIMITS.ammoMax, TOJI_AMMO_MAX);
});

test('YUTA_STYLE lengkap: 4 jurus + ult + wrong', () => {
  const keys = ['katana', 'ripples', 'reversal', 'mimic', 'ult', 'wrong'];
  assert.deepEqual(Object.keys(YUTA_STYLE).sort(), keys.slice().sort());
  for (const k of keys) assert.ok(YUTA_STYLE[k].kanji && YUTA_STYLE[k].color && YUTA_STYLE[k].label, k);
  assert.equal(YUTA_STYLE.ult.kanji, '真贋相愛');
  assert.equal(YUTA_STYLE.mimic.kanji, '模倣');
});

test('generator partikel & lautan pedang: deterministik, tanpa NaN', () => {
  assert.deepEqual(yutaKatana(7), yutaKatana(7));
  assert.deepEqual(yutaRipples(3), yutaRipples(3));
  assert.deepEqual(yutaCopyRings(2), yutaCopyRings(2));
  assert.deepEqual(yutaSwordField(5), yutaSwordField(5));
  const k = yutaKatana(1);
  assert.ok(k.id && Number.isFinite(k.dur) && k.dur > 0);
  for (const r of yutaRipples(1)) assert.ok(Number.isFinite(r.r) && r.r > 0);
  for (const c of yutaCopyRings(1)) assert.ok(Number.isFinite(c.r) && c.r > 0);
  const field = yutaSwordField(1, 24);
  assert.equal(field.length, 24);
  for (const s of field) {
    assert.ok(Number.isFinite(s.x) && Number.isFinite(s.y) && Number.isFinite(s.rot), JSON.stringify(s));
    assert.ok(s.h > 0);
  }
});

// ── T7: identitas visual copy (opsi 2) — emblem ikonik + tint domain ──────────
test('YUTA_COPY_EMBLEM: 7 emblem lengkap, kanji + glyph valid', () => {
  assert.deepEqual(Object.keys(YUTA_COPY_EMBLEM).sort(), YUTA_COPY_POOL.slice().sort());
  for (const id of YUTA_COPY_POOL) {
    const e = YUTA_COPY_EMBLEM[id];
    assert.ok(e.kanji && typeof e.kanji === 'string', id);
    assert.ok(['void', 'shrine', 'straw', 'fire', 'wheel', 'watch', 'reticle'].includes(e.glyph), id);
  }
  assert.equal(YUTA_COPY_EMBLEM.gojo.kanji, '無');
  assert.equal(YUTA_COPY_EMBLEM.nanami.kanji, '時');
  assert.equal(YUTA_COPY_EMBLEM.toji.kanji, '天');
});

test('yutaCopyEmblem: validasi id; null untuk id tak dikenal', () => {
  assert.equal(yutaCopyEmblem('sukuna').glyph, 'shrine');
  assert.equal(yutaCopyEmblem('zzz'), null);
  assert.equal(yutaCopyEmblem(null), null);
});

test('emblem pakai token warna pack sumber (DRY — bukan hex duplikat)', () => {
  assert.equal(YUTA_COPY_EMBLEM.gojo.color, GOJO_RIM);
  assert.equal(YUTA_COPY_EMBLEM.sukuna.color, SUKUNA_BLOOD);
  assert.equal(YUTA_COPY_EMBLEM.nobara.color, NOBARA_STRAW);
  assert.equal(YUTA_COPY_EMBLEM.yuji.color, YUJI_FIRE_COLORS[2]);
  assert.equal(YUTA_COPY_EMBLEM.megumi.color, MEGUMI_INDIGO);
  assert.equal(YUTA_COPY_EMBLEM.nanami.color, NANAMI_GOLD);
  assert.equal(YUTA_COPY_EMBLEM.toji.color, TOJI_STEEL);
});

test('yutaCopyTint: copyId dikenal → hex alpha; default = darah Yuta', () => {
  assert.equal(yutaCopyTint('nanami', 0.3), `${NANAMI_GOLD}4d`); // 0.3*255≈77=0x4d
  assert.equal(yutaCopyTint('zzz', 0.3), `${YUTA_DOMAIN.blood}4d`);
  assert.equal(yutaCopyTint(null), YUTA_DOMAIN.blood);
  // clamp alpha 0..1
  assert.equal(yutaCopyTint('gojo', 5), `${GOJO_RIM}ff`);
  assert.equal(yutaCopyTint('gojo', -1), `${GOJO_RIM}00`);
});

test('emblem deterministik & tanpa NaN saat dirender (sebaran) — pure data', () => {
  for (const id of YUTA_COPY_POOL) {
    const e = yutaCopyEmblem(id);
    assert.ok(e.color.startsWith('#') && e.color.length === 7, id);
  }
});
