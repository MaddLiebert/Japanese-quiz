// ─────────────────────────────────────────────────────────────────────────────
// 江戸の旅 — halaman PETA Edo: 8 perhentian rute naratif tema.
// Dibuka dari layar pilihan setelah cinematic ("Jelajahi Peta Edo"), atau dari
// Pengaturan. Data-driven (EDO_STOPS) supaya tiap perhentian = data, bukan
// halaman baru.
//
// Memakai token [data-era="edo"] (indigo 藍, segel 極, tepi ukir 2px, sudut 4px,
// bayangan keras). Tiap perhentian menautkan ke fitur app yang sesuai (§11):
// 深川 → gacha, 夜市 → dark mode, 箱根関所 → checkpoint naik era.
// ─────────────────────────────────────────────────────────────────────────────
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCinematic } from '../features/cinematic/CinematicContext';
import { EDO_STOPS } from '../features/cinematic/edo/edoStops';

// Perhentian → tujuan navigasi (fitur app). Yang tak punya rute → null.
const ROUTE_BY_FEATURE = {
  gacha: '/shop',        // 深川 — gacha 富くじ ada di halaman Shop
  shop: '/shop',         // 浅草寺 — belanja 問屋
  nav: '/',              // 日本橋 — pusat/peta (Home)
  dark: '/settings',     // 夜市 — pengaturan tema
  checkpoint: '/hakone-checkpoint', // 箱根関所 — ujian naik era
};

const FEATURE_LABEL = {
  nav: { jp: '道の起点', id: 'Pusat Peta' },
  shop: { jp: '問屋', id: 'Warung (問屋)' },
  event: { jp: '祭り', id: 'Festival' },
  rest: { jp: '休息', id: 'Jeda Tenang' },
  gacha: { jp: '富くじ', id: 'Gacha 富くじ' },
  dark: { jp: '提灯', id: 'Mode Gelap 夜市' },
  transition: { jp: '街道', id: 'Masuk Jalan Raya' },
  checkpoint: { jp: '関所', id: 'Checkpoint Naik Era' },
};

export function EdoHistory() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { play } = useCinematic();
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
            <h1 className="font-serif font-black leading-tight text-sumi" style={{ fontSize: 'clamp(2rem, 7vw, 3.4rem)' }}>
              江戸の旅
            </h1>
            <p className="mt-1 font-sans text-sm font-bold tracking-[0.3em] text-kin-ink">
              1603 — 1868 · {id ? 'Peta Edo' : 'Edo Map'}
            </p>
          </div>
          {/* Segel 極 — tanda tangan visual Edo */}
          <span className="era-seal" aria-hidden="true">極</span>
        </div>

        <p className="mt-4 max-w-prose font-sans text-sm font-semibold leading-relaxed text-sumi/75">
          {id
            ? 'Delapan perhentian dari 日本橋 hingga 箱根関所 — kota yang tercetak: siang pasar, malam lentera.'
            : 'Eight stops from Nihonbashi to Hakone Sekisho — a city printed on wood: market by day, lanterns by night.'}
        </p>

        <button
          type="button"
          onClick={() => play('edo')}
          className="mt-6 inline-flex items-center gap-2 border-2 border-kin px-4 py-2.5 font-sans text-xs font-bold uppercase tracking-widest text-kin-ink transition-colors hover:bg-kin hover:text-sumi"
          style={{ borderRadius: 4 }}
        >
          ▶ {id ? 'Putar Ulang Cinematic Edo' : 'Replay Edo Cinematic'}
        </button>
      </div>

      {/* 8 perhentian */}
      <ol className="relative z-10 space-y-4">
        {EDO_STOPS.map((s) => {
          const label = FEATURE_LABEL[s.feature] || { jp: '', id: '' };
          const route = ROUTE_BY_FEATURE[s.feature];
          const Wrapper = route ? 'button' : 'div';
          return (
            <li key={s.id}>
              <Wrapper
                {...(route ? { type: 'button', onClick: () => navigate(route) } : {})}
                className={`block w-full border-l-[3px] border-ai/60 bg-kinari-light/40 py-4 pl-5 pr-4 text-left ${route ? 'cursor-pointer transition-colors hover:bg-kinari-light/70' : ''}`}
                style={{ borderRadius: 4 }}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-sans text-[0.62rem] font-bold uppercase tracking-[0.28em] text-kin-ink">
                    {String(s.n).padStart(2, '0')} · {s.romaji}
                  </p>
                  {label.jp && (
                    <span className="shrink-0 border border-shu/50 px-1.5 py-0.5 font-sans text-[0.6rem] font-bold tracking-wider text-shu" style={{ borderRadius: 2 }}>
                      {label.jp}
                    </span>
                  )}
                </div>
                <h2 className="mt-1 font-serif text-xl font-bold leading-snug text-sumi sm:text-2xl">{s.jp}</h2>
                <p className="mt-0.5 font-sans text-sm font-bold text-sumi/85">{s.theme} · {s.theme_id}</p>
                <p className="mt-2 font-serif text-sm italic text-sumi/80">{s.moment}</p>
                <p className="mt-0.5 font-sans text-xs text-sumi/60">{s.moment_id}</p>
                <p className="mt-2 font-sans text-xs font-semibold text-ai">
                  {id ? 'Pelajaran' : 'Lesson'}: {s.lesson_jp} — {s.lesson_id}
                </p>
                <p className="mt-1 font-sans text-[0.7rem] leading-relaxed text-sumi/55">{s.vibe}</p>
                {route && (
                  <p className="mt-2 font-sans text-[0.7rem] font-bold text-kin-ink">
                    → {id ? label.id : label.jp}
                  </p>
                )}
              </Wrapper>
            </li>
          );
        })}
      </ol>

      {/* Penutup */}
      <div className="relative z-10 mt-10 border-t-2 border-kin/40 pt-6 text-center">
        <p className="font-serif font-black text-sumi" style={{ fontSize: 'clamp(1.2rem, 4vw, 1.8rem)', letterSpacing: '0.1em' }}>
          ようこそ、江戸へ。
        </p>
        <p className="mt-1 font-sans text-sm font-semibold text-sumi/70">
          {id ? 'Selamat datang di Edo.' : 'Welcome to Edo.'}
        </p>
      </div>
    </div>
  );
}

export default EdoHistory;
