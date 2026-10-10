// ─────────────────────────────────────────────────────────────────────────────
// 白紙の頁 — copy "kanvas kosong" 多元 (PRD docs/tema/anime.md §12 R2).
//
// Saat pemain membuka 多元 (Lv 150) tapi BELUM membeli satu pun dunia
// (franchise), kanvas memang KOSONG — dan itu SENGAJA, bukan era yang lupa
// didesain. Ornamen (panel 題字 + balon kosong 「（　）」) sudah membuktikannya;
// copy 「この頁は、まだ白い。」 melengkapinya + mengundang ke 物販.
//   R2: "「Kanvas kosong」 terasa seperti era yang lupa didesain" →
//       "Ornamen + 題字 + balon kosong = bukti kesengajaan. Plus copy
//        「この頁は、まだ白い。」 di hero saat kosong".
//
// Modul MURNI (tanpa React/DOM) → dites `node --test`.
// ─────────────────────────────────────────────────────────────────────────────

// Baris kanonik (Jepang) — dari PRD §R2, jangan diubah tanpa ubah dokumen.
export const CANVAS_EMPTY_JP = 'この頁は、まだ白い。';

// Terjemahan. Konvensi app: BASE = Indonesia, kembar Inggris = `en`.
export const CANVAS_EMPTY_TEXT = {
  id: 'Halaman ini masih putih.',
  en: 'This page is still blank.',
};

// Kanvas 多元 masih kosong? = belum punya dunia (franchise) sama sekali.
// Aman dipanggil dengan progress null/undefined (pra-load).
export const isCanvasEmpty = (progress) =>
  ((progress && progress.ownedFranchises) || []).length === 0;

// Copy lengkap untuk UI: { jp, text } — `text` mengikuti bahasa UI (default ID).
export const canvasEmptyCopy = (lang = 'id') => ({
  jp: CANVAS_EMPTY_JP,
  text: lang === 'en' ? CANVAS_EMPTY_TEXT.en : CANVAS_EMPTY_TEXT.id,
});
