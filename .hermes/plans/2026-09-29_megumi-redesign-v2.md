# Redesign efek Megumi v2.2 — hasil review 29/09

Sumber: review screenshot real (quiz + DevPanel + cinematic) sesi 29/09
+ kritik user WhatsApp 29/09 (3 poin: cakar-jaring, bangkit-dari-lumpur,
posisi-pinggir-deterministik, refresh-mulu).

## Masalah (terverifikasi dari screenshot)

### v2 (batch pertama — SUDAH SELESAI)
| # | Temuan | Bukti |
|---|---|---|
| 1 | **Efek nutupin soal & tombol jawaban** — wash gelap inset-0 + ShadowPool h-46% + kanji bottom-12% + siluet bottom-10% → semua duduk di zona soal/jawaban. Terjadi TIAP jawaban benar (rotasi 玉犬/鵺). | `_review/2_gyokuken_nutupin_soal.png`, `3_nue_nutupin_soal.png` |
| 2 | **魔虚羅 settle nyaris tak terbaca** — gradient badan gelap di tema gelap, stroke perak opacity 0.6; kepala "nempel"; roda 八握剣 di leher (kanon: punggung). | `_review/5_mahoraga_settle.png` |
| 3 | **大蛇 polos** — lilitan = ellipse outline tanpa isi; kepala = circle, bukan kepala ular. | `_review/6_orochi.png` |
| 4 | **GIF mahoraga 220×147px** — cut-in kecil 0.5s (dipilih; jangan diperbesar). | `megumiFx.js:36` |

### v2.2 (batch kedua — kritik user 29/09)
| # | Kritik user (verbatim) | Akar masalah | Fix |
|---|---|---|---|
| 5 | "bagian cakar2 nya muncul sama kaya sukuna nyebar jaring, pas di pencet jawaban yang gw klik" | Cakar = 3 garis tipis `left-[-6%] right-[-6%]`, opacity rendah → nyaris tak kelihatan; sebelumnya melintang se-layar. | `ClawTrap` dirombak: **jaring cakar** = 8 jari radial + 2 cincin menyebar dari tengah kartu (pola `WebTrap` Sukuna) + 3 goresan besar + simpul jerat X + glow tepi. Trigger saat kartu `data-picked` diklik. |
| 6 | "animasi muncul hewan2 nya kayak muncul dari lumpur ke atas jangan animasi random" | Generator pakai `rng()` → tiap kali beda (serigala tilt/scale, ular radius/cy, petir, riak, dsb). | **Semua generator jadi pola TETAP** (tanpa rng): `megumiWolfRise`, `megumiSerpentCoils`, `megumiScales`, `megumiCracks`, `megumiWaterJet`, `megumiRipples`, `megumiTigerLeap`, `megumiFangCracks`, `megumiShadowMotes`, `megumiPoolBlobs`, `megumiWingSpread`, `megumiClawMarks`. Animasi semua hewan: `y: '9-12vh' → 0` + `scaleY 0.7 → 1` (bangkit dari lantai). |
| 7 | "penempatan si hewan nya juga di pinggir soal gitu jangan random biar enak" | Posisi hewan dari rng + jalur melintas. | Posisi **FIX di tepi**: 玉犬 kiri/kanan `bottom-[3%]` (24vmin), 鵺 `bottom-[2%] left-[1%]` (36vmin), 大蛇 `bottom-[1%] left-[1%]` (36vmin), 満象 `bottom-[2%] right-[2%]` (32vmin), 虎葬 `bottom-[2%] left-[1%]` (38vmin, lunge 3vw). |
| 8 | "kenapa refresh Mulu pas gw lagi quiz gimana gw tes nya" | **Service worker PWA** (`registerSW({immediate:true})` + listener `controllerchange` → `location.reload()`) aktif juga di dev server; tiap kode diedit saat user tes dari HP → SW update → full reload. | `main.jsx`: SW **hanya didaftarkan di `import.meta.env.PROD`**; di dev justru `unregister()` semua SW + hapus cache (self-heal kalau HP pernah pasang SW dari build production). |

Prinsip #1 = sama dengan kritik Sukuna dulu ("kuil di DEPAN layar quiz → salah; kuil = LATAR").
Efek = **bingkai/latar**, bukan penghalang.

## Desain final

### A. Zona aman — semua jurus streak (玉犬/鵺/大蛇/満象/虎葬)
Layout quiz HP (390×844, terukur): soal **33–41%**, tombol jawaban **49–78%**;
SAFE ZONES = top **0–32%**, strip **42–49%**, bottom **79–100%**.

- **Wash gelap → vignette**: gelap hanya di tepi (radial-gradient, tengah ≥44% terang) → soal kebaca.
- **ShadowPool**: strip lantai tipis (9%) + rim indigo. "Lantai bayangan", bukan kolam raksasa.
- **Siluet shikigami**: FIX di tepi bawah (kiri/kanan), bangkit dari lantai (`y 9-12vh → 0`, `scaleY 0.7 → 1`).
- **Kanji**: atas-tengah (zona aman, antara header dan soal), vmin-based + glow.

### B. ClawTrap — jaring cakar (redesign v2.2)
- Portal `fixed z-[130]` menutupi `button[data-picked]` (kartu yang dipencet).
- Struktur: 8 jari radial (tiap 45°, panjang bervariasi tetap) + 2 cincin (r=24, 40)
  — persis pola jaring Sukuna (`WebTrap`).
- Di atasnya: 3 goresan cakar besar (perak untuk 玉犬, amber untuk 虎葬).
- Simpul jerat: 2 diagonal X mengencang + glow tepi kartu.
- Warna: `#cbd5e1` (玉犬) / `#f59e0b` (虎葬).

### C. Determinisme (v2.2)
- Semua generator = fungsi murni dari `(seed, count)` — TIDAK ada `rng()`.
- Kontrak baru di test: `deepEqual(gen(x), gen(x))` → hasil identik antar panggilan.
- Rotasi teknik (玉犬 ↔ 鵺) tetap deterministik dari streak (sudah ada sejak awal).

### D. Dev server tanpa refresh (v2.2)
- `registerSW` + reload listener hanya di PROD.
- Dev: `unregister()` + `caches.delete()` → kode terbaru selalu tersaji.

## File yang disentuh (v2.2)
- `src/main.jsx` — SW gate PROD/dev self-heal
- `src/features/effects/megumiFx.js` — semua generator deterministik + `megumiClawNet` baru; hapus `megumiAmberClaws` (dead code)
- `src/features/effects/megumiFx.test.js` — kontrak determinisme + `megumiClawNet` assertions
- `src/features/effects/MegumiBurst.jsx` — ClawTrap rombak total; semua hewan posisi-fix bangkit-dari-lantai
- `src/features/effects/MegumiShadow.jsx` — (dari v2) siluet/roda/aura/kanji persist

## Verifikasi
- `npm test` **607 pass / 0 fail** · `npm run lint` **0 error** · `npm run build` **OK**
- E2E browser: 3 soal dijawab tanpa reload (marker `window` bertahan) + `0 SW registrations`.
- Screenshot: jaring cakar nempel di kartu (radial+cincin+goresan), serigala bangkit dari genangan di tepi kiri/kanan-bawah, kanji di atas, soal tidak tertutup.
- `public/_review/` — halaman bukti before/after (tunnel).

## Aturan anti-nabrak (tetap)
- Jangan ganggu jalur Gojo/Yuji/Sukuna. Domain tetap ❌ (rare).
- `prefers-reduced-motion`: kanji/siluet tetap; shake/flash disembunyikan.

## Cara tes dari HP (v2.2)
1. Buka `https://menus-powell-small-con.trycloudflare.com/` (tunnel ke dev :5174).
2. Kalau sebelumnya pernah terpasang PWA: **hard refresh sekali** (tutup tab → buka lagi)
   supaya SW lama lepas — setelah itu refresh-mulu hilang.
3. Main quiz kana — tiap jawaban benar: jaring cakar menyebar di kartu yang lu pencet,
   hewan bangkit dari lantai di tepi, kanji di atas.
