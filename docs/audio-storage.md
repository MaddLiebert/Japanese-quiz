# Audio di Supabase Storage

Audio MNN (87 file, **165 MB**) **tidak lagi ikut ke-deploy Vercel**. File-nya
dilayani dari **Supabase Storage** (bucket publik `audio`).

## Kenapa

Jatah *Deployment Storage* Vercel Hobby cuma **10 GB**. Vite menyalin seluruh
`public/` ke `dist/`, jadi tiap deploy ~**181 MB** (audio 165 MB) → jatah habis
setelah ~56 deploy. Setelah audio dipindah: tiap deploy ~**17 MB**.

| | Sebelum | Sesudah |
|---|---|---|
| `dist/` (per deploy) | 181 MB | **17 MB** |
| PWA precache | 725 entri / 181 MB | 225 entri / 3.1 MB |
| `.git` | 178 MB | ~13 MB |

## Cara kerja di kode

`src/utils/audioBase.js` — murni, diuji (`node --test src/utils/audioBase.test.js`):

```
VITE_AUDIO_BASE_URL kosong  → /audio/x.mp3          (lokal, dev/offline)
VITE_AUDIO_BASE_URL diisi   → <base>/x.mp3          (Supabase Storage)
```

Dipanggil dari:
- `src/components/MondaiComponents.jsx` → `<AudioPlayer>` (`src={resolvedSrc}`)
- `src/utils/audio.js` → `playAudioFile()`

Nama file MNN mengandung spasi → otomatis di-`encodeURIComponent` per segmen.

## Setup (sekali saja)

### 1. Buat bucket publik
Supabase → **Storage** → **New bucket** → nama `audio` → **Public bucket: ON**.

### 2. Upload 87 file
Via script (butuh `SUPABASE_SERVICE_ROLE_KEY` dari Supabase → Settings → API):

```bash
SUPABASE_URL=https://<ref>.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
node scripts/upload-audio.mjs
```

Atau drag-drop folder `public/audio/` ke bucket `audio` di dashboard.

> Bucket **publik** cukup — audio ini aset statis yang memang untuk didengar
> semua pengguna. Jangan taruh kredensial di bucket ini.

### 3. Set env
`.env` (lokal) **dan** Vercel → Settings → Environment Variables (Production):

```
VITE_AUDIO_BASE_URL=https://<ref>.supabase.co/storage/v1/object/public/audio
```

### 4. Redeploy
Vite meng-*inline* `VITE_*` saat build → nama bundle berubah = env masuk.

## Cek cepat

```bash
curl -sI "https://<ref>.supabase.co/storage/v1/object/public/audio/01%20Dai%201%20Ka%20-%20Kaiwa.mp3" | head -3
# harus 200 + content-type: audio/mpeg
```

## Dev lokal tanpa Supabase

Biarkan `VITE_AUDIO_BASE_URL` kosong → app memakai `public/audio/` lokal.
File audio tetap ada di mesin (cuma di-*gitignore* + dibuang dari `dist/`).
