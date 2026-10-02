// EraTategaki — label 縦書き (tulisan vertikal kanan→kiri), sinyal manuskrip
// Heian paling kuat: gulungan emakimono & surat era Heian ditulis tegak.
// HANYA tampil di era Heian; di era lain otomatis tersembunyi (agar tema lain
// tak terganggu). Dipakai untuk label KANJI pendek (2–5 aksara) saja — teks
// Latin tetap horizontal supaya tetap terbaca.
// Dekoratif → aria-hidden; teks kanji tetap dibacakan lewat `label` di parent.
// Semua gaya ada di src/index.css bagian "7. 縦書き tategaki".
export function EraTategaki({ children, className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`era-tategaki era-tategaki-only ${className}`}
    >
      {children}
    </span>
  );
}

export default EraTategaki;
