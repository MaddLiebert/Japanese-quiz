// Lifecycle kecil untuk efek jawaban (fx) — mencegah STALE TIMER.
//
// Bug nyata (keluhan user "efek murasaki kecepetan"): timer hold milik efek
// LAMA (mis. 蒼 2.2s) masih berjalan; saat efek BARU (茈, hold 3.64s) sudah
// tampil, timer lama memanggil setFx(null) → efek baru mati prematur, suara
// Murasaki.mp3 (3.24s) masih berbunyi tanpa visual.
//
// Solusi: setiap timer menyimpan id fx yang dia miliki; saat berbunyi, efek
// hanya dibersihkan kalau id-nya MASIH yang tampil (current). Sama untuk
// generasi reset bola murasaki (token) — generasi lama tidak boleh menghapus
// bola milik generasi baru.

// Kembalikan null (bersihkan) hanya kalau fx saat ini = id pemilik timer;
// selain itu kembalikan fx apa adanya (jangan sentuh efek baru).
export const clearFxIfCurrent = (fx, ownerId) =>
  (fx && fx.id === ownerId ? null : fx);

// Token generasi (mis. per jawaban murasaki): hanya token TERBARU yang boleh
// melakukan efek samping (reset bola / mematikan ledakan).
export const isCurrentToken = (latest, mine) => latest === mine;

// Token generasi global untuk timer bola murasaki — cukup modul-level karena
// hanya ada satu pipeline bola pada satu waktu.
let ballToken = 0;
export const nextBallToken = () => ++ballToken;
export const currentBallToken = () => ballToken;
