// MicOverlay.jsx — popup saat mic aktif: ikon mic + spectrum level suara +
// teks yang sedang terdengar (interim Web Speech API) + tombol Batal.
// Di-portal ke document.body (pola GachaSlotOverlay) supaya `fixed` tidak
// terkurung transform milik parent (motion.div di session).
import { Mic } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useMicLevel } from './useMicLevel';
import { MIC_BAR_COUNT, displayHeights } from './micSpectrum';
import { useLanguage } from '../../context/LanguageContext';

export function MicOverlay({ open = false, interim = '', onCancel }) {
  const { language } = useLanguage();
  const id = language === 'id';
  const bars = useMicLevel({ active: open });
  if (!open) return null;

  const heights = displayHeights(bars);            // [] = level suara tidak tersedia
  const live = heights.length > 0;

  const overlay = (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="mic-overlay"
      className="fixed inset-0 z-[200] bg-sumi/60 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-sm bg-kinari border-[4px] border-sumi shadow-[8px_8px_0_0_#1a1a1a] p-6 flex flex-col items-center gap-4">
        <div className="w-20 h-20 bg-shu text-kinari-light border-[4px] border-sumi flex items-center justify-center animate-pulse">
          <Mic size={40} />
        </div>
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-sumi/60">
          {id ? 'Mendengarkan…' : 'Listening…'}
        </p>

        <div
          data-testid="mic-spectrum"
          data-live={live ? 'true' : 'false'}
          className="flex items-end justify-center gap-1 h-16 w-full border-b-[3px] border-sumi pb-1"
        >
          {(live ? heights : new Array(MIC_BAR_COUNT).fill(28)).map((h, i) => (
            <span
              key={i}
              className={`w-1.5 bg-shu ${live ? '' : 'animate-pulse'}`}
              style={live ? { height: `${h}%` } : { height: `${h}%`, animationDelay: `${i * 90}ms` }}
            />
          ))}
        </div>

        <div className="w-full min-h-[3.5rem] border-[3px] border-sumi bg-kinari-light px-4 py-3 text-center">
          {interim ? (
            <p className="text-lg font-serif font-bold text-sumi leading-relaxed">{interim}</p>
          ) : (
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sumi/40">
              {id ? 'Ucapkan sesuatu…' : 'Say something…'}
            </p>
          )}
        </div>

        <button
          type="button"
          data-testid="mic-cancel"
          onClick={onCancel}
          className="w-full py-3 bg-kinari text-sumi border-[3px] border-sumi font-black text-xs uppercase tracking-widest shadow-[3px_3px_0_0_#1a1a1a] active:translate-y-[2px] active:shadow-none transition-all"
        >
          {id ? 'Batal' : 'Cancel'}
        </button>
      </div>
    </div>
  );

  return typeof document === 'undefined' ? overlay : createPortal(overlay, document.body);
}

export default MicOverlay;
