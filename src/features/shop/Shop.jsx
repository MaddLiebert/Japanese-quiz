import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useUserStats, getRank } from "../progress/ProgressContext";
import { useLanguage } from "../../context/LanguageContext";

// ── Mock Data Kios (harga & item; saldo medaru diambil dari ProgressContext) ─
const shopData = {
  gacha: {
    name: "🎰 Gashapon Berkarat",
    price1x: 100,
    price10x: 900,
    desc: "Tarik tuasnya. Ampas atau Jackpot?",
  },
  items: [
    { id: 1, icon: "☕", name: "Kopi Kaleng Boss", desc: "EXP x2 (30 Menit)", price: 500 },
    { id: 2, icon: "📼", name: "Selotip Kaset", desc: "Sambung Streak Putus", price: 1200 },
    { id: 3, icon: "🔌", name: "Kabel Jumper", desc: "1x Hidup (Death Quiz)", price: 800 },
    { id: 4, icon: "🎙️", name: "Voice Pack: custom", desc: "custom ada banyak voice nanti", price: 5000 },
    {
      id: 5,
      icon: "🈳",
      name: "Kotodama Burst",
      desc: "Efek tinta: cap hanko, sapuan kuas & ensō tiap jawaban",
      price: 2500,
      isEffect: true,
      effectId: "kotodama_burst"
    },
  ],
};

export function Shop() {
  const { progress, spendMedaru, buyEffect, toggleEffect } = useUserStats();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const medaru = progress.medaru || 0;

  // ── Transaksi: saldo real, hasil masih dummy ─────────────────────────────
  const handlePurchase = (price) => {
    const ok = spendMedaru(price);
    if (ok) {
      alert(language === 'id' ? "Transaksi diproses..." : "Transaction processed...");
    } else {
      alert(language === 'id'
        ? `Medaru kurang! Butuh ${price}, saldo kamu ${medaru}.`
        : `Not enough Medaru! Need ${price}, you have ${medaru}.`);
    }
  };

  const handleEffectAction = (item) => {
    const owned = (progress.ownedEffects || []).includes(item.effectId);
    const isActive = progress.activeEffect === item.effectId;

    if (!owned) {
      const result = buyEffect(item.effectId);
      if (result === 'poor') {
        alert(language === 'id'
          ? `Medaru kurang! Butuh ${item.price}, saldo kamu ${medaru}.`
          : `Not enough Medaru! Need ${item.price}, you have ${medaru}.`);
      } else {
        alert(language === 'id' ? "Efek dibeli & diaktifkan!" : "Effect purchased & activated!");
      }
      return;
    }
    toggleEffect(item.effectId);
    alert(isActive
      ? (language === 'id' ? "Efek dimatikan." : "Effect turned off.")
      : (language === 'id' ? "Efek diaktifkan!" : "Effect activated!"));
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
                {shopData.gacha.name}
              </h2>
              <p className="text-sm font-bold mb-8 text-kinari-light/90">
                {shopData.gacha.desc}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={() => handlePurchase(shopData.gacha.price1x)}
                  className="flex-1 bg-ai text-kinari-light border-[4px] border-sumi shadow-[6px_6px_0_0_#1a1a1a] font-black text-lg py-4 active:translate-y-1 active:shadow-[2px_2px_0_0_#1a1a1a] transition-all"
                >
                  TARIK 1X - {shopData.gacha.price1x} 🪙
                </button>
                <button
                  type="button"
                  onClick={() => handlePurchase(shopData.gacha.price10x)}
                  className="flex-1 bg-ai text-kinari-light border-[4px] border-sumi shadow-[6px_6px_0_0_#1a1a1a] font-black text-lg py-4 active:translate-y-1 active:shadow-[2px_2px_0_0_#1a1a1a] transition-all"
                >
                  TARIK 10X - {shopData.gacha.price10x} 🪙
                </button>
              </div>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {shopData.items.map((item) => {
                return (
                  <div
                    key={item.id}
                    className="bg-kinari border-[4px] border-sumi shadow-[6px_6px_0_0_#1a1a1a] flex flex-col text-center p-6 relative overflow-hidden"
                  >
                    <div className="text-6xl mb-4">{item.icon}</div>
                    <h3 className="text-xl font-serif font-black border-b-4 border-sumi pb-2 mb-2 text-sumi">
                      {item.name}
                    </h3>
                    <p className="text-sm font-bold mb-6 flex-grow text-sumi/80">{item.desc}</p>
                    {item.isEffect ? (() => {
                      const owned = (progress.ownedEffects || []).includes(item.effectId);
                      const isActive = progress.activeEffect === item.effectId;
                      const affordable = medaru >= item.price;
                      const label = !owned
                        ? `BELI - ${item.price} 🪙`
                        : isActive ? 'AKTIF ✓' : 'PAKAI';
                      const color = isActive
                        ? 'bg-matcha text-kinari-light'
                        : (owned || affordable) ? 'bg-ai text-kinari-light' : 'bg-kinari-light text-sumi/50';
                      return (
                        <button
                          type="button"
                          onClick={() => handleEffectAction(item)}
                          className={`py-3 font-black text-sm w-full border-4 border-sumi shadow-[4px_4px_0_0_#1a1a1a] active:translate-y-1 active:shadow-none transition-all ${color}`}
                        >
                          {label}
                        </button>
                      );
                    })() : (
                      <button
                        type="button"
                        onClick={() => handlePurchase(item.price)}
                        className={`py-3 font-black text-lg w-full border-4 border-sumi shadow-[4px_4px_0_0_#1a1a1a] active:translate-y-1 active:shadow-none transition-all ${
                          medaru >= item.price ? "bg-ai text-kinari-light" : "bg-kinari-light text-sumi/50"
                        }`}
                      >
                        BELI - {item.price} 🪙
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

        </div>
      </motion.div>
    </div>
  );
}

export default Shop;
