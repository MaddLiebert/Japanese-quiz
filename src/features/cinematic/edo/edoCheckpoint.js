// ─────────────────────────────────────────────────────────────────────────────
// edoCheckpoint.js — 箱根関所: ujian penjaga gerbang (naik era).
//
// Perhentian terakhir peta Edo (edoStops.js `feature:'checkpoint'`). Penjaga
// 関所 bertanya; LULUS → pemain boleh "keluar Edo". Modul MURNI (tanpa
// React/DOM) → dites via `node --test`. Lihat PRD docs/tema/edo.md §7/§9.
//
// Bank soal = data: tiap soal punya `jp` (pertanyaan), `options` (romaji), dan
// `answer` (indeks benar). Ambang lulus & jumlah soal = konstanta.
// ─────────────────────────────────────────────────────────────────────────────

export const EDO_CHECKPOINT_PASS = 3;   // minimal benar dari 4 soal
export const EDO_CHECKPOINT_SIZE = 4;   // soal yang ditanyakan per percobaan

export const EDO_CHECKPOINT_QUESTIONS = [
  {
    id: 'greeting',
    jp: '「おはようございます」の意味は？',
    id_text: 'Arti dari 「おはようございます」 adalah…',
    options: ['selamat pagi', 'selamat malam', 'terima kasih', 'permisi'],
    answer: 0,
  },
  {
    id: 'number',
    jp: '「三」はいくつ？',
    id_text: '「三」 itu angka berapa?',
    options: ['dua', 'tiga', 'empat', 'lima'],
    answer: 1,
  },
  {
    id: 'money',
    jp: '江戸の おかね は？',
    id_text: 'Mata uang zaman Edo adalah…',
    options: ['両 (ryō)', '文 (mon)', '円 (en)', 'ドル (dollar)'],
    answer: 0,
  },
  {
    id: 'place',
    jp: '「日本橋」は どこ？',
    id_text: '「日本橋」 adalah…',
    options: ['jembatan pusat Edo', 'gunung tertinggi', 'kota di Kyushu', 'danau besar'],
    answer: 0,
  },
  {
    id: 'travel',
    jp: '「旅」の意味は？',
    id_text: 'Arti dari 「旅」 adalah…',
    options: ['perjalanan', 'pekerjaan', 'makanan', 'rumah'],
    answer: 0,
  },
  {
    id: 'festival',
    jp: '夏の よる、空に 光る もの は？',
    id_text: 'Malam musim panas, yang menyala di langit adalah…',
    options: ['花火 (kembang api)', '桜 (sakura)', '雪 (salju)', '月 (bulan)'],
    answer: 0,
  },
];

// Soal untuk satu percobaan ujian — deterministik (tanpa acak) agar dites.
// Ambil `size` soal pertama (bank kecil; cukup untuk gerbang).
export const checkpointQuestions = (size = EDO_CHECKPOINT_SIZE, bank = EDO_CHECKPOINT_QUESTIONS) =>
  bank.slice(0, Math.min(size, bank.length));

// Nilai jawaban: `answers` = array indeks pilihan (boleh ada null = belum dijawab).
// Mengembalikan { correct, total, passed }.
export const gradeCheckpoint = (answers, questions = EDO_CHECKPOINT_QUESTIONS, pass = EDO_CHECKPOINT_PASS) => {
  const list = Array.isArray(answers) ? answers : [];
  let correct = 0;
  questions.forEach((q, i) => {
    if (list[i] != null && list[i] === q.answer) correct += 1;
  });
  return { correct, total: questions.length, passed: correct >= pass };
};

// Validasi bank soal untuk tes: id unik, ada opsi, `answer` menunjuk opsi sah.
export const validateCheckpoint = (bank = EDO_CHECKPOINT_QUESTIONS, pass = EDO_CHECKPOINT_PASS) => {
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
