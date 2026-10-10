# Voice cinematic 多元 — kana + gap per detik (narasi Saku 咲)

Narator: **Saku 咲** · 7 baris · total **69.0s** (babak 1 `tear` = 9s tanpa suara).
Sumber timing (authoritative): `src/features/cinematic/anime/data/scenes.js` →
`voiceCues()`.

**Rekaman asli:** `voice-source/anime/saku.mp3` (69.88s) — 7 baris dengan jeda
alami. Dipotong jadi 7 klip di `public/voices/anime/` via `scripts/split-voice.py`.

## Tabel: kana + gap per detik

`abs` = detik absolut di seluruh cinematic (= start scene + `line.at`). App
memutar tiap baris sebagai **klip terpisah** pada `abs` ini. `gap→next` = jeda ke
baris berikutnya = **batas atas durasi** klip (klip N harus < gap agar tak menimpa
N+1).

| # | file | Kana (naskah) | abs | klip | gap→next |
|---|---|---|---|---|---|
| 1 | `01_world.mp3` | ページの むこうに、せかいが ある。 | 9.6 | 2.77 | 2.8 |
| 2 | `02_turn.mp3` | ここは じだいじゃない。せかいだ。 | 12.4 | 3.55 | 10.6 |
| 3 | `03_stories.mp3` | いくつもの ものがたりが、まっている。 | 23.0 | 2.95 | 15.8 |
| 4 | `04_choose.mp3` | どの せかいへ、いく？ | 38.8 | 2.09 | 15.8 |
| 5 | `05_grow.mp3` | せかいが、ふえていく。 | 54.6 | 2.46 | 4.0 |
| 6 | `06_era.mp3` | たげん — せかいが ふえる | 58.6 | 2.17 | 2.8 |
| 7 | `07_welcome.mp3` | ようこそ、たげんへ。 | 61.4 | 1.99 | 7.6 (ekor) |

> `abs` = start scene (tear 0 · burst 9 · montage 22 · worlds 38 · finale 54) + `at`.
> Semua klip **< gap** ✓. Klip 1 dipangkas ke 2.77s agar muat (pidato berakhir ~2.68s).

## Blok naskah (kana, satu baris per klip)

```
ページの むこうに、せかいが ある。
ここは じだいじゃない。せかいだ。
いくつもの ものがたりが、まっている。
どの せかいへ、いく？
せかいが、ふえていく。
たげん — せかいが ふえる
ようこそ、たげんへ。
```

## Cara potong dari rekaman asli

```bash
python scripts/split-voice.py voice-source/anime/saku.mp3 .hermes/_anime-voice-split \
  --names 01_world,02_turn,03_stories,04_choose,05_grow,06_era,07_welcome --min-sil 0.8
# salin 7 klip → public/voices/anime/ , verifikasi tiap klip < gap (§ tabel)
```

Jangan jalankan `scripts/generate-anime-voice.py` (TTS) — akan menimpa rekaman asli.

## Catatan: kenapa tidak digabung ulang jadi 1 mp3 timeline presisi?

`scripts/stitch-anime-voice.py` bisa menyatukan 7 klip jadi satu mp3 dengan jeda
presisi ke detik absolut (pola `stitch-showa-voice.py`). **Tidak dipakai** karena
rekaman asli sudah punya jeda alami sendiri, dan app memutar **per-klip** pada
waktu visualnya (bukan satu file panjang) — jadi menyatukan hanya perlu bila
ingin pratinjau satu file. Kalau perlu:

```bash
python scripts/stitch-anime-voice.py --out voice-source/anime/saku-preview.mp3
```
