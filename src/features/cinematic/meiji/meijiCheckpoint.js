// ─────────────────────────────────────────────────────────────────────────────
// meijiCheckpoint.js — 国会: ujian gerbang parlemen (naik era).
//
// Perhentian terakhir peta Meiji (meijiStops.js `feature:'checkpoint'`). Fokus
// PRD §7: SINTESIS grammar + reading. LULUS → pemain boleh "naik era" (→ Shōwa).
// Modul MURNI (tanpa React/DOM) → dites via `node --test`.
// Lihat PRD docs/tema/meiji.md §7/§11.
//
// Bank soal = data: tiap soal punya `jp` (pertanyaan), `options`, dan `answer`
// (indeks benar). Ambang lulus & jumlah soal = konstanta.
// ─────────────────────────────────────────────────────────────────────────────

export const MEIJI_CHECKPOINT_PASS = 4;   // minimal benar dari 5 soal
export const MEIJI_CHECKPOINT_SIZE = 5;   // soal yang ditanyakan per percobaan

export const MEIJI_CHECKPOINT_QUESTIONS = [
  {
    id: 'particle-wa',
    jp: '私 ___ 毎朝 新聞を 読みます。（主語の助詞）',
    id_text: '私 ___ 毎朝 新聞を 読みます. (partikel subjek)',
    options: ['は', 'を', 'に', 'で'],
    answer: 0,
  },
  {
    id: 'particle-wo',
    jp: '新聞 ___ 読む。（目的語の助詞）',
    id_text: '新聞 ___ 読む. (partikel objek)',
    options: ['が', 'を', 'と', 'へ'],
    answer: 1,
  },
  {
    id: 'reading-newspaper',
    jp: '「新聞」の意味は？',
    id_text: 'Arti dari 「新聞」 adalah…',
    options: ['surat kabar', 'sekolah', 'kereta', 'lampu'],
    answer: 0,
  },
  {
    id: 'reading-read',
    jp: '「読む」の意味は？',
    id_text: 'Arti dari 「読む」 adalah…',
    options: ['membaca', 'menulis', 'berjalan', 'membeli'],
    answer: 0,
  },
  {
    id: 'money',
    jp: '明治の おかね は？',
    id_text: 'Mata uang zaman Meiji adalah…',
    options: ['円 (en)', '両 (ryō)', '文 (mon)', 'ドル (dollar)'],
    answer: 0,
  },
  {
    id: 'place',
    jp: '「国会」は どんな ところ？',
    id_text: '「国会」 itu tempat apa?',
    options: ['parlemen', 'pasar ikan', 'gunung', 'sekolah'],
    answer: 0,
  },
  {
    id: 'study',
    jp: '「学ぶ」の意味は？',
    id_text: 'Arti dari 「学ぶ」 adalah…',
    options: ['belajar', 'bermain', 'makan', 'tidur'],
    answer: 0,
  },
];

// Soal untuk satu percobaan ujian — deterministik (tanpa acak) agar dites.
// Ambil `size` soal pertama (bank kecil; cukup untuk gerbang).
export const checkpointQuestions = (size = MEIJI_CHECKPOINT_SIZE, bank = MEIJI_CHECKPOINT_QUESTIONS) =>
  bank.slice(0, Math.min(size, bank.length));

// Nilai jawaban: `answers` = array indeks pilihan (boleh ada null = belum dijawab).
// Mengembalikan { correct, total, passed }.
export const gradeCheckpoint = (answers, questions = MEIJI_CHECKPOINT_QUESTIONS, pass = MEIJI_CHECKPOINT_PASS) => {
  const list = Array.isArray(answers) ? answers : [];
  let correct = 0;
  questions.forEach((q, i) => {
    if (list[i] != null && list[i] === q.answer) correct += 1;
  });
  return { correct, total: questions.length, passed: correct >= pass };
};

// Validasi bank soal untuk tes: id unik, ada opsi, `answer` menunjuk opsi sah.
export const validateCheckpoint = (bank = MEIJI_CHECKPOINT_QUESTIONS, pass = MEIJI_CHECKPOINT_PASS) => {
  const errors = [];
  const ids = new Set();
  bank.forEach((q, i) => {
    if (!q.id) errors.push(`soal[${i}] tanpa id`);
    if (ids.has(q.id)) errors.push(`id soal duplikat: ${q.id}`);
    ids.add(q.id);
    if (!q.jp) errors.push(`soal ${q.id} tanpa jp`);
    if (!Array.isArray(q.options) || q.options.length < 2) errors.push(`soal ${q.id} opsi kurang`);
    if (typeof q.answer !== 'number' || q.answer < 0 || q.answer >= (q.options?.length || 0)) {
      errors.push(`soal ${q.id} answer tidak sah`);
    }
  });
  if (pass >= bank.length) errors.push('ambang lulus tidak boleh >= jumlah soal bank');
  return errors;
};
