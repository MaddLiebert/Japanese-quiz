// ─────────────────────────────────────────────────────────────────────────────
// 物販 — halaman BELI/PILIH DUNIA 多元 (LAPIS 2, A15). 多元 = kanvas kosong;
// tiap franchise yang dibeli = satu DUNIA (palet + motif + pool gacha) yang
// dilukis ke kanvas. Beli → otomatis jadi dunia aktif (kalau belum ada).
// Token [data-era="anime"]: outline 3px, cel-shadow 5px, radius 6px.
// Lihat PRD docs/tema/anime.md §11 · SPEC §A15.
// ─────────────────────────────────────────────────────────────────────────────
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useUserStats } from '../features/progress/ProgressContext';
import { medaruCopy } from '../features/progress/medaruCopy';
import { FRANCHISES, FRANCHISE_MIN_LEVEL, canBuyFranchise, ownsFranchise } from '../features/anime/franchises';
import { charactersOf } from '../features/anime/characters';
import { MedaruCoin } from '../components/MedaruCoin';

export function AnimeShop() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { progress, buyFranchise, equipFranchise } = useUserStats();
  const id = language === 'id';
  const money = medaruCopy('anime', language);
  const level = progress?.level || 1;
  const balance = progress?.medaru || 0;
  const active = progress?.activeFranchise || null;

  return (
    <div className="relative mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-sumi/70 transition-colors hover:text-sumi"
      >
        ← {id ? 'Kembali' : 'Back'}
      </button>

      <div className="mb-8">
        <h1 className="font-display font-black leading-tight text-sumi" style={{ fontSize: 'clamp(2rem, 7vw, 3.2rem)' }}>
          物販
        </h1>
        <p className="mt-1 font-sans text-sm font-bold tracking-[0.3em] text-sumi/70">
          BUPPAN · {id ? 'Pilih Dunia' : 'Pick a World'}
        </p>
        <p className="mt-4 max-w-prose font-sans text-sm font-semibold leading-relaxed text-sumi/75">
          {id
            ? 'Kanvas 多元 awalnya kosong — halaman manga putih. Beli sebuah dunia untuk melukisnya: warna, motif, dan kolam karakter untuk クレーンゲーム.'
            : 'The 多元 canvas starts empty — a white manga page. Buy a world to paint it: colors, motif, and the character pool for the crane game.'}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 border-[3px] border-sumi bg-kinari-light px-3 py-1.5 font-sans text-xs font-black text-sumi" style={{ borderRadius: 6, boxShadow: '3px 3px 0 0 #1a1a1a' }}>
            <MedaruCoin size={14} /> {balance.toLocaleString()} {money.nameShort}
          </span>
          {level < FRANCHISE_MIN_LEVEL && (
            <span className="border-[3px] border-sumi/40 px-3 py-1.5 font-sans text-xs font-bold text-sumi/60" style={{ borderRadius: 6 }}>
              Lv {level} / {FRANCHISE_MIN_LEVEL}
            </span>
          )}
          <button
            type="button"
            onClick={() => navigate('/anime-claw')}
            className="border-[3px] border-sumi bg-kinari-light px-3 py-1.5 font-sans text-xs font-black uppercase tracking-wider text-sumi transition-colors hover:bg-sumi hover:text-kinari-light"
            style={{ borderRadius: 6, boxShadow: '3px 3px 0 0 #1a1a1a' }}
          >
            クレーンゲーム →
          </button>
        </div>
      </div>

      <ul className="space-y-4">
        {FRANCHISES.map((f) => {
          const owned = ownsFranchise(progress, f.id);
          const buyable = canBuyFranchise(progress, f.id);
          const isActive = active === f.id;
          const chars = charactersOf(f.id);
          return (
            <li
              key={f.id}
              className="border-[3px] border-sumi bg-kinari-light/60 p-4"
              style={{ borderRadius: 6, boxShadow: '5px 5px 0 0 rgba(20,20,18,0.9)' }}
            >
              <div className="flex items-start gap-4">
                {/* Swatch dunia — palet franchise */}
                <div className="shrink-0 border-[3px] border-sumi" style={{ borderRadius: 6, width: 56, height: 56, background: `linear-gradient(140deg, ${f.fr1} 0 50%, ${f.fr2} 50% 100%)` }} aria-hidden="true" />
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="font-display text-xl font-black leading-snug text-sumi">{f.kanji}</h2>
                    {isActive && (
                      <span className="shrink-0 border-[2px] border-sumi bg-sumi px-2 py-0.5 font-sans text-[0.6rem] font-black uppercase tracking-wider text-kinari-light" style={{ borderRadius: 4 }}>
                        {id ? 'Aktif' : 'Active'}
                      </span>
                    )}
                  </div>
                  <p className="font-sans text-xs font-bold text-sumi/70">{f.name} · {f.genre_id}</p>
                  <p className="mt-1 font-sans text-[0.7rem] text-sumi/55">
                    {id ? 'Karakter' : 'Characters'}: {chars.map((c) => c.kanji).join(' · ')}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1 font-sans text-xs font-black text-sumi">
                  <MedaruCoin size={12} /> {f.price.toLocaleString()} {money.nameShort}
                </span>
                {owned ? (
                  <button
                    type="button"
                    onClick={() => equipFranchise(f.id)}
                    disabled={isActive}
                    className="border-[3px] border-sumi bg-kinari-light px-3 py-1.5 font-sans text-[0.7rem] font-black uppercase tracking-wider text-sumi transition-colors hover:bg-sumi hover:text-kinari-light disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ borderRadius: 6, boxShadow: '3px 3px 0 0 #1a1a1a' }}
                  >
                    {isActive ? (id ? 'Sedang Aktif' : 'Active') : (id ? 'Pakai Dunia Ini' : 'Use This World')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => buyFranchise(f.id)}
                    disabled={!buyable}
                    className="border-[3px] border-sumi bg-kinari-light px-3 py-1.5 font-sans text-[0.7rem] font-black uppercase tracking-wider text-sumi transition-colors hover:bg-sumi hover:text-kinari-light disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ borderRadius: 6, boxShadow: '3px 3px 0 0 #1a1a1a' }}
                  >
                    {id ? 'Beli Dunia' : 'Buy World'}
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

export default AnimeShop;
