// speechEnv.js — MURNI: menilai apakah lingkungan browser siap untuk Web Speech API.
// Dipakai panel diagnosa Speaking untuk menjawab "salah website / Google / HP?".
// Tanpa DOM/React → aman `node --test`.
export const diagnoseEnv = (env = {}) => {
  const {
    isSecureContext = true,
    hasCtor = true,
    permissionState = 'unknown',   // 'granted' | 'denied' | 'prompt' | 'unknown'
    online = true,
  } = env;
  if (!hasCtor) {
    return { code: 'no-ctor', level: 'blocker', message: { id: 'Browser ini tidak punya SpeechRecognition (pakai Chrome/Edge/Safari terbaru).', en: 'This browser has no SpeechRecognition (use Chrome/Edge/Safari).' } };
  }
  if (!isSecureContext) {
    return { code: 'insecure', level: 'blocker', message: { id: 'Bukan koneksi aman — buka lewat https:// atau localhost.', en: 'Not a secure context — use https:// or localhost.' } };
  }
  if (permissionState === 'denied') {
    return { code: 'mic-denied', level: 'blocker', message: { id: 'Izin mikrofon DIBLOKIR untuk situs ini — buka gembok di address bar → Mikrofon → Izinkan, lalu muat ulang.', en: 'Microphone permission BLOCKED for this site — open the padlock in the address bar → Microphone → Allow, then reload.' } };
  }
  if (!online) {
    return { code: 'offline', level: 'blocker', message: { id: 'Pengenalan suara butuh internet (ASR jalan di server Google/Apple).', en: 'Speech recognition needs internet (ASR runs on Google/Apple servers).' } };
  }
  if (permissionState === 'prompt') {
    return { code: 'mic-prompt', level: 'warn', message: { id: 'Izin mikrofon belum diberikan — tekan Ucapkan lalu pilih Izinkan.', en: 'Microphone permission not granted yet — press Speak and choose Allow.' } };
  }
  return { code: 'ok', level: 'ok', message: { id: 'Lingkungan siap.', en: 'Environment ready.' } };
};
