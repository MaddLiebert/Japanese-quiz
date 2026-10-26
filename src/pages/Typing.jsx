import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Volume2 } from 'lucide-react';
import { EraPaper } from '../components/EraPaper';
import { Button } from '../components/ui/Button';
import { useLanguage } from '../context/LanguageContext';
import { useItemProgress, useAchievements } from '../features/progress/ProgressContext';
import { useEffectLayer } from '../features/effects/EffectContext';
import { playDramaticAudio } from '../utils/audio';
import hiraganaData from '../data/hiragana.json';
import katakanaData from '../data/katakana.json';
import kotobaData from '../data/kotoba.json';
import kanjiData from '../data/kanji.json';
import { checkAnswer, buildTypingQuestion, promptTextSize, typingKind } from '../features/typing/typing';

// ── Sumber soal: alfabet = kana+kotoba; jepang = +kanji (bacaan kana).
const QUESTION_SOURCE = {
  alfabet: [...hiraganaData, ...katakanaData, ...kotobaData],
  jepang: [...hiraganaData, ...katakanaData, ...kotobaData, ...kanjiData],
};

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const MODES = [
  { key: 'alfabet', label: 'Alfabet', jp: 'ローマ字', desc: 'Ketik romaji' },
  { key: 'jepang', label: 'Jepang', jp: 'かな·漢字', desc: 'Ketik kana/kanji' },
];

export function Typing() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const id = language === 'id';
  const { recordAnswer } = useItemProgress();
  const { unlockAchievement } = useAchievements();
  const { triggerEffect } = useEffectLayer();

  const [mode, setMode] = useState('alfabet');
  const [count, setCount] = useState(10);
  const [direction, setDirection] = useState('read');
  const [started, setStarted] = useState(false);
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [composing, setComposing] = useState(false);
  const [status, setStatus] = useState(null);   // { ok, xp } setelah jawab
  const [score, setScore] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [showKbNotice, setShowKbNotice] = useState(false);
  const inputRef = useRef(null);
  const doneRef = useRef(false);

  const item = items[index] || null;
  const q = item ? buildTypingQuestion(item, direction, language, mode) : null;

  const selectPool = (nextMode, nextDir) => {
    const pool = QUESTION_SOURCE[nextMode].filter(
      (it) => it.type !== 'grammar' && it.char && it.romaji,
    );
    setItems(shuffle(pool).slice(0, count));
    setIndex(0);
    setScore(0);
    setTotalXp(0);
    setStatus(null);
    setInput('');
    setDirection(nextDir);
    setMode(nextMode);
    if (nextMode === 'jepang' && !started) setShowKbNotice(true);
  };

  const startQuiz = () => {
    if (items.length === 0) selectPool(mode, direction);
    setStarted(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const submit = () => {
    if (status || !item) return;
    const inp = input.trim();
    if (inp.length === 0) return;
    const ok = checkAnswer(item, inp, mode);
    const xp = ok ? (item.type === 'kanji' ? 25 : 15) : 0;
    recordAnswer(item.id, ok, xp, mode === 'jepang' ? 'typing_jp' : 'typing');
    if (ok) { triggerEffect('correct'); setScore((s) => s + 1); setTotalXp((t) => t + xp); }
    else triggerEffect('wrong');
    setStatus({ ok, xp });
    if (ok && index === 0) unlockAchievement?.('first_typing');
    setInput('');
  };

  const next = () => {
    if (index + 1 >= items.length) {
      doneRef.current = true;
      setStarted(false);
      return;
    }
    setStatus(null);
    setIndex((i) => i + 1);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const exit = () => { if (!doneRef.current) navigate(-1); else navigate('/'); };
  const play = () => item && playDramaticAudio(item.char);

  if (!started) {
    return (
      <div className="relative max-w-4xl mx-auto px-4 sm:px-8 py-12 sm:py-16 min-h-screen">
        <EraPaper />
        <button onClick={exit} className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/60 hover:text-shu transition-colors flex items-center gap-2 mb-6 group w-fit">
          <span className="group-hover:-translate-x-1 transition-transform">←</span> {id ? 'Kembali' : 'Back'}
        </button>
        <header className="mb-12 sm:mb-16 border-b-[4px] border-sumi pb-6 sm:pb-8 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-seigaiha opacity-10 pointer-events-none translate-x-1/4 -translate-y-1/4" />
          <h1 className="text-4xl sm:text-6xl font-serif font-black text-sumi tracking-tighter relative z-10">
            打 {id ? 'Kuis Ketik' : 'Typing'} <span className="text-ai">{id ? 'Latihan' : 'Quiz'}</span>
          </h1>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-sumi/60 mt-3 relative z-10">
            {id ? 'Ketik jawaban pakai keyboard — mode Alfabet & Jepang' : 'Type answers with your keyboard — Alphabet & Japanese modes'}
          </p>
        </header>

        <div className="space-y-10">
          {/* Mode */}
          <section>
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-2xl font-serif font-bold text-sumi">{id ? 'Mode Ketik' : 'Typing Mode'}</h2>
              <div className="h-[2px] flex-1 bg-sumi/10" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {MODES.map((m) => (
                <motion.div
                  key={m.key}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => { setMode(m.key); setStarted(false); setItems([]); }}
                  className={`cursor-pointer p-6 border-[3px] border-sumi shadow-[5px_5px_0_0_#1a1a1a] transition-all ${
                    mode === m.key ? 'bg-ai text-kinari-light' : 'bg-kinari text-sumi hover:bg-kinari-light'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-serif font-black">{m.label}</span>
                    <span className={`text-sm font-serif font-black ${mode === m.key ? 'text-kinari-light/80' : 'text-sumi/40'}`}>{m.jp}</span>
                  </div>
                  <p className={`text-[10px] uppercase tracking-[0.15em] font-bold ${mode === m.key ? 'text-kinari-light/70' : 'text-sumi/50'}`}>{m.desc}</p>
                  {m.key === 'jepang' && (
                    <p className={`mt-3 text-[9px] uppercase tracking-wider font-bold ${mode === m.key ? 'text-kinari-light/60' : 'text-shu/70'}`}>
                      {id ? '⚠ butuh keyboard Jepang (IME)' : '⚠ requires Japanese keyboard (IME)'}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </section>

          {/* Count */}
          <section>
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-2xl font-serif font-bold text-sumi">{id ? 'Jumlah Soal' : 'Questions'}</h2>
              <div className="h-[2px] flex-1 bg-sumi/10" />
            </div>
            <div className="flex flex-wrap gap-3">
              {[5, 10, 20, 50].map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`px-5 py-3 border-[3px] border-sumi text-sm font-black tracking-widest transition-all ${
                    count === n ? 'bg-sumi text-kinari-light' : 'bg-kinari text-sumi/60 hover:bg-kinari-light'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </section>

          {/* Arah */}
          <section>
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-2xl font-serif font-bold text-sumi">{id ? 'Arah Soal' : 'Question Direction'}</h2>
              <div className="h-[2px] flex-1 bg-sumi/10" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'read', label: id ? 'Baca' : 'Read', desc: id ? 'Lihat kana → ketik romaji/arti' : 'See kana → type romaji/meaning' },
                { key: 'write', label: id ? 'Tulis' : 'Write', desc: id ? 'Lihat arti → ketik kana' : 'See meaning → type kana' },
              ].map((d) => (
                <button
                  key={d.key}
                  onClick={() => setDirection(d.key)}
                  className={`p-4 text-left border-[3px] border-sumi transition-all ${
                    direction === d.key ? 'bg-sumi text-kinari-light shadow-[3px_3px_0_0_#1a1a1a]' : 'bg-kinari text-sumi/70 hover:bg-kinari-light'
                  }`}
                >
                  <div className="text-sm font-black uppercase tracking-widest">{id ? (d.key === 'read' ? 'Baca ↓' : 'Tulis ↓') : d.label}</div>
                  <div className={`text-[10px] font-bold mt-1 ${direction === d.key ? 'text-kinari-light/70' : 'text-sumi/50'}`}>{d.desc}</div>
                </button>
              ))}
            </div>
          </section>

          <Button
            onClick={startQuiz}
            className="w-full !bg-shu !text-kinari-light border-[4px] border-sumi uppercase tracking-[0.3em] font-black shadow-[8px_8px_0_0_#1a1a1a] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[5px_5px_0_0_#1a1a1a] transition-all rounded-none py-6 text-xl"
          >
            {id ? 'Mulai Ketik' : 'Start Typing'} →
          </Button>
        </div>
      </div>
    );
  }

  // ── View sesi berjalan: prompt + input + status ────────────────────────────
  return (
    <div className="relative max-w-2xl mx-auto px-4 sm:px-8 py-10 sm:py-14 min-h-screen flex flex-col">
      <EraPaper />

      {/* Notif ganti keyboard (mode Jepang, sekali mulai) */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: showKbNotice ? 1 : 0, y: showKbNotice ? 0 : -8 }}
        className={`fixed inset-x-0 top-0 z-40 ${showKbNotice ? 'pointer-events-auto' : 'pointer-events-none'}`}
      >
        <div className="mx-auto max-w-2xl px-4 pt-4">
          <div className="bg-sumi text-kinari-light border-[3px] border-sumi shadow-[6px_6px_0_0_rgba(211,56,47,0.5)] p-4 flex items-start gap-3">
            <span className="text-lg font-serif font-black text-shu" aria-hidden>鍵</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black uppercase tracking-widest mb-1 text-shu">
                {id ? 'Ganti Keyboard' : 'Switch Keyboard'}
              </p>
              <p className="text-[11px] leading-relaxed text-kinari-light/90">
                {id
                  ? 'Aktifkan keyboard Jepang di HP/browser kamu — ketik あ lewat IME. Tombol ⚙ / 🌐 di keyboard sering dipakai untuk ganti.'
                  : 'Enable the Japanese keyboard on your phone/browser — type あ with IME. Use the ⚙ / 🌐 key on your keyboard to switch.'}
              </p>
            </div>
            <button
              onClick={() => setShowKbNotice(false)}
              className="shrink-0 px-3 py-1.5 border-2 border-kinari-light/40 text-[10px] font-black uppercase tracking-wider hover:bg-kinari-light hover:text-sumi transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      </motion.div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={exit}
          className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/60 hover:text-shu transition-colors flex items-center gap-2 group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> {id ? 'Keluar' : 'Exit'}
        </button>
        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-sumi/50">
          {index + 1} / {items.length} · {id ? 'Benar' : 'Correct'}: {score} · +{totalXp} XP
        </span>
      </div>

      {!item ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <h2 className="text-3xl sm:text-4xl font-serif font-black text-sumi mb-4">
            {id ? 'Selesai!' : 'Complete!'}
          </h2>
          <p className="text-sm font-bold text-sumi/60 mb-8">
            {id ? `Skor ${score}/${count} · +${totalXp} XP` : `Score ${score}/${count} · +${totalXp} XP`}
          </p>
          <div className="flex gap-4">
            <Button
              onClick={() => { doneRef.current = false; setCount((c) => c); selectPool(mode, direction); setStarted(false); }}
              className="!bg-kinari !text-sumi border-[3px] border-sumi uppercase tracking-widest font-bold text-xs shadow-[3px_3px_0_0_#1a1a1a] rounded-none"
            >
              {id ? 'Main Lagi' : 'Play Again'}
            </Button>
            <Button
              onClick={() => navigate('/')}
              className="!bg-sumi !text-kinari-light border-[3px] border-sumi uppercase tracking-widest font-bold text-xs shadow-[3px_3px_0_0_#1a1a1a] rounded-none"
            >
              {id ? 'Beranda' : 'Home'}
            </Button>
          </div>
        </div>
      ) : (
        <motion.div
          key={item.id + index}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          className="flex-1 flex flex-col"
        >
          {/* Prompt */}
          <div className="bg-kinari border-[4px] border-sumi shadow-[8px_8px_0_0_#1a1a1a] p-6 sm:p-10 flex flex-col items-center gap-3 relative overflow-hidden mb-6">
            <div className="absolute inset-0 bg-seigaiha opacity-[0.03] pointer-events-none" />
            <div className="w-full flex justify-end relative z-10">
              <button
                onClick={play}
                className="w-9 h-9 rounded-full border-[3px] border-sumi text-sumi flex items-center justify-center bg-kinari-light/80 shadow-[2px_2px_0_0_#1a1a1a] hover:bg-sumi hover:text-kinari-light transition-all self-end"
                aria-label={id ? 'Dengar' : 'Listen'}
              >
                <Volume2 size={18} />
              </button>
            </div>
            <span className={`font-serif font-black text-sumi leading-none select-none text-center break-words max-w-full ${promptTextSize(q?.prompt)}`}>
              {q?.prompt}
            </span>
            {direction === 'read' && !status && (
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-sumi/40 relative z-10">
                {mode === 'jepang'
                  ? (id ? 'Ketik dengan keyboard Jepang' : 'Type using the Japanese keyboard')
                  : (id ? 'Ketik romaji / arti' : 'Type romaji / meaning')}
              </span>
            )}
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-sumi/30 relative z-10">
              {item.type === 'kanji' ? '漢字' : item.type === 'kotoba' ? '言葉' : 'かな'} · {typingKind(item)}
            </span>
          </div>

          {/* Input / status */}
          {status ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`w-full py-4 text-center font-black uppercase tracking-widest border-[4px] border-sumi shadow-[6px_6px_0_0_#1a1a1a] ${
                status.ok ? 'bg-matcha text-kinari-light' : 'bg-shu text-kinari-light'
              }`}
            >
              {status.ok
                ? `✓ ${id ? 'Benar!' : 'Correct!'} +${status.xp} XP`
                : `✗ ${id ? 'Salah — jawaban: ' : 'Wrong — answer: '} ${q?.answer}`}
            </motion.div>
          ) : (
            <>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onCompositionStart={() => setComposing(true)}
                onCompositionEnd={() => setComposing(false)}
                onKeyDown={(e) => {
                  const ime = composing || e.nativeEvent?.isComposing || e.keyCode === 229;
                  if (e.key === 'Enter' && !ime) submit();
                }}
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                placeholder={id ? 'Ketik jawaban…' : 'Type your answer…'}
                className={`w-full text-center border-[4px] border-sumi bg-kinari-light text-2xl sm:text-3xl font-black tracking-wider py-4 outline-none transition-shadow ${
                  input.length > 0 ? 'shadow-[6px_6px_0_0_#1a1a1a]' : 'shadow-none'
                } focus:border-ai`}
              />
              <div className="flex gap-3 mt-5">
                <Button
                  onClick={submit}
                  disabled={input.trim().length === 0}
                  className={`flex-1 uppercase tracking-[0.2em] font-black text-base border-[4px] border-sumi rounded-none ${
                    input.trim().length === 0
                      ? '!bg-kinari !text-sumi/25 !shadow-none !border-sumi/30'
                      : '!bg-ai !text-kinari-light shadow-[5px_5px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0_0_#1a1a1a]'
                  }`}
                >
                  {id ? 'Cek' : 'Check'} ⏎
                </Button>
                {mode === 'jepang' && (
                  <button
                    onClick={() => setShowKbNotice(true)}
                    className="px-4 border-[3px] border-sumi bg-kinari text-sumi/60 text-[10px] font-black uppercase tracking-wider hover:bg-sumi hover:text-kinari-light transition-colors"
                  >
                    {id ? 'Bantuan 鍵' : 'Help 鍵'}
                  </button>
                )}
              </div>
            </>
          )}

          {status && (
            <Button
              onClick={next}
              className="w-full mt-6 !bg-sumi !text-kinari-light border-[4px] border-sumi uppercase tracking-[0.2em] font-black shadow-[6px_6px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#1a1a1a] transition-all rounded-none py-5 text-lg"
            >
              {index + 1 >= items.length ? (id ? 'Lihat Hasil →' : 'See Results →') : (id ? 'Berikutnya →' : 'Next →')}
            </Button>
          )}
        </motion.div>
      )}
    </div>
  );
}
