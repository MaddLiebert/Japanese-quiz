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

import { useEffect, useState } from "react";
import { useUserStats } from "../progress/ProgressContext";
import { useEffectLayer } from "../effects/EffectContext";
import { startDomainBgm, stopDomainBgm, setBallHum, stopBallHum } from "../../utils/gojoAmbience";
import { playClipFile } from "../../utils/sfx";
import { useLanguage } from "../../context/LanguageContext";
import { PACKS, getPack, isPackReady } from "../packs/packs";
import { getVoice } from "../audio/voices.js";
import { SHOP_ITEMS, countItems } from "../items/items";
import { reviewClips, nextClip } from "./reviewClips.js";

// Kunci localStorage yang dipakai ProgressContext
const PROGRESS_KEY = "user_progress_v2";
const ACHIEVEMENTS_KEY = "achievements_unlocked_v2";

// Pack Gojo (lihat src/features/packs/packs.js) — target preview streak.
const GOJO_PACK_ID = "pack_07";
// Pack Yuji (lihat src/features/packs/packs.js) — target preview streak & takeover.
const YUJI_PACK_ID = "pack_09";
// Pack Sukuna — target preview streak & domain 伏魔御廚子.
const SUKUNA_PACK_ID = "pack_14";
// Pack Megumi — target preview streak & summon 魔虚羅 (十種影法術).
const MEGUMI_PACK_ID = "pack_10";
// Pack Nobara — target preview streak & ult 全弾爆発 (芻霊呪法).
const NOBARA_PACK_ID = "pack_08";
// Pack Nanami — target preview streak & ult 時間外労働・全開 (十劃呪法).
const NANAMI_PACK_ID = "pack_11";
// Pack Toji — target preview streak & ult 天与呪縛・全開 (術師殺し).
const TOJI_PACK_ID = "pack_13";

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
  const { progress, togglePack } = useUserStats();
  const { previewStreak, castDomain, castTakeover, previewYujiCombo, castSukunaDomain, castMegumiSummon, castNobaraUlt, castNanamiUlt, castTojiUlt, triggerEffect } = useEffectLayer();
  // Target streak yang menunggu pack Gojo aktif (preview lintas-pack).
  const [pending, setPending] = useState(null);
  // Review suara & skill (dev): karakter terpilih, kursor rotasi klip, status.
  const [reviewVoice, setReviewVoice] = useState(() => progress.activePack || PACKS[0]?.id);
  const [cursors, setCursors] = useState({});
  const [reviewStatus, setReviewStatus] = useState("");

  // Begitu pack Gojo aktif (state sudah ter-update), tembak preview-nya.
  useEffect(() => {
    if (pending == null || progress.activePack !== GOJO_PACK_ID) return;
    setPending(null);
    previewStreak(pending);
  }, [pending, progress.activePack, previewStreak]);

  // Sama seperti Gojo: begitu pack Yuji aktif, tembak preview streak-nya.
  const [pendingYuji, setPendingYuji] = useState(null);
  useEffect(() => {
    if (pendingYuji == null || progress.activePack !== YUJI_PACK_ID) return;
    setPendingYuji(null);
    previewStreak(pendingYuji);
  }, [pendingYuji, progress.activePack, previewStreak]);

  // Sama seperti Yuji: begitu pack Sukuna aktif, tembak preview streak-nya.
  const [pendingSukuna, setPendingSukuna] = useState(null);
  useEffect(() => {
    if (pendingSukuna == null || progress.activePack !== SUKUNA_PACK_ID) return;
    setPendingSukuna(null);
    previewStreak(pendingSukuna);
  }, [pendingSukuna, progress.activePack, previewStreak]);

  // Sama: begitu pack Megumi aktif, tembak preview streak-nya (十種影法術).
  const [pendingMegumi, setPendingMegumi] = useState(null);
  useEffect(() => {
    if (pendingMegumi == null || progress.activePack !== MEGUMI_PACK_ID) return;
    setPendingMegumi(null);
    previewStreak(pendingMegumi);
  }, [pendingMegumi, progress.activePack, previewStreak]);

  // Sama: begitu pack Nobara aktif, tembak preview streak-nya (芻霊呪法).
  const [pendingNobara, setPendingNobara] = useState(null);
  useEffect(() => {
    if (pendingNobara == null || progress.activePack !== NOBARA_PACK_ID) return;
    setPendingNobara(null);
    previewStreak(pendingNobara);
  }, [pendingNobara, progress.activePack, previewStreak]);

  // Sama: begitu pack Nanami aktif, tembak preview streak-nya (十劃呪法).
  const [pendingNanami, setPendingNanami] = useState(null);
  useEffect(() => {
    if (pendingNanami == null || progress.activePack !== NANAMI_PACK_ID) return;
    setPendingNanami(null);
    previewStreak(pendingNanami);
  }, [pendingNanami, progress.activePack, previewStreak]);
  // Sama: begitu pack Toji aktif, tembak preview streak-nya (術師殺し).
  const [pendingToji, setPendingToji] = useState(null);
  useEffect(() => {
    if (pendingToji == null || progress.activePack !== TOJI_PACK_ID) return;
    setPendingToji(null);
    previewStreak(pendingToji);
  }, [pendingToji, progress.activePack, previewStreak]);

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

  // Preview efek Gojo tanpa quiz. Otomatis menyiapkan pack Gojo (aktifkan),
  // lalu menembak satu 'correct' yang mendarat TEPAT di streak target — lewat
  // pipeline yang sama dengan jawaban sungguhan.
  const previewGojo = (target) => {
    if (progress.activePack === GOJO_PACK_ID) {
      previewStreak(target);
      return;
    }
    const owned = (progress.ownedPacks || []).includes(GOJO_PACK_ID);
    if (owned) {
      togglePack(GOJO_PACK_ID);
      setPending(target);
      return;
    }
    // Belum dimiliki → tulis localStorage langsung (pola DevPanel: pack hanya
    // dari gacha, tidak ada jalur beli) + reload → klik sekali lagi.
    writeProgress({
      medaru: 999999,
      ownedPacks: [...(progress.ownedPacks || []), GOJO_PACK_ID],
      activePack: GOJO_PACK_ID,
    });
    reload();
  };

  // Cast domain langsung (dev). Kalau pack Gojo belum aktif → aktifkan dulu
  // (klik sekali lagi untuk cast).
  const castNow = () => {
    if (progress.activePack === GOJO_PACK_ID) { castDomain(); return; }
    previewGojo(20);
  };

  // Preview efek Yuji tanpa quiz (pola previewGojo).
  const previewYuji = (target) => {
    if (progress.activePack === YUJI_PACK_ID) { previewStreak(target); return; }
    const owned = (progress.ownedPacks || []).includes(YUJI_PACK_ID);
    if (owned) { togglePack(YUJI_PACK_ID); setPendingYuji(target); return; }
    writeProgress({
      medaru: 999999,
      ownedPacks: [...(progress.ownedPacks || []), YUJI_PACK_ID],
      activePack: YUJI_PACK_ID,
    });
    reload();
  };

  const castYuji = () => {
    if (progress.activePack === YUJI_PACK_ID) { castTakeover(); return; }
    previewYuji(20);   // aktifkan pack dulu → klik sekali lagi
  };

  const comboYuji = (lvl) => {
    if (progress.activePack !== YUJI_PACK_ID) { previewYuji(20); return; }
    previewYujiCombo(lvl);
  };

  // Preview efek Sukuna tanpa quiz (pola previewYuji).
  const previewSukuna = (target) => {
    if (progress.activePack === SUKUNA_PACK_ID) { previewStreak(target); return; }
    const owned = (progress.ownedPacks || []).includes(SUKUNA_PACK_ID);
    if (owned) { togglePack(SUKUNA_PACK_ID); setPendingSukuna(target); return; }
    writeProgress({
      medaru: 999999,
      ownedPacks: [...(progress.ownedPacks || []), SUKUNA_PACK_ID],
      activePack: SUKUNA_PACK_ID,
    });
    reload();
  };

  const castSukuna = () => {
    if (progress.activePack === SUKUNA_PACK_ID) { castSukunaDomain(); return; }
    previewSukuna(20);   // aktifkan pack dulu → klik sekali lagi
  };

  // Preview efek Megumi tanpa quiz (pola previewSukuna).
  const previewMegumi = (target) => {
    if (progress.activePack === MEGUMI_PACK_ID) { previewStreak(target); return; }
    const owned = (progress.ownedPacks || []).includes(MEGUMI_PACK_ID);
    if (owned) { togglePack(MEGUMI_PACK_ID); setPendingMegumi(target); return; }
    writeProgress({
      medaru: 999999,
      ownedPacks: [...(progress.ownedPacks || []), MEGUMI_PACK_ID],
      activePack: MEGUMI_PACK_ID,
    });
    reload();
  };

  const castMegumi = () => {
    if (progress.activePack === MEGUMI_PACK_ID) { castMegumiSummon(); return; }
    previewMegumi(20);   // aktifkan pack dulu → klik sekali lagi
  };

  // Preview efek Nobara tanpa quiz (pola previewMegumi).
  const previewNobara = (target) => {
    if (progress.activePack === NOBARA_PACK_ID) { previewStreak(target); return; }
    const owned = (progress.ownedPacks || []).includes(NOBARA_PACK_ID);
    if (owned) { togglePack(NOBARA_PACK_ID); setPendingNobara(target); return; }
    writeProgress({
      medaru: 999999,
      ownedPacks: [...(progress.ownedPacks || []), NOBARA_PACK_ID],
      activePack: NOBARA_PACK_ID,
    });
    reload();
  };

  const castNobara = () => {
    if (progress.activePack === NOBARA_PACK_ID) { castNobaraUlt(); return; }
    previewNobara(20);   // aktifkan pack dulu → klik sekali lagi
  };

  // Preview efek Nanami tanpa quiz (pola previewNobara).
  const previewNanami = (target) => {
    if (progress.activePack === NANAMI_PACK_ID) { previewStreak(target); return; }
    const owned = (progress.ownedPacks || []).includes(NANAMI_PACK_ID);
    if (owned) { togglePack(NANAMI_PACK_ID); setPendingNanami(target); return; }
    writeProgress({
      medaru: 999999,
      ownedPacks: [...(progress.ownedPacks || []), NANAMI_PACK_ID],
      activePack: NANAMI_PACK_ID,
    });
    reload();
  };

  const castNanami = () => {
    if (progress.activePack === NANAMI_PACK_ID) { castNanamiUlt(); return; }
    previewNanami(20);   // aktifkan pack dulu → klik sekali lagi
  };

  // Preview efek Toji tanpa quiz (pola previewNanami).
  const previewToji = (target) => {
    if (progress.activePack === TOJI_PACK_ID) { previewStreak(target); return; }
    const owned = (progress.ownedPacks || []).includes(TOJI_PACK_ID);
    if (owned) { togglePack(TOJI_PACK_ID); setPendingToji(target); return; }
    writeProgress({
      medaru: 999999,
      ownedPacks: [...(progress.ownedPacks || []), TOJI_PACK_ID],
      activePack: TOJI_PACK_ID,
    });
    reload();
  };

  const castToji = () => {
    if (progress.activePack === TOJI_PACK_ID) { castTojiUlt(); return; }
    previewToji(20);   // aktifkan pack dulu → klik sekali lagi
  };

  // ── Review suara & skill (dev) ────────────────────────────────────────────
  // Klik karakter = langsung pakai pack-nya (tulis localStorage bila belum
  // dimiliki — pack hanya dari gacha, tidak ada jalur beli) supaya tombol Skill
  // menembak efek pack yang benar. Tombol Suara memutar klip asli berurutan
  // (rotasi kursor), tidak lewat quiz.
  const reviewPack = getPack(reviewVoice);
  const reviewVoiceKey = reviewPack?.voice || null;
  const reviewVoiceDef = getVoice(reviewVoiceKey);
  const clipCount = (kind) => reviewClips(reviewVoiceDef, kind).length;

  const selectReviewPack = (packId) => {
    setReviewVoice(packId);
    setReviewStatus("");
    if (progress.activePack === packId) return;
    const owned = (progress.ownedPacks || []).includes(packId);
    if (owned) { togglePack(packId); return; }
    // Belum dimiliki → tulis localStorage langsung + reload → klik sekali lagi.
    writeProgress({
      medaru: 999999,
      ownedPacks: [...(progress.ownedPacks || []), packId],
      activePack: packId,
    });
    reload();
  };

  const playReview = (kind) => {
    const clips = reviewClips(reviewVoiceDef, kind);
    if (clips.length === 0) {
      setReviewStatus(reviewVoiceDef?.silent
        ? `${kind}: pack senyap (klip dihapus).`
        : `${kind}: tidak ada klip → saat kuis pakai synth (gong/thud).`);
      return;
    }
    const key = `${reviewVoiceKey}:${kind}`;
    const r = nextClip(clips, cursors[key] || 0);
    playClipFile(r.path);
    setCursors((c) => ({ ...c, [key]: r.cursor }));
    setReviewStatus(`${r.path} (${r.index + 1}/${clips.length})`);
  };

  const fireSkill = (type) => {
    if (!progress.activePack) { setReviewStatus("Tidak ada pack aktif — klik karakter dulu."); return; }
    triggerEffect(type);
    setReviewStatus(`skill ${type} → pack ${getPack(progress.activePack)?.name || progress.activePack}`);
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

        {/* DEV-ONLY — Preview efek Gojo tanpa quiz (streak 50/100 tidak mungkin di-grind) */}
        <div className="mt-8 pt-6 border-t-[2px] border-sumi/10">
          <p className="text-xs uppercase tracking-[0.2em] font-bold text-sumi/60 mb-2">
            {id ? "Preview Efek Gojo (tanpa quiz)" : "Gojo Effect Preview (no quiz)"}
          </p>
          <p className="text-[11px] text-sumi/50 font-semibold mb-4 leading-relaxed">
            {id
              ? "Satu klik = satu jawaban benar di streak target. Pack Gojo otomatis dibeli & diaktifkan bila perlu. Bola/ledakan muncul di layar ini."
              : "One click = one correct answer at the target streak. Gojo pack is bought & equipped automatically if needed."}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <button type="button" onClick={() => previewGojo(3)} className={`${btn} bg-[#9c27b0] text-kinari-light`}>
              🟣 {id ? "茈 #3" : "茈 #3"}
            </button>
            <button type="button" onClick={() => previewGojo(50)} className={`${btn} bg-[#9c27b0] text-kinari-light`}>
              🟣 {id ? "茈 #50" : "茈 #50"}
            </button>
            <button type="button" onClick={() => previewGojo(100)} className={`${btn} bg-[#9c27b0] text-kinari-light`}>
              🟣 {id ? "茈 #100" : "茈 #100"}
            </button>
            <button type="button" onClick={() => previewGojo(20)} className={`${btn} bg-[#ffd700] text-sumi`}>
              ⚡ {id ? "Isi Bar #20" : "Fill Bar #20"}
            </button>
            <button type="button" onClick={castNow} className={`${btn} bg-[#7c4dff] text-kinari-light`}>
              🌌 {id ? "Cast 領域展開" : "Cast Domain"}
            </button>
            <button type="button" onClick={() => previewGojo(1)} className={`${btn} bg-[#38bdf8] text-sumi`}>
              🔵 {id ? "蒼 #1" : "Ao #1"}
            </button>
            <button type="button" onClick={() => previewGojo(2)} className={`${btn} bg-[#ef4444] text-kinari-light`}>
              🔴 {id ? "赫 #2" : "Aka #2"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.__gojoAmbience?.bgm) stopDomainBgm();
                else startDomainBgm();
              }}
              className={`${btn} bg-[#7c4dff] text-kinari-light`}
            >
              🎵 {id ? "Tes BGM 領域展開" : "Test Domain BGM"}
            </button>
            <button
              type="button"
              onClick={() => {
                const on = window.__gojoAmbience?.balls?.ao || window.__gojoAmbience?.balls?.aka;
                if (on) stopBallHum();
                else setBallHum({ ao: true, aka: true });
              }}
              className={`${btn} bg-[#0ea5e9] text-kinari-light`}
            >
              🔊 {id ? "Tes Hum Bola" : "Test Ball Hum"}
            </button>
          </div>
        </div>

        {/* DEV-ONLY — Preview efek Yuji tanpa quiz */}
        <div className="mt-8 pt-6 border-t-[2px] border-sumi/10">
          <p className="text-xs uppercase tracking-[0.2em] font-bold text-sumi/60 mb-2">
            {id ? "Preview Efek Yuji (tanpa quiz)" : "Yuji Effect Preview (no quiz)"}
          </p>
          <p className="text-[11px] text-sumi/50 font-semibold mb-4 leading-relaxed">
            {id
              ? "Satu klik = satu jawaban benar di streak target. Pack Yuji otomatis diaktifkan bila perlu. Combo 解/捌/開 menembak takeover (cast otomatis bila belum)."
              : "One click = one correct answer at the target streak. Yuji pack is equipped automatically if needed. Combo 解/捌/開 fires the takeover (auto-cast if needed)."}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <button type="button" onClick={() => previewYuji(1)} className={`${btn} bg-[#00b0ff] text-sumi`}>
              🔵 {id ? "逕庭拳 #1" : "Keiteiken #1"}
            </button>
            <button type="button" onClick={() => previewYuji(2)} className={`${btn} bg-[#00b0ff] text-sumi`}>
              🔵 {id ? "卍蹴り #2" : "Manji-geri #2"}
            </button>
            <button type="button" onClick={() => previewYuji(3)} className={`${btn} bg-sumi text-kinari-light`}>
              ⚫ {id ? "黒閃 #3" : "Kokusen #3"}
            </button>
            <button type="button" onClick={() => previewYuji(60)} className={`${btn} bg-[#8b0000] text-kinari-light`}>
              🔴 {id ? "穿血 #60" : "Senketsu #60"}
            </button>
            <button type="button" onClick={() => previewYuji(20)} className={`${btn} bg-[#ffd700] text-sumi`}>
              ⚡ {id ? "Isi Bar #20" : "Fill Bar #20"}
            </button>
            <button type="button" onClick={castYuji} className={`${btn} bg-[#6d28d9] text-kinari-light`}>
              🟣 {id ? "Cast 宿儺の器" : "Cast Takeover"}
            </button>
            <button type="button" onClick={() => comboYuji(1)} className={`${btn} bg-kinari-light text-sumi`}>
              ⚔️ {id ? "Combo 解" : "Combo 解"}
            </button>
            <button type="button" onClick={() => comboYuji(2)} className={`${btn} bg-kinari-light text-sumi`}>
              ⚔️ {id ? "Combo 捌" : "Combo 捌"}
            </button>
            <button type="button" onClick={() => comboYuji(3)} className={`${btn} bg-[#e0241a] text-kinari-light`}>
              🔥 {id ? "Combo 開" : "Combo 開"}
            </button>
          </div>
        </div>

        {/* DEV-ONLY — Preview efek Sukuna tanpa quiz */}
        <div className="mt-8 pt-6 border-t-[2px] border-sumi/10">
          <p className="text-xs uppercase tracking-[0.2em] font-bold text-sumi/60 mb-2">
            {id ? "Preview Efek Sukuna (tanpa quiz)" : "Sukuna Effect Preview (no quiz)"}
          </p>
          <p className="text-[11px] text-sumi/50 font-semibold mb-4 leading-relaxed">
            {id
              ? "Satu klik = satu jawaban benar di streak target. Pack Sukuna otomatis diaktifkan bila perlu. Non-momen = ROTASI 蜘蛛の糸 #1 / 鵺 #2 / 蜘蛛の糸 #3 … Momen: 伏魔御廚子 #20 / 龍鱗 #30 / 世界断つ #50. Cast 領域展開・伏魔御廚子 menyalakan domain (bar 4 lengan + 必中)."
              : "One click = one correct answer at the target streak. Sukuna pack is equipped automatically if needed. Non-moments ROTATE 蜘蛛の糸 #1 / 鵺 #2 / 蜘蛛の糸 #3 … Moments: 伏魔御廚子 #20 / 龍鱗 #30 / 世界断つ #50. Cast 領域展開・伏魔御廚子 fires the domain (4-arm bar + 必中)."}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <button type="button" onClick={() => previewSukuna(1)} className={`${btn} bg-[#e5e7eb] text-sumi`}>
              🕸️ {id ? "蜘蛛の糸 #1" : "Kumo no Ito #1"}
            </button>
            <button type="button" onClick={() => previewSukuna(2)} className={`${btn} bg-[#4c1d95] text-kinari-light`}>
              🦉 {id ? "鵺 #2" : "Nue #2"}
            </button>
            <button type="button" onClick={() => previewSukuna(20)} className={`${btn} bg-[#ea580c] text-kinari-light`}>
              🔥 {id ? "伏魔御廚子 #20" : "Fukuma #20"}
            </button>
            <button type="button" onClick={() => previewSukuna(30)} className={`${btn} bg-[#0f766e] text-kinari-light`}>
              🐉 {id ? "龍鱗 #30" : "Ryurin #30"}
            </button>
            <button type="button" onClick={() => previewSukuna(50)} className={`${btn} bg-[#7f1d1d] text-kinari-light`}>
              ⚔️ {id ? "世界断つ #50" : "Sekai Tatsu #50"}
            </button>
            <button type="button" onClick={castSukuna} className={`${btn} bg-[#c1121f] text-kinari-light`}>
              👁️ {id ? "Cast 伏魔御廚子" : "Cast Domain"}
            </button>
          </div>
        </div>

        {/* DEV-ONLY — Preview efek Megumi tanpa quiz */}
        <div className="mt-8 pt-6 border-t-[2px] border-sumi/10">
          <p className="text-xs uppercase tracking-[0.2em] font-bold text-sumi/60 mb-2">
            {id ? "Preview Efek Megumi (tanpa quiz)" : "Megumi Effect Preview (no quiz)"}
          </p>
          <p className="text-[11px] text-sumi/50 font-semibold mb-4 leading-relaxed">
            {id
              ? "Satu klik = satu jawaban benar di streak target. Pack Megumi otomatis diaktifkan bila perlu. Non-momen = ROTASI 玉犬 #1 / 鵺 #2 … Momen: 大蛇 #10 / 満象 #20 / 虎葬 #30+. Cast 魔虚羅 menyalakan summon 30 dtk (roda 八握剣 8 takik + mekanik 適応)."
              : "One click = one correct answer at the target streak. Megumi pack is equipped automatically if needed. Non-moments ROTATE 玉犬 #1 / 鵺 #2 … Moments: 大蛇 #10 / 満象 #20 / 虎葬 #30+. Cast 魔虚羅 starts the 30s summon (8-notch 八握剣 wheel + 適応 mechanic)."}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <button type="button" onClick={() => previewMegumi(1)} className={`${btn} bg-[#cbd5e1] text-sumi`}>
              🐺 {id ? "玉犬 #1" : "Gyokuken #1"}
            </button>
            <button type="button" onClick={() => previewMegumi(2)} className={`${btn} bg-[#4338ca] text-kinari-light`}>
              🦉 {id ? "鵺 #2" : "Nue #2"}
            </button>
            <button type="button" onClick={() => previewMegumi(10)} className={`${btn} bg-[#14b8a6] text-kinari-light`}>
              🐍 {id ? "大蛇 #10" : "Orochi #10"}
            </button>
            <button type="button" onClick={() => previewMegumi(20)} className={`${btn} bg-[#38bdf8] text-sumi`}>
              🐘 {id ? "満象 #20" : "Bansou #20"}
            </button>
            <button type="button" onClick={() => previewMegumi(30)} className={`${btn} bg-[#f59e0b] text-sumi`}>
              🐯 {id ? "虎葬 #30" : "Kosou #30"}
            </button>
            <button type="button" onClick={castMegumi} className={`${btn} bg-[#6d28d9] text-kinari-light`}>
              🌑 {id ? "Cast 魔虚羅" : "Cast Mahoraga"}
            </button>
          </div>
        </div>

        {/* DEV-ONLY — Preview efek Nobara tanpa quiz */}
        <div className="mt-8 pt-6 border-t-[2px] border-sumi/10">
          <p className="text-xs uppercase tracking-[0.2em] font-bold text-sumi/60 mb-2">
            {id ? "Preview Efek Nobara (tanpa quiz)" : "Nobara Effect Preview (no quiz)"}
          </p>
          <p className="text-[11px] text-sumi/50 font-semibold mb-4 leading-relaxed">
            {id
              ? "Satu klik = satu jawaban benar di streak target. Pack Nobara otomatis diaktifkan bila perlu. Non-momen = ROTASI 簪 #1 / 簪・連 #2 … Momen: 簪・時限 #10 / 共鳴り #20 / 黒閃 #30+. Cast 全弾爆発 meledakkan semua opsi salah (sisakan 1) selama 2.2 dtk."
              : "One click = one correct answer at the target streak. Nobara pack is equipped automatically if needed. Non-moments ROTATE 簪 #1 / 簪・連 #2 … Moments: 簪・時限 #10 / 共鳴り #20 / 黒閃 #30+. Cast 全弾爆発 explodes all wrong options (keep 1) over 2.2s."}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <button type="button" onClick={() => previewNobara(1)} className={`${btn} bg-[#f97316] text-kinari-light`}>
              📌 {id ? "簪 #1" : "Kanzashi #1"}
            </button>
            <button type="button" onClick={() => previewNobara(2)} className={`${btn} bg-[#fb923c] text-sumi`}>
              📌 {id ? "簪・連 #2" : "Kanzashi Ren #2"}
            </button>
            <button type="button" onClick={() => previewNobara(10)} className={`${btn} bg-[#fbbf24] text-sumi`}>
              ⏱️ {id ? "簪・時限 #10" : "Kanzashi Jigen #10"}
            </button>
            <button type="button" onClick={() => previewNobara(20)} className={`${btn} bg-[#dc2626] text-kinari-light`}>
              🪡 {id ? "共鳴り #20" : "Tomonari #20"}
            </button>
            <button type="button" onClick={() => previewNobara(30)} className={`${btn} bg-[#0f172a] text-kinari-light`}>
              ⚡ {id ? "黒閃 #30" : "Kokusen #30"}
            </button>
            <button type="button" onClick={castNobara} className={`${btn} bg-[#7c2d12] text-kinari-light`}>
              💥 {id ? "Cast 全弾爆発" : "Cast Ultimate"}
            </button>
          </div>
        </div>

        {/* DEV-ONLY — Preview efek Nanami tanpa quiz */}
        <div className="mt-8 pt-6 border-t-[2px] border-sumi/10">
          <p className="text-xs uppercase tracking-[0.2em] font-bold text-sumi/60 mb-2">
            {id ? "Preview Efek Nanami (tanpa quiz)" : "Nanami Effect Preview (no quiz)"}
          </p>
          <p className="text-[11px] text-sumi/50 font-semibold mb-4 leading-relaxed">
            {id
              ? "Satu klik = satu jawaban benar di streak target. Pack Nanami otomatis diaktifkan bila perlu. Non-momen = ROTASI 七三 #1 / 大鉈 #2 … Momen: 瓦落瓦落 #10 / 黒閃 #20 / 時間外労働 #30+. Cast 時間外労働・全開 = cinematic 2.4 dtk lalu state lembur 30 dtk (T3)."
              : "One click = one correct answer at the target streak. Nanami pack is equipped automatically if needed. Non-moments ROTATE Shichisan #1 / Oonata #2 … Moments: Garagara #10 / Kokusen #20 / Jikangai #30+. Cast Overtime: All-Out = 2.4s cinematic then 30s overtime state (T3)."}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <button type="button" onClick={() => previewNanami(1)} className={`${btn} bg-[#b45309] text-kinari-light`}>
              ⚖️ {id ? "七三 #1" : "Shichisan #1"}
            </button>
            <button type="button" onClick={() => previewNanami(2)} className={`${btn} bg-[#1e3a8a] text-kinari-light`}>
              🗡️ {id ? "大鉈 #2" : "Oonata #2"}
            </button>
            <button type="button" onClick={() => previewNanami(10)} className={`${btn} bg-[#f59e0b] text-sumi`}>
              🧱 {id ? "瓦落瓦落 #10" : "Garagara #10"}
            </button>
            <button type="button" onClick={() => previewNanami(20)} className={`${btn} bg-[#0a0a0a] text-kinari-light`}>
              ⚡ {id ? "黒閃 #20" : "Kokusen #20"}
            </button>
            <button type="button" onClick={() => previewNanami(30)} className={`${btn} bg-[#78350f] text-kinari-light`}>
              🕐 {id ? "時間外労働 #30" : "Jikangai #30"}
            </button>
            <button type="button" onClick={castNanami} className={`${btn} bg-[#dc2626] text-kinari-light`}>
              💼 {id ? "Cast 全開" : "Cast Ultimate"}
            </button>
          </div>
        </div>

        {/* DEV-ONLY — Preview efek Toji tanpa quiz */}
        <div className="mt-8 pt-6 border-t-[2px] border-sumi/10">
          <p className="text-xs uppercase tracking-[0.2em] font-bold text-sumi/60 mb-2">
            {id ? "Preview Efek Toji (tanpa quiz)" : "Toji Effect Preview (no quiz)"}
          </p>
          <p className="text-[11px] text-sumi/50 font-semibold mb-4 leading-relaxed">
            {id
              ? "Satu klik = satu jawaban benar di streak target. Pack Toji otomatis diaktifkan bila perlu. Non-momen = ROTASI 釈魂刀 #1 / 万里ノ鎖 #2 … Momen: 天逆鉾 #10 / 遊雲 #20 / 武器庫呪霊 #30+. Cast 天与呪縛・全開 = cinematic 2,78 dtk (sync cast.mp3) lalu state 30 dtk (T3) — mulai dengan 武器 ×2 (Opsi A): salah saat state membunuh soal (術師殺し)."
              : "One click = one correct answer at the target streak. Toji pack is equipped automatically if needed. Non-moments ROTATE Shakkontou #1 / Banri no Kusari #2 … Moments: Amanosakahoko #10 / Yuuyun #20 / Bukiko Jurei #30+. Cast Heavenly Restriction: Full Release = 2.78s cinematic (cast.mp3-synced) then 30s state (T3) — starts with 武器 ×2 (Option A): a wrong answer during the state kills the question (術師殺し)."}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <button type="button" onClick={() => previewToji(1)} className={`${btn} bg-[#cbd5e1] text-sumi`}>
              🔪 {id ? "釈魂刀 #1" : "Shakkontou #1"}
            </button>
            <button type="button" onClick={() => previewToji(2)} className={`${btn} bg-[#3f3f46] text-kinari-light`}>
              ⛓️ {id ? "万里ノ鎖 #2" : "Banri #2"}
            </button>
            <button type="button" onClick={() => previewToji(10)} className={`${btn} bg-[#ffffff] text-sumi border-sumi`}>
              🗡️ {id ? "天逆鉾 #10" : "Amanosakahoko #10"}
            </button>
            <button type="button" onClick={() => previewToji(20)} className={`${btn} bg-[#0c0c0c] text-kinari-light`}>
              ☁️ {id ? "遊雲 #20" : "Yuuyun #20"}
            </button>
            <button type="button" onClick={() => previewToji(30)} className={`${btn} bg-[#5b21b6] text-kinari-light`}>
              👁️ {id ? "武器庫呪霊 #30" : "Bukiko Jurei #30"}
            </button>
            <button type="button" onClick={castToji} className={`${btn} bg-[#dc2626] text-kinari-light`}>
              🩸 {id ? "Cast 全開" : "Cast Ultimate"}
            </button>
          </div>
        </div>

        {/* DEV-ONLY — Review suara & skill per karakter (tanpa quiz) */}
        <div className="mt-8 pt-6 border-t-[2px] border-sumi/10">
          <p className="text-xs uppercase tracking-[0.2em] font-bold text-sumi/60 mb-2">
            {id ? "Review Suara & Skill (tanpa quiz)" : "Voice & Skill Review (no quiz)"}
          </p>
          <p className="text-[11px] text-sumi/50 font-semibold mb-4 leading-relaxed">
            {id
              ? "Klik karakter → pack langsung dipakai (dibeli otomatis bila perlu). Tombol Suara memutar klip asli berurutan tiap klik; Skill menembak efek pack yang sedang aktif."
              : "Click a character → pack is equipped (bought automatically if needed). Voice plays the real clips in order on each click; Skill fires the active pack's effect."}
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {PACKS.filter(isPackReady).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => selectReviewPack(p.id)}
                className={`${btn} ${reviewVoice === p.id ? "bg-sumi text-kinari-light" : "bg-kinari-light text-sumi"}`}
              >
                {p.icon} {p.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {["correct", "wrong", "streak"].map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => playReview(kind)}
                className={`${btn} bg-kinari-light text-sumi`}
              >
                🎙️ {kind} ({clipCount(kind)})
              </button>
            ))}
            <button type="button" onClick={() => fireSkill("correct")} className={`${btn} bg-matcha text-kinari-light`}>
              ⚡ Skill Benar
            </button>
            <button type="button" onClick={() => fireSkill("wrong")} className={`${btn} bg-shu text-kinari-light`}>
              💥 Skill Salah
            </button>
          </div>

          <p className="text-[10px] font-mono text-sumi/50 mt-4">
            {reviewStatus || `aktif: ${reviewPack ? `${reviewPack.icon} ${reviewPack.name}` : "—"} · voice: ${reviewVoiceKey || "—"}`}
          </p>
        </div>

        <div className="mt-6 pt-6 border-t-[2px] border-sumi/10 text-[10px] font-mono text-sumi/50">
          medaru: {progress.medaru || 0} · packs: {(progress.ownedPacks || []).length} · items: {countItems(progress.ownedItems)} · active: {progress.activePack || "—"}
        </div>
      </div>
    </section>
  );
}
