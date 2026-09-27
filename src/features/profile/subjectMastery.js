// Statistik "Subject Mastery" (Profil → Statistik) — logika murni.
// Tanpa React & tanpa import JSON: semua dataset dilewatkan sebagai parameter,
// supaya bisa dites pakai `node --test` (pola features/**/*.js lain).
//
// Aturan akurasi: SEMUA materi yang punya jejak di itemProgress harus punya
// barisnya sendiri. Dulu Puisi (Latihan Bicara) & soal Ujian N5 sudah tercatat
// tapi tidak pernah tampil di radar — itu yang diperbaiki di sini.

// Bobot status SRS terhadap mastery: hafal penuh, setengah hafal, baru belajar.
export const STATUS_WEIGHT = { mastered: 1, familiar: 0.66, learning: 0.33 };

// Mastery (%) satu subjek = total bobot status / jumlah item subjek.
// Item belum pernah dikerjakan tidak menambah bobot (dianggap 0).
export const computeMastery = (itemProgress, items) => {
  if (!items || items.length === 0) return 0;
  let earned = 0;
  for (const item of items) {
    const st = itemProgress?.[item.id];
    if (!st) continue;
    earned += STATUS_WEIGHT[st.status] || 0;
  }
  return Math.round((earned / items.length) * 100);
};

// n5-exam.json berbentuk objek berisi array per jenis mondai → ratakan jadi
// satu daftar item. Item tanpa id dibuang agar hitungan tetap akurat.
export const flattenExamData = (examData) =>
  Object.values(examData || {}).flat().filter((it) => it && it.id);

// Daftar subjek yang tampil di radar, URUT TETAP. `data` = kunci dataset yang
// dilewatkan ke buildSubjectMastery.
export const SUBJECT_ORDER = [
  { subject: 'Hiragana', data: 'hiragana' },
  { subject: 'Katakana', data: 'katakana' },
  { subject: 'Kanji', data: 'kanji' },
  { subject: 'Kotoba', data: 'kotoba' },
  { subject: 'Grammar', data: 'grammar' },
  { subject: 'Mondai', data: 'mondai' },
  { subject: 'Poems', data: 'poems' },
  { subject: 'N5 Exam', data: 'n5exam' },
];

// Label bahasa Indonesia untuk tiap subjek (EN = kunci aslinya). Dipakai UI
// agar nama subjek ikut bahasa aktif.
export const SUBJECT_LABEL_ID = {
  Hiragana: 'Hiragana',
  Katakana: 'Katakana',
  Kanji: 'Kanji',
  Kotoba: 'Kosakata',
  Grammar: 'Tata Bahasa',
  Mondai: 'Mondai (Menyimak)',
  Poems: 'Puisi',
  'N5 Exam': 'Ujian N5',
};

// Bangun array { subject, score } dari itemProgress + kumpulan dataset.
export const buildSubjectMastery = (itemProgress, datasets = {}) =>
  SUBJECT_ORDER.map(({ subject, data }) => ({
    subject,
    score: computeMastery(itemProgress, datasets[data]),
  }));
