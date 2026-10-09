// ─────────────────────────────────────────────────────────────────────────────
// ShowaArtwork — scene beton Shōwa buatan SENDIRI sebagai hiasan era Shōwa di
// Home (kartu JLPT N5 / "Pelajaran Berikutnya"). 100% SVG lokal → bebas hak
// cipta. Pasangan EdoPrintArt (ukiyo-e) & MeijiPrintArt (cetakan): di Heian
// ruang kartu N5 diisi lukisan 月夜, di Edo ukiyo-e, di Meiji cetakan — di
// Shōwa dulu KOSONG ("hambar").
//
// Motif (docs/tema/showa.md §6/§7/§16): "昭和 = コンクリートの時代" — zaman
// beton. Scene ini SENGAJA BEDA dari hero (hero = 電柱 + 看板 + 東京タワー
// berdiri): di sini kota dilihat sebagai RUANG HIDUP + KECEPATAN —
//   • 新幹線 shinkansen 1964 melintas di jalur layang (kecepatan = jalan menuju
//     ujian N5). Ikon pemulihan & "melaju".
//   • 団地 danchi — blok beton berjendela SERAGAM (団地グリッド), sebagian
//     menyala sodium (夜の団地).
//   • 電柱＋電線 tipis di latar + antena TV 白黒テレビ di atap (tanda 電化).
// Bahasa rupa = beton DATAR + sudut tajam + halftone (warisan cetak Meiji) +
// garis bekas cetakan 打ちっぱなし. Palet token Shōwa (--concrete-val beton,
// --gin-nezu-val abu perak, --sodium-val lampu sodium, --sumi-val tinta).
//
// viewBox SENGAJA landscape (420×280) — ruang kartu N5 LEBAR & pendek; portrait
// akan terpotong di kiri-kanan. preserveAspectRatio "slice".
//
// HANYA tampil di era Shōwa (gate .showa-art di src/index.css). Dekoratif →
// aria-hidden + pointer-events:none (di CSS).
// ─────────────────────────────────────────────────────────────────────────────
import { useId } from 'react';

export function ShowaPrintArt({ className = '' }) {
  // useId() bisa memuat ':' (tak sah di url(#id)) → bersihkan.
  const uid = useId().replace(/:/g, '');
  const sky = `showaSky-${uid}`;
  const winGrid = `showaWin-${uid}`;
  const dots = `showaDots-${uid}`;
  const hatch = `showaHatch-${uid}`;

  // Jendela 団地 yang MENYALA (sodium) — sejajar grid (tak beraturan = kota hidup).
  // Grid A: origin (78,68) · grid B: origin (258,88). Sel 16×20, jendela inset.
  // Blok A digeser ke kanan (x=72) supaya sudut kiri-atas tetap bersih untuk label
  // vertikal "Pelajaran Berikutnya" (z-20) — tak ketiban beton.
  const cell = (ox, oy, k, j) => [ox + 16 * k + 3.5, oy + 20 * j + 4.5];
  const A = (k, j) => cell(78, 68, k, j);
  const B = (k, j) => cell(258, 88, k, j);
  const lit = [
    A(0, 0), A(2, 1), A(4, 0), A(1, 2), A(3, 3), A(5, 1),
    B(0, 0), B(2, 1), B(4, 0), B(6, 1), B(1, 2), B(5, 2),
  ];

  return (
    <svg
      viewBox="0 0 420 280"
      className={`showa-art showa-art--print ${className}`}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        {/* Langit senja beton — datar: slate di atas → sodium hangat di horizon. */}
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--concrete-val)" stopOpacity="0.26" />
          <stop offset="58%" stopColor="var(--sodium-val)" stopOpacity="0.12" />
          <stop offset="100%" stopColor="var(--sodium-val)" stopOpacity="0.3" />
        </linearGradient>
        {/* 団地グリッド — jendela SERAGAM berulang (beton + kaca). */}
        <pattern id={winGrid} width="16" height="20" patternUnits="userSpaceOnUse">
          <rect x="3.5" y="4.5" width="9" height="11" rx="0.5" fill="var(--gin-nezu-val)" opacity="0.75" />
        </pattern>
        {/* Halftone — titik cetak (warisan Meiji, benang merah cetak). */}
        <pattern id={dots} width="9" height="9" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.9" fill="var(--sumi-val)" />
        </pattern>
        {/* 打ちっぱなし — garis bekas cetakan beton (formwork), sudut tajam. */}
        <pattern id={hatch} width="14" height="14" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="14" stroke="var(--sumi-val)" strokeWidth="0.5" />
          <line x1="7" y1="0" x2="7" y2="14" stroke="var(--sumi-val)" strokeWidth="0.25" />
        </pattern>
      </defs>

      {/* Langit + halftone */}
      <rect x="0" y="0" width="420" height="150" fill={`url(#${sky})`} />
      <rect x="0" y="0" width="420" height="150" fill={`url(#${dots})`} opacity="0.14" />

      {/* Siluet kota jauh di horizon (datar, tanpa detail) */}
      <g fill="var(--sumi-val)" opacity="0.16">
        <rect x="0" y="118" width="26" height="32" />
        <rect x="30" y="126" width="20" height="24" />
        <rect x="196" y="122" width="30" height="28" />
        <rect x="232" y="130" width="22" height="20" />
        <rect x="390" y="120" width="30" height="30" />
      </g>

      {/* 電柱＋電線 tipis di latar (echo hero, bukan salinan) */}
      <g className="showa-art-pole" stroke="var(--sumi-val)" strokeWidth="1.4" opacity="0.55" fill="none">
        <line x1="404" y1="26" x2="404" y2="200" />
        <line x1="396" y1="40" x2="412" y2="40" />
        <line x1="396" y1="52" x2="412" y2="52" />
      </g>
      <g className="showa-art-wire" stroke="var(--sumi-val)" strokeWidth="0.9" opacity="0.4" fill="none">
        <path d="M404 40 C 300 74, 160 66, 8 92" />
        <path d="M404 52 C 300 88, 160 80, 8 106" />
      </g>

      {/* 団地 danchi — blok beton berjendela seragam (団地グリッド) */}
      {/* blok A (tinggi, kiri-tengah — digeser kanan agar label vertikal bersih) */}
      <g>
        <rect className="showa-art-concrete" x="74" y="62" width="104" height="88" />
        <rect x="80" y="68" width="92" height="76" fill={`url(#${winGrid})`} />
        <line x1="70" y1="62" x2="182" y2="62" stroke="var(--sumi-val)" strokeWidth="1.4" opacity="0.7" />
        {/* antena TV 白黒テレビ di atap */}
        <g stroke="var(--sumi-val)" strokeWidth="1.1" opacity="0.7" fill="none">
          <line x1="98" y1="62" x2="98" y2="40" />
          <line x1="90" y1="46" x2="106" y2="46" />
          <line x1="92" y1="52" x2="104" y2="52" />
          <line x1="152" y1="62" x2="152" y2="48" />
          <line x1="146" y1="52" x2="158" y2="52" />
        </g>
      </g>
      {/* blok B (rendah, kanan) */}
      <g>
        <rect className="showa-art-concrete" x="252" y="82" width="130" height="68" />
        <rect x="258" y="88" width="118" height="56" fill={`url(#${winGrid})`} />
        <line x1="248" y1="82" x2="386" y2="82" stroke="var(--sumi-val)" strokeWidth="1.4" opacity="0.7" />
        <g stroke="var(--sumi-val)" strokeWidth="1.1" opacity="0.7" fill="none">
          <line x1="300" y1="82" x2="300" y2="64" />
          <line x1="294" y1="68" x2="306" y2="68" />
        </g>
      </g>

      {/* Jendela MENYALA (sodium) — tak beraturan */}
      <g className="showa-art-window">
        {lit.map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="9" height="11" rx="0.5" />
        ))}
      </g>

      {/* Tanah / permukaan (kertas bersih, sebagian besar ter-mask) */}
      <rect x="0" y="150" width="420" height="130" fill="var(--kinari-val)" opacity="0.5" />

      {/* Jalur layang — girder beton + tiang penyangga */}
      <g>
        <rect className="showa-art-girder" x="0" y="196" width="420" height="10" />
        <rect x="0" y="196" width="420" height="10" fill={`url(#${hatch})`} opacity="0.25" />
        <g className="showa-art-pier">
          <rect x="66" y="206" width="10" height="44" />
          <rect x="200" y="206" width="10" height="44" />
          <rect x="334" y="206" width="10" height="44" />
        </g>
      </g>

      {/* 新幹線 shinkansen — badan putih + pita biru + hidung melancip (1964) */}
      <g>
        {/* garis gerak di belakang (kiri) */}
        <g className="showa-art-speed" stroke="var(--sumi-val)" strokeWidth="1.6" opacity="0.35" fill="none" strokeLinecap="round">
          <line x1="20" y1="182" x2="86" y2="182" />
          <line x1="10" y1="190" x2="70" y2="190" />
          <line x1="34" y1="198" x2="92" y2="198" />
        </g>
        {/* badan kereta (hidung melancip ke kanan) */}
        <path className="showa-art-train" d="M118 178 H300 C332 178 346 186 356 196 L118 196 Z" />
        {/* pita biru khas 0系 */}
        <path className="showa-art-train-stripe" d="M120 187 H330 C340 187 348 191 352 195 L120 195 Z" />
        {/* strip jendela gelap */}
        <rect className="showa-art-train-window" x="132" y="181" width="150" height="5" rx="1" />
        {/* lampu depan sodium di hidung */}
        <circle className="showa-art-train-light" cx="352" cy="194" r="2.4" />
      </g>

      {/* Embankment beton depan 打ちっぱなし (formwork hatch) */}
      <g>
        <rect className="showa-art-ground" x="0" y="250" width="420" height="30" />
        <rect x="0" y="250" width="420" height="30" fill={`url(#${hatch})`} opacity="0.22" />
      </g>
    </svg>
  );
}

export default ShowaPrintArt;
