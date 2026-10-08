// ─────────────────────────────────────────────────────────────────────────────
// HISTORICAL CINEMATIC INTRO — era Meiji 明治.
//
// Orkestrator sama filosofinya dengan Heian/Edo: SATU jam (rAF) menulis ke
// MotionValue `clock`; semua visual/teks/audio menurunkan dirinya dari jam itu
// (tidak ada setState per frame). Yang berbeda HANYA:
//   • data   → MEIJI_SCENES (meiji/data/scenes.js)
//   • visual → view Meiji (meiji/scenes/MeijiScenes.jsx)
//   • token  → palet letterpress (--mdk-*: kertas koran, renga, ai, gaslight)
//   • ambience/SFX → mood Meiji (port/city/press/school/diet) di heianHistoryAudio
//
// Mesin timeline + komponen SceneLayer/SceneText DIPAKAI ULANG (bukan disalin):
// SceneText sudah murni prop-driven (scene, clock, sceneStart) dan hanya membaca
// token --emk-* + --font-display, jadi cukup mengganti nilai token itu.
//
// Setelah selesai / di-skip: layar pilihan
//   • \"Jelajahi Peta Meiji\" → onExplore() (navigasi halaman peta/sejarah)
//   • \"Masuk ke Meiji\"      → onDone()
// A11y: role=\"dialog\" aria-modal, fokus ke tombol skip, ESC, reduced-motion.
// ─────────────────────────────────────────────────────────────────────────────
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, useMotionValueEvent, useAnimationFrame } from 'motion/react';
import { MEIJI_SCENES } from './data/scenes';
import {
  totalDuration, sceneStartTimes, sceneAtTime, sceneOpacityAt,
  audioCues, voiceCues, visibleSceneIndices,
} from '../timeline';
import { MeijiBackdrop } from './components/MeijiBackdrop';
import { SceneLayer } from '../heian/components/SceneLayer';
import { useIsPortrait } from '../heian/components/useIsPortrait';
import { SceneText } from '../heian/components/SceneText';
import {
  ScenePort, SceneGinza, ScenePrint, SceneRail, SceneChange,
} from './scenes/MeijiScenes';
import {
  playCinematicSfx, startHeianAmbience, setHeianMood,
  stopHeianAmbience, unlockHeianAudio, isAudioRunning, ambienceActive, enableHeianAudio,
} from '../heian/heianHistoryAudio';
// Voice narasi per-baris = file mp3 statis → pakai pemutar klip yang sudah ada
// (utils/sfx.js → playClipFile + preloadClips), sama seperti Heian/Edo.
import { playClipFile, preloadClips } from '../../../utils/sfx.js';

// Peta `visual` (data) → komponen latar Meiji.
const SCENE_VIEWS = {
  port: ScenePort,
  ginza: SceneGinza,
  print: ScenePrint,
  rail: SceneRail,
  change: SceneChange,
};

const XFADE = 1.7;

// Teks scene, ikut cross-fade bersama lapisan visualnya (opacity dari clock).
function SceneTextLayer({ index, clock, reduced }) {
  const opacity = useTransform(clock, (t) => (reduced ? (t >= sceneStartTimes(MEIJI_SCENES)[index] ? 1 : 0) : sceneOpacityAt(MEIJI_SCENES, index, t, XFADE)));
  return (
    <motion.div className="pointer-events-none absolute inset-0 flex items-center justify-center" style={{ opacity }}>
      <SceneText scene={MEIJI_SCENES[index]} clock={clock} sceneStart={sceneStartTimes(MEIJI_SCENES)[index]} reduced={reduced} />
    </motion.div>
  );
}

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const sameIndices = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

export function MeijiCinematic({ onDone, onExplore, onSeen }) {
  const [reduced] = useState(prefersReduced);
  const portrait = useIsPortrait();
  const [ended, setEnded] = useState(false);
  const [audioOn, setAudioOn] = useState(() => isAudioRunning());
  const [mounted, setMounted] = useState(() => visibleSceneIndices(MEIJI_SCENES, 0, XFADE));
  const skipRef = useRef(null);
  const doneRef = useRef(false);
  const seenRef = useRef(false);
  const firedRef = useRef(new Set());
  const moodRef = useRef(MEIJI_SCENES[0].mood || 'city');
  const mountedRef = useRef(mounted);
  const endedRef = useRef(false);
  const clockHoldRef = useRef(!isAudioRunning());

  const total = useMemo(() => totalDuration(MEIJI_SCENES), []);
  const cues = useMemo(() => audioCues(MEIJI_SCENES), []);
  const vcues = useMemo(() => voiceCues(MEIJI_SCENES), []);
  const timeScale = reduced ? 2.5 : 1;

  const clock = useMotionValue(0);
  const progress = useTransform(clock, (t) => Math.min(1, t / total));

  const markSeen = () => {
    if (seenRef.current) return;
    seenRef.current = true;
    onSeen?.();
  };

  const finish = () => {
    markSeen();
    endedRef.current = true;
    setEnded(true);
    stopHeianAmbience();
  };
  const finishRef = useRef(finish);
  finishRef.current = finish;

  const startRef = useRef(null);
  useAnimationFrame((now) => {
    if (endedRef.current) return;
    if (clockHoldRef.current) { startRef.current = null; return; }
    if (startRef.current == null) startRef.current = now;
    const t = ((now - startRef.current) / 1000) * timeScale;
    if (t >= total) { clock.set(total); finish(); return; }
    clock.set(t);
  });

  useMotionValueEvent(clock, 'change', (t) => {
    const vis = visibleSceneIndices(MEIJI_SCENES, t, XFADE);
    if (!sameIndices(vis, mountedRef.current)) {
      mountedRef.current = vis;
      setMounted(vis);
    }
    const mood = MEIJI_SCENES[sceneAtTime(MEIJI_SCENES, t)].mood || 'city';
    if (mood !== moodRef.current) { moodRef.current = mood; setHeianMood(mood); }
    const STALE = 0.6;
    for (const c of cues) {
      if (t >= c.at && !firedRef.current.has(c.id)) {
        if (isAudioRunning() && t - c.at <= STALE) { firedRef.current.add(c.id); playCinematicSfx(c.sfx, c.gain); }
        else if (t - c.at > STALE) firedRef.current.add(c.id);
      }
    }
    // Voice narasi Saku — satu klip per BARIS (pola sama seperti SFX).
    for (const v of vcues) {
      if (t >= v.at && !firedRef.current.has(v.id)) {
        if (isAudioRunning() && t - v.at <= STALE) { firedRef.current.add(v.id); playClipFile(v.path); }
        else if (t - v.at > STALE) firedRef.current.add(v.id);
      }
    }
  });

  useEffect(() => {
    startHeianAmbience(moodRef.current);
    return () => stopHeianAmbience();
  }, []);

  // Voice: preload klip (TANPA memutar) supaya elemen <audio> sudah ter-decode
  // dan baris pertama tidak telat saat dijadwalkan.
  useEffect(() => {
    preloadClips(vcues.map((v) => v.path));
  }, [vcues]);

  const releaseHold = () => { clockHoldRef.current = false; };
  useEffect(() => {
    const id = setTimeout(releaseHold, 1500);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const cleanup = unlockHeianAudio(() => {
      setAudioOn(true);
      releaseHold();
      if (!ambienceActive()) startHeianAmbience(moodRef.current);
      else setHeianMood(moodRef.current);
    });
    return cleanup;
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') finishRef.current(); };
    window.addEventListener('keydown', onKey);
    const f = setTimeout(() => skipRef.current?.focus(), 80);
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(f); };
  }, []);

  const enter = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone?.();
  };
  const explore = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onExplore?.();
  };

  const sceneIndex = sceneAtTime(MEIJI_SCENES, 0);

  return (
    <motion.div
      className="fixed inset-0 z-[200] overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Cinematic sejarah Meiji"
      style={{
        // Token cinematic Meiji — kertas KORAN + tinta + renga 煉瓦 + ai 藍 + gas.
        '--emk-paper': '#f4f1e8',
        '--emk-paper-2': '#e7e2d4',
        '--emk-ink': '#141414',
        '--emk-gold': '#c9962e',
        '--emk-gold-bright': '#e0b050',
        '--emk-shu': '#b8352c',
        '--mdk-paper': '#f4f1e8',
        '--mdk-paper-2': '#e7e2d4',
        '--mdk-ink': '#141414',
        '--mdk-ai': '#2f4f6b',
        '--mdk-renga': '#9b4a3c',
        '--mdk-shu': '#b8352c',
        '--mdk-gas': '#d9a441',
        fontFamily: 'var(--font-serif)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduced ? 0 : 0.9 }}
    >
      {/* Dasar: kertas koran + misprint registrasi + halftone (per mood scene) */}
      <MeijiBackdrop mood={MEIJI_SCENES[sceneIndex].mood} clock={clock} reduced={reduced} />

      {/* Lapisan scene — cross-fade mulus (opacity dari clock). */}
      {mounted.map((i) => {
        const View = SCENE_VIEWS[MEIJI_SCENES[i].visual] || ScenePort;
        return (
          <Fragment key={MEIJI_SCENES[i].id}>
            <SceneLayer index={i} clock={clock} View={View} reduced={reduced} portrait={portrait} scenes={MEIJI_SCENES} fade={XFADE} />
            <SceneTextLayer index={i} clock={clock} reduced={reduced} />
          </Fragment>
        );
      })}

      {/* Bingkai cetak: kolom koran di kiri-kanan (garis aturan renga → krem),
          bukan bar warna datar. Memberi kesan \"halaman digelar\". */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-3 sm:w-5"
        style={{ background: 'linear-gradient(90deg, #6f3328 0%, var(--mdk-renga) 42%, #b45a48 70%, var(--mdk-paper-2) 100%)', opacity: 0.95 }} />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-3 sm:w-5"
        style={{ background: 'linear-gradient(270deg, #6f3328 0%, var(--mdk-renga) 42%, #b45a48 70%, var(--mdk-paper-2) 100%)', opacity: 0.95 }} />

      {/* ── Layar pilihan setelah selesai / skip ─────────────────────────── */}
      {ended && (
        <motion.div
          className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-6 px-6 text-center"
          style={{ background: 'radial-gradient(ellipse at center, rgba(20,16,12,0.80) 0%, rgba(12,10,8,0.94) 100%)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduced ? 0 : 1.2 }}
        >
          <motion.p
            initial={{ opacity: 0, y: reduced ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0 : 1.0, delay: reduced ? 0 : 0.2 }}
            style={{ fontFamily: 'var(--font-display)', color: 'var(--mdk-gas)', fontSize: 'clamp(1.4rem, 5vw, 2.6rem)', letterSpacing: '0.14em', filter: 'drop-shadow(2px 2px 0 rgba(155,74,60,0.42))' }}
          >
            ようこそ、明治へ。
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduced ? 0 : 1.0, delay: reduced ? 0 : 0.6 }}
            className="font-sans font-semibold"
            style={{ color: 'rgba(244,241,232,0.82)', fontSize: 'clamp(0.85rem, 2.4vw, 1.1rem)' }}
          >
            Selamat datang di Meiji.
          </motion.p>

          <motion.div
            className="mt-3 flex w-full max-w-md flex-col gap-3"
            initial={{ opacity: 0, y: reduced ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0 : 1.0, delay: reduced ? 0 : 0.9 }}
          >
            <button
              type="button"
              onClick={explore}
              className="w-full border px-5 py-3.5 font-display font-bold tracking-[0.14em] transition-colors focus:outline-none focus-visible:ring-2"
              style={{ borderColor: 'var(--mdk-ink)', background: 'linear-gradient(160deg, #b45a48 0%, var(--mdk-renga) 70%, #6f3328 100%)', color: '#f4f1e8', borderRadius: 2, filter: 'drop-shadow(2px 2px 0 rgba(47,79,107,0.4))' }}
            >
              Jelajahi Peta Meiji
            </button>
            <button
              type="button"
              onClick={enter}
              className="w-full px-5 py-3 font-display font-semibold tracking-[0.14em] transition-colors focus:outline-none focus-visible:ring-2"
              style={{ border: '1px solid rgba(244,241,232,0.4)', background: 'transparent', color: 'rgba(244,241,232,0.9)', borderRadius: 2 }}
            >
              Masuk ke Meiji
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* ── Kontrol: progress + skip ─────────────────────────────────────── */}
      {!ended && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 z-40 h-[3px]" style={{ background: 'rgba(20,20,20,0.16)' }}>
            <motion.div className="h-full origin-left" style={{ background: 'var(--mdk-renga)', scaleX: progress, width: '100%' }} />
          </div>

          {!audioOn && (
            <button
              type="button"
              onClick={() => {
                enableHeianAudio().then((ok) => {
                  if (!ok) return;
                  setAudioOn(true);
                  if (!ambienceActive()) startHeianAmbience(moodRef.current);
                  else setHeianMood(moodRef.current);
                });
              }}
              className="absolute bottom-6 left-6 z-50 flex items-center gap-2 border px-3 py-1.5 font-display text-[11px] font-semibold tracking-[0.16em] transition-colors focus:outline-none focus-visible:ring-2"
              style={{ borderColor: 'rgba(217,164,65,0.6)', color: '#e0b050', background: 'rgba(18,14,10,0.62)', borderRadius: 2 }}
              aria-label="Nyalakan suara"
            >
              <span aria-hidden="true">🔊</span> 音を出す
            </button>
          )}

          <button
            ref={skipRef}
            type="button"
            onClick={finish}
            className="absolute bottom-6 right-6 z-50 border px-4 py-2 font-display text-xs font-bold tracking-[0.28em] transition-colors focus:outline-none focus-visible:ring-2"
            style={{ borderColor: 'rgba(244,241,232,0.45)', color: '#f4f1e8', background: 'rgba(18,14,10,0.62)', borderRadius: 2 }}
            aria-label="Lewati cinematic"
          >
            スキップ
          </button>
        </>
      )}

      {/* Nama scene untuk pembaca layar (info penting tak bergantung animasi) */}
      <span className="sr-only" aria-live="polite">
        {MEIJI_SCENES.flatMap((s) => s.lines.map((l) => l.jp)).join(' ')}
      </span>
    </motion.div>
  );
}

export default MeijiCinematic;
