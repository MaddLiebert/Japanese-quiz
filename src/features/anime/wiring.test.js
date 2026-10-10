// wiring.test.js — penjaga E15: karakter 多元 (A16) benar-benar TERHUBUNG ke
// registry voice & visual yang dipakai app. Kalau key di characters.js berubah
// tanpa menambah entri registry, test ini gagal (bukan sekadar lulus di unit
// test terisolasi). Lihat SPEC: docs/tema/anime-mekanik.md §A16.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { CHARACTERS, validateCharacters, validateCharacterData } from './characters.js';
import { FRANCHISES, franchiseById } from './franchises.js';
import { VOICES } from '../audio/voices.js';
import { VISUALS } from '../effects/visuals.js';

const here = dirname(fileURLToPath(import.meta.url));

test('tiap karakter 多元 punya voice & effect TERDAFTAR di registry app', () => {
  assert.deepEqual(validateCharacters(VOICES, VISUALS), []);
});

test('data karakter konsisten dengan franchise (fr → franchise ada)', () => {
  assert.deepEqual(validateCharacterData(CHARACTERS, FRANCHISES), []);
});

// Dua jenis karakter 多元:
//   • ORISINAL → suara SENDIRI (9 klip TTS) + synth fallback.
//   • LISENSI (JJK) → memakai voice JALUR TEKNIK (correct/streak kosong,
//     deterministik lewat playXxxTechnique; pola pack_07..pack_14).
test('voice karakter ORISINAL = PUNYA KLIP SENDIRI (9 TTS) + synth fallback', () => {
  const orisinal = CHARACTERS.filter((c) => !franchiseById(c.fr)?.licensed);
  assert.ok(orisinal.length > 0);
  for (const c of orisinal) {
    const v = VOICES[c.voice];
    assert.ok(v, `VOICES.${c.voice} hilang`);
    assert.equal(v.files.correct.length, 3, `${c.voice}: 3 klip correct`);
    assert.equal(v.files.wrong.length, 3, `${c.voice}: 3 klip wrong`);
    assert.equal(v.files.streak.length, 3, `${c.voice}: 3 klip streak`);
    assert.ok(v.synth?.correct, `${c.voice}: synth tetap jadi fallback`);
  }
});

test('voice karakter LISENSI (JJK) = punya jalur klip/teknik + synth fallback', () => {
  const lisensi = CHARACTERS.filter((c) => franchiseById(c.fr)?.licensed);
  assert.ok(lisensi.length > 0);
  for (const c of lisensi) {
    const v = VOICES[c.voice];
    assert.ok(v, `VOICES.${c.voice} hilang`);
    // Sekurangnya punya KLIP (jalur jurus) ATAU klip wrong — bukan entri kosong.
    const klip = (v.clips || []).length + (v.files?.wrong || []).length;
    assert.ok(klip > 0, `${c.voice}: tanpa klip jurus/wrong`);
    assert.ok(v.synth?.correct, `${c.voice}: synth tetap jadi fallback`);
  }
});

test('visual 多元 terdaftar (siluet generik / efek karakter)', () => {
  for (const c of CHARACTERS) {
    assert.ok(VISUALS[c.effect], `VISUALS.${c.effect} hilang`);
  }
});

// ── Jawaban kuis 多元 memicu EFEK JJK (bukan sekadar teks hijau/merah) ───────
// Halaman latihan (/anime-practice) WAJIB memanggil triggerEffect saat menjawab,
// sama seperti Quiz/MondaiQuiz/N5Exam. Tanpa ini, tema 多元 cuma "kulit" — tidak
// ada efek karakter (Gojo/Sukuna/…) di jawaban. Guard: baca sumber sebagai teks.
test('AnimePractice memanggil triggerEffect saat menjawab (efek JJK hidup)', () => {
  const src = readFileSync(join(here, '..', '..', 'pages', 'AnimePractice.jsx'), 'utf8');
  assert.ok(/useEffectLayer\(\)/.test(src), 'AnimePractice pakai useEffectLayer');
  assert.ok(/triggerEffect\(\s*r\.ok\s*\?\s*'correct'\s*:\s*'wrong'\s*\)/.test(src),
    'jawaban memicu triggerEffect(correct/wrong)');
  assert.ok(/resetEffectStreak\(\)/.test(src), 'sesi baru reset streak efek');
  assert.ok(/endQuizSession\(\)/.test(src), 'keluar halaman memadamkan efek');
});
