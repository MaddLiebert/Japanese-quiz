// telegram.js — M13 電信 (pesan telegraf diegetik). Modul MURNI.
// Notifikasi = ketukan telegraf tit-tit → teks muncul seperti kertas telegraf.
// Kadang terpotong ("...熟語...覚え...て...") karena kabel putus → misteri.
// Spec: docs/tema/meiji-mekanik.md §M13.

// Potong pesan di `cutAt` + ellipsis. cutAt <= 0 / >= panjang → apa adanya.
export const truncate = (msg, cutAt) => {
  const s = String(msg ?? '');
  const n = Number(cutAt);
  if (!Number.isFinite(n) || n <= 0) return s;
  if (n >= s.length) return s;
  return `${s.slice(0, n)}…`;
};

// Pesan per-peristiwa; sebagian sengaja terpotong (kabel putus).
export const TELEGRAMS = [
  { id: 'welcome', jp: '着信アリ。学習ヲ開始セヨ。', id_text: 'Ada pesan masuk. Mulailah belajar.' },
  { id: 'streak',  jp: '連続記録、更新中。', id_text: 'Rentetan rekor, sedang diperbarui.' },
  { id: 'cut',     jp: '…熟語…覚え…テ…', id_text: '…kosakata…ingat…dan…', cut: true },
];

export const telegramById = (id) => TELEGRAMS.find((t) => t.id === id) || null;

// Terapkan pemotongan (kalau item ditandai cut) — untuk efek "kabel putus".
export const renderTelegram = (item, cutAt) => {
  if (!item) return '';
  return item.cut ? truncate(item.jp, cutAt ?? 5) : item.jp;
};

export default truncate;
