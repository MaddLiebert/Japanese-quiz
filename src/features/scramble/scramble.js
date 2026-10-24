// ─────────────────────────────────────────────────────────────────────────────
// Susun Balok Duolingo-style — logika murni, tanpa React & tanpa import JSON.
// Dataset dikirim sebagai PARAMETER (aturan repo: modul `node --test` dilarang
// import src/data/*.json — loader node ESM menolak bare JSON import).
// ─────────────────────────────────────────────────────────────────────────────
// Soal SELALU susun balok JEPANG, prompt = arti (Indo/Inggris sesuai bahasa).
// Tampilan balok berdasar difficulty:
//   easy   → hiragana penuh (token apa adanya)
//   medium→ furigana (kanji + kana kecil di atas)
//   hard   → kanji half (kata bermakna → kanji, partikel → hiragana, tanpa furigana)
export const MODE_JP = 'jp';
export const MODE_EASY = 'easy', MODE_FURI = 'furi', MODE_HARD = 'hard';

export function shuffleTokens(list, rng = Math.random) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── Kolam balok: token jawaban + pengecoh, tiap balok key unik ──────────────
export function buildPool(answerBlocks, distractors = [], rng = Math.random) {
  const answer = answerBlocks.map((b, i) => ({ ...b, text: b.text ?? b.t ?? b.display, key: `a${i}`, isDistractor: false }));
  const extras = (distractors || []).map((text, i) => ({ key: `d${i}`, text, kanji: null, isDistractor: true }));
  const pool = shuffleTokens([...answer, ...extras], rng);
  return { answer, pool, answerKeys: answer.map((b) => b.key) };
}

// ── Cek urutan: deret key yang dipasang harus PERSIS sama dengan kunci jawaban ─
export function isCorrectOrder(placedKeys, answerKeys) {
  if (!Array.isArray(placedKeys) || !Array.isArray(answerKeys)) return false;
  if (placedKeys.length !== answerKeys.length) return false;
  return placedKeys.every((k, i) => k === answerKeys[i]);
}

// ── Normalisasi teks untuk perbandingan yang toleran (spasi/tanda baca) ─────
export function normalizeSentence(s) {
  return String(s || '').replace(/[。、！？!?.,]/g, '').replace(/\s+/g, '').trim();
}

// ── Pilih soal dari bank: acak, tanpa duplikat, hormati kategori ────────────
export function pickScrambleItems(items, { categories = null, count = 10, rng = Math.random } = {}) {
  const source = Array.isArray(items) ? items : [];
  const filtered = categories && categories.length > 0
    ? source.filter((it) => categories.includes(it.category))
    : source;
  return shuffleTokens(filtered, rng).slice(0, Math.max(0, count));
}

// ── Builder soal: satu item bank → satu soal siap tampil ────────────────────
// Prompt = arti bahasa user; balok = token JEPANG (modus jp selalu).
// Tampilan balok mengikuti difficulty:
//   easy   → token apa adanya (hiragana).
//   medium → furigana: token yang punya kanji ditampilkan kanji + kana kecil.
//   hard   → half kanji: token bermakna jadi kanji, partikel tetap hiragana.
export function buildScrambleQuestion(item, { language = 'id', difficulty = 'easy', rng = Math.random } = {}) {
  if (!item) return null;
  const lang = language === 'en' ? 'en' : 'id';
  const jp = item.langs?.jp;
  const target = item.langs?.[lang] || jp;
  if (!jp || !target) return null;

  const isHard = difficulty === 'hard';
  const isFuri = difficulty === 'medium';

  const displayToken = (b, isHard, isFuri) => {
    if (isHard && b.kanji) return b.kanji;        // half kanji
    if (isFuri && b.kanji) return b.kanji;        // furigana: kanji di blok, kana kecil via CSS
    return b.t;                                    // easy: hiragana
  };

  const answerBlocks = jp.blocks.map((b) => ({ ...b, display: displayToken(b, isHard, isFuri), raw: b.t }));
  const { answer, pool, answerKeys } = buildPool(answerBlocks, [], rng);
  return {
    id: `${item.id}__jp_${lang}_${difficulty}`,
    sourceId: item.id,
    grammarId: item.grammarId,
    category: item.category,
    mode: MODE_JP,
    language: lang,
    difficulty,
    prompt: target.display,
    promptRomaji: jp.romaji,
    promptLabel: lang,
    answerKeys,
    answerTokens: answer.map((b) => b.display),
    displayText: jp.display,
    romaji: jp.romaji,
    blocks: pool.map((b) => ({ ...b, text: b.display ?? b.t, kana: b.t, kanji: b.kanji ?? null })),
    furigana: jp.blocks.map((b) => ({ kanji: b.kanji || b.t, kana: b.t })),
  };
}

// ── Builder sesi: pilih item, semua soal mode jp (tingkatkan difficulty) ────
export function buildScrambleSession(items, {
  language = 'id', count = 10, categories = null, difficulty = 'easy', rng = Math.random,
} = {}) {
  const picked = pickScrambleItems(items, { categories, count, rng });
  return picked.map((item) =>
    buildScrambleQuestion(item, { language, difficulty, rng }),
  ).filter(Boolean);
}
