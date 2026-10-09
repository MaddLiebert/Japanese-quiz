import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SHOWA_STOPS, SHOWA_LAST_STOP, showaStopById, showaStopByFeature, validateStops,
} from './showaStops.js';

test('stops: 8 perhentian sesuai PRD §7', () => {
  assert.equal(SHOWA_STOPS.length, 8);
});

test('stops: valid (nomor berurutan, id unik, field lengkap, 1 checkpoint di akhir)', () => {
  assert.deepEqual(validateStops(), []);
});

test('stops: urutan rute 焼け跡 → … → 卒業', () => {
  assert.deepEqual(
    SHOWA_STOPS.map((s) => s.jp),
    ['焼け跡', '闇市', '団地', '東京タワー', '新幹線', 'オリンピック', '万博', '卒業'],
  );
});

test('stops: perhentian terakhir = checkpoint 卒業 (ujian N5 naik era)', () => {
  assert.equal(SHOWA_LAST_STOP.jp, '卒業');
  assert.equal(SHOWA_LAST_STOP.feature, 'checkpoint');
  assert.equal(SHOWA_LAST_STOP.last, true);
  assert.equal(SHOWA_LAST_STOP.n, 7);
});

test('stops: fitur app terhubung sesuai PRD §11', () => {
  assert.equal(showaStopByFeature('reading')?.jp, '闇市');   // 読む
  assert.equal(showaStopByFeature('grammar')?.jp, '団地');   // 学ぶ
  assert.equal(showaStopByFeature('shop')?.jp, '万博');      // 商店街
  assert.equal(showaStopByFeature('dark')?.jp, '東京タワー'); // 夜の団地
  assert.equal(showaStopByFeature('checkpoint')?.jp, '卒業');
  assert.equal(showaStopByFeature('nav')?.jp, '焼け跡');
});

test('stops: lookup by id, id tak dikenal → null', () => {
  assert.equal(showaStopById('yakeato')?.n, 0);
  assert.equal(showaStopById('sotsugyo')?.n, 7);
  assert.equal(showaStopById('nope'), null);
});

test('validateStops: menangkap nomor salah & checkpoint hilang', () => {
  const bad = [{ n: 3, id: 'a', jp: 'x', romaji: 'x', theme: 't', theme_id: 't', lesson_jp: 'l', lesson_id: 'l', moment: 'm', moment_id: 'm', vibe: 'v', feature: 'nav' }];
  const errs = validateStops(bad);
  assert.ok(errs.some((e) => /nomor/.test(e)));
  assert.ok(errs.some((e) => /checkpoint/.test(e)));
});
