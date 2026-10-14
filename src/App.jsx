import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Home } from "./pages/Home";
import { Learn } from "./pages/Learn";
import { Practice } from "./pages/Practice";
import { Review } from "./pages/Review";
import { Settings } from "./pages/Settings";
import { Writing } from "./pages/Writing";
import { Speaking } from "./pages/Speaking";
import { HeianHistory } from "./pages/HeianHistory";
import { EdoHistory } from "./pages/EdoHistory";
import { MeijiHistory } from "./pages/MeijiHistory";
import { ShowaHistory } from "./pages/ShowaHistory";
import { AnimeHistory } from "./pages/AnimeHistory";
import { AnimeShop } from "./pages/AnimeShop";
import { AnimeClaw } from "./pages/AnimeClaw";
import { AnimeCheckpoint } from "./pages/AnimeCheckpoint";
import { AnimePractice } from "./pages/AnimePractice";
import { CyberpunkHistory } from "./pages/CyberpunkHistory";
import { OwariCheckpoint } from "./pages/OwariCheckpoint";
import { Typesetting } from "./pages/Typesetting";
import { PrintShop } from "./pages/PrintShop";
import { Neologism } from "./pages/Neologism";
import { Codex } from "./pages/Codex";
import { Koseki } from "./pages/Koseki";
import { EdoNightFestival } from "./features/cinematic/edo/components/EdoNightFestival";
import { HakoneCheckpoint } from "./pages/HakoneCheckpoint";
import { KokkaiCheckpoint } from "./pages/KokkaiCheckpoint";
import Profile from "./features/profile/Profile";
import MondaiChapterFlow from "./features/quiz/MondaiChapterFlow";
import Shop from "./features/shop/Shop";
import Inventory from "./features/inventory/Inventory";
import { DeathQuizScreen } from "./features/deathquiz/DeathQuizScreen";
import { N5ExamScreen } from "./features/n5exam/N5ExamScreen";
import { SotsugyoCheckpoint } from "./pages/SotsugyoCheckpoint";
import { ProgressProvider, useUserStats } from "./features/progress/ProgressContext";
import { EraProvider, useEra } from "./features/theme/EraContext";
import { ThemeAudioHost } from "./features/theme/ThemeAudioHost";
import { MeijiPress } from "./features/theme/MeijiPress";
import { MeijiCompanion } from "./features/meiji/MeijiCompanion";
import { eraName } from "./features/theme/eraNames";
import { EffectProvider } from "./features/effects/EffectContext";
import { CinematicProvider } from "./features/cinematic/CinematicContext";
import { getPack } from "./features/packs/packs";
import { setActiveVoice, preloadVoice, primeVoice } from "./utils/sfx";
import { preloadHinaGifs } from "./features/effects/hinaGifs";
import { preloadGojoGifs } from "./features/effects/gojoGifs";
import { preloadYujiGifs } from "./features/effects/yujiGifs";
import { getVoice } from "./features/audio/voices";
import { resolveVoiceKey } from "./features/audio/voiceKey";
import { characterVoice } from "./features/anime/characters";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { TutorialButton } from "./features/tutorial/TutorialButton";
import { Glyph } from "./components/icons/Glyph";
import { MedaruCoin } from "./components/MedaruCoin";
import { medaruCopy } from "./features/progress/medaruCopy";
import { SyncProvider } from "./features/sync/SyncContext";
import { Leaderboard } from "./features/leaderboard/Leaderboard";

// Floating top controls — collapsible biar hemat tempat. Default: tombol menu +
// saldo medaru. Klik → mekar semua tombol (nav + tema); klik lagi → kempes.
function TopControls() {
  const { language } = useLanguage();
  const { era } = useEra();
  const { theme, toggleTheme } = useTheme();
  const { progress } = useUserStats();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  // Nama mata uang ikut era (Heian → もん, era lain → MEDARU).
  const money = medaruCopy(era, language);

  // Kelas dasar tiap tombol di dalam bar (tanpa border/shadow sendiri).
  const itemCls =
    'flex items-center justify-center gap-1.5 h-8 px-2.5 transition-colors hover:bg-sumi/10 active:bg-sumi/15 cursor-pointer select-none';
  const divider = <span className="w-[2px] self-stretch bg-sumi/15" aria-hidden="true" />;

  // Navigasi + langsung kempes bar (biar nggak nyangkut kebuka di halaman baru).
  const go = (path) => { setOpen(false); navigate(path); };

  return (
    <div className="fixed top-4 right-4 z-50 flex items-stretch border-[3px] border-sumi bg-kinari-light shadow-[3px_3px_0_0_#1a1a1a] overflow-hidden era-brocade">
      {/* Tombol menu (≡ / ✕) — buka/tutup bar */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={itemCls}
        title={open ? (language === 'id' ? 'Sembunyikan menu' : 'Hide menu') : (language === 'id' ? 'Buka menu' : 'Open menu')}
        aria-label={open ? (language === 'id' ? 'Sembunyikan menu' : 'Hide menu') : (language === 'id' ? 'Buka menu' : 'Open menu')}
        aria-expanded={open}
      >
        <Glyph name={open ? 'x' : 'menu'} className="text-sm" />
      </button>

      {divider}

      {/* Shop / Medaru chip — SELALU tampil (penting) */}
      <button
        onClick={() => go('/shop')}
        className={itemCls}
        title={eraName('shop', era, language === 'id' ? 'Warung Kakek' : "Grandpa's Shop")}
        aria-label={eraName('shop', era, language === 'id' ? 'Warung Kakek' : "Grandpa's Shop")}
      >
        <Glyph name="shop" className="text-sm" />
        <MedaruCoin size={14} />
        <span className="text-[11px] font-black tracking-wider text-sumi">{(progress.medaru || 0).toLocaleString()} {money.nameShort}</span>
      </button>

      {/* Sisa tombol — hanya tampil saat bar dibuka */}
      {open && (
        <>
          {divider}

          {/* Backpack / Inventory */}
          <button
            onClick={() => go('/inventory')}
            className={itemCls}
            title={eraName('inventory', era, language === 'id' ? 'Tas Punggung' : 'Backpack')}
            aria-label={eraName('inventory', era, language === 'id' ? 'Tas Punggung' : 'Backpack')}
          >
            <Glyph name="backpack" className="text-sm" />
            <span className="text-[11px] font-black tracking-wider text-sumi">{eraName('inventory', era)}</span>
          </button>

          {divider}

          {/* Profile */}
          <button
            onClick={() => go('/profile')}
            className={itemCls}
            title={eraName('profile', era, language === 'id' ? 'Profil Pemain' : 'Player Profile')}
            aria-label={eraName('profile', era, language === 'id' ? 'Profil Pemain' : 'Player Profile')}
          >
            <Glyph name="mask" className="text-sm" />
            <span className="text-[11px] font-black tracking-wider text-sumi">{eraName('profile', era)}</span>
          </button>

          {divider}

          {/* Leaderboard / Papan Peringkat 番付 */}
          <button
            onClick={() => go('/leaderboard')}
            className={itemCls}
            title={language === 'id' ? 'Papan Peringkat' : 'Leaderboard'}
            aria-label={language === 'id' ? 'Papan Peringkat' : 'Leaderboard'}
          >
            <Glyph name="trophy" className="text-sm" />
            <span className="text-[11px] font-black tracking-wider text-sumi">番付</span>
          </button>

          {divider}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className={itemCls}
            title={theme === 'dark' ? 'Ganti ke Mode Terang / Light Mode' : 'Ganti ke Mode Gelap / Dark Mode'}
            aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            <Glyph name={theme === 'dark' ? 'sun' : 'moon'} className="text-sm" />
          </button>
        </>
      )}
    </div>
  );
}

// Sinkronkan voice aktif ke sfx.js setiap pack / era / 推し berubah.
function VoiceSync() {
  const { progress } = useUserStats();
  const { era } = useEra();
  useEffect(() => {
    const pack = getPack(progress.activePack);
    // Voice = voice PACK, KECUALI di era 多元 dengan 推し terpilih → karakter 推し
    // yang bersuara (inti A4/A16). Tanpa ini, 45 klip karakter 多元 tak pernah
    // diputar (bug "registry ≠ wired"). resolveVoiceKey = satu sumber kebenaran.
    const key = resolveVoiceKey({
      era,
      oshiId: progress.oshiId,
      packVoice: pack?.voice,
      packEra: pack?.era,          // pack terikat era (anime) hanya bunyi di era-nya
      voiceOfCharacter: characterVoice,
    });
    setActiveVoice(key);
    // Preload klip yang aktif → hindari suara telat (fetch/decode ulang tiap jawaban).
    preloadVoice(key ? getVoice(key) : null);
    // Prime = unduh tiap klip sampai buffer penuh → klip baru (tier streak) tidak
    // telat saat diputar (elemen <audio> preload='auto' saja cuma ambil metadata).
    primeVoice(key ? getVoice(key) : null);
    // Pack visual 'hina' → preload + decode GIF, supaya efek muncul TEPAT saat
    // suara Hina bunyi (bukan telat karena decode GIF 1.7MB).
    if (pack?.visual === 'hina') preloadHinaGifs();
    // Pack visual 'gojo' → preload + decode GIF (kalah/murasaki/ryoiki), supaya
    // GIF tampil instan saat jawaban & cast (tanpa jeda decode frame pertama).
    if (pack?.visual === 'gojo') preloadGojoGifs();
    // Pack visual 'yuji' → preload + decode GIF (keiteiken/kokusen/fuga/takeover/
    // wrong/zakome), supaya GIF tampil instan saat jawaban & cast takeover.
    if (pack?.visual === 'yuji') preloadYujiGifs();
  }, [progress.activePack, progress.oshiId, era]);
  return null;
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ProgressProvider>
          <SyncProvider>
          <EraProvider>
          <VoiceSync />
          <ThemeAudioHost />
          <BrowserRouter>
            <CinematicProvider>
            <EffectProvider>
            <div className="min-h-screen relative font-sans selection:bg-ai/20 overflow-x-hidden bg-[var(--backdrop-val)]">
          
              {/* 1. Global Washi Texture overlay */}
              <div 
                className="fixed inset-0 pointer-events-none z-0 mix-blend-multiply opacity-[0.4] dark:opacity-[0.15]" 
                style={{ 
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.25'/%3E%3C/svg%3E")` 
                }}
              />
              
              {/* 2. Abstract background motif (Seigaiha radiating from center) */}
              <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 opacity-10 dark:opacity-5 bg-seigaiha era-pattern mask-image:radial-gradient(circle_at_center,black,transparent_70%)"></div>

              {/* 2b. Watermark kaligrafi raksasa 平安 (hanya era Heian) — noda tinta
                  samar di latar, meniru under-drawing emakimono. Dekoratif. */}
              <div className="era-watermark-layer" aria-hidden="true">
                <span className="era-watermark" style={{ top: '-4rem', right: '2rem', fontSize: '30rem' }}>雅</span>
                <span className="era-watermark" style={{ top: '42%', left: '1.5rem', fontSize: '26rem', color: 'var(--matcha-val)' }}>詠</span>
                <span className="era-watermark" style={{ bottom: '-6rem', right: '4rem', fontSize: '24rem' }}>雲</span>
              </div>

              {/* 2c. Filter SVG: tepi tinta kuas 筆致 — feDisplacementMap membuat
                  garis tepi bergoyang (tidak rata mesin). Dipakai CSS via
                  url(#heian-ink). */}
              <svg aria-hidden="true" focusable="false" width="0" height="0"
                   style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
                <defs>
                  <filter id="heian-ink" x="-10%" y="-10%" width="120%" height="120%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.014 0.022" numOctaves="2" seed="9" result="n" />
                    <feDisplacementMap in="SourceGraphic" in2="n" scale="3.4" xChannelSelector="R" yChannelSelector="G" />
                  </filter>
                  <filter id="heian-rough" x="-12%" y="-12%" width="124%" height="124%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.05 0.06" numOctaves="3" seed="3" result="r" />
                    <feDisplacementMap in="SourceGraphic" in2="r" scale="6" xChannelSelector="R" yChannelSelector="G" />
                  </filter>
                  {/* Sobekan kertas (torn/deckle) untuk TOMBOL — frekuensi rendah →
                      robekan besar & lembut (bukan noise pixel), jadi tepi lurus
                      mesin berubah jadi koyak tangan. Dipakai lewat filter pada
                      :where(button,a)[class*=bg-] (lihat index.css "TOMBOL HEIAN"). */}
                  <filter id="heian-torn" x="-18%" y="-18%" width="136%" height="136%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.026 0.032" numOctaves="2" seed="7" result="t" />
                    <feDisplacementMap in="SourceGraphic" in2="t" scale="9" xChannelSelector="R" yChannelSelector="G" />
                  </filter>
                  {/* Tepi UKIR KAYU (edo-carve): frekuensi lebih tinggi + skala
                      sedang → garis tepi bergoyang seperti dicungkil pahat, bukan
                      tepi lurus mesin. Dipakai tombol/link & segel di Edo
                      (lihat index.css "HAPUS DNA SHOWA STRUKTURAL"). */}
                  <filter id="edo-carve" x="-12%" y="-12%" width="124%" height="124%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.05 0.09" numOctaves="2" seed="4" result="c" />
                    <feDisplacementMap in="SourceGraphic" in2="c" scale="2.6" xChannelSelector="R" yChannelSelector="G" />
                  </filter>
                  {/* Garis panel MANGA (anime-ink): goyangan HALUS → tepi panel
                      terasa digores tinta, bukan garis mesin. Skala kecil (2.2)
                      supaya tetap lurus seperti panel komik, bukan koyak kertas
                      (Heian) atau ukiran kayu (Edo). Dipakai via url(#anime-ink)
                      pada .anime-manga (lihat index.css "GARIS PANEL MANGA 多元"). */}
                  <filter id="anime-ink" x="-8%" y="-8%" width="116%" height="116%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.019 0.027" numOctaves="2" seed="12" result="n" />
                    <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
                  </filter>
                </defs>
              </svg>

              {/* 2d. Noda tinta 染み (shimi) — bercak samar seperti kertas tua. */}
              <div className="era-stain-layer" aria-hidden="true">
                <svg className="era-stain" viewBox="0 0 200 180" style={{ top: '10%', left: '5%', width: 360, height: 320 }}>
                  <path d="M40 92 C28 52 70 18 112 30 C152 42 176 72 168 112 C160 152 118 172 78 160 C44 150 50 128 40 92 Z" />
                </svg>
                <svg className="era-stain" viewBox="0 0 200 180" style={{ bottom: '7%', right: '9%', width: 300, height: 270 }}>
                  <path d="M52 96 C40 60 78 30 116 40 C154 50 172 84 160 118 C148 150 108 164 74 150 C48 140 60 124 52 96 Z" />
                </svg>
              </div>

              {/* 2e. Lapisan cetakan Edo 江戸 — HANYA tampil saat data-era="edo"
                  (di-gate lewat CSS). Grain cetakan (bintik tinta) meniru hasil
                  cetak kayu ukiyo-e; hanabi 花火 hanya menyala di malam 夜市.
                  Dekoratif → pointer-events:none + aria-hidden. */}
              <div className="era-grain-layer" aria-hidden="true">
                <div className="era-grain" />
              </div>
              <div className="era-hanabi-layer" aria-hidden="true">
                <span className="era-hanabi" style={{ top: '8%', left: '12%', width: 150, height: 150, animationDelay: '0s' }} />
                <span className="era-hanabi" style={{ top: '22%', right: '14%', width: 110, height: 110, animationDelay: '3s' }} />
                <span className="era-hanabi" style={{ bottom: '16%', left: '24%', width: 90, height: 90, animationDelay: '6s' }} />
              </div>

              {/* 2f. 夜市 YOMISE — malam festival EDO: 提灯 lentera berjajar,
                  屋台 stan, 人々 kerumunan, 花火 kembang api. HANYA malam
                  (.dark[data-era="edo"]). Ramai & hangat — bukan biru kosong. */}
              <EdoNightFestival />

              {/* 2g. 明治 MEIJI — meja penyusun huruf 活字: palung huruf logam +
                  garis aturan koran. HANYA data-era="meiji". Dekoratif. */}
              <MeijiPress />

              {/* 2h. MEIJI hidup — jejak Nacht/Saku (M12), 号外 (M10), glitch (M9),
                  napas (M15). HANYA era Meiji; semua bisa dimatikan di Pengaturan. */}
              <MeijiCompanion />

              {/* Segel merah — tanda tangan visual era (Edo 極 / Meiji 明). */}
              <div className="fixed top-20 right-4 z-0 pointer-events-none" aria-hidden="true">
                <span className="era-seal">極</span>
                <span className="meiji-seal">明</span>
              </div>

              {/* Global Top Controls */}
              <TopControls />

              {/* Tombol Tutorial 指南 (mengapung kanan-bawah, context-aware) */}
              <TutorialButton />

              <main className="relative z-10 w-full h-full">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/learn" element={<Learn />} />
                  <Route path="/practice" element={<Practice />} />
                  <Route path="/writing" element={<Writing />} />
                  <Route path="/speaking" element={<Speaking />} />
                  <Route path="/mondai" element={<MondaiChapterFlow />} />
                  <Route path="/review" element={<Review />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/death-quiz" element={<DeathQuizScreen />} />
                  <Route path="/n5-exam" element={<N5ExamScreen />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/heian-history" element={<HeianHistory />} />
                  <Route path="/edo-history" element={<EdoHistory />} />
                  <Route path="/meiji-history" element={<MeijiHistory />} />
                  <Route path="/showa-history" element={<ShowaHistory />} />
                  <Route path="/anime-history" element={<AnimeHistory />} />
                  <Route path="/anime-shop" element={<AnimeShop />} />
                  <Route path="/anime-claw" element={<AnimeClaw />} />
                  <Route path="/anime-checkpoint" element={<AnimeCheckpoint />} />
                  <Route path="/anime-practice" element={<AnimePractice />} />
                  <Route path="/cyberpunk-history" element={<CyberpunkHistory />} />
                  <Route path="/owari-checkpoint" element={<OwariCheckpoint />} />
                  <Route path="/owari-exam" element={<N5ExamScreen owari />} />
                  <Route path="/hakone-checkpoint" element={<HakoneCheckpoint />} />
                  <Route path="/kokkai-checkpoint" element={<KokkaiCheckpoint />} />
                  <Route path="/sotsugyo-checkpoint" element={<SotsugyoCheckpoint />} />
                  <Route path="/typesetting" element={<Typesetting />} />
                  <Route path="/printshop" element={<PrintShop />} />
                  <Route path="/neologism" element={<Neologism />} />
                  <Route path="/codex" element={<Codex />} />
                  <Route path="/koseki" element={<Koseki />} />
                </Routes>
              </main>
            </div>
            </EffectProvider>
            </CinematicProvider>
          </BrowserRouter>
          </EraProvider>
          </SyncProvider>
        </ProgressProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
