// ─────────────────────────────────────────────────────────────────────────────
// Builder soal kuis — murni (tanpa React, tanpa import JSON).
// Diekstrak dari useQuizSession supaya bisa dipakai bersama Death Quiz.
// Dataset dikirim sebagai PARAMETER (aturan repo: modul `node --test` dilarang
// import src/data/*.json — loader node ESM menolak bare JSON import).
// ─────────────────────────────────────────────────────────────────────────────

export function shuffle(array, rng = Math.random) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── Smart Distractor Builder ─────────────────────────────────────────────────
// Picks distractors using a 3-tier priority:
//   1. Same row/category inside the user's quiz pool
//   2. Different row/category inside the user's quiz pool
//   3. Global fallback (type-matched, avoids cross-category contamination)
function pickDistractors(item, quizPool, optionCount, datasets) {
  const needed = optionCount - 1;
  const groupKey = (item.type === 'kotoba' || item.type === 'grammar' || item.type === 'kanji')
    ? 'category' : 'row';

  // Tier 1 & 2: dari pool kuis (buang item sendiri; script & type harus sama).
  const poolWithoutSelf = quizPool.filter(d => {
    if (d.id === item.id) return false;
    if (item.script || d.script) {
      return d.script === item.script && d.type === item.type;
    }
    return d.type === item.type;
  });
  const sameGroup  = shuffle(poolWithoutSelf.filter(d => d[groupKey] === item[groupKey]));
  const otherGroup = shuffle(poolWithoutSelf.filter(d => d[groupKey] !== item[groupKey]));

  const picked = [...sameGroup, ...otherGroup].slice(0, needed);

  // Tier 3: pool kekecilan → ambil dari dataset global (masih type-matched).
  if (picked.length < needed) {
    const usedIds = new Set([item.id, ...picked.map(d => d.id)]);
    const isHiragana = item.id?.startsWith('hira_') || item.script === 'hiragana';
    const isKatakana = item.id?.startsWith('kata_') || item.script === 'katakana';
    const targetDataset = isHiragana ? datasets.hiragana
      : isKatakana ? datasets.katakana
      : datasets[item.type] || [];
    const globalPool = targetDataset.filter(d => {
      if (usedIds.has(d.id)) return false;
      // Kana: samakan type (seion/dakuon/…) bila mungkin.
      if (isHiragana || isKatakana) {
        return d.type === item.type;
      }
      return true;
    });
    const extras = shuffle(globalPool).slice(0, needed - picked.length);
    picked.push(...extras);
  }

  return picked;
}

// ── Option formatters (bentuk data opsi sesuai yang dibaca UI) ───────────────
function toOptionShape(d) {
  if (d.type === 'grammar') {
    return { id: d.id, char: d.char, answer: d.answer, type: 'grammar' };
  }
  if (d.type === 'kotoba') {
    return { id: d.id, meaning: d.meaning, meaning_id: d.meaning_id, romaji: d.romaji, type: 'kotoba', isCorrect: false };
  }
  if (d.type === 'kanji') {
    return { id: d.id, meaning: d.meaning, meaning_id: d.meaning_id, onyomi: d.onyomi, kunyomi: d.kunyomi, type: 'kanji', isCorrect: false };
  }
  // kana — pakai apa adanya (UI baca .id/.char/.romaji langsung)
  return d;
}

export function buildOptions(item, quizPool, optionCount, datasets) {
  const distractors = pickDistractors(item, quizPool, optionCount, datasets);

  // Opsi jawaban benar dengan bentuk yang tepat.
  let correctOption;
  if (item.type === 'grammar') {
    correctOption = { id: item.id, char: item.char, answer: item.answer, type: 'grammar' };
  } else if (item.type === 'kotoba') {
    correctOption = { id: item.id, meaning: item.meaning, meaning_id: item.meaning_id, romaji: item.romaji, type: 'kotoba', isCorrect: true };
  } else if (item.type === 'kanji') {
    correctOption = { id: item.id, meaning: item.meaning, meaning_id: item.meaning_id, onyomi: item.onyomi, kunyomi: item.kunyomi, type: 'kanji', isCorrect: true };
  } else {
    correctOption = item; // kana
  }

  const distractorOptions = distractors.map(toOptionShape);
  return shuffle([...distractorOptions, correctOption]);
}
