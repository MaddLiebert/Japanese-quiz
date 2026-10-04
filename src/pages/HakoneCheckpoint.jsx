// ─────────────────────────────────────────────────────────────────────────────
// 箱根関所 — halaman CHECKPOINT Edo: penjaga gerbang bertanya (ujian) → lulus
// = boleh keluar Edo (naik era). Perhentian terakhir peta Edo (§7).
//
// Memakai token [data-era="edo"]. Soal & penilaian di modul murni
// (edoCheckpoint.js) → logika teruji; halaman ini hanya presentasi + state.
// ─────────────────────────────────────────────────────────────────────────────
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import {
  checkpointQuestions, gradeCheckpoint, EDO_CHECKPOINT_PASS,
} from '../features/cinematic/edo/edoCheckpoint';

export function HakoneCheckpoint() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const id = language === 'id';

  const questions = useMemo(() => checkpointQuestions(), []);
  const [answers, setAnswers] = useState(() => Array(questions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(() => gradeCheckpoint(answers, questions), [answers, questions]);
  const answeredAll = answers.every((a) => a != null);

  const choose = (qi, oi) => {
    if (submitted) return;
    setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)));
  };

  const reset = () => {
    setAnswers(Array(questions.length).fill(null));
    setSubmitted(false);
  };

  return (
    <div className="relative mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <div className="relative z-10 mb-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-sumi/70 transition-colors hover:text-sumi"
        >
          ← {id ? 'Kembali' : 'Back'}
        </button>

        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h1 className="font-serif font-black leading-tight text-sumi" style={{ fontSize: 'clamp(2rem, 7vw, 3.2rem)' }}>
              箱根関所
            </h1>
            <p className="mt-1 font-sans text-sm font-bold tracking-[0.3em] text-kin-ink">
              HAKONE SEKISHO · {id ? 'Gerbang Keluar Edo' : 'The Gate Out of Edo'}
            </p>
          </div>
          <span className="era-seal" aria-hidden="true">極</span>
        </div>

        <p className="mt-4 max-w-prose font-sans text-sm font-semibold leading-relaxed text-sumi/75">
          {id
            ? `Penjaga 関所 memeriksa setiap pengelana. Jawab ${EDO_CHECKPOINT_PASS} dari ${questions.length} soal dengan benar untuk lulus.`
            : `The 関所 guard inspects every traveller. Answer ${EDO_CHECKPOINT_PASS} of ${questions.length} correctly to pass.`}
        </p>
      </div>

      {/* Soal */}
      <ol className="relative z-10 space-y-5">
        {questions.map((q, qi) => {
          const chosen = answers[qi];
          return (
            <li
              key={q.id}
              className="border-l-[3px] border-ai/60 bg-kinari-light/40 py-4 pl-5 pr-4"
              style={{ borderRadius: 4 }}
            >
              <p className="font-sans text-[0.62rem] font-bold uppercase tracking-[0.28em] text-kin-ink">
                {String(qi + 1).padStart(2, '0')} / {String(questions.length).padStart(2, '0')}
              </p>
              <p className="mt-1 font-serif text-lg font-bold leading-snug text-sumi">{q.jp}</p>
              <p className="mt-0.5 font-sans text-xs text-sumi/60">{q.id_text}</p>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {q.options.map((opt, oi) => {
                  const isChosen = chosen === oi;
                  const isAnswer = oi === q.answer;
                  let cls = 'border-sumi/40 bg-kinari-light/50 text-sumi hover:border-ai hover:bg-kinari-light';
                  if (submitted && isAnswer) cls = 'border-matcha bg-matcha/15 text-sumi';
                  else if (submitted && isChosen && !isAnswer) cls = 'border-shu bg-shu/15 text-sumi';
                  else if (isChosen) cls = 'border-ai bg-ai/10 text-sumi';
                  return (
                    <button
                      key={oi}
                      type="button"
                      disabled={submitted}
                      onClick={() => choose(qi, oi)}
                      className={`flex items-center gap-3 border-2 px-3 py-2 text-left font-sans text-sm font-bold transition-colors disabled:cursor-default ${cls}`}
                      style={{ borderRadius: 4 }}
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center border-2 border-current text-[0.7rem]" style={{ borderRadius: 2 }}>
                        {String.fromCharCode(65 + oi)}
                      </span>
                      <span>{opt}</span>
                      {submitted && isAnswer && <span className="ml-auto text-matcha">✓</span>}
                      {submitted && isChosen && !isAnswer && <span className="ml-auto text-shu">✕</span>}
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ol>

      {/* Aksi / hasil */}
      <div className="relative z-10 mt-8 border-t-2 border-kin/40 pt-6">
        {!submitted ? (
          <button
            type="button"
            disabled={!answeredAll}
            onClick={() => setSubmitted(true)}
            className={`w-full border-2 px-5 py-3 font-sans text-sm font-black uppercase tracking-widest transition-colors ${
              answeredAll
                ? 'border-sumi bg-ai text-kinari-light hover:bg-ai/90'
                : 'cursor-not-allowed border-sumi/30 bg-kinari-light/40 text-sumi/40'
            }`}
            style={{ borderRadius: 4 }}
          >
            {id ? 'Serahkan Jawaban' : 'Submit Answers'}
          </button>
        ) : (
          <div className="text-center">
            <p className="font-serif text-2xl font-black text-sumi" style={{ letterSpacing: '0.05em' }}>
              {result.passed ? '関所通過 — おめでとう。' : '止まれ。もう一度。'}
            </p>
            <p className="mt-1 font-sans text-sm font-bold text-sumi/75">
              {result.passed
                ? (id ? `Lulus! (${result.correct}/${result.total}) — kamu boleh keluar Edo.` : `Passed! (${result.correct}/${result.total}) — you may leave Edo.`)
                : (id ? `Belum lulus (${result.correct}/${result.total}). Coba lagi.` : `Not passed (${result.correct}/${result.total}). Try again.`)}
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={reset}
                className="border-2 border-sumi bg-kinari-light px-5 py-3 font-sans text-sm font-black uppercase tracking-widest text-sumi transition-colors hover:bg-kinari"
                style={{ borderRadius: 4 }}
              >
                {id ? 'Ulangi Ujian' : 'Retry Exam'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/edo-history')}
                className="border-2 border-sumi bg-ai px-5 py-3 font-sans text-sm font-black uppercase tracking-widest text-kinari-light transition-colors hover:bg-ai/90"
                style={{ borderRadius: 4 }}
              >
                {id ? 'Kembali ke Peta Edo' : 'Back to Edo Map'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HakoneCheckpoint;
