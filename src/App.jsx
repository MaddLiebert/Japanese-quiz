import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Home } from "./pages/Home";
import { Learn } from "./pages/Learn";
import { Practice } from "./pages/Practice";
import { Review } from "./pages/Review";
import { Settings } from "./pages/Settings";
import { Writing } from "./pages/Writing";
import { Speaking } from "./pages/Speaking";
import Profile from "./features/profile/Profile";
import MondaiChapterFlow from "./features/quiz/MondaiChapterFlow";
import Shop from "./features/shop/Shop";
import Inventory from "./features/inventory/Inventory";
import { DeathQuizScreen } from "./features/deathquiz/DeathQuizScreen";
import { N5ExamScreen } from "./features/n5exam/N5ExamScreen";
import { ProgressProvider, useUserStats } from "./features/progress/ProgressContext";
import { EffectProvider } from "./features/effects/EffectContext";
import { getPack } from "./features/packs/packs";
import { setActiveVoice, preloadVoice, primeVoice } from "./utils/sfx";
import { preloadHinaGifs } from "./features/effects/hinaGifs";
import { preloadGojoGifs } from "./features/effects/gojoGifs";
import { getVoice } from "./features/audio/voices";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";

// Floating top controls (Shop + Backpack + Profile + Theme) — shown on every page.
// Digabung jadi SATU bar menyatu (border & shadow tunggal) supaya hemat tempat,
// tiap tombol tetap punya ikon + tooltip yang jelas fungsinya.
function TopControls() {
  const { language } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { progress } = useUserStats();
  const navigate = useNavigate();

  // Kelas dasar tiap tombol di dalam bar (tanpa border/shadow sendiri).
  const itemCls =
    'flex items-center justify-center gap-1.5 h-8 px-2.5 transition-colors hover:bg-sumi/10 active:bg-sumi/15 cursor-pointer select-none';
  const divider = <span className="w-[2px] self-stretch bg-sumi/15" aria-hidden="true" />;

  return (
    <div className="fixed top-4 right-4 z-50 flex items-stretch border-[3px] border-sumi bg-kinari-light shadow-[3px_3px_0_0_#1a1a1a] overflow-hidden">
      {/* Shop / Medaru chip */}
      <button
        onClick={() => navigate('/shop')}
        className={itemCls}
        title={language === 'id' ? 'Warung Kakek' : "Grandpa's Shop"}
        aria-label={language === 'id' ? 'Warung Kakek' : "Grandpa's Shop"}
      >
        <span className="text-xs">🏪</span>
        <span className="text-[11px] font-black tracking-wider text-sumi">{(progress.medaru || 0).toLocaleString()}</span>
      </button>

      {divider}

      {/* Backpack / Inventory */}
      <button
        onClick={() => navigate('/inventory')}
        className={itemCls}
        title={language === 'id' ? 'Tas Punggung' : 'Backpack'}
        aria-label={language === 'id' ? 'Tas Punggung' : 'Backpack'}
      >
        <span className="text-xs">🎒</span>
      </button>

      {divider}

      {/* Profile */}
      <button
        onClick={() => navigate('/profile')}
        className={itemCls}
        title={language === 'id' ? 'Profil Pemain' : 'Player Profile'}
        aria-label={language === 'id' ? 'Profil Pemain' : 'Player Profile'}
      >
        <span className="text-xs">👺</span>
      </button>

      {divider}

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className={itemCls}
        title={theme === 'dark' ? 'Ganti ke Mode Terang / Light Mode' : 'Ganti ke Mode Gelap / Dark Mode'}
        aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
      >
        <span className="text-xs">{theme === 'dark' ? '☀️' : '🌙'}</span>
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
  }, [progress.activePack]);
  return null;
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ProgressProvider>
          <VoiceSync />
          <EffectProvider>
            <BrowserRouter>
            <div className="min-h-screen relative font-sans selection:bg-ai/20 overflow-x-hidden bg-[var(--backdrop-val)]">
          
              {/* 1. Global Washi Texture overlay */}
              <div 
                className="fixed inset-0 pointer-events-none z-0 mix-blend-multiply opacity-[0.4] dark:opacity-[0.15]" 
                style={{ 
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.25'/%3E%3C/svg%3E")` 
                }}
              />
              
              {/* 2. Abstract background motif (Seigaiha radiating from center) */}
              <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 opacity-10 dark:opacity-5 bg-seigaiha mask-image:radial-gradient(circle_at_center,black,transparent_70%)"></div>

              {/* Global Top Controls */}
              <TopControls />

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
                </Routes>
              </main>
            </div>
          </BrowserRouter>
          </EffectProvider>
        </ProgressProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
