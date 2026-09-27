// mondaiLabels.js — penamaan mondai JLPT ala "hybrid":
// istilah resmi JLPT ditulis Jepang + romaji, lalu diberi gloss EN/ID.
// Murni (tanpa React/DOM/import JSON) supaya mudah diuji.
//
// Keputusan desain (disetujui user):
//   - Istilah JLPT (mondai/section) → Jepang + romaji + gloss  ← modul ini
//   - Nama fitur app (Death Quiz, N5 Exam, dll) → label EN/ID + kanji subtitle

export const MONDAI_INFO = {
  kanji_reading:       { jp: '漢字読み',      romaji: 'kanji yomi',        id: 'Cara Baca Kanji',        en: 'Kanji Reading' },
  orthography:         { jp: '表記',          romaji: 'hyōki',             id: 'Penulisan',              en: 'Orthography' },
  context_vocab:       { jp: '文脈規定',      romaji: 'bunmyaku kitei',    id: 'Konteks Kalimat',        en: 'Contextual Vocabulary' },
  paraphrase:          { jp: '言い換え類義',  romaji: 'iikae ruigi',       id: 'Sinonim / Parafrase',    en: 'Paraphrase' },
  grammar_form:        { jp: '文の文法1',     romaji: 'bun no bunpō 1',    id: 'Tata Bahasa 1',          en: 'Grammar 1' },
  sentence_composition:{ jp: '文の文法2 ★',   romaji: 'bun no bunpō 2',    id: 'Susun Kalimat ★',        en: 'Sentence Composition ★' },
  text_grammar:        { jp: '文章の文法',    romaji: 'bunshō no bunpō',   id: 'Tata Bahasa Teks',       en: 'Text Grammar' },
  reading_short:       { jp: '内容理解(短文)', romaji: 'naiyō rikai (tanbun)', id: 'Pemahaman (Teks Pendek)', en: 'Reading (Short)' },
  reading_mid:         { jp: '内容理解(中文)', romaji: 'naiyō rikai (chūbun)', id: 'Pemahaman (Teks Menengah)', en: 'Reading (Mid)' },
  info_retrieval:      { jp: '情報検索',      romaji: 'jōhō kensaku',      id: 'Pencarian Informasi',    en: 'Information Retrieval' },
  task_comprehension:  { jp: '課題理解',      romaji: 'kadai rikai',       id: 'Pemahaman Tugas',        en: 'Task Comprehension' },
  key_point:           { jp: 'ポイント理解',  romaji: 'pointo rikai',      id: 'Pemahaman Poin',         en: 'Key Point' },
  verbal_expression:   { jp: '発話表現',      romaji: 'hatsuwa hyōgen',    id: 'Ekspresi Lisan',         en: 'Verbal Expression' },
  quick_response:      { jp: '即時応答',      romaji: 'sokuji ōtō',        id: 'Respons Cepat',          en: 'Quick Response' },
};

// Label utama untuk UI: "漢字読み · kanji yomi" (Jepang + romaji).
export const mondaiLabel = (type) => {
  const m = MONDAI_INFO[type];
  if (!m) return type;
  return `${m.jp} · ${m.romaji}`;
};

// Gloss terjemahan sesuai bahasa UI (untuk subtitle/tooltip).
export const mondaiGloss = (type, language = 'id') => {
  const m = MONDAI_INFO[type];
  if (!m) return '';
  return language === 'en' ? m.en : m.id;
};

// Varian ringkas (hanya Jepang) untuk ruang sempit.
export const mondaiJp = (type) => MONDAI_INFO[type]?.jp || type;
