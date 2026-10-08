// ─────────────────────────────────────────────────────────────────────────────
// 国会 — halaman CHECKPOINT Meiji: ujian grammar + reading → lulus = boleh naik
// era (ke Shōwa). Perhentian terakhir peta Meiji (§7). Soal & penilaian di modul
// murni (meijiCheckpoint.js) → logika teruji; halaman ini hanya presentasi + state.
//
// Memakai token [data-era="meiji"] (renga 煉瓦, segel 明, sudut 0, TANPA bayangan).
// ─────────────────────────────────────────────────────────────────────────────
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import {
  checkpointQuestions, gradeCheckpoint, MEIJI_CHECKPOINT_PASS,
} from '../features/cinematic/meiji/meijiCheckpoint';

export function KokkaiCheckpoint() {
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
              国会
            </h1>
            <p className="mt-1 font-sans text-sm font-bold tracking-[0.3em] text-kin-ink">
              KOKKAI · {id ? 'Gerbang Keluar Meiji' : 'The Gate Out of Meiji'}
            </p>
          </div>
          <span className="meiji-seal" aria-hidden="true">明</span>
        </div>

        <p className="mt-4 max-w-prose font-sans text-sm font-semibold leading-relaxed text-sumi/75">
          {id
            ? `Sidang 国会 menguji tata bahasa & bacaan (文法 + 読解). Jawab ${MEIJI_CHECKPOINT_PASS} dari ${questions.length} soal dengan benar untuk lulus.`
            : `The 国会 session tests grammar & reading (文法 + 読解). Answer ${MEIJI_CHECKPOINT_PASS} of ${questions.length} correctly to pass.`}
        </p>
      </div>

      {/* Soal */}
      <ol className="relative z-10 space-y-5">
        {questions.map((q, qi) => {
          const chosen = answers[qi];
          return (
            <li
              key={q.id}
              className="border-l-[3px] border-renga/60 bg-kinari-light/40 py-4 pl-5 pr-4"
              style={{ borderRadius: 0 }}
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
                  let cls = 'border-sumi/40 bg-kinari-light/50 text-sumi hover:border-renga hover:bg-kinari-light';
                  if (submitted && isAnswer) cls = 'border-matcha bg-matcha/15 text-sumi';
                  else if (submitted && isChosen && !isAnswer) cls = 'border-shu bg-shu/15 text-sumi';
                  else if (isChosen) cls = 'border-renga bg-renga/10 text-sumi';
                  return (
                    <button
                      key={oi}
                      type="button"
                      disabled={submitted}
                      onClick={() => choose(qi, oi)}
                      className={`flex items-center gap-3 border-2 px-3 py-2 text-left font-sans text-sm font-bold transition-colors disabled:cursor-default ${cls}`}
                      style={{ borderRadius: 0 }}
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center border-2 border-current text-[0.7rem]" style={{ borderRadius: 0 }}>
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
                ? 'border-sumi bg-renga text-kinari-light hover:bg-renga/90'
                : 'cursor-not-allowed border-sumi/30 bg-kinari-light/40 text-sumi/40'
            }`}
            style={{ borderRadius: 0 }}
          >
            {id ? 'Serahkan Jawaban' : 'Submit Answers'}
          </button>
        ) : (
          <div className="text-center">
            <p className="font-serif text-2xl font-black text-sumi" style={{ letterSpacing: '0.05em' }}>
              {result.passed ? '国会通過 — おめでとう。' : 'もう一度、議員諸君。'}
            </p>
            <p className="mt-1 font-sans text-sm font-bold text-sumi/75">
              {result.passed
                ? (id ? `Lulus! (${result.correct}/${result.total}) — kamu boleh naik ke era berikutnya.` : `Passed! (${result.correct}/${result.total}) — you may advance to the next era.`)
                : (id ? `Belum lulus (${result.correct}/${result.total}). Coba lagi.` : `Not passed (${result.correct}/${result.total}). Try again.`)}
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={reset}
                className="border-2 border-sumi bg-kinari-light px-5 py-3 font-sans text-sm font-black uppercase tracking-widest text-sumi transition-colors hover:bg-kinari"
                style={{ borderRadius: 0 }}
              >
                {id ? 'Ulangi Ujian' : 'Retry Exam'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/meiji-history')}
                className="border-2 border-sumi bg-renga px-5 py-3 font-sans text-sm font-black uppercase tracking-widest text-kinari-light transition-colors hover:bg-renga/90"
                style={{ borderRadius: 0 }}
              >
                {id ? 'Kembali ke Peta Meiji' : 'Back to Meiji Map'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default KokkaiCheckpoint;
