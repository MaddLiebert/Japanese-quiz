import { useState } from 'react';
import { motion } from 'motion/react';
import {
  SUKUNA_STYLE, SUKUNA_INK, SUKUNA_FLASH, SUKUNA_BLOOD,
  sukunaWebLines, sukunaThunderBolts, sukunaWheelSpokes,
  sukunaChantLines, sukunaMantraRing, sukunaEmbers,
} from './sukunaFx';

// ─────────────────────────────────────────────────────────────────────────────
// Ryomen Sukuna (visual 'sukuna') — efek jawaban. Aturan main (spec §Spec efek):
//   • kumo_no_ito   → 8 garis tebasan radial (jaring) + retakan + flash putih
//   • nue           → siluet burung 人面 + PETIR DARI ATAS (3 sambaran) + sayap
//   • furube        → roda Dharma 8 jari + 魔虚羅 bangkit (siluet raksasa) + shake
//   • ryuurin       → 3 baris chant terukir terbakar kiri→kanan + mantra ring
//   • sekai_zangeki → 2 tebasan silang viewport + celah ruang + distorsi + gelap
//   • wrong         → layar gelap + garis tebasan patah (bukan wash merah)
// Semua animasi hanya transform + opacity (no layout thrash). reduced-motion →
// informasi kanon tetap tampil (kanji), gerakan/shake/flash disembunyikan.
// ─────────────────────────────────────────────────────────────────────────────

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Kanji teknik di band bawah — warna mengikuti efek (konsisten dgn Yuji).
function TechKanji({ style, reduced, delay = 0, size = 'clamp(30px, 6vw, 76px)' }) {
  if (!style) return null;
  return (
    <motion.span
      data-sukuna-kanji
      className="absolute font-serif font-black select-none pointer-events-none"
      style={{
        left: '50%', bottom: '12%', x: '-50%',
        fontSize: size,
        color: style.color,
        WebkitTextStroke: `1.5px ${SUKUNA_INK}`,
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

// ── 蜘蛛の糸: jaring tebasan radial + retakan halus + flash 1 frame ─────────
function KumoNoIto({ seed, reduced }) {
  const [lines] = useState(() => sukunaWebLines(seed, 8));
  const [cracks] = useState(() => sukunaWebLines(seed + 71, 12));
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        {lines.map((l) => {
          const x2 = 50 + Math.cos(l.angle) * l.len;
          const y2 = 50 + Math.sin(l.angle) * l.len;
          return (
            <motion.line
              key={l.id}
              x1={50} y1={50} x2={x2} y2={y2}
              stroke="#e8f4ff" strokeWidth={l.width} strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={reduced ? { pathLength: 1, opacity: 0.7 } : { pathLength: 1, opacity: [0, 1, 0.72] }}
              transition={{ duration: reduced ? 0 : l.dur, delay: reduced ? 0 : l.delay, ease: 'easeOut' }}
            />
          );
        })}
        {cracks.map((c) => {
          const x2 = 50 + Math.cos(c.angle) * (c.len * 0.7);
          const y2 = 50 + Math.sin(c.angle) * (c.len * 0.7);
          return (
            <motion.line
              key={c.id}
              x1={50} y1={50} x2={x2} y2={y2}
              stroke="#b8c9dd" strokeWidth={0.3} strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.4 }}
              transition={{ duration: reduced ? 0 : c.dur + 0.1, delay: reduced ? 0 : c.delay + 0.06, ease: 'easeOut' }}
            />
          );
        })}
      </svg>
      <motion.div
        className="absolute inset-0"
        style={{ background: `radial-gradient(circle at 50% 50%, ${SUKUNA_FLASH}cc, transparent 60%)` }}
        initial={{ opacity: 0 }}
        animate={reduced ? { opacity: 0.25 } : { opacity: [0, 0.85, 0] }}
        transition={{ duration: reduced ? 0 : 0.22, ease: 'easeOut' }}
      />
    </div>
  );
}

// ── 鵺: siluet burung 人面 (影絵) + petir dari atas + sayap melebar ──────────
function Nue({ seed, reduced }) {
  const [bolts] = useState(() => sukunaThunderBolts(seed, 3));
  return (
    <div className="absolute inset-0">
      {/* Petir dari ATAS (beda dari Gojo yang dari tepi) */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        {bolts.map((b) => (
          <motion.polyline
            key={b.id}
            points={b.pts.map((p) => p.join(',')).join(' ')}
            fill="none" stroke="#c4b5fd" strokeWidth={b.width} strokeLinejoin="round" strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={reduced ? { pathLength: 1, opacity: 0.8 } : { pathLength: 1, opacity: [0, 1, 0.15, 0.9, 0] }}
            transition={{ duration: reduced ? 0 : b.dur, delay: reduced ? 0 : b.delay, ease: 'easeOut' }}
          />
        ))}
      </svg>

      {/* Siluet burung 人面 — sayap melebar 0.3s */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.svg
          viewBox="0 0 200 120"
          className="w-[46vmin] h-auto"
          initial={{ opacity: 0, scale: 0.82 }}
          animate={reduced ? { opacity: 0.9, scale: 1 } : { opacity: [0, 0.95, 0.88], scale: [0.82, 1, 1] }}
          transition={{ duration: reduced ? 0 : 0.42, ease: 'easeOut' }}
        >
          <g fill="#120a1e" stroke="#7c3aed" strokeWidth="1.2">
            {/* Sayap kiri + kanan melebar */}
            <path d="M100,58 C74,30 40,22 8,34 C36,44 56,56 74,70 Z" />
            <path d="M100,58 C126,30 160,22 192,34 C164,44 144,56 126,70 Z" />
            {/* Badan + kepala 人面 */}
            <ellipse cx="100" cy="66" rx="13" ry="20" />
            <circle cx="100" cy="40" r="10" />
            {/* Mata 人面: dua titik ungu menyala */}
            <circle cx="96" cy="39" r="1.7" fill="#c4b5fd" stroke="none" />
            <circle cx="104" cy="39" r="1.7" fill="#c4b5fd" stroke="none" />
            {/* Ekor */}
            <path d="M100,86 C96,102 92,112 84,120 L100,114 L116,120 C108,112 104,102 100,86 Z" />
          </g>
        </motion.svg>
      </div>
    </div>
  );
}

// ── 布瑠部由良由良 → 魔虚羅: roda Dharma + siluet raksasa bangkit + shake ────
function Furube({ seed, reduced }) {
  const [spokes] = useState(() => sukunaWheelSpokes(seed, 8));
  const [embers] = useState(() => sukunaEmbers(seed + 13, 7));
  const [ring] = useState(() => sukunaMantraRing(20));
  return (
    <div className="absolute inset-0">
      {/* Aura ungu + bara hitam */}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(circle at 50% 62%, rgba(168,85,247,0.34), rgba(18,10,30,0.55) 58%, transparent 82%)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: reduced ? 0.5 : [0, 0.9, 0.7] }}
        transition={{ duration: reduced ? 0 : 0.7, ease: 'easeOut' }}
      />
      {embers.map((e) => (
        <motion.span
          key={e.id}
          className="absolute rounded-full"
          style={{ left: `${e.x}%`, bottom: '12%', width: e.size, height: e.size, background: '#2a1240', boxShadow: '0 0 10px rgba(168,85,247,0.6)' }}
          initial={{ opacity: 0, y: 0 }}
          animate={reduced ? { opacity: 0.5 } : { opacity: [0, 0.9, 0], y: e.drift }}
          transition={{ duration: reduced ? 0 : e.dur, delay: reduced ? 0 : e.delay, ease: 'easeOut' }}
        />
      ))}

      {/* Roda Dharma 8 jari + mata tengah — berputar */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.svg
          viewBox="0 0 100 100" className="w-[52vmin] h-auto"
          initial={{ rotate: 0, opacity: 0, scale: 0.7 }}
          animate={reduced ? { rotate: 0, opacity: 0.85, scale: 1 } : { rotate: 200, opacity: [0, 0.95, 0.8], scale: [0.7, 1, 1] }}
          transition={{ duration: reduced ? 0 : 1.1, ease: 'easeOut' }}
        >
          <circle cx="50" cy="50" r="34" fill="none" stroke="#a855f7" strokeWidth="1.6" />
          <circle cx="50" cy="50" r="30" fill="none" stroke="#a855f7" strokeWidth="0.6" strokeOpacity="0.6" />
          {spokes.map((s) => {
            const rad = (s.angle * Math.PI) / 180;
            return (
              <line
                key={s.id}
                x1="50" y1="50"
                x2={50 + Math.cos(rad) * s.len}
                y2={50 + Math.sin(rad) * s.len}
                stroke="#c4b5fd" strokeWidth={s.width} strokeLinecap="round"
              />
            );
          })}
          {/* Mata tengah roda */}
          <ellipse cx="50" cy="50" rx="11" ry="6.4" fill="#0a0a0a" stroke="#a855f7" strokeWidth="1" />
          <circle cx="50" cy="50" r="3.4" fill={SUKUNA_BLOOD} />
          <circle cx="50" cy="50" r="1.4" fill="#1a0a0a" />
        </motion.svg>
      </div>

      {/* Siluet 魔虚羅 bangkit dari bawah (badan hitam, kepala ular, pedang) */}
      <motion.div
        className="absolute inset-x-0 bottom-0 flex justify-center"
        initial={{ y: '46%', opacity: 0 }}
        animate={reduced ? { y: '6%', opacity: 0.94 } : { y: '6%', opacity: 1 }}
        transition={{ duration: reduced ? 0 : 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        <svg viewBox="0 0 240 200" className="w-[64vmin] h-auto">
          <g fill="#0b0810" stroke="#3b1d5e" strokeWidth="1.4">
            {/* Badan raksasa */}
            <path d="M120,30 C150,44 166,80 168,132 L172,200 L68,200 L72,132 C74,80 90,44 120,30 Z" />
            {/* Kepala ular */}
            <path d="M120,30 C104,22 96,12 98,2 C112,6 122,14 126,24 Z" />
            {/* Pedang panjang di belakang */}
            <path d="M150,26 L214,86 L206,94 L144,36 Z" fill="#1a1030" />
          </g>
          {/* Mata 魔虚羅: dua titik ungu */}
          <circle cx="110" cy="52" r="3" fill="#c4b5fd" />
          <circle cx="130" cy="52" r="3" fill="#c4b5fd" />
        </svg>
      </motion.div>

      {/* Shake halus seluruh layer saat bangkit */}
      {!reduced && (
        <motion.div
          className="absolute inset-0"
          animate={{ x: [0, -7, 6, -4, 3, 0], y: [0, 3, -3, 2, -1, 0] }}
          transition={{ duration: 0.5, delay: 0.42, ease: 'easeOut' }}
        />
      )}

      {/* Kanji 魔虚羅 glow ungu 1× di atas roda */}
      <motion.span
        className="absolute left-1/2 font-serif font-black select-none"
        style={{
          top: '14%', x: '-50%', fontSize: 'clamp(38px, 9vw, 108px)',
          color: '#c4b5fd', WebkitTextStroke: `2px ${SUKUNA_INK}`,
          textShadow: '0 0 18px rgba(168,85,247,0.9), 0 0 48px rgba(168,85,247,0.5)',
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={reduced ? { opacity: 1, scale: 1 } : { opacity: [0, 1, 0.96], scale: [0.8, 1.04, 1] }}
        transition={{ duration: reduced ? 0 : 0.6, delay: reduced ? 0 : 0.5, ease: 'easeOut' }}
      >
        魔虚羅
      </motion.span>
      {/* Lingkaran mantra di belakang kanji */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          className="rounded-full"
          style={{ width: '54vmin', height: '54vmin', border: `1.5px dashed rgba(168,85,247,0.55)`, borderRadius: '50%' }}
          animate={reduced ? { rotate: 0 } : { rotate: 360 }}
          transition={{ duration: ring.speed * 2, repeat: reduced ? 0 : Infinity, ease: 'linear' }}
        />
      </div>
    </div>
  );
}

// ── 龍鱗・反発・番いの流星: 3 baris chant terukir terbakar kiri→kanan ────────
function Ryuurin({ seed, reduced }) {
  const [lines] = useState(() => sukunaChantLines(seed, 3));
  const [ring] = useState(() => sukunaMantraRing(30));
  const [embers] = useState(() => sukunaEmbers(seed + 29, 6));
  return (
    <div className="absolute inset-0">
      {/* Lingkaran mantra berputar makin cepat */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="rounded-full"
          style={{ width: '62vmin', height: '62vmin', border: `2px solid rgba(224,36,26,0.35)`, borderTopColor: 'rgba(224,36,26,0.85)' }}
          animate={reduced ? { rotate: 0 } : { rotate: 360 }}
          transition={{ duration: ring.speed, repeat: reduced ? 0 : Infinity, ease: 'linear' }}
        />
      </div>

      {/* 3 baris chant terukir — tiap baris "terbakar" kiri→kanan */}
      {lines.map((l) => (
        <div key={l.id} className="absolute left-0 right-0 flex justify-center" style={{ top: `${l.y}%` }}>
          <div className="relative">
            <span
              className="font-serif font-black select-none"
              style={{
                fontSize: 'clamp(30px, 6.4vw, 84px)',
                color: '#3a0a08',
                WebkitTextStroke: `1.6px rgba(224,36,26,0.9)`,
                letterSpacing: '0.06em',
              }}
            >
              {l.text}
            </span>
            {/* Lapisan "terbakar" (merah menyala) menutupi kiri→kanan via clip */}
            <motion.span
              className="absolute inset-0 font-serif font-black select-none"
              style={{
                fontSize: 'clamp(30px, 6.4vw, 84px)',
                color: '#ff5a3c',
                WebkitTextStroke: `1.6px #ffd7c2`,
                letterSpacing: '0.06em',
                textShadow: '0 0 16px rgba(255,90,60,0.85), 0 0 40px rgba(224,36,26,0.55)',
                clipPath: 'inset(0 100% 0 0)',
              }}
              initial={{ clipPath: 'inset(0 100% 0 0)' }}
              animate={reduced ? { clipPath: 'inset(0 0% 0 0)' } : { clipPath: 'inset(0 0% 0 0)' }}
              transition={{ duration: reduced ? 0 : l.dur, delay: reduced ? 0 : l.at, ease: 'easeInOut' }}
            >
              {l.text}
            </motion.span>
            {/* Bara di ujung "penulisan" */}
            {!reduced && (
              <motion.span
                className="absolute top-1/2 w-4 h-4 rounded-full"
                style={{ background: '#ffb199', boxShadow: '0 0 22px 8px rgba(255,120,60,0.75)' }}
                initial={{ left: '0%', opacity: 0 }}
                animate={{ left: '100%', opacity: [0, 1, 0] }}
                transition={{ duration: l.dur, delay: l.at, ease: 'easeInOut' }}
              />
            )}
          </div>
        </div>
      ))}

      {embers.map((e) => (
        <motion.span
          key={e.id}
          className="absolute rounded-full"
          style={{ left: `${e.x}%`, bottom: '10%', width: e.size, height: e.size, background: '#ff5a3c', boxShadow: '0 0 12px rgba(224,36,26,0.8)' }}
          initial={{ opacity: 0, y: 0 }}
          animate={reduced ? { opacity: 0.4 } : { opacity: [0, 0.9, 0], y: e.drift }}
          transition={{ duration: reduced ? 0 : e.dur + 0.4, delay: reduced ? 0 : e.delay + 0.2, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

// ── 世界を断つ斬撃: 2 tebasan silang + celah ruang + distorsi + gelap ───────
function SekaiZangeki({ reduced }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Tebasan 1: horizontal seluruh viewport */}
      <motion.div
        className="absolute left-0 right-0"
        style={{ top: '46%', height: 3, background: `linear-gradient(90deg, transparent, ${SUKUNA_FLASH}, transparent)`, boxShadow: `0 0 26px 4px ${SUKUNA_FLASH}cc` }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={reduced ? { scaleX: 1, opacity: 0.7 } : { scaleX: 1, opacity: [0, 1, 0.9, 0] }}
        transition={{ duration: reduced ? 0 : 0.4, ease: 'easeOut' }}
      />
      {/* Tebasan 2: vertikal */}
      <motion.div
        className="absolute top-0 bottom-0"
        style={{ left: '48%', width: 3, background: `linear-gradient(180deg, transparent, ${SUKUNA_FLASH}, transparent)`, boxShadow: `0 0 26px 4px ${SUKUNA_FLASH}cc` }}
        initial={{ scaleY: 0, opacity: 0 }}
        animate={reduced ? { scaleY: 1, opacity: 0.7 } : { scaleY: 1, opacity: [0, 1, 0.9, 0] }}
        transition={{ duration: reduced ? 0 : 0.4, delay: reduced ? 0 : 0.16, ease: 'easeOut' }}
      />

      {/* Celah ruang putih tebal di garis silang */}
      <motion.div
        className="absolute"
        style={{ left: '50%', top: '46%', width: '110vmax', height: 10, x: '-50%', y: '-50%', background: SUKUNA_FLASH, filter: 'blur(1px)' }}
        initial={{ opacity: 0, scaleY: 0 }}
        animate={reduced ? { opacity: 0.5, scaleY: 1 } : { opacity: [0, 1, 0], scaleY: [0, 1.4, 2.2] }}
        transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : 0.18, ease: 'easeOut' }}
      />

      {/* Distorsi geser 0.5s (hanya kalau bukan reduced) */}
      {!reduced && (
        <motion.div
          className="absolute inset-0"
          style={{ backdropFilter: 'blur(0.5px)' }}
          animate={{ x: [0, -18, 14, -8, 5, 0], skewX: [0, 1.6, -1.4, 0.8, -0.4, 0] }}
          transition={{ duration: 0.5, delay: 0.14, ease: 'easeOut' }}
        />
      )}

      {/* Gelap total 0.3s setelah tebasan */}
      <motion.div
        className="absolute inset-0 bg-black"
        initial={{ opacity: 0 }}
        animate={reduced ? { opacity: 0.25 } : { opacity: [0, 0, 0.96, 0] }}
        transition={{ duration: reduced ? 0 : 0.9, times: [0, 0.4, 0.62, 1], ease: 'easeOut' }}
      />

      {/* Kanji melintang di garis */}
      <motion.span
        className="absolute left-1/2 font-serif font-black select-none"
        style={{
          top: '52%', x: '-50%', fontSize: 'clamp(34px, 8vw, 96px)',
          color: SUKUNA_FLASH, WebkitTextStroke: `2px ${SUKUNA_INK}`,
          textShadow: '0 0 22px rgba(255,255,255,0.9), 0 0 60px rgba(224,36,26,0.5)',
        }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={reduced ? { opacity: 1, scale: 1 } : { opacity: [0, 1, 1, 0.94], scale: [0.9, 1.06, 1, 1] }}
        transition={{ duration: reduced ? 0 : 0.8, delay: reduced ? 0 : 0.3, ease: 'easeOut' }}
      >
        世界を断つ斬撃
      </motion.span>
    </div>
  );
}

// ── Salah: layar gelap + garis tebasan patah (bukan wash merah) ──────────────
function SukunaWrong({ reduced }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-black"
        initial={{ opacity: 0 }}
        animate={reduced ? { opacity: 0.3 } : { opacity: [0, 0.55, 0.3] }}
        transition={{ duration: reduced ? 0 : 0.5, ease: 'easeOut' }}
      />
      {/* Tebasan patah: 3 segmen garis putus dengan sudut berbeda */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        {[0, 1, 2].map((i) => (
          <motion.path
            key={i}
            d={`M${8 + i * 6},${30 + i * 22} L${38 + i * 4},${34 + i * 20} M${46 + i * 3},${38 + i * 19} L${88 - i * 5},${44 + i * 18}`}
            fill="none" stroke="#e0241a" strokeWidth={1.1 + i * 0.3} strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: [0, 0.95, 0.7] }}
            transition={{ duration: reduced ? 0 : 0.36, delay: reduced ? 0 : i * 0.08, ease: 'easeOut' }}
          />
        ))}
      </svg>
    </div>
  );
}

// ── Dispatcher ───────────────────────────────────────────────────────────────
export function SukunaBurst({ fx, kind }) {
  const [reduced] = useState(prefersReduced);
  const tech = fx?.tech;
  const seed = fx?.seed || 1;
  const style = tech ? SUKUNA_STYLE[tech] : null;

  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.18, ease: 'easeOut' } }}
    >
      {kind === 'wrong' && <SukunaWrong reduced={reduced} />}
      {tech === 'kumo_no_ito' && <KumoNoIto seed={seed} reduced={reduced} />}
      {tech === 'nue' && <Nue seed={seed} reduced={reduced} />}
      {tech === 'furube' && <Furube seed={seed} reduced={reduced} />}
      {tech === 'ryuurin' && <Ryuurin seed={seed} reduced={reduced} />}
      {tech === 'sekai_zangeki' && <SekaiZangeki reduced={reduced} />}
      <TechKanji style={style} reduced={reduced} delay={tech === 'ryuurin' ? 0.4 : 0.22} />
    </motion.div>
  );
}

export default SukunaBurst;
