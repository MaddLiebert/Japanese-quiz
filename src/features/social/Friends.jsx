// Friends.jsx — halaman 「友達」 /friends (docs/friends.md §7).
//
// Kode teman sendiri + salin, kotak cari (kode 6 digit / nama), dan daftar
// hubungan dalam tab: 友達 / フォロー中 / フォロワー / 申請 (permintaan masuk).
// Semua baca lewat socialApi (cache + kuota); aksi lewat FollowButton.
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useLanguage } from '../../context/LanguageContext';
import { useSync } from '../sync/SyncContext';
import { EraPaper } from '../../components/EraPaper';
import { Glyph } from '../../components/icons/Glyph';
import { initials } from '../profile/avatar';
import { copyText } from '../leaderboard/PublicProfileModal';
import { profileErrorCopy } from '../leaderboard/profileError';
import {
  fetchFriendCode, searchPlayers, fetchConnections, clearSocialCache,
} from './socialApi.js';
import { bucketConnections, requestCount, BUCKET_TABS, relFromBucket } from './socialView.js';
import { FollowButton } from './FollowButton.jsx';

export function Friends() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { configured, enabled } = useSync();
  const id = language === 'id';

  const [code, setCode] = useState(null);
  const [copied, setCopied] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [conn, setConn] = useState([]);
  const [tab, setTab] = useState('friend');
  const [error, setError] = useState(null);

  const loadConnections = useCallback(async (force = false) => {
    const res = await fetchConnections(force ? { force: true } : undefined);
    setConn(res.rows);
    setError(res.error && res.error !== 'unconfigured' ? res.error : null);
  }, []);

  useEffect(() => {
    if (!configured || !enabled) return;
    let alive = true;
    (async () => {
      const { code: c } = await fetchFriendCode();
      if (alive) setCode(c);
      await loadConnections();
    })();
    return () => { alive = false; };
  }, [configured, enabled, loadConnections]);

  const onSearch = async (e) => {
    e.preventDefault();
    const term = q.trim();
    if (term.length < 2) { setResults([]); return; }
    setSearching(true);
    const res = await searchPlayers(term);
    setSearching(false);
    setResults(res.rows);
    if (res.error && res.error !== 'unconfigured') setError(res.error);
  };

  const afterChange = async () => {
    clearSocialCache();
    await loadConnections(true);
    // Hasil cari ikut disegarkan supaya label tombolnya benar.
    if (q.trim().length >= 2) {
      const res = await searchPlayers(q.trim(), { force: true });
      setResults(res.rows);
    }
  };

  const handleCopy = async () => {
    if (!code) return;
    const ok = await copyText(code);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const buckets = bucketConnections(conn);
  const pending = requestCount(conn);
  const rows = buckets[tab] || [];

  const Row = ({ r }) => (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="w-9 h-9 shrink-0 border-[2px] border-sumi bg-ai text-kinari-light flex items-center justify-center overflow-hidden font-serif font-black text-xs">
        {r.avatar ? <img src={r.avatar} alt="" className="w-full h-full object-cover" /> : initials(r.display_name)}
      </span>
      <button
        type="button"
        onClick={() => navigate(`/u/${r.id}`)}
        className="flex-1 min-w-0 text-left cursor-pointer group"
      >
        <span className="block font-bold text-sumi truncate group-hover:text-shu transition-colors">
          {r.display_name || '旅人'}
        </span>
        <span className="text-[10px] uppercase tracking-widest font-bold text-sumi/50">
          Lv {r.level}{!r.is_public && ` · ${id ? 'Privat' : 'Private'}`}
        </span>
      </button>
      <FollowButton
        targetId={r.id}
        state={r.state || relFromBucket(r.bucket)}
        isPublic={r.is_public}
        onChanged={afterChange}
        size="sm"
      />
    </div>
  );

  return (
    <div className="relative max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-16 min-h-screen">
      <EraPaper />
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 px-4 py-2 bg-kinari-light border-[3px] border-sumi font-black uppercase text-xs shadow-[3px_3px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#1a1a1a] transition-all cursor-pointer"
      >
        ← {id ? 'Kembali' : 'Back'}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="border-[4px] border-sumi bg-kinari-light relative overflow-hidden shadow-[12px_12px_0_0_rgba(26,26,26,0.1)]"
      >
        <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 text-[20rem] font-serif text-sumi opacity-[0.03] pointer-events-none select-none leading-none z-0">
          友
        </div>

        <header className="border-b-[4px] border-sumi p-6 sm:p-10 relative z-10 bg-seigaiha">
          <h1 className="text-3xl sm:text-5xl font-serif font-black text-sumi tracking-tighter">
            友達 <span className="text-shu">{id ? 'Teman' : 'Friends'}</span>
          </h1>
          <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-sumi/50 mt-2">
            {id ? 'Tambah teman lewat kode unik' : 'Add friends by unique code'}
          </p>
        </header>

        <div className="p-6 sm:p-10 relative z-10 space-y-6">
          {!configured ? (
            <div className="border-[3px] border-sumi/20 bg-kinari p-8 text-center">
              <p className="text-sm font-bold text-sumi/70">
                {id
                  ? 'Backend belum dikonfigurasi. Isi VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY lalu jalankan supabase/schema.sql.'
                  : 'Backend not configured. Set VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY and run supabase/schema.sql.'}
              </p>
            </div>
          ) : !enabled ? (
            <div className="border-[3px] border-sumi bg-kinari p-8 text-center">
              <p className="text-sm font-bold text-sumi/80">
                {id
                  ? 'Aktifkan sinkronisasi dulu di Pengaturan untuk memakai fitur teman.'
                  : 'Enable sync in Settings first to use the friends feature.'}
              </p>
            </div>
          ) : (
            <>
              {/* Kode teman sendiri */}
              <div className="border-[4px] border-sumi bg-kinari p-5 shadow-[6px_6px_0_0_#1a1a1a] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/60 block">
                    {id ? 'Kode Temanku' : 'My Friend Code'}
                  </span>
                  <span className="font-serif font-black text-3xl sm:text-4xl text-sumi tracking-[0.3em] tabular-nums">
                    {code || '······'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!code}
                  className="px-5 py-3 border-[3px] border-sumi bg-ai text-kinari-light font-black text-xs tracking-widest uppercase shadow-[3px_3px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#1a1a1a] transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
                >
                  <Glyph name={copied ? 'check' : 'copy'} />
                  {copied ? (id ? 'Tersalin' : 'Copied') : (id ? 'Salin Kode' : 'Copy Code')}
                </button>
              </div>

              {/* Kotak cari */}
              <form onSubmit={onSearch} className="border-[3px] border-sumi bg-kinari-light flex items-stretch">
                <span className="flex items-center px-3 text-sumi/50"><Glyph name="search" /></span>
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={id ? 'Kode 6 digit atau nama…' : '6-digit code or name…'}
                  aria-label={id ? 'Cari pemain' : 'Search players'}
                  className="flex-1 min-w-0 bg-transparent py-3 px-1 font-bold text-sumi placeholder:text-sumi/40 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-5 border-l-[3px] border-sumi bg-sumi text-kinari-light font-black text-xs uppercase tracking-widest cursor-pointer hover:bg-shu transition-colors"
                >
                  {id ? 'Cari' : 'Search'}
                </button>
              </form>

              {searching && <p className="text-sm font-bold text-sumi/50 text-center">{id ? 'Mencari…' : 'Searching…'}</p>}

              {!searching && results.length > 0 && (
                <div className="border-[3px] border-sumi divide-y-[3px] divide-sumi bg-kinari-light">
                  {results.map((r) => (
                    <Row key={r.id} r={r} />
                  ))}
                </div>
              )}
              {!searching && q.trim().length >= 2 && results.length === 0 && (
                <p className="text-xs font-bold text-sumi/50 text-center">
                  {id ? 'Tidak ada pemain yang cocok.' : 'No matching players.'}
                </p>
              )}

              {/* Tab daftar hubungan */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {BUCKET_TABS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    className={`py-3 px-3 border-[3px] border-sumi font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      tab === t.key ? 'bg-sumi text-kinari-light shadow-[3px_3px_0_0_#1a1a1a]' : 'bg-kinari-light text-sumi/70 hover:text-sumi'
                    }`}
                  >
                    <span className="font-serif">{t.jp}</span>
                    {id ? t.id : t.en}
                    {t.key === 'request_in' && pending > 0 && (
                      <span className="ml-1 bg-shu text-kinari-light px-1.5 py-0.5 text-[9px] font-black">{pending}</span>
                    )}
                  </button>
                ))}
              </div>

              {error && (
                <p className="text-xs font-bold text-shu text-center">{profileErrorCopy(error, language).title}</p>
              )}

              {rows.length === 0 ? (
                <p className="text-sm font-bold text-sumi/50 py-10 text-center">
                  {id ? 'Belum ada di sini. Cari teman lewat kode!' : 'Nobody here yet. Find friends by code!'}
                </p>
              ) : (
                <div className="border-[3px] border-sumi divide-y-[3px] divide-sumi bg-kinari-light">
                  {rows.map((r) => (
                    <Row key={`${r.bucket}-${r.id}`} r={r} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default Friends;
