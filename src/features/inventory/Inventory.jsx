import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useUserStats, getRank } from "../progress/ProgressContext";
import { useLanguage } from "../../context/LanguageContext";
import { PACKS, PACK_RARITY, isPackReady } from "../packs/packs";
import { inventoryList, countItems } from "../items/items";

const RARITY_STYLE = {
  common:    { bg: 'bg-kinari-light', text: 'text-sumi',         border: 'border-sumi' },
  rare:      { bg: 'bg-ai',           text: 'text-kinari-light', border: 'border-sumi' },
  legendary: { bg: 'bg-shu',          text: 'text-kinari-light', border: 'border-sumi' },
};

export function Inventory() {
  const { progress, togglePack, consumeItem } = useUserStats();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const id = language === 'id';

  const medaru = progress.medaru || 0;
  const ownedPacks = progress.ownedPacks || [];
  const activePack = progress.activePack;
  const items = inventoryList(progress.ownedItems);
  const totalItems = countItems(progress.ownedItems);

  const packs = PACKS.filter((p) => ownedPacks.includes(p.id) && isPackReady(p));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-16 min-h-screen">
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="mb-6 flex items-center gap-2 px-4 py-2 bg-kinari-light border-[3px] border-sumi font-black uppercase text-xs shadow-[3px_3px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#1a1a1a] transition-all cursor-pointer"
      >
        ← {id ? 'Kembali' : 'Back'}
      </button>

      {/* Outer Editorial Frame */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="border-[4px] border-sumi bg-kinari-light relative overflow-hidden shadow-[12px_12px_0_0_rgba(26,26,26,0.1)]"
      >
        {/* Background Decorative Kanji */}
        <div className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/4 text-[25rem] font-serif text-sumi opacity-[0.03] pointer-events-none select-none leading-none z-0">
          鞄
        </div>

        {/* Header */}
        <header className="grid grid-cols-1 sm:grid-cols-12 border-b-[4px] border-sumi relative z-10 bg-seigaiha">
          <div className="sm:col-span-8 p-6 sm:p-10 flex flex-col justify-between border-b-[4px] sm:border-b-0 sm:border-r-[4px] border-sumi relative">
            <div className="absolute inset-0 bg-gradient-to-br from-kinari-light/90 to-transparent pointer-events-none"></div>

            <div className="flex items-center gap-4 mb-8 relative z-10">
              <div className="w-12 h-12 bg-sumi text-kinari-light flex items-center justify-center font-serif text-2xl rotate-3 shadow-[4px_4px_0_0_#d3382f]">
                鞄
              </div>
              <div>
                <span className="text-xs uppercase tracking-[0.4em] font-bold text-sumi">
                  {id ? 'Tas Punggung' : 'Backpack'}
                </span>
                <h1 className="text-3xl sm:text-5xl font-serif font-black text-sumi tracking-tighter mt-1">
                  道具
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
              {id ? 'ISI' : 'CONTENTS'}
            </div>
            <div className="relative flex flex-col items-center justify-center w-20 h-20 rounded-full border-[4px] border-ai text-ai overflow-hidden bg-kinari-light shadow-sm">
              <div className="absolute inset-0 border-[2px] border-ai opacity-60 m-1 rounded-full"></div>
              <span className="text-[9px] uppercase font-bold tracking-[0.2em] mt-2 mb-0.5">{id ? 'Item' : 'Items'}</span>
              <span className="text-2xl font-serif font-black leading-none">{totalItems}</span>
            </div>
            <div className="mt-3 text-xs uppercase tracking-[0.2em] font-bold text-sumi/75">
              {packs.length} {id ? 'pack' : 'packs'} · {items.length} {id ? 'jenis' : 'kinds'}
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="p-6 sm:p-12 relative z-10 bg-kinari-light space-y-12">

          {/* Packs */}
          <section>
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-2xl font-serif font-black text-sumi tracking-tight">
                {id ? 'Theme Pack' : 'Theme Packs'}
              </h2>
              <div className="h-[2px] flex-1 bg-sumi/10"></div>
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/40">束</span>
            </div>

            {packs.length === 0 ? (
              <p className="text-sm font-bold text-sumi/50 border-[3px] border-dashed border-sumi/20 p-6 text-center">
                {id
                  ? 'Belum ada pack. Tarik gacha di Warung Kakek!'
                  : 'No packs yet. Pull the gacha at the Shop!'}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {packs.map((pack) => {
                  const isActive = activePack === pack.id;
                  const rarity = PACK_RARITY[pack.rarity] || PACK_RARITY.common;
                  const st = RARITY_STYLE[pack.rarity] || RARITY_STYLE.common;
                  return (
                    <div
                      key={pack.id}
                      className={`${st.bg} border-[4px] ${st.border} shadow-[6px_6px_0_0_#1a1a1a] flex flex-col p-6 relative overflow-hidden ${st.text}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="text-5xl">{pack.icon}</div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2 py-1 border-[2px] border-current">
                          {rarity.label}
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
                        onClick={() => togglePack(pack.id)}
                        className={`py-3 font-black text-sm w-full border-4 border-sumi shadow-[4px_4px_0_0_#1a1a1a] active:translate-y-1 active:shadow-none transition-all ${
                          isActive ? 'bg-matcha text-kinari-light' : 'bg-ai text-kinari-light'
                        }`}
                      >
                        {isActive ? 'AKTIF ✓' : (id ? 'PAKAI' : 'USE')}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Consumables */}
          <section>
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-2xl font-serif font-black text-sumi tracking-tight">
                {id ? 'Barang' : 'Items'}
              </h2>
              <div className="h-[2px] flex-1 bg-sumi/10"></div>
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/40">品</span>
            </div>

            {items.length === 0 ? (
              <p className="text-sm font-bold text-sumi/50 border-[3px] border-dashed border-sumi/20 p-6 text-center">
                {id
                  ? 'Belum punya barang. Beli di Warung Kakek!'
                  : 'No items yet. Buy some at the Shop!'}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-kinari border-[4px] border-sumi shadow-[6px_6px_0_0_#1a1a1a] flex flex-col text-center p-6 relative overflow-hidden"
                  >
                    <span className="absolute top-3 right-3 bg-matcha text-kinari-light text-[10px] font-black px-2 py-1 border-[2px] border-sumi">
                      ×{item.qty}
                    </span>
                    <div className="text-6xl mb-4">{item.icon}</div>
                    <h3 className="text-xl font-serif font-black border-b-4 border-sumi pb-2 mb-2 text-sumi">
                      {item.name}
                    </h3>
                    <p className="text-sm font-bold mb-6 flex-grow text-sumi/80">{item.desc}</p>
                    <button
                      type="button"
                      onClick={() => consumeItem(item.id)}
                      className="py-3 font-black text-lg w-full border-4 border-sumi shadow-[4px_4px_0_0_#1a1a1a] active:translate-y-1 active:shadow-none transition-all bg-ai text-kinari-light"
                    >
                      {id ? 'PAKAI' : 'USE'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </motion.div>
    </div>
  );
}

export default Inventory;
