// MeijiPress — lapisan hiasan 活字 (huruf logam) khas Meiji.
// Dekoratif murni: pointer-events:none + aria-hidden. HANYA tampil saat
// data-era="meiji" (di-gate CSS lewat .meiji-ornament → display:none default).
// Lihat PRD: docs/tema/meiji.md §3 (bahasa bentuk letterpress).
// Tidak ada state/efek → aman dirender di semua era tanpa biaya.

const KATSUJI = ['明', '治', '活', '字', '新', '聞'];

export function MeijiPress() {
  return (
    <div
      className="meiji-ornament fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* 文選 palung penyusun huruf — kolom 活字 di tepi kiri-bawah. */}
      <div className="meiji-stick" style={{ left: '1.25rem', bottom: '2.5rem' }}>
        {KATSUJI.map((k, i) => (
          <span key={`${k}-${i}`} className="meiji-type">{k}</span>
        ))}
      </div>
      {/* Garis aturan koran samar di tepi kanan. */}
      <div className="meiji-ruled" style={{ right: '1.75rem', top: '16%' }} />
    </div>
  );
}

export default MeijiPress;
