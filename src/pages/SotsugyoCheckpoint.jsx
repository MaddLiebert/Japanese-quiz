// ─────────────────────────────────────────────────────────────────────────────
// 卒業 — halaman CHECKPOINT Shōwa: gerbang lulus N5 → naik era.
//
// BEDA dari checkpoint Edo (関所) & Meiji (国会) yang punya bank soal kecil:
// PRD §11 bilang Shōwa = era UJIAN, jadi checkpoint-nya = **UJIAN N5 yang sudah
// ada** (`features/n5exam/` + route /n5-exam). Halaman ini = GERBANG: menampilkan
// syarat + status buka, lalu meneruskan ke ujian sesungguhnya. Logika gerbang di
// modul murni (showaCheckpoint.js) → teruji; halaman ini hanya presentasi.
//
// Memakai token [data-era="showa"] (beton, sodium, segel 昭, sudut 0, bayangan
// keras KEMBALI). Lagu kelulusan = 蛍の光 (PRD §20).
// ─────────────────────────────────────────────────────────────────────────────
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useUserStats, useItemProgress, getRank } from '../features/progress/ProgressContext';
import { countMasteredKanji, N5_TOTAL_MINUTES } from '../features/n5exam/n5exam';
import {
  SHOWA_CHECKPOINT_ROUTE, SHOWA_CHECKPOINT_MIN_KANJI,
  SHOWA_CHECKPOINT_PASS, SHOWA_CHECKPOINT_PASS_LKR, SHOWA_CHECKPOINT_PASS_LISTENING,
  SHOWA_CHECKPOINT_SONG, isShowaCheckpointUnlocked,
} from '../features/cinematic/showa/showaCheckpoint';

export function SotsugyoCheckpoint() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { progress } = useUserStats();
  const { itemProgress } = useItemProgress();
  const id = language === 'id';

  const mastered = countMasteredKanji(itemProgress);
  const rank = getRank(progress?.xp || 0);
  const unlocked = isShowaCheckpointUnlocked(rank, mastered);

  const rows = [
    { jp: '語彙・文法・読解', idn: 'Kosakata + Tata Bahasa + Membaca', val: `${SHOWA_CHECKPOINT_PASS_LKR} / 120` },
    { jp: '聴解', idn: 'Menyimak (Listening)', val: `${SHOWA_CHECKPOINT_PASS_LISTENING} / 60` },
    { jp: '合計', idn: 'Total', val: `${SHOWA_CHECKPOINT_PASS} / 180` },
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
            <h1 className="font-display font-black leading-tight text-sumi" style={{ fontSize: 'clamp(2rem, 7vw, 3.2rem)' }}>
              卒業
            </h1>
            <p className="mt-1 font-sans text-sm font-bold tracking-[0.3em] text-sumi/70">
              SOTSUGYŌ · {id ? 'Gerbang Keluar Shōwa' : 'The Gate Out of Shōwa'}
            </p>
          </div>
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
            ? `Shōwa = kota ujian. Gerbang keluar era ini adalah UJIAN N5 sungguhan (JLPT N5, ${N5_TOTAL_MINUTES} menit, 3 seksi). Lulus = boleh naik ke era berikutnya.`
            : `Shōwa is the city of exams. The gate out of this era is the real N5 exam (JLPT N5, ${N5_TOTAL_MINUTES} min, 3 sections). Pass = you may advance to the next era.`}
        </p>
      </div>

      {/* Syarat kelulusan — papan beton 打ちっぱなし */}
      <div
        className="relative z-10 border-l-[4px] border-sumi bg-kinari-light/40 py-4 pl-5 pr-4"
        style={{
          borderRadius: 0,
          backgroundImage: 'repeating-linear-gradient(90deg, rgba(20,20,18,0.05) 0 1px, transparent 1px 16px)',
          boxShadow: '4px 4px 0 0 rgba(20,20,18,0.85)',
        }}
      >
        <p className="font-sans text-[0.62rem] font-bold uppercase tracking-[0.28em] text-sumi/70">
          {id ? 'Ambang Lulus' : 'Passing Threshold'}
        </p>
        <ul className="mt-2 space-y-2">
          {rows.map((r) => (
            <li key={r.jp} className="flex items-baseline justify-between gap-3">
              <span className="font-display text-base font-black text-sumi">
                {r.jp} <span className="font-sans text-xs font-bold text-sumi/55">· {r.idn}</span>
              </span>
              <span className="shrink-0 font-sans text-sm font-black text-shu">{r.val}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 font-sans text-xs font-semibold text-sumi/60">
          {id ? 'Gagal satu seksi = gagal total (aturan N5 asli).' : 'Failing one section = total fail (real N5 rule).'}
        </p>
      </div>

      {/* Status gerbang */}
      <div className="relative z-10 mt-6">
        {!unlocked && (
          <div className="border-2 border-shu bg-shu/5 px-4 py-3" style={{ borderRadius: 0 }}>
            <p className="font-sans text-xs font-bold leading-relaxed text-sumi/80">
              {id
                ? `Gerbang belum terbuka. Butuh peringkat Shogun + hafal ≥${SHOWA_CHECKPOINT_MIN_KANJI} kanji. Sekarang: ${rank}, ${mastered} kanji.`
                : `Gate not open yet. Requires Shogun rank + ≥${SHOWA_CHECKPOINT_MIN_KANJI} mastered kanji. Now: ${rank}, ${mastered} kanji.`}
            </p>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate(SHOWA_CHECKPOINT_ROUTE)}
            className="flex-1 border-2 border-sumi bg-shu px-5 py-3 font-sans text-sm font-black uppercase tracking-widest text-kinari-light transition-colors hover:bg-shu/90"
            style={{ borderRadius: 0, boxShadow: '4px 4px 0 0 rgba(20,20,18,0.85)' }}
          >
            {id ? '▶ Mulai Ujian N5' : '▶ Start N5 Exam'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/showa-history')}
            className="flex-1 border-2 border-sumi bg-kinari-light px-5 py-3 font-sans text-sm font-black uppercase tracking-widest text-sumi transition-colors hover:bg-kinari"
            style={{ borderRadius: 0, boxShadow: '4px 4px 0 0 rgba(20,20,18,0.85)' }}
          >
            {id ? 'Kembali ke Peta Shōwa' : 'Back to Shōwa Map'}
          </button>
        </div>
      </div>

      {/* Penutup — lagu kelulusan */}
      <div className="relative z-10 mt-10 border-t-2 border-sumi/30 pt-6 text-center">
        <p className="font-display font-black text-sumi" style={{ fontSize: 'clamp(1.2rem, 4vw, 1.8rem)', letterSpacing: '0.1em' }}>
          {SHOWA_CHECKPOINT_SONG}
        </p>
        <p className="mt-1 font-sans text-sm font-semibold text-sumi/70">
          {id ? 'Lagu kelulusan — perpisahan dengan Shōwa.' : 'The graduation song — parting with Shōwa.'}
        </p>
      </div>
    </div>
  );
}

export default SotsugyoCheckpoint;
