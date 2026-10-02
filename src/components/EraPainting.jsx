// EraPainting — "lukisan" sumi-e (tinta) buatan SENDIRI sebagai hiasan ruang
// kosong pada hero Home. 100% SVG lokal → TIDAK ada isu hak cipta (tidak pakai
// gambar/lukisan dari internet yang reproduksinya berhak cipta).
//
// Motif Heian: bulan 月 + awan kumo 雲 + bukit berkabut 山 + pinus 松 + bintang.
// Monokrom tinta (var --sumi-val) + emas (--kin-val) → otomatis menyesuaikan
// tema terang/gelap. Dekoratif → aria-hidden + pointer-events:none.
// Hanya tampil di era Heian (lihat .era-painting di src/index.css).
export function EraPainting({ className = '' }) {
  return (
    <svg
      viewBox="0 0 400 300"
      className={`era-painting ${className}`}
      aria-hidden="true"
      preserveAspectRatio="xMaxYMax meet"
    >
      <defs>
        <linearGradient id="era-painting-hill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--sumi-val)" stopOpacity="0.42" />
          <stop offset="100%" stopColor="var(--sumi-val)" stopOpacity="0.06" />
        </linearGradient>
        <linearGradient id="era-painting-hill2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--sumi-val)" stopOpacity="0.62" />
          <stop offset="100%" stopColor="var(--sumi-val)" stopOpacity="0.16" />
        </linearGradient>
        <linearGradient id="era-painting-hill3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--sumi-val)" stopOpacity="0.78" />
          <stop offset="100%" stopColor="var(--sumi-val)" stopOpacity="0.30" />
        </linearGradient>
        <radialGradient id="era-painting-moon" cx="38%" cy="34%" r="72%">
          <stop offset="0%" stopColor="var(--kin-val)" stopOpacity="0.70" />
          <stop offset="68%" stopColor="var(--kin-val)" stopOpacity="0.42" />
          <stop offset="100%" stopColor="var(--kin-val)" stopOpacity="0.22" />
        </radialGradient>
        <clipPath id="era-painting-moonclip"><circle cx="316" cy="84" r="54" /></clipPath>
      </defs>

      {/* Bintang 星 — titik tinta di langit */}
      <g fill="var(--sumi-val)" opacity="0.50">
        <circle cx="232" cy="40" r="1.9" />
        <circle cx="262" cy="24" r="1.4" />
        <circle cx="198" cy="60" r="1.5" />
        <circle cx="352" cy="30" r="1.6" />
        <circle cx="120" cy="34" r="1.3" />
        <circle cx="300" cy="52" r="1.3" />
        <circle cx="150" cy="70" r="1.1" />
      </g>

      {/* Bulan 月 — piringan bertekstur + lingkar + kawah samar */}
      <circle cx="316" cy="84" r="54" fill="url(#era-painting-moon)" />
      <g clipPath="url(#era-painting-moonclip)" fill="var(--sumi-val)" opacity="0.20">
        <circle cx="300" cy="70" r="12" />
        <circle cx="336" cy="100" r="8" />
        <circle cx="318" cy="56" r="6" />
      </g>
      <circle cx="316" cy="84" r="54" fill="none" stroke="var(--kin-val)" strokeWidth="1.6" opacity="0.60" />

      {/* Awan kumo 雲 — berlapis, melintasi bulan */}
      <g fill="none" stroke="var(--sumi-val)" strokeWidth="2.2" opacity="0.42" strokeLinecap="round">
        <path d="M28 92 Q78 62 128 92 T228 92" />
        <path d="M104 128 Q149 104 194 128 T284 128" />
        <path d="M188 70 Q224 50 260 70 T332 70" />
      </g>
      <g fill="none" stroke="var(--sumi-val)" strokeWidth="1.5" opacity="0.26" strokeLinecap="round">
        <path d="M60 110 Q100 92 140 110 T220 110" />
        <path d="M240 150 Q276 134 312 150 T384 150" />
        <path d="M150 44 Q182 30 214 44" />
      </g>

      {/* Bukit berkabut 山 — tiga lapis, makin dekat makin pekat */}
      <path d="M-20 300 Q70 206 152 256 Q212 292 264 244 Q332 188 420 300 Z" fill="url(#era-painting-hill)" />
      <path d="M-20 300 Q58 252 128 284 Q208 320 288 270 Q352 234 420 300 Z" fill="url(#era-painting-hill2)" />
      <path d="M-20 300 Q96 274 176 292 Q268 312 340 288 Q386 274 420 300 Z" fill="url(#era-painting-hill3)" />

      {/* Rumpun pinus 松 — dua batang, penyeimbang kanan */}
      <g stroke="var(--sumi-val)" fill="none" strokeLinecap="round">
        <g strokeWidth="2.4" opacity="0.55">
          <path d="M352 300 L352 200" />
          <path d="M352 226 Q328 214 312 220" />
          <path d="M352 246 Q378 234 396 240" />
          <path d="M352 200 Q336 184 318 182" />
          <path d="M352 200 Q368 184 388 184" />
          <path d="M352 176 Q340 162 326 160" />
        </g>
        <g strokeWidth="1.8" opacity="0.38">
          <path d="M314 300 L314 256" />
          <path d="M314 272 Q296 262 284 266" />
          <path d="M314 256 Q302 244 290 242" />
          <path d="M314 256 Q326 244 338 242" />
        </g>
      </g>

      {/* Rumput/tanaman kecil di kaki bukit kiri */}
      <g stroke="var(--sumi-val)" strokeWidth="1.5" fill="none" opacity="0.34" strokeLinecap="round">
        <path d="M70 300 Q66 286 56 281" />
        <path d="M74 300 Q76 284 86 279" />
        <path d="M108 300 Q104 288 94 283" />
        <path d="M146 300 Q150 288 158 284" />
      </g>
    </svg>
  );
}

export default EraPainting;
