// Registry GIF Yuji Itadori untuk efek jawaban + takeover (pack_09).
// Aset user di public/effects/ (8 GIF, semua 220px lebar).
export const YUJI_GIFS = {
  keiteiken: ['/effects/keiteiken.gif'],          // 逕庭拳 + 卍蹴り (1 GIF 2 teknik)
  kokusen:   ['/effects/kokusen.gif'],            // 黒閃
  fuga:      ['/effects/fuga.gif'],               // 開 (finisher takeover)
  takeover:  ['/effects/sukuna transform.gif'],   // cinematic cast 宿儺の器
  wrong: [
    '/effects/yuji kuso.gif',
    '/effects/yuji madada.gif',
    '/effects/yuji shimata.gif',
  ],
  zakome: ['/effects/zakome.gif'],                // kalah PAS takeover (Sukuna 雑魚め…)
};

// Pilih satu GIF acak untuk kind. null kalau kind tak dikenal / kosong.
export const pickYujiGif = (kind, rng = Math.random) => {
  const list = YUJI_GIFS[kind];
  if (!Array.isArray(list) || list.length === 0) return null;
  return list[Math.floor(rng() * list.length)];
};

// GIF untuk satu jawaban Yuji:
//   salah + takeover -> zakome · salah biasa -> 3 meme acak
//   benar combo 開 (combo >= 3) -> fuga · keiteiken/manjigeri -> keiteiken
//   kokusen -> kokusen · senketsu -> null (CSS murni, keputusan desain)
export const yujiGifForAnswer = (type, technique = null, takeover = false, combo = 0, rng = Math.random) => {
  if (type === 'wrong') return takeover ? pickYujiGif('zakome', rng) : pickYujiGif('wrong', rng);
  if (type !== 'correct') return null;
  if (takeover && combo >= 3) return pickYujiGif('fuga', rng);
  if (technique === 'keiteiken' || technique === 'manjigeri') return pickYujiGif('keiteiken', rng);
  if (technique === 'kokusen') return pickYujiGif('kokusen', rng);
  return null;
};

export const yujiTakeoverGif = (rng = Math.random) => pickYujiGif('takeover', rng);

// Durasi SATU PUTARAN tiap GIF (ms) — hasil ukur PIL (2026-09-28). JANGAN ditebak.
export const YUJI_GIF_MS = {
  '/effects/keiteiken.gif': 1000,
  '/effects/kokusen.gif': 3600,
  '/effects/fuga.gif': 3900,
  '/effects/sukuna transform.gif': 2300,
  '/effects/yuji kuso.gif': 4100,
  '/effects/yuji madada.gif': 3900,
  '/effects/yuji shimata.gif': 5070,
  '/effects/zakome.gif': 720,
};

// Durasi klip suara terukur (mutagen, 2026-09-28) — fallback saat elemen <audio>
// belum punya metadata (playFile -> 0) supaya efek tidak selesai sebelum suara.
export const YUJI_CLIP_MS = {
  keiteiken: 1306, manjigeri: 1227, kokusen: 1097, senketsu: 1384,
  kai: 705, hachi: 1071, fuga: 1488,
  kuso: 888, madada: 966, shimata: 1410, zakome: 1201,
};

const YUJI_HOLD_MAX = 8000;

// Lama tampil efek: max(hold dasar, 1 putaran GIF), di-clamp <=8s.
export const yujiGifHoldMs = (src, baseHoldMs = 0) => {
  const base = (Number.isFinite(baseHoldMs) && baseHoldMs > 0) ? Math.round(baseHoldMs) : 0;
  const gifMs = (src && Number.isFinite(YUJI_GIF_MS[src])) ? YUJI_GIF_MS[src] : 0;
  return Math.min(YUJI_HOLD_MAX, Math.max(base, gifMs));
};

// Lama efek jawaban Yuji: max(hold dasar, klip suara + 400ms, 1 putaran GIF).
// Pelajaran Gojo: efek selesai sebelum suara = "kecepetan" -> klip selalu menang.
export const yujiAnswerHoldMs = (technique, gifSrc, clipMs = 0, baseHoldMs = 0) => {
  const measured = Number.isFinite(YUJI_CLIP_MS[technique]) ? YUJI_CLIP_MS[technique] : 0;
  const clip = (Number.isFinite(clipMs) && clipMs > 0) ? clipMs : measured;
  const want = Math.max(baseHoldMs || 0, clip > 0 ? clip + 400 : 0);
  return yujiGifHoldMs(gifSrc, want);
};

// Semua path GIF (flat, unik) -> preload/predecode.
export const yujiGifPaths = () => {
  const out = [];
  for (const list of Object.values(YUJI_GIFS)) {
    if (Array.isArray(list)) for (const p of list) if (p && !out.includes(p)) out.push(p);
  }
  return out;
};

// Preload + DECODE semua GIF Yuji. Aman dipanggil berulang. loader injectable (tes).
let gifPreloaded = false;
export const preloadYujiGifs = (loader) => {
  const paths = yujiGifPaths();
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
    } catch { /* preload gagal -> GIF tetap dimuat saat tampil */ }
  }
  return paths.length;
};
