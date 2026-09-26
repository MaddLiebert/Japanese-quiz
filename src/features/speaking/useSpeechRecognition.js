// useSpeechRecognition.js — pembungkus tipis Web Speech API (SpeechRecognition).
// Constructor diambil SAAT start() supaya bisa di-mock (E2E) & aman tanpa window.
import { useCallback, useEffect, useRef, useState } from 'react';

export const getRecognitionCtor = () => {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

export const isSpeechRecognitionSupported = () => Boolean(getRecognitionCtor());

export function useSpeechRecognition({ lang = 'ja-JP' } = {}) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState(null);
  const recRef = useRef(null);
  const settleRef = useRef(null);   // finish() sesi aktif (untuk tombol Batal)

  useEffect(() => () => {
    try { recRef.current?.abort?.(); } catch { /* noop */ }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // Batalkan sesi dengar yang sedang jalan (tombol Batal popup mic).
  // Abort engine + settle manual: sebagian browser tidak mengirim onend
  // setelah abort, popup bisa nyangkut terbuka kalau hanya menunggu event.
  const cancel = useCallback(() => {
    try { recRef.current?.abort?.(); } catch { /* noop */ }
    settleRef.current?.();
  }, []);

  // Satu sesi dengar. Mengembalikan array transcript FINAL (bisa kosong).
  // interimResults: teks sementara tampil live lewat `interim` (popup mic);
  // hasil final tetap dikumpulkan untuk penilaian seperti sebelumnya.
  const listenOnce = useCallback(() => new Promise((resolve) => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) { setError('not-supported'); resolve([]); return; }
    try { recRef.current?.abort?.(); } catch { /* noop */ }

    const rec = new Ctor();
    recRef.current = rec;
    rec.lang = lang;
    rec.interimResults = true;
    rec.maxAlternatives = 3;
    rec.continuous = false;

    let settled = false;
    const finish = (texts) => {
      if (settled) return;
      settled = true;
      if (recRef.current === rec) recRef.current = null;
      if (settleRef.current === settle) settleRef.current = null;
      setListening(false);
      setInterim('');
      resolve(texts);
    };
    const settle = () => finish([]);
    settleRef.current = settle;

    rec.onresult = (e) => {
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
      if (partial) setInterim(partial);
    };
    rec.onerror = (e) => {
      const code = e?.error || 'unknown';
      if (code === 'aborted') { finish([]); return; }   // tombol Batal: bukan error
      setError(code);
      finish([]);
    };
    rec.onend = () => finish([]);

    setError(null);
    setInterim('');
    setListening(true);
    try { rec.start(); } catch { setError('unknown'); finish([]); }
  }), [lang]);

  return { listenOnce, listening, interim, error, clearError, cancel, supported: isSpeechRecognitionSupported() };
}
