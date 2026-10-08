// ─────────────────────────────────────────────────────────────────────────────
// Teks kartu "Streak Belajar" + label bonus + JENIS IKON (sigil) per-era.
//
// Aturan keras: TIAP ERA punya ikon streak sendiri (SVG), bukan kotak 炎/灰
// bawaan Shōwa. Meiji = era baru → WAJIB punya sigil sendiri, jangan warisi
// punya era lain (kritik user: "tiap bikin era baru pasti ada bagian Shōwa-nya
// ketinggalan").
//   • Heian 平安 → 和蝋燭 (lilin)   — menyala/padam, label KANA (pemain Lv 1+)
//   • Edo   江戸 → 提灯 (lentera)   — menyala tiap malam
//   • Meiji 明治 → 瓦斯灯 (lampu gas) — dinyalakan tiap senja
//   • Era lain   → kotak segel 炎/灰 (legacy, belum didesain)
//
// `sigil` = kunci komponen SVG yang dipakai StreakIndicator.
// Modul MURNI (tanpa React/DOM) → dites via `node --test`.
// ─────────────────────────────────────────────────────────────────────────────

// Heian — label utama KANA. sigilOn/sigilOff = 1 kanji (segel hiasan).
// candleLit/candleOut = label ARIA lilin 和蝋燭 (untuk pembaca layar).
export const HEIAN_STREAK = {
  title: 'ひのたま',            // bola api (metafora streak)
  unit: 'ひ',                  // satuan hari
  bonusOn: 'ごわり まし',       // +5% (5割増し)
  bonusOff: 'ひ は きえて いる', // api padam
  sigilOn: '灯',               // lampu menyala (nyala)
  sigilOff: '消',              // padam
  candleLit: 'ひ が ともって いる',   // lilin menyala
  candleOut: 'ひ が きえて いる',     // lilin padam
  sigil: 'candle',
};

// Edo 江戸 — 提灯 (chōchin, lentera kertas). "灯 ともる" tiap malam belajar.
// satuan 夜 (malam) — lentera memang benda malam; lebih hidup dari "hari".
export const EDO_STREAK = {
  title: '提灯',               // chōchin
  unit: '夜',                  // satuan malam
  bonusOn: '灯 ともる',         // lampu menyala
  bonusOff: '灯 きえた',        // lampu padam
  sigilOn: '灯',
  sigilOff: '消',
  candleLit: '提灯 が ともって いる',
  candleOut: '提灯 が きえて いる',
  sigil: 'lantern',
};

// Meiji 明治 — 瓦斯灯 (gaslight). Kota baru diterangi lampu gas tiap senja.
export const MEIJI_STREAK = {
  title: '瓦斯灯',             // gaslight
  unit: '日',                  // satuan hari
  bonusOn: '点灯 中',           // menyala
  bonusOff: '消灯',            // padam
  sigilOn: '点',
  sigilOff: '消',
  candleLit: '瓦斯灯 が ついて いる',
  candleOut: '瓦斯灯 が きえて いる',
  sigil: 'gaslight',
};

// Peta era → copy. Era yang belum punya desain jatuh ke LEGACY (kotak 炎/灰).
export const STREAK_BY_ERA = {
  heian: HEIAN_STREAK,
  edo: EDO_STREAK,
  meiji: MEIJI_STREAK,
};

export const isHeianEra = (eraId) => eraId === 'heian';

// Teks lama (era yang belum didesain) — kotak segel 炎/灰.
const LEGACY = (id) => ({
  title: id ? 'Streak Belajar' : 'Study Streak',
  unit: null,                  // null → pemanggil pakai streakUnit(count, language)
  bonusOn: id ? '+5% Bonus Aktif' : '+5% Bonus Active',
  bonusOff: id ? 'Bonus Nonaktif' : 'Bonus Inactive',
  sigilOn: '炎',
  sigilOff: '灰',
  sigil: 'legacy',
});

// Teks kartu streak untuk era aktif.
// Heian/Edo/Meiji → copy era (bebas bahasa). Era lain → teks lama (ID/EN).
export const streakCopy = (eraId, language) =>
  (STREAK_BY_ERA[eraId] ? { ...STREAK_BY_ERA[eraId] } : LEGACY(language === 'id'));
