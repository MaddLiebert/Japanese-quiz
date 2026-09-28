import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SUKUNA_MILESTONES, isSukunaMilestone, sukunaTechniqueFor,
  SUKUNA_ULT_THRESHOLD, sukunaCurseCharge, sukunaUltReady,
  SUKUNA_DOMAIN_DURATION_S, sukunaDomainLeft, sukunaDomainStartDelayMs,
  SUKUNA_CAST_VOICE, SUKUNA_DOMAIN_TIMELINE,
  SUKUNA_HITSUME_INTERVAL_MS, sukunaHitsumeCount, sukunaHitsumeOrder, sukunaHitsumeCut,
  SUKUNA_STYLE,
  sukunaWebLines, sukunaThunderBolts, sukunaWheelSpokes, sukunaChantLines,
  sukunaSlashRain, sukunaEmbers, sukunaMantraRing,
} from './sukunaFx.js';
import { GOJO_MILESTONES } from './gojoFx.js';

test('milestone Sukuna = sama persis Gojo (konsisten JJK)', () => {
  assert.deepEqual(SUKUNA_MILESTONES, GOJO_MILESTONES);
  assert.ok(isSukunaMilestone(3) && isSukunaMilestone(100));
  assert.ok(!isSukunaMilestone(4));
});

test('sukunaTechniqueFor: 1–2 = kumo_no_ito', () => {
  assert.equal(sukunaTechniqueFor('correct', 1), 'kumo_no_ito');
  assert.equal(sukunaTechniqueFor('correct', 2), 'kumo_no_ito');
});

test('sukunaTechniqueFor: 3–19 = nue', () => {
  for (const s of [3, 4, 10, 15, 19]) assert.equal(sukunaTechniqueFor('streak', s), 'nue', `streak ${s}`);
});

test('sukunaTechniqueFor: 20 = furube (summon Mahoraga)', () => {
  assert.equal(sukunaTechniqueFor('streak', 20), 'furube');
  assert.equal(sukunaTechniqueFor('correct', 20), 'furube');
});

test('sukunaTechniqueFor: 21–49 = ryuurin (chant)', () => {
  for (const s of [21, 25, 30, 40, 49]) assert.equal(sukunaTechniqueFor('streak', s), 'ryuurin', `streak ${s}`);
});

test('sukunaTechniqueFor: 50+ = sekai_zangeki (World Cut)', () => {
  for (const s of [50, 60, 75, 100, 200]) assert.equal(sukunaTechniqueFor('correct', s), 'sekai_zangeki', `streak ${s}`);
});

test('sukunaTechniqueFor: salah = null & TIDAK PERNAH domain/kai (jangan nabrak Yuji)', () => {
  assert.equal(sukunaTechniqueFor('wrong', 0), null);
  for (let s = 1; s <= 200; s++) {
    const t = sukunaTechniqueFor('streak', s);
    assert.ok(t !== 'domain' && t !== 'kai' && t !== 'hachi' && t !== 'fuga', `streak ${s} -> ${t}`);
  }
});

test('sukunaTechniqueFor: input kotor aman', () => {
  assert.equal(sukunaTechniqueFor('correct', NaN), 'kumo_no_ito');
  assert.equal(sukunaTechniqueFor('correct', -3), 'kumo_no_ito');
  assert.equal(sukunaTechniqueFor('correct', undefined), 'kumo_no_ito');
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

test('SUKUNA_HITSUME_INTERVAL_MS = 4000 (必中: slash 1 opsi salah / 4 dtk)', () => {
  assert.equal(SUKUNA_HITSUME_INTERVAL_MS, 4000);
});

test('sukunaHitsumeCount: 3 opsi salah habis dalam ~12 dtk', () => {
  assert.equal(sukunaHitsumeCount(0), 0);
  assert.equal(sukunaHitsumeCount(1), 1);
  assert.equal(sukunaHitsumeCount(3), 3);
  assert.equal(sukunaHitsumeCount(5), 5);
  assert.equal(sukunaHitsumeCount(NaN), 0);
  assert.equal(sukunaHitsumeCount(-2), 0);
});

test('sukunaHitsumeOrder: pilih opsi salah satu-satu, bukan jawaban benar, rng injectable', () => {
  const opts = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
  const order = sukunaHitsumeOrder(opts, 'a', () => 0);
  assert.equal(order.length, 3, 'hanya opsi salah');
  assert.ok(!order.includes('a'), 'jawaban benar tidak boleh kena');
  assert.deepEqual(sukunaHitsumeOrder(opts, 'a', () => 0), order, 'rng sama -> hasil sama');
  assert.equal(new Set(order).size, order.length, 'tidak duplikat');
  // input aneh aman
  assert.deepEqual(sukunaHitsumeOrder(null, 'a'), []);
  assert.deepEqual(sukunaHitsumeOrder([{ id: 'a' }], 'a'), []);
});

test('sukunaHitsumeCut: tiap 4 dtk satu opsi salah, stabil antar render, stop di jawaban benar', () => {
  const opts = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
  assert.deepEqual(sukunaHitsumeCut(opts, 'a', 0), []);
  assert.deepEqual(sukunaHitsumeCut(opts, 'a', 3.9), []);
  assert.deepEqual(sukunaHitsumeCut(opts, 'a', 4), ['b']);
  assert.deepEqual(sukunaHitsumeCut(opts, 'a', 8), ['b', 'c']);
  assert.deepEqual(sukunaHitsumeCut(opts, 'a', 12), ['b', 'c', 'd']);
  assert.deepEqual(sukunaHitsumeCut(opts, 'a', 30), ['b', 'c', 'd'], 'cap: tinggal jawaban benar');
  // stabil: panggilan berulang hasil sama (bukan acak)
  assert.deepEqual(sukunaHitsumeCut(opts, 'a', 8), sukunaHitsumeCut(opts, 'a', 8));
  // input aneh aman
  assert.deepEqual(sukunaHitsumeCut(null, 'a', 8), []);
  assert.deepEqual(sukunaHitsumeCut(opts, 'a', NaN), []);
  assert.deepEqual(sukunaHitsumeCut(opts, 'a', -2), []);
  // interval custom
  assert.deepEqual(sukunaHitsumeCut(opts, 'a', 2, 2000), ['b']);
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
