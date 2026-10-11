// cyberpunkCheckpoint.test.js — penjaga gerbang 終 電脳. PRD §11.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CYBERPUNK_CHECKPOINT_STOP, CYBERPUNK_CHECKPOINT_ROUTE, CYBERPUNK_CHECKPOINT_MIN_LEVEL,
  OWARI_RULES, N5_BASE_PASS, OWARI_PASS_TOTAL, OWARI_PASS_LKR, OWARI_PASS_LISTENING,
  OWARI_TOTAL_MINUTES, N5_TOTAL_MINUTES, owariSectionMinutes,
  isCyberpunkCheckpointUnlocked, gradeOwariCheckpoint, validateCyberpunkCheckpoint,
  OWARI_END, OWARI_STAY, OWARI_REWARD,
} from './cyberpunkCheckpoint.js';
import { N5_SECTION_ORDER } from '../../n5exam/n5exam.js';

test('validateCyberpunkCheckpoint: bersih', () => {
  assert.deepEqual(validateCyberpunkCheckpoint(), []);
});

test('checkpoint 終 = 扉, route /owari-checkpoint', () => {
  assert.equal(CYBERPUNK_CHECKPOINT_STOP.id, 'tobira');
  assert.equal(CYBERPUNK_CHECKPOINT_ROUTE, '/owari-checkpoint');
});

test('4 aturan "tersulit" semuanya ON (§11.2)', () => {
  assert.equal(OWARI_RULES.cold, true, '① mode dingin');
  assert.equal(OWARI_RULES.noRetry, true, '③ sekali jalan');
  assert.ok(OWARI_RULES.tightTime > 0 && OWARI_RULES.tightTime < 1, '④ waktu ketat');
});

test('ambang lulus 終 NAIK dari N5 (§11.2 ②)', () => {
  assert.ok(OWARI_PASS_TOTAL > N5_BASE_PASS.total);
  assert.ok(OWARI_PASS_LKR > N5_BASE_PASS.lkr);
  assert.ok(OWARI_PASS_LISTENING > N5_BASE_PASS.listening);
});

test('durasi 終 lebih pendek dari N5 (waktu ketat)', () => {
  assert.ok(OWARI_TOTAL_MINUTES < N5_TOTAL_MINUTES);
  for (const k of N5_SECTION_ORDER) {
    assert.ok(owariSectionMinutes(k) >= 1, `${k} minimal 1 menit`);
  }
});

test('gerbang buka: Lv 300 DAN sudah lulus 多元 最終回', () => {
  assert.equal(isCyberpunkCheckpointUnlocked(300, true), true);
  assert.equal(isCyberpunkCheckpointUnlocked(299, true), false, 'Lv kurang');
  assert.equal(isCyberpunkCheckpointUnlocked(300, false), false, 'belum lulus 最終回');
  assert.equal(CYBERPUNK_CHECKPOINT_MIN_LEVEL, 300);
});

test('verdict 終 memakai AMBANG NAIK, bukan N5', () => {
  // Nilai sempurna → lulus.
  const perfect = gradeOwariCheckpoint({ lkrRaw: 120, lkrTotal: 120, listeningRaw: 60, listeningTotal: 60 });
  assert.equal(perfect.passed, true);
  assert.equal(perfect.total, 180);
  // Nilai yang LULUS N5 dasar tapi GAGAL 終 (mis. total ~95, LKR ~45, listen ~22).
  // LKR 45/120 = 0.375 → 45 ; listening 22/60 = 0.3667 → 22 ; total 67 < 110 → gagal.
  const n5ish = gradeOwariCheckpoint({ lkrRaw: 45, lkrTotal: 120, listeningRaw: 22, listeningTotal: 60 });
  assert.equal(n5ish.passed, false, 'ambang naik → nilai N5 pas-pasan gagal di 終');
});

test('gagal satu seksi = gagal total (aturan N5 tetap)', () => {
  // LKR tinggi, listening di bawah ambang 26 → gagal walau total ≥ 110.
  const r = gradeOwariCheckpoint({ lkrRaw: 120, lkrTotal: 120, listeningRaw: 20, listeningTotal: 60 });
  assert.equal(r.lkrOk, true);
  assert.equal(r.listeningOk, false);
  assert.equal(r.passed, false);
});

test('momen akhir: lulus → 完, gagal → tetap 終; hadiah N5Certificate', () => {
  assert.equal(OWARI_END, '完');
  assert.equal(OWARI_STAY, '終');
  assert.equal(OWARI_REWARD, 'N5Certificate');
});
