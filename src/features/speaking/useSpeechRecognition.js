// useSpeechRecognition.js — pembungkus tipis Web Speech API (SpeechRecognition).
// Constructor diambil SAAT start() supaya bisa di-mock (E2E) & aman tanpa window.
import { useCallback, useEffect, useRef, useState } from 'react';
import { collectResults, buildUtterances, appendFinals, shouldStopOnSilence, SILENCE_TICK_MS, SILENCE_STOP_MS } from './speechSilence.js';

export const getRecognitionCtor = () => {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

export const isSpeechRecognitionSupported = () => Boolean(getRecognitionCtor());

// Deteksi perangkat mobile dari user agent (murni → mudah diuji).
export const isMobileUA = (ua) =>
  /Android|iPhone|iPad|iPod|Windows Phone|Opera Mini|IEMobile|Mobile/i.test(String(ua || ''));

export const isMobileDevice = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (isMobileUA(ua)) return true;
  // iPadOS 13+ memakai UA desktop ('Macintosh') tapi layar sentuh >1 titik.
  return (navigator.maxTouchPoints || 0) > 1 && /Macintosh/.test(ua);
};

// Batas maksimum satu sesi dengar (ms): backstop kalau engine tidak mengirim
// event apa pun (jarang, tapi pernah terjadi) — popup tidak nyangkut selamanya
// dan user tetap dapat umpan balik. Mode continuous berhenti lebih dulu lewat
// timer hening; nilai ini hanya jaring terakhir untuk baris puisi panjang.
export const MAX_LISTEN_MS = 20000;

// Hasil akhir satu sesi dengar. Sebagian HP hanya mengirim hasil interim lalu
// berhenti (tanpa final) — selamatkan interim terakhir daripada membuang
// ucapan yang sebenarnya terdengar.
export const resolveUtterances = (finals, interim) => {
  if (Array.isArray(finals) && finals.length) return finals;
  return interim ? [interim] : [];
};

export function useSpeechRecognition({ lang = 'ja-JP', onEvent } = {}) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState(null);
  // Level suara 0..1 untuk bar spektrum popup. Sumbernya TANPA stream kedua:
  //  - event onlevel VAD engine (kalau didukung), dan
  //  - lonjakan tiap kali engine mengirim hasil (interim/final) = ada suara.
  // Lalu MELURUH (decay) saat tidak ada event, jadi bar bergerak naik-turun.
  const [level, setLevel] = useState(0);
  const recRef = useRef(null);
  const settleRef = useRef(null);   // finish() sesi aktif (untuk tombol Batal)
  // Callback observasi event ASR (untuk panel diagnosa). Disimpan di ref supaya
  // tak memicu re-render / mengubah dependency listenOnce.
  const onEventRef = useRef(onEvent);
  useEffect(() => { onEventRef.current = onEvent; }, [onEvent]);
  const emit = useCallback((ev) => {
    try { onEventRef.current?.(ev); } catch { /* noop */ }
  }, []);

  // Peluruhan level: turun ~18% tiap 120ms → bar jatuh mulus saat user berhenti.
  useEffect(() => {
    if (!listening) return undefined;
    const iv = setInterval(() => {
      setLevel((v) => (v > 0.02 ? v * 0.82 : 0));
    }, 120);
    return () => clearInterval(iv);
  }, [listening]);

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
    // Dengar TERUS-MENERUS: engine TIDAK lagi menghentikan sesi sendiri saat user
    // jeda sejenak di tengah ucapan (bug puisi: "belum selesai ngomong udah
    // berhenti"). Sesi baru berhenti lewat timer hening (lihat silenceId) atau
    // tombol Batal / batas MAX_LISTEN_MS.
    rec.continuous = true;

    let settled = false;
    let lastInterim = '';
    let collectedSegments = [];  // segmen final lintas event (mode continuous)
    let collectedExtras = [];    // alternatif ke-2..n (hipotesis engine)
    let nextIndex = 0;           // indeks hasil yang sudah diproses → hindari dobel
    let hasSpoken = false;       // sudah ada suara? (timer hening baru aktif sesudah ini)
    let lastVoiceAt = Date.now(); // waktu terakhir ada suara (hasil ASR / VAD)
    let guardId = null;
    let silenceId = null;
    const markVoice = () => { hasSpoken = true; lastVoiceAt = Date.now(); };
    const finish = (texts) => {
      if (settled) return;
      settled = true;
      if (guardId) clearTimeout(guardId);
      if (silenceId) clearInterval(silenceId);
      if (recRef.current === rec) recRef.current = null;
      if (settleRef.current === settle) settleRef.current = null;
      // Mode continuous: engine TIDAK berhenti sendiri → WAJIB dihentikan manual,
      // kalau tidak mikrofon tetap hidup setelah penilaian selesai.
      try { rec.stop?.(); } catch { /* noop */ }
      setListening(false);
      setInterim('');
      setLevel(0);
      resolve(texts);
    };
    const settle = () => finish([]);
    settleRef.current = settle;

    // Teks akhir sesi ini: segmen disambung jadi satu ucapan utuh.
    const finalTexts = () => buildUtterances(collectedSegments, collectedExtras, lastInterim);

    // Timer hening: periksa tiap SILENCE_TICK_MS; berhenti setelah tak ada suara
    // selama SILENCE_STOP_MS — TAPI hanya setelah user benar-benar mulai bicara
    // (kalau belum, tunggu sampai batas MAX_LISTEN_MS; jangan potong di detik 2,5
    // hanya karena user diam berpikir dulu).
    silenceId = setInterval(() => {
      if (settled || !hasSpoken) return;
      if (!shouldStopOnSilence(Date.now(), lastVoiceAt)) return;
      finish(finalTexts());
    }, SILENCE_TICK_MS);

    rec.onresult = (e) => {
      if (settled) return;   // sesi sudah selesai/dibatalkan: abaikan event telat
      markVoice();           // ada suara → aktifkan & reset timer hening
      let segments = [];
      let extras = [];
      let partial = '';
      try {
        const r = collectResults(e?.results, nextIndex);
        segments = r.segments; extras = r.extras; partial = r.interim; nextIndex = r.nextIndex;
      } catch { /* noop */ }
      if (segments.length) {
        collectedSegments = appendFinals(collectedSegments, segments);
        collectedExtras = [...collectedExtras, ...extras];
        emit({ type: 'result', transcript: segments.join('') });
        lastInterim = '';   // final masuk → interim lama sudah "terpakai"
        setInterim('');
        setLevel((v) => Math.max(v, 0.85));
      }
      if (partial) {
        lastInterim = partial;
        emit({ type: 'result', transcript: partial });
        setInterim(partial);
        setLevel((v) => Math.max(v, 0.85));
      }
    };
    rec.onerror = (e) => {
      if (settled) return;   // sesi sudah selesai/dibatalkan: abaikan event telat
      const code = e?.error || 'unknown';
      emit({ type: 'error', error: code });
      if (code === 'aborted') { finish([]); return; }   // tombol Batal: bukan error
      // Engine sempat mendengar sesuatu (interim) lalu error/berhenti:
      // selamatkan teksnya daripada melaporkan gagal total.
      const salvaged = finalTexts();
      if (salvaged.length) { finish(salvaged); return; }
      setError(code);
      finish([]);
    };
    rec.onend = () => {
      if (settled) return;
      emit({ type: 'end' });
      // Mode continuous: onend bisa terpanggil saat engine jeda internal TAPI
      // timer hening belum habis → JANGAN tutup sesi; biarkan timer yang
      // memutuskan. Kalau user BELUM sempat bicara, tetap tunggu (jangan potong).
      if (!hasSpoken || !shouldStopOnSilence(Date.now(), lastVoiceAt)) return;
      const salvaged = finalTexts();
      // Berhenti tanpa hasil & tanpa error (mis. mikrofon direbut proses lain):
      // tampilkan pesan supaya user tahu, bukan diam tanpa reaksi.
      if (!salvaged.length) setError('no-speech');
      finish(salvaged);
    };
    // Level suara dari VAD engine (0..1) — TANPA stream getUserMedia kedua,
    // jadi aman di HP (tidak merebut mikrofon). Dipakai bar aktivitas popup.
    rec.onlevel = (e) => {
      if (settled) return;
      const lvl = Number(e?.value);
      if (Number.isFinite(lvl)) {
        // Level VAD menandakan ADA SUARA → reset timer hening juga.
        if (lvl > 0.05) markVoice();
        emit({ type: 'level', value: lvl });
        setLevel((v) => Math.max(v, Math.max(0, Math.min(1, lvl))));
      }
    };
    // Event lifecycle (tak semua engine mendukung — sekadar tidak dipanggil).
    // Berguna untuk diagnosa: membedakan "engine tak nyala" vs "nyala tapi bisu".
    // onspeechstart/onsoundstart = user mulai bicara → tahan sesi tetap terbuka.
    rec.onstart = () => { if (!settled) emit({ type: 'start' }); };
    rec.onsoundstart = () => { if (!settled) { markVoice(); emit({ type: 'soundstart' }); } };
    rec.onspeechstart = () => { if (!settled) { markVoice(); emit({ type: 'speechstart' }); } };

    setError(null);
    setInterim('');
    setListening(true);
    guardId = setTimeout(() => {
      if (settled) return;
      const salvaged = finalTexts();
      if (!salvaged.length) setError('no-speech');
      finish(salvaged);
    }, MAX_LISTEN_MS);
    try { rec.start(); emit({ type: 'starting', lang }); } catch { setError('unknown'); finish([]); }
  }), [lang, emit]);

  return { listenOnce, listening, interim, level, error, clearError, cancel, supported: isSpeechRecognitionSupported() };
}
