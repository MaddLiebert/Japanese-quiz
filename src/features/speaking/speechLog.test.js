import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appendSpeechEvent, readSpeechEvents, clearSpeechEvents,
  subscribeSpeechLog, __resetSpeechLog,
} from './speechLog.js';

test('appendSpeechEvent: menambah event + timestamp otomatis', () => {
  __resetSpeechLog();
  appendSpeechEvent({ type: 'start' });
  const evs = readSpeechEvents();
  assert.equal(evs.length, 1);
  assert.equal(evs[0].type, 'start');
  assert.equal(typeof evs[0].t, 'number');
});

test('appendSpeechEvent: menyimpan field tambahan (error, transcript)', () => {
  __resetSpeechLog();
  appendSpeechEvent({ type: 'error', error: 'network' });
  appendSpeechEvent({ type: 'result', transcript: 'う' });
  const evs = readSpeechEvents();
  assert.equal(evs[0].error, 'network');
  assert.equal(evs[1].transcript, 'う');
});

test('clearSpeechEvents: mengosongkan log', () => {
  __resetSpeechLog();
  appendSpeechEvent({ type: 'start' });
  clearSpeechEvents();
  assert.deepEqual(readSpeechEvents(), []);
});

test('subscribeSpeechLog: dipanggil saat event baru & saat clear', () => {
  __resetSpeechLog();
  let calls = 0;
  let last = null;
  const unsub = subscribeSpeechLog((evs) => { calls += 1; last = evs; });
  appendSpeechEvent({ type: 'start' });
  assert.equal(calls, 1);
  assert.equal(last.length, 1);
  clearSpeechEvents();
  assert.equal(calls, 2);
  assert.deepEqual(last, []);
  unsub();
  appendSpeechEvent({ type: 'end' });
  assert.equal(calls, 2, 'setelah unsub tidak dipanggil lagi');
});

test('appendSpeechEvent: membatasi panjang log (MAX 300)', () => {
  __resetSpeechLog();
  for (let i = 0; i < 320; i++) appendSpeechEvent({ type: 'level', value: i });
  assert.equal(readSpeechEvents().length, 300);
});
