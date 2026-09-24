import test from 'node:test';
import assert from 'node:assert/strict';
import { gojoSoundParams, playGojoSound, gojoTechniqueFile, gojoAnswerFiles } from './sfx.js';
import { VOICES } from '../features/audio/voices.js';

test('gojoSoundParams: tiap teknik punya nada & durasi', () => {
  for (const t of ['ao', 'aka', 'murasaki', 'domain', 'domain_zenith']) {
    const p = gojoSoundParams(t);
    assert.ok(p, `${t} tanpa params`);
    assert.ok(p.type, `${t} tanpa tipe osc`);
    assert.ok(Number.isFinite(p.from) && p.from > 0, `${t} from tak valid`);
    assert.ok(Number.isFinite(p.to) && p.to > 0, `${t} to tak valid`);
    assert.ok(Number.isFinite(p.dur) && p.dur > 0, `${t} dur tak valid`);
    assert.ok(Number.isFinite(p.gain) && p.gain > 0 && p.gain <= 0.6, `${t} gain tak sehat`);
  }
});

test('ao = hisap (nada naik), aka = ledak (nada turun)', () => {
  assert.ok(gojoSoundParams('ao').to > gojoSoundParams('ao').from, 'ao harus naik (hisap)');
  assert.ok(gojoSoundParams('aka').to < gojoSoundParams('aka').from, 'aka harus turun (ledak)');
});

test('murasaki beda dari ao & aka (momen penyatuan)', () => {
  const m = gojoSoundParams('murasaki');
  assert.notDeepEqual(m, gojoSoundParams('ao'));
  assert.notDeepEqual(m, gojoSoundParams('aka'));
});

test('teknik tak dikenal / null → null (fallback thud)', () => {
  assert.equal(gojoSoundParams(null), null);
  assert.equal(gojoSoundParams(undefined), null);
  assert.equal(gojoSoundParams('zzz'), null);
});

test('playGojoSound aman di luar browser (node) → 0, tanpa throw', () => {
  assert.equal(playGojoSound('ao'), 0);
  assert.equal(playGojoSound(null), 0);
});

test('gojoTechniqueFile: mapping teknik → file mp3 asli', () => {
  assert.equal(gojoTechniqueFile('ao'), '/voices/gojo/ao.mp3');
  assert.equal(gojoTechniqueFile('aka'), '/voices/gojo/aka.mp3');
  assert.equal(gojoTechniqueFile('murasaki'), '/voices/gojo/murasaki.mp3');
  assert.equal(gojoTechniqueFile('domain'), '/voices/gojo/ryoiki_tenkai.mp3');
  assert.equal(gojoTechniqueFile('domain_zenith'), '/voices/gojo/hollow_purple.mp3');
  assert.equal(gojoTechniqueFile('zzz'), null);
  assert.equal(gojoTechniqueFile(null), null);
});

test('gojoAnswerFiles: benar = SFX teknik + voice correct (bareng)', () => {
  const v = VOICES.gojo;
  // rng()=0 → klip pertama
  assert.deepEqual(gojoAnswerFiles('correct', 'ao', v, () => 0),
    ['/voices/gojo/ao.mp3', '/voices/gojo/correct_1.mp3']);
  assert.deepEqual(gojoAnswerFiles('correct', 'murasaki', v, () => 0.99),
    ['/voices/gojo/murasaki.mp3', '/voices/gojo/correct_2.mp3']);
  // milestone 50/100 → SFX domain/zenith + voice
  assert.equal(gojoAnswerFiles('correct', 'domain', v, () => 0)[0], '/voices/gojo/ryoiki_tenkai.mp3');
  assert.equal(gojoAnswerFiles('correct', 'domain_zenith', v, () => 0)[0], '/voices/gojo/hollow_purple.mp3');
});

test('gojoAnswerFiles: salah = HANYA voice wrong (teknik null)', () => {
  const v = VOICES.gojo;
  const out = gojoAnswerFiles('wrong', null, v, () => 0);
  assert.deepEqual(out, ['/voices/gojo/wrong_1.mp3']);
  assert.ok(gojoAnswerFiles('wrong', null, v, () => 0.99)[0].startsWith('/voices/gojo/wrong_'));
});
