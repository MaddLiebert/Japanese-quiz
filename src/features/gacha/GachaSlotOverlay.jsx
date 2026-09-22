import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { PACK_RARITY, getPack } from "../packs/packs";
import { useLanguage } from "../../context/LanguageContext";
import { playReelTick, playFanfare } from "../../utils/sfx";
import {
  REEL_COUNT,
  REEL_MS,
  TICK_MS,
  REEL_EASE,
  REEL_FADE,
  buildStrips,
  reelTargetIcons,
  maxRarity,
} from "./slot";

const ITEM_H = 120; // px — tinggi satu sel reel

const RARITY_STYLE = {
  common:    { bg: 'bg-kinari-light', text: 'text-sumi',         border: 'border-sumi' },
  rare:      { bg: 'bg-ai',           text: 'text-kinari-light', border: 'border-sumi' },
  legendary: { bg: 'bg-shu',          text: 'text-kinari-light', border: 'border-sumi' },
};

const iconOf = (r) => getPack(r?.id)?.icon || '📦';
const rarityOf = (r) => getPack(r?.id)?.rarity || 'common';

// Cek sekali: user minta animasi dikurangi?
const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function GachaSlotOverlay({ result, onClose }) {
  const { language } = useLanguage();
  const id = language === 'id';

  const results = useMemo(() => result?.results || [], [result]);
  const rarity = useMemo(() => maxRarity(results.map(rarityOf)), [results]);

  // reduced-motion → langsung "selesai", tanpa animasi & tanpa suara.
  const [reduced] = useState(prefersReduced);

  const strips = useMemo(
    () => buildStrips(reelTargetIcons(results, iconOf)),
    [results]
  );

  // Berapa reel yang sudah berhenti.
  const [stopped, setStopped] = useState(() => (reduced ? REEL_COUNT : 0));
  const [revealed, setRevealed] = useState(reduced);

  const allStopped = stopped >= REEL_COUNT;

  // Bunyi tick selama masih ada reel yang muter.
  useEffect(() => {
    if (reduced || allStopped) return;
    const t = setInterval(playReelTick, TICK_MS);
    return () => clearInterval(t);
  }, [reduced, allStopped]);

  // Fanfare saat semua reel berhenti, lalu buka hasil.
  useEffect(() => {
    if (reduced || !allStopped) return;
    playFanfare(rarity);
    const t = setTimeout(() => setRevealed(true), 700);
    return () => clearTimeout(t);
  }, [reduced, allStopped, rarity]);

  // Tombol Esc untuk tutup (kapan saja — konsisten dengan tombol ✕).
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const skip = () => { setStopped(REEL_COUNT); setRevealed(true); };

  const overlay = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-sumi/90 flex items-center justify-center p-3 sm:p-6"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-kinari-light border-[4px] border-sumi shadow-[10px_10px_0_0_#1a1a1a] w-full max-w-3xl max-h-[92vh] overflow-y-auto relative"
      >
        {/* Tombol tutup */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-9 h-9 border-[3px] border-sumi bg-kinari-light font-black text-lg shadow-[3px_3px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#1a1a1a] transition-all"
          title={id ? 'Tutup' : 'Close'}
        >
          ✕
        </button>

        {/* Header */}
        <div className="p-5 sm:p-8 border-b-[4px] border-sumi bg-shu text-kinari-light relative overflow-hidden">
          <div className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 text-[8rem] font-serif opacity-[0.08] pointer-events-none select-none leading-none">
            玉
          </div>
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-80">
            {id ? 'Mesin Keberuntungan' : 'Fortune Machine'}
          </span>
          <h2 className="text-2xl sm:text-4xl font-serif font-black mt-1">
            🎰 {id ? 'Gashapon Berkarat' : 'Rusty Gashapon'}
          </h2>
          <p className="text-xs font-bold mt-1 opacity-90">
            {results.length}x · refund {result?.refunded ?? 0} 🪙
          </p>
        </div>

        {/* Reel */}
        <div className="p-4 sm:p-8 bg-ai/10">
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {strips.map((strip, i) => (
              <div
                key={i}
                className="border-[4px] border-sumi bg-kinari-light overflow-hidden relative"
                style={{ height: ITEM_H }}
              >
                <motion.div
                  initial={{ y: 0 }}
                  animate={{ y: -(strip.length - 1) * ITEM_H }}
                  transition={
                    reduced
                      ? { duration: 0 }
                      : { duration: REEL_MS[i] / 1000, ease: REEL_EASE }
                  }
                  style={{ willChange: 'transform' }}
                  onAnimationComplete={() => setStopped((s) => Math.max(s, i + 1))}
                >
                  {strip.map((sym, j) => (
                    <div
                      key={j}
                      className="flex items-center justify-center text-5xl sm:text-6xl select-none"
                      style={{ height: ITEM_H }}
                    >
                      {sym}
                    </div>
                  ))}
                </motion.div>
                {/* fade tepi: kesan kedalaman/kecepatan tanpa filter blur (mahal) */}
                <div
                  className="absolute inset-x-0 top-0 pointer-events-none"
                  style={{ height: REEL_FADE, background: 'linear-gradient(to bottom, var(--kinari-light-val), transparent)' }}
                />
                <div
                  className="absolute inset-x-0 bottom-0 pointer-events-none"
                  style={{ height: REEL_FADE, background: 'linear-gradient(to top, var(--kinari-light-val), transparent)' }}
                />
                {/* garis tengah (payline) */}
                <div className="absolute inset-x-0 top-1/2 h-[3px] bg-shu/60 -translate-y-1/2 pointer-events-none" />
              </div>
            ))}
          </div>

          {!allStopped && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={skip}
                className="px-5 py-2 border-[3px] border-sumi bg-kinari-light font-black text-xs uppercase tracking-widest shadow-[3px_3px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#1a1a1a] transition-all"
              >
                {id ? '⏩ Lewati' : '⏩ Skip'}
              </button>
            </div>
          )}
        </div>

        {/* Hasil */}
        {revealed && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 sm:p-8"
          >
            <h3 className="text-xl font-serif font-black text-sumi mb-4">
              {id ? 'Hasil Tarikan' : 'Pull Result'}
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {results.map((p, i) => {
                const pack = getPack(p.id);
                const st = RARITY_STYLE[pack?.rarity] || RARITY_STYLE.common;
                return (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className={`${st.bg} ${st.text} border-[3px] border-sumi px-4 py-3 flex items-center gap-3`}
                  >
                    <span className="text-2xl">{pack?.icon || '📦'}</span>
                    <span className="font-black flex-grow">{pack?.name || p.id}</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.15em]">
                      {PACK_RARITY[pack?.rarity]?.label || 'COMMON'}
                    </span>
                    {!p.isNew && (
                      <span className="text-[10px] font-black bg-sumi text-kinari-light px-2 py-1">
                        DUP +50
                      </span>
                    )}
                  </motion.li>
                );
              })}
            </ul>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-ai text-kinari-light font-black border-4 border-sumi shadow-[4px_4px_0_0_#1a1a1a] active:translate-y-1 active:shadow-none transition-all"
            >
              {id ? 'TUTUP' : 'CLOSE'}
            </button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );

  // Portal ke body: parent Shop pakai motion.div ber-transform, sehingga
  // `position: fixed` bisa terkurung di dalamnya kalau tidak di-portal.
  return typeof document === 'undefined' ? overlay : createPortal(overlay, document.body);
}

export default GachaSlotOverlay;
