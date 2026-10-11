// ─────────────────────────────────────────────────────────────────────────────
// HISTORICAL CINEMATIC INTRO — era 電脳 (Cyberpunk).
//
// Orkestrator sama filosofinya dengan Heian/Edo/Meiji/Shōwa/多元: SATU jam (rAF)
// menulis ke MotionValue `clock`; semua visual/teks/audio menurunkan dirinya
// dari jam itu (tidak ada setState per frame). Yang berbeda HANYA:
//   • data   → CYBER_SCENES (cyberpunk/data/scenes.js)
//   • visual → view 電脳 (cyberpunk/scenes/CyberScenes.jsx)
//   • teks   → CyberText (reveal GLITCH, bukan sapuan kuas)
//   • token  → palet 常夜 (--cy-*: night, panel, cyan, ice, kin, shu)
//   • ambience/SFX → mood 電脳 (neon/peak/endless)
//
// Mesin timeline + SceneLayer DIPAKAI ULANG (bukan disalin).
//
// Setelah selesai / di-skip: layar pilihan
//   • "Jelajahi Peta 家" → onExplore() (navigasi halaman peta/sejarah)
//   • "Masuk ke 電脳"    → onDone()
// A11y: role="dialog" aria-modal, fokus ke tombol skip, ESC, reduced-motion.
// ─────────────────────────────────────────────────────────────────────────────
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, useMotionValueEvent, useAnimationFrame } from 'motion/react';
import { CYBER_SCENES } from './data/scenes';
import {
  totalDuration, sceneStartTimes, sceneAtTime,
  audioCues, voiceCues, visibleSceneIndices, XFADE,
} from './data/scenes';
import { sceneOpacityAt } from '../timeline';
import { CyberBackdrop } from './components/CyberBackdrop';
import { CyberText } from './components/CyberText';
import { SceneLayer } from '../heian/components/SceneLayer';
import { useIsPortrait } from '../heian/components/useIsPortrait';
import {
  SceneGate, SceneCity, ScenePeak, SceneEndless, SceneHome,
} from './scenes/CyberScenes';
import {
  playCinematicSfx, startHeianAmbience, setHeianMood,
  stopHeianAmbience, unlockHeianAudio, isAudioRunning, ambienceActive, enableHeianAudio,
} from '../heian/heianHistoryAudio';
import { playClipFile, preloadClips } from '../../../utils/sfx.js';

// Peta `visual` (data) → komponen latar 電脳.
const SCENE_VIEWS = {
  gate: SceneGate,
  city: SceneCity,
  peak: ScenePeak,
  endless: SceneEndless,
  home: SceneHome,
};

// Teks scene, ikut cross-fade bersama lapisan visualnya (opacity dari clock).
function SceneTextLayer({ index, clock, reduced }) {
  const opacity = useTransform(clock, (t) => (reduced ? (t >= sceneStartTimes(CYBER_SCENES)[index] ? 1 : 0) : sceneOpacityAt(CYBER_SCENES, index, t, XFADE)));
  return (
    <motion.div className="pointer-events-none absolute inset-0 flex items-center justify-center" style={{ opacity }}>
      <CyberText scene={CYBER_SCENES[index]} clock={clock} sceneStart={sceneStartTimes(CYBER_SCENES)[index]} reduced={reduced} />
    </motion.div>
  );
}

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const sameIndices = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

export function CyberCinematic({ onDone, onExplore, onSeen }) {
  const [reduced] = useState(prefersReduced);
  const portrait = useIsPortrait();
  const [ended, setEnded] = useState(false);
  const [audioOn, setAudioOn] = useState(() => isAudioRunning());
  const [mounted, setMounted] = useState(() => visibleSceneIndices(CYBER_SCENES, 0, XFADE));
  const skipRef = useRef(null);
  const doneRef = useRef(false);
  const seenRef = useRef(false);
  const firedRef = useRef(new Set());
  const moodRef = useRef(CYBER_SCENES[0].mood || 'neon');
  const mountedRef = useRef(mounted);
  const endedRef = useRef(false);
  const clockHoldRef = useRef(!isAudioRunning());

  const total = useMemo(() => totalDuration(CYBER_SCENES), []);
  const cues = useMemo(() => audioCues(CYBER_SCENES), []);
  const vcues = useMemo(() => voiceCues(CYBER_SCENES), []);
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
    const vis = visibleSceneIndices(CYBER_SCENES, t, XFADE);
    if (!sameIndices(vis, mountedRef.current)) {
      mountedRef.current = vis;
      setMounted(vis);
    }
    const mood = CYBER_SCENES[sceneAtTime(CYBER_SCENES, t)].mood || 'neon';
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

  // Voice: preload klip (TANPA memutar) supaya elemen <audio> sudah ter-decode.
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

  const sceneIndex = sceneAtTime(CYBER_SCENES, 0);

  return (
    <motion.div
      className="fixed inset-0 z-[200] overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Cinematic 電脳"
      style={{
        // Token cinematic 電脳 — 常夜: malam hitam-biru + cyan + kuning kin +
        // merah alert. --cy-* dipakai oleh CyberBackdrop/CyberScenes/CyberText.
        '--cy-night': '#04050A',
        '--cy-panel': '#080B12',
        '--cy-cyan': '#00F0FF',
        '--cy-ice': '#EAF2FA',
        '--cy-kin': '#FFE23A',
        '--cy-shu': '#FF2E4C',
        '--cy-haze': 'rgba(0,240,255,0.16)',
        '--cy-steel': '#8F9CA8',
        fontFamily: 'var(--font-sans)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduced ? 0 : 0.7 }}
    >
      {/* Dasar: 常夜 — malam abadi + grid + scanline + hujan (per mood scene) */}
      <CyberBackdrop mood={CYBER_SCENES[sceneIndex].mood} clock={clock} reduced={reduced} />

      {/* Lapisan scene — cross-fade mulus (opacity dari clock). */}
      {mounted.map((i) => {
        const View = SCENE_VIEWS[CYBER_SCENES[i].visual] || SceneGate;
        return (
          <Fragment key={CYBER_SCENES[i].id}>
            <SceneLayer index={i} clock={clock} View={View} reduced={reduced} portrait={portrait} scenes={CYBER_SCENES} fade={XFADE} />
            <SceneTextLayer index={i} clock={clock} reduced={reduced} />
          </Fragment>
        );
      })}

      {/* Bingkai HUD: siku-siku sudut (hairline cyan), bukan garis tinta manga. */}
      {[['top-4 left-4', 'borderTop borderLeft'], ['top-4 right-4', 'borderTop borderRight'], ['bottom-4 left-4', 'borderBottom borderLeft'], ['bottom-4 right-4', 'borderBottom borderRight']].map(([pos, b]) => (
        <div key={pos} className={`pointer-events-none absolute ${pos} h-7 w-7`}
          style={{ borderColor: 'rgba(0,240,255,0.5)', borderWidth: 0, borderTopWidth: b.includes('borderTop') ? 2 : 0, borderBottomWidth: b.includes('borderBottom') ? 2 : 0, borderLeftWidth: b.includes('borderLeft') ? 2 : 0, borderRightWidth: b.includes('borderRight') ? 2 : 0, borderStyle: 'solid' }} />
      ))}

      {/* ── Layar pilihan setelah selesai / skip ─────────────────────────── */}
      {ended && (
        <motion.div
          className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-6 px-6 text-center"
          style={{ background: 'radial-gradient(ellipse at center, rgba(8,11,18,0.94) 0%, rgba(4,5,10,0.99) 100%)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduced ? 0 : 1.0 }}
        >
          <motion.p
            initial={{ opacity: 0, y: reduced ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0 : 0.9, delay: reduced ? 0 : 0.2 }}
            style={{ fontFamily: 'var(--font-display)', color: 'var(--cy-cyan)', fontSize: 'clamp(1.5rem, 5.6vw, 2.8rem)', letterSpacing: '0.1em', textShadow: '0 0 18px rgba(0,240,255,0.5)' }}
          >
            ようこそ、電脳へ。
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduced ? 0 : 0.9, delay: reduced ? 0 : 0.5 }}
            className="font-sans font-semibold"
            style={{ color: 'rgba(180,205,225,0.8)', fontSize: 'clamp(0.85rem, 2.4vw, 1.08rem)' }}
          >
            Selamat datang di 電脳.
          </motion.p>

          <motion.div
            className="mt-3 flex w-full max-w-md flex-col gap-3"
            initial={{ opacity: 0, y: reduced ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0 : 0.9, delay: reduced ? 0 : 0.8 }}
          >
            <button
              type="button"
              onClick={explore}
              className="w-full px-5 py-3.5 font-display font-bold tracking-[0.14em] transition-colors focus:outline-none focus-visible:ring-2"
              style={{ border: '1px solid rgba(0,240,255,0.5)', background: 'linear-gradient(160deg, rgba(0,240,255,0.12), rgba(0,240,255,0.03))', color: 'var(--cy-cyan)', borderRadius: 0, boxShadow: '0 0 22px rgba(0,240,255,0.25)' }}
            >
              Jelajahi Peta 家
            </button>
            <button
              type="button"
              onClick={enter}
              className="w-full px-5 py-3 font-display font-semibold tracking-[0.14em] transition-colors focus:outline-none focus-visible:ring-2"
              style={{ border: '1px solid rgba(255,226,58,0.55)', background: 'var(--cy-kin)', color: '#05060A', borderRadius: 0, boxShadow: '0 0 22px rgba(255,226,58,0.35)' }}
            >
              Masuk ke 電脳
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* ── Kontrol: progress + skip ─────────────────────────────────────── */}
      {!ended && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 z-40 h-[2px]" style={{ background: 'rgba(0,240,255,0.14)' }}>
            <motion.div className="h-full origin-left" style={{ background: 'var(--cy-cyan)', scaleX: progress, width: '100%', boxShadow: '0 0 10px rgba(0,240,255,0.7)' }} />
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
              className="absolute bottom-6 left-6 z-50 flex items-center gap-2 px-3 py-1.5 font-mono text-[11px] font-semibold tracking-[0.16em] transition-colors focus:outline-none focus-visible:ring-2"
              style={{ border: '1px solid rgba(0,240,255,0.45)', color: 'var(--cy-cyan)', background: 'rgba(4,5,10,0.7)', borderRadius: 0 }}
              aria-label="Nyalakan suara"
            >
              <span aria-hidden="true">🔊</span> 音を出す
            </button>
          )}

          <button
            ref={skipRef}
            type="button"
            onClick={finish}
            className="absolute bottom-6 right-6 z-50 px-4 py-2 font-mono text-xs font-bold tracking-[0.28em] transition-colors focus:outline-none focus-visible:ring-2"
            style={{ border: '1px solid rgba(0,240,255,0.45)', color: 'var(--cy-cyan)', background: 'rgba(4,5,10,0.7)', borderRadius: 0 }}
            aria-label="Lewati cinematic"
          >
            スキップ
          </button>
        </>
      )}

      {/* Nama scene untuk pembaca layar (info penting tak bergantung animasi) */}
      <span className="sr-only" aria-live="polite">
        {CYBER_SCENES.flatMap((s) => s.lines.map((l) => l.jp)).join(' ')}
      </span>
    </motion.div>
  );
}

export default CyberCinematic;
