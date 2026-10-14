import { useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useSync } from '../sync/SyncContext';
import { AuthModal } from '../sync/AuthModal';
import { useUserStats } from '../progress/ProgressContext';
import { EraPaper } from '../../components/EraPaper';
import { fetchAllTime, fetchWeekly, fetchMyRank, rankMedal, clearLeaderboardCache } from './leaderboardApi';
import { initials } from '../profile/avatar';

// Papan Peringkat 番付 — global. Dua papan: sepanjang masa (XP) & mingguan.
export function Leaderboard() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { configured, enabled, user, enableSync, syncNow, status } = useSync();
  const { progress } = useUserStats();
  const id = language === 'id';
  const [authOpen, setAuthOpen] = useState(false);

  const [tab, setTab] = useState('all');       // 'all' | 'week'
  const [rows, setRows] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    const opts = force ? { force: true } : undefined;
    const res = tab === 'week' ? await fetchWeekly(100, opts) : await fetchAllTime(100, opts);
    setRows(res.rows);
    const friendly = res.error === 'quota'
      ? (language === 'id' ? 'Kuota harian tercapai — coba lagi besok.' : 'Daily quota reached — try again tomorrow.')
      : res.error;
    setError(friendly && friendly !== 'unconfigured' ? friendly : null);
    if (tab === 'all' && user) {
      const r = await fetchMyRank(opts);
      setMyRank(r.rank);
    }
    setLoading(false);
  }, [tab, user, language]);

  useEffect(() => { if (configured) load(); }, [configured, load]);

  const myXp = Number(progress?.xp) || 0;

  return (
    <div className="relative max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-16 min-h-screen">
      <EraPaper />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="border-[4px] border-sumi bg-kinari-light shadow-[8px_8px_0_0_rgba(26,26,26,0.1)] relative overflow-hidden"
      >
        <div className="absolute bottom-0 right-0 text-[20rem] font-serif text-sumi opacity-[0.03] pointer-events-none select-none leading-none translate-x-1/4 translate-y-1/4 z-0">
          番
        </div>

        <header className="border-b-[4px] border-sumi p-6 sm:p-12 relative z-10">
          <button
            onClick={() => navigate(-1)}
            className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/60 hover:text-shu transition-colors flex items-center gap-2 mb-8 group cursor-pointer"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span> {id ? 'Kembali' : 'Back'}
          </button>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-black text-sumi tracking-tighter">
            番付 <span className="text-shu">{id ? 'Papan Peringkat' : 'Leaderboard'}</span>
          </h1>
          <p className="text-xs font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase text-sumi/60 mt-3 sm:mt-4">
            {id ? 'Peringkat XP global — mingguan & sepanjang masa' : 'Global XP ranking — weekly & all-time'}
          </p>
        </header>

        <div className="p-6 sm:p-12 relative z-10">
          {/* Belum dikonfigurasi */}
          {!configured && (
            <div className="border-[3px] border-sumi/20 bg-kinari p-8 text-center">
              <p className="text-sm font-bold text-sumi/70">
                {id
                  ? 'Backend belum dikonfigurasi. Isi VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY lalu jalankan supabase/schema.sql.'
                  : 'Backend not configured. Set VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY and run supabase/schema.sql.'}
              </p>
            </div>
          )}

          {/* Sudah dikonfigurasi tapi sync belum aktif */}
          {configured && !enabled && (
            <div className="border-[3px] border-sumi bg-kinari p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
              <p className="text-sm font-bold text-sumi/80">
                {id
                  ? 'Aktifkan sinkronisasi untuk masuk papan peringkat. Tanpa daftar, tanpa email.'
                  : 'Enable sync to join the leaderboard. No sign-up, no email.'}
              </p>
              <div className="flex-shrink-0 flex flex-wrap gap-3">
                <button
                  onClick={() => enableSync()}
                  className="px-8 py-4 border-[3px] border-sumi bg-ai text-kinari-light font-black text-xs tracking-widest uppercase shadow-[4px_4px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#1a1a1a] transition-all cursor-pointer"
                >
                  {id ? '⚡ Aktifkan Sync' : '⚡ Enable Sync'}
                </button>
                <button
                  onClick={() => setAuthOpen(true)}
                  className="px-6 py-4 border-[3px] border-sumi/40 text-sumi/60 font-bold text-xs tracking-widest uppercase hover:text-sumi transition-all cursor-pointer"
                >
                  {id ? 'Pakai akun' : 'Use account'}
                </button>
              </div>
            </div>
          )}

          {configured && enabled && (
            <>
              {/* Baris kamu + tombol */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className="border-[3px] border-sumi bg-kinari px-4 py-2">
                    <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-sumi/50 block">
                      {id ? 'XP Kamu' : 'Your XP'}
                    </span>
                    <span className="text-xl font-serif font-black text-sumi">{myXp.toLocaleString()}</span>
                  </div>
                  {myRank != null && (
                    <div className="border-[3px] border-sumi bg-kinari px-4 py-2">
                      <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-sumi/50 block">
                        {id ? 'Peringkat' : 'Rank'}
                      </span>
                      <span className="text-xl font-serif font-black text-shu">#{myRank}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={async () => {
                    await syncNow();              // dorong progres dulu
                    clearLeaderboardCache();      // buang cache agar angka segar
                    await load(true);             // muat paksa (bypass cache)
                  }}
                  disabled={status === 'syncing'}
                  className="px-5 py-3 border-[3px] border-sumi bg-kinari-light text-sumi font-black text-xs tracking-widest uppercase shadow-[3px_3px_0_0_#1a1a1a] hover:bg-sumi hover:text-kinari-light transition-all disabled:opacity-50 cursor-pointer"
                >
                  {status === 'syncing' ? (id ? 'Menyinkron…' : 'Syncing…') : (id ? 'Segarkan' : 'Refresh')}
                </button>
              </div>

              {/* Tab */}
              <div className="grid grid-cols-2 gap-3 mb-6 max-w-sm">
                {[
                  { k: 'all', jp: '累計', label: id ? 'Sepanjang Masa' : 'All-Time' },
                  { k: 'week', jp: '今週', label: id ? 'Mingguan' : 'Weekly' },
                ].map((t) => (
                  <button
                    key={t.k}
                    onClick={() => setTab(t.k)}
                    className={`py-3 px-4 border-[3px] border-sumi font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      tab === t.k ? 'bg-sumi text-kinari-light shadow-[3px_3px_0_0_#1a1a1a]' : 'bg-kinari-light text-sumi/70 hover:text-sumi'
                    }`}
                  >
                    <span className="font-serif">{t.jp}</span> {t.label}
                  </button>
                ))}
              </div>

              {/* Daftar */}
              {loading ? (
                <p className="text-sm font-bold text-sumi/50 py-12 text-center">{id ? 'Memuat…' : 'Loading…'}</p>
              ) : error ? (
                <p className="text-sm font-bold text-shu py-12 text-center">{id ? 'Gagal memuat: ' : 'Failed to load: '}{error}</p>
              ) : rows.length === 0 ? (
                <p className="text-sm font-bold text-sumi/50 py-12 text-center">
                  {id ? 'Belum ada peringkat. Jadilah yang pertama!' : 'No ranks yet. Be the first!'}
                </p>
              ) : (
                <div className="border-[3px] border-sumi divide-y-[3px] divide-sumi bg-kinari-light">
                  {rows.map((r, i) => {
                    const isMe = user && r.id === user.id;
                    const score = tab === 'week' ? r.weekly_xp : r.xp;
                    return (
                      <div
                        key={r.id}
                        className={`flex items-center gap-4 px-4 sm:px-6 py-3 ${isMe ? 'bg-ai/15' : ''}`}
                      >
                        <span className="w-10 text-center font-serif font-black text-lg text-sumi shrink-0">
                          {rankMedal(i)}
                        </span>
                        <span className="w-9 h-9 shrink-0 border-[2px] border-sumi bg-ai text-kinari-light flex items-center justify-center overflow-hidden font-serif font-black text-xs">
                          {r.avatar
                            ? <img src={r.avatar} alt="" className="w-full h-full object-cover" />
                            : initials(r.display_name)}
                        </span>
                        <span className="flex-1 min-w-0 truncate font-bold text-sumi">
                          {r.display_name || '旅人'}
                          {isMe && <span className="ml-2 text-[10px] uppercase tracking-widest text-ai font-black">{id ? 'Kamu' : 'You'}</span>}
                        </span>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-sumi/40 hidden sm:block">
                          Lv {r.level}
                        </span>
                        <span className="font-serif font-black text-sumi tabular-nums">
                          {Number(score || 0).toLocaleString()} <span className="text-[10px] text-sumi/50">XP</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-sumi/40 mt-6 text-center">
                {id ? 'Papan mingguan direset tiap Senin (UTC).' : 'Weekly board resets every Monday (UTC).'}
              </p>
            </>
          )}
        </div>
      </motion.div>

      {/* Popup Masuk / Daftar */}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}

export default Leaderboard;
