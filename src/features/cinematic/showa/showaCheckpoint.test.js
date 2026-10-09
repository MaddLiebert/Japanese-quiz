import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SHOWA_CHECKPOINT_STOP, SHOWA_CHECKPOINT_ROUTE, SHOWA_CHECKPOINT_PASS,
  SHOWA_CHECKPOINT_PASS_LKR, SHOWA_CHECKPOINT_PASS_LISTENING, SHOWA_CHECKPOINT_MIN_KANJI,
  SHOWA_CHECKPOINT_SONG, isShowaCheckpointUnlocked, gradeShowaCheckpoint, validateShowaCheckpoint,
} from './showaCheckpoint.js';
import { N5_PASS_TOTAL, N5_PASS_LKR, N5_PASS_LISTENING, N5_EXAM_MIN_MASTERED_KANJI } from '../../n5exam/n5exam.js';

test('checkpoint Shōwa: stop = 卒業 (perhentian terakhir, feature:checkpoint)', () => {
  assert.equal(SHOWA_CHECKPOINT_STOP.id, 'sotsugyo');
  assert.equal(SHOWA_CHECKPOINT_STOP.jp, '卒業');
  assert.equal(SHOWA_CHECKPOINT_STOP.feature, 'checkpoint');
  assert.equal(SHOWA_CHECKPOINT_STOP.last, true);
});

test('checkpoint Shōwa: pakai UJIAN N5 yang sudah ada (route /n5-exam)', () => {
  assert.equal(SHOWA_CHECKPOINT_ROUTE, '/n5-exam');
});

test('checkpoint Shōwa: ambang lulus = ambang N5 (satu sumber kebenaran)', () => {
  assert.equal(SHOWA_CHECKPOINT_PASS, N5_PASS_TOTAL);
  assert.equal(SHOWA_CHECKPOINT_PASS_LKR, N5_PASS_LKR);
  assert.equal(SHOWA_CHECKPOINT_PASS_LISTENING, N5_PASS_LISTENING);
  assert.equal(SHOWA_CHECKPOINT_MIN_KANJI, N5_EXAM_MIN_MASTERED_KANJI);
});

test('checkpoint Shōwa: 蛍の光 = lagu kelulusan (PRD §20)', () => {
  assert.equal(SHOWA_CHECKPOINT_SONG, '蛍の光');
});

test('checkpoint Shōwa: gerbang buka butuh rank Shogun + ≥30 kanji hafal', () => {
  assert.equal(isShowaCheckpointUnlocked('Shogun', 30), true);
  assert.equal(isShowaCheckpointUnlocked('Shogun', 100), true);
  assert.equal(isShowaCheckpointUnlocked('Shogun', 29), false);
  assert.equal(isShowaCheckpointUnlocked('Samurai', 100), false);
  assert.equal(isShowaCheckpointUnlocked(undefined, 100), false);
});

test('checkpoint Shōwa: verdict lulus butuh total + LKR + listening (gagal satu = gagal)', () => {
  // Semua sempurna → lulus.
  const pass = gradeShowaCheckpoint({ lkrRaw: 120, lkrTotal: 120, listeningRaw: 60, listeningTotal: 60 });
  assert.equal(pass.passed, true);
  assert.equal(pass.total, 180);

  // Total tinggi tapi listening di bawah ambang → GAGAL (sectional).
  const failListening = gradeShowaCheckpoint({ lkrRaw: 120, lkrTotal: 120, listeningRaw: 10, listeningTotal: 60 });
  assert.equal(failListening.listeningOk, false);
  assert.equal(failListening.passed, false);

  // LKR di bawah ambang → GAGAL walau listening penuh.
  const failLkr = gradeShowaCheckpoint({ lkrRaw: 20, lkrTotal: 120, listeningRaw: 60, listeningTotal: 60 });
  assert.equal(failLkr.lkrOk, false);
  assert.equal(failLkr.passed, false);
});

test('validateShowaCheckpoint: checkpoint sehat (tanpa error)', () => {
  assert.deepEqual(validateShowaCheckpoint(), []);
});
