import test from 'node:test';
import assert from 'node:assert/strict';
import { WRITE_COLORS, writeCanvasSize, writeQuizOptions } from './writeQuiz.js';

test('WRITE_COLORS: semua field warna hex valid', () => {
  for (const [k, v] of Object.entries(WRITE_COLORS)) {
    assert.match(v, /^#[0-9a-fA-F]{6}$/, `warna ${k} tidak valid: ${v}`);
  }
});

test('writeCanvasSize: dibatasi rentang wajar (>=220 dan <=360)', () => {
  for (const w of [320, 375, 768, 1440, 4000]) {
    const size = writeCanvasSize(w);
    assert.ok(size >= 220 && size <= 360, `size ${size} untuk width ${w}`);
  }
});

test('writeCanvasSize: layar kecil mengecil, layar besar dibatasi 360', () => {
  assert.ok(writeCanvasSize(320) <= writeCanvasSize(768));
  assert.equal(writeCanvasSize(4000), 360);
});

test('writeQuizOptions: ramah pemula (hint muncul, leniency santai)', () => {
  const o = writeQuizOptions('light');
  assert.equal(o.showHintAfterMisses, 3);
  assert.ok(o.leniency >= 1 && o.leniency <= 2);
  assert.equal(o.highlightOnComplete, true);
  assert.equal(o.acceptBackwardsStrokes, true);   // arah terbalik dimaafkan (mode latihan)
  assert.equal(o.markStrokeCorrectAfterMisses, false);
  assert.equal(o.quizStartStrokeNum, 0);
  assert.equal(typeof o.onCorrectStroke, 'function');
  assert.equal(typeof o.onMistake, 'function');
  assert.equal(typeof o.onComplete, 'function');
});

test('writeQuizOptions: mode strict mematikan hint & arah terbalik', () => {
  const o = writeQuizOptions('strict');
  assert.equal(o.showHintAfterMisses, false);
  assert.equal(o.acceptBackwardsStrokes, false);
  assert.ok(o.leniency < writeQuizOptions('light').leniency);
});

test('writeQuizOptions: mode tak dikenal → fallback light', () => {
  assert.deepEqual(
    { ...writeQuizOptions('zzz'), onCorrectStroke: 1, onMistake: 1, onComplete: 1 },
    { ...writeQuizOptions('light'), onCorrectStroke: 1, onMistake: 1, onComplete: 1 },
  );
});

test('writeQuizOptions: handlers dikirim user diteruskan apa adanya', () => {
  const onComplete = () => {};
  const o = writeQuizOptions('light', { onComplete });
  assert.equal(o.onComplete, onComplete);
});
