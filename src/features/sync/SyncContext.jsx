// ─────────────────────────────────────────────────────────────────────────────
// SyncContext.jsx — akun + sinkronisasi progres + leaderboard.
//
// Model akun: ANONIM per-device (Supabase Anonymous Sign-In). Bisa di-upgrade ke
// email tanpa kehilangan progres (identitas anonim ditautkan).
//
// Alur sync (tanpa mengedit ProgressContext — lihat storageBus.js):
//   1. Pastikan ada sesi (anon) → kalau sync diaktifkan & sudah ada data lokal.
//   2. Saat halaman dibuka: PULL baris remote → merge (merge.js) → kalau remote
//      menang, tulis ke localStorage + reload agar UI memuat data terbaru.
//   3. Setiap key sync berubah (storageBus) → tandai "dirty" → PUSH (debounce).
//   4. Interval berkala + saat tab kembali fokus → push kalau dirty.
//
// ── PENGAMAN KUOTA (tier GRATIS Vercel + Supabase) ──────────────────────────
// Semua request lewat rem di rateLimit.js supaya TIDAK meledak:
//   • Kuota HARIAN per-perangkat (write/read/auth) — fail-open, jaring terakhir.
//   • Jeda MINIMUM antar tulis (15 dtk) → main kuis tidak jadi ratusan upsert.
//   • BACKOFF eksponensial saat gagal beruntun (bukan hammering tiap 60 dtk).
//   • GUARD reload-loop → merge yang salah tidak memicu badai reload/request.
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { onStorageChange } from './storageBus';
import {
  readBundle, writeBundle, touchMeta, ENABLED_KEY,
} from './syncStore';
import { mergeBundles } from './merge';
import {
  consume, writeCooldown, markWrite, backoffDelay, canReload, markReload, quotaSummary,
} from './rateLimit';

const SyncContext = createContext(null);

export const useSync = () => {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used within a SyncProvider');
  return ctx;
};

const PUSH_DEBOUNCE_MS = 4000;      // jeda setelah perubahan terakhir
const PERIODIC_MS = 60000;          // push berkala kalau masih dirty
const SIGNED_IN_FLAG = 'sync_was_signed_in_v1';

const storage = () => {
  try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; }
};

export function SyncProvider({ children }) {
  const [ready, setReady] = useState(!isSupabaseConfigured); // siap = tidak ada Supabase
  const [enabled, setEnabled] = useState(false);
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('idle'); // idle|syncing|synced|offline|error|quota
  const [lastSyncedAt, setLastSyncedAt] = useState(0);

  const dirtyRef = useRef(false);
  const pushTimerRef = useRef(null);
  const busyRef = useRef(false);
  const enabledRef = useRef(false);
  const userRef = useRef(null);
  const failRef = useRef(0);         // gagal beruntun → dasar backoff
  const lastFailAtRef = useRef(0);
  const schedulePushRef = useRef(null); // diisi di bawah (hindari siklus dependensi)

  useEffect(() => { enabledRef.current = enabled; }, [enabled]);
  useEffect(() => { userRef.current = user; }, [user]);

  // Reload aman: hanya kalau guard mengizinkan (cegah reload-loop = badai request).
  const safeReload = useCallback(() => {
    const s = storage();
    if (canReload(s)) {
      markReload(s);
      window.location.reload();
      return true;
    }
    return false; // dalam jeda → lewati reload, cukup andalkan state lokal
  }, []);

  // Push bundle lokal → tabel profiles. Bump updatedAt dulu (data kita = terbaru).
  const pushNow = useCallback(async (opts = {}) => {
    if (!enabledRef.current || !userRef.current || busyRef.current) return { ok: false };

    // 1) Backoff setelah gagal beruntun.
    const wait = backoffDelay(failRef.current);
    if (wait > 0 && Date.now() - lastFailAtRef.current < wait) {
      return { ok: false, reason: 'backoff' };
    }

    // 2) Jeda minimum antar tulis (kecuali dipaksa, mis. user klik manual).
    const cd = writeCooldown(storage());
    if (cd > 0 && !opts.force) {
      schedulePushRef.current?.(cd + 500); // coba lagi setelah jeda
      return { ok: false, reason: 'cooldown' };
    }

    // 3) Kuota harian (jaring terakhir).
    const q = consume(storage(), 'write');
    if (!q.ok) {
      setStatus('quota');
      return { ok: false, reason: 'quota' };
    }

    busyRef.current = true;
    setStatus('syncing');
    try {
      touchMeta();
      const bundle = readBundle();
      const { bundleToProfile } = await import('./syncStore');
      const row = bundleToProfile(bundle, userRef.current.id);
      const { error } = await supabase.from('profiles').upsert(row, { onConflict: 'id' });
      if (error) throw error;
      markWrite(storage());
      failRef.current = 0;
      dirtyRef.current = false;
      setLastSyncedAt(Date.now());
      setStatus('synced');
      return { ok: true };
    } catch (e) {
      failRef.current += 1;
      lastFailAtRef.current = Date.now();
      setStatus('error');
      // biarkan dirty=true → dicoba lagi (dengan backoff) di interval berikutnya
      return { ok: false, reason: 'error', message: String(e?.message || e) };
    } finally {
      busyRef.current = false;
    }
  }, []);

  const schedulePush = useCallback((delay = PUSH_DEBOUNCE_MS) => {
    if (!enabledRef.current || !userRef.current) return;
    dirtyRef.current = true;
    clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => { pushNow(); }, delay);
  }, [pushNow]);

  // Simpan ref agar pushNow bisa menjadwalkan ulang tanpa siklus dependensi.
  useEffect(() => { schedulePushRef.current = schedulePush; }, [schedulePush]);

  // Pull remote → merge → tulis lokal. Return true kalau data lokal diganti remote.
  const pullAndMerge = useCallback(async () => {
    if (!userRef.current) return false;
    const q = consume(storage(), 'read');
    if (!q.ok) { setStatus('quota'); return false; }
    setStatus('syncing');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userRef.current.id)
        .maybeSingle();
      if (error) throw error;

      const local = readBundle();
      if (!data) {
        // Belum ada baris remote → push data lokal.
        busyRef.current = false;
        await pushNow({ force: true });
        return false;
      }

      const { profileToBundle } = await import('./syncStore');
      const remote = profileToBundle(data);
      const { winner, bundle } = mergeBundles(local, remote);

      if (winner === 'remote') {
        writeBundle(localStorage, bundle);
        touchMeta(localStorage, bundle.updatedAt || Date.now());
        return true; // pemanggil sebaiknya reload (lewat guard)
      }

      // lokal menang / seri → pastikan remote ikut (kalau seri & berbeda, dorong lokal).
      dirtyRef.current = true;
      busyRef.current = false;
      await pushNow({ force: true });
      setLastSyncedAt(Date.now());
      setStatus('synced');
      return false;
    } catch (e) {
      failRef.current += 1;
      lastFailAtRef.current = Date.now();
      setStatus('error');
      return false;
    } finally {
      busyRef.current = false;
    }
  }, [pushNow]);

  // ── Bootstrap: sesi + pull awal ────────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let alive = true;

    (async () => {
      // Status sync tersimpan (default: aktif kalau sudah pernah main / sudah login).
      const stored = localStorage.getItem(ENABLED_KEY);
      const hasLocalData = (() => {
        try { return Boolean(localStorage.getItem('user_progress_v2')); } catch { return false; }
      })();
      const wasSignedIn = localStorage.getItem(SIGNED_IN_FLAG) === '1';
      const initialEnabled = stored == null ? (hasLocalData || wasSignedIn) : stored === '1';

      // Ambil/segarkan sesi anonim kalau perlu.
      let session = (await supabase.auth.getSession()).data.session;
      if (!session && (initialEnabled || hasLocalData)) {
        const aq = consume(storage(), 'auth'); // kuota auth (sign-in anonim)
        if (aq.ok) {
          try {
            const { data, error } = await supabase.auth.signInAnonymously();
            if (!error) session = data.session;
          } catch { /* offline → coba lagi nanti */ }
        }
      }

      if (!alive) return;
      userRef.current = session?.user || null;
      setUser(session?.user || null);
      setEnabled(initialEnabled);
      enabledRef.current = initialEnabled;
      setReady(true);

      if (initialEnabled && session) {
        localStorage.setItem(SIGNED_IN_FLAG, '1');
        const changed = await pullAndMerge();
        if (alive && changed) safeReload();
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((evt, session) => {
      userRef.current = session?.user || null;
      setUser(session?.user || null);

      // Balik dari login Google (OAuth) → sesi baru muncul di sini.
      // Aktifkan sync + tarik progres akun itu (merge), lalu reload bila perlu.
      const u = session?.user;
      const isAnonUser = u && (u.is_anonymous === true || (u.is_anonymous == null && !u.email));
      if (u && !isAnonUser && (evt === 'SIGNED_IN' || evt === 'USER_UPDATED')) {
        localStorage.setItem(ENABLED_KEY, '1');
        localStorage.setItem(SIGNED_IN_FLAG, '1');
        enabledRef.current = true;
        setEnabled(true);
        pullAndMerge().then((changed) => { if (alive && changed) safeReload(); }).catch(() => {});
      }
    });

    return () => { alive = false; sub?.subscription?.unsubscribe?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Push otomatis: storageBus (perubahan lokal) + interval + fokus tab ──────
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const off = onStorageChange(() => schedulePush());
    const onFocus = () => { if (dirtyRef.current) pushNow(); };
    const onVisible = () => { if (document.visibilityState === 'visible' && dirtyRef.current) pushNow(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    const iv = setInterval(() => { if (dirtyRef.current) pushNow(); }, PERIODIC_MS);
    return () => {
      off();
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(iv);
      clearTimeout(pushTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Aksi publik ────────────────────────────────────────────────────────────
  const enableSync = useCallback(async () => {
    if (!isSupabaseConfigured) return { ok: false, reason: 'unconfigured' };
    try {
      let session = (await supabase.auth.getSession()).data.session;
      if (!session) {
        const aq = consume(storage(), 'auth');
        if (!aq.ok) return { ok: false, reason: 'quota' };
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
        session = data.session;
      }
      localStorage.setItem(ENABLED_KEY, '1');
      localStorage.setItem(SIGNED_IN_FLAG, '1');
      enabledRef.current = true;
      setEnabled(true);
      userRef.current = session?.user || null;
      setUser(session?.user || null);
      await pushNow({ force: true });
      return { ok: true };
    } catch (e) {
      setStatus('error');
      return { ok: false, reason: 'auth', message: String(e?.message || e) };
    }
  }, [pushNow]);

  const disableSync = useCallback(() => {
    localStorage.setItem(ENABLED_KEY, '0');
    enabledRef.current = false;
    setEnabled(false);
    clearTimeout(pushTimerRef.current);
    dirtyRef.current = false;
    setStatus('idle');
  }, []);

  // Sync manual: tarik remote → merge; kalau remote menang, reload (lewat guard).
  const syncNow = useCallback(async () => {
    if (!isSupabaseConfigured || !userRef.current) return { ok: false, reason: 'no-user' };
    const changed = await pullAndMerge();
    if (changed) safeReload();
    return { ok: true, changed };
  }, [pullAndMerge, safeReload]);

  // Masuk ke akun yang sudah ada (email + password). Sesi anonim saat ini
  // digantikan; setelah masuk, tarik progres akun itu (merge) lalu reload bila
  // data remote menang. Dipakai untuk buka akun di perangkat/alamat (domain) lain.
  const signInWithPassword = useCallback(async (email, password) => {
    if (!isSupabaseConfigured) return { ok: false, reason: 'unconfigured' };
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: String(email).trim(), password,
      });
      if (error) throw error;
      localStorage.setItem(ENABLED_KEY, '1');
      localStorage.setItem(SIGNED_IN_FLAG, '1');
      enabledRef.current = true;
      setEnabled(true);
      userRef.current = data?.user || null;
      setUser(data?.user || null);
      const changed = await pullAndMerge();
      if (changed) safeReload();
      return { ok: true, changed };
    } catch (e) {
      return { ok: false, reason: 'auth', message: String(e?.message || e) };
    }
  }, [pullAndMerge, safeReload]);

  // Daftar / amankan progres: kalau ada sesi (anonim) → TAUTKAN email+password ke
  // akun itu (progres TETAP, jadi akun tetap sama); kalau tidak ada sesi → akun baru.
  const registerWithPassword = useCallback(async (email, password) => {
    if (!isSupabaseConfigured) return { ok: false, reason: 'unconfigured' };
    try {
      if (userRef.current) {
        const { error } = await supabase.auth.updateUser({
          email: String(email).trim(), password,
        });
        if (error) throw error;
        return { ok: true, linked: true };
      }
      const { error } = await supabase.auth.signUp({
        email: String(email).trim(), password,
      });
      if (error) throw error;
      return { ok: true, linked: false };
    } catch (e) {
      return { ok: false, reason: 'auth', message: String(e?.message || e) };
    }
  }, []);

  // Kirim tautan reset password ke email (butuh email asli).
  const resetPassword = useCallback(async (email) => {
    if (!isSupabaseConfigured) return { ok: false, reason: 'unconfigured' };
    const redirectTo = typeof location !== 'undefined' ? location.origin : undefined;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(String(email).trim(), { redirectTo });
      if (error) throw error;
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: 'auth', message: String(e?.message || e) };
    }
  }, []);

  // Login dengan Google (OAuth). Progres TIDAK hilang:
  //   • sudah ada sesi (anonim) → TAUTKAN identitas Google ke akun itu
  //     (linkIdentity) → akun yang sama bisa dibuka di perangkat/domain lain.
  //   • belum ada sesi → sign-in Google biasa.
  // Catatan: redirect kembali ke origin ini. Token dibaca karena
  // supabaseClient memakai detectSessionInUrl: true.
  const signInWithGoogle = useCallback(async () => {
    if (!isSupabaseConfigured) return { ok: false, reason: 'unconfigured' };
    const redirectTo = typeof location !== 'undefined' ? location.origin : undefined;
    const q = consume(storage(), 'auth');
    if (!q.ok) return { ok: false, reason: 'quota' };
    try {
      if (userRef.current) {
        const { error } = await supabase.auth.linkIdentity({
          provider: 'google',
          options: { redirectTo },
        });
        if (error) throw error;
        return { ok: true, linked: true };
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (error) throw error;
      return { ok: true, linked: false };
    } catch (e) {
      return { ok: false, reason: 'oauth', message: String(e?.message || e) };
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try { await supabase.auth.signOut(); } catch { /* noop */ }
    localStorage.removeItem(SIGNED_IN_FLAG);
    userRef.current = null;
    setUser(null);
    // Tetap `enabled` (device ini masih ingin sync); sesi anonim baru dibuat
    // otomatis pada bootstrap berikutnya.
  }, []);

  // Ringkasan kuota harian untuk ditampilkan di Settings.
  const getQuota = useCallback(() => quotaSummary(storage()), []);

  const isAnon = Boolean(user && (user.is_anonymous === true || (user.is_anonymous == null && !user.email)));

  const value = {
    ready, enabled, status, lastSyncedAt,
    user, isAnon,
    configured: isSupabaseConfigured,
    enableSync, disableSync, syncNow,
    registerWithPassword, signInWithPassword, resetPassword,
    signInWithGoogle,
    signOut, getQuota,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export default SyncProvider;
