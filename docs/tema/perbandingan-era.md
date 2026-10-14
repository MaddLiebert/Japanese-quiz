# PERBANDINGAN — 6 Tema Era: Fitur Khas Masing-Masing

**Versi:** 1.0
**Status:** Referensi (turunan kode + PRD; bukan PRD baru)
**Tanggal:** 2026-10-14
**Sumber:** `docs/tema/{heian,edo,meiji,showa,anime,cyberpunk}.md` + `docs/tema/{meiji,anime}-mekanik.md` + verifikasi langsung di `src/`
**Tujuan:** satu tabel yang menjawab "fitur apa yang HANYA ada di era X" — supaya tidak ada duplikasi mekanik antar-era dan mudah melihat celah yang belum dibangun.

---

## Ringkasan Satu Layar

Enam era berbagi **satu inti yang sama** (kuis, Shop, Inventory, Profile, Settings, Leaderboard, Sync, Death Quiz, Ujian N5). Yang membedakan = **mekanik khas + halaman khas + ornamen + varian gacha + nama UI**. Tiap era punya **tepat satu varian gacha**, **tepat satu checkpoint**, **satu cinematic perkenalan**, dan **satu mata uang**. Anime Multiverse = paling kaya (sistem 3 lapis); Cyberpunk = paling unik aturannya (ujian campuran semua era + glitch permanen) tapi **gacha & audio masih TBD**.

---

## 0. Yang SAMA di semua era (bukan pembeda)

| Fitur | Gate |
|---|---|
| Kuis inti: Learn · Practice · Mondai · Review · Writing · Speaking | — |
| Shop · Inventory · Profile · Settings · Leaderboard · Sync | — |
| **Death Quiz 死闘** | rank **Shogun** (bukan era) |
| **Ujian N5 模擬試験** | rank + kanji dikuasai (bukan era) |
| Nama UI (Shop/Gacha/uang/dll) | **berganti teks** per era (`eraNames.js`), bukan fitur baru |
| Warna · bentuk · font · motion · dark mode | berganti per era (token CSS), bukan fitur baru |

---

## 1. Tabel Induk — Fitur Khas per Era

| # | Era | Lv | Materi | Varian gacha | Checkpoint | Cinematic | Mata uang | Halaman khas |
|---|-----|----|--------|--------------|------------|-----------|-----------|--------------|
| 1 | **Heian 平安** | 1 | Kana | **貝合わせ** (kerang) | *(tidak ada)* | 平安 | 文 / もん | — |
| 2 | **Edo 江戸** | 20 | Kotoba + Kanji | **富くじ** (木札) | **箱根関所** | 江戸 | 両 | — |
| 3 | **Meiji 明治** | 50 | Grammar + Reading | **福引** | **国会** | 明治 | 円 | Typesetting · Neologism · Koseki · PrintShop · Codex |
| 4 | **Shōwa 昭和** | 100 | Ujian N5 | **ガチャガチャ** (kapsul) | **卒業** (= N5) | 昭和 | 円 | — |
| 5 | **Anime 多元** | 150 | Budaya pop | **クレーンゲーム** (cakar) | **最終回** | 多元 | コイン | Shop dunia · Claw · 5 mode latihan |
| 6 | **Cyberpunk 電脳** | 300 | Endgame | **ハック** ⚠️TBD | **終** | 電脳 | クレジット | Owari exam |

---

## 2. Per-Era — Detail

### 2.1 HEIAN 平安 (Lv 1) — default, materi Kana

| Fitur khas | Bukti kode |
|---|---|
| **貝合わせ kai-awase** — gacha = mencocokkan **pasangan kerang** (bukan reel) | `gacha/slot.js` `HEIAN_SHELL_PAIRS`, `buildShellStrips` |
| **Watermark kaligrafi raksasa** 雅/詠/雲 (under-drawing emakimono) | `App.jsx` `.era-watermark` |
| Bentuk **lembut** — kartu membulat, shadow halus, tepi tinta kuas | `index.css` filter `#heian-ink`, `#heian-rough`, `#heian-torn` |
| Font **Klee One** (kana) + **Yuji Syuku** (judul) | `index.css` |
| Teks item versi **kana** (`name_heian`/`desc_heian`) — pemain belum bisa kanji | `items/items.js` |
| Mata uang **文 / もん** | `progress/medaruCopy.js` |

> **Unik:** satu-satunya era dengan bentuk membulat/lembut + watermark. **Tidak punya checkpoint** (era awal, tak ada gerbang naik dari sebelumnya).

### 2.2 EDO 江戸 (Lv 20) — materi Kotoba + Kanji

| Fitur khas | Bukti kode |
|---|---|
| **富くじ tomikuji** — gacha = menarik **木札 kayu** dari 富箱, segel 富 | `slot.js` `buildEdoStrips`; `GachaSlotOverlay` `edo-tomi-*` |
| **Checkpoint 箱根関所** (pos pemeriksaan) | `HakoneCheckpoint.jsx`, `cinematic/edo/edoCheckpoint.js` |
| **夜市 yomise** dark mode — 提灯, 屋台, kerumunan, 花火 | `EdoNightFestival` |
| Ornamen **暖簾 noren** + **提灯 chōchin** (gantung, berayun ikut scroll) | `EdoNoren`, `EdoLantern` |
| Tepi **ukir kayu** (edo-carve) + grain cetakan ukiyo-e | filter `#edo-carve` |
| Segel merah **極** | `App.jsx` `.era-seal` |
| Mata uang **両 ryō** | `medaruCopy.js` |

### 2.3 MEIJI 明治 (Lv 50) — materi Grammar + Reading

Era dengan **paling banyak halaman khas** (kota surat kabar).

| Fitur khas | Halaman / kode |
|---|---|
| **活字組み Typesetting** — menyusun huruf logam jadi kalimat | `/typesetting` |
| **新語 Neologism** — pemain menciptakan kata dari kanji (spt 哲学/科学) | `/neologism` |
| **戸籍 Koseki** — "buku hidup" pemain | `/koseki` |
| **印刷所 PrintShop** — gate: era Meiji + Lv 50 + ≥5 edisi | `/printshop`, `printshop/printshop.js` |
| **Codex つながり** — benang lintas-era (灯り/道/銭/報), **mulai di sini** | `/codex`, `codex/threads.js` |
| **GLITCH** — UI berkedip ke Cyberpunk, makin sering makin tinggi level | `glitch/glitch.js` `glitchChance` |
| **号外 gōgai** — koran larut malam (00–04), isi = laporan tentangmu | `news/gogo.js` |
| **Checkpoint 国会** | `KokkaiCheckpoint.jsx` |
| **MeijiPress** (meja 活字) + 瓦斯灯 lampu gas + 文選 | `theme/MeijiPress`, `MeijiGaslight` |
| **Companion** — jejak Nacht/Saku, app "bernapas" & bertanya balik | `meiji/MeijiCompanion.jsx` |
| **和魂洋才** (rasio 和/洋) · **縦→横** (arah teks) · **時刻** (waktu) | `meiji-mekanik.md` M2/M6/M7 |
| Mata uang **円** · segel **明** | `medaruCopy.js`, `App.jsx` `.meiji-seal` |

> **Unik:** satu-satunya era yang memulai **Codex** dan **GLITCH**; satu-satunya dengan **4 halaman khas** (Typesetting/Neologism/Koseki/PrintShop).

### 2.4 SHŌWA 昭和 (Lv 100) — materi Ujian N5

| Fitur khas | Bukti kode |
|---|---|
| **ガチャガチャ gachapon** — mesin kapsul | `slot.js` (varian kapsul) |
| **Checkpoint 卒業** = ujian N5 sungguhan | `SotsugyoCheckpoint.jsx` + `n5exam/` |
| **夜の団地** dark mode — jendela beton menyala | `index.css` |
| Ornamen **電柱 tiang listrik**, **看板 papan**, **東京タワー** | `ShowaDenchu/Kanban/Tower` |
| Profil = **履歴書** (CV) | `eraNames.js` |
| Konsep **「土台は凍らせる」** — echo base (tambah beton, bukan ganti bentuk) | `showa.md §0` |

> **Unik:** satu-satunya era **"echo base"** (bentuk tidak diganti); checkpoint-nya = **ujian N5 yang sama** yang dipakai app.

### 2.5 ANIME MULTIVERSE 多元 (Lv 150) — Budaya pop

Era **paling kaya** — bukan sekadar tema, tapi **sistem 3 lapis**.

| Fitur khas | Bukti kode |
|---|---|
| **Arsitektur 3 LAPIS** (era → franchise → karakter) | `anime.md §11` |
| **Lapis 2 — BELI dunia** (5 orisinal + JJK live + One Piece/JoJo teaser) | `anime/franchises.js`, `/anime-shop`, `WorldShelf` |
| **Lapis 3 — GACHA karakter** | `/anime-claw` |
| **クレーンゲーム** — gacha = cakar arcade menjatuhkan figur | `slot.js` `buildClawStrips` |
| **推し oshi** — karakter favorit bereaksi tiap event | `oshi/oshi.js` |
| **必殺技 hissatsu** — efek jurus per karakter | `anime/characters.js`, `effects/` |
| **5 mode latihan bahasa pop**: オノマトペ · タメ口↔敬語 · セリフ組み · 若者言葉 · カタカナ | `/anime-practice?mode=…` |
| **メタ / 4th-wall** — app "sadar" dirinya anime (「つづく」) | `meta/meta.js` |
| **名刺** profil kartu tukar 推し活 | `profile/meishi.js` |
| **デイリー = 第N話** (misi harian sebagai episode) | `quests/episode.js` |
| **集中線 & ベタフラッシュ** (impact frame manga) | `effects/impact.js` |
| **打ち切り** — sisi gelap industri pop | `news/darkPages.js` |
| **GLITCH paling kuat** (era terdekat rumah Nacht/Saku) | `glitch.js` `glitchChanceAnime` |
| **Nuansa dunia** (JJK → 'cursed') + BGM khas dunia | `franchiseNuance`, `themeBgmKey` |
| **Checkpoint 最終回** | `AnimeCheckpoint.jsx` |
| Ornamen **film/panel/gate** + garis panel manga | `AnimeFilm/Panel/Gate`, filter `#anime-ink` |
| Mata uang **コイン** | `medaruCopy.js` |

### 2.6 CYBERPUNK 電脳 (Lv 300) — Endgame

| Fitur khas | Bukti kode |
|---|---|
| **Checkpoint 終 dengan 4 aturan tersulit**: ① mode dingin ② ambang lulus naik ③ sekali jalan (tanpa retry) ④ waktu ketat | `cinematic/cyberpunk/cyberpunkCheckpoint.js` |
| **総復習** — ujian **campuran SEMUA era** (bukan materi baru) | `OwariCheckpoint.jsx`, `/owari-exam` |
| **GLITCH PERMANEN** — selalu glitch | `glitch.js` `glitchPermanent` |
| **完 (tamat)** + hadiah **N5Certificate** — ending app | `n5exam/N5Certificate.jsx` |
| **「家」Rumah** — bukan 8 perhentian; rumah Nacht & Saku (AI) | `cyberpunk.md §7` |
| **宵/真夜中** dark mode (senja → tengah malam) | `index.css` |
| Ornamen **kabel serat optik, HUD, spire** | `CyberCable/Hud/Spire` |
| Mata uang **クレジット** | `medaruCopy.js` |
| **ハック** gacha | ⚠️ **TBD** (`cyberpunk.md §16`) |
| Audio tema | ⚠️ **TBD** |

> **Unik:** satu-satunya era **tanpa 8 perhentian** (5 titik "rumah"), **satu-satunya checkpoint yang memakai aturan khusus**, dan **satu-satunya ending** (完).

---

## 3. Matriks "Hanya Ada di Era Ini"

| Fitur | Heian | Edo | Meiji | Shōwa | Anime | Cyber |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| Gacha kerang 貝合わせ | ✅ | | | | | |
| Gacha 木札 富くじ | | ✅ | | | | |
| Gacha 福引 | | | ✅ | | | |
| Gacha カプセル | | | | ✅ | | |
| Gacha クレーン (cakar) | | | | | ✅ | |
| Gacha ハック | | | | | | ⚠️TBD |
| Checkpoint | | ✅箱根 | ✅国会 | ✅卒業 | ✅最終回 | ✅終 |
| Cinematic perkenalan | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Codex つながり** | | | ✅(mulai) | | ✅(lanjut) | |
| **GLITCH** | | | ✅(sesekali) | | ✅(kuat) | ✅(permanen) |
| **号外 gōgai** | | | ✅ | | | |
| **Typesetting 活字組み** | | | ✅ | | | |
| **Neologism 新語** | | | ✅ | | | |
| **Koseki 戸籍** | | | ✅ | | | |
| **PrintShop 印刷所** | | | ✅ | | | |
| **Franchise (beli dunia)** | | | | | ✅ | |
| **Karakter gacha + 推し** | | | | | ✅ | |
| **5 mode latihan pop** | | | | | ✅ | |
| **名刺 / デイリー / impact frame** | | | | | ✅ | |
| **Ujian campuran semua era** | | | | | | ✅ |
| **Ending 完 + sertifikat** | | | | | | ✅ |
| **Watermark + bentuk lembut** | ✅ | | | | | |
| **Dark mode khas** | istana malam | 夜市 | 瓦斯灯の夜 | 夜の団地 | 深夜アニメ | 宵/真夜中 |

---

## 4. Benang cerita lintas-era (bukan fitur UI, tapi khas)

| Era | Sisi gelap | Kanji | Aturan nada |
|---|---|---|---|
| Meiji | 「第二面」 harga kemajuan | 農民一揆 · 徴兵 · 西南戦争 | 「新聞は叫ばない」 |
| Shōwa | 「灰の中の声」 | 終戦 · 焼け跡 · 公害 | 「記録は叫ばない」 |
| Anime | 「画面の向こう」 industri pop | 過労 · 炎上 · 廃課金 | 「照明は見せない」 |
| Cyberpunk | 「常夜の光」 | 不眠 · 孤独 · 監視 · 別れ | 「灯りは消えない」 |

> Item langka **out-of-place** ("???") di gacha Meiji/Shōwa/Anime = petunjuk cerita Nacht/Saku (penyamaran makin retak → terbuka di Cyberpunk).

---

## 5. Celah yang BELUM dibangun (jujur)

| Item | Status |
|---|---|
| Gacha **ハック** Cyberpunk | ⚠️ TBD (`cyberpunk.md §16`) |
| Audio tema Cyberpunk | ⚠️ TBD |
| Cinematic Cyberpunk | ⚠️ TBD (route ada, isi TBD) |
| Gerbang era untuk voice pack anime | 📄 rencana (`anime-voice-pack-gating.md`) |

---

## Ringkasan Satu Layar (ulang)

**Tiap era punya satu gacha, satu checkpoint, satu cinematic, satu mata uang.** Pembeda terkuat: **Meiji** (4 halaman khas: Typesetting/Neologism/Koseki/PrintShop + mulai Codex & GLITCH), **Anime** (sistem 3 lapis: beli dunia → gacha karakter → 推し + 5 mode latihan pop), **Cyberpunk** (ujian campuran semua era + 4 aturan tersulit + glitch permanen + ending 完). **Heian** satu-satunya tanpa checkpoint & satu-satunya berbentuk lembut. **Shōwa** satu-satunya "echo base". Celah: gacha/audio/cinematic Cyberpunk masih TBD.
