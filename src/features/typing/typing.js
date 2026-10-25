// Logika murni fitur Ketik (Typing) — tanpa DOM/React, TANPA import JSON.
// Data dilewatkan sebagai parameter (pola writing.js: aman di node --test
// DAN vite). Tiga fungsi penting: normalize, checkAnswer, buildPrompts.
// ─────────────────────────────────────────────────────────────────────────────

// Kanji TIDAK punya field `romaji` → ikut mode jepang (ketik bacaan kana), jangan
// alfabet. Sisa: hiragana/katakana/kotoba (romaji utk alfabet; char utk jepang).
export const typingKind = (item) =>
  item?.type === 'kanji' ? 'kanji' : item?.type === 'kotoba' ? 'kotoba' : 'kana';

// ── Normalisasi input sebelum dibandingkan ──────────────────────────────────
// Jepang (kana): NFKC → satukan bentuk (full-width ↔ half-width IME). Item
// kotoba bertanda `/` ('ふん / ぷん') = terima salah satu.
// Alfabet (romaji): lowercase → strip spasi (26 item romaji pakai spasi, cth
// 'otoko no hito') → NFKC.
export const normText = (s) =>
  String(s || '').normalize('NFKC').replace(/\s+/g, '').toLowerCase();
export const normKana = (s) => String(s || '').normalize('NFKC').replace(/\s+/g, '');

// Jawaban kanji: bacaan dari onyomi/kunyomi → list (pacah `、` & kurung isi).
export const kanjiReadings = (item) => {
  if (!item) return [];
  return [
    ...String(item.onyomi || '').split(/[、,/]/),
    ...String(item.kunyomi || '').split(/[、,/]/),
  ]
    .map((r) => r.replace(/[()（）].*$/, '').trim())
    .filter(Boolean);
};

// Jenis sumber `recordAnswer` → masuk SIDE_SOURCES quest (writing/speaking).
export const typingKindSource = (mode) => (mode === 'jepang' ? 'typing_jp' : 'typing'); // ponytail: gabung ke SIDE_SOURCES kalau quest implisit

// Cek jawaban. mode: 'alfabet' | 'jepang'. item: objek data (hiragana/katakana/
// kotoba/kanji).
export function checkAnswer(item, input, mode) {
  const typed = mode === 'jepang' ? normKana(input) : normText(input);
  if (!item || typed.length === 0) return false;
  if (mode === 'jepang') {
    const kind = typingKind(item);
    if (kind === 'kanji') return kanjiReadings(item).some((r) => normKana(r) === typed);
    // kana & kotoba: char asli; kotoba bertanda '/' → terima salah satu.
    const alts = String(item.char || '').split('/');
    return alts.some((a) => normKana(a) === typed);
  }
  // alfabet: romaji (strip spasi sudah dinormalisasi di normText).
  const alts = String(item.romaji || item.char || '').split('/');
  return alts.some((a) => normText(a) === typed);
}

// Baris soal. kind → pasangan prompt & jawaban untuk 2 arah soal:
//   read  (lihat Jepang → ketik)  vs  write (lihat arti/romaji → ketik Jepang)
// Kembalikan soal { prompt, answer } sesuai arah. `language` 'id'/'en' → pilih
// kolom arti yang tampil sebagai prompt/jawaban alfabet untuk kotoba.
export const buildTypingQuestion = (item, direction, language = 'en', mode = 'alfabet') => {
  const kind = typingKind(item);
  const idLang = language === 'id';

  if (direction === 'read') {
    // Lihat bentuk Jepang → ketik. Alfabet: romaji (kana & kotoba). Jepang:
    // kana → char-nya sendiri (latihan IME); kotoba → char; kanji → bacaan kana.
    let answer;
    if (kind === 'kana') answer = item.romaji || '';
    else if (kind === 'kotoba') {
      answer = mode === 'jepang' ? (item.char || '') : (item.romaji || '');
    } else answer = kanjiReadings(item)[0] || '';
    return { prompt: item.char || '', answer, kind, direction };
  }

  // direction 'write' → lihat arti/bacaan → ketik bentuk Jepang.
  // prompt = arti (kotoba/kanji) atau romaji (kana);
  // answer = char Jepang (semua mode — alfabet&jepang dua-duanya ketik Jepang).
  let prompt;
  if (kind === 'kana') {
    prompt = item.romaji || '';
  } else {
    prompt = idLang ? (item.meaning_id || item.meaning) : item.meaning;
  }
  return { prompt, answer: item.char || '', kind, direction };
};

// Besar teks prompt sesuai panjang (biar nggak 2 baris di layar sempit).
export const promptTextSize = (s = '') => {
  const n = [...s].length;
  if (n <= 1) return 'text-[120px]';
  if (n <= 2) return 'text-[96px]';
  if (n <= 4) return 'text-[72px]';
  if (n <= 8) return 'text-[44px]';
  return 'text-[32px]';
};
