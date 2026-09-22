import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useUserStats, getRank } from "../progress/ProgressContext";
import { useLanguage } from "../../context/LanguageContext";
import { PACKS, PACK_RARITY, isPackReady } from "../packs/packs";

const GACHA_PRICE_1X = 100;
const GACHA_PRICE_10X = 900;

const RARITY_STYLE = {
  common:    { bg: 'bg-kinari-light', text: 'text-sumi',         border: 'border-sumi' },
  rare:      { bg: 'bg-ai',           text: 'text-kinari-light', border: 'border-sumi' },
  legendary: { bg: 'bg-shu',          text: 'text-kinari-light', border: 'border-sumi' },
};

// Barang generik (bukan pack) — tetap pakai spendMedaru.
const GENERIC_ITEMS = [
  { id: 1, icon: "☕", name: "Kopi Kaleng Boss", desc: "EXP x2 (30 Menit)", price: 500 },
  { id: 2, icon: "📼", name: "Selotip Kaset", desc: "Sambung Streak Putus", price: 1200 },
  { id: 3, icon: "🔌", name: "Kabel Jumper", desc: "1x Hidup (Death Quiz)", price: 800 },
];

export function Shop() {
  const { progress, spendMedaru, buyPack, togglePack, rollGacha } = useUserStats();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [pullResult, setPullResult] = useState(null);

  const medaru = progress.medaru || 0;
  const ownedPacks = progress.ownedPacks || [];
  const activePack = progress.activePack;

  const handlePurchase = (price) => {
    const ok = spendMedaru(price);
    alert(ok
      ? (language === 'id' ? "Transaksi diproses..." : "Transaction processed...")
      : (language === 'id' ? `Medaru kurang! Butuh ${price}, saldo kamu ${medaru}.` : `Not enough Medaru! Need ${price}, you have ${medaru}.`));
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

  const handlePackAction = (pack) => {
    if (!isPackReady(pack)) return;
    const owned = ownedPacks.includes(pack.id);
    if (!owned) {
      const result = buyPack(pack.id);
      if (result === 'poor') {
        alert(language === 'id' ? `Medaru kurang! Butuh ${pack.price}, saldo kamu ${medaru}.` : `Not enough Medaru! Need ${pack.price}, you have ${medaru}.`);
      }
      return;
    }
    togglePack(pack.id);
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
            </div>
          </section>

          {/* Etalase Section */}
          <section>
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-2xl font-serif font-black text-sumi tracking-tight">
                {language === 'id' ? 'Etalase Warung Kakek' : 'Grandpa Shop Shelf'}
              </h2>
              <div className="h-[2px] flex-1 bg-sumi/10"></div>
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/40">品物</span>
            </div>

            {/* Kartu Theme Pack */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {PACKS.map((pack) => {
                const owned = ownedPacks.includes(pack.id);
                const isActive = activePack === pack.id;
                const ready = isPackReady(pack);
                const affordable = medaru >= pack.price;
                const rarity = PACK_RARITY[pack.rarity] || PACK_RARITY.common;
                const st = RARITY_STYLE[pack.rarity] || RARITY_STYLE.common;
                const label = !ready
                  ? (language === 'id' ? 'SEGERA' : 'SOON')
                  : !owned
                    ? `BELI - ${pack.price} 🪙`
                    : isActive ? 'AKTIF ✓' : (language === 'id' ? 'PAKAI' : 'USE');
                const color = isActive
                  ? 'bg-matcha text-kinari-light'
                  : (!ready) ? 'bg-kinari-light text-sumi/40'
                  : (owned || affordable) ? 'bg-ai text-kinari-light' : 'bg-kinari-light text-sumi/50';
                return (
                  <div
                    key={pack.id}
                    className={`${st.bg} border-[4px] ${st.border} shadow-[6px_6px_0_0_#1a1a1a] flex flex-col p-6 relative overflow-hidden ${st.text}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-5xl">{pack.icon}</div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2 py-1 border-[2px] border-current">
                        {rarity.label} · {rarity.weight}%
                      </span>
                    </div>
                    <h3 className="text-xl font-serif font-black border-b-4 border-current pb-2 mb-2">
                      {pack.name}
                    </h3>
                    <p className="text-sm font-bold mb-2 flex-grow opacity-90">{pack.desc}</p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-4 opacity-70">
                      🎨 {pack.visual} · 🎙️ {pack.voice}
                    </p>
                    <button
                      type="button"
                      disabled={!ready}
                      onClick={() => handlePackAction(pack)}
                      className={`py-3 font-black text-sm w-full border-4 border-sumi shadow-[4px_4px_0_0_#1a1a1a] active:translate-y-1 active:shadow-none transition-all disabled:opacity-60 disabled:cursor-not-allowed ${color}`}
                    >
                      {label}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Barang generik */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {GENERIC_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className="bg-kinari border-[4px] border-sumi shadow-[6px_6px_0_0_#1a1a1a] flex flex-col text-center p-6 relative overflow-hidden"
                >
                  <div className="text-6xl mb-4">{item.icon}</div>
                  <h3 className="text-xl font-serif font-black border-b-4 border-sumi pb-2 mb-2 text-sumi">
                    {item.name}
                  </h3>
                  <p className="text-sm font-bold mb-6 flex-grow text-sumi/80">{item.desc}</p>
                  <button
                    type="button"
                    onClick={() => handlePurchase(item.price)}
                    className={`py-3 font-black text-lg w-full border-4 border-sumi shadow-[4px_4px_0_0_#1a1a1a] active:translate-y-1 active:shadow-none transition-all ${
                      medaru >= item.price ? "bg-ai text-kinari-light" : "bg-kinari-light text-sumi/50"
                    }`}
                  >
                    BELI - {item.price} 🪙
                  </button>
                </div>
              ))}
            </div>
          </section>

        </div>
      </motion.div>

      {/* Modal hasil gacha */}
      <AnimatePresence>
        {pullResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-sumi/70 flex items-center justify-center p-4"
            onClick={() => setPullResult(null)}
          >
            <motion.div
              initial={{ scale: 0.85, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="bg-kinari-light border-[4px] border-sumi shadow-[10px_10px_0_0_#1a1a1a] max-w-lg w-full p-6 sm:p-8 max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-serif font-black text-sumi mb-1">
                {language === 'id' ? 'Hasil Tarikan' : 'Pull Result'}
              </h3>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-sumi/50 mb-6">
                {pullResult.results.length}x · {language === 'id' ? 'refund' : 'refund'} {pullResult.refunded} 🪙
              </p>
              <ul className="space-y-3 mb-6">
                {pullResult.results.map((p, i) => {
                  const pack = PACKS.find((x) => x.id === p.id);
                  const st = RARITY_STYLE[pack?.rarity] || RARITY_STYLE.common;
                  return (
                    <li
                      key={i}
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
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                onClick={() => setPullResult(null)}
                className="w-full py-3 bg-ai text-kinari-light font-black border-4 border-sumi shadow-[4px_4px_0_0_#1a1a1a] active:translate-y-1 active:shadow-none transition-all"
              >
                {language === 'id' ? 'TUTUP' : 'CLOSE'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Shop;
