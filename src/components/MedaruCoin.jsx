import { useContext, useId } from 'react';
import { EraContext } from '../features/theme/EraContext';
import { Glyph } from './icons/Glyph';

// ─────────────────────────────────────────────────────────────────────────────
// MedaruCoin — ikon mata uang medaru yang IKUT era. Menggantikan `Glyph
// name="coin"` (dua lingkaran tumpang-tindih ala koin Barat) yang dulu dipakai
// seragam di semua era, padahal di era Heian 平安 bentuk itu tidak masuk.
//
//   • Heian  → 和同開珎 (wadōkaichin): koin bulat BERLUBANG SEGI EMPAT, emas
//              kindei 金泥, tepi tinta — koin sungguhan zaman itu, bukan emoji.
//   • Era lain → tetap ikon garis `coin` (tampilan lama, tidak diubah).
//
// Era dibaca dari EraContext (aman: tanpa provider → jatuh ke tampilan lama).
// Bisa juga dipaksa lewat prop `era`. Dekoratif → aria-hidden; maknanya
// disampaikan angka + label di sebelahnya.
// ─────────────────────────────────────────────────────────────────────────────

export function MedaruCoin({ size = 16, era: eraProp, className = '' }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const ctx = useContext(EraContext);
  const era = eraProp ?? ctx?.era;

  if (era !== 'heian') {
    return <Glyph name="coin" size={size} className={className} />;
  }

  const goldId = `${uid}-gold`;
  const holeId = `${uid}-hole`;

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={`inline-block shrink-0 align-[-0.125em] ${className}`}
    >
      <defs>
        {/* Emas kindei: kilau di kiri-atas → sisi gelap di kanan-bawah. */}
        <radialGradient id={goldId} cx="36%" cy="30%" r="78%">
          <stop offset="0%" stopColor="#f8e8ad" />
          <stop offset="46%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#8a6f2e" />
        </radialGradient>
        {/* Lubang segi empat = benar-benar BOLONG (kertas di belakang tembus),
            bukan kotak gelap — itu yang bikin koin terbaca "koin Jepang". */}
        <mask id={holeId}>
          <rect width="24" height="24" fill="#fff" />
          <rect x="8.7" y="8.7" width="6.6" height="6.6" rx="0.5" fill="#000" />
        </mask>
      </defs>
      <circle cx="12" cy="12" r="10.6" fill={`url(#${goldId})`} mask={`url(#${holeId})`} />
      {/* Tepi tinta + rim dalam (koin dicetak, ada bibir). */}
      <circle cx="12" cy="12" r="10.6" fill="none" stroke="#5f4a1c" strokeWidth="1.1" />
      <circle cx="12" cy="12" r="8.9" fill="none" stroke="#7a6128" strokeWidth="0.7" opacity="0.65" />
      {/* Empat tanda aksara di sekeliling lubang (samar di ukuran kecil, tapi
          memberi tekstur koin zaman itu — bukan cakram kosong). */}
      <g stroke="#6b531f" strokeWidth="0.9" strokeLinecap="round" opacity="0.7">
        <line x1="12" y1="5.4" x2="12" y2="7.3" />
        <line x1="12" y1="16.7" x2="12" y2="18.6" />
        <line x1="5.4" y1="12" x2="7.3" y2="12" />
        <line x1="16.7" y1="12" x2="18.6" y2="12" />
      </g>
      {/* Kilau tipis (highlight) di kiri-atas. */}
      <path d="M6.4 6.2 A7.4 7.4 0 0 1 9.6 4.6" fill="none" stroke="#fffbe8" strokeWidth="1" strokeLinecap="round" opacity="0.75" />
    </svg>
  );
}

export default MedaruCoin;
