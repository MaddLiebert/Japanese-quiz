// PublicProfile.jsx — halaman /u/:id (docs/public-profile.md §7). Read-only,
// bisa dibagikan. Shell sama seperti Profile.jsx (frame editorial + back button)
// TAPI tanpa tombol edit nama/avatar dan tanpa tab Statistik/Sertifikat — hanya
// kartu ringkas: avatar, nama, rank, Lv, XP, streak, akurasi.
//
// Data dari RPC ber-whitelist `public_profile(uuid)`. Kembalian kosong =
// privat / tidak ada → kartu 「非公開」 (sengaja tidak dibedakan).
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useLanguage } from '../../context/LanguageContext';
import { EraPaper } from '../../components/EraPaper';
import { Glyph } from '../../components/icons/Glyph';
import { RankBadge } from '../progress/RankBadge';
import { initials } from './avatar';
import { fetchPublicProfile } from '../leaderboard/leaderboardApi';
import { copyText } from '../leaderboard/PublicProfileModal';

export function PublicProfile() {
  const { id: targetId } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const id = language === 'id';

  const [state, setState] = useState({ loading: true, row: null, error: null });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!targetId) { setState({ loading: false, row: null, error: null }); return; }
    let alive = true;
    setState({ loading: true, row: null, error: null });
    fetchPublicProfile(targetId)
      .then(({ row, error }) => { if (alive) setState({ loading: false, row, error }); })
      .catch((e) => { if (alive) setState({ loading: false, row: null, error: String(e?.message || e) }); });
    return () => { alive = false; };
  }, [targetId]);

  const { loading, row, error } = state;
  const name = row?.display_name || '旅人';

  const handleCopy = async () => {
    const ok = await copyText(typeof location !== 'undefined' ? location.href : '');
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <div className="relative max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-16 min-h-screen">
      <EraPaper />
      <button
        onClick={() => navigate('/leaderboard')}
        className="mb-6 flex items-center gap-2 px-4 py-2 bg-kinari-light border-[3px] border-sumi font-black uppercase text-xs shadow-[3px_3px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#1a1a1a] transition-all cursor-pointer"
      >
        ← {id ? 'Papan Peringkat' : 'Leaderboard'}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="border-[4px] border-sumi bg-kinari-light relative overflow-hidden shadow-[12px_12px_0_0_rgba(26,26,26,0.1)]"
      >
        <div className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/4 text-[22rem] font-serif text-sumi opacity-[0.03] pointer-events-none select-none leading-none z-0">
          者
        </div>

        <header className="grid grid-cols-1 sm:grid-cols-12 border-b-[4px] border-sumi relative z-10 bg-seigaiha">
          <div className="sm:col-span-8 p-6 sm:p-10 relative">
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="w-12 h-12 bg-sumi text-kinari-light flex items-center justify-center font-serif text-2xl rotate-3 shadow-[4px_4px_0_0_#d3382f]">
                訪
              </div>
              <div>
                <span className="text-xs uppercase tracking-[0.4em] font-bold text-sumi">
                  {id ? 'Profil Pemain' : 'Player Profile'}
                </span>
                <h1 className="text-3xl sm:text-5xl font-serif font-black text-sumi tracking-tighter mt-1">
                  プロフィール
                </h1>
              </div>
            </div>
            <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-sumi/50 relative z-10">
              {id ? 'Halaman publik — bisa dibagikan' : 'Public page — shareable'}
            </p>
          </div>
          <div className="sm:col-span-4 p-6 flex flex-col items-center justify-center bg-kinari border-t-[4px] sm:border-t-0 sm:border-l-[4px] border-sumi">
            <div className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-[0.3em] text-sumi/40">訪問</div>
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/50 mb-1">
              {id ? 'Rank' : 'Rank'}
            </span>
            {row
              ? <RankBadge xp={row.xp} variant="hero" />
              : <div className="w-24 h-24 border-[4px] border-dashed border-sumi/20 flex items-center justify-center text-sumi/30 font-serif text-3xl">—</div>}
          </div>
        </header>

        <div className="p-6 sm:p-12 relative z-10 bg-kinari-light">
          {loading ? (
            <p className="text-sm font-bold text-sumi/50 py-16 text-center">{id ? 'Memuat…' : 'Loading…'}</p>
          ) : !targetId || (!row && !error) ? (
            // Privat / tidak ada / id kosong — kartu 「非公開」.
            <div className="border-[4px] border-sumi bg-kinari p-8 sm:p-12 text-center shadow-[6px_6px_0_0_#1a1a1a]">
              <div className="mx-auto w-20 h-20 border-[3px] border-dashed border-sumi/30 flex items-center justify-center mb-5">
                <Glyph name="lock" className="text-3xl text-sumi/40" />
              </div>
              <h2 className="font-serif font-black text-2xl sm:text-3xl text-sumi">プロフィールは非公開</h2>
              <p className="text-sm font-bold text-sumi/70 mt-2">{id ? 'Profil ini privat' : 'This profile is private'}</p>
              <p className="text-xs text-sumi/50 mt-4 max-w-sm mx-auto leading-relaxed">
                {id
                  ? 'Pemain ini belum menyalakan 「Profil Publik」. Minta dia menyalakannya di Pengaturan agar halaman ini bisa dilihat.'
                  : 'This player has not turned on 「Public Profile」. Ask them to enable it in Settings so this page becomes visible.'}
              </p>
            </div>
          ) : error && error !== 'unconfigured' ? (
            <div className="border-[4px] border-shu/40 bg-kinari p-8 text-center">
              <p className="text-sm font-bold text-shu">
                {id ? 'Gagal memuat profil: ' : 'Failed to load profile: '}{error}
              </p>
              <p className="text-[11px] text-sumi/50 mt-2">
                {id ? 'Cek koneksi lalu coba lagi.' : 'Check your connection and try again.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Kartu ringkas (read-only) */}
              <div className="border-[4px] border-sumi bg-kinari p-6 shadow-[6px_6px_0_0_#1a1a1a] flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="w-20 h-20 shrink-0 border-[4px] border-sumi bg-ai text-kinari-light flex items-center justify-center overflow-hidden font-serif font-black text-2xl shadow-[4px_4px_0_0_#1a1a1a]">
                  {row.avatar
                    ? <img src={row.avatar} alt="" className="w-full h-full object-cover" />
                    : initials(name)}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-sumi/60">
                    {id ? 'Nama' : 'Name'}
                  </span>
                  <h2 className="text-3xl font-serif font-black text-sumi truncate">{name}</h2>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <RankBadge xp={row.xp} variant="chip" />
                    <span className="border-[2px] border-sumi bg-kinari px-2.5 py-1 text-xs font-black text-sumi">
                      Lv {row.level}
                    </span>
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <div className="text-[10px] uppercase tracking-widest font-bold text-sumi/60">Total XP</div>
                  <div className="text-2xl font-serif font-black text-sumi">{Number(row.xp || 0).toLocaleString()} XP</div>
                </div>
              </div>

              {/* Statistik dasar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: 'XP', value: Number(row.xp || 0).toLocaleString(), cls: 'text-sumi' },
                  { label: id ? 'Streak (hari)' : 'Streak (days)', value: String(row.streak || 0), cls: 'text-ai' },
                  { label: id ? 'Akurasi' : 'Accuracy', value: `${Math.round(Number(row.accuracy) || 0)}%`, cls: 'text-shu' },
                ].map((s) => (
                  <div key={s.label} className="border-[4px] border-sumi bg-kinari p-5 shadow-[6px_6px_0_0_#1a1a1a] text-center">
                    <div className="text-[10px] font-black uppercase tracking-widest text-sumi/60 mb-1">{s.label}</div>
                    <div className={`text-3xl font-serif font-black ${s.cls}`}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Aksi: salin tautan */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex-1 py-4 px-5 border-[3px] border-sumi bg-ai text-kinari-light font-black text-xs tracking-widest uppercase shadow-[4px_4px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#1a1a1a] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Glyph name={copied ? 'check' : 'share'} />
                  {copied ? (id ? 'Tautan tersalin' : 'Link copied') : (id ? 'Salin tautan' : 'Copy link')}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/leaderboard')}
                  className="flex-1 py-4 px-5 border-[3px] border-sumi bg-kinari-light text-sumi font-black text-xs tracking-widest uppercase shadow-[4px_4px_0_0_#1a1a1a] hover:bg-sumi hover:text-kinari-light transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Glyph name="trophy" /> {id ? 'Lihat papan peringkat' : 'View leaderboard'}
                </button>
              </div>

              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-sumi/40 text-center">
                {id
                  ? 'Hanya data dasar yang ditampilkan. Medaru, isi tas, dan email tetap privat.'
                  : 'Only basic data is shown. Medaru, bag contents, and email stay private.'}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default PublicProfile;
