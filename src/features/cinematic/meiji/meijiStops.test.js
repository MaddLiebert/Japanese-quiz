import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MEIJI_STOPS, MEIJI_LAST_STOP, meijiStopById, meijiStopByFeature, validateStops,
} from './meijiStops.js';

test('stops: 8 perhentian sesuai PRD §7', () => {
  assert.equal(MEIJI_STOPS.length, 8);
});

test('stops: valid (nomor berurutan, id unik, field lengkap, 1 checkpoint di akhir)', () => {
  assert.deepEqual(validateStops(), []);
});

test('stops: urutan rute 横浜港 → … → 国会', () => {
  assert.deepEqual(
    MEIJI_STOPS.map((s) => s.jp),
    ['横浜港', '銀座', '新聞社', '鹿鳴館', '鉄道', '小学校', '博覧会', '国会'],
  );
});

test('stops: perhentian terakhir = checkpoint 国会 (ujian naik era)', () => {
  assert.equal(MEIJI_LAST_STOP.jp, '国会');
  assert.equal(MEIJI_LAST_STOP.feature, 'checkpoint');
  assert.equal(MEIJI_LAST_STOP.last, true);
  assert.equal(MEIJI_LAST_STOP.n, 7);
});

test('stops: fitur app terhubung sesuai PRD §11', () => {
  assert.equal(meijiStopByFeature('reading')?.jp, '新聞社');   // 読む
  assert.equal(meijiStopByFeature('grammar')?.jp, '小学校');   // 学ぶ
  assert.equal(meijiStopByFeature('shop')?.jp, '博覧会');      // 商店
  assert.equal(meijiStopByFeature('dark')?.jp, '銀座');        // 瓦斯灯
  assert.equal(meijiStopByFeature('checkpoint')?.jp, '国会');
  assert.equal(meijiStopByFeature('nav')?.jp, '横浜港');
});

test('stops: lookup by id, id tak dikenal → null', () => {
  assert.equal(meijiStopById('yokohama')?.n, 0);
  assert.equal(meijiStopById('kokkai')?.n, 7);
  assert.equal(meijiStopById('nope'), null);
});

test('validateStops: menangkap nomor salah & checkpoint hilang', () => {
  const bad = [{ n: 3, id: 'a', jp: 'x', romaji: 'x', theme: 't', theme_id: 't', lesson_jp: 'l', lesson_id: 'l', moment: 'm', moment_id: 'm', vibe: 'v', feature: 'nav' }];
  const errs = validateStops(bad);
  assert.ok(errs.some((e) => /nomor/.test(e)));
  assert.ok(errs.some((e) => /checkpoint/.test(e)));
});
