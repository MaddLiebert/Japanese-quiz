import { useId, useState } from 'react';
import { motion } from 'motion/react';

// ─────────────────────────────────────────────────────────────────────────────
// StreakSigil — ikon streak PER-ERA (SVG). Menggantikan kotak segel 炎/灰
// bawaan Shōwa untuk era yang sudah didesain.
//   • Heian → StreakCandle (和蝋燭, di file terpisah)
//   • Edo   → StreakLantern 提灯 (lentera kertas)
//   • Meiji → StreakGaslight 瓦斯灯 (lampu gas)
//
// Kenapa SVG + `motion/react`: bentuk kecil tapi harus tajam di semua ukuran,
// ikut token tema (var --kinari/--kin/--shu/--sumi → benar di terang & gelap),
// dan `motion/react` sudah dipakai seluruh app (tanpa dependensi baru; GSAP
// tidak terpasang di proyek ini).
//
// A11y: nyala/padam = INFORMASI → role="img" + aria-label ikut bahasa UI.
// reduced-motion: animasi berhenti, bentuk & warna tetap (status tetap terbaca).
// ─────────────────────────────────────────────────────────────────────────────

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Edo 江戸 — 提灯 (chōchin): lentera kertas berusuk, digantung tali. ───────
export function StreakLantern({ lit = false, size = 44, label = '' }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [reduced] = useState(prefersReduced);
  const height = Math.round((size * 96) / 64);

  const glowId = `${uid}-glow`;
  const paperId = `${uid}-paper`;
  const capId = `${uid}-cap`;

  return (
    <svg
      viewBox="0 0 64 96"
      width={size}
      height={height}
      role="img"
      aria-label={label || (lit ? 'Lentera menyala' : 'Lentera padam')}
      className="block shrink-0 select-none"
    >
      <defs>
        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--kin-val)" stopOpacity="0.62" />
          <stop offset="45%" stopColor="var(--kin-val)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--kin-val)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={paperId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={lit ? '#c98a1e' : '#cbbfa2'} />
          <stop offset="30%" stopColor={lit ? '#f6d488' : '#efe6cf'} />
          <stop offset="70%" stopColor={lit ? '#eab94f' : '#e2d7ba'} />
          <stop offset="100%" stopColor={lit ? '#b9791a' : '#c3b696'} />
        </linearGradient>
        <linearGradient id={capId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#4a3320" />
          <stop offset="50%" stopColor="#6b4a2a" />
          <stop offset="100%" stopColor="#3a2818" />
        </linearGradient>
      </defs>

      {/* Cahaya hangat — hanya saat menyala, di belakang lentera. */}
      {lit && (
        <motion.ellipse
          cx="32" cy="50" rx="30" ry="34"
          fill={`url(#${glowId})`}
          initial={false}
          animate={reduced ? { opacity: 0.55 } : { opacity: [0.42, 0.72, 0.46, 0.64, 0.42] }}
          transition={reduced ? { duration: 0 } : { duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Tali gantung + penutup atas. */}
      <path d="M32,4 L32,18" stroke="var(--sumi-val)" strokeWidth="1.6" opacity="0.55" strokeLinecap="round" />
      <ellipse cx="32" cy="20" rx="10" ry="3.4" fill={`url(#${capId})`} />

      {/* Badan lentera — kertas berusuk (tanda 提灯). */}
      <g opacity={lit ? 1 : 0.62}>
        <ellipse cx="32" cy="52" rx="20" ry="30" fill={`url(#${paperId})`} />
        {/* rusuk anyaman bambu */}
        {[28, 34, 40, 46, 52, 58, 64, 70].map((y) => (
          <path
            key={y}
            d={`M13,${y} Q32,${y + (y < 52 ? -2 : 2)} 51,${y}`}
            fill="none"
            stroke="rgba(42,18,8,0.35)"
            strokeWidth="0.9"
          />
        ))}
        {/* kanji 学 — lentera bertanda sekolah */}
        <text
          x="32" y="52"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="var(--font-display)"
          fontSize="22"
          fontWeight="700"
          fill="var(--shu-val)"
        >
          学
        </text>
      </g>

      {/* Penutup bawah. */}
      <ellipse cx="32" cy="82" rx="10" ry="3.4" fill={`url(#${capId})`} />
      <path d="M32,82 L32,92" stroke="var(--sumi-val)" strokeWidth="1.4" opacity="0.5" strokeLinecap="round" />

      {/* Berayun halus (bandul) — tanda lentera hidup, bukan gambar mati. */}
      <motion.g
        style={{ transformBox: 'view-box', transformOrigin: '32px 4px' }}
        initial={false}
        animate={reduced ? { rotate: 0 } : { rotate: [-1.8, 1.8, -1.8] }}
        transition={reduced ? { duration: 0 } : { duration: 4.4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  );
}

// ── Meiji 明治 — 瓦斯灯 (gaslight): lampu gas besi, menyala tiap senja. ──────
export function StreakGaslight({ lit = false, size = 44, label = '' }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [reduced] = useState(prefersReduced);
  const height = Math.round((size * 96) / 64);

  const glowId = `${uid}-glow`;
  const ironId = `${uid}-iron`;
  const flameId = `${uid}-flame`;

  return (
    <svg
      viewBox="0 0 64 96"
      width={size}
      height={height}
      role="img"
      aria-label={label || (lit ? 'Lampu gas menyala' : 'Lampu gas padam')}
      className="block shrink-0 select-none"
    >
      <defs>
        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--gas-val)" stopOpacity="0.7" />
          <stop offset="45%" stopColor="var(--gas-val)" stopOpacity="0.24" />
          <stop offset="100%" stopColor="var(--gas-val)" stopOpacity="0" />
        </radialGradient>
        {/* Besi tuang lampu kota — gelap, kokoh. */}
        <linearGradient id={ironId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1c1c1c" />
          <stop offset="45%" stopColor="#3a3a38" />
          <stop offset="100%" stopColor="#161616" />
        </linearGradient>
        {/* Nyala gas — terang di pangkal (amber → putih), bukan oranye web. */}
        <linearGradient id={flameId} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#fffdf2" />
          <stop offset="40%" stopColor="var(--gas-val)" />
          <stop offset="100%" stopColor="#e8a52e" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* Cahaya gas — kolam amber, hanya saat menyala. */}
      {lit && (
        <motion.ellipse
          cx="32" cy="38" rx="29" ry="32"
          fill={`url(#${glowId})`}
          initial={false}
          animate={reduced ? { opacity: 0.6 } : { opacity: [0.46, 0.74, 0.5, 0.66, 0.46] }}
          transition={reduced ? { duration: 0 } : { duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Tiang + kepala lampu besi. */}
      <path d="M32,40 L32,90" stroke={`url(#${ironId})`} strokeWidth="4" strokeLinecap="round" />
      <path d="M24,90 L40,90" stroke={`url(#${ironId})`} strokeWidth="4" strokeLinecap="round" />

      {/* Rumah lampu kaca (lantern head) — segi empat bergaya kota Meiji. */}
      <g opacity={lit ? 1 : 0.7}>
        <path d="M22,20 L42,20 L40,44 L24,44 Z" fill={lit ? 'rgba(240,200,90,0.16)' : 'rgba(20,20,20,0.06)'} stroke={`url(#${ironId})`} strokeWidth="2.4" strokeLinejoin="round" />
        {/* jeruji kaca */}
        <path d="M32,20 L32,44" stroke={`url(#${ironId})`} strokeWidth="1.2" opacity="0.7" />
        {/* atap kerucut + puncak */}
        <path d="M20,20 L32,8 L44,20 Z" fill={`url(#${ironId})`} />
        <circle cx="32" cy="7" r="2.2" fill={`url(#${ironId})`} />
      </g>

      {lit ? (
        // Nyala gas 瓦斯灯 — berdenyut dari pangkal.
        <motion.g
          style={{ transformBox: 'view-box', transformOrigin: '32px 42px' }}
          initial={false}
          animate={reduced
            ? { scale: 1, opacity: 1 }
            : { scale: [1, 1.08, 0.95, 1.05, 1], opacity: [0.95, 1, 0.92, 1, 0.95] }}
          transition={reduced ? { duration: 0 } : { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path
            d="M32,22 C35,30 38,34 38,38.5 C38,42.4 35.3,44.5 32,44.5 C28.7,44.5 26,42.4 26,38.5 C26,34 29,30 32,22 Z"
            fill={`url(#${flameId})`}
          />
          <path
            d="M32,30 C33.8,35 35.2,37.4 35.2,39.4 C35.2,41.6 33.8,43 32,43 C30.2,43 28.8,41.6 28.8,39.4 C28.8,37.4 30.2,35 32,30 Z"
            fill="#fffdf2"
            opacity="0.9"
          />
        </motion.g>
      ) : (
        // Padam — rumah kaca kosong, hanya sedikit jelaga 煤.
        <path d="M30,26 C29,32 31,38 30,42" fill="none" stroke="rgba(20,20,20,0.35)" strokeWidth="1.6" strokeLinecap="round" />
      )}
    </svg>
  );
}

export default StreakLantern;

// ── 電脳 Cyberpunk — ホログラム (hologram): proyeksi HUD dari proyektor ──────
// Streak = UPTIME KONEKSI. Selama pemain belajar tiap hari, proyeksi tetap
// TERHUBUNG & stabil (panel holo menyala, scanline berjalan, partikel data naik,
// cincin HUD berputar). Bolong sehari → KONEKSI PUTUS: berkas padam, panel jadi
// kerangka putus-putus, muncul "no signal" glitch.
//
// Bahasa rupa = KACA & CAHAYA (bukan lilin/lentera era kertas): panel HUD sudut
// terpotong + border neon + scanline + glitch RGB-split + cincin berputar.
// Semua bentuk DETERMINISTIK; gerak = transform/opacity (murah). Ikut token era
// (--ai-val cyan, --kin-val, --shu-val) → benar di terang & gelap.
export function StreakHologram({ lit = false, size = 44, label = '' }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [reduced] = useState(prefersReduced);
  const height = Math.round((size * 96) / 64);

  const glowId = `${uid}-glow`;
  const beamId = `${uid}-beam`;
  const panelId = `${uid}-panel`;
  const holo = 'var(--ai-val)';
  const holoDim = 'var(--nezumi-val)';
  const accent = 'var(--kin-val)';
  const alarm = 'var(--shu-val)';

  // Sudut panel terpotong (cut-corner) — bahasa bentuk HUD, bukan persegi polos.
  const panelPath = 'M18,20 L46,20 L54,28 L54,60 L46,68 L18,68 L10,60 L10,28 Z';

  return (
    <svg
      viewBox="0 0 64 96"
      width={size}
      height={height}
      role="img"
      aria-label={label || (lit ? 'Hologram aktif' : 'Hologram mati')}
      className="block shrink-0 select-none"
    >
      <defs>
        {/* Pancaran proyeksi — dari lensa (bawah) melebar & memudar ke atas. */}
        <linearGradient id={beamId} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={holo} stopOpacity={lit ? 0.55 : 0.16} />
          <stop offset="55%" stopColor={holo} stopOpacity={lit ? 0.18 : 0.05} />
          <stop offset="100%" stopColor={holo} stopOpacity="0" />
        </linearGradient>
        {/* Isi panel holo — kaca cyan tembus pandang (gradien 2 arah). */}
        <linearGradient id={panelId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={holo} stopOpacity={lit ? 0.26 : 0.08} />
          <stop offset="100%" stopColor={holo} stopOpacity={lit ? 0.06 : 0.02} />
        </linearGradient>
        {/* Aura cahaya di sekitar panel (menyala saat aktif). */}
        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={holo} stopOpacity={lit ? 0.5 : 0.12} />
          <stop offset="60%" stopColor={holo} stopOpacity={lit ? 0.16 : 0.04} />
          <stop offset="100%" stopColor={holo} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Aura — kolam cahaya proyeksi, berdenyut halus saat aktif. */}
      <motion.ellipse
        cx="32" cy="44" rx="31" ry="36"
        fill={`url(#${glowId})`}
        initial={false}
        animate={reduced ? { opacity: 1 } : { opacity: lit ? [0.7, 1, 0.78, 0.95, 0.7] : 0.5 }}
        transition={reduced ? { duration: 0 } : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Berkas proyeksi (kerucut) — dari lensa ke panel. */}
      <polygon points="32,84 14,68 50,68" fill={`url(#${beamId})`} />

      {/* Partikel DATA naik di dalam berkas — tanda koneksi hidup. */}
      {lit && !reduced && [0, 1, 2, 3].map((i) => (
        <motion.rect
          key={i}
          x={24 + i * 5}
          y="82"
          width="1.6"
          height="3.4"
          fill={holo}
          initial={{ opacity: 0 }}
          animate={{ y: [82, 66], opacity: [0, 0.9, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.45, ease: 'easeOut' }}
        />
      ))}

      {/* PANEL HUD melayang — kerangka sudut terpotong. */}
      <g opacity={lit ? 1 : 0.66}>
        <path
          d={panelPath}
          fill={`url(#${panelId})`}
          stroke={lit ? holo : holoDim}
          strokeWidth="1.4"
          strokeLinejoin="round"
          strokeDasharray={lit ? 'none' : '3 2.4'}
        />
        {/* siku HUD di 4 sudut — detail instrumen, bukan bingkai polos */}
        {[[12, 30, 1, 1], [52, 30, -1, 1], [12, 58, 1, -1], [52, 58, -1, -1]].map(([x, y, sx, sy], i) => (
          <path
            key={i}
            d={`M${x},${y + sy * 4} L${x},${y} L${x + sx * 4},${y}`}
            fill="none"
            stroke={lit ? accent : holoDim}
            strokeWidth="1.2"
            opacity={lit ? 0.9 : 0.5}
          />
        ))}
      </g>

      {/* Garis scanline bergerak naik-turun di dalam panel (hanya saat aktif). */}
      {lit && (
        <motion.rect
          x="11" width="42" height="2.2" rx="1"
          fill={holo}
          initial={{ opacity: 0 }}
          animate={reduced ? { y: 42, opacity: 0.5 } : { y: [22, 64, 22], opacity: [0, 0.75, 0] }}
          transition={reduced ? { duration: 0 } : { duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Kanji tengah — 電 (aktif) / 断 (terputus). Glitch RGB-split tipis. */}
      <g>
        {lit && !reduced && (
          <>
            <motion.text
              x="32" y="47" textAnchor="middle" dominantBaseline="central"
              fontFamily="var(--font-display)" fontSize="30" fontWeight="800"
              fill={alarm} opacity="0.55"
              animate={{ x: [31, 33, 31, 32, 31], y: [47, 46, 47] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'steps(1,end)' }}
            >
              電
            </motion.text>
            <motion.text
              x="32" y="47" textAnchor="middle" dominantBaseline="central"
              fontFamily="var(--font-display)" fontSize="30" fontWeight="800"
              fill={holo} opacity="0.5"
              animate={{ x: [33, 31, 33, 32, 33] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'steps(1,end)' }}
            >
              電
            </motion.text>
          </>
        )}
        <text
          x="32" y="47" textAnchor="middle" dominantBaseline="central"
          fontFamily="var(--font-display)" fontSize="30" fontWeight="800"
          fill={lit ? '#ffffff' : holoDim}
          opacity={lit ? 0.96 : 0.7}
        >
          {lit ? '電' : '断'}
        </text>
      </g>

      {/* Cincin HUD berputar mengelilingi panel — proyeksi punya kedalaman. */}
      {lit && (
        <motion.g
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          initial={false}
          animate={reduced ? { rotate: 0 } : { rotate: 360 }}
          transition={reduced ? { duration: 0 } : { duration: 9, repeat: Infinity, ease: 'linear' }}
        >
          <ellipse cx="32" cy="44" rx="27" ry="9" fill="none" stroke={holo} strokeWidth="0.9" strokeDasharray="6 5" opacity="0.55" />
        </motion.g>
      )}

      {/* Proyektor (emitter) — basis kokoh dengan lensa menyala. */}
      <path d="M22,90 L42,90 L38,84 L26,84 Z" fill="#0a1424" stroke="rgba(0,240,255,0.35)" strokeWidth="1" />
      <motion.ellipse
        cx="32" cy="84" rx="6" ry="1.8"
        fill={lit ? holo : holoDim}
        initial={false}
        animate={reduced ? { opacity: 1 } : { opacity: lit ? [0.7, 1, 0.7] : 0.45 }}
        transition={reduced ? { duration: 0 } : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Padam — "no signal": dua bar glitch statis berkedip pelan (koneksi putus). */}
      {!lit && (
        <>
          <motion.rect x="14" y="34" width="36" height="3" fill={alarm} opacity="0.4"
            animate={reduced ? { opacity: 0.4 } : { opacity: [0, 0.4, 0, 0.25, 0] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: 'steps(1,end)' }} />
          <motion.rect x="18" y="54" width="28" height="2.4" fill={holo} opacity="0.3"
            animate={reduced ? { opacity: 0.3 } : { opacity: [0, 0.3, 0, 0.2, 0] }}
            transition={{ duration: 4.2, repeat: Infinity, delay: 0.6, ease: 'steps(1,end)' }} />
        </>
      )}
    </svg>
  );
}
