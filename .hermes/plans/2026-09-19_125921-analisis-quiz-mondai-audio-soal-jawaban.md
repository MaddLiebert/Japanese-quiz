# Analisis Quiz Mondai: Audio, Soal, dan Jawaban

## Goal
Verifikasi bahwa 87 item quiz Mondai di `src/data/mondai.json` memiliki file audio yang sesuai, soal yang tepat, dan `correctIndex` yang benar.

## Current Context / Assumptions
- App: Vite + React, Japanese quiz dengan desain neo-brutalist.
- Data quiz: `src/data/mondai.json` (87 item, `m01`–`m87`).
- Struktur tiap item: `id`, `chapter`, `title`, `audio` (path), `questionText`, `options` (4 string), `correctIndex`, `explanation`, `dialogScript`.
- File audio: `public/audio/*.mp3` (dev via `/audio/...`, build ke `dist/audio/`).
- Komponen `src/features/quiz/MondaiQuiz.jsx` membaca `mondai.json` langsung.
- Observasi awal:
  - Item `m01` punya `options` unik dan `correctIndex: 2`.
  - Item `m02`–`m87` semuanya punya 4 opsi identik (`はい、そうです。` / `いいえ、ちがいます。` / `わかりました。` / `どうぞよろしくおねがいします。`) dan `correctIndex: 0` — belum tentu benar, harus diverifikasi.
  - `dialogScript` hanya penjelasan; konten audio belum tentu sama.
- Environment (sudah dicek, semua tersedia — tidak perlu install apa pun):
  - Python 3.11.16, `faster-whisper` 1.2.1, `av` 18.1.0 terpasang di venv Hermes: `C:/Users/maddo/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe` (ffmpeg tidak dibutuhkan — decode via PyAV).
  - Machine 4GB RAM → model `base` int8 (~150MB, diunduh sekali), CPU-only. Jangan pakai `medium`/`large`.
  - Node tersedia (project npm).

## Architecture / Proposed Approach
1. `check-mondai.js` (Node): validasi konsistensi dasar — file audio ada, `correctIndex` dalam rentang, 4 opsi, `title` cocok nama file.
2. `scripts/transcribe-mondai.py` (Python, faster-whisper, `language="ja"`): transkripsi semua 87 audio, lalu match tiap transkrip terhadap 4 opsi (substring after normalization + fallback similarity). Hasil: report `reports/mondai-transcripts.json` + daftar mismatch (`correctIndex` sekarang vs `bestIndex`).
3. Update `correctIndex` di `src/data/mondai.json` untuk item mismatch yang high-confidence.
4. Fallback: item ambigu (skor berdekatan / tidak ada substring match) → dengar manual file spesifiknya, lalu update.

## Step-by-Step Tasks

### Task 1: Script validasi `check-mondai.js` (2-3 mnt)
Buat file `check-mondai.js` di root proyek:

```js
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const dataPath = join(process.cwd(), 'src', 'data', 'mondai.json');
const audioDir = join(process.cwd(), 'public', 'audio');

const data = JSON.parse(readFileSync(dataPath, 'utf8'));
const issues = [];

data.forEach((item) => {
  const audioFile = join(audioDir, item.audio.replace(/^\/audio\//, ''));
  if (!existsSync(audioFile)) issues.push(`[${item.id}] Audio tidak ditemukan: ${item.audio}`);
  if (item.correctIndex < 0 || item.correctIndex >= item.options.length) issues.push(`[${item.id}] correctIndex ${item.correctIndex} di luar rentang 0-${item.options.length - 1}`);
  if (item.options.length !== 4) issues.push(`[${item.id}] Jumlah opsi bukan 4 (sekarang ${item.options.length})`);
  if (!item.questionText || item.questionText.trim() === '') issues.push(`[${item.id}] questionText kosong`);
  if (!item.title || !item.audio.includes(item.title)) issues.push(`[${item.id}] Title "${item.title}" tidak cocok dengan nama audio "${item.audio}"`);
  if (!item.dialogScript || item.dialogScript.length === 0) issues.push(`[${item.id}] dialogScript kosong`);
});

if (issues.length === 0) {
  console.log('Semua cek lolos. Tidak ada masalah ditemukan.');
} else {
  console.log(`Ditemukan ${issues.length} masalah:`);
  issues.forEach((m) => console.log('  - ' + m));
}
```

Verifikasi: `node check-mondai.js` → (error, atau) `Semua cek lolos. Tidak ada masalah ditemukan.`

### Task 2: Perbaiki masalah konsistensi (2-5 mnt)
Hanya jika Task 1 menemukan error:
- File audio hilang → pastikan ada di `public/audio/` (salin dari `dist/audio/` bila perlu).
- `correctIndex` out-of-range → set `0` sementara (akan dikoreksi Task 4 dari transkrip).
- Jumlah opsi bukan 4 / title tidak cocok / field kosong → perbaiki di `src/data/mondai.json`.
- Ulangi `node check-mondai.js` sampai bersih.

### Task 3: Transkripsi + matching `scripts/transcribe-mondai.py` (10-15 mnt setup, 15-40 mnt runtime)
Buat file `scripts/transcribe-mondai.py`:

```python
"""Transcribe all mondai audio and diff correctIndex against the transcript.

Usage:  python scripts/transcribe-mondai.py
Output: reports/mondai-transcripts.json + mismatch table on stdout.
"""
import difflib
import json
import re
from pathlib import Path

from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parent.parent
data = json.loads((ROOT / "src" / "data" / "mondai.json").read_text(encoding="utf-8"))
model = WhisperModel("base", device="cpu", compute_type="int8")

PUNCT = r"[、。．．\s.!?,?「」『』・〜～()（）""]"


def norm(s: str) -> str:
    return re.sub(PUNCT, "", s)


report, mismatches = [], []
for i, item in enumerate(data):
    audio = ROOT / "public" / "audio" / item["audio"].split("/")[-1]
    segments, _ = model.transcribe(str(audio), language="ja", vad_filter=True)
    transcript = "".join(seg.text for seg in segments)
    n = norm(transcript)

    scores = []
    for opt in item["options"]:
        no = norm(opt)
        # opsi frasa pendek: substring = kecocokan penuh; fallback similarity
        scores.append(1.0 if no in n else difflib.SequenceMatcher(None, no, n).ratio())

    best = max(range(4), key=lambda j: scores[j])
    entry = {
        "id": item["id"],
        "title": item["title"],
        "transcript": transcript,
        "scores": [round(s, 3) for s in scores],
        "currentIndex": item["correctIndex"],
        "bestIndex": best,
        "topGap": round(scores[best] - max(s for j, s in enumerate(scores) if j != best), 3),
    }
    report.append(entry)
    print(f"[{i + 1}/{len(data)}] {item['id']} best={best} cur={item['correctIndex']} gap={entry['topGap']}")
    if best != item["correctIndex"]:
        mismatches.append(entry)

out = ROOT / "reports" / "mondai-transcripts.json"
out.parent.mkdir(exist_ok=True)
out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

print(f"\nSelesai: {len(report)} item. Mismatch: {len(mismatches)}")
for m in mismatches:
    print(f'  {m["id"]} current={m["currentIndex"]} best={m["bestIndex"]} '
          f'scores={m["scores"]} gap={m["topGap"]}')
    print(f'    transkrip: {m["transcript"][:120]}')
```

Jalankan (biarkan jalan; ~44 menit audio total, base int8 di CPU 4GB → 15-40 menit; jalankan sebagai background/long-running, jangan diblok):

```
C:/Users/maddo/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe scripts/transcribe-mondai.py
```

Output yang diharapkan:
- Progress baris per item: `[1/87] m01 best=2 cur=2 gap=...` dst.
- Akhiri dengan: `Selesai: 87 item. Mismatch: N` + daftar `id`, skor, potongan transkrip.
- File `reports/mondai-transcripts.json` berisi 87 entri (id, transcript, scores, currentIndex, bestIndex, topGap).

### Task 4: Update `correctIndex` dari hasil transkripsi (5-15 mnt)
Baca `reports/mondai-transcripts.json`:
- **High-confidence** (`best != current` DAN `topGap >= 0.5` DAN transkrip mengandung opsi best secara substring): update `correctIndex` di `src/data/mondai.json`. Perbarui `explanation` bila menyebut jawaban lama yang jelas salah.
- **Ambigu** (`topGap < 0.5`, atau dua opsi ber-skor 1.0, atau tidak ada substring match): jangan ubah otomatis. Kumpulkan daftarnya; putar audio `public/audio/<file>` manual, dengarkan, lalu set `correctIndex`.
- Cross-check: jika transkrip jauh berbeda dari `dialogScript` item yang sama → tandai item itu (audio vs script tidak sinkron), masukkan ke daftar review.
- Etnom check atribusi: soal Kaiwa yang menanyakan ucapan satu pembicara — STT tidak memberi label pembicara; bagi item yang jawaban benar bergantung siapa yang bicara, wajib dengar manual.

### Task 5: Verifikasi akhir (3-5 mnt)
1. `node check-mondai.js` → `Semua cek lolos. Tidak ada masalah ditemukan.`
2. `npm run lint` → exit 0.
3. `npm run build` → exit 0, `dist/` ter-update.
4. Dengarkan ulang 3-5 item yang `correctIndex`-nya baru diubah; pastikan jawaban yang ditandai benar.

## Tests / Validation
- Task 1: `node check-mondai.js` (perintah + output di atas).
- Task 3: exit 0, `reports/mondai-transcripts.json` mengandung 87 entri — cek: `python -c "import json;print(len(json.load(open('reports/mondai-transcripts.json',encoding='utf-8'))))"` → `87`.
- Task 5: ketiga command + dengar ulang sample.
- Commit per task (1 commit per task setelah verif lulus) bila repo version-controlled dan user setuju.

## Risks, Tradeoffs, Open Questions
- **Akurasi STT**: model `base` bisa salah 1-2 kata. Mitigasi: `vad_filter=True`, match substring + similarity fallback, threshold `topGap` sebelum auto-update. Kalau banyak item ambigu → ulang Task 3 dengan model `small` (lebih akurat, ~2x lebih lambat).
- **4GB RAM**: `base` int8 aman (~0.5-1GB). Jangan naik ke `medium`/`large`.
- **Atribusi pembicara**: STT mono tidak melabeli suara; item yang jawabannya bergantung siapa yang bicara wajib manual.
- **Run time**: 15-40 menit untuk transkripsi; jalankan long-running, jangan blok.
- **Open question**: 
  1. Ada kunci jawaban (buku teks/answer key) untuk cross-check hasil transkrip?
  2. Apakah `dialogScript` memang placeholder generik (sekarang semua item m02+ script-nya hampir sama "第N課のリスニング問題です") dan perlu di-refresh sesuai transkrip?
