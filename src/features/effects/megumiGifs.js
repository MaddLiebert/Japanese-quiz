// Registry GIF efek Megumi (pack_10, visual 'megumi') — aset user di public/effects/.
// Peran tiap GIF (spec §GIF opsional — "yang gif nya gak ada cukup teks aja"):
//   bansou   → cut-in 満象 (gajah) saat streak 20 — satu-satunya skill streak ber-GIF.
//   mahoraga → cinematic summon 魔虚羅 (chant 布瑠部由良由良) saat ultimate.
//   wrong    → jawaban salah: 3 GIF kalah (hazushita / chi / tsugi_de_kimeru) —
//              bayangan nelan tombol yang dipencet + kanji.
// Skill lain (玉犬/鵺/大蛇/虎葬) = CSS/SVG murni (tajam semua ukuran) → tanpa GIF.
export const MEGUMI_GIFS = {
  bansou: ['/effects/megumi_bansou.gif'],
  mahoraga: ['/effects/megumi_mahoraga.gif'],
  wrong: [
    '/effects/megumi_hazushita.webp',
    '/effects/megumi_chi.gif',
    '/effects/megumi_tsugi_de_kimeru.gif',
  ],
};

// Pilih satu GIF acak untuk kind. null kalau kind tak dikenal / kosong.
export const pickMegumiGif = (kind, rng = Math.random) => {
  const list = MEGUMI_GIFS[kind];
  if (!Array.isArray(list) || list.length === 0) return null;
  return list[Math.floor(rng() * list.length)];
};

// GIF untuk satu jawaban:
//   salah → GIF kalah acak (3 pilihan) · streak 20 (bansou) → cut-in 満象 ·
//   lainnya null (siluet CSS/SVG murni yang bicara).
export const megumiGifForAnswer = (type, technique = null) => {
  if (type === 'wrong') return pickMegumiGif('wrong');
  if (type === 'correct' && technique === 'bansou') return pickMegumiGif('bansou');
  return null;
};

// Durasi SATU PUTARAN tiap GIF (ms) — hasil ukur PIL 29/09. JANGAN ditebak.
// (hazushita = animated WEBP 58 frame @20ms..680ms — total 6.94s; dipotong oleh
//  MEGUMI_WRONG_HOLD_MAX supaya jawaban salah tidak kelamaan.)
export const MEGUMI_GIF_MS = {
  '/effects/megumi_bansou.gif': 2000,
  '/effects/megumi_mahoraga.gif': 3900,
  '/effects/megumi_chi.gif': 1800,
  '/effects/megumi_hazushita.webp': 6940,
  '/effects/megumi_tsugi_de_kimeru.gif': 4000,
};

// Durasi klip suara terukur (29/09, RMS Web Audio di .hermes/megumi_voice_timing.json)
// — fallback saat elemen <audio> belum punya metadata (playFile → 0) supaya efek
// tidak selesai sebelum suaranya. Mirror SUKUNA_CLIP_MS / YUJI_CLIP_MS.
export const MEGUMI_CLIP_MS = {
  gyokuken: 1057, nue: 766, orochi: 801, bansou: 1405, kosou: 1057,
  mahoraga: 4959,
  hazushita: 1602, chi: 615, tsugi_de_kimeru: 1300,
};

const MEGUMI_HOLD_MAX = 8000;        // batas umum (pola Sukuna)
// Jawaban salah: GIF kalah bisa 7 dtk (hazushita) — efek salah tidak boleh
// selama itu (mengganggu ritme kuis). Dipotong di 2.6s; GIF tetap ber-loop.
const MEGUMI_WRONG_HOLD_MAX = 2600;

// Lama tampil efek: max(hold dasar, 1 putaran GIF), di-clamp. `wrong` memakai
// batas lebih pendek (lihat MEGUMI_WRONG_HOLD_MAX).
export const megumiGifHoldMs = (src, baseHoldMs = 0, wrong = false) => {
  const base = (Number.isFinite(baseHoldMs) && baseHoldMs > 0) ? Math.round(baseHoldMs) : 0;
  const gifMs = (src && Number.isFinite(MEGUMI_GIF_MS[src])) ? MEGUMI_GIF_MS[src] : 0;
  const cap = wrong ? MEGUMI_WRONG_HOLD_MAX : MEGUMI_HOLD_MAX;
  return Math.min(cap, Math.max(base, gifMs));
};

// Lama efek jawaban Megumi: max(hold dasar, klip suara + 400ms, 1 putaran GIF).
// Pelajaran Gojo/Yuji/Sukuna: efek selesai sebelum suara = "kecepetan" → klip menang.
export const megumiAnswerHoldMs = (technique, gifSrc, clipMs = 0, baseHoldMs = 0, wrong = false) => {
  const measured = Number.isFinite(MEGUMI_CLIP_MS[technique]) ? MEGUMI_CLIP_MS[technique] : 0;
  const clip = (Number.isFinite(clipMs) && clipMs > 0) ? clipMs : measured;
  const want = Math.max(baseHoldMs || 0, clip > 0 ? clip + 400 : 0);
  return megumiGifHoldMs(gifSrc, want, wrong);
};

// Semua path GIF (flat, unik) → preload/predecode.
export const megumiGifPaths = () => {
  const out = [];
  for (const list of Object.values(MEGUMI_GIFS)) {
    if (Array.isArray(list)) for (const p of list) if (p && !out.includes(p)) out.push(p);
  }
  return out;
};

// Preload + DECODE semua GIF Megumi. Aman dipanggil berulang. Loader injectable (tes).
let gifPreloaded = false;
export const preloadMegumiGifs = (loader) => {
  const paths = megumiGifPaths();
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
