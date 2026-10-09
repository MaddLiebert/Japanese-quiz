# Voice cinematic Shōwa 昭和 — narasi Nacht ナハト

**Status: ✅ SELESAI (10 Okt 2025).** Aset `nacht.mp3` dari user (64.57s) di-split
jadi **7 klip** di `public/voices/showa/`, sudah di-wire ke `showa/data/scenes.js`,
tes + build hijau. Sumber mentah disimpan di `voice-source/showa/nacht.mp3`.

Narator cinematic = dua tokoh bergantian per era (`docs/story.md` §4):

| Era | Narator | Karakter suara |
|---|---|---|
| Heian 平安 | Saku 咲 | hangat, ramah, pelan |
| Edo 江戸 | **Nacht ナハト** | tenang, serius, melankolis |
| Meiji 明治 | Saku | — |
| **Shōwa 昭和** | **Nacht ナハト** | **hangat tapi berat** (nostalgia di atas beton) |

Jadi: **Heian → Saku, Edo → Nacht, Meiji → Saku, Shōwa → Nacht** (selang-seling).

---

## 1. Naskah + kana (siap tempel ke TTS) — 7 klip

Scene 1 (`ruins`, 10s) sengaja **TANPA teks** → **tanpa voice** (murni visual).
Narasi mulai di scene 2 (`yamichi`).

| # | file | Teks Jepang (asli) | **Kana (ふりがな) — untuk TTS** |
|---|---|---|---|
| 1 | `01_era.mp3` | 昭和時代 | **しょうわじだい** |
| 2 | `02_survive.mp3` | 灰の中でも、人は生きる。 | **はいの なかでも、ひとは いきる。** |
| 3 | `03_concrete.mp3` | コンクリートを打って、町を作る。 | **コンクリートを うって、まちを つくる。** |
| 4 | `04_rise.mp3` | 塔が立つ。速い車が走る。 | **とうが たつ。はやい くるまが はしる。** |
| 5 | `05_turn.mp3` | そして、未来が見えてくる。 | **そして、みらいが みえてくる。** |
| 6 | `06_era2.mp3` | 昭和 — 灰からの町 | **しょうわ — はいからの まち** |
| 7 | `07_welcome.mp3` | ようこそ、昭和へ。 | **ようこそ、しょうわへ。** |

> Blok siap-tempel (satu baris per klip) ada di §5.

---

## 2. Timing + GAP per detik (dari `voiceCues()`, authoritative)

`at` = detik **di dalam scene**-nya. **absolut** = detik di seluruh cinematic
(start scene: ruins 0 · yamichi 10 · build 24 · tower 38 · change 52; total **69s**).

| # | scene/baris | absolut (mulai) | **gap → baris berikut** | maks. durasi klip |
|---|---|---|---|---|
| 1 | yamichi/era | **10.6s** | **3.0s** | < 3.0s |
| 2 | yamichi/survive | **13.6s** | **11.2s** | < 11.2s |
| 3 | build/concrete | **24.8s** | **13.9s** | < 13.9s |
| 4 | tower/rise | **38.7s** | **13.9s** | < 13.9s |
| 5 | change/turn | **52.6s** | **4.4s** | < 4.4s |
| 6 | change/era2 | **57.0s** | **2.6s** | < 2.6s |
| 7 | change/welcome | **59.6s** | **9.4s** (ekor) | — |

> **"gap"** = jeda antara baris ini dan baris berikutnya di cinematic. Ini
> **batas atas durasi** klip: klip baris N harus **lebih pendek** dari gap ini,
> supaya tidak menimpa baris N+1.
> Gap terketat = **2.6s** (era2 → welcome) & **3.0s** (era → survive) — pastikan
> klip 1 dan 6 singkat (klip 1 hanya "しょうわじだい", klip 6 hanya judul).

### Durasi klip NYATA (hasil split `nacht.mp3` 64.57s, `--min-sil 1.0`)

| # | klip | durasi | gap | ✓ |
|---|---|---|---|---|
| 1 | 01_era | 1.59s | 3.0s | ✓ |
| 2 | 02_survive | 2.22s | 11.2s | ✓ |
| 3 | 03_concrete | 2.32s | 13.9s | ✓ |
| 4 | 04_rise | 3.11s | 13.9s | ✓ |
| 5 | 05_turn | 2.53s | 4.4s | ✓ |
| 6 | 06_era2 | 1.99s | 2.6s | ✓ |
| 7 | 07_welcome | 1.78s | (ekor) | ✓ |

> Semua klip < gap-nya → **tak ada tabrakan**. Mean volume tiap klip ≈ −24 dB
> (bersuara, bukan senyap). Terverifikasi di `showa/data/scenes.test.js`.

---

## 3. Cara menyatukan jadi SATU file mp3 (lalu dipotong)

### Opsi A — satukan dengan jeda tetap (paling andal untuk auto-split)
Buat **satu** `nacht-showa.mp3` berisi 7 baris berurutan, **jeda senyap ≥ 0.8s**
(idealnya **1.0–1.5s**) antar baris. Taruh sumber di `voice-source/showa/nacht-showa.mp3`
(DI LUAR `public/`). Lalu potong:

```bash
python scripts/split-voice.py voice-source/showa/nacht-showa.mp3 public/voices/showa \
  --names 01_era,02_survive,03_concrete,04_rise,05_turn,06_era2,07_welcome
```
Cek jeda dulu: `python scripts/split-voice.py voice-source/showa/nacht-showa.mp3 --inspect`

### Opsi B — satu klip per baris (langsung)
Generate 7 file terpisah dengan nama persis di §1, taruh di `public/voices/showa/`.

### Opsi C — **GAP presisi per detik** (timeline-accurate, satu file)
Kalau mau satu mp3 yang **tiap baris mendarat tepat di detik absolut** (§2) —
pakai skrip yang menghitung jeda per baris otomatis dari durasi klip nyata:

```bash
# taruh 7 klip (Opsi B) di public/voices/showa/, lalu:
python scripts/stitch-showa-voice.py
# → voice-source/showa/nacht-showa.mp3 (satu file, timeline-accurate 69s)
```

Skrip mencetak **gap per detik** tiap baris (senyap yang disisipkan) dan
**memperingatkan** bila ada klip yang lebih panjang dari gap-nya (§2).

> **Untuk dipakai app:** tetap **potong** jadi 7 klip (`split-voice.py`) dan taruh
> di `public/voices/showa/` — orkestrator memutar voice **per-baris** via
> `playClipFile`. Tanpa aset: baris tampil sebagai teks, **tanpa error** (no-op).

---

## 4. Wiring (SUDAH ADA di repo)

`src/features/cinematic/showa/data/scenes.js` sudah menunjuk tiap baris ke
`/voices/showa/NN_*.mp3` (lihat `voice:` per baris). Tak perlu ubah logika —
cukup sediakan file.

**Test penjaga** (tambahkan setelah file ada — pola Heian/Edo):
```js
test('voiceCues Shōwa: tiap file voice ada di public/', () => {
  for (const v of voiceCues()) {
    const full = join(ROOT, 'public', v.path.replace(/^\//, ''));
    assert.ok(existsSync(full), `file voice hilang: ${v.path}`);
  }
});
```
> Saat ini `showa/data/scenes.test.js` **hanya** memeriksa path menunjuk
> `/voices/showa/` (bukan keberadaan file) — sengaja, karena file belum ada.

---

## 5. Blok siap-tempel TTS (kana, satu baris per klip)

```
しょうわじだい
はいの なかでも、ひとは いきる。
コンクリートを うって、まちを つくる。
とうが たつ。はやい くるまが はしる。
そして、みらいが みえてくる。
しょうわ — はいからの まち
ようこそ、しょうわへ。
```

## Catatan
- Orkestrator (`ShowaCinematic`) menahan jam sampai audio live → tak perlu ubah logika.
- Jeda internal dalam satu kalimat yang < 0.8s tidak ikut terpotong (`--min-sil` default 0.8).
- Lagu kelulusan checkpoint = **蛍の光** (`showaCheckpoint.js` → `SHOWA_CHECKPOINT_SONG`).
