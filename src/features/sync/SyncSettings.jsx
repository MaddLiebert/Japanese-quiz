import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useSync } from './SyncContext';

// 同期 — kartu "Akun & Sinkronisasi" untuk halaman Pengaturan.
// Anonim per-device; bisa upgrade ke email tanpa kehilangan progres.
export function SyncSettings() {
  const { language } = useLanguage();
  const id = language === 'id';
  const {
    configured, enabled, status, lastSyncedAt, user, isAnon,
    enableSync, disableSync, syncNow, upgradeToEmail, signInWithGoogle, signOut, getQuota,
  } = useSync();

  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);
  const quota = getQuota ? getQuota() : null;

  const statusLabel = {
    idle: id ? 'Nonaktif' : 'Off',
    syncing: id ? 'Menyinkron…' : 'Syncing…',
    synced: id ? 'Tersinkron' : 'Synced',
    offline: id ? 'Luring' : 'Offline',
    error: id ? 'Gagal (dicoba ulang otomatis)' : 'Error (auto-retrying)',
    quota: id ? 'Kuota harian tercapai' : 'Daily quota reached',
  }[status] || status;

  const lastLabel = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleString()
    : '—';

  const doEnable = async () => {
    setBusy(true);
    const r = await enableSync();
    setNote(r.ok ? null : { ok: false, msg: r.message || r.reason });
    setBusy(false);
  };

  const doGoogle = async () => {
    setBusy(true);
    const r = await signInWithGoogle();
    if (!r.ok) setNote({ ok: false, msg: r.message || r.reason });
    setBusy(false);
  };

  const doUpgrade = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    const r = await upgradeToEmail(email.trim());
    setNote(r.ok
      ? { ok: true, msg: id ? 'Tautkan email terkirim — cek kotak masuk untuk konfirmasi.' : 'Email link sent — check your inbox to confirm.' }
      : { ok: false, msg: r.message || r.reason });
    setBusy(false);
    if (r.ok) setEmail('');
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
          ? 'Simpan progres ke cloud, main di perangkat lain, dan ikut papan peringkat. Akun dibuat otomatis (anonim) — tidak perlu daftar.'
          : 'Back up progress to the cloud, play across devices, and join the leaderboard. An account is created automatically (anonymous) — no sign-up needed.'}
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
              <span className="text-[9px] uppercase tracking-[0.25em] font-bold text-sumi/50 block">{id ? 'Status' : 'Status'}</span>
              <span className="text-sm font-black text-sumi">{statusLabel}</span>
            </div>
            <div className="border-[3px] border-sumi/20 bg-kinari-light px-4 py-3">
              <span className="text-[9px] uppercase tracking-[0.25em] font-bold text-sumi/50 block">{id ? 'Terakhir sync' : 'Last synced'}</span>
              <span className="text-sm font-black text-sumi">{lastLabel}</span>
            </div>
          </div>

          {/* Tombol utama */}
          <div className="flex flex-wrap gap-3">
            {!enabled ? (
              <button
                type="button"
                onClick={doEnable}
                disabled={busy}
                className="py-3 px-5 border-[3px] border-sumi font-bold text-xs uppercase tracking-widest bg-ai text-kinari-light shadow-[3px_3px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#1a1a1a] transition-all disabled:opacity-50 cursor-pointer"
              >
                {id ? 'Aktifkan Sinkronisasi' : 'Enable Sync'}
              </button>
            ) : (
              <>
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
                  onClick={disableSync}
                  disabled={busy}
                  className="py-3 px-5 border-[3px] border-sumi/40 font-bold text-xs uppercase tracking-widest bg-kinari-light text-sumi/60 hover:text-shu transition-all disabled:opacity-50 cursor-pointer"
                >
                  {id ? 'Matikan Sync' : 'Disable Sync'}
                </button>
              </>
            )}
          </div>

          {/* Login Google — supaya akun & progres bisa dibuka di perangkat/alamat lain */}
          <div className="border-t-[3px] border-sumi/10 pt-4">
            <label className="block text-[10px] uppercase tracking-[0.25em] font-bold text-sumi/60 mb-2">
              {id ? 'Masuk dengan Google' : 'Sign in with Google'}
            </label>
            <p className="text-[11px] text-sumi/60 font-semibold mb-3 leading-relaxed">
              {isAnon
                ? (id
                    ? 'Tautkan akun Google supaya progresmu bisa dibuka di perangkat atau alamat (domain) lain — tidak hilang walau ganti alamat.'
                    : 'Link your Google account so your progress opens on other devices or addresses (domains) — it won’t vanish when the address changes.')
                : (id
                    ? 'Akun ini sudah tertaut ke Google.'
                    : 'This account is already linked to Google.')}
            </p>
            <button
              type="button"
              onClick={doGoogle}
              disabled={busy}
              className="inline-flex items-center gap-2 py-3 px-5 border-[3px] border-sumi font-bold text-xs uppercase tracking-widest bg-kinari-light text-sumi shadow-[3px_3px_0_0_#1a1a1a] hover:bg-sumi hover:text-kinari-light transition-all disabled:opacity-50 cursor-pointer"
            >
              <span className="font-black text-sm">G</span>
              {isAnon
                ? (id ? 'Tautkan / Masuk Google' : 'Link / Sign in Google')
                : (id ? 'Ganti akun Google' : 'Switch Google account')}
            </button>
          </div>

          {/* Upgrade ke email (hanya kalau anonim & sync aktif) */}
          {enabled && isAnon && (
            <form onSubmit={doUpgrade} className="border-t-[3px] border-sumi/10 pt-4">
              <label className="block text-[10px] uppercase tracking-[0.25em] font-bold text-sumi/60 mb-2">
                {id ? 'Simpan ke Email (opsional)' : 'Save to Email (optional)'}
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kamu@email.com"
                  className="flex-1 border-[3px] border-sumi bg-kinari-light px-4 py-3 text-sm font-bold text-sumi placeholder:text-sumi/40 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={busy || !email.trim()}
                  className="py-3 px-5 border-[3px] border-sumi font-bold text-xs uppercase tracking-widest bg-kinari-light text-sumi shadow-[3px_3px_0_0_#1a1a1a] hover:bg-sumi hover:text-kinari-light transition-all disabled:opacity-40 cursor-pointer"
                >
                  {id ? 'Tautkan' : 'Link'}
                </button>
              </div>
              <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-sumi/40 mt-2">
                {id ? 'Progresmu tetap, cuma ditautkan ke email.' : 'Your progress stays — just linked to an email.'}
              </p>
            </form>
          )}

          {/* Info user */}
          {user && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t-[3px] border-sumi/10 pt-4">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-sumi/50 break-all">
                {id ? 'ID' : 'ID'}: {user.email || (id ? 'Anonim' : 'Anonymous')} · {String(user.id).slice(0, 8)}…
              </span>
              {enabled && (
                <button
                  type="button"
                  onClick={signOut}
                  className="text-[10px] uppercase tracking-[0.2em] font-bold text-shu hover:underline cursor-pointer"
                >
                  {id ? 'Keluar dari perangkat ini' : 'Sign out on this device'}
                </button>
              )}
            </div>
          )}

          {note && (
            <p className={`text-[11px] font-bold ${note.ok ? 'text-ai' : 'text-shu'}`}>{note.msg}</p>
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
                  ? 'Batas harian otomatis per-perangkat — melindungi kuota gratis Supabase dari lonjakan. Reset tiap tengah malam UTC. Sinkronisasi hemat: jeda min. 15 dtk antar simpan, backoff saat gagal.'
                  : 'Automatic per-device daily caps — protect the free Supabase quota from spikes. Resets daily at UTC midnight. Thrifty sync: min. 15s between saves, backoff on failure.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SyncSettings;
