// speechDiagnostics.js — MURNI: ubah log event Web Speech API menjadi verdict
// "apa yang sebenarnya terjadi". Dipakai panel diagnosa Speaking supaya kita
// berhenti menebak (website / Google / HP) dan melihat bukti.
// Tanpa DOM/React → aman `node --test`.
//
// Kode verdict (code) & artinya:
//   never-started  → engine tak pernah menyala (ctor/gesture/secure context)
//   mic-denied     → izin mikrofon ditolak / diblokir
//   no-capture     → engine nyala tapi TIDAK ada suara masuk (mic/HP/izin)
//   not-recognized → audio sampai engine tapi tak jadi teks (ASR/Google/network)
//   asr-network    → layanan ASR tak terjangkau (butuh internet / diblokir)
//   recognized     → TERDETEKSI → masalah ada di pencocokan/penilaian, bukan deteksi
export const summarizeSpeechLog = (events = []) => {
  const list = Array.isArray(events) ? events : [];
  const counts = {};
  let firstError = null;
  let gotResult = false;
  let gotSound = false;
  let gotSpeech = false;
  let gotStart = false;
  const transcripts = [];
  for (const e of list) {
    const type = (e && e.type) || 'unknown';
    counts[type] = (counts[type] || 0) + 1;
    if (type === 'start') gotStart = true;
    if (type === 'soundstart') gotSound = true;
    if (type === 'speechstart') gotSpeech = true;
    if (type === 'result') {
      gotResult = true;
      if (e.transcript) transcripts.push(e.transcript);
    }
    if (type === 'error' && !firstError) firstError = e.error || 'unknown';
  }
  const base = { counts, firstError, gotStart, gotSound, gotSpeech, gotResult, transcripts };
  const msg = (id, en) => ({ id, en });
  const sawError = (counts.error || 0) > 0;

  // Error eksplisit menang atas "tak pernah mulai" — event error berarti engine
  // memang menyala lalu gagal (mis. not-allowed/network).
  if (firstError === 'not-allowed' || firstError === 'service-not-allowed') return { ...base, code: 'mic-denied', message: msg(
    'Izin mikrofon ditolak/diblokir untuk situs ini.',
    'Microphone permission denied/blocked for this site.') };
  if (firstError === 'network') return { ...base, code: 'asr-network', message: msg(
    'Layanan pengenal suara tak terjangkau (butuh internet / diblokir jaringan).',
    'Speech service unreachable (needs internet / network blocked).') };
  if (gotResult) return { ...base, code: 'recognized', message: msg(
    'Suara TERDETEKSI — kalau masih "Belum pas", masalahnya di pencocokan, bukan deteksi.',
    'Speech WAS detected — if still "Not quite", the issue is matching, not detection.') };
  if (!gotStart && !sawError) return { ...base, code: 'never-started', message: msg(
    'Engine pengenal suara tidak pernah menyala — cek izin/dukungan browser.',
    'Speech engine never started — check permission/browser support.') };
  if (gotSpeech || gotSound) return { ...base, code: 'not-recognized', message: msg(
    'Audio sampai ke engine tapi tak jadi teks (ASR/Google/HP) — coba Chrome Android/Safari.',
    'Audio reached the engine but produced no text (ASR/Google/phone) — try Chrome Android/Safari.') };
  return { ...base, code: 'no-capture', message: msg(
    'Engine nyala tapi tidak ada suara masuk — cek mikrofon/izin/HP.',
    'Engine started but no audio came in — check mic/permission/phone.') };
};
