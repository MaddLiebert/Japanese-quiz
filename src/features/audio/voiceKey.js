// ─────────────────────────────────────────────────────────────────────────────
// voiceKey — tentukan voice mana yang BUNYI saat jawaban (murni, tanpa React).
//
// Dua sumber voice di app ini:
//   1. Theme Pack  (progress.activePack → pack.voice)      — semua era
//   2. 推し karakter 多元 (progress.oshiId → characterVoice) — HANYA era 多元
//
// BUG YANG DIPERBAIKI: karakter 多元 (A16) punya klip voice sendiri, tapi
// VoiceSync hanya membaca pack.voice → klip karakter 45 file itu TIDAK PERNAH
// diputar (registry ≠ wired). Fungsi ini jadi satu sumber kebenaran urutannya:
// di era 多元 dengan 推し terpilih, karakter 推し yang bersuara (inti A4);
// selain itu jatuh ke voice pack. Karakter TIDAK boleh bocor ke era lain.
// Spec: docs/tema/anime-mekanik.md §A4 (推し) & §A16 (必殺技).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {object}   o
 * @param {string}   o.era               era aktif ('anime', 'heian', …)
 * @param {string}   o.oshiId            id karakter 推し (null bila tak ada)
 * @param {string}   o.packVoice         key voice Theme Pack aktif (null bila tak ada)
 * @param {Function} o.voiceOfCharacter  id → key voice karakter (mis. characterVoice)
 * @returns {string|null} key voice yang dipakai setActiveVoice()
 */
export const resolveVoiceKey = ({ era, oshiId, packVoice, voiceOfCharacter } = {}) => {
  // 推し hanya menang di era 多元 — era lain tetap pakai voice pack (tidak bocor).
  if (era === 'anime' && oshiId && typeof voiceOfCharacter === 'function') {
    const cv = voiceOfCharacter(oshiId);
    if (cv) return cv;
  }
  return packVoice || null;
};

export default resolveVoiceKey;
