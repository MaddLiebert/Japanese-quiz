import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useUserStats } from "../progress/ProgressContext";
import { Glyph } from "../../components/icons/Glyph";
import { RankBadge } from '../progress/RankBadge';
import { useLanguage } from "../../context/LanguageContext";
import { SHOP_ITEMS, itemName, itemDesc } from "../items/items";
import { gachaPoolInfo, PACK_RARITY, rarityOdds } from "../packs/packs";
import { cosmeticPoolInfo } from "../cosmetics/cosmetics";
import { packPalette, accentInk } from "../packs/rarityStyle";
import { GachaSlotOverlay } from "../gacha/GachaSlotOverlay";
import { EraPaper } from "../../components/EraPaper";
import { MedaruBadge } from "../../components/MedaruBadge";
import { MedaruCoin } from "../../components/MedaruCoin";
import { useEra } from "../theme/EraContext";
import { medaruCopy } from "../progress/medaruCopy";
import { gachaCopy, isHeian } from "../gacha/heianCopy";
import { isEdo } from "../gacha/edoCopy";
import { isAnime } from "../gacha/animeCopy";
import { WorldShelf } from "../anime/WorldShelf";
import { eraName } from "../theme/eraNames";

const GACHA_PRICE_1X = 100;
const GACHA_PRICE_10X = 900;

export function Shop() {
  const { progress, buyItem, rollGacha } = useUserStats();
  const { language } = useLanguage();
  const { era } = useEra();
  const heian = isHeian(era);
  const edo = isEdo(era);
  const anime = isAnime(era);
  const T = gachaCopy(era, language);
  const navigate = useNavigate();
  const [pullResult, setPullResult] = useState(null);
  const [showPool, setShowPool] = useState(false);

  const medaru = progress.medaru || 0;
  const MT = medaruCopy(era, language);   // nama mata uang ikut era (Heian → もん)
  const ownedItems = progress.ownedItems || {};
  const ownedPacks = progress.ownedPacks || [];
  const isCyber = era === 'cyberpunk';
  const ownedCosmetics = progress.ownedCosmetics || [];
  // 電脳 → pool KOSMETIK (isi ハック). Era lain → pool pack sadar-era.
  const pool = isCyber ? cosmeticPoolInfo(ownedCosmetics) : gachaPoolInfo(ownedPacks, era);

  // Teks odds dihitung dari pool (bukan hardcode) — aman saat pack bertambah.
  // 電脳 → agregat dari pool kosmetik; era lain → pool pack sadar-era.
  const oddsText = isCyber
    ? (() => {
        const total = pool.reduce((s, c) => s + c.chance, 0) || 1;
        const byR = {};
        for (const c of pool) byR[c.rarity] = (byR[c.rarity] || 0) + c.chance;
        return Object.entries(byR)
          .map(([r, ch]) => `${(PACK_RARITY[r]?.label || r).toLowerCase()} ${Math.round((ch / total) * 1000) / 10}%`)
          .join(' · ');
      })()
    : rarityOdds(era).map((o) => `${o.label.toLowerCase()} ${o.chance}%`).join(' · ');

  const handlePurchase = (item) => {
    const res = buyItem(item.id);
    if (res === 'poor') {
      alert(language === 'id' ? `${MT.name} kurang! Butuh ${item.price}, saldo kamu ${medaru}.` : `Not enough ${MT.name}! Need ${item.price}, you have ${medaru}.`);
    }
  };

  const handleRoll = (count) => {
    const price = count >= 10 ? GACHA_PRICE_10X : GACHA_PRICE_1X;
    const res = rollGacha(count, era);
    if (!res.ok) {
      alert(language === 'id' ? `${MT.name} kurang! Butuh ${price}, saldo kamu ${medaru}.` : `Not enough ${MT.name}! Need ${price}, you have ${medaru}.`);
      return;
    }
    setPullResult(res);
  };

  return (
    <div className="relative max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-16 min-h-screen">
      <EraPaper />
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
                {edo ? '問' : '店'}
              </div>
              <div>
                <span className="text-xs uppercase tracking-[0.4em] font-bold text-sumi">
                  {edo
                    ? (language === 'id' ? '問屋 Grosir' : 'Toiya Wholesale')
                    : heian
                    ? (language === 'id' ? 'Kakek Pasar' : 'Old Market')
                    : (language === 'id' ? 'Warung Kakek' : 'Showa Shop')}
                </span>
                <h1 className="text-3xl sm:text-5xl font-serif font-black text-sumi tracking-tighter mt-1">
                  {eraName('shop', era) || '商店'}
                </h1>
              </div>
            </div>

            <div className="relative z-10 flex items-center gap-3 flex-wrap">
              <RankBadge xp={progress.xp} variant="chip" />
              <MedaruBadge amount={medaru} size="lg" />
            </div>
          </div>

          <div className="sm:col-span-4 p-6 flex flex-col items-center justify-center bg-kinari relative">
            <div className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-[0.3em] text-sumi/40">
              {(heian || edo) ? 'ぜに' : 'WALLET'}
            </div>
            {(heian || edo) ? (
              // Heian/Edo: tampilkan koin sungguhan (bukan lingkaran merah
              // ala web) + angka & satuan kana/kanji (もん / 両).
              <>
                <div className="flex items-center gap-2">
                  <MedaruCoin size={36} />
                  <span className="text-2xl font-serif font-black leading-none">{medaru}</span>
                </div>
                <div className="mt-3 text-xs tracking-[0.2em] font-bold text-sumi/75">
                  {MT.name}
                </div>
              </>
            ) : (
              <>
                <div className="relative flex flex-col items-center justify-center w-20 h-20 rounded-full border-[4px] border-shu text-shu overflow-hidden bg-kinari-light shadow-sm">
                  <div className="absolute inset-0 border-[2px] border-shu opacity-60 m-1 rounded-full"></div>
                  <span className="text-[9px] uppercase font-bold tracking-[0.2em] mt-2 mb-0.5">Saldo</span>
                  <span className="text-2xl font-serif font-black leading-none">{medaru}</span>
                </div>
                <div className="mt-3 text-xs uppercase tracking-[0.2em] font-bold text-sumi/75">
                  {language === 'id' ? 'Koin Kakek' : 'Grandpa Coins'}
                </div>
              </>
            )}
          </div>
        </header>

        {/* Content Body */}
        <div className="p-6 sm:p-12 relative z-10 bg-kinari-light space-y-10">

          {/* Gacha Section — Heian: 貝合わせ (kana); Edo: 富くじ 木札; lain: mesin lama */}
          <section className={`border-[4px] border-sumi p-6 sm:p-8 shadow-[6px_6px_0_0_#1a1a1a] relative overflow-hidden ${heian ? 'heian-kai-panel' : edo ? 'edo-tomi-panel' : 'bg-shu text-kinari-light'}`}>

            <div className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 text-[10rem] font-serif opacity-[0.07] pointer-events-none select-none leading-none">
              {T.watermark}
            </div>
            <div className="relative z-10">
              <span className={`text-[10px] uppercase tracking-[0.4em] font-bold ${(heian || edo) ? 'opacity-70' : 'text-kinari-light/70'}`}>
                {T.kicker}
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-black mt-1 mb-3">
                <Glyph name={heian ? 'shell' : 'gacha'} className="mr-2" />{T.title}
              </h2>
              {T.titleSub && (
                <p className={`text-[11px] font-bold mb-2 tracking-wider ${(heian || edo) ? 'opacity-60' : 'text-kinari-light/70'}`}>{T.titleSub}</p>
              )}
              <p className={`text-sm font-bold mb-8 ${(heian || edo) ? 'opacity-80' : 'text-kinari-light/90'}`}>
                {T.tagline}
              </p>

              {/* Cyberpunk Gacha Button (terminal hack UI) */}
              {isCyber && (
                <div className="mb-6 border-[2px] border-cyan/50 bg-black/90 rounded p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-xs text-cyan/70 uppercase">SYSTEM HACK</div>
                      <div className="text-lg font-bold text-cyan font-mono">ハック · hack</div>
                    </div>
                    <div className="text-[10px] text-cyan/50 uppercase">電脳</div>
                  </div>
                  <p className="text-[11px] text-kinari-light/80 mb-4">
                    Crack the data. Hit or noise?
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => navigate('/cyberpunk-hack')}
                      className="flex-1 bg-cyan text-black border-[3px] border-cyan/80 shadow-[4px_4px_0_0_#0891b2] font-black text-sm py-3 active:translate-y-[2px] active:shadow-[2px_2px_0_0_#0891b2] transition-all font-mono"
                    >
                      <span className="mr-1">ハック 1回</span> - 100 <MedaruCoin className="ml-1" />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/cyberpunk-hack')}
                      className="flex-1 bg-cyan text-black border-[3px] border-cyan/80 shadow-[4px_4px_0_0_#0891b2] font-black text-sm py-3 active:translate-y-[2px] active:shadow-[2px_2px_0_0_#0891b2] transition-all font-mono"
                    >
                      <span className="mr-1">ハック 10回</span> - 900 <MedaruCoin className="ml-1" />
                    </button>
                  </div>
                  <div className="mt-4 text-[10px] text-cyan/60">
                    <div>Duplikat di-refund 50. Peluang: common 51% · rare 30.6% · legendary 18.4%.</div>
                    <div className="mt-1">抜いたデータは すぐ アーカイブ へ</div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={() => handleRoll(1)}
                  className="flex-1 bg-ai text-kinari-light border-[4px] border-sumi shadow-[6px_6px_0_0_#1a1a1a] font-black text-lg py-4 active:translate-y-1 active:shadow-[2px_2px_0_0_#1a1a1a] transition-all"
                >
                  {T.pull1} - {GACHA_PRICE_1X} <MedaruCoin className="ml-1" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRoll(10)}
                  className="flex-1 bg-ai text-kinari-light border-[4px] border-sumi shadow-[6px_6px_0_0_#1a1a1a] font-black text-lg py-4 active:translate-y-1 active:shadow-[2px_2px_0_0_#1a1a1a] transition-all"
                >
                  {T.pull10} - {GACHA_PRICE_10X} <MedaruCoin className="ml-1" />
                </button>
              </div>
              <p className={`text-[11px] font-bold mt-4 ${heian ? 'opacity-75' : 'text-kinari-light/80'}`}>
                {language === 'id'
                  ? `Duplikat di-refund 50. Peluang: ${oddsText}.`
                  : `Duplicates refund 50. Odds: ${oddsText}.`}
              </p>
              <p className={`text-[11px] font-bold mt-1 ${heian ? 'opacity-65' : 'text-kinari-light/70'}`}>
                {T.toBackpack}
              </p>

              {/* Isi gacha — daftar pack yang bisa keluar + peluangnya */}
              <div className={`mt-5 border-t pt-4 ${(heian || edo) ? 'border-sumi/25' : 'border-kinari-light/30'}`}>
                <button
                  type="button"
                  onClick={() => setShowPool((v) => !v)}
                  className="w-full flex items-center justify-between gap-3 text-left cursor-pointer group"
                >
                  <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${(heian || edo) ? '' : 'text-kinari-light'}`}>
                    <Glyph name="gift" className="mr-2" />{T.contents}
                    <span className={`ml-2 font-bold normal-case tracking-normal ${(heian || edo) ? 'opacity-60' : 'text-kinari-light/70'}`}>
                      ({pool.filter((p) => p.owned && p.winnable !== false).length}/{pool.filter((p) => p.winnable !== false).length} {T.ownedSuffix})
                    </span>
                  </span>
                  <span className={`text-xs font-black transition-transform ${(heian || edo) ? '' : 'text-kinari-light'} ${showPool ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>

                {showPool && (
                  <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {pool.map((p) => (
                      <li
                        key={p.id}
                        className={`border-[2px] px-3 py-2 flex items-center gap-3 ${(heian || edo) ? 'border-sumi/25 bg-sumi/5' : 'border-sumi/40 bg-kinari-light/10'} ${p.owned ? 'opacity-70' : ''} ${p.winnable === false ? 'opacity-40' : ''}`}
                      >
                        <span className="shrink-0 text-sumi"><Glyph name={p.icon} size={24} /></span>
                        <div className="min-w-0 flex-grow">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[11px] font-black truncate ${(heian || edo) ? '' : 'text-kinari-light'}`}>{p.name}</span>
                            {/* Badge pakai WARNA KANON karakter (bukan warna rarity) — v1.1 */}
                            <span
                              className="text-[8px] font-black uppercase tracking-[0.15em] px-1.5 py-0.5 border-[1.5px] border-sumi/60"
                              style={{
                                background: p.palette ? p.palette.accent : packPalette(p.visual).accent,
                                color: accentInk(p.palette ? p.palette.accent : packPalette(p.visual).accent),
                              }}
                            >
                              {PACK_RARITY[p.rarity]?.label || 'COMMON'}
                            </span>
                            {p.owned && (
                              <span className="text-[8px] font-black uppercase tracking-[0.15em] px-1.5 py-0.5 bg-matcha text-kinari-light">
                                ✓
                              </span>
                            )}
                            {/* Gerbang era: pack anime (JJK) hanya bisa dipakai di 多元 */}
                            {p.era === 'anime' && (
                              <span
                                className="text-[8px] font-black uppercase tracking-[0.15em] px-1.5 py-0.5 border-[1.5px] border-sumi/60 bg-ai/20"
                                title="Khusus era Anime Multiverse 多元"
                                aria-label="Khusus era Anime Multiverse 多元"
                              >
                                多元
                              </span>
                            )}
                            {/* 電脳: tandai jenis kosmetik (Frame ID / Skin HUD) */}
                            {p.kind && (
                              <span className="text-[8px] font-black uppercase tracking-[0.15em] px-1.5 py-0.5 border-[1.5px] border-sumi/60 bg-shu/20">
                                {p.kind === 'hud' ? 'HUD' : 'ID'}
                              </span>
                            )}
                          </div>
                          <p className={`text-[10px] font-bold truncate ${(heian || edo) ? 'opacity-60' : 'text-kinari-light/70'}`}>
                            {language === 'id' ? p.desc : (p.desc_en || p.desc)}
                          </p>
                        </div>
                        <span className={`text-sm font-black shrink-0 tabular-nums flex items-center gap-1 ${(heian || edo) ? '' : 'text-kinari-light'}`}>
                          {p.winnable === false
                            ? (<><Glyph name="lock" className="inline" />多元</>)
                            : `${p.chance}%`}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          {/* 多元 — LAPIS 2: DUNIA yang bisa dibeli (mis. JJK). Di era lain tak tampil. */}
          {anime && (
            <section>
              <WorldShelf showHeading showLink={false} />
              <p className="text-[11px] font-bold text-sumi/50 mt-3">
                {language === 'id'
                  ? 'Beli sebuah dunia → kanvas 多元 langsung berubah warna. Dunia lisensi (mis. 呪術廻戦) menampilkan kreditnya.'
                  : 'Buy a world → the 多元 canvas repaints at once. Licensed worlds (e.g. 呪術廻戦) show their credit.'}
              </p>
            </section>
          )}

          {/* Etalase Section — hanya barang konsumsi (Theme Pack dari gacha) */}
          <section>
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-2xl font-serif font-black text-sumi tracking-tight">
                {language === 'id' ? 'Etalase Warung' : 'Shop Shelf'}
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
                    <div className="shrink-0 w-12 flex justify-center text-sumi"><Glyph name={item.icon} size={34} /></div>
                    <div className="flex-grow min-w-0">
                      <h3 className="text-sm sm:text-base font-serif font-black text-sumi truncate">
                        {itemName(item, language, era)}
                        {have > 0 && (
                          <span className="ml-2 align-middle bg-matcha text-kinari-light text-[9px] font-black px-1.5 py-0.5 border-[2px] border-sumi">
                            ×{have}
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] sm:text-xs font-bold text-sumi/70 truncate">{itemDesc(item, language, era)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePurchase(item)}
                      className={`shrink-0 px-3 sm:px-5 py-2 font-black text-xs sm:text-sm border-[3px] border-sumi shadow-[3px_3px_0_0_#1a1a1a] active:translate-y-[2px] active:shadow-none transition-all ${
                        affordable ? "bg-ai text-kinari-light" : "bg-kinari-light text-sumi/50"
                      }`}
                    >
                      {item.price} <MedaruCoin className="ml-1" />
                    </button>
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] font-bold text-sumi/50 mt-4">
              {language === 'id'
                ? 'Theme Pack (visual + suara) didapat dari Gashapon di atas, bukan dibeli.'
                : 'Theme Packs (visual + voice) come from the Gashapon above, not sold here.'}
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
