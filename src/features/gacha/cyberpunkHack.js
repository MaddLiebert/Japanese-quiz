// ─────────────────────────────────────────────────────────────────────────────
// Cyberpunk Gacha Logic — Hack Protocol v3.2 (terminal-based challenge)
// Modul MURNI (tanpa React/DOM) → dites via `node --test`.
// ─────────────────────────────────────────────────────────────────────────────

export const CYBER_HACK_STEPS = 3;
export const CYBER_TIMEOUT_MS = 2000;
export const CYBER_STEP_MS = [1500, 2500, 3500]; // berhenti berurutan

// Command pool per tahap hacking
export const CYBER_COMMANDS = {
  step1: ['ls', 'cat', 'cd', 'pwd', 'whoami'],
  step2: ['sudo', 'su', 'chmod', 'chown', 'passwd'],
  step3: ['cat archive.dat', 'scp file', 'wget data', 'curl payload', 'ssh key']
};

// Chance success per rarity (risk vs reward)
export const SUCCESS_RATE = {
  common: 0.90,
  rare: 0.75,
  legendary: 0.50,
  special: 0.30
};

// Fail penalty per rarity
export const FAIL_PENALTY = {
  common: { score: 0.05, streak: 0 },
  rare: { score: 0.15, streak: 1 },
  legendary: { score: 0.30, streak: 2 }, // streak reset = -2
  special: { score: 0.50, streak: 2, points: -500 }
};

// Roll hasil gacha (pack atau data corrupt)
export function rollResult(rarity, rng = Math.random) {
  const rate = SUCCESS_RATE[rarity] ?? 0.5;
  return rng() < rate ? 'success' : 'fail';
}

// Hitung penalty jika fail
export function calcPenalty(rarity, currentScore, currentStreak) {
  const penalty = FAIL_PENALTY[rarity] ?? FAIL_PENALTY.common;
  const scoreDeduction = Math.floor(currentScore * penalty.score);
  const streakDeduction = Math.min(currentStreak, penalty.streak);
  return {
    score: -scoreDeduction,
    streak: -streakDeduction,
    points: penalty.points ?? 0
  };
}

// Build command sequence per tahap
export function buildCommandSequence(rng = Math.random) {
  return [
    { step: 1, target: CYBER_COMMANDS.step1[Math.floor(rng() * CYBER_COMMANDS.step1.length)], ms: CYBER_STEP_MS[0] },
    { step: 2, target: CYBER_COMMANDS.step2[Math.floor(rng() * CYBER_COMMANDS.step2.length)], ms: CYBER_STEP_MS[1] },
    { step: 3, target: CYBER_COMMANDS.step3[Math.floor(rng() * CYBER_COMMANDS.step3.length)], ms: CYBER_STEP_MS[2] }
  ];
}

// Validasi input user (sederhana: case-insensitive match)
export function validateInput(input, target) {
  return input.toLowerCase().trim() === target.toLowerCase().trim();
}

// Simulasi hack session (untuk testing)
export function simulateHack(rarity, commands, rng = Math.random) {
  const results = [];
  let successCount = 0;

  for (let i = 0; i < CYBER_HACK_STEPS; i++) {
    const target = commands[i]?.target;
    const correct = rng() < 0.7; // user 70% chance ketik benar
    if (correct && target) {
      successCount++;
    }
    results.push({
      step: i + 1,
      target,
      success: correct
    });
  }

  const overallSuccess = successCount === CYBER_HACK_STEPS;
  return { overallSuccess, details: results };
}
