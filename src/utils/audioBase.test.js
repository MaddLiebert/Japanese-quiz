// Tes modul audioBase (murni) — `node --test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveAudioUrl, normalizeBase } from './audioBase.js';

const BASE = 'https://abc.supabase.co/storage/v1/object/public/audio';

test('base kosong → path apa adanya (mode lokal/dev)', () => {
  assert.equal(resolveAudioUrl('/audio/01.mp3', ''), '/audio/01.mp3');
  assert.equal(resolveAudioUrl('/audio/01.mp3'), '/audio/01.mp3');
});

test('base diisi → gabung tanpa dobel /audio/', () => {
  assert.equal(resolveAudioUrl('/audio/01.mp3', BASE), `${BASE}/01.mp3`);
  assert.equal(resolveAudioUrl('/audio/01 Dai 1 Ka - Kaiwa.mp3', BASE), `${BASE}/01%20Dai%201%20Ka%20-%20Kaiwa.mp3`);
});

test('nama file dengan spasi → di-encode (%20)', () => {
  assert.equal(resolveAudioUrl('/audio/a b.mp3', BASE), `${BASE}/a%20b.mp3`);
  // segmen yang sudah ter-encode tidak dobel-encode
  assert.equal(resolveAudioUrl('/audio/a%20b.mp3', BASE), `${BASE}/a%20b.mp3`);
});

test('base dengan garis miring akhir → tetap rapi', () => {
  assert.equal(resolveAudioUrl('/audio/x.mp3', `${BASE}/`), `${BASE}/x.mp3`);
});

test('path tanpa prefix /audio/ → tetap digabung', () => {
  assert.equal(resolveAudioUrl('x.mp3', BASE), `${BASE}/x.mp3`);
  assert.equal(resolveAudioUrl('/x.mp3', BASE), `${BASE}/x.mp3`);
});

test('URL absolut tidak diubah (mis. sudah CDN penuh)', () => {
  const abs = 'https://cdn.example.com/audio/x.mp3';
  assert.equal(resolveAudioUrl(abs, BASE), abs);
  assert.equal(resolveAudioUrl('//cdn.example.com/x.mp3', BASE), '//cdn.example.com/x.mp3');
  assert.equal(resolveAudioUrl('data:audio/mp3;base64,AAA', BASE), 'data:audio/mp3;base64,AAA');
  assert.equal(resolveAudioUrl('blob:http://x/y', BASE), 'blob:http://x/y');
});

test('path kosong → dikembalikan apa adanya', () => {
  assert.equal(resolveAudioUrl('', BASE), '');
  assert.equal(resolveAudioUrl(null, BASE), null);
});

test('normalizeBase buang garis miring di akhir', () => {
  assert.equal(normalizeBase('https://x/y///'), 'https://x/y');
  assert.equal(normalizeBase(''), '');
  assert.equal(normalizeBase(null), '');
});
