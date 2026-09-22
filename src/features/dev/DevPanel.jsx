/* ============================================================================
 * DEV-ONLY — SAFE TO REMOVE
 * ----------------------------------------------------------------------------
 * Panel cheat untuk keperluan testing lokal. Hanya muncul saat `npm run dev`
 * (lihat guard `import.meta.env.DEV` di bawah). Saat `npm run build`, kode ini
 * di-tree-shake keluar dari bundle produksi.
 *
 * CARA HAPUS TOTAL:
 *   1. Hapus file ini:  src/features/dev/DevPanel.jsx
 *   2. Di src/pages/Settings.jsx hapus 2 baris yang ditandai  // DEV-ONLY
 *      (baris `import { DevPanel }` dan elemen `<DevPanel />`)
 * ==========================================================================*/

import { useUserStats } from "../progress/ProgressContext";
import { useLanguage } from "../../context/LanguageContext";
import { PACKS } from "../packs/packs";
import { SHOP_ITEMS, countItems } from "../items/items";

// Kunci localStorage yang dipakai ProgressContext
const PROGRESS_KEY = "user_progress_v2";
const ACHIEVEMENTS_KEY = "achievements_unlocked_v2";

const ALL_BADGES = [
  "hiragana_origin", "katakana_edge", "kanji_slayer", "kanji_hell", "eagle_eye",
  "master_calligrapher", "bunpo_student", "bunpo_master", "wordsmith", "the_vault",
  "dictionary_eater", "the_fluent", "golden_ears", "echo_of_truth", "sonic_wave",
  "inner_ear", "undefeated", "godlike", "persistent", "eternal_soul", "consistent",
  "void", "lightning_bolt", "bullseye", "hurricane", "awakened", "night_owl",
  "early_bird", "purifier", "busy_samurai", "no_rest", "festival_goer", "novice",
  "warrior", "venerable", "grand_shogun", "zenith",
];

function readJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

function writeProgress(patch) {
  const current = readJSON(PROGRESS_KEY, {});
  localStorage.setItem(PROGRESS_KEY, JSON.stringify({ ...current, ...patch }));
}

export function DevPanel() {
  const { language } = useLanguage();
  const { progress } = useUserStats();

  // Guard: panel ini TIDAK dirender di build produksi.
  if (!import.meta.env.DEV) return null;

  const reload = () => window.location.reload();
  const id = language === "id";

  const giveMedaru = () => {
    writeProgress({ medaru: 999999 });
    reload();
  };

  const unlockEffect = () => {
    writeProgress({ ownedPacks: ["kotodama_burst"], activePack: "kotodama_burst" });
    reload();
  };

  const unlockAllPacks = () => {
    writeProgress({
      ownedPacks: PACKS.map((p) => p.id),
      activePack: "kotodama_burst",
    });
    reload();
  };

  const unlockAllItems = () => {
    const ownedItems = {};
    SHOP_ITEMS.forEach((i) => { ownedItems[i.id] = 5; });
    writeProgress({ ownedItems });
    reload();
  };

  const unlockBadges = () => {
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(ALL_BADGES));
    reload();
  };

  const maxXp = () => {
    writeProgress({ xp: 25000, level: 100 });
    reload();
  };

  const resetAndCheat = () => {
    localStorage.removeItem(PROGRESS_KEY);
    localStorage.removeItem(ACHIEVEMENTS_KEY);
    const ownedItems = {};
    SHOP_ITEMS.forEach((i) => { ownedItems[i.id] = 5; });
    writeProgress({ medaru: 999999, ownedPacks: PACKS.map((p) => p.id), activePack: "kotodama_burst", ownedItems });
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(ALL_BADGES));
    reload();
  };

  const btn =
    "px-4 py-3 border-[3px] border-sumi font-black text-[11px] uppercase tracking-widest transition-all " +
    "shadow-[3px_3px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#1a1a1a] cursor-pointer";

  return (
    // DEV-ONLY — hapus <section> ini untuk membuang panel cheat.
    <section>
      <div className="flex items-center gap-4 mb-8">
        <h2 className="text-2xl font-serif font-bold text-ai">
          {id ? "Developer" : "Developer"} <span className="text-sm font-sans font-normal text-sumi/40">/ 開発</span>
        </h2>
        <div className="h-[2px] flex-1 bg-ai/20"></div>
        <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-ai/60">DEV ONLY</span>
      </div>

      <div className="border-[3px] border-ai/40 bg-kinari p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.2em] font-bold text-sumi/60 mb-6 leading-relaxed">
          {id
            ? "Panel ini hanya muncul di mode dev. Tidak ikut ke build produksi."
            : "This panel only shows in dev mode. It never ships to production."}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <button type="button" onClick={giveMedaru} className={`${btn} bg-[#ffd700] text-sumi`}>
            🪙 {id ? "Medaru 999999" : "999999 Medaru"}
          </button>
          <button type="button" onClick={unlockEffect} className={`${btn} bg-matcha text-kinari-light`}>
            ✨ {id ? "Buka & Pakai Efek" : "Unlock & Equip Effect"}
          </button>
          <button type="button" onClick={unlockAllPacks} className={`${btn} bg-matcha text-kinari-light`}>
            🎨 {id ? "Buka Semua Pack" : "Unlock All Packs"}
          </button>
          <button type="button" onClick={unlockAllItems} className={`${btn} bg-matcha text-kinari-light`}>
            🎒 {id ? "Buka Semua Barang" : "Unlock All Items"}
          </button>
          <button type="button" onClick={unlockBadges} className={`${btn} bg-shu text-kinari-light`}>
            🏅 {id ? "Buka Semua Badge" : "Unlock All Badges"}
          </button>
          <button type="button" onClick={maxXp} className={`${btn} bg-ai text-kinari-light`}>
            ⭐ {id ? "XP 25000 / Lv 100" : "XP 25000 / Lv 100"}
          </button>
          <button type="button" onClick={resetAndCheat} className={`${btn} bg-sumi text-kinari-light col-span-2 sm:col-span-1`}>
            ♻️ {id ? "Reset + Cheat Ulang" : "Reset + Re-cheat"}
          </button>
        </div>

        <div className="mt-6 pt-6 border-t-[2px] border-sumi/10 text-[10px] font-mono text-sumi/50">
          medaru: {progress.medaru || 0} · packs: {(progress.ownedPacks || []).length} · items: {countItems(progress.ownedItems)} · active: {progress.activePack || "—"}
        </div>
      </div>
    </section>
  );
}
