// ─────────────────────────────────────────────────────────────────────────────
// 多元の旅 — halaman PETA 多元: 8 perhentian rute naratif tema (「8つの世界」).
// Dibuka dari Pengaturan ("Sejarah 多元"), atau nanti dari cinematic era.
// Data-driven (ANIME_STOPS) supaya tiap perhentian = data, bukan halaman baru.
//
// Memakai token [data-era="anime"]: outline tinta 3px, cel-shadow 5px 5px 0 0,
// radius 6px, screentone, motion 140ms (PRD docs/tema/anime.md §5).
// Tiap perhentian menautkan ke fitur app yang sesuai (§7): 冒険 → onoma/練習,
// 日常 → register, 青春 → slang, 魔法 → loanwords, 怪談 → dark mode,
// 異世界 → 物販 (dunia), 最終回 → checkpoint naik era.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useUserStats } from '../features/progress/ProgressContext';
import { ANIME_STOPS } from '../features/cinematic/anime/animeStops';
import { EraDivider } from '../components/EraDivider';
import { isCanvasEmpty, canvasEmptyCopy } from '../features/anime/canvasCopy';

// Perhentian → tujuan navigasi (fitur app). Yang tak punya rute → null.
const ROUTE_BY_FEATURE = {
  nav: '/',                 // 開幕 — pusat/peta (Home)
  onoma: '/anime-practice?mode=onoma',        // 冒険 — latihan オノマトペ
  register: '/anime-practice?mode=register',  // 日常 — latihan タメ口↔敬語
  slang: '/anime-practice?mode=slang',        // 青春 — latihan 若者言葉
  loanwords: '/anime-practice?mode=loanwords', // 魔法 — latihan カタカナ
  dark: '/settings',        // 怪談 — pengaturan tema (深夜アニメ)
  isekai: '/anime-shop',    // 異世界 — pilih/beli dunia (franchise)
  checkpoint: '/anime-checkpoint', // 最終回 — gerbang naik era
};

const FEATURE_LABEL = {
  nav: { jp: '起点', id: 'Pusat Peta' },
  onoma: { jp: '冒険', id: 'Latihan オノマトペ' },
  register: { jp: '日常', id: 'Latihan Register' },
  slang: { jp: '青春', id: 'Latihan 若者言葉' },
  loanwords: { jp: '魔法', id: 'Latihan カタカナ' },
  dark: { jp: '深夜', id: 'Mode Gelap 深夜アニメ' },
  isekai: { jp: '異世界', id: 'Pilih Dunia (物販)' },
  checkpoint: { jp: '最終回', id: 'Gerbang Naik Era' },
};

export function AnimeHistory() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { progress } = useUserStats();
  const [openDetail, setOpenDetail] = useState(null);
  const id = language === 'id';
  // Kanvas kosong (白紙の頁) — belum beli satu pun dunia. Ini SENGAJA (PRD §R2):
  // ornamen panel 題字 + balon kosong sudah membuktikannya; copy 「この頁は、
  // まだ白い。」 mengundang pemain melukisnya di 物販. Hilang begitu dunia dibeli.
  const empty = isCanvasEmpty(progress);
  const emptyCopy = canvasEmptyCopy(language);

  return (
    <div className="relative mx-auto max-w-3xl px-4 py-8 sm:py-12">
      {/* Header */}
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
            <h1 className="font-display font-black leading-tight text-sumi" style={{ fontSize: 'clamp(2rem, 7vw, 3.4rem)' }}>
              多元の旅
            </h1>
            <p className="mt-1 font-sans text-sm font-bold tracking-[0.3em] text-sumi/70">
              8つの世界 · {id ? 'Peta 多元' : 'Multiverse Map'}
            </p>
          </div>
          {/* 頁 — tanda tangan visual 多元 (panel manga: tinta tebal + screentone) */}
          <span
            className="anime-manga shrink-0 font-display font-black text-sumi"
            style={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}
            aria-hidden="true"
          >
            頁
          </span>
        </div>

        <p className="mt-4 max-w-prose font-sans text-sm font-semibold leading-relaxed text-sumi/75">
          {id
            ? 'Delapan dunia dari 開幕 hingga 最終回 — halaman manga yang robek dan menumpahkan dunia-dunia yang tak pernah ada di sejarah.'
            : 'Eight worlds from Kaimaku to Saishūkai — a manga page torn open, spilling worlds that never existed in history.'}
        </p>
      </div>

      {/* 白紙の頁 — kanvas masih KOSONG (belum beli dunia). SENGAJA, bukan lupa
          didesain (PRD §12 R2): panel manga + balon kosong 「（　）」 + copy
          「この頁は、まだ白い。」 = bukti kesengajaan, lalu undang ke 物販.
          Hilang otomatis begitu dunia pertama dibeli. */}
      {empty && (
        <div className="anime-manga relative z-10 mb-6 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            {/* Balon フキダシ kosong 「（　）」 — kanvas menunggu diisi. */}
            <span
              className="anime-manga anime-manga--balloon shrink-0 font-serif text-sumi"
              style={{ width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}
              aria-hidden="true"
            >
              （　）
            </span>
            <div className="min-w-0">
              <p className="font-serif text-lg font-black leading-snug text-sumi sm:text-xl">
                {emptyCopy.jp}
              </p>
              <p className="mt-1 font-sans text-sm font-semibold text-sumi/75">
                {emptyCopy.text}
              </p>
              <button
                type="button"
                onClick={() => navigate('/anime-shop')}
                className="mt-3 border-[3px] border-sumi bg-kinari-light px-4 py-2 font-sans text-xs font-black uppercase tracking-wider text-sumi transition-colors hover:bg-sumi hover:text-kinari-light"
                style={{ borderRadius: 6, boxShadow: '3px 3px 0 0 #1a1a1a' }}
              >
                物販 → {id ? 'Pilih Dunia' : 'Pick a World'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8 perhentian */}
      <EraDivider label="コマ · PANEL · コマ" className="relative z-10 mb-6" />
      <ol className="relative z-10 space-y-4">
        {ANIME_STOPS.map((s) => {
          const label = FEATURE_LABEL[s.feature] || { jp: '', id: '' };
          const route = ROUTE_BY_FEATURE[s.feature];
          const open = openDetail === s.id;
          return (
            <li
              key={s.id}
              className="anime-manga py-4 pl-5 pr-4"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-sans text-[0.62rem] font-bold uppercase tracking-[0.28em] text-sumi/70">
                  {String(s.n).padStart(2, '0')} · {s.romaji}
                </p>
                {label.jp && (
                  <span className="shrink-0 border-[2px] border-sumi/70 px-1.5 py-0.5 font-sans text-[0.6rem] font-bold tracking-wider text-sumi" style={{ borderRadius: 4 }}>
                    {label.jp}
                  </span>
                )}
              </div>
              <h2 className="mt-1 font-display text-xl font-black leading-snug text-sumi sm:text-2xl">{s.jp}</h2>
              <p className="mt-0.5 font-sans text-sm font-bold text-sumi/85">{s.theme} · {s.theme_id}</p>
              <p className="mt-2 font-serif text-sm italic text-sumi/80">{s.moment}</p>
              <p className="mt-0.5 font-sans text-xs text-sumi/60">{s.moment_id}</p>
              <p className="mt-2 font-sans text-xs font-semibold text-shu">
                {id ? 'Pelajaran' : 'Lesson'}: {s.lesson_jp} — {s.lesson_id}
              </p>
              <p className="mt-1 font-sans text-[0.7rem] leading-relaxed text-sumi/55">{s.vibe}</p>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                {route && (
                  <button
                    type="button"
                    onClick={() => navigate(route)}
                    className="font-sans text-[0.7rem] font-bold text-sumi hover:text-shu"
                  >
                    → {id ? label.id : label.jp}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpenDetail(open ? null : s.id)}
                  aria-expanded={open}
                  className="font-sans text-[0.7rem] font-bold uppercase tracking-wider text-sumi/55 hover:text-shu"
                >
                  詳細 {open ? '▲' : '▼'}
                </button>
              </div>

              {/* 詳細 — catatan rinci perhentian */}
              {open && (
                <div className="mt-3 border-t border-sumi/20 pt-3">
                  <p className="font-sans text-[0.6rem] font-bold uppercase tracking-[0.3em] text-sumi/45">
                    {id ? 'Catatan Perhentian' : 'Stop Notes'}
                  </p>
                  <p className="mt-2 font-sans text-xs leading-relaxed text-sumi/70">{s.vibe}</p>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {/* Penutup */}
      <div className="relative z-10 mt-10 border-t-2 border-sumi/30 pt-6 text-center">
        <p className="font-display font-black text-sumi" style={{ fontSize: 'clamp(1.2rem, 4vw, 1.8rem)', letterSpacing: '0.1em' }}>
          ようこそ、多元へ。
        </p>
        <p className="mt-1 font-sans text-sm font-semibold text-sumi/70">
          {id ? 'Selamat datang di Multiverse.' : 'Welcome to the Multiverse.'}
        </p>
      </div>
    </div>
  );
}

export default AnimeHistory;
