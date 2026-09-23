import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HINA_ANSWER_TEXT, hinaAnswerText,
  HINA_TEXT_COLOR, hinaTextColor, hinaGlow,
  HINA_SPARKLE_COUNT, hinaSparkleCount,
  HINA_SPARKLE_HUES, hinaSparkles,
} from './hinaFx.js';

test('hinaAnswerText: teks reaksi tiap jenis jawaban', () => {
  assert.equal(hinaAnswerText('correct'), '正解！');
  assert.equal(hinaAnswerText('wrong'), 'ドンマイ！');
  assert.equal(hinaAnswerText('streak'), '連続正解！');
  assert.equal(hinaAnswerText('nope'), '');
});

test('HINA_ANSWER_TEXT: tepat 3 jenis', () => {
  assert.deepEqual(Object.keys(HINA_ANSWER_TEXT).sort(), ['correct', 'streak', 'wrong']);
});

test('hinaTextColor: semua pink (Hina), fallback pink', () => {
  assert.deepEqual(HINA_TEXT_COLOR, { correct: '#ff4d94', wrong: '#e0568f', streak: '#ff4d94' });
  assert.equal(hinaTextColor('nope'), '#ff4d94');
});

test('hinaSparkleCount: benar & streak paling ramai', () => {
  assert.deepEqual(HINA_SPARKLE_COUNT, { correct: 12, wrong: 8, streak: 14 });
  assert.ok(hinaSparkleCount('correct') > hinaSparkleCount('wrong'));
  assert.equal(hinaSparkleCount('nope'), 14);
});

test('hinaSparkleCount: dijaga sedang (<=14) supaya ringan', () => {
  for (const k of ['correct', 'wrong', 'streak']) assert.ok(hinaSparkleCount(k) <= 14, `${k} terlalu banyak`);
});

test('hinaGlow: pakai text-shadow (bukan filter), ada warna & bayangan', () => {
  const g = hinaGlow('#ff4d94');
  assert.equal(typeof g, 'string');
  assert.ok(g.includes('#ff4d94'), 'harus menyertakan warna glow');
  assert.ok(!g.includes('drop-shadow'), 'TIDAK boleh drop-shadow (berat)');
  assert.ok(g.split(',').length >= 3, 'butuh beberapa lapis glow + bayangan');
  assert.ok(hinaGlow().includes('#ff4d94'), 'default pink');
});

test('hinaSparkles: jumlah default & deterministik (rng=0)', () => {
  const s = hinaSparkles(7);
  assert.equal(s.length, 14);
  const d = hinaSparkles(7, 14, () => 0);
  assert.equal(d[0].dx, 80);          // cos(0)*80
  assert.equal(d[0].dy, -30);         // sin(0)*80 - 30
  assert.equal(d[0].rot, -180);
  assert.equal(d[0].size, 14);
  assert.equal(d[0].char, '✦');
  assert.equal(d[0].hue, '#ff4d94');
});

test('hinaSparkles: palet dibatasi pink/gold/putih (senada Hina)', () => {
  assert.deepEqual(HINA_SPARKLE_HUES, ['#ff4d94', '#ff8fb1', '#ffd166', '#ffffff', '#ffb3d1']);
  const s = hinaSparkles(1, 60);
  for (const p of s) assert.ok(HINA_SPARKLE_HUES.includes(p.hue), `hue ${p.hue} di luar palet`);
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
