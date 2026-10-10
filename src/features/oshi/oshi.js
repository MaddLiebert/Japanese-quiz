// ─────────────────────────────────────────────────────────────────────────────
// A4 推し (Karakter favorit) — MURNI: tanpa React, tanpa DOM.
// 推し (oshi) = karakter yang pemain dukung/favoritkan. Pilih 1 推し → ia muncul
// di Home & bereaksi khusus tiap event (benar, streak, lulus). Mengikat emosi
// pemain ke koleksi karakter (Lapis 3). Spec: docs/tema/anime-mekanik.md §A4.
//
// 推し HANYA boleh dari karakter yang DIMILIKI (hasil gacha A16) — cek ownership
// dilakukan di UI/state; modul ini murni menyimpan id + reaksi deterministik.
// Beda dari companion Nacht/Saku: 推し = karakter fiksi pilihan pemain.

// Reaksi deterministik per event (bukan acak) → bisa dites.
export const OSHI_REACTIONS = {
  correct:  { jp: 'いいね！',            id_text: 'Bagus!' },
  wrong:    { jp: 'だいじょうぶ。',        id_text: 'Tidak apa-apa.' },
  streak:   { jp: 'すごい！',            id_text: 'Hebat!' },
  graduate: { jp: 'いっしょに、行こう。',  id_text: 'Ayo pergi bersama.' },
};

// Simpan 推し (id karakter). Id kosong/null → bersihkan (oshiId null).
export const setOshi = (state, characterId) => ({ ...(state || {}), oshiId: characterId || null });

// Lepas 推し (mode belajar fokus / toggle off).
export const clearOshi = (state) => ({ ...(state || {}), oshiId: null });

// Ada 推し aktif?
export const hasOshi = (state) => !!state?.oshiId;

// Reaksi untuk 1 event. Event tak dikenal → null (UI tidak pernah crash).
export const oshiReaction = (event) => OSHI_REACTIONS[event] || null;

export default setOshi;
