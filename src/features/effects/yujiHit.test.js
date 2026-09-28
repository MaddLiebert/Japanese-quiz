import test from 'node:test';
import assert from 'node:assert/strict';
import { punchVector, markYujiPicked } from './yujiHit.js';

test('punchVector: arah menjauhi pusat, magnitude tetap', () => {
  const v = punchVector(0, 0, 1000, 800, 14);          // kiri-atas
  assert.ok(v.x < 0 && v.y < 0, 'dorong ke kiri-atas');
  assert.ok(Math.abs(Math.hypot(v.x, v.y) - 14) < 0.05, 'panjang = magnitude');
  const c = punchVector(500, 400, 1000, 800);          // tepat pusat
  assert.deepEqual(c, { x: 0, y: 0 });
  const d = punchVector(1500, 400, 1000, 800, 10);     // kanan
  assert.ok(d.x > 0 && Math.abs(d.y) < 0.01);
});

test('markYujiPicked: hanya satu tombol bertanda, pindah saat klik baru', () => {
  const mk = (l, t, w, h) => ({
    dataset: {}, style: { setProperty() {}, removeProperty() {} },
    getBoundingClientRect: () => ({ left: l, top: t, width: w, height: h }),
  });
  const a = mk(0, 0, 100, 40);
  const b = mk(900, 700, 100, 40);
  const doc = { querySelectorAll: () => [a, b] };
  const win = { document: doc, innerWidth: 1000, innerHeight: 800 };
  assert.equal(markYujiPicked(a, win), true);
  assert.equal(a.dataset.picked, '1');
  assert.equal(markYujiPicked(b, win), true);
  assert.equal(a.dataset.picked, undefined, 'tanda lama dilepas');
  assert.equal(b.dataset.picked, '1');
  assert.equal(markYujiPicked(null, win), false);
});
