// ─────────────────────────────────────────────────────────────────────────────
// MeijiArtwork — "cetakan Meiji" buatan SENDIRI sebagai hiasan era Meiji di Home
// (kartu JLPT N5 / "Pelajaran Berikutnya"). 100% SVG lokal → bebas isu hak cipta.
// Pasangan dari EdoPrintArt (ukiyo-e, Edo-only): di Heian ruang kartu N5 diisi
// lukisan 月夜; di Edo diisi cetakan Fuji; di Meiji dulu KOSONG (hambar).
//
// Motif (docs/tema/meiji.md): 銀座煉瓦街 Ginza brick street + 瓦斯灯 gaslight
// (lampu gas jalan — ikon "malam Meiji") + 蒸気機関車 steam locomotive + 電信柱
// telegraph poles + asap pabrik. Bahasa rupa = nishiki-e/letterpress: blok warna
// DATAR + garis ukir tipis (bukan gradien mengkilap). Palet = token Meiji
// (--renga-val bata, --gas-val amber gaslight, --sumi-val tinta, --kinari-val
// kertas koran).
//
// viewBox SENGAJA portrait (272×300 ≈ rasio kartu) supaya preserveAspectRatio
// "slice" TIDAK memotong kereta/asap di tepi — seluruh scene tetap terlihat.
//
// Hanya tampil di era Meiji (gate .meiji-art di src/index.css). Dekoratif →
// aria-hidden + pointer-events:none (di CSS).
// ─────────────────────────────────────────────────────────────────────────────
import { useId } from 'react';

export function MeijiPrintArt({ className = '' }) {
  // useId() bisa memuat ':' (tak sah di url(#id)) → bersihkan.
  const uid = useId().replace(/:/g, '');
  const sky = `meijiSky-${uid}`;
  const brick = `meijiBrick-${uid}`;
  const gas = `meijiGas-${uid}`;

  return (
    <svg
      viewBox="0 0 272 300"
      className={`meiji-art meiji-art--print ${className}`}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        {/* Langit senja 夕焼け — sapuan hangat di tepi atas (gas + bata). */}
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--gas-val)" stopOpacity="0.34" />
          <stop offset="46%" stopColor="var(--renga-val)" stopOpacity="0.14" />
          <stop offset="100%" stopColor="var(--renga-val)" stopOpacity="0" />
        </linearGradient>
        {/* Fasad 煉瓦 — blok bata datar, makin gelap ke bawah (bukan glow). */}
        <linearGradient id={brick} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--renga-val)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--renga-val)" stopOpacity="0.5" />
        </linearGradient>
        {/* Halo 瓦斯灯 — kolam cahaya amber hangat (khas malam Meiji). */}
        <radialGradient id={gas} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--gas-val)" stopOpacity="0.95" />
          <stop offset="45%" stopColor="var(--gas-val)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--gas-val)" stopOpacity="0" />
        </radialGradient>
        {/* Garis ukir 彫り — hatching miring ala cetak kayu/nishiki-e (tekstur,
            bukan blok datar modern). Dipakai untuk bayangan & langit. */}
        <pattern id={`meijiHatch-${uid}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="var(--sumi-val)" strokeWidth="1" />
        </pattern>
        <pattern id={`meijiSkyHatch-${uid}`} width="8" height="8" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="8" y2="0" stroke="var(--sumi-val)" strokeWidth="0.6" />
        </pattern>
      </defs>

      {/* Langit senja */}
      <rect x="0" y="0" width="272" height="300" fill={`url(#${sky})`} />
      {/* Garis ukir mendatar 彫り — langit "tergores" seperti cetakan kayu. */}
      <rect x="0" y="0" width="272" height="150" fill={`url(#meijiSkyHatch-${uid})`} opacity="0.16" />

      {/* Pabrik & asap 煙 — siluet industrial di kejauhan (kiri-atas). */}
      <g fill="var(--sumi-val)" opacity="0.5">
        <rect x="6" y="150" width="26" height="60" />
        <rect x="36" y="136" width="14" height="74" />
        <rect x="52" y="160" width="22" height="50" />
        {/* cerobong 煙突 */}
        <rect x="40" y="110" width="7" height="28" />
      </g>
      <g fill="var(--nezumi-val)" opacity="0.5">
        <circle cx="43" cy="102" r="6" />
        <circle cx="52" cy="90" r="8" />
        <circle cx="63" cy="80" r="5" />
      </g>

      {/* 電信柱 tiang telegraf — garis tegak + palang (tanda zaman modern). */}
      <g stroke="var(--sumi-val)" strokeWidth="1.3" opacity="0.6">
        <line x1="84" y1="104" x2="84" y2="212" />
        <line x1="77" y1="114" x2="91" y2="114" />
        <line x1="77" y1="123" x2="91" y2="123" />
      </g>
      {/* Kawat 電線 — lengkung menggantung antar tiang. */}
      <g fill="none" stroke="var(--sumi-val)" strokeWidth="0.9" opacity="0.4">
        <path d="M84 114 q56 18 112 0" />
        <path d="M84 123 q56 21 112 2" />
      </g>

      {/* 銀座煉瓦街 — deretan fasad bata dengan jendela lengkung アーチ. */}
      <g>
        {/* gedung 1 */}
        <rect x="104" y="122" width="58" height="92" fill={`url(#${brick})`} />
        <rect x="104" y="122" width="58" height="92" fill="none" stroke="var(--sumi-val)" strokeWidth="1.1" opacity="0.5" />
        <g fill="var(--kinari-val)" opacity="0.78">
          <path d="M111 140 a5 5 0 0 1 10 0 v12 h-10 z" />
          <path d="M127 140 a5 5 0 0 1 10 0 v12 h-10 z" />
          <path d="M143 140 a5 5 0 0 1 10 0 v12 h-10 z" />
          <path d="M111 165 a5 5 0 0 1 10 0 v12 h-10 z" />
          <path d="M127 165 a5 5 0 0 1 10 0 v12 h-10 z" />
          <path d="M143 165 a5 5 0 0 1 10 0 v12 h-10 z" />
        </g>
        {/* gedung 2 (lebih tinggi) */}
        <rect x="166" y="100" width="54" height="114" fill={`url(#${brick})`} />
        <rect x="166" y="100" width="54" height="114" fill="none" stroke="var(--sumi-val)" strokeWidth="1.1" opacity="0.5" />
        <g fill="var(--kinari-val)" opacity="0.78">
          <path d="M173 118 a5 5 0 0 1 10 0 v12 h-10 z" />
          <path d="M189 118 a5 5 0 0 1 10 0 v12 h-10 z" />
          <path d="M173 143 a5 5 0 0 1 10 0 v12 h-10 z" />
          <path d="M189 143 a5 5 0 0 1 10 0 v12 h-10 z" />
          <path d="M173 168 a5 5 0 0 1 10 0 v12 h-10 z" />
          <path d="M189 168 a5 5 0 0 1 10 0 v12 h-10 z" />
        </g>
        {/* atap bergerigi / parapet */}
        <rect x="166" y="94" width="54" height="8" fill="var(--sumi-val)" opacity="0.55" />
        {/* garis ukir vertikal di tepi fasad (letterpress rule) */}
        <g stroke="var(--sumi-val)" strokeWidth="0.6" opacity="0.28">
          <line x1="110" y1="122" x2="110" y2="214" />
          <line x1="172" y1="100" x2="172" y2="214" />
        </g>
      </g>

      {/* 瓦斯灯 lampu gas jalan — kolam cahaya amber + tiang + kepala lampu. */}
      <g>
        <ellipse cx="238" cy="176" rx="40" ry="38" fill={`url(#${gas})`} />
        <line x1="238" y1="146" x2="238" y2="212" stroke="var(--sumi-val)" strokeWidth="2.4" opacity="0.85" />
        <path d="M231 146 h14 l-3 -7 h-8 z" fill="var(--sumi-val)" opacity="0.85" />
        <rect x="233" y="133" width="11" height="8" rx="2" fill="var(--gas-val)" opacity="0.95" />
        <line x1="238" y1="133" x2="238" y2="126" stroke="var(--sumi-val)" strokeWidth="1.3" opacity="0.7" />
      </g>

      {/* 蒸気機関車 kereta uap — boiler bulat + smokestack + kabin + roda. */}
      <g fill="var(--sumi-val)" opacity="0.92">
        {/* boiler depan (bulat) */}
        <rect x="150" y="196" width="48" height="20" rx="9" />
        {/* kabin masinis */}
        <rect x="196" y="182" width="22" height="34" rx="2" />
        {/* smokestack 煙突 kereta (kerucut lebar = tanda lokomotif uap) */}
        <path d="M158 196 l-3 -13 h14 l-3 13 z" />
        {/* dome boiler */}
        <path d="M176 196 a6 5 0 0 1 12 0 z" />
      </g>
      <g fill="var(--sumi-val)" opacity="0.9">
        <circle cx="164" cy="220" r="5.5" />
        <circle cx="182" cy="220" r="5.5" />
        <circle cx="202" cy="220" r="5.5" />
      </g>
      <g fill="var(--nezumi-val)" opacity="0.5">
        <circle cx="158" cy="176" r="5" />
        <circle cx="168" cy="164" r="7" />
        <circle cx="181" cy="155" r="5" />
      </g>

      {/* Bayangan ukir 彫り — hatching miring di bawah fasad (kedalaman cetak). */}
      <g opacity="0.22">
        <rect x="104" y="196" width="116" height="12" fill={`url(#meijiHatch-${uid})`} />
        <rect x="0" y="214" width="272" height="14" fill={`url(#meijiHatch-${uid})`} />
      </g>

      {/* Rel 線路 — garis mendatar tempat kereta berdiri. */}
      <line x1="0" y1="226" x2="272" y2="226" stroke="var(--sumi-val)" strokeWidth="1.6" opacity="0.45" />
      <g stroke="var(--sumi-val)" strokeWidth="1" opacity="0.3">
        <line x1="14" y1="226" x2="14" y2="233" />
        <line x1="50" y1="226" x2="50" y2="233" />
        <line x1="86" y1="226" x2="86" y2="233" />
        <line x1="122" y1="226" x2="122" y2="233" />
        <line x1="158" y1="226" x2="158" y2="233" />
        <line x1="194" y1="226" x2="194" y2="233" />
        <line x1="230" y1="226" x2="230" y2="233" />
        <line x1="262" y1="226" x2="262" y2="233" />
      </g>
    </svg>
  );
}

export default MeijiPrintArt;
