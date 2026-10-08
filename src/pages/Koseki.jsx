// 戸籍 — buku hidup pemain (M11). Meiji = era pendataan. Membaca data yang
// sudah ada (progress) + key baru `app_koseki_v1` untuk koreksi pemain.
// Nada manis-creepy: app mengingat, dan mengaku bisa salah.
// Spec: docs/tema/meiji-mekanik.md §M11.
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EraPaper } from '../components/EraPaper';
import { useLanguage } from '../context/LanguageContext';
import { useUserStats } from '../features/progress/ProgressContext';
import { buildKoseki, correctEntry, correctionsFor, KOSEKI_KEY } from '../features/profile/koseki';

const readCorrections = () => {
  try {
    const raw = localStorage.getItem(KOSEKI_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch { return null; }
};

export function Koseki() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { progress } = useUserStats();
  const id = language === 'id';
  const [koseki, setKoseki] = useState(() => {
    const saved = readCorrections();
    const base = buildKoseki({
      firstSeen: progress.firstSeen,
      daysActive: progress.daysActive,
      level: progress.level,
      xp: progress.xp,
      firstMistakeKanji: progress.firstMistakeKanji,
    });
    return saved?.corrections ? { ...base, corrections: saved.corrections } : base;
  });
  const [editing, setEditing] = useState(null);
  const [note, setNote] = useState('');

  const save = (entryId) => {
    const next = correctEntry(koseki, entryId, note.trim());
    setKoseki(next);
    try { localStorage.setItem(KOSEKI_KEY, JSON.stringify({ corrections: next.corrections })); } catch { /* diblokir */ }
    setEditing(null);
    setNote('');
  };

  const rows = useMemo(() => koseki.entries, [koseki]);

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
        <h1 className="font-serif font-black text-sumi" style={{ fontSize: 'clamp(2rem, 7vw, 3rem)' }}>戸籍</h1>
        <p className="mt-2 font-sans text-xs font-bold uppercase tracking-[0.3em] text-sumi/55">
          {id ? 'Buku hidupmu — sebagaimana app mencatatnya' : 'Your life record — as the app recorded it'}
        </p>
      </header>

      <p className="mb-8 max-w-prose font-serif text-sm leading-relaxed text-sumi/75">
        {id
          ? 'App ini mencatat. Kadang ia salah. Kalau salah, koreksi — ia akan menyimpannya.'
          : 'This app records. Sometimes it is wrong. If so, correct it — it will keep your correction.'}
      </p>

      <ul className="divide-y divide-sumi/15 border-y border-sumi/20">
        {rows.length === 0 && (
          <li className="py-6 font-sans text-sm text-sumi/50">
            {id ? 'Buku masih kosong.' : 'The book is still empty.'}
          </li>
        )}
        {rows.map((r) => {
          const fixes = correctionsFor(koseki, r.id);
          return (
            <li key={r.id} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="font-serif text-sm font-bold text-sumi">{r.jp}</span>
                <span className="ml-3 font-sans text-xs text-sumi/60">{id ? r.id_text : r.id_text}</span>
                {fixes.length > 0 && (
                  <p className="mt-1 font-sans text-[0.7rem] italic text-renga">
                    {id ? 'Koreksimu' : 'Your correction'}: {fixes[fixes.length - 1].note}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-sans text-sm font-bold text-sumi/85">{String(r.value ?? '—')}</span>
                {editing === r.id ? (
                  <span className="flex items-center gap-2">
                    <input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={id ? 'koreksi…' : 'correction…'}
                      className="w-32 border-[2px] border-sumi bg-kinari-light px-2 py-1 font-sans text-xs text-sumi outline-none"
                      style={{ borderRadius: 0 }}
                    />
                    <button type="button" onClick={() => save(r.id)} className="font-sans text-[0.7rem] font-bold uppercase text-renga">OK</button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setEditing(r.id); setNote(''); }}
                    className="font-sans text-[0.7rem] font-bold uppercase tracking-wider text-sumi/45 hover:text-shu"
                  >
                    {id ? 'Koreksi' : 'Correct'}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default Koseki;
