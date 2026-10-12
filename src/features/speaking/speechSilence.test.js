import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SILENCE_STOP_MS, SILENCE_TICK_MS,
  silenceElapsed, shouldStopOnSilence, collectResults, buildUtterances, appendFinals,
} from './speechSilence.js';

test('konstanta hening wajar (jeda napas, bukan menggantung)', () => {
  assert.ok(SILENCE_STOP_MS >= 1200 && SILENCE_STOP_MS <= 5000, `nilai ${SILENCE_STOP_MS} di luar rentang`);
  assert.ok(SILENCE_TICK_MS > 0 && SILENCE_TICK_MS <= SILENCE_STOP_MS);
});

test('silenceElapsed: tak pernah negatif', () => {
  assert.equal(silenceElapsed(1000, 400), 600);
  assert.equal(silenceElapsed(500, 900), 0);
  assert.equal(silenceElapsed(undefined, undefined), 0);
});

test('shouldStopOnSilence: berhenti hanya setelah hening cukup lama', () => {
  const t0 = 10_000;
  assert.equal(shouldStopOnSilence(t0, t0), false);                     // baru bicara
  assert.equal(shouldStopOnSilence(t0 + SILENCE_STOP_MS - 1, t0), false); // belum cukup
  assert.equal(shouldStopOnSilence(t0 + SILENCE_STOP_MS, t0), true);      // tepat cukup
  assert.equal(shouldStopOnSilence(t0 + 9999, t0), true);
});

// SpeechRecognitionResult tiruan: [transcript utama, alternatif...] + isFinal.
const mkResult = (texts, isFinal) => {
  const r = texts.map((t) => ({ transcript: t }));
  r.isFinal = isFinal;
  r.length = texts.length;
  return r;
};

test('collectResults: hanya proses hasil BARU; segmen vs alternatif dipisah', () => {
  const all = [mkResult(['ふるいけ', 'ふる池'], true), mkResult(['や'], false)];

  const first = collectResults(all, 0);
  assert.deepEqual(first.segments, ['ふるいけ']);   // segmen final
  assert.deepEqual(first.extras, ['ふる池']);        // hipotesis lain segmen sama
  assert.equal(first.interim, 'や');
  assert.equal(first.nextIndex, 2);

  // Panggilan berikutnya: hasil lama tak dihitung ulang.
  const grown = [...all, mkResult(['かわず'], true)];
  const second = collectResults(grown, first.nextIndex);
  assert.deepEqual(second.segments, ['かわず']);
  assert.deepEqual(second.extras, []);
  assert.equal(second.interim, '');
  assert.equal(second.nextIndex, 3);

  const none = collectResults(grown, 3);
  assert.deepEqual(none.segments, []);
  assert.equal(none.interim, '');
});

test('collectResults: aman untuk input aneh', () => {
  assert.deepEqual(collectResults(null, 0).segments, []);
  assert.deepEqual(collectResults(undefined, 5).segments, []);
});

// ── INTI BUG PUISI: ucapan panjang dengan jeda → segmen harus DISAMBUNG ───────
test('buildUtterances: satu segmen → teks + alternatif (perilaku lama)', () => {
  assert.deepEqual(buildUtterances(['本'], ['ほん']), ['本', 'ほん']);
  assert.deepEqual(buildUtterances(['あ'], []), ['あ']);
});

test('buildUtterances: banyak segmen (user jeda) → DISAMBUNG jadi satu ucapan', () => {
  // Baris puisi diucapkan dengan 3 jeda: 古池 / や / 蛙飛びこむ
  const segs = ['古池', 'や', '蛙飛びこむ'];
  assert.deepEqual(buildUtterances(segs, []), ['古池や蛙飛びこむ']);
  // Alternatif tidak dipakai saat ada >1 segmen (teks utuh lebih penting).
  assert.deepEqual(buildUtterances(segs, ['x']), ['古池や蛙飛びこむ']);
});

test('buildUtterances: tanpa segmen final → pakai interim terakhir', () => {
  assert.deepEqual(buildUtterances([], [], 'ふるいけ'), ['ふるいけ']);
  assert.deepEqual(buildUtterances([], [], ''), []);
  assert.deepEqual(buildUtterances(null, null, null), []);
});

test('appendFinals: gabung tanpa duplikat berurutan', () => {
  assert.deepEqual(appendFinals(['あ'], ['い', 'う']), ['あ', 'い', 'う']);
  assert.deepEqual(appendFinals(['あ'], ['あ']), ['あ']);        // dobel → dibuang
  assert.deepEqual(appendFinals(null, ['あ']), ['あ']);
  assert.deepEqual(appendFinals(['あ'], []), ['あ']);
  assert.deepEqual(appendFinals(['あ'], ['あ', 'い']), ['あ', 'い']); // 'あ' duplikat, 'い' masuk
});
