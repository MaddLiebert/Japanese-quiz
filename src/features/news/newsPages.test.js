import test from 'node:test';
import assert from 'node:assert/strict';
import { SECOND_PAGE, pagesForStop, pageById } from './newsPages.js';

test('pagesForStop: kokkai memuat ≥1 (seinan/korea)', () => {
  const pages = pagesForStop('kokkai');
  assert.ok(pages.length >= 1);
  const ids = pages.map((p) => p.id);
  assert.ok(ids.includes('seinan'));
  assert.ok(ids.includes('korea'));
});

test('pagesForStop: stop tanpa halaman → []', () => {
  assert.deepEqual(pagesForStop('tidak-ada'), []);
});

test('pageById: menemukan halaman, null kalau tak ada', () => {
  assert.equal(pageById('chiso').year, 1873);
  assert.equal(pageById('nope'), null);
});

test('tiap halaman punya headline datar (tanpa emoji/dramatisasi)', () => {
  for (const p of SECOND_PAGE) {
    assert.ok(p.jp && p.headline_jp && p.headline_id);
    assert.equal(/[\u{1F300}-\u{1FAFF}]/u.test(p.headline_jp + p.headline_id), false);
  }
});
