// voiceKey.test.js — penjaga urutan voice: 推し karakter 多元 menang di era
// 多元, tapi TIDAK bocor ke era lain. Regresi di sini = 45 klip karakter 多元
// kembali tak terpakai (bug "registry ≠ wired").
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveVoiceKey } from './voiceKey.js';

// Karakter 推し dummy: id → key voice.
const voiceOf = (id) => ({ hoshi_hikari: 'hoshi_hikari', kage_kuro: 'kage_kuro' }[id] || null);

test('voiceKey: era 多元 + 推し → voice KARAKTER (bukan pack)', () => {
  assert.equal(
    resolveVoiceKey({ era: 'anime', oshiId: 'hoshi_hikari', packVoice: 'gojo', voiceOfCharacter: voiceOf }),
    'hoshi_hikari',
  );
});

test('voiceKey: era 多元 TANPA 推し → voice pack', () => {
  assert.equal(
    resolveVoiceKey({ era: 'anime', oshiId: null, packVoice: 'gojo', voiceOfCharacter: voiceOf }),
    'gojo',
  );
});

test('voiceKey: era LAIN + 推し → tetap voice pack (karakter tidak bocor)', () => {
  for (const era of ['heian', 'edo', 'meiji', 'showa']) {
    assert.equal(
      resolveVoiceKey({ era, oshiId: 'hoshi_hikari', packVoice: 'gojo', voiceOfCharacter: voiceOf }),
      'gojo',
      `${era}: karakter 多元 tidak boleh bocor`,
    );
  }
});

test('voiceKey: 推し tak dikenal → jatuh ke pack (tidak crash)', () => {
  assert.equal(
    resolveVoiceKey({ era: 'anime', oshiId: 'zzz', packVoice: 'gojo', voiceOfCharacter: voiceOf }),
    'gojo',
  );
});

test('voiceKey: semua kosong → null (sfx.js pakai synth dasar)', () => {
  assert.equal(resolveVoiceKey({ era: 'anime', oshiId: null, packVoice: null, voiceOfCharacter: voiceOf }), null);
  assert.equal(resolveVoiceKey(), null, 'argumen kosong aman');
  assert.equal(resolveVoiceKey({ era: 'anime', oshiId: 'hoshi_hikari' }), null,
    'voiceOfCharacter absen → tidak crash, jatuh ke pack (null)');
});

// ── Gerbang ERA untuk pack anime (JJK): hanya bunyi di era 多元 ──────────────
// Aturan pemilik: "voice pack anime cuma ada & cuma bisa dipakai di tema 多元".
test('voiceKey: pack anime (packEra=anime) BUNYI di era 多元', () => {
  assert.equal(
    resolveVoiceKey({ era: 'anime', packVoice: 'gojo', packEra: 'anime', voiceOfCharacter: voiceOf }),
    'gojo',
  );
});

test('voiceKey: pack anime TIDAK bocor ke era lain → null (synth default)', () => {
  for (const era of ['heian', 'edo', 'meiji', 'showa', 'cyberpunk']) {
    assert.equal(
      resolveVoiceKey({ era, packVoice: 'gojo', packEra: 'anime', voiceOfCharacter: voiceOf }),
      null,
      `${era}: pack anime tidak boleh bunyi`,
    );
  }
});

test('voiceKey: pack TANPA packEra tetap bebas (tidak terpengaruh gerbang)', () => {
  for (const era of ['heian', 'edo', 'meiji', 'showa', 'anime', 'cyberpunk']) {
    assert.equal(
      resolveVoiceKey({ era, packVoice: 'hina', packEra: null, voiceOfCharacter: voiceOf }),
      'hina',
      `${era}: pack tanpa era harus tetap bunyi`,
    );
  }
});

test('voiceKey: 推し menang atas pack anime di 多元 (regresi A4/A16)', () => {
  assert.equal(
    resolveVoiceKey({ era: 'anime', oshiId: 'hoshi_hikari', packVoice: 'gojo', packEra: 'anime', voiceOfCharacter: voiceOf }),
    'hoshi_hikari',
    '推し harus menang walau pack anime aktif di 多元',
  );
});
