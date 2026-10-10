# Voice cinematic 多元 — data gabung 1 mp3 (kana + gap per detik)

Narator: **Saku 咲** · 7 baris · total **69.0s** (babak 1 `tear` = 9s tanpa suara).
Sumber timing (authoritative): `src/features/cinematic/anime/data/scenes.js` →
`voiceCues()`. File mp3 gabungan: **`voice-source/anime/saku-anime.mp3`** (68.96s).

Hasil gabung sudah diverifikasi: tiap baris mendarat di detik absolutnya
(selisih ≤ 0.07s).

## Tabel: kana + gap per detik

`abs` = detik absolut di seluruh cinematic. `gap→next` = jeda ke baris berikutnya
(= batas atas durasi klip). `sisipkan` = senyap yang disisipkan setelah klip ini
saat menggabung.

| # | file | Kana (untuk TTS) | abs | klip | gap→next | sisipkan |
|---|---|---|---|---|---|---|
| 1 | `01_world.mp3` | ページの むこうに、せかいが ある。 | 9.6 | 2.78 | 2.8 | 0.02 |
| 2 | `02_turn.mp3` | ここは じだいじゃない。せかいだ。 | 12.4 | 3.98 | 10.6 | 6.62 |
| 3 | `03_stories.mp3` | いくつもの ものがたりが、まっている。 | 23.0 | 3.53 | 15.8 | 12.27 |
| 4 | `04_choose.mp3` | どの せかいへ、いく？ | 38.8 | 2.64 | 15.8 | 13.16 |
| 5 | `05_grow.mp3` | せかいが、ふえていく。 | 54.6 | 2.78 | 4.0 | 1.22 |
| 6 | `06_era.mp3` | たげん — せかいが ふえる | 58.6 | 2.59 | 2.8 | 0.21 |
| 7 | `07_welcome.mp3` | ようこそ、たげんへ。 | 61.4 | 2.64 | 7.6 (ekor) | 4.96 |

> Senyap **di depan** = 9.6s (babak 1 tanpa voice). Senyap **di ekor** = 4.96s.
> Urutan gabung: `[senyap 9.6]` → `01_world` → `[senyap 0.02]` → `02_turn` →
> `[senyap 6.62]` → `03_stories` → `[senyap 12.27]` → `04_choose` →
> `[senyap 13.16]` → `05_grow` → `[senyap 1.22]` → `06_era` →
> `[senyap 0.21]` → `07_welcome` → `[senyap 4.96]`  = **69.0s**.

## Blok siap-tempel (kana, satu baris per klip)

```
ページの むこうに、せかいが ある。
ここは じだいじゃない。せかいだ。
いくつもの ものがたりが、まっている。
どの せかいへ、いく？
せかいが、ふえていく。
たげん — せかいが ふえる
ようこそ、たげんへ。
```

## Cara gabung ulang jadi 1 mp3

```bash
python scripts/stitch-anime-voice.py            # → voice-source/anime/saku-anime.mp3
python scripts/stitch-anime-voice.py --no-lead  # tanpa senyap 9.6s di depan
```

Skrip menyalin klip dari `public/voices/anime/`, menyisipkan senyap presisi di
atas, lalu `ffmpeg concat`. Kalau ada klip lebih panjang dari gap-nya, skrip
**memperingatkan** (dan memangkas jeda ke 0.2s) — saat ini tak ada yang negatif.

## Potong balik (kalau sumber diganti rekaman asli)

```bash
python scripts/split-voice.py voice-source/anime/saku-anime.mp3 public/voices/anime \
  --names 01_world,02_turn,03_stories,04_choose,05_grow,06_era,07_welcome
```
