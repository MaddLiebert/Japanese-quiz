import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useUserStats, getRank } from "../progress/ProgressContext";
import { useLanguage } from "../../context/LanguageContext";
import { SHOP_ITEMS } from "../items/items";
import { gachaPoolInfo, PACK_RARITY } from "../packs/packs";
import { GachaSlotOverlay } from "../gacha/GachaSlotOverlay";

const GACHA_PRICE_1X = 100;
const GACHA_PRICE_10X = 900;

const RARITY_BADGE = {
  common:    'bg-kinari-light/90 text-sumi',
  rare:      'bg-ai text-kinari-light',
  legendary: 'bg-[#ffd700] text-sumi',
};

export function Shop() {
  const { progress, buyItem, rollGacha } = useUserStats();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [pullResult, setPullResult] = useState(null);
  const [showPool, setShowPool] = useState(false);

  const medaru = progress.medaru || 0;
  const ownedItems = progress.ownedItems || {};
  const ownedPacks = progress.ownedPacks || [];
  const pool = gachaPoolInfo(ownedPacks);

  const handlePurchase = (item) => {
    const res = buyItem(item.id);
    if (res === 'poor') {
      alert(language === 'id' ? `Medaru kurang! Butuh ${item.price}, saldo kamu ${medaru}.` : `Not enough Medaru! Need ${item.price}, you have ${medaru}.`);
    }
  };

  const handleRoll = (count) => {
    const price = count >= 10 ? GACHA_PRICE_10X : GACHA_PRICE_1X;
    const res = rollGacha(count);
    if (!res.ok) {
      alert(language === 'id' ? `Medaru kurang! Butuh ${price}, saldo kamu ${medaru}.` : `Not enough Medaru! Need ${price}, you have ${medaru}.`);
      return;
    }
    setPullResult(res);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-16 min-h-screen">
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="mb-6 flex items-center gap-2 px-4 py-2 bg-kinari-light border-[3px] border-sumi font-black uppercase text-xs shadow-[3px_3px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#1a1a1a] transition-all cursor-pointer"
      >
        ← {language === 'id' ? 'Kembali' : 'Back'}
      </button>

      {/* Outer Editorial Frame matching Home.jsx / Profile.jsx */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="border-[4px] border-sumi bg-kinari-light relative overflow-hidden shadow-[12px_12px_0_0_rgba(26,26,26,0.1)]"
      >
        {/* Background Decorative Kanji */}
        <div className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/4 text-[25rem] font-serif text-sumi opacity-[0.03] pointer-events-none select-none leading-none z-0">
          店
        </div>

        {/* Header Section */}
        <header className="grid grid-cols-1 sm:grid-cols-12 border-b-[4px] border-sumi relative z-10 bg-seigaiha">
          <div className="sm:col-span-8 p-6 sm:p-10 flex flex-col justify-between border-b-[4px] sm:border-b-0 sm:border-r-[4px] border-sumi relative">
            <div className="absolute inset-0 bg-gradient-to-br from-kinari-light/90 to-transparent pointer-events-none"></div>

            <div className="flex items-center gap-4 mb-8 relative z-10">
              <div className="w-12 h-12 bg-sumi text-kinari-light flex items-center justify-center font-serif text-2xl rotate-3 shadow-[4px_4px_0_0_#d3382f]">
                店
              </div>
              <div>
                <span className="text-xs uppercase tracking-[0.4em] font-bold text-sumi">
                  {language === 'id' ? 'Warung Kakek' : 'Showa Shop'}
                </span>
                <h1 className="text-3xl sm:text-5xl font-serif font-black text-sumi tracking-tighter mt-1">
                  商店
                </h1>
              </div>
            </div>

            <div className="relative z-10 flex items-center gap-3 flex-wrap">
              <span className="bg-shu text-kinari-light text-xs font-black px-3 py-1.5 border-[2px] border-sumi shadow-[3px_3px_0_0_#1a1a1a]">
                {getRank(progress.xp)}
              </span>
              <span className="bg-[#ffd700] text-sumi text-xs font-black px-3 py-1.5 border-[2px] border-sumi shadow-[3px_3px_0_0_#1a1a1a]">
                🪙 {medaru.toLocaleString()} MEDARU
              </span>
            </div>
          </div>

          <div className="sm:col-span-4 p-6 flex flex-col items-center justify-center bg-kinari relative">
            <div className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-[0.3em] text-sumi/40">
              WALLET
            </div>
            <div className="relative flex flex-col items-center justify-center w-20 h-20 rounded-full border-[4px] border-shu text-shu overflow-hidden bg-kinari-light shadow-sm">
              <div className="absolute inset-0 border-[2px] border-shu opacity-60 m-1 rounded-full"></div>
              <span className="text-[9px] uppercase font-bold tracking-[0.2em] mt-2 mb-0.5">Saldo</span>
              <span className="text-2xl font-serif font-black leading-none">{medaru}</span>
            </div>
            <div className="mt-3 text-xs uppercase tracking-[0.2em] font-bold text-sumi/75">
              {language === 'id' ? 'Koin Kakek' : 'Grandpa Coins'}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-6 sm:p-12 relative z-10 bg-kinari-light space-y-10">

          {/* Gacha Section */}
          <section className="border-[4px] border-sumi bg-shu text-kinari-light p-6 sm:p-8 shadow-[6px_6px_0_0_#1a1a1a] relative overflow-hidden">
            <div className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 text-[10rem] font-serif text-kinari-light opacity-[0.07] pointer-events-none select-none leading-none">
              玉
            </div>
            <div className="relative z-10">
              <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-kinari-light/70">
                {language === 'id' ? 'Mesin Keberuntungan' : 'Fortune Machine'}
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-black mt-1 mb-3">
                🎰 {language === 'id' ? 'Gashapon Berkarat' : 'Rusty Gashapon'}
              </h2>
              <p className="text-sm font-bold mb-8 text-kinari-light/90">
                {language === 'id' ? 'Tarik tuasnya. Ampas atau Jackpot?' : 'Pull the lever. Scrap or Jackpot?'}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={() => handleRoll(1)}
                  className="flex-1 bg-ai text-kinari-light border-[4px] border-sumi shadow-[6px_6px_0_0_#1a1a1a] font-black text-lg py-4 active:translate-y-1 active:shadow-[2px_2px_0_0_#1a1a1a] transition-all"
                >
                  TARIK 1X - {GACHA_PRICE_1X} 🪙
                </button>
                <button
                  type="button"
                  onClick={() => handleRoll(10)}
                  className="flex-1 bg-ai text-kinari-light border-[4px] border-sumi shadow-[6px_6px_0_0_#1a1a1a] font-black text-lg py-4 active:translate-y-1 active:shadow-[2px_2px_0_0_#1a1a1a] transition-all"
                >
                  TARIK 10X - {GACHA_PRICE_10X} 🪙
                </button>
              </div>
              <p className="text-[11px] font-bold mt-4 text-kinari-light/80">
                {language === 'id'
                  ? 'Duplikat di-refund 50 🪙. Peluang: common 50% · rare 30% · legendary 20%.'
                  : 'Duplicates refund 50 🪙. Odds: common 50% · rare 30% · legendary 20%.'}
              </p>
              <p className="text-[11px] font-bold mt-1 text-kinari-light/70">
                {language === 'id'
                  ? '📦 Hasil tarikan langsung masuk Tas Punggung 🎒'
                  : '📦 Pulls go straight to your Backpack 🎒'}
              </p>

              {/* Isi gacha — daftar pack yang bisa keluar + peluangnya */}
              <div className="mt-5 border-t-[3px] border-kinari-light/30 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPool((v) => !v)}
                  className="w-full flex items-center justify-between gap-3 text-left cursor-pointer group"
                >
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-kinari-light">
                    🎁 {language === 'id' ? 'Isi Gashapon' : 'Gashapon Contents'}
                    <span className="ml-2 font-bold normal-case tracking-normal text-kinari-light/70">
                      ({pool.filter((p) => p.owned).length}/{pool.length} {language === 'id' ? 'dimiliki' : 'owned'})
                    </span>
                  </span>
                  <span className={`text-kinari-light text-xs font-black transition-transform ${showPool ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>

                {showPool && (
                  <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {pool.map((p) => (
                      <li
                        key={p.id}
                        className={`border-[2px] border-sumi/40 bg-kinari-light/10 px-3 py-2 flex items-center gap-3 ${p.owned ? 'opacity-70' : ''}`}
                      >
                        <span className="text-2xl shrink-0">{p.icon}</span>
                        <div className="min-w-0 flex-grow">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-black text-kinari-light truncate">{p.name}</span>
                            <span className={`text-[8px] font-black uppercase tracking-[0.15em] px-1.5 py-0.5 ${RARITY_BADGE[p.rarity] || RARITY_BADGE.common}`}>
                              {PACK_RARITY[p.rarity]?.label || 'COMMON'}
                            </span>
                            {p.owned && (
                              <span className="text-[8px] font-black uppercase tracking-[0.15em] px-1.5 py-0.5 bg-matcha text-kinari-light">
                                ✓
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] font-bold text-kinari-light/70 truncate">
                            {language === 'id' ? p.desc : (p.desc_en || p.desc)}
                          </p>
                        </div>
                        <span className="text-sm font-black text-kinari-light shrink-0 tabular-nums">{p.chance}%</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          {/* Etalase Section — hanya barang konsumsi (Theme Pack dari gacha) */}
          <section>
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-2xl font-serif font-black text-sumi tracking-tight">
                {language === 'id' ? 'Etalase Warung Kakek' : 'Grandpa Shop Shelf'}
              </h2>
              <div className="h-[2px] flex-1 bg-sumi/10"></div>
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/40">品物</span>
            </div>

            {/* Barang konsumsi — baris compact biar hemat scroll */}
            <div className="flex flex-col gap-3">
              {SHOP_ITEMS.map((item) => {
                const have = ownedItems[item.id] || 0;
                const affordable = medaru >= item.price;
                return (
                  <div
                    key={item.id}
                    className="bg-kinari border-[3px] border-sumi shadow-[4px_4px_0_0_#1a1a1a] flex items-center gap-3 sm:gap-4 p-3 sm:p-4 relative"
                  >
                    <div className="text-3xl sm:text-4xl shrink-0 w-12 text-center">{item.icon}</div>
                    <div className="flex-grow min-w-0">
                      <h3 className="text-sm sm:text-base font-serif font-black text-sumi truncate">
                        {item.name}
                        {have > 0 && (
                          <span className="ml-2 align-middle bg-matcha text-kinari-light text-[9px] font-black px-1.5 py-0.5 border-[2px] border-sumi">
                            ×{have}
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] sm:text-xs font-bold text-sumi/70 truncate">{item.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePurchase(item)}
                      className={`shrink-0 px-3 sm:px-5 py-2 font-black text-xs sm:text-sm border-[3px] border-sumi shadow-[3px_3px_0_0_#1a1a1a] active:translate-y-[2px] active:shadow-none transition-all ${
                        affordable ? "bg-ai text-kinari-light" : "bg-kinari-light text-sumi/50"
                      }`}
                    >
                      {item.price} 🪙
                    </button>
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] font-bold text-sumi/50 mt-4">
              {language === 'id'
                ? '🎁 Theme Pack (visual + suara) didapat dari Gashapon di atas, bukan dibeli.'
                : '🎁 Theme Packs (visual + voice) come from the Gashapon above, not sold here.'}
            </p>
          </section>

        </div>
      </motion.div>

      {/* Layar gacha (mesin slot) */}
      <AnimatePresence>
        {pullResult && (
          <GachaSlotOverlay result={pullResult} onClose={() => setPullResult(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default Shop;
