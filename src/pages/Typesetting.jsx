import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { EraPaper } from '../components/EraPaper';
import { Glyph } from '../components/icons/Glyph';
import { useUserStats } from '../features/progress/ProgressContext';
import { useLanguage } from '../context/LanguageContext';
import { TYPESETTING_BANK } from '../features/typesetting/typesettingBank';
import { useTypesetting } from '../features/typesetting/useTypesetting';
import { TypesettingBoard } from '../features/typesetting/TypesettingBoard';
import { looseAmount, looseIndices } from '../features/typesetting/looseType';
import { isEraUnlocked } from '../features/theme/eras';
import { gateLevel } from '../features/progress/rank';

// 活字組み — halaman latihan menyusun blok huruf (grammar Meiji).
// Gate: era Meiji (Lv 50). Lihat SPEC docs/tema/meiji-mekanik.md §M1.
export function Typesetting() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { progress, addXp } = useUserStats();
  const id = language === 'id';
  const level = progress?.level ?? 1;
  const unlocked = isEraUnlocked('meiji', gateLevel(progress));

  const bank = useMemo(() => TYPESETTING_BANK, []);
  // Level latihan mengikuti level era: makin tinggi → tanpa furigana.
  const trainLevel = level >= 70 ? 3 : level >= 60 ? 2 : 1;

  const session = useTypesetting({
    bank,
    level: trainLevel,
    onCorrect: (xp) => addXp(xp),
  });

  // M5 活字 lepas — blok di kolam sedikit miring kalau streak putus. Hanya
  // visual (isyarat "kencangkan/ulas"); tidak memblokir belajar.
  const streak = progress?.streak ?? 0;
  const looseIdx = useMemo(
    () => looseIndices(session.remaining.length, looseAmount(streak), session.index + 1),
    [session.remaining.length, streak, session.index],
  );

  const back = () => navigate(-1);

  // ── Gerbang era ───────────────────────────────────────────────────────────
  if (!unlocked) {
    return (
      <div className="relative max-w-3xl mx-auto px-4 sm:px-8 py-16 min-h-screen">
        <EraPaper />
        <button onClick={back} className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/60 hover:text-shu transition-colors flex items-center gap-2 mb-8 group">
          <span className="group-hover:-translate-x-1 transition-transform">←</span> {id ? 'Kembali' : 'Back'}
        </button>
        <h1 className="text-5xl font-serif font-black text-sumi mb-4">
          活字組み <span className="text-renga">{id ? 'Susun Huruf' : 'Typesetting'}</span>
        </h1>
        <div className="border-[2px] border-sumi bg-kinari-light p-8">
          <div className="flex items-center gap-3 text-renga mb-3">
            <Glyph name="lock" size={18} />
            <span className="text-xs font-bold uppercase tracking-[0.24em]">
              {id ? 'Terkunci' : 'Locked'}
            </span>
          </div>
          <p className="text-sm text-sumi/70 font-serif leading-relaxed">
            {id
              ? 'Menyusun blok huruf (活字) terbuka di era 明治 — gerbang Lv 50. Terus berlatih untuk membuka percetakan.'
              : 'Typesetting (活字) opens in the 明治 era — the Lv 50 gate. Keep practising to unlock the press.'}
          </p>
          <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-sumi/40 mt-4">
            {id ? 'Level kamu' : 'Your level'} · {level} / 50
          </p>
        </div>
      </div>
    );
  }

  const q = session.question;

  return (
    <div className="relative max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12 min-h-screen">
      <EraPaper />
      <button onClick={back} className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/60 hover:text-shu transition-colors flex items-center gap-2 mb-6 group">
        <span className="group-hover:-translate-x-1 transition-transform">←</span> {id ? 'Kembali' : 'Back'}
      </button>

      <header className="mb-8 border-b-[4px] border-sumi pb-4">
        <h1 className="text-4xl sm:text-6xl font-serif font-black text-sumi tracking-tight">
          活字組み <span className="text-renga">{id ? 'Susun Huruf' : 'Typesetting'}</span>
        </h1>
        <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-sumi/50 mt-3">
          {id ? 'Susun blok huruf jadi kalimat benar — susunan benar = cetakan bersih'
              : 'Set the type into a correct sentence — a correct setting prints clean'}
        </p>
      </header>

      {session.done ? (
        <div className="border-[2px] border-sumi bg-kinari-light p-10 text-center">
          <div className="text-5xl mb-4">📰</div>
          <h2 className="text-2xl font-serif font-black text-sumi mb-2">
            {id ? 'Edisi selesai dicetak' : 'Edition printed'}
          </h2>
          <p className="text-sm text-sumi/60 font-serif mb-6">
            {id ? `Kamu menyusun ${session.solved} dari ${session.total} kalimat.` : `You set ${session.solved} of ${session.total} sentences.`}
          </p>
          <button
            onClick={back}
            className="px-6 py-3 bg-sumi text-kinari-light border-[2px] border-sumi text-[11px] font-black uppercase tracking-[0.24em] rounded-none"
          >
            {id ? 'Kembali' : 'Back'}
          </button>
        </div>
      ) : (
        <TypesettingBoard
          question={q}
          remaining={session.remaining}
          placed={session.placed}
          checked={session.checked}
          misprint={session.misprint}
          level={trainLevel}
          isSolved={session.isSolved}
          index={session.index}
          total={session.total}
          looseIndices={looseIdx}
          onPlace={session.place}
          onRemove={session.remove}
          onClear={session.clear}
          onNext={session.next}
        />
      )}

      {/* Info level */}
      <div className="mt-8 text-center text-[10px] uppercase tracking-[0.2em] font-bold text-sumi/40">
        {id ? 'Level' : 'Level'} {level} · {id ? 'Mode' : 'Mode'} {trainLevel}
      </div>
    </div>
  );
}

export default Typesetting;
