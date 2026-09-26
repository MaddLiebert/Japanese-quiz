import test from 'node:test';
import assert from 'node:assert/strict';
import { loadStrokeData, localCharDataLoader } from './strokeLoader.js';

const fakeOk = (data) => () => Promise.resolve({ ok: true, json: () => Promise.resolve(data) });
const fakeFail = (status) => () => Promise.resolve({ ok: false, status });
const fakeThrow = () => () => Promise.reject(new Error('network down'));

test('loadStrokeData: sukses → data JSON dari path yang benar', async () => {
  let seen = null;
  const data = { strokes: ['M0,0'], medians: [[[0, 0]]] };
  const out = await loadStrokeData('あ', (path) => { seen = path; return Promise.resolve({ ok: true, json: () => Promise.resolve(data) }); });
  assert.equal(seen, '/strokes/03042.json');
  assert.deepEqual(out, data);
});

test('loadStrokeData: karakter >1 code point → reject tanpa fetch', async () => {
  let called = false;
  await assert.rejects(
    () => loadStrokeData('きゃ', () => { called = true; return Promise.resolve({ ok: true, json: () => Promise.resolve({}) }); }),
    /no stroke data/,
  );
  assert.equal(called, false, 'fetch tidak boleh dipanggil');
});

test('loadStrokeData: HTTP error → reject dengan status', async () => {
  await assert.rejects(() => loadStrokeData('一', fakeFail(404)), /HTTP 404/);
});

test('loadStrokeData: network error diteruskan', async () => {
  await assert.rejects(() => loadStrokeData('一', fakeThrow()), /network down/);
});

test('localCharDataLoader: onLoad dipanggil saat sukses (kontrak hanzi-writer)', async () => {
  const data = { strokes: ['M0,0'], medians: [[[0, 0]]] };
  await new Promise((resolve, reject) => {
    localCharDataLoader('あ', (d) => { assert.deepEqual(d, data); resolve(); }, reject, fakeOk(data));
  });
});

test('localCharDataLoader: onError dipanggil saat gagal (tidak melempar)', async () => {
  await new Promise((resolve) => {
    localCharDataLoader('きゃ', () => { throw new Error('seharusnya tidak onLoad'); }, (err) => { assert.ok(err); resolve(); });
  });
});
