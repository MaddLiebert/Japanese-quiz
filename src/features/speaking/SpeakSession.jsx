import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Volume2, Mic, SkipForward, Check } from 'lucide-react';
import { useSpeechRecognition } from './useSpeechRecognition';
import { MicOverlay } from './MicOverlay';
import { matchSpeech, verdictOf } from './speechMatch';
import { speakXpFor, speakLevel, speakPromptKind, DEFAULT_SPEAK_LEVEL } from './speaking';
import { useItemProgress, useAchievements } from '../progress/ProgressContext';
import { useEffectLayer } from '../effects/EffectContext';
import { useLanguage } from '../../context/LanguageContext';
import { playDramaticAudio } from '../../utils/audio';

const ERROR_TEXT = {
  'not-supported': { id: 'Browser ini tidak mendukung pengenalan suara.', en: 'This browser does not support speech recognition.' },
  'not-allowed': { id: 'Izin mikrofon ditolak. Aktifkan lewat pengaturan browser.', en: 'Microphone permission denied. Enable it in browser settings.' },
  'no-speech': { id: 'Tidak terdengar suara — coba lagi lebih dekat ke mikrofon.', en: 'No speech detected — try again closer to the mic.' },
  'audio-capture': { id: 'Mikrofon tidak ditemukan.', en: 'No microphone found.' },
  network: { id: 'Pengenalan suara butuh koneksi internet.', en: 'Speech recognition needs an internet connection.' },
};

export function SpeakSession({ items = [], startIndex = 0, level = DEFAULT_SPEAK_LEVEL, onExit }) {
  const { language } = useLanguage();
  const id = language === 'id';
  const { recordAnswer } = useItemProgress();
  const { unlockAchievement } = useAchievements();
  const { triggerEffect } = useEffectLayer();
  const { listenOnce, listening, interim, error, clearError, cancel, supported } = useSpeechRecognition();
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
    if (!heard.length) return; // pesan error tampil dari hook

    const best = matchSpeech(heard, [item.surface, ...(item.readings || [])]);
    const verdict = verdictOf(best.score);
    if (verdict === 'retry') {
      setResult({ verdict, heard: best.heard, xp: 0 });
      return;
    }
    const xp = speakXpFor(item, level);
    recordAnswer(item.id, true, xp);
    triggerEffect('correct');
    unlockAchievement?.('first_voice');
    setTotalXp((t) => t + xp);
    setResult({ verdict, heard: best.heard, xp });
    advanceRef.current = setTimeout(next, 1300);
  };

  if (!item) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-16 min-h-screen flex flex-col items-center justify-center text-center">
        <div className="text-6xl mb-6">🎉</div>
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
      <MicOverlay open={listening} interim={interim} onCancel={cancel} />
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
        <div className="text-[80px] sm:text-[120px] font-serif font-black text-sumi leading-none mb-6 select-none">
          {lv.showText ? item.display : (audioPrompt ? '🎧' : '？')}
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

        <div className="flex items-center gap-3 mt-6">
          <button
            type="button"
            onClick={handleListen}
            disabled={busy || listening}
            className="flex items-center gap-2 px-5 py-3 bg-kinari border-[3px] border-sumi font-black text-xs uppercase tracking-widest shadow-[3px_3px_0_0_#1a1a1a] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
          >
            <Volume2 size={16} /> {id ? 'Dengar' : 'Listen'}
          </button>
          {selfAssess ? (
            <button
              type="button"
              onClick={next}
              className="flex items-center gap-2 px-6 py-3 bg-matcha text-kinari-light border-[3px] border-sumi font-black text-xs uppercase tracking-widest shadow-[3px_3px_0_0_#1a1a1a] active:translate-y-[2px] active:shadow-none transition-all"
            >
              <Check size={16} /> {id ? 'Sudah Baca' : 'Read ✓'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSpeak}
              disabled={busy || listening}
              className={`flex items-center gap-2 px-6 py-3 border-[3px] border-sumi font-black text-xs uppercase tracking-widest shadow-[3px_3px_0_0_#1a1a1a] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-60 ${
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
            className="flex items-center gap-2 px-5 py-3 bg-kinari border-[3px] border-sumi/30 text-sumi/60 font-black text-xs uppercase tracking-widest active:translate-y-[2px] transition-all disabled:opacity-50"
          >
            <SkipForward size={16} /> {id ? 'Lewati' : 'Skip'}
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
            {result.verdict === 'retry' && (id ? 'Belum pas — coba lagi.' : 'Not quite — try again.')}
            {result.heard && (
              <span className="block text-[11px] font-bold opacity-70 mt-1">
                {id ? 'Terdengar: ' : 'Heard: '}{result.heard}
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
