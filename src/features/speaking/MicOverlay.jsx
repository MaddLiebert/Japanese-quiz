// MicOverlay.jsx — panel mic kompak (bottom sheet) saat mic aktif: ikon mic
// berdenyut + spectrum level suara + teks yang sedang terdengar (interim Web
// Speech API) + tombol Batal. TIDAK menutupi soal: tanpa lapisan gelap
// full-screen, panel menempel di bawah viewport sehingga konten tengah (soal)
// tetap terbaca & halaman tetap bisa di-scroll. Di-portal ke document.body
// (pola GachaSlotOverlay) supaya `fixed` tidak terkurung transform milik
// parent (motion.div di session).
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
      data-testid="mic-overlay"
      role="status"
      className="fixed inset-x-0 bottom-0 z-[200] p-3 sm:p-4 flex justify-center pointer-events-none"
    >
      <div className="pointer-events-auto w-full max-w-md bg-kinari border-[4px] border-sumi shadow-[6px_6px_0_0_#1a1a1a] px-4 py-3 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 shrink-0 bg-shu text-kinari-light border-[3px] border-sumi flex items-center justify-center animate-pulse">
            <Mic size={18} />
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-sumi/60">
            {id ? 'Mendengarkan…' : 'Listening…'}
          </span>
          <span className="flex-grow" />
          <button
            type="button"
            data-testid="mic-cancel"
            onClick={onCancel}
            className="px-3 py-1.5 bg-kinari text-sumi border-[3px] border-sumi font-black text-[10px] uppercase tracking-widest shadow-[3px_3px_0_0_#1a1a1a] active:translate-y-[2px] active:shadow-none transition-all"
          >
            {id ? 'Batal' : 'Cancel'}
          </button>
        </div>

        <div
          data-testid="mic-spectrum"
          data-live={live ? 'true' : 'false'}
          className="flex items-end justify-center gap-1 h-8 w-full border-b-[3px] border-sumi pb-0.5"
        >
          {(live ? heights : new Array(MIC_BAR_COUNT).fill(28)).map((h, i) => (
            <span
              key={i}
              className={`w-1.5 bg-shu ${live ? '' : 'animate-pulse'}`}
              style={live ? { height: `${h}%` } : { height: `${h}%`, animationDelay: `${i * 90}ms` }}
            />
          ))}
        </div>

        <p className="min-h-[1.25rem] text-center">
          {interim ? (
            <span className="text-base font-serif font-bold text-sumi leading-relaxed">{interim}</span>
          ) : (
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-sumi/40">
              {id ? 'Ucapkan sesuatu…' : 'Say something…'}
            </span>
          )}
        </p>
      </div>
    </div>
  );

  return typeof document === 'undefined' ? overlay : createPortal(overlay, document.body);
}

export default MicOverlay;
