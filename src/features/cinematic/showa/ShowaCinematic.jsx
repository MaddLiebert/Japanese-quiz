// ─────────────────────────────────────────────────────────────────────────────
// HISTORICAL CINEMATIC INTRO — era Shōwa 昭和.
//
// Orkestrator sama filosofinya dengan Heian/Edo/Meiji: SATU jam (rAF) menulis ke
// MotionValue `clock`; semua visual/teks/audio menurunkan dirinya dari jam itu
// (tidak ada setState per frame). Yang berbeda HANYA:
//   • data   → SHOWA_SCENES (showa/data/scenes.js)
//   • visual → view Shōwa (showa/scenes/ShowaScenes.jsx)
//   • token  → palet beton (--sk-*: beton, tinta, sodium, shu, kinari)
//   • ambience/SFX → mood Shōwa (ruins/yamichi/danchi/city/expo) di heianHistoryAudio
//
// Mesin timeline + komponen SceneLayer/SceneText DIPAKAI ULANG (bukan disalin):
// SceneText sudah murni prop-driven (scene, clock, sceneStart) dan hanya membaca
// token --emk-* + --font-display, jadi cukup mengganti nilai token itu.
//
// Setelah selesai / di-skip: layar pilihan
//   • "Jelajahi Peta Shōwa" → onExplore() (navigasi halaman peta/sejarah)
//   • "Masuk ke Shōwa"      → onDone()
// A11y: role="dialog" aria-modal, fokus ke tombol skip, ESC, reduced-motion.
// ─────────────────────────────────────────────────────────────────────────────
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, useMotionValueEvent, useAnimationFrame } from 'motion/react';
import { SHOWA_SCENES } from './data/scenes';
import {
  totalDuration, sceneStartTimes, sceneAtTime, sceneOpacityAt,
  audioCues, voiceCues, visibleSceneIndices,
} from '../timeline';
import { ShowaBackdrop } from './components/ShowaBackdrop';
import { SceneLayer } from '../heian/components/SceneLayer';
import { useIsPortrait } from '../heian/components/useIsPortrait';
import { SceneText } from '../heian/components/SceneText';
import {
  SceneRuins, SceneYamichi, SceneBuild, SceneTower, SceneChange,
} from './scenes/ShowaScenes';
import {
  playCinematicSfx, startHeianAmbience, setHeianMood,
  stopHeianAmbience, unlockHeianAudio, isAudioRunning, ambienceActive, enableHeianAudio,
} from '../heian/heianHistoryAudio';
// Voice narasi per-baris = file mp3 statis → pakai pemutar klip yang sudah ada
// (utils/sfx.js → playClipFile + preloadClips), sama seperti Heian/Edo/Meiji.
import { playClipFile, preloadClips } from '../../../utils/sfx.js';

// Peta `visual` (data) → komponen latar Shōwa.
const SCENE_VIEWS = {
  ruins: SceneRuins,
  yamichi: SceneYamichi,
  build: SceneBuild,
  tower: SceneTower,
  change: SceneChange,
};

const XFADE = 1.7;

// Teks scene, ikut cross-fade bersama lapisan visualnya (opacity dari clock).
function SceneTextLayer({ index, clock, reduced }) {
  const opacity = useTransform(clock, (t) => (reduced ? (t >= sceneStartTimes(SHOWA_SCENES)[index] ? 1 : 0) : sceneOpacityAt(SHOWA_SCENES, index, t, XFADE)));
  return (
    <motion.div className="pointer-events-none absolute inset-0 flex items-center justify-center" style={{ opacity }}>
      <SceneText scene={SHOWA_SCENES[index]} clock={clock} sceneStart={sceneStartTimes(SHOWA_SCENES)[index]} reduced={reduced} />
    </motion.div>
  );
}

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const sameIndices = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

export function ShowaCinematic({ onDone, onExplore, onSeen }) {
  const [reduced] = useState(prefersReduced);
  const portrait = useIsPortrait();
  const [ended, setEnded] = useState(false);
  const [audioOn, setAudioOn] = useState(() => isAudioRunning());
  const [mounted, setMounted] = useState(() => visibleSceneIndices(SHOWA_SCENES, 0, XFADE));
  const skipRef = useRef(null);
  const doneRef = useRef(false);
  const seenRef = useRef(false);
  const firedRef = useRef(new Set());
  const moodRef = useRef(SHOWA_SCENES[0].mood || 'danchi');
  const mountedRef = useRef(mounted);
  const endedRef = useRef(false);
  const clockHoldRef = useRef(!isAudioRunning());

  const total = useMemo(() => totalDuration(SHOWA_SCENES), []);
  const cues = useMemo(() => audioCues(SHOWA_SCENES), []);
  const vcues = useMemo(() => voiceCues(SHOWA_SCENES), []);
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
    const vis = visibleSceneIndices(SHOWA_SCENES, t, XFADE);
    if (!sameIndices(vis, mountedRef.current)) {
      mountedRef.current = vis;
      setMounted(vis);
    }
    const mood = SHOWA_SCENES[sceneAtTime(SHOWA_SCENES, t)].mood || 'danchi';
    if (mood !== moodRef.current) { moodRef.current = mood; setHeianMood(mood); }
    const STALE = 0.6;
    for (const c of cues) {
      if (t >= c.at && !firedRef.current.has(c.id)) {
        if (isAudioRunning() && t - c.at <= STALE) { firedRef.current.add(c.id); playCinematicSfx(c.sfx, c.gain); }
        else if (t - c.at > STALE) firedRef.current.add(c.id);
      }
    }
    // Voice narasi Nacht — satu klip per BARIS (pola sama seperti SFX).
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

  const sceneIndex = sceneAtTime(SHOWA_SCENES, 0);

  return (
    <motion.div
      className="fixed inset-0 z-[200] overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Cinematic sejarah Shōwa"
      style={{
        // Token cinematic Shōwa — BETON + tinta + sodium ナトリウム + shu 朱 + kinari.
        // --emk-* dipakai ulang oleh SceneText (mesin bersama) → dipetakan ke palet beton.
        '--emk-paper': '#e8e5dd',
        '--emk-paper-2': '#d6d3ca',
        '--emk-ink': '#1a1a18',
        '--emk-gold': '#d9a441',
        '--emk-gold-bright': '#e0b050',
        '--emk-shu': '#d3382f',
        '--sk-concrete': '#8c8c85',
        '--sk-gin': '#b9b7ae',
        '--sk-sumi': '#1a1a18',
        '--sk-sodium': '#d9a441',
        '--sk-shu': '#d3382f',
        '--sk-kinari': '#ece7db',
        '--sk-dust': '#9a968c',
        fontFamily: 'var(--font-serif)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduced ? 0 : 0.9 }}
    >
      {/* Dasar: beton 打ちっぱなし + grain + halftone (per mood scene) */}
      <ShowaBackdrop mood={SHOWA_SCENES[sceneIndex].mood} clock={clock} reduced={reduced} />

      {/* Lapisan scene — cross-fade mulus (opacity dari clock). */}
      {mounted.map((i) => {
        const View = SCENE_VIEWS[SHOWA_SCENES[i].visual] || SceneRuins;
        return (
          <Fragment key={SHOWA_SCENES[i].id}>
            <SceneLayer index={i} clock={clock} View={View} reduced={reduced} portrait={portrait} scenes={SHOWA_SCENES} fade={XFADE} />
            <SceneTextLayer index={i} clock={clock} reduced={reduced} />
          </Fragment>
        );
      })}

      {/* Bingkai beton: kolom formwork di kiri-kanan (garis bekas cetakan → abu),
          bukan bar warna datar. Memberi kesan "dinding beton". */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-3 sm:w-5"
        style={{ background: 'linear-gradient(90deg, #6c6c66 0%, var(--sk-concrete) 42%, #a5a29a 70%, #cfccc4 100%)', opacity: 0.95 }} />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-3 sm:w-5"
        style={{ background: 'linear-gradient(270deg, #6c6c66 0%, var(--sk-concrete) 42%, #a5a29a 70%, #cfccc4 100%)', opacity: 0.95 }} />

      {/* ── Layar pilihan setelah selesai / skip ─────────────────────────── */}
      {ended && (
        <motion.div
          className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-6 px-6 text-center"
          style={{ background: 'radial-gradient(ellipse at center, rgba(20,20,18,0.82) 0%, rgba(12,12,10,0.95) 100%)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduced ? 0 : 1.2 }}
        >
          <motion.p
            initial={{ opacity: 0, y: reduced ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0 : 1.0, delay: reduced ? 0 : 0.2 }}
            style={{ fontFamily: 'var(--font-display)', color: 'var(--sk-sodium)', fontSize: 'clamp(1.4rem, 5vw, 2.6rem)', letterSpacing: '0.14em', filter: 'drop-shadow(3px 3px 0 rgba(20,20,18,0.5))' }}
          >
            ようこそ、昭和へ。
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduced ? 0 : 1.0, delay: reduced ? 0 : 0.6 }}
            className="font-sans font-semibold"
            style={{ color: 'rgba(232,229,221,0.82)', fontSize: 'clamp(0.85rem, 2.4vw, 1.1rem)' }}
          >
            Selamat datang di Shōwa.
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
              style={{ borderColor: 'var(--sk-sumi)', background: 'linear-gradient(160deg, #d34a3c 0%, var(--sk-shu) 70%, #8e2f26 100%)', color: '#ece7db', borderRadius: 0, filter: 'drop-shadow(3px 3px 0 rgba(20,20,18,0.5))' }}
            >
              Jelajahi Peta Shōwa
            </button>
            <button
              type="button"
              onClick={enter}
              className="w-full px-5 py-3 font-display font-semibold tracking-[0.14em] transition-colors focus:outline-none focus-visible:ring-2"
              style={{ border: '1px solid rgba(232,229,221,0.4)', background: 'transparent', color: 'rgba(232,229,221,0.9)', borderRadius: 0 }}
            >
              Masuk ke Shōwa
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* ── Kontrol: progress + skip ─────────────────────────────────────── */}
      {!ended && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 z-40 h-[3px]" style={{ background: 'rgba(20,20,18,0.16)' }}>
            <motion.div className="h-full origin-left" style={{ background: 'var(--sk-shu)', scaleX: progress, width: '100%' }} />
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
              style={{ borderColor: 'rgba(217,164,65,0.6)', color: '#e0b050', background: 'rgba(18,18,14,0.62)', borderRadius: 0 }}
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
            style={{ borderColor: 'rgba(232,229,221,0.45)', color: '#ece7db', background: 'rgba(18,18,14,0.62)', borderRadius: 0 }}
            aria-label="Lewati cinematic"
          >
            スキップ
          </button>
        </>
      )}

      {/* Nama scene untuk pembaca layar (info penting tak bergantung animasi) */}
      <span className="sr-only" aria-live="polite">
        {SHOWA_SCENES.flatMap((s) => s.lines.map((l) => l.jp)).join(' ')}
      </span>
    </motion.div>
  );
}

export default ShowaCinematic;
