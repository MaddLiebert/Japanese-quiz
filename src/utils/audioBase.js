// ─────────────────────────────────────────────────────────────────────────────
// audioBase.js — resolusi path audio: lokal (/audio/…) ATAU Supabase Storage.
//
// Kenapa ada: 87 file MNN (165 MB) dulu ikut ke-deploy Vercel → tiap deployment
// ~181 MB → jatah Deployment Storage Hobby 10 GB cepat habis. Audio dipindah ke
// Supabase Storage; app memuatnya dari sana.
//
// Cara pakai: set env `VITE_AUDIO_BASE_URL` (mis.
// `https://<ref>.supabase.co/storage/v1/object/public/audio`).
//   • kosong  → path apa adanya (`/audio/x.mp3`) → dipakai di dev/offline.
//   • diisi   → `${base}/x.mp3` (segmen `/audio/` dilepas supaya tidak dobel).
//
// MURNI (tanpa DOM) → diuji `node --test`.
// ─────────────────────────────────────────────────────────────────────────────

export const AUDIO_PATH_PREFIX = '/audio/';

// Normalisasi base: buang garis miring di akhir.
export const normalizeBase = (base) => String(base || '').replace(/\/+$/, '');

// Encode tiap segmen path (nama file MNN punya spasi → perlu %20 di URL).
// Segmen yang sudah ter-encode (%xx) dibiarkan supaya tidak dobel-encode.
const encodeSegments = (rel) =>
  rel
    .split('/')
    .map((seg) => (/%(?:[0-9a-fA-F]{2})/.test(seg) ? seg : encodeURIComponent(seg)))
    .join('/');

// Ubah satu path audio → URL final.
//   resolveAudioUrl('/audio/01.mp3', 'https://x/audio') → 'https://x/audio/01.mp3'
//   resolveAudioUrl('/audio/01.mp3', '')              → '/audio/01.mp3'
export const resolveAudioUrl = (path, base = '') => {
  if (!path) return path;
  const b = normalizeBase(base);
  if (!b) return path;
  // Sudah absolut (http/https/data/blob) → jangan diutak-atik.
  if (/^(https?:)?\/\//i.test(path) || /^(data|blob):/i.test(path)) return path;
  const rel = path.startsWith(AUDIO_PATH_PREFIX)
    ? path.slice(AUDIO_PATH_PREFIX.length)
    : path.replace(/^\/+/, '');
  return `${b}/${encodeSegments(rel)}`;
};

// Baca base dari env Vite (aman kalau import.meta tidak ada — mis. tes node).
export const audioBaseFromEnv = () => {
  try {
    return normalizeBase(import.meta?.env?.VITE_AUDIO_BASE_URL || '');
  } catch {
    return '';
  }
};

export default resolveAudioUrl;
