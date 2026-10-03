// EraArtwork — "lukisan agung" 名画 (karya domain-publik) sebagai hiasan era
// Heian di Home. Bukan foto ditempel: disatukan ke kertas washi lewat
// mix-blend + mask gradien (lihat src/index.css: .era-photo--village/-night),
// sehingga tepinya luluh seperti lukisan di gulungan, bukan gambar kotak.
//
// Sumber (domain publik, hak cipta habis):
//   - Desa 里  : layar lipat emas bergaya Rimpa (sakura + pinus + bukit).
//   - Laut malam 月夜 : cetakan kayu shin-hanga — laut malam, bulan, pinus.
// Kedua berkas ada di public/art/ (di-crop lokal). Dekoratif → aria-hidden +
// pointer-events:none; hanya tampil di era Heian.
export function EraVillageArt({ className = '' }) {
  return (
    <img
      src="/art/village-band.jpg"
      alt=""
      aria-hidden="true"
      draggable="false"
      className={`era-photo era-photo--village select-none ${className}`}
    />
  );
}

export function EraNightArt({ className = '' }) {
  return (
    <img
      src="/art/night-portrait.jpg"
      alt=""
      aria-hidden="true"
      draggable="false"
      className={`era-photo era-photo--night select-none ${className}`}
    />
  );
}

export default EraVillageArt;
