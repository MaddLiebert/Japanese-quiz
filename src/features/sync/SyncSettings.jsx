import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useSync } from './SyncContext';
import { AuthModal } from './AuthModal';

// 同期 — kartu "Akun & Sinkronisasi" untuk halaman Pengaturan.
// Semua form login/daftar kini di dalam popup (AuthModal) supaya rapi.
export function SyncSettings() {
  const { language } = useLanguage();
  const id = language === 'id';
  const {
    configured, enabled, status, lastSyncedAt, user, isSignedIn,
    enableSync, disableSync, syncNow, signOut, getQuota,
  } = useSync();

  const [modalOpen, setModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const quota = getQuota ? getQuota() : null;

  const statusLabel = {
    idle: id ? 'Nonaktif' : 'Off',
    syncing: id ? 'Menyinkron…' : 'Syncing…',
    synced: id ? 'Tersinkron' : 'Synced',
    offline: id ? 'Luring' : 'Offline',
    error: id ? 'Gagal (dicoba ulang otomatis)' : 'Error (auto-retrying)',
    quota: id ? 'Kuota harian tercapai' : 'Daily quota reached',
  }[status] || status;

  const lastLabel = lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : '—';

  // Pakai tanpa akun: sesi anonim (progres tetap, tapi terikat perangkat ini).
  const doAnonymous = async () => {
    setBusy(true);
    await enableSync();
    setBusy(false);
  };

  return (
    <div className="border-[3px] border-sumi/20 bg-kinari p-6">
      <div className="flex items-center justify-between gap-4 mb-1">
        <label className="block text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/60">
          {id ? 'Akun & Sinkronisasi' : 'Account & Sync'}
        </label>
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-sumi/50">同期</span>
      </div>
      <p className="text-xs text-sumi/70 font-semibold mb-4">
        {id
          ? 'Simpan progres ke cloud, main di perangkat lain, dan ikut papan peringkat.'
          : 'Back up progress to the cloud, play across devices, and join the leaderboard.'}
      </p>

      {!configured ? (
        <div className="border-[3px] border-sumi/20 bg-kinari-light p-4 text-xs font-bold text-sumi/60">
          {id
            ? 'Backend belum dikonfigurasi (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Lihat supabase/schema.sql & .env.example.'
            : 'Backend not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). See supabase/schema.sql & .env.example.'}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Status baris */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="border-[3px] border-sumi/20 bg-kinari-light px-4 py-3">
              <span className="text-[9px] uppercase tracking-[0.25em] font-bold text-sumi/50 block">
                {id ? 'Status' : 'Status'}
              </span>
              <span className="text-sm font-black text-sumi">{statusLabel}</span>
            </div>
            <div className="border-[3px] border-sumi/20 bg-kinari-light px-4 py-3">
              <span className="text-[9px] uppercase tracking-[0.25em] font-bold text-sumi/50 block">
                {id ? 'Terakhir sync' : 'Last synced'}
              </span>
              <span className="text-sm font-black text-sumi">{lastLabel}</span>
            </div>
          </div>

          {/* ── Belum punya akun (anonim / belum aktif) ── */}
          {!isSignedIn && (
            <div className="border-t-[3px] border-sumi/10 pt-4">
              <label className="block text-[10px] uppercase tracking-[0.25em] font-bold text-sumi/60 mb-2">
                {id ? 'Amankan Progresmu' : 'Save Your Progress'}
              </label>
              <p className="text-[11px] text-sumi/60 font-semibold mb-3 leading-relaxed">
                {id
                  ? 'Masuk atau daftar supaya progresmu tersimpan ke cloud dan bisa dibuka di perangkat lain.'
                  : 'Sign in or create an account so your progress is saved to the cloud and opens on other devices.'}
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="py-3 px-6 border-[3px] border-sumi font-black text-xs uppercase tracking-widest bg-ai text-kinari-light shadow-[3px_3px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#1a1a1a] transition-all cursor-pointer"
                >
                  {id ? 'Masuk / Daftar' : 'Sign in / Sign up'}
                </button>
                {!enabled && (
                  <button
                    type="button"
                    onClick={doAnonymous}
                    disabled={busy}
                    className="py-3 px-5 border-[3px] border-sumi/40 font-bold text-xs uppercase tracking-widest bg-kinari-light text-sumi/60 hover:text-sumi transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {id ? 'Lewati (tanpa akun)' : 'Skip (no account)'}
                  </button>
                )}
              </div>
              <p className="text-[10px] text-sumi/40 font-semibold mt-2 leading-relaxed">
                {id
                  ? '"Lewati" tetap menyimpan progres, tapi hanya bisa dibuka di perangkat ini.'
                  : '"Skip" still saves progress, but only on this device.'}
              </p>
            </div>
          )}

          {/* ── Sudah punya akun ── */}
          {isSignedIn && (
            <div className="border-t-[3px] border-sumi/10 pt-4">
              <label className="block text-[10px] uppercase tracking-[0.25em] font-bold text-sumi/60 mb-2">
                {id ? 'Akun' : 'Account'}
              </label>
              <p className="text-[11px] text-sumi/60 font-semibold mb-3 leading-relaxed">
                {id
                  ? <>Masuk sebagai <span className="font-black text-sumi">{user?.email}</span>. Progresmu aman & bisa dibuka di perangkat lain.</>
                  : <>Signed in as <span className="font-black text-sumi">{user?.email}</span>. Your progress is safe and opens on other devices.</>}
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={async () => { setBusy(true); await syncNow(); setBusy(false); }}
                  disabled={busy || status === 'syncing'}
                  className="py-3 px-5 border-[3px] border-sumi font-bold text-xs uppercase tracking-widest bg-kinari-light text-sumi shadow-[3px_3px_0_0_#1a1a1a] hover:bg-sumi hover:text-kinari-light transition-all disabled:opacity-50 cursor-pointer"
                >
                  {id ? 'Sync Sekarang' : 'Sync Now'}
                </button>
                <button
                  type="button"
                  onClick={async () => { setBusy(true); await signOut(); setBusy(false); }}
                  disabled={busy}
                  className="py-3 px-5 border-[3px] border-sumi/40 font-bold text-xs uppercase tracking-widest bg-kinari-light text-sumi/60 hover:text-shu transition-all disabled:opacity-50 cursor-pointer"
                >
                  {id ? 'Keluar / Ganti Akun' : 'Sign out / Switch account'}
                </button>
              </div>
            </div>
          )}

          {/* Matikan sync (kalau aktif) */}
          {enabled && (
            <div className="border-t-[3px] border-sumi/10 pt-4">
              <button
                type="button"
                onClick={disableSync}
                disabled={busy}
                className="text-[10px] uppercase tracking-[0.15em] font-bold text-sumi/50 hover:text-shu underline disabled:opacity-40 cursor-pointer"
              >
                {id ? 'Matikan sinkronisasi di perangkat ini' : 'Disable sync on this device'}
              </button>
            </div>
          )}

          {/* Info user */}
          {user && (
            <div className="border-t-[3px] border-sumi/10 pt-4">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-sumi/50 break-all">
                {id ? 'ID' : 'ID'}: {user.email || (id ? 'Anonim' : 'Anonymous')} · {String(user.id).slice(0, 8)}…
              </span>
            </div>
          )}

          {/* Kuota harian — pengaman tier gratis (transparan ke user) */}
          {quota && (
            <div className="border-t-[3px] border-sumi/10 pt-4">
              <label className="block text-[10px] uppercase tracking-[0.25em] font-bold text-sumi/60 mb-2">
                {id ? 'Kuota Harian Perangkat Ini' : 'Daily Quota (This Device)'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { k: 'write', label: id ? 'Simpan' : 'Save' },
                  { k: 'read', label: id ? 'Baca' : 'Read' },
                  { k: 'auth', label: id ? 'Masuk' : 'Sign-in' },
                ].map(({ k, label }) => {
                  const q = quota[k];
                  const pct = q.limit ? Math.min(100, Math.round((q.used / q.limit) * 100)) : 0;
                  return (
                    <div key={k} className="border-[3px] border-sumi/20 bg-kinari-light px-3 py-2">
                      <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-sumi/50 block">{label}</span>
                      <span className="text-xs font-black text-sumi tabular-nums">{q.used}/{q.limit}</span>
                      <div className="h-1.5 bg-sumi/10 mt-1.5 overflow-hidden">
                        <div className={`h-full ${pct > 80 ? 'bg-shu' : 'bg-ai'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] font-bold text-sumi/40 mt-2 leading-relaxed">
                {id
                  ? 'Batas harian otomatis per-perangkat — melindungi kuota gratis Supabase. Reset tiap tengah malam UTC.'
                  : 'Automatic per-device daily caps — protect the free Supabase quota. Resets daily at UTC midnight.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Popup Masuk / Daftar */}
      <AuthModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

export default SyncSettings;
