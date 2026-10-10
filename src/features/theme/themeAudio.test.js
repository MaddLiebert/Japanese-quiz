import test from 'node:test';
import assert from 'node:assert/strict';
import { themeBgmPlan, THEME_BGM_STEP_S } from '../../utils/sfx.js';
import {
  startThemeBgm, stopThemeBgm, setThemeBgmEnabled,
  themeBgmEnabled, themeBgmActive, themeBgmEra, THEME_BGM_KEY,
  themeBgmVolume, themeBgmVolumeStep, setThemeBgmVolume, stepThemeBgmVolume,
  nextVolumeStep, clampVolumeStep, THEME_BGM_VOL_KEY, THEME_BGM_VOL_STEPS,
  DEFAULT_THEME_BGM_VOLUME,
} from './themeAudio.js';

// ── BGM tema Heian (docs/tema/heian.md §9 T12) ──────────────────────────────

test('themeBgmPlan: deterministik & default ke heian', () => {
  assert.deepEqual(themeBgmPlan(), themeBgmPlan('heian'));
  assert.deepEqual(themeBgmPlan('era-yang-tak-ada'), themeBgmPlan('heian'));
  assert.equal(typeof THEME_BGM_STEP_S, 'number');
});

// ── BGM tema Edo 江戸 (docs/tema/edo.md §9) ──────────────────────────────────

test('themeBgmPlan edo: level rendah & masuk GESIT (lebih cepat dari Heian)', () => {
  const p = themeBgmPlan('edo');
  assert.ok(p.level > 0 && p.level <= 0.15, 'level rendah (BGM default)');
  assert.ok(p.fadeInMs < themeBgmPlan('heian').fadeInMs, 'Edo masuk lebih cepat dari Heian');
  assert.ok(p.fadeInMs >= 800 && p.fadeInMs <= 2000, 'gesit tapi tidak menghentak');
});

test('themeBgmPlan edo: drone bass + pad mid (audible, ada konten mid)', () => {
  const p = themeBgmPlan('edo');
  assert.ok(p.drone.freqs.length >= 2);
  assert.ok(p.drone.freqs.some((f) => f <= 60), 'ada bass');
  assert.ok(p.pad.freqs.length >= 2);
  const all = [...p.drone.freqs, ...p.pad.freqs];
  for (const f of all) assert.ok(f >= 30 && f <= 2000, `freq ${f} audible`);
  assert.ok(all.filter((f) => f >= 150).length >= 2, 'ada konten mid');
  assert.ok(p.pad.lfoHz > 0 && p.pad.lfoHz <= 0.5, 'LFO napas');
});

test('themeBgmPlan edo: shamisen 三味線 RITMIS (lebih cepat dari koto Heian)', () => {
  const p = themeBgmPlan('edo');
  assert.ok(Array.isArray(p.pluck.notes) && p.pluck.notes.length >= 4, 'tangga nada cukup');
  for (const n of p.pluck.notes) assert.ok(n >= 200 && n <= 900, `nada shamisen ${n} register nyaman`);
  assert.ok(p.pluck.everyMs < themeBgmPlan('heian').koto.everyMs, 'Edo lebih ritmis dari Heian');
  assert.ok(p.pluck.dur > 0 && p.pluck.gain > 0 && p.pluck.gain <= 0.3);
});

test('themeBgmPlan: Heian & Edo beda (kontras tema terdengar)', () => {
  assert.notDeepEqual(themeBgmPlan('heian'), themeBgmPlan('edo'));
  assert.equal(themeBgmPlan('edo').koto, undefined, 'Edo memakai pluck, bukan koto');
  assert.equal(themeBgmPlan('heian').pluck, undefined, 'Heian memakai koto, bukan pluck');
});

// ── BGM tema Meiji 明治 (docs/tema/meiji.md §9) ─────────────────────────────

test('themeBgmPlan meiji: level rendah & masuk TEGAS (lebih gesit dari Heian)', () => {
  const p = themeBgmPlan('meiji');
  assert.ok(p.level > 0 && p.level <= 0.15, 'level rendah (BGM default)');
  assert.ok(p.fadeInMs < themeBgmPlan('heian').fadeInMs, 'Meiji masuk lebih cepat dari Heian');
  assert.ok(p.fadeInMs >= 800 && p.fadeInMs <= 2000, 'tegas-mekanis tapi tidak menghentak');
  assert.ok(p.fadeOutMs > 0 && p.fadeOutMs <= 1200);
});

test('themeBgmPlan meiji: drone bass + pad mid (audible, ada konten mid)', () => {
  const p = themeBgmPlan('meiji');
  assert.ok(p.drone.freqs.length >= 2);
  assert.ok(p.drone.freqs.some((f) => f <= 60), 'ada bass');
  assert.ok(p.pad.freqs.length >= 2);
  const all = [...p.drone.freqs, ...p.pad.freqs];
  for (const f of all) assert.ok(f >= 30 && f <= 2000, `freq ${f} audible`);
  assert.ok(all.filter((f) => f >= 150).length >= 2, 'ada konten mid');
  assert.ok(p.pad.lfoHz > 0 && p.pad.lfoHz <= 0.5, 'LFO napas');
});

test('themeBgmPlan meiji: piano/glock bertangga MAYOR diatonik (Barat, bukan pentatonik)', () => {
  const p = themeBgmPlan('meiji');
  assert.ok(Array.isArray(p.pluck.notes) && p.pluck.notes.length >= 4, 'tangga nada cukup');
  for (const n of p.pluck.notes) assert.ok(n >= 200 && n <= 900, `nada ${n} register nyaman`);
  // C D E G A = mayor pentatonik; setara derajat 0,2,4,7,9 dari C.
  const semis = p.pluck.notes.map((n) => Math.round(12 * Math.log2(n / 261.63)));
  assert.deepEqual(semis, [0, 2, 4, 7, 9], 'tangga mayor (Barat), bukan insen/hirajoshi');
  assert.ok(p.pluck.dur > 0 && p.pluck.gain > 0 && p.pluck.gain <= 0.3);
});

test('themeBgmPlan: tiga era saling beda (kontras tema terdengar)', () => {
  assert.notDeepEqual(themeBgmPlan('meiji'), themeBgmPlan('edo'));
  assert.notDeepEqual(themeBgmPlan('meiji'), themeBgmPlan('heian'));
  assert.equal(themeBgmPlan('meiji').koto, undefined, 'Meiji memakai pluck, bukan koto');
  // Drone Meiji lebih terang dari Edo (+C3 130.81).
  assert.ok(themeBgmPlan('meiji').drone.freqs.includes(130.81), 'drone +C3 = lebih terang');
});

// ── BGM tema 多元 (docs/tema/anime.md §9) ───────────────────────────────────

test('themeBgmPlan anime: level rendah & masuk cerah-gesit', () => {
  const p = themeBgmPlan('anime');
  assert.ok(p.level > 0 && p.level <= 0.15, 'level rendah (BGM default)');
  assert.ok(p.fadeInMs < themeBgmPlan('heian').fadeInMs, '多元 masuk lebih cepat dari Heian');
  assert.ok(p.fadeInMs >= 800 && p.fadeInMs <= 2000, 'cerah tapi tidak menghentak');
  assert.ok(p.fadeOutMs > 0 && p.fadeOutMs <= 1200);
});

test('themeBgmPlan anime: drone bass + pad mid (audible)', () => {
  const p = themeBgmPlan('anime');
  assert.ok(p.drone.freqs.length >= 2);
  assert.ok(p.drone.freqs.some((f) => f <= 60), 'ada bass');
  assert.ok(p.pad.freqs.length >= 2);
  const all = [...p.drone.freqs, ...p.pad.freqs];
  for (const f of all) assert.ok(f >= 30 && f <= 2000, `freq ${f} audible`);
  assert.ok(all.filter((f) => f >= 150).length >= 2, 'ada konten mid');
  assert.ok(p.pad.lfoHz > 0 && p.pad.lfoHz <= 0.5, 'LFO napas');
});

test('themeBgmPlan anime: chiptune 8-bit — pad SQUARE (khas game/anime)', () => {
  const p = themeBgmPlan('anime');
  assert.equal(p.pad.type, 'square', '多元 = gelombang kotak 8-bit (era lain triangle/sawtooth)');
  assert.ok(Array.isArray(p.pluck.notes) && p.pluck.notes.length >= 5, 'tangga nada cukup');
  for (const n of p.pluck.notes) assert.ok(n >= 200 && n <= 900, `nada ${n} register nyaman`);
  // Tangga mayor cerah (C D E G A C) — setara derajat 0,2,4,7,9,12.
  const semis = p.pluck.notes.map((n) => Math.round(12 * Math.log2(n / 261.63)));
  assert.deepEqual(semis, [0, 2, 4, 7, 9, 12], 'tangga mayor cerah (chiptune)');
  assert.ok(p.pluck.everyMs < themeBgmPlan('showa').pluck.everyMs, '多元 lebih ritmis (game) dari Shōwa');
  assert.ok(p.pluck.gain > 0 && p.pluck.gain <= 0.3);
});

test('themeBgmPlan: 5 era saling beda (kontras tema terdengar)', () => {
  const eras = ['heian', 'edo', 'meiji', 'showa', 'anime'];
  const seen = eras.map((e) => JSON.stringify(themeBgmPlan(e)));
  assert.equal(new Set(seen).size, eras.length, 'tiap era punya plan sendiri');
  assert.equal(themeBgmPlan('anime').koto, undefined, '多元 memakai pluck, bukan koto');
});

test('themeBgmPlan heian: level −18 dB (≈0.12), fade lambat & santun', () => {
  const p = themeBgmPlan('heian');
  assert.ok(p.level > 0 && p.level <= 0.13, 'level rendah (BGM default −18 dB)');
  assert.ok(p.fadeInMs >= 1000, 'fade-in lambat');
  assert.ok(p.fadeOutMs >= 500);
});

test('themeBgmPlan heian: drone bass + pad mid (kedengaran di speaker HP)', () => {
  const p = themeBgmPlan('heian');
  assert.ok(p.drone.freqs.length >= 2);
  assert.ok(p.drone.freqs.some((f) => f <= 60), 'ada bass');
  assert.ok(p.pad.freqs.length >= 2);
  const all = [...p.drone.freqs, ...p.pad.freqs];
  for (const f of all) assert.ok(f >= 30 && f <= 2000, `freq ${f} audible`);
  const mid = all.filter((f) => f >= 150);
  assert.ok(mid.length >= 2, 'ada konten mid');
  assert.ok(p.pad.lfoHz > 0 && p.pad.lfoHz <= 0.5, 'LFO napas pelan');
});

test('themeBgmPlan heian: koto pentatonik (hirajoshi) — warna Jepang kuno', () => {
  const p = themeBgmPlan('heian');
  assert.ok(Array.isArray(p.koto.notes) && p.koto.notes.length >= 4, 'tangga nada cukup');
  for (const n of p.koto.notes) assert.ok(n >= 200 && n <= 900, `nada koto ${n} di register nyaman`);
  assert.ok(p.koto.everyMs >= 1000, 'petikan pelan (bukan mesin)');
  assert.ok(p.koto.dur > 0 && p.koto.gain > 0 && p.koto.gain <= 0.3);
});

test('themeAudio: no-op di node (tanpa window) — tidak throw, tidak berbunyi', () => {
  assert.equal(startThemeBgm('heian'), false);
  assert.equal(stopThemeBgm(), false);
  assert.equal(themeBgmActive(), false);
  assert.equal(themeBgmEra(), null);
  assert.equal(themeBgmEnabled(), false, 'default OFF');
  assert.equal(setThemeBgmEnabled(true, 'heian'), true, 'mengembalikan state akhir');
  assert.equal(setThemeBgmEnabled(false, 'heian'), false);
});

test('THEME_BGM_KEY: default OFF (spec §9 R5)', () => {
  assert.equal(THEME_BGM_KEY, 'app_theme_bgm');
});

// ── Volume BGM (kecil/besar) ────────────────────────────────────────────────

test('volume: default 1.0, tangga 5 tingkat menanjak 0..1', () => {
  assert.equal(DEFAULT_THEME_BGM_VOLUME, 1);
  assert.equal(themeBgmVolume(), 1, 'default penuh (level plan sudah −18 dB)');
  assert.equal(THEME_BGM_VOL_STEPS.length, 5);
  for (let i = 1; i < THEME_BGM_VOL_STEPS.length; i += 1) {
    assert.ok(THEME_BGM_VOL_STEPS[i] > THEME_BGM_VOL_STEPS[i - 1], 'menanjak');
  }
  for (const s of THEME_BGM_VOL_STEPS) assert.ok(s > 0 && s <= 1, `step ${s} dalam 0..1`);
});

test('volume: step naik/turun dijepit di ujung (helper murni)', () => {
  const N = THEME_BGM_VOL_STEPS.length;
  assert.equal(themeBgmVolumeStep(), N - 1, 'default = tingkat tertinggi');
  // nextVolumeStep(i, dir): murni & deterministik (tak tergantung localStorage).
  assert.equal(nextVolumeStep(N - 1, 1), N - 1, 'sudah paling besar → tetap');
  assert.equal(nextVolumeStep(0, -1), 0, 'paling kecil → tetap');
  assert.equal(nextVolumeStep(4, -1), 3);
  assert.equal(nextVolumeStep(3, -1), 2);
  assert.equal(nextVolumeStep(2, 1), 3);
  assert.equal(clampVolumeStep(99), N - 1, 'dijepit atas');
  assert.equal(clampVolumeStep(-5), 0, 'dijepit bawah');
});

test('volume: stepThemeBgmVolume mengembalikan angka (no-op aman di node)', () => {
  assert.equal(typeof stepThemeBgmVolume(-1, 4), 'number');
  assert.equal(stepThemeBgmVolume(-1, 4), THEME_BGM_VOL_STEPS[3]);
  assert.equal(stepThemeBgmVolume(1, 0), THEME_BGM_VOL_STEPS[1]);
});

test('volume: no-op aman di node (tanpa window)', () => {
  assert.equal(themeBgmVolume(), DEFAULT_THEME_BGM_VOLUME);
  assert.equal(typeof setThemeBgmVolume(0.4), 'number');
  assert.equal(setThemeBgmVolume(2), 1, 'dijepit ke 1');
  assert.equal(setThemeBgmVolume(-1), 0, 'dijepit ke 0');
});

test('volume: THEME_BGM_VOL_KEY stabil', () => {
  assert.equal(THEME_BGM_VOL_KEY, 'app_theme_bgm_volume');
});
