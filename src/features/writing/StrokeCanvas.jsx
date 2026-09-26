import { useEffect, useRef } from 'react';
import HanziWriter from 'hanzi-writer';
import { writeCanvasSize, writeQuizOptions, writeLevel, writeColorsFor, DEFAULT_WRITE_LEVEL } from './writeQuiz.js';
import { localCharDataLoader } from './strokeLoader.js';
import { useTheme } from '../../context/ThemeContext.jsx';

/**
 * mode: 'animate' → putar animasi urutan goresan (sekali)
 *       'quiz'    → user menulis; tiap goresan dinilai
 * level (mode quiz): 'trace' | 'memory' | 'blind' — lihat WRITE_LEVELS.
 *   - trace : bayangan selalu tampak (jiplak)
 *   - memory: animasi diputar SEKALI dulu, lalu kuis tanpa bayangan
 *   - blind : langsung kuis tanpa bayangan
 * handlers (mode quiz): { onCorrectStroke, onMistake, onComplete }
 */
export function StrokeCanvas({
  char,
  size,
  mode = 'animate',
  level = DEFAULT_WRITE_LEVEL,
  handlers = {},
  onStrokeCount,
  playKey = 0,          // naikkan angka ini untuk memutar ulang animasi
}) {
  const mountRef = useRef(null);
  const writerRef = useRef(null);
  const { theme } = useTheme();
  const colors = writeColorsFor(theme);

  const cfg = writeLevel(level);
  const showOutline = mode === 'quiz' ? cfg.showOutline : true;
  const preview = mode === 'quiz' && cfg.preview;

  // (Re)buat writer setiap ganti karakter / mode / level / playKey.
  useEffect(() => {
    const el = mountRef.current;
    if (!el || !char) return;

    // Bersihkan SVG sebelumnya (StrictMode dev double-mount aman).
    el.innerHTML = '';
    const px = size || writeCanvasSize(typeof window !== 'undefined' ? window.innerWidth : 360);

    let writer = null;
    let started = false;

    // Kuis/animasi baru dijalankan setelah data termuat — biar preview
    // (level 'memory') tidak balapan dengan proses load.
    const run = () => {
      if (started || !writer) return;
      started = true;

      if (mode === 'animate') {
        writer.animateCharacter();
        return;
      }
      if (preview) {
        // Level 'memory': lihat bentuknya sekali, baru tulis dari ingatan.
        writer.showCharacter();
        writer.animateCharacter({
          onComplete: () => {
            writer.hideCharacter();
            writer.quiz(writeQuizOptions(level, handlers));
          },
        });
      } else {
        writer.quiz(writeQuizOptions(level, handlers));
      }
    };

    // showCharacter=false di DUA mode: mode animate menggambar goresan satu-satu,
    // mode quiz cuma menampilkan bayangan (kalau level-nya mengizinkan) supaya user menulis sendiri.
    writer = HanziWriter.create(el, char, {
      width: px,
      height: px,
      padding: Math.round(px * 0.08),
      showOutline,
      showCharacter: false,
      strokeColor: colors.strokeColor,
      outlineColor: colors.outlineColor,
      highlightColor: colors.highlightColor,
      drawingColor: colors.drawingColor,
      drawingWidth: Math.max(3, Math.round(px * 0.03)),
      strokeWidth: Math.max(2, Math.round(px * 0.018)),
      outlineWidth: Math.max(1, Math.round(px * 0.01)),
      strokeAnimationSpeed: 0.9,
      delayBetweenStrokes: 260,
      charDataLoader: localCharDataLoader,
      onLoadCharDataSuccess: (data) => {
        onStrokeCount?.(data?.strokes?.length ?? 0);
        run();
      },
      onLoadCharDataError: () => {
        onStrokeCount?.(0);
      },
    });
    writerRef.current = writer;

    return () => {
      try { writer?.cancelQuiz(); } catch { /* noop */ }
      writerRef.current = null;
      el.innerHTML = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [char, mode, level, playKey, size, theme]);

  return (
    <div className="relative inline-block">
      <div
        ref={mountRef}
        className="bg-kinari-light border-[3px] border-sumi shadow-[6px_6px_0_0_rgba(var(--sumi-val),1)]"
        style={{ lineHeight: 0 }}
      />
      {/* Garis bantu tengah (社中線) — dekoratif, tidak menghalangi pointer */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-full w-px bg-shu/15" />
        <div className="absolute top-1/2 left-0 w-full h-px bg-shu/15" />
      </div>
    </div>
  );
}

export default StrokeCanvas;
