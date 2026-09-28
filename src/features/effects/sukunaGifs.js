// Registry GIF efek Sukuna (pack_14) — aset user di public/effects/.
// Peran tiap GIF (kritik user 28/09 — "gif nya gak usah di taro di belakang",
// "pas salah ... cuma pake kata2 kanji sama gif"):
//   ryoiki    → cinematic 領域展開: 掌印 (tangan jelas), BUKAN latar belakang
//   mahoraga  → streak 20 布瑠部由良由良 (roda adaptasi 8 handle, TANPA mata)
//   wrong     → jawaban salah: kanji 馬鹿な + GIF kalah (semua efek lain dibuang)
export const SUKUNA_GIFS = {
  ryoiki: ['/effects/ryoiki.gif'],       // 伏魔御廚子 — Sukuna 掌印 + kuil
  mahoraga: ['/effects/mahoraga.gif'],   // 魔虚羅 — Divine General
  wrong: ['/effects/sukuna kalah.gif'],  // 馬鹿な (kalah)
};

// Pilih satu GIF acak untuk kind. null kalau kind tak dikenal / kosong.
export const pickSukunaGif = (kind, rng = Math.random) => {
  const list = SUKUNA_GIFS[kind];
  if (!Array.isArray(list) || list.length === 0) return null;
  return list[Math.floor(rng() * list.length)];
};

// GIF untuk satu jawaban:
//   salah → GIF kalah (馬鹿な) · streak 20 (furube) → mahoraga · lainnya null.
// Teknik streak lain tidak memakai GIF (CSS/SVG murni, aturan anti-nabrak Yuji).
export const sukunaGifForAnswer = (type, technique = null) => {
  if (type === 'wrong') return pickSukunaGif('wrong');
  if (type === 'correct' && technique === 'furube') return pickSukunaGif('mahoraga');
  return null;
};

// Durasi SATU PUTARAN tiap GIF (ms) — hasil ukur PIL (28/09). JANGAN ditebak.
export const SUKUNA_GIF_MS = {
  '/effects/ryoiki.gif': 1400,
  '/effects/mahoraga.gif': 2300,
  '/effects/sukuna kalah.gif': 1800,
};

// Durasi klip suara terukur (28/09, tabel di brain/Efek JJK/Sukuna.md) — fallback
// saat elemen <audio> belum punya metadata (playFile → 0) supaya efek tidak
// selesai sebelum suaranya. Mirror YUJI_CLIP_MS.
export const SUKUNA_CLIP_MS = {
  kumo_no_ito: 1310, nue: 800, furube: 1920, ryuurin: 4380,
  sekai_zangeki: 2390, ryouiki_tenkai: 3480,
  gambare: 1590, bakana: 1700,
};

const SUKUNA_HOLD_MAX = 8000;

// Lama tampil efek: max(hold dasar, 1 putaran GIF), di-clamp <=8s.
export const sukunaGifHoldMs = (src, baseHoldMs = 0) => {
  const base = (Number.isFinite(baseHoldMs) && baseHoldMs > 0) ? Math.round(baseHoldMs) : 0;
  const gifMs = (src && Number.isFinite(SUKUNA_GIF_MS[src])) ? SUKUNA_GIF_MS[src] : 0;
  return Math.min(SUKUNA_HOLD_MAX, Math.max(base, gifMs));
};

// Lama efek jawaban Sukuna: max(hold dasar, klip suara + 400ms, 1 putaran GIF).
// Pelajaran Gojo/Yuji: efek selesai sebelum suara = "kecepetan" → klip menang.
export const sukunaAnswerHoldMs = (technique, gifSrc, clipMs = 0, baseHoldMs = 0) => {
  const measured = Number.isFinite(SUKUNA_CLIP_MS[technique]) ? SUKUNA_CLIP_MS[technique] : 0;
  const clip = (Number.isFinite(clipMs) && clipMs > 0) ? clipMs : measured;
  const want = Math.max(baseHoldMs || 0, clip > 0 ? clip + 400 : 0);
  return sukunaGifHoldMs(gifSrc, want);
};

// Semua path GIF (flat, unik) → preload/predecode.
export const sukunaGifPaths = () => {
  const out = [];
  for (const list of Object.values(SUKUNA_GIFS)) {
    if (Array.isArray(list)) for (const p of list) if (p && !out.includes(p)) out.push(p);
  }
  return out;
};

// Preload + DECODE semua GIF Sukuna. Aman dipanggil berulang. Loader injectable (tes).
let gifPreloaded = false;
export const preloadSukunaGifs = (loader) => {
  const paths = sukunaGifPaths();
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
