import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_LISTEN_MS, resolveUtterances } from './useSpeechRecognition.js';

test('MAX_LISTEN_MS: backstop wajar (5–30 detik)', () => {
  assert.ok(Number.isFinite(MAX_LISTEN_MS));
  assert.ok(MAX_LISTEN_MS >= 5000 && MAX_LISTEN_MS <= 30000, `nilai ${MAX_LISTEN_MS} di luar rentang wajar`);
});

test('resolveUtterances: final menang; interim diselamatkan; kosong tetap kosong', () => {
  assert.deepEqual(resolveUtterances(['あ'], 'い'), ['あ']);
  assert.deepEqual(resolveUtterances([], 'い'), ['い']);
  assert.deepEqual(resolveUtterances([], ''), []);
  assert.deepEqual(resolveUtterances(undefined, undefined), []);
});
