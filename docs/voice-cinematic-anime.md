# Voice cinematic 多元 多元 — narasi Saku 咲

**Status: ✅ TERPASANG (voice SINTETIS).** 7 klip narasi Saku digenerate oleh
`scripts/generate-anime-voice.py` (edge-tts, Microsoft neural — pola
`generate-jjk-voices.py`), tersimpan di `public/voices/anime/`, sudah di-wire ke
`anime/data/scenes.js`, tes + build hijau.

> ⚠️ **Voice SINTETIS, bukan rekaman Saku asli.** Kalau mau memakai rekaman Saku
> asli (seperti Heian/Meiji), lihat §3 — taruh sumber di `voice-source/anime/`,
> potong dengan `split-voice.py`, dan **jangan** jalankan generator TTS lagi
> (akan menimpa).

Narator cinematic = dua tokoh bergantian per era (`docs/story.md` §4):

| Era | Narator | Karakter suara |
|---|---|---|
| Heian 平安 | Saku 咲 | hangat, ramah, pelan |
| Edo 江戸 | Nacht ナハト | tenang, serius, melankolis |
| Meiji 明治 | Saku | — |
| Shōwa 昭和 | Nacht | hangat tapi berat |
| **多元** | **Saku 咲** | **cerah, ramah, energik-ringan** |

Jadi: **Heian → Saku, Edo → Nacht, Meiji → Saku, Shōwa → Nacht, 多元 → Saku**.

---

## 1. Naskah + kana (siap tempel ke TTS) — 7 klip

Babak 1 (`tear`, 9s) sengaja **TANPA teks** → **tanpa voice** (murni visual +
sobekan kertas). Narasi mulai di babak 2 (`burst`).

| # | file | Teks Jepang (asli) | **Kana (ふりがな) — untuk TTS** |
|---|---|---|---|
| 1 | `01_world.mp3` | 頁の向こうに、世界がある。 | **ページの むこうに、せかいが ある。** |
| 2 | `02_turn.mp3` | ここは時代じゃない。世界だ。 | **ここは じだいじゃない。せかいだ。** |
| 3 | `03_stories.mp3` | いくつもの物語が、待っている。 | **いくつもの ものがたりが、まっている。** |
| 4 | `04_choose.mp3` | どの世界へ、行く？ | **どの せかいへ、いく？** |
| 5 | `05_grow.mp3` | 世界が、増えていく。 | **せかいが、ふえていく。** |
| 6 | `06_era.mp3` | 多元 — 世界が増える | **たげん — せかいが ふえる** |
| 7 | `07_welcome.mp3` | ようこそ、多元へ。 | **ようこそ、たげんへ。** |

> Blok siap-tempel (satu baris per klip) ada di §5.

---

## 2. Timing + GAP per detik (dari `voiceCues()`, authoritative)

`at` = detik **di dalam scene**-nya. **absolut** = detik di seluruh cinematic
(start scene: tear 0 · burst 9 · montage 22 · worlds 38 · finale 54; total **69s**).

| # | scene/baris | absolut (mulai) | **gap → baris berikut** | durasi klip nyata |
|---|---|---|---|---|
| 1 | burst/world | **9.6s** | **2.8s** | 2.78s ✓ |
| 2 | burst/turn | **12.4s** | **10.6s** | 3.98s ✓ |
| 3 | montage/stories | **23.0s** | **15.8s** | 3.53s ✓ |
| 4 | worlds/choose | **38.8s** | **15.8s** | 2.64s ✓ |
| 5 | finale/grow | **54.6s** | **4.0s** | 2.78s ✓ |
| 6 | finale/era | **58.6s** | **2.8s** | 2.59s ✓ |
| 7 | finale/welcome | **61.4s** | **7.6s** (ekor) | 2.64s ✓ |

> **"gap"** = jeda antara baris ini dan baris berikutnya. Ini **batas atas durasi**
> klip: klip baris N harus **lebih pendek** dari gap ini supaya tidak menimpa baris
> N+1. Gap terketat = **2.8s** (klip 1 `world` & klip 6 `era`) — karena itu klip 1
> digenerate pada `+12%` (lihat §3) agar jatuh < 2.8s.

---

## 3. Cara regenerate (voice sintetis)

```bash
python scripts/generate-anime-voice.py            # 7 klip → public/voices/anime/
python scripts/generate-anime-voice.py --list      # lihat daftar (tanpa generate)
python scripts/generate-anime-voice.py 01_world    # satu klip saja
```

Casting (di skrip): `ja-JP-NanamiNeural`, `rate=-4%`, `pitch=+2Hz` — pelan &
hangat (narator, bukan tokoh aksi). Klip 1 memakai `rate=+12%` khusus supaya
pas di gap 2.8s. Butuh `pip install edge-tts` + jaringan.

### Opsi memakai rekaman Saku ASLI (bukan TTS)

1. Taruh satu narasi panjang di `voice-source/anime/saku-anime.mp3` (DI LUAR
   `public/`, supaya tidak ikut precache PWA).
2. Potong jadi 7 klip (jeda ≥ 0.8s antar baris):
   ```bash
   python scripts/split-voice.py voice-source/anime/saku-anime.mp3 public/voices/anime \
     --names 01_world,02_turn,03_stories,04_choose,05_grow,06_era,07_welcome
   ```
3. Verifikasi tiap klip < gap-nya (§2). Jangan jalankan `generate-anime-voice.py`
   lagi (akan menimpa).

---

## 4. Wiring (SUDAH ADA di repo)

`src/features/cinematic/anime/data/scenes.js` menunjuk tiap baris ke
`/voices/anime/NN_*.mp3` (lihat `voice:` per baris). Tak perlu ubah logika —
cukup sediakan file. Orkestrator (`AnimeCinematic`) memutar voice **per-baris**
via `playClipFile` (`utils/sfx.js`), dijadwalkan pada `sceneStart + line.at`.

**Test penjaga:** `anime/data/scenes.test.js` →
`voiceCues 多元: file voice benar-benar ADA di public/voices/anime/ (T12)`.
Kalau file hilang, tes GAGAL (bukan diam-diam tampil tanpa suara).

---

## 5. Blok siap-tempel TTS (kana, satu baris per klip)

```
ページの むこうに、せかいが ある。
ここは じだいじゃない。せかいだ。
いくつもの ものがたりが、まっている。
どの せかいへ、いく？
せかいが、ふえていく。
たげん — せかいが ふえる
ようこそ、たげんへ。
```

## Catatan
- Orkestrator menahan jam sampai AudioContext `running` (resume setelah gesture
  pertama) supaya baris pertama (9.6s) tidak terlewat — ada fallback agar
  cinematic tetap jalan tanpa suara bila audio diblokir.
- Jeda internal < 0.8s tidak ikut terpotong (`split-voice.py --min-sil` default 0.8).
- Babak 1 (`tear`) = sobekan kertas + SFX `pageTear`/`burst`/`sparklePop`, tanpa voice.
