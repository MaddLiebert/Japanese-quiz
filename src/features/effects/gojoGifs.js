// Registry GIF Gojo Satoru untuk efek jawaban + cast domain (pack_07).
// Aset user di public/effects/ (GIF kecil ~200-340KB, aman tanpa kompresi).
//   murasaki       → teknik 茈 (jawaban benar #3 & tiap milestone)
//   ryoiki tenkai  → cinematic cast domain (Gojo clasped hands)
//   wrong          → jawaban salah (meme Gojo "kalah" yang ceria)
export const GOJO_GIFS = {
  murasaki: ['/effects/murasaki.gif'],
  ryoiki: ['/effects/ryoiki tenkai.gif'],
  wrong: [
    '/effects/Gojo kalah gif.gif',
    '/effects/gojo kalah gif 2.gif',
  ],
};

// Pilih satu GIF acak untuk kind ('murasaki' | 'ryoiki' | 'wrong').
// null kalau kind tak dikenal / daftar kosong.
export const pickGojoGif = (kind, rng = Math.random) => {
  const list = GOJO_GIFS[kind];
  if (!Array.isArray(list) || list.length === 0) return null;
  return list[Math.floor(rng() * list.length)];
};

// GIF untuk satu jawaban Gojo:
//   - salah              → GIF "kalah" (2 pilihan, acak)
//   - benar teknik 茈     → GIF murasaki
//   - ao / aka / biasa   → null (visualnya bola plasma di pinggir, bukan GIF)
export const gojoGifForAnswer = (type, technique = null, rng = Math.random) => {
  if (type === 'wrong') return pickGojoGif('wrong', rng);
  if (type === 'correct' && technique === 'murasaki') return pickGojoGif('murasaki', rng);
  return null;
};

// GIF untuk cinematic cast 領域展開 (ditampilkan di tengah saat domain dimulai).
export const gojoCastGif = (rng = Math.random) => pickGojoGif('ryoiki', rng);

// Durasi SATU PUTARAN tiap GIF (ms) — diukur dari file (PIL). Dipakai supaya
// GIF tidak kepotong di tengah: hold efek minimal selama 1 putaran.
export const GOJO_GIF_MS = {
  '/effects/murasaki.gif': 1000,
  '/effects/ryoiki tenkai.gif': 6800,
  '/effects/Gojo kalah gif.gif': 1400,
  '/effects/gojo kalah gif 2.gif': 3500,
};

// Durasi klip suara Murasaki.mp3 (terukur mutagen: 3239ms). Efek visual 茈
// HARUS hidup >= durasi ini — keluhan user: "efek murasaki kecepetan" (efek
// selesai sebelum suara habis). Nilai di-clamp agar tidak berlebihan.
export const GOJO_MURASAKI_CLIP_MS = 3239;
const GOJO_MURASAKI_FX_MAX = 5000;

// Lama efek 茈 tampil: minimal selama klip suara (tabrakan 0.42s + ledakan
// ~1.5s + ekor), sinkron dengan Murasaki.mp3.
export const gojoMurasakiFxMs = () =>
  Math.min(GOJO_MURASAKI_FX_MAX, GOJO_MURASAKI_CLIP_MS + 400);

// Hold efek per jawaban Gojo (dipakai EffectContext):
//   - teknik 茈 (murasaki) → SELALU pakai gojoMurasakiFxMs (sinkron klip suara,
//     bukan GIF-nya — GIF 茈 hanya 1s, suaranya 3.24s; efek harus hidup selama suara)
//   - selain itu → max(hold dasar, 1 putaran GIF) via gojoGifHoldMs
export const gojoAnswerHoldMs = (technique, gifSrc, baseHoldMs = 0) =>
  (technique === 'murasaki')
    ? gojoMurasakiFxMs()
    : gojoGifHoldMs(gifSrc, baseHoldMs);

const GOJO_GIF_HOLD_MAX = 8000;

// Lama tampil efek Gojo: max(hold dasar, 1 putaran GIF), di-clamp ≤8s.
// GIF 3.5s ("kalah 2") tidak lagi terpotong di tengah oleh hold 2.2s.
export const gojoGifHoldMs = (src, baseHoldMs = 0) => {
  const base = (Number.isFinite(baseHoldMs) && baseHoldMs > 0) ? Math.round(baseHoldMs) : 0;
  const gifMs = (src && Number.isFinite(GOJO_GIF_MS[src])) ? GOJO_GIF_MS[src] : 0;
  return Math.min(GOJO_GIF_HOLD_MAX, Math.max(base, gifMs));
};

// Semua path GIF Gojo (flat, unik) → dipakai untuk preload/predecode.
export const gojoGifPaths = () => {
  const out = [];
  for (const list of Object.values(GOJO_GIFS)) {
    if (Array.isArray(list)) for (const p of list) if (p && !out.includes(p)) out.push(p);
  }
  return out;
};

// Preload + DECODE semua GIF Gojo ke cache browser, supaya saat jawaban / cast
// GIF langsung tampil di frame pertama. Aman dipanggil berulang.
// loader injectable untuk test; default: elemen Image.
let gifPreloaded = false;
export const preloadGojoGifs = (loader) => {
  const paths = gojoGifPaths();
  if (typeof window === 'undefined' && !loader) return paths.length;
  if (gifPreloaded && !loader) return paths.length;   // sekali saja per sesi
  gifPreloaded = true;
  const make = loader || (() => new Image());
  for (const p of paths) {
    try {
      const img = make();
      img.decoding = 'sync';        // minta decode sinkron → frame 1 siap
      img.src = p;
      if (typeof img.decode === 'function') img.decode().catch(() => {});
    } catch { /* preload gagal → abaikan, GIF tetap dimuat saat tampil */ }
  }
  return paths.length;
};
