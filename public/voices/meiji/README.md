# Voice cinematic Meiji 明治 — SUDAH TERPASANG

Narator Meiji = **Saku (佐久)**. Sumber: `sakuu.mp3` (66,85 s, satu narasi
panjang) → dipecah jadi 7 klip per-baris. Pola sama dengan Heian/Edo.

File mentah disimpan di `voice-source/meiji/saku-meiji.mp3` (DI LUAR `public/`
supaya tidak ikut di-precache PWA — hanya klip terpakai yang masuk bundle).

## Cara memotong ulang (kalau `sakuu.mp3` diganti)

```bash
python scripts/split-voice.py voice-source/meiji/saku-meiji.mp3 public/voices/meiji \
  --names 01_era,02_brick,03_type,04_steam,05_turn,06_era2,07_welcome
```

Default `--min-sil 0.8` (potong di senyap −35 dB ≥ 0,8 s). Lihat
`python scripts/split-voice.py --help` untuk opsi lain.

## Klip terpasang (diputar pada detik `at` barisnya)

| File | Baris | Teks | Bacaan kana | Muncul |
|------|-------|------|-------------|--------|
| `01_era.mp3`     | ginza/era   | 明治時代 | めいじじだい | 10,6 s |
| `02_brick.mp3`   | ginza/brick | 煉瓦の道に、ガス灯がともる。 | れんがのみちに、ガスとうがともる。 | 13,6 s |
| `03_type.mp3`    | print/type  | 活字を組んで、刷る。 | かつじをくんで、する。 | 23,8 s |
| `04_steam.mp3`   | rail/steam  | 煙と電信が、国をつなぐ。 | けむりとでんしんが、くにをつなぐ。 | 36,7 s |
| `05_turn.mp3`    | change/turn | そして、新しい時代が来る。 | そして、あたらしいじだいがくる。 | 49,6 s |
| `06_era2.mp3`    | change/era2 | 明治 — 文明開化 | めいじ、ぶんめいかいか | 54,0 s |
| `07_welcome.mp3` | change/welcome | ようこそ、明治へ。 | ようこそ、めいじへ。 | 56,6 s |

Total cinematic = **66 s** (scene start: port 0 · ginza 10 · print 23 · rail 36 · change 49).
Babak 1 (`port`) sengaja **TANPA teks** → tanpa voice.

> Catatan: baris 6 (`明治 — 文明開化`) dibaca 「めいじ、ぶんめいかいか」 (tanda
> pisah — tidak diucapkan).

## Model data
Voice disimpan **per-BARIS** (`line.voice`), bukan per-scene — karena scene
`change` punya 3 baris berjarak jauh (turn/era2/welcome) yang butuh klip sendiri.
Diputar oleh orchestrator (`MeijiCinematic`) lewat `playClipFile` (utils/sfx.js),
dijadwalkan pada `sceneStart + line.at`.

## Status

| Aset | Status |
|------|--------|
| `public/voices/meiji/*.mp3` | ✅ terpasang — 7 klip (01_era … 07_welcome) |
| Path di `src/features/cinematic/meiji/data/scenes.js` | ✅ menunjuk ke `/voices/meiji/01_era.mp3` … |
| Test penjaga | ✅ `voiceCues: tiap file voice benar-benar ada di public/` di `data/scenes.test.js` |
