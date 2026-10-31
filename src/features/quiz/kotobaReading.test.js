import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { KOTOBA_READING_MODE, toReadingItem, readingPool, buildKotobaReadingQuiz, decorateKotobaItems } from './kotobaReading.js';
import { buildKotobaReadingOptions } from './questionBuilder.js';

// Aturan repo: modul murni tidak import JSON — data dibaca manual di test.
const read = (name) =>
  JSON.parse(readFileSync(new URL(`../../data/${name}.json`, import.meta.url), 'utf8'));

const kotoba = read('kotoba');
const kanjiMap = read('kotobaKanji');

const lcg = (seed) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

const KANJI = /[\u4e00-\u9faf\u3400-\u4dbf]/;
const KANA_ONLY = /^[\u3041-\u309f\u30a1-\u30f6\u309d\u309e\u30fd\u30feー]+$/;

test('peta kanji: tiap entri punya bentuk kanji + bacaan hiragana', () => {
  const ids = Object.keys(kanjiMap);
  assert.ok(ids.length > 500, `peta terlalu kecil: ${ids.length}`);
  for (const id of ids) {
    const e = kanjiMap[id];
    assert.ok(KANJI.test(e.k), `${id}: bentuk kanji wajib: ${e.k}`);
    assert.ok(KANA_ONLY.test(e.r), `${id}: bacaan wajib hiragana: ${e.r}`);
  }
});

test('peta kanji: hanya berisi id yang benar-benar ada di kotoba.json', () => {
  const known = new Set(kotoba.map((x) => x.id));
  for (const id of Object.keys(kanjiMap)) assert.ok(known.has(id), `id asing: ${id}`);
});

test('peta kanji: bacaan cocok dengan kana asli kotoba', () => {
  const byId = new Map(kotoba.map((x) => [x.id, x]));
  for (const [id, e] of Object.entries(kanjiMap)) {
    const item = byId.get(id);
    const kana = item.char.replace(/[ァ-ヶ]/g, (ch) => String.fromCodePoint(ch.codePointAt(0) - 0x60));
    assert.equal(e.r, kana, `${id} (${item.char}) bacaan harus sama dengan kana aslinya`);
  }
});

test('peta kanji: homofon dipisah benar lewat arti', () => {
  assert.equal(kanjiMap.v_hashi.k, '箸');        // sumpit
  assert.equal(kanjiMap.v_hashi_bridge.k, '橋'); // jembatan
  assert.equal(kanjiMap.v_kami.k, '髪');         // rambut
  assert.equal(kanjiMap.v_kami_paper.k, '紙');   // kertas
  assert.equal(kanjiMap.v_toru.k, '取る');       // mengambil
  assert.equal(kanjiMap.v_toru_photo.k, '撮る'); // memotret
});

test('toReadingItem: char jadi kanji, reading jadi hiragana, kana asli disimpan', () => {
  const item = kotoba.find((x) => x.id === 'v_taberu');
  const out = toReadingItem(item, kanjiMap);
  assert.equal(out.char, '食べる');
  assert.equal(out.reading, 'たべる');
  assert.equal(out.kana, 'たべる');
  assert.equal(out.quizMode, KOTOBA_READING_MODE);
  assert.equal(out.id, 'v_taberu');
});

test('toReadingItem: kata tanpa bentuk kanji → null (tidak dipaksa)', () => {
  const kopi = kotoba.find((x) => x.char === 'コーヒー');
  assert.equal(toReadingItem(kopi, kanjiMap), null);
  assert.equal(toReadingItem(null, kanjiMap), null);
  assert.equal(toReadingItem(kotoba[0], {}), null);
});

test('readingPool: menyaring kata tanpa kanji, tidak mengubah input', () => {
  const before = kotoba.length;
  const pool = readingPool(kotoba, kanjiMap);
  assert.equal(kotoba.length, before, 'input tidak boleh berubah');
  assert.ok(pool.length > 500 && pool.length < kotoba.length);
  for (const x of pool) {
    assert.ok(KANJI.test(x.char), `${x.id} harus ber-kanji`);
    assert.ok(KANA_ONLY.test(x.reading), `${x.id} bacaan harus hiragana`);
  }
});

test('buildKotobaReadingOptions: 6 opsi, unik, jawaban benar ikut', () => {
  const pool = readingPool(kotoba, kanjiMap);
  const item = pool[0];
  const options = buildKotobaReadingOptions(item, pool, 6, lcg(7));
  assert.equal(options.length, 6);
  assert.equal(new Set(options.map((o) => o.id)).size, 6);
  assert.equal(options.filter((o) => o.id === item.id).length, 1);
  assert.ok(options.every((o) => typeof o.reading === 'string' && o.reading.length > 0));
});

test('buildKotobaReadingOptions: TIDAK ada dua opsi dengan bacaan sama', () => {
  // 箸 dan 橋 sama-sama はし → kalau lolos, layar menampilkan dua opsi kembar.
  const pool = readingPool(kotoba, kanjiMap);
  for (const item of pool.slice(0, 120)) {
    const options = buildKotobaReadingOptions(item, pool, 6, lcg(item.id.length * 31));
    const readings = options.map((o) => o.reading);
    assert.equal(new Set(readings).size, readings.length, `${item.id}: opsi bacaan kembar → ${readings.join('、')}`);
  }
});

test('buildKotobaReadingOptions: deterministik dengan rng sama', () => {
  const pool = readingPool(kotoba, kanjiMap);
  const item = pool[3];
  const a = buildKotobaReadingOptions(item, pool, 6, lcg(99));
  const b = buildKotobaReadingOptions(item, pool, 6, lcg(99));
  assert.deepEqual(a.map((o) => o.id), b.map((o) => o.id));
});

test('buildKotobaReadingOptions: pool kecil tetap menghasilkan opsi cukup', () => {
  const pool = readingPool(kotoba, kanjiMap).slice(0, 3);
  const options = buildKotobaReadingOptions(pool[0], pool, 6, lcg(3));
  assert.ok(options.length >= 1 && options.length <= 3);
  assert.ok(options.some((o) => o.id === pool[0].id));
});

test('buildKotobaReadingQuiz: kategori kecil dilengkapi distraktor global', () => {
  // Angka hanya punya 2 kata (いち, に) → tanpa cadangan, opsi cuma 2.
  const angka = kotoba.filter((x) => x.category === 'Numbers');
  const questions = buildKotobaReadingQuiz({
    items: angka, kanjiMap, optionCount: 6, fallbackItems: kotoba, rng: lcg(13),
  });
  assert.ok(questions.length >= 1);
  for (const q of questions) {
    assert.equal(q.options.length, 6, `opsi kurang: ${q.options.length}`);
    const readings = q.options.map((o) => o.reading);
    assert.equal(new Set(readings).size, readings.length);
    assert.ok(q.options.some((o) => o.id === q.target.id));
  }
});

test('decorateKotobaItems: menambah kanji + furigana TANPA mengubah char', () => {
  const out = decorateKotobaItems(kotoba, kanjiMap);
  assert.equal(out.length, kotoba.length, 'jumlah item tidak boleh berubah');

  const taberu = out.find((x) => x.id === 'v_taberu');
  assert.equal(taberu.char, 'たべる', 'char harus tetap kana (dipakai opsi & penilaian)');
  assert.equal(taberu.kanji, '食べる');
  assert.equal(taberu.furigana, '食[た]べる');
  assert.equal(taberu.reading, 'たべる');
  assert.ok(taberu.meaning, 'arti tetap ada');
});

test('decorateKotobaItems: kata tanpa kanji umum dibiarkan apa adanya', () => {
  const kopi = kotoba.find((x) => x.char === 'コーヒー');
  const out = decorateKotobaItems([kopi], kanjiMap)[0];
  assert.equal(out, kopi, 'objek harus dikembalikan tanpa diubah');
  assert.equal(out.furigana, undefined);
});

test('decorateKotobaItems: item non-kotoba tidak disentuh', () => {
  const kana = { id: 'hira_a', char: 'あ', romaji: 'a', type: 'seion' };
  assert.equal(decorateKotobaItems([kana], kanjiMap)[0], kana);
  assert.deepEqual(decorateKotobaItems(null, kanjiMap), []);
});

test('buildKotobaReadingQuiz: tiap soal punya target kanji + opsi bacaan', () => {
  const pool = readingPool(kotoba, kanjiMap).slice(0, 40);
  const questions = buildKotobaReadingQuiz({ items: pool, kanjiMap, optionCount: 4, rng: lcg(11) });
  assert.ok(questions.length > 0);
  for (const q of questions) {
    assert.ok(KANJI.test(q.target.char));
    assert.equal(q.target.quizMode, KOTOBA_READING_MODE);
    assert.equal(q.options.length, 4);
    assert.ok(q.options.some((o) => o.id === q.target.id));
  }
  const ids = questions.map((q) => q.target.id);
  assert.equal(new Set(ids).size, ids.length, 'tidak boleh ada soal dobel');
});

test('buildKotobaReadingQuiz: bentuk kanji kembar (道 ×2) hanya jadi satu soal', () => {
  const pool = readingPool(kotoba, kanjiMap);
  const questions = buildKotobaReadingQuiz({ items: pool, kanjiMap, optionCount: 4, rng: lcg(5) });
  const forms = questions.map((q) => q.target.char);
  assert.equal(new Set(forms).size, forms.length, `bentuk kanji dobel: ${forms.filter((f, i) => forms.indexOf(f) !== i)}`);
});
