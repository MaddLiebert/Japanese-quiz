// ─────────────────────────────────────────────────────────────────────────────
// CinematicContext — host cinematic perkenalan era.
//
//   • AUTO-PLAY sekali: saat era aktif punya cinematic yang BELUM dilihat
//     (nextCinematic), putar lalu tandai `cinematicsSeen` (persist).
//     PENTING: kalau audio belum "unlocked" (belum ada gesture user), cinematic
//     DITAHAN sampai gesture pertama → supaya suara terdengar sejak detik ke-0
//     (bukan mulai senyap lalu menyala di tengah). Tanpa gesture, tetap aman:
//     cinematic jalan juga tanpa audio kalau browser memblokir.
//   • REPLAY manual: `play(id)` — dipakai tombol di Pengaturan / halaman Sejarah.
//   • Setelah selesai / skip, layar pilihan di dalam cinematic bisa:
//       – "Masuk ke Heian"                    → onDone (tutup, tandai dilihat)
//       – "Pelajari Sejarah Heian Lebih Lanjut" → onExplore (navigasi + tandai)
//
// WAJIB dipasang DI DALAM <BrowserRouter> karena memakai useNavigate.
// Aman kalau provider tidak dipasang → useCinematic() mengembalikan no-op.
// ─────────────────────────────────────────────────────────────────────────────
import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEra } from '../theme/EraContext';
import { useUserStats } from '../progress/ProgressContext';
import { nextCinematic, getCinematic } from './cinematics';
import { HeianCinematic } from './heian/HeianCinematic';
import { EdoCinematic } from './edo/EdoCinematic';
import { MeijiCinematic } from './meiji/MeijiCinematic';
import { ShowaCinematic } from './showa/ShowaCinematic';
import { isAudioRunning, enableHeianAudio } from './heian/heianHistoryAudio';

const CinematicContext = createContext(null);
export { CinematicContext };

// Render overlay sesuai `kind` cinematic. Tambah era baru = tambah cabang di sini.
function CinematicStage({ cinematic, onDone, onExplore, onSeen }) {
  if (!cinematic) return null;
  if (cinematic.kind === 'history') {
    // Pilih orchestrator per-era (Heian vs Edo vs Meiji). Semuanya berbagi mesin timeline.
    if (cinematic.era === 'edo') {
      return <EdoCinematic onDone={onDone} onExplore={onExplore} onSeen={onSeen} />;
    }
    if (cinematic.era === 'meiji') {
      return <MeijiCinematic onDone={onDone} onExplore={onExplore} onSeen={onSeen} />;
    }
    if (cinematic.era === 'showa') {
      return <ShowaCinematic onDone={onDone} onExplore={onExplore} onSeen={onSeen} />;
    }
    return <HeianCinematic onDone={onDone} onExplore={onExplore} onSeen={onSeen} />;
  }
  return null;
}

export const CinematicProvider = ({ children }) => {
  const { era } = useEra();
  const { progress, markCinematicSeen } = useUserStats();
  const navigate = useNavigate();
  const [active, setActive] = useState(null);       // id cinematic yang sedang jalan
  const activeRef = useRef(null);                   // cermin `active` (baca state di luar render)
  const autoRef = useRef(null);                     // guard: jangan auto-play 2× untuk era sama

  // Cermin `active` → dipakai stop()/explore() supaya efek samping dijalankan di
  // LUAR updater setState (updater dijalankan saat render; memanggil setState
  // provider lain di dalamnya memicu "Cannot update a component while rendering
  // a different component"). Lihat catatan di stop().
  useEffect(() => { activeRef.current = active; }, [active]);

  // Auto-play sekali saat mencapai era dengan cinematic yang belum dilihat.
  // PENTING: autoRef baru di-set saat timeout BENAR-BENAR jalan — bukan saat
  // effect mount. Kalau di-set lebih awal, StrictMode (dev, effect 2×) akan
  // membersihkan timeout di cleanup lalu menolak menjadwalkan ulang → cinematic
  // tak pernah muncul.
  //
  // Audio: kalau context belum "running" (belum ada gesture), cinematic DITAHAN
  // sampai gesture pertama → audio menyala dari detik ke-0. Gesture itu sekaligus
  // meng-unlock AudioContext (tidak melanggar kebijakan autoplay).
  useEffect(() => {
    const seen = progress?.cinematicsSeen;
    const id = nextCinematic(era, seen);
    if (!id) return undefined;
    if (autoRef.current === id) return undefined;   // sudah dipicu/diputar di sesi ini

    let timer = null;
    const begin = () => {
      // Tunda sedikit → biar transisi era/ganti halaman tenang dulu.
      timer = setTimeout(() => {
        autoRef.current = id;
        setActive(id);
      }, 500);
    };

    // Sudah ada audio? Langsung jadwalkan. Belum? Tunggu gesture pertama.
    if (isAudioRunning()) {
      begin();
      return () => clearTimeout(timer);
    }

    const onGesture = () => {
      // Unlock audio pada gesture ini (no-op kalau sudah running), lalu mulai.
      enableHeianAudio();
      begin();
      remove();
    };
    const remove = () => {
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
      window.removeEventListener('touchstart', onGesture);
    };
    window.addEventListener('pointerdown', onGesture, { passive: true });
    window.addEventListener('keydown', onGesture);
    window.addEventListener('touchstart', onGesture, { passive: true });

    return () => { remove(); clearTimeout(timer); };
  }, [era, progress?.cinematicsSeen]);

  const play = useCallback((id) => {
    if (!getCinematic(id)) return false;
    activeRef.current = id;
    setActive(id);
    return true;
  }, []);

  // Tandai sudah dilihat TANPA menutup (dipakai saat skip/selesai alami di dalam
  // cinematic). Menutup overlay dilakukan terpisah lewat stop().
  const markSeen = useCallback((id) => {
    if (id) markCinematicSeen(id);
  }, [markCinematicSeen]);

  // Tutup + tandai sudah dilihat (dipakai onDone; juga saat skip).
  // PENTING: efek samping (markCinematicSeen → setState ProgressProvider)
  // dijalankan DI LUAR updater setActive. Updater setState dieksekusi React saat
  // fase render; memanggil setState provider lain di dalamnya memicu error
  // "Cannot update a component while rendering a different component".
  const stop = useCallback(() => {
    const cur = activeRef.current;
    activeRef.current = null;
    setActive(null);
    if (cur) markCinematicSeen(cur);
  }, [markCinematicSeen]);

  // "Pelajari lebih lanjut" → tutup, tandai, lalu ke halaman sejarah era ini.
  const explore = useCallback(() => {
    const cur = activeRef.current;
    const c = cur ? getCinematic(cur) : null;
    activeRef.current = null;
    setActive(null);
    if (cur) markCinematicSeen(cur);
    if (c?.route) navigate(c.route);
  }, [markCinematicSeen, navigate]);

  const value = useMemo(() => ({ active, play, stop, isPlaying: !!active }), [active, play, stop]);

  return (
    <CinematicContext.Provider value={value}>
      {children}
      <CinematicStage
        cinematic={active ? getCinematic(active) : null}
        onDone={stop}
        onExplore={explore}
        onSeen={() => markSeen(active)}
      />
    </CinematicContext.Provider>
  );
};

// No-op kalau provider tak dipasang → komponen pemanggil tetap aman.
const NOOP = { active: null, play: () => false, stop: () => {}, isPlaying: false };

export const useCinematic = () => useContext(CinematicContext) || NOOP;
