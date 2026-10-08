// MeijiCompanion — lapisan tipis React di atas modul murni Meiji.
// Menggabungkan efek "hidup" era Meiji yang HANYA aktif saat data-era="meiji":
//   • M12 jejak Nacht/Saku — catatan 1×/sesi dari timestamp nyata
//   • M10 号外 — edisi larut malam (00–04) dari progress nyata
//   • M9  GLITCH — kedip cyberpunk, frekuensi naik dgn level
//   • M15 napas — gradien bergerak sangat lambat saat idle
// Semua bisa dimatikan (Pengaturan) & hormati prefers-reduced-motion.
// Tidak pernah memblokir belajar. Spec: docs/tema/meiji-mekanik.md §M9/M10/M12/M15.
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useEra } from '../theme/EraContext';
import { useUserStats } from '../progress/ProgressContext';
import { useLanguage } from '../../context/LanguageContext';
import { companionStats, pickFootprint, markSeen } from '../companion/footprints';
import { glitchChance, glitchAllowed, shouldGlitch } from '../glitch/glitch';
import { isGogoWindow, gogoHeadline, canShowGogo, GOGO_KEY } from '../news/gogo';
import { breathPhase } from '../companion/breathing';
import { readMeijiSettings } from '../meiji/meijiSettings';
import { TELEGRAMS, renderTelegram } from '../telegram/telegram';
import { QUESTIONS, rememberAnswer, quoteAnswer, hasAnswer, COMPANION_KEY } from '../companion/questions';

const reduceMotion = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const todayStr = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export function MeijiCompanion() {
  const { era } = useEra();
  const { progress } = useUserStats();
  const { language } = useLanguage();
  const id = language === 'id';
  const isMeiji = era === 'meiji';

  const settings = useMemo(() => readMeijiSettings(), []);
  const [footprint, setFootprint] = useState(null);
  const [gogo, setGogo] = useState(null);
  const [glitch, setGlitch] = useState(false);
  const [breath, setBreath] = useState(0);
  const idleRef = useRef(false);
  const seenRef = useRef([]);
  const footprintDoneRef = useRef(false);
  const telegramDoneRef = useRef(false);
  const [telegram, setTelegram] = useState(null);
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [quote, setQuote] = useState(null);

  // ── M12 jejak — maks 1×/sesi, dari data nyata ────────────────────────────
  useEffect(() => {
    if (!isMeiji || footprintDoneRef.current) return;
    const stats = companionStats(progress, { hour: new Date().getHours(), todayStr: todayStr() });
    const fp = pickFootprint(stats, seenRef.current);
    if (fp) {
      seenRef.current = markSeen(seenRef.current, fp.id);
      footprintDoneRef.current = true; // benar-benar 1×/sesi (bukan tiap progress berubah)
      const t = setTimeout(() => setFootprint(fp), 2600); // beri ruang setelah mount
      return () => clearTimeout(t);
    }
  }, [isMeiji, progress]);

  // Auto-tutup jejak.
  useEffect(() => {
    if (!footprint) return undefined;
    const t = setTimeout(() => setFootprint(null), 9000);
    return () => clearTimeout(t);
  }, [footprint]);

  // ── M10 号外 — larut malam, maks 1×/hari ─────────────────────────────────
  useEffect(() => {
    if (!isMeiji || !settings.gogo) return;
    const hour = new Date().getHours();
    if (!isGogoWindow(hour)) return;
    let last = null;
    try { last = localStorage.getItem(GOGO_KEY); } catch { /* diblokir */ }
    if (!canShowGogo(last, todayStr())) return;
    setGogo(gogoHeadline({
      daysActive: progress.daysActive,
      kanjiMastered: progress.totalCorrect, // proksi; label dibuat netral
      streak: progress.streak,
    }, language));
    try { localStorage.setItem(GOGO_KEY, todayStr()); } catch { /* diblokir */ }
  }, [isMeiji, settings.gogo, progress, language]);

  // ── M9 GLITCH — kedip sesekali, frekuensi naik dgn level ────────────────
  useEffect(() => {
    if (!isMeiji || !settings.glitch) return undefined;
    if (!glitchAllowed({ reducedMotion: reduceMotion(), enabled: true })) return undefined;
    const chance = glitchChance(progress.level || 1);
    if (chance <= 0) return undefined;
    const iv = setInterval(() => {
      if (shouldGlitch(progress.level || 1, Math.random())) {
        setGlitch(true);
        setTimeout(() => setGlitch(false), 140);
      }
    }, 22000);
    return () => clearInterval(iv);
  }, [isMeiji, settings.glitch, progress.level]);

  // ── M15 napas — gradien bergerak saat idle ──────────────────────────────
  useEffect(() => {
    if (!isMeiji || !settings.breathing) return undefined;
    if (reduceMotion()) return undefined;
    let raf = 0;
    const start = performance.now();
    const loop = (now) => {
      if (!idleRef.current) setBreath(breathPhase(now - start));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const onMove = () => { idleRef.current = true; setBreath(0); };
    window.addEventListener('pointerdown', onMove, { once: true });
    return () => { cancelAnimationFrame(raf); window.removeEventListener('pointerdown', onMove); };
  }, [isMeiji, settings.breathing]);

  // ── M13 電信 — ketukan telegraf sesekali (maks 1×/sesi) ─────────────────
  useEffect(() => {
    if (!isMeiji || telegramDoneRef.current) return undefined;
    telegramDoneRef.current = true;
    const t = setTimeout(() => {
      const cut = TELEGRAMS.find((x) => x.cut);
      const plain = TELEGRAMS.find((x) => x.id === 'welcome');
      // 1 dari 3 kali kabel "putus" → pesan terpotong (misteri).
      const item = Math.random() < 0.34 ? cut : plain;
      setTelegram({ jp: renderTelegram(item, 6), id_text: item.id_text, cut: Boolean(item.cut) });
    }, 5200);
    return () => clearTimeout(t);
  }, [isMeiji]);

  useEffect(() => {
    if (!telegram) return undefined;
    const t = setTimeout(() => setTelegram(null), 6500);
    return () => clearTimeout(t);
  }, [telegram]);

  // ── M15 bertanya balik — di momen tenang; jawaban diingat lintas-era ─────
  useEffect(() => {
    if (!isMeiji || question) return undefined;
    // Hanya sekali seumur (kalau belum pernah menjawab) — agar tak mengganggu.
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(COMPANION_KEY) || '{}') || {}; } catch { saved = {}; }
    const q = QUESTIONS[0];
    if (hasAnswer(saved, q.id)) {
      // Sudah pernah dijawab → kutip kembali (momen paling kuat).
      const t = setTimeout(() => setQuote(quoteAnswer(saved, q.id)), 9000);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setQuestion(q), 11000);
    return () => clearTimeout(t);
  }, [isMeiji, question]);

  // Auto-tutup kutipan balik (konsisten dengan jejak/telegraf).
  useEffect(() => {
    if (!quote) return undefined;
    const t = setTimeout(() => setQuote(null), 9000);
    return () => clearTimeout(t);
  }, [quote]);

  const submitAnswer = () => {
    if (!question) return;
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(COMPANION_KEY) || '{}') || {}; } catch { saved = {}; }
    const next = rememberAnswer(saved, question.id, answer.trim());
    try { localStorage.setItem(COMPANION_KEY, JSON.stringify(next)); } catch { /* diblokir */ }
    setQuestion(null);
    setAnswer('');
  };

  if (!isMeiji) return null;

  return (
    <>
      {/* M15 napas — halo gaslight sangat halus di tepi atas (dekoratif) */}
      {settings.breathing && breath > 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            background: `radial-gradient(60% 40% at 50% 0%, rgba(217,164,65,${(0.05 * breath).toFixed(3)}) 0%, transparent 70%)`,
          }}
        />
      )}

      {/* M9 GLITCH — kilatan cyberpunk 1 frame (dekoratif) */}
      <AnimatePresence>
        {glitch && (
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08 }}
            className="pointer-events-none fixed inset-0 z-[60] mix-blend-screen"
            style={{
              background:
                'repeating-linear-gradient(0deg, rgba(0,255,214,0.10) 0 2px, transparent 2px 4px),' +
                'repeating-linear-gradient(90deg, rgba(255,0,120,0.08) 0 2px, transparent 2px 6px)',
            }}
          />
        )}
      </AnimatePresence>

      {/* M12 jejak Nacht/Saku — kartu catatan kecil, 1×/sesi */}
      <AnimatePresence>
        {footprint && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.28 }}
            className="fixed bottom-4 left-4 z-[70] max-w-xs border-[2px] border-sumi bg-kinari-light p-4"
            style={{ borderRadius: 0, boxShadow: 'none' }}
            role="status"
          >
            <div className="mb-1 flex items-center gap-2">
              <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-renga">佐久 · Saku</span>
            </div>
            <p className="font-serif text-sm text-sumi">{footprint.jp}</p>
            <p className="mt-1 font-sans text-xs text-sumi/70">{id ? footprint.id_text : footprint.id_text}</p>
            <button
              type="button"
              onClick={() => setFootprint(null)}
              className="mt-2 font-sans text-[10px] font-bold uppercase tracking-widest text-sumi/50 hover:text-shu"
            >
              {id ? 'Tutup' : 'Close'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* M10 号外 — spanduk edisi larut malam */}
      <AnimatePresence>
        {gogo && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed top-0 left-0 right-0 z-[65] border-b-[3px] border-double border-sumi bg-[var(--backdrop-val)] px-4 py-2"
            role="status"
          >
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
              <span className="font-serif text-sm font-black tracking-[0.3em] text-sumi">号外</span>
              <span className="flex-1 truncate font-sans text-xs font-semibold text-sumi/75">{gogo}</span>
              <button
                type="button"
                onClick={() => setGogo(null)}
                className="font-sans text-[10px] font-bold uppercase tracking-widest text-sumi/50 hover:text-shu"
              >
                {id ? 'Tutup' : 'Close'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* M13 電信 — kertas telegraf kecil (tit-tit), kadang terpotong */}
      <AnimatePresence>
        {telegram && (
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            className="fixed right-4 bottom-4 z-[70] max-w-[16rem] border-[2px] border-sumi bg-kinari-light p-3"
            style={{ borderRadius: 0, boxShadow: 'none' }}
            role="status"
          >
            <p className="mb-1 font-sans text-[9px] font-bold uppercase tracking-[0.3em] text-kin-ink">電信</p>
            <p className="font-mono text-sm tracking-widest text-sumi">{telegram.jp}</p>
            <p className="mt-1 font-sans text-[0.65rem] text-sumi/55">{id ? telegram.id_text : telegram.id_text}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* M15 bertanya balik — di momen tenang; jawaban diingat lintas-era */}
      <AnimatePresence>
        {question && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed inset-x-0 bottom-6 z-[75] mx-auto w-[min(92vw,26rem)] border-[2px] border-sumi bg-kinari-light p-4"
            style={{ borderRadius: 0, boxShadow: 'none' }}
          >
            <p className="font-serif text-sm font-bold text-sumi">{question.jp}</p>
            <p className="mt-1 font-sans text-xs text-sumi/65">{id ? question.id_text : question.id_text}</p>
            <div className="mt-3 flex gap-2">
              <input
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submitAnswer(); }}
                placeholder={id ? 'jawabanmu…' : 'your answer…'}
                className="flex-1 border-[2px] border-sumi bg-kinari-light px-2 py-1.5 font-sans text-xs text-sumi outline-none"
                style={{ borderRadius: 0 }}
              />
              <button
                type="button"
                onClick={submitAnswer}
                className="border-[2px] border-sumi bg-sumi px-3 py-1.5 font-sans text-[10px] font-bold uppercase tracking-widest text-kinari-light"
                style={{ borderRadius: 0 }}
              >
                {id ? 'Kirim' : 'Send'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* M15 kutip balik — jawaban lama muncul kembali (era lain) */}
      <AnimatePresence>
        {quote && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed inset-x-0 bottom-6 z-[75] mx-auto w-[min(92vw,24rem)] border-l-[3px] border-renga bg-kinari-light/95 px-4 py-3"
            style={{ borderRadius: 0 }}
            role="status"
          >
            <p className="font-sans text-[9px] font-bold uppercase tracking-[0.3em] text-renga">
              {id ? 'Kamu pernah bilang' : 'You once said'}
            </p>
            <p className="mt-1 font-serif text-sm italic text-sumi">{quote}</p>
            <button
              type="button"
              onClick={() => setQuote(null)}
              className="mt-2 font-sans text-[10px] font-bold uppercase tracking-widest text-sumi/50 hover:text-shu"
            >
              {id ? 'Tutup' : 'Close'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default MeijiCompanion;
