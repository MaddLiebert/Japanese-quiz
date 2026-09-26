# Plan — Puisi Panjang Bertema (cinta · kesedihan · kesenangan · bersyukur)

Status: **siap dieksekusi** (langsung jalan, tanpa gating).
Baseline: 180 test pass / 0 fail · lint exit 0 · build ✓ · `main` ahead 16 (belum di-push).

## Tujuan

User: "mau ada puisi panjang berdasarkan tema — cinta, kesedihan, kesenangan, bersyukur — masing-masing 3, panjang ya."

→ **12 puisi baru** yang jauh lebih panjang dari haiku 3 baris (13–36 baris), dikelompokkan 4 tema, dilatih bicara per baris seperti puisi lama (furigana, XP per baris, XP selesai puisi, masuk Review/SRS).

## Keputusan (di-lock sebelum eksekusi)

1. **Sumber teks: Aozora Bunko (青空文庫)** — perpustakaan digital Jepang khusus karya public domain. Teks + furigana di-parse dari file HTML resmi (Shift_JIS, tag `<ruby>`), **bukan** diketik ulang dari ingatan. Script importer dicommit untuk provenance. Tanggal akses: 26/09/2026.
2. **12 puisi final (4 tema × 3)** — semua penulis wafat > 70 tahun (public domain):

| # | Tema | Judul | Penulis | Sumber (Aozora) | Baris |
|---|------|-------|---------|-----------------|-------|
| 1 | Cinta | 初恋 | 島崎藤村 | 若菜集 — `cards/000158/files/1508_18509.html` | 16 |
| 2 | Cinta | 樹下の二人 | 高村光太郎 | 智恵子抄 — `cards/001168/files/46669_25695.html` | 36 |
| 3 | Cinta | あなたはだんだんきれいになる | 高村光太郎 | 智恵子抄 — `cards/001168/files/46669_25695.html` | 13 |
| 4 | Kesedihan | 汚れつちまつた悲しみに…… | 中原中也 | 山羊の歌 — `cards/000026/files/894_28272.html` | 16 |
| 5 | Kesedihan | レモン哀歌 | 高村光太郎 | 智恵子抄 — `cards/001168/files/46669_25695.html` | 18 |
| 6 | Kesedihan | 臨終 | 中原中也 | 山羊の歌 — `cards/000026/files/894_28272.html` | 16 |
| 7 | Kesenangan | 春はきぬ | 島崎藤村 | 若菜集 — `cards/000158/files/1508_18509.html` | 36 |
| 8 | Kesenangan | 髪を洗へば | 島崎藤村 | 若菜集 — `cards/000158/files/1508_18509.html` | 16 |
| 9 | Kesenangan | 春の日の夕暮 | 中原中也 | 山羊の歌 — `cards/000026/files/894_28272.html` | 16 |
| 10 | Bersyukur | 雨ニモマケズ | 宮沢賢治 | `cards/000081/files/45630_23908.html` | 30 |
| 11 | Bersyukur | 道程（後半・抜粋） | 高村光太郎 | `cards/001168/files/59185_75168.html` | 16 |
| 12 | Bersyukur | 幸福 | 中原中也 | 山羊の歌 — `cards/000026/files/894_28272.html` | 20 |

3. **雨ニモマケズ di-upgrade**: entri lama cuma kutipan 3 baris → diganti versi lengkap 30 baris. Id tetap `poem_kenji_amenimomakezu` (progress SRS user aman). Total data: 7 klasik + 12 bertema = **19 puisi**.
4. **Satu file data**: semua ke `src/data/poems.json`. Field baru per puisi bertema: `theme` (`love|sadness|joy|gratitude`) + `source` (URL Aozora). Review otomatis ikut (pool distractor nambah).
5. **XP tidak diubah**: baris 5 × level, selesai puisi 25 × level. Puisi 36 baris = 205 XP di Pandu — otomatis "makin panjang makin besar".
6. **UI tab Puisi**: chip filter `Semua · Klasik · Cinta · Kesedihan · Kesenangan · Bersyukur` (+ jumlah); kartu puisi dapat badge "N baris". Logika di fungsi murni `POEM_THEMES` + `filterPoemsByTheme` (`speaking.js`) — ada test.
7. **Kontrak test diperbarui**: `poems.test.js` → 19 puisi; 4 tema × 3; puisi bertema ≥ 12 baris; cek bacaan dilonggarkan dari "kana murni" jadi "tanpa kanji & tanpa latin" (puisi klasik mengandung tanda baca `…。―` yang aman — `normalizeJa` membuangnya saat matching). Cek furigana `r` tetap kana murni.
8. **Scope-out**: tanpa achievement baru; `PoemSession.jsx` / engine XP / SRS tidak disentuh.

## File yang berubah

- `scripts/import-aozora-poems.mjs` (baru) — importer + peta bacaan manual.
- `src/data/poems.json` — 12 puisi baru + ameni versi lengkap.
- `src/features/speaking/poems.test.js` — kontrak baru.
- `src/features/speaking/speaking.js` + `speaking.test.js` — `POEM_THEMES` + `filterPoemsByTheme`.
- `src/pages/Speaking.jsx` — chip tema + badge baris.
- `PRD.md` §9.10 — catatan puisi bertema.

## Tasks

| # | Isi | Commit | Expected |
|---|-----|--------|----------|
| T1 | Commit plan ini | `docs(plans): plan puisi panjang bertema` | — |
| T2 | Importer + data 12 puisi + `poems.test.js` baru (RED → GREEN). Loop peta bacaan sampai importer tidak throw. | `feat(speaking): 12 puisi panjang bertema + 雨ニモマケズ lengkap` | poems.test 5/5 · suite **181** |
| T3 | `POEM_THEMES` + `filterPoemsByTheme` + test (RED→GREEN; swap hardcode tema di poems.test ke import) + chip UI + badge baris | `feat(speaking): filter tema puisi + badge jumlah baris` | speaking.test 11/11 · suite **182** |
| T4 | Verifikasi browser + PRD + Log Eksekusi + Obsidian brain | `docs(plans): log eksekusi puisi bertema` | gate final **182/182** · lint 0 · build ✓ |

## Importer — cara kerja

1. Fetch 5 file Aozora (Shift_JIS) → decode → ambil `<div class="main_text">`.
2. Ekstraksi per puisi: `head` (heading h3–h5), `slice` (antara dua baris penanda), atau `until` (sampai baris penanda).
3. Parse `<ruby>` → segmen `{t, r}`; teks biasa → `{t}`.
4. Segmen tanpa `r` yang berkanji dipecah per run kanji; bacaan diisi dari `POEM_READINGS` → `GLOBAL_READINGS`; **kalau ada yang belum terpetakan, script THROW + daftar** → tambah peta → ulang (loop deterministik, tidak ada tebakan diam-diam).
5. Merge ke `poems.json`: 7 klasik dipertahankan, ameni diganti, 11 baru di-append.

## Verifikasi browser (port 5174, mock SpeechRecognition)

- Tab Puisi: 6 chip + jumlah; "Semua" 19 kartu; tiap tema 3 kartu; badge baris tampil (13/16/30/36…).
- Buka 汚れつちまつた悲しみに…… (16 baris): furigana render + toggle; ucap 1 baris → +5 XP.
- Selesaikan penuh あなたはだんだんきれいになる (13 baris) via mock: 13×5 + 25 = **90 XP**; SRS `poem_takamura_dandan` streak 1; panel selesai benar.
- 雨ニモマケズ: 30 baris (versi lengkap).
- Review: puisi yang sudah selesai muncul sebagai weak item; soal review render + distractor dari puisi.
- HP 390px: chip wrap rapi; desktop: grid 2 kolom.

## Risiko & mitigasi

- **Bacaan kanji kuno salah** → importer throw per run yang belum dipetakan; review baris-per-baris vs dump sumber; test anti-kanji di bacaan.
- **旧仮名 beda 1 kana dari ucapan modern** (もみぢ/もみじ, ゐ/い) → matching level-baris menoleransi (baris panjang ≈ 0.9); konsisten dengan puisi lama (蛙 = かわず).
- **Aozora revisi file** → URL + tanggal akses dicatat di script; importer bisa dijalankan ulang.

## Log Eksekusi (26/09/2026, "lanjut")

**Status: T1–T3 SELESAI & committed; T4 verifikasi browser selesai, docs di-commit terpisah.**

### T2 — Importer + data (`ceae4ef`, `feat(speaking): 12 puisi panjang bertema + 雨ニモマケズ lengkap`)
- Blocker `~` path fixed: Node di Windows tidak expand `~` → pakai path eksplisit `C:\Users\maddo\aozora_research`.
- Gaiji 蔭（雨ニモマケズ「野原ノ松ノ林ノ蔭」）→ かげ; mode dump kini mengumpulkan gaiji tak terpetakan (tidak throw prematur).
- **Dukungan bacaan per-baris** (`READINGS.perLine`): 生=うま/うんだ, 下=した/くだ, 一=いち/ひと — kasus nyata dalam satu puisi.
- **Split compound**: 一人立→ひとりだち, 二人静か→ふたりしずか (hindari dobel baca).
- Bug `\r\n` di segmen ruby dibersihkan (`.replace(/[\r\n]+/g, '')`).
- Koreksi bacaan besar berbasis **file ruby resmi Aozora** (zip + HTML), bukan tebakan: 洗=あら, 日=ひ, 失=うしな, 云=い, 教=おし, 月=つき, 誘=いざな, 爽=さわ, 拓=ひら, 輝=かがや, 無辺際=むへんさい, 肉身=にくしん, 天地=あめつち, 百合花=ゆりか, 子等=こら, 腕=かひな, 伽藍=がらん, 案山子=かかし, 吁=ああ.
- **Rekonsiliasi jumlah baris** vs HTML mentah Aozora: 樹下の二人 **35** (plan 36), 道程 **14** (plan 16) — baris tanggal (大正一二・三 dll) non-puisi, di-drop benar. Sisanya (dandan 13, lemon 18, dst.) sudah sesuai plan. `ameni` = 30 baris penuh.
- Gate: importer **0 bacaan hilang, 0 furigana non-kana**; tests **184/184**; lint 0.
- Catatan: `mismatch.tsv` sesi riset terbukti **saran per-file** (kontaminasi silang) → semua keputusan akhir berbasis baris persis dari zip resmi.

### T3 — Filter tema (`d1e021b`, `feat(speaking): filter tema puisi + badge jumlah baris`)
- `POEM_THEMES` 6 chip (Semua/Klasik/Cinta/Kesedihan/Kesenangan/Bersyukur; label id+en) + `filterPoemsByTheme` (classic = tanpa tema) — null-safe, ada test.
- `Speaking.jsx`: chip + jumlah, badge "N baris" di kartu.
- poems.test mengambil daftar tema dari `POEM_THEMES` (satu sumber kebenaran).
- Tests 184/184 · lint 0 · build ✓.

### T4 — Verifikasi browser (port 5174)
- Chip: **All 19 / Classic 7 / Love 3 / Sadness 3 / Joy 3 / Gratitude 3**; tiap tema berisi puisi benar.
- 雨ニモマケズ 30 baris + 38 ruby; 臨終 bacaan hasil verifikasi tampil benar (洗=あら, 腕=かひな, 子等=こら, 百合花=ゆりか).
- Toggle furigana 38→0→38; HP 390px back button aman (top=32/56, left=16).
- Tanpa SpeechRecognition: 30 tombol "Mark as read" → semua ✓ → "Poem complete! 🎉 / Self-assess — no XP" (fallback mandiri utuh).
- Dengan mic gagal (Recording failed) → error state tampil, tidak crash.
- PRD §9.10 diperbarui (19 puisi, tema, sumber Aozora).
