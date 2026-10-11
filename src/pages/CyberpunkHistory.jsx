// ─────────────────────────────────────────────────────────────────────────────
// 「家」の地図 — halaman PETA 電脳: 5 titik rumah Nacht & Saku di kota neon.
//
// Era lain punya peta 8 perhentian (perjalanan). 電脳 TIDAK — sumbunya menyempit
// jadi SATU titik (rumah), dilihat dari beberapa sudut. Data-driven
// (CYBERPUNK_STOPS) supaya tiap titik = data, bukan halaman baru.
//
// Token [data-era="cyberpunk"]: hairline cyan, glow, radius 0, mono chrome.
// Tiap titik menautkan ke fitur app: 門 → gerbang, 街 → navigasi, 扉 → 終
// (checkpoint), 内 → cerita, 別れ → penutup (TAMAT).
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useUserStats } from '../features/progress/ProgressContext';
import { useEra } from '../features/theme/EraContext';
import { CYBERPUNK_STOPS } from '../features/cinematic/cyberpunk/cyberpunkStops';
import { isCyberpunkCheckpointUnlocked } from '../features/cinematic/cyberpunk/cyberpunkCheckpoint';

// Titik → tujuan navigasi (fitur app).
const ROUTE_BY_FEATURE = {
  gate: '/',                          // 門 — masuk era (pusat)
  street: '/',                        // 街 — beranda / navigasi
  checkpoint: '/owari-checkpoint',    // 扉 — gerbang 終
  story: '/',                         // 内 — cerita (reveal)
  end: '/profile',                    // 別れ — penutup (TAMAT, lihat pencapaian)
};

const FEATURE_LABEL = {
  gate: { jp: '門', id: 'Gerbang Kota' },
  street: { jp: '街', id: 'Jalan Neon' },
  checkpoint: { jp: '終', id: 'Gerbang Terakhir' },
  story: { jp: '内', id: 'Di Dalam' },
  end: { jp: '別れ', id: 'Perpisahan (TAMAT)' },
};

export function CyberpunkHistory() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { progress } = useUserStats();
  const { level } = useEra();
  const [openDetail, setOpenDetail] = useState(null);
  const id = language === 'id';

  const animePassed = progress?.n5Exam?.passed === true;
  const checkpointOpen = isCyberpunkCheckpointUnlocked(level, animePassed);

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
            <h1 className="font-display leading-tight text-sumi" style={{ fontSize: 'clamp(2rem, 7vw, 3.4rem)', letterSpacing: '0.04em' }}>
              家の地図
            </h1>
            <p className="mt-1 font-sans text-sm font-bold tracking-[0.3em] text-sumi/70">
              IE NO CHIZU · {id ? 'Peta 「家」' : 'The 「Home」 Map'}
            </p>
          </div>
          <span
            className="cyber-glass shrink-0 font-display text-sumi"
            style={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', color: 'var(--ai-val)' }}
            aria-hidden="true"
          >
            家
          </span>
        </div>

        <p className="mt-4 max-w-prose font-sans text-sm font-semibold leading-relaxed text-sumi/75">
          {id
            ? 'Era lain menyebar jadi delapan dunia. 電脳 menyempit jadi satu: rumah Nacht & Saku di kota neon, dilihat dari lima sudut.'
            : 'Other eras spread into eight worlds. 電脳 narrows into one: Nacht & Saku\u2019s home in a neon city, seen from five angles.'}
        </p>
      </div>

      {/* 5 titik */}
      <ol className="relative z-10 space-y-4">
        {CYBERPUNK_STOPS.map((s) => {
          const label = FEATURE_LABEL[s.feature] || { jp: '', id: '' };
          const route = ROUTE_BY_FEATURE[s.feature];
          const open = openDetail === s.id;
          const locked = s.feature === 'checkpoint' && !checkpointOpen;
          return (
            <li key={s.id} className="cyber-glass py-4 pl-5 pr-4">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.28em] text-sumi/70">
                  {String(s.n).padStart(2, '0')} · {s.romaji}
                </p>
                {label.jp && (
                  <span className="shrink-0 border px-1.5 py-0.5 font-sans text-[0.6rem] font-bold tracking-wider text-sumi" style={{ borderColor: 'rgba(0,240,255,0.35)', color: 'var(--ai-val)' }}>
                    {label.jp}
                  </span>
                )}
              </div>
              <h2 className="mt-1 font-display text-xl leading-snug text-sumi sm:text-2xl">{s.jp}</h2>
              <p className="mt-0.5 font-sans text-sm font-bold text-sumi/85">{s.theme} · {s.theme_id}</p>
              <p className="mt-2 font-serif text-sm italic text-sumi/80">{s.moment}</p>
              <p className="mt-0.5 font-sans text-xs text-sumi/60">{s.moment_id}</p>
              <p className="mt-2 font-sans text-xs font-semibold" style={{ color: 'var(--kin-val)' }}>
                {id ? 'Pelajaran' : 'Lesson'}: {s.lesson_jp} — {s.lesson_id}
              </p>
              <p className="mt-1 font-sans text-[0.7rem] leading-relaxed text-sumi/55">{s.vibe}</p>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                {route && (
                  <button
                    type="button"
                    onClick={() => navigate(route)}
                    className="font-sans text-[0.7rem] font-bold text-sumi hover:opacity-70"
                  >
                    → {id ? label.id : label.jp}{locked ? ` (${id ? 'belum terbuka' : 'locked'})` : ''}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpenDetail(open ? null : s.id)}
                  aria-expanded={open}
                  className="font-sans text-[0.7rem] font-bold uppercase tracking-wider text-sumi/55 hover:opacity-70"
                >
                  詳細 {open ? '▲' : '▼'}
                </button>
              </div>

              {open && (
                <div className="mt-3 border-t pt-3" style={{ borderColor: 'rgba(0,240,255,0.2)' }}>
                  <p className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.3em] text-sumi/45">
                    {id ? 'Catatan Titik' : 'Stop Notes'}
                  </p>
                  <p className="mt-2 font-sans text-xs leading-relaxed text-sumi/70">{s.vibe}</p>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {/* Penutup */}
      <div className="relative z-10 mt-10 border-t pt-6 text-center" style={{ borderColor: 'rgba(0,240,255,0.25)' }}>
        <p className="font-display text-sumi" style={{ fontSize: 'clamp(1.2rem, 4vw, 1.8rem)', letterSpacing: '0.12em' }}>
          おかえり。
        </p>
        <p className="mt-1 font-sans text-sm font-semibold text-sumi/70">
          {id ? 'Selamat pulang.' : 'Welcome home.'}
        </p>
      </div>
    </div>
  );
}

export default CyberpunkHistory;
