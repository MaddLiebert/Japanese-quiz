import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useUserStats, useItemProgress, useAchievements, ACHIEVEMENT_META } from '../progress/ProgressContext';
import { Glyph } from "../../components/icons/Glyph";
import { RankBadge } from '../progress/RankBadge';
import { useLanguage } from '../../context/LanguageContext';
import { N5Certificate } from '../n5exam/N5Certificate';
import { localized } from '../../utils/localize';
import { isLegendary, badgeCircleClass } from '../progress/badgeSeal';
import { LegendaryDecor } from '../progress/BadgeDecor';
import hiraganaData from '../../data/hiragana.json';
import katakanaData from '../../data/katakana.json';
import kotobaData from '../../data/kotoba.json';
import grammarData from '../../data/grammar.json';
import kanjiData from '../../data/kanji.json';
import mondaiData from '../../data/mondai.json';
import poemsData from '../../data/poems.json';
import n5ExamData from '../../data/n5-exam.json';
import { buildSubjectMastery, flattenExamData, SUBJECT_LABEL_ID } from './subjectMastery';
import { EraPaper } from '../../components/EraPaper';
import { readAvatar, writeAvatar, clearAvatar, resizeImageToDataURL, isValidAvatarFile, initials } from './avatar';
import { useSync } from '../sync/SyncContext';
import { fetchMyRank } from '../leaderboard/leaderboardApi';
import { getCosmetic } from '../cosmetics/cosmetics';
import { useEra } from '../theme/EraContext';

// Hanko Stamp component matching Home.jsx
const HankoStamp = ({ text, label, delay = 0.2 }) => (
  <motion.div
    initial={{ scale: 1.5, opacity: 0, rotate: 10 }}
    animate={{ scale: 1, opacity: 1, rotate: -5 }}
    transition={{ type: "spring", stiffness: 150, damping: 10, delay }}
    className="relative flex flex-col items-center justify-center w-20 h-20 rounded-full border-[4px] border-shu text-shu overflow-hidden bg-kinari-light shadow-sm"
  >
    <div className="absolute inset-0 border-[2px] border-shu opacity-60 m-1 rounded-full"></div>
    <span className="text-[9px] uppercase font-bold tracking-[0.2em] mt-2 mb-0.5">{label}</span>
    <span className="text-3xl font-serif font-black leading-none">{text}</span>
  </motion.div>
);

export function Profile() {
  const [activeTab, setActiveTab] = useState('card');
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { progress, username, setUsername } = useUserStats();
  const { itemProgress } = useItemProgress();
  const { achievements, selectedBadges, setSelectedBadges } = useAchievements();
  const [isEditingBadges, setIsEditingBadges] = useState(false);

  // 電脳 — kosmetik terpasang (Frame ID 電脳ID + Skin HUD). GERBANG ERA: hanya
  // tampil di era 電脳 (dihitung hidup dari `era` → otomatis mati di era lain).
  const { era } = useEra();
  const activeFrame = era === 'cyberpunk' ? getCosmetic(progress.activeFrame) : null;
  const activeHud = era === 'cyberpunk' ? getCosmetic(progress.activeHud) : null;

  // ── Foto profil (disimpan lokal + ikut tersinkron ke cloud) ────────────────
  const [avatar, setAvatar] = useState(() => readAvatar());
  const [avatarMsg, setAvatarMsg] = useState('');
  const avatarInputRef = useRef(null);

  const handlePickAvatar = () => avatarInputRef.current?.click();
  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const v = isValidAvatarFile(file);
    if (!v.ok) {
      setAvatarMsg(v.reason === 'size' ? 'File terlalu besar (maks 8MB)' : 'Format harus PNG/JPG/WebP/GIF');
      return;
    }
    try {
      const dataUrl = await resizeImageToDataURL(file);
      setAvatar(dataUrl);
      writeAvatar(localStorage, dataUrl);
      setAvatarMsg('Foto tersimpan ✓');
    } catch {
      setAvatarMsg('Gagal memproses gambar');
    }
  };
  const handleRemoveAvatar = () => {
    setAvatar('');
    clearAvatar(localStorage);
    setAvatarMsg('Foto dihapus');
  };

  // ── Peringkat global (tampil kalau sync aktif) ─────────────────────────────
  const { configured, enabled, user } = useSync();
  const [rank, setRank] = useState(null);
  useEffect(() => {
    let alive = true;
    if (configured && enabled && user) {
      fetchMyRank().then((r) => { if (alive) setRank(r.rank); }).catch(() => {});
    } else {
      setRank(null);
    }
    return () => { alive = false; };
  }, [configured, enabled, user, progress.xp]);

  // Radar "Subject Mastery" — 8 subjek (termasuk Puisi & Ujian N5 yang dulu
  // tercatat tapi tak pernah tampil). Logika murni + tes di subjectMastery.js.
  const subjectRadar = useMemo(
    () => buildSubjectMastery(itemProgress, {
      hiragana: hiraganaData,
      katakana: katakanaData,
      kanji: kanjiData,
      kotoba: kotobaData,
      grammar: grammarData,
      mondai: mondaiData,
      poems: poemsData,
      n5exam: flattenExamData(n5ExamData),
    }),
    [itemProgress],
  );

  const toggleBadge = (id) => {
    if (selectedBadges.includes(id)) {
      setSelectedBadges(selectedBadges.filter(b => b !== id));
    } else if (selectedBadges.length < 4) {
      setSelectedBadges([...selectedBadges, id]);
    }
  };
  
  const playerName = username || localStorage.getItem('username') || 'Anonim';
  const winRate = Number((progress.weightedWinRate || 0).toFixed(1));

  const [bio, setBio] = useState(() => {
    return localStorage.getItem('user_bio') || "Masih pemula, lagi nge-grind bab 5 nih!";
  });
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [tempBio, setTempBio] = useState(bio);

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(playerName);

  const handleSaveBio = () => {
    setBio(tempBio);
    localStorage.setItem('user_bio', tempBio);
    setIsEditingBio(false);
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      setUsername(tempName.trim());
      setIsEditingName(false);
    }
  };

  const realProfileData = {
    name: username || playerName,
    bio: bio,
    badges: [
      { icon: "sword", name: "Kanji Slayer", desc: `Total Jawab ${progress.totalAnswered}` },
      { icon: "shield", name: "Undefeated", desc: `Max Streak ${progress.maxStreak}` },
      { icon: "bolt", name: "Speed Demon", desc: `Level ${progress.level}` }
    ],
    stats: { 
      winRate: winRate, 
      totalQuiz: progress.totalAnswered, 
      maxStreak: progress.maxStreak 
    },
    radar: subjectRadar,
  };

  return (
    <div className="relative max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-16 min-h-screen">
      <EraPaper />
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="mb-6 flex items-center gap-2 px-4 py-2 bg-kinari-light border-[3px] border-sumi font-black uppercase text-xs shadow-[3px_3px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#1a1a1a] transition-all cursor-pointer"
      >
        ← Kembali
      </button>

      {/* Outer Editorial Frame matching Home.jsx */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="border-[4px] border-sumi bg-kinari-light relative overflow-hidden shadow-[12px_12px_0_0_rgba(26,26,26,0.1)]"
      >
        {/* Background Decorative Kanji */}
        <div className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/4 text-[25rem] font-serif text-sumi opacity-[0.03] pointer-events-none select-none leading-none z-0">
          者
        </div>

        {/* Header Section */}
        <header className="grid grid-cols-1 sm:grid-cols-12 border-b-[4px] border-sumi relative z-10 bg-seigaiha">
          <div className="sm:col-span-8 p-6 sm:p-10 flex flex-col justify-between border-b-[4px] sm:border-b-0 sm:border-r-[4px] border-sumi relative">
            <div className="absolute inset-0 bg-gradient-to-br from-kinari-light/90 to-transparent pointer-events-none"></div>
            
            <div className="flex items-center gap-4 mb-8 relative z-10">
              <div className="w-12 h-12 bg-sumi text-kinari-light flex items-center justify-center font-serif text-2xl rotate-3 shadow-[4px_4px_0_0_#d3382f]">
                者
              </div>
              <div>
                <span className="text-xs uppercase tracking-[0.4em] font-bold text-sumi">
                  Player Dossier
                </span>
                <h1 className="text-3xl sm:text-5xl font-serif font-black text-sumi tracking-tighter mt-1">
                  プロフィール
                </h1>
              </div>
            </div>

            <div className="relative z-10 flex items-center gap-3 flex-wrap">
              <RankBadge xp={progress.xp} variant="chip" />
              <span className="bg-ai text-kinari-light text-xs font-black px-3 py-1.5 border-[2px] border-sumi shadow-[3px_3px_0_0_#1a1a1a]">
                {realProfileData.stats.winRate}% WIN RATE
              </span>
              {/* 電脳 — kosmetik terpasang (Frame ID + Skin HUD) */}
              {activeFrame && (
                <span
                  className="text-xs font-black px-3 py-1.5 border-[2px] border-sumi shadow-[3px_3px_0_0_#1a1a1a]"
                  style={{ background: activeFrame.palette.accent, color: '#0a0a0a' }}
                >
                  <Glyph name={activeFrame.icon} className="mr-1" />{activeFrame.kanji}
                </span>
              )}
              {activeHud && (
                <span
                  className="text-xs font-black px-3 py-1.5 border-[2px] border-sumi shadow-[3px_3px_0_0_#1a1a1a]"
                  style={{ background: activeHud.palette.accent, color: '#0a0a0a' }}
                >
                  <Glyph name={activeHud.icon} className="mr-1" />{activeHud.kanji}
                </span>
              )}
            </div>
          </div>

          <div className="sm:col-span-4 p-6 flex flex-col items-center justify-center bg-kinari relative">
            <div className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-[0.3em] text-sumi/40">
              STATUS
            </div>
            <HankoStamp label="LV" text={progress.level} />
            <div className="mt-4">
              <RankBadge xp={progress.xp} variant="hero" showProgress />
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 border-b-[4px] border-sumi bg-kinari">
          <button
            onClick={() => setActiveTab('card')}
            className={`py-4 px-3 sm:px-6 font-serif font-black uppercase text-xs sm:text-sm border-r-[4px] border-sumi transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'card' ? 'bg-shu text-kinari-light shadow-inner' : 'bg-kinari-light text-sumi hover:bg-kinari'
            }`}
          >
            <Glyph name="idcard" className="mr-1" />ID Card
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-4 px-3 sm:px-6 font-serif font-black uppercase text-xs sm:text-sm border-r-[4px] border-sumi transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'stats' ? 'bg-shu text-kinari-light shadow-inner' : 'bg-kinari-light text-sumi hover:bg-kinari'
            }`}
          >
            <Glyph name="chart" className="mr-1" />Statistik
          </button>
          <button
            onClick={() => setActiveTab('cert')}
            className={`py-4 px-3 sm:px-6 font-serif font-black uppercase text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'cert' ? 'bg-shu text-kinari-light shadow-inner' : 'bg-kinari-light text-sumi hover:bg-kinari'
            }`}
          >
            <Glyph name="trophy" className="mr-1" />Sertifikat
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-12 relative z-10 bg-kinari-light">
          {activeTab === 'card' && (
            <div className="space-y-8">
              {/* Name & Avatar card */}
              <div className="border-[4px] border-sumi bg-kinari p-6 shadow-[6px_6px_0_0_#1a1a1a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handlePickAvatar}
                      title={language === 'id' ? 'Ganti foto profil' : 'Change profile photo'}
                      className="w-20 h-20 bg-ai text-kinari-light border-[4px] border-sumi shadow-[4px_4px_0_0_#1a1a1a] flex items-center justify-center overflow-hidden relative cursor-pointer group"
                      style={activeFrame ? { borderColor: activeFrame.palette.accent, boxShadow: `0 0 0 3px ${activeFrame.palette.accent2}, 4px 4px 0 0 #1a1a1a` } : undefined}
                    >
                      {avatar ? (
                        <img src={avatar} alt="Foto profil" className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-serif font-black text-2xl">{initials(realProfileData.name)}</span>
                      )}
                      <span className="absolute inset-0 bg-sumi/60 text-kinari-light text-[9px] font-black uppercase tracking-widest items-center justify-center hidden group-hover:flex">
                        {language === 'id' ? 'Ganti' : 'Change'}
                      </span>
                    </button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarFile}
                    />
                    {avatar && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="text-[9px] font-black uppercase tracking-widest text-shu hover:underline cursor-pointer"
                      >
                        {language === 'id' ? 'Hapus Foto' : 'Remove'}
                      </button>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-sumi/60">Nickname</span>
                    <div className="flex items-center gap-3 flex-wrap mt-1">
                      {!isEditingName ? (
                        <>
                          <h2 className="text-3xl font-serif font-black text-sumi">{realProfileData.name}</h2>
                          <button
                            onClick={() => { setTempName(realProfileData.name); setIsEditingName(true); }}
                            className="text-[10px] font-black uppercase px-2 py-1 bg-kinari-light border-[2px] border-sumi shadow-[2px_2px_0_0_#1a1a1a] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer"
                          >
                            <Glyph name="pen" className="mr-1" />Edit Nama
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            className="border-[2px] border-sumi bg-kinari-light px-3 py-1.5 text-base font-bold w-40 sm:w-52 focus:outline-none"
                            maxLength={20}
                            autoFocus
                          />
                          <button
                            onClick={handleSaveName}
                            className="text-xs font-black px-3 py-1.5 bg-ai text-kinari-light border-[2px] border-sumi shadow-[2px_2px_0_0_#1a1a1a] cursor-pointer"
                          >
                            ✓ Simpan
                          </button>
                          <button
                            onClick={() => setIsEditingName(false)}
                            className="text-xs font-black px-3 py-1.5 bg-kinari border-[2px] border-sumi shadow-[2px_2px_0_0_#1a1a1a] cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-[10px] uppercase tracking-widest font-bold text-sumi/60">Total XP</div>
                  <div className="text-2xl font-serif font-black text-sumi">{progress.xp.toLocaleString()} XP</div>
                  {rank != null && (
                    <div className="mt-2 inline-flex items-center gap-1.5 bg-shu text-kinari-light text-[11px] font-black px-3 py-1 border-[2px] border-sumi shadow-[3px_3px_0_0_#1a1a1a]">
                      <Glyph name="trophy" className="text-xs" />
                      {language === 'id' ? 'Peringkat' : 'Rank'} #{rank}
                    </div>
                  )}
                  {avatarMsg && (
                    <div className="text-[10px] font-bold text-sumi/50 mt-2">{avatarMsg}</div>
                  )}
                </div>
              </div>

              {/* Bio Card */}
              <div className="border-[4px] border-sumi bg-kinari p-6 shadow-[6px_6px_0_0_#1a1a1a] relative">
                <div className="flex items-center justify-between mb-3 border-b-[2px] border-sumi/10 pb-2">
                  <span className="text-xs uppercase font-black tracking-[0.2em] text-sumi">Bio / Catatan</span>
                  {!isEditingBio ? (
                    <button
                      onClick={() => { setTempBio(bio); setIsEditingBio(true); }}
                      className="text-xs font-black uppercase px-3 py-1 bg-kinari-light border-[2px] border-sumi shadow-[2px_2px_0_0_#1a1a1a] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer"
                    >
                      <Glyph name="pen" className="mr-1" />Edit Bio
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveBio}
                        className="text-xs font-black uppercase px-3 py-1 bg-ai text-kinari-light border-[2px] border-sumi shadow-[2px_2px_0_0_#1a1a1a] cursor-pointer"
                      >
                        <Glyph name="save" className="mr-1" />Simpan
                      </button>
                      <button
                        onClick={() => setIsEditingBio(false)}
                        className="text-xs font-black uppercase px-3 py-1 bg-kinari-light border-[2px] border-sumi shadow-[2px_2px_0_0_#1a1a1a] cursor-pointer"
                      >
                        ✕ Batal
                      </button>
                    </div>
                  )}
                </div>

                {!isEditingBio ? (
                  <p className="font-bold text-base text-sumi/90 whitespace-pre-wrap">{realProfileData.bio}</p>
                ) : (
                  <textarea
                    value={tempBio}
                    onChange={(e) => setTempBio(e.target.value)}
                    className="w-full bg-kinari-light border-[3px] border-sumi p-3 text-sm font-bold text-sumi focus:outline-none"
                    rows={3}
                    maxLength={140}
                    autoFocus
                  />
                )}
              </div>

              {/* Badges Section */}
              <div>
                <div className="flex items-center justify-between gap-4 mb-6">
                  <h3 className="text-xl font-serif font-black text-sumi">Pencapaian & Badge</h3>
                  {!isEditingBadges ? (
                    <button
                      onClick={() => setIsEditingBadges(true)}
                      className="text-xs font-black uppercase px-3 py-1 bg-kinari-light border-[2px] border-sumi shadow-[2px_2px_0_0_#1a1a1a] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer"
                    >
                      <Glyph name="pen" className="mr-1" />Edit Badges
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditingBadges(false)}
                      className="text-xs font-black uppercase px-3 py-1 bg-matcha border-[2px] border-sumi shadow-[2px_2px_0_0_#1a1a1a] cursor-pointer"
                    >
                      ✓ Selesai
                    </button>
                  )}
                </div>
                {achievements.length === 0 ? (
                  <p className="text-xs uppercase tracking-widest font-bold text-sumi/50">
                    Belum ada badge yang terbuka. Selesaikan kuis untuk mendapatkan cap!
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {isEditingBadges
                      ? achievements.map((id) => {
                          const meta = ACHIEVEMENT_META[id];
                          if (!meta) return null;
                          const isSelected = selectedBadges.includes(id);
                          return (
                            <button
                              key={id}
                              onClick={() => toggleBadge(id)}
                              className={`border-[3px] border-sumi p-4 shadow-[4px_4px_0_0_#1a1a1a] flex items-center gap-4 cursor-pointer text-left ${
                                isSelected ? 'bg-ai text-kinari-light' : 'bg-kinari'
                              }`}
                            >
                              <div className={`w-12 h-12 rounded-full text-shu flex items-center justify-center font-serif font-black text-xl bg-kinari-light flex-shrink-0 relative ${badgeCircleClass(id).replace('border-[5px]', 'border-[3px]')}`}>
                                {isLegendary(id) && <LegendaryDecor />}
                                {meta.label}
                              </div>
                              <div>
                                <div className="font-serif font-black">{meta.title}</div>
                                <div className="text-xs font-bold opacity-80">{localized(meta, 'desc', language)}</div>
                              </div>
                              {isSelected && <span className="ml-auto text-2xl">✓</span>}
                            </button>
                          );
                        })
                      : (selectedBadges.length > 0 ? selectedBadges : achievements.slice(0, 4)).map((id) => {
                          const meta = ACHIEVEMENT_META[id];
                          if (!meta) return null;
                          return (
                            <div key={id} className="border-[3px] border-sumi bg-kinari p-4 shadow-[4px_4px_0_0_#1a1a1a] flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-full text-shu flex items-center justify-center font-serif font-black text-xl bg-kinari-light flex-shrink-0 relative ${badgeCircleClass(id).replace('border-[5px]', 'border-[3px]')}`}>
                                {isLegendary(id) && <LegendaryDecor />}
                                {meta.label}
                              </div>
                              <div>
                                <div className="font-serif font-black text-sumi">{meta.title}</div>
                                <div className="text-xs text-sumi/70 font-bold">{localized(meta, 'desc', language)}</div>
                              </div>
                            </div>
                          );
                        })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-8">
              {/* Summary Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="border-[4px] border-sumi bg-kinari p-6 shadow-[6px_6px_0_0_#1a1a1a] text-center">
                  <div className="text-xs font-black uppercase text-sumi/60 mb-1">{language === 'id' ? 'Rasio Menang' : 'Win Rate'}</div>
                  <div className="text-4xl font-serif font-black text-shu">{realProfileData.stats.winRate}%</div>
                </div>
                <div className="border-[4px] border-sumi bg-kinari p-6 shadow-[6px_6px_0_0_#1a1a1a] text-center">
                  <div className="text-xs font-black uppercase text-sumi/60 mb-1">{language === 'id' ? 'Total Kuis' : 'Total Quiz'}</div>
                  <div className="text-4xl font-serif font-black text-sumi">{realProfileData.stats.totalQuiz}</div>
                </div>
                <div className="border-[4px] border-sumi bg-kinari p-6 shadow-[6px_6px_0_0_#1a1a1a] text-center">
                  <div className="text-xs font-black uppercase text-sumi/60 mb-1">{language === 'id' ? 'Streak Maks' : 'Max Streak'}</div>
                  <div className="text-4xl font-serif font-black text-ai">{realProfileData.stats.maxStreak} {language === 'id' ? 'hari' : 'days'}</div>
                </div>
              </div>

              {/* Subject Mastery */}
              <div className="border-[4px] border-sumi bg-kinari p-6 sm:p-8 shadow-[6px_6px_0_0_#1a1a1a]">
                <div className="flex items-center gap-4 mb-6">
                  <h3 className="text-xl font-serif font-black text-sumi">{language === 'id' ? 'Penguasaan Materi' : 'Subject Mastery'}</h3>
                  <div className="h-[2px] flex-1 bg-sumi/20"></div>
                </div>
                <div className="max-h-[460px] w-full space-y-5 overflow-y-auto pr-3">
                  {realProfileData.radar.map((r, i) => (
                    <div key={i}>
                      <div className="flex justify-between font-serif font-black text-sm mb-1.5 text-sumi">
                        <span>{language === 'id' ? SUBJECT_LABEL_ID[r.subject] || r.subject : r.subject}</span>
                        <span>{r.score}%</span>
                      </div>
                      <div className="w-full h-5 bg-kinari-light border-[3px] border-sumi shadow-[2px_2px_0_0_#1a1a1a] overflow-hidden">
                        <motion.div
                          className="h-full bg-shu border-r-[2px] border-sumi"
                          initial={{ width: 0 }}
                          animate={{ width: `${r.score}%` }}
                          transition={{ duration: 0.7, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cert' && (
            <N5Certificate record={progress.n5Exam} username={playerName} />
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default Profile;
