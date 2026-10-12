// ─────────────────────────────────────────────────────────────────────────────
// syncStore.js — baca/tulis "bundle" sync ke localStorage. MURNI (tanpa React);
// `storage` disuntik (default localStorage) supaya bisa dites via `node --test`.
//
// Bundle = kumpulan key yang mau disinkronkan ke cloud:
//   username, user_progress_v2, item_progress_v2, achievements_unlocked_v2,
//   selected_badges.
// Ditambah metadata lokal (TIDAK dikirim sebagai data): sync_meta_v1 = { updatedAt, deviceId }.
// ─────────────────────────────────────────────────────────────────────────────

export const SYNC_VERSION = 1;

export const SYNC_KEYS = {
  username: 'username',
  progress: 'user_progress_v2',
  itemProgress: 'item_progress_v2',
  achievements: 'achievements_unlocked_v2',
  selectedBadges: 'selected_badges',
  avatar: 'user_avatar_v1',
};

// Daftar key localStorage yang perubahannya memicu push (untuk storageBus).
export const SYNCED_KEYS = Object.values(SYNC_KEYS);

export const META_KEY = 'sync_meta_v1';
export const DEVICE_KEY = 'sync_device_id_v1';
export const ENABLED_KEY = 'sync_enabled_v1';

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

const newId = () => {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* noop */
  }
  return `dev_${Math.random().toString(36).slice(2)}_${Date.now()}`;
};

export const emptyBundle = () => ({
  version: SYNC_VERSION,
  username: '',
  progress: {},
  itemProgress: {},
  achievements: [],
  selectedBadges: [],
  avatar: '',
  updatedAt: 0,
  deviceId: '',
});

export const readMeta = (storage = defaultStorage()) => {
  if (!storage) return { updatedAt: 0, deviceId: '' };
  const m = safeParse(storage.getItem(META_KEY), {});
  return { updatedAt: Number(m.updatedAt) || 0, deviceId: m.deviceId || '' };
};

export const ensureDeviceId = (storage = defaultStorage()) => {
  if (!storage) return '';
  let id = storage.getItem(DEVICE_KEY);
  if (!id) {
    id = newId();
    storage.setItem(DEVICE_KEY, id);
  }
  return id;
};

// Bump `updatedAt` (dipakai saat ada perubahan lokal) — tanpa menyentuh key sync.
export const touchMeta = (storage = defaultStorage(), now = Date.now()) => {
  if (!storage) return { updatedAt: now, deviceId: '' };
  const deviceId = ensureDeviceId(storage);
  storage.setItem(META_KEY, JSON.stringify({ updatedAt: now, deviceId }));
  return { updatedAt: now, deviceId };
};

export const readBundle = (storage = defaultStorage()) => {
  if (!storage) return emptyBundle();
  const meta = readMeta(storage);
  return {
    version: SYNC_VERSION,
    // username disimpan sebagai string MENTAH (bukan JSON) oleh ProgressContext.
    username: storage.getItem(SYNC_KEYS.username) || '',
    progress: safeParse(storage.getItem(SYNC_KEYS.progress), {}),
    itemProgress: safeParse(storage.getItem(SYNC_KEYS.itemProgress), {}),
    achievements: safeParse(storage.getItem(SYNC_KEYS.achievements), []),
    selectedBadges: safeParse(storage.getItem(SYNC_KEYS.selectedBadges), []),
    // avatar disimpan sebagai data URL MENTAH (bukan JSON) — sama seperti username.
    avatar: storage.getItem(SYNC_KEYS.avatar) || '',
    updatedAt: meta.updatedAt,
    deviceId: meta.deviceId || ensureDeviceId(storage),
  };
};

// Tulis bundle ke localStorage (username mentah; sisanya JSON). TIDAK mengubah meta.
export const writeBundle = (storage = defaultStorage(), bundle = {}) => {
  if (!storage) return;
  storage.setItem(SYNC_KEYS.username, bundle.username || '');
  storage.setItem(SYNC_KEYS.progress, JSON.stringify(bundle.progress ?? {}));
  storage.setItem(SYNC_KEYS.itemProgress, JSON.stringify(bundle.itemProgress ?? {}));
  storage.setItem(SYNC_KEYS.achievements, JSON.stringify(bundle.achievements ?? []));
  storage.setItem(SYNC_KEYS.selectedBadges, JSON.stringify(bundle.selectedBadges ?? []));
  storage.setItem(SYNC_KEYS.avatar, bundle.avatar || '');
};

// Payload untuk tabel `profiles` (denormalisasi skor + bundle JSONB).
export const bundleToProfile = (bundle = {}, userId) => {
  const p = bundle.progress || {};
  return {
    id: userId,
    display_name: (bundle.username || '').trim() || '旅人',
    xp: Number(p.xp) || 0,
    level: Number(p.level) || 1,
    streak: Number(p.streak) || 0,
    max_streak: Number(p.maxStreak) || 0,
    accuracy: Number(p.accuracy) || 0,
    total_answered: Number(p.totalAnswered) || 0,
    updated_at: new Date(Number(bundle.updatedAt) || Date.now()).toISOString(),
    avatar: bundle.avatar || '',
    data: {
      version: bundle.version || SYNC_VERSION,
      username: bundle.username || '',
      progress: bundle.progress || {},
      itemProgress: bundle.itemProgress || {},
      achievements: bundle.achievements || [],
      selectedBadges: bundle.selectedBadges || [],
      // Avatar TIDAK diduplikasi di sini — cukup di kolom `avatar` (payload &
      // baris DB jadi separuh; data URL ~5–10 KB tidak dikirim dua kali).
    },
  };
};

// Kebalikan: baris `profiles` → bundle.
export const profileToBundle = (row = {}) => {
  const d = row.data || {};
  const updatedAt = row.updated_at ? Date.parse(row.updated_at) : 0;
  return {
    version: d.version || SYNC_VERSION,
    username: d.username || row.display_name || '',
    progress: d.progress || {},
    itemProgress: d.itemProgress || {},
    achievements: Array.isArray(d.achievements) ? d.achievements : [],
    selectedBadges: Array.isArray(d.selectedBadges) ? d.selectedBadges : [],
    avatar: row.avatar || d.avatar || '',
    updatedAt: Number.isFinite(updatedAt) ? updatedAt : 0,
    deviceId: '',
  };
};

export default readBundle;
