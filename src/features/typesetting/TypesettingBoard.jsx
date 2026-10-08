import { motion, AnimatePresence } from 'motion/react';
import {
  posColor, isSmallBlock, POS_LABELS, typesettingLevel,
} from './typesetting.js';

// Peta warna token → kelas Tailwind STATIS (JIT butuh string literal, bukan
// hasil interpolasi). Tiap kelas = blok warna datar (bukan shadow — aturan Meiji).
const BLOCK_BG = {
  renga: 'bg-renga text-kinari-light',
  ai: 'bg-ai text-kinari-light',
  shu: 'bg-shu text-kinari-light',
  matcha: 'bg-matcha text-kinari-light',
  nezumi: 'bg-nezumi text-kinari-light',
  kin: 'bg-kin text-sumi',
  sumi: 'bg-sumi text-kinari-light',
};
const BLOCK_EDGE = {
  renga: 'border-renga', ai: 'border-ai', shu: 'border-shu',
  matcha: 'border-matcha', nezumi: 'border-nezumi', kin: 'border-kin', sumi: 'border-sumi',
};

// Satu blok 活字. Partikel = blok kecil (mengajarkan SOV tanpa ceramah).
// `looseDeg` (M5): blok miring/lepas saat streak putus — pemain "kencangkan".
function Block({ block, onPick, onRemove, reading, placed, looseDeg = 0 }) {
  const color = posColor(block.pos);
  const small = isSmallBlock(block.pos);
  const label = POS_LABELS[block.pos];
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0, rotate: looseDeg }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.14 }}
      onClick={() => (placed ? onRemove?.(block.id) : onPick?.(block.id))}
      title={label ? label.id : block.pos}
      className={`group relative shrink-0 border-[2px] ${BLOCK_EDGE[color]} ${BLOCK_BG[color]} ${
        small ? 'px-2.5 py-2 text-base' : 'px-4 py-3 text-2xl'
      } font-serif leading-none rounded-none transition-transform active:translate-y-[1px]`}
    >
      <span className="block">{block.jp}</span>
      {reading && block.reading && block.reading !== block.jp && (
        <span className="block text-[9px] font-sans opacity-80 mt-1 tracking-wide">{block.reading}</span>
      )}
    </motion.button>
  );
}

// ── TypesettingBoard ─────────────────────────────────────────────────────────
// props: { question, pool, remaining, placed, checked, misprint, level,
//          isSolved, index, total, onPlace, onRemove, onClear, onNext,
//          looseIndices = []  (M5 — index blok di kolam yang miring) }
export function TypesettingBoard({
  question, remaining, placed, checked, misprint, level = 1,
  isSolved, index, total, onPlace, onRemove, onClear, onNext, looseIndices = [],
}) {
  const lv = typesettingLevel(level);
  if (!question) return null;

  const looseSet = new Set(Array.isArray(looseIndices) ? looseIndices : []);
  const looseDegFor = (i) => (looseSet.has(i) ? (i % 2 === 0 ? -7 : 6) : 0);

  const byId = new Map([...question.parts, ...question.distractors].map((b) => [b.id, b]));
  const placedBlocks = placed.map((id) => byId.get(id)).filter(Boolean);
  const misprintPx = Math.round(misprint * 6); // 0..6px offset renga/biru

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Kepala kolom — garis aturan ganda (kepala koran). */}
      <div className="flex items-baseline justify-between border-b-[3px] border-double border-sumi pb-2">
        <span className="text-[10px] uppercase tracking-[0.34em] font-bold text-sumi/60">
          活字組み · {index + 1}/{total}
        </span>
        <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-renga">
          {lv.showReading ? 'Jiplak' : lv.showTranslation ? 'Ingat' : 'Buta'}
        </span>
      </div>

      {/* Kalimat terjemahan (kalau level menampilkan). */}
      {lv.showTranslation && (
        <p className="text-sm italic text-sumi/70 font-serif">“{question.translation}”</p>
      )}

      {/* ── Papan susun (composing stick) ─────────────────────────────────── */}
      <div
        className="relative min-h-[96px] border-[2px] border-sumi bg-kinari-light p-3 flex flex-wrap items-center gap-2"
        style={{
          // Misprint: offset renga/biru — bahasa bentuk Meiji (bukan shadow).
          boxShadow: 'none',
          transform: `translate(${misprintPx}px, ${misprintPx * 0.5}px)`,
          outline: checked && !isSolved ? '2px solid var(--renga-val)' : 'none',
          outlineOffset: misprintPx > 0 ? '0px' : '-2px',
          transition: 'transform 180ms linear',
        }}
      >
        {placedBlocks.length === 0 && (
          <span className="text-[11px] uppercase tracking-[0.28em] text-sumi/30 font-bold px-2">
            Susun blok di sini →
          </span>
        )}
        <AnimatePresence>
          {placedBlocks.map((b, i) => {
            const wrong = checked && !isSolved && checked.misprintAt === i;
            return (
              <div key={b.id} className="relative">
                <Block block={b} reading={lv.showReading} placed onRemove={onRemove} />
                {wrong && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 bg-shu text-kinari-light text-[10px] font-bold flex items-center justify-center border border-sumi">
                    ×
                  </span>
                )}
              </div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── Status cetakan ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between min-h-[28px]">
        {isSolved ? (
          <span className="text-xs font-bold uppercase tracking-[0.24em] text-matcha">
            ✓ Cetakan bersih
          </span>
        ) : checked && !isSolved ? (
          <span className="text-xs font-bold uppercase tracking-[0.24em] text-renga">
            ✗ Salah cetak — misprint {Math.round(misprint * 100)}%
          </span>
        ) : (
          <span className="text-xs font-bold uppercase tracking-[0.24em] text-sumi/40">
            {remaining.length} blok tersisa
          </span>
        )}
        {!isSolved && placed.length > 0 && (
          <button
            onClick={onClear}
            className="text-[10px] uppercase tracking-[0.24em] font-bold text-sumi/50 hover:text-shu transition-colors"
          >
            Bersihkan
          </button>
        )}
      </div>

      {/* ── Kolam blok (kotak huruf tukang cetak) ─────────────────────────── */}
      <div className="border-t-[2px] border-sumi pt-4">
        <div className="text-[9px] uppercase tracking-[0.3em] font-bold text-sumi/40 mb-3">
          Kotak huruf · 活字
        </div>
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {remaining.map((b, i) => (
              <Block key={b.id} block={b} reading={lv.showReading} onPick={onPlace} looseDeg={looseDegFor(i)} />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Aksi ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-[9px] uppercase tracking-[0.2em] font-bold text-sumi/40">
          {['noun', 'particle', 'verb', 'adj'].map((p) => (
            <span key={p} className="flex items-center gap-1.5">
              <span className={`inline-block w-3 h-3 border ${BLOCK_EDGE[posColor(p)]} ${BLOCK_BG[posColor(p)]}`} />
              {POS_LABELS[p].id}
            </span>
          ))}
        </div>
        {isSolved && (
          <button
            onClick={onNext}
            className="px-6 py-3 bg-sumi text-kinari-light border-[2px] border-sumi text-[11px] font-black uppercase tracking-[0.24em] rounded-none"
          >
            {index + 1 >= total ? 'Selesai' : 'Soal Berikutnya →'}
          </button>
        )}
      </div>
    </div>
  );
}

export default TypesettingBoard;
