// firstRun.test.js — penjaga alur "pertama kali buka app" (murni, tanpa React).
// Keputusan pemilik: user baru MEMILIH cara masuk DULU (Tamu/Email/Google),
// nama panggilan ditanya BELAKANGAN. Google ada di daftar tapi belum aktif
// (butuh setup Google Cloud) → tetap harus jujur terlihat, bukan disembunyikan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AUTH_METHODS, availableMethods, firstRunMethod,
  advanceAfterMethod, firstRunStep, methodCopy,
} from './firstRun.js';

test('katalog metode: Tamu & Email aktif, Google belum', () => {
  assert.deepEqual(AUTH_METHODS.map((m) => m.id), ['guest', 'email', 'google']);
  assert.deepEqual(availableMethods().map((m) => m.id), ['guest', 'email']);
  assert.equal(firstRunMethod('google').enabled, false);
  assert.equal(firstRunMethod('tidak-ada'), null);
});

test('tiap metode punya kanji + glyph (ikon = kanji glyph, bukan emoji)', () => {
  for (const m of AUTH_METHODS) {
    assert.ok(m.kanji && m.kanji.length >= 1, `${m.id} punya kanji`);
    assert.ok(m.glyph, `${m.id} punya glyph`);
  }
});

test('advanceAfterMethod: email → form email, selain itu → nama', () => {
  assert.equal(advanceAfterMethod('email'), 'email');
  assert.equal(advanceAfterMethod('guest'), 'name');
  assert.equal(advanceAfterMethod('google'), 'name');
});

test('firstRunStep: pilih metode → nama → selesai', () => {
  assert.equal(firstRunStep({ username: '', isSignedIn: false }), 'method');
  assert.equal(firstRunStep({ username: '', isSignedIn: true }), 'name');
  assert.equal(firstRunStep({ username: 'Madd', isSignedIn: true }), null);
  assert.equal(firstRunStep({ username: 'Madd', isSignedIn: false }), null);
  assert.equal(firstRunStep(), 'method');
});

test('methodCopy: ID & EN lengkap, tanpa field kosong', () => {
  for (const m of AUTH_METHODS) {
    for (const lang of ['id', 'en']) {
      const c = methodCopy(m.id, lang);
      assert.ok(c.title && c.desc && c.cta, `${m.id}/${lang} harus lengkap`);
    }
  }
  assert.equal(methodCopy('guest', 'id').title, 'Tanpa Akun');
  assert.equal(methodCopy('guest', 'en').title, 'No Account');
  assert.equal(methodCopy('email', 'id').title, 'Masuk / Daftar');
  assert.equal(methodCopy('tidak-ada', 'id'), null);
});
