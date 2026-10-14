import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useSync } from './SyncContext';

// ── Ikon mata (lihat / sembunyikan sandi) ────────────────────────────────────
function EyeIcon({ open }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
      {open ? (
        <>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.4 4.3M6.6 6.6A17.5 17.5 0 0 0 2 11s3.5 7 10 7a9.2 9.2 0 0 0 4.1-.9" />
          <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
          <path d="m2 2 20 20" />
        </>
      )}
    </svg>
  );
}

// ── Satu kolom sandi + tombol mata ──────────────────────────────────────────
function PasswordField({ value, onChange, placeholder, autoComplete, id }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full border-[3px] border-sumi bg-kinari-light pl-4 pr-12 py-3 text-sm font-bold text-sumi placeholder:text-sumi/40 focus:outline-none"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Sembunyikan sandi' : 'Lihat sandi'}
        title={show ? 'Sembunyikan sandi' : 'Lihat sandi'}
        className="absolute right-0 top-0 h-full w-12 flex items-center justify-center text-sumi/50 hover:text-sumi transition-colors cursor-pointer"
        tabIndex={-1}
      >
        <EyeIcon open={show} />
      </button>
    </div>
  );
}

// ── Terjemahkan pesan error Supabase → bahasa manusia ───────────────────────
// Khusus: rate limit email (bawaan Supabase ~2-4 email/jam tanpa SMTP sendiri).
function humanError(raw, id) {
  const m = String(raw || '');
  if (/over_email_send_rate_limit|email rate limit exceeded|rate limit/i.test(m)) {
    return id
      ? 'Terlalu banyak permintaan email. Tunggu ±1 jam lalu coba lagi. (Sementara: pakai email + sandi di tab Daftar — tidak perlu email sama sekali.)'
      : 'Too many email requests. Wait about an hour and retry. (Meanwhile: use email + password in the Sign up tab — no email needed.)';
  }
  if (/over_request_rate_limit|Too many requests/i.test(m)) {
    return id ? 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.' : 'Too many attempts. Wait a moment and retry.';
  }
  if (/Invalid login credentials/i.test(m)) return id ? 'Email atau sandi salah.' : 'Wrong email or password.';
  if (/already registered|already been registered|User already registered/i.test(m)) {
    return id ? 'Email ini sudah terdaftar — coba tab Masuk.' : 'This email is already registered — try the Sign in tab.';
  }
  if (/Password should be at least/i.test(m)) return id ? 'Sandi minimal 6 karakter.' : 'Password must be at least 6 characters.';
  if (/invalid-email|invalid email/i.test(m)) return id ? 'Format email tidak valid.' : 'Invalid email format.';
  if (/Email not confirmed/i.test(m)) return id ? 'Email belum dikonfirmasi — cek inbox lalu klik tautannya.' : 'Email not confirmed — check your inbox and click the link.';
  if (/unconfigured/i.test(m)) return id ? 'Backend belum dikonfigurasi.' : 'Backend not configured.';
  return m || (id ? 'Gagal. Coba lagi.' : 'Failed. Try again.');
}

// ── Modal Masuk / Daftar 同期 ────────────────────────────────────────────────
// Popup dengan dua tab (Masuk / Daftar), sandi + ikon mata, dan opsi
// "kirim tautan masuk" (magic link) tanpa sandi.
export function AuthModal({ open, onClose, initialTab = 'signin' }) {
  const { language } = useLanguage();
  const id = language === 'id';
  const {
    signInWithPassword, registerWithPassword, resetPassword, signInWithEmailLink,
  } = useSync();

  const [tab, setTab] = useState(initialTab); // 'signin' | 'register' | 'link'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);
  const [cooldown, setCooldown] = useState(0); // detik sisa sebelum boleh kirim email lagi

  // Hitung mundur cooldown (cegah spam email → hindari limit Supabase).
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Reset isi tiap kali modal dibuka.
  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setEmail(''); setPassword(''); setNote(null); setBusy(false);
    }
  }, [open, initialTab]);

  // Tutup dengan tombol Esc + kunci scroll latar.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setNote(null);
    let r;
    if (tab === 'register') {
      r = await registerWithPassword(email, password);
    } else {
      r = await signInWithPassword(email, password);
    }
    if (r.ok) {
      setNote({ ok: true, msg: tab === 'register'
        ? (id ? 'Akun dibuat — progresmu aman.' : 'Account created — your progress is safe.')
        : (id ? 'Masuk berhasil.' : 'Signed in.') });
      setTimeout(() => onClose(), 900);
    } else {
      setNote({ ok: false, msg: humanError(r.message || r.reason, id) });
    }
    setBusy(false);
  };

  const sendLink = async () => {
    if (!emailOk) { setNote({ ok: false, msg: id ? 'Masukkan email yang valid dulu.' : 'Enter a valid email first.' }); return; }
    setBusy(true); setNote(null);
    const r = await signInWithEmailLink(email);
    if (r.ok) {
      setCooldown(60);
      setNote({ ok: true, msg: id
        ? `Tautan masuk terkirim ke ${r.email}. Buka inbox (cek Spam) lalu klik tautannya.`
        : `Sign-in link sent to ${r.email}. Open your inbox (check Spam) and click the link.` });
    } else {
      setNote({ ok: false, msg: humanError(r.message || r.reason, id) });
    }
    setBusy(false);
  };

  const doReset = async () => {
    if (!emailOk) { setNote({ ok: false, msg: id ? 'Isi emailmu dulu untuk reset.' : 'Enter your email to reset.' }); return; }
    setBusy(true);
    const r = await resetPassword(email);
    if (r.ok) setCooldown(60);
    setNote(r.ok
      ? { ok: true, msg: id ? 'Tautan reset terkirim — cek email.' : 'Reset link sent — check your email.' }
      : { ok: false, msg: humanError(r.message || r.reason, id) });
    setBusy(false);
  };

  const tabs = [
    { k: 'signin', label: id ? 'Masuk' : 'Sign in' },
    { k: 'register', label: id ? 'Daftar' : 'Sign up' },
  ];

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-sumi/60 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md border-[3px] border-sumi bg-kinari shadow-[6px_6px_0_0_#1a1a1a] max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b-[3px] border-sumi/15 px-5 py-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-serif font-black text-sumi">
              {tab === 'register' ? (id ? 'Buat Akun' : 'Create Account') : (id ? 'Masuk' : 'Sign in')}
            </h3>
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/40">同期</span>
          </div>
          <button
            type="button" onClick={onClose} aria-label={id ? 'Tutup' : 'Close'}
            className="w-8 h-8 flex items-center justify-center border-[3px] border-sumi/30 text-sumi/60 hover:text-shu hover:border-shu transition-colors cursor-pointer text-lg leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-5">
          <p className="text-[11px] text-sumi/60 font-semibold mb-4 leading-relaxed">
            {id
              ? 'Simpan progres ke cloud & main di perangkat lain. Progresmu saat ini tetap aman.'
              : 'Back up your progress to the cloud & play on other devices. Your current progress stays safe.'}
          </p>

          {/* Tab Masuk / Daftar */}
          <div className="grid grid-cols-2 gap-0 border-[3px] border-sumi mb-5">
            {tabs.map((t) => (
              <button
                key={t.k}
                type="button"
                onClick={() => { setTab(t.k); setNote(null); }}
                className={`py-2.5 text-[11px] uppercase tracking-widest font-black transition-colors cursor-pointer ${
                  tab === t.k ? 'bg-sumi text-kinari-light' : 'bg-kinari-light text-sumi/60 hover:text-sumi'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Form email + sandi */}
          <form onSubmit={submit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={id ? 'email@kamu.com' : 'you@email.com'}
              autoComplete="email"
              className="w-full border-[3px] border-sumi bg-kinari-light px-4 py-3 text-sm font-bold text-sumi placeholder:text-sumi/40 focus:outline-none"
            />
            <PasswordField
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={tab === 'register'
                ? (id ? 'Sandi (min. 6 karakter)' : 'Password (min. 6 chars)')
                : (id ? 'Sandi' : 'Password')}
              autoComplete={tab === 'register' ? 'new-password' : 'current-password'}
            />

            <button
              type="submit"
              disabled={busy || !emailOk || password.length < 6}
              className="w-full py-3 px-5 border-[3px] border-sumi font-black text-xs uppercase tracking-widest bg-ai text-kinari-light shadow-[3px_3px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#1a1a1a] transition-all disabled:opacity-40 cursor-pointer"
            >
              {busy ? (id ? 'Memproses…' : 'Working…')
                : tab === 'register'
                  ? (id ? 'Daftar & Amankan Progres' : 'Sign up & Save Progress')
                  : (id ? 'Masuk' : 'Sign in')}
            </button>
          </form>

          {tab === 'signin' && (
            <div className="text-center mt-3">
              <button
                type="button" onClick={doReset} disabled={busy}
                className="text-[10px] uppercase tracking-[0.15em] font-bold text-sumi/50 hover:text-shu underline disabled:opacity-40 cursor-pointer"
              >
                {id ? 'Lupa sandi?' : 'Forgot password?'}
              </button>
            </div>
          )}

          {/* Pemisah */}
          <div className="flex items-center gap-3 my-5">
            <div className="h-[2px] flex-1 bg-sumi/10" />
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-sumi/40">{id ? 'atau' : 'or'}</span>
            <div className="h-[2px] flex-1 bg-sumi/10" />
          </div>

          {/* Magic link — tanpa sandi */}
          <button
            type="button"
            onClick={sendLink}
            disabled={busy || !emailOk || cooldown > 0}
            className="w-full py-3 px-5 border-[3px] border-sumi font-bold text-xs uppercase tracking-widest bg-kinari-light text-sumi hover:bg-sumi hover:text-kinari-light transition-all disabled:opacity-40 cursor-pointer"
          >
            {cooldown > 0
              ? `⏳ ${id ? 'Tunggu' : 'Wait'} ${cooldown}s`
              : <>✉️ {id ? 'Kirim Tautan Masuk (tanpa sandi)' : 'Send Sign-in Link (no password)'}</>}
          </button>
          <p className="text-[10px] text-sumi/45 font-semibold mt-2 leading-relaxed">
            {id
              ? 'Kami kirim tautan ke emailmu — klik dan kamu langsung masuk. Tanpa sandi, tanpa daftar.'
              : 'We email you a link — click it and you’re in. No password, no sign-up.'}
          </p>

          {note && (
            <p className={`text-[11px] font-bold mt-4 leading-relaxed ${note.ok ? 'text-ai' : 'text-shu'}`}>
              {note.msg}
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default AuthModal;
