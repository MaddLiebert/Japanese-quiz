import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TOJI_MILESTONES, isTojiMilestone, tojiTechniqueFor,
  TOJI_LADDER, TOJI_TOP, TOJI_NON_STREAK_CYCLE, tojiNonStreakIndex,
  TOJI_ULT_THRESHOLD, tojiCurseCharge, tojiUltReady,
  TOJI_ULT_DURATION_S, TOJI_TIMELINE, TOJI_QUOTE, TOJI_CAST_VOICE,
  TOJI_STATE_S, TOJI_AMMO_MAX, TOJI_STATE_START_AMMO,
  tojiAmmoGain, tojiAmmoSpend, tojiUltOutcome, tojiCutOptions, tojiStateStartAmmo,
  TOJI_STYLE, TOJI_MOTION, TOJI_STAGGER, TOJI_COLORS,
  TOJI_FLASH, TOJI_STEEL, TOJI_GUNMETAL, TOJI_VOID, TOJI_BLOOD, TOJI_WORM,
  TOJI_MIN_HOLD_MS, tojiAnswerHoldMs, tojiUltHoldMs, tojiStateLeft,
  tojiBlade, tojiChain, tojiSoulSplit, tojiWorm, TOJI_WORM_WEAPONS,
  tojiStateStartDelayMs, TOJI_SKIP_DELAY_MS, TOJI_KILL_HOLD_MS,
} from './tojiFx.js';
import { GOJO_MILESTONES } from './gojoFx.js';

test('milestone Toji = sama persis Gojo (konsisten JJK)', () => {
  assert.deepEqual(TOJI_MILESTONES, GOJO_MILESTONES);
  assert.ok(isTojiMilestone(3) && isTojiMilestone(100));
  assert.ok(!isTojiMilestone(4));
});

test('tojiTechniqueFor: non-streak ROTASI 釈魂刀 → 万里ノ鎖 → 釈魂刀 … (deterministik)', () => {
  assert.equal(tojiTechniqueFor('correct', 1), 'shakkontou');
  assert.equal(tojiTechniqueFor('correct', 2), 'banri_no_kusari');
  assert.equal(tojiTechniqueFor('correct', 3), 'shakkontou');
  assert.equal(tojiTechniqueFor('correct', 4), 'banri_no_kusari');
  assert.equal(tojiTechniqueFor('correct', 9), 'shakkontou');
  // 11..19 = non-momen (ladder 10 sudah lewat) → lanjut rotasi
  assert.equal(tojiTechniqueFor('correct', 11), 'banri_no_kusari');
  assert.equal(tojiTechniqueFor('correct', 12), 'shakkontou');
});

test('tojiTechniqueFor: TIDAK PERNAH null utk streak benar > 0', () => {
  const valid = ['shakkontou', 'banri_no_kusari', 'amanosakahoko', 'yuuyun', 'bukiko_jurei'];
  for (let s = 1; s <= 200; s++) {
    const t = tojiTechniqueFor('correct', s);
    assert.ok(typeof t === 'string' && valid.includes(t), `streak ${s} -> ${t}`);
  }
});

test('tojiTechniqueFor: momen TEPAT di 10 (天逆鉾) & 20 (遊雲); 30+ 武器庫呪霊 (puncak)', () => {
  assert.equal(tojiTechniqueFor('streak', 10), 'amanosakahoko');
  assert.equal(tojiTechniqueFor('streak', 20), 'yuuyun');
  // spec menulis "30" → 30, 31, 45, 100 tetap 武器庫呪霊 (jurus puncak, bukan sekali lewat)
  for (const s of [30, 31, 45, 100, 150]) {
    assert.equal(tojiTechniqueFor('streak', s), 'bukiko_jurei', `streak ${s}`);
  }
  // 21..29 = non-momen → rotasi (bukan null)
  for (const s of [21, 29]) {
    const t = tojiTechniqueFor('streak', s);
    assert.ok(t === 'shakkontou' || t === 'banri_no_kusari', `streak ${s} harus rotasi, dapat ${t}`);
  }
});

test('tojiNonStreakIndex: hitung jawaban benar non-momen (momen tidak menggeser)', () => {
  assert.equal(tojiNonStreakIndex(0), 0);
  assert.equal(tojiNonStreakIndex(1), 1);
  assert.equal(tojiNonStreakIndex(9), 9);
  assert.equal(tojiNonStreakIndex(10), 9, 'streak 10 = momen, index tidak naik');
  assert.equal(tojiNonStreakIndex(11), 10, 'streak 11 = non-momen ke-10');
  assert.equal(tojiNonStreakIndex(20), 18);
  assert.equal(tojiNonStreakIndex(NaN), 0);
  assert.equal(tojiNonStreakIndex(-5), 0);
});

test('TOJI_NON_STREAK_CYCLE & TOJI_LADDER = spec (rotasi deterministik)', () => {
  assert.deepEqual(TOJI_NON_STREAK_CYCLE, ['shakkontou', 'banri_no_kusari']);
  assert.deepEqual(TOJI_LADDER, { 10: 'amanosakahoko', 20: 'yuuyun' });
  assert.equal(TOJI_TOP, 30);
});

test('tojiTechniqueFor: salah = null & TIDAK PERNAH ult (ult = bar, bukan streak)', () => {
  assert.equal(tojiTechniqueFor('wrong', 0), null);
  for (let s = 1; s <= 200; s++) {
    assert.notEqual(tojiTechniqueFor('streak', s), 'ult', `streak ${s}`);
  }
});

test('tojiTechniqueFor: input kotor aman (null, bukan efek nyasar)', () => {
  assert.equal(tojiTechniqueFor('correct', NaN), null);
  assert.equal(tojiTechniqueFor('correct', -3), null);
  assert.equal(tojiTechniqueFor('correct', undefined), null);
  assert.equal(tojiTechniqueFor('correct', 0), null);
});

test('tojiCurseCharge: 0..20 clamp, input aneh -> 0', () => {
  assert.equal(tojiCurseCharge(0), 0);
  assert.equal(tojiCurseCharge(5), 5);
  assert.equal(tojiCurseCharge(20), 20);
  assert.equal(tojiCurseCharge(999), TOJI_ULT_THRESHOLD);
  for (const bad of [NaN, -1, null, undefined, 'x']) assert.equal(tojiCurseCharge(bad), 0, String(bad));
});

test('tojiUltReady: penuh di 20', () => {
  assert.ok(!tojiUltReady(19));
  assert.ok(tojiUltReady(20));
  assert.ok(tojiUltReady(50));
  assert.ok(!tojiUltReady(NaN));
});

test('TOJI_ULT_DURATION_S = 2.78s = durasi cast.mp3 TERUKUR (PyAV — jangan ditebak)', () => {
  assert.equal(TOJI_ULT_DURATION_S, 2.78);
  assert.equal(TOJI_CAST_VOICE.dur, 2.78);
  // timeline urut & settle = durasi klip
  const t = TOJI_TIMELINE;
  assert.equal(t.veilAt, 0);
  assert.ok(t.veilAt < t.hushAt && t.hushAt < t.wormAt, 'veil → hening → 武器庫呪霊');
  assert.ok(t.wormAt < t.drawAt && t.drawAt < t.slashAt, 'masuk → cabut bilah → tebasan');
  assert.ok(t.slashAt < t.settleAt, 'tebasan → settle');
  assert.equal(t.settleAt, TOJI_ULT_DURATION_S);
  assert.equal(TOJI_STATE_S, 30);
});

test('TOJI_TIMELINE: quote per-frasa SYNC ke segmen klip terukur (0.16s & 2.14s)', () => {
  const t = TOJI_TIMELINE;
  const v = TOJI_CAST_VOICE;
  assert.equal(t.quote1At, v.phrase1.start, 'frasa 1 = lead klip terukur');
  assert.equal(t.quote2At, v.phrase2.start, 'frasa 2 = awal ucapan kedua terukur');
  // gambar bilah dicabut terjadi DI jeda dramatis klip (pause terukur)
  assert.ok(t.drawAt > v.pause.start && t.drawAt < v.pause.end, 'cabut bilah di jeda');
  // tebasan X menyertai frasa terakhir (全開) — tidak menunggu klip habis
  assert.ok(t.slashAt >= v.phrase2.start && t.slashAt < t.settleAt, 'tebasan saat frasa 2 → settle');
  // segmen klip konsisten & di dalam durasi
  assert.ok(v.lead === v.phrase1.start);
  assert.ok(v.phrase1.start < v.phrase1.end);
  assert.ok(v.phrase1.end <= v.pause.start && v.pause.end <= v.phrase2.start);
  assert.ok(v.phrase2.start < v.phrase2.end && v.phrase2.end < v.dur);
});

test('TOJI_QUOTE: 2 frasa = nama ultimate 天与呪縛・全開 (bukan quote Megumi)', () => {
  assert.equal(TOJI_QUOTE.length, 2);
  assert.equal(TOJI_QUOTE.join(''), '天与呪縛全開');
});

test('tojiAmmoGain: +1 senjata per benar, cap TOJI_AMMO_MAX = 3', () => {
  assert.equal(TOJI_AMMO_MAX, 3);
  assert.equal(tojiAmmoGain(0), 1);
  assert.equal(tojiAmmoGain(1), 2);
  assert.equal(tojiAmmoGain(2), 3);
  assert.equal(tojiAmmoGain(3), 3, 'cap — tidak pernah 4');
  assert.equal(tojiAmmoGain(99), 3);
  for (const bad of [NaN, -1, null, undefined, 'x']) assert.equal(tojiAmmoGain(bad), 1, String(bad));
});

test('tojiAmmoSpend: -1 senjata saat salah, clamp di 0', () => {
  assert.equal(tojiAmmoSpend(3), 2);
  assert.equal(tojiAmmoSpend(1), 0);
  assert.equal(tojiAmmoSpend(0), 0, 'tidak pernah negatif');
  for (const bad of [NaN, -1, null, undefined, 'x']) assert.equal(tojiAmmoSpend(bad), 0, String(bad));
});

test('tojiUltOutcome: benar → load (+1 cap), salah → spend (soal dibunuh), amunisi 0 → break', () => {
  // benar: muat amunisi
  assert.deepEqual(tojiUltOutcome('correct', 0), { ammo: 1, outcome: 'load' });
  assert.deepEqual(tojiUltOutcome('correct', 2), { ammo: 3, outcome: 'load' });
  assert.deepEqual(tojiUltOutcome('correct', 3), { ammo: 3, outcome: 'load' });
  // salah: bayar 1 — soal dibunuh, streak AMAN
  assert.deepEqual(tojiUltOutcome('wrong', 2), { ammo: 1, outcome: 'spend' });
  assert.deepEqual(tojiUltOutcome('wrong', 1), { ammo: 0, outcome: 'spend' });
  // salah saat amunisi 0 → salah biasa + state bubar
  assert.deepEqual(tojiUltOutcome('wrong', 0), { ammo: 0, outcome: 'break' });
  // timeout = sama seperti salah (konsisten — spec)
  assert.deepEqual(tojiUltOutcome('timeout', 2), { ammo: 1, outcome: 'spend' });
  assert.deepEqual(tojiUltOutcome('timeout', 0), { ammo: 0, outcome: 'break' });
  // input kotor aman
  assert.deepEqual(tojiUltOutcome('wrong', NaN), { ammo: 0, outcome: 'break' });
  assert.deepEqual(tojiUltOutcome('correct', NaN), { ammo: 1, outcome: 'load' });
});

// ── Opsi A: 全開 mulai dengan amunisi SIAP (ult langsung bergigi) ────────────
test('TOJI_STATE_START_AMMO: state 全開 mulai dengan amunisi > 0 (bukan kerja dari nol)', () => {
  assert.equal(TOJI_STATE_START_AMMO, 2, 'mulai 2 senjata — langsung bisa 術師殺し');
  assert.ok(TOJI_STATE_START_AMMO > 0, 'ult harus bergigi sejak detik pertama');
  assert.ok(TOJI_STATE_START_AMMO <= TOJI_AMMO_MAX, 'tidak melebihi cap rail');
});

test('tojiStateStartAmmo: clamp 0..TOJI_AMMO_MAX, input kotor → start ammo', () => {
  assert.equal(tojiStateStartAmmo(), TOJI_STATE_START_AMMO);
  assert.equal(tojiStateStartAmmo(5), TOJI_AMMO_MAX, 'cap di rail');
  assert.equal(tojiStateStartAmmo(1), 1);
  for (const bad of [NaN, null, undefined, 'x']) assert.equal(tojiStateStartAmmo(bad), TOJI_STATE_START_AMMO, String(bad));
});

test('state 全開: salah PERTAMA (amunisi awal 2) langsung membunuh soal, bukan bubar', () => {
  const start = tojiStateStartAmmo();
  const out = tojiUltOutcome('wrong', start);
  assert.deepEqual(out, { ammo: 1, outcome: 'spend' }, 'salah pertama = kill soal, streak AMAN');
  const opts = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
  assert.deepEqual(tojiCutOptions(opts, 'a', out.ammo), ['a', 'b', 'c', 'd']);
});

test('tojiCutOptions: soal dibunuh → SELURUH opsi tertebas (術師殺し); amunisi 0 → tidak ada', () => {
  const options = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
  // amunisi > 0 → soal mati total: semua opsi (termasuk benar) tertebas, tidak ada reveal
  assert.deepEqual(tojiCutOptions(options, 'a', 1), ['a', 'b', 'c', 'd']);
  assert.deepEqual(tojiCutOptions(options, 'a', 3), ['a', 'b', 'c', 'd']);
  // amunisi 0 → salah biasa: tidak ada cut (streak hangus + state bubar)
  assert.deepEqual(tojiCutOptions(options, 'a', 0), []);
  assert.deepEqual(tojiCutOptions(options, 'a', NaN), []);
  // input kotor aman
  assert.deepEqual(tojiCutOptions(null, 'a', 2), []);
  assert.deepEqual(tojiCutOptions([], 'a', 2), []);
  // opsi boleh string id langsung
  assert.deepEqual(tojiCutOptions(['x', 'y'], 'x', 2), ['x', 'y']);
});

test('palet 冷たい鋼: 6 token spec (TANPA glow 呪力 — identitas #1)', () => {
  assert.equal(TOJI_FLASH, '#FFFFFF');
  assert.equal(TOJI_STEEL, '#CBD5E1');
  assert.equal(TOJI_GUNMETAL, '#3F3F46');
  assert.equal(TOJI_VOID, '#0C0C0C');
  assert.equal(TOJI_BLOOD, '#DC2626');
  assert.equal(TOJI_WORM, '#5B21B6');
  assert.deepEqual(TOJI_COLORS, {
    flash: TOJI_FLASH, steel: TOJI_STEEL, gunmetal: TOJI_GUNMETAL,
    void: TOJI_VOID, blood: TOJI_BLOOD, worm: TOJI_WORM,
  });
});

test('TOJI_STYLE: kanji + warna utk tiap jurus (kana lengkap di label)', () => {
  const kanji = {
    shakkontou: '釈魂刀', banri_no_kusari: '万里ノ鎖', amanosakahoko: '天逆鉾',
    yuuyun: '遊雲', bukiko_jurei: '武器庫呪霊', ult: '天与呪縛・全開',
  };
  for (const k of Object.keys(kanji)) {
    assert.ok(TOJI_STYLE[k], `style ${k} harus ada`);
    assert.equal(TOJI_STYLE[k].kanji, kanji[k], `kanji ${k}`);
    assert.ok(TOJI_STYLE[k].color, `color ${k}`);
    assert.ok(TOJI_STYLE[k].label, `label ${k}`);
  }
});

test('TOJI_MOTION: easing beda per peran (anti-slop) + durasi bertingkat + durCine = klip', () => {
  assert.notEqual(TOJI_MOTION.line, TOJI_MOTION.impact, 'line ≠ impact');
  assert.notEqual(TOJI_MOTION.impact, TOJI_MOTION.exit);
  assert.notEqual(TOJI_MOTION.exit, TOJI_MOTION.reveal);
  assert.ok(TOJI_MOTION.durFast < TOJI_MOTION.durMid);
  assert.ok(TOJI_MOTION.durMid < TOJI_MOTION.durCine);
  assert.equal(TOJI_MOTION.durCine, 2780, 'cinematic = durasi klip cast terukur');
});

test('TOJI_STAGGER: bilah 0 → flash 100 → belah 180 → percikan 260 → debu 340 (anti-slop #4)', () => {
  assert.equal(TOJI_STAGGER.blade, 0);
  assert.equal(TOJI_STAGGER.flash, 0.1);
  assert.equal(TOJI_STAGGER.split, 0.18);
  assert.equal(TOJI_STAGGER.spark, 0.26);
  assert.equal(TOJI_STAGGER.dust, 0.34);
});

test('tojiAnswerHoldMs: min hold 1.4s; clipMs eksplisit menang', () => {
  assert.equal(TOJI_MIN_HOLD_MS, 1400);
  assert.equal(tojiAnswerHoldMs(), 1400, 'tanpa klip → min hold');
  assert.equal(tojiAnswerHoldMs(300), 1400, 'klip pendek + 400ms tetap di bawah min');
  assert.equal(tojiAnswerHoldMs(5000), 5400, 'klip panjang + 400ms');
  assert.equal(tojiAnswerHoldMs(0, 3000), 3000, 'baseHold menang');
});

test('tojiUltHoldMs: cinematic penuh + settle buffer', () => {
  assert.equal(tojiUltHoldMs(), 3080, '2780ms klip + 300ms buffer');
});

test('tojiStateLeft: hitung mundur 0..30 (clamp, input kotor aman)', () => {
  const now = 1_000_000;
  assert.equal(tojiStateLeft(now + 30_000, now), 30);
  assert.equal(tojiStateLeft(now + 12_400, now), 13, 'ceil detik');
  assert.equal(tojiStateLeft(now + 100, now), 1);
  assert.equal(tojiStateLeft(now, now), 0, 'habis → 0');
  assert.equal(tojiStateLeft(now - 5_000, now), 0, 'lewat → 0');
  assert.equal(tojiStateLeft(now + 99_000, now), TOJI_STATE_S, 'clamp di durasi');
  for (const bad of [NaN, null, undefined, 'x']) assert.equal(tojiStateLeft(bad, now), 0, String(bad));
  assert.equal(tojiStateLeft(now + 30_000, NaN), 0);
});

// ── Determinisme (pola redesign Megumi v2.1: tanpa rng — hasil identik) ─────
test('generator DETERMINISTIK: panggilan sama → hasil identik', () => {
  const gens = [tojiBlade, tojiChain, tojiSoulSplit, tojiWorm];
  for (const gen of gens) {
    assert.deepEqual(gen(7), gen(7), `${gen.name} harus deterministik`);
  }
});

test('tojiBlade: kilau bilah diagonal — dari luar kartu, glints berjalan, flash 1 frame', () => {
  const b = tojiBlade(1);
  assert.ok(b.x0 < 0, 'mulai dari luar kartu');
  assert.notEqual(b.y0, b.y1, 'diagonal, bukan horizontal');
  assert.ok(Math.abs(b.angle) > 15 && Math.abs(b.angle) < 35, 'kemiringan konsisten (bukan acak)');
  assert.ok(b.glints.length >= 2, 'kilau berjalan di bilah (≥2 titik)');
  for (const g of b.glints) {
    assert.ok(g.at > 0 && g.at < 1, 'posisi kilau di dalam bilah');
    assert.ok(g.size > 0);
  }
  assert.ok(b.w0 > b.w1, 'bilah menipis ke ujung');
  assert.ok(b.flashDur <= 0.08, 'flash putih 1 frame (≤80ms)');
  assert.equal(b.dur, 0.22, 'power2.out 220ms — presisi, bukan bounce');
});

test('tojiChain: rantai dari luar layar → nyangkut tengah opsi → diseret keluar + debu + goresan', () => {
  const c = tojiChain(1);
  assert.ok(c.entry.x > 100 || c.entry.y < 0, 'masuk dari luar layar');
  assert.ok(c.hook.x >= 0 && c.hook.x <= 100 && c.hook.y >= 0 && c.hook.y <= 100, 'nyangkut di dalam opsi');
  assert.ok(c.drag.x < 0, 'diseret keluar layar');
  assert.ok(c.links.length >= 5, 'mata rantai');
  assert.ok(c.links[0].size > c.links[c.links.length - 1].size, 'rantai mengecil ke ujung');
  assert.ok(c.links[0].x > c.links[c.links.length - 1].x, 'arah masuk → hook');
  assert.ok(c.dust.length >= 3, 'debu kena seret');
  assert.ok(c.scratches.length >= 2, 'goresan lantai');
  for (const d of c.dust) assert.ok(d.size > 0);
});

test('tojiSoulSplit: opsi terbelah 2 — belahan putih baja + tepi hitam + TEPAT 2 percikan', () => {
  const s = tojiSoulSplit(1);
  assert.equal(s.sparks.length, 2, 'spec: 2 percikan baja');
  assert.ok(s.edge.white > 0, 'belahan putih baja');
  assert.ok(s.edge.black > 0, 'tepi hitam');
  assert.ok(s.slide > 0, 'belahan meluncur misah');
  assert.notEqual(s.angle, 0, 'sejajar tebasan (miring)');
  assert.ok(s.dur > 0);
});

test('tojiWorm: 武器庫呪霊 — segmen gelombang, kepala terbesar, 4 senjata urutan kanon', () => {
  const w = tojiWorm(1, 8);
  assert.equal(w.segments.length, 8);
  assert.ok(w.segments[0].size > w.segments[7].size, 'kepala > ekor');
  assert.equal(w.head.x, w.segments[0].x, 'head = segmen pertama');
  assert.ok(w.head.r > 0 && w.mouth, 'mulut menganga');
  assert.equal(w.weapons.length, 4);
  assert.deepEqual(TOJI_WORM_WEAPONS, ['oonata', 'yari', 'katana', 'juu'], 'rotasi kanon 大鉈→槍→刀→銃');
  assert.deepEqual(w.weapons.map((x) => x.type), ['oonata', 'yari', 'katana', 'juu']);
  for (let i = 1; i < w.weapons.length; i++) {
    assert.ok(w.weapons[i].delay > w.weapons[i - 1].delay, 'senjata dimuntahkan berurutan');
  }
});

// ── Simulasi penuh mekanik A: 武器庫・一撃離脱 ────────────────────────────────
test('武器庫・一撃離脱 state transition: benar menabung → salah membayar (skip) → amunisi 0 bubar', () => {
  let ammo = 0;
  // benar beruntun → +1 tiap kali, cap 3
  for (const expect of [1, 2, 3, 3]) {
    const out = tojiUltOutcome('correct', ammo);
    ammo = out.ammo;
    assert.equal(out.outcome, 'load');
    assert.equal(ammo, expect);
  }
  // salah → bayar 1: soal dibunuh (skip, streak AMAN, tanpa XP)
  let out = tojiUltOutcome('wrong', ammo);
  assert.deepEqual(out, { ammo: 2, outcome: 'spend' });
  // soal dibunuh → seluruh opsi tertebas (kill total)
  const opts = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
  assert.deepEqual(tojiCutOptions(opts, 'a', out.ammo), ['a', 'b', 'c', 'd']);
  // habiskan amunisi — timeout = sama seperti salah (konsisten)
  out = tojiUltOutcome('wrong', 2);
  ammo = out.ammo;
  assert.equal(ammo, 1);
  out = tojiUltOutcome('timeout', ammo);
  ammo = out.ammo;
  assert.equal(ammo, 0, 'timeout membayar amunisi juga');
  // salah terakhir di amunisi 0 → salah biasa + state bubar
  out = tojiUltOutcome('wrong', ammo);
  assert.deepEqual(out, { ammo: 0, outcome: 'break' });
  assert.deepEqual(tojiCutOptions(opts, 'a', 0), [], 'amunisi 0 → tidak ada cut');
});

// ── T3: wiring state 全開 (skip soal dibunuh + timing) ──────────────────────
test('TOJI_STATE_S = 30 dtk (state 全開 — timer JALAN, TANPA domain)', () => {
  assert.equal(TOJI_STATE_S, 30);
});

test('TOJI_STYLE.kill: 術師殺し utk soal yang dibunuh (mekanik 一撃離脱)', () => {
  assert.ok(TOJI_STYLE.kill, 'style kill harus ada');
  assert.equal(TOJI_STYLE.kill.kanji, '術師殺し');
  assert.equal(TOJI_STYLE.kill.color, TOJI_BLOOD);
  assert.ok(TOJI_STYLE.kill.label.includes('Jutsushi'), 'label kana romaji');
});

test('tojiStateStartDelayMs: 30 dtk mulai SETELAH cinematic settle (2,78 dtk)', () => {
  assert.equal(tojiStateStartDelayMs(), 2780);
  assert.equal(tojiUltHoldMs(), tojiStateStartDelayMs() + 300, 'settle = cinematic + buffer');
});

test('TOJI_SKIP_DELAY_MS & TOJI_KILL_HOLD_MS: tebasan terbaca dulu, baru skip', () => {
  assert.equal(TOJI_SKIP_DELAY_MS, 1250);
  assert.equal(TOJI_KILL_HOLD_MS, 1500);
  assert.ok(TOJI_SKIP_DELAY_MS < TOJI_KILL_HOLD_MS, 'fx kill tetap tampil saat skip (tail)');
  assert.ok(TOJI_SKIP_DELAY_MS > TOJI_MOTION.durMid * 3, 'tebasan (320ms) kebaca sebelum lompat');
});
