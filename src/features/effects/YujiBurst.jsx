import { useState } from 'react';
import { motion } from 'motion/react';
import {
  yujiTechniqueFor, YUJI_STYLE, YUJI_INK, YUJI_FLASH,
  yujiSparks, yujiCracks, yujiEmbers, yujiBeam, yujiWindLines, yujiScissorLines,
} from './yujiFx';

// ─────────────────────────────────────────────────────────────────────────────
// Yuji Itadori (visual 'yuji') — efek jawaban. Aturan main:
//   • keiteiken  → aura biru di kepalan, pulse 2x (kanon: double impact)
//   • manjigeri  → blur geser + garis angin vertikal
//   • kokusen    → percikan hitam + flash 1 frame + retakan kaca radial (BUKAN petir!)
//   • senketsu   → 4 tahap: 百斂 (compress) → beam → tembus → sisa (CSS murni)
//   • kai/hachi  → garis putus-putus nyebar lalu SNIP (御廚子 versi Yuji, putih)
//   • fuga (開)  → panah api horizontal + kanji api (gradasi, bara, shimmer)
//   • wrong      → 黒閃 GAGAL: percikan hitam PADAM + retakan tak jadi + layar gelap
// Semua animasi hanya transform + opacity. prefers-reduced-motion → versi statis.
// ─────────────────────────────────────────────────────────────────────────────

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// GIF layer Yuji — dua mode (pola GojoGifLayer):
//   salah (meme "kalah" / zakome) → panel berbingkai di TENGAH
//   teknik (keiteiken/kokusen/fuga) → CUT-IN atas tanpa bingkai, blend screen
function YujiGifLayer({ src, reduced, wrong = false, delay = 0 }) {
  if (!src) return null;
  if (wrong) {
    return (
      <motion.div
        data-yuji-gif
        className="absolute left-1/2 top-1/2 z-10"
        style={{ marginLeft: '-19vh', marginTop: '-17vh' }}
        initial={{ opacity: 0, scale: 0.92, rotate: 2.5 }}
        animate={{ opacity: 1, scale: 1, rotate: -1.5, x: reduced ? 0 : [0, -9, 8, -5, 3, 0] }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: reduced ? 0 : 0.34, ease: 'easeOut' }}
      >
        <div className="w-[38vh] h-[38vh] border-[3px] border-sumi bg-kinari shadow-[8px_8px_0_0_rgba(26,26,26,0.32)] overflow-hidden">
          <img
            src={src}
            alt="Yuji"
            decoding="sync"
            loading="eager"
            className="w-full h-full object-contain select-none"
            draggable={false}
          />
        </div>
      </motion.div>
    );
  }
  return (
    <div className="absolute left-1/2 top-1/2 z-10" style={{ transform: 'translateX(-50%)', marginTop: '-42vh' }}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          inset: '-26% -22%',
          background: 'radial-gradient(closest-side, rgba(4,2,10,0.96), rgba(4,2,10,0.7) 52%, transparent 100%)',
        }}
      />
      <motion.div
        data-yuji-gif
        initial={{ opacity: 0, scale: 0.72 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: reduced ? 0 : 0.42, delay: reduced ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
      >
        <img
          src={src}
          alt="Yuji — teknik"
          decoding="sync"
          loading="eager"
          className="select-none"
          style={{
            width: 'min(42vh, 86vw)',
            height: 'auto',
            mixBlendMode: 'screen',
            WebkitMaskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 40%, rgba(0,0,0,0.45) 68%, transparent 94%)',
            maskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 40%, rgba(0,0,0,0.45) 68%, transparent 94%)',
          }}
          draggable={false}
        />
      </motion.div>
    </div>
  );
}

// Percikan (dipakai keiteiken biru & kokusen hitam).
function SparkBurst({ seed, color, count = 12, delay = 0 }) {
  const [sparks] = useState(() => yujiSparks(seed, count));
  return (
    <>
      {sparks.map((p) => {
        const dx = Math.cos(p.angle) * p.dist;
        const dy = Math.sin(p.angle) * p.dist;
        return (
          <motion.span
            key={p.id}
            className="absolute left-1/2 top-1/2"
            style={{
              width: p.size,
              height: p.size,
              marginLeft: -p.size / 2,
              marginTop: -p.size / 2,
              background: color,
              border: `1px solid ${YUJI_INK}`,
              willChange: 'transform, opacity',
            }}
            initial={{ x: 0, y: 0, opacity: 0.95, scale: 1 }}
            animate={{ x: dx, y: dy, opacity: 0, scale: 0.4 }}
            transition={{ duration: p.dur, delay: delay + p.delay, ease: [0.16, 1, 0.3, 1] }}
          />
        );
      })}
    </>
  );
}

// ── Salah: 黒閃 yang PADAM (kebalikan langsung kokusen) ─────────────────────
function YujiWrong({ fx, reduced }) {
  const seed = fx?.id || 1;
  const [sparks] = useState(() => yujiSparks(seed, 14));
  const [cracks] = useState(() => yujiCracks(seed, 7));
  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.16 } }}
    >
      {/* Layar sedikit gelap — kegagalan, bukan luka (BUKAN wash merah) */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: reduced ? 0.25 : [0, 0.32, 0.18] }}
        transition={{ duration: reduced ? 0 : 0.7, ease: 'easeOut' }}
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(10,10,10,0.55), transparent 72%)' }}
      />
      {sparks.map((p) => {
        const dx = Math.cos(p.angle) * p.dist;
        const dy = Math.sin(p.angle) * p.dist;
        return (
          <motion.span
            key={p.id}
            className="absolute left-1/2 top-1/2"
            style={{
              width: p.size, height: p.size,
              marginLeft: -p.size / 2, marginTop: -p.size / 2,
              background: '#111111', border: `1px solid ${YUJI_INK}`,
              willChange: 'transform, opacity',
            }}
            initial={{ x: 0, y: 0, opacity: 0.9, scale: 1 }}
            animate={reduced ? { opacity: 0.4 } : { x: dx, y: dy, opacity: [0.9, 0.5, 0], scale: [1, 0.7, 0.2] }}
            transition={{ duration: reduced ? 0 : p.dur, delay: reduced ? 0 : p.delay, ease: 'easeOut' }}
          />
        );
      })}
      {/* Retakan yang NGGAK jadi (berhenti di tengah lalu mati) */}
      {!reduced && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {cracks.map((c) => {
            const x2 = 50 + Math.cos(c.angle) * (c.len * 0.5);
            const y2 = 50 + Math.sin(c.angle) * (c.len * 0.5);
            return (
              <motion.line
                key={c.id}
                x1="50" y1="50" x2={x2} y2={y2}
                stroke={YUJI_INK} strokeWidth="0.5" strokeLinecap="round"
                vectorEffect="non-scaling-stroke" pathLength={1}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 0.45, opacity: [0, 0.7, 0] }}
                transition={{ duration: 0.45, delay: c.delay, ease: 'easeOut' }}
              />
            );
          })}
        </svg>
      )}
      <YujiGifLayer src={fx?.gifSrc} reduced={reduced} wrong />
    </motion.div>
  );
}

// ── 逕庭拳: aura biru di kepalan, pulse 2x (tok → jeda → TOK) ───────────────
function YujiKeiteiken({ fx, reduced }) {
  const st = YUJI_STYLE.keiteiken;
  const hits = [{ delay: 0, scale: 0.9, op: 0.7 }, { delay: 0.1, scale: 1.25, op: 1 }];
  return (
    <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.16 } }}>
      {hits.map((hit, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: 240, height: 240, marginLeft: -120, marginTop: -120,
            background: `radial-gradient(circle, ${st.color}cc 0 22%, ${st.color}44 40%, transparent 70%)`,
            willChange: 'transform, opacity',
          }}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={reduced ? { scale: 1, opacity: 0.5 } : { scale: [0.4, hit.scale, 1], opacity: [0, hit.op, 0] }}
          transition={{ duration: reduced ? 0 : 0.34, delay: reduced ? 0 : hit.delay, ease: 'easeOut' }}
        />
      ))}
      {!reduced && <SparkBurst seed={fx?.id || 1} color={st.color} count={10} delay={0.1} />}
      <YujiGifLayer src={fx?.gifSrc} reduced={reduced} delay={0.1} />
    </motion.div>
  );
}

// ── 卍蹴り: garis angin vertikal naik ───────────────────────────────────────
function YujiManjigeri({ fx, reduced }) {
  const seed = fx?.id || 1;
  const [lines] = useState(() => yujiWindLines(seed, 12));
  return (
    <motion.div className="absolute inset-0 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {lines.map((l) => (
        <motion.span
          key={l.id}
          className="absolute"
          style={{
            left: `${l.x}%`, top: '-10%', width: 2, height: `${l.len}%`,
            background: `linear-gradient(to bottom, transparent, ${YUJI_STYLE.manjigeri.color}, transparent)`,
            willChange: 'transform, opacity',
          }}
          initial={{ y: '-30%', opacity: 0 }}
          animate={reduced ? { y: '0%', opacity: 0.5 } : { y: ['-30%', '120%'], opacity: [0, 0.9, 0] }}
          transition={{ duration: reduced ? 0 : l.dur, delay: reduced ? 0 : l.delay, ease: 'easeIn' }}
        />
      ))}
      <YujiGifLayer src={fx?.gifSrc} reduced={reduced} />
    </motion.div>
  );
}

// ── 黒閃: percikan hitam + flash 1 frame + retakan kaca radial (BUKAN petir) ─
function YujiKokusen({ fx, reduced }) {
  const seed = fx?.id || 1;
  const [cracks] = useState(() => yujiCracks(seed, 9));
  const isStreak = fx?.kind === 'streak';
  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.16 } }}
      style={{ willChange: 'transform, opacity' }}
    >
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={reduced ? { opacity: 0.15 } : { opacity: [0, 0.9, 0] }}
        transition={{ duration: reduced ? 0 : 0.24, times: [0, 0.1, 1], ease: 'easeOut' }}
        style={{ background: YUJI_FLASH }}
      />
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: reduced ? 0.3 : [0, 0.42, 0.22] }}
        transition={{ duration: reduced ? 0 : 0.5, ease: 'easeOut' }}
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.6), transparent 74%)' }}
      />
      {!reduced && <SparkBurst seed={seed} color="#111111" count={18} />}
      {!reduced && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {cracks.map((c, i) => {
            const x2 = 50 + Math.cos(c.angle) * c.len;
            const y2 = 50 + Math.sin(c.angle) * c.len;
            return (
              <motion.line
                key={c.id}
                x1="50" y1="50" x2={x2} y2={y2}
                stroke={YUJI_INK} strokeWidth="0.6" strokeLinecap="round"
                vectorEffect="non-scaling-stroke" pathLength={1}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: [0, 0.95, 0.6] }}
                transition={{ duration: 0.4, delay: i * 0.04, ease: 'easeOut' }}
              />
            );
          })}
        </svg>
      )}
      {isStreak && (
        <motion.span
          className="absolute font-serif font-black select-none"
          style={{
            left: '50%', bottom: '16%', x: '-50%',
            fontSize: 'clamp(28px, 5vw, 64px)',
            color: '#111111',
            WebkitTextStroke: `2px ${YUJI_FLASH}`,
            willChange: 'transform, opacity',
          }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={reduced ? { opacity: 0.9, scale: 1 } : { opacity: [0, 1, 1, 0], scale: [0.6, 1.1, 1, 0.96] }}
          transition={{ duration: reduced ? 0 : 0.9, ease: 'easeOut' }}
        >
          2.5×
        </motion.span>
      )}
      <YujiGifLayer src={fx?.gifSrc} reduced={reduced} delay={0.08} />
    </motion.div>
  );
}

// ── 穿血: 4 tahap (百斂 → tembak → tembus → sisa). CSS murni, TANPA GIF. ────
function YujiSenketsu({ fx, reduced }) {
  const st = YUJI_STYLE.senketsu;
  const seed = fx?.id || 1;
  const [beam] = useState(() => yujiBeam(seed));
  return (
    <motion.div className="absolute inset-0 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* 1) 百斂 — titik darah mengerut jadi bola mungil padat */}
      <motion.div
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: 26, height: 26, marginLeft: -13, marginTop: -13,
          background: st.color, boxShadow: `0 0 18px ${st.color}`,
          willChange: 'transform, opacity',
        }}
        initial={{ scale: 3.2, opacity: 0.85 }}
        animate={reduced ? { scale: 1, opacity: 0.9 } : { scale: [3.2, 1, 1], opacity: [0.85, 1, 1] }}
        transition={{ duration: reduced ? 0 : 0.45, ease: 'easeIn' }}
      />
      {/* 2) Tembak — garis merah tipis melesat horizontal (beam) */}
      <motion.div
        className="absolute left-0 right-0"
        style={{
          top: `${beam.y}%`, height: beam.thickness,
          background: `linear-gradient(90deg, transparent, ${st.color}, #e0241a, transparent)`,
          transformOrigin: 'left center',
          willChange: 'transform, opacity',
        }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={reduced ? { scaleX: 1, opacity: 0.7 } : { scaleX: [0, 1, 1], opacity: [0, 1, 0] }}
        transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : 0.4, ease: 'easeOut' }}
      />
      {/* 3) Tembus — percikan di titik beam + 4) sisa memudar */}
      {!reduced && <SparkBurst seed={seed} color={st.color} count={8} delay={0.55} />}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(circle at 50% 46%, rgba(224,36,26,0.22), transparent 68%)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.8, 0] }}
        transition={{ duration: 0.9, delay: 0.4 }}
      />
    </motion.div>
  );
}

// ── 解 / 捌: garis putus-putus nyebar lalu SNIP (putih, beda total dari 黒閃) ─
function YujiScissor({ fx, reduced }) {
  const st = YUJI_STYLE[fx?.tech] || YUJI_STYLE.kai;
  const seed = fx?.id || 1;
  const heavy = fx?.tech === 'hachi';
  const [lines] = useState(() => yujiScissorLines(seed, heavy ? 9 : 6));
  return (
    <motion.div className="absolute inset-0 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {lines.map((l) => (
          <g key={l.id} transform={`rotate(${(l.angle * 180) / Math.PI} 50 50)`}>
            <motion.line
              x1="-10" y1={50 + l.offset} x2="110" y2={50 + l.offset}
              stroke={st.color} strokeWidth={heavy ? 1.4 : 0.9}
              strokeDasharray="4 3" strokeLinecap="round"
              vectorEffect="non-scaling-stroke" pathLength={1}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={reduced ? { pathLength: 1, opacity: 0.7 } : { pathLength: [0, 1, 1], opacity: [0, 1, 0] }}
              transition={{ duration: reduced ? 0 : heavy ? 0.4 : 0.28, delay: reduced ? 0 : 0.15 + l.delay, ease: 'easeOut' }}
            />
          </g>
        ))}
      </svg>
      <motion.span
        className="absolute font-serif font-black select-none"
        style={{
          left: '50%', bottom: '14%', x: '-50%',
          fontSize: 'clamp(40px, 7vw, 96px)',
          color: st.color,
          WebkitTextStroke: `3px ${YUJI_INK}`,
          textShadow: `4px 4px 0 ${YUJI_INK}`,
          willChange: 'transform, opacity',
        }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: reduced ? 0 : 0.1, duration: reduced ? 0 : 0.3, ease: [0.34, 1.56, 0.64, 1] }}
      >
        {st.kanji}
      </motion.span>
    </motion.div>
  );
}

// ── 開: panah api horizontal + kanji api (4 lapis, target 60fps) ────────────
// 1) isi kanji = gradasi api via background-clip:text (reveal naik = "nyala")
// 2) glow = text-shadow (BUKAN drop-shadow — re-raster tiap frame = lag)
// 3) bara naik (transform + opacity)  4) distorsi panas halus (scaleY shimmer)
function YujiFuga({ fx, reduced }) {
  const seed = fx?.id || 1;
  const [embers] = useState(() => yujiEmbers(seed, 7));
  const fireGrad = 'linear-gradient(180deg, #ffe066 0%, #ff8c1a 55%, #e0241a 100%)';
  return (
    <motion.div className="absolute inset-0 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Panah api melintas HORIZONTAL ke arah opsi salah */}
      {!reduced && (
        <motion.div
          className="absolute left-0 right-0"
          style={{
            top: '50%', height: 10,
            background: 'linear-gradient(90deg, transparent, #ff8c1a, #ffe066, #e0241a, transparent)',
            transformOrigin: 'left center',
            willChange: 'transform, opacity',
          }}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: [0, 1, 1], opacity: [0, 1, 0] }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      )}
      {/* Kanji 開 — dasar gelap (bara mati) + lapisan api yang "nyala" naik */}
      <div className="absolute left-0 right-0 flex justify-center" style={{ top: '26%' }}>
        <motion.span
          className="relative font-serif font-black select-none"
          style={{
            fontSize: 'clamp(90px, 18vw, 240px)',
            color: '#241005',
            WebkitTextStroke: `2px ${YUJI_INK}`,
            willChange: 'transform, opacity',
          }}
          initial={{ opacity: 0, scale: 0.7, y: 12 }}
          animate={reduced ? { opacity: 1, scale: 1, y: 0 } : { opacity: [0, 1, 1, 0.9], scale: [0.7, 1.08, 1, 1.02], y: [12, 0, 0, 0] }}
          transition={{ duration: reduced ? 0 : 1.2, times: [0, 0.25, 0.8, 1], ease: 'easeOut' }}
        >
          開
          <motion.span
            aria-hidden="true"
            className="absolute left-0 top-0"
            style={{
              backgroundImage: fireGrad,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 18px #ff6a00, 0 0 40px #ff3d00',
            }}
            initial={{ clipPath: 'inset(100% 0 0 0)' }}
            animate={{ clipPath: reduced ? 'inset(0% 0 0 0)' : ['inset(100% 0 0 0)', 'inset(0% 0 0 0)'] }}
            transition={{ duration: reduced ? 0 : 0.7, delay: reduced ? 0 : 0.2, ease: 'easeOut' }}
          >
            開
          </motion.span>
        </motion.span>
      </div>
      {/* Bara naik (5-8 titik) — transform + opacity doang */}
      {!reduced && embers.map((e) => (
        <motion.span
          key={e.id}
          className="absolute rounded-full"
          style={{
            left: `${e.x}%`, bottom: '18%', width: e.size, height: e.size,
            background: '#ff8c1a', boxShadow: '0 0 8px #ff6a00',
            willChange: 'transform, opacity',
          }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: e.drift, opacity: [0, 1, 0] }}
          transition={{ duration: e.dur, delay: e.delay, ease: 'easeOut' }}
        />
      ))}
      {/* Distorsi panas halus — jangan kebablasan */}
      {!reduced && (
        <motion.div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 50% 45%, rgba(255,140,26,0.16), transparent 60%)', willChange: 'transform, opacity' }}
          animate={{ scaleY: [1, 1.02, 1], opacity: [0.6, 0.9, 0.6] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
        />
      )}
      <YujiGifLayer src={fx?.gifSrc} reduced={reduced} delay={0.2} />
    </motion.div>
  );
}

export function YujiBurst({ fx, kind }) {
  const [reduced] = useState(prefersReduced);
  const tech = fx?.tech || (kind === 'correct' ? yujiTechniqueFor(kind, fx?.streak || 0) : null);

  if (kind === 'wrong') return <YujiWrong fx={fx} reduced={reduced} />;
  if (tech === 'keiteiken') return <YujiKeiteiken fx={fx} reduced={reduced} />;
  if (tech === 'manjigeri') return <YujiManjigeri fx={fx} reduced={reduced} />;
  if (tech === 'kokusen') return <YujiKokusen fx={fx} reduced={reduced} />;
  if (tech === 'senketsu') return <YujiSenketsu fx={fx} reduced={reduced} />;
  if (tech === 'kai' || tech === 'hachi') return <YujiScissor fx={fx} reduced={reduced} />;
  if (tech === 'fuga') return <YujiFuga fx={fx} reduced={reduced} />;
  return null;
}

export default YujiBurst;
