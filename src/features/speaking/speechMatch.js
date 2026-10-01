// speechMatch.js — pencocokan ucapan Jepang. Murni: tanpa DOM, tanpa React,
// tanpa import JSON. Dipakai fitur Speaking untuk menilai hasil
// SpeechRecognition terhadap target (bacaan kana / permukaan teks).
//
// Hasil ASR Jepang sering berupa KANJI (か → 蚊, て → 手). Sebelum dicocokkan,
// hasil diperluas jadi kandidat bacaan kana lewat kanaReadings.js — kalau tidak,
// skor vs target kana selalu 0 ("Belum pas" walau suara jelas).
import { readingCandidates } from './kanaReadings.js';

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

// Jarak edit Levenshtein — iteratif, memori O(1 baris).
export const levenshtein = (a, b) => {
  const s = String(a || '');
  const t = String(b || '');
  if (s === t) return 0;
  if (s.length === 0) return t.length;
  if (t.length === 0) return s.length;
  let prev = Array.from({ length: t.length + 1 }, (_, i) => i);
  for (let i = 1; i <= s.length; i++) {
    const cur = [i];
    for (let j = 1; j <= t.length; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = cur;
  }
  return prev[t.length];
};

// Kemiripan 0..1 (kedua sisi dinormalisasi lebih dulu).
export const similarity = (a, b) => {
  const x = normalizeJa(a);
  const y = normalizeJa(b);
  if (!x && !y) return 1;
  if (!x || !y) return 0;
  return 1 - levenshtein(x, y) / Math.max(x.length, y.length);
};

// Skor satu ucapan terhadap satu target:
// - sama persis setelah normalisasi → 1
// - target (≥2 huruf) terkandung di ucapan → 0.9 (mis. "おはよう" di "おはようございます")
// - target 1 huruf & ucapan diawali target → 0.9 (mis. "あ" vs "あー")
// - lainnya → similarity biasa
export const scoreUtterance = (heard, target) => {
  const h = normalizeJa(heard);
  const t = normalizeJa(target);
  if (!h || !t) return 0;
  if (h === t) return 1;
  if (t.length >= 2 && h.includes(t)) return 0.9;
  if (t.length === 1 && h.startsWith(t)) return 0.9;
  return similarity(h, t);
};

// Skor terbaik dari beberapa alternatif ucapan × beberapa target.
// heardList: array transcript dari SpeechRecognition; targetList: bacaan + permukaan.
//
// Hasil ASR Jepang sering KANJI (か → 蚊, て → 手), jadi tiap ucapan DIPERLUAS
// jadi kandidat bacaan kana lebih dulu — kalau tidak, skor vs target kana selalu
// 0 → "Belum pas" walau suara jelas & keras.
//
// PENTING: kandidat HASIL PERLUASAN dinilai COCOK-PERSIS saja (bukan fuzzy).
// Ekspansi hanyalah dugaan, jadi jangan sampai leniency (startsWith/includes)
// membuat kanji berbilang bacaan salah lolos (mis. 花 dibaca か padahal はな).
// Teks ASLI tetap dinilai fuzzy seperti sebelumnya.
export const matchSpeech = (heardList, targetList) => {
  const rawHeard = (Array.isArray(heardList) ? heardList : [heardList]).filter(Boolean);
  const targets = (Array.isArray(targetList) ? targetList : [targetList]).filter(Boolean);
  const rawNorm = new Set(rawHeard.map((h) => normalizeJa(h)));
  let best = { score: 0, heard: '', target: '' };
  for (const raw of rawHeard) {
    for (const h of readingCandidates(raw)) {
      const isExpansion = !rawNorm.has(normalizeJa(h));
      for (const t of targets) {
        const score = isExpansion
          ? (normalizeJa(h) === normalizeJa(t) ? 1 : 0)
          : scoreUtterance(h, t);
        if (score > best.score) best = { score, heard: raw, target: t };
      }
    }
  }
  return best;
};

export const verdictOf = (score) => {
  const s = Number(score) || 0;
  if (s >= SPEAK_GREAT) return 'great';
  if (s >= SPEAK_PASS) return 'pass';
  return 'retry';
};

// Bacaan dari item kanji.json: onyomi + kunyomi dipisah '、'.
// Buang placeholder '-', tanda kurung, dan tanda hubung okurigana di tepi.
// "ひと(つ)" → ["ひと", "ひとつ"]; "-び" → ["び"]; "イチ、イツ" → ["イチ","イツ"]
export const readingsFromKanji = (item) => {
  const out = [];
  const push = (raw) => {
    if (!raw) return;
    for (const part of String(raw).split('、')) {
      const pre = part.split(/[（(]/)[0].replace(/^-+|-+$/g, '').trim();
      const full = part.replace(/[（()）]/g, '').replace(/^-+|-+$/g, '').trim();
      if (pre && pre !== '-') out.push(pre);
      if (full && full !== '-' && full !== pre) out.push(full);
    }
  };
  push(item?.onyomi);
  push(item?.kunyomi);
  return [...new Set(out)];
};
