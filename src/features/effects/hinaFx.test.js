import test from 'node:test';
import assert from 'node:assert/strict';
import { HINA_ANSWER_TEXT, hinaAnswerText, hinaSparkles } from './hinaFx.js';

test('hinaAnswerText: teks reaksi tiap jenis jawaban', () => {
  assert.equal(hinaAnswerText('correct'), '正解！');
  assert.equal(hinaAnswerText('wrong'), 'ドンマイ！');
  assert.equal(hinaAnswerText('streak'), '連続正解！');
  assert.equal(hinaAnswerText('nope'), '');
});

test('HINA_ANSWER_TEXT: tepat 3 jenis', () => {
  assert.deepEqual(Object.keys(HINA_ANSWER_TEXT).sort(), ['correct', 'streak', 'wrong']);
});

test('hinaSparkles: jumlah default & deterministik (rng=0)', () => {
  const s = hinaSparkles(7);
  assert.equal(s.length, 14);
  const d = hinaSparkles(7, 14, () => 0);
  assert.equal(d[0].dx, 70);          // cos(0)*70
  assert.equal(d[0].dy, -30);         // sin(0)*70 - 30
  assert.equal(d[0].rot, -180);
  assert.equal(d[0].size, 12);
  assert.equal(d[0].char, '✦');
  assert.equal(d[0].hue, '#ff8fb1');
});

test('hinaSparkles: id unik & semua field ada', () => {
  const s = hinaSparkles(3, 20);
  assert.equal(new Set(s.map(p => p.id)).size, 20);
  for (const p of s) {
    for (const k of ['id', 'dx', 'dy', 'rot', 'size', 'delay', 'dur', 'char', 'hue']) {
      assert.ok(k in p, `field ${k} hilang`);
    }
  }
});
