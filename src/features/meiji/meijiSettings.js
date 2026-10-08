// meijiSettings.js — preferensi efek Meiji (glitch / napas / 号外).
// Default KONSERVATIF (risiko R2): efek hidup tapi tidak mengganggu. Semua bisa
// dimatikan di Pengaturan. Modul murni-ish (akses localStorage dijaga `typeof`).
// Spec: docs/tema/meiji-mekanik.md §M9, §M10, §M15, R2.

export const MEIJI_SETTINGS_KEY = 'app_meiji_settings_v1';

// Default: glitch & napas AKTIF (halus), 号外 AKTIF (maks 1×/hari).
export const MEIJI_DEFAULTS = {
  glitch: true,     // M9 — kedip cyberpunk di era Meiji
  breathing: true,  // M15 — app bernapas saat idle
  gogo: true,       // M10 — edisi 号外 larut malam (00–04)
};

const hasStorage = () => typeof localStorage !== 'undefined';

export const readMeijiSettings = () => {
  if (!hasStorage()) return { ...MEIJI_DEFAULTS };
  try {
    const raw = localStorage.getItem(MEIJI_SETTINGS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { ...MEIJI_DEFAULTS };
    return { ...MEIJI_DEFAULTS, ...parsed };
  } catch {
    return { ...MEIJI_DEFAULTS };
  }
};

export const writeMeijiSettings = (patch = {}) => {
  const next = { ...readMeijiSettings(), ...patch };
  if (hasStorage()) {
    try { localStorage.setItem(MEIJI_SETTINGS_KEY, JSON.stringify(next)); } catch { /* penuh/diblokir → abaikan */ }
  }
  return next;
};

export const meijiEffectEnabled = (key) => Boolean(readMeijiSettings()[key]);
