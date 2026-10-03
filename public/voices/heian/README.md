# Voice cinematic Heian 平安 — SUDAH TERPASANG

Sumber: `saku.mp3` (51s, satu narasi panjang) → dipecah jadi 6 klip per-baris.
File mentah disimpan di `voice-source/heian/saku.mp3` (DI LUAR `public/` supaya
tidak ikut di-precache PWA — hanya klip terpakai yang masuk bundle).

## Cara memotong ulang (kalau saku.mp3 diganti)

```bash
python scripts/split-voice.py voice-source/heian/saku.mp3 public/voices/heian \
  --names 01_year,02_capital,03_court,04_kana,05_turn,06_era
```
Default `--min-sil 0.8` (penting: saku punya jeda internal ~0.48s di dalam
kalimat 4 yang TIDAK boleh dianggap pemisah). Lihat `python scripts/split-voice.py --help`.

## Klip terpasang (diputar pada detik `at` barisnya)

| File | Baris | Teks | Bacaan kana | Muncul |
|------|-------|------|-------------|--------|
| `01_year.mp3` ⚑  | capital/year    | 794年 | ななひゃくきゅうじゅうよねん | 0.5s |
| `02_capital.mp3` | capital/capital | 都は、平安京へ。 | みやこは、へいあんきょうへ。 | 3.2s |
| `03_court.mp3`   | court/court     | 貴族たちは、宮廷に文化を咲かせた。 | きぞくたちは、きゅうていに ぶんかを さかせた。 | 9.8s |
| `04_kana.mp3`    | kana/kana       | かなは、日本の言葉を記す新たな道を開いた。 | かなは、にほんの ことばを しるす あらたな みちを ひらいた。 | 17.8s |
| `05_turn.mp3`    | change/turn     | そして、時代は変わる。 | そして、じだいは かわる。 | 27.1s |
| `06_era.mp3`     | change/era      | 平安時代 | へいあんじだい | 31.9s |

## BELUM ADA ASET

| Baris | Teks | Bacaan kana | Muncul |
|-------|------|-------------|--------|
| change/welcome | ようこそ、平安へ。 | ようこそ、へいあんへ。 | 34.5s |

`saku.mp3` **tidak memuat** kalimat ini (audio berhenti setelah `へいあんじだい`).
Saat ini baris itu tampil sebagai teks tanpa voice (no-op, tanpa error).

**Cara menambah:** generate satu klip `ようこそ、へいあんへ。`, taruh sebagai
`public/voices/heian/07_welcome.mp3`, lalu di `data/scenes.js` tambahkan
`voice: '/voices/heian/07_welcome.mp3'` pada baris `welcome`. Tes
`voiceCues: tiap file voice benar-benar ada di public/` langsung menjaga path-nya.

Total cinematic = 38s (scene start 0 / 9 / 17 / 26.5).

## Catatan aset
⚑ `01_year.mp3` (794年) **diganti manual** dari `Downloads/heian/nana hyaku.mp3`
(2.72s) — bukan hasil potong `saku.mp3`, karena rekaman lama dinilai kurang.
Sumber disimpan di `voice-source/heian/nana_hyaku.mp3`. Kalau perlu potong ulang
seluruh narasi, ingat klip ini di-override manual (jangan ikut ter-timpa).
`yokoso.mp3` (→ `07_welcome.mp3`) juga sumber terpisah, bukan dari `saku.mp3`.

## Model data
Voice disimpan **per-BARIS** (`line.voice`), bukan per-scene — karena scene
`change` punya 3 baris berjarak jauh (turn/era/welcome) yang butuh klip sendiri.
Diputar oleh orchestrator (`HeianCinematic`) lewat `playClipFile` (utils/sfx.js),
dijadwalkan pada `sceneStart + line.at`.

Jam cinematic DITAHAN sampai AudioContext `running` (resume setelah gesture
pertama) supaya baris pertama (0.5s) tidak terlewat — ada fallback 1.5s agar
cinematic tetap jalan tanpa suara bila audio diblokir.

## Kalau perlu split ulang: jeda ≥ 0.8s
`split-voice.py` memotong di SENYAP (default: −35 dB, ≥ 0.8s). Jeda ≥ 0.8s
antar baris membuat pemotongan andal; jeda < 0.8s dianggap satu kalimat.
