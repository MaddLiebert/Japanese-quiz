import { Glyph } from "../components/icons/Glyph";
import { motion } from "motion/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStats } from "../features/progress/ProgressContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { useEra } from "../features/theme/EraContext";
import { useCinematic } from "../features/cinematic/CinematicContext";
import { ERAS } from "../features/theme/eras";
import { themeBgmEnabled, setThemeBgmEnabled, themeBgmVolumeStep, setThemeBgmVolume, clampVolumeStep, THEME_BGM_VOL_STEPS } from "../features/theme/themeAudio";
import { tutorialButtonVisible } from "../features/tutorial/tutorials";
import { readMeijiSettings, writeMeijiSettings } from "../features/meiji/meijiSettings";
import { DevPanel } from "../features/dev/DevPanel"; // DEV-ONLY — hapus baris ini untuk membuang panel cheat
import { EraPaper } from "../components/EraPaper";

export function Settings() {
  const { resetProgress, progress, setTutorialHidden } = useUserStats();
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { era, setEra, unlocked } = useEra();
  const { play } = useCinematic();
  const navigate = useNavigate();
  const tutorialOn = tutorialButtonVisible(progress.tutorialHidden);
  const [bgmOn, setBgmOn] = useState(() => themeBgmEnabled());
  const [bgmVol, setBgmVol] = useState(() => themeBgmVolumeStep());
  // Efek "hidup" Meiji (M9/M10/M15) — default konservatif, bisa dimatikan.
  const [meijiFx, setMeijiFx] = useState(() => readMeijiSettings());
  const toggleMeijiFx = (key) => setMeijiFx(writeMeijiSettings({ [key]: !meijiFx[key] }));

  // Terapkan volume (indeks tangga, dijepit) → state + persist + BGM langsung.
  const applyVolStep = (i) => {
    const idx = clampVolumeStep(i);
    setBgmVol(idx);
    setThemeBgmVolume(THEME_BGM_VOL_STEPS[idx]);
  };

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
    <div className="relative max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-16 min-h-screen">
      <EraPaper />
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
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-black text-sumi tracking-tighter">
            設定 <span className="text-shu">{language === 'id' ? 'Pengaturan' : 'Settings'}</span>
          </h1>
          <p className="text-xs font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase text-sumi/60 mt-3 sm:mt-4">
            {language === 'id' ? 'Konfigurasi aplikasi dan manajemen data' : 'Application configuration and data management'}
          </p>
        </header>

        <div className="p-6 sm:p-12 relative z-10 space-y-16">

          {/* DEV-ONLY — hapus baris ini untuk membuang panel cheat */}
          {import.meta.env.DEV && <DevPanel />}

          {/* Appearance Settings */}
          <section>
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-2xl font-serif font-bold text-sumi">
                {language === 'id' ? 'Tampilan' : 'Appearance'}
              </h2>
              <div className="h-[2px] flex-1 bg-sumi/10"></div>
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/40">設定</span>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* Theme Mode Toggle */}
              <div className="border-[3px] border-sumi/20 bg-kinari p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/60 mb-1">
                    {language === 'id' ? 'Tema Tampilan' : 'Theme Mode'}
                  </label>
                  <p className="text-xs text-sumi/70 font-semibold">
                    {language === 'id' ? 'Pilih mode terang atau gelap untuk aplikasi.' : 'Choose light or dark mode for the app.'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 min-w-[240px]">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`py-3 px-4 border-[3px] border-sumi font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      theme === 'light'
                        ? 'bg-sumi text-kinari-light shadow-[3px_3px_0_0_#1a1a1a]'
                        : 'bg-kinari-light text-sumi/70 hover:text-sumi'
                    }`}
                  >
                    <Glyph name="sun" /> {language === 'id' ? 'Terang' : 'Light'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`py-3 px-4 border-[3px] border-sumi font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      theme === 'dark'
                        ? 'bg-sumi text-kinari-light shadow-[3px_3px_0_0_#1a1a1a]'
                        : 'bg-kinari-light text-sumi/70 hover:text-sumi'
                    }`}
                  >
                    <Glyph name="moon" /> {language === 'id' ? 'Gelap' : 'Dark'}
                  </button>
                </div>
              </div>

              {/* Era Selector */}
              <div className="border-[3px] border-sumi/20 bg-kinari p-6">
                <label className="block text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/60 mb-1">
                  {language === 'id' ? 'Era Tema' : 'Theme Era'}
                </label>
                <p className="text-xs text-sumi/70 font-semibold">
                  {language === 'id'
                    ? 'Pilih era visual. Era baru terbuka seiring naiknya level.'
                    : 'Choose the visual era. New eras unlock as you level up.'}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                  {ERAS.map((e) => {
                    const open = unlocked.some((u) => u.id === e.id);
                    const active = era === e.id;
                    return (
                      <button
                        key={e.id}
                        type="button"
                        disabled={!open}
                        onClick={() => setEra(e.id)}
                        title={open ? e.name : `${language === 'id' ? 'Buka di Lv' : 'Unlock at Lv'} ${e.minLevel}`}
                        className={`py-3 px-3 border-[3px] font-bold text-[10px] uppercase tracking-widest flex flex-col items-center justify-center gap-1 transition-all ${
                          active
                            ? 'border-sumi bg-sumi text-kinari-light shadow-[3px_3px_0_0_#1a1a1a] cursor-pointer'
                            : open
                              ? 'border-sumi bg-kinari-light text-sumi/70 hover:text-sumi cursor-pointer'
                              : 'border-sumi/20 bg-kinari-light text-sumi/30 cursor-not-allowed'
                        }`}
                      >
                        <span className="text-base font-serif leading-none">{e.kanji}</span>
                        <span>{e.name}</span>
                        {!open && (
                          <span className="text-[9px] normal-case tracking-normal">
                            {language === 'id' ? 'Buka di Lv' : 'Lv'} {e.minLevel}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Language Selector */}
              <div className="border-[3px] border-sumi/20 bg-kinari p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/60 mb-1">
                    {language === 'id' ? 'Bahasa Aplikasi' : 'App Language'}
                  </label>
                  <p className="text-xs text-sumi/70 font-semibold">
                    {language === 'id'
                      ? 'Pilih bahasa antarmuka: Indonesia atau Inggris.'
                      : 'Choose the interface language: English or Indonesian.'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 min-w-[240px]">
                  <button
                    type="button"
                    onClick={() => setLanguage('id')}
                    className={`py-3 px-4 border-[3px] border-sumi font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      language === 'id'
                        ? 'bg-sumi text-kinari-light shadow-[3px_3px_0_0_#1a1a1a]'
                        : 'bg-kinari-light text-sumi/70 hover:text-sumi'
                    }`}
                  >
                    <Glyph name="languages" /> Indonesia
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`py-3 px-4 border-[3px] border-sumi font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      language === 'en'
                        ? 'bg-sumi text-kinari-light shadow-[3px_3px_0_0_#1a1a1a]'
                        : 'bg-kinari-light text-sumi/70 hover:text-sumi'
                    }`}
                  >
                    <Glyph name="languages" /> English
                  </button>
                </div>
              </div>

              {/* Tutorial Button Toggle */}
              <div className="border-[3px] border-sumi/20 bg-kinari p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/60 mb-1">
                    {language === 'id' ? 'Tombol Tutorial' : 'Tutorial Button'}
                  </label>
                  <p className="text-xs text-sumi/70 font-semibold">
                    {language === 'id'
                      ? 'Tombol panduan mengapung di kanan-bawah. Matikan kalau sudah hafal biar tidak mengganggu.'
                      : 'The floating guide button (bottom-right). Turn it off once you know your way around.'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 min-w-[240px]">
                  <button
                    type="button"
                    onClick={() => setTutorialHidden(false)}
                    className={`py-3 px-4 border-[3px] border-sumi font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      tutorialOn
                        ? 'bg-sumi text-kinari-light shadow-[3px_3px_0_0_#1a1a1a]'
                        : 'bg-kinari-light text-sumi/70 hover:text-sumi'
                    }`}
                  >
                    {language === 'id' ? 'Tampil' : 'Show'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTutorialHidden(true)}
                    className={`py-3 px-4 border-[3px] border-sumi font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      !tutorialOn
                        ? 'bg-sumi text-kinari-light shadow-[3px_3px_0_0_#1a1a1a]'
                        : 'bg-kinari-light text-sumi/70 hover:text-sumi'
                    }`}
                  >
                    {language === 'id' ? 'Sembunyi' : 'Hide'}
                  </button>
                </div>
              </div>

              {/* BGM Tema Toggle (docs/tema/heian.md §9) */}
              <div className="border-[3px] border-sumi/20 bg-kinari p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/60 mb-1">
                    {language === 'id' ? 'Musik Tema (BGM)' : 'Theme Music (BGM)'}
                  </label>
                  <p className="text-xs text-sumi/70 font-semibold">
                    {language === 'id'
                      ? 'Musik latar era (gagaku / koto). Default mati agar tidak mengganggu saat kuis.'
                      : 'Era background music (gagaku / koto). Off by default so it never disturbs a quiz.'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 min-w-[240px]">
                  <button
                    type="button"
                    onClick={() => { setBgmOn(true); setThemeBgmEnabled(true, era); }}
                    className={`py-3 px-4 border-[3px] border-sumi font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      bgmOn
                        ? 'bg-sumi text-kinari-light shadow-[3px_3px_0_0_#1a1a1a]'
                        : 'bg-kinari-light text-sumi/70 hover:text-sumi'
                    }`}
                  >
                    {language === 'id' ? 'Nyalakan' : 'On'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setBgmOn(false); setThemeBgmEnabled(false, era); }}
                    className={`py-3 px-4 border-[3px] border-sumi font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      !bgmOn
                        ? 'bg-sumi text-kinari-light shadow-[3px_3px_0_0_#1a1a1a]'
                        : 'bg-kinari-light text-sumi/70 hover:text-sumi'
                    }`}
                  >
                    {language === 'id' ? 'Matikan' : 'Off'}
                  </button>
                </div>

                {/* Volume BGM — kecil/besar (5 tingkat) */}
                <div className="w-full sm:w-auto sm:min-w-[240px]">
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => applyVolStep(bgmVol - 1)}
                      disabled={bgmVol === 0}
                      title={language === 'id' ? 'Kecilkan volume' : 'Volume down'}
                      aria-label={language === 'id' ? 'Kecilkan volume' : 'Volume down'}
                      className={`py-2 px-4 border-[3px] border-sumi font-bold text-xs uppercase tracking-widest transition-all ${
                        bgmVol === 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer bg-kinari-light text-sumi/70 hover:text-sumi'
                      }`}
                    >
                      − {language === 'id' ? 'Kecil' : 'Down'}
                    </button>

                    {/* Indikator 5 bar — klik langsung ke tingkat itu */}
                    <div className="flex items-end gap-1 h-6">
                      {THEME_BGM_VOL_STEPS.map((s, i) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => applyVolStep(i)}
                          title={`${Math.round(s * 100)}%`}
                          aria-label={`${language === 'id' ? 'Volume' : 'Volume'} ${Math.round(s * 100)}%`}
                          className={`w-2 cursor-pointer border-[2px] border-sumi transition-all ${i <= bgmVol ? 'bg-sumi' : 'bg-kinari-light'}`}
                          style={{ height: `${8 + i * 4}px` }}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => applyVolStep(bgmVol + 1)}
                      disabled={bgmVol === THEME_BGM_VOL_STEPS.length - 1}
                      title={language === 'id' ? 'Besarkan volume' : 'Volume up'}
                      aria-label={language === 'id' ? 'Besarkan volume' : 'Volume up'}
                      className={`py-2 px-4 border-[3px] border-sumi font-bold text-xs uppercase tracking-widest transition-all ${
                        bgmVol === THEME_BGM_VOL_STEPS.length - 1 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer bg-kinari-light text-sumi/70 hover:text-sumi'
                      }`}
                    >
                      + {language === 'id' ? 'Besar' : 'Up'}
                    </button>
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-sumi/50 mt-2 text-center sm:text-right">
                    {language === 'id' ? 'Volume' : 'Volume'} {Math.round(THEME_BGM_VOL_STEPS[bgmVol] * 100)}%
                  </p>
                </div>
              </div>

              {/* Efek hidup Meiji (M9 glitch / M10 号外 / M15 napas) — bisa dimatikan */}
              <div className="border-[3px] border-sumi/20 bg-kinari p-6">
                <label className="block text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/60 mb-1">
                  {language === 'id' ? 'Efek Meiji 明治 (opsional)' : 'Meiji Effects 明治 (optional)'}
                </label>
                <p className="text-xs text-sumi/70 font-semibold mb-4">
                  {language === 'id'
                    ? 'Rasa "hidup" era Meiji. Default aktif tapi halus; matikan kalau mengganggu.'
                    : 'The Meiji era\u2019s "living" feel. On by default but subtle; turn off if distracting.'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { key: 'glitch', jp: '電脳', id: 'Glitch cyberpunk', en: 'Cyberpunk glitch' },
                    { key: 'gogo', jp: '号外', id: 'Koran 号外 larut malam', en: 'Late-night 号外 edition' },
                    { key: 'breathing', jp: '呼吸', id: 'App bernapas', en: 'Breathing app' },
                  ].map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => toggleMeijiFx(f.key)}
                      aria-pressed={meijiFx[f.key]}
                      className={`py-3 px-4 border-[3px] border-sumi font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        meijiFx[f.key]
                          ? 'bg-sumi text-kinari-light shadow-[3px_3px_0_0_#1a1a1a]'
                          : 'bg-kinari-light text-sumi/60 hover:text-sumi'
                      }`}
                    >
                      <span className="font-serif">{f.jp}</span>
                      {language === 'id' ? f.id : f.en}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Cinematic perkenalan era — putar ulang manual */}
          <section>
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-2xl font-serif font-bold text-sumi">
                {language === 'id' ? 'Cinematic' : 'Cinematic'}
              </h2>
              <div className="h-[2px] flex-1 bg-sumi/10"></div>
            </div>
            <div className="flex flex-col gap-6">
              {[
                { id: 'heian', kanji: '平安', name: 'Heian', route: '/heian-history',
                  desc_id: 'Cinematic sejarah yang diputar sekali saat era Heian pertama terbuka. Putar ulang kapan saja di sini.',
                  desc_en: 'The historical cinematic that plays once when the Heian era first opens. Replay it any time here.' },
                { id: 'edo', kanji: '江戸', name: 'Edo', route: '/edo-history',
                  desc_id: 'Cinematic sejarah yang diputar sekali saat era Edo pertama terbuka. Putar ulang kapan saja di sini.',
                  desc_en: 'The historical cinematic that plays once when the Edo era first opens. Replay it any time here.' },
                { id: 'meiji', kanji: '明治', name: 'Meiji', route: '/meiji-history',
                  desc_id: 'Cinematic sejarah yang diputar sekali saat era Meiji pertama terbuka. Putar ulang kapan saja di sini.',
                  desc_en: 'The historical cinematic that plays once when the Meiji era first opens. Replay it any time here.' },
                { id: 'showa', kanji: '昭和', name: 'Shōwa', route: '/showa-history',
                  desc_id: 'Cinematic sejarah yang diputar sekali saat era Shōwa pertama terbuka. Putar ulang kapan saja di sini.',
                  desc_en: 'The historical cinematic that plays once when the Shōwa era first opens. Replay it any time here.' },
              ].map((c) => {
                const open = unlocked.some((e) => e.id === c.id);
                return (
                  <div key={c.id} className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-sumi">
                        {language === 'id' ? `Cinematic Sejarah ${c.name}` : `${c.name} Historical Cinematic`}
                      </p>
                      <p className="text-xs text-sumi/70 font-semibold">
                        {language === 'id' ? c.desc_id : c.desc_en}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() => play(c.id)}
                        disabled={!open}
                        className="py-3 px-5 border-[3px] border-sumi font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer bg-kinari-light text-sumi hover:bg-sumi hover:text-kinari-light shadow-[3px_3px_0_0_#1a1a1a] disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {language === 'id' ? `Putar ${c.kanji}` : `Play ${c.kanji}`}
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(c.route)}
                        disabled={!open}
                        className="py-3 px-5 border-[3px] border-kin font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer bg-kinari-light text-kin-ink hover:bg-kin hover:text-sumi shadow-[3px_3px_0_0_#1a1a1a] disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {language === 'id' ? `Sejarah ${c.name}` : `${c.name} History`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* App info section */}
          <section>
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-2xl font-serif font-bold text-sumi">{language === 'id' ? 'Tentang' : 'About'}</h2>
              <div className="h-[2px] flex-1 bg-sumi/10"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-px border-[3px] border-sumi/20 bg-sumi/10">
              {[
                { label: language === 'id' ? "Aplikasi" : "Application", value: "日本語学園 · Nihongo Gakuen" },
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

          {/* Dedication section */}
          <section>
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-2xl font-serif font-bold text-sumi">
                Dedication <span className="text-sm font-sans font-normal text-sumi/40">/ 献身</span>
              </h2>
              <div className="h-[2px] flex-1 bg-sumi/10"></div>
            </div>

            <div className="border-[3px] border-sumi bg-kinari-light p-6 sm:p-8 relative overflow-hidden shadow-[4px_4px_0_0_rgba(26,26,26,0.06)]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <img
                  src="/logo-eskul.jpeg"
                  alt="Logo Panji Japanese Club"
                  className="h-16 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300 flex-shrink-0 rounded-sm"
                />
                <div className="space-y-2">
                  <h3 className="text-lg font-serif font-bold text-sumi">
                    Panji Japanese Club
                  </h3>
                  <p className="text-sm font-medium text-sumi/80 leading-relaxed">
                    Aplikasi ini dibuat khusus untuk <strong className="text-sumi font-bold">PJC</strong> belajar menguasai JLPT N5. Credit by: <strong className="text-ai font-bold">Madd</strong>.
                  </p>
                </div>
              </div>
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
