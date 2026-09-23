import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HINA_ANSWER_TEXT, hinaAnswerText,
  HINA_TEXT_COLOR, hinaTextColor, hinaGlow,
  HINA_SPARKLE_COUNT, hinaSparkleCount,
  HINA_SPARKLE_HUES, hinaSparkles,
  HINA_POP_EASE, HINA_POP_TIMES,
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

test('hinaGlow: SATU lapis glow lembut + bayangan (hindari kesan berlebih)', () => {
  const g = hinaGlow('#ff4d94');
  assert.equal(typeof g, 'string');
  assert.ok(g.includes('#ff4d94'), 'harus menyertakan warna glow');
  assert.ok(!g.includes('drop-shadow'), 'TIDAK boleh drop-shadow (berat)');
  // Hitung lapis = jumlah token warna (tiap shadow punya 1 warna).
  const layers = (g.match(/#[0-9a-fA-F]{3,8}|rgba?\(/g) || []).length;
  assert.equal(layers, 2, 'harus 2 lapis: 1 glow + 1 bayangan (3+ = neon berlebih)');
  // Warna glow hanya muncul SEKALI (bukan dobel glow).
  assert.equal(g.split('#ff4d94').length - 1, 1, 'glow warna hanya satu lapis');
  assert.ok(/0 0 7px/.test(g), 'blur glow lembut (7px)');
  assert.ok(hinaGlow().includes('#ff4d94'), 'default pink');
});

test('HINA_POP_EASE: cubic-bezier overshoot ala anime (bukan linear)', () => {
  assert.equal(HINA_POP_EASE.length, 4);
  assert.ok(HINA_POP_EASE[1] > 1, 'harus overshoot (>1) supaya tidak kaku');
  assert.deepEqual(HINA_POP_TIMES, [0, 0.62, 1]);
});

test('hinaSparkles: jumlah default & deterministik (rng=0)', () => {
  const s = hinaSparkles(7);
  assert.equal(s.length, 14);
  const d = hinaSparkles(7, 14, () => 0);
  assert.equal(d[0].dx, 90);          // cos(0)*90
  assert.equal(d[0].dy, -34);         // sin(0)*90 - 34
  assert.equal(d[0].rot, -180);
  assert.equal(d[0].spin, -220);
  assert.equal(d[0].size, 12);
  assert.equal(d[0].char, '✦');
  assert.equal(d[0].hue, '#ff4d94');
  assert.equal(d[0].delay, 0);        // stagger indeks 0
});

test('hinaSparkles: delay di-stagger (tidak serempak)', () => {
  const s = hinaSparkles(5, 12, () => 0);
  const delays = s.map(p => p.delay);
  assert.ok(delays[0] < delays[11], 'kilau terakhir harus lebih lambat dari pertama');
  assert.ok(new Set(delays).size > 1, 'delay harus bervariasi');
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
    for (const k of ['id', 'dx', 'dy', 'rot', 'spin', 'size', 'delay', 'dur', 'char', 'hue']) {
      assert.ok(k in p, `field ${k} hilang`);
    }
  }
});
