import test from 'node:test';
import assert from 'node:assert/strict';
import { diagnoseEnv } from './speechEnv.js';

test('diagnoseEnv: tanpa ctor → blocker no-ctor', () => {
  const v = diagnoseEnv({ hasCtor: false });
  assert.equal(v.code, 'no-ctor');
  assert.equal(v.level, 'blocker');
});

test('diagnoseEnv: bukan secure context → blocker insecure', () => {
  assert.equal(diagnoseEnv({ isSecureContext: false }).code, 'insecure');
});

test('diagnoseEnv: izin mikrofon ditolak → blocker mic-denied', () => {
  assert.equal(diagnoseEnv({ permissionState: 'denied' }).code, 'mic-denied');
});

test('diagnoseEnv: offline → blocker offline (ASR jalan di server)', () => {
  assert.equal(diagnoseEnv({ online: false }).code, 'offline');
});

test('diagnoseEnv: izin belum diberi → warn mic-prompt', () => {
  assert.equal(diagnoseEnv({ permissionState: 'prompt' }).code, 'mic-prompt');
  assert.equal(diagnoseEnv({ permissionState: 'prompt' }).level, 'warn');
});

test('diagnoseEnv: semua beres → ok', () => {
  assert.equal(diagnoseEnv({}).code, 'ok');
  assert.equal(diagnoseEnv({ permissionState: 'granted' }).code, 'ok');
});

test('diagnoseEnv: urutan prioritas — no-ctor menang atas insecure', () => {
  assert.equal(diagnoseEnv({ hasCtor: false, isSecureContext: false }).code, 'no-ctor');
});
