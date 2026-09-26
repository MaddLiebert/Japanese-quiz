import { useEffect, useRef } from 'react';
import HanziWriter from 'hanzi-writer';
import { WRITE_COLORS, writeCanvasSize, writeQuizOptions } from './writeQuiz.js';
import { localCharDataLoader } from './strokeLoader.js';

/**
 * mode: 'animate' → putar animasi urutan goresan (sekali)
 *       'quiz'    → user menulis; tiap goresan dinilai
 * handlers (mode quiz): { onCorrectStroke, onMistake, onComplete }
 */
export function StrokeCanvas({
  char,
  size,
  mode = 'animate',
  quizMode = 'light',
  handlers = {},
  onStrokeCount,
  playKey = 0,          // naikkan angka ini untuk memutar ulang animasi
  showOutline = true,
}) {
  const mountRef = useRef(null);
  const writerRef = useRef(null);

  // (Re)buat writer setiap ganti karakter / mode / playKey.
  useEffect(() => {
    const el = mountRef.current;
    if (!el || !char) return;

    // Bersihkan SVG sebelumnya (StrictMode dev double-mount aman).
    el.innerHTML = '';
    const px = size || writeCanvasSize(typeof window !== 'undefined' ? window.innerWidth : 360);

    const writer = HanziWriter.create(el, char, {
      width: px,
      height: px,
      padding: Math.round(px * 0.08),
      showOutline,
      // showCharacter=false di DUA mode: mode animate menggambar goresan satu-satu,
      // mode quiz cuma menampilkan bayangan (outline) supaya user menulis sendiri.
      showCharacter: false,
      strokeColor: WRITE_COLORS.strokeColor,
      outlineColor: WRITE_COLORS.outlineColor,
      highlightColor: WRITE_COLORS.highlightColor,
      drawingColor: WRITE_COLORS.drawingColor,
      drawingWidth: Math.max(3, Math.round(px * 0.03)),
      strokeWidth: Math.max(2, Math.round(px * 0.018)),
      outlineWidth: Math.max(1, Math.round(px * 0.01)),
      strokeAnimationSpeed: 0.9,
      delayBetweenStrokes: 260,
      charDataLoader: localCharDataLoader,
      onLoadCharDataSuccess: (data) => {
        onStrokeCount?.(data?.strokes?.length ?? 0);
      },
      onLoadCharDataError: () => {
        onStrokeCount?.(0);
      },
    });
    writerRef.current = writer;

    if (mode === 'animate') {
      writer.animateCharacter();
    } else {
      writer.quiz(writeQuizOptions(quizMode, handlers));
    }

    return () => {
      try { writer.cancelQuiz(); } catch { /* noop */ }
      writerRef.current = null;
      el.innerHTML = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [char, mode, quizMode, playKey, size, showOutline]);

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
