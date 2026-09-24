import test from 'node:test';
import assert from 'node:assert/strict';
import { gojoSoundParams, playGojoSound } from './sfx.js';

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
