# Voice cinematic Edo 江戸 — narasi Nacht ナハト

**Status: ✅ SELESAI (5 Okt 2025).** Aset `Nacht.mp3` dari user (61.36s) di-split
jadi **7 klip** di `public/voices/edo/`, sudah di-wire ke `edo/data/scenes.js`,
tes + build hijau. Sumber mentah disimpan di `voice-source/edo/nacht.mp3`.

## Pola selang-seling era

Narator cinematic = dua tokoh (lihat `docs/story.md` §4), dipakai **bergantian**
per era:

| Era | Narator | Karakter suara | Sumber |
|---|---|---|---|
| Heian 平安 | **Saku 咲** | hangat, ramah, pelan | `saku.mp3` (sudah ada) |
| **Edo 江戸** | **Nacht ナハト** | tenang, serius, melankolis | `nacht.mp3` ✅ |
| Meiji 明治 | Saku | … | (nanti) |
| Shōwa 昭和 | Nacht | … | (nanti) |

Jadi: **Heian → Saku, Edo → Nacht**, dst. selang-seling.

## Naskah + timing (7 baris)

Scene 1 (`map`, 10s) sengaja **TANPA teks** → **tanpa voice** (murni visual).
Narasi mulai di scene 2. `at` = detik di dalam scene-nya; **absolut** = waktu di
seluruh cinematic (scene start: map 0 · capital 10 · print 23 · night 36 · change 49; total 66s).

| # | scene/baris | Teks Jepang | Kana (ふりがな) | at | absolut | gap ke baris berikut |
|---|---|---|---|---|---|---|
| 1 | capital/era    | 江戸時代 | えどじだい | 0.6 | **10.6s** | 3.0s |
| 2 | capital/bridge | すべての道は、日本橋から始まる。 | すべての みちは、にほんばしから はじまる。 | 3.6 | **13.6s** | 10.2s |
| 3 | print/ukiyoe   | 浮世絵、刷る。 | うきよえ、する。 | 0.8 | **23.8s** | 12.9s |
| 4 | night/lantern  | 昼は市、夜は提灯。 | ひるは いち、よるは ちょうちん。 | 0.7 | **36.7s** | 12.9s |
| 5 | change/turn    | そして、町人の時代が来る。 | そして、ちょうにんの じだいが くる。 | 0.6 | **49.6s** | 4.4s |
| 6 | change/era2    | 江戸 — 町人の時代 | えど — ちょうにんの じだい | 5.0 | **54.0s** | 2.6s |
| 7 | change/welcome | ようこそ、江戸へ。 | ようこそ、えどへ。 | 7.6 | **56.6s** | (akhir) |

> **"gap"** = jeda antara satu baris dan baris berikutnya di cinematic. Ini
> **batas atas durasi** klip: klip baris N harus **lebih pendek** dari gap ini,
> supaya tidak menimpa baris N+1.
>
> **Terverifikasi dengan aset nyata:** ketujuh klip cocok, tak ada tabrakan.
> Gap terketat = **0.92s** (era2 1.68s → welcome), lalu 1.61s (era) & 1.78s (turn).
> Sisanya longgar (>6s).

## Cara generate

### Opsi A — satu file (ikut pola Heian, DISARANKAN)
Rekam/generate **satu** `nacht.mp3` berisi 7 baris di atas berurutan, dengan
**jeda senyap ≥ 0.8s** (idealnya **1.0–1.5s**) antar baris supaya auto-split andal.
Taruh sumber di `voice-source/edo/nacht.mp3` (DI LUAR `public/`).

```bash
python scripts/split-voice.py voice-source/edo/nacht.mp3 public/voices/edo \
  --names 01_era,02_bridge,03_ukiyoe,04_lantern,05_turn,06_era2,07_welcome
```
Cek dulu jeda: `python scripts/split-voice.py voice-source/edo/nacht.mp3 --inspect`

### Opsi B — satu klip per baris
Generate 7 file terpisah, nama persis seperti `--names` di atas, taruh langsung di
`public/voices/edo/`.

### Nama file hasil (dipakai di wiring)
`01_era.mp3` · `02_bridge.mp3` · `03_ukiyoe.mp3` · `04_lantern.mp3` ·
`05_turn.mp3` · `06_era2.mp3` · `07_welcome.mp3`

## Wiring ke `src/features/cinematic/edo/data/scenes.js`

Tambah `voice:` per baris (pola sama seperti Heian). Cuplikan:

```js
{ id: 'era',  jp: '江戸時代', kind: 'title', at: 0.6, translationAt: 2.6, sub: '1603 — 1868',
  voice: '/voices/edo/01_era.mp3' },
{ id: 'bridge', jp: 'すべての道は、日本橋から始まる。', /* … */ at: 3.6,
  voice: '/voices/edo/02_bridge.mp3' },
// …03_ukiyoe, 04_lantern, 05_turn, 06_era2, 07_welcome
```

Setelah file ada, tambahkan tes penjaga (salin dari Heian) di
`edo/data/scenes.test.js`:

```js
test('voiceCues Edo: tiap file voice ada di public/', () => {
  for (const v of voiceCues(EDO_SCENES)) {
    const full = join(ROOT, 'public', v.path.replace(/^\//, ''));
    assert.ok(existsSync(full), `file voice hilang: ${v.path}`);
  }
});
```

## Catatan
- Orkestrator (`EdoCinematic`) sudah memutar voice per-baris via `playClipFile`
  dan menahan jam sampai audio live — **tak perlu ubah logika**, cukup isi `voice:`.
- Tanpa aset: baris tampil sebagai teks, **tanpa error** (no-op).
- Jeda internal dalam satu kalimat yang < 0.8s tidak akan ikut terpotong
  (`--min-sil` default 0.8) — penting untuk kalimat panjang.
