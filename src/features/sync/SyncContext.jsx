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
// `enabled` default: true kalau Supabase dikonfigurasi DAN sudah ada progres lokal
// (supaya user yang sudah main otomatis ikut cloud tanpa langkah manual).
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { onStorageChange } from './storageBus';
import {
  readBundle, writeBundle, touchMeta, readMeta, ENABLED_KEY,
} from './syncStore';
import { mergeBundles } from './merge';

const SyncContext = createContext(null);

export const useSync = () => {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used within a SyncProvider');
  return ctx;
};

const PUSH_DEBOUNCE_MS = 4000;      // jeda setelah perubahan terakhir
const PERIODIC_MS = 60000;          // push berkala kalau masih dirty
const SIGNED_IN_FLAG = 'sync_was_signed_in_v1';

export function SyncProvider({ children }) {
  const [ready, setReady] = useState(!isSupabaseConfigured); // siap = tidak ada Supabase
  const [enabled, setEnabled] = useState(false);
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('idle'); // idle|syncing|synced|offline|error
  const [lastSyncedAt, setLastSyncedAt] = useState(0);

  const dirtyRef = useRef(false);
  const pushTimerRef = useRef(null);
  const busyRef = useRef(false);
  const enabledRef = useRef(false);
  const userRef = useRef(null);

  useEffect(() => { enabledRef.current = enabled; }, [enabled]);
  useEffect(() => { userRef.current = user; }, [user]);

  const schedulePush = useCallback((delay = PUSH_DEBOUNCE_MS) => {
    if (!enabledRef.current || !userRef.current) return;
    dirtyRef.current = true;
    clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => { pushNow(); }, delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push bundle lokal → tabel profiles. Bump updatedAt dulu (data kita = terbaru).
  const pushNow = useCallback(async () => {
    if (!enabledRef.current || !userRef.current || busyRef.current) return;
    busyRef.current = true;
    setStatus('syncing');
    try {
      touchMeta();
      const bundle = readBundle();
      const { bundleToProfile } = await import('./syncStore');
      const row = bundleToProfile(bundle, userRef.current.id);
      const { error } = await supabase.from('profiles').upsert(row, { onConflict: 'id' });
      if (error) throw error;
      dirtyRef.current = false;
      setLastSyncedAt(Date.now());
      setStatus('synced');
    } catch {
      setStatus('error');
      // biarkan dirty=true → dicoba lagi di interval berikutnya
    } finally {
      busyRef.current = false;
    }
  }, []);

  // Pull remote → merge → tulis lokal. Return true kalau data lokal diganti remote.
  const pullAndMerge = useCallback(async () => {
    if (!userRef.current) return false;
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
        await pushNow();
        return false;
      }

      const { profileToBundle } = await import('./syncStore');
      const remote = profileToBundle(data);
      const { winner, bundle } = mergeBundles(local, remote);

      if (winner === 'remote') {
        writeBundle(localStorage, bundle);
        touchMeta(localStorage, bundle.updatedAt || Date.now());
        return true; // pemanggil sebaiknya reload
      }

      // lokal menang / seri → pastikan remote ikut (kalau seri & berbeda, dorong lokal).
      dirtyRef.current = true;
      busyRef.current = false;
      await pushNow();
      setLastSyncedAt(Date.now());
      setStatus('synced');
      return false;
    } catch {
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
        try {
          const { data, error } = await supabase.auth.signInAnonymously();
          if (!error) session = data.session;
        } catch { /* offline → coba lagi nanti */ }
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
        if (alive && changed) window.location.reload();
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      userRef.current = session?.user || null;
      setUser(session?.user || null);
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
      await pushNow();
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

  // Sync manual: tarik remote → merge; kalau remote menang, reload.
  const syncNow = useCallback(async () => {
    if (!isSupabaseConfigured || !userRef.current) return { ok: false, reason: 'no-user' };
    const changed = await pullAndMerge();
    if (changed) window.location.reload();
    return { ok: true, changed };
  }, [pullAndMerge]);

  // Upgrade anonim → email (progres TIDAK hilang; identitas ditautkan).
  const upgradeToEmail = useCallback(async (email) => {
    if (!isSupabaseConfigured) return { ok: false, reason: 'unconfigured' };
    try {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: 'update', message: String(e?.message || e) };
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

  const isAnon = Boolean(user && (user.is_anonymous === true || (user.is_anonymous == null && !user.email)));

  const value = {
    ready, enabled, status, lastSyncedAt,
    user, isAnon,
    configured: isSupabaseConfigured,
    enableSync, disableSync, syncNow, upgradeToEmail, signOut,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export default SyncProvider;
