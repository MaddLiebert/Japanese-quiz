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

test('reviewClips: karakter JJK → 3 klip per jenis (Yuji sudah pola Gojo)', () => {
  for (const k of ['nobara', 'megumi', 'nanami', 'yuta', 'toji', 'sukuna']) {
    for (const kind of ['correct', 'wrong', 'streak']) {
      assert.equal(reviewClips(VOICES[k], kind).length, 3, `${k}/${kind}`);
    }
  }
  // Yuji: correct -> clips (8 klip teknik), wrong -> 3 meme, streak -> [].
  assert.equal(reviewClips(VOICES.yuji, 'correct').length, 8);
  assert.equal(reviewClips(VOICES.yuji, 'wrong').length, 3);
  assert.deepEqual(reviewClips(VOICES.yuji, 'streak'), []);
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
