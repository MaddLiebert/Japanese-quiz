// ─────────────────────────────────────────────────────────────────────────────
// WorldShelf — daftar DUNIA 多元 (LAPIS 2, A15) yang bisa dibeli/dipilih.
// Dipakai di DUA tempat: halaman 物販 penuh (AnimeShop) & Etalase di Shop
// (era 多元). SATU sumber markup → konsisten di mana pun. Dunia lisensi (IP
// nyata, mis. JJK) menampilkan KREDIT; dunia 'soon' (One Piece, JoJo) = teaser.
// Lihat PRD docs/tema/anime.md §11 · SPEC §A15.
// ─────────────────────────────────────────────────────────────────────────────
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useUserStats } from '../progress/ProgressContext';
import { medaruCopy } from '../progress/medaruCopy';
import {
  FRANCHISES, FRANCHISE_MIN_LEVEL, canBuyFranchise, ownsFranchise, isFranchiseComingSoon,
} from './franchises';
import { charactersOf } from './characters';
import { MedaruCoin } from '../../components/MedaruCoin';

const CARD_SHADOW = '5px 5px 0 0 rgba(20,20,18,0.9)';
const BTN_SHADOW = '3px 3px 0 0 #1a1a1a';

export function WorldShelf({ showHeading = true, showLink = true }) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { progress, buyFranchise, equipFranchise } = useUserStats();
  const id = language === 'id';
  const money = medaruCopy('anime', language);
  const level = progress?.level || 1;
  const active = progress?.activeFranchise || null;

  return (
    <div>
      {showHeading && (
        <div className="flex items-center gap-4 mb-4">
          <h3 className="font-display text-xl font-black leading-none text-sumi">
            世界
            <span className="ml-2 align-middle font-sans text-[10px] font-black uppercase tracking-[0.3em] text-sumi/50">
              {id ? 'Dunia' : 'Worlds'}
            </span>
          </h3>
          <div className="h-[2px] flex-1 bg-sumi/10" />
          {showLink && (
            <button
              type="button"
              onClick={() => navigate('/anime-shop')}
              className="shrink-0 border-[3px] border-sumi bg-kinari-light px-3 py-1.5 font-sans text-[0.65rem] font-black uppercase tracking-wider text-sumi transition-colors hover:bg-sumi hover:text-kinari-light"
              style={{ borderRadius: 6, boxShadow: BTN_SHADOW }}
            >
              物販 →
            </button>
          )}
        </div>
      )}

      <ul className="space-y-4">
        {FRANCHISES.map((f) => {
          const owned = ownsFranchise(progress, f.id);
          const buyable = canBuyFranchise(progress, f.id);
          const isActive = active === f.id;
          const soon = isFranchiseComingSoon(f.id);
          const chars = charactersOf(f.id);
          return (
            <li
              key={f.id}
              className={`border-[3px] border-sumi p-4 ${soon ? 'bg-kinari-light/30 opacity-80' : 'bg-kinari-light/60'}`}
              style={{ borderRadius: 6, boxShadow: CARD_SHADOW }}
            >
              <div className="flex items-start gap-4">
                {/* Swatch dunia — palet franchise */}
                <div className="shrink-0 border-[3px] border-sumi" style={{ borderRadius: 6, width: 56, height: 56, background: `linear-gradient(140deg, ${f.fr1} 0 50%, ${f.fr2} 50% 100%)` }} aria-hidden="true" />
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="font-display text-xl font-black leading-snug text-sumi">{f.kanji}</h2>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {f.licensed && (
                        <span className="border-[2px] border-sumi/60 bg-kinari-light px-2 py-0.5 font-sans text-[0.55rem] font-black uppercase tracking-wider text-sumi/70" style={{ borderRadius: 4 }}>
                          {id ? 'Lisensi' : 'Licensed'}
                        </span>
                      )}
                      {soon ? (
                        <span className="border-[2px] border-sumi/60 bg-sumi/10 px-2 py-0.5 font-sans text-[0.55rem] font-black uppercase tracking-wider text-sumi/70" style={{ borderRadius: 4 }}>
                          {id ? 'Segera' : 'Soon'}
                        </span>
                      ) : isActive && (
                        <span className="border-[2px] border-sumi bg-sumi px-2 py-0.5 font-sans text-[0.55rem] font-black uppercase tracking-wider text-kinari-light" style={{ borderRadius: 4 }}>
                          {id ? 'Aktif' : 'Active'}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="font-sans text-xs font-bold text-sumi/70">{f.name} · {f.genre_id}</p>
                  <p className="mt-1 font-sans text-[0.7rem] text-sumi/55">
                    {soon
                      ? (id ? 'Karakter menyusul.' : 'Characters coming soon.')
                      : <>{id ? 'Karakter' : 'Characters'}: {chars.map((c) => c.kanji).join(' · ')}</>}
                  </p>
                  {/* KREDIT hak cipta — wajib untuk dunia lisensi (§6.4 revisi). */}
                  {f.credit && (
                    <p className="mt-1 font-sans text-[0.6rem] italic text-sumi/45">{f.credit}</p>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                {!soon && (
                  <span className="inline-flex items-center gap-1 font-sans text-xs font-black text-sumi">
                    <MedaruCoin size={12} /> {f.price.toLocaleString()} {money.nameShort}
                  </span>
                )}
                {soon ? (
                  <span className="font-sans text-[0.7rem] font-bold uppercase tracking-wider text-sumi/50">
                    {id ? 'Belum tersedia' : 'Not available yet'}
                  </span>
                ) : owned ? (
                  <button
                    type="button"
                    onClick={() => equipFranchise(f.id)}
                    disabled={isActive}
                    className="border-[3px] border-sumi bg-kinari-light px-3 py-1.5 font-sans text-[0.7rem] font-black uppercase tracking-wider text-sumi transition-colors hover:bg-sumi hover:text-kinari-light disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ borderRadius: 6, boxShadow: BTN_SHADOW }}
                  >
                    {isActive ? (id ? 'Sedang Aktif' : 'Active') : (id ? 'Pakai Dunia Ini' : 'Use This World')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => buyFranchise(f.id)}
                    disabled={!buyable}
                    className="border-[3px] border-sumi bg-kinari-light px-3 py-1.5 font-sans text-[0.7rem] font-black uppercase tracking-wider text-sumi transition-colors hover:bg-sumi hover:text-kinari-light disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ borderRadius: 6, boxShadow: BTN_SHADOW }}
                  >
                    {id ? 'Beli Dunia' : 'Buy World'}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {level < FRANCHISE_MIN_LEVEL && (
        <p className="mt-3 font-sans text-[0.7rem] font-bold text-sumi/55">
          {id
            ? `Dunia terbuka di Lv ${FRANCHISE_MIN_LEVEL} (kamu Lv ${level}).`
            : `Worlds unlock at Lv ${FRANCHISE_MIN_LEVEL} (you are Lv ${level}).`}
        </p>
      )}
    </div>
  );
}

export default WorldShelf;
