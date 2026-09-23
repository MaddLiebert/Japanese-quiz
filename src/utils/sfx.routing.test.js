import test from 'node:test';
import assert from 'node:assert/strict';
import { setActiveVoice, getActiveVoiceKey, streakTierIndex, STREAK_TIER_BY_LEVEL, answerFeedbackKind, feedbackFiles, streakPlaylist, voiceFilePaths, hinaGifHoldMs, playClipFile, pickStreakClip, primeVoice } from './sfx.js';
import { VOICES } from '../features/audio/voices.js';

test('default tanpa pack: tidak ada voice (chime dasar)', () => {
  setActiveVoice(null);
  assert.equal(getActiveVoiceKey(), null);
});

test('setActiveVoice mengubah voice & null = tanpa pack', () => {
  setActiveVoice('dummy');
  assert.equal(getActiveVoiceKey(), 'dummy');
  setActiveVoice('taiko');
  assert.equal(getActiveVoiceKey(), 'taiko');
  setActiveVoice(null);
  assert.equal(getActiveVoiceKey(), null);
});

test('sfx.js tetap mengekspor streakGongParams (gong audible tidak boleh hilang)', async () => {
  const mod = await import('./sfx.js');
  assert.equal(typeof mod.streakGongParams, 'function');
  const p = mod.streakGongParams(1);
  assert.ok(p.base >= 180, 'base harus audible (>=180Hz)');
});

test('STREAK_TIER_BY_LEVEL memetakan 12 milestone → 6 tier (50 & 100 sendiri)', () => {
  assert.deepEqual(STREAK_TIER_BY_LEVEL, [0, 0, 1, 1, 2, 2, 3, 4, 4, 4, 4, 5]);
  assert.equal(STREAK_TIER_BY_LEVEL[6], 3);   // level 7  = streak 50
  assert.equal(STREAK_TIER_BY_LEVEL[11], 5);  // level 12 = streak 100
});

test('streakTierIndex: level → indeks tier (clamp + pecahan)', () => {
  assert.equal(streakTierIndex(1), 0);     // streak 3  → tier 1
  assert.equal(streakTierIndex(2.7), 0);   // floor 2   → tier 1
  assert.equal(streakTierIndex(7), 3);     // streak 50 → tier 4
  assert.equal(streakTierIndex(12), 5);    // streak 100 → tier 6
  assert.equal(streakTierIndex(0), 0);     // clamp bawah
  assert.equal(streakTierIndex(99), 5);    // clamp atas
});

test('answerFeedbackKind: streak hanya tepat di milestone, sisanya type', () => {
  assert.equal(answerFeedbackKind('wrong', false), 'wrong');
  assert.equal(answerFeedbackKind('wrong', true), 'wrong');
  assert.equal(answerFeedbackKind('correct', true), 'streak');   // tepat di milestone
  assert.equal(answerFeedbackKind('correct', false), 'correct'); // benar biasa
});

test('feedbackFiles: overlay + klip voice diputar DUA-DUANYA', () => {
  const voice = { files: { correct: ['/a.mp3'] }, overlays: { correct: ['/ov.mp3'] } };
  assert.deepEqual(feedbackFiles(voice, 'correct', () => 0), ['/ov.mp3', '/a.mp3']);
});

test('feedbackFiles: tanpa overlays → hanya klip voice', () => {
  const voice = { files: { wrong: ['/w.mp3'] } };
  assert.deepEqual(feedbackFiles(voice, 'wrong', () => 0), ['/w.mp3']);
});

test('feedbackFiles: voice kosong / taiko → [] (fallback synth)', () => {
  assert.deepEqual(feedbackFiles(VOICES.taiko, 'correct'), []);
  assert.deepEqual(feedbackFiles(undefined, 'wrong'), []);
  assert.deepEqual(feedbackFiles({ files: { correct: [] } }, 'correct'), []);
});

test('streakPlaylist: base rightanswer + klip Hina streak diputar BARENG', () => {
  const v = VOICES.hina;
  // milestone → base rightanswer (overlay) + klip streak tier yang sesuai
  assert.deepEqual(streakPlaylist(v, 1, () => 0),
    ['/voices/hina/rightanswer.mp3', '/voices/hina/streak_1.mp3']);   // level 1 → tier 0
  assert.deepEqual(streakPlaylist(v, 7, () => 0),
    ['/voices/hina/rightanswer.mp3', '/voices/hina/streak_4.mp3']);   // level 7 → tier 3 (50)
  assert.deepEqual(streakPlaylist(v, 12, () => 0),
    ['/voices/hina/rightanswer.mp3', '/voices/hina/streak_6.mp3']);   // level 12 → tier 5 (100)
});

test('streakPlaylist: tanpa overlay / voice kosong → tetap aman', () => {
  assert.deepEqual(streakPlaylist({ files: { streak: ['/s1.mp3'] } }, 1, () => 0), ['/s1.mp3']);
  assert.deepEqual(streakPlaylist(VOICES.taiko, 1), []);   // streak kosong → []
});

test('voiceFilePaths: kumpulkan SEMUA path file + overlay (untuk preload)', () => {
  const paths = voiceFilePaths(VOICES.hina);
  assert.equal(paths.length, 11);   // 0 correct + 3 wrong + 6 streak + rightanswer + wronganswer
  assert.ok(paths.includes('/voices/hina/rightanswer.mp3'));
  assert.ok(paths.includes('/voices/hina/wronganswer.mp3'));
  assert.ok(paths.includes('/voices/hina/wrong_1.mp3'));
  assert.ok(paths.includes('/voices/hina/streak_6.mp3'));
  assert.equal(new Set(paths).size, paths.length, 'path unik');
});

test('voiceFilePaths: voice kosong → []', () => {
  assert.deepEqual(voiceFilePaths(VOICES.taiko), []);
  assert.deepEqual(voiceFilePaths(undefined), []);
  assert.deepEqual(voiceFilePaths(null), []);
});

test('hinaGifHoldMs: ikuti durasi klip Hina (fallback + clamp)', () => {
  // durasi klip nyata (ms) dipakai apa adanya
  assert.equal(hinaGifHoldMs('wrong', 1960), 1960);
  assert.equal(hinaGifHoldMs('streak', 2980), 2980);
  // tanpa info durasi → fallback per jenis
  assert.equal(hinaGifHoldMs('wrong', 0), 2000);
  assert.equal(hinaGifHoldMs('streak', 0), 2800);
  assert.equal(hinaGifHoldMs('correct', 0), 1600);
  // clamp: jangan kedip (<1600) & jangan nyangkut (>8000)
  assert.equal(hinaGifHoldMs('wrong', 100), 1600);
  assert.equal(hinaGifHoldMs('wrong', 99999), 8000);
  // nilai tak valid → fallback
  assert.equal(hinaGifHoldMs('wrong', NaN), 2000);
  assert.equal(hinaGifHoldMs('wrong', -5), 2000);
});

test('playClipFile: aman di luar browser (tak melempar, kembalikan 0)', () => {
  // node tak punya window/Audio → harus aman & kembalikan 0 (tanpa throw).
  assert.equal(playClipFile('/voices/hina/streak_2.mp3'), 0);
  assert.equal(playClipFile(''), 0);
  assert.equal(playClipFile(null), 0);
  assert.equal(playClipFile(undefined), 0);
});

test('pickStreakClip: 50 & 100 pakai klip khusus, sisanya klip umum', () => {
  const f = VOICES.hina.files.streak;             // 6 klip
  assert.equal(pickStreakClip(f, 7).index, 3);    // streak 50  → 「五十連続」
  assert.equal(pickStreakClip(f, 12).index, 5);   // streak 100 → 「ひゃく」
  for (const lvl of [1, 2, 3, 4, 5, 6, 8, 9, 10, 11]) {
    assert.ok(![3, 5].includes(pickStreakClip(f, lvl, lvl).index),
      `level ${lvl} tak boleh pakai klip khusus (五十連続/ひゃく)`);
  }
});

test('pickStreakClip: rotasi TIDAK pernah mengulang klip sama berturut-turut', () => {
  const f = VOICES.hina.files.streak;
  let prev = null;
  for (let c = 0; c < 12; c++) {
    const { index } = pickStreakClip(f, 1, c);
    assert.notEqual(index, prev, `cursor ${c} mengulang klip sebelumnya`);
    prev = index;
  }
});

test('pickStreakClip: daftar kosong / null → aman', () => {
  assert.deepEqual(pickStreakClip([], 1, 0), { index: -1, path: null });
  assert.deepEqual(pickStreakClip(null, 1, 0), { index: -1, path: null });
  assert.deepEqual(pickStreakClip(undefined, 1, 0), { index: -1, path: null });
});

test('streakPlaylist: cursor menggeser klip streak (variatif, bukan sama terus)', () => {
  const v = VOICES.hina;
  const a = streakPlaylist(v, 1, () => 0, 0);
  const b = streakPlaylist(v, 1, () => 0, 1);
  assert.notDeepEqual(a, b, 'milestone berbeda harus bunyi klip berbeda');
});

test('primeVoice: aman tanpa fetch (node) → 0', () => {
  assert.equal(primeVoice(VOICES.hina), 0);
  assert.equal(primeVoice(null), 0);
});

test('primeVoice: fetcher inject → unduh tiap klip (buffer penuh)', () => {
  const calls = [];
  const fakeFetch = (p) => { calls.push(p); return Promise.resolve({ blob: () => Promise.resolve('x') }); };
  const n = primeVoice({ files: { correct: ['/zzz/a.mp3'], wrong: [], streak: ['/zzz/b.mp3'] }, overlays: {} }, fakeFetch);
  assert.equal(n, 2);
  assert.deepEqual(calls.slice().sort(), ['/zzz/a.mp3', '/zzz/b.mp3']);
});
