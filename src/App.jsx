import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import { Learn } from "./pages/Learn";
import { Practice } from "./pages/Practice";
import { Review } from "./pages/Review";
import { Settings } from "./pages/Settings";
import { ProgressProvider } from "./features/progress/ProgressContext";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";

// Floating language toggle — shown on every page
function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();
  return (
    <button
      onClick={toggleLanguage}
      className="fixed top-4 right-4 z-50 flex items-center gap-1 border-[3px] border-sumi bg-kinari-light shadow-[3px_3px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#1a1a1a] transition-all px-3 py-1.5"
      title="Toggle language"
    >
      <span className={`text-[10px] font-black tracking-[0.2em] transition-colors ${ language === 'en' ? 'text-sumi' : 'text-sumi/30' }`}>EN</span>
      <span className="text-sumi/20 text-[10px] font-bold">/</span>
      <span className={`text-[10px] font-black tracking-[0.2em] transition-colors ${ language === 'id' ? 'text-sumi' : 'text-sumi/30' }`}>ID</span>
    </button>
  );
}

function App() {
  return (
    <LanguageProvider>
      <ProgressProvider>
        <BrowserRouter>
          <div className="min-h-screen relative font-sans selection:bg-ai/20 overflow-x-hidden bg-[#e8e4d9]">
        
        {/* 1. Global Washi Texture overlay - made more pronounced for the backdrop */}
        <div 
          className="fixed inset-0 pointer-events-none z-0 mix-blend-multiply opacity-[0.5]" 
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.25'/%3E%3C/svg%3E")` 
          }}
        />
        
        {/* 2. Abstract background motif (Seigaiha radiating from center) */}
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 opacity-10 bg-seigaiha mask-image:radial-gradient(circle_at_center,black,transparent_70%)"></div>

        {/* Global Language Toggle */}
        <LanguageToggle />

        <main className="relative z-10 w-full h-full">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/review" element={<Review />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
        </div>
        </BrowserRouter>
      </ProgressProvider>
    </LanguageProvider>
  );
}

export default App;