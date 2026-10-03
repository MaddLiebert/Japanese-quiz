// ─────────────────────────────────────────────────────────────────────────────
// Teks kartu "Streak Belajar" + label bonus. KHUSUS era Heian 平安.
// Konsep: streak = ひのたま (bola api) yang MENYALA tiap hari belajar, dan
// PADAM kalau bolong. Nyala/padam = 灯 (lampu menyala) / 消 (padam) — bukan 炎/灰
// (bahasa Shōwa). Label pakai KANA (pemain belum bisa kanji).
// Era lain → teks sekarang (ID/EN), jadi Heian tidak bocor.
// Modul MURNI (tanpa React/DOM) → dites via `node --test`.
// ─────────────────────────────────────────────────────────────────────────────

// Label utama Heian = KANA. sigilOn/sigilOff = 1 kanji (segel hiasan di kartu).
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
};

export const isHeianEra = (eraId) => eraId === 'heian';

// Teks lama (era selain Heian) — sama seperti sebelumnya, tidak diubah.
const LEGACY = (id) => ({
  title: id ? 'Streak Belajar' : 'Study Streak',
  unit: null,                  // null → pemanggil pakai streakUnit(count, language)
  bonusOn: id ? '+5% Bonus Aktif' : '+5% Bonus Active',
  bonusOff: id ? 'Bonus Nonaktif' : 'Bonus Inactive',
  sigilOn: '炎',
  sigilOff: '灰',
});

// Teks kartu streak untuk era aktif. Heian → kana; era lain → teks lama.
export const streakCopy = (eraId, language) =>
  (isHeianEra(eraId) ? { ...HEIAN_STREAK } : LEGACY(language === 'id'));
