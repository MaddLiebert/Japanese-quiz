import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useSync } from './SyncContext';
import { AuthModal } from './AuthModal';

// 同期 — kartu "Akun & Sinkronisasi" untuk halaman Pengaturan.
// Jalur utama: sinkron TANPA akun (anonim per-device). Akun email opsional,
// dipakai hanya kalau mau buka progres di perangkat lain.
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

  // Aktifkan sync TANPA akun: bikin sesi anonim → progres masuk cloud.
  const doAnonymous = async () => {
    setBusy(true);
    await enableSync();
    setBusy(false);
  };

  const doSyncNow = async () => {
    setBusy(true);
    await syncNow();
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
          ? 'Simpan progres ke cloud & ikut papan peringkat. Tidak perlu daftar atau email.'
          : 'Back up progress to the cloud & join the leaderboard. No sign-up or email needed.'}
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

          {/* ── 1. Sync belum aktif: dorong aktifkan (tanpa akun) ── */}
          {!enabled && (
            <div className="border-t-[3px] border-sumi/10 pt-4">
              <label className="block text-[10px] uppercase tracking-[0.25em] font-bold text-sumi/60 mb-2">
                {id ? 'Simpan Progres ke Cloud' : 'Save Progress to Cloud'}
              </label>
              <p className="text-[11px] text-sumi/60 font-semibold mb-3 leading-relaxed">
                {id
                  ? 'Sekali klik, langsung jalan — tanpa daftar, tanpa email. Progresmu tersimpan ke cloud otomatis.'
                  : 'One click and it just works — no sign-up, no email. Your progress is saved to the cloud automatically.'}
              </p>

              <button
                type="button"
                onClick={doAnonymous}
                disabled={busy}
                className="w-full sm:w-auto py-3 px-6 border-[3px] border-sumi font-black text-xs uppercase tracking-widest bg-ai text-kinari-light shadow-[3px_3px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#1a1a1a] transition-all disabled:opacity-50 cursor-pointer"
              >
                {busy ? (id ? 'Mengaktifkan…' : 'Enabling…') : (id ? '⚡ Aktifkan Sinkronisasi' : '⚡ Enable Sync')}
              </button>

              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="text-[10px] uppercase tracking-[0.15em] font-bold text-sumi/50 hover:text-shu underline cursor-pointer"
                >
                  {id ? 'Sudah punya akun? Masuk / daftar' : 'Already have an account? Sign in / sign up'}
                </button>
              </div>

              <p className="text-[10px] text-sumi/40 font-semibold mt-3 leading-relaxed">
                {id
                  ? 'Tanpa akun, progres terikat ke perangkat ini. Mau dibuka di HP/laptop lain? Bikin akun kapan saja (opsional).'
                  : 'Without an account, progress is tied to this device. Want it on another phone/laptop? Create an account anytime (optional).'}
              </p>
            </div>
          )}

          {/* ── 2. Aktif tapi masih tamu (anonim) ── */}
          {enabled && !isSignedIn && (
            <div className="border-t-[3px] border-sumi/10 pt-4">
              <label className="block text-[10px] uppercase tracking-[0.25em] font-bold text-sumi/60 mb-2">
                {id ? 'Tersinkron sebagai Tamu' : 'Synced as Guest'}
              </label>
              <p className="text-[11px] text-sumi/60 font-semibold mb-3 leading-relaxed">
                {id
                  ? 'Progresmu aman di cloud untuk perangkat ini. Tidak perlu email.'
                  : 'Your progress is safe in the cloud for this device. No email needed.'}
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={doSyncNow}
                  disabled={busy || status === 'syncing'}
                  className="py-3 px-5 border-[3px] border-sumi font-bold text-xs uppercase tracking-widest bg-kinari-light text-sumi shadow-[3px_3px_0_0_#1a1a1a] hover:bg-sumi hover:text-kinari-light transition-all disabled:opacity-50 cursor-pointer"
                >
                  {id ? 'Sync Sekarang' : 'Sync Now'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="py-3 px-5 border-[3px] border-sumi/40 font-bold text-xs uppercase tracking-widest bg-kinari-light text-sumi/60 hover:text-sumi transition-all cursor-pointer"
                >
                  {id ? 'Pakai Akun (opsional)' : 'Use an Account (optional)'}
                </button>
              </div>
              <p className="text-[10px] text-sumi/40 font-semibold mt-2 leading-relaxed">
                {id
                  ? 'Akun cuma perlu kalau mau buka progres di perangkat lain atau ganti HP.'
                  : 'An account is only needed to open your progress on another device or switch phones.'}
              </p>
            </div>
          )}

          {/* ── 3. Sudah pakai akun (email) ── */}
          {enabled && isSignedIn && (
            <div className="border-t-[3px] border-sumi/10 pt-4">
              <label className="block text-[10px] uppercase tracking-[0.25em] font-bold text-sumi/60 mb-2">
                {id ? 'Akun' : 'Account'}
              </label>
              <p className="text-[11px] text-sumi/60 font-semibold mb-3 leading-relaxed">
                {id
                  ? <>Masuk sebagai <span className="font-black text-sumi">{user?.email}</span>. Progresmu bisa dibuka di perangkat lain.</>
                  : <>Signed in as <span className="font-black text-sumi">{user?.email}</span>. Your progress opens on other devices.</>}
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={doSyncNow}
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
                {id ? 'ID' : 'ID'}: {user.email || (id ? 'Tamu (perangkat ini)' : 'Guest (this device)')} · {String(user.id).slice(0, 8)}…
              </span>
            </div>
          )}

          {/* Kuota harian — pengaman tier gratis (transparan ke user) */}
          {quota && enabled && (
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

      {/* Popup Masuk / Daftar (opsional) */}
      <AuthModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

export default SyncSettings;
