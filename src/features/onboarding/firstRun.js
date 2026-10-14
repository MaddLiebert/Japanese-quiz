// firstRun.js — alur "pertama kali buka app" (MURNI, tanpa React/DOM).
//
// Keputusan pemilik (2026-10-14): user baru MEMILIH cara masuk DULU
// (Tamu / Email / Google), lalu nama panggilan ditanya BELAKANGAN.
// Google sengaja ikut di daftar tapi `enabled: false` — jujur terlihat, belum
// bisa diklik (butuh setup Google Cloud Console + Supabase, ditunda user).
//
// Ikon = KANJI GLYPH (aturan app: bukan emoji). Glyph dirender lewat
// `src/components/icons/Glyph.jsx`; nama glyph harus terdaftar di sana.

export const AUTH_METHODS = [
  {
    id: 'guest',
    kanji: '客',            // tamu
    glyph: 'user',
    enabled: true,
  },
  {
    id: 'email',
    kanji: '文',            // surat / tulisan
    glyph: 'mail',
    enabled: true,
  },
  {
    id: 'google',
    kanji: '雲',            // awan (cloud)
    glyph: 'cloud',
    enabled: false,         // butuh setup Google Cloud Console — ditunda
  },
];

// Metode yang benar-benar bisa dipilih sekarang.
export const availableMethods = () => AUTH_METHODS.filter((m) => m.enabled);

// Cari definisi metode; id tak dikenal → null (aman, tidak crash).
export const firstRunMethod = (id) =>
  AUTH_METHODS.find((m) => m.id === id) || null;

// Setelah memilih metode, langkah berikutnya:
//   'email' → tampilkan form email; selain itu → langsung tanya nama.
export const advanceAfterMethod = (id) => (id === 'email' ? 'email' : 'name');

// Langkah gate first-run yang HARUS tampil sekarang (null = tak ada gate).
//   '' + belum masuk  → 'method'  (pilih cara masuk)
//   '' + sudah masuk  → 'name'    (isi nama panggilan)
//   ada nama          → null      (selesai, masuk app)
export const firstRunStep = ({ username = '', isSignedIn = false } = {}) => {
  if (username) return null;
  return isSignedIn ? 'name' : 'method';
};

// Teks UI per metode (ID dasar + _en). Nada: ringkas, jujur, tanpa jargon.
const COPY = {
  guest: {
    id: {
      title: 'Tanpa Akun',
      desc: 'Langsung main — progres tersimpan di perangkat ini. Bisa bikin akun kapan saja.',
      cta: 'Mulai',
    },
    en: {
      title: 'No Account',
      desc: 'Play right away — progress stays on this device. Create an account anytime.',
      cta: 'Start',
    },
  },
  email: {
    id: {
      title: 'Masuk / Daftar',
      desc: 'Simpan progres ke akunmu — bisa dibuka di HP atau laptop lain.',
      cta: 'Masuk',
    },
    en: {
      title: 'Sign in / Sign up',
      desc: 'Save progress to your account — open it on another phone or laptop.',
      cta: 'Sign in',
    },
  },
  google: {
    id: {
      title: 'Google',
      desc: 'Belum aktif — perlu setup Google Cloud Console dulu.',
      cta: 'Belum tersedia',
    },
    en: {
      title: 'Google',
      desc: 'Not active yet — needs Google Cloud Console setup first.',
      cta: 'Not available',
    },
  },
};

// Copy metode sesuai bahasa UI ('id' → ID, selain itu → EN). id asing → null.
export const methodCopy = (id, language = 'id') =>
  COPY[id] ? COPY[id][language === 'id' ? 'id' : 'en'] : null;
