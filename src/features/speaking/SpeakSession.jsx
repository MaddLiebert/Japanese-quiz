import { Glyph } from "../../components/icons/Glyph";
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Volume2, Mic, SkipForward, Check } from 'lucide-react';
import { useSpeechRecognition } from './useSpeechRecognition';
import { appendSpeechEvent } from './speechLog';
import { MicOverlay } from './MicOverlay';
import { matchSpeech, verdictOf } from './speechMatch';
import { speakXpFor, speakLevel, speakPromptKind, speakTextSize, DEFAULT_SPEAK_LEVEL } from './speaking';
import { useItemProgress, useAchievements } from '../progress/ProgressContext';
import { useEffectLayer } from '../effects/EffectContext';
import { useLanguage } from '../../context/LanguageContext';
import { playDramaticAudio } from '../../utils/audio';

// Ukuran teks besar sesi: kunci speakTextSize() → kelas Tailwind literal.
// Batasnya dipilih agar teks terpanjang (10 huruf) maksimal 2 baris di 320px.
const SPEAK_TEXT_CLASS = {
  xl: 'text-[80px] sm:text-[120px]',
  lg: 'text-[56px] sm:text-[96px]',
  md: 'text-[44px] sm:text-[72px]',
  sm: 'text-[34px] sm:text-[56px]',
};

const ERROR_TEXT = {
  'not-supported': { id: 'Browser ini tidak mendukung pengenalan suara.', en: 'This browser does not support speech recognition.' },
  'not-allowed': { id: 'Izin mikrofon ditolak. Aktifkan lewat pengaturan browser.', en: 'Microphone permission denied. Enable it in browser settings.' },
  'no-speech': { id: 'Tidak terdengar suara — coba lagi lebih dekat ke mikrofon.', en: 'No speech detected — try again closer to the mic.' },
  'audio-capture': { id: 'Mikrofon tidak ditemukan.', en: 'No microphone found.' },
  network: { id: 'Pengenalan suara butuh koneksi internet.', en: 'Speech recognition needs an internet connection.' },
  insecure: { id: 'Pengenalan suara butuh koneksi aman — buka lewat https:// atau localhost.', en: 'Speech recognition needs a secure context — use https:// or localhost.' },
  'service-not-allowed': { id: 'Layanan pengenalan suara diblokir. Cek izin mikrofon untuk situs ini di pengaturan browser.', en: "Speech service blocked. Check this site's microphone permission in browser settings." },
  'language-not-supported': { id: 'Pengenalan suara bahasa Jepang tidak tersedia di perangkat ini.', en: 'Japanese speech recognition is unavailable on this device.' },
};

export function SpeakSession({ items = [], startIndex = 0, level = DEFAULT_SPEAK_LEVEL, onExit }) {
  const { language } = useLanguage();
  const id = language === 'id';
  const { recordAnswer } = useItemProgress();
  const { unlockAchievement } = useAchievements();
  const { triggerEffect } = useEffectLayer();
  const { listenOnce, listening, interim, level: micLevel, error, clearError, cancel, supported } = useSpeechRecognition({ onEvent: appendSpeechEvent });
  const lv = speakLevel(level);
  const selfAssess = !supported;   // mode mandiri: tanpa penilaian, tanpa XP

  const [index, setIndex] = useState(Math.min(startIndex, Math.max(items.length - 1, 0)));
  const [result, setResult] = useState(null); // { verdict, heard, xp }
  const [totalXp, setTotalXp] = useState(0);
  const [busy, setBusy] = useState(false);
  const advanceRef = useRef(null);

  useEffect(() => () => clearTimeout(advanceRef.current), []);

  const item = items[index] || null;
  // Baris arti (prompt level Buta) & baris bacaan (romaji kana / arti kotoba / onyomi+kunyomi kanji).
  const artiText = item ? ((id ? (item.meaningId || item.meaning) : item.meaning) || '') : '';
  const readingText = item
    ? (item.kind === 'kanji' ? (item.readings || []).join('、') : (item.kind === 'kotoba' ? artiText : (item.meaning || '')))
    : '';
  // Mode Buta: kana pakai prompt audio (romaji = bacaan, menampilkannya bohong), lainnya arti.
  const promptKind = speakPromptKind(item, level);
  const audioPrompt = !lv.showText && promptKind === 'audio';

  const next = () => {
    clearTimeout(advanceRef.current);
    setResult(null);
    clearError();
    setIndex((i) => i + 1);
  };

  const handleListen = () => {
    if (item) playDramaticAudio(item.readings?.[0] || item.surface);
  };

  const handleSpeak = async () => {
    if (!item || busy || listening) return;
    setBusy(true);
    clearError();
    setResult(null);
    const heard = await listenOnce();
    setBusy(false);
    // Selalu tampilkan apa yang didengar engine (termasuk KOSONG) — supaya user
    // tahu bedanya "engine tak dengar" vs "engine dengar tapi skor kurang".
    if (!heard.length) {
      setResult({ verdict: 'retry', heard: '', empty: true, xp: 0 });
      return; // pesan error (kalau ada) tampil dari hook
    }

    const best = matchSpeech(heard, [item.surface, ...(item.readings || [])]);
    const verdict = verdictOf(best.score);
    if (verdict === 'retry') {
      setResult({ verdict, heard: best.heard, empty: false, xp: 0 });
      return;
    }
    const xp = speakXpFor(item, level);
    recordAnswer(item.id, true, xp, 'speaking');
    triggerEffect('correct');
    unlockAchievement?.('first_voice');
    setTotalXp((t) => t + xp);
    setResult({ verdict, heard: best.heard, xp });
    advanceRef.current = setTimeout(next, 1300);
  };

  if (!item) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-16 min-h-screen flex flex-col items-center justify-center text-center">
        <div className="mb-6 flex justify-center text-shu"><Glyph name="celebrate" size={64} strokeWidth={1.8} /></div>
        <h2 className="text-3xl sm:text-4xl font-serif font-black text-sumi mb-3">
          {id ? 'Sesi selesai!' : 'Session complete!'}
        </h2>
        <p className="text-sm font-bold text-sumi/60 mb-8">
          {id ? `Total XP dari sesi ini: +${totalXp}` : `Total XP this session: +${totalXp}`}
        </p>
        <button
          type="button"
          onClick={onExit}
          className="px-8 py-4 bg-ai text-kinari-light border-[3px] border-sumi font-black uppercase tracking-widest shadow-[4px_4px_0_0_#1a1a1a] active:translate-y-[2px] active:shadow-none transition-all"
        >
          {id ? 'Kembali' : 'Back'}
        </button>
      </div>
    );
  }

  const errText = error ? (ERROR_TEXT[error] || { id: 'Gagal merekam. Coba lagi.', en: 'Recording failed. Try again.' })[id ? 'id' : 'en'] : null;

  return (
    <div className={`max-w-2xl mx-auto px-4 sm:px-8 pt-14 sm:pt-16 ${listening ? 'pb-44' : 'pb-8 sm:pb-16'} min-h-screen flex flex-col`}>
      <MicOverlay open={listening} interim={interim} level={micLevel} onCancel={cancel} />
      <div className="flex items-center justify-between mb-8">
        <button
          type="button"
          onClick={onExit}
          className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/60 hover:text-shu transition-colors flex items-center gap-2 group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> {id ? 'Kembali' : 'Back'}
        </button>
        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-sumi/50">
          {index + 1} / {items.length} · +{totalXp} XP
        </span>
      </div>

      <motion.div
        key={index}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-grow flex flex-col items-center justify-center text-center"
      >
        {/* Ukuran font dihitung dari teks yang BENAR-BENAR tampil: mode Buta hanya
            menampilkan 🎧/？, jadi jangan pakai ukuran teks panjang yang tersembunyi. */}
        <div className={`font-serif font-black text-sumi leading-none mb-6 select-none text-center break-words ${SPEAK_TEXT_CLASS[speakTextSize(lv.showText ? item.display : '？')]}`}>
          {lv.showText ? item.display : (audioPrompt ? <Glyph name="headphones" size={48} /> : '？')}
        </div>
        {lv.showReading && readingText && (
          <p className="text-sm font-bold text-sumi/60 mb-2">{readingText}</p>
        )}
        {!lv.showText && audioPrompt && (
          <button
            type="button"
            onClick={handleListen}
            className="mb-3 flex items-center gap-2 px-4 py-2 bg-kinari border-[3px] border-sumi font-black text-[11px] uppercase tracking-widest shadow-[3px_3px_0_0_#1a1a1a] active:translate-y-[2px] active:shadow-none transition-all"
          >
            <Volume2 size={15} /> {id ? 'Putar & Tirukan' : 'Play & Repeat'}
          </button>
        )}
        {!lv.showText && !audioPrompt && (
          <p className="text-lg font-serif font-bold text-sumi mb-2">{artiText || '…'}</p>
        )}
        {item.sub && (
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sumi/40 mb-6">{item.sub}</span>
        )}

        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-6">
          <button
            type="button"
            onClick={handleListen}
            disabled={busy || listening}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3 bg-kinari border-[3px] border-sumi font-black text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest shadow-[3px_3px_0_0_#1a1a1a] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
          >
            <Volume2 size={16} /> {id ? 'Dengar' : 'Listen'}
          </button>
          {selfAssess ? (
            <button
              type="button"
              onClick={next}
              className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-3 bg-matcha text-kinari-light border-[3px] border-sumi font-black text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest shadow-[3px_3px_0_0_#1a1a1a] active:translate-y-[2px] active:shadow-none transition-all"
            >
              <Check size={16} /> {id ? 'Sudah Baca' : 'Read ✓'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSpeak}
              disabled={busy || listening}
              className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-3 border-[3px] border-sumi font-black text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest shadow-[3px_3px_0_0_#1a1a1a] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-60 ${
                listening ? 'bg-shu text-kinari-light animate-pulse' : 'bg-ai text-kinari-light'
              }`}
            >
              <Mic size={16} /> {listening ? (id ? 'Mendengar…' : 'Listening…') : (id ? 'Ucapkan' : 'Speak')}
            </button>
          )}
          <button
            type="button"
            onClick={next}
            disabled={busy || listening}
            aria-label={id ? 'Lewati' : 'Skip'}
            title={id ? 'Lewati' : 'Skip'}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3 bg-kinari border-[3px] border-sumi/30 text-sumi/60 font-black text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest active:translate-y-[2px] transition-all disabled:opacity-50"
          >
            <SkipForward size={16} /> <span className="hidden sm:inline">{id ? 'Lewati' : 'Skip'}</span>
          </button>
        </div>

        {result && (
          <div
            className={`mt-6 px-5 py-3 border-[3px] border-sumi text-sm font-bold ${
              result.verdict === 'retry' ? 'bg-kinari text-shu' : 'bg-matcha text-kinari-light'
            }`}
          >
            {result.verdict === 'great' && (id ? `Sempurna! +${result.xp} XP` : `Perfect! +${result.xp} XP`)}
            {result.verdict === 'pass' && (id ? `Bagus! +${result.xp} XP` : `Nice! +${result.xp} XP`)}
            {result.verdict === 'retry' && !result.empty && (id ? 'Belum pas — coba lagi.' : 'Not quite — try again.')}
            {result.verdict === 'retry' && result.empty && (id
              ? 'Engine TIDAK mendengar apa pun — coba dekatkan mic & ucap lebih panjang/keras.'
              : 'Engine heard NOTHING — move closer to the mic and speak longer/louder.')}
            {result.empty && (
              <span className="block text-[11px] font-bold opacity-70 mt-1">
                {id ? 'Terdengar: (kosong) · target: ' : 'Heard: (empty) · target: '}{item.surface}
              </span>
            )}
            {result.heard && (
              <span className="block text-[11px] font-bold opacity-70 mt-1">
                {id ? 'Terdengar: ' : 'Heard: '}{result.heard} · {id ? 'target: ' : 'target: '}{item.surface}
              </span>
            )}
          </div>
        )}

        {errText && (
          <div className="mt-6 px-5 py-3 border-[3px] border-dashed border-shu/50 text-shu text-xs font-bold">
            {errText}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default SpeakSession;
