import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeSpeechLog } from './speechDiagnostics.js';

test('log kosong → engine tidak pernah mulai', () => {
  assert.equal(summarizeSpeechLog([]).code, 'never-started');
});

test('start lalu end tanpa suara → mic tidak menangkap', () => {
  const v = summarizeSpeechLog([{ type: 'start' }, { type: 'end' }]);
  assert.equal(v.code, 'no-capture');
});

test('soundstart tapi tak ada speechstart/result → audio sampai engine, tak dikenali', () => {
  const v = summarizeSpeechLog([{ type: 'start' }, { type: 'soundstart' }, { type: 'end' }]);
  assert.equal(v.code, 'not-recognized');
});

test('result ada → terdeteksi (masalah di pencocokan/penilaian)', () => {
  const v = summarizeSpeechLog([{ type: 'start' }, { type: 'result', transcript: 'か' }]);
  assert.equal(v.code, 'recognized');
  assert.equal(v.gotResult, true);
  assert.deepEqual(v.transcripts, ['か']);
});

test('error not-allowed → izin ditolak', () => {
  assert.equal(summarizeSpeechLog([{ type: 'error', error: 'not-allowed' }]).code, 'mic-denied');
});

test('error network → layanan ASR/server', () => {
  assert.equal(summarizeSpeechLog([{ type: 'error', error: 'network' }]).code, 'asr-network');
});

test('error no-speech tanpa suara → tidak ada suara', () => {
  assert.equal(summarizeSpeechLog([{ type: 'error', error: 'no-speech' }]).code, 'no-capture');
});

test('ringkasan menghitung event & error pertama', () => {
  const v = summarizeSpeechLog([
    { type: 'start' }, { type: 'level', value: 0.5 },
    { type: 'error', error: 'network' }, { type: 'end' },
  ]);
  assert.equal(v.counts.start, 1);
  assert.equal(v.counts.level, 1);
  assert.equal(v.firstError, 'network');
});

test('recognized menang atas error (result sudah ada = terdeteksi)', () => {
  const v = summarizeSpeechLog([
    { type: 'start' }, { type: 'result', transcript: 'う' }, { type: 'error', error: 'aborted' },
  ]);
  assert.equal(v.code, 'recognized');
});
