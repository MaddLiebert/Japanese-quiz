import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import {
  YUTA_TECHNIQUE_FILES, YUTA_COPY_FILES, YUTA_LEAD_S,
  playYutaTechnique, playYutaCast, playYutaCopy,
  YUTA_TECHNIQUE_SFX_LAYERS, playYutaTechniqueLayers,
} from './sfx.js';
import { VOICES } from '../features/audio/voices.js';

// ── T5: klip voice Yuta = ASET USER (bukan TTS) + callout reuse pack sumber ──

test('YUTA_TECHNIQUE_FILES: 4 jurus (太刀/呪力/反転術式/模倣), path valid, file ada', () => {
  const keys = ['katana', 'ripples', 'reversal', 'mimic'];
  assert.deepEqual(Object.keys(YUTA_TECHNIQUE_FILES).sort(), keys.slice().sort());
  for (const [k, p] of Object.entries(YUTA_TECHNIQUE_FILES)) {
    assert.equal(p, `/voices/yuta/${k}.mp3`);
    assert.ok(existsSync('public' + p), `klip jurus hilang: ${p}`);
  }
});

test('YUTA_COPY_FILES: 7 callout = KLIP ASLI pack sumber (0 TTS baru), file ada', () => {
  const keys = ['gojo', 'sukuna', 'nobara', 'yuji', 'megumi', 'nanami', 'toji'];
  assert.deepEqual(Object.keys(YUTA_COPY_FILES).sort(), keys.slice().sort());
  for (const [k, p] of Object.entries(YUTA_COPY_FILES)) {
    assert.ok(existsSync('public' + p), `klip callout ${k} hilang: ${p}`);
  }
});

test('cast.mp3 = aset user (真贋相愛, 4.86s) ada di disk', () => {
  assert.ok(existsSync('public/voices/yuta/cast.mp3'), 'cast.mp3 hilang');
  assert.ok(existsSync('public/effects/yuta_domain.gif'), 'yuta_domain.gif hilang');
  assert.ok(existsSync('public/effects/yuta_wrong.gif'), 'yuta_wrong.gif hilang');
});

test('playYutaTechnique/playYutaCast/playYutaCopy: node (tanpa window) -> no-op 0', () => {
  for (const k of Object.keys(YUTA_TECHNIQUE_FILES)) assert.equal(playYutaTechnique(k), 0);
  assert.equal(playYutaTechnique('zzz'), 0);
  assert.equal(playYutaTechnique(null), 0);
  assert.equal(playYutaCast(), 0);
  for (const k of Object.keys(YUTA_COPY_FILES)) assert.equal(playYutaCopy(k), 0);
  assert.equal(playYutaCopy('zzz'), 0);
});

test('YUTA_LEAD_S: lead-silence TERUKUR (PyAV RMS onset) — semua <= 0.6s', () => {
  // Hasil ukur aset user: katana .366 · ripples .392 · reversal .392 · mimic .183 ·
  // cast .496 · wrong_1 .183.
  assert.equal(YUTA_LEAD_S.katana, 0.37);
  assert.equal(YUTA_LEAD_S.ripples, 0.39);
  assert.equal(YUTA_LEAD_S.reversal, 0.39);
  assert.equal(YUTA_LEAD_S.mimic, 0.18);
  assert.equal(YUTA_LEAD_S.cast, 0.5);
  for (const [k, v] of Object.entries(YUTA_LEAD_S)) {
    assert.ok(v >= 0 && v <= 0.6, `${k}: lead ${v} di luar rentang wajar`);
  }
});

test('YUTA_TECHNIQUE_SFX_LAYERS: tiap jurus >= 1 lapis play* (identitas, DRY)', () => {
  for (const k of ['katana', 'ripples', 'reversal', 'mimic', 'ult']) {
    const layers = YUTA_TECHNIQUE_SFX_LAYERS[k];
    assert.ok(Array.isArray(layers) && layers.length >= 1, `${k} harus punya lapis`);
    for (const fn of layers) assert.match(fn, /^play[A-Z]/, `${k}: ${fn} harus play*`);
  }
});

test('playYutaTechniqueLayers: node no-op tapi hitung lapis valid', () => {
  assert.equal(playYutaTechniqueLayers('katana'), 1);
  assert.equal(playYutaTechniqueLayers('ult'), 1);
  assert.equal(playYutaTechniqueLayers('zzz'), 0);
});

test('VOICES.yuta: 5 clips + 1 kalah (aset user, pola Toji)', () => {
  assert.equal(VOICES.yuta.clips.length, 5);
  assert.deepEqual(VOICES.yuta.clips, [
    '/voices/yuta/katana.mp3', '/voices/yuta/ripples.mp3',
    '/voices/yuta/reversal.mp3', '/voices/yuta/mimic.mp3',
    '/voices/yuta/cast.mp3',
  ]);
  assert.deepEqual(VOICES.yuta.files.wrong, ['/voices/yuta/wrong_1.mp3']);
  for (const p of [...VOICES.yuta.clips, ...VOICES.yuta.files.wrong]) {
    assert.ok(existsSync('public' + p), `klip hilang: ${p}`);
  }
});
