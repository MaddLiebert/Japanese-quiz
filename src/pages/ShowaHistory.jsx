// ─────────────────────────────────────────────────────────────────────────────
// 昭和の旅 — halaman PETA Shōwa: 8 perhentian rute naratif tema.
// Dibuka dari layar pilihan setelah cinematic ("Jelajahi Peta Shōwa"), atau dari
// Pengaturan. Data-driven (SHOWA_STOPS) supaya tiap perhentian = data, bukan
// halaman baru.
//
// Memakai token [data-era="showa"] (beton, sodium, segel 昭, sudut tajam 0,
// bayangan keras KEMBALI). Tiap perhentian menautkan ke fitur app yang sesuai
// (PRD §11): 闇市 → reading, 団地 → grammar, 東京タワー → dark mode,
// 万博 → shop, 卒業 → checkpoint naik era (ujian N5).
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCinematic } from '../features/cinematic/CinematicContext';
import { SHOWA_STOPS } from '../features/cinematic/showa/showaStops';

// Perhentian → tujuan navigasi (fitur app). Yang tak punya rute → null.
const ROUTE_BY_FEATURE = {
  nav: '/',              // 焼け跡 — pusat/peta (Home)
  reading: '/learn',     // 闇市 — bahan baca (Reading)
  grammar: '/practice',  // 団地 — latihan tata bahasa
  dark: '/settings',     // 東京タワー — pengaturan tema (夜の団地)
  transit: '/learn',     // 新幹線 — perjalanan/progres
  social: '/learn',      // オリンピック — pergaulan/bahasa
  shop: '/shop',         // 万博 — display barang (商店街)
  checkpoint: '/sotsugyo-checkpoint',// 卒業 — gerbang ujian N5 → naik era (pakai features/n5exam)
};

const FEATURE_LABEL = {
  nav: { jp: '起点', id: 'Pusat Peta' },
  reading: { jp: '読む', id: 'Reading (闇市)' },
  grammar: { jp: '文法', id: 'Grammar (団地)' },
  dark: { jp: '夜景', id: 'Mode Gelap 夜の団地' },
  transit: { jp: '新幹線', id: 'Perjalanan 新幹線' },
  social: { jp: '祭', id: 'Bangga オリンピック' },
  shop: { jp: '商店街', id: 'Warung (商店街)' },
  checkpoint: { jp: '卒業', id: 'Gerbang N5 (卒業)' },
};

export function ShowaHistory() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { play } = useCinematic();
  const [openDetail, setOpenDetail] = useState(null);
  const id = language === 'id';

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
              昭和の旅
            </h1>
            <p className="mt-1 font-sans text-sm font-bold tracking-[0.3em] text-sumi/70">
              1926 — 1989 · {id ? 'Peta Shōwa' : 'Shōwa Map'}
            </p>
          </div>
          {/* Segel 昭 — tanda tangan visual Shōwa */}
          <span
            className="shrink-0 border-2 border-sumi font-display font-black text-kinari-light"
            style={{ background: 'linear-gradient(160deg, #d34a3c 0%, #d3382f 60%, #8e2f26 100%)', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', borderRadius: 0, filter: 'drop-shadow(3px 3px 0 rgba(20,20,18,0.5))' }}
            aria-hidden="true"
          >
            昭
          </span>
        </div>

        <p className="mt-4 max-w-prose font-sans text-sm font-semibold leading-relaxed text-sumi/75">
          {id
            ? 'Delapan perhentian dari 焼け跡 hingga 卒業 — kota yang dicor ulang dari abu: beton, kabel di langit, menara, dan kecepatan.'
            : 'Eight stops from Yakeato to Sotsugyō — a city recast from ash: concrete, wires overhead, a tower, and speed.'}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => play('showa')}
            className="inline-flex items-center gap-2 border-2 border-sumi bg-kinari-light px-4 py-2.5 font-sans text-xs font-bold uppercase tracking-widest text-sumi transition-colors hover:bg-sumi hover:text-kinari-light"
            style={{ borderRadius: 0 }}
          >
            ▶ {id ? 'Putar Ulang Cinematic Shōwa' : 'Replay Shōwa Cinematic'}
          </button>
        </div>
      </div>

      {/* 8 perhentian */}
      <ol className="relative z-10 space-y-4">
        {SHOWA_STOPS.map((s) => {
          const label = FEATURE_LABEL[s.feature] || { jp: '', id: '' };
          const route = ROUTE_BY_FEATURE[s.feature];
          const open = openDetail === s.id;
          return (
            <li
              key={s.id}
              className="border-l-[4px] border-sumi bg-kinari-light/40 py-4 pl-5 pr-4"
              style={{
                borderRadius: 0,
                // 打ちっぱなし — garis bekas cetakan beton (formwork), sudut tajam.
                backgroundImage: 'repeating-linear-gradient(90deg, rgba(20,20,18,0.05) 0 1px, transparent 1px 16px)',
                boxShadow: '4px 4px 0 0 rgba(20,20,18,0.85)',
              }}
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-sans text-[0.62rem] font-bold uppercase tracking-[0.28em] text-sumi/70">
                  {String(s.n).padStart(2, '0')} · {s.romaji}
                </p>
                {label.jp && (
                  <span className="shrink-0 border border-sumi/60 px-1.5 py-0.5 font-sans text-[0.6rem] font-bold tracking-wider text-sumi" style={{ borderRadius: 0 }}>
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
          ようこそ、昭和へ。
        </p>
        <p className="mt-1 font-sans text-sm font-semibold text-sumi/70">
          {id ? 'Selamat datang di Shōwa.' : 'Welcome to Shōwa.'}
        </p>
      </div>
    </div>
  );
}

export default ShowaHistory;
