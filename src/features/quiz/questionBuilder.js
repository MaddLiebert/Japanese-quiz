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

// ── Helper tanda tangan tampilan (cegah opsi kembar / duplikat teks) ────────
// Opsi tidak boleh menampilkan teks yang sama dengan opsi lain di layar.
function getDisplaySignatures(item) {
  if (!item) return [];
  const sigs = [];
  if (item.type === 'grammar') {
    if (item.char) sigs.push(`g_char:${item.char.trim()}`);
    if (item.answer) sigs.push(`g_ans:${item.answer.trim().toLowerCase()}`);
  } else if (item.type === 'kotoba' || item.type === 'kanji') {
    if (item.meaning) sigs.push(`mean_en:${item.meaning.trim().toLowerCase()}`);
    if (item.meaning_id) sigs.push(`mean_id:${item.meaning_id.trim().toLowerCase()}`);
  } else {
    // kana
    if (item.romaji) sigs.push(`romaji:${item.romaji.trim().toLowerCase()}`);
    if (item.char) sigs.push(`char:${item.char.trim()}`);
  }
  return sigs;
}

function hasDisplayCollision(candidate, existingItems) {
  const candidateSigs = getDisplaySignatures(candidate);
  if (candidateSigs.length === 0) return false;
  for (const item of existingItems) {
    const itemSigs = getDisplaySignatures(item);
    for (const sig of candidateSigs) {
      if (itemSigs.includes(sig)) return true;
    }
  }
  return false;
}

// ── Smart Distractor Builder ─────────────────────────────────────────────────
// Picks distractors using a 3-tier priority:
//   1. Same row/category inside the user's quiz pool
//   2. Different row/category inside the user's quiz pool
//   3. Global fallback (type-matched, avoids cross-category contamination)
// Menjamin tidak ada distraktor yang punya teks/arti kembar dengan jawaban benar
// atau distraktor lain yang sudah terpilih.
function pickDistractors(item, quizPool, optionCount, datasets, rng = Math.random) {
  const needed = optionCount - 1;
  const groupKey = (item.type === 'kotoba' || item.type === 'grammar' || item.type === 'kanji')
    ? 'category' : 'row';

  // Tier 1 & 2: dari pool kuis (buang item sendiri & opsi yang teksnya kembar).
  const poolWithoutSelf = quizPool.filter(d => {
    if (d.id === item.id) return false;
    if (item.script || d.script) {
      return d.script === item.script && d.type === item.type;
    }
    return d.type === item.type;
  });
  const sameGroup  = shuffle(poolWithoutSelf.filter(d => d[groupKey] === item[groupKey]), rng);
  const otherGroup = shuffle(poolWithoutSelf.filter(d => d[groupKey] !== item[groupKey]), rng);

  const candidates = [...sameGroup, ...otherGroup];
  const picked = [];
  const chosen = [item];

  for (const cand of candidates) {
    if (picked.length >= needed) break;
    if (chosen.some(c => c.id === cand.id)) continue;
    if (hasDisplayCollision(cand, chosen)) continue;
    picked.push(cand);
    chosen.push(cand);
  }

  // Tier 3: pool kekecilan → ambil dari dataset global (masih type-matched & bebas kembar).
  if (picked.length < needed) {
    const isHiragana = item.id?.startsWith('hira_') || item.script === 'hiragana';
    const isKatakana = item.id?.startsWith('kata_') || item.script === 'katakana';
    const targetDataset = isHiragana ? datasets.hiragana
      : isKatakana ? datasets.katakana
      : datasets[item.type] || [];
    const globalPool = targetDataset.filter(d => {
      if (chosen.some(c => c.id === d.id)) return false;
      // Kana: samakan type (seion/dakuon/…) bila mungkin.
      if (isHiragana || isKatakana) {
        return d.type === item.type;
      }
      return true;
    });

    for (const cand of shuffle(globalPool, rng)) {
      if (picked.length >= needed) break;
      if (chosen.some(c => c.id === cand.id)) continue;
      if (hasDisplayCollision(cand, chosen)) continue;
      picked.push(cand);
      chosen.push(cand);
    }

    // Jika dataset unik sangat sedikit dan masih kurang, fallback isi sisa tanpa crash
    if (picked.length < needed) {
      for (const cand of shuffle(globalPool, rng)) {
        if (picked.length >= needed) break;
        if (chosen.some(c => c.id === cand.id)) continue;
        picked.push(cand);
        chosen.push(cand);
      }
    }
  }

  return picked;
}

// ── Kotoba mode SULIT: soal KANJI → jawaban HIRAGANA ────────────────────────
// Tujuan latihan: satu soal menguji dua hal sekaligus — mengenali kanji DAN
// mengingat bacaan kotoba-nya. Karena opsi ditampilkan sebagai kana, dua kata
// berbeda yang berbunyi sama (箸/橋 = はし) TIDAK boleh muncul sebagai dua opsi:
// di layar keduanya tampak identik. Karena itu distraktor disaring per teks kana.
// `fallbackPool` (opsional): cadangan distraktor saat kategori terlalu kecil.
export function buildKotobaReadingOptions(item, quizPool, optionCount, rng = Math.random, fallbackPool = []) {
  const needed = Math.max(1, optionCount - 1);
  const readingOf = (d) => String(d?.reading || d?.char || '');
  const seen = new Set([readingOf(item)]);
  const picked = [];

  const candidates = quizPool.filter((d) => d.id !== item.id && d.type === 'kotoba');
  const sameGroup = shuffle(candidates.filter((d) => d.category === item.category), rng);
  const otherGroup = shuffle(candidates.filter((d) => d.category !== item.category), rng);

  for (const cand of [...sameGroup, ...otherGroup]) {
    if (picked.length >= needed) break;
    const reading = readingOf(cand);
    if (!reading || seen.has(reading)) continue;
    seen.add(reading);
    picked.push(cand);
  }

  // Kategori kecil (Angka = 2 kata) → lengkapi dari seluruh kotoba.
  if (picked.length < needed && fallbackPool.length) {
    for (const cand of shuffle(fallbackPool, rng)) {
      if (picked.length >= needed) break;
      if (cand.id === item.id) continue;
      const reading = readingOf(cand);
      if (!reading || seen.has(reading)) continue;
      seen.add(reading);
      picked.push(cand);
    }
  }

  const correct = {
    id: item.id,
    char: item.char,
    reading: readingOf(item),
    romaji: item.romaji,
    meaning: item.meaning,
    meaning_id: item.meaning_id,
    type: 'kotoba',
    isCorrect: true,
  };
  const distractors = picked.map((d) => ({
    id: d.id,
    char: d.char,
    reading: readingOf(d),
    romaji: d.romaji,
    meaning: d.meaning,
    meaning_id: d.meaning_id,
    type: 'kotoba',
    isCorrect: false,
  }));

  return shuffle([...distractors, correct], rng);
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

export function buildOptions(item, quizPool, optionCount, datasets, rng = Math.random) {
  const distractors = pickDistractors(item, quizPool, optionCount, datasets, rng);

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
  return shuffle([...distractorOptions, correctOption], rng);
}
