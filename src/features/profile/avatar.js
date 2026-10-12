// ─────────────────────────────────────────────────────────────────────────────
// avatar.js — foto profil. Bagian MURNI (validasi/initials/IO) bisa dites via
// `node --test`; `resizeImageToDataURL` hanya jalan di browser (canvas).
//
// Foto disimpan sebagai data URL KECIL (di-resize ke maks 160px, JPEG q0.8,
// ~5–10 KB) di localStorage `user_avatar_v1` → ikut tersinkron ke cloud dan
// cukup ringan untuk ditampilkan di leaderboard.
// ─────────────────────────────────────────────────────────────────────────────

export const AVATAR_KEY = 'user_avatar_v1';
export const AVATAR_MAX_DIM = 160;                  // px, sisi terpanjang
export const AVATAR_MAX_UPLOAD = 8 * 1024 * 1024;  // 8 MB batas file mentah
export const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

const defaultStorage = () => (typeof localStorage !== 'undefined' ? localStorage : null);

// Validasi file sebelum diproses. Return { ok, reason }.
export const isValidAvatarFile = (file) => {
  if (!file) return { ok: false, reason: 'empty' };
  if (!AVATAR_TYPES.includes(file.type)) return { ok: false, reason: 'type' };
  if (Number(file.size) > AVATAR_MAX_UPLOAD) return { ok: false, reason: 'size' };
  return { ok: true };
};

// Inisial untuk fallback (kalau belum ada foto). Ambil maks 2 karakter.
export const initials = (name) => {
  const s = String(name ?? '').trim();
  if (!s) return '旅';
  return s.slice(0, 2).toUpperCase();
};

export const readAvatar = (storage = defaultStorage()) => (storage ? storage.getItem(AVATAR_KEY) || '' : '');

export const writeAvatar = (storage = defaultStorage(), dataUrl) => {
  if (storage) storage.setItem(AVATAR_KEY, dataUrl || '');
};

export const clearAvatar = (storage = defaultStorage()) => {
  if (storage) storage.removeItem(AVATAR_KEY);
};

// Resize gambar → data URL JPEG kecil. Browser-only (pakai canvas/Image).
export const resizeImageToDataURL = (file, maxDim = AVATAR_MAX_DIM, quality = 0.8) =>
  new Promise((resolve, reject) => {
    if (typeof document === 'undefined' || typeof Image === 'undefined') {
      reject(new Error('resize hanya di browser'));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        URL.revokeObjectURL(url);
        resolve(dataUrl);
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('gagal memuat gambar'));
    };
    img.src = url;
  });

export default readAvatar;
