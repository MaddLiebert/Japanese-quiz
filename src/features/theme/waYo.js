// waYo.js — M2 和魂洋才: rasio 和 (Jepang) / 洋 (Barat) per perhentian Meiji.
// Modul MURNI (tanpa React/DOM) → mudah dites. Meiji = satu-satunya era dengan
// DUA budaya bertarung; tiap perhentian punya rasio sendiri → tiap halaman
// terasa beda tanpa ganti warna. Lihat spec: docs/tema/meiji-mekanik.md §M2.
// PRD: docs/tema/meiji.md §21.

// wa = bobot Jepang (kanji, ukiran, kertas) · yo = bobot Barat (serif Latin,
// geometris, mesin, 洋装). Selalu berjumlah 100.
export const WA_YO = {
  yokohama:   { wa: 40, yo: 60 },   // 横浜港 — pelabuhan, gerbang Barat
  ginza:      { wa: 35, yo: 65 },   // 銀座 — deretan 煉瓦 ala Barat
  shimbunsha: { wa: 75, yo: 25 },   // 新聞社 — kantor surat kabar, paling Jepang
  rokumeikan: { wa: 15, yo: 85 },   // 鹿鳴館 — ballroom, paling Barat
  tetsudo:    { wa: 30, yo: 70 },   // 鉄道 — kereta, teknologi Barat
  shogakko:   { wa: 65, yo: 35 },   // 小学校 — sekolah, 和 yang kuat
  hakurankai: { wa: 50, yo: 50 },   // 博覧会 — pameran, seimbang
  kokkai:     { wa: 60, yo: 40 },   // 国会 — parlemen, 和 lebih besar
};

export const DEFAULT_WA_YO = { wa: 50, yo: 50 };

// Rasio untuk sebuah perhentian. Mengembalikan SALINAN (tabel tak termutasi).
export function waYoFor(stopId) {
  const v = WA_YO[stopId];
  return v ? { wa: v.wa, yo: v.yo } : { ...DEFAULT_WA_YO };
}

// Mix lengkap: { wa, yo, ratio } — ratio = porsi 和 (0..1) untuk bobot visual.
export function waYoMix(stopId) {
  const { wa, yo } = waYoFor(stopId);
  const total = wa + yo || 100;
  return { wa, yo, ratio: wa / total };
}

// CSS custom properties siap-pakai → disetel di root halaman perhentian.
// Dipakai CSS untuk menggeser kepadatan motif & tipografi secara halus.
export function waYoCss(stopId) {
  const m = waYoMix(stopId);
  return {
    '--wa-ratio': String(m.ratio),
    '--yo-ratio': String(1 - m.ratio),
  };
}
