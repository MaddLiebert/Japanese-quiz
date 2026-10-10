// ─────────────────────────────────────────────────────────────────────────────
// ThemeAudioHost — penjaga BGM tema. Tidak merender apa pun.
//
//   • Saat preferensi BGM ON → bunyikan BGM era aktif (kalau audio sudah
//     di-unlock gesture). Saat era berubah → crossfade ke BGM era baru.
//   • Saat OFF → hentikan.
//   • Mendengar event `theme-bgm-changed` dari Pengaturan supaya toggle
//     langsung bereaksi tanpa context React global.
//
// Default OFF (spec §9 R5). Autoplay policy dihormati: kalau context belum
// 'running', `unlockThemeAudio` menunggu gesture pertama, lalu mulai.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef } from 'react';
import { useEra } from './EraContext';
import { useUserStats } from '../progress/ProgressContext';
import { franchiseNuance } from '../anime/franchises';
import {
  THEME_BGM_EVENT, themeBgmEnabled, unlockThemeAudio,
  startThemeBgm, stopThemeBgm, setThemeBgmVolume,
} from './themeAudio';

export function ThemeAudioHost() {
  const { era } = useEra();
  const { progress } = useUserStats();
  // Nuansa dunia aktif (LAPIS 2b) → ambience khas dunia (mis. 呪力 saat JJK).
  const nuance = era === 'anime' ? franchiseNuance(progress?.activeFranchise) : null;
  const eraRef = useRef(era);
  eraRef.current = era;
  const nuanceRef = useRef(nuance);
  nuanceRef.current = nuance;

  // BGM ON/OFF mengikuti era + preferensi (persist).
  useEffect(() => {
    const cleanup = unlockThemeAudio(() => {
      if (themeBgmEnabled()) startThemeBgm(eraRef.current, nuanceRef.current);
    });
    if (themeBgmEnabled()) startThemeBgm(era, nuance);
    else stopThemeBgm();
    return cleanup;
  }, [era, nuance]);

  // Toggle / volume dari Pengaturan → langsung bereaksi (sinkronkan era terbaru).
  useEffect(() => {
    const onChanged = (e) => {
      const d = e?.detail || {};
      if (typeof d.volume === 'number') setThemeBgmVolume(d.volume, { silent: true });
      if (d.enabled === true) startThemeBgm(eraRef.current, nuanceRef.current);
      else if (d.enabled === false) stopThemeBgm();
    };
    window.addEventListener(THEME_BGM_EVENT, onChanged);
    return () => window.removeEventListener(THEME_BGM_EVENT, onChanged);
  }, []);

  return null;
}
