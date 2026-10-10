// ─────────────────────────────────────────────────────────────────────────────
// 多元の練習 — halaman latihan 多元 (E1–E5 wiring UI).
//
// Satu halaman melayani 5 mode belajar (tab), semuanya dari features/anime/quiz.js:
//   オノマトペ · タメ口↔敬語 · セリフ組み · 若者言葉 · カタカナ
// Data & penilaian = modul MURNI (dites di quiz.test.js). Halaman ini hanya
// lapisan tipis: state sesi + tampilan (token [data-era="anime"]: outline tinta
// 3px, cel-shadow 5px 5px 0 0, radius 6px, screentone, motion 140ms).
//
// Gate: era 多元 terbuka (Lv 150). Lihat PRD docs/tema/anime.md §7 + mekanik §A1–A7.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useUserStats } from '../features/progress/ProgressContext';
import { isEraUnlocked } from '../features/theme/eras';
import {
  QUIZ_MODES, QUIZ_MODE_LABEL, buildQuestions, checkAnswer, QUIZ_XP,
} from '../features/anime/quiz';

// Gaya panel kartu 多元 (cel-shadow berwarna, outline tinta, sudut membulat).
const CARD = {
  borderRadius: 6,
  border: '3px solid var(--sumi-val)',
  boxShadow: '5px 5px 0 0 var(--sora-val)',
  background: 'var(--kinari-light-val)',
};
const SCREENTONE = {
  backgroundImage: 'radial-gradient(rgba(20,20,18,0.07) 1px, transparent 1.2px)',
  backgroundSize: '6px 6px',
};

export function AnimePractice() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { language } = useLanguage();
  const { progress, addXp } = useUserStats();
  const id = language === 'id';
  const level = progress?.level ?? 1;
  const unlocked = isEraUnlocked('anime', level);

  const modeParam = params.get('mode');
  const mode = QUIZ_MODES.includes(modeParam) ? modeParam : 'onoma';
  const [dir, setDir] = useState('polite'); // arah register: polite | casual

  const questions = useMemo(
    () => buildQuestions(mode, { level: 3, dir, seed: 1 }),
    [mode, dir],
  );

  const [idx, setIdx] = useState(0);
  const [placed, setPlaced] = useState([]);   // kind 'order': id blok terpasang
  const [chosen, setChosen] = useState(null); // kind 'choice': id terpilih
  const [result, setResult] = useState(null); // { ok, correct }
  const [score, setScore] = useState(0);

  // Reset sesi saat mode/arah berganti (tab).
  useEffect(() => { setIdx(0); setPlaced([]); setChosen(null); setResult(null); setScore(0); }, [mode, dir]);

  const q = questions[idx] || null;
  const done = questions.length > 0 && idx >= questions.length;

  const setMode = (m) => {
    const next = new URLSearchParams(params);
    next.set('mode', m);
    setParams(next, { replace: true });
  };

  const answerChoice = (choiceId) => {
    if (result || !q) return;
    const r = checkAnswer(q, choiceId);
    setChosen(choiceId);
    setResult(r);
    if (r.ok) { setScore((s) => s + 1); addXp?.(QUIZ_XP); }
  };

  const toggleBlock = (blockId) => {
    if (result) return;
    setPlaced((prev) => (prev.includes(blockId) ? prev.filter((x) => x !== blockId) : [...prev, blockId]));
  };

  const checkOrder = () => {
    if (result || !q || placed.length !== q.correct.length) return;
    const r = checkAnswer(q, placed);
    setResult(r);
    if (r.ok) { setScore((s) => s + 1); addXp?.(QUIZ_XP); }
  };

  const next = () => { setIdx((i) => i + 1); setPlaced([]); setChosen(null); setResult(null); };

  // ── Gerbang era ───────────────────────────────────────────────────────────
  if (!unlocked) {
    return (
      <div className="relative mx-auto max-w-3xl px-4 py-16">
        <button type="button" onClick={() => navigate(-1)} className="mb-8 text-xs font-bold uppercase tracking-widest text-sumi/60 hover:text-sumi">
          ← {id ? 'Kembali' : 'Back'}
        </button>
        <div style={CARD} className="p-8">
          <p className="font-sans text-[0.62rem] font-bold uppercase tracking-[0.3em] text-sumi/50">
            {id ? 'Terkunci' : 'Locked'}
          </p>
          <h1 className="mt-2 font-display text-3xl font-black text-sumi">多元の練習</h1>
          <p className="mt-3 font-sans text-sm text-sumi/70">
            {id ? `Butuh Lv 150 untuk membuka 多元 (kamu Lv ${level}).` : `Reach Lv 150 to unlock 多元 (you are Lv ${level}).`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-3xl px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-6">
        <button type="button" onClick={() => navigate('/anime-history')} className="mb-4 text-xs font-bold uppercase tracking-widest text-sumi/60 hover:text-sumi">
          ← 多元の旅
        </button>
        <h1 className="font-display text-3xl font-black leading-tight text-sumi sm:text-4xl">
          多元の練習
        </h1>
        <p className="mt-1 font-sans text-xs font-bold tracking-[0.28em] text-sumi/60">
          {id ? 'Latihan Bahasa Pop' : 'Pop Japanese Practice'}
        </p>
      </div>

      {/* Tab mode */}
      <div className="mb-5 flex flex-wrap gap-2">
        {QUIZ_MODES.map((m) => {
          const on = m === mode;
          return (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              aria-pressed={on}
              className="font-sans text-[0.7rem] font-bold"
              style={{
                borderRadius: 6,
                border: '2px solid var(--sumi-val)',
                padding: '6px 12px',
                background: on ? 'var(--sora-val)' : 'var(--kinari-light-val)',
                color: on ? '#fff' : 'var(--sumi-val)',
                boxShadow: on ? '3px 3px 0 0 var(--sumi-val)' : 'none',
              }}
            >
              {QUIZ_MODE_LABEL[m].jp}
            </button>
          );
        })}
      </div>

      {/* Sub-kontrol register (arah) */}
      {mode === 'register' && (
        <div className="mb-4 flex items-center gap-2">
          <span className="font-sans text-[0.65rem] font-bold uppercase tracking-wider text-sumi/60">
            {id ? 'Arah' : 'Direction'}:
          </span>
          {[{ k: 'polite', l: '→ 敬語' }, { k: 'casual', l: '→ タメ口' }].map(({ k, l }) => (
            <button
              key={k}
              type="button"
              onClick={() => setDir(k)}
              aria-pressed={dir === k}
              className="font-sans text-[0.68rem] font-bold"
              style={{
                borderRadius: 4, border: '2px solid var(--sumi-val)', padding: '3px 10px',
                background: dir === k ? 'var(--sakura-val)' : 'transparent',
                color: dir === k ? '#fff' : 'var(--sumi-val)',
              }}
            >
              {l}
            </button>
          ))}
        </div>
      )}

      {/* Progres */}
      {!done && q && (
        <div className="mb-3 flex items-center justify-between font-sans text-[0.65rem] font-bold uppercase tracking-wider text-sumi/60">
          <span>{idx + 1} / {questions.length}</span>
          <span>{id ? 'Benar' : 'Correct'}: {score}</span>
        </div>
      )}

      {/* Kartu soal */}
      {q && !done && (
        <div style={{ ...CARD, ...SCREENTONE }} className="p-5 sm:p-7">
          <p className="font-sans text-[0.6rem] font-bold uppercase tracking-[0.3em] text-sumi/45">
            {QUIZ_MODE_LABEL[mode].jp} · {QUIZ_MODE_LABEL[mode].id}
          </p>
          <p className="mt-2 font-serif text-2xl font-black leading-snug text-sumi sm:text-3xl">
            {q.prompt_jp}
          </p>
          {q.prompt_id && <p className="mt-1 font-sans text-xs text-sumi/60">{q.prompt_id}</p>}
          <p className="mt-2 font-sans text-xs italic text-sumi/55">{q.hint_id}</p>

          {/* Pilihan (choice) */}
          {q.kind === 'choice' && (
            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {q.choices.map((c) => {
                const isAnswer = c.id === q.answerId;
                const isChosen = c.id === chosen;
                let bg = 'var(--kinari-val)';
                if (result && isAnswer) bg = 'var(--matcha-val)';
                else if (result && isChosen) bg = 'var(--shu-val)';
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={!!result}
                    onClick={() => answerChoice(c.id)}
                    className="text-left font-sans"
                    style={{
                      borderRadius: 6, border: '3px solid var(--sumi-val)', padding: '12px 14px',
                      background: bg, color: result && (isAnswer || isChosen) ? '#fff' : 'var(--sumi-val)',
                      boxShadow: '4px 4px 0 0 var(--sumi-val)',
                    }}
                  >
                    <span className="block font-serif text-lg font-bold">{c.jp}</span>
                    {c.sub && <span className="mt-0.5 block text-[0.65rem] opacity-80">{c.sub}</span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* Susun blok (order) */}
          {q.kind === 'order' && (
            <div className="mt-5">
              <div className="flex min-h-[54px] flex-wrap items-center gap-2 border-b-2 border-sumi/25 pb-3" aria-label="susunan">
                {placed.length === 0 && <span className="font-sans text-xs text-sumi/40">（　）</span>}
                {placed.map((bid) => {
                  const blk = q.pool.find((b) => b.id === bid);
                  if (!blk) return null;
                  return (
                    <button
                      key={bid}
                      type="button"
                      disabled={!!result}
                      onClick={() => toggleBlock(bid)}
                      className="font-serif font-bold"
                      style={{ borderRadius: 4, border: '2px solid var(--sumi-val)', padding: '6px 10px', background: 'var(--sora-val)', color: '#fff' }}
                    >
                      {blk.jp}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {q.pool.filter((b) => !placed.includes(b.id)).map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    disabled={!!result}
                    onClick={() => toggleBlock(b.id)}
                    className="font-serif font-bold"
                    style={{ borderRadius: 4, border: '2px solid var(--sumi-val)', padding: '6px 10px', background: 'var(--kinari-val)', color: 'var(--sumi-val)' }}
                  >
                    {b.jp}
                  </button>
                ))}
              </div>
              {!result && (
                <button
                  type="button"
                  onClick={checkOrder}
                  disabled={placed.length !== q.correct.length}
                  className="mt-4 font-sans text-xs font-black uppercase tracking-widest disabled:opacity-40"
                  style={{ borderRadius: 6, border: '3px solid var(--sumi-val)', padding: '8px 18px', background: 'var(--daidai-val)', color: '#fff', boxShadow: '4px 4px 0 0 var(--sumi-val)' }}
                >
                  {id ? 'Periksa' : 'Check'}
                </button>
              )}
            </div>
          )}

          {/* Umpan balik */}
          {result && (
            <div className="mt-5 border-t-2 border-sumi/20 pt-4">
              <p className="font-sans text-sm font-black" style={{ color: result.ok ? 'var(--matcha-val)' : 'var(--shu-val)' }}>
                {result.ok ? (id ? '正解！ Benar' : '正解！ Correct') : (id ? '残念… Salah' : '残念… Wrong')}
              </p>
              {q.reveal?.jp && (
                <p className="mt-1 font-serif text-sm text-sumi">
                  {q.reveal.jp}{q.reveal.id ? <span className="ml-2 font-sans text-xs text-sumi/60">— {q.reveal.id}</span> : null}
                </p>
              )}
              <button
                type="button"
                onClick={next}
                className="mt-3 font-sans text-xs font-black uppercase tracking-widest"
                style={{ borderRadius: 6, border: '3px solid var(--sumi-val)', padding: '8px 18px', background: 'var(--sora-val)', color: '#fff', boxShadow: '4px 4px 0 0 var(--sumi-val)' }}
              >
                {idx + 1 < questions.length ? (id ? 'Lanjut →' : 'Next →') : (id ? 'Selesai →' : 'Finish →')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Ringkasan / kosong */}
      {(done || !q) && (
        <div style={{ ...CARD, ...SCREENTONE }} className="p-6 text-center">
          {questions.length === 0 ? (
            <p className="font-sans text-sm text-sumi/70">{id ? 'Belum ada soal untuk mode ini.' : 'No questions for this mode yet.'}</p>
          ) : (
            <>
              <p className="font-display text-2xl font-black text-sumi">おつかれ！</p>
              <p className="mt-2 font-sans text-sm text-sumi/75">
                {id ? `Skor ${score} / ${questions.length}` : `Score ${score} / ${questions.length}`}
              </p>
              <button
                type="button"
                onClick={() => { setIdx(0); setPlaced([]); setChosen(null); setResult(null); setScore(0); }}
                className="mt-4 font-sans text-xs font-black uppercase tracking-widest"
                style={{ borderRadius: 6, border: '3px solid var(--sumi-val)', padding: '8px 18px', background: 'var(--sakura-val)', color: '#fff', boxShadow: '4px 4px 0 0 var(--sumi-val)' }}
              >
                {id ? 'Ulangi' : 'Retry'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default AnimePractice;
