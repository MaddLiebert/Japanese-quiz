import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useProgress } from "../features/progress/ProgressContext";
import { useLanguage } from "../context/LanguageContext";

export function Settings() {
  const { resetProgress } = useProgress();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const handleReset = () => {
    const message = language === 'id' 
      ? "Apakah Anda yakin ingin mereset semua kemajuan? Ini tidak dapat dibatalkan."
      : "Are you sure you want to reset all progress? This cannot be undone.";
      
    const confirmed = window.confirm(message);
    if (confirmed) {
      resetProgress();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-16 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="border-[4px] border-sumi bg-kinari-light shadow-[8px_8px_0_0_rgba(26,26,26,0.1)] relative overflow-hidden"
      >
        {/* Decorative background kanji */}
        <div className="absolute bottom-0 right-0 text-[20rem] font-serif text-sumi opacity-[0.03] pointer-events-none select-none leading-none translate-x-1/4 translate-y-1/4 z-0">
          設
        </div>

        {/* Header */}
        <header className="border-b-[4px] border-sumi p-6 sm:p-12 relative z-10">
          <button
            onClick={() => navigate(-1)}
            className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/60 hover:text-shu transition-colors flex items-center gap-2 mb-8 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span> {language === 'id' ? 'Kembali' : 'Back'}
          </button>
          <h1 className="text-5xl sm:text-7xl font-serif font-black text-sumi tracking-tighter">
            設定 <span className="text-shu">{language === 'id' ? 'Pengaturan' : 'Settings'}</span>
          </h1>
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-sumi/60 mt-4">
            {language === 'id' ? 'Konfigurasi aplikasi dan manajemen data' : 'Application configuration and data management'}
          </p>
        </header>

        <div className="p-6 sm:p-12 relative z-10 space-y-16">

          {/* App info section */}
          <section>
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-2xl font-serif font-bold text-sumi">{language === 'id' ? 'Tentang' : 'About'}</h2>
              <div className="h-[2px] flex-1 bg-sumi/10"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-px border-[3px] border-sumi/20 bg-sumi/10">
              {[
                { label: language === 'id' ? "Aplikasi" : "Application", value: "Japanese Quiz" },
                { label: language === 'id' ? "Dasar" : "Foundation", value: "N5 Course" },
                { label: language === 'id' ? "Versi" : "Version", value: "1.0.0" },
              ].map((item) => (
                <div key={item.label} className="bg-kinari p-6">
                  <div className="text-[9px] uppercase tracking-[0.3em] font-bold text-sumi/50 mb-2">
                    {item.label}
                  </div>
                  <div className="text-lg font-serif font-bold text-sumi">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Danger zone */}
          <section>
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-2xl font-serif font-bold text-shu">{language === 'id' ? 'Zona Bahaya' : 'Danger Zone'}</h2>
              <div className="h-[2px] flex-1 bg-shu/20"></div>
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-shu/60">危険</span>
            </div>

            <div className="border-[3px] border-shu/40 bg-kinari p-8 sm:p-10 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle,currentColor_1px,transparent_1px)] bg-[length:10px_10px] text-shu/5 pointer-events-none"></div>
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div>
                  <h3 className="text-xl font-serif font-black text-sumi mb-2">
                    {language === 'id' ? 'Reset Semua Data' : 'Reset All Progress'}
                  </h3>
                  <p className="text-xs uppercase tracking-[0.2em] font-bold text-sumi/60 max-w-sm leading-relaxed">
                    {language === 'id' 
                      ? 'Menghapus permanen semua XP, data penguasaan, pencapaian, dan item lemah. Tindakan ini tidak dapat dibatalkan.' 
                      : 'Permanently deletes all XP, mastery data, achievements, and weak items. This action cannot be undone.'}
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="flex-shrink-0 px-8 py-4 border-[3px] border-shu text-shu font-black text-sm tracking-widest uppercase transition-all shadow-[4px_4px_0_0_rgba(211,56,47,0.4)] hover:bg-shu hover:text-kinari-light hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_rgba(211,56,47,0.4)]"
                >
                  {language === 'id' ? 'Reset Semua Data' : 'Reset All Progress'}
                </button>
              </div>
            </div>
          </section>

        </div>
      </motion.div>
    </div>
  );
}
