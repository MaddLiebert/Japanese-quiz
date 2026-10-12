// ─────────────────────────────────────────────────────────────────────────────
// backup.js — ekspor/impor data lokal (JSON) untuk MIGRASI antar-origin.
//
// Kenapa ada: localStorage terikat ke ORIGIN. Kalau app pindah domain/project
// Vercel (mis. japanese-quiz2222 → japanese-quiz-*.vercel.app), semua progres
// user "hilang" karena origin baru = storage kosong. Modul ini menyediakan
// jalur resmi: EKSPOR data ke satu file JSON → IMPOR di origin baru.
//
// MURNI: tanpa React, tanpa DOM, tanpa akses localStorage langsung —
// `storage` disuntik (default localStorage) supaya bisa dites `node --test`.
//
// Prinsip keamanan:
//   • Hanya key dalam BACKUP_KEYS yang dibaca/ditulis (allowlist).
//   • Key rahasia/transient/per-device TIDAK pernah masuk file (lihat EXCLUDED).
//     Khususnya token sesi Supabase (`sb-*-auth-token`) — jangan pernah bocor.
//   • Saat impor, key di luar allowlist DITOLAK (tidak mungkin menulis key liar).
// ─────────────────────────────────────────────────────────────────────────────

export const BACKUP_APP = 'nihongo-gakuen';
export const BACKUP_VERSION = 1;

// Key data pengguna yang IKUT ke backup (urutan = urutan tulis saat impor).
// Semua nilai disimpan sebagai STRING mentah (persis isi localStorage).
export const BACKUP_KEYS = [
  'username',
  'user_bio',
  'user_avatar_v1',
  'user_progress_v2',
  'item_progress_v2',
  'achievements_unlocked_v2',
  'selected_badges',
  'app_era',
  'app_theme',
  'ui_language',
  'app_meiji_settings_v1',
  'app_gogo_v1',
  'app_koseki_v1',
  'app_companion_v1',
  'app_theme_bgm',
  'app_theme_bgm_volume',
  'write_gate_v1',
  'chapterProgress',
  'sync_meta_v1',
];

// Key yang SENGAJA TIDAK diekspor:
//   sync_device_id_v1      → identitas perangkat (biar tiap perangkat punya sendiri)
//   net_quota_v1           → kuota harian perangkat (jangan dipindah)
//   sync_reload_guard_v1   → guard anti reload-loop (transient)
//   sync_enabled_v1        → preferensi sinkron (auto-aktif kalau ada data)
//   sync_was_signed_in_v1  → flag sesi (transient)
//   sb-*-auth-token        → TOKEN SESI Supabase (rahasia, terikat origin)
export const EXCLUDED_KEYS = [
  'sync_device_id_v1',
  'net_quota_v1',
  'sync_reload_guard_v1',
  'sync_enabled_v1',
  'sync_was_signed_in_v1',
];

const defaultStorage = () =>
  typeof localStorage !== 'undefined' ? localStorage : null;

const safeParse = (raw, fallback) => {
  if (raw == null || raw === '') return fallback;
  try {
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
};

// Kumpulkan data dari storage → objek backup.
export const buildBackup = (storage = defaultStorage(), opts = {}) => {
  if (!storage) return null;
  const keys = {};
  for (const k of BACKUP_KEYS) {
    const v = storage.getItem(k);
    if (v != null) keys[k] = v;
  }
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: new Date(opts.now ?? Date.now()).toISOString(),
    origin: opts.origin || (typeof location !== 'undefined' ? location.origin : ''),
    keys,
  };
};

// Backup → teks JSON (pretty, biar bisa diperiksa manusia).
export const serializeBackup = (backup) => JSON.stringify(backup, null, 2);

// Validasi objek backup. Return { ok, error, backup }.
export const validateBackup = (obj) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return { ok: false, error: 'NOT_OBJECT' };
  }
  if (obj.app !== BACKUP_APP) return { ok: false, error: 'WRONG_APP' };
  if (!Number.isInteger(obj.version) || obj.version < 1 || obj.version > BACKUP_VERSION) {
    return { ok: false, error: 'UNSUPPORTED_VERSION' };
  }
  if (!obj.keys || typeof obj.keys !== 'object' || Array.isArray(obj.keys)) {
    return { ok: false, error: 'NO_KEYS' };
  }
  // Ambil HANYA key yang diizinkan & bernilai string (allowlist ketat).
  const keys = {};
  for (const k of BACKUP_KEYS) {
    if (typeof obj.keys[k] === 'string') keys[k] = obj.keys[k];
  }
  if (Object.keys(keys).length === 0) return { ok: false, error: 'EMPTY_BACKUP' };
  return {
    ok: true,
    backup: {
      app: BACKUP_APP,
      version: obj.version,
      exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : '',
      origin: typeof obj.origin === 'string' ? obj.origin : '',
      keys,
    },
  };
};

// Teks JSON (dari file / tempel) → { ok, error, backup }.
export const parseBackup = (text) => {
  if (typeof text !== 'string' || !text.trim()) return { ok: false, error: 'EMPTY' };
  let obj;
  try {
    obj = JSON.parse(text);
  } catch {
    return { ok: false, error: 'INVALID_JSON' };
  }
  return validateBackup(obj);
};

// Ringkasan isi backup untuk ditampilkan sebelum impor.
export const backupSummary = (backup) => {
  const keys = (backup && backup.keys) || {};
  const progress = safeParse(keys.user_progress_v2, {});
  return {
    hasProgress: typeof keys.user_progress_v2 === 'string',
    username: keys.username || progress.username || '',
    xp: Number(progress.xp) || 0,
    level: Number(progress.level) || 1,
    streak: Number(progress.streak) || 0,
    exportedAt: (backup && backup.exportedAt) || '',
    origin: (backup && backup.origin) || '',
    keyCount: Object.keys(keys).length,
  };
};

// Tulis backup ke storage. mode:
//   'overwrite' (default) → timpa semua key yang ada di backup
//   'fill'                → hanya tulis key yang BELUM ada di storage
// Return jumlah key yang benar-benar ditulis.
export const applyBackup = (storage = defaultStorage(), backup, mode = 'overwrite') => {
  if (!storage || !backup || !backup.keys) return 0;
  let written = 0;
  for (const k of BACKUP_KEYS) {
    const v = backup.keys[k];
    if (typeof v !== 'string') continue; // allowlist + tipe
    if (mode === 'fill' && storage.getItem(k) != null) continue;
    storage.setItem(k, v);
    written += 1;
  }
  return written;
};

export default buildBackup;
