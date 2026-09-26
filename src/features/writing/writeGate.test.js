import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WRITE_LEVEL_ORDER, levelIndex, isLevelUnlocked, unlockedLevels,
  markLevelPassed, WRITE_GATE_KEY, WRITE_GATE_VERSION,
} from './writeGate.js';

test('WRITE_LEVEL_ORDER: urutan trace → memory → blind', () => {
  assert.deepEqual(WRITE_LEVEL_ORDER, ['trace', 'memory', 'blind']);
});

test('levelIndex: index level, tak dikenal → 0', () => {
  assert.equal(levelIndex('trace'), 0);
  assert.equal(levelIndex('memory'), 1);
  assert.equal(levelIndex('blind'), 2);
  assert.equal(levelIndex('zzz'), 0);
  assert.equal(levelIndex(), 0);
});

test('isLevelUnlocked: trace selalu terbuka walau belum ada riwayat', () => {
  assert.equal(isLevelUnlocked({}, 'あ', 'trace'), true);
  assert.equal(isLevelUnlocked(null, 'あ', 'trace'), true);
  assert.equal(isLevelUnlocked(undefined, 'あ', 'trace'), true);
});

test('isLevelUnlocked: memory/blind terkunci sebelum level sebelumnya lulus', () => {
  assert.equal(isLevelUnlocked({}, 'あ', 'memory'), false);
  assert.equal(isLevelUnlocked({}, 'あ', 'blind'), false);
  // trace lulus → memory kebuka, blind masih terkunci
  const afterTrace = markLevelPassed({}, 'あ', 'trace');
  assert.equal(isLevelUnlocked(afterTrace, 'あ', 'memory'), true);
  assert.equal(isLevelUnlocked(afterTrace, 'あ', 'blind'), false);
  // memory lulus → blind kebuka
  const afterMemory = markLevelPassed(afterTrace, 'あ', 'memory');
  assert.equal(isLevelUnlocked(afterMemory, 'あ', 'blind'), true);
});

test('isLevelUnlocked: gating per karakter, bukan global', () => {
  const gate = markLevelPassed({}, 'あ', 'trace');
  assert.equal(isLevelUnlocked(gate, 'あ', 'memory'), true);
  assert.equal(isLevelUnlocked(gate, 'い', 'memory'), false, 'い belum lulus trace');
});

test('markLevelPassed: tidak menghapus riwayat lain, tidak menduplikasi', () => {
  let gate = markLevelPassed({}, 'あ', 'trace');
  gate = markLevelPassed(gate, 'あ', 'memory');
  gate = markLevelPassed(gate, 'あ', 'trace');  // ulang
  assert.deepEqual(gate['あ'].passed, ['trace', 'memory']);
  // objek asli tidak dimutasi (pure)
  const before = { あ: { passed: ['trace'] } };
  const snapshot = JSON.stringify(before);
  markLevelPassed(before, 'あ', 'memory');
  assert.equal(JSON.stringify(before), snapshot, 'tidak boleh mutasi argumen');
});

test('markLevelPassed: karakter tanpa riwayat tetap aman', () => {
  assert.deepEqual(markLevelPassed({}, 'あ', 'zzz').あ.passed, []);
});

test('unlockedLevels: mengembalikan daftar level yang terbuka', () => {
  assert.deepEqual(unlockedLevels({}, 'あ'), ['trace']);
  const g1 = markLevelPassed({}, 'あ', 'trace');
  assert.deepEqual(unlockedLevels(g1, 'あ'), ['trace', 'memory']);
  const g2 = markLevelPassed(g1, 'あ', 'memory');
  assert.deepEqual(unlockedLevels(g2, 'あ'), ['trace', 'memory', 'blind']);
});

test('key & version stabil (dipakai untuk localStorage)', () => {
  assert.equal(WRITE_GATE_KEY, 'write_gate_v1');
  assert.equal(WRITE_GATE_VERSION, 1);
});
