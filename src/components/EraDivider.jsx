// EraDivider — pemisah antar-seksi ber-motif era.
// Era Heian: tampil sebagai awan suyari-gasumi 霞 (dua baris scallop emas yang
// mengalir lambat + label kaligrafi). Era lain: garis tipis netral + label kecil.
// Semua gaya ada di src/index.css (bagian "BAHASA BENTUK HEIAN"). Dekoratif →
// aria-hidden supaya tidak dibaca screen reader.
export function EraDivider({ label = '霞 · SUYARI GASUMI · 霞', className = '' }) {
  return (
    <div className={`era-divider ${className}`} role="presentation" aria-hidden="true">
      <div className="era-divider__band">
        <span className="era-divider__label">{label}</span>
      </div>
    </div>
  );
}

export default EraDivider;
