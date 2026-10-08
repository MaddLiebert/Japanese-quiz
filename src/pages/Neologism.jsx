// 新語 — cipta kata (M8). Pemain diberi KONSEP tanpa kata Jepangnya → menyusun
// istilah dari kanji → dibandingkan dengan kata nyata. Sama seperti kerja
// sarjana Meiji yang menciptakan 哲学/科学/自由/電報 untuk konsep Barat.
// Spec: docs/tema/meiji-mekanik.md §M8.
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EraPaper } from '../components/EraPaper';
import { useLanguage } from '../context/LanguageContext';
import { useUserStats } from '../features/progress/ProgressContext';
import { NEOLOGISMS, checkNeologism, remainingKanji } from '../features/neologism/neologism';

export function Neologism() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { addXp } = useUserStats();
  const id = language === 'id';
  const [idx, setIdx] = useState(0);
  const [built, setBuilt] = useState([]);
  const [result, setResult] = useState(null);

  const item = NEOLOGISMS[idx];
  const pool = useMemo(() => remainingKanji(item, built), [item, built]);
  const guess = built.join('');
  const answerLen = [...item.answer].length;

  const pick = (k) => {
    if (result) return;
    const next = [...built, k];
    setBuilt(next);
    if (next.length >= answerLen) {
      const res = checkNeologism(item, next);
      setResult(res);
      if (res.ok) addXp(25);
    }
  };

  const reset = () => { setBuilt([]); setResult(null); };
  const next = () => {
    if (idx + 1 >= NEOLOGISMS.length) { navigate(-1); return; }
    setIdx((i) => i + 1);
    setBuilt([]); setResult(null);
  };

  return (
    <div className="relative mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <EraPaper />
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-sumi/70 transition-colors hover:text-sumi"
      >
        ← {id ? 'Kembali' : 'Back'}
      </button>

      <header className="mb-8 border-b-[3px] border-double border-sumi pb-4">
        <h1 className="font-serif font-black text-sumi" style={{ fontSize: 'clamp(2rem, 7vw, 3rem)' }}>
          新語
        </h1>
        <p className="mt-2 font-sans text-xs font-bold uppercase tracking-[0.3em] text-sumi/55">
          {id ? 'Ciptakan kata untuk konsep baru' : 'Coin a word for a new concept'} · {idx + 1}/{NEOLOGISMS.length}
        </p>
      </header>

      <div className="border-[2px] border-sumi bg-kinari-light p-6">
        <p className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.3em] text-renga">
          {id ? 'Konsep' : 'Concept'}
        </p>
        <p className="mt-1 font-serif text-2xl font-bold text-sumi">
          {id ? item.concept_id : item.concept_en}
        </p>
        <p className="mt-1 font-sans text-xs text-sumi/55">
          {id ? 'Susun kanji jadi istilah yang tepat.' : 'Arrange kanji into the right term.'}
        </p>

        {/* Papan susun */}
        <div className="mt-5 flex min-h-[64px] items-center gap-2 border-[2px] border-dashed border-sumi/40 p-3" style={{ borderRadius: 0 }}>
          {built.length === 0 && (
            <span className="font-sans text-xs uppercase tracking-widest text-sumi/30">
              {id ? 'Pilih kanji di bawah' : 'Pick kanji below'}
            </span>
          )}
          {built.map((k, i) => (
            <span key={i} className="flex h-12 w-12 items-center justify-center border-[2px] border-sumi bg-sumi font-serif text-2xl text-kinari-light" style={{ borderRadius: 0 }}>
              {k}
            </span>
          ))}
        </div>

        {/* Pool kanji */}
        {!result && (
          <div className="mt-4 flex flex-wrap gap-2">
            {pool.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => pick(k)}
                className="flex h-12 w-12 items-center justify-center border-[2px] border-sumi bg-kinari-light font-serif text-2xl text-sumi transition-colors hover:bg-renga hover:text-kinari-light"
                style={{ borderRadius: 0 }}
              >
                {k}
              </button>
            ))}
          </div>
        )}

        {/* Hasil */}
        {result && (
          <div className={`mt-5 border-[2px] p-4 ${result.ok ? 'border-matcha text-matcha' : 'border-shu text-shu'}`} style={{ borderRadius: 0 }}>
            <p className="font-sans text-sm font-bold uppercase tracking-widest">
              {result.ok
                ? (id ? '✓ Tepat — itulah kata yang dipakai' : '✓ Correct — that is the word used')
                : (id ? '✗ Belum tepat' : '✗ Not quite')}
            </p>
            <p className="mt-2 font-serif text-sm text-sumi/80">
              {id ? 'Kata yang dipakai sejarah: ' : 'The historical word: '}
              <span className="font-bold text-sumi">{item.answer}</span>
              {!result.ok && guess && <span className="ml-2 text-sumi/50">({id ? 'kamu menyusun' : 'you built'}: {guess})</span>}
            </p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={reset}
                className="border-[2px] border-sumi bg-kinari-light px-4 py-2 font-sans text-xs font-bold uppercase tracking-widest text-sumi"
                style={{ borderRadius: 0 }}
              >
                {id ? 'Ulangi' : 'Retry'}
              </button>
              <button
                type="button"
                onClick={next}
                className="border-[2px] border-sumi bg-sumi px-4 py-2 font-sans text-xs font-bold uppercase tracking-widest text-kinari-light"
                style={{ borderRadius: 0 }}
              >
                {idx + 1 >= NEOLOGISMS.length ? (id ? 'Selesai' : 'Finish') : (id ? 'Berikutnya →' : 'Next →')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Neologism;
