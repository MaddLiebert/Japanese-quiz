# Voice cinematic 多元 — narator Saku 咲

7 klip per-baris (`01_world` … `07_welcome`), diputar oleh `AnimeCinematic`
pada detik absolut barisnya. Di-wire dari
`src/features/cinematic/anime/data/scenes.js` (`line.voice`).

**Sumber: rekaman Saku ASLI.** `voice-source/anime/saku.mp3` (69.88s) dipotong
jadi 7 klip dengan `scripts/split-voice.py` (pola sama Heian/Meiji/Shōwa).
**Jangan** jalankan `scripts/generate-anime-voice.py` (TTS) — akan menimpa
rekaman asli. Kalau perlu regenerate: lihat `docs/voice-cinematic-anime.md` §3.

| klip | durasi | gap | | klip | durasi | gap |
|---|---|---|---|---|---|---|
| 01_world | 2.77s | 2.8s | | 05_grow | 2.46s | 4.0s |
| 02_turn | 3.55s | 10.6s | | 06_era | 2.17s | 2.8s |
| 03_stories | 2.95s | 15.8s | | 07_welcome | 1.99s | 7.6s |
| 04_choose | 2.09s | 15.8s | | | | |

Tiap klip **< gap**-nya (supaya tak menimpa baris berikutnya).
