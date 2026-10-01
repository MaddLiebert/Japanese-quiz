// MicOverlay.jsx — panel mic kompak (bottom sheet) saat mic aktif: ikon mic
// berdenyut + spectrum level suara + teks yang sedang terdengar (interim Web
// Speech API) + tombol Batal. TIDAK menutupi soal: tanpa lapisan gelap
// full-screen, panel menempel di bawah viewport sehingga konten tengah (soal)
// tetap terbaca & halaman tetap bisa di-scroll. Di-portal ke document.body
// (pola GachaSlotOverlay) supaya `fixed` tidak terkurung transform milik
// parent (motion.div di session).
//
// SPECTRUM (penting): tinggi bar HARUS mengikuti suara, bukan sekadar kedip
// opacity. Satu jalur aman untuk SEMUA perangkat: `level` dari event onlevel VAD
// SpeechRecognition sendiri (+ lonjakan tiap hasil interim) → bar sintetis
// (synthBars) yang naik-turun. TIDAK PERNAH membuka stream getUserMedia kedua —
// stream kedua pernah merebut mikrofon dari SpeechRecognition → ucapan tak
// terdeteksi (bug lama, juga di HP mode desktop / laptop sentuh).
// Kalau belum ada sinyal (izin ditolak / engine bisu), bar jatuh ke animasi CSS
// `mic-idle` (tinggi naik-turun, bukan cuma opacity) supaya panel tidak mati.
import { Mic } from 'lucide-react';
import { createPortal } from 'react-dom';
import { MIC_BAR_COUNT, displayHeights, synthBars } from './micSpectrum';
import { useLanguage } from '../../context/LanguageContext';

export function MicOverlay({ open = false, interim = '', level = 0, onCancel }) {
  const { language } = useLanguage();
  const id = language === 'id';

  if (!open) return null;

  // Bar aktivitas dari level VAD SpeechRecognition sendiri (TANPA getUserMedia).
  // Stream mikrofon KEDUA pernah merebut mic dari SpeechRecognition → ucapan
  // tidak terdeteksi; jalur meter real dihapus TOTAL supaya bug itu tak kembali
  // di perangkat apa pun (termasuk HP mode desktop / laptop sentuh).
  const lvl = Math.max(0, Math.min(1, Number(level) || 0));
  const source = lvl > 0.01 ? synthBars(lvl) : null;
  const heights = source ? displayHeights(source, 8) : null;
  const pulsing = !heights;                      // belum ada sinyal → animasi idle

  const overlay = (
    <div
      data-testid="mic-overlay"
      role="status"
      className="fixed inset-x-0 bottom-0 z-[200] p-3 sm:p-4 flex justify-center pointer-events-none"
    >
      <div className="pointer-events-auto w-full max-w-md bg-kinari border-[4px] border-sumi shadow-[6px_6px_0_0_#1a1a1a] px-4 py-3 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span
            className="w-9 h-9 shrink-0 bg-shu text-kinari-light border-[3px] border-sumi flex items-center justify-center transition-transform duration-100"
            style={heights ? { transform: `scale(${(1 + lvl * 0.35).toFixed(3)})` } : undefined}
          >
            <Mic size={18} className={heights ? '' : 'animate-pulse'} />
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
          data-live={heights ? 'true' : 'false'}
          className="flex items-end justify-center gap-1 h-8 w-full border-b-[3px] border-sumi pb-0.5"
        >
          {(heights || new Array(MIC_BAR_COUNT).fill(28)).map((h, i) => (
            <span
              key={i}
              className={`w-1.5 bg-shu ${pulsing ? 'mic-idle' : ''}`}
              style={{
                height: `${h}%`,
                ...(pulsing ? { animationDelay: `${i * 90}ms` } : { transition: 'height 90ms linear' }),
              }}
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
