// Registry GIF efek Toji (pack_13, visual 'toji') — aset user di public/effects/.
// Peran tiap GIF (spec §GIF kalah — 2 GIF terverifikasi frame-by-frame):
//   wrong → jawaban salah: 2 GIF kalah (武器庫呪霊 melingkar di bahu 4,4s +
//           close-up bangkit Shibuya 1,8s) — dipilih acak per jawaban salah.
// Skill streak (釈魂刀/万里ノ鎖/天逆鉾/遊雲/武器庫呪霊) = SVG/CSS murni (tajam
// semua ukuran, kilau baja tanpa glow) → tanpa GIF. Ultimate = cinematic
// TojiShadow (sinkron klip cast) → tanpa GIF.
export const TOJI_GIFS = {
  wrong: [
    '/effects/toji_kalah_1.gif',
    '/effects/toji_kalah_2.gif',
  ],
};

// Pilih satu GIF acak untuk kind. null kalau kind tak dikenal / kosong.
export const pickTojiGif = (kind, rng = Math.random) => {
  const list = TOJI_GIFS[kind];
  if (!Array.isArray(list) || list.length === 0) return null;
  return list[Math.floor(rng() * list.length)];
};

// GIF untuk satu jawaban:
//   salah → GIF kalah acak (2 pilihan) · lainnya null (siluet baja murni).
export const tojiGifForAnswer = (type) => {
  if (type === 'wrong') return pickTojiGif('wrong');
  return null;
};

// Durasi SATU PUTARAN tiap GIF (ms) — hasil ukur PIL 30/09. JANGAN ditebak.
// (kalah_1 = 44 frame @100ms = 4,4s; kalah_2 = 18 frame @100ms = 1,8s.)
export const TOJI_GIF_MS = {
  '/effects/toji_kalah_1.gif': 4400,
  '/effects/toji_kalah_2.gif': 1800,
};

const TOJI_HOLD_MAX = 8000;         // batas umum (pola Megumi/Sukuna)
// Jawaban salah: klip kalah bisa 3,98s (敗因？勝負はこれからだろ) — efek salah
// tidak boleh lebih lama dari itu + margin (mengganggu ritme kuis). Cap 4,6s;
// GIF tetap ber-loop kalau putarannya lebih pendek.
export const TOJI_WRONG_HOLD_MAX = 4600;

// Lama tampil efek: max(hold dasar, 1 putaran GIF), di-clamp. `wrong` memakai
// batas lebih pendek (lihat TOJI_WRONG_HOLD_MAX).
export const tojiGifHoldMs = (src, baseHoldMs = 0, wrong = false) => {
  const base = (Number.isFinite(baseHoldMs) && baseHoldMs > 0) ? Math.round(baseHoldMs) : 0;
  const gifMs = (src && Number.isFinite(TOJI_GIF_MS[src])) ? TOJI_GIF_MS[src] : 0;
  const cap = wrong ? TOJI_WRONG_HOLD_MAX : TOJI_HOLD_MAX;
  return Math.min(cap, Math.max(base, gifMs));
};

// Semua path GIF (flat, unik) → preload/predecode.
export const tojiGifPaths = () => {
  const out = [];
  for (const list of Object.values(TOJI_GIFS)) {
    if (Array.isArray(list)) for (const p of list) if (p && !out.includes(p)) out.push(p);
  }
  return out;
};

// Preload + DECODE semua GIF Toji. Aman dipanggil berulang. Loader injectable (tes).
let gifPreloaded = false;
export const preloadTojiGifs = (loader) => {
  const paths = tojiGifPaths();
  if (typeof window === 'undefined' && !loader) return paths.length;
  if (gifPreloaded && !loader) return paths.length;
  gifPreloaded = true;
  const make = loader || (() => new Image());
  for (const p of paths) {
    try {
      const img = make();
      img.decoding = 'sync';
      img.src = p;
      if (typeof img.decode === 'function') img.decode().catch(() => {});
    } catch { /* preload gagal → GIF tetap dimuat saat tampil */ }
  }
  return paths.length;
};
