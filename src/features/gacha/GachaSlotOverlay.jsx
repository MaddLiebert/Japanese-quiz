import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { PACK_RARITY, getPack } from "../packs/packs";
import { packPalette, accentInk } from "../packs/rarityStyle";
import { useLanguage } from "../../context/LanguageContext";
import { useEra } from "../theme/EraContext";
import { Glyph } from "../../components/icons/Glyph";
import { MedaruCoin } from "../../components/MedaruCoin";
import { playReelTick, playFanfare } from "../../utils/sfx";
import { gachaCopy, isHeian } from "./heianCopy";
import {
  REEL_COUNT,
  REEL_MS,
  TICK_MS,
  REEL_EASE,
  REEL_FADE,
  buildStrips,
  reelTargetIcons,
  maxRarity,
  HEIAN_SHELL_PAIRS,
  HEIAN_SHELL_MS,
  HEIAN_SHELL_TICK_MS,
  HEIAN_SHELL_EASE,
  HEIAN_SHELL_FADE,
  buildShellStrips,
} from "./slot";

const ITEM_H = 120; // px — tinggi satu sel reel (era lain)
const SHELL_H = 96; // px — tinggi jendela satu keping kerang (Heian)

const iconOf = (r) => getPack(r?.id)?.icon || 'coin';
const rarityOf = (r) => getPack(r?.id)?.rarity || 'common';

// Cek sekali: user minta animasi dikurangi?
const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Papan 貝合わせ (Heian): 3 pasang kerang, tiap pasangan berhenti bersamaan ─
// Dua keping dalam satu pasangan menampilkan hasil yang SAMA → itulah "mencocokkan".
// Kana 貝 (かい) = lapisan belajar; tema Heian tidak menyentuh era lain.
function KaiAwaseBoard({ strips, stopped, reduced, onPairStopped }) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      {Array.from({ length: HEIAN_SHELL_PAIRS }, (_, p) => {
        const isStopped = stopped > p;
        return (
          <div key={p} className="heian-shell-pair">
            {[0, 1].map((half) => {
              const strip = strips[p * 2 + half];
              return (
                <div key={half} className="heian-shell">
                  <div className="heian-shell-window" style={{ height: SHELL_H }}>
                    <motion.div
                      initial={{ y: 0 }}
                      animate={{ y: -(strip.length - 1) * SHELL_H }}
                      transition={
                        reduced
                          ? { duration: 0 }
                          : { duration: HEIAN_SHELL_MS[p] / 1000, ease: HEIAN_SHELL_EASE }
                      }
                      style={{ willChange: 'transform' }}
                      onAnimationComplete={() => onPairStopped(p)}
                    >
                      {strip.map((sym, j) => (
                        <div
                          key={j}
                          className="flex items-center justify-center select-none text-sumi"
                          style={{ height: SHELL_H }}
                        >
                          <Glyph name={sym} size={38} />
                        </div>
                      ))}
                    </motion.div>
                    <div
                      className="absolute inset-x-0 top-0 pointer-events-none"
                      style={{ height: HEIAN_SHELL_FADE, background: 'linear-gradient(to bottom, var(--kinari-light-val), transparent)' }}
                    />
                    <div
                      className="absolute inset-x-0 bottom-0 pointer-events-none"
                      style={{ height: HEIAN_SHELL_FADE, background: 'linear-gradient(to top, var(--kinari-light-val), transparent)' }}
                    />
                  </div>
                  <div className={`heian-shell-lid ${isStopped ? 'is-settled' : ''}`} />
                </div>
              );
            })}
            <span className="heian-shell-seal" aria-hidden="true">かい</span>
          </div>
        );
      })}
    </div>
  );
}

export function GachaSlotOverlay({ result, onClose }) {
  const { language } = useLanguage();
  const { era } = useEra();
  const heian = isHeian(era);
  const T = useMemo(() => gachaCopy(era, language), [era, language]);

  const results = useMemo(() => result?.results || [], [result]);
  const rarity = useMemo(() => maxRarity(results.map(rarityOf)), [results]);

  // reduced-motion → langsung "selesai", tanpa animasi & tanpa suara.
  const [reduced] = useState(prefersReduced);

  // Reel (era lain) — 3 strip simbol.
  const strips = useMemo(
    () => buildStrips(reelTargetIcons(results, iconOf)),
    [results]
  );

  // Kerang (Heian) — 3 pasang = 6 keping; tiap pasang satu target.
  const shellStrips = useMemo(() => {
    if (!heian) return [];
    const pairs = Array.from(
      { length: HEIAN_SHELL_PAIRS },
      (_, i) => iconOf(results[i % (results.length || 1)])
    );
    return buildShellStrips(pairs);
  }, [heian, results]);

  // Berapa reel / pasangan kerang yang sudah berhenti.
  const [stopped, setStopped] = useState(
    () => (reduced ? (heian ? HEIAN_SHELL_PAIRS : REEL_COUNT) : 0)
  );
  const [revealed, setRevealed] = useState(reduced);

  const allStopped = heian ? stopped >= HEIAN_SHELL_PAIRS : stopped >= REEL_COUNT;

  // Bunyi tick selama masih ada reel/pasangan yang muter.
  useEffect(() => {
    if (reduced || allStopped) return;
    const t = setInterval(playReelTick, heian ? HEIAN_SHELL_TICK_MS : TICK_MS);
    return () => clearInterval(t);
  }, [reduced, allStopped, heian]);

  // Fanfare saat semua berhenti, lalu buka hasil.
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

  const skip = () => {
    setStopped(heian ? HEIAN_SHELL_PAIRS : REEL_COUNT);
    setRevealed(true);
  };

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
          title={T.close}
        >
          ✕
        </button>

        {/* Header */}
        <div className={`p-5 sm:p-8 border-b-[4px] border-sumi relative overflow-hidden ${heian ? 'heian-kai-head' : 'bg-shu text-kinari-light'}`}>
          <div className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 text-[8rem] font-serif opacity-[0.08] pointer-events-none select-none leading-none">
            {T.watermark}
          </div>
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-80">
            {T.kicker}
          </span>
          <h2 className="text-2xl sm:text-4xl font-serif font-black mt-1">
            <Glyph name={heian ? 'shell' : 'gacha'} className="mr-2" />{T.title}
          </h2>
          {T.titleSub && (
            <p className="text-[11px] font-bold mt-1 opacity-70 tracking-wider">{T.titleSub}</p>
          )}
          <p className="text-xs font-bold mt-1 opacity-90">
            {results.length}x · refund {result?.refunded ?? 0} <MedaruCoin className="ml-1" />
          </p>
        </div>

        {/* Papan: 貝合わせ (Heian) atau reel slot (era lain) */}
        <div className={`p-4 sm:p-8 ${heian ? 'heian-kai-board' : 'bg-ai/10'}`}>
          {heian ? (
            <KaiAwaseBoard
              strips={shellStrips}
              stopped={stopped}
              reduced={reduced}
              onPairStopped={(p) => setStopped((s) => Math.max(s, p + 1))}
            />
          ) : (
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
                        className="flex items-center justify-center select-none text-sumi"
                        style={{ height: ITEM_H }}
                      >
                        <Glyph name={sym} size={44} />
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
          )}

          {!allStopped && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={skip}
                className="px-5 py-2 border-[3px] border-sumi bg-kinari-light font-black text-xs uppercase tracking-widest shadow-[3px_3px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#1a1a1a] transition-all"
              >
                {T.skip}
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
              {T.resultTitle}
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {results.map((p, i) => {
                const pack = getPack(p.id);
                const pal = packPalette(pack?.visual);
                return (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-[3px] border-sumi px-4 py-3 flex items-center gap-3"
                    style={{ background: pal.deep, color: '#fdfcf9' }}
                  >
                    <span className="text-kinari-light"><Glyph name={pack?.icon || 'coin'} size={24} /></span>
                    <span className="font-black flex-grow">{pack?.name || p.id}</span>
                    <span
                      className="text-[10px] font-black uppercase tracking-[0.15em] px-1.5 py-0.5"
                      style={{ background: pal.accent, color: accentInk(pal.accent) }}
                    >
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
              {T.close}
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
