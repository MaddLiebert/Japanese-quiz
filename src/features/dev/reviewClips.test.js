import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewClips, nextClip } from './reviewClips.js';
import { VOICES } from '../audio/voices.js';

test('reviewClips: overlay dulu, lalu klip voice (urutan putar kuis)', () => {
  const voice = {
    overlays: { correct: ['/o1.mp3'] },
    files: { correct: ['/c1.mp3', '/c2.mp3'] },
  };
  assert.deepEqual(reviewClips(voice, 'correct'), ['/o1.mp3', '/c1.mp3', '/c2.mp3']);
});

test('reviewClips: voice tanpa klip / null → []', () => {
  assert.deepEqual(reviewClips(VOICES.taiko, 'correct'), []);
  assert.deepEqual(reviewClips(null, 'wrong'), []);
});

test('reviewClips: fallback clips (Gojo correct) — TIDAK untuk streak/wrong', () => {
  const g = VOICES.gojo;
  assert.deepEqual(reviewClips(g, 'correct'), g.clips);       // 4 klip teknik
  assert.deepEqual(reviewClips(g, 'wrong'), g.files.wrong);   // 4 klip "kalah"
  assert.deepEqual(reviewClips(g, 'streak'), []);             // streak Gojo = synth gong
});

test('reviewClips: yuta SENYAP (klip dihapus 30/09) → 0 klip; toji bersuara lagi', () => {
  for (const kind of ['correct', 'wrong', 'streak']) {
    assert.deepEqual(reviewClips(VOICES.yuta, kind), [], `yuta/${kind}`);
  }
  // Toji: correct -> clips (6), wrong -> 2 kalah, streak -> [] (pola Gojo/Nanami).
  assert.equal(reviewClips(VOICES.toji, 'correct').length, 6);
  assert.equal(reviewClips(VOICES.toji, 'wrong').length, 2);
  assert.deepEqual(reviewClips(VOICES.toji, 'streak'), []);
  // Nanami: correct -> clips (5 jurus), wrong -> 3 kalah, streak -> [] (pola Gojo).
  assert.equal(reviewClips(VOICES.nanami, 'correct').length, 5);
  assert.equal(reviewClips(VOICES.nanami, 'wrong').length, 3);
  assert.deepEqual(reviewClips(VOICES.nanami, 'streak'), []);
  // Nobara: correct -> clips (6 klip: 4 jurus + 2 ambience), wrong -> 3 kalah, streak -> [].
  assert.equal(reviewClips(VOICES.nobara, 'correct').length, 6);
  assert.equal(reviewClips(VOICES.nobara, 'wrong').length, 3);
  assert.deepEqual(reviewClips(VOICES.nobara, 'streak'), []);
  // Megumi: correct -> clips (6 jurus ladder + chant), wrong -> 3 kalah, streak -> [].
  assert.equal(reviewClips(VOICES.megumi, 'correct').length, 6);
  assert.equal(reviewClips(VOICES.megumi, 'wrong').length, 3);
  assert.deepEqual(reviewClips(VOICES.megumi, 'streak'), []);
  // Yuji: correct -> clips (8 klip teknik), wrong -> 3 meme, streak -> [].
  assert.equal(reviewClips(VOICES.yuji, 'correct').length, 8);
  assert.equal(reviewClips(VOICES.yuji, 'wrong').length, 3);
  assert.deepEqual(reviewClips(VOICES.yuji, 'streak'), []);
  // Sukuna: correct -> clips (6 jurus + cast domain), wrong -> 2 (gambare/bakana), streak -> [].
  assert.equal(reviewClips(VOICES.sukuna, 'correct').length, 6);
  assert.equal(reviewClips(VOICES.sukuna, 'wrong').length, 2);
  assert.deepEqual(reviewClips(VOICES.sukuna, 'streak'), []);
});


test('nextClip: berputar dan tidak pernah undefined', () => {
  const list = ['/a.mp3', '/b.mp3', '/c.mp3'];
  let cur = 0;
  const seen = [];
  for (let i = 0; i < 7; i++) {
    const r = nextClip(list, cur);
    seen.push(r.path);
    cur = r.cursor;
  }
  assert.deepEqual(seen, ['/a.mp3', '/b.mp3', '/c.mp3', '/a.mp3', '/b.mp3', '/c.mp3', '/a.mp3']);
});

test('nextClip: daftar kosong / cursor kotor → aman', () => {
  assert.deepEqual(nextClip([], 3), { path: null, cursor: 0, index: -1 });
  assert.deepEqual(nextClip(null), { path: null, cursor: 0, index: -1 });
  const r = nextClip(['/x.mp3'], -2.7);
  assert.equal(r.path, '/x.mp3');
  assert.equal(r.index, 0);
});
