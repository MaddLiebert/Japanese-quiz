// ─────────────────────────────────────────────────────────────────────────────
// HISTORICAL CINEMATIC INTRO — era Heian 平安.
//
// Orkestrator "mulus": SATU jam (rAF) menulis ke MotionValue `clock`, lalu semua
// visual/teks/audio menurunkan dirinya dari jam itu.
//   • TIDAK ada setState per frame → tidak ada re-render 60×/s (penyebab kaku).
//   • Scene saling MENEMBUS lewat cross-fade (SceneLayer: opacity dari clock).
//   • Teks tersingkap seperti ditulis kuas, terjemahan menyusul (SceneText).
//   • SFX berlapis + ambience per-mood terus hidup (heianHistoryAudio).
//   • Semua KONTEN di data/scenes.js → menambah scene tak menyentuh file ini.
//
// Setelah selesai / di-skip: layar pilihan
//   • "Pelajari sejarah Heian lebih lanjut" → onExplore() (navigasi halaman sejarah)
//   • "Masuk ke Heian"                       → onDone()
// Kontrol skip selalu tersedia; ESC = skip.
//
// A11y: role="dialog" aria-modal, fokus ke tombol skip, ESC, reduced-motion
// (tanpa gerak, timeline dipercepat, teks tetap terbaca).
// Audio: TIDAK autoplay melanggar kebijakan — di-unlock oleh gesture user;
// tanpa audio cinematic tetap berfungsi penuh.
// ─────────────────────────────────────────────────────────────────────────────
import { Fragment, useEffect, useId, useMemo, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, useMotionValueEvent, useAnimationFrame } from 'motion/react';
import {
  HEIAN_SCENES, totalDuration, sceneStartTimes, sceneAtTime,
  audioCues, voiceCues, visibleSceneIndices,
} from './data/scenes';
import { WashiBackdrop } from './components/WashiBackdrop';
import { SceneLayer } from './components/SceneLayer';
import { useIsPortrait } from './components/useIsPortrait';
import { SceneText } from './components/SceneText';
import { SceneCapital } from './scenes/SceneCapital';
import { SceneCourt } from './scenes/SceneCourt';
import { SceneKana } from './scenes/SceneKana';
import { SceneChange } from './scenes/SceneChange';
import { sceneOpacityAt } from './data/scenes';
import {
  playCinematicSfx, startHeianAmbience, setHeianMood,
  stopHeianAmbience, unlockHeianAudio, isAudioRunning, ambienceActive, enableHeianAudio,
} from './heianHistoryAudio';
// Voice narasi per-baris = file mp3 statis → pakai pemutar klip yang sudah ada
// (utils/sfx.js), bukan sistem audio baru.
import { playClipFile, preloadClips } from '../../../utils/sfx.js';

// Peta `visual` (data) → komponen latar. Menambah visual baru cukup di sini.
const SCENE_VIEWS = {
  ink: SceneCapital,
  court: SceneCourt,
  kana: SceneKana,
  change: SceneChange,
};

// Teks scene, ikut cross-fade bersama lapisan visualnya (opacity dari clock).
function SceneTextLayer({ index, clock, reduced }) {
  const opacity = useTransform(clock, (t) => (reduced ? (t >= sceneStartTimes()[index] ? 1 : 0) : sceneOpacityAt(HEIAN_SCENES, index, t)));
  return (
    <motion.div className="pointer-events-none absolute inset-0 flex items-center justify-center" style={{ opacity }}>
      <SceneText scene={HEIAN_SCENES[index]} clock={clock} sceneStart={sceneStartTimes()[index]} reduced={reduced} />
    </motion.div>
  );
}

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const sameIndices = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

export function HeianCinematic({ onDone, onExplore, onSeen }) {
  const [reduced] = useState(prefersReduced);
  const portrait = useIsPortrait();
  const [ended, setEnded] = useState(false);
  const [audioOn, setAudioOn] = useState(() => isAudioRunning());
  const [mounted, setMounted] = useState(() => visibleSceneIndices(HEIAN_SCENES, 0));
  const skipRef = useRef(null);
  const doneRef = useRef(false);
  const seenRef = useRef(false);
  const firedRef = useRef(new Set());       // id cue yang sudah diputar
  const moodRef = useRef(HEIAN_SCENES[0].mood || 'calm');
  const mountedRef = useRef(mounted);
  const endedRef = useRef(false);
  // Jam ditahan sampai audio live (lihat releaseHold). Kalau audio sudah jalan
  // saat mount (mis. replay), tidak perlu ditahan.
  const clockHoldRef = useRef(!isAudioRunning());

  const total = useMemo(() => totalDuration(), []);
  const cues = useMemo(() => audioCues(), []);
  const vcues = useMemo(() => voiceCues(), []);
  const timeScale = reduced ? 2.5 : 1;

  // ── Jam tunggal (MotionValue) ─────────────────────────────────────────────
  const clock = useMotionValue(0);
  const progress = useTransform(clock, (t) => Math.min(1, t / total));

  // Tandai "sudah dilihat" SEKALI — saat selesai alami MAUPUN di-skip.
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
  // Ref ke finish → dipakai listener ESC tanpa memicu warning deps.
  const finishRef = useRef(finish);
  finishRef.current = finish;

  const startRef = useRef(null);
  useAnimationFrame((now) => {
    if (endedRef.current) return;
    // Tahan jam sampai audio live (lihat releaseHold) — biar baris pertama tidak
    // terlewat saat AudioContext baru di-resume.
    if (clockHoldRef.current) { startRef.current = null; return; }
    if (startRef.current == null) startRef.current = now;
    const t = ((now - startRef.current) / 1000) * timeScale;
    if (t >= total) { clock.set(total); finish(); return; }
    clock.set(t);
  });

  // ── Reaksi terhadap jam: mount scene, mood ambience, jadwal audio ─────────
  useMotionValueEvent(clock, 'change', (t) => {
    // Scene yang perlu di-mount (jendela cross-fade + padding).
    const vis = visibleSceneIndices(HEIAN_SCENES, t);
    if (!sameIndices(vis, mountedRef.current)) {
      mountedRef.current = vis;
      setMounted(vis);
    }
    // Mood ambience mengikuti scene aktif.
    const mood = HEIAN_SCENES[sceneAtTime(HEIAN_SCENES, t)].mood || 'calm';
    if (mood !== moodRef.current) { moodRef.current = mood; setHeianMood(mood); }
    // SFX + voice (sekali per cue). Cue yang sudah lewat SEBELUM audio menyala
    // "dipensiunkan" tanpa dibunyikan (agar tidak terjadi ledakan bunyi sekaligus
    // saat user baru mengaktifkan suara); cue yang sedang berlangsung tetap hidup.
    const STALE = 0.6;
    for (const c of cues) {
      if (t >= c.at && !firedRef.current.has(c.id)) {
        if (isAudioRunning() && t - c.at <= STALE) { firedRef.current.add(c.id); playCinematicSfx(c.sfx, c.gain); }
        else if (t - c.at > STALE) firedRef.current.add(c.id);   // pensiun tanpa bunyi
      }
    }
    for (const v of vcues) {
      if (t >= v.at && !firedRef.current.has(v.id)) {
        if (isAudioRunning() && t - v.at <= STALE) { firedRef.current.add(v.id); playClipFile(v.path); }
        else if (t - v.at > STALE) firedRef.current.add(v.id);
      }
    }
  });

  // ── Ambience: mulai saat mount (sunyi bila belum di-unlock, menyala begitu
  //    gesture pertama datang). Dibersihkan saat unmount. ─────────────────────
  useEffect(() => {
    startHeianAmbience(moodRef.current);
    return () => stopHeianAmbience();
  }, []);

  // ── Voice: preload klip (TANPA memutar) supaya elemen <audio> sudah ter-decode
  //    dan baris pertama tidak telat saat dijadwalkan. ─────────────────────────
  useEffect(() => {
    preloadClips(vcues.map((v) => v.path));
  }, [vcues]);

  // ── Tahan jam sampai audio benar-benar live. ────────────────────────────────
  // AudioContext baru 'running' SETELAH gesture (resume async ~0.3–1.2s). Kalau
  // jam sudah jalan sejak mount, baris pertama (at 0.5s) lewat sebelum audio
  // menyala → kepensiun sebagai "stale" dan HILANG. Menahan jam membuat t=0
  // jatuh tepat saat audio siap. Ada fallback: kalau audio tetap terkunci
  // (tidak ada gesture), lepas tahanan setelah 1.5s agar cinematic tetap jalan
  // (tanpa suara) — cinematic TIDAK boleh macet karena audio diblokir.
  const releaseHold = () => { clockHoldRef.current = false; };
  useEffect(() => {
    const id = setTimeout(releaseHold, 1500);
    return () => clearTimeout(id);
  }, []);

  // ── Unlock audio oleh gesture user (TIDAK melanggar kebijakan browser) ─────
  useEffect(() => {
    const cleanup = unlockHeianAudio(() => {
      setAudioOn(true);
      releaseHold();
      if (!ambienceActive()) startHeianAmbience(moodRef.current);
      else setHeianMood(moodRef.current);
    });
    return cleanup;
  }, []);

  // ESC = skip + fokus ke tombol skip (a11y).
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

  const sceneIndex = sceneAtTime(HEIAN_SCENES, 0);
  const uid = useId();

  return (
    <motion.div
      className="fixed inset-0 z-[200] overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Cinematic sejarah Heian"
      style={{
        // Token cinematic: kertas & tinta tetap "fisik" di terang maupun gelap.
        '--emk-paper': '#f4ecd8',
        '--emk-paper-2': '#e6d8b8',
        '--emk-ink': '#1b1a17',
        '--emk-gold': '#a9821c',
        '--emk-gold-bright': '#eccd6a',
        '--emk-shu': '#c33a2c',
        fontFamily: 'var(--font-serif)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduced ? 0 : 0.9 }}
    >
      {/* Dasar: kertas washi + noda tinta bernapas (per mood scene aktif) */}
      <WashiBackdrop mood={HEIAN_SCENES[sceneIndex].mood} clock={clock} reduced={reduced} />

      {/* Lapisan scene — cross-fade mulus (opacity dari clock). */}
      {mounted.map((i) => {
        const View = SCENE_VIEWS[HEIAN_SCENES[i].visual] || SceneCapital;
        return (
          <Fragment key={HEIAN_SCENES[i].id}>
            <SceneLayer index={i} clock={clock} View={View} reduced={reduced} portrait={portrait} />
            {/* Teks scene — ikut cross-fade lapisannya. */}
            <SceneTextLayer index={i} clock={clock} reduced={reduced} />
          </Fragment>
        );
      })}

      {/* Bingkai gulungan: rol emas kiri-kanan */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-3 sm:w-4"
        style={{ background: 'linear-gradient(90deg, var(--emk-gold), var(--emk-gold-bright), var(--emk-gold))', opacity: 0.9 }} />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-3 sm:w-4"
        style={{ background: 'linear-gradient(90deg, var(--emk-gold), var(--emk-gold-bright), var(--emk-gold))', opacity: 0.9 }} />

      {/* ── Layar pilihan setelah selesai / skip ─────────────────────────── */}
      {ended && (
        <motion.div
          className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-6 px-6 text-center"
          style={{ background: 'radial-gradient(ellipse at center, rgba(16,12,8,0.72) 0%, rgba(10,7,5,0.92) 100%)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduced ? 0 : 1.2 }}
        >
          <motion.p
            initial={{ opacity: 0, y: reduced ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0 : 1.0, delay: reduced ? 0 : 0.2 }}
            style={{ fontFamily: 'var(--font-display)', color: 'var(--emk-gold-bright)', fontSize: 'clamp(1.4rem, 5vw, 2.6rem)', letterSpacing: '0.14em' }}
          >
            ようこそ、平安へ。
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduced ? 0 : 1.0, delay: reduced ? 0 : 0.6 }}
            className="font-sans font-semibold"
            style={{ color: 'rgba(244,236,216,0.82)', fontSize: 'clamp(0.85rem, 2.4vw, 1.1rem)' }}
          >
            Selamat datang di Heian.
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
              className="w-full border-2 px-5 py-3.5 font-sans font-bold tracking-[0.14em] transition-colors focus:outline-none focus-visible:ring-2"
              style={{ borderColor: 'var(--emk-gold)', background: 'rgba(169,130,28,0.16)', color: 'var(--emk-gold-bright)', borderRadius: 2 }}
            >
              Pelajari Sejarah Heian Lebih Lanjut
            </button>
            <button
              type="button"
              onClick={enter}
              className="w-full px-5 py-3 font-sans font-semibold tracking-[0.14em] transition-colors focus:outline-none focus-visible:ring-2"
              style={{ border: '1px solid rgba(244,236,216,0.35)', background: 'transparent', color: 'rgba(244,236,216,0.9)', borderRadius: 2 }}
            >
              Masuk ke Heian
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* ── Kontrol: progress + skip ─────────────────────────────────────── */}
      {!ended && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 z-40 h-[3px]" style={{ background: 'rgba(27,26,23,0.14)' }}>
            <motion.div
              className="h-full origin-left"
              style={{ background: 'var(--emk-gold)', scaleX: progress, width: '100%' }}
            />
          </div>

          {/* Petunjuk suara — muncul hanya saat audio belum menyala. Menyentuh
              layar (gesture apa pun) akan meng-unlock audio (tidak melanggar
              kebijakan autoplay). */}
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
              className="absolute bottom-6 left-6 z-50 flex items-center gap-2 border px-3 py-1.5 font-sans text-[11px] font-semibold tracking-[0.16em] transition-colors focus:outline-none focus-visible:ring-2"
              style={{ borderColor: 'rgba(169,130,28,0.6)', color: 'var(--emk-gold)', background: 'rgba(16,12,8,0.5)', borderRadius: 2 }}
              aria-label="Nyalakan suara"
            >
              <span aria-hidden="true">🔊</span> 音を出す
            </button>
          )}

          <button
            ref={skipRef}
            type="button"
            onClick={finish}
            className="absolute bottom-6 right-6 z-50 border-2 px-4 py-2 font-sans text-xs font-bold tracking-[0.28em] transition-colors focus:outline-none focus-visible:ring-2"
            style={{ borderColor: 'var(--emk-gold)', color: 'var(--emk-gold)', background: 'rgba(16,12,8,0.5)', borderRadius: 2 }}
            aria-label="Lewati cinematic"
          >
            スキップ
          </button>
        </>
      )}

      {/* Nama scene untuk pembaca layar (info penting tidak bergantung animasi) */}
      <span className="sr-only" id={`hb-scene-${uid}`} aria-live="polite">
        {HEIAN_SCENES.flatMap((s) => s.lines.map((l) => l.jp)).join(' ')}
      </span>
    </motion.div>
  );
}

export default HeianCinematic;
