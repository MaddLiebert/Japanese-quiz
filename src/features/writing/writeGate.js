// Gating level kuis tulis — murni, dites `node --test`, tanpa DOM.
// Aturan: level 2 kebuka setelah level 1 LULUS untuk karakter itu; level 3
// setelah level 2 lulus. Gating PER KARAKTER (bukan global) supaya user bisa
// latihan santai di karakter baru tanpa terkunci di karakter yang sudah jago.
//
// Bentuk state: { [char]: { passed: ['trace', 'memory'] } }

export const WRITE_GATE_KEY = 'write_gate_v1';
export const WRITE_GATE_VERSION = 1;

// Urutan level dari paling mudah. Index dipakai untuk cek prasyarat.
export const WRITE_LEVEL_ORDER = ['trace', 'memory', 'blind'];

// Index level; tak dikenal → 0 (trace).
export const levelIndex = (level) => {
  const i = WRITE_LEVEL_ORDER.indexOf(level);
  return i === -1 ? 0 : i;
};

// Level ke-n terbuka kalau semua level sebelumnya sudah lulus.
export const isLevelUnlocked = (gate, char, level) => {
  const idx = levelIndex(level);
  if (idx === 0) return true;                       // trace selalu terbuka
  const passed = gate?.[char]?.passed;
  if (!Array.isArray(passed)) return false;
  for (let i = 0; i < idx; i++) {
    if (!passed.includes(WRITE_LEVEL_ORDER[i])) return false;
  }
  return true;
};

// Tandai level lulus untuk 1 karakter. Pure: mengembalikan objek baru.
export const markLevelPassed = (gate, char, level) => {
  const prev = gate?.[char]?.passed;
  const passed = Array.isArray(prev) ? [...prev] : [];
  if (levelIndex(level) > 0 || level === WRITE_LEVEL_ORDER[0]) {
    if (!passed.includes(level)) passed.push(level);
  }
  // Urutkan sesuai urutan level supaya hasilnya deterministik.
  passed.sort((a, b) => levelIndex(a) - levelIndex(b));
  return { ...(gate || {}), [char]: { passed } };
};

// Daftar level yang terbuka untuk 1 karakter (urut).
export const unlockedLevels = (gate, char) =>
  WRITE_LEVEL_ORDER.filter((lv) => isLevelUnlocked(gate, char, lv));
