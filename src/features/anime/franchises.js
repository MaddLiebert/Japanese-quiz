// ─────────────────────────────────────────────────────────────────────────────
// A15 世界選択 (Beli/pilih dunia — LAPIS 2) — MURNI: tanpa React, tanpa DOM.
// 多元 = kanvas kosong; pemain MEMBELI franchise → satu DUNIA (palet + motif +
// gacha pool) dilukis ke kanvas. Ini yang membedakan 多元 dari semua era lain.
// Spec: docs/tema/anime-mekanik.md §A15 · PRD docs/tema/anime.md §11.
//
// ⚠️ ATURAN HAK CIPTA (§6.4 anime.md) — KERAS:
//   SEMUA franchise di sini FIKTIF & ORISINAL. JANGAN menamai/menyalin IP nyata
//   (judul anime/manga/game komersial, nama karakter berhak cipta). Motif dunia
//   digambar sebagai siluet generik. Kata umum (機神/忍者/魔法/異世界) = trope, aman.
//
// Fungsi murni: franchiseById · canBuyFranchise · addFranchise · franchiseTokens ·
// equipFranchise. State (ownedFranchises/activeFranchise) hidup di ProgressContext.

export const FRANCHISE_MIN_LEVEL = 150;

// ⚠️ SEMUA FIKTIF & ORISINAL (§6.4 anime.md). Jangan IP nyata.
export const FRANCHISES = [
  {
    id: 'hoshi', kanji: '星の旅人', name: 'Star Traveler', genre_id: 'Petualangan luar angkasa', price: 5000,
    fr1: '#2b6cb0', fr2: '#f0c862', motif: 'star', pool: ['star', 'rocket', 'planet', 'comet'],
  },
  {
    id: 'kage', kanji: '影の忍者', name: 'Shadow Ninja', genre_id: 'Aksi ninja', price: 5000,
    fr1: '#2f3b46', fr2: '#d94f3d', motif: 'shuriken', pool: ['shuriken', 'leaf', 'moon', 'scroll'],
  },
  {
    id: 'mahou', kanji: '魔法学園', name: 'Magic Academy', genre_id: 'Fantasi sekolah sihir', price: 6000,
    fr1: '#6b4fa0', fr2: '#f18bb0', motif: 'crystal', pool: ['crystal', 'wand', 'book', 'star'],
  },
  {
    id: 'kishin', kanji: '機神', name: 'Machine God', genre_id: 'Mecha', price: 7000,
    fr1: '#b23a3a', fr2: '#f0c862', motif: 'gear', pool: ['gear', 'bolt', 'shield', 'wing'],
  },
  {
    id: 'yokai', kanji: '妖奇譚', name: 'Yokai Tales', genre_id: 'Horor/misteri yōkai', price: 5500,
    fr1: '#3a5a40', fr2: '#c94f7c', motif: 'lantern', pool: ['lantern', 'mask', 'flame', 'eye'],
  },
];

// Motif & pool yang diizinkan (dijaga validateFranchises) — siluet generik, bukan IP.
export const FRANCHISE_MOTIFS = ['star', 'shuriken', 'crystal', 'gear', 'lantern'];

// Franchise berdasarkan id; tak dikenal → null (UI tidak pernah crash).
export const franchiseById = (id) => FRANCHISES.find((f) => f.id === id) || null;

// Pemain boleh beli bila: level ≥150 & belum punya & medaru cukup.
export const canBuyFranchise = (progress, id) => {
  const f = franchiseById(id);
  if (!f) return false;
  const owned = progress?.ownedFranchises || [];
  return (Number(progress?.level) || 0) >= FRANCHISE_MIN_LEVEL
    && !owned.includes(id)
    && (Number(progress?.medaru) || 0) >= f.price;
};

// Tambah franchise ke state (immutable). Idempoten: sudah punya → state sama.
export const addFranchise = (progress, id) => {
  if (!franchiseById(id)) return progress;
  const owned = progress?.ownedFranchises || [];
  if (owned.includes(id)) return progress;
  return { ...progress, ownedFranchises: [...owned, id] };
};

// Token overlay dunia → dipakai CSS [data-franchise="…"] (§4.5 anime.md).
// Franchise menimpa WARNA & MOTIF, tidak menimpa BENTUK (outline/cel/radius/motion).
export const franchiseTokens = (id) => {
  const f = franchiseById(id);
  return f ? { fr1: f.fr1, fr2: f.fr2, motif: f.motif } : null;
};

// Aktifkan dunia (equip) — 1 dunia aktif pada satu waktu. Hanya bila dimiliki.
export const equipFranchise = (progress, id) =>
  (franchiseById(id) && (progress?.ownedFranchises || []).includes(id))
    ? { ...progress, activeFranchise: id }
    : progress;

// Punya franchise ini?
export const ownsFranchise = (progress, id) => (progress?.ownedFranchises || []).includes(id);

// Validasi data franchise (dipakai test & editor konten).
export const validateFranchises = (bank = FRANCHISES) => {
  const errors = [];
  const ids = bank.map((f) => f?.id);
  if (new Set(ids).size !== ids.length) errors.push('ada id franchise duplikat');
  for (const f of bank) {
    const tag = f?.id || '?';
    if (!f?.id) errors.push('franchise tanpa id');
    if (!f?.kanji) errors.push(`${tag}: kanji kosong`);
    if (!f?.name) errors.push(`${tag}: name kosong`);
    if (!f?.genre_id) errors.push(`${tag}: genre_id kosong`);
    if (!Number.isFinite(Number(f?.price)) || Number(f.price) <= 0) errors.push(`${tag}: price tidak valid`);
    if (!/^#[0-9a-fA-F]{6}$/.test(f?.fr1 || '')) errors.push(`${tag}: fr1 bukan hex #rrggbb`);
    if (!/^#[0-9a-fA-F]{6}$/.test(f?.fr2 || '')) errors.push(`${tag}: fr2 bukan hex #rrggbb`);
    if (!FRANCHISE_MOTIFS.includes(f?.motif)) errors.push(`${tag}: motif tak dikenal: ${f?.motif}`);
    if (!Array.isArray(f?.pool) || f.pool.length < 2) errors.push(`${tag}: pool < 2`);
  }
  return errors;
};

export default FRANCHISES;
