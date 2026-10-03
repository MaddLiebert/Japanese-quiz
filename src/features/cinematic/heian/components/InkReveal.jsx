// ─────────────────────────────────────────────────────────────────────────────
// InkReveal — teks yang "muncul seperti ditulis kuas": tersingkap dari KIRI ke
// KANAN lewat mask gradien tinta (bukan fade biasa), plus sedikit ink bleed.
//
// Cara kerja: teks di-render normal, lalu ditutup lapisan mask `clip-path` yang
// membuka dari kiri. Ditambah sapuan kuas (path) yang bergerak bersama.
// `reduced` → teks langsung tampil penuh (info tetap terbaca tanpa animasi).
//
// Props: delay (dtk), duration (dtk), reduced, className, style, as.
// ─────────────────────────────────────────────────────────────────────────────
import { motion } from 'motion/react';

export function InkReveal({
  children,
  delay = 0,
  duration = 1.6,
  reduced = false,
  className = '',
  style = {},
  as = 'div',
  align = 'center',
}) {
  const MotionTag = motion[as] || motion.div;

  if (reduced) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  const from = align === 'right' ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0%)';

  return (
    <div className="relative">
      {/* Teks nyata — tersingkap lewat clip-path (efek ditulis) */}
      <MotionTag
        className={className}
        style={style}
        initial={{ clipPath: from, opacity: 0.15, filter: 'blur(2px)' }}
        animate={{ clipPath: 'inset(0 0 0 0%)', opacity: 1, filter: 'blur(0px)' }}
        transition={{ delay, duration, ease: [0.33, 1, 0.68, 1] }}
      >
        {children}
      </MotionTag>

      {/* Ujung kuas — garis tinta tipis yang menyapu, lalu memudar */}
      <motion.span
        className="pointer-events-none absolute top-0 bottom-0 w-[3px]"
        style={{ background: 'linear-gradient(180deg, transparent, var(--emk-ink), transparent)', opacity: 0.55 }}
        initial={{ left: '0%', opacity: 0 }}
        animate={{ left: '100%', opacity: [0, 0.55, 0] }}
        transition={{ delay, duration, ease: [0.33, 1, 0.68, 1] }}
        aria-hidden="true"
      />
    </div>
  );
}

export default InkReveal;
