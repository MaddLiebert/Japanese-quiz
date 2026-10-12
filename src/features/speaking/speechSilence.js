// speechSilence.js — logika MURNI penentu KAPAN satu sesi dengar berhenti.
//
// BUG (puisi): dulu `continuous = false`, jadi engine Web Speech melakukan
// endpointing SENDIRI — begitu user JEDA sejenak di tengah baris puisi, engine
// mengirim hasil "final" lalu menutup sesi → ucapan terpotong ("belum selesai
// ngomong udah berhenti duluan"). Solusi: dengar TERUS-MENERUS (continuous =
// true) dan baru berhenti setelah HENING sekian lama, dihitung dari event
// terakhir yang menandakan ADA SUARA (hasil ASR atau level VAD engine).
//
// Modul murni: tanpa DOM/React/timer — aman di `node --test`.

// Hening selama ini (ms) → sesi dihentikan. Dipilih 2,5 dtk: cukup longgar untuk
// jeda napas / mengingat baris berikutnya, tapi tidak menggantung lama.
export const SILENCE_STOP_MS = 2500;

// Jeda pemeriksaan timer (ms). Nilai kecil supaya reaksi berhenti terasa cepat.
export const SILENCE_TICK_MS = 200;

// Selisih waktu sejak suara terakhir (tak pernah negatif; input aneh → 0).
export const silenceElapsed = (now, lastVoiceAt) => {
  const d = Number(now) - Number(lastVoiceAt);
  return Number.isFinite(d) ? Math.max(0, d) : 0;
};

// Sudah hening cukup lama?
export const shouldStopOnSilence = (now, lastVoiceAt, ms = SILENCE_STOP_MS) =>
  silenceElapsed(now, lastVoiceAt) >= ms;

// Kumpulkan transcript dari daftar SpeechRecognitionResult milik engine, mulai
// dari indeks `fromIndex`. Di mode continuous, event onresult berulang dan
// daftar `results` TUMBUH — jadi hasil yang sudah diproses harus dilewati agar
// tidak dihitung dobel.
//
// Satu hasil final = satu SEGMEN ucapan (karena user jeda). Alternatif ke-2..n
// dalam satu segmen hanyalah hipotesis lain untuk segmen yang sama, jadi
// dikembalikan terpisah (`extras`), bukan dianggap segmen baru.
// Mengembalikan { segments, extras, interim, nextIndex }.
export const collectResults = (results, fromIndex = 0) => {
  const segments = [];
  const extras = [];
  let interim = '';
  const list = results || [];
  const start = Math.max(0, Math.trunc(Number(fromIndex) || 0));
  for (let i = start; i < list.length; i++) {
    const res = list[i];
    if (!res) continue;
    if (res.isFinal) {
      const top = res[0]?.transcript || '';
      if (top) segments.push(top);
      for (let j = 1; j < res.length; j++) {
        const t = res[j]?.transcript;
        if (t) extras.push(t);
      }
    } else {
      interim += res[0]?.transcript || '';
    }
  }
  return { segments, extras, interim, nextIndex: list.length };
};

// Susun teks akhir dari segmen ucapan yang terkumpul:
//  - 0 segmen → pakai interim terakhir (kalau ada)
//  - 1 segmen → [teks, ...alternatif lain] (perilaku lama: engine menebak kata)
//  - ≥2 segmen → satu ucapan UTUH hasil penyambungan (mis. baris puisi panjang)
export const buildUtterances = (segments, extras = [], interim = '') => {
  const segs = (segments || []).filter(Boolean);
  if (!segs.length) return interim ? [interim] : [];
  if (segs.length === 1) return [segs[0], ...(extras || []).filter(Boolean)];
  return [segs.join('')];
};

// Gabungkan hasil final baru ke daftar yang sudah ada, tanpa duplikat berurutan.
export const appendFinals = (prev, added) => {
  const out = Array.isArray(prev) ? prev.slice() : [];
  for (const t of (added || [])) {
    if (t && out[out.length - 1] !== t) out.push(t);
  }
  return out;
};
