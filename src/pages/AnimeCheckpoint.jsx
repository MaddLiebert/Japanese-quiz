// ─────────────────────────────────────────────────────────────────────────────
// 最終回 — halaman CHECKPOINT 多元: episode terakhir → gerbang naik era.
//
// Mengikuti pola 卒業 Shōwa: PRD §7 bilang 最終回 = sintesis semua register pop,
// jadi checkpoint-nya = **UJIAN N5 yang sudah ada** (`features/n5exam/` +
// route /n5-exam). Halaman ini = GERBANG: menampilkan syarat + status buka, lalu
// meneruskan ke ujian sesungguhnya. Logika gerbang di modul murni
// (animeCheckpoint.js) → teruji; halaman ini hanya presentasi.
//
// Token [data-era="anime"]: outline 3px, cel-shadow 5px, radius 6px, screentone.
// Momen akhir: 「つづく」→「完」.
// ─────────────────────────────────────────────────────────────────────────────
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useUserStats, useItemProgress, getRank } from '../features/progress/ProgressContext';
import { countMasteredKanji, N5_TOTAL_MINUTES } from '../features/n5exam/n5exam';
import {
  ANIME_CHECKPOINT_ROUTE, ANIME_CHECKPOINT_MIN_KANJI,
  ANIME_CHECKPOINT_PASS, ANIME_CHECKPOINT_PASS_LKR, ANIME_CHECKPOINT_PASS_LISTENING,
  ANIME_CHECKPOINT_CONTINUED, ANIME_CHECKPOINT_END, isAnimeCheckpointUnlocked,
} from '../features/cinematic/anime/animeCheckpoint';

export function AnimeCheckpoint() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { progress } = useUserStats();
  const { itemProgress } = useItemProgress();
  const id = language === 'id';

  const mastered = countMasteredKanji(itemProgress);
  const rank = getRank(progress?.xp || 0);
  const unlocked = isAnimeCheckpointUnlocked(rank, mastered);

  const rows = [
    { jp: '語彙・文法・読解', idn: 'Kosakata + Tata Bahasa + Membaca', val: `${ANIME_CHECKPOINT_PASS_LKR} / 120` },
    { jp: '聴解', idn: 'Menyimak (Listening)', val: `${ANIME_CHECKPOINT_PASS_LISTENING} / 60` },
    { jp: '合計', idn: 'Total', val: `${ANIME_CHECKPOINT_PASS} / 180` },
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
              最終回
            </h1>
            <p className="mt-1 font-sans text-sm font-bold tracking-[0.3em] text-sumi/70">
              SAISHŪKAI · {id ? 'Gerbang Keluar 多元' : 'The Gate Out of 多元'}
            </p>
          </div>
          <span
            className="shrink-0 border-[3px] border-sumi font-display font-black text-sumi"
            style={{ background: '#fdfcf8', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', borderRadius: 6, boxShadow: '5px 5px 0 0 #1a1a1a' }}
            aria-hidden="true"
          >
            完
          </span>
        </div>

        <p className="mt-4 max-w-prose font-sans text-sm font-semibold leading-relaxed text-sumi/75">
          {id
            ? `Episode terakhir musim ini. Gerbang keluar 多元 adalah UJIAN N5 sungguhan (JLPT N5, ${N5_TOTAL_MINUTES} menit, 3 seksi) — sintesis semua register pop. Lulus = naik ke era berikutnya.`
            : `The season finale. The gate out of 多元 is the real N5 exam (JLPT N5, ${N5_TOTAL_MINUTES} min, 3 sections) — a synthesis of every pop register. Pass = advance to the next era.`}
        </p>
      </div>

      {/* Syarat kelulusan — papan screentone */}
      <div
        className="relative z-10 border-[3px] border-sumi bg-kinari-light/60 py-4 px-5"
        style={{
          borderRadius: 6,
          backgroundImage: 'radial-gradient(rgba(20,20,18,0.08) 1px, transparent 1.2px)',
          backgroundSize: '7px 7px',
          boxShadow: '5px 5px 0 0 rgba(20,20,18,0.9)',
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
          <div className="border-[3px] border-shu bg-shu/5 px-4 py-3" style={{ borderRadius: 6 }}>
            <p className="font-sans text-xs font-bold leading-relaxed text-sumi/80">
              {id
                ? `Gerbang belum terbuka. Butuh peringkat Shogun + hafal ≥${ANIME_CHECKPOINT_MIN_KANJI} kanji. Sekarang: ${rank}, ${mastered} kanji.`
                : `Gate not open yet. Requires Shogun rank + ≥${ANIME_CHECKPOINT_MIN_KANJI} mastered kanji. Now: ${rank}, ${mastered} kanji.`}
            </p>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate(ANIME_CHECKPOINT_ROUTE)}
            className="flex-1 border-[3px] border-sumi bg-shu px-5 py-3 font-sans text-sm font-black uppercase tracking-widest text-kinari-light transition-colors hover:bg-shu/90"
            style={{ borderRadius: 6, boxShadow: '5px 5px 0 0 rgba(20,20,18,0.9)' }}
          >
            {id ? '▶ Mulai Ujian N5' : '▶ Start N5 Exam'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/anime-history')}
            className="flex-1 border-[3px] border-sumi bg-kinari-light px-5 py-3 font-sans text-sm font-black uppercase tracking-widest text-sumi transition-colors hover:bg-kinari"
            style={{ borderRadius: 6, boxShadow: '5px 5px 0 0 rgba(20,20,18,0.9)' }}
          >
            {id ? 'Kembali ke Peta 多元' : 'Back to 多元 Map'}
          </button>
        </div>
      </div>

      {/* Penutup — momen akhir episode */}
      <div className="relative z-10 mt-10 border-t-2 border-sumi/30 pt-6 text-center">
        <p className="font-display font-black text-sumi" style={{ fontSize: 'clamp(1.2rem, 4vw, 1.8rem)', letterSpacing: '0.1em' }}>
          {ANIME_CHECKPOINT_CONTINUED} → {ANIME_CHECKPOINT_END}
        </p>
        <p className="mt-1 font-sans text-sm font-semibold text-sumi/70">
          {id ? 'Bersambung… lalu tamat. Pintu ke 電脳 terbuka.' : 'To be continued… then the end. The door to 電脳 opens.'}
        </p>
      </div>
    </div>
  );
}

export default AnimeCheckpoint;
