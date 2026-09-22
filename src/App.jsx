import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Home } from "./pages/Home";
import { Learn } from "./pages/Learn";
import { Practice } from "./pages/Practice";
import { Review } from "./pages/Review";
import { Settings } from "./pages/Settings";
import Profile from "./features/profile/Profile";
import MondaiChapterFlow from "./features/quiz/MondaiChapterFlow";
import Shop from "./features/shop/Shop";
import { ProgressProvider, useUserStats } from "./features/progress/ProgressContext";
import { EffectProvider } from "./features/effects/EffectContext";
import { getPack } from "./features/packs/packs";
import { setActiveVoice } from "./utils/sfx";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";

// Floating top controls (Theme + Language + Profile) — shown on every page
function TopControls() {
  const { language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { progress } = useUserStats();
  const navigate = useNavigate();

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      {/* Shop / Medaru chip */}
      <button
        onClick={() => navigate('/shop')}
        className="flex items-center gap-1.5 border-[3px] border-sumi bg-kinari-light shadow-[3px_3px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#1a1a1a] transition-all px-3 h-8 cursor-pointer select-none"
        title="Warung Kakek"
      >
        <span className="text-xs">🏪</span>
        <span className="text-[11px] font-black tracking-wider text-sumi">{(progress.medaru || 0).toLocaleString()}</span>
      </button>

      {/* Profile button */}
      <button
        onClick={() => navigate('/profile')}
        className="flex items-center justify-center w-8 h-8 border-[3px] border-sumi bg-kinari-light shadow-[3px_3px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#1a1a1a] transition-all text-xs cursor-pointer select-none font-black"
        title="Player Profile"
      >
        👺
      </button>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="flex items-center justify-center w-8 h-8 border-[3px] border-sumi bg-kinari-light shadow-[3px_3px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#1a1a1a] transition-all text-xs cursor-pointer select-none"
        title={theme === 'dark' ? 'Ganti ke Mode Terang / Light Mode' : 'Ganti ke Mode Gelap / Dark Mode'}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      {/* Language toggle */}
      <button
        onClick={toggleLanguage}
        className="flex items-center gap-1 border-[3px] border-sumi bg-kinari-light shadow-[3px_3px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#1a1a1a] transition-all px-3 py-1.5 h-8 cursor-pointer select-none"
        title="Toggle language"
      >
        <span className={`text-[10px] font-black tracking-[0.2em] transition-colors ${ language === 'en' ? 'text-sumi' : 'text-sumi/30' }`}>EN</span>
        <span className="text-sumi/20 text-[10px] font-bold">/</span>
        <span className={`text-[10px] font-black tracking-[0.2em] transition-colors ${ language === 'id' ? 'text-sumi' : 'text-sumi/30' }`}>ID</span>
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
                  <Route path="/mondai" element={<MondaiChapterFlow />} />
                  <Route path="/review" element={<Review />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/shop" element={<Shop />} />
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
