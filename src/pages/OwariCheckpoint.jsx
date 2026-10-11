// ─────────────────────────────────────────────────────────────────────────────
// 終 — halaman CHECKPOINT 電脳: Gerbang Terakhir (bukan gerbang naik era —
// ini era TERAKHIR). Ujian campur SEMUA era, versi TERSULIT.
//
// Mengikuti pola 最終回 多元 / 卒業 Shōwa (halaman = GERBANG yang meneruskan ke
// mesin N5 `features/n5exam/`), tapi dengan 4 aturan "tersulit" (§11.2) dan
// ambang lulus yang DINAIKKAN. Logika gerbang di modul murni
// (cyberpunkCheckpoint.js) → teruji; halaman ini hanya presentasi.
//
// Token [data-era="cyberpunk"]: hairline cyan, glow, radius 0, mono chrome.
// Momen: lulus → 完 (tamat), gagal → tetap 終 (malam belum berakhir).
// ─────────────────────────────────────────────────────────────────────────────
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useUserStats } from '../features/progress/ProgressContext';
import { useEra } from '../features/theme/EraContext';
import {
  CYBERPUNK_CHECKPOINT_MIN_LEVEL,
  OWARI_PASS_TOTAL, OWARI_PASS_LKR, OWARI_PASS_LISTENING,
  N5_BASE_PASS, OWARI_TOTAL_MINUTES, N5_TOTAL_MINUTES,
  isCyberpunkCheckpointUnlocked, OWARI_END, OWARI_STAY, OWARI_REWARD,
} from '../features/cinematic/cyberpunk/cyberpunkCheckpoint';

export function OwariCheckpoint() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { progress } = useUserStats();
  const { level } = useEra();
  const id = language === 'id';

  const animePassed = progress?.n5Exam?.passed === true;
  const unlocked = isCyberpunkCheckpointUnlocked(level, animePassed);

  // Ambang lulus: N5 dasar → 終 (naik). Ditampilkan berpasangan agar "naik" terlihat.
  const rows = [
    { jp: '語彙・文法・読解', idn: 'Kosakata + Tata Bahasa + Membaca', base: `${N5_BASE_PASS.lkr}`, val: `${OWARI_PASS_LKR} / 120` },
    { jp: '聴解', idn: 'Menyimak (Listening)', base: `${N5_BASE_PASS.listening}`, val: `${OWARI_PASS_LISTENING} / 60` },
    { jp: '合計', idn: 'Total', base: `${N5_BASE_PASS.total}`, val: `${OWARI_PASS_TOTAL} / 180` },
  ];

  const rules = [
    { jp: '冷', idn: 'Mode Dingin — tanpa benar/salah sampai selesai' },
    { jp: '上', idn: `Ambang Naik — lulus ≥ ${OWARI_PASS_TOTAL}/180` },
    { jp: '一', idn: 'Sekali Jalan — tanpa retry' },
    { jp: '時', idn: `Waktu Ketat — ${OWARI_TOTAL_MINUTES} menit (N5 ${N5_TOTAL_MINUTES})` },
  ];

  return (
    <div className="relative mx-auto max-w-2xl px-4 py-8 sm:py-12">
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
            <h1 className="font-display leading-tight text-sumi" style={{ fontSize: 'clamp(2.4rem, 9vw, 3.6rem)', letterSpacing: '0.06em' }}>
              終
            </h1>
            <p className="mt-1 font-sans text-sm font-bold tracking-[0.3em] text-sumi/70">
              OWARI · {id ? 'Gerbang Terakhir' : 'The Last Gate'}
            </p>
          </div>
          <span
            className="cyber-glass shrink-0 font-display text-sumi"
            style={{ width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.7rem', color: 'var(--kin-val)' }}
            aria-hidden="true"
          >
            終
          </span>
        </div>

        <p className="mt-4 max-w-prose font-sans text-sm font-semibold leading-relaxed text-sumi/75">
          {id
            ? `Gerbang terakhir 常夜. Ujian campur SEMUA era — kana, kotoba, kanji, grammar, mondai — dijalankan versi tersulit (${OWARI_TOTAL_MINUTES} menit, ambang naik). Lulus = 完 (tamat). Gagal = tetap 終.`
            : `The last gate of 常夜. An exam mixing EVERY era — kana, kotoba, kanji, grammar, mondai — run in its hardest form (${OWARI_TOTAL_MINUTES} min, raised threshold). Pass = 完 (the end). Fail = still 終.`}
        </p>
      </div>

      {/* 4 aturan tersulit */}
      <div className="cyber-glass relative z-10 p-5">
        <p className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.28em] text-sumi/70">
          {id ? 'Aturan Tersulit' : 'Hardest Rules'}
        </p>
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {rules.map((r) => (
            <li key={r.jp} className="flex items-center gap-3">
              <span className="font-display text-lg leading-none" style={{ color: 'var(--ai-val)' }} aria-hidden="true">{r.jp}</span>
              <span className="font-sans text-xs font-semibold text-sumi/80">{r.idn}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Ambang lulus — naik dari N5 */}
      <div className="cyber-glass relative z-10 mt-4 p-5">
        <p className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.28em] text-sumi/70">
          {id ? 'Ambang Lulus (N5 → 終)' : 'Passing Threshold (N5 → 終)'}
        </p>
        <ul className="mt-3 space-y-2">
          {rows.map((r) => (
            <li key={r.jp} className="flex items-baseline justify-between gap-3">
              <span className="font-display text-sm text-sumi">
                {r.jp} <span className="font-sans text-xs font-bold text-sumi/55">· {r.idn}</span>
              </span>
              <span className="shrink-0 font-mono text-xs font-bold text-sumi/60">
                {r.base} <span className="text-sumi/40">→</span> <span className="text-sm font-black" style={{ color: 'var(--shu-val)' }}>{r.val}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 font-sans text-xs font-semibold text-sumi/60">
          {id ? 'Gagal satu seksi = gagal total (aturan N5 tetap).' : 'Failing one section = total fail (N5 rule still applies).'}
        </p>
      </div>

      {/* Status gerbang */}
      <div className="relative z-10 mt-6">
        {!unlocked && (
          <div className="cyber-glass p-4" style={{ borderColor: 'var(--shu-val)' }}>
            <p className="font-sans text-xs font-bold leading-relaxed text-sumi/80">
              {id
                ? `Gerbang belum terbuka. Butuh Lv ${CYBERPUNK_CHECKPOINT_MIN_LEVEL} + sudah lulus 多元 最終回. Sekarang: Lv ${level}${animePassed ? '' : ', 最終回 belum lulus'}.`
                : `Gate not open yet. Requires Lv ${CYBERPUNK_CHECKPOINT_MIN_LEVEL} + 多元 最終回 passed. Now: Lv ${level}${animePassed ? '' : ', 最終回 not passed'}.`}
            </p>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate('/owari-exam')}
            className="cyber-glass flex-1 px-5 py-3 font-display text-sm tracking-widest text-sumi transition-colors hover:brightness-125"
            style={{ color: 'var(--kin-val)' }}
          >
            {id ? '▶ Mulai Ujian 終' : '▶ Start the 終 Exam'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="cyber-glass flex-1 px-5 py-3 font-sans text-sm font-black uppercase tracking-widest text-sumi/80 transition-colors hover:brightness-125"
          >
            {id ? 'Kembali ke Peta 「家」' : 'Back to the 「家」 Map'}
          </button>
        </div>
      </div>

      {/* Penutup — momen akhir */}
      <div className="relative z-10 mt-10 border-t pt-6 text-center" style={{ borderColor: 'rgba(0,240,255,0.25)' }}>
        <p className="font-display text-sumi" style={{ fontSize: 'clamp(1.4rem, 5vw, 2rem)', letterSpacing: '0.2em' }}>
          {OWARI_STAY} <span className="text-sumi/40">→</span> <span style={{ color: 'var(--kin-val)' }}>{OWARI_END}</span>
        </p>
        <p className="mt-1 font-sans text-sm font-semibold text-sumi/70">
          {id
            ? `Lulus = tamat. Hadiah: ${OWARI_REWARD}. 常夜 punya fajar.`
            : `Pass = the end. Reward: ${OWARI_REWARD}. 常夜 has a dawn.`}
        </p>
      </div>
    </div>
  );
}

export default OwariCheckpoint;
