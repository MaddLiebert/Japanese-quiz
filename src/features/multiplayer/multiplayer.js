// ─────────────────────────────────────────────────────────────────────────────
// 合戦 Multiplayer — logika murni (tanpa React, tanpa DOM, tanpa import JSON).
// Semua konstanta di bawah = knob tuning — ubah di sini saja.
// ─────────────────────────────────────────────────────────────────────────────

// ── Konstanta Tuning ─────────────────────────────────────────────────────────
export const MP_TIMER_S = 10;              // detik per soal
export const MP_MAX_POINTS = 100;          // poin maks per soal (jawab di detik ke-0)
export const MP_DECAY_PER_S = 6;           // pengurangan poin per detik terpakai
export const MP_QUESTION_COUNTS = [5, 10]; // pilihan jumlah soal

// Imbalan & penalti XP per mode
export const MP_XP = {
  '1v1': { win: 100, loss: 60, draw: 30 },
  '2v2': { win: 120, loss: 50, draw: 30 },
};

// MVP tim kalah: penalti dipotong setengah
export const MP_MVP_LOSS_DISCOUNT = 0.5;

// Medaru
export const MP_MEDARU = { win: 25, loss: 10, draw: 15 };

// Sabuk pemula: rank Kouhai (XP < 5000) kebal penalti
export const MP_KOUHAI_XP_CEIL = 5000;

// Pool kategori yang tersedia
export const MP_CATEGORIES = ['hiragana', 'katakana', 'kanji', 'kotoba', 'grammar', 'mixed'];

// Emote yang tersedia
export const MP_EMOTES = ['炎', '笑', '涙', '汗', '喝'];

// ── PRNG deterministik (mulberry32) ──────────────────────────────────────────
// Seed sama → urutan acak sama di semua perangkat.
export function mulberry32(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Speed Scoring ────────────────────────────────────────────────────────────
// Poin = MP_MAX_POINTS - (detik_terpakai * MP_DECAY_PER_S), dijepit [0, MP_MAX_POINTS].
// Salah / timeout → 0.
export const calcSpeedScore = (secondsUsed, isCorrect) => {
  if (!isCorrect) return 0;
  const t = Math.max(0, Number(secondsUsed) || 0);
  return Math.max(0, Math.min(MP_MAX_POINTS, MP_MAX_POINTS - Math.round(t * MP_DECAY_PER_S)));
};

// ── Team Assignment ──────────────────────────────────────────────────────────
// Validasi mode & kapasitas slot.
export const maxPlayers = (mode) => (mode === '2v2' ? 4 : 2);
export const teamCapacity = (mode) => (mode === '2v2' ? 2 : 1);
export const isValidMode = (mode) => mode === '1v1' || mode === '2v2';
export const isValidCategory = (cat) => MP_CATEGORIES.includes(cat);
export const isValidQuestionCount = (n) => MP_QUESTION_COUNTS.includes(n);

// Tempatkan pemain baru ke tim yang masih ada slot kosong.
// Mengembalikan 'red' | 'blue' | null (penuh).
export const autoAssignTeam = (redTeam, blueTeam, mode) => {
  const cap = teamCapacity(mode);
  if ((redTeam?.length || 0) < cap) return 'red';
  if ((blueTeam?.length || 0) < cap) return 'blue';
  return null; // room penuh
};

// Pindah tim. Mengembalikan { red, blue } baru (immutable).
export const switchTeam = (playerId, redTeam, blueTeam, mode) => {
  const red = [...(redTeam || [])];
  const blue = [...(blueTeam || [])];
  const cap = teamCapacity(mode);

  const inRed = red.indexOf(playerId);
  const inBlue = blue.indexOf(playerId);

  if (inRed !== -1 && blue.length < cap) {
    red.splice(inRed, 1);
    blue.push(playerId);
  } else if (inBlue !== -1 && red.length < cap) {
    blue.splice(inBlue, 1);
    red.push(playerId);
  }
  // Tidak melakukan apa pun jika tim tujuan penuh
  return { red, blue };
};

// Cek semua slot terisi
export const isRoomFull = (redTeam, blueTeam, mode) => {
  const cap = teamCapacity(mode);
  return (redTeam?.length || 0) >= cap && (blueTeam?.length || 0) >= cap;
};

// ── Tally Skor Tim (2v2 kolektif) ────────────────────────────────────────────
// answers = [{ playerId, team: 'red'|'blue', qIndex, isCorrect, points }]
// Mengembalikan { red, blue, perPlayer: { [playerId]: totalPoints } }
export const tallyTeamScores = (answers) => {
  let red = 0;
  let blue = 0;
  const perPlayer = {};

  for (const a of (answers || [])) {
    const pts = Number(a.points) || 0;
    perPlayer[a.playerId] = (perPlayer[a.playerId] || 0) + pts;
    if (a.team === 'red') red += pts;
    else if (a.team === 'blue') blue += pts;
  }

  return { red, blue, perPlayer };
};

// Tentukan pemenang dari skor akhir.
// Mengembalikan 'red' | 'blue' | 'draw'.
export const determineWinner = (redScore, blueScore) => {
  if (redScore > blueScore) return 'red';
  if (blueScore > redScore) return 'blue';
  return 'draw';
};

// ── MVP (pemain dengan poin tertinggi) ───────────────────────────────────────
// Mengembalikan { mvpId, mvpTeam, mvpPoints } atau null jika tidak ada jawaban.
export const findMvp = (perPlayer, redTeam, blueTeam) => {
  let mvpId = null;
  let mvpPoints = -1;
  for (const [id, pts] of Object.entries(perPlayer || {})) {
    if (pts > mvpPoints) {
      mvpId = id;
      mvpPoints = pts;
    }
  }
  if (!mvpId) return null;
  const mvpTeam = (redTeam || []).includes(mvpId) ? 'red'
    : (blueTeam || []).includes(mvpId) ? 'blue' : null;
  return { mvpId, mvpTeam, mvpPoints };
};

// ── XP Reward & Penalty ─────────────────────────────────────────────────────
// Menghitung XP yang didapat/hilang per pemain setelah match selesai.
// currentXp = XP pemain saat ini (untuk cek Kouhai protection).
// Mengembalikan angka: positif = gain, negatif = loss, 0 = draw / dilindungi.
export const calcMatchXp = (mode, playerTeam, winner, currentXp, isMvp = false) => {
  const table = MP_XP[mode] || MP_XP['1v1'];

  if (winner === 'draw') return table.draw;
  if (playerTeam === winner) return table.win;

  // Kalah — cek Kouhai protection
  if ((Number(currentXp) || 0) < MP_KOUHAI_XP_CEIL) return 0;

  // MVP tim kalah: diskon penalti
  const loss = table.loss;
  return isMvp ? -Math.round(loss * MP_MVP_LOSS_DISCOUNT) : -loss;
};

// ── Medaru Reward ────────────────────────────────────────────────────────────
export const calcMatchMedaru = (playerTeam, winner) => {
  if (winner === 'draw') return MP_MEDARU.draw;
  if (playerTeam === winner) return MP_MEDARU.win;
  return MP_MEDARU.loss;
};

// ── Room Code Generator ──────────────────────────────────────────────────────
// 6 karakter alfanumerik (tanpa karakter rancu: 0/O, 1/I/L).
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const generateRoomCode = (rng = Math.random) => {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(rng() * CODE_CHARS.length)];
  }
  return code;
};
