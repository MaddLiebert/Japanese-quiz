import { Glyph } from "../../components/icons/Glyph";
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useUserStats } from '../progress/ProgressContext';
import { useLanguage } from '../../context/LanguageContext';
import { tutorialFor, unseenCount } from './tutorials';

// Avatar Saku chann — kotak neo-brutalis dengan kanji 咲 (saku) + wajah kaomoji.
// Gak ada file gambar maskot, jadi ini "muka" Saku yang konsisten dengan app.
function SakuFace({ size = 48 }) {
  return (
    <div
      className="relative shrink-0 border-[3px] border-sumi bg-shu flex flex-col items-center justify-center text-kinari-light shadow-[3px_3px_0_0_#1a1a1a] overflow-hidden"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span className="font-serif font-black leading-none" style={{ fontSize: size * 0.42 }}>咲</span>
      <span className="font-bold leading-none mt-0.5" style={{ fontSize: size * 0.17 }}>≧▽≦</span>
    </div>
  );
}

// Tombol mengapung "Tutorial" (kanan-bawah) + panel balon teks Saku.
// Context-aware: isi panel = tips halaman yang lagi dibuka (lihat tutorials.js).
export function TutorialButton() {
  const { progress, markTutorialSeen } = useUserStats();
  const { language } = useLanguage();
  const { pathname } = useLocation();
  const id = language === 'id';

  const topic = tutorialFor(pathname);
  const unseen = unseenCount(progress.tutorialSeen);

  const [open, setOpen] = useState(false);

  // Saat panel dibuka → tandai halaman ini sudah dibaca (hilangkan badge "baru").
  useEffect(() => {
    if (open) markTutorialSeen(pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pathname]);

  // Tutup pakai tombol Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      {/* Panel balon teks Saku */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="fixed bottom-24 right-4 z-[55] w-[calc(100vw-2rem)] max-w-sm"
            role="dialog"
            aria-modal="false"
            aria-label={id ? 'Panduan Saku' : "Saku's Guide"}
          >
            <div className="border-[3px] border-sumi bg-kinari-light shadow-[7px_7px_0_0_#1a1a1a]">
              {/* Header: muka Saku + judul topik */}
              <div className="flex items-center gap-3 p-3 border-b-[3px] border-sumi bg-kinari">
                <SakuFace size={44} />
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] uppercase tracking-[0.25em] font-black text-sumi/45">
                    {id ? 'Saku chann · Panduan' : 'Saku chann · Guide'}
                  </p>
                  <h3 className="text-sm font-serif font-black text-sumi truncate">
                    <Glyph name={topic.emblem} className="mr-1.5" />{id ? topic.title : topic.title_en}
                  </h3>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label={id ? 'Tutup' : 'Close'}
                  className="shrink-0 w-7 h-7 border-[2px] border-sumi bg-kinari text-sumi text-xs font-black flex items-center justify-center hover:bg-shu hover:text-kinari-light transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Balon-balon teks Saku (1 balon per baris) */}
              <div className="p-3 flex flex-col gap-2 max-h-[55vh] overflow-y-auto">
                {topic.lines.map((ln, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 shrink-0 w-2 h-2 bg-shu border border-sumi" aria-hidden="true" />
                    <p className="text-[12px] leading-relaxed text-sumi/85 font-medium">
                      {id ? ln.text : ln.text_en}
                    </p>
                  </div>
                ))}
              </div>

              {/* Footer: tanda tangan Saku */}
              <div className="px-3 pb-3">
                <p className="text-[9px] uppercase tracking-[0.2em] font-black text-sumi/35 text-right">
                  -Saku chann (⁠≧⁠▽⁠≦⁠)
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tombol mengapung */}
      <motion.button
        whileTap={{ scale: 0.94 }}
        onClick={() => setOpen((v) => !v)}
        aria-label={id ? 'Buka panduan tutorial' : 'Open tutorial guide'}
        aria-expanded={open}
        title={id ? 'Tutorial' : 'Tutorial'}
        className="fixed bottom-4 right-4 z-[56] flex items-center gap-2 pl-1.5 pr-3 py-1.5 border-[3px] border-sumi bg-ai text-kinari-light shadow-[4px_4px_0_0_#1a1a1a] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer select-none"
      >
        <SakuFace size={34} />
        <span className="text-[11px] font-black uppercase tracking-[0.15em]">
          {id ? 'Tutorial' : 'Tutorial'}
        </span>
        {/* Badge titik merah: jumlah topik yang belum dibaca (hilang kalau semua sudah) */}
        {unseen > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 border-[2px] border-sumi bg-shu text-kinari-light text-[9px] font-black flex items-center justify-center rounded-full">
            {unseen}
          </span>
        )}
      </motion.button>
    </>
  );
}
