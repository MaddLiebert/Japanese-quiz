import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Home } from "./pages/Home";
import { Learn } from "./pages/Learn";
import { Practice } from "./pages/Practice";
import { Review } from "./pages/Review";
import { Settings } from "./pages/Settings";
import { Writing } from "./pages/Writing";
import { Speaking } from "./pages/Speaking";
import { HeianHistory } from "./pages/HeianHistory";
import { EdoHistory } from "./pages/EdoHistory";
import { EdoNightFestival } from "./features/cinematic/edo/components/EdoNightFestival";
import { HakoneCheckpoint } from "./pages/HakoneCheckpoint";
import Profile from "./features/profile/Profile";
import MondaiChapterFlow from "./features/quiz/MondaiChapterFlow";
import Shop from "./features/shop/Shop";
import Inventory from "./features/inventory/Inventory";
import { DeathQuizScreen } from "./features/deathquiz/DeathQuizScreen";
import { N5ExamScreen } from "./features/n5exam/N5ExamScreen";
import { ProgressProvider, useUserStats } from "./features/progress/ProgressContext";
import { EraProvider, useEra } from "./features/theme/EraContext";
import { ThemeAudioHost } from "./features/theme/ThemeAudioHost";
import { eraName } from "./features/theme/eraNames";
import { EffectProvider } from "./features/effects/EffectContext";
import { CinematicProvider } from "./features/cinematic/CinematicContext";
import { getPack } from "./features/packs/packs";
import { setActiveVoice, preloadVoice, primeVoice } from "./utils/sfx";
import { preloadHinaGifs } from "./features/effects/hinaGifs";
import { preloadGojoGifs } from "./features/effects/gojoGifs";
import { preloadYujiGifs } from "./features/effects/yujiGifs";
import { getVoice } from "./features/audio/voices";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { TutorialButton } from "./features/tutorial/TutorialButton";
import { Glyph } from "./components/icons/Glyph";
import { MedaruCoin } from "./components/MedaruCoin";
import { medaruCopy } from "./features/progress/medaruCopy";

// Floating top controls (Shop + Backpack + Profile + Theme) — shown on every page.
// Digabung jadi SATU bar menyatu (border & shadow tunggal) supaya hemat tempat,
// tiap tombol tetap punya ikon + tooltip yang jelas fungsinya.
function TopControls() {
  const { language } = useLanguage();
  const { era } = useEra();
  const { theme, toggleTheme } = useTheme();
  const { progress } = useUserStats();
  const navigate = useNavigate();
  // Nama mata uang ikut era (Heian → もん, era lain → MEDARU).
  const money = medaruCopy(era, language);

  // Kelas dasar tiap tombol di dalam bar (tanpa border/shadow sendiri).
  const itemCls =
    'flex items-center justify-center gap-1.5 h-8 px-2.5 transition-colors hover:bg-sumi/10 active:bg-sumi/15 cursor-pointer select-none';
  const divider = <span className="w-[2px] self-stretch bg-sumi/15" aria-hidden="true" />;

  return (
    <div className="fixed top-4 right-4 z-50 flex items-stretch border-[3px] border-sumi bg-kinari-light shadow-[3px_3px_0_0_#1a1a1a] overflow-hidden era-brocade">
      {/* Shop / Medaru chip */}
      <button
        onClick={() => navigate('/shop')}
        className={itemCls}
        title={eraName('shop', era, language === 'id' ? 'Warung Kakek' : "Grandpa's Shop")}
        aria-label={eraName('shop', era, language === 'id' ? 'Warung Kakek' : "Grandpa's Shop")}
      >
        <Glyph name="shop" className="text-sm" />
        <MedaruCoin size={14} />
        <span className="text-[11px] font-black tracking-wider text-sumi">{(progress.medaru || 0).toLocaleString()} {money.nameShort}</span>
      </button>

      {divider}

      {/* Backpack / Inventory */}
      <button
        onClick={() => navigate('/inventory')}
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
        onClick={() => navigate('/profile')}
        className={itemCls}
        title={eraName('profile', era, language === 'id' ? 'Profil Pemain' : 'Player Profile')}
        aria-label={eraName('profile', era, language === 'id' ? 'Profil Pemain' : 'Player Profile')}
      >
        <Glyph name="mask" className="text-sm" />
        <span className="text-[11px] font-black tracking-wider text-sumi">{eraName('profile', era)}</span>
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
    </div>
  );
}

// Sinkronkan voice aktif ke sfx.js setiap activePack berubah.
function VoiceSync() {
  const { progress } = useUserStats();
  useEffect(() => {
    const pack = getPack(progress.activePack);
    setActiveVoice(pack?.voice || null);
    // Preload klip pack aktif → hindari suara telat (fetch/decode ulang tiap jawaban).
    preloadVoice(pack ? getVoice(pack.voice) : null);
    // Prime = unduh tiap klip sampai buffer penuh → klip baru (tier streak) tidak
    // telat saat diputar (elemen <audio> preload='auto' saja cuma ambil metadata).
    primeVoice(pack ? getVoice(pack.voice) : null);
    // Pack visual 'hina' → preload + decode GIF, supaya efek muncul TEPAT saat
    // suara Hina bunyi (bukan telat karena decode GIF 1.7MB).
    if (pack?.visual === 'hina') preloadHinaGifs();
    // Pack visual 'gojo' → preload + decode GIF (kalah/murasaki/ryoiki), supaya
    // GIF tampil instan saat jawaban & cast (tanpa jeda decode frame pertama).
    if (pack?.visual === 'gojo') preloadGojoGifs();
    // Pack visual 'yuji' → preload + decode GIF (keiteiken/kokusen/fuga/takeover/
    // wrong/zakome), supaya GIF tampil instan saat jawaban & cast takeover.
    if (pack?.visual === 'yuji') preloadYujiGifs();
  }, [progress.activePack]);
  return null;
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ProgressProvider>
          <VoiceSync />
          <EraProvider>
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

              {/* Segel 極 merah — tanda tangan visual Edo (pojok kanan-atas). */}
              <div className="fixed top-20 right-4 z-0 pointer-events-none" aria-hidden="true">
                <span className="era-seal">極</span>
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
                  <Route path="/heian-history" element={<HeianHistory />} />
                  <Route path="/edo-history" element={<EdoHistory />} />
                  <Route path="/hakone-checkpoint" element={<HakoneCheckpoint />} />
                </Routes>
              </main>
            </div>
            </EffectProvider>
            </CinematicProvider>
          </BrowserRouter>
          </EraProvider>
        </ProgressProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
