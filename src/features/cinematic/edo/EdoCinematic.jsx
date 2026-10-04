// ─────────────────────────────────────────────────────────────────────────────
// HISTORICAL CINEMATIC INTRO — era Edo 江戸.
//
// Orkestrator sama filosofinya dengan HeianCinematic: SATU jam (rAF) menulis ke
// MotionValue `clock`; semua visual/teks/audio menurunkan dirinya dari jam itu
// (tidak ada setState per frame). Yang berbeda HANYA:
//   • data   → EDO_SCENES (edo/data/scenes.js)
//   • visual → view Edo (edo/scenes/EdoScenes.jsx)
//   • token  → palet cetak (--emk-* di-override ke indigo/merah/kertas cetak)
//   • ambience/SFX → mood Edo (market/print/night/festival) di heianHistoryAudio
//
// Mesin timeline + komponen SceneLayer/SceneText DIPAKAI ULANG (bukan disalin):
// SceneText sudah murni prop-driven (scene, clock, sceneStart) dan hanya membaca
// token --emk-* + --font-display, jadi cukup mengganti nilai token itu.
//
// Setelah selesai / di-skip: layar pilihan
//   • "Jelajahi Peta Edo"  → onExplore() (navigasi halaman peta/sejarah)
//   • "Masuk ke Edo"       → onDone()
// A11y: role="dialog" aria-modal, fokus ke tombol skip, ESC, reduced-motion.
// ─────────────────────────────────────────────────────────────────────────────
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, useMotionValueEvent, useAnimationFrame } from 'motion/react';
import { EDO_SCENES } from './data/scenes';
import {
  totalDuration, sceneStartTimes, sceneAtTime, sceneOpacityAt,
  audioCues, visibleSceneIndices,
} from '../timeline';
import { EdoBackdrop } from './components/EdoBackdrop';
import { SceneLayer } from '../heian/components/SceneLayer';
import { useIsPortrait } from '../heian/components/useIsPortrait';
import { SceneText } from '../heian/components/SceneText';
import {
  SceneMap, SceneCapital, ScenePrint, SceneNight, SceneChange,
} from './scenes/EdoScenes';
import {
  playCinematicSfx, startHeianAmbience, setHeianMood,
  stopHeianAmbience, unlockHeianAudio, isAudioRunning, ambienceActive, enableHeianAudio,
} from '../heian/heianHistoryAudio';

// Peta `visual` (data) → komponen latar Edo.
const SCENE_VIEWS = {
  map: SceneMap,
  capital: SceneCapital,
  print: ScenePrint,
  night: SceneNight,
  change: SceneChange,
};

const XFADE = 1.7;

// Teks scene, ikut cross-fade bersama lapisan visualnya (opacity dari clock).
function SceneTextLayer({ index, clock, reduced }) {
  const opacity = useTransform(clock, (t) => (reduced ? (t >= sceneStartTimes(EDO_SCENES)[index] ? 1 : 0) : sceneOpacityAt(EDO_SCENES, index, t, XFADE)));
  return (
    <motion.div className="pointer-events-none absolute inset-0 flex items-center justify-center" style={{ opacity }}>
      <SceneText scene={EDO_SCENES[index]} clock={clock} sceneStart={sceneStartTimes(EDO_SCENES)[index]} reduced={reduced} />
    </motion.div>
  );
}

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const sameIndices = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

export function EdoCinematic({ onDone, onExplore, onSeen }) {
  const [reduced] = useState(prefersReduced);
  const portrait = useIsPortrait();
  const [ended, setEnded] = useState(false);
  const [audioOn, setAudioOn] = useState(() => isAudioRunning());
  const [mounted, setMounted] = useState(() => visibleSceneIndices(EDO_SCENES, 0, XFADE));
  const skipRef = useRef(null);
  const doneRef = useRef(false);
  const seenRef = useRef(false);
  const firedRef = useRef(new Set());
  const moodRef = useRef(EDO_SCENES[0].mood || 'market');
  const mountedRef = useRef(mounted);
  const endedRef = useRef(false);
  const clockHoldRef = useRef(!isAudioRunning());

  const total = useMemo(() => totalDuration(EDO_SCENES), []);
  const cues = useMemo(() => audioCues(EDO_SCENES), []);
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
    const vis = visibleSceneIndices(EDO_SCENES, t, XFADE);
    if (!sameIndices(vis, mountedRef.current)) {
      mountedRef.current = vis;
      setMounted(vis);
    }
    const mood = EDO_SCENES[sceneAtTime(EDO_SCENES, t)].mood || 'market';
    if (mood !== moodRef.current) { moodRef.current = mood; setHeianMood(mood); }
    const STALE = 0.6;
    for (const c of cues) {
      if (t >= c.at && !firedRef.current.has(c.id)) {
        if (isAudioRunning() && t - c.at <= STALE) { firedRef.current.add(c.id); playCinematicSfx(c.sfx, c.gain); }
        else if (t - c.at > STALE) firedRef.current.add(c.id);
      }
    }
  });

  useEffect(() => {
    startHeianAmbience(moodRef.current);
    return () => stopHeianAmbience();
  }, []);

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

  const sceneIndex = sceneAtTime(EDO_SCENES, 0);

  return (
    <motion.div
      className="fixed inset-0 z-[200] overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Cinematic sejarah Edo"
      style={{
        // Token cinematic Edo — kertas CETAK + tinta + indigo 藍 + 朱 merah.
        '--emk-paper': '#f4ecd8',
        '--emk-paper-2': '#e6d8b8',
        '--emk-ink': '#1c1b1a',
        '--emk-gold': '#c9922a',
        '--emk-gold-bright': '#e8b84b',
        '--emk-shu': '#c0392b',
        '--edk-paper': '#f4ecd8',
        '--edk-paper-2': '#e6d8b8',
        '--edk-ink': '#1c1b1a',
        '--edk-ai': '#1e4f79',
        '--edk-shu': '#c0392b',
        fontFamily: 'var(--font-serif)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduced ? 0 : 0.9 }}
    >
      {/* Dasar: kertas cetak + blok warna registrasi + grain (per mood scene) */}
      <EdoBackdrop mood={EDO_SCENES[sceneIndex].mood} clock={clock} reduced={reduced} />

      {/* Lapisan scene — cross-fade mulus (opacity dari clock). */}
      {mounted.map((i) => {
        const View = SCENE_VIEWS[EDO_SCENES[i].visual] || SceneMap;
        return (
          <Fragment key={EDO_SCENES[i].id}>
            <SceneLayer index={i} clock={clock} View={View} reduced={reduced} portrait={portrait} scenes={EDO_SCENES} fade={XFADE} />
            <SceneTextLayer index={i} clock={clock} reduced={reduced} />
          </Fragment>
        );
      })}

      {/* Bingkai cetak: gulungan kertas 掛軸 di kiri-kanan (bokashi indigo →
          krem), bukan bar warna datar. Memberi kesan "kertas digelar". */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-3 sm:w-5"
        style={{ background: 'linear-gradient(90deg, #16324c 0%, var(--edk-ai) 42%, #3a6f9e 70%, var(--edk-paper-2) 100%)', opacity: 0.95 }} />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-3 sm:w-5"
        style={{ background: 'linear-gradient(270deg, #16324c 0%, var(--edk-ai) 42%, #3a6f9e 70%, var(--edk-paper-2) 100%)', opacity: 0.95 }} />

      {/* ── Layar pilihan setelah selesai / skip ─────────────────────────── */}
      {ended && (
        <motion.div
          className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-6 px-6 text-center"
          style={{ background: 'radial-gradient(ellipse at center, rgba(10,15,30,0.80) 0%, rgba(6,9,16,0.94) 100%)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduced ? 0 : 1.2 }}
        >
          <motion.p
            initial={{ opacity: 0, y: reduced ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0 : 1.0, delay: reduced ? 0 : 0.2 }}
            style={{ fontFamily: 'var(--font-display)', color: 'var(--edk-shu)', fontSize: 'clamp(1.4rem, 5vw, 2.6rem)', letterSpacing: '0.14em', filter: 'drop-shadow(2px 2px 0 rgba(30,79,121,0.4))' }}
          >
            ようこそ、江戸へ。
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduced ? 0 : 1.0, delay: reduced ? 0 : 0.6 }}
            className="font-sans font-semibold"
            style={{ color: 'rgba(244,236,216,0.82)', fontSize: 'clamp(0.85rem, 2.4vw, 1.1rem)' }}
          >
            Selamat datang di Edo.
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
              style={{ borderColor: 'var(--edk-ink)', background: 'linear-gradient(160deg, #d6503a 0%, var(--edk-shu) 70%, #8f2f1f 100%)', color: '#f4ecd8', borderRadius: 2, filter: 'drop-shadow(2px 2px 0 rgba(30,79,121,0.45))' }}
            >
              Jelajahi Peta Edo
            </button>
            <button
              type="button"
              onClick={enter}
              className="w-full px-5 py-3 font-display font-semibold tracking-[0.14em] transition-colors focus:outline-none focus-visible:ring-2"
              style={{ border: '1px solid rgba(244,236,216,0.4)', background: 'transparent', color: 'rgba(244,236,216,0.9)', borderRadius: 2 }}
            >
              Masuk ke Edo
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* ── Kontrol: progress + skip ─────────────────────────────────────── */}
      {!ended && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 z-40 h-[3px]" style={{ background: 'rgba(28,27,26,0.16)' }}>
            <motion.div className="h-full origin-left" style={{ background: 'var(--edk-shu)', scaleX: progress, width: '100%' }} />
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
              style={{ borderColor: 'rgba(240,190,78,0.6)', color: '#f0be4e', background: 'rgba(8,11,20,0.62)', borderRadius: 2 }}
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
            style={{ borderColor: 'rgba(244,236,216,0.45)', color: '#f4ecd8', background: 'rgba(8,11,20,0.62)', borderRadius: 2 }}
            aria-label="Lewati cinematic"
          >
            スキップ
          </button>
        </>
      )}

      {/* Nama scene untuk pembaca layar (info penting tak bergantung animasi) */}
      <span className="sr-only" aria-live="polite">
        {EDO_SCENES.flatMap((s) => s.lines.map((l) => l.jp)).join(' ')}
      </span>
    </motion.div>
  );
}

export default EdoCinematic;
