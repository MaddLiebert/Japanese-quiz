import test from 'node:test';
import assert from 'node:assert/strict';
import { setActiveVoice, getActiveVoiceKey } from './sfx.js';

test('default tanpa pack: tidak ada voice (chime dasar)', () => {
  setActiveVoice(null);
  assert.equal(getActiveVoiceKey(), null);
});

test('setActiveVoice mengubah voice & null = tanpa pack', () => {
  setActiveVoice('dummy');
  assert.equal(getActiveVoiceKey(), 'dummy');
  setActiveVoice('taiko');
  assert.equal(getActiveVoiceKey(), 'taiko');
  setActiveVoice(null);
  assert.equal(getActiveVoiceKey(), null);
});

test('sfx.js tetap mengekspor streakGongParams (gong audible tidak boleh hilang)', async () => {
  const mod = await import('./sfx.js');
  assert.equal(typeof mod.streakGongParams, 'function');
  const p = mod.streakGongParams(1);
  assert.ok(p.base >= 180, 'base harus audible (>=180Hz)');
});
