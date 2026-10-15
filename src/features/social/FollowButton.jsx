// FollowButton.jsx — tombol aksi 友達 (docs/friends.md §7).
//
// Dipakai di TIGA tempat supaya perilakunya SELALU sama: halaman /friends,
// modal 訪問, dan halaman /u/:id. Label + aksi diturunkan dari `rel_state`
// lewat modul murni `socialView.js` (satu sumber kebenaran).
//
// Alur: klik → RPC (request/respond/unfollow) → panggil `onChanged(stateBaru)`
// supaya pemanggil menyegarkan daftar/state. Sedang menulis → disabled.
//
// KHUSUS state `friends` (sudah mutual): TIDAK ada tombol "tambah" lagi —
// yang tampil CHIP STATUS 「友達 Teman」 + tombol 「削除 Hapus Pertemanan」.
// Hapus butuh konfirmasi 2 langkah (klik → "Yakin? Ya/Batal") supaya tidak
// kepencet dan pertemanan langsung putus.
import { useState } from 'react';
import { Glyph } from '../../components/icons/Glyph';
import { useLanguage } from '../../context/LanguageContext';
import { REL, actionFor } from './socialView.js';
import { requestFollow, respondFollow, unfollow } from './socialApi.js';

// Ikon per jenis aksi (nama harus terdaftar di Glyph.jsx).
const ICON = {
  follow: 'userPlus',
  request: 'userPlus',
  followback: 'userPlus',
  unfollow: 'userCheck',
  cancel: 'clock',
  respond: 'userCheck',
  unfriend: 'userCheck',
};

export function FollowButton({ targetId, state, isPublic = false, onChanged, size = 'md' }) {
  const { language } = useLanguage();
  const id = language === 'id';
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [confirming, setConfirming] = useState(false); // konfirmasi hapus pertemanan

  const action = actionFor(state, isPublic);
  if (!action || !targetId) return null;

  const label = id ? action.labelId : action.labelEn;
  const pad = size === 'sm' ? 'py-1.5 px-3 text-[10px]' : 'py-2.5 px-4 text-xs';

  const run = async () => {
    if (busy) return;
    setBusy(true);
    setErr(null);
    let res;
    try {
      if (action.kind === 'follow' || action.kind === 'request' || action.kind === 'followback') {
        res = await requestFollow(targetId);
      } else if (action.kind === 'cancel') {
        res = await unfollow(targetId, false);
      } else if (action.kind === 'unfollow') {
        res = await unfollow(targetId, false);
      } else if (action.kind === 'unfriend') {
        res = await unfollow(targetId, true);
      } else if (action.kind === 'respond') {
        res = await respondFollow(targetId, true);
      }
    } catch (e) {
      res = { error: String(e?.message || e) };
    }
    setBusy(false);
    if (res?.error) {
      setErr(res.error === 'quota'
        ? (id ? 'Kuota harian tercapai.' : 'Daily quota reached.')
        : res.error === 'cooldown'
          ? (id ? 'Tunggu sebentar…' : 'Please wait…')
          : (id ? 'Gagal. Coba lagi.' : 'Failed. Try again.'));
      return;
    }
    setConfirming(false);
    onChanged?.(res?.data || null);
  };

  const errLine = err && <span className="text-[9px] font-bold text-shu text-center">{err}</span>;

  // ── Sudah berteman: chip STATUS + tombol Hapus Pertemanan (konfirmasi) ─────
  if (action.status) {
    if (confirming) {
      return (
        <div className="inline-flex flex-col items-stretch gap-1">
          <span className={`${pad} text-center font-black uppercase tracking-widest text-sumi/70`}>
            {id ? action.confirmId : action.confirmEn}
          </span>
          <div className="inline-flex items-stretch gap-1">
            <button
              type="button"
              onClick={run}
              disabled={busy}
              className={`${pad} flex-1 border-[3px] border-shu bg-shu text-kinari-light font-black uppercase tracking-widest shadow-[3px_3px_0_0_#1a1a1a] transition-all cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-1.5`}
            >
              <Glyph name="userMinus" />
              {busy ? (id ? 'Menghapus…' : 'Removing…') : (id ? 'Ya, hapus' : 'Yes, remove')}
            </button>
            <button
              type="button"
              onClick={() => { setConfirming(false); setErr(null); }}
              disabled={busy}
              className={`${pad} flex-1 border-[3px] border-sumi bg-kinari-light text-sumi font-black uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50 inline-flex items-center justify-center`}
            >
              {id ? 'Batal' : 'Cancel'}
            </button>
          </div>
          {errLine}
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-2">
        {/* Chip status: bukan tombol aksi. */}
        <span className={`${pad} inline-flex items-center gap-1.5 border-[3px] border-sumi bg-ai/10 text-sumi font-black uppercase tracking-widest`}>
          <Glyph name="userCheck" />
          {label}
        </span>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          title={id ? action.removeLabelId : action.removeLabelEn}
          aria-label={id ? action.removeLabelId : action.removeLabelEn}
          className={`${pad} border-[3px] border-sumi/40 text-sumi/60 bg-kinari-light font-black uppercase tracking-widest transition-all cursor-pointer hover:border-shu hover:text-shu inline-flex items-center justify-center`}
        >
          <Glyph name="userMinus" />
        </button>
      </div>
    );
  }

  // ── Tombol aksi biasa ─────────────────────────────────────────────────────
  // Gaya: aksi positif (follow/minta/terima/followback) = navy CTA (bg-ai);
  // sudah mengikuti = outline; menunggu = redup.
  const positive = ['follow', 'request', 'followback', 'respond'].includes(action.kind);
  const tone = positive
    ? 'bg-ai text-kinari-light hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#1a1a1a]'
    : 'bg-kinari-light text-sumi hover:bg-sumi hover:text-kinari-light';

  return (
    <div className="inline-flex flex-col items-stretch gap-1">
      <button
        type="button"
        onClick={run}
        disabled={busy || state === REL.SELF}
        aria-busy={busy}
        className={`${pad} border-[3px] border-sumi font-black uppercase tracking-widest shadow-[3px_3px_0_0_#1a1a1a] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-wait inline-flex items-center justify-center gap-2 ${tone}`}
      >
        <Glyph name={ICON[action.kind] || 'userPlus'} />
        {busy ? (id ? 'Memproses…' : 'Working…') : label}
      </button>
      {errLine}
    </div>
  );
}

export default FollowButton;
