// ─────────────────────────────────────────────────────────────────────────────
// 物販 — halaman BELI/PILIH DUNIA 多元 (LAPIS 2, A15). 多元 = kanvas kosong;
// tiap franchise yang dibeli = satu DUNIA (palet + motif + pool gacha) yang
// dilukis ke kanvas. BELI = AUTO-EQUIP: dunia baru langsung jadi dunia aktif.
// Dunia lisensi (IP nyata, mis. JJK) menampilkan KREDIT; dunia 'soon' = teaser.
// Token [data-era="anime"]: outline 3px, cel-shadow 5px, radius 6px.
// Lihat PRD docs/tema/anime.md §11 · SPEC §A15.
// ─────────────────────────────────────────────────────────────────────────────
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useUserStats } from '../features/progress/ProgressContext';
import { medaruCopy } from '../features/progress/medaruCopy';
import { FRANCHISE_MIN_LEVEL } from '../features/anime/franchises';
import { WorldShelf } from '../features/anime/WorldShelf';
import { MedaruCoin } from '../components/MedaruCoin';

const BTN_SHADOW = '3px 3px 0 0 #1a1a1a';

export function AnimeShop() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { progress } = useUserStats();
  const id = language === 'id';
  const money = medaruCopy('anime', language);
  const level = progress?.level || 1;
  const balance = progress?.medaru || 0;

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
            ? 'Kanvas 多元 awalnya kosong — halaman manga putih. Beli sebuah dunia untuk melukisnya: warna, motif, dan kolam karakter untuk クレーンゲーム. Dunia baru langsung jadi dunia aktif.'
            : 'The 多元 canvas starts empty — a white manga page. Buy a world to paint it: colors, motif, and the character pool for the crane game. A bought world becomes active at once.'}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 border-[3px] border-sumi bg-kinari-light px-3 py-1.5 font-sans text-xs font-black text-sumi" style={{ borderRadius: 6, boxShadow: BTN_SHADOW }}>
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
            style={{ borderRadius: 6, boxShadow: BTN_SHADOW }}
          >
            クレーンゲーム →
          </button>
        </div>
      </div>

      <WorldShelf showHeading={false} showLink={false} />
    </div>
  );
}

export default AnimeShop;
