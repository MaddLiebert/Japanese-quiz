import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MP_TIMER_S, MP_MAX_POINTS, MP_DECAY_PER_S, MP_XP, MP_MEDARU,
  MP_KOUHAI_XP_CEIL, MP_CATEGORIES, MP_EMOTES, MP_MVP_LOSS_DISCOUNT,
  MP_QUESTION_COUNTS,
  mulberry32,
  calcSpeedScore,
  maxPlayers, teamCapacity, isValidMode, isValidCategory, isValidQuestionCount,
  autoAssignTeam, switchTeam, isRoomFull,
  tallyTeamScores, determineWinner, findMvp,
  calcMatchXp, calcMatchMedaru,
  generateRoomCode,
} from './multiplayer.js';

// ── Konstanta ────────────────────────────────────────────────────────────────

test('konstanta: timer 10 detik, maks 100 poin, decay 6/detik', () => {
  assert.equal(MP_TIMER_S, 10);
  assert.equal(MP_MAX_POINTS, 100);
  assert.equal(MP_DECAY_PER_S, 6);
});

test('konstanta: XP reward/penalty sesuai spec', () => {
  assert.deepEqual(MP_XP['1v1'], { win: 100, loss: 60, draw: 30 });
  assert.deepEqual(MP_XP['2v2'], { win: 120, loss: 50, draw: 30 });
});

test('konstanta: medaru sesuai spec', () => {
  assert.deepEqual(MP_MEDARU, { win: 25, loss: 10, draw: 15 });
});

test('konstanta: Kouhai protection XP < 5000', () => {
  assert.equal(MP_KOUHAI_XP_CEIL, 5000);
});

test('konstanta: 6 kategori + 5 emote + 2 jumlah soal', () => {
  assert.equal(MP_CATEGORIES.length, 6);
  assert.ok(MP_CATEGORIES.includes('mixed'));
  assert.equal(MP_EMOTES.length, 5);
  assert.deepEqual(MP_QUESTION_COUNTS, [5, 10]);
});

// ── mulberry32 PRNG ──────────────────────────────────────────────────────────

test('mulberry32: deterministik (seed sama → urutan sama)', () => {
  const a = mulberry32(42);
  const b = mulberry32(42);
  const seqA = Array.from({ length: 20 }, () => a());
  const seqB = Array.from({ length: 20 }, () => b());
  assert.deepEqual(seqA, seqB);
});

test('mulberry32: seed beda → urutan beda', () => {
  const a = mulberry32(1);
  const b = mulberry32(999);
  const seqA = Array.from({ length: 10 }, () => a());
  const seqB = Array.from({ length: 10 }, () => b());
  assert.notDeepEqual(seqA, seqB);
});

test('mulberry32: output 0 ≤ x < 1', () => {
  const rng = mulberry32(12345);
  for (let i = 0; i < 1000; i++) {
    const v = rng();
    assert.ok(v >= 0 && v < 1, `out of range: ${v}`);
  }
});

// ── Speed Scoring ────────────────────────────────────────────────────────────

test('calcSpeedScore: jawab benar di detik 0 → maks 100', () => {
  assert.equal(calcSpeedScore(0, true), 100);
});

test('calcSpeedScore: jawab benar di detik 5 → 70', () => {
  assert.equal(calcSpeedScore(5, true), 70);
});

test('calcSpeedScore: jawab benar di detik 10 → 40', () => {
  assert.equal(calcSpeedScore(10, true), 40);
});

test('calcSpeedScore: jawab benar di detik 1.5 → 91', () => {
  assert.equal(calcSpeedScore(1.5, true), 91);
});

test('calcSpeedScore: jawab salah → 0 (berapa pun kecepatannya)', () => {
  assert.equal(calcSpeedScore(0, false), 0);
  assert.equal(calcSpeedScore(3, false), 0);
});

test('calcSpeedScore: timeout (melebihi batas) → dijepit 0', () => {
  assert.equal(calcSpeedScore(20, true), 0);
});

test('calcSpeedScore: input aneh (negatif, NaN) → aman', () => {
  assert.equal(calcSpeedScore(-5, true), 100); // negatif dijepit 0 detik → maks
  assert.equal(calcSpeedScore(NaN, true), 100);
  assert.equal(calcSpeedScore(null, false), 0);
});

// ── Mode & Validasi ──────────────────────────────────────────────────────────

test('maxPlayers & teamCapacity: 1v1 = 2/1, 2v2 = 4/2', () => {
  assert.equal(maxPlayers('1v1'), 2);
  assert.equal(maxPlayers('2v2'), 4);
  assert.equal(teamCapacity('1v1'), 1);
  assert.equal(teamCapacity('2v2'), 2);
});

test('isValidMode: hanya 1v1 dan 2v2', () => {
  assert.equal(isValidMode('1v1'), true);
  assert.equal(isValidMode('2v2'), true);
  assert.equal(isValidMode('3v3'), false);
  assert.equal(isValidMode(''), false);
});

test('isValidCategory: 6 kategori dikenal', () => {
  assert.equal(isValidCategory('hiragana'), true);
  assert.equal(isValidCategory('mixed'), true);
  assert.equal(isValidCategory('ngawur'), false);
});

test('isValidQuestionCount: hanya 5 atau 10', () => {
  assert.equal(isValidQuestionCount(5), true);
  assert.equal(isValidQuestionCount(10), true);
  assert.equal(isValidQuestionCount(7), false);
  assert.equal(isValidQuestionCount(0), false);
});

// ── Team Assignment ──────────────────────────────────────────────────────────

test('autoAssignTeam 1v1: merah dulu, lalu biru, lalu null', () => {
  assert.equal(autoAssignTeam([], [], '1v1'), 'red');
  assert.equal(autoAssignTeam(['a'], [], '1v1'), 'blue');
  assert.equal(autoAssignTeam(['a'], ['b'], '1v1'), null);
});

test('autoAssignTeam 2v2: isi merah sampai 2, lalu biru, lalu null', () => {
  assert.equal(autoAssignTeam([], [], '2v2'), 'red');
  assert.equal(autoAssignTeam(['a'], [], '2v2'), 'red');
  assert.equal(autoAssignTeam(['a', 'b'], [], '2v2'), 'blue');
  assert.equal(autoAssignTeam(['a', 'b'], ['c'], '2v2'), 'blue');
  assert.equal(autoAssignTeam(['a', 'b'], ['c', 'd'], '2v2'), null);
});

test('switchTeam: pindah dari merah ke biru (dan sebaliknya)', () => {
  const r1 = switchTeam('p1', ['p1', 'p2'], ['p3'], '2v2');
  assert.deepEqual(r1.red, ['p2']);
  assert.deepEqual(r1.blue, ['p3', 'p1']);

  const r2 = switchTeam('p3', ['p2'], ['p3', 'p1'], '2v2');
  assert.deepEqual(r2.red, ['p2', 'p3']);
  assert.deepEqual(r2.blue, ['p1']);
});

test('switchTeam: tidak pindah jika tim tujuan penuh', () => {
  const r = switchTeam('p1', ['p1'], ['p3', 'p4'], '2v2');
  // Biru sudah penuh → p1 tetap di merah
  assert.deepEqual(r.red, ['p1']);
  assert.deepEqual(r.blue, ['p3', 'p4']);
});

test('switchTeam: immutable (tidak merusak array asli)', () => {
  const red = ['p1'];
  const blue = ['p2'];
  const r = switchTeam('p1', red, blue, '2v2');
  assert.deepEqual(red, ['p1']); // asli tidak berubah
  assert.deepEqual(blue, ['p2']);
  assert.notEqual(r.red, red);
  assert.notEqual(r.blue, blue);
});

test('isRoomFull: benar saat kapasitas terpenuhi', () => {
  assert.equal(isRoomFull(['a'], ['b'], '1v1'), true);
  assert.equal(isRoomFull(['a'], [], '1v1'), false);
  assert.equal(isRoomFull(['a', 'b'], ['c', 'd'], '2v2'), true);
  assert.equal(isRoomFull(['a', 'b'], ['c'], '2v2'), false);
});

// ── Tally Skor Tim ───────────────────────────────────────────────────────────

test('tallyTeamScores: akumulasi poin per tim dan per pemain', () => {
  const answers = [
    { playerId: 'p1', team: 'red', qIndex: 0, isCorrect: true, points: 88 },
    { playerId: 'p2', team: 'red', qIndex: 0, isCorrect: true, points: 70 },
    { playerId: 'p3', team: 'blue', qIndex: 0, isCorrect: false, points: 0 },
    { playerId: 'p4', team: 'blue', qIndex: 0, isCorrect: true, points: 94 },
    { playerId: 'p1', team: 'red', qIndex: 1, isCorrect: true, points: 82 },
    { playerId: 'p3', team: 'blue', qIndex: 1, isCorrect: true, points: 76 },
  ];
  const t = tallyTeamScores(answers);
  assert.equal(t.red, 88 + 70 + 82);   // 240
  assert.equal(t.blue, 0 + 94 + 76);   // 170
  assert.equal(t.perPlayer.p1, 88 + 82); // 170
  assert.equal(t.perPlayer.p2, 70);
  assert.equal(t.perPlayer.p3, 0 + 76); // 76
  assert.equal(t.perPlayer.p4, 94);
});

test('tallyTeamScores: array kosong → 0 semua', () => {
  const t = tallyTeamScores([]);
  assert.equal(t.red, 0);
  assert.equal(t.blue, 0);
  assert.deepEqual(t.perPlayer, {});
});

// ── Determine Winner ─────────────────────────────────────────────────────────

test('determineWinner: skor lebih tinggi menang, sama = draw', () => {
  assert.equal(determineWinner(300, 200), 'red');
  assert.equal(determineWinner(200, 300), 'blue');
  assert.equal(determineWinner(250, 250), 'draw');
});

// ── MVP ──────────────────────────────────────────────────────────────────────

test('findMvp: pemain dengan poin tertinggi', () => {
  const mvp = findMvp({ p1: 170, p2: 70, p3: 76, p4: 94 }, ['p1', 'p2'], ['p3', 'p4']);
  assert.equal(mvp.mvpId, 'p1');
  assert.equal(mvp.mvpTeam, 'red');
  assert.equal(mvp.mvpPoints, 170);
});

test('findMvp: null jika tidak ada data', () => {
  assert.equal(findMvp({}, [], []), null);
  assert.equal(findMvp(null, [], []), null);
});

// ── XP Reward & Penalty ─────────────────────────────────────────────────────

test('calcMatchXp 1v1: menang +100, kalah -60, draw +30', () => {
  assert.equal(calcMatchXp('1v1', 'red', 'red', 10000), 100);
  assert.equal(calcMatchXp('1v1', 'blue', 'red', 10000), -60);
  assert.equal(calcMatchXp('1v1', 'red', 'draw', 10000), 30);
});

test('calcMatchXp 2v2: menang +120, kalah -50, draw +30', () => {
  assert.equal(calcMatchXp('2v2', 'red', 'red', 10000), 120);
  assert.equal(calcMatchXp('2v2', 'blue', 'red', 10000), -50);
  assert.equal(calcMatchXp('2v2', 'red', 'draw', 10000), 30);
});

test('calcMatchXp: Kouhai protection (XP < 5000) → kalah = 0 (tidak kena penalti)', () => {
  assert.equal(calcMatchXp('1v1', 'blue', 'red', 0), 0);
  assert.equal(calcMatchXp('1v1', 'blue', 'red', 4999), 0);
  // Tepat di batas: 5000 = Senpai, kena penalti
  assert.equal(calcMatchXp('1v1', 'blue', 'red', 5000), -60);
});

test('calcMatchXp: MVP tim kalah 2v2 → penalti dipotong setengah (-25)', () => {
  const xp = calcMatchXp('2v2', 'blue', 'red', 10000, true);
  assert.equal(xp, -Math.round(50 * MP_MVP_LOSS_DISCOUNT)); // -25
});

test('calcMatchXp: MVP tim kalah tapi Kouhai → tetap 0 (protection menang)', () => {
  assert.equal(calcMatchXp('2v2', 'blue', 'red', 3000, true), 0);
});

// ── Medaru ────────────────────────────────────────────────────────────────────

test('calcMatchMedaru: menang +25, kalah +10, draw +15', () => {
  assert.equal(calcMatchMedaru('red', 'red'), 25);
  assert.equal(calcMatchMedaru('blue', 'red'), 10);
  assert.equal(calcMatchMedaru('red', 'draw'), 15);
});

// ── Room Code ────────────────────────────────────────────────────────────────

test('generateRoomCode: 6 karakter, tanpa karakter rancu (0/O/1/I/L)', () => {
  const code = generateRoomCode();
  assert.equal(code.length, 6);
  assert.ok(/^[A-Z2-9]{6}$/.test(code), `Kode mengandung karakter tak valid: ${code}`);
  assert.ok(!/[01OIL]/.test(code), `Kode mengandung karakter rancu: ${code}`);
});

test('generateRoomCode: deterministik dengan rng inject', () => {
  const a = generateRoomCode(mulberry32(42));
  const b = generateRoomCode(mulberry32(42));
  assert.equal(a, b);
});

test('generateRoomCode: rng berbeda → kode berbeda (biasanya)', () => {
  const a = generateRoomCode(mulberry32(1));
  const b = generateRoomCode(mulberry32(999));
  assert.notEqual(a, b);
});
