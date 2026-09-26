// useSpeechRecognition.js — pembungkus tipis Web Speech API (SpeechRecognition).
// Constructor diambil SAAT start() supaya bisa di-mock (E2E) & aman tanpa window.
import { useCallback, useEffect, useRef, useState } from 'react';

export const getRecognitionCtor = () => {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

export const isSpeechRecognitionSupported = () => Boolean(getRecognitionCtor());

// Batas maksimum satu sesi dengar (ms): backstop kalau engine tidak mengirim
// event apa pun (jarang, tapi pernah terjadi) — popup tidak nyangkut selamanya
// dan user tetap dapat umpan balik.
export const MAX_LISTEN_MS = 12000;

// Hasil akhir satu sesi dengar. Sebagian HP hanya mengirim hasil interim lalu
// berhenti (tanpa final) — selamatkan interim terakhir daripada membuang
// ucapan yang sebenarnya terdengar.
export const resolveUtterances = (finals, interim) => {
  if (Array.isArray(finals) && finals.length) return finals;
  return interim ? [interim] : [];
};

export function useSpeechRecognition({ lang = 'ja-JP' } = {}) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState(null);
  const recRef = useRef(null);
  const settleRef = useRef(null);   // finish() sesi aktif (untuk tombol Batal)

  useEffect(() => () => {
    settleRef.current?.();                 // tandai berakhir DULU → event telat diabaikan
    try { recRef.current?.abort?.(); } catch { /* noop */ }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // Batalkan sesi dengar yang sedang jalan (tombol Batal popup mic).
  // Tandai selesai DULU lalu abort: sebagian browser mengirim onend/onerror
  // sinkron saat abort — kalau belum ditandai, popup nyangkut / error palsu.
  const cancel = useCallback(() => {
    settleRef.current?.();
    try { recRef.current?.abort?.(); } catch { /* noop */ }
  }, []);

  // Satu sesi dengar. Mengembalikan array transcript FINAL (bisa kosong).
  // interimResults: teks sementara tampil live lewat `interim` (popup mic);
  // hasil final tetap dikumpulkan untuk penilaian seperti sebelumnya.
  const listenOnce = useCallback(() => new Promise((resolve) => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) { setError('not-supported'); resolve([]); return; }
    // Android/iOS hanya mengizinkan mic di secure context (HTTPS/localhost).
    // Di http:// biasa engine tidak pernah mengirim hasil → beri pesan jelas
    // daripada diam tanpa reaksi.
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      setError('insecure');
      resolve([]);
      return;
    }
    try { recRef.current?.abort?.(); } catch { /* noop */ }

    const rec = new Ctor();
    recRef.current = rec;
    rec.lang = lang;
    rec.interimResults = true;
    rec.maxAlternatives = 3;
    rec.continuous = false;

    let settled = false;
    let lastInterim = '';
    let guardId = null;
    const finish = (texts) => {
      if (settled) return;
      settled = true;
      if (guardId) clearTimeout(guardId);
      if (recRef.current === rec) recRef.current = null;
      if (settleRef.current === settle) settleRef.current = null;
      setListening(false);
      setInterim('');
      resolve(texts);
    };
    const settle = () => finish([]);
    settleRef.current = settle;

    rec.onresult = (e) => {
      if (settled) return;   // sesi sudah selesai/dibatalkan: abaikan event telat
      const finals = [];
      let partial = '';
      try {
        const results = e?.results || [];
        for (let i = 0; i < results.length; i++) {
          const res = results[i];
          if (!res) continue;
          if (res.isFinal) {
            for (let j = 0; j < res.length; j++) {
              if (res[j]?.transcript) finals.push(res[j].transcript);
            }
          } else {
            partial += res[0]?.transcript || '';
          }
        }
      } catch { /* noop */ }
      if (finals.length) { finish(finals); return; }
      if (partial) { lastInterim = partial; setInterim(partial); }
    };
    rec.onerror = (e) => {
      if (settled) return;   // sesi sudah selesai/dibatalkan: abaikan event telat
      const code = e?.error || 'unknown';
      if (code === 'aborted') { finish([]); return; }   // tombol Batal: bukan error
      // Engine sempat mendengar sesuatu (interim) lalu error/berhenti:
      // selamatkan teksnya daripada melaporkan gagal total.
      const salvaged = resolveUtterances([], lastInterim);
      if (salvaged.length) { finish(salvaged); return; }
      setError(code);
      finish([]);
    };
    rec.onend = () => {
      if (settled) return;
      const salvaged = resolveUtterances([], lastInterim);
      // Berhenti tanpa hasil & tanpa error (mis. mikrofon direbut proses lain):
      // tampilkan pesan supaya user tahu, bukan diam tanpa reaksi.
      if (!salvaged.length) setError('no-speech');
      finish(salvaged);
    };

    setError(null);
    setInterim('');
    setListening(true);
    guardId = setTimeout(() => {
      if (settled) return;
      const salvaged = resolveUtterances([], lastInterim);
      if (!salvaged.length) setError('no-speech');
      finish(salvaged);
    }, MAX_LISTEN_MS);
    try { rec.start(); } catch { setError('unknown'); finish([]); }
  }), [lang]);

  return { listenOnce, listening, interim, error, clearError, cancel, supported: isSpeechRecognitionSupported() };
}
