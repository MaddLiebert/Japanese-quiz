import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EDO_STOPS, EDO_LAST_STOP, edoStopById, edoStopByFeature, validateStops,
} from './edoStops.js';

test('stops: 8 perhentian sesuai PRD §7', () => {
  assert.equal(EDO_STOPS.length, 8);
});

test('stops: valid (nomor berurutan, id unik, field lengkap, 1 checkpoint di akhir)', () => {
  assert.deepEqual(validateStops(), []);
});

test('stops: urutan rute 日本橋 → … → 箱根関所', () => {
  assert.deepEqual(
    EDO_STOPS.map((s) => s.jp),
    ['日本橋', '浅草寺', '両国', '上野', '深川', '吉原・夜市', '品川宿', '箱根関所'],
  );
});

test('stops: perhentian terakhir = checkpoint 箱根関所 (ujian naik era)', () => {
  assert.equal(EDO_LAST_STOP.jp, '箱根関所');
  assert.equal(EDO_LAST_STOP.feature, 'checkpoint');
  assert.equal(EDO_LAST_STOP.last, true);
  assert.equal(EDO_LAST_STOP.n, 7);
});

test('stops: fitur app terhubung sesuai PRD §11', () => {
  assert.equal(edoStopByFeature('gacha')?.jp, '深川');       // 富くじ
  assert.equal(edoStopByFeature('dark')?.jp, '吉原・夜市');   // 提灯
  assert.equal(edoStopByFeature('checkpoint')?.jp, '箱根関所');
  assert.equal(edoStopByFeature('shop')?.jp, '浅草寺');       // 問屋
  assert.equal(edoStopByFeature('nav')?.jp, '日本橋');
});

test('stops: lookup by id, id tak dikenal → null', () => {
  assert.equal(edoStopById('nihonbashi')?.n, 0);
  assert.equal(edoStopById('nope'), null);
});

test('validateStops: menangkap nomor salah & checkpoint hilang', () => {
  const bad = [{ n: 3, id: 'a', jp: 'x', romaji: 'x', theme: 't', theme_id: 't', lesson_jp: 'l', lesson_id: 'l', moment: 'm', moment_id: 'm', vibe: 'v', feature: 'nav' }];
  const errs = validateStops(bad);
  assert.ok(errs.some((e) => /nomor/.test(e)));
  assert.ok(errs.some((e) => /checkpoint/.test(e)));
});
