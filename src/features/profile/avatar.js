// ─────────────────────────────────────────────────────────────────────────────
// avatar.js — foto profil. Bagian MURNI (validasi/initials/IO/crop-math) bisa
// dites via `node --test`; penggambaran canvas ada di AvatarCropModal.jsx.
//
// Foto disimpan sebagai data URL KECIL (di-crop persegi + resize ke 160px,
// JPEG q0.8, ~5–10 KB) di localStorage `user_avatar_v1` → ikut tersinkron ke
// cloud dan cukup ringan untuk ditampilkan di leaderboard.
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

// ── Crop (matematika murni, tanpa DOM — dites di avatar.test.js) ─────────────
// Gambar digambar sebesar `scale` (px layar per px asli) di dalam viewport
// persegi `view`. `offset` = posisi kiri-atas gambar relatif kiri-atas
// viewport; selalu <= 0 karena gambar wajib menutupi viewport (cover).
export const coverScale = (imgW, imgH, view) =>
  view / Math.max(1, Math.min(imgW, imgH));

export const clampCropOffset = ({ offsetX, offsetY, scale, imgW, imgH, view }) => ({
  offsetX: Math.min(0, Math.max(Math.min(0, view - imgW * scale), offsetX)),
  offsetY: Math.min(0, Math.max(Math.min(0, view - imgH * scale), offsetY)),
});

export const centerCropOffset = ({ scale, imgW, imgH, view }) =>
  clampCropOffset({
    offsetX: (view - imgW * scale) / 2,
    offsetY: (view - imgH * scale) / 2,
    scale, imgW, imgH, view,
  });

// Viewport (layar) → kotak crop di koordinat ASLI gambar: { sx, sy, size }.
export const cropRectFromView = ({ offsetX, offsetY, scale, imgW, imgH, view }) => {
  const o = clampCropOffset({ offsetX, offsetY, scale, imgW, imgH, view });
  const size = Math.max(1, Math.min(view / scale, imgW, imgH));
  return {
    sx: Math.min(Math.max(0, Math.round(-o.offsetX / scale)), Math.max(0, imgW - size)),
    sy: Math.min(Math.max(0, Math.round(-o.offsetY / scale)), Math.max(0, imgH - size)),
    size: Math.round(size),
  };
};

// ── DOM (browser-only) ──────────────────────────────────────────────────────
// Resolve { img, url }. URL objek TIDAK di-revoke di sini — dipakai sebagai
// src pratinjau di modal; pemanggil yang me-revoke saat unmount.
export const loadImageFromFile = (file) =>
  new Promise((resolve, reject) => {
    if (typeof document === 'undefined' || typeof Image === 'undefined') {
      reject(new Error('crop hanya di browser'));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('gagal memuat gambar')); };
    img.src = url;
  });

// Gambar `img` di-crop ke kotak `crop` (koordinat asli) lalu diperkecil ke
// maxDim persegi → data URL JPEG.
export const drawCroppedToDataURL = (img, crop, maxDim = AVATAR_MAX_DIM, quality = 0.8) => {
  const size = Math.max(1, Math.round(crop?.size || Math.min(img.width, img.height)));
  const sx = Math.min(Math.max(0, Math.round(crop?.sx || 0)), Math.max(0, img.width - size));
  const sy = Math.min(Math.max(0, Math.round(crop?.sy || 0)), Math.max(0, img.height - size));
  const canvas = document.createElement('canvas');
  canvas.width = Math.min(maxDim, size);
  canvas.height = canvas.width;
  canvas.getContext('2d').drawImage(img, sx, sy, size, size, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
};

export default readAvatar;
