// PublicProfileModal.jsx — modal 訪問 (kunjungi profil) yang dibuka dari
// Leaderboard (docs/public-profile.md §7). Read-only: avatar, nama, rank chip,
// Lv, XP, streak, akurasi + tombol 「ページを開く」 (buka halaman /u/:id) dan
// 「リンクをコピー」 (salin tautan). Kasus privat → 「非公開」.
//
// Kalau barisnya "Kamu" sendiri, pemanggil TIDAK memakai modal ini (langsung
// tautan ke /profile) — modal ini untuk profil ORANG LAIN.
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Glyph } from '../../components/icons/Glyph';
import { RankBadge } from '../progress/RankBadge';
import { useLanguage } from '../../context/LanguageContext';
import { initials } from '../profile/avatar';
import { fetchPublicProfile } from './leaderboardApi';
import { fetchPlayerCard } from '../social/socialApi';
import { FollowButton } from '../social/FollowButton.jsx';
import { profileErrorCopy } from './profileError';

// Salin teks ke clipboard; fallback `prompt` kalau clipboard tak tersedia
// (mis. konteks non-HTTPS / izin ditolak). Return true kalau "terkirim".
export const copyText = async (text) => {
  try {
    if (typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* jatuh ke fallback */ }
  try {
    if (typeof window !== 'undefined' && typeof window.prompt === 'function') {
      window.prompt('', text);
      return true;
    }
  } catch { /* noop */ }
  return false;
};

export const profileUrl = (id) =>
  `${typeof location !== 'undefined' ? location.origin : ''}/u/${id}`;

export function PublicProfileModal({ target, onClose, onOpenPage }) {
  const { language } = useLanguage();
  const id = language === 'id';
  const [state, setState] = useState({ loading: true, row: null, error: null });
  // Kartu minimal (nama/avatar/level + rel_state) — dipakai saat profil privat
  // supaya modal tetap bisa menampilkan "siapa ini" + tombol minta pertemanan.
  const [card, setCard] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!target?.id) return;
    let alive = true;
    setState({ loading: true, row: null, error: null });
    setCard(null);
    setCopied(false);
    fetchPublicProfile(target.id)
      .then(({ row, error }) => { if (alive) setState({ loading: false, row, error }); })
      .catch((e) => { if (alive) setState({ loading: false, row: null, error: String(e?.message || e) }); });
    // Kartu minimal (untuk tombol follow) — paralel, tak memblokir profil publik.
    fetchPlayerCard(target.id)
      .then(({ row }) => { if (alive) setCard(row); })
      .catch(() => { /* offline → tanpa tombol */ });
    return () => { alive = false; };
  }, [target?.id]);

  const refreshCard = () => {
    if (!target?.id) return;
    fetchPlayerCard(target.id, { force: true })
      .then(({ row }) => setCard(row))
      .catch(() => { /* noop */ });
  };

  if (!target) return null;

  const { loading, row, error } = state;
  // Nama fallback dari baris leaderboard supaya modal tidak kosong saat memuat.
  const name = row?.display_name || target.display_name || '旅人';
  const xp = row ? Number(row.xp) || 0 : null;
  // Profil LENGKAP (docs/public-profile-full.md §7): server kirim `full_data`
  // hanya bila pemilik menyalakan 「Profil Lengkap」. Modal tetap ringkas —
  // cukup penanda + winrate + ajakan buka halaman untuk detail lengkap.
  const full = row?.full_data && typeof row.full_data === 'object' ? row.full_data : null;
  const winRate = full ? (Number(full.winRate) || 0) : null;

  const handleCopy = async () => {
    const ok = await copyText(profileUrl(target.id));
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-sumi/60"
      role="dialog"
      aria-modal="true"
      aria-label={id ? 'Profil pemain' : 'Player profile'}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full max-w-md border-[4px] border-sumi bg-kinari-light shadow-[10px_10px_0_0_#1a1a1a] relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Kepala modal */}
        <div className="flex items-center justify-between border-b-[4px] border-sumi px-5 py-3 bg-kinari">
          <span className="font-serif font-black text-sumi tracking-tight text-lg">
            訪問 <span className="text-shu text-sm">{id ? 'Kunjungi Profil' : 'Visit Profile'}</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={id ? 'Tutup' : 'Close'}
            title={id ? 'Tutup' : 'Close'}
            className="w-8 h-8 border-[3px] border-sumi bg-kinari-light flex items-center justify-center shadow-[2px_2px_0_0_#1a1a1a] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer"
          >
            <Glyph name="x" className="text-sm" />
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {loading ? (
            <p className="text-sm font-bold text-sumi/50 py-10 text-center">
              {id ? 'Memuat…' : 'Loading…'}
            </p>
          ) : error ? (
            <div className="py-8 text-center">
              <p className="text-sm font-bold text-shu">{profileErrorCopy(error, language).title}</p>
              <p className="text-[11px] text-sumi/60 mt-2 max-w-[20rem] mx-auto leading-relaxed">
                {profileErrorCopy(error, language).hint}
              </p>
            </div>
          ) : !row ? (
            // Privat (profil publik mati) — pakai kartu minimal bila ada.
            card ? (
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 border-[4px] border-sumi bg-ai text-kinari-light flex items-center justify-center overflow-hidden font-serif font-black text-2xl shadow-[4px_4px_0_0_#1a1a1a]">
                  {card.avatar
                    ? <img src={card.avatar} alt="" className="w-full h-full object-cover" />
                    : initials(card.display_name || name)}
                </div>
                <h3 className="mt-3 font-serif font-black text-2xl text-sumi truncate max-w-full">{card.display_name || name}</h3>
                <div className="mt-2 flex items-center gap-2 flex-wrap justify-center">
                  <span className="border-[2px] border-sumi bg-kinari px-2.5 py-1 text-xs font-black text-sumi">
                    Lv {card.level}
                  </span>
                  <span className="border-[2px] border-dashed border-sumi/40 text-sumi/60 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest">
                    {id ? 'Privat' : 'Private'}
                  </span>
                </div>
                <div className="mt-5">
                  <FollowButton
                    targetId={card.id}
                    state={card.state}
                    isPublic={card.is_public}
                    onChanged={refreshCard}
                  />
                </div>
                <p className="text-[11px] text-sumi/50 mt-4 max-w-[20rem] mx-auto leading-relaxed">
                  {id
                    ? 'Profil ini privat — statistiknya tersembunyi. Minta pertemanan untuk terhubung.'
                    : 'This profile is private — its stats are hidden. Send a friend request to connect.'}
                </p>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="mx-auto w-16 h-16 border-[3px] border-dashed border-sumi/30 flex items-center justify-center mb-4">
                  <Glyph name="lock" className="text-2xl text-sumi/40" />
                </div>
                <p className="font-serif font-black text-xl text-sumi">プロフィールは非公開</p>
                <p className="text-xs font-bold text-sumi/60 mt-1">
                  {id ? 'Profil ini privat' : 'This profile is private'}
                </p>
                <p className="text-[11px] text-sumi/50 mt-3 max-w-[18rem] mx-auto leading-relaxed">
                  {id
                    ? 'Minta dia menyalakan 「Profil Publik」 di Pengaturan untuk bisa dilihat.'
                    : 'Ask them to turn on 「Public Profile」 in Settings to be visible.'}
                </p>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 border-[4px] border-sumi bg-ai text-kinari-light flex items-center justify-center overflow-hidden font-serif font-black text-2xl shadow-[4px_4px_0_0_#1a1a1a]">
                {row.avatar
                  ? <img src={row.avatar} alt="" className="w-full h-full object-cover" />
                  : initials(name)}
              </div>
              <h3 className="mt-3 font-serif font-black text-2xl text-sumi truncate max-w-full">{name}</h3>
              <div className="mt-2 flex items-center gap-2 flex-wrap justify-center">
                <RankBadge xp={xp} variant="chip" />
                <span className="border-[2px] border-sumi bg-kinari px-2.5 py-1 text-xs font-black text-sumi">
                  Lv {row.level}
                </span>
                {full && (
                  <span className="border-[2px] border-shu bg-shu/10 text-shu px-2.5 py-1 text-[10px] font-black uppercase tracking-widest">
                    プロフィール完全
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 w-full mt-5">
                {[
                  { label: 'XP', value: xp.toLocaleString(), cls: 'text-sumi' },
                  { label: id ? 'Streak' : 'Streak', value: `${row.streak || 0}`, cls: 'text-ai' },
                  { label: id ? 'Akurasi' : 'Accuracy', value: `${Math.round(Number(row.accuracy) || 0)}%`, cls: 'text-shu' },
                ].map((s) => (
                  <div key={s.label} className="border-[3px] border-sumi bg-kinari py-3 px-2 shadow-[3px_3px_0_0_#1a1a1a]">
                    <div className="text-[9px] uppercase tracking-[0.2em] font-bold text-sumi/50">{s.label}</div>
                    <div className={`font-serif font-black text-lg ${s.cls}`}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Penanda profil lengkap — detail di halaman /u/:id */}
              {full && (
                <div className="w-full mt-4 border-[3px] border-sumi bg-kinari px-4 py-3 shadow-[3px_3px_0_0_#1a1a1a] flex items-center justify-between gap-3">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-sumi/60">
                    {id ? 'Winrate' : 'Win rate'}
                  </span>
                  <span className="font-serif font-black text-lg text-shu">{winRate.toFixed(1)}%</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-6">
                <button
                  type="button"
                  onClick={() => onOpenPage(target.id)}
                  className="py-3 px-4 border-[3px] border-sumi bg-ai text-kinari-light font-black text-xs tracking-widest uppercase shadow-[3px_3px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#1a1a1a] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Glyph name="external" /> {id ? 'Buka halaman' : 'Open page'}
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="py-3 px-4 border-[3px] border-sumi bg-kinari-light text-sumi font-black text-xs tracking-widest uppercase shadow-[3px_3px_0_0_#1a1a1a] hover:bg-sumi hover:text-kinari-light transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Glyph name={copied ? 'check' : 'copy'} /> {copied ? (id ? 'Tersalin' : 'Copied') : (id ? 'Salin tautan' : 'Copy link')}
                </button>
              </div>

              {/* 友達 — follow (publik) / minta pertemanan (privat) */}
              {card && card.state !== 'self' && (
                <div className="w-full mt-3 flex justify-center">
                  <FollowButton
                    targetId={target.id}
                    state={card.state}
                    isPublic={true}
                    onChanged={refreshCard}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default PublicProfileModal;
