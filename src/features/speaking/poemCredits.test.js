import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { POET_META, poetCredit, poemCredit, creditLine } from './poemCredits.js';

// Modul murni tidak meng-import JSON; test memuat sendiri (pola fitur speaking).
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const POEMS = JSON.parse(readFileSync(join(ROOT, 'src/data/poems.json'), 'utf8'));

test('poetCredit: 9 penyair dikenal, null untuk tak dikenal', () => {
  assert.equal(Object.keys(POET_META).length, 9);
  assert.equal(poetCredit('松尾芭蕉').romaji, 'Matsuo Bashō');
  assert.equal(poetCredit('松尾芭蕉').dates, '1644–1694');
  assert.equal(poetCredit('誰か'), null);
  assert.equal(poetCredit(undefined), null);
});

test('poemCredit: field lengkap + fallback string kosong (aman dirender)', () => {
  const c = poemCredit({ author: '松尾芭蕉', authorReading: 'まつおばしょう', source: 'https://x' });
  assert.deepEqual(c, {
    author: '松尾芭蕉',
    authorReading: 'まつおばしょう',
    romaji: 'Matsuo Bashō',
    dates: '1644–1694',
    source: 'https://x',
  });
  assert.deepEqual(poemCredit(null), { author: '', authorReading: '', romaji: '', dates: '', source: '' });
});

test('creditLine: gabungan nama + bacaan + romaji + tahun', () => {
  assert.equal(
    creditLine({ author: '松尾芭蕉', authorReading: 'まつおばしょう' }),
    '松尾芭蕉（まつおばしょう） · Matsuo Bashō · 1644–1694',
  );
  assert.equal(creditLine(null), '');
});

test('data guard: tiap puisi punya kredit penyair + 12 puisi bertema punya sumber Aozora', () => {
  for (const p of POEMS) {
    const c = poemCredit(p);
    assert.ok(c.romaji, `${p.id}: penyair ${c.author} belum ada di POET_META`);
    assert.ok(c.dates, `${p.id}: tahun hidup penyair kosong`);
  }
  assert.equal(POEMS.filter((p) => p.source).length, 12);
  for (const p of POEMS.filter((p) => p.theme)) {
    assert.match(p.source, /^https:\/\/www\.aozora\.gr\.jp\//, `${p.id} kurang sumber Aozora`);
  }
});
