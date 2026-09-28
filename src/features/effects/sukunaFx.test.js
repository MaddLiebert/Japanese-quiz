import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SUKUNA_MILESTONES, isSukunaMilestone, sukunaTechniqueFor,
  SUKUNA_LADDER, SUKUNA_NON_STREAK_CYCLE, sukunaNonStreakIndex,
  SUKUNA_ULT_THRESHOLD, sukunaCurseCharge, sukunaUltReady,
  SUKUNA_DOMAIN_DURATION_S, sukunaDomainLeft, sukunaDomainStartDelayMs,
  SUKUNA_CAST_VOICE, SUKUNA_DOMAIN_TIMELINE,
  SUKUNA_HITSUME_DELAY_MS, sukunaHitsumeCut,
  SUKUNA_STYLE,
  sukunaQuizSkillAt, sukunaSkillCut,
  sukunaWebLines, sukunaThunderBolts, sukunaWheelSpokes, sukunaChantLines,
  sukunaSlashRain, sukunaEmbers, sukunaMantraRing,
} from './sukunaFx.js';
import { GOJO_MILESTONES } from './gojoFx.js';

test('milestone Sukuna = sama persis Gojo (konsisten JJK)', () => {
  assert.deepEqual(SUKUNA_MILESTONES, GOJO_MILESTONES);
  assert.ok(isSukunaMilestone(3) && isSukunaMilestone(100));
  assert.ok(!isSukunaMilestone(4));
});

test('sukunaTechniqueFor: non-streak ROTASI kumo → nue → kumo … (kritik user 28/09 v3)', () => {
  // streak 1,2,3 = non-momen → kumo, nue, kumo (bukan null → suara default!)
  assert.equal(sukunaTechniqueFor('correct', 1), 'kumo_no_ito');
  assert.equal(sukunaTechniqueFor('correct', 2), 'nue');
  assert.equal(sukunaTechniqueFor('correct', 3), 'kumo_no_ito');
  // 4..19 = non-momen (ladder pertama di 20) → lanjut rotasi
  assert.equal(sukunaTechniqueFor('correct', 4), 'nue');
  assert.equal(sukunaTechniqueFor('correct', 5), 'kumo_no_ito');
  assert.equal(sukunaTechniqueFor('correct', 19), 'kumo_no_ito');
});

test('sukunaTechniqueFor: TIDAK PERNAH null utk streak benar > 0 (anti suara default)', () => {
  for (let s = 1; s <= 200; s++) {
    const t = sukunaTechniqueFor('correct', s);
    assert.ok(typeof t === 'string' && t.length > 0, `streak ${s} -> ${t}`);
    assert.ok(t === 'kumo_no_ito' || t === 'nue' || Object.values(SUKUNA_LADDER).includes(t), `streak ${s} -> ${t}`);
  }
});

test('sukunaTechniqueFor: momen gede TEPAT di 20 / 30 / 50', () => {
  assert.equal(sukunaTechniqueFor('streak', 20), 'furube');
  assert.equal(sukunaTechniqueFor('streak', 30), 'ryuurin');
  assert.equal(sukunaTechniqueFor('streak', 50), 'sekai_zangeki');
  // 21, 29, 31, 49, 51 = non-momen → rotasi (bukan null)
  for (const s of [21, 29, 31, 49, 51, 60, 75, 100]) {
    const t = sukunaTechniqueFor('streak', s);
    assert.ok(t === 'kumo_no_ito' || t === 'nue', `streak ${s} harus rotasi, dapat ${t}`);
  }
});

test('sukunaNonStreakIndex: hitung jawaban benar non-momen (momen tidak menggeser)', () => {
  assert.equal(sukunaNonStreakIndex(0), 0);
  assert.equal(sukunaNonStreakIndex(1), 1);
  assert.equal(sukunaNonStreakIndex(19), 19);
  assert.equal(sukunaNonStreakIndex(20), 19, 'streak 20 = momen, index tidak naik');
  assert.equal(sukunaNonStreakIndex(21), 20, 'streak 21 = non-momen ke-20');
  assert.equal(sukunaNonStreakIndex(30), 28);
  assert.equal(sukunaNonStreakIndex(50), 47);
  assert.equal(sukunaNonStreakIndex(NaN), 0);
  assert.equal(sukunaNonStreakIndex(-5), 0);
});

test('SUKUNA_NON_STREAK_CYCLE = [kumo, nue] — deterministik, bukan acak', () => {
  assert.deepEqual(SUKUNA_NON_STREAK_CYCLE, ['kumo_no_ito', 'nue']);
  assert.deepEqual(SUKUNA_LADDER, { 20: 'furube', 30: 'ryuurin', 50: 'sekai_zangeki' });
});

test('sukunaTechniqueFor: salah = null & TIDAK PERNAH domain/kai (jangan nabrak Yuji)', () => {
  assert.equal(sukunaTechniqueFor('wrong', 0), null);
  for (let s = 1; s <= 200; s++) {
    const t = sukunaTechniqueFor('streak', s);
    assert.ok(t !== 'domain' && t !== 'kai' && t !== 'hachi' && t !== 'fuga', `streak ${s} -> ${t}`);
  }
});

test('sukunaTechniqueFor: input kotor aman (null, bukan efek nyasar)', () => {
  assert.equal(sukunaTechniqueFor('correct', NaN), null);
  assert.equal(sukunaTechniqueFor('correct', -3), null);
  assert.equal(sukunaTechniqueFor('correct', undefined), null);
  assert.equal(sukunaTechniqueFor('correct', 0), null);
});

test('sukunaCurseCharge: 0..20 clamp, input aneh -> 0', () => {
  assert.equal(sukunaCurseCharge(0), 0);
  assert.equal(sukunaCurseCharge(5), 5);
  assert.equal(sukunaCurseCharge(20), 20);
  assert.equal(sukunaCurseCharge(999), SUKUNA_ULT_THRESHOLD);
  for (const bad of [NaN, -1, null, undefined, 'x']) assert.equal(sukunaCurseCharge(bad), 0, String(bad));
});

test('sukunaUltReady: penuh di 20', () => {
  assert.ok(!sukunaUltReady(19));
  assert.ok(sukunaUltReady(20));
  assert.ok(sukunaUltReady(50));
  assert.ok(!sukunaUltReady(NaN));
});

test('sukunaDomainLeft: clamp 0..30, input aneh -> 0', () => {
  const now = 1000000;
  assert.equal(sukunaDomainLeft(now + 30000, now), 30);
  assert.equal(sukunaDomainLeft(now + 10500, now), 11);
  assert.equal(sukunaDomainLeft(now - 1, now), 0);
  for (const bad of [NaN, Infinity, null, undefined]) assert.equal(sukunaDomainLeft(bad, now), 0, String(bad));
  assert.equal(sukunaDomainLeft(now + 30000, NaN), 0);
});

test('SUKUNA_DOMAIN_DURATION_S = 30 (timer JALAN, bukan beku — beda Gojo)', () => {
  assert.equal(SUKUNA_DOMAIN_DURATION_S, 30);
});

test('sukunaDomainStartDelayMs: tunggu settle cinematic (>= 3 dtk)', () => {
  assert.ok(sukunaDomainStartDelayMs() >= 3000);
  assert.equal(
    sukunaDomainStartDelayMs(),
    Math.round((SUKUNA_DOMAIN_TIMELINE.settleAt + SUKUNA_DOMAIN_TIMELINE.settleDur) * 1000),
  );
});

test('SUKUNA_CAST_VOICE = hasil ukur RMS (jeda dramatis 1.23–2.25)', () => {
  assert.equal(SUKUNA_CAST_VOICE.dur, 3.48);
  assert.equal(SUKUNA_CAST_VOICE.seg1Start, 0.18);
  assert.equal(SUKUNA_CAST_VOICE.seg1End, 1.23);
  assert.equal(SUKUNA_CAST_VOICE.seg2Start, 2.25);
  assert.equal(SUKUNA_CAST_VOICE.seg2End, 3.18);
});

test('timeline domain sync ke klip: mata+senyum DI DALAM jeda dramatis 1.23–2.25', () => {
  const t = SUKUNA_DOMAIN_TIMELINE;
  const v = SUKUNA_CAST_VOICE;
  // mata & senyum muncul di jeda (permintaan user: "di sini mata+senyum muncul!")
  assert.ok(t.eyesAt >= v.seg1End && t.eyesAt <= v.seg2Start, `eyesAt ${t.eyesAt} harus di jeda`);
  assert.ok(t.smileAt >= v.seg1End && t.smileAt <= v.seg2Start, `smileAt ${t.smileAt} harus di jeda`);
  // kanji 領域展開 mulai bersama frasa 1; 伏魔御廚子 bersama frasa 2
  assert.ok(Math.abs(t.kanji1At - v.seg1Start) < 0.05, 'kanji1 sync frasa 1');
  assert.ok(Math.abs(t.kanji2At - v.seg2Start) < 0.05, 'kanji2 sync frasa 2');
  // flash + boom setelah frasa 2 selesai (bunyi klip selesai 3.18)
  assert.ok(t.flashAt >= v.seg2End && t.flashAt <= v.dur, 'flash di akhir klip');
  // urutan: hand → mantra → jeda → mata → senyum → kanji2 → kuil → flash → settle
  assert.ok(t.handAt < t.mantraAt);
  assert.ok(t.mantraAt < t.gapStart);
  assert.ok(t.eyesAt < t.smileAt);
  assert.ok(t.smileAt < t.kanji2At);
  assert.ok(t.kanji2At < t.shrineAt);
  assert.ok(t.shrineAt < t.flashAt);
  assert.ok(t.flashAt <= t.settleAt);
  assert.ok(t.settleAt + t.settleDur >= v.dur - 0.2, 'settle selesai sekitar durasi klip');
});

test('kanji per-karakter: 領域展開 4 karakter, 伏魔御廚子 5 karakter', () => {
  const t = SUKUNA_DOMAIN_TIMELINE;
  assert.ok(t.kanji1Per > 0 && t.kanji1Per < 0.4);
  assert.ok(t.kanji2Per > 0 && t.kanji2Per < 0.3);
  // frasa 1 ≈0.18–1.23 (1.05s / 4 karakter ≈ 0.26) & frasa 2 ≈2.25–3.18 (0.93s / 5 ≈ 0.19)
  assert.ok(Math.abs(t.kanji1Per - 0.26) < 0.05);
  assert.ok(Math.abs(t.kanji2Per - 0.19) < 0.03);
});

test('SUKUNA_HITSUME_DELAY_MS: tebasan cepat (≤1.5 dtk) — user minta "langsung aja cepet"', () => {
  assert.ok(SUKUNA_HITSUME_DELAY_MS > 0 && SUKUNA_HITSUME_DELAY_MS <= 1500, String(SUKUNA_HITSUME_DELAY_MS));
});

test('sukunaHitsumeCut: SATU tebasan = SEMUA opsi salah, jawaban benar aman', () => {
  const opts = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
  // semua opsi salah sekaligus — bukan satu-satu lagi (kritik user 28/09 v3)
  assert.deepEqual(sukunaHitsumeCut(opts, 'a'), ['b', 'c', 'd']);
  // stabil: panggilan berulang hasil sama (bukan acak)
  assert.deepEqual(sukunaHitsumeCut(opts, 'a'), sukunaHitsumeCut(opts, 'a'));
  // jawaban benar tidak pernah masuk walau posisinya di tengah
  assert.deepEqual(sukunaHitsumeCut(opts, 'c'), ['a', 'b', 'd']);
  // input aneh aman
  assert.deepEqual(sukunaHitsumeCut(null, 'a'), []);
  assert.deepEqual(sukunaHitsumeCut([], 'a'), []);
  assert.deepEqual(sukunaHitsumeCut([{ id: 'a' }], 'a'), []);
  // id string juga diterima
  assert.deepEqual(sukunaHitsumeCut(['a', 'b', 'c'], 'a'), ['b', 'c']);
});

test('SUKUNA_STYLE lengkap: 6 jurus + domain + wrong, kanji & warna', () => {
  const keys = ['kumo_no_ito', 'nue', 'furube', 'ryuurin', 'sekai_zangeki', 'domain', 'wrong'];
  assert.deepEqual(Object.keys(SUKUNA_STYLE).sort(), keys.slice().sort());
  for (const k of keys) {
    assert.ok(SUKUNA_STYLE[k].kanji && SUKUNA_STYLE[k].color && SUKUNA_STYLE[k].label, k);
  }
  assert.equal(SUKUNA_STYLE.kumo_no_ito.kanji, '蜘蛛の糸');
  assert.equal(SUKUNA_STYLE.nue.kanji, '鵺');
  assert.equal(SUKUNA_STYLE.furube.kanji, '魔虚羅');
  assert.equal(SUKUNA_STYLE.ryuurin.kanji, '龍鱗・反発・番いの流星');
  assert.equal(SUKUNA_STYLE.sekai_zangeki.kanji, '世界を断つ斬撃');
  assert.equal(SUKUNA_STYLE.domain.kanji, '伏魔御廚子');
  assert.equal(SUKUNA_STYLE.domain.color, '#e0241a');
  // Kritik user 28/09: kumo = jaring DI KARTU (inWeb); furube = GIF Mahoraga kanon;
  // salah = 馬鹿な merah (bukan abu-abu) + GIF kalah.
  assert.equal(SUKUNA_STYLE.kumo_no_ito.inWeb, true);
  assert.equal(SUKUNA_STYLE.furube.gif, '/effects/mahoraga.gif');
  assert.equal(SUKUNA_STYLE.wrong.kanji, '馬鹿な');
  assert.equal(SUKUNA_STYLE.wrong.color, '#e0241a');
});

test('sukunaQuizSkillAt: skill quiz HANYA di streak 30 & 50 (sesuai lore)', () => {
  assert.equal(sukunaQuizSkillAt(30).id, 'ryuurin');
  assert.equal(sukunaQuizSkillAt(30).cut, 1);
  assert.equal(sukunaQuizSkillAt(50).id, 'sekai_zangeki');
  assert.equal(sukunaQuizSkillAt(50).cut, 'all');
  for (const s of [1, 3, 20, 29, 31, 40, 49, 51, 100, 0, -3, NaN, undefined, '30']) {
    assert.equal(sukunaQuizSkillAt(s), null, `streak ${s} tidak boleh unlock`);
  }
});

test('sukunaSkillCut: ryuurin pecah 1 opsi, sekai pecah SEMUA opsi salah, benar aman', () => {
  const opts = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
  assert.deepEqual(sukunaSkillCut(opts, 'a', 'ryuurin'), ['b']);
  assert.deepEqual(sukunaSkillCut(opts, 'a', 'sekai_zangeki'), ['b', 'c', 'd']);
  // deterministik antar render
  assert.deepEqual(sukunaSkillCut(opts, 'a', 'sekai_zangeki'), sukunaSkillCut(opts, 'a', 'sekai_zangeki'));
  // jawaban benar tidak pernah masuk walau posisinya di tengah
  assert.deepEqual(sukunaSkillCut(opts, 'c', 'sekai_zangeki'), ['a', 'b', 'd']);
  // input aneh aman
  assert.deepEqual(sukunaSkillCut(null, 'a', 'ryuurin'), []);
  assert.deepEqual(sukunaSkillCut(opts, 'a', null), []);
  assert.deepEqual(sukunaSkillCut(opts, 'a', 'zzz'), []);
  assert.deepEqual(sukunaSkillCut([{ id: 'a' }], 'a', 'sekai_zangeki'), []);
  // id string juga diterima
  assert.deepEqual(sukunaSkillCut(['a', 'b', 'c'], 'a', 'ryuurin'), ['b']);
});

test('generator partikel: jumlah, id unik, deterministik dgn rng inject', () => {
  const rng = () => 0.5;
  const web = sukunaWebLines(7, 8, rng);
  assert.equal(web.length, 8);
  assert.equal(new Set(web.map((p) => p.id)).size, 8);
  assert.deepEqual(web, sukunaWebLines(7, 8, rng));
  assert.equal(sukunaThunderBolts(1, 3, rng).length, 3);
  assert.equal(sukunaWheelSpokes(1, 8, rng).length, 8);
  assert.equal(sukunaChantLines(1, 3, rng).length, 3);
  assert.equal(sukunaSlashRain(1, 10, rng).length, 10);
  assert.equal(sukunaEmbers(1, 7, rng).length, 7);
  const ring = sukunaMantraRing(3, rng);
  assert.ok(ring.r > 0 && ring.dur > 0 && ring.speed > 0);
});

test('generator partikel: nilai dalam rentang wajar (tidak NaN)', () => {
  for (const p of sukunaWebLines(1, 12)) {
    assert.ok(Number.isFinite(p.angle) && Number.isFinite(p.len) && p.len > 0);
    assert.ok(Number.isFinite(p.dur) && p.dur > 0);
  }
  for (const b of sukunaThunderBolts(2, 6)) {
    assert.ok(Array.isArray(b.pts) && b.pts.length >= 2, 'bolt punya jalur');
    assert.ok(Number.isFinite(b.dur) && b.dur > 0);
  }
  for (const e of sukunaEmbers(3, 8)) {
    assert.ok(e.x >= 0 && e.x <= 100);
    assert.ok(Number.isFinite(e.drift) && e.drift < 0, 'bara naik = drift negatif');
  }
  for (const s of sukunaSlashRain(4, 8)) {
    assert.ok(s.x >= 0 && s.x <= 100);
    assert.ok(Number.isFinite(s.dur) && s.dur > 0);
  }
});

test('chant ryuurin: 3 baris sync frasa klip (0.18 / 1.41 / 2.61)', () => {
  const lines = sukunaChantLines(1, 3);
  assert.equal(lines.length, 3);
  assert.deepEqual(lines.map((l) => l.text), ['龍鱗', '反発', '番いの流星']);
  assert.equal(lines[0].at, 0.18);
  assert.equal(lines[1].at, 1.41);
  assert.equal(lines[2].at, 2.61);
});
