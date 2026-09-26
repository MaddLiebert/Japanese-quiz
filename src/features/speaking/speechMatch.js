// speechMatch.js — pencocokan ucapan Jepang. Murni: tanpa DOM, tanpa React,
// tanpa import JSON. Dipakai fitur Speaking untuk menilai hasil
// SpeechRecognition terhadap target (bacaan kana / permukaan teks).

export const SPEAK_PASS = 0.7;   // similarity minimal dianggap lulus
export const SPEAK_GREAT = 0.9;  // skor "hampir sempurna"

const KANJI_RE = /[\u4e00-\u9faf\u3400-\u4dbf]/;

export const hasKanji = (text) => KANJI_RE.test(String(text || ''));

// Katakana → hiragana (geser 0x60). Karakter lain dibiarkan apa adanya.
export const toHiragana = (text) => {
  if (!text) return '';
  return [...String(text)]
    .map((ch) => {
      const code = ch.codePointAt(0);
      if (code >= 0x30a1 && code <= 0x30f6) return String.fromCodePoint(code - 0x60);
      return ch;
    })
    .join('');
};

// Normalisasi untuk perbandingan: katakana→hiragana, buang spasi & tanda baca.
// 'ー' (chōonpu) DIPERTAHANKAN karena bagian dari bacaan (コーヒー → こーひー).
export const normalizeJa = (text) => {
  if (!text) return '';
  return toHiragana(text)
    .replace(/[\s\u3000]/g, '')
    .replace(/[。、，．！？!?.,「」『』（）()・…~〜：:；;]/g, '');
};
