import { useEffect, useLayoutEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  yujiTechniqueFor, YUJI_STYLE, YUJI_INK, YUJI_FLASH,
  yujiSparks, yujiCracks, yujiEmbers, yujiBeam, yujiWindLines, yujiScissorLines, yujiBolts,
  fugaArrowTargets, fugaArrowImpactS, FUGA_ARROW_LEAD_S,
} from './yujiFx';

// ─────────────────────────────────────────────────────────────────────────────
// Yuji Itadori (visual 'yuji') — efek jawaban. Aturan main:
//   • keiteiken  → aura biru di kepalan, pulse 2x (kanon: double impact)
//   • manjigeri  → blur geser + garis angin vertikal
//   • kokusen    → percikan hitam + flash + retakan + PETIR MERAH (aura 黒閃, minta user)
//   • senketsu   → 4 tahap: 百斂 (compress) → beam → tembus → sisa (CSS murni)
//   • kai/hachi  → garis putus-putus nyebar lalu SNIP (御廚子 versi Yuji, putih)
//   • fuga (開)  → panah api horizontal + kanji api (gradasi, bara, shimmer)
//   • wrong      → 黒閃 GAGAL: percikan hitam PADAM + retakan tak jadi + layar gelap
// Semua animasi hanya transform + opacity. prefers-reduced-motion → versi statis.
// ─────────────────────────────────────────────────────────────────────────────

// Kanji tiap teknik di band bawah — warna mengikuti efek (user: "tambahin
// kanji di setiap skill warnanya sesuai efek"). Ringan: text-shadow saja.
function TechKanji({ style, reduced, delay = 0, size = 'clamp(30px, 6vw, 76px)' }) {
  if (!style) return null;
  return (
    <motion.span
      data-yuji-kanji
      className="absolute font-serif font-black select-none pointer-events-none"
      style={{
        left: '50%', bottom: '12%', x: '-50%',
        fontSize: size,
        color: style.color,
        WebkitTextStroke: `1.5px ${YUJI_INK}`,
        textShadow: `0 0 14px ${style.color}aa, 0 0 34px ${style.color}55`,
        willChange: 'transform, opacity',
      }}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={reduced ? { opacity: 1, scale: 1 } : { opacity: [0, 1, 1, 0.92], scale: [0.7, 1.1, 1, 1.01] }}
      transition={{ duration: reduced ? 0 : 0.9, delay: reduced ? 0 : delay, ease: 'easeOut' }}
    >
      {style.kanji}
    </motion.span>
  );
}

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
      <TechKanji style={YUJI_STYLE.wrong} reduced={reduced} size="clamp(34px, 7vw, 84px)" />
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
      <TechKanji style={st} reduced={reduced} delay={0.05} />
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
      <TechKanji style={YUJI_STYLE.manjigeri} reduced={reduced} />
      <YujiGifLayer src={fx?.gifSrc} reduced={reduced} />
    </motion.div>
  );
}

// ── 黒閃: percikan hitam + flash 1 frame + retakan kaca radial (BUKAN petir) ─
function YujiKokusen({ fx, reduced }) {
  const seed = fx?.id || 1;
  const [cracks] = useState(() => yujiCracks(seed, 9));
  const [bolts] = useState(() => yujiBolts(seed, 9));
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
      {/* PETIR MERAH 黒閃 — aura petir merah (minta user). Bolt menjalar keluar. */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {bolts.map((b) => (
          <motion.polyline
            key={b.id}
            points={b.pts.map((p) => p.join(',')).join(' ')}
            fill="none"
            stroke="#e0241a"
            strokeWidth={b.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            initial={{ opacity: 0 }}
            animate={{ opacity: reduced ? 0.55 : [0, 1, 0.75, 1, 0.4] }}
            transition={{ duration: reduced ? 0 : b.dur, delay: reduced ? 0 : b.delay, ease: 'easeOut' }}
            style={{ filter: 'drop-shadow(0 0 4px #e0241a)' }}
          />
        ))}
      </svg>
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
            left: '50%', bottom: '22%', x: '-50%',
            fontSize: 'clamp(22px, 4vw, 48px)',
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
      <TechKanji style={YUJI_STYLE.kokusen} reduced={reduced} delay={0.1} />
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
      <TechKanji style={YUJI_STYLE.senketsu} reduced={reduced} delay={0.25} />
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

// ── 開: PANAH API nembak tiap opsi SALAH → opsi itu TERBAKAR ────────────────
// Alur (permintaan user): kanji 開 menyala → panah api melesat dari kanji ke
// tombol jawaban salah → kena = ledakan kecil + tombol nyala (data-ignite) →
// tombol tinggal dalam keadaan hangus (CSS button[data-burned]).
// 60fps: cuma transform/opacity + gradient/blur (tanpa re-raster drop-shadow).
function FugaArrow({ shot, reduced }) {
  // Semua potongan panah digambar relatif ke satu titik ORIGIN (= ujung panah),
  // lalu SELURUH kelompok diputar sekali di origin itu. Kalau tiap potongan
  // dirotasi sendiri-sendiri, potongannya tercerai saat sudut miring.
  return (
    <div aria-hidden="true" style={{
      position: 'absolute', left: 0, top: 0,
      transform: `rotate(${shot.angle}deg)`, transformOrigin: '0 0',
      willChange: 'transform',
    }}>
      {/* Ekor api (memanjang ke belakang, sumbu -X) */}
      <div style={{
        position: 'absolute', left: -128, top: -3.5, width: 128, height: 7,
        background: 'linear-gradient(90deg, rgba(224,36,26,0) 0%, rgba(224,36,26,0.35) 42%, rgba(255,140,26,0.85) 78%, #ffd166 100%)',
        filter: 'blur(1.6px)', borderRadius: 4,
      }} />
      {/* Batang panah menyala */}
      <div style={{
        position: 'absolute', left: -54, top: -2.5, width: 54, height: 5,
        background: 'linear-gradient(90deg, rgba(255,140,26,0.25) 0%, #ff8c1a 55%, #ffe066 100%)',
        boxShadow: '0 0 14px rgba(255,120,20,0.95)', borderRadius: 2,
      }} />
      {/* Kepala panah (segitiga api) — ujung tepat di origin */}
      <div style={{
        position: 'absolute', left: -18, top: -8, width: 0, height: 0,
        borderTop: '8px solid transparent', borderBottom: '8px solid transparent',
        borderLeft: '18px solid #ffe066',
        filter: 'drop-shadow(0 0 9px rgba(255,140,26,0.95))',
      }} />
      {/* Inti panas di ujung */}
      <div style={{
        position: 'absolute', left: -22, top: -10, width: 22, height: 20,
        background: 'radial-gradient(circle at 100% 50%, rgba(255,236,150,0.95), rgba(255,140,26,0.5) 46%, transparent 76%)',
        filter: 'blur(1px)', borderRadius: 999,
      }} />
      {/* Bara kecil lepas dari ekor (animasi opacity, posisi statis) */}
      {!reduced && [0, 1, 2].map((k) => (
        <motion.span key={k} style={{
          position: 'absolute', left: -40 - k * 24, top: -2, width: 5 - k, height: 5 - k,
          background: k === 0 ? '#ffe066' : '#ff8c1a', borderRadius: 999,
          boxShadow: '0 0 7px rgba(255,140,26,0.9)',
        }}
          animate={{ opacity: [0.15, 0.9, 0.15] }}
          transition={{ repeat: Infinity, duration: 0.36 + k * 0.14, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// Hantaman panah di tombol salah: cincin kejut + kilat panas + bara memantul.
function FugaImpact({ shot, seed, reduced }) {
  const [embers] = useState(() => yujiSparks(seed + shot.id * 7, 7));
  const at = fugaArrowImpactS(shot);   // waktu panah tiba (detik, dari awal fx)
  const box = { position: 'absolute', left: shot.to.x, top: shot.to.y };
  return (
    <>
      <motion.div aria-hidden="true" style={{
        ...box, width: 76, height: 76, marginLeft: -38, marginTop: -38,
        border: '3px solid #ff8c1a', borderRadius: 999,
        boxShadow: '0 0 22px rgba(255,120,20,0.8), inset 0 0 18px rgba(255,224,102,0.55)',
        willChange: 'transform, opacity',
      }}
        initial={{ opacity: 0, scale: 0.35 }}
        animate={{ opacity: [0, 0.95, 0], scale: [0.35, 1.05, 1.55] }}
        transition={{ duration: 0.5, delay: at, ease: 'easeOut' }}
      />
      <motion.div aria-hidden="true" style={{
        ...box, width: 120, height: 120, marginLeft: -60, marginTop: -60,
        background: 'radial-gradient(circle at 50% 50%, rgba(255,236,150,0.85), rgba(255,140,26,0.45) 38%, rgba(224,36,26,0.18) 62%, transparent 78%)',
        willChange: 'transform, opacity',
      }}
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: [0, 0.9, 0], scale: [0.4, 1, 1.3] }}
        transition={{ duration: 0.42, delay: at, ease: 'easeOut' }}
      />
      {!reduced && embers.map((p) => {
        const dx = Math.cos(p.angle) * p.dist * 0.55;
        const dy = Math.sin(p.angle) * p.dist * 0.55;
        return (
          <motion.span key={p.id} aria-hidden="true" style={{
            ...box, width: p.size, height: p.size, marginLeft: -p.size / 2, marginTop: -p.size / 2,
            background: '#ff8c1a', boxShadow: '0 0 8px rgba(255,140,26,0.9)', borderRadius: 999,
            willChange: 'transform, opacity',
          }}
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{ x: dx, y: dy, opacity: [0, 0.95, 0] }}
            transition={{ duration: 0.6, delay: at, ease: 'easeOut' }}
          />
        );
      })}
    </>
  );
}

function YujiFuga({ fx, reduced }) {
  const seed = fx?.id || 1;
  const [embers] = useState(() => yujiEmbers(seed, 7));
  const [shots, setShots] = useState([]);
  const fireGrad = 'linear-gradient(180deg, #ffe066 0%, #ff8c1a 55%, #e0241a 100%)';

  // Ukur tombol opsi SALAH yang sedang tampil (data-burned) → titik target panah.
  // Layer fx itu `fixed inset-0` → koordinat viewport = koordinat layer, jadi
  // getBoundingClientRect() bisa dipakai langsung. Tidak ada tombol (preview
  // DevPanel tanpa quiz) → fugaArrowTargets() jatuh ke target cadangan.
  useLayoutEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    // Pasangkan tombol ↔ rect lewat SATU daftar (indeks selalu sinkron).
    const pairs = Array.from(document.querySelectorAll('button[data-burned]'))
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { el, left: r.left, top: r.top, width: r.width, height: r.height };
      })
      .filter((p) => Number.isFinite(p.left) && Number.isFinite(p.top));
    setShots(fugaArrowTargets(pairs, window.innerWidth, window.innerHeight).map((s, i) => ({ ...s, el: pairs[i]?.el || null })));
  }, []);

  // Panah tiba → tombol menyala sekejap (data-ignite), lalu tinggal hangus.
  // Elemen bisa hilang kapan saja (soal ganti) → semua akses DOM dibungkus guard.
  useEffect(() => {
    if (reduced || typeof window === 'undefined') return undefined;
    const timers = [];
    for (const s of shots) {
      if (!s.el) continue;
      const el = s.el;
      const hit = Math.round(fugaArrowImpactS(s) * 1000);
      timers.push(setTimeout(() => {
        if (!el.isConnected) return;
        el.dataset.ignite = '1';
        timers.push(setTimeout(() => { if (el.isConnected) delete el.dataset.ignite; }, 1000));
      }, hit));
    }
    return () => timers.forEach(clearTimeout);
  }, [shots, reduced]);

  return (
    <motion.div className="absolute inset-0 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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

      {/* PANAH API: satu per opsi salah, melesat dari kanji ke tombolnya */}
      {!reduced && shots.map((s) => (
        <motion.div
          key={`shot-${s.id}`}
          className="absolute"
          style={{ left: s.from.x, top: s.from.y, willChange: 'transform, opacity' }}
          initial={{ x: 0, y: 0, opacity: 0 }}
          animate={{ x: [0, s.dx], y: [0, s.dy], opacity: [0, 1, 1, 0] }}
          transition={{
            duration: s.dur, delay: FUGA_ARROW_LEAD_S + s.delay, ease: [0.4, 0, 0.9, 1],
            // Panah memudar tepat saat "menempel" — impact yang ambil alih.
            opacity: { duration: s.dur, delay: FUGA_ARROW_LEAD_S + s.delay, times: [0, 0.12, 0.86, 1], ease: 'linear' },
          }}
        >
          <FugaArrow shot={s} reduced={reduced} />
        </motion.div>
      ))}

      {/* Hantaman di tombol salah (cincin + kilat + bara) */}
      {!reduced && shots.map((s) => (
        <FugaImpact key={`hit-${s.id}`} shot={s} seed={seed} reduced={reduced} />
      ))}

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
