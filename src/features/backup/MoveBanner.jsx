import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

// ─────────────────────────────────────────────────────────────────────────────
// MoveBanner.jsx — pemberitahuan "app pindah alamat" (migrasi domain).
//
// localStorage terikat ORIGIN: kalau app pindah domain, data user tidak ikut.
// Banner ini tampil HANYA di origin lama, mengarahkan user untuk (1) ekspor
// datanya lalu (2) buka alamat baru.
//
// Cara pakai: isi domain BARU di MOVE_TARGET (atau lewat env
// VITE_MOVE_NOTICE_TO). Daftar origin lama di LEGACY_HOSTS. Di origin baru,
// hostname tidak cocok → banner otomatis tidak muncul (tanpa perlu config).
//
// Kalau MOVE_TARGET kosong & LEGACY_HOSTS kosong → banner tidak pernah tampil.
// ─────────────────────────────────────────────────────────────────────────────

// Alamat baru yang dituju (domain Vercel stabil). Bisa ditimpa via env.
const MOVE_TARGET =
  import.meta.env.VITE_MOVE_NOTICE_TO ||
  'https://japanese-quiz-maddoharaa-7635s-projects.vercel.app';

// Origin lama yang harus menampilkan banner (hostname saja, tanpa protokol).
const LEGACY_HOSTS = ['japanese-quiz2222.vercel.app'];

const DISMISS_KEY = 'move_banner_dismissed_v1';

const isLegacyOrigin = () => {
  if (typeof location === 'undefined') return false;
  return LEGACY_HOSTS.includes(location.hostname);
};

export function MoveBanner() {
  const { language } = useLanguage();
  const id = language === 'id';
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
  });

  if (!MOVE_TARGET || !isLegacyOrigin() || dismissed) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* noop */ }
    setDismissed(true);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-ai text-kinari-light border-b-[3px] border-sumi">
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <span className="text-lg leading-none" aria-hidden="true">引</span>
        <p className="flex-1 text-[11px] sm:text-xs font-bold leading-snug">
          {id
            ? 'App ini sudah pindah ke alamat baru! Progresmu TIDAK ikut pindah otomatis — ekspor dulu di sini, lalu impor di alamat baru.'
            : 'This app has moved to a new address! Your progress does NOT move automatically — export it here first, then import at the new address.'}
        </p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            to="/settings"
            className="px-3 py-1.5 border-[2px] border-kinari-light font-bold text-[10px] uppercase tracking-widest hover:bg-kinari-light hover:text-ai transition-colors"
          >
            {id ? '1. Ekspor Data' : '1. Export Data'}
          </Link>
          <a
            href={MOVE_TARGET}
            className="px-3 py-1.5 border-[2px] border-kinari-light bg-kinari-light text-ai font-bold text-[10px] uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            {id ? '2. Buka App Baru →' : '2. Open New App →'}
          </a>
          <button
            type="button"
            onClick={dismiss}
            aria-label={id ? 'Tutup' : 'Dismiss'}
            className="px-2 py-1 text-kinari-light/70 hover:text-kinari-light font-black text-sm"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

export default MoveBanner;
