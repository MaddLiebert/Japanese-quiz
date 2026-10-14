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
    enableSync, disableSync, syncNow,
    registerWithPassword, signInWithPassword, resetPassword,
    signInWithEmailLink,
    signOut, getQuota,
  } = useSync();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [linkEmail, setLinkEmail] = useState('');
  const [linkSent, setLinkSent] = useState(false);
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

  // Buat akun & amankan progres (tautkan email+password ke akun anonim saat ini).
  const doRegister = async (e) => {
    e.preventDefault();
    setBusy(true);
    const r = await registerWithPassword(email, password);
    setNote(r.ok
      ? { ok: true, msg: id ? 'Akun dibuat — progresmu aman. Bisa dibuka di perangkat lain.' : 'Account created — your progress is safe. Open it on another device.' }
      : { ok: false, msg: r.message || r.reason });
    setBusy(false);
    if (r.ok) { setEmail(''); setPassword(''); }
  };

  // Masuk ke akun yang sudah ada (progres akun itu ditarik otomatis).
  const doSignIn = async (e) => {
    e.preventDefault();
    setBusy(true);
    const r = await signInWithPassword(loginEmail, loginPassword);
    setNote(r.ok
      ? { ok: true, msg: id ? 'Masuk berhasil.' : 'Signed in.' }
      : { ok: false, msg: r.message || r.reason });
    setBusy(false);
    if (r.ok) { setLoginEmail(''); setLoginPassword(''); }
  };

  const doReset = async () => {
    if (!loginEmail.trim()) return;
    setBusy(true);
    const r = await resetPassword(loginEmail);
    setNote(r.ok
      ? { ok: true, msg: id ? 'Tautan reset terkirim — cek email kamu.' : 'Reset link sent — check your email.' }
      : { ok: false, msg: r.message || r.reason });
    setBusy(false);
  };

  // Kirim tautan masuk ke email (magic link) — Gmail, tanpa sandi.
  const doSendLink = async (e) => {
    if (e) e.preventDefault();
    if (!linkEmail.trim()) return;
    setBusy(true);
    setNote(null);
    const r = await signInWithEmailLink(linkEmail);
    if (r.ok) {
      setLinkSent(true);
      setNote({ ok: true, msg: id
        ? `Tautan masuk terkirim ke ${r.email}. Buka inbox (cek juga folder Spam) lalu klik tautannya.`
        : `Sign-in link sent to ${r.email}. Open your inbox (check Spam too) and click the link.` });
    } else {
      setNote({ ok: false, msg: r.message || r.reason });
    }
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

          {/* Akun — Google (utama) + email/password (cadangan) */}
          <div className="border-t-[3px] border-sumi/10 pt-4">
            <label className="block text-[10px] uppercase tracking-[0.25em] font-bold text-sumi/60 mb-2">
              {isAnon
                ? (id ? 'Amankan Progresmu' : 'Save Your Progress')
                : (id ? 'Akun' : 'Account')}
            </label>
            <p className="text-[11px] text-sumi/60 font-semibold mb-3 leading-relaxed">
              {isAnon
                ? (id
                    ? 'Masukkan email Gmail kamu — kami kirim TAUTAN MASUK ke inbox. Klik tautannya dan kamu langsung masuk. Tidak perlu sandi, tidak perlu daftar.'
                    : 'Enter your Gmail — we send a SIGN-IN LINK to your inbox. Click it and you’re in. No password, no sign-up.')
                : (id
                    ? `Sudah masuk sebagai ${user?.email || 'akun'}. Progresmu aman & bisa dibuka di perangkat lain.`
                    : `Signed in as ${user?.email || 'account'}. Your progress is safe and opens on other devices.`)}
            </p>

            {!isAnon ? (
              <button
                type="button"
                onClick={async () => { setBusy(true); await signOut(); setBusy(false); }}
                disabled={busy}
                className="py-3 px-5 border-[3px] border-sumi/40 font-bold text-xs uppercase tracking-widest bg-kinari-light text-sumi/60 hover:text-shu transition-all disabled:opacity-50 cursor-pointer"
              >
                {id ? 'Keluar / Ganti Akun' : 'Sign out / Switch account'}
              </button>
            ) : linkSent ? (
              <div className="border-[3px] border-ai bg-ai/5 p-4">
                <p className="text-sm font-black text-ai mb-1">{id ? '✓ Tautan terkirim!' : '✓ Link sent!'}</p>
                <p className="text-[11px] font-semibold text-sumi/70 leading-relaxed mb-3">
                  {id
                    ? <>Buka Gmail <span className="font-black">{linkEmail}</span> → cari email dari Supabase → klik <span className="font-black">tautan masuk</span>. Cek folder <span className="font-black">Spam</span> kalau tidak ada.</>
                    : <>Open Gmail <span className="font-black">{linkEmail}</span> → find the email from Supabase → click the <span className="font-black">sign-in link</span>. Check <span className="font-black">Spam</span> if missing.</>}
                </p>
                <button
                  type="button"
                  onClick={() => { setLinkSent(false); setNote(null); }}
                  className="text-[10px] uppercase tracking-[0.15em] font-bold text-sumi/50 hover:text-shu underline cursor-pointer"
                >
                  {id ? 'Kirim ulang / ganti email' : 'Resend / change email'}
                </button>
              </div>
            ) : (
              <>
                {/* Form magic link — cara utama, tanpa sandi */}
                <form onSubmit={doSendLink} className="space-y-3">
                  <input
                    type="email"
                    value={linkEmail}
                    onChange={(e) => setLinkEmail(e.target.value)}
                    placeholder="kamu@gmail.com"
                    autoComplete="email"
                    className="w-full border-[3px] border-sumi bg-kinari-light px-4 py-3 text-sm font-bold text-sumi placeholder:text-sumi/40 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={busy || !linkEmail.trim()}
                    className="inline-flex items-center gap-2 py-3 px-5 border-[3px] border-sumi font-bold text-xs uppercase tracking-widest bg-ai text-kinari-light shadow-[3px_3px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#1a1a1a] transition-all disabled:opacity-40 cursor-pointer"
                  >
                    ✉️ {id ? 'Kirim Tautan Masuk' : 'Send Sign-in Link'}
                  </button>
                </form>

                {/* Alternatif email+password (cadangan) */}
                <details className="mt-4 border-t-[3px] border-sumi/10 pt-3">
                  <summary className="text-[10px] uppercase tracking-[0.2em] font-bold text-sumi/50 cursor-pointer select-none">
                    {id ? 'Atau pakai email + password' : 'Or use email + password'}
                  </summary>

                  <form onSubmit={doRegister} className="space-y-3 mt-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="kamu@email.com"
                      autoComplete="email"
                      className="w-full border-[3px] border-sumi bg-kinari-light px-4 py-3 text-sm font-bold text-sumi placeholder:text-sumi/40 focus:outline-none"
                    />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={id ? 'Password (min. 6 huruf)' : 'Password (min. 6 chars)'}
                      autoComplete="new-password"
                      className="w-full border-[3px] border-sumi bg-kinari-light px-4 py-3 text-sm font-bold text-sumi placeholder:text-sumi/40 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={busy || !email.trim() || password.length < 6}
                      className="py-3 px-5 border-[3px] border-sumi font-bold text-xs uppercase tracking-widest bg-ai text-kinari-light shadow-[3px_3px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#1a1a1a] transition-all disabled:opacity-40 cursor-pointer"
                    >
                      {id ? 'Buat Akun & Amankan Progres' : 'Create Account & Save Progress'}
                    </button>
                  </form>

                  <form onSubmit={doSignIn} className="mt-4 border-t-[3px] border-sumi/10 pt-4 space-y-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-sumi/50">
                      {id ? 'Sudah punya akun? Masuk di sini' : 'Already have an account? Sign in here'}
                    </p>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="kamu@email.com"
                      autoComplete="email"
                      className="w-full border-[3px] border-sumi bg-kinari-light px-4 py-3 text-sm font-bold text-sumi placeholder:text-sumi/40 focus:outline-none"
                    />
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder={id ? 'Password' : 'Password'}
                      autoComplete="current-password"
                      className="w-full border-[3px] border-sumi bg-kinari-light px-4 py-3 text-sm font-bold text-sumi placeholder:text-sumi/40 focus:outline-none"
                    />
                    <div className="flex flex-wrap gap-3 items-center">
                      <button
                        type="submit"
                        disabled={busy || !loginEmail.trim() || !loginPassword}
                        className="py-3 px-5 border-[3px] border-sumi font-bold text-xs uppercase tracking-widest bg-kinari-light text-sumi shadow-[3px_3px_0_0_#1a1a1a] hover:bg-sumi hover:text-kinari-light transition-all disabled:opacity-40 cursor-pointer"
                      >
                        {id ? 'Masuk' : 'Sign in'}
                      </button>
                      <button
                        type="button"
                        onClick={doReset}
                        disabled={busy || !loginEmail.trim()}
                        className="text-[10px] uppercase tracking-[0.15em] font-bold text-sumi/50 hover:text-shu underline disabled:opacity-40 cursor-pointer"
                      >
                        {id ? 'Lupa password?' : 'Forgot password?'}
                      </button>
                    </div>
                  </form>
                </details>
              </>
            )}
          </div>

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
