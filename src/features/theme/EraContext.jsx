// EraContext — era tema aktif. Sumber level: ProgressContext (useUserStats).
// Menulis `data-era` ke <html> → semua token CSS [data-era="..."] aktif.
// Lihat PRD: docs/tema/heian.md §12 T2.
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useUserStats } from '../progress/ProgressContext';
import {
  DEFAULT_ERA, getEra, eraForLevel, isEraUnlocked, unlockedEras, nextEra,
} from './eras';

const EraContext = createContext(null);

export const EraProvider = ({ children }) => {
  const { progress } = useUserStats();
  const level = progress?.level || 1;

  const [era, setEraState] = useState(() => {
    const saved = localStorage.getItem('app_era');
    return saved && getEra(saved) ? saved : DEFAULT_ERA;
  });

  // Era tersimpan yang belum terbuka (mis. main di HP lain) → naik ke era level.
  useEffect(() => {
    if (!isEraUnlocked(era, level)) {
      const auto = eraForLevel(level).id;
      setEraState(auto);
      localStorage.setItem('app_era', auto);
    }
  }, [era, level]);

  useEffect(() => {
    document.documentElement.setAttribute('data-era', era);
    localStorage.setItem('app_era', era);
  }, [era]);

  // Ganti era manual — hanya kalau sudah terbuka. Return boolean sukses.
  const setEra = (id) => {
    if (!isEraUnlocked(id, level)) return false;
    setEraState(id);
    return true;
  };

  const value = useMemo(() => ({
    era,
    eraMeta: getEra(era),
    setEra,
    unlocked: unlockedEras(level),
    next: nextEra(level),
    level,
  }), [era, level]);

  return <EraContext.Provider value={value}>{children}</EraContext.Provider>;
};

export const useEra = () => {
  const ctx = useContext(EraContext);
  if (!ctx) throw new Error('useEra must be used within an EraProvider');
  return ctx;
};
