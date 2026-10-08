// ─────────────────────────────────────────────────────────────────────────────
// 明治の旅 — halaman PETA Meiji: 8 perhentian rute naratif tema.
// Dibuka dari layar pilihan setelah cinematic ("Jelajahi Peta Meiji"), atau dari
// Pengaturan. Data-driven (MEIJI_STOPS) supaya tiap perhentian = data, bukan
// halaman baru.
//
// Memakai token [data-era="meiji"] (renga 煉瓦, segel 明, hairline 1px, sudut 0,
// TANPA bayangan). Tiap perhentian menautkan ke fitur app yang sesuai (§11):
// 新聞社 → reading, 小学校 → grammar, 博覧会 → shop, 銀座 → dark mode,
// 国会 → checkpoint naik era.
//
// Terhubung ke modul mekanik murni:
//   • M3 第二面 — halaman belakang koran (opsional, nada datar) per perhentian.
//   • M6 縦→横 — arah teks berputar dari tegak (縦) ke datar (横) sepanjang rute.
//   • M7 時刻 — penjelasan jam standar setelah 鉄道 (index ≥ 4).
//   • M14 印刷所 — easter egg (tautan muncul kalau terbuka).
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCinematic } from '../features/cinematic/CinematicContext';
import { MEIJI_STOPS } from '../features/cinematic/meiji/meijiStops';
import { pagesForStop } from '../features/news/newsPages';
import { flowAtStop, writingMode } from '../features/theme/textFlow';
import { isStandardTime, standardTimeNotice } from '../features/time/temporal';
import { waYoCss } from '../features/theme/waYo';
import { useUserStats } from '../features/progress/ProgressContext';
import { isPrintShopUnlocked } from '../features/printshop/printshop';

// Perhentian → tujuan navigasi (fitur app). Yang tak punya rute → null.
const ROUTE_BY_FEATURE = {
  nav: '/',                          // 横浜港 — pusat/peta (Home)
  dark: '/settings',                 // 銀座 — pengaturan tema
  reading: '/learn',                 // 新聞社 — bahan baca (Reading)
  social: '/learn',                  // 鹿鳴館 — pergaulan/bahasa
  transit: '/learn',                 // 鉄道 — perjalanan/progres
  grammar: '/practice',              // 小学校 — latihan tata bahasa
  shop: '/shop',                     // 博覧会 — display barang (商店)
  checkpoint: '/kokkai-checkpoint',  // 国会 — ujian naik era
};

const FEATURE_LABEL = {
  nav: { jp: '港の起点', id: 'Pusat Peta' },
  dark: { jp: '瓦斯灯', id: 'Mode Gelap 瓦斯灯の夜' },
  reading: { jp: '読む', id: 'Reading (新聞)' },
  social: { jp: '社交', id: 'Pergaulan 鹿鳴館' },
  transit: { jp: '鉄道', id: 'Perjalanan 鉄道' },
  grammar: { jp: '文法', id: 'Grammar (小学校)' },
  shop: { jp: '商店', id: 'Warung (商店)' },
  checkpoint: { jp: '国会', id: 'Checkpoint Naik Era' },
};

export function MeijiHistory() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { play } = useCinematic();
  const { progress } = useUserStats();
  const [openSecond, setOpenSecond] = useState(null); // id perhentian yg 第二面-nya dibuka
  const id = language === 'id';

  const printshopOpen = isPrintShopUnlocked({ era: 'meiji', level: progress?.level, editionsPrinted: 0 });

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
              明治の旅
            </h1>
            <p className="mt-1 font-sans text-sm font-bold tracking-[0.3em] text-kin-ink">
              1868 — 1912 · {id ? 'Peta Meiji' : 'Meiji Map'}
            </p>
          </div>
          {/* Segel 明 — tanda tangan visual Meiji */}
          <span className="meiji-seal" aria-hidden="true">明</span>
        </div>

        <p className="mt-4 max-w-prose font-sans text-sm font-semibold leading-relaxed text-sumi/75">
          {id
            ? 'Delapan perhentian dari 横浜港 hingga 国会 — kota yang dicetak ulang tiap pagi oleh koran: huruf logam, garis aturan, lampu gas.'
            : 'Eight stops from Yokohama-kō to the Diet — a city reprinted each morning by the newspaper: metal type, rule lines, gaslight.'}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => play('meiji')}
            className="inline-flex items-center gap-2 border-2 border-kin px-4 py-2.5 font-sans text-xs font-bold uppercase tracking-widest text-kin-ink transition-colors hover:bg-kin hover:text-sumi"
            style={{ borderRadius: 0 }}
          >
            ▶ {id ? 'Putar Ulang Cinematic Meiji' : 'Replay Meiji Cinematic'}
          </button>
          {printshopOpen && (
            <button
              type="button"
              onClick={() => navigate('/printshop')}
              className="inline-flex items-center gap-2 border-2 border-renga px-4 py-2.5 font-sans text-xs font-bold uppercase tracking-widest text-renga transition-colors hover:bg-renga hover:text-kinari-light"
              style={{ borderRadius: 0 }}
            >
              印刷所 {id ? 'Buka Percetakan' : 'Open Print Shop'}
            </button>
          )}
        </div>
      </div>

      {/* 8 perhentian */}
      <ol className="relative z-10 space-y-4">
        {MEIJI_STOPS.map((s, i) => {
          const label = FEATURE_LABEL[s.feature] || { jp: '', id: '' };
          const route = ROUTE_BY_FEATURE[s.feature];
          const second = pagesForStop(s.id);
          const open = openSecond === s.id;
          const flow = flowAtStop(i);
          const wmode = writingMode(flow);
          const waYo = waYoCss(s.id); // M2 — rasio 和/洋 menggeser kepadatan motif
          const waRatio = Number(waYo['--wa-ratio']);
          // 和 tinggi → garis motif rapat (padat); 洋 tinggi → renggang (lapang).
          const ruleGap = Math.round(10 + (1 - waRatio) * 18);
          return (
            <li
              key={s.id}
              className="border-l-[3px] border-renga/60 bg-kinari-light/40 py-4 pl-5 pr-4"
              style={{
                borderRadius: 0,
                // M2 — kepadatan motif mengikuti rasio 和/洋 (tanpa ganti warna).
                backgroundImage: 'repeating-linear-gradient(90deg, rgba(20,20,20,0.05) 0 1px, transparent 1px var(--wa-rule-gap))',
                '--wa-rule-gap': `${ruleGap}px`,
              }}
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-sans text-[0.62rem] font-bold uppercase tracking-[0.28em] text-kin-ink">
                  {String(s.n).padStart(2, '0')} · {s.romaji}
                </p>
                {label.jp && (
                  <span className="shrink-0 border border-shu/50 px-1.5 py-0.5 font-sans text-[0.6rem] font-bold tracking-wider text-shu" style={{ borderRadius: 0 }}>
                    {label.jp}
                  </span>
                )}
              </div>
              {/* M6 縦→横 — judul berputar dari tegak ke datar sepanjang rute */}
              <h2
                className="mt-1 font-serif text-xl font-bold leading-snug text-sumi sm:text-2xl"
                style={{ writingMode: wmode, transition: 'writing-mode 400ms linear' }}
              >
                {s.jp}
              </h2>
              <p className="mt-0.5 font-sans text-sm font-bold text-sumi/85">{s.theme} · {s.theme_id}</p>
              <p className="mt-2 font-serif text-sm italic text-sumi/80">{s.moment}</p>
              <p className="mt-0.5 font-sans text-xs text-sumi/60">{s.moment_id}</p>
              <p className="mt-2 font-sans text-xs font-semibold text-renga">
                {id ? 'Pelajaran' : 'Lesson'}: {s.lesson_jp} — {s.lesson_id}
              </p>
              <p className="mt-1 font-sans text-[0.7rem] leading-relaxed text-sumi/55">{s.vibe}</p>

              {/* M7 時刻 — penjelasan jam standar setelah 鉄道 */}
              {isStandardTime(i) && (
                <p className="mt-2 border-l-2 border-kin pl-3 font-sans text-[0.7rem] font-semibold text-kin-ink">
                  時刻 · {standardTimeNotice(language)}
                </p>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-3">
                {route && (
                  <button
                    type="button"
                    onClick={() => navigate(route)}
                    className="font-sans text-[0.7rem] font-bold text-kin-ink hover:text-shu"
                  >
                    → {id ? label.id : label.jp}
                  </button>
                )}
                {second.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setOpenSecond(open ? null : s.id)}
                    aria-expanded={open}
                    className="font-sans text-[0.7rem] font-bold uppercase tracking-wider text-sumi/55 hover:text-shu"
                  >
                    第二面 {open ? '▲' : '▼'}
                  </button>
                )}
              </div>

              {/* M3 第二面 — halaman belakang koran (opsional, nada datar) */}
              {open && second.length > 0 && (
                <div className="mt-3 border-t border-sumi/20 pt-3">
                  <p className="font-sans text-[0.6rem] font-bold uppercase tracking-[0.3em] text-sumi/45">
                    {id ? 'Halaman Belakang · harga yang dibayar' : 'Second Page · the price paid'}
                  </p>
                  <ul className="mt-2 space-y-2">
                    {second.map((p) => (
                      <li key={p.id} className="font-serif text-sm text-sumi/80">
                        <span className="font-sans text-[0.65rem] font-bold text-sumi/50">{p.year} · {p.jp}</span>
                        <br />{p.headline_jp}
                        <span className="block font-sans text-xs text-sumi/60">{id ? p.headline_id : p.headline_id}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {/* Penutup */}
      <div className="relative z-10 mt-10 border-t-2 border-kin/40 pt-6 text-center">
        <p className="font-serif font-black text-sumi" style={{ fontSize: 'clamp(1.2rem, 4vw, 1.8rem)', letterSpacing: '0.1em' }}>
          ようこそ、明治へ。
        </p>
        <p className="mt-1 font-sans text-sm font-semibold text-sumi/70">
          {id ? 'Selamat datang di Meiji.' : 'Welcome to Meiji.'}
        </p>
      </div>
    </div>
  );
}

export default MeijiHistory;
