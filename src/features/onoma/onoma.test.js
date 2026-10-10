// onoma.test.js — penjaga modul murni A1 オノマトペ (features/onoma/onoma.js).
// Lihat SPEC: docs/tema/anime-mekanik.md §A1. Modul ini TANPA React/DOM →
// dites `node --test` langsung.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OTO, OTO_CATEGORIES, OTOMA_CATEGORIES,
  onomaById, onomaPool, isOnomaCategory, onomaQuestions, onomaChoices,
  checkOnoma, validateOnoma, validateOnomaBank,
} from './onoma.js';

test('kategori: 3 kategori (gion/gita/gijō); alias OTOMA_CATEGORIES sama', () => {
  assert.deepEqual(OTO_CATEGORIES, ['gion', 'gita', 'gijō']);
  assert.deepEqual(OTOMA_CATEGORIES, OTO_CATEGORIES);
  assert.equal(isOnomaCategory('gion'), true);
  assert.equal(isOnomaCategory('nope'), false);
});

test('onomaById: entri dikenal → objek; tak dikenal → null', () => {
  assert.equal(onomaById('dokidoki').jp, 'ドキドキ');
  assert.equal(onomaById('nope'), null);
});

test('onomaPool: hanya kategori yang diminta', () => {
  const gion = onomaPool('gion');
  assert.ok(gion.length > 0);
  assert.ok(gion.every((o) => o.category === 'gion'));
  assert.equal(onomaPool('nope').length, 0);
});

test('onomaQuestions: hanya entri ber-adegan + choices', () => {
  const qs = onomaQuestions();
  assert.ok(qs.length >= 4);
  assert.ok(qs.every((o) => o.scene_jp && o.choices?.length));
  // Distraktor (tanpa scene) tidak ikut jadi soal.
  assert.ok(!qs.some((o) => o.id === 'wakuwaku'));
});

test('onomaChoices: resolusi id → entri (buang id tak dikenal)', () => {
  const item = onomaById('ban');
  const choices = onomaChoices(item);
  assert.equal(choices.length, item.choices.length);
  assert.ok(choices.every((c) => c && c.jp));
  // id ngawur dibuang, bukan crash.
  assert.deepEqual(onomaChoices({ choices: ['ban', 'nope'] }).map((c) => c.id), ['ban']);
  assert.deepEqual(onomaChoices(null), []);
});

test('checkOnoma: terima id ATAU teks jp; reveal benar', () => {
  const item = onomaById('dokidoki');
  assert.equal(checkOnoma(item, 'dokidoki').ok, true);
  assert.equal(checkOnoma(item, 'ドキドキ').ok, true);
  const wrong = checkOnoma(item, 'wakuwaku');
  assert.equal(wrong.ok, false);
  assert.equal(wrong.correct, 'ドキドキ');
  assert.equal(wrong.correctId, 'dokidoki');
});

test('checkOnoma: item null → ok false, tidak crash', () => {
  const res = checkOnoma(null, 'ban');
  assert.equal(res.ok, false);
  assert.equal(res.correct, null);
});

test('bank: setiap id di `choices` terdaftar di OTO (pilihan tidak hilang)', () => {
  for (const item of OTO) {
    for (const cid of item.choices || []) {
      assert.ok(onomaById(cid), `${item.id}: choices '${cid}' tak terdaftar di OTO`);
    }
  }
});

test('validateOnoma: entri bank valid semua', () => {
  assert.deepEqual(validateOnomaBank(OTO), []);
});

test('validateOnoma: menolak entri rusak', () => {
  assert.equal(validateOnoma(null).ok, false);
  assert.equal(validateOnoma({ id: 'x', jp: 'あ', reading: 'あ', category: 'nope' }).ok, false);
  // choices < 2
  assert.equal(validateOnoma({ id: 'y', jp: 'あ', reading: 'あ', category: 'gion', choices: ['y'] }).ok, false);
  // choices tidak memuat id jawaban
  assert.equal(
    validateOnoma({ id: 'z', jp: 'あ', reading: 'あ', category: 'gion', choices: ['ban', 'gogogo'] }).ok,
    false,
  );
  // choices merujuk id tak terdaftar
  assert.equal(
    validateOnoma({ id: 'ban', jp: 'バン！', reading: 'ばん', category: 'gion', choices: ['ban', 'nope'] }).ok,
    false,
  );
});

test('bank: id entri unik & tiap kategori terwakili', () => {
  const ids = OTO.map((o) => o.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const cat of OTO_CATEGORIES) {
    assert.ok(onomaPool(cat).length > 0, `kategori ${cat} kosong`);
  }
});
