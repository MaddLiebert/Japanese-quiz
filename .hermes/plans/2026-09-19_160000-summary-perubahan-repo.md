# Summary Perubahan Repositori (Recent Changes)

## Goal
Dokumentasi ringkasan perubahan fitur, dataset, dan perbaikan kode terbaru di repository `japanese-quiz`.

## Current Context
Perubahan terkonsentrasi pada fitur baru **Mondai (Listening Quiz)** Bab 1-25 Minna no Nihongo (87 audio) serta pembersihan codebase.

---

## Rincian Perubahan per Komit

### 1. `7e3dd67` - feat(mondai): redesign all 87 quiz items with audio-specific questions and options
- **Transkripsi Audio**: 87 file audio di-transkrip memakai `faster-whisper` (`reports/mondai-transcripts.json`).
- **Koreksi Kunci Jawaban**: Memperbaiki 10 soal yang salah kunci jawaban (`m21`, `m51`, `m55`, `m60`, `m62`, `m65`, `m77`, `m78`, `m80`, `m81`).
- **Redesain 74 Soal Generic (NO_MATCH)**: Dibuatkan pertanyaan, pilihan jawaban, penjelasan, dan naskah dialog spesifik berdasarkan isi audio.
- **Dataset Update**: `src/data/mondai.json` kini lengkap dengan `questionText`, `options`, `correctIndex`, `explanation`, `dialogScript`.
- **Validasi & Pipeline**: Ditambahkan `check-mondai.js`, `scripts/transcribe-mondai.py`, `scripts/analyze-mondai.py`, `scripts/design-mondai-questions.py`.

### 2. `0c3ed33` - feat(mondai): automate 87 audio questions dataset, sync audio locking, and integrate progress scoring
- **Generator**: Menambahkan `scripts/generate_mondai.js`.
- **Integrasi UI**: Update `src/features/quiz/MondaiQuiz.jsx` untuk lock opsi saat audio berputar dan pencatatan skor progress.

### 3. `e3be3a4` - chore: remove unused imports/variables
- **Refactoring & Cleanup**: Hapus import/variabel tidak terpakai pada `src/pages/Home.jsx`, `src/pages/Practice.jsx`, dan `src/pages/Review.jsx`.

### 4. `db943cd` - fix(mondai/learn): resolve audio playback, dark mode tokens, and quiz result UI
- **Audio Assets**: Ditambahkan 87 file `.mp3` Bab 1-25 di `public/audio/`.
- **Komponen Baru**:
  - `src/components/MondaiComponents.jsx`: Audio player, feedback box, navigation bar, option selector.
  - `src/features/quiz/MondaiQuiz.jsx`: Main container untuk quiz listening mondai.
- **Routing & Home**: Integrasi Mondai ke menu `Home.jsx`, `Learn.jsx`, dan `App.jsx`.
- **Dark Mode & Styling**: Sinkronisasi token dark mode neo-brutalist (cream `#FAFAFA`, red `#E60012`, dark `#18181B`).
- **Audio Utility**: `src/utils/audio.js` untuk manajemen play/pause/reset audio.

---

## Status Repo Terkini
- **Branch**: `main` (synced with `origin/main`).
- **Build / Lint**: PASS (`npm run lint`, `npm run build`).
- **Untracked files**: Script dan dump sementara dari proses analisis/debugging (`.tmp*`, `_dump*`, `scripts/_*`).
