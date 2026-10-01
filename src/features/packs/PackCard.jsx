import React from "react";
import { PACK_RARITY } from "../packs/packs";
import { packCardStyle, packCssVars, tierRank, accentInk } from "../packs/rarityStyle";
import { Glyph } from "../../components/icons/Glyph";

// Posisi 6 kilau (special) — deterministik, biar gak "random" tiap render.
const SPARKS = [
  [12, 18], [78, 12], [88, 52], [22, 74], [62, 86], [46, 6],
];

// Kartu Theme Pack v1.1 — WARNA dari palet KANON karakter, TREATMENT dari rarity.
// Semua keputusan visual (surface/frame/foil/pola/badge/motion) ada di rarityStyle.js.
export function PackCard({ pack, isActive, onToggle, isId }) {
  const { treatment, palette } = packCardStyle(pack);
  const rank = tierRank(pack.rarity);
  const rarityLabel = PACK_RARITY[pack.rarity]?.label || treatment.label;
  const desc = isId ? pack.desc : (pack.desc_en || pack.desc);

  // Emblem & judul makin besar makin tinggi tier (escalating).
  const emblemSize = rank >= 4 ? 56 : rank >= 3 ? 44 : 36;
  const titleCls = rank >= 4 ? 'text-3xl' : rank >= 3 ? 'text-2xl' : 'text-xl';

  return (
    <div
      className="packcard p-6"
      style={packCssVars(pack)}
      data-rarity={pack.rarity}
      data-motion={treatment.motion}
      data-surface={treatment.surface}
      data-frame={treatment.frame.style}
      data-foil={treatment.foil || undefined}
      data-badge={treatment.badge}
      data-shadow={treatment.shadow}
    >
      {/* Aura (special) — denyut warna kanon di belakang konten */}
      <span className="packcard-aura" aria-hidden="true" />

      {/* Pola washi per tier */}
      {treatment.pattern !== 'none' && (
        <span className="packcard-pattern" data-kind={treatment.pattern} aria-hidden="true" />
      )}

      {/* Kilau (special) */}
      {treatment.motion === 'full' && SPARKS.map(([x, y], i) => (
        <span
          key={i}
          className="packcard-spark"
          aria-hidden="true"
          style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${(i * 0.42).toFixed(2)}s` }}
        />
      ))}

      <div className="packcard-body flex flex-col flex-grow">
        <div className="flex items-start justify-between mb-4 gap-3">
          <span className="packcard-emblem" aria-hidden="true">
            <Glyph name={palette.emblem} size={emblemSize} strokeWidth={2} />
          </span>
          <span
            className="packcard-badge text-[10px] font-black uppercase tracking-[0.2em] px-2 py-1"
            style={treatment.badge === 'outline'
              ? undefined
              : { background: 'var(--accent)', color: accentInk(palette.accent) }}
          >
            {rarityLabel}
          </span>
        </div>

        <h3 className={`font-serif font-black leading-tight ${titleCls}`}>{pack.kanji}</h3>
        <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-70 mb-2">{pack.name}</p>
        <div className="h-[3px] w-12 mb-3" style={{ background: 'var(--accent)' }} aria-hidden="true" />
        <p className="text-sm font-bold mb-3 flex-grow opacity-90">{desc}</p>
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-4 opacity-60">
          {pack.visual} · {pack.voice}
        </p>

        <button
          type="button"
          onClick={() => onToggle(pack.id)}
          className={`py-3 font-black text-sm w-full border-4 border-sumi shadow-[4px_4px_0_0_#1a1a1a] active:translate-y-1 active:shadow-none transition-all ${
            isActive ? 'bg-matcha text-kinari-light' : 'bg-ai text-kinari-light'
          }`}
        >
          {isActive ? 'AKTIF ✓' : (isId ? 'PAKAI' : 'USE')}
        </button>
      </div>
    </div>
  );
}

export default PackCard;
