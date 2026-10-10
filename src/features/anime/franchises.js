// ─────────────────────────────────────────────────────────────────────────────
// A15 世界選択 (Beli/pilih dunia — LAPIS 2) — MURNI: tanpa React, tanpa DOM.
// 多元 = kanvas kosong; pemain MEMBELI franchise → satu DUNIA (palet + motif +
// gacha pool) dilukis ke kanvas. Ini yang membedakan 多元 dari semua era lain.
// Spec: docs/tema/anime-mekanik.md §A15 · PRD docs/tema/anime.md §11.
//
// ⚠️ KEBIJAKAN HAK CIPTA (revisi §6.4 anime.md — keputusan pemilik proyek):
//   • Dunia ORISINAL (tanpa flag `licensed`) → WAJIB fiktif. JANGAN menamai IP
//     nyata. Motif digambar sebagai siluet generik; kata umum (機神/忍者/魔法/
//     異世界) = trope, aman.
//   • Dunia LISENSI (`licensed: true`) → BOLEH memakai IP nyata (mis. JJK),
//     TAPI WAJIB punya `credit` (atribusi ke pemegang hak). Ini yang menahan
//     agar tidak "menyalin tanpa izin" — kredit = mitigasi hak cipta.
//   • `status: 'soon'` → dunia BELUM rilis (teaser saja, tidak bisa dibeli).
//
// Fungsi murni: franchiseById · canBuyFranchise · addFranchise · franchiseTokens ·
// equipFranchise · isFranchiseComingSoon. State (ownedFranchises/activeFranchise)
// hidup di ProgressContext.

export const FRANCHISE_MIN_LEVEL = 150;

// ── LAPIS 2a — DUNIA ORISINAL (5) ───────────────────────────────────────────
// ⚠️ SEMUA FIKTIF & ORISINAL. Jangan IP nyata.
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

  // ── LAPIS 2b — DUNIA LISENSI (IP nyata) ───────────────────────────────────
  // Tier "dunia besar": harga jauh di atas dunia orisinal (~20k) karena memuat
  // BANYAK karakter (wadah banyak tokoh), bukan 1. `credit` = atribusi wajib.
  {
    // JJK — LIVE. 8 karakter (lihat characters.js: jjk_*), memakai voice + efek
    // yang SUDAH ada (pack_07..pack_14). Inilah "payoff": konten JJK yang dulu
    // menggantung tanpa era (PRD §11.2) kini punya rumah di 多元.
    id: 'jjk', kanji: '呪術廻戦', name: 'Jujutsu Kaisen', genre_id: 'Pertarungan kutukan (dark fantasy)',
    price: 20000,
    fr1: '#161a2b', fr2: '#7c4dff', motif: 'curse', pool: ['curse', 'seal', 'flash', 'domain'],
    licensed: true, status: 'live', nuance: 'cursed',
    credit: '呪術廻戦 © 芥見下々 / 集英社・MAPPA',
  },
  {
    // ONE PIECE — COMING SOON (teaser; belum bisa dibeli, karakter menyusul).
    id: 'onepiece', kanji: 'ワンピース', name: 'One Piece', genre_id: 'Petualangan bajak laut',
    price: 20000,
    fr1: '#0e4d8f', fr2: '#e63946', motif: 'anchor', pool: ['anchor', 'sail', 'skull', 'wave'],
    licensed: true, status: 'soon',
    credit: 'ONE PIECE © 尾田栄一郎 / 集英社・東映アニメーション',
  },
  {
    // JOJO — COMING SOON (teaser). Motif 'star' = tanda lahir Joestar.
    id: 'jojo', kanji: 'ジョジョ', name: "JoJo's Bizarre Adventure", genre_id: 'Aksi adikodrati (bizarre)',
    price: 20000,
    fr1: '#5b2c6f', fr2: '#f4d03f', motif: 'star', pool: ['star', 'arrow', 'stone', 'mask'],
    licensed: true, status: 'soon',
    credit: 'ジョジョの奇妙な冒険 © 荒木飛呂彦 / 集英社',
  },
];

// Motif & pool yang diizinkan (dijaga validateFranchises). 'star'/'crystal'/'gear'
// dsb = siluet generik; 'curse'/'anchor' = motif dunia lisensi (masih siluet).
export const FRANCHISE_MOTIFS = ['star', 'shuriken', 'crystal', 'gear', 'lantern', 'curse', 'anchor'];

// Status yang sah untuk sebuah dunia.
export const FRANCHISE_STATUSES = ['live', 'soon'];

// Nuansa dunia (LAPIS 2 → atribut <html data-franchise-nuance>): mengubah
// SUASANA kanvas saat dunia itu aktif (mis. JJK → 'cursed' 呪力). Warna/garis
// tetap milik era (bentuk TIDAK berubah); nuansa hanya menambah karakter visual
// khas dunia (segel 呪, tinta lebih pekat, screentone rapat). Data-driven →
// tidak ada string IP di CSS.
export const FRANCHISE_NUANCES = ['cursed'];

// Franchise berdasarkan id; tak dikenal → null (UI tidak pernah crash).
export const franchiseById = (id) => FRANCHISES.find((f) => f.id === id) || null;

// Nuansa dunia (null bila dunia tak punya nuansa / tak dikenal).
export const franchiseNuance = (id) => franchiseById(id)?.nuance || null;

// Dunia yang BELUM rilis (teaser). Tak dikenal → false.
export const isFranchiseComingSoon = (id) => franchiseById(id)?.status === 'soon';

// Dunia lisensi (IP nyata)? Dipakai UI untuk menampilkan kredit/atribusi.
export const isFranchiseLicensed = (id) => franchiseById(id)?.licensed === true;

// Pemain boleh beli bila: level ≥150 & belum punya & medaru cukup & SUDAH rilis.
export const canBuyFranchise = (progress, id) => {
  const f = franchiseById(id);
  if (!f || f.status === 'soon') return false;
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
    // Dunia lisensi WAJIB ber-kredit (mitigasi hak cipta) + status sah.
    if (f?.licensed && (typeof f?.credit !== 'string' || !f.credit.trim())) {
      errors.push(`${tag}: franchise lisensi wajib punya credit`);
    }
    if (f?.status && !FRANCHISE_STATUSES.includes(f.status)) errors.push(`${tag}: status tak dikenal: ${f.status}`);
    // Nuansa (opsional) harus dari daftar yang dikenal — dijaga agar CSS
    // [data-franchise-nuance] selalu punya pasangan.
    if (f?.nuance && !FRANCHISE_NUANCES.includes(f.nuance)) errors.push(`${tag}: nuance tak dikenal: ${f.nuance}`);
  }
  return errors;
};

export default FRANCHISES;
