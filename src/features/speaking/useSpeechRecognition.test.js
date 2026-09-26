import test from 'node:test';
import assert from 'node:assert/strict';
import { isMobileUA, resolveUtterances } from './useSpeechRecognition.js';

test('isMobileUA: mendeteksi HP Android/iPhone, bukan desktop', () => {
  assert.equal(
    isMobileUA('Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'),
    true,
  );
  assert.equal(isMobileUA('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'), true);
  assert.equal(isMobileUA('Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15'), true);
  assert.equal(isMobileUA('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'), false);
  assert.equal(isMobileUA('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'), false);
  assert.equal(isMobileUA(''), false);
  assert.equal(isMobileUA(undefined), false);
});

test('resolveUtterances: final menang; interim diselamatkan; kosong tetap kosong', () => {
  assert.deepEqual(resolveUtterances(['あ'], 'い'), ['あ']);
  assert.deepEqual(resolveUtterances([], 'い'), ['い']);
  assert.deepEqual(resolveUtterances([], ''), []);
  assert.deepEqual(resolveUtterances(undefined, undefined), []);
});
