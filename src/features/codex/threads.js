// threads.js — M4 Codex つながり: benang lintas-era (Edo → Meiji → Shōwa).
// Modul MURNI (tanpa React/DOM). Meiji = SIMPUL penghubung: istilah yang
// meng-echo istilah era sebelumnya memunculkan catatan 「つながり」.
// Spec: docs/tema/meiji-mekanik.md §M4.

// Tiap thread = rantai istilah lintas-era. Data-driven: nambah node = nambah
// data, bukan kode. Label 和 untuk judul toast.
export const THREADS = [
  { id: 'light', label_jp: '灯り', chain: ['提灯 (edo)', '瓦斯灯 (meiji)', '電気 (showa)'] },
  { id: 'road',  label_jp: '道',   chain: ['東海道 (edo)', '鉄道 (meiji)', '新幹線 (showa)'] },
  { id: 'money', label_jp: '銭',   chain: ['両 (edo)', '円 (meiji)', '円 (showa)'] },
  { id: 'news',  label_jp: '報',   chain: ['瓦版 (edo)', '新聞 (meiji)', '新聞 (showa)'] },
];

export const threadById = (threadId) => THREADS.find((t) => t.id === threadId) || null;

// Tambah node ke thread saat perhentian memperkenalkannya.
// IDEMPOTEN: node yang sudah ada tidak ditambah lagi.
// linked = true kalau thread SUDAH punya node sebelumnya (ini echo lintas-era).
export const addNode = (threads, threadId, node) => {
  const list = Array.isArray(threads) ? threads : THREADS;
  const idx = list.findIndex((t) => t.id === threadId);
  if (idx === -1) return { threads: list, linked: false, added: false };
  const t = list[idx];
  if (t.chain.includes(node)) return { threads: list, linked: false, added: false };
  const linked = t.chain.length > 0; // ada node sebelumnya → つながり
  const next = list.map((x, i) => (i === idx ? { ...x, chain: [...x.chain, node] } : x));
  return { threads: next, linked, added: true };
};

// Teks toast 「つながり」 untuk thread valid. null kalau thread tak dikenal.
export const linkedNote = (threadId, language = 'id') => {
  const t = threadById(threadId);
  if (!t) return null;
  const chain = t.chain.join(' → ');
  return language === 'en'
    ? `つながり · ${t.label_jp} — ${chain}`
    : `つながり · ${t.label_jp} — ${chain}`;
};

export default THREADS;
