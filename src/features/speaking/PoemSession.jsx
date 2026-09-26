import React, { useEffect, useRef, useState } from 'react';
import { Volume2, Mic, Check } from 'lucide-react';
import { Furigana } from './Furigana';
import { useSpeechRecognition } from './useSpeechRecognition';
import { matchSpeech, verdictOf } from './speechMatch';
import { lineReading, poemLineItems, speakXpFor, lineXpFor, DEFAULT_SPEAK_LEVEL } from './speaking';
import { useItemProgress, useAchievements, useUserStats } from '../progress/ProgressContext';
import { useEffectLayer } from '../effects/EffectContext';
import { useLanguage } from '../../context/LanguageContext';
import { playDramaticAudio } from '../../utils/audio';

export function PoemSession({ poem, level = DEFAULT_SPEAK_LEVEL, onExit }) {
  const { language } = useLanguage();
  const id = language === 'id';
  const { recordAnswer, itemProgress } = useItemProgress();
  const { unlockAchievement } = useAchievements();
  const { addXp } = useUserStats();
  const { triggerEffect } = useEffectLayer();
  const { listenOnce, listening, error, clearError, supported } = useSpeechRecognition();
  const selfAssess = !supported;   // mode mandiri: tanpa penilaian, tanpa XP, tanpa SRS

  const lines = poem?.lines || [];
  const [passed, setPassed] = useState({});     // { [lineIndex]: true }
  const [active, setActive] = useState(0);
  const [showFurigana, setShowFurigana] = useState(true);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [lineXp, setLineXp] = useState(0);      // total XP baris pada sesi ini
  const awardedRef = useRef(false);             // guard StrictMode double-effect

  const allPassed = lines.length > 0 && lines.every((_, i) => passed[i]);

  // Selesai semua baris → efek + achievement; SRS & XP puisi SEKALI (bukan mode mandiri).
  useEffect(() => {
    if (!allPassed || awardedRef.current) return;
    awardedRef.current = true;
    triggerEffect('correct');
    if (selfAssess) return;   // mode mandiri: tanpa penilaian, tanpa XP, tanpa SRS
    unlockAchievement?.('first_voice');
    recordAnswer(poem.id, true, speakXpFor({ kind: 'poem' }, level));
  }, [allPassed, selfAssess, poem?.id, level, recordAnswer, triggerEffect, unlockAchievement]);

  // Badge pembaca puisi: 3 puisi berbeda dengan correctCount >= 1.
  useEffect(() => {
    const count = Object.entries(itemProgress || {})
      .filter(([k, v]) => k.startsWith('poem_') && (v?.correctCount || 0) >= 1).length;
    if (count >= 3) unlockAchievement?.('poem_reciter');
  }, [itemProgress, unlockAchievement]);

  const markPassed = (i) => {
    setPassed((p) => ({ ...p, [i]: true }));
    const nextUnpassed = lines.findIndex((_, idx) => idx > i && !passed[idx] && idx !== i);
    if (nextUnpassed >= 0) setActive(nextUnpassed);
  };

  const speakLine = async (i) => {
    if (selfAssess) { markPassed(i); return; }   // mode mandiri: tandai dibaca, tanpa nilai/XP
    const item = poemLineItems(poem)[i];
    if (!item || busy || listening) return;
    setBusy(true);
    clearError();
    setResult(null);
    const heard = await listenOnce();
    setBusy(false);
    if (!heard.length) return;
    const best = matchSpeech(heard, [item.surface, ...item.readings]);
    const verdict = verdictOf(best.score);
    if (verdict === 'retry') {
      setResult({ line: i, verdict, heard: best.heard });
      return;
    }
    const xp = lineXpFor(level);
    addXp(xp);                      // XP per baris (tanpa SRS)
    setLineXp((t) => t + xp);
    markPassed(i);
    setResult({ line: i, verdict, heard: best.heard, xp });
  };

  if (!poem) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 py-8 sm:py-16 min-h-screen flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={onExit}
          className="text-[11px] font-black uppercase tracking-[0.2em] text-sumi/60 hover:text-shu transition-colors"
        >
          ← {id ? 'Kembali' : 'Back'}
        </button>
        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-sumi/60 cursor-pointer select-none">
          <input type="checkbox" checked={showFurigana} onChange={(e) => setShowFurigana(e.target.checked)} />
          ふりがな
        </label>
      </div>

      <header className="mb-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-serif font-black text-sumi">
          <Furigana segments={lines[0]?.segments} show={showFurigana} />
        </h2>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sumi/50 mt-2">
          {poem.author} {poem.excerpt ? (id ? '· kutipan' : '· excerpt') : ''}
        </p>
      </header>

      <div className="flex flex-col gap-3 mb-8">
        {lines.map((line, i) => (
          <div
            key={i}
            className={`border-[3px] border-sumi p-4 flex items-center gap-3 transition-colors ${
              passed[i] ? 'bg-matcha/15 border-matcha' : active === i ? 'bg-kinari shadow-[4px_4px_0_0_#1a1a1a]' : 'bg-kinari/60'
            }`}
          >
            <span className="text-2xl sm:text-3xl font-serif font-black text-sumi flex-grow leading-relaxed">
              <Furigana segments={line.segments} show={showFurigana} />
            </span>
            <button
              type="button"
              onClick={() => playDramaticAudio(lineReading(line))}
              className="shrink-0 w-9 h-9 border-[2px] border-sumi flex items-center justify-center active:translate-y-[2px] transition-all"
              title={id ? 'Dengar' : 'Listen'}
            >
              <Volume2 size={15} />
            </button>
            <button
              type="button"
              onClick={() => speakLine(i)}
              disabled={busy || listening}
              className={`shrink-0 w-9 h-9 border-[2px] border-sumi flex items-center justify-center transition-all disabled:opacity-50 ${
                passed[i] ? 'bg-matcha text-kinari-light' : 'bg-ai text-kinari-light active:translate-y-[2px]'
              }`}
              title={selfAssess ? (id ? 'Tandai sudah dibaca' : 'Mark as read') : (id ? 'Ucapkan baris ini' : 'Speak this line')}
            >
              {passed[i] ? '✓' : (selfAssess ? <Check size={15} /> : <Mic size={15} />)}
            </button>
          </div>
        ))}
      </div>

      {result && (
        <div
          className={`px-5 py-3 border-[3px] border-sumi text-sm font-bold mb-6 ${
            result.verdict === 'retry' ? 'bg-kinari text-shu' : 'bg-matcha text-kinari-light'
          }`}
        >
          {result.verdict === 'retry'
            ? (id ? `Baris ${result.line + 1} belum pas — coba lagi.` : `Line ${result.line + 1} not quite — try again.`)
            : (id ? `Baris ${result.line + 1} ✓ +${result.xp} XP` : `Line ${result.line + 1} ✓ +${result.xp} XP`)}
          {result.heard && (
            <span className="block text-[11px] font-bold opacity-70 mt-1">
              {id ? 'Terdengar: ' : 'Heard: '}{result.heard}
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="px-5 py-3 border-[3px] border-dashed border-shu/50 text-shu text-xs font-bold mb-6">
          {error === 'not-supported'
            ? (id ? 'Browser ini tidak mendukung pengenalan suara.' : 'This browser does not support speech recognition.')
            : (id ? 'Gagal merekam. Coba lagi.' : 'Recording failed. Try again.')}
        </div>
      )}

      {allPassed && (
        <div className="mt-auto text-center border-[3px] border-sumi bg-matcha/15 p-6">
          <p className="text-lg font-serif font-black text-sumi mb-1">
            {id ? 'Puisi selesai! 🎉' : 'Poem complete! 🎉'}
          </p>
          <p className="text-xs font-bold text-sumi/60 mb-4">
            {selfAssess
              ? (id ? 'Mode mandiri — tanpa XP' : 'Self-assess — no XP')
              : (id
                ? `+${speakXpFor({ kind: 'poem' }, level)} XP puisi · +${lineXp} XP dari baris`
                : `+${speakXpFor({ kind: 'poem' }, level)} XP poem · +${lineXp} XP from lines`)}
          </p>
          <p className="text-xs font-bold text-sumi/70 mb-4">{id ? poem.meaning_id : poem.meaning}</p>
          <button
            type="button"
            onClick={onExit}
            className="px-6 py-3 bg-ai text-kinari-light border-[3px] border-sumi font-black text-xs uppercase tracking-widest shadow-[3px_3px_0_0_#1a1a1a] active:translate-y-[2px] active:shadow-none transition-all"
          >
            {id ? 'Kembali' : 'Back'}
          </button>
        </div>
      )}
    </div>
  );
}

export default PoemSession;
