// EraPaper — satu lembar kertas washi tua sebagai LATAR di belakang konten
// halaman (era Heian saja), supaya teks/tab/tombol tidak "ngambang" di latar
// kosong. Sama seperti panel kertas Home.
//
// Cara pakai: pembungkus halaman WAJIB `position: relative`, lalu taruh
// <EraPaper /> sebagai anak pertama:
//   <div className="relative max-w-4xl mx-auto ...">
//     <EraPaper />
//     ...
//
// Lapisan ini absolute + z-index:-1 → di belakang konten dalam, tapi tetap di
// atas latar global app (karena <main> = stacking context z-10). Di era selain
// Heian otomatis tersembunyi (lihat CSS: .era-paper-sheet). Dekoratif →
// aria-hidden. Semua gaya di src/index.css bagian "8. Lembar kertas (washi)".
export function EraPaper({ className = '' }) {
  return <div aria-hidden="true" className={`era-paper-sheet ${className}`} />;
}

export default EraPaper;
