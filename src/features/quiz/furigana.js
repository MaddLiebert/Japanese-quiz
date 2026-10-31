// ─────────────────────────────────────────────────────────────────────────────
// Furigana untuk kartu kotoba: bentuk kanji + bacaan kana → markup ruby.
//
// Format keluaran sama dengan yang dibaca <Furigana> (components/Furigana.jsx):
//   "食[た]べる"  → 食(た)べる   — bacaan hanya di atas bagian KANJI-nya.
//
// Aturan penempatan bacaan:
//   - Okurigana (kana di bentuk kanji) jadi jangkar, dicocokkan DARI BELAKANG:
//     痛い (いたい) → 痛[いた]い, bukan gagal karena "い" muncul di awal bacaan.
//   - Kata yang SEMUA kanji (教室, 大人, 一月) memakai ruby satu blok, karena
//     bacaan per-kanji tidak bisa ditebak dari data ini (大人 = おとな, bukan
//     おと+な). Ini juga gaya furigana buku pelajaran.
//   - Kana pada bentuk kanji boleh katakana (消しゴム, バス停): perbandingan
//     dilakukan dalam hiragana, teks yang ditampilkan tetap aslinya.
//   - Kalau bacaan tidak sinkron dengan bentuk kanji, kembalikan null →
//     pemanggil menampilkan teks apa adanya (jangan menebak, jangan salah ajar).
// ─────────────────────────────────────────────────────────────────────────────

const KANJI = /[\u4e00-\u9faf\u3400-\u4dbf\uf900-\ufaff々〆]/;

const toHira = (s) => [...String(s)].map((ch) => {
  const c = ch.codePointAt(0);
  if (c >= 0x30a1 && c <= 0x30f6) return String.fromCodePoint(c - 0x60);
  return ch;
}).join('');

export function hasKanji(text) {
  return KANJI.test(String(text || ''));
}

// Pecah "食べる" → [{ text:'食', kanji:true }, { text:'べる', kanji:false }]
function toRuns(text) {
  const runs = [];
  let buf = '';
  let bufKanji = null;
  for (const ch of String(text)) {
    const isKanji = KANJI.test(ch);
    if (buf && isKanji !== bufKanji) {
      runs.push({ text: buf, kanji: bufKanji });
      buf = '';
    }
    bufKanji = isKanji;
    buf += ch;
  }
  if (buf) runs.push({ text: buf, kanji: bufKanji });
  return runs;
}

export function toFurigana(form, reading) {
  const f = String(form || '');
  const r = String(reading || '');
  if (!f || !r) return null;
  if (!hasKanji(f)) return null;      // tidak ada kanji → tak perlu ruby
  if (hasKanji(r)) return null;       // bacaan wajib kana

  const runs = toRuns(f);
  const rh = toHira(r);               // panjang sama: konversi 1 karakter → 1

  // Cocokkan run dengan bacaan: kana harus persis, blok kanji boleh 1+ karakter.
  // Blok kanji diambil SEBANYAK MUNGKIN (backtracking), karena okurigana selalu
  // di ekor: 男の子 → 男[おとこ]の子[こ] (bukan 男[おと]の子[この]),
  // 痛い → 痛[いた]い (bukan gagal karena "い" muncul di awal bacaan).
  const failed = new Set();
  const walk = (i, pos) => {
    if (i === runs.length) return pos === r.length ? [] : null;
    const key = `${i}:${pos}`;
    if (failed.has(key)) return null;

    const run = runs[i];
    if (!run.kanji) {
      if (rh.slice(pos, pos + run.text.length) !== toHira(run.text)) {
        failed.add(key);
        return null;
      }
      const rest = walk(i + 1, pos + run.text.length);
      if (rest) return [{ text: run.text, kanji: false }, ...rest];
      failed.add(key);
      return null;
    }

    // Sisa minimal harus cukup untuk run-run berikutnya (heuristik cepat).
    const minRest = runs.slice(i + 1).reduce((n, x) => n + (x.kanji ? 1 : x.text.length), 0);
    for (let len = r.length - pos - minRest; len >= 1; len--) {
      const rest = walk(i + 1, pos + len);
      if (rest) return [{ text: run.text, kanji: true, reading: r.slice(pos, pos + len) }, ...rest];
    }
    failed.add(key);
    return null;
  };

  const parts = walk(0, 0);
  if (!parts) return null;

  return parts.map((p) => (p.kanji ? `${p.text}[${p.reading}]` : p.text)).join('');
}
