// darkPages.test.js — penjaga modul murni A14 打ち切り (features/news/darkPages.js).
// Lihat SPEC: docs/tema/anime-mekanik.md §A14. Modul TANPA React/DOM → `node --test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { DARK_PAGES, darkPagesForStop, darkPageById, validateDarkPages } from './darkPages.js';

test('darkPagesForStop: memuat halaman sesuai perhentian', () => {
  const s = darkPagesForStop('saishukai');
  assert.ok(s.some((p) => p.id === 'uchikiri'));
  assert.ok(s.every((p) => p.stop === 'saishukai'));
});

test('darkPagesForStop: perhentian tanpa halaman → []', () => {
  assert.deepEqual(darkPagesForStop('nope'), []);
});

test('darkPageById: dikenal → objek; tak dikenal → null', () => {
  assert.equal(darkPageById('enjo').jp, '炎上');
  assert.equal(darkPageById('nope'), null);
});

test('tiap halaman punya headline JP + ID (datar, tanpa emoji)', () => {
  for (const p of DARK_PAGES) {
    assert.ok(p.headline_jp && p.headline_id, `${p.id} headline kosong`);
    assert.ok(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u.test(`${p.headline_jp}${p.headline_id}`), `${p.id} ada emoji`);
  }
});

test('bank: valid semua', () => {
  assert.deepEqual(validateDarkPages(DARK_PAGES), []);
});

test('validateDarkPages: menangkap halaman rusak', () => {
  assert.ok(validateDarkPages([{ id: 'x', jp: 'X' }]).length > 0); // field kurang
  assert.ok(validateDarkPages([
    { id: 'a', jp: 'あ', headline_jp: 'h', headline_id: 'h', stop: 's' },
    { id: 'a', jp: 'い', headline_jp: 'h', headline_id: 'h', stop: 's' },
  ]).some((e) => e.includes('duplikat')));
});

test('bank: id unik', () => {
  const ids = DARK_PAGES.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
});
