// poemCredits.js — kredit penulis puisi (murni: tanpa DOM/React/import JSON).
// Tahun hidup & romaji TIDAK ada di poems.json → satu sumber kebenaran di sini.
// Kunci = `author` persis seperti di poems.json (guard test menjaga sinkron).
// Sumber tahun hidup: Wikipedia/Wikidata.

export const POET_META = {
  '松尾芭蕉': { romaji: 'Matsuo Bashō', dates: '1644–1694' },
  '小林一茶': { romaji: 'Kobayashi Issa', dates: '1763–1828' },
  '与謝蕪村': { romaji: 'Yosa Buson', dates: '1716–1784' },
  '小野小町': { romaji: 'Ono no Komachi', dates: 'c. 825 – c. 900' },
  '宮沢賢治': { romaji: 'Miyazawa Kenji', dates: '1896–1933' },
  '正岡子規': { romaji: 'Masaoka Shiki', dates: '1867–1902' },
  '島崎藤村': { romaji: 'Shimazaki Tōson', dates: '1872–1943' },
  '中原中也': { romaji: 'Nakahara Chūya', dates: '1907–1937' },
  '高村光太郎': { romaji: 'Takamura Kōtarō', dates: '1883–1956' },
};

// Meta penyair; null kalau tak dikenal.
export const poetCredit = (author) => POET_META[author] || null;

// Kredit lengkap sebuah puisi. Field tak dikenal → '' (bukan undefined),
// supaya aman dirender langsung di JSX.
export const poemCredit = (poem) => {
  const meta = poetCredit(poem?.author);
  return {
    author: poem?.author || '',
    authorReading: poem?.authorReading || '',
    romaji: meta?.romaji || '',
    dates: meta?.dates || '',
    source: poem?.source || '',
  };
};

// Satu baris kredit siap-render: "松尾芭蕉（まつおばしょう） · Matsuo Bashō · 1644–1694".
export const creditLine = (poem) => {
  const c = poemCredit(poem);
  return [c.author + (c.authorReading ? `（${c.authorReading}）` : ''), c.romaji, c.dates]
    .filter(Boolean)
    .join(' · ');
};
