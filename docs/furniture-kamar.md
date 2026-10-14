# SPEC — 部屋 KAMAR: Furniture untuk Profil

**Versi:** v0.1 · **Dibuat:** 2026-10-14
**Status:** SPEC — belum diimplementasikan
**Peran:** hiasan ruangan pribadi di Profil — tempat membelanjakan medaru setelah semua pack & kosmetik terkumpul.
**Induk:** ekonomi medaru (`src/features/progress/ProgressContext.jsx`), pola kosmetik 電脳 (`src/features/cosmetics/cosmetics.js`)
**Terkait:** `docs/tema/*.md` (gaya per era), `src/features/shop/Shop.jsx`, `src/features/profile/Profile.jsx`
**Target implementasi:** terminal (task T0–T8 di §9)

---

## 1. Masalah yang dipecahkan

Medaru **menumpuk tanpa tujuan** setelah pemain mengumpulkan semua isi toko.

Hitung cepat (harga & pendapatan nyata di kode):

| Sumber medaru | Nominal |
|---|---|
| Per jawaban benar (`MEDARU_PER_CORRECT`) | 2 |
| Misi harian (3 misi) | ±180/hari |
| Misi mingguan (2 misi) | ±550/minggu |

| Sink medaru SEKARANG | Total habis |
|---|---|
| 14 Theme Pack (gacha 100/pull, ±1.400 rata-rata) | ±1.400 |
| 6 kosmetik 電脳 (gacha ハック) | ±900 |
| 3 item konsumsi (500/800/1200) | habis terpakai (konsumtif) |

→ Setelah ±2.300 medaru, **tidak ada lagi yang bisa dibeli**. Pemain lama punya saldo menganggur. Furniture memberi sink **permanen & tak habis** yang tumbuh seiring era.

---

## 2. Keputusan pemilik (2026-10-14)

1. **Bentuk = 部屋 KAMAR** — satu ruangan, furniture **ditata di posisi** (dinding/lantai/meja). Bukan rak, bukan meja tunggal.
2. **Efek = HIASAN MURNI** — tidak mengubah gameplay (tanpa XP, tanpa bonus). Sama seperti kosmetik 電脳: aman, tidak pay-to-win.
3. **Gaya = PER-ERA** — furniture auto ganti sesuai tema aktif (Heian 屏風/畳, 電脳 neon/hologram).

---

## 3. Prinsip

- **Hiasan murni.** Tidak ada furniture yang menambah XP/medaru/streak. Kalau suatu saat diinginkan bonus, itu spec terpisah dan wajib dibahas ulang (risiko pay-to-win).
- **Per-era, dihitung HIDUP dari `era`.** Tidak ada flag tersimpan; furniture era lain tersembunyi otomatis saat pindah era, muncul lagi saat kembali — pola sama dengan gerbang era voice pack & kosmetik.
- **Satu katalog murni, satu komponen kamar.** Data di `furniture.js` (tanpa React/DOM, dites `node --test`); render di satu komponen `Room.jsx`. Tidak ada CSS per-era baru (kamar mewarisi token era yang sudah ada).
- **Nol perubahan arsitektur.** Memakai ulang pola kosmetik: `owned*` + `placed` di objek `progress` → sync & backup otomatis (merge = LWW objek `progress`; backup simpan `user_progress_v2` mentah).
- **Ikon = kanji glyph**, bukan emoji (aturan app).

---

## 4. Slot ruangan

Kamar punya **slot tetap** (sama untuk semua era — yang berganti hanya katalog furniture-nya):

| Slot | Jumlah | Posisi di kamar | Contoh isi |
|---|---|---|---|
| `wall` 壁 | 2 | kiri-atas, kanan-atas | 屏風, 行灯, poster, neon sign |
| `floor` 床 | 2 | kiri-bawah, kanan-bawah | 畳, 火鉢, kulkas, server rack |
| `desk` 机 | 1 | tengah, di atas meja | 硯, 蓄音機, TV, hologram |

Total **5 slot**. Slot kosong = area bertanda putus-putus (`border-dashed`) dengan kanji slot samar.

Pemetaan state: `progress.placed = { wall_l, wall_r, floor_l, floor_r, desk }` — tiap nilai = id furniture atau `null`.

---

## 5. Katalog furniture (24 item, 6 era × 4)

Semua `price` = medaru. `icon` = nama Glyph yang **harus sudah terdaftar** di `src/components/icons/Glyph.jsx`.

| Era | `wall` | `floor` | `desk` |
|---|---|---|---|
| **heian 平安** | 屏風 byōbu (layar lipat) · 掛軸 kakemono (gulungan dinding) | 畳 tatami · 火鉢 hibachi | 硯 suzuri (batu tinta) |
| **edo 江戸** | 行灯 andon (lampu kertas) · 暖簾 noren (tirai) | 箪笥 tansu (lemari) · 蚊帳 kaya (kelambu) | 火鉢 hibachi kecil |
| **meiji 明治** | 洋時計 (jam Barat) · ランプ (lampu minyak) | 蓄音機 gramofon · ソファ sofa Barat | 洋書 (buku Barat) |
| **showa 昭和** | カレンダー (kalender) · 扇風機 (kipas) | 冷蔵庫 (kulkas) · ちゃぶ台 (meja rendah) | テレビ (TV kotak) |
| **anime 多元** | ポスター (poster) · 掛け時計 (jam dinding) | ソファ (sofa) · ゲーム機 (konsol) | フィギュア (figurine) |
| **cyberpunk 電脳** | ネオンサイン (neon sign) · ホロパネル (panel holo) | サーバーラック · ドローン台 | ホログラム (hologram) |

Catatan: satu era boleh punya **lebih dari 4** item (katalog bebas tumbuh). Angka 24 = usulan awal; tiap era minimal 4 supaya semua slot bisa terisi.

**Rarity & harga** (memakai `PACK_RARITY` yang sudah ada):

| Rarity | Harga medaru | Peran |
|---|---|---|
| `common` | 600 | pengisi slot murah |
| `rare` | 1200 | item menonjol |
| `legendary` | 2400 | pusat perhatian kamar |

Setiap era punya tepat **1 legendary** (mis. Heian 屏風, 電脳 ホログラム).

---

## 6. Alur pemain

```
Shop → section 「部屋」Furnitur (era aktif)
        ↓ beli dengan medaru (permanen, tidak habis)
progress.ownedFurniture += id
        ↓
Profil → tab 「部屋」
        ↓ tata: pilih slot → pilih furniture yang dimiliki
progress.placed[slot] = id
        ↓
Pindah era → kamar otomatis menampilkan furniture era itu
(furniture era lain tetap dimiliki, tersembunyi sementara)
```

---

## 7. Data & fungsi (modul murni `src/features/furniture/furniture.js`)

Pola persis `cosmetics.js`:

```js
export const FURNITURE_SLOTS = ['wall_l','wall_r','floor_l','floor_r','desk'];
export const SLOT_LABEL = { wall_l: {id:'Dinding',en:'Wall'}, ... };
export const FURNITURES = [ { id, slot, era, name, kanji, icon, rarity, desc, desc_en, price }, ... ];

export const getFurniture = (id) => ...
export const furnitureAllowedInEra = (f, era) => !f?.era || f.era === era;
export const furnitureForEra = (era) => ...
export const furnitureForSlot = (era, slot) => ...
export const rollFurnitureId = (rng, poolIds) => ...   // opsional (kalau mau lewat gacha)
export const placeFurniture = (placed, slot, id) => ... // MURNI, return objek baru
export const clearSlot = (placed, slot) => ...
```

State di `progress` (default ditambah ke `DEFAULT_PROGRESS`):
```js
ownedFurniture: [],                 // id yang dimiliki
placed: { wall_l:null, wall_r:null, floor_l:null, floor_r:null, desk:null },
```

Aksi di `ProgressContext`: `buyFurniture(id)` (potong medaru, tolak kalau kurang / sudah punya), `equipFurniture(slot, id)` (tolak kalau belum dimiliki / beda era), `clearFurnitureSlot(slot)`.

---

## 8. Permukaan UI

**Shop** (`src/features/shop/Shop.jsx`) — section baru di bawah Etalase:
- Judul: 「部屋」Furnitur (ID: *Furnitur Kamar* / EN: *Room Furniture*).
- Baris per furniture era aktif: ikon + nama + kanji + harga + tombol beli.
- Sudah dimiliki → badge 「所持」 + tombol mati (tidak bisa beli dua kali).
- Saldo kurang → tombol redup (pola sama dengan item konsumsi sekarang).

**Profil** (`src/features/profile/Profile.jsx`) — tab ke-4 「部屋」:
- Grid 5 slot (2 dinding atas, 2 lantai bawah, 1 meja tengah).
- Slot terisi → render furniture (kanji besar + warna rarity + aksen era).
- Slot kosong → kotak putus-putus + kanji slot samar + label.
- Klik slot → panel pilih furniture (hanya yang dimiliki **dan** era aktif).
- Tombol 「片付ける」 (bereskan) per slot.

**Inventori** (opsional, `src/features/inventory/Inventory.jsx`): daftar furniture dimiliki per era.

---

## 9. Rencana Implementasi (T0–T8)

> Konvensi commit: `feat(furniture):`, `fix(furniture):`, `docs(furniture):`
> Setiap task: tulis test gagal → jalankan → implementasi → jalankan (lulus) → commit.

### T0 — Baseline
```bash
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"   # catat angka
npm run lint 2>&1 | grep -ci error               # 0
git rev-parse --short HEAD
```

### T1 — Modul katalog (TDD, MURNI)
Buat `src/features/furniture/furniture.js` + `furniture.test.js`.
Test: 24 item; tiap era ≥4; tiap era tepat 1 legendary; `icon` ada di Glyph;
`slot` ∈ `FURNITURE_SLOTS`; `furnitureForEra('heian')` tak memuat item 電脳;
`placeFurniture` murni (input tak berubah); `clearSlot` benar.

### T2 — Glyph baru
Tambah ikon yang belum ada (mis. `screen`, `lamp`, `shelf`, `clock`, `radio`).
Cek dulu nama yang sudah terdaftar di `Glyph.jsx`; **jangan** pakai nama yang
tidak terdaftar (render `null` diam-diam).

### T3 — State di ProgressContext
`DEFAULT_PROGRESS` + `ownedFurniture` + `placed`; `buyFurniture`,
`equipFurniture`, `clearFurnitureSlot` (guards: saldo kurang, sudah punya,
belum dimiliki, beda era). Tes guard (baca sumber).

### T4 — Section Shop
Section 「部屋」Furnitur era-aktif + tombol beli + badge 所持.

### T5 — Komponen Kamar
`src/features/furniture/Room.jsx` — grid 5 slot, render furniture, panel pilih.

### T6 — Tab Profil
Tab ke-4 「部屋」memuat `<Room />`.

### T7 — Inventori (opsional)
Daftar furniture dimiliki.

### T8 — Verifikasi
`npm test` (0 gagal) · `npm run lint` (0 error) · build `EXIT=0` ·
cek di browser (profil Chrome user; kalau terkunci → guard test baca sumber).

---

## 10. Kriteria Penerimaan

- [ ] `furniture.js` murni (tanpa React/DOM); `node --test` lulus.
- [ ] Tiap era ≥4 furniture, tepat 1 legendary.
- [ ] Semua `icon` terdaftar di `Glyph.jsx`.
- [ ] `buyFurniture` menolak saldo kurang & pembelian dobel.
- [ ] `equipFurniture` menolak furniture belum dimiliki / beda era.
- [ ] Kamar menampilkan HANYA furniture era aktif (auto saat pindah era).
- [ ] Furniture era lain tetap dimiliki (tidak hilang saat pindah era).
- [ ] Tidak ada efek gameplay apa pun (grep: tidak menyentuh `addXp`/`medaru` selain potong harga).
- [ ] `resetProgress` ikut mengosongkan `ownedFurniture`/`placed`.
- [ ] Nol emoji di UI baru (ikon = kanji glyph).
- [ ] Sync & backup berjalan tanpa ubah `merge.js`/`backup.js`.

---

## 11. Risiko

| # | Risiko | Mitigasi |
|---|---|---|
| R1 | Furniture dianggap pay-to-win | Hiasan murni, ditegaskan di §3 & kriteria |
| R2 | Saldo awal pemain kecil → tak bisa beli | Harga mulai 600; misi harian ±180 → 3–4 hari per item common |
| R3 | Kamar terasa kosong di era awal | Slot kosong tetap rapi (kotak putus-putus + kanji samar), bukan error |
| R4 | Katalog 24 item = kerja aset besar | Tanpa aset gambar; kanji + glyph + warna rarity (pola kosmetik) |
| R5 | Furniture era lain "hilang" saat pindah era | Tetap dimiliki; hanya tersembunyi — sama seperti voice pack anime |
| R6 | Nama furniture Jepang salah baca | Tulis kanji + romaji; verifikasi istilah (byōbu, andon, suzuri, …) |

---

## 12. Yang TIDAK termasuk

- **Efek gameplay** (XP/medaru/bonus) — ditolak (§3).
- **Aset gambar/GIF furniture** — murni kanji + glyph + warna.
- **Menata bebas (drag & drop posisi bebas)** — slot tetap 5; drag-drop = spec terpisah.
- **Kamar multiplayer / dikunjungi pemain lain** — di luar cakupan.
- **Furniture lewat gacha** — usulan awal: beli langsung di Shop. Gacha furniture = keputusan terpisah.
- **Konten N4** — ditolak (proyek sendiri).

---

## 13. Ringkasan Satu Layar

Furniture = **sink medaru permanen** untuk pemain yang sudah punya segalanya.
Bentuk **部屋 kamar** (5 slot: 2 dinding, 2 lantai, 1 meja), **hiasan murni**,
**per-era** (auto ganti). 24 item (6 era × 4), harga 600/1200/2400.
Beli di Shop, tata di tab 「部屋」Profil. Nol perubahan arsitektur — memakai
ulang pola kosmetik 電脳 (`owned*` + state di objek `progress` → sync & backup
otomatis). Kerja aset = nol (kanji + glyph + warna rarity).
