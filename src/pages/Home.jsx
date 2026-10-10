import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "../components/ui/Button";
import { useUserStats, useItemProgress, useAchievements, getRank } from "../features/progress/ProgressContext";
import { pickBadges, knownBadges } from "../features/progress/badges";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { countMasteredKanji, isN5ExamUnlocked, N5_EXAM_MIN_MASTERED_KANJI } from "../features/n5exam/n5exam";
import { DailyQuestPanel } from "../features/quests/DailyQuestPanel";
import { EraDivider } from "../components/EraDivider";
import { EraTategaki } from "../components/EraTategaki";
import { EraVillageArt, EraNightArt } from "../components/EraArtwork";
import { EdoPrintArt } from "../components/EdoArtwork";
import { MeijiPrintArt } from "../components/MeijiArtwork";
import { EdoLantern, EdoNoren } from "../components/EdoOrnament";
import { MeijiGaslight, MeijiBunsen } from "../components/MeijiOrnament";
import { ShowaDenchu, ShowaKanban, ShowaTower } from "../components/ShowaOrnament";
import { AnimeFilm, AnimePanel, AnimeGate } from "../components/AnimeOrnament";
import { ShowaPrintArt } from "../components/ShowaArtwork";

import { StreakIndicator } from "../components/StreakIndicator";
import { RankBadge } from "../features/progress/RankBadge";
import { Glyph } from "../components/icons/Glyph";
import { useEra } from "../features/theme/EraContext";
import { streakCopy } from "../features/progress/streakCopy";
import { isEraUnlocked } from "../features/theme/eras";
import { isLegendary, badgeCircleClass } from "../features/progress/badgeSeal";
import { LegendaryDecor } from "../features/progress/BadgeDecor";
// Hanko Stamp component — reused for level and achievements
const HankoStamp = ({ text, label, delay = 0.5 }) => (
  <motion.div
    initial={{ scale: 2, opacity: 0, rotate: 15 }}
    animate={{ scale: 1, opacity: 1, rotate: -5 }}
    transition={{ type: "spring", stiffness: 150, damping: 10, delay }}
    className="relative flex flex-col items-center justify-center w-20 h-20 rounded-full border-[4px] border-shu text-shu overflow-hidden bg-kinari-light shadow-sm"
  >
    <div className="absolute inset-0 border-[2px] border-shu opacity-60 m-1 rounded-full"></div>
    <span className="text-[10px] uppercase font-bold tracking-[0.2em] mt-2 mb-0.5">{label}</span>
    <span className="text-3xl font-serif font-black leading-none">{text}</span>
  </motion.div>
);

// Achievement stamp component
const AchievementStamp = ({ id, meta, index }) => (
  <motion.div
    initial={{ scale: 2, opacity: 0, rotate: 15 }}
    animate={{ scale: 1, opacity: 1, rotate: (index % 2 === 0 ? -6 : 4) }}
    transition={{ type: "spring", stiffness: 160, damping: 10, delay: 0.1 * index }}
    className="flex flex-col items-center gap-3"
  >
    <div className={`relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full text-shu bg-kinari-light shadow-md ${badgeCircleClass(id)}`}>
      <div className="absolute inset-0 border-[2px] border-current opacity-50 m-1.5 rounded-full"></div>
      {isLegendary(id) && <LegendaryDecor />}
      <span className="text-3xl sm:text-4xl font-serif font-black leading-none z-10">{meta.label}</span>
    </div>
    <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-sumi/60 text-center max-w-[5rem]">{meta.title}</span>
  </motion.div>
);

export function Home() {
  const { progress, username, setUsername } = useUserStats();
  const { weakItems, itemProgress } = useItemProgress();
  const { achievements, ACHIEVEMENT_META, selectedBadges } = useAchievements();
  const [inputName, setInputName] = useState("");
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { era } = useEra();
  const ST = streakCopy(era, language);

  // Badge yang tampil di Home (maks 4) + sisa yang disembunyikan (untuk link Profil).
  // knownBadges: buang ID tanpa meta supaya angka "+N" selalu = badge yang benar-benar tampil.
  const visibleBadges = knownBadges(achievements, ACHIEVEMENT_META);
  const homeBadges = pickBadges(visibleBadges, selectedBadges);
  const hiddenBadgeCount = Math.max(0, visibleBadges.length - homeBadges.length);

  const progressPercentage = (progress.xp > 0 && progress.xp % 100 === 0) ? 100 : (progress.xp % 100);

  // Death Quiz 死闘 — terkunci sampai rank Shogun (gate dari getRank, sumber tunggal).
  const deathUnlocked = getRank(progress.xp || 0).startsWith('Shogun');

  // N5 Exam 模擬試験 — butuh rank Shogun DAN minimal 30 kanji sudah hafal (mastered).
  const masteredKanji = countMasteredKanji(itemProgress);
  const n5Unlocked = isN5ExamUnlocked(getRank(progress.xp || 0), masteredKanji);

  // 活字組み (Typesetting) — terbuka di era Meiji (gate Lv 50, sumber tunggal eras.js).
  const typesettingUnlocked = isEraUnlocked('meiji', progress.level || 1);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-16 min-h-screen">
      {/* Soft Login Modal */}
      {!username && (
        <div className="fixed inset-0 z-50 bg-kinari flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md border-[4px] border-sumi bg-kinari-light p-8 shadow-[8px_8px_0_0_#1a1a1a] relative ink-edge"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-sumi text-kinari-light flex items-center justify-center font-serif text-xl font-black">
                名
              </div>
              <div>
                <h3 className="text-xl font-serif font-black text-sumi">
                  {language === 'id' ? 'Selamat Datang' : 'Welcome'}
                </h3>
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-sumi/60">
                  {language === 'id' ? 'Masukkan Nama Pengguna' : 'Enter Your Nickname'}
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (inputName.trim()) {
                  setUsername(inputName.trim());
                }
              }}
              className="flex flex-col gap-4"
            >
              <input
                type="text"
                required
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                placeholder={language === 'id' ? "Masukkan Nickname-mu..." : "Enter your nickname..."}
                className="w-full border-[3px] border-sumi bg-kinari px-4 py-3 text-sm font-bold text-sumi placeholder:text-sumi/40 focus:outline-none focus:bg-kinari-light transition-colors"
                autoFocus
              />
              <Button
                type="submit"
                className="w-full bg-ai text-kinari-light rounded-none border-[3px] border-sumi text-xs py-3.5 uppercase font-bold tracking-widest shadow-[4px_4px_0_0_#1a1a1a] hover:shadow-[1px_1px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                {language === 'id' ? 'Masuk' : 'Submit'}
              </Button>
              <Button
                type="button"
                onClick={() => setUsername("Guest")}
                className="w-full bg-kinari text-sumi rounded-none border-[3px] border-sumi text-xs py-3 uppercase font-bold tracking-widest shadow-[3px_3px_0_0_#1a1a1a] hover:shadow-[1px_1px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                {language === 'id' ? 'Lanjut sebagai Tamu (Skip)' : 'Continue as Guest (Skip)'}
              </Button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Greeting */}
      {username && (
        <div className="text-xs uppercase tracking-widest font-bold text-sumi/60 mb-4">
          Okaeri, {username}
        </div>
      )}

      {/* Outer Editorial Frame (Magazine Spread Concept) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="border-[4px] border-sumi bg-kinari-light relative overflow-hidden shadow-[12px_12px_0_0_rgba(26,26,26,0.1)] heian-enter paper-deckle"
      >

        {/* Background Decorative Kanji */}
        <div className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/4 text-[30rem] font-serif text-sumi opacity-[0.04] pointer-events-none select-none leading-none z-0">
          語
        </div>

        {/* --- HEADER --- */}
        <header className="grid grid-cols-1 sm:grid-cols-12 border-b-[4px] border-sumi relative z-10">
          <div className="home-hero-bg sm:col-span-8 p-6 sm:p-12 flex flex-col justify-between border-b-[4px] sm:border-b-0 sm:border-r-[4px] border-sumi relative overflow-hidden">
            <div className="home-hero-veil absolute inset-0 bg-gradient-to-br from-kinari-light/85 via-kinari-light/40 to-transparent pointer-events-none"></div>

            {/* Vignette 江戸 chōnin — "昼は市、夜は提灯" (siang pasar, malam lentera):
                暖簾 noren (tirai toko = siang pasar) dengan 提灯 chochin (lentera)
                menggantung di bawahnya, seperti muka toko Edo. Lentera berayun
                ikut momentum scroll (bandul). Hanya era Edo (di-gate .edo-ornament). */}
            <div className="edo-shopfront absolute top-0 right-4 sm:right-10 z-20 flex flex-col items-center">
              <EdoNoren className="w-20 sm:w-28" />
              <EdoLantern className="-mt-1 w-10 sm:w-12" kanji="学" />
            </div>

            {/* Hiasan Meiji 明治 — 瓦斯灯 lampu gas Ginza (analog 提灯 Edo:
                gantung & berayun ikut scroll; menyala saat malam) + 文選 rak
                huruf 活字. HANYA era Meiji (di-gate .meiji-ornament). */}
            <MeijiGaslight className="meiji-hero-lamp absolute top-0 right-2 sm:right-6 w-8 sm:w-11 z-20" />
            <MeijiBunsen className="meiji-hero-bunsen absolute bottom-3 right-3 sm:right-8 w-20 sm:w-28 z-20" />

            {/* Hiasan Shōwa 昭和 — 電柱 tiang beton + 架線 kabel (analog 提灯/瓦斯灯:
                gantung & berayun, tapi paling BERAT; lampu sodium menyala saat
                malam 夜の団地) + 看板 papan 商店街 + 東京タワー menara 1958.
                HANYA era Shōwa (di-gate .showa-ornament). */}
            <ShowaDenchu className="showa-hero-denchu" />
            <ShowaKanban className="showa-hero-kanban absolute bottom-3 right-3 sm:right-8 w-24 sm:w-32 z-20" />
            <ShowaTower className="showa-hero-tower absolute bottom-0 right-28 sm:right-40 w-10 sm:w-14 z-0" />

            {/* Hiasan 多元 ANIME MULTIVERSE — フィルム＋セル画 strip film bergoyang
                (analog 提灯/瓦斯灯/電柱: gantung & berayun, tapi paling CERIA;
                sel bercahaya saat malam 深夜アニメ) + コマ割り題字 panel manga
                (題字 多元 + balon KOSONG = kanvas menunggu) + 多世界の扉 gerbang
                panel bertumpuk (tiap panel = 1 dunia, siluet generik).
                HANYA era 多元 (di-gate .anime-ornament). */}
            <AnimeFilm className="anime-hero-film" />
            <AnimePanel className="anime-hero-panel absolute bottom-3 right-3 sm:right-8 w-28 sm:w-36 z-20" />
            <AnimeGate className="anime-hero-gate absolute bottom-0 right-32 sm:right-48 w-14 sm:w-20 z-0" />

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3 sm:gap-4 mb-12 sm:mb-20 relative z-20"
            >
              <div className="home-hero-mark w-12 h-12 shrink-0 bg-sumi text-kinari-light flex items-center justify-center font-serif text-2xl rotate-3">
                学
              </div>
              <div className="flex flex-col min-w-0">
                <span className="home-hero-title text-base sm:text-xl font-serif font-black leading-none text-sumi whitespace-nowrap">
                  日本語学園
                </span>
                <span className="home-hero-sub text-[10px] sm:text-[11px] uppercase tracking-[0.32em] font-bold text-sumi/70 mt-1.5 whitespace-nowrap">
                  Nihongo Gakuen
                </span>
                <span className="text-[9px] sm:text-[10px] text-sumi/50 uppercase tracking-[0.16em] mt-1">
                  {language === 'id' ? 'Kuis Bahasa Jepang · N5' : 'Japanese Language Quiz · N5'}
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative z-20"
            >
              <h1 className="home-hero-h1 text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-serif font-black text-sumi tracking-tighter leading-[0.9]">
                日本語<br />
                <span className="home-hero-h1-accent text-shu">基礎</span>
              </h1>
            </motion.div>

            {/* 縦書き 平安 — label gulungan (kanan→kiri), sinyal manuskrip Heian */}
            <EraTategaki className="absolute top-8 right-6 sm:top-12 sm:right-10 text-4xl sm:text-6xl text-sumi/20 z-20">
              平安
            </EraTategaki>

            {/* Lukisan desa 里 (domain publik, Rimpa) — mengisi ruang hero,
                luluh diagonal ke kertas (tanpa tepi kotak). Heian saja. */}
            <EraVillageArt className="era-photo--village absolute inset-x-0 bottom-0 w-full h-[82%] object-cover object-bottom z-0" />
          </div>

          <div className="sm:col-span-4 p-8 flex flex-col items-center justify-center bg-kinari relative">
            <div className="absolute top-6 right-6 text-[10px] font-bold uppercase tracking-[0.3em] text-sumi/40 writing-vertical-rl">
              {language === 'id' ? 'Status Kamu' : 'Current Status'}
            </div>
            <HankoStamp label={language === 'id' ? 'Level' : 'Level'} text={progress.level} />

            {/* Level Progress Bar */}
            <div className="w-full mt-5 px-2">
              <div className="w-full h-2 border-2 border-sumi bg-kinari overflow-hidden rounded-full">
                <motion.div
                  className="h-full bg-ai rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.6 }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-sumi/40">Lv. {progress.level}</span>
                <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-sumi/40">Lv. {progress.level + 1}</span>
              </div>
            </div>

            <div className="mt-5">
              <RankBadge xp={progress.xp} variant="hero" showProgress />
            </div>
            <p className="text-xs text-sumi/60 uppercase tracking-widest font-bold mt-3">
              {progress.xp.toLocaleString()} {language === 'id' ? 'Total XP' : 'Total XP'}
            </p>
          </div>
        </header>

        {/* Pemisah awan suyari-gasumi 霞 — bahasa bentuk era Heian (era lain: garis tipis) */}
        <EraDivider />

        {/* --- MAIN CONTENT GRID --- */}
        <div className="grid grid-cols-1 sm:grid-cols-12 relative z-10 heian-enter-2">

          {/* LEFT COL: Up Next (Focal Point) — lukisan laut malam 月夜 "bleed"
              dari sudut kanan-atas (tempat Module 04), luluh ke kertas. */}
          <div className="sm:col-span-7 border-b-[4px] sm:border-b-0 sm:border-r-[4px] border-sumi p-6 sm:p-10 bg-kinari-light relative overflow-hidden group flex flex-col min-h-[540px] sm:min-h-[620px]">

            {/* Lukisan 月夜 (domain publik) — menempel di sudut kanan-atas lalu
                luluh diagonal ke kertas (mask radial). Tanpa bingkai → bukan
                tempelan. Heian saja. */}
            <EraNightArt className="era-photo--night absolute top-0 right-0 w-[78%] h-[84%] object-cover object-top z-0" />

            {/* Cetakan kayu 浮世絵 (buatan sendiri: 富士 Fuji + 日の丸 + 波) —
                mengisi ruang yang sama di era Edo (lukisan Heian di atas
                disembunyikan di Edo → dulu kosong/hambar). Luluh ke kertas. */}
            <EdoPrintArt className="absolute inset-x-0 top-0 w-full h-[62%] z-0" />

            {/* Cetakan Meiji (buatan sendiri: 銀座煉瓦街 + 瓦斯灯 + 蒸気機関車 +
                電信柱) — mengisi ruang kartu N5 di era Meiji (dulu kosong/hambar,
                sama seperti Edo sebelum ada ukiyo-e). Luluh ke kertas. */}
            <MeijiPrintArt className="absolute inset-x-0 top-0 w-full h-[64%] z-0" />

            {/* Scene beton Shōwa (buatan sendiri: 新幹線 1964 + 団地 danchi +
                電柱/電線 + antena TV) — mengisi ruang kartu N5 di era Shōwa
                (dulu kosong/hambar, sama seperti Edo/Meiji sebelum ada seni).
                SENGAJA BEDA dari hero (hero = 電柱 + 看板 + 東京タワー berdiri):
                di sini kota = ruang hidup + kecepatan, bukan ornamen hero.
                Luluh ke kertas lewat mask. HANYA era Shōwa. */}
            <ShowaPrintArt className="absolute inset-x-0 top-0 w-full h-[64%] z-0" />

            <div className="flex items-start justify-between relative z-20">
              <div className="writing-vertical-rl text-xs uppercase tracking-[0.5em] font-black text-sumi/50">
                {language === 'id' ? 'Pelajaran Berikutnya' : 'Next Lesson'}
              </div>
              <div className="bg-sumi text-kinari-light text-[10px] uppercase tracking-[0.3em] px-4 py-2 font-bold shadow-[4px_4px_0_0_#182b49] ring-4 ring-kinari-light/85 transform rotate-2">
                Module 04
              </div>
            </div>

            {/* Blok teks turun ke bawah, berdiri di atas kertas bersih (di luar
                area lukisan) supaya selalu terbaca. */}
            <div className="relative z-20 mt-auto pt-40 sm:pt-48">
              <div className="flex items-end justify-between">
                <motion.h2
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-6xl sm:text-7xl font-serif leading-none text-sumi tracking-tight group-hover:text-ai transition-colors duration-500"
                >
                  合格
                </motion.h2>
                <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-full border-[3px] border-shu text-shu flex items-center justify-center transform rotate-12 bg-kinari-light shadow-sm">
                  <span className="font-serif font-black text-lg sm:text-xl">N5</span>
                </div>
              </div>

              <div className="mt-5 border-t-[3px] border-sumi/15 pt-5 flex flex-col gap-4">
                <div>
                  <h3 className="text-3xl sm:text-4xl font-bold text-sumi font-serif leading-tight">
                    JLPT N5<br />Mastery
                  </h3>
                  <p className="text-xs text-sumi/70 mt-3 uppercase tracking-[0.2em] font-bold">
                    {language === 'id'
                      ? 'Kuasai 800+ Kosakata, Tata Bahasa, dan Kanji.'
                      : '800+ Vocab, Grammar & Kanji'}
                  </p>
                </div>
                <Button onClick={() => navigate('/learn')} className="w-max shadow-[6px_6px_0_0_#1a1a1a] hover:shadow-[2px_2px_0_0_#1a1a1a] hover:translate-x-[4px] hover:translate-y-[4px] transition-all bg-ai text-kinari-light rounded-none border-[3px] border-sumi text-sm px-8 py-4 uppercase font-bold tracking-widest">
                  {language === 'id' ? 'Mulai Latihan' : 'Start Learning'}
                </Button>
              </div>
            </div>
          </div>

          {/* RIGHT COL: Stats & Actions */}
          <div className="sm:col-span-5 flex flex-col">

            {/* Stats */}
            <div className="flex-1 grid grid-cols-2 border-b-[4px] border-sumi">
              <div className="p-6 sm:p-8 border-r-[4px] border-sumi flex flex-col justify-center">
                <h4 className="text-[10px] uppercase tracking-[0.2em] text-sumi/60 font-bold mb-3">
                  {language === 'id' ? 'Total XP' : 'Total XP'}
                </h4>
                <div className="text-4xl sm:text-5xl font-serif text-sumi font-bold">{progress.xp.toLocaleString()}</div>
                <div className="w-full h-[3px] bg-sumi mt-5 relative">
                  <motion.div
                    className="absolute top-0 left-0 h-full bg-matcha"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.7 }}
                  />
                </div>
                <div className="text-[9px] uppercase text-sumi/50 mt-2 text-right tracking-[0.2em] font-bold">
                  Lv. {progress.level + 1} {language === 'id' ? 'Hampir Naik' : 'Approaching'}
                </div>
              </div>
              <div className="p-6 sm:p-8 flex flex-col justify-center bg-kinari relative overflow-hidden">
                <h4 className="text-[10px] uppercase tracking-[0.2em] text-sumi/60 font-bold mb-3">
                  {ST.title}
                </h4>
                <StreakIndicator count={progress.streak} isActive={progress.streak > 0} />
                <div className={`mt-4 text-[9px] font-bold tracking-[0.2em] uppercase px-2 py-1 inline-block w-max ${
                  progress.streak > 0 ? 'bg-sumi text-kinari-light' : 'bg-sumi/10 text-sumi/50'
                }`}>
                  {progress.streak > 0 ? ST.bonusOn : ST.bonusOff}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex-1 grid grid-rows-2">
              <motion.div onClick={() => navigate('/practice')} whileHover={{ backgroundColor: "rgba(24, 43, 73, 0.05)" }} className="p-6 sm:p-8 border-b-[4px] border-sumi cursor-pointer flex items-center justify-between group transition-colors">
              <div className="flex flex-col gap-2">
              <h4 className="text-xl sm:text-2xl font-serif font-bold text-sumi group-hover:text-ai transition-colors">
                {language === 'id' ? 'Kuis Latihan' : 'Practice Quiz'}
              </h4>
              <p className="text-[10px] uppercase tracking-[0.2em] text-sumi/60 font-bold">
                {language === 'id' ? 'Latihan Berulang' : 'Configurable Repetition'}
              </p>
              </div>
              <div className="w-14 h-14 border-[3px] border-sumi flex items-center justify-center group-hover:bg-ai group-hover:border-ai group-hover:text-kinari-light transition-all flex-shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </div>
              </motion.div>

              <motion.div onClick={() => navigate('/mondai')} whileHover={{ backgroundColor: "rgba(230, 0, 18, 0.05)" }} className="p-6 sm:p-8 border-b-[4px] border-sumi cursor-pointer flex items-center justify-between group transition-colors">
              <div className="flex flex-col gap-2">
              <h4 className="text-xl sm:text-2xl font-serif font-bold text-sumi group-hover:text-[#E60012] transition-colors">
                {language === 'id' ? 'Mondai (Listening)' : 'Mondai Listening'}
              </h4>
              <p className="text-[10px] uppercase tracking-[0.2em] text-sumi/60 font-bold">
                {language === 'id' ? 'Kuis Audio Bab 1' : 'Choukai Audio Quiz'}
              </p>
              </div>
              <div className="w-14 h-14 border-[3px] border-sumi flex items-center justify-center group-hover:bg-[#E60012] group-hover:border-[#E60012] group-hover:text-kinari-light transition-all flex-shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
              </div>
              </motion.div>

              <motion.div onClick={() => navigate('/review')} whileHover={{ backgroundColor: "rgba(211, 56, 47, 0.05)" }} className="p-6 sm:p-8 cursor-pointer flex items-center justify-between group transition-colors relative overflow-hidden bg-kinari-light">
                <div className="absolute right-0 top-0 w-24 h-full bg-shu/5 transform skew-x-12 group-hover:scale-[3] transition-transform duration-700 ease-out z-0"></div>
                <div className="flex flex-col gap-2 relative z-10">
                  <h4 className="text-xl sm:text-2xl font-serif font-bold text-sumi flex items-center gap-3 group-hover:text-shu transition-colors">
                    {language === 'id' ? 'Ulang Soal Lemah' : 'Review Weak'}
                    {weakItems.length > 0 && (
                      <span className="bg-shu text-kinari-light text-[11px] px-2 py-0.5 rounded-full animate-pulse shadow-sm font-sans">{weakItems.length}</span>
                    )}
                  </h4>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-sumi/60 font-bold">
                    {language === 'id' ? 'Fokus Terarah' : 'Targeted Focus'}
                  </p>
                </div>
                <div className="w-14 h-14 border-[3px] border-shu text-shu flex items-center justify-center group-hover:bg-shu group-hover:text-kinari-light transition-all relative z-10 flex-shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </div>
              </motion.div>

              <motion.div onClick={() => navigate('/writing')} whileHover={{ backgroundColor: "rgba(24, 43, 73, 0.05)" }} className="p-6 sm:p-8 cursor-pointer flex items-center justify-between group transition-colors border-t-[4px] border-sumi">
                <div className="flex flex-col gap-2">
                  <h4 className="text-xl sm:text-2xl font-serif font-bold text-sumi group-hover:text-ai transition-colors">
                    {language === 'id' ? 'Latihan Menulis' : 'Writing Practice'}
                  </h4>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-sumi/60 font-bold">
                    {language === 'id' ? 'Urutan Goresan & Kuis' : 'Stroke Order & Quiz'}
                  </p>
                </div>
                <div className="w-14 h-14 border-[3px] border-ai text-ai flex items-center justify-center group-hover:bg-ai group-hover:text-kinari-light transition-all flex-shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path><path d="m15 5 4 4"></path></svg>
                </div>
              </motion.div>
              <motion.div onClick={() => navigate('/speaking')} whileHover={{ backgroundColor: "rgba(24, 43, 73, 0.05)" }} className="p-6 sm:p-8 cursor-pointer flex items-center justify-between group transition-colors border-t-[4px] border-sumi">
                <div className="flex flex-col gap-2">
                  <h4 className="text-xl sm:text-2xl font-serif font-bold text-sumi group-hover:text-ai transition-colors">
                    {language === 'id' ? 'Latihan Bicara' : 'Speaking Practice'}
                  </h4>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-sumi/60 font-bold">
                    {language === 'id' ? 'Ucapkan Kana, Kotoba & Puisi' : 'Speak Kana, Words & Poems'}
                  </p>
                </div>
                <div className="w-14 h-14 border-[3px] border-ai text-ai flex items-center justify-center group-hover:bg-ai group-hover:text-kinari-light transition-all flex-shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v1a7 7 0 0 1-14 0v-1"></path><line x1="12" y1="18" x2="12" y2="22"></line></svg>
                </div>
              </motion.div>

              {/* 活字組み Typesetting — era Meiji (gate Lv 50) */}
              <motion.div onClick={() => navigate('/typesetting')} whileHover={{ backgroundColor: "rgba(155, 74, 60, 0.05)" }} className={`p-6 sm:p-8 cursor-pointer flex items-center justify-between group transition-colors border-t-[4px] border-sumi relative overflow-hidden ${typesettingUnlocked ? '' : 'opacity-60'}`}>
                <div className="flex flex-col gap-2 relative z-10">
                  <h4 className={`text-xl sm:text-2xl font-serif font-bold flex items-center gap-3 transition-colors ${typesettingUnlocked ? 'text-sumi group-hover:text-renga' : 'text-sumi/60'}`}>
                    {language === 'id' ? 'Susun Huruf' : 'Typesetting'} 活字組み
                    {!typesettingUnlocked && <Glyph name="lock" className="text-xs" />}
                  </h4>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-sumi/60 font-bold">
                    {typesettingUnlocked
                      ? (language === 'id' ? 'Grammar · Susun Blok Jadi Kalimat' : 'Grammar · Set Blocks Into Sentences')
                      : (language === 'id' ? 'Era Meiji · Lv 50' : 'Meiji Era · Lv 50')}
                  </p>
                </div>
                <div className={`w-14 h-14 border-[3px] flex items-center justify-center transition-all flex-shrink-0 relative z-10 ${typesettingUnlocked ? 'border-renga text-renga group-hover:bg-renga group-hover:text-kinari-light' : 'border-sumi/30 text-sumi/40'}`}>
                  <span className="text-lg font-serif font-black select-none">活</span>
                </div>
              </motion.div>

              {/* 新語 Neologism — era Meiji (gate Lv 50) */}
              <motion.div onClick={() => navigate('/neologism')} whileHover={{ backgroundColor: "rgba(155, 74, 60, 0.05)" }} className={`p-6 sm:p-8 cursor-pointer flex items-center justify-between group transition-colors border-t-[4px] border-sumi relative overflow-hidden ${typesettingUnlocked ? '' : 'opacity-60'}`}>
                <div className="flex flex-col gap-2 relative z-10">
                  <h4 className={`text-xl sm:text-2xl font-serif font-bold flex items-center gap-3 transition-colors ${typesettingUnlocked ? 'text-sumi group-hover:text-renga' : 'text-sumi/60'}`}>
                    {language === 'id' ? 'Cipta Kata' : 'Coin Words'} 新語
                    {!typesettingUnlocked && <Glyph name="lock" className="text-xs" />}
                  </h4>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-sumi/60 font-bold">
                    {typesettingUnlocked
                      ? (language === 'id' ? 'Susun Kanji Jadi Istilah Baru' : 'Build New Terms From Kanji')
                      : (language === 'id' ? 'Era Meiji · Lv 50' : 'Meiji Era · Lv 50')}
                  </p>
                </div>
                <div className={`w-14 h-14 border-[3px] flex items-center justify-center transition-all flex-shrink-0 relative z-10 ${typesettingUnlocked ? 'border-renga text-renga group-hover:bg-renga group-hover:text-kinari-light' : 'border-sumi/30 text-sumi/40'}`}>
                  <span className="text-lg font-serif font-black select-none">新</span>
                </div>
              </motion.div>

              {/* Codex つながり — glosarium lintas-era (gate Meiji) */}
              <motion.div onClick={() => navigate('/codex')} whileHover={{ backgroundColor: "rgba(155, 74, 60, 0.05)" }} className={`p-6 sm:p-8 cursor-pointer flex items-center justify-between group transition-colors border-t-[4px] border-sumi relative overflow-hidden ${typesettingUnlocked ? '' : 'opacity-60'}`}>
                <div className="flex flex-col gap-2 relative z-10">
                  <h4 className={`text-xl sm:text-2xl font-serif font-bold flex items-center gap-3 transition-colors ${typesettingUnlocked ? 'text-sumi group-hover:text-renga' : 'text-sumi/60'}`}>
                    {language === 'id' ? 'Benang Lintas Era' : 'Cross-Era Threads'} Codex
                    {!typesettingUnlocked && <Glyph name="lock" className="text-xs" />}
                  </h4>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-sumi/60 font-bold">
                    {typesettingUnlocked
                      ? (language === 'id' ? 'Edo → Meiji → Shōwa' : 'Edo → Meiji → Shōwa')
                      : (language === 'id' ? 'Era Meiji · Lv 50' : 'Meiji Era · Lv 50')}
                  </p>
                </div>
                <div className={`w-14 h-14 border-[3px] flex items-center justify-center transition-all flex-shrink-0 relative z-10 ${typesettingUnlocked ? 'border-renga text-renga group-hover:bg-renga group-hover:text-kinari-light' : 'border-sumi/30 text-sumi/40'}`}>
                  <span className="text-lg font-serif font-black select-none">繋</span>
                </div>
              </motion.div>

              {/* 戸籍 Koseki — buku hidup pemain (gate Meiji) */}
              <motion.div onClick={() => navigate('/koseki')} whileHover={{ backgroundColor: "rgba(155, 74, 60, 0.05)" }} className={`p-6 sm:p-8 cursor-pointer flex items-center justify-between group transition-colors border-t-[4px] border-sumi relative overflow-hidden ${typesettingUnlocked ? '' : 'opacity-60'}`}>
                <div className="flex flex-col gap-2 relative z-10">
                  <h4 className={`text-xl sm:text-2xl font-serif font-bold flex items-center gap-3 transition-colors ${typesettingUnlocked ? 'text-sumi group-hover:text-renga' : 'text-sumi/60'}`}>
                    {language === 'id' ? 'Buku Hidupmu' : 'Your Life Record'} 戸籍
                    {!typesettingUnlocked && <Glyph name="lock" className="text-xs" />}
                  </h4>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-sumi/60 font-bold">
                    {typesettingUnlocked
                      ? (language === 'id' ? 'Apa yang App Ingat Tentangmu' : 'What the App Remembers')
                      : (language === 'id' ? 'Era Meiji · Lv 50' : 'Meiji Era · Lv 50')}
                  </p>
                </div>
                <div className={`w-14 h-14 border-[3px] flex items-center justify-center transition-all flex-shrink-0 relative z-10 ${typesettingUnlocked ? 'border-renga text-renga group-hover:bg-renga group-hover:text-kinari-light' : 'border-sumi/30 text-sumi/40'}`}>
                  <span className="text-lg font-serif font-black select-none">籍</span>
                </div>
              </motion.div>

              {/* Death Quiz 死闘 — terkunci sampai rank Shogun */}
              <motion.div onClick={() => navigate('/death-quiz')} whileHover={{ backgroundColor: "rgba(211, 56, 47, 0.05)" }} className={`p-6 sm:p-8 cursor-pointer flex items-center justify-between group transition-colors border-t-[4px] border-sumi relative overflow-hidden ${deathUnlocked ? '' : 'opacity-60'}`}>
                <div className="absolute right-0 top-0 w-24 h-full bg-shu/5 transform skew-x-12 group-hover:scale-[3] transition-transform duration-700 ease-out z-0"></div>
                <div className="flex flex-col gap-2 relative z-10">
                  <h4 className={`text-xl sm:text-2xl font-serif font-bold flex items-center gap-3 transition-colors ${deathUnlocked ? 'text-sumi group-hover:text-shu' : 'text-sumi/60'}`}>
                    Death Quiz
                    {!deathUnlocked && <Glyph name="lock" className="text-xs" />}
                  </h4>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-sumi/60 font-bold">
                    {deathUnlocked
                      ? (language === 'id' ? 'Endless · Pertaruhan XP' : 'Endless · XP at Stake')
                      : (language === 'id' ? 'Rank Shogun' : 'Shogun Rank')}
                  </p>
                </div>
                <div className={`w-14 h-14 border-[3px] flex items-center justify-center transition-all flex-shrink-0 relative z-10 ${deathUnlocked ? 'border-shu text-shu group-hover:bg-shu group-hover:text-kinari-light' : 'border-sumi/30 text-sumi/40'}`}>
                  <span className="text-xl font-serif font-black select-none">死</span>
                </div>
              </motion.div>

              {/* N5 Exam 模擬試験 — butuh rank Shogun + 30 kanji hafal */}
              <motion.div onClick={() => navigate('/n5-exam')} whileHover={{ backgroundColor: "rgba(230, 0, 18, 0.05)" }} className={`p-6 sm:p-8 cursor-pointer flex items-center justify-between group transition-colors border-t-[4px] border-sumi relative overflow-hidden ${n5Unlocked ? '' : 'opacity-60'}`}>
                <div className="absolute right-0 top-0 w-24 h-full bg-shu/5 transform skew-x-12 group-hover:scale-[3] transition-transform duration-700 ease-out z-0"></div>
                <div className="flex flex-col gap-2 relative z-10">
                  <h4 className={`text-xl sm:text-2xl font-serif font-bold flex items-center gap-3 transition-colors ${n5Unlocked ? 'text-sumi group-hover:text-shu' : 'text-sumi/60'}`}>
                    {language === 'id' ? 'Ujian N5' : 'N5 Exam'} 模擬試験
                    {!n5Unlocked && <Glyph name="lock" className="text-xs" />}
                  </h4>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-sumi/60 font-bold">
                    {n5Unlocked
                      ? (language === 'id' ? 'Tiruan JLPT N5 · 3 Seksi · 90 Menit' : 'JLPT N5 Mock · 3 Sections · 90 Min')
                      : (language === 'id'
                        ? `Shogun + ${N5_EXAM_MIN_MASTERED_KANJI} Kanji (${masteredKanji}/${N5_EXAM_MIN_MASTERED_KANJI})`
                        : `Shogun + ${N5_EXAM_MIN_MASTERED_KANJI} Kanji (${masteredKanji}/${N5_EXAM_MIN_MASTERED_KANJI})`)}
                  </p>
                </div>
                <div className={`w-14 h-14 border-[3px] flex items-center justify-center transition-all flex-shrink-0 relative z-10 ${n5Unlocked ? 'border-shu text-shu group-hover:bg-shu group-hover:text-kinari-light' : 'border-sumi/30 text-sumi/40'}`}>
                  <span className="text-lg font-serif font-black select-none">試</span>
                </div>
              </motion.div>
            </div>

          </div>
        </div>

        {/* --- MISI HARIAN 日課 --- */}
        <DailyQuestPanel />

        {/* Pemisah awan 霞 sebelum cap pencapaian */}
        <EraDivider label="印譜 · HANKO REGISTER" />

        {/* --- ACHIEVEMENTS SECTION --- */}
        <div className="border-t-[4px] border-sumi relative z-10 p-6 sm:p-12 bg-kinari heian-enter-3">
          <div className="absolute top-0 right-0 w-48 h-48 bg-asanoha opacity-[0.06] pointer-events-none transform translate-x-1/4 -translate-y-1/4"></div>
          <div className="flex items-center gap-4 mb-8 relative z-10">
            <h3 className="text-2xl sm:text-3xl font-serif font-black text-sumi tracking-tight">
              {language === 'id' ? 'Cap Pencapaian' : 'Earned Stamps'}
            </h3>
            <div className="h-[3px] flex-1 bg-sumi/10"></div>
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/40">印章</span>
          </div>

          {achievements.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-xs sm:text-sm tracking-[0.3em] uppercase font-bold text-sumi/40 py-4 relative z-10"
            >
              {language === 'id' ? 'Selesaikan kuis untuk mendapatkan cap.' : 'Complete quizzes to earn stamps.'}
            </motion.p>
          ) : (
            <>
              <div className="flex flex-wrap gap-8 sm:gap-12 relative z-10">
                {homeBadges.map((id, index) => (
                  ACHIEVEMENT_META[id] && (
                    <AchievementStamp key={id} id={id} meta={ACHIEVEMENT_META[id]} index={index} />
                  )
                ))}
              </div>
              {hiddenBadgeCount > 0 && (
                <button
                  onClick={() => navigate('/profile')}
                  className="mt-6 text-[10px] uppercase tracking-[0.25em] font-bold text-sumi/40 hover:text-shu transition-colors relative z-10 cursor-pointer"
                >
                  {language === 'id'
                    ? `+${hiddenBadgeCount} cap lain — lihat semua di Profil →`
                    : `+${hiddenBadgeCount} more stamps — view all in Profile →`}
                </button>
              )}
            </>
          )}
        </div>

      </motion.div>

      {/* Footer / Hybrid Credits */}
      <footer className="mt-8 pt-4 border-t-[3px] border-sumi/10 flex flex-col sm:flex-row items-center justify-between gap-4 px-1">
        {/* Left */}
        <div className="flex items-center gap-3">
          <img
            src="/logo-eskul.jpeg"
            alt="Logo Eskul"
            className="h-10 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300 rounded-sm"
          />
          <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-sumi/60">
            Dibuat Untuk <span className="text-sumi font-black">Panji Japanese Club</span>
          </span>
        </div>

        {/* Center */}
        <div className="text-[11px] tracking-[0.2em] uppercase font-bold text-sumi/50 text-center">
          Credit by:<span className="font-bold text-ai">@MaddLiebert</span>
        </div>

        {/* Right */}
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/40 hover:text-sumi transition-colors group"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-45 transition-transform duration-300"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          {language === 'id' ? 'Pengaturan' : 'Settings'}
        </button>
      </footer>
    </div>
  );
}
