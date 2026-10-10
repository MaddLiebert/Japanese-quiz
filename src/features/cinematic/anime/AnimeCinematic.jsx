// ─────────────────────────────────────────────────────────────────────────────
// HISTORICAL CINEMATIC INTRO — era 多元 (Anime Multiverse).
//
// Orkestrator sama filosofinya dengan Heian/Edo/Meiji/Shōwa: SATU jam (rAF)
// menulis ke MotionValue `clock`; semua visual/teks/audio menurunkan dirinya
// dari jam itu (tidak ada setState per frame). Yang berbeda HANYA:
//   • data   → ANIME_SCENES (anime/data/scenes.js)
//   • visual → view 多元 (anime/scenes/AnimeScenes.jsx)
//   • token  → palet halaman manga (--an-*: shiro, sumi, shu, sora, sakura, gold)
//   • ambience/SFX → mood 多元 (burst/adventure/youth/horror/finale)
//
// Mesin timeline + komponen SceneLayer/SceneText DIPAKAI ULANG (bukan disalin):
// SceneText murni prop-driven dan hanya membaca token --emk-* + --font-display,
// jadi cukup mengganti nilai token itu.
//
// Setelah selesai / di-skip: layar pilihan
//   • "Jelajahi Peta 多元" → onExplore() (navigasi halaman peta/sejarah)
//   • "Masuk ke 多元"      → onDone()
// A11y: role="dialog" aria-modal, fokus ke tombol skip, ESC, reduced-motion.
// ─────────────────────────────────────────────────────────────────────────────
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, useMotionValueEvent, useAnimationFrame } from 'motion/react';
import { ANIME_SCENES } from './data/scenes';
import {
  totalDuration, sceneStartTimes, sceneAtTime, sceneOpacityAt,
  audioCues, voiceCues, visibleSceneIndices,
} from '../timeline';
import { AnimeBackdrop } from './components/AnimeBackdrop';
import { SceneLayer } from '../heian/components/SceneLayer';
import { useIsPortrait } from '../heian/components/useIsPortrait';
import { SceneText } from '../heian/components/SceneText';
import {
  SceneTear, SceneBurst, SceneMontage, SceneWorlds, SceneFinale,
} from './scenes/AnimeScenes';
import {
  playCinematicSfx, startHeianAmbience, setHeianMood,
  stopHeianAmbience, unlockHeianAudio, isAudioRunning, ambienceActive, enableHeianAudio,
} from '../heian/heianHistoryAudio';
import { playClipFile, preloadClips } from '../../../utils/sfx.js';

// Peta `visual` (data) → komponen latar 多元.
const SCENE_VIEWS = {
  tear: SceneTear,
  burst: SceneBurst,
  montage: SceneMontage,
  worlds: SceneWorlds,
  finale: SceneFinale,
};

const XFADE = 1.7;

// Teks scene, ikut cross-fade bersama lapisan visualnya (opacity dari clock).
function SceneTextLayer({ index, clock, reduced }) {
  const opacity = useTransform(clock, (t) => (reduced ? (t >= sceneStartTimes(ANIME_SCENES)[index] ? 1 : 0) : sceneOpacityAt(ANIME_SCENES, index, t, XFADE)));
  return (
    <motion.div className="pointer-events-none absolute inset-0 flex items-center justify-center" style={{ opacity }}>
      <SceneText scene={ANIME_SCENES[index]} clock={clock} sceneStart={sceneStartTimes(ANIME_SCENES)[index]} reduced={reduced} />
    </motion.div>
  );
}

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const sameIndices = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

export function AnimeCinematic({ onDone, onExplore, onSeen }) {
  const [reduced] = useState(prefersReduced);
  const portrait = useIsPortrait();
  const [ended, setEnded] = useState(false);
  const [audioOn, setAudioOn] = useState(() => isAudioRunning());
  const [mounted, setMounted] = useState(() => visibleSceneIndices(ANIME_SCENES, 0, XFADE));
  const skipRef = useRef(null);
  const doneRef = useRef(false);
  const seenRef = useRef(false);
  const firedRef = useRef(new Set());
  const moodRef = useRef(ANIME_SCENES[0].mood || 'burst');
  const mountedRef = useRef(mounted);
  const endedRef = useRef(false);
  const clockHoldRef = useRef(!isAudioRunning());

  const total = useMemo(() => totalDuration(ANIME_SCENES), []);
  const cues = useMemo(() => audioCues(ANIME_SCENES), []);
  const vcues = useMemo(() => voiceCues(ANIME_SCENES), []);
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
    const vis = visibleSceneIndices(ANIME_SCENES, t, XFADE);
    if (!sameIndices(vis, mountedRef.current)) {
      mountedRef.current = vis;
      setMounted(vis);
    }
    const mood = ANIME_SCENES[sceneAtTime(ANIME_SCENES, t)].mood || 'burst';
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

  const sceneIndex = sceneAtTime(ANIME_SCENES, 0);

  return (
    <motion.div
      className="fixed inset-0 z-[200] overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Cinematic 多元"
      style={{
        // Token cinematic 多元 — SHIRO (halaman manga) + tinta + shu 朱 + sora 空 +
        // sakura 桜 + gold. --emk-* dipakai ulang oleh SceneText (mesin bersama).
        '--emk-paper': '#fdfcf8',
        '--emk-paper-2': '#f1eee6',
        '--emk-ink': '#1a1a1a',
        '--emk-gold': '#f0c862',
        '--emk-gold-bright': '#f5d98a',
        '--emk-shu': '#d3382f',
        '--an-shiro': '#fdfcf8',
        '--an-sumi': '#1a1a1a',
        '--an-shu': '#d3382f',
        '--an-sora': '#2b6cb0',
        '--an-sakura': '#f18bb0',
        '--an-gold': '#f0c862',
        fontFamily: 'var(--font-serif)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduced ? 0 : 0.9 }}
    >
      {/* Dasar: halaman manga 白紙 + grid panel + screentone (per mood scene) */}
      <AnimeBackdrop mood={ANIME_SCENES[sceneIndex].mood} clock={clock} reduced={reduced} />

      {/* Lapisan scene — cross-fade mulus (opacity dari clock). */}
      {mounted.map((i) => {
        const View = SCENE_VIEWS[ANIME_SCENES[i].visual] || SceneTear;
        return (
          <Fragment key={ANIME_SCENES[i].id}>
            <SceneLayer index={i} clock={clock} View={View} reduced={reduced} portrait={portrait} scenes={ANIME_SCENES} fade={XFADE} />
            <SceneTextLayer index={i} clock={clock} reduced={reduced} />
          </Fragment>
        );
      })}

      {/* Bingkai halaman: garis tinta tebal kiri-kanan (bahasa komik), bukan beton. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-2 sm:w-3" style={{ background: 'var(--an-sumi)', opacity: 0.9 }} />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-2 sm:w-3" style={{ background: 'var(--an-sumi)', opacity: 0.9 }} />

      {/* ── Layar pilihan setelah selesai / skip ─────────────────────────── */}
      {ended && (
        <motion.div
          className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-6 px-6 text-center"
          style={{ background: 'radial-gradient(ellipse at center, rgba(253,252,248,0.94) 0%, rgba(241,238,230,0.98) 100%)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduced ? 0 : 1.2 }}
        >
          <motion.p
            initial={{ opacity: 0, y: reduced ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0 : 1.0, delay: reduced ? 0 : 0.2 }}
            style={{ fontFamily: 'var(--font-display)', color: 'var(--an-sumi)', fontSize: 'clamp(1.6rem, 6vw, 3rem)', letterSpacing: '0.14em', filter: 'drop-shadow(5px 5px 0 rgba(20,20,18,0.85))' }}
          >
            ようこそ、多元へ。
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduced ? 0 : 1.0, delay: reduced ? 0 : 0.6 }}
            className="font-sans font-semibold"
            style={{ color: 'rgba(26,26,26,0.72)', fontSize: 'clamp(0.85rem, 2.4vw, 1.1rem)' }}
          >
            Selamat datang di Multiverse.
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
              className="w-full border-[3px] px-5 py-3.5 font-display font-bold tracking-[0.14em] transition-colors focus:outline-none focus-visible:ring-2"
              style={{ borderColor: 'var(--an-sumi)', background: 'linear-gradient(160deg, #d34a3c 0%, var(--an-shu) 70%, #8e2f26 100%)', color: '#fdfcf8', borderRadius: 6, filter: 'drop-shadow(5px 5px 0 rgba(20,20,18,0.5))' }}
            >
              Jelajahi Peta 多元
            </button>
            <button
              type="button"
              onClick={enter}
              className="w-full border-[3px] px-5 py-3 font-display font-semibold tracking-[0.14em] transition-colors focus:outline-none focus-visible:ring-2"
              style={{ borderColor: 'var(--an-sumi)', background: 'var(--an-shiro)', color: 'var(--an-sumi)', borderRadius: 6 }}
            >
              Masuk ke 多元
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* ── Kontrol: progress + skip ─────────────────────────────────────── */}
      {!ended && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 z-40 h-[3px]" style={{ background: 'rgba(20,20,18,0.16)' }}>
            <motion.div className="h-full origin-left" style={{ background: 'var(--an-shu)', scaleX: progress, width: '100%' }} />
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
              className="absolute bottom-6 left-6 z-50 flex items-center gap-2 border-[3px] px-3 py-1.5 font-display text-[11px] font-semibold tracking-[0.16em] transition-colors focus:outline-none focus-visible:ring-2"
              style={{ borderColor: 'rgba(26,26,26,0.6)', color: 'var(--an-sumi)', background: 'rgba(253,252,248,0.85)', borderRadius: 6 }}
              aria-label="Nyalakan suara"
            >
              <span aria-hidden="true">🔊</span> 音を出す
            </button>
          )}

          <button
            ref={skipRef}
            type="button"
            onClick={finish}
            className="absolute bottom-6 right-6 z-50 border-[3px] px-4 py-2 font-display text-xs font-bold tracking-[0.28em] transition-colors focus:outline-none focus-visible:ring-2"
            style={{ borderColor: 'var(--an-sumi)', color: 'var(--an-sumi)', background: 'rgba(253,252,248,0.85)', borderRadius: 6 }}
            aria-label="Lewati cinematic"
          >
            スキップ
          </button>
        </>
      )}

      {/* Nama scene untuk pembaca layar (info penting tak bergantung animasi) */}
      <span className="sr-only" aria-live="polite">
        {ANIME_SCENES.flatMap((s) => s.lines.map((l) => l.jp)).join(' ')}
      </span>
    </motion.div>
  );
}

export default AnimeCinematic;
