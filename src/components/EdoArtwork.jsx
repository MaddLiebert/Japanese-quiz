// ─────────────────────────────────────────────────────────────────────────────
// EdoArtwork — "cetakan kayu" ukiyo-e buatan SENDIRI sebagai hiasan era Edo di
// Home (kartu JLPT N5). 100% SVG lokal → bebas isu hak cipta (tidak memakai
// reproduksi cetakan berhak cipta). Pasangan dari EraArtwork (yang Heian-only):
// di era Edo, ruang itu tadinya KOSONG karena lukisan Heian disembunyikan.
//
// Motif (docs/tema/edo.md §2/§6): gunung 富士 Fuji (富嶽三十六景 Hokusai = cetakan
// Edo paling ikonik) + matahari 日の丸 朱 + awan pita 雲 + gelombang 波 bergaya
// cetakan + perahu nelayan. Bahasa rupa = BLOK WARNA DATAR + garis ukir, bukan
// gradien mengkilap — persis hasil cetak kayu.
//
// Hanya tampil di era Edo (gate .edo-art di src/index.css). Dekoratif →
// aria-hidden + pointer-events:none (di CSS).
// ─────────────────────────────────────────────────────────────────────────────
import { useId } from 'react';

export function EdoPrintArt({ className = '' }) {
  // useId() bisa memuat ':' (tak sah di url(#id)) → bersihkan.
  const uid = useId().replace(/:/g, '');
  const sky = `edoSky-${uid}`;
  const fuji = `edoFuji-${uid}`;
  const snow = `edoSnow-${uid}`;
  const sea = `edoSea-${uid}`;

  return (
    <svg
      viewBox="0 0 400 300"
      className={`edo-art edo-art--print ${className}`}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        {/* Bokashi 暈し — sapuan langit indigo di tepi atas (tanda cetak Edo). */}
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--ai-val)" stopOpacity="0.55" />
          <stop offset="52%" stopColor="var(--ai-val)" stopOpacity="0.10" />
          <stop offset="100%" stopColor="var(--ai-val)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={fuji} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--ai-val)" stopOpacity="0.85" />
          <stop offset="100%" stopColor="var(--ai-val)" stopOpacity="0.42" />
        </linearGradient>
        <linearGradient id={snow} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.72" />
        </linearGradient>
        <linearGradient id={sea} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--ai-val)" stopOpacity="0.30" />
          <stop offset="100%" stopColor="var(--ai-val)" stopOpacity="0.62" />
        </linearGradient>
      </defs>

      {/* Langit bokashi */}
      <rect x="0" y="0" width="400" height="300" fill={`url(#${sky})`} />

      {/* Matahari 日 — piringan 朱 di kiri-atas, blok warna datar (bukan glow). */}
      <circle cx="86" cy="74" r="30" fill="var(--shu-val)" opacity="0.85" />

      {/* Awan pita 雲 — batang cetak datar, khas ukiyo-e (bukan awan realistis). */}
      <g fill="var(--kinari-val)" opacity="0.55">
        <path d="M-10 118 q60 -16 122 0 t122 0 t122 0 v16 q-60 14 -122 0 t-122 0 t-122 0 z" />
        <path d="M40 168 q56 -14 112 0 t112 0 t112 0 v13 q-56 12 -112 0 t-112 0 t-112 0 z" opacity="0.7" />
      </g>

      {/* Gunung 富士 Fuji — siluet cetak: tubuh indigo + puncak salju bergerigi. */}
      <path d="M22 264 C104 206 158 118 200 66 C242 118 296 206 378 264 Z" fill={`url(#${fuji})`} />
      <path
        d="M200 66 C222 88 244 120 258 152 L249 154 L241 141 L233 154 L225 139 L217 154 L209 141 L200 154 L191 141 L183 154 L175 139 L167 154 L159 152 C173 120 178 88 200 66 Z"
        fill={`url(#${snow})`}
      />
      {/* Garis ukir tepi gunung — bahasa cetak (outline tipis, bukan tanpa tepi). */}
      <path d="M22 264 C104 206 158 118 200 66 C242 118 296 206 378 264" fill="none" stroke="var(--sumi-val)" strokeWidth="1.6" opacity="0.55" />

      {/* Laut 海 — blok indigo + garis gelombang bergaya cetakan. */}
      <path d="M0 246 q50 -18 100 0 t100 0 t100 0 t100 0 v54 h-400 z" fill={`url(#${sea})`} />
      <g fill="none" stroke="var(--kinari-val)" strokeWidth="2.4" strokeLinecap="round" opacity="0.7">
        <path d="M-8 262 q26 -12 52 0 t52 0 t52 0 t52 0 t52 0 t52 0 t52 0" />
        <path d="M-8 280 q26 -12 52 0 t52 0 t52 0 t52 0 t52 0 t52 0 t52 0" opacity="0.75" />
      </g>
      {/* Buih 泡 — kait bergaya Hokusai di kaki gelombang. */}
      <g fill="var(--kinari-val)" opacity="0.9">
        <circle cx="58" cy="250" r="5" />
        <circle cx="72" cy="244" r="3.4" />
        <circle cx="88" cy="250" r="2.6" />
        <circle cx="46" cy="244" r="2.4" />
      </g>

      {/* Perahu nelayan 船 — siluet kecil di atas laut (skala & kedalaman). */}
      <g fill="var(--sumi-val)" opacity="0.8">
        <path d="M300 250 q14 10 30 0 l-4 6 h-22 z" />
        <path d="M313 250 l0 -12 l9 6 z" />
      </g>
    </svg>
  );
}

export default EdoPrintArt;
