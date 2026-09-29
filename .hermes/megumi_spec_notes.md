## SPEC - Megumi.md

1|---
2|date: 2026-09-28
3|description: "Spec lengkap efek pack Megumi Fushiguro (伏黒恵, pack_10, rare) — 十種影法術: ladder 玉犬/鵺 → 大蛇(10) → 満象(20) → 虎葬(30), ultimate 魔虚羅 (bar 20) dengan mekanik 適応 (adaptasi: salah gak hangus, roda 八握剣 8 takik, roda penuh → cabut pedang 必中 mini, salah ke-9 → 輪砕け streak hangus). Identitas visual: bayangan (影). SFX ≥2 lapis per jurus. Link: [[Efek JJK]]"
4|tags:
5|  - brain
6|  - efek-jjk
7|  - megumi
8|---
9|
10|# Megumi Fushiguro 伏黒恵
11|
12|> Pack **`pack_10`** · rarity **`rare`** · icon 🐺 · visual `megumi` (baru) · voice `megumi`
13|> Judul efek: **十種影法術** (Ten Shadows Technique)
14|> Prinsip: **`rare` = ladder jurus makin OP + ultimate one-shot (TANPA Domain Expansion).** Semua efek **TEBAL** (≥2 lapis visual + ≥2 lapis SFX).
15|>
16|> **STATUS: 🔒 TERKUNCI — design + aset + wiring + SFX + mekanik siap, belum eksekusi.**
17|> **Aset suara: ✅ 9 klip (TTS web user) + sebagian GIF.**
18|> Plan teknis lengkap: `.hermes/plans/2026-09-28_212847-megumi-fushiguro-pack10.md`.
19|
20|## ⚡ Ringkasan cepat
21|
22|| Streak | Jurus | Klip | Kanji | Warna |
23||---|---|---|---|---|
24|| non-streak (rotasi) | 玉犬 | `gyokuken.mp3` | 玉犬 | ⚪ perak |
25|| non-streak (rotasi) | 鵺 | `nue.mp3` | 鵺 | 🟣 indigo |
26|| **10** | 大蛇 | `orochi.mp3` | 大蛇 | 🟢 teal |
27|| **20** | 満象 | `bansou.mp3` | 満象 | 🔵 biru air |
28|| **30+** | 虎葬 | `kosou.mp3` | 虎葬 | 🟠 amber |
29|| **bar penuh → tap** | **魔虚羅 · 適応** | `mahoraga.mp3` | 布瑠部由良由良 → 魔虚羅 | 🟪 ungu-bayangan |
30|
31|**Bar** = 20 slot. **Ultimate** = state 30 dtk, timer **JALAN** (pola `rare`).
32|**Kalah** = `hazushita` / `chi` / `tsugi_de_kimeru` (acak).
33|
34|## Keputusan desain (FINAL — brainstorming 28/09)
35|
36|1. **Pola skill/ladder, bukan 3/3/3 generik** — jurus makin OP seiring streak (struktur Sukuna).
37|2. **Ultimate = 魔虚羅, BUKAN Domain** — `rare` = one-shot; 嵌合暗翳庭 **off**.
38|3. **Mekanik = A · 適応 (Adaptation)** — filosofi **KETAHANAN**. (Gojo KONTROL · Yuji PENGHANCURAN · Sukuna PEMBANTAIAN · Megumi KETAHANAN.)
39|4. **Overlap Sukuna dibagi** — Sukuna 魔虚羅 = raksasa/terkontrol (Meguna); Megumi = kecil/terbatas/切札.
40|5. **GIF opsional per skill** — yang punya GIF pakai GIF; yang tidak → **kanji teks cukup**.
41|6. **SFX wajib tiap jurus** (min 2 lapis) — "biar gak sepi".
42|
43|## 🎨 Identitas visual — BAYANGAN (影)
44|
45|- **Bahasa:** bayangan cair mengalir & menelan; siluet shikigami **bangkit dari genangan** di lantai (bukan plasma/api/tebasan).
46|- **Warna:** tinta hitam `#0a0a0a` + highlight perak `#cbd5e1` + aksen 藍 indigo `#4338ca`.
47|- Beda total dari Gojo (plasma/ruang), Yuji (api), Sukuna (kuil/tebasan).
48|- Render CSS/SVG murni (tajam semua ukuran) — GIF hanya cut-in kanon kalau ada.
49|
50|## ⚔️ Skill per streak
51|
52|| Streak | Jurus | Visual (≥3 lapis) | SFX (≥2 lapis) |
53||---|---|---|---|
54|| non-streak | 玉犬 | 2 siluet serigala meleset dari genangan + 3 goresan cakar + wash | `playGyokuken` + `playClawSwipe` |
55|| non-streak | 鵺 | siluet burung 人面 + petir ungu dari ATAS + sayap bayangan | `playNueScreech` + `playNueThunder` + `playShadowRustle` |
56|| 10 | 大蛇 | ular raksasa nglilit + sisik perak + lantai retak | `playOrochiHiss` + `playOrochiRumble` |
57|| 20 | 満象 | gajah bayangan + semburan air belalai + riak | `playBansouWater` + `playBansouTrumpet` |
58|| 30 | 虎葬 | harimau menerkam + cakar amber + retak taring | `playKosouRoar` + `playKosouSlash` |
59|
60|## 🌑 魔虚羅 · 適応 — Ultimate (bar 20 → tap)
61|
62|**Cinematic:** veil gelap → genangan menyebar → chant 布瑠部由良由良 per-karakter → roda 八握剣 muter → siluet raksasa bangkit → kanji 魔虚羅 → flash + boom → settle (roda kecil persist).
63|
64|**Mekanik 適応:**
65|- Summon = state **30 dtk**, timer **JALAN**. Charge reset saat cast.
66|- **Salah selama summon → 適応:** streak **TIDAK hangus** + roda **+1** + kanji 適応 flash + **1 opsi salah soal berikutnya dihapus**.
67|- **Benar selama summon:** streak lanjut, roda tidak maju.
68|- **Roda penuh 8/8 (八握)** → **cabut 八握剣** → sisa durasi **SEMUA opsi salah terpotong** (必中 mini).
69|- **Salah ke-9 (roda sudah penuh)** → **輪砕け** → roda pecah, summon **bubar**, **streak HANGUS** (backlash 切札).
70|- **Timeout** → padam alami, streak tetap.
71|
72|> **Filosofi:** Megumi = KETAHANAN. Ultimate = asuransi yang snowball jadi kekuatan (makin salah makin kebal & ngebantu), bayarannya risiko 輪砕け. Beda dari Sukuna yang menyerang (必中) — Megumi bertahan.
73|
74|## 🔊 SFX
75|
76|- **Reuse:** `playDomainBoom`, `playDomainCollapse`, `playSlash`, `playWheelCreak`, `playGiantStep`, `playNueThunder`/`playNueScreech` (shared Sukuna), `duckAmbience`.
77|- **Baru:** `playGyokuken` · `playClawSwipe` · `playShadowRustle` · `playOrochiHiss` · `playOrochiRumble` · `playBansouWater` · `playBansouTrumpet` · `playKosouRoar` · `playKosouSlash` · `playMakoraChant` · `playMakoraRoar` · `playAdaptFlash` · `playSwordUnsheathe` · `playWheelShatter` · `playShadowSwallow`.
78|- **Ambience:** `src/utils/megumiAmbience.js` — drone bayangan + bisikan 呪詞 (hidup selama summon) + ducking.
79|
80|## 📁 Aset
81|
82|- `public/voices/megumi/` — 9 klip (rename: `gyokuken`, `nue`, `orochi`, `bansou`, `kosou`, `mahoraga`, `hazushita`, `chi`, `tsugi_de_kimeru`).
83|- `public/effects/` — GIF opsional.
84|- Backup klip generik lama → `.voice-backup/megumi-placeholder/`.
85|
86|## 🔌 Wiring
87|
88|- `voices.js` → `megumi` pola `clips` (6 klip) + `wrong` 3.
89|- Baru: `megumiFx.js` (+test), `MegumiBurst.jsx`, `MegumiShadow.jsx`, `megumiAmbience.js`.
90|- Edit: `visuals.js` + `packs.js` (visual `'megumi'`) + `EffectContext.jsx` (jalur `'megumi'`) + `sfx.js` + `voices.test.js` + `reviewClips.test.js`.
91|
92|## 🚫 Anti-nabrak
93|
94|- 魔虚羅: Megumi kecil/切札 vs Sukuna raksasa/terkontrol.
95|- Domain: Megumi ❌ (rare) · Sukuna ✅.
96|- 鵺 = kanon Megumi (Sukuna pakai karena Meguna).
97|- Ultimate: Megumi 適応 (bertahan) vs Sukuna 必中 (menyerang).
98|
99|## Terkait
100|
101|- [[Efek JJK]] — index karakter
102|- [[Yuji Itadori]] — pola kode `rare`
103|- [[Sukuna]] — pola ladder + SFX + pembagian 魔虚羅
104|- [[Key Decisions]] — keputusan desain pack

## PLAN

1|# Megumi Fushiguro — pack_10 (rare) · 十種影法術
2|
3|> Pack **`pack_10`** · rarity **`rare`** · icon 🐺 · visual `megumi` (baru) · voice `megumi`
4|> Kanji: 伏黒恵 · Judul efek: **十種影法術** (Ten Shadows Technique)
5|> Prinsip: **`rare` = ladder jurus makin OP + ultimate one-shot (TANPA Domain Expansion).**
6|> Semua efek **TEBAL** (≥2 lapis visual + ≥2 lapis SFX) — user: *"efek skill lumayan tebel"*.
7|>
8|> **STATUS: 🔒 TERKUNCI (design + aset + wiring + SFX + mekanik) — belum eksekusi.**
9|> **Aset suara: ✅ 9 klip sudah dibuat user (TTS web) + sebagian GIF.**
10|> **Ultimate = 魔虚羅 (Mahoraga) dengan mekanik 適応 — BUKAN domain (rare).**
11|>
12|> Eksekusi: buka repo `C:\Users\maddo\Documents\japanese-quiz` di terminal baru → baca doc ini + [[Yuji Itadori]] (pola kode `rare`) + [[Sukuna]] (pola ladder & SFX) → kerjakan per tahap.
13|
14|## ⚡ Ringkasan cepat
15|
16|| Streak | Jurus | Klip | Kanji | Warna |
17||---|---|---|---|---|
18|| non-streak (rotasi) | 玉犬 (Divine Dogs) | `gyokuken.mp3` | 玉犬 | ⚪ perak |
19|| non-streak (rotasi) | 鵺 (Nue) | `nue.mp3` | 鵺 | 🟣 indigo |
20|| **10** | 大蛇 (Great Serpent) | `orochi.mp3` | 大蛇 | 🟢 teal |
21|| **20** | 満象 (Max Elephant) | `bansou.mp3` | 満象 | 🔵 biru air |
22|| **30** | 虎葬 (Tiger Funeral) | `kosou.mp3` | 虎葬 | 🟠 amber |
23|| **bar penuh → tap** | **魔虚羅 (Mahoraga) · 適応** | `mahoraga.mp3` | 布瑠部由良由良 → 魔虚羅 | 🟪 ungu-bayangan |
24|
25|**Bar** = 20 slot (pola JJK konsisten). **Ultimate** = state 30 dtk, timer **JALAN** (pola `rare`: Yuji/Sukuna — bukan beku seperti Gojo).
26|**Kalah** = `hazushita` / `chi` / `tsugi_de_kimeru` acak (bayangan nelan tombol yang dipencet).
27|
28|## Keputusan desain (FINAL — hasil brainstorming 28/09)
29|
30|1. **Pola = skill/ladder, bukan 3/3/3 generik** (user: *"pake skill aja non streak / streak"*). Jurus naik makin OP seiring streak, persis struktur Sukuna.
31|2. **Ultimate = 魔虚羅 (Mahoraga), BUKAN Domain Expansion** (user: *"betul"*). `rare` = one-shot, tanpa domain. 嵌合暗翳庭 **off the table**.
32|3. **Mekanik Mahoraga = A · 適応 (Adaptation)** (user: *"a"*) — satu-satunya filosofi yang belum dipakai: **KETAHANAN/ADAPTASI**. (Gojo = KONTROL, Yuji = PENGHANCURAN, Sukuna = PEMBANTAIAN.)
33|4. **Overlap Sukuna dibagi** (user: *"oke"*): Sukuna manggil 魔虚羅 versi **raksasa/terkontrol** (Meguna, streak 20); Megumi punya versi **kecil/terbatas/切札** (ultimate bar). Kata & visual beda → aman.
34|5. **GIF opsional per skill** (user: *"yang gif nya gak ada cukup teks aja"*): skill yang punya GIF → pakai GIF; yang belum → **cukup kanji teks** (tidak wajib GIF).
35|6. **SFX wajib ada di tiap jurus** (user: *"jangan lupa adain sfx biar gak sepi"*) — min 2 lapis per skill.
36|
37|## 🎨 Identitas visual Megumi (ciri khas — WAJIB, beda dari 3 pack lain)
38|
39|Tiap pack punya "bahasa visual" sendiri. Megumi = **bayangan cair (影) yang mengalir & menelan**:
40|
41|| Pack | Bahasa visual | Warna inti |
42||---|---|---|
43|| Gojo | plasma / ruang angkasa | ungu-biru |
44|| Yuji | api | merah-oranye |
45|| Sukuna | kuil / tebasan darah | merah-ungu |
46|| **Megumi** | **bayangan (影) — genangan hitam, siluet shikigami bangkit** | **tinta hitam `#0a0a0a` + highlight perak `#cbd5e1` + aksen 藍 indigo `#4338ca`** |
47|
48|**Aturan render:**
49|- Semua jurus = siluet shikigami **bangkit dari genangan bayangan** di lantai (bukan plasma/api/tebasan).
50|- Bayangan **mengalir & melebar** (blob + turbulence filter, tepi organik) — bukan bentuk kaku.
51|- Highlight perak tipis di tepi siluet (biar kebaca di tema gelap) + rim indigo.
52|- **Bukan GIF untuk petir/bayangan** — CSS/SVG murni (aturan Yuji/Sukuna: tajam semua ukuran). GIF hanya untuk cut-in kanon (kalau user punya).
53|- `prefers-reduced-motion`: kanji + siluet **tetap tampil** (informasi kanon); shake/aliran bayangan/flash disembunyikan.
54|
55|## 🎧 Voice — 9 klip (✅ sudah dibuat user, TTS web)
56|
57|Lokasi target: `public/voices/megumi/` — **aturan nama**: `/^\/voices\/megumi\/[a-z0-9_]+\.mp3$/` (lowercase + underscore, **spasi & strip DILARANG**).
58|
59|**Rename saat copy dari folder user → `public/voices/megumi/`:**
60|
61|| Nama file user | → Target | Isi |
62||---|---|---|
63|| `gyokuken` | `gyokuken.mp3` | 「玉犬」 |
64|| `nue` | `nue.mp3` | 「鵺」 |
65|| `orochi` | `orochi.mp3` | 「大蛇」 |
66|| `bansou` | `bansou.mp3` | 「満象」 |
67|| `kosou` | `kosou.mp3` | 「虎葬」 |
68|| `mahoraga` | `mahoraga.mp3` | 「布瑠部由良由良……魔虚羅」 (chant, ultimate) |
69|| `hazushitaka` | `hazushita.mp3` | 「外したか」 (salah) |
70|| `tch` | `chi.mp3` | 「ちっ」 (salah) |
71|| `tsugi de kimeru` | `tsugi_de_kimeru.mp3` | 「次で決める」 (salah) |
72|
73|**Backup dulu** 9 file generik lama (`correct_1..3`, `wrong_1..3`, `streak_1..3`) → `.voice-backup/megumi-placeholder/` (pola Yuji/Sukuna).
74|
75|> ⚠️ Timing klip (lead diam / durasi) **belum diukur** — sebelum bikin SFX & timeline cinematic, **ukur RMS Web Audio** dulu (pola `SUKUNA_CAST_VOICE` / `GOJO_CAST_VOICE`). **Jangan tebak** angka timing.
76|> ⚠️ Klip generik lama Megumi semuanya durasi **1.872s** (red flag) — abaikan, kita ganti total dengan 9 klip user ini.
77|
78|### Mapping momen → klip (deterministik, pola `sukunaTechniqueFor`)
79|```
80|non-streak  → rotasi 玉犬 ↔ 鵺       (gyokuken / nue, bergantian — bukan acak)
81|streak 10   → orochi                  (大蛇 — momen)
82|streak 20   → bansou                  (満象 — momen)
83|streak 30+  → kosou                   (虎葬 — momen)
84|bar penuh tap → mahoraga              (chant 布瑠部由良由良 → summon 魔虚羅)
85|salah       → hazushita / chi / tsugi_de_kimeru  (ACAK 3 pilihan)
86|```
87|
88|## ⚔️ Spec efek per skill (TEBAL — ≥2 lapis)
89|
90|### 1. 玉犬 — non-streak (base)
91|- **Visual (3 lapis):** ① **2 siluet serigala** meleset dari genangan bayangan di lantai (kiri & kanan) ② **3 goresan cakar** melintang (garis bayangan tajam + rim perak) ③ genangan menutup balik (shadow wash 0.4s).
92|- **SFX (2 lapis):** `playGyokuken` (lolongan rendah 420→180Hz + noise growl) + `playClawSwipe` (3 whoosh cakar 2200→600Hz, cepat).
93|- GIF: opsional (kalau ada `gyokuken.gif` → cut-in; kalau tidak → **kanji 玉犬 cukup**).
94|
95|### 2. 鵺 — non-streak (rotasi)
96|- **Visual (3 lapis):** ① **siluet burung 人面** bangkit dari bayangan (bukan api) ② **petir ungu nyamber dari ATAS** (beda dari Gojo yang dari tepi!) — 3 sambaran kiri-tengah-kanan ③ bulu/sayap bayangan melebar menutupi layar 0.3s lalu hilang.
97|- **SFX (3 lapis):** `playNueScreech` (jeritan 950→320Hz) + `playNueThunder` (guntur 130→28Hz) + `playShadowRustle` (noise bandpass = desir bayangan).
98|  - ⚠️ `playNueThunder`/`playNueScreech` juga dipakai Sukuna (Meguna) — **reuse kalau sudah dibikin**; kalau belum, bikin sekali di `sfx.js` (shared), jangan duplikat.
99|
100|### 3. 大蛇 — streak 10 (momen)
101|- **Visual (3 lapis):** ① **ular raksasa** nyembul dari bayangan & **nglilit** ② sisik bayangan berkilau perak ③ tanah/lantai "pecah" garis retak gelap.
102|- **SFX (2 lapis):** `playOrochiHiss` (desis 3 lapis 4000→800Hz, panjang) + `playOrochiRumble` (rumble 38→22Hz, berat).
103|- GIF: opsional → kanji 大蛇 cukup kalau tidak ada.
104|
105|### 4. 満象 — streak 20 (momen)
106|- **Visual (3 lapis):** ① **gajah bayangan** bangkit ② **semburan air** dari belalai (gradient biru, bukan api) ③ riak air menyebar di lantai.
107|- **SFX (2 lapis):** `playBansouWater` (semburan air 1600→300Hz + noise) + `playBansouTrumpet` (terompet gajah 300→140Hz).
108|- GIF: opsional → kanji 満象 cukup kalau tidak ada.
109|
110|### 5. 虎葬 — streak 30 (momen)
111|- **Visual (3 lapis):** ① **harimau bayangan** menerkam dari sisi ② **cakar raksasa** 3 goresan membara amber ③ lantai retak membentuk pola taring.
112|- **SFX (2 lapis):** `playKosouRoar` (auman harimau 260→90Hz, ganas) + `playKosouSlash` (3 tebasan 2600→500Hz + ekor boom 60Hz).
113|- GIF: opsional → kanji 虎葬 cukup kalau tidak ada.
114|
115|### 6. 魔虚羅 · 適応 — ULTIMATE (bar penuh → tap) ⭐⭐⭐
116|
117|**Urutan cinematic cast (SEMUA sync ke klip `mahoraga.mp3` — angka detik DIISI SETELAH UKUR RMS):**
118|```
119|0.00  veil gelap total + dread (drone bayangan mulai)
120|0.10  genangan bayangan menyebar dari TENGAH ke seluruh lantai
121|~0.3  kanji 布瑠部由良由良 muncul PER-KARAKTER (sync frasa chant)
122|--    RODA 八握剣 muncul di atas, muter 8 jari-jari (法輪)
123|--    siluet raksasa 魔虚羅 bangkit dari bayangan (badan hitam, kepala ular, pedang 八握剣)
124|--    kanji 魔虚羅 raksasa muncul 1× glow ungu-bayangan
125|--    SHAKE layar + aura 影 + bara hitam naik
126|--    FLASH + BOOM (playDomainBoom('bang') + playMakoraRoar)
127|--    settle: siluet+kanji naik & mengecil → RODA KECIL persist di UI
128|── persist 30 dtk ──
129|```
130|
131|**Mekanik 適応 (Adaptation) — inti ultimate:**
132|- Charge bar 20 → tap = **summon**. Saat cast: `streakRef` di-reset 0 (charge habis), state hidup **30 dtk**, **timer JALAN** (pola `rare`).
133|- **RODA 八握剣 = 8 takik** tampil persist selama summon (penanda "Mahoraga aktif" + meter adaptasi).
134|- **Jawaban BENAR** selama summon → streak lanjut normal, roda **tidak** maju (tidak ada yang perlu diadaptasi).
135|- **Jawaban SALAH** selama summon → **適応**: **streak TIDAK hangus**, roda **+1 takik**, kanji **適応** flash + auman, dan **1 opsi salah di soal BERIKUTNYA dihapus** (diadaptasi — di-arm ke soal berikut, pola skill Sukuna).
136|- **RODA PENUH (8/8 八握)** → Mahoraga **cabut 八握剣** (`playSwordUnsheathe`) → **sisa durasi: SEMUA opsi salah terpotong tiap soal** (mini-必中, pola `sukunaHitsumeCut` tapi window lebih pendek).
137|- **SALAH saat roda sudah penuh (ke-9)** → **輪砕け** (`playWheelShatter`) → roda pecah, summon **bubar seketika**, **streak HANGUS** = backlash 切札 (kanon: Mahoraga membunuh pemanggilnya).
138|- **Timeout** (30 dtk habis) → summon padam alami, **streak tetap** (`playDomainCollapse('timeout')`).
139|- **Salah di LUAR summon** (biasa) → streak reset normal + klip kalah.
140|
141|**Filosofi (dokumentasi wajib di komentar kode):**
142|> Megumi = **KETAHANAN**. Ultimate ini **asuransi yang snowball jadi kekuatan**: makin sering lu salah, makin kebal (streak gak hangus) & makin ngebantu (opsi salah dihapus). Bayarannya = risiko 輪砕け kalau kebanyakan salah. Bedakan dari Sukuna yang menyerang (必中) — Megumi **bertahan**.
143|
144|**Konstanta (tuning = 1 baris):**
145|```js
146|export const MEGUMI_ULT_THRESHOLD = 20;        // bar 20 (pola JJK konsisten)
147|export const MEGUMI_SUMMON_DURATION_S = 30;    // state, timer JALAN (rare)
148|export const MEGUMI_WHEEL_NOTCHES = 8;         // 八握剣 = 8 takik
149|export const MEGUMI_ADAPT_CUT = 1;             // 適応: 1 opsi salah / salah
150|```
151|
152|## 🔊 SFX — yang perlu dibikin (REUSE dulu yang ada!)
153|
154|**Reuse (kalau sudah ada dari Sukuna/Yuji/Gojo):** `playDomainBoom`, `playDomainCollapse`, `playSlash`, `playWheelCreak`, `playGiantStep`, `playNueThunder`/`playNueScreech` (shared), `duckAmbience`.
155|
156|**Baru (~13 fungsi, pola params-murni + play, min 2 lapis per skill):**
157|
158|| Fungsi | Dipakai | Karakter bunyi |
159||---|---|---|
160|| `playGyokuken` | 玉犬 | lolongan 420→180Hz + noise growl |
161|| `playClawSwipe` | 玉犬 | 3 whoosh cakar 2200→600Hz |
162|| `playNueScreech` | 鵺 | jeritan 950→320Hz *(shared Sukuna)* |
163|| `playNueThunder` | 鵺 | guntur 130→28Hz *(shared Sukuna)* |
164|| `playShadowRustle` | 鵺 | noise bandpass = desir bayangan |
165|| `playOrochiHiss` | 大蛇 | desis 3 lapis 4000→800Hz |
166|| `playOrochiRumble` | 大蛇 | rumble 38→22Hz |
167|| `playBansouWater` | 満象 | semburan air 1600→300Hz |
168|| `playBansouTrumpet` | 満象 | terompet gajah 300→140Hz |
169|| `playKosouRoar` | 虎葬 | auman harimau 260→90Hz |
170|| `playKosouSlash` | 虎葬 | 3 tebasan 2600→500Hz + boom 60Hz |
171|| `playMakoraChant` | mahoraga | drone ritual bayangan 55Hz + bel inharmonik |
172|| `playMakoraRoar` | mahoraga | auman raksasa 70→30Hz |
173|| `playAdaptFlash` | 適応 | chime gelap + shimmer (momen "belajar") |
174|| `playSwordUnsheathe` | roda penuh | tarikan logam 1200→400Hz (cabut pedang) |
175|| `playWheelShatter` | 輪砕け | pecah kaca/logam 3000→200Hz + boom |
176|| `playShadowSwallow` | salah | bayangan nelan (whoosh turun 500→80Hz) |
177|
178|**Registry lapisan** (pola `TECHNIQUE_SFX_LAYERS`, dites: tiap teknik ≥2 lapis):
179|```js
180|export const MEGUMI_TECHNIQUE_SFX_LAYERS = {
181|  gyokuken: ['playGyokuken', 'playClawSwipe'],
182|  nue:      ['playNueScreech', 'playNueThunder', 'playShadowRustle'],
183|  orochi:   ['playOrochiHiss', 'playOrochiRumble'],
184|  bansou:   ['playBansouWater', 'playBansouTrumpet'],
185|  kosou:    ['playKosouRoar', 'playKosouSlash'],
186|  mahoraga: ['playMakoraChant', 'playWheelCreak', 'playGiantStep', 'playMakoraRoar'],
187|  adapt:    ['playAdaptFlash'],
188|  sword:    ['playSwordUnsheathe'],
189|  shatter:  ['playWheelShatter'],
190|  wrong:    ['playShadowSwallow'],
191|};
192|```
193|
194|**Ambience baru — `src/utils/megumiAmbience.js`** (mirror `gojoAmbience.js`/`sukunaAmbience.js`):
195|- `startMegumiShadowBgm()` — drone bayangan 55/110Hz + pad gelap + **bisikan 呪詞** (noise bandpass 200–900Hz termodulasi pelan) + level 0.20, fadeIn 1600ms, fadeOut 900ms. Hidup selama summon.
196|- `stopMegumiShadowBgm()` — ramp down.
197|- Ducking: reuse `duckAmbience` dari `gojoAmbience.js`.
198|- **Semua fungsi no-op di node/test** (return false) — aman di-import.
199|
200|## 📁 Aset & penamaan
201|
202|```
203|public/voices/megumi/    ← 9 klip mp3 (tabel rename di atas)
204|public/effects/          ← GIF opsional (kalau ada): megumi_gyokuken.gif, megumi_mahoraga.gif, dst
205|.voice-backup/megumi-placeholder/  ← backup 9 klip generik lama
206|```
207|
208|## 🔌 Wiring (mengikuti pola `yuji*`/`sukuna*` — JANGAN ganggu jalur Gojo/Yuji/Sukuna)
209|
210|**`voices.js`** — ganti entry `megumi` jadi pola `clips` (kayak Gojo/Yuji/Sukuna):
211|```js
212|megumi: {
213|  files: {
214|    correct: [],
215|    wrong: ['/voices/megumi/hazushita.mp3', '/voices/megumi/chi.mp3', '/voices/megumi/tsugi_de_kimeru.mp3'],
216|    streak: [],
217|  },
218|  clips: [
219|    '/voices/megumi/gyokuken.mp3', '/voices/megumi/nue.mp3',
220|    '/voices/megumi/orochi.mp3', '/voices/megumi/bansou.mp3',
221|    '/voices/megumi/kosou.mp3', '/voices/megumi/mahoraga.mp3',
222|  ],
223|  synth: { correct: 'gong', wrong: 'thud', streak: 'gong-big' },
224|}
225|```
226|
227|**File kode baru:**
228|```
229|src/features/effects/megumiFx.js + megumiFx.test.js   ← logika murni (ladder, roda, timeline, warna, partikel)
230|src/features/effects/MegumiBurst.jsx                   ← visual per-skill (serigala/nue/ular/gajah/harimau)
231|src/features/effects/MegumiShadow.jsx                  ← MegumiCurseBar (20 slot + roda 8) + MegumiSummonCine + MegumiAura
232|src/utils/megumiAmbience.js + test                     ← BGM bayangan + bisikan + ducking
233|```
234|
235|**Edit:**
236|- `visuals.js` → tambah `megumi: { id:'megumi', label:'Megumi Ten Shadows', component:'megumi' }`
237|- `packs.js` → `pack_10` visual: `'dummy'` → `'megumi'` + update `desc`/`desc_en` (dari "visual menyusul")
238|- `EffectContext.jsx` → tambah jalur `'megumi'` (mirror `triggerYuji`/`triggerSukuna`, jalur terpisah)
239|- `sfx.js` → ~17 fungsi baru + params + `MEGUMI_TECHNIQUE_SFX_LAYERS`
240|- `voices.test.js` → test megumi diubah ke pola `clips` (6 klip, wrong 3, correct/streak kosong)
241|- `reviewClips.test.js` → keluarkan `'megumi'` dari loop generik; tambah assertion pola ladder
242|
243|**Konstanta penting di `megumiFx.js`:**
244|```js
245|export const MEGUMI_MILESTONES = [3,5,10,20,30,40,50,60,70,80,90,100]; // konsisten JJK
246|export const MEGUMI_ULT_THRESHOLD = 20;
247|export const MEGUMI_SUMMON_DURATION_S = 30;
248|export const MEGUMI_WHEEL_NOTCHES = 8;
249|export const MEGUMI_ADAPT_CUT = 1;
250|// + megumiTechniqueFor(kind, streak) → 'gyokuken'|'nue'|'orochi'|'bansou'|'kosou'
251|// + megumiCurseCharge / megumiUltReady / megumiSummonLeft / megumiSummonStartDelayMs
252|// + MEGUMI_STYLE (kanji + warna per jurus) + partikel generator (rng injectable)
253|// + megumiWheelNext / megumiAdaptCut (murni, deterministik, dites)
254|```
255|
256|## 🚫 Aturan anti-nabrak (WAJIB)
257|
258|| | Megumi (`rare`) | Sukuna (`special`) |
259||---|---|---|
260|| 魔虚羅 | versi **kecil/terbatas/切札** (ultimate bar, 適応) | versi **raksasa/terkontrol** (Meguna, streak 20 `furube`) |
261|| Domain | ❌ tidak ada (rare) | ✅ 伏魔御廚子 |
262|| 鵺 | **pemilik kanon** (bayangan + petir dari atas) | pakai karena Meguna (akurat) |
263|| Ultimate | **適応** (bertahan) | **必中** (menyerang) |
264|| Kalah | hazushita / chi / tsugi_de_kimeru | gambare / bakana |
265|
266|- ⚠️ Jangan pakai GIF buat petir/bayangan/air — CSS/SVG murni (aturan Yuji: tajam semua ukuran). GIF hanya cut-in kanon kalau user punya.
267|- ⚠️ `prefers-reduced-motion`: kanji/siluet tetap; shake/aliran/flash disembunyikan.
268|
269|## 🪜 Tahap Eksekusi (bertahap — commit per tahap, pola Yuji/Sukuna)
270|
271|**Tahap 1 — Fondasi aset + voice (kecil, aman)**
272|- [ ] Backup 9 file generik lama → `.voice-backup/megumi-placeholder/`
273|- [ ] Copy 9 klip dari folder user → `public/voices/megumi/` **dengan rename tabel di atas**
274|- [ ] **Ukur timing klip** (RMS Web Audio) — khususnya `mahoraga` (chant 2 frasa + jeda) → isi `MEGUMI_CAST_VOICE`
275|- [ ] Update `voices.js` (pola `clips`) + `voices.test.js` + `reviewClips.test.js`
276|- **Acceptance:** `npm test` hijau (test voice megumi pola ladder), lint 0 error, tidak ada jalur lain berubah.
277|
278|**Tahap 2 — megumiFx.js (logika murni) + test**
279|- [ ] `megumiTechniqueFor` ladder (non-streak rotasi + 10/20/30)
280|- [ ] Charge bar 20 + summon (30s, timer jalan) + roda 8 + `megumiWheelNext`/`megumiAdaptCut`
281|- [ ] `MEGUMI_CAST_VOICE` + timeline cinematic + `MEGUMI_STYLE` + generator partikel
282|- [ ] Test lengkap (pola `sukunaFx.test.js`): ladder tiap batas, roda penuh → cabut pedang, salah ke-9 → 輪砕け, rng injectable
283|- **Acceptance:** `node --test` hijau; semua angka timing = hasil ukur.
284|
285|**Tahap 3 — SFX streak skills (5 skill + adapt/sword/shatter)**
286|- [ ] ~17 fungsi baru di `sfx.js` (params murni + play) + `MEGUMI_TECHNIQUE_SFX_LAYERS` (reuse yang ada dulu)
287|- [ ] Test: tiap teknik ≥2 lapis, params valid (pola `sfx.yuji.test.js`)
288|- [ ] `playMegumiTechnique(technique)` — play klip deterministik (pola `playSukunaTechnique`)
289|- **Acceptance:** `npm test` hijau; di browser tiap jurus bunyi 2–4 lapis.
290|
291|**Tahap 4 — Visual streak skills (`MegumiBurst.jsx`) + jalur EffectContext**
292|- [ ] Visual 玉犬 / 鵺 / 大蛇 / 満象 / 虎葬 (bayangan bangkit, ≥3 lapis)
293|- [ ] Tambah jalur `'megumi'` di `EffectContext` (mirror `triggerSukuna`)
294|- [ ] `visuals.js` + `packs.js` (visual `'megumi'` + desc)
295|- [ ] Hit-testing `[data-megumi-hit]` (pola `yujiHit`/`sukunaHit`)
296|- **Acceptance:** smoke test browser: streak 1→10→20→30 semua jurus tampil & bunyi; reduced-motion OK.
297|
298|**Tahap 5 — Bar 20 slot + roda 8 + Cinematic summon 魔虚羅**
299|- [ ] `MegumiCurseBar` — 20 slot, label 魔虚羅 saat penuh, roda 8 takik persist saat summon
300|- [ ] `MegumiSummonCine` — genangan → chant 布瑠部由良由良 → roda 八握剣 → siluet raksasa → flash/boom → settle
301|- [ ] Persist: aura 影 + roda kecil + **適応 (salah gak hangus + hapus 1 opsi)** + **roda penuh → cabut pedang → 必中 mini** + **輪砕け → bubar + streak hangus**
302|- **Acceptance:** cast → cinematic sync ke `mahoraga.mp3`; 適応 & 輪砕け jalan; summon padam saat timeout/shatter.
303|
304|**Tahap 6 — Ambience bayangan + polish + verifikasi**
305|- [ ] `megumiAmbience.js` (drone bayangan + bisikan) + ducking
306|- [ ] Polish: transisi, mobile (breakpoint 768), reduced-motion
307|- [ ] Verifikasi browser penuh + `npm test` + lint + build + commit/push (push hanya kalau disuruh)
308|- **Acceptance:** summon kerasa "masuk bayangan" (drone + bisikan); build ✓; 0 error lint.
309|
310|**Verifikasi akhir tiap tahap:** `npm test` · `npm run lint` (baseline 20 warning OK, 0 error) · `npm run build` · smoke test browser via DevPanel (tambah `megumiPreviewStreak` pola `gojoPreviewStreak`).
311|
312|## Terkait
313|
314|- [[Efek JJK]] — index karakter
315|- [[Yuji Itadori]] — pola kode `rare` (JANGAN nabrak)
316|- [[Sukuna]] — pola ladder + SFX + pembagian 魔虚羅
317|- [[Key Decisions]] — keputusan desain pack