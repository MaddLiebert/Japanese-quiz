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
  const [error, setError] = useState(null);
  const recRef = useRef(null);

  useEffect(() => () => {
    try { recRef.current?.abort?.(); } catch { /* noop */ }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // Satu sesi dengar. Mengembalikan array transcript (bisa kosong).
  const listenOnce = useCallback(() => new Promise((resolve) => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) { setError('not-supported'); resolve([]); return; }
    try { recRef.current?.abort?.(); } catch { /* noop */ }

    const rec = new Ctor();
    recRef.current = rec;
    rec.lang = lang;
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    rec.continuous = false;

    let settled = false;
    const finish = (texts) => {
      if (settled) return;
      settled = true;
      recRef.current = null;
      setListening(false);
      resolve(texts);
    };

    rec.onresult = (e) => {
      const texts = [];
      try {
        const res = e?.results?.[0];
        if (res) for (let i = 0; i < res.length; i++) {
          if (res[i]?.transcript) texts.push(res[i].transcript);
        }
      } catch { /* noop */ }
      finish(texts);
    };
    rec.onerror = (e) => { setError(e?.error || 'unknown'); finish([]); };
    rec.onend = () => finish([]);

    setError(null);
    setListening(true);
    try { rec.start(); } catch { setError('unknown'); finish([]); }
  }), [lang]);

  return { listenOnce, listening, error, clearError, supported: isSpeechRecognitionSupported() };
}
