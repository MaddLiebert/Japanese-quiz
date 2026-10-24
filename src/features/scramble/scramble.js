// ─────────────────────────────────────────────────────────────────────────────
// Susun Balok (sentence scramble) — logika murni, tanpa React & tanpa import JSON.
// Dataset dikirim sebagai PARAMETER (aturan repo: modul `node --test` dilarang
// import src/data/*.json — loader node ESM menolak bare JSON import).
// ─────────────────────────────────────────────────────────────────────────────

// Dua mode soal (dipilih acak per soal — "bisa dua-duanya"):
//   'jp' → susun balok JEPANG, soal = arti (Indo/Inggris sesuai bahasa aktif)
//   'tr' → susun balok TERJEMAHAN, soal = kalimat Jepang (+ romaji)
export const MODE_JP = 'jp';
export const MODE_TR = 'tr';

// ── Acak deterministik (Fisher–Yates, rng bisa disuntik di test) ────────────
export function shuffleTokens(list, rng = Math.random) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── Bangun kolam balok: token jawaban + pengecoh, tiap balok punya key unik ──
// Balok kembar (mis. partikel に dua kali) tetap sah — key membedakannya.
export function buildPool(answerTokens, distractors = [], rng = Math.random) {
  const answer = answerTokens.map((text, i) => ({ key: `a${i}`, text, isDistractor: false }));
  const extras = (distractors || []).map((text, i) => ({ key: `d${i}`, text, isDistractor: true }));
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
  return String(s || '')
    .replace(/[。、！？!?.,]/g, '')
    .replace(/\s+/g, '')
    .trim();
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
// language: 'id' | 'en' — menentukan bahasa prompt/balok pada mode 'tr'.
export function buildScrambleQuestion(item, { language = 'id', mode = MODE_JP, rng = Math.random } = {}) {
  if (!item) return null;
  const lang = language === 'en' ? 'en' : 'id';
  const jp = item.langs?.jp;
  const target = item.langs?.[lang] || jp;
  if (!jp || !target) return null;

  if (mode === MODE_TR) {
    const { answer, pool, answerKeys } = buildPool(
      target.tokens,
      item.distractors?.[lang] || [],
      rng,
    );
    return {
      id: `${item.id}__tr_${lang}`,
      sourceId: item.id,
      grammarId: item.grammarId,
      category: item.category,
      mode: MODE_TR,
      language: lang,
      prompt: jp.display,
      promptRomaji: jp.romaji,
      promptLabel: 'jp',
      answerKeys,
      answerTokens: answer.map((b) => b.text),
      blocks: pool,
      display: target.display,
      romaji: jp.romaji,
    };
  }

  const { answer, pool, answerKeys } = buildPool(
    jp.tokens,
    item.distractors?.jp || [],
    rng,
  );
  return {
    id: `${item.id}__jp_${lang}`,
    sourceId: item.id,
    grammarId: item.grammarId,
    category: item.category,
    mode: MODE_JP,
    language: lang,
    prompt: target.display,
    promptRomaji: null,
    promptLabel: lang,
    answerKeys,
    answerTokens: answer.map((b) => b.text),
    blocks: pool,
    display: jp.display,
    romaji: jp.romaji,
  };
}

// ── Builder sesi: pilih item lalu campur mode 'jp' & 'tr' ───────────────────
// Separuh soal susun balok Jepang, separuh susun terjemahan — urutannya diacak
// supaya dua-duanya muncul tapi tidak berpola.
export function buildScrambleSession(items, {
  language = 'id', count = 10, categories = null, rng = Math.random, mix = true,
} = {}) {
  const picked = pickScrambleItems(items, { categories, count, rng });
  let modes;
  if (mix) {
    modes = picked.map((_, i) => (i % 2 === 0 ? MODE_JP : MODE_TR));
    modes = shuffleTokens(modes, rng);
  } else {
    modes = picked.map(() => MODE_JP);
  }
  return picked.map((item, i) =>
    buildScrambleQuestion(item, { language, mode: modes[i], rng }),
  ).filter(Boolean);
}

