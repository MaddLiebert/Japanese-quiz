import { MedaruCoin } from './MedaruCoin';
import { Glyph } from './icons/Glyph';
import { useEra } from '../features/theme/EraContext';
import { medaruCopy } from '../features/progress/medaruCopy';

// ─────────────────────────────────────────────────────────────────────────────
// MedaruBadge — saldo medaru. Era Heian: "pita uang" 銭 (kertas washi bertepi
// emas + koin 和同開珎 + label KANA もん). Era lain: badge kuning lama
// (#ffd700 + "MEDARU"), tidak diubah.
//
// `amount` = angka saldo. `size` = 'sm' (badge inline) | 'lg' (header Shop).
// Nilai dibaca pembaca layar lewat teksnya sendiri (angka + satuan) → tanpa
// aria-label tambahan; ikonnya dekoratif.
// ─────────────────────────────────────────────────────────────────────────────

export function MedaruBadge({ amount = 0, size = 'sm', className = '' }) {
  const { era } = useEra();
  const T = medaruCopy(era);
  const n = (Number(amount) || 0).toLocaleString();
  const lg = size === 'lg';

  if (era === 'heian') {
    return (
      <span className={`era-money ${lg ? 'era-money--lg' : ''} ${className}`}>
        <MedaruCoin size={lg ? 20 : 15} />
        <span className={`era-money__num font-black ${lg ? 'text-base' : 'text-xs'}`}>{n}</span>
        <span className={`font-black tracking-[0.15em] opacity-70 ${lg ? 'text-xs' : 'text-[10px]'}`}>
          {T.name}
        </span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center bg-[#ffd700] text-sumi font-black border-[2px] border-sumi shadow-[3px_3px_0_0_#1a1a1a] ${
        lg ? 'text-xs px-3 py-1.5' : 'text-[11px] px-2 py-1'
      } ${className}`}
    >
      <Glyph name="coin" className="mr-1" />
      {n} MEDARU
    </span>
  );
}

export default MedaruBadge;
