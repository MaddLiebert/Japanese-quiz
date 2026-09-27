# Voice Pack 2 — Seri Jujutsu Kaisen (TTS generik)

Panduan klip suara untuk pack `pack_08`..`pack_14` (Nobara, Yuji, Megumi,
Nanami, Yuta, Toji, Sukuna). Sama seperti Hina (`docs/voice-pack-1-hina.md`):
**bukan kloning seiyuu** — pakai TTS Jepang generik yang di-tune per karakter.

> Semua klip di-generate oleh `scripts/generate-jjk-voices.py`.
> Ganti klip kapan saja dengan file asli **dengan nama file yang sama** —
> tidak perlu ubah kode.

## 1. Casting (edge-tts)

| Pack | Karakter | Voice | Rate | Pitch | Kesan |
|---|---|---|---|---|---|
| pack_08 | Nobara Kugisaki | ja-JP-NanamiNeural | +14% | +6Hz | energik, sok pede |
| pack_09 | Yuji Itadori | ja-JP-KeitaNeural | +10% | +5Hz | ceria, cepet |
| pack_10 | Megumi Fushiguro | ja-JP-KeitaNeural | −6% | −2Hz | kalem, datar |
| pack_11 | Nanami Kento | ja-JP-KeitaNeural | −8% | −4Hz | formal, datar |
| pack_12 | Yuta Okkotsu | ja-JP-KeitaNeural | +2% | +1Hz | lembut, sopan |
| pack_13 | Toji Fushiguro | ja-JP-KeitaNeural | −12% | −10Hz | berat, ketus |
| pack_14 | Ryomen Sukuna | ja-JP-KeitaNeural | −18% | −6Hz | mengancam, lambat |

## 2. Kalimat

Daftar kalimat (9 per karakter: 3 correct / 3 wrong / 3 streak) ada di `LINES`
dalam `scripts/generate-jjk-voices.py` — file itu **sumber tunggal** (DRY).

## 3. Generate / regenerate

```bash
python scripts/generate-jjk-voices.py            # semua karakter
python scripts/generate-jjk-voices.py nobara     # satu karakter saja
```

Output: `public/voices/<key>/correct_1..3.mp3`, `wrong_1..3.mp3`,
`streak_1..3.mp3` (9 file per karakter, target < 60 KB per klip).

## 4. Integrasi

1. Jalankan generator (lihat §3).
2. Pastikan `VOICES.<key>.files` di `src/features/audio/voices.js` menunjuk ke
   9 file itu (sudah diisi oleh task VP; kalau kosong → fallback synth).
3. `npm test` → tes `voice <key>: 3 correct + 3 wrong + 3 streak` hijau.

## 5. Catatan

- Streak: 3 klip **dirotasi** antar milestone oleh `pickStreakClip` (cursor) —
  bukan per-tier seperti Hina.
- Kalau mau klip asli (potongan anime), taruh dengan nama file sama; ukuran
  kecil (< 60 KB) & durasi < 3 dtk supaya tidak menabrak efek visual.
- Lisensi: TTS generik aman; klip anime asli = risiko hak cipta kalau dipublikasikan.
