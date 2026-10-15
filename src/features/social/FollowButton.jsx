// FollowButton.jsx — tombol aksi 友達 (docs/friends.md §7).
//
// Dipakai di TIGA tempat supaya perilakunya SELALU sama: halaman /friends,
// modal 訪問, dan halaman /u/:id. Label + aksi diturunkan dari `rel_state`
// lewat modul murni `socialView.js` (satu sumber kebenaran).
//
// Alur: klik → RPC (request/respond/unfollow) → panggil `onChanged(stateBaru)`
// supaya pemanggil menyegarkan daftar/state. Sedang menulis → disabled.
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

  const action = actionFor(state, isPublic);
  if (!action || !targetId) return null;

  const label = id ? action.labelId : action.labelEn;

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
    onChanged?.(res?.data || null);
  };

  // Gaya: aksi positif (follow/minta/terima/followback) = navy CTA (bg-ai);
  // sudah berteman / mengikuti = outline; menunggu = redup.
  const positive = ['follow', 'request', 'followback', 'respond'].includes(action.kind);
  const tone = positive
    ? 'bg-ai text-kinari-light hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#1a1a1a]'
    : 'bg-kinari-light text-sumi hover:bg-sumi hover:text-kinari-light';
  const pad = size === 'sm' ? 'py-1.5 px-3 text-[10px]' : 'py-2.5 px-4 text-xs';

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
      {err && <span className="text-[9px] font-bold text-shu text-center">{err}</span>}
    </div>
  );
}

export default FollowButton;
