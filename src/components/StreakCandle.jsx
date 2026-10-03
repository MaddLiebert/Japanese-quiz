import { useId, useState } from 'react';
import { motion } from 'motion/react';

// ─────────────────────────────────────────────────────────────────────────────
// StreakCandle — 和蝋燭 (wa-rousoku, lilin Jepang) di cangkir kuningan 燭台,
// untuk era Heian 平安. MENGGANTIKAN segel kotak 灯/消 yang dulu dipakai:
//   • streak hidup  → lilin MENYALA (nyala 炎 berdenyut + cahaya keemasan 金)
//   • streak putus  → lilin PADAM   (sumbu 芯 gelap + asap 煙 tipis naik)
//
// Kenapa SVG + `motion/react` (bukan kanvas / GSAP):
//   - Bentuknya kecil tapi harus TAJAM di semua ukuran → SVG, bukan bitmap.
//   - Ikut token tema (var --kinari/--kin/--shu/--sumi) → otomatis benar di
//     tema terang & gelap, dan menyatu dengan "bahasa bentuk Heian" (kertas +
//     tinta + emas kindei) yang sudah dipakai seluruh app.
//   - `motion/react` = mesin animasi yang SUDAH dipakai semua komponen era &
//     efek (EraPainting, MegumiShadow, NanamiShadow, …). Tidak menambah
//     dependensi baru; GSAP tidak terpasang di proyek ini.
//
// A11y: status nyala/padam = INFORMASI (bukan hiasan) → SVG diberi role="img"
// + aria-label yang ikut bahasa UI. reduced-motion: nyala/asap berhenti
// bergerak (bentuk & warna tetap, status tetap terbaca).
// ─────────────────────────────────────────────────────────────────────────────

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function StreakCandle({ lit = false, size = 42, label = '' }) {
  // id unik per instance → aman kalau lilin dipakai lebih dari sekali di satu
  // halaman (referensi `url(#…)` tidak saling menimpa).
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [reduced] = useState(prefersReduced);
  const height = Math.round((size * 96) / 64);

  const glowId = `${uid}-glow`;
  const waxId = `${uid}-wax`;
  const cupId = `${uid}-cup`;
  const flameId = `${uid}-flame`;
  const coreId = `${uid}-core`;

  return (
    <svg
      viewBox="0 0 64 96"
      width={size}
      height={height}
      role="img"
      aria-label={label || (lit ? 'Lilin menyala' : 'Lilin padam')}
      className="block shrink-0 select-none"
    >
      <defs>
        {/* Cahaya 光 — emas kin, luntur ke transparan. */}
        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--kin-val)" stopOpacity="0.62" />
          <stop offset="45%" stopColor="var(--kin-val)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--kin-val)" stopOpacity="0" />
        </radialGradient>
        {/* Badan lilin — gradien mendatar → kesan silinder (sisi gelap/terang). */}
        <linearGradient id={waxId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#c8b891" />
          <stop offset="26%" stopColor="#fbf3dc" />
          <stop offset="62%" stopColor="#ece0c4" />
          <stop offset="100%" stopColor="#b6a478" />
        </linearGradient>
        {/* Cangkir/dudukan — kuningan (kindei 金泥), senada tepi emas Heian. */}
        <linearGradient id={cupId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8a6f2e" />
          <stop offset="24%" stopColor="#e8c860" />
          <stop offset="54%" stopColor="#c9a227" />
          <stop offset="100%" stopColor="#7a6128" />
        </linearGradient>
        {/* Nyala 炎 — panas di pangkal (krem→kin), mendingin & memerah di ujung
            (shu kurenai) → merah Heian, bukan oranye web modern. */}
        <linearGradient id={flameId} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#fff8e2" />
          <stop offset="34%" stopColor="var(--kin-val)" />
          <stop offset="72%" stopColor="#e08a2e" />
          <stop offset="100%" stopColor="var(--shu-val)" stopOpacity="0.85" />
        </linearGradient>
        {/* Inti nyala 芯 — titik terpanas, hampir putih. */}
        <radialGradient id={coreId} cx="50%" cy="74%" r="62%">
          <stop offset="0%" stopColor="#fffdf2" />
          <stop offset="58%" stopColor="#ffe9a8" />
          <stop offset="100%" stopColor="#ffd166" stopOpacity="0.25" />
        </radialGradient>
      </defs>

      {/* Cahaya keemasan — hanya saat menyala, di belakang seluruh benda. */}
      {lit && (
        <motion.ellipse
          cx="32"
          cy="44"
          rx="30"
          ry="33"
          fill={`url(#${glowId})`}
          initial={false}
          animate={reduced ? { opacity: 0.55 } : { opacity: [0.42, 0.72, 0.46, 0.64, 0.42] }}
          transition={reduced ? { duration: 0 } : { duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Lilin — diredupkan saat padam (barang mati, bukan sumber cahaya). */}
      <g opacity={lit ? 1 : 0.55}>
        <path
          d="M24,52 L24,84 L40,84 L40,52 C40,49.8 36.4,48.4 32,48.4 C27.6,48.4 24,49.8 24,52 Z"
          fill={`url(#${waxId})`}
        />
        {/* Permukaan lilin meleleh + kilau badan (gloss silinder). */}
        <ellipse cx="32" cy="50.4" rx="8" ry="2.9" fill="#f7efd8" />
        <path d="M27.6,53.5 L27.6,81.5" stroke="#fffdf2" strokeWidth="1.8" strokeLinecap="round" opacity="0.5" />
        {/* Tetesan lilin 蝋 — detail kecil yang menandai lilin benar-benar hidup. */}
        <path d="M24.4,56.5 C23.2,61 23.4,67 24.8,69.2 C25.6,65.5 25.2,60 24.8,56.5 Z" fill="#dfd1ac" opacity="0.9" />
      </g>

      {/* Cangkir / dudukan 燭台 — digambar SETELAH lilin → pangkalnya "masuk" cangkir. */}
      <ellipse cx="32" cy="84" rx="16.5" ry="4.8" fill={`url(#${cupId})`} />
      <path d="M15.5,84 C15.5,84 18,94.5 32,94.5 C46,94.5 48.5,84 48.5,84 Z" fill={`url(#${cupId})`} />
      <ellipse cx="32" cy="94.5" rx="9" ry="2.3" fill="#7a6128" />
      <ellipse cx="32" cy="84" rx="16.5" ry="4.8" fill="none" stroke="#f2dd9a" strokeWidth="0.9" opacity="0.75" />

      {/* Sumbu 芯 — selalu tampak; saat padam ia satu-satunya jejak api. */}
      <path d="M32,50 L32,41" stroke="#2b241d" strokeWidth="1.7" strokeLinecap="round" />

      {lit ? (
        // Nyala 炎 — berdenyut dari PANGKAL (origin bawah-tengah) + goyang halus.
        <motion.g
          style={{ transformBox: 'view-box', transformOrigin: '32px 48px' }}
          initial={false}
          animate={reduced
            ? { scale: 1, rotate: 0, opacity: 1 }
            : { scale: [1, 1.07, 0.96, 1.04, 1], rotate: [-1.5, 2, -2, 1, 0], opacity: [0.96, 1, 0.94, 1, 0.96] }}
          transition={reduced ? { duration: 0 } : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path
            d="M32,13 C36.5,24 41.5,31 41.5,38.5 C41.5,44.5 37.2,48.5 32,48.5 C26.8,48.5 22.5,44.5 22.5,38.5 C22.5,31 27.5,24 32,13 Z"
            fill={`url(#${flameId})`}
          />
          <path
            d="M32,23 C34.8,30 37.2,34.5 37.2,38.8 C37.2,42.4 34.9,45 32,45 C29.1,45 26.8,42.4 26.8,38.8 C26.8,34.5 29.2,30 32,23 Z"
            fill={`url(#${coreId})`}
          />
        </motion.g>
      ) : (
        // Asap 煙 — tipis, naik lalu memudar (tanda api baru saja padam).
        <motion.path
          d="M32,45 C29.5,39 34.5,35 32,29 C29.5,23 34.5,19 33,13"
          fill="none"
          stroke="var(--sumi-val)"
          strokeWidth="1.7"
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={reduced ? { opacity: 0.32 } : { opacity: [0, 0.36, 0], y: [0, -9] }}
          transition={reduced ? { duration: 0 } : { duration: 3.6, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
    </svg>
  );
}

export default StreakCandle;
