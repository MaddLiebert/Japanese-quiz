// cyberpunkHack.test.js — test logika Cyberpunk Gacha (terminal hack challenge)
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CYBER_HACK_STEPS,
  CYBER_TIMEOUT_MS,
  CYBER_STEP_MS,
  CYBER_COMMANDS,
  SUCCESS_RATE,
  FAIL_PENALTY,
  rollResult,
  calcPenalty,
  buildCommandSequence,
  validateInput,
  simulateHack
} from './cyberpunkHack.js';

test('CYBER_HACK_STEPS = 3 tahap', () => {
  assert.equal(CYBER_HACK_STEPS, 3);
});

test('CYBER_STEP_MS berurutan memanjang', () => {
  assert.equal(CYBER_STEP_MS.length, 3);
  assert.ok(CYBER_STEP_MS[0] < CYBER_STEP_MS[1] < CYBER_STEP_MS[2]);
});

test('CYBER_COMMANDS punya 3 tahap', () => {
  assert.ok(CYBER_COMMANDS.step1 && Array.isArray(CYBER_COMMANDS.step1));
  assert.ok(CYBER_COMMANDS.step2 && Array.isArray(CYBER_COMMANDS.step2));
  assert.ok(CYBER_COMMANDS.step3 && Array.isArray(CYBER_COMMANDS.step3));
  assert.ok(CYBER_COMMANDS.step1.length >= 3);
  assert.ok(CYBER_COMMANDS.step2.length >= 3);
  assert.ok(CYBER_COMMANDS.step3.length >= 3);
});

test('SUCCESS_RATE per rarity', () => {
  assert.equal(SUCCESS_RATE.common, 0.90);
  assert.equal(SUCCESS_RATE.rare, 0.75);
  assert.equal(SUCCESS_RATE.legendary, 0.50);
  assert.equal(SUCCESS_RATE.special, 0.30);
});

test('FAIL_PENALTY per rarity', () => {
  assert.equal(FAIL_PENALTY.common.score, 0.05);
  assert.equal(FAIL_PENALTY.common.streak, 0);
  assert.equal(FAIL_PENALTY.rare.score, 0.15);
  assert.equal(FAIL_PENALTY.rare.streak, 1);
  assert.equal(FAIL_PENALTY.legendary.score, 0.30);
  assert.equal(FAIL_PENALTY.legendary.streak, 2);
  assert.equal(FAIL_PENALTY.special.score, 0.50);
  assert.equal(FAIL_PENALTY.special.streak, 2);
  assert.equal(FAIL_PENALTY.special.points, -500);
});

test('rollResult: chance sesuai rarity', () => {
  const common = rollResult('common', () => 0.85);
  assert.equal(common, 'success'); // 0.85 < 0.90
  
  const rareFail = rollResult('rare', () => 0.80);
  assert.equal(rareFail, 'fail'); // 0.80 >= 0.75
});

test('calcPenalty: hitung deduction benar', () => {
  const p1 = calcPenalty('common', 1000, 5);
  assert.ok(p1.score <= 0 && p1.score >= -50, 'score deduction common');
  assert.ok(p1.streak === 0, 'streak deduction common');
  
  const p2 = calcPenalty('rare', 1000, 5);
  assert.ok(p2.score <= 0 && p2.score >= -150, 'score deduction rare');
  assert.ok(p2.streak <= 0 && p2.streak >= -1, 'streak deduction rare');
  
  const p3 = calcPenalty('legendary', 500, 3);
  assert.ok(p3.score <= 0 && p3.score >= -150, 'score deduction legendary');
  assert.ok(p3.streak <= 0 && p3.streak >= -2, 'streak deduction legendary');
  
  const p4 = calcPenalty('special', 1000, 5);
  assert.ok(p4.score <= 0 && p4.score >= -500, 'score deduction special');
  assert.ok(p4.streak <= 0 && p4.streak >= -2, 'streak deduction special');
  assert.ok(p4.points <= 0, 'points deduction special');
});

test('buildCommandSequence: 3 tahap dengan target berbeda', () => {
  const seq = buildCommandSequence(() => 0.5);
  assert.equal(seq.length, 3);
  assert.ok(seq[0].target && seq[1].target && seq[2].target);
  assert.ok(seq[0].ms <= seq[1].ms <= seq[2].ms);
});

test('validateInput: case-insensitive match', () => {
  assert.equal(validateInput('LS', 'ls'), true);
  assert.equal(validateInput('ls', 'LS'), true);
  assert.equal(validateInput(' sudo ', 'sudo'), true);
  assert.equal(validateInput('cat', 'ls'), false);
});

test('simulateHack: returns 3 step results dengan overallSuccess flag', () => {
  const commands = buildCommandSequence(() => 0.5);
  const result = simulateHack('common', commands, Math.random);
  
  assert.equal(result.details.length, 3);
  assert.ok(result.overallSuccess === true || result.overallSuccess === false);
});
