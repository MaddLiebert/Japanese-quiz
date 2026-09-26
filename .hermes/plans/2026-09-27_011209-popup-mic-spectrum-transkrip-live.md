# Plan: Popup Mic — ikon mic + spectrum level suara + deteksi teks live

**Tanggal**: 2026-09-27
**Repo**: `C:\Users\maddo\Documents\japanese-quiz` (React 19 + Vite + Tailwind v4 + Motion)
**Bahasa kerja**: kode & komentar mengikuti konvensi repo (komentar Indonesia, UI bilingual en/id).

---

## Goal

Saat user menekan tombol mic di sesi latihan bicara, muncul **popup** yang menandakan mic sedang ON:

1. **Ikon mic** besar yang berdenyut — tanda "mic nyala".
2. **Spectrum** level suara real-time — bar bergerak mengikuti volume mic.
3. **Deteksi apa yang sedang diucapkan** — teks live (interim result Web Speech API) tampil sambil bicara.
4. **Tombol Batal** — membatalkan sesi dengar (tanpa pesan error, tanpa penilaian).

Berlaku di **dua sesi yang punya tombol mic**: `SpeakSession` (kana/kotoba/kanji) dan `PoemSession` (per baris puisi).

Permintaan user (verbatim): "di bagian pas mencet mic, gw mau ada pop up muncul bentuk mic sama spectrum buat nandain on si mic nya sama kalo bisa detect dia ngomong apa aja"

---

## Current Context / Assumptions

Baca ini dulu — kamu tidak tahu apa-apa soal repo ini.

- **Alur mic sekarang**:
  - `src/features/speaking/useSpeechRecognition.js` — hook `listenOnce()` (Promise). Sekarang: `interimResults = false`; `onresult` langsung `finish(texts)`; belum ada `interim`, belum ada `cancel`.
  - `src/features/speaking/SpeakSession.jsx` — `handleSpeak()` → `await listenOnce()`; state `listening` dari hook; tombol mic `disabled={busy || listening}`.
  - `src/features/speaking/PoemSession.jsx` — `speakLine(i)` → `await listenOnce()`; per baris ada tombol mic kecil.
  - **Hanya 2 file itu** yang memakai `listenOnce` (sudah dicek `grep`); `src/pages/Speaking.jsx` cuma memakai `isSpeechRecognitionSupported`.
- **Yang SUDAH ada & dipakai ulang** (jangan bikin baru):
  - `lucide-react` (ikon `Mic`), `react-dom` `createPortal` (pola `src/features/gacha/GachaSlotOverlay.jsx`: portal ke `document.body` supaya `fixed` tidak terkurung transform milik `motion.div` parent).
  - Token tema Tailwind v4 di `src/index.css`: `bg-kinari`, `bg-kinari-light`, `text-sumi`, `border-sumi`, `bg-shu`, `bg-ai`, `bg-matcha` — jangan pakai hex mentah.
  - `src/context/LanguageContext.jsx` → `useLanguage()` → `const id = language === 'id'`.
- **Konvensi tes**: `npm test` = `node --test`, hanya modul MURNI `*.test.js` yang diuji (tanpa jsdom). Komponen JSX divalidasi lewat build + verifikasi browser. **Baseline saat ini: 192 pass, 0 fail** (target setelah Task 1: **197** = +5 tes `micSpectrum`).
- **Dev server**: sudah jalan di `http://localhost:5173` (kalau mati: `npm run dev -- --port 5174 --strictPort`).
- **Asumsi**: `getUserMedia` + `AnalyserNode` untuk spectrum — sudah diuji di headless Chrome repo ini (izin via CDP, `getUserMedia({audio:true})` sukses, `AnalyserNode.getByteFrequencyData` jalan). Kalau level suara tidak tersedia (izin ditolak / browser tanpa AudioContext), popup tetap muncul dengan bar animasi CSS (fallback) — mic & transkrip tetap jalan.
- **Catatan penting (bug yang dicegah)**: dengan `interimResults = true`, `onresult` dipanggil BANYAK kali (interim dulu, final belakangan). Kode lama `finish(texts)` di `onresult` pertama akan resolve dengan hasil interim/kosong → skor rusak. Karena itu `onresult` baru: kumpulkan HANYA `isFinal` → finish; selain itu tampilkan ke `interim`.

---

## Architecture / Proposed Approach

Tiga lapis (pola repo: logika murni → hook tipis → UI):

1. **`src/features/speaking/micSpectrum.js`** (MURNI, TDD) — `spectrumBars(freqData, barCount)` (byte frequency 0..255 → bar 0..1) + `displayHeights(bars, minPct)` (bar → tinggi % untuk CSS).
2. **`src/features/speaking/useMicLevel.js`** (hook browser) — `getUserMedia` → `AudioContext` + `AnalyserNode` → `requestAnimationFrame` (~30fps) → `spectrumBars`. Return `number[]` 0..1, atau `null` kalau tidak tersedia (fallback animasi CSS).
3. **`src/features/speaking/MicOverlay.jsx`** (UI, portal ke body) — props `{ open, interim, onCancel }`; ikon mic berdenyut + 20 bar spectrum + teks live + tombol Batal.
4. **`useSpeechRecognition.js`** dirombak (backward compatible): `interimResults: true`, state `interim`, `cancel()`; `listenOnce()` tetap resolve array transcript final; error `aborted` tidak lagi jadi error.
5. **Wiring**: `SpeakSession.jsx` + `PoemSession.jsx` merender `<MicOverlay open={listening} interim={interim} onCancel={cancel} />`.

---

## Step-by-step Tasks

Kerjakan berurutan. Commit di akhir tiap task (Conventional Commits, pesan Indonesia).

### Task 1 — Modul murni `micSpectrum.js` (TDD)

**Langkah 1a — tulis tes DULU** (harus GAGAL: module not found).

**File baru**: `src/features/speaking/micSpectrum.test.js`

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { MIC_BAR_COUNT, spectrumBars, displayHeights } from './micSpectrum.js';

test('spectrumBars: data kosong/null → semua nol sepanjang barCount', () => {
  assert.deepEqual(spectrumBars(null), new Array(MIC_BAR_COUNT).fill(0));
  assert.deepEqual(spectrumBars([], 4), [0, 0, 0, 0]);
  assert.equal(spectrumBars([1, 2, 3], 8).length, 8);
});

test('spectrumBars: nilai ekstrem → 0 atau 1', () => {
  assert.deepEqual(spectrumBars([0, 0, 0, 0], 2), [0, 0]);
  assert.deepEqual(spectrumBars([255, 255, 255, 255], 2), [1, 1]);
});

test('spectrumBars: rata-rata per band (band beda → bar beda)', () => {
  assert.deepEqual(spectrumBars([255, 255, 0, 0], 2), [1, 0]);
  assert.deepEqual(spectrumBars([0, 255, 0, 255], 2), [0.5, 0.5]);
});

test('spectrumBars: barCount tak wajar → minimal 1 bar', () => {
  assert.equal(spectrumBars([1, 2], 0).length, 1);
  assert.equal(spectrumBars([1, 2], -3).length, 1);
  assert.equal(spectrumBars([1, 2], NaN).length, 1);
});

test('displayHeights: minimum, clamp, dan input bukan array', () => {
  assert.deepEqual(displayHeights([0, 0.5, 1], 10), [10, 50, 100]);
  assert.deepEqual(displayHeights([1.5, -1], 8), [100, 8]);
  assert.deepEqual(displayHeights(null, 8), []);
});
```

Jalankan — **expected: GAGAL** (`Cannot find module './micSpectrum.js'`):

```bash
node --test src/features/speaking/micSpectrum.test.js
```

**Langkah 1b — implementasi.**

**File baru**: `src/features/speaking/micSpectrum.js`

```js
// micSpectrum.js — pengolahan data spektrum mikrofon (murni: tanpa DOM/Web Audio).
// Dipakai hook useMicLevel: byte frequency data (0..255) → tinggi bar 0..1
// untuk indikator spectrum di popup mic.

export const MIC_BAR_COUNT = 20;

// Bagi bin frekuensi menjadi `barCount` band sama lebar; tiap bar = rata-rata
// band dibagi 255 (0..1). Data kosong/null → semua nol; barCount tak wajar
// (0, negatif, NaN) → minimal 1 bar.
export const spectrumBars = (freqData, barCount = MIC_BAR_COUNT) => {
  const n = Math.max(1, Math.floor(barCount) || 1);
  const out = new Array(n).fill(0);
  const len = freqData?.length || 0;
  if (!len) return out;
  for (let b = 0; b < n; b++) {
    const start = Math.floor((b * len) / n);
    const end = Math.max(start + 1, Math.floor(((b + 1) * len) / n));
    let sum = 0;
    let count = 0;
    for (let i = start; i < end && i < len; i++) {
      sum += freqData[i];
      count += 1;
    }
    out[b] = count ? Math.min(1, sum / count / 255) : 0;
  }
  return out;
};

// Tinggi bar dalam persen (0..100) dengan minimum `minPct` supaya deret tetap
// terlihat saat senyap. bars bukan array → [] (pemanggil pakai fallback animasi).
export const displayHeights = (bars, minPct = 6) => {
  if (!Array.isArray(bars)) return [];
  const min = Math.max(0, Math.min(100, Number(minPct) || 0));
  return bars.map((v) => Math.max(min, Math.min(100, Math.round((Number(v) || 0) * 100))));
};
```

Jalankan lagi — **expected: PASS** (`# tests 5` … `# pass 5` … `# fail 0`):

```bash
node --test src/features/speaking/micSpectrum.test.js
```

Seluruh suite — **expected: `ℹ tests 197` / `ℹ pass 197` / `ℹ fail 0`** (192 baseline + 5):

```bash
npm test
```

Commit:

```bash
git add src/features/speaking/micSpectrum.js src/features/speaking/micSpectrum.test.js
git commit -m "feat(speaking): modul micSpectrum (bar level suara) + tes"
```

---

### Task 2 — Hook `useMicLevel`, komponen `MicOverlay`, rombak hook speech, wiring

**2a. File baru**: `src/features/speaking/useMicLevel.js`

```js
// useMicLevel.js — level suara mikrofon real-time untuk popup mic (hook browser).
// getUserMedia → AnalyserNode → rAF → spectrumBars. Return: number[] 0..1,
// atau null kalau level suara tidak tersedia (izin ditolak / tidak didukung) —
// pemanggil memakai fallback animasi CSS.
import { useEffect, useState } from 'react';
import { MIC_BAR_COUNT, spectrumBars } from './micSpectrum';

export function useMicLevel({ active = false, barCount = MIC_BAR_COUNT } = {}) {
  const [bars, setBars] = useState(null);

  useEffect(() => {
    if (!active) {
      setBars(null);
      return undefined;
    }
    const media = typeof navigator !== 'undefined' ? navigator.mediaDevices : null;
    const AudioCtor = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;
    if (!media?.getUserMedia || !AudioCtor) {
      setBars(null);
      return undefined;
    }

    let cancelled = false;
    let stream = null;
    let ctx = null;
    let analyser = null;
    let data = null;
    let raf = 0;
    let last = 0;

    const tick = (ts) => {
      if (cancelled) return;
      if (ts - last >= 33) {   // ~30fps: cukup halus, hemat render
        last = ts;
        analyser.getByteFrequencyData(data);
        setBars(spectrumBars(data, barCount));
      }
      raf = requestAnimationFrame(tick);
    };

    media.getUserMedia({ audio: true })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        ctx = new AudioCtor();
        // AudioContext dibuat di luar gesture click → bisa 'suspended';
        // user sudah klik tombol mic (sticky activation) jadi resume() jalan.
        if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
          const p = ctx.resume();
          if (p && typeof p.catch === 'function') p.catch(() => {});
        }
        const source = ctx.createMediaStreamSource(stream);
        analyser = ctx.createAnalyser();
        analyser.fftSize = 64;                 // 32 bin frekuensi
        analyser.smoothingTimeConstant = 0.7;
        source.connect(analyser);
        data = new Uint8Array(analyser.frequencyBinCount);
        raf = requestAnimationFrame(tick);
      })
      .catch(() => { if (!cancelled) setBars(null); });

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (ctx && ctx.state !== 'closed') ctx.close().catch(() => {});
    };
  }, [active, barCount]);

  return bars;
}

export default useMicLevel;
```

**2b. File baru**: `src/features/speaking/MicOverlay.jsx`

```jsx
// MicOverlay.jsx — popup saat mic aktif: ikon mic + spectrum level suara +
// teks yang sedang terdengar (interim Web Speech API) + tombol Batal.
// Di-portal ke document.body (pola GachaSlotOverlay) supaya `fixed` tidak
// terkurung transform milik parent (motion.div di session).
import { Mic } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useMicLevel } from './useMicLevel';
import { MIC_BAR_COUNT, displayHeights } from './micSpectrum';
import { useLanguage } from '../../context/LanguageContext';

export function MicOverlay({ open = false, interim = '', onCancel }) {
  const { language } = useLanguage();
  const id = language === 'id';
  const bars = useMicLevel({ active: open });
  if (!open) return null;

  const heights = displayHeights(bars);            // [] = level suara tidak tersedia
  const live = heights.length > 0;

  const overlay = (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="mic-overlay"
      className="fixed inset-0 z-[200] bg-sumi/60 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-sm bg-kinari border-[4px] border-sumi shadow-[8px_8px_0_0_#1a1a1a] p-6 flex flex-col items-center gap-4">
        <div className="w-20 h-20 bg-shu text-kinari-light border-[4px] border-sumi flex items-center justify-center animate-pulse">
          <Mic size={40} />
        </div>
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-sumi/60">
          {id ? 'Mendengarkan…' : 'Listening…'}
        </p>

        <div
          data-testid="mic-spectrum"
          data-live={live ? 'true' : 'false'}
          className="flex items-end justify-center gap-1 h-16 w-full border-b-[3px] border-sumi pb-1"
        >
          {(live ? heights : new Array(MIC_BAR_COUNT).fill(28)).map((h, i) => (
            <span
              key={i}
              className={`w-1.5 bg-shu ${live ? '' : 'animate-pulse'}`}
              style={live ? { height: `${h}%` } : { height: `${h}%`, animationDelay: `${i * 90}ms` }}
            />
          ))}
        </div>

        <div className="w-full min-h-[3.5rem] border-[3px] border-sumi bg-kinari-light px-4 py-3 text-center">
          {interim ? (
            <p className="text-lg font-serif font-bold text-sumi leading-relaxed">{interim}</p>
          ) : (
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sumi/40">
              {id ? 'Ucapkan sesuatu…' : 'Say something…'}
            </p>
          )}
        </div>

        <button
          type="button"
          data-testid="mic-cancel"
          onClick={onCancel}
          className="w-full py-3 bg-kinari text-sumi border-[3px] border-sumi font-black text-xs uppercase tracking-widest shadow-[3px_3px_0_0_#1a1a1a] active:translate-y-[2px] active:shadow-none transition-all"
        >
          {id ? 'Batal' : 'Cancel'}
        </button>
      </div>
    </div>
  );

  return typeof document === 'undefined' ? overlay : createPortal(overlay, document.body);
}

export default MicOverlay;
```

**2c. Rombak** `src/features/speaking/useSpeechRecognition.js` — **ganti seluruh isi file** dengan:

```js
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
```

**2d. Edit** `src/features/speaking/SpeakSession.jsx` — 3 ganti (cari → ganti):

```diff
-import { useSpeechRecognition } from './useSpeechRecognition';
+import { useSpeechRecognition } from './useSpeechRecognition';
+import { MicOverlay } from './MicOverlay';
```

```diff
-  const { listenOnce, listening, error, clearError, supported } = useSpeechRecognition();
+  const { listenOnce, listening, interim, error, clearError, cancel, supported } = useSpeechRecognition();
```

```diff
   return (
     <div className="max-w-2xl mx-auto px-4 sm:px-8 pt-14 pb-8 sm:py-16 min-h-screen flex flex-col">
+      <MicOverlay open={listening} interim={interim} onCancel={cancel} />
```

**2e. Edit** `src/features/speaking/PoemSession.jsx` — 3 ganti yang sama (cari → ganti):

```diff
-import { useSpeechRecognition } from './useSpeechRecognition';
+import { useSpeechRecognition } from './useSpeechRecognition';
+import { MicOverlay } from './MicOverlay';
```

```diff
-  const { listenOnce, listening, error, clearError, supported } = useSpeechRecognition();
+  const { listenOnce, listening, interim, error, clearError, cancel, supported } = useSpeechRecognition();
```

```diff
   return (
     <div className="max-w-2xl mx-auto px-4 sm:px-8 pt-14 pb-8 sm:py-16 min-h-screen flex flex-col">
+      <MicOverlay open={listening} interim={interim} onCancel={cancel} />
```

> Catatan: `<MicOverlay>` di-portal ke `document.body`, jadi posisi sisipnya tidak memengaruhi layout; baris `return (` + div itu **unik per file** (sudah diverifikasi: masing-masing 1 kemunculan).

**Verifikasi:**

```bash
npm run build
```

Expected: `✓ built in ...` tanpa error.

```bash
npm run lint 2>&1 | grep -cE "error" || true
```

Expected: `0`.

```bash
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```

Expected: `ℹ tests 197` / `ℹ pass 197` / `ℹ fail 0`.

Commit:

```bash
git add src/features/speaking/useSpeechRecognition.js src/features/speaking/useMicLevel.js src/features/speaking/MicOverlay.jsx src/features/speaking/SpeakSession.jsx src/features/speaking/PoemSession.jsx
git commit -m "feat(speaking): popup mic — spectrum level suara + transkrip live + tombol Batal"
```

---

### Task 3 — PRD + verifikasi akhir (termasuk browser)

**3a.** `PRD.md` — di `### 9.10 Speaking Practice (話)`, sisipkan satu bullet SETELAH baris yang berakhir `(readings split from `、`, okurigana markers handled).`:

```markdown
* **[EXISTING]** Mic popup while listening (`MicOverlay` in both `SpeakSession` and `PoemSession`): pulsing mic icon + real-time audio spectrum (`useMicLevel` — getUserMedia + AnalyserNode, bars from pure `micSpectrum.js`) + live interim transcript from the Web Speech API + a Cancel button.
```

**3b. Verifikasi browser (WAJIB — ini yang membuktikan popup, spectrum, dan teks live benar-benar jalan).**

Driver: Chrome headless + CDP (Node 24 punya `WebSocket` bawaan). Dua mode:

**Mode A — mekanik penuh (fake audio device, untuk membuktikan bar BENAR-BENAR bergerak):**

Jalankan Chrome headless dengan fake mic (device palsu yang menghasilkan gelombang suara bervariasi — sudah dibuktikan di repo ini: `max 127 / min 0 / 33 nilai unik` dalam 4 detik):

```
chrome --headless=new --remote-debugging-port=9226 --user-data-dir=<tmp> \
  --use-fake-device-for-media-stream --use-fake-ui-for-media-stream \
  http://localhost:5173/speaking
```

Di halaman itu: pasang mock SpeechRecognition via `Page.addScriptToEvaluateOnNewDocument`, reload, klik tile kana → tombol mic → lalu:

- sample tinggi bar dua kali (t≈800ms dan t≈1600ms): `[...document.querySelectorAll('[data-testid="mic-spectrum"] span')].map(s => s.style.height)` → **kedua sampel harus BERBEDA** (bar bergerak mengikuti suara) ✔
- `data-live` = `"true"` ✔

**Mode B — alur popup/transkrip (mock SpeechRecognition + izin via CDP):**

1. Grant izin mic: `cdp('Browser.grantPermissions', origin='http://localhost:5173', permissions=['audioCapture'])`.
2. **Mock SpeechRecognition SEBELUM app dimuat** (`Page.addScriptToEvaluateOnNewDocument`), lalu buka `/speaking`:

```js
(() => {
  const mk = (t, f) => { const r = [{ transcript: t }]; r.isFinal = f; return r; };
  window.SpeechRecognition = class {
    constructor() { this.onresult = null; this.onerror = null; this.onend = null; }
    start() {
      setTimeout(() => { this.onresult && this.onresult({ results: [mk('こんにち', false)] }); }, 700);
      setTimeout(() => { this.onresult && this.onresult({ results: [mk('こんにちは', true)] }); }, 1600);
      setTimeout(() => { this.onend && this.onend(); }, 1900);
    }
    stop() {}
    abort() { this.onend && this.onend(); }
  };
  delete window.webkitSpeechRecognition;
})();
```

3. Klik tile kana (mis. あ) → sesi terbuka → klik tombol mic (teks `Ucapkan`/`Speak`).
4. **Saat listening** (t ≈ 1000ms setelah klik) — assert di DOM:
   - `[data-testid="mic-overlay"]` ADA (popup muncul) ✔
   - `[data-testid="mic-spectrum"]` ADA, jumlah `<span>` bar = **20**, `data-live` = `"true"` ✔
   - teks popup memuat `こんにち` (interim live) ✔
5. **Setelah final** (t ≈ 2200ms):
   - `[data-testid="mic-overlay"]` HILANG (popup tutup sendiri) ✔
   - halaman memuat `こんにちは` (kotak hasil: "Terdengar: こんにちは") ✔
6. **Tombol Batal**: klik mic lagi → popup muncul → klik `[data-testid="mic-cancel"]` → popup HILANG, TIDAK ada kotak error, tombol mic kembali normal (enabled) ✔
7. **PoemSession**: tab `Puisi 詩` → buka puisi → klik tombol mic baris (`button[title="Ucapkan baris ini"]`) → popup muncul ✔ → Batal.
8. **0 console error, 0 page error** sepanjang langkah di atas.

**3c.** Jalankan seluruh gate terakhir:

```bash
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"
npm run build 2>&1 | tail -2
npm run lint 2>&1 | grep -cE "error" || true
```

Expected: `197/197/0` · `✓ built in ...` · `0`.

**3d.** Tambahkan section **"Log Eksekusi"** di akhir file plan ini (hash commit per task + hasil gate + bukti browser). Plan TIDAK di-commit (aturan repo).

Commit:

```bash
git add PRD.md
git commit -m "docs(prd): 9.10 popup mic — spectrum level suara + transkrip live"
```

---

## Tests / Validation

- **Unit (TDD)**: `src/features/speaking/micSpectrum.test.js` — 5 tes (data kosong, ekstrem 0/255, rata-rata band, barCount tak wajar, displayHeights min/clamp/fallback). Sudah dibuktikan PASS di sandbox (5/5) sebelum plan ini ditulis.
- **Regresi**: `npm test` → **197 pass, 0 fail** (192 baseline + 5).
- **Build & lint**: `npm run build` sukses; `npm run lint` 0 error (warning lama di file lain diabaikan).
- **Browser (bukan cuma build)**: checklist 3b — popup muncul saat mic, 20 bar spectrum dengan `data-live="true"`, teks interim `こんにち` tampil live, hasil final `こんにちは` muncul, Batal menutup popup tanpa error, PoemSession ikut dapat popup, 0 console/page error.
- **Kenapa tidak ada tes React**: repo ini hanya menguji modul murni dengan `node --test` (tanpa jsdom); komponen/hook browser divalidasi lewat build + verifikasi browser — konsisten dengan fitur speaking/learn yang ada.
- **Sudah diverifikasi sebelum plan ditulis** (biar tidak ada kejutan saat eksekusi):
  - 5/5 tes `micSpectrum` PASS di sandbox (dijalankan ulang dari blok plan ini: 5/5 PASS);
  - semua file baru + hasil simulasi edit `SpeakSession`/`PoemSession` **lolos parse** (`@babel/parser` + `plugins:['jsx']`);
  - string edit di kedua session **tepat 1 kemunculan** (grep count = 1);
  - `getUserMedia` + `AnalyserNode` **terbukti jalan** di headless Chrome repo ini, dan dengan `--use-fake-device-for-media-stream` level-nya **bervariasi** (max 127 / min 0 / 33 nilai unik dalam 4 detik) → bar spectrum memang akan bergerak;
  - anchor PRD tepat 1 kemunculan di `PRD.md` baris 154;
  - `lucide-react` mengekspor `Mic`; `createPortal` sudah dipakai di repo (pola GachaSlotOverlay); z-index `200` aman (di atas TopControls `z-50` & effect layer `z-[100]`, di bawah Gacha `z-[300]`).

## Risks, Tradeoffs, and Open Questions

- **Dua akses mic bersamaan**: `SpeechRecognition` + `getUserMedia` (spectrum) memakai mic yang sama. Di Chrome/Edge keduanya bisa jalan bareng (device sama). Kalau `getUserMedia` gagal/ditolak, popup tetap tampil dengan bar animasi CSS (`data-live="false"`) — transkrip tetap jalan. Bukan blocker.
- **Prompt izin dobel (first run)**: Chrome menampilkan satu prompt per origin; `rec.start()` dan `getUserMedia` memakai izin mic yang sama. Setelah user izinkan sekali, tidak ada prompt lagi.
- **`interimResults: true` mengubah perilaku `onresult`** (dipanggil berkali-kali). Sudah ditangani: hanya `isFinal` yang di-finish; interim ditampilkan. `listenOnce()` tetap resolve array transcript final dengan bentuk yang sama → tidak ada perubahan kontrak untuk pemanggil.
- **`aborted` bukan error lagi**: abort dari Batal (atau abort internal di awal `listenOnce`) kini selesai diam-diam. Sebelumnya `setError('aborted')` sempat muncul sesaat; tidak ada UI yang bergantung pada itu.
- **Tradeoff spektrum**: `fftSize 64` (32 bin → 20 bar) + smoothing 0.7 → responsif tapi tidak "audio-analyzer presisi". Cukup untuk indikator "mic nyala".
- **Open question (default aman)**: popup muncul selama state `listening` (dari klik sampai hasil final / error / Batal) — bukan timer terpisah. Kalau user mau popup menetap lebih lama setelah hasil, itu perubahan terpisah.

---

## Log Eksekusi (27/09/2026)

Dikerjakan 01:12–01:35 (~23 menit), 3 task berurutan + TDD + commit per task.

| Task | Commit | Gate |
|---|---|---|
| T1 micSpectrum (TDD) | `376e7f8` | RED (`ERR_MODULE_NOT_FOUND`) → GREEN, 5/5 ✔, suite 197 |
| T2 hook + overlay + rombak speech hook + wiring | `a69e580` | build ✓, lint 0 error, 197/197 |
| T3 PRD + verifikasi | `d3f34fe` | 1 bullet PRD ✔ |
| Fix guard settled (temuan verifikasi) | `351ef7f` | 197/197, build ✓, lint 0 |

**Verifikasi browser (Chrome headless + CDP, fake audio device + mock SpeechRecognition — bukan sekadar build):**

Fase 1 — `SpeakSession` (kana あ):
- Popup `[data-testid="mic-overlay"]` muncul saat mic ✔
- Spectrum: 20 bar, `data-live="true"` ✔
- **Bar BENAR-BENAR bergerak** mengikuti suara: sampel-1 semua `6%` → sampel-2 `79%/72%/62%/49%/42%/44%/31%/6%…` ✔
- Transkrip live: teks `こんにち` (interim) tampil di popup ✔
- Setelah final: popup tutup sendiri, halaman menampilkan `Terdengar` + verdict ✔
- Tombol Batal: popup tutup, TIDAK ada kotak error, tombol mic kembali enabled ✔

Fase 2 — `PoemSession` (古池や):
- Popup muncul dari tombol mic baris ✔, 20 bar + `data-live="true"` ✔
- Bar bergerak: `100%,97%,87%…` → `74%,58%,6%…` ✔
- Batal: popup tutup tanpa error ✔

- **0 console error, 0 page error** sepanjang kedua fase ✔

**Temuan saat verifikasi (diperbaiki, bukan didiamkan):** event `onresult`/`onerror` yang datang terlambat setelah sesi selesai/dibatalkan bisa menulis `interim` basi → ditambah guard `if (settled) return;` di kedua handler (commit `351ef7f`).

**Catatan:** plan TIDAK di-commit (aturan repo). Tidak ada push (menunggu perintah). Verifikasi memakai selector case-insensitive karena CSS `uppercase` mengubah `innerText` tombol (`Ucapkan` → `UCAPKAN`).

## Follow-up — keluhan "soal gak keliatan jujur" (commit `dbbe09b`)

**Diagnosa terukur (headless Chrome 390×844, fake mic):** panel mic dulu full-screen `fixed inset-x-0 bottom-0` + scrim `bg-sumi/60` → menutupi soal (overlap=true; panel y0–429 vs soal y113–233) dan memblokir scroll halaman.

**Fix:**
- `MicOverlay` → bottom sheet kompak (`max-w-md`, wrapper `pointer-events-none`), tanpa scrim; soal tembus klik.
- `SpeakSession`/`PoemSession` → clearance bawah `pb-44` saat listening.
- `PoemSession` → auto-scroll baris yang diucapkan ke tengah viewport (`data-poem-line` + `scrollIntoView({block:'center'})`).
- Guard: tombol Listen/Skip (SpeakSession) & speaker per baris (PoemSession) disabled saat mic nyala — cegah double-skip & TTS bocor ke mic.

**Verifikasi browser (headless, fake mic + mock SpeechRecognition):**
- SpeakSession 390×844: soal `あ` y190–270 vs panel y527–693 → overlap **false**, `hitOnSoal` **true**, interim `あ` live, 20 bar, **0 console error**, Batal bersih (mic kembali enabled).
- PoemSession 390×620 (viewport pendek): baris terakhir (idx 2) y179–291 vs panel y303–469 → overlap **false**, `lineFullyVisible` **true**, gap 12px, auto-scroll `scrollY=301`, interim live.
- Screenshot: soal terlihat penuh, tanpa lapisan gelap.

**Gate:** build ✓ (9.53s) · lint 0 error · **197/197** tes.
