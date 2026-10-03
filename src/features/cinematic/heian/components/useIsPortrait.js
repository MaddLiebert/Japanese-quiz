// ─────────────────────────────────────────────────────────────────────────────
// useIsPortrait — true kalau viewport cenderung tegak (HP).
//
// Kenapa perlu: SVG scene memakai viewBox LANDSCAPE (1440×620). Di layar portrait
// dengan preserveAspectRatio="slice", SVG di-scale untuk MEMENUHI tinggi → bagian
// kiri/kanan terpotong parah (di HP hanya ~27% lebar terlihat). Jadi scene punya
// varian portrait: elemen penting dikumpulkan ke tengah + viewBox diringkas.
//
// Mengembalikan boolean reaktif (update saat resize/rotate).
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';

const query = () => (typeof window !== 'undefined' && typeof window.matchMedia === 'function'
  ? window.matchMedia('(orientation: portrait)').matches
  : false);

export function useIsPortrait() {
  const [portrait, setPortrait] = useState(query);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const mq = window.matchMedia('(orientation: portrait)');
    const onChange = () => setPortrait(mq.matches);
    // Safari lama: addListener; modern: addEventListener.
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else if (mq.removeListener) mq.removeListener(onChange);
    };
  }, []);

  return portrait;
}

export default useIsPortrait;
