# Megumi Fushiguro — pack_10 (rare) · 十種影法術

> Pack **`pack_10`** · rarity **`rare`** · icon 🐺 · visual `megumi` (baru) · voice `megumi`
> Kanji: 伏黒恵 · Judul efek: **十種影法術** (Ten Shadows Technique)
> Prinsip: **`rare` = ladder jurus makin OP + ultimate one-shot (TANPA Domain Expansion).**
> Semua efek **TEBAL** (≥2 lapis visual + ≥2 lapis SFX) — user: *"efek skill lumayan tebel"*.
>
> **STATUS: 🔒 TERKUNCI (design + aset + wiring + SFX + mekanik) — belum eksekusi.**
> **Aset suara: ✅ 9 klip sudah dibuat user (TTS web) + sebagian GIF.**
> **Ultimate = 魔虚羅 (Mahoraga) dengan mekanik 適応 — BUKAN domain (rare).**
>
> Eksekusi: buka repo `C:\Users\maddo\Documents\japanese-quiz` di terminal baru → baca doc ini + [[Yuji Itadori]] (pola kode `rare`) + [[Sukuna]] (pola ladder & SFX) → kerjakan per tahap.

## ⚡ Ringkasan cepat

| Streak | Jurus | Klip | Kanji | Warna |
|---|---|---|---|---|
| non-streak (rotasi) | 玉犬 (Divine Dogs) | `gyokuken.mp3` | 玉犬 | ⚪ perak |
| non-streak (rotasi) | 鵺 (Nue) | `nue.mp3` | 鵺 | 🟣 indigo |
| **10** | 大蛇 (Great Serpent) | `orochi.mp3` | 大蛇 | 🟢 teal |
| **20** | 満象 (Max Elephant) | `bansou.mp3` | 満象 | 🔵 biru air |
| **30** | 虎葬 (Tiger Funeral) | `kosou.mp3` | 虎葬 | 🟠 amber |
| **bar penuh → tap** | **魔虚羅 (Mahoraga) · 適応** | `mahoraga.mp3` | 布瑠部由良由良 → 魔虚羅 | 🟪 ungu-bayangan |

**Bar** = 20 slot (pola JJK konsisten). **Ultimate** = state 30 dtk, timer **JALAN** (pola `rare`: Yuji/Sukuna — bukan beku seperti Gojo).
**Kalah** = `hazushita` / `chi` / `tsugi_de_kimeru` acak (bayangan nelan tombol yang dipencet).

## Keputusan desain (FINAL — hasil brainstorming 28/09)

1. **Pola = skill/ladder, bukan 3/3/3 generik** (user: *"pake skill aja non streak / streak"*). Jurus naik makin OP seiring streak, persis struktur Sukuna.
2. **Ultimate = 魔虚羅 (Mahoraga), BUKAN Domain Expansion** (user: *"betul"*). `rare` = one-shot, tanpa domain. 嵌合暗翳庭 **off the table**.
3. **Mekanik Mahoraga = A · 適応 (Adaptation)** (user: *"a"*) — satu-satunya filosofi yang belum dipakai: **KETAHANAN/ADAPTASI**. (Gojo = KONTROL, Yuji = PENGHANCURAN, Sukuna = PEMBANTAIAN.)
4. **Overlap Sukuna dibagi** (user: *"oke"*): Sukuna manggil 魔虚羅 versi **raksasa/terkontrol** (Meguna, streak 20); Megumi punya versi **kecil/terbatas/切札** (ultimate bar). Kata & visual beda → aman.
5. **GIF opsional per skill** (user: *"yang gif nya gak ada cukup teks aja"*): skill yang punya GIF → pakai GIF; yang belum → **cukup kanji teks** (tidak wajib GIF).
6. **SFX wajib ada di tiap jurus** (user: *"jangan lupa adain sfx biar gak sepi"*) — min 2 lapis per skill.

## 🎨 Identitas visual Megumi (ciri khas — WAJIB, beda dari 3 pack lain)

Tiap pack punya "bahasa visual" sendiri. Megumi = **bayangan cair (影) yang mengalir & menelan**:

| Pack | Bahasa visual | Warna inti |
|---|---|---|
| Gojo | plasma / ruang angkasa | ungu-biru |
| Yuji | api | merah-oranye |
| Sukuna | kuil / tebasan darah | merah-ungu |
| **Megumi** | **bayangan (影) — genangan hitam, siluet shikigami bangkit** | **tinta hitam `#0a0a0a` + highlight perak `#cbd5e1` + aksen 藍 indigo `#4338ca`** |

**Aturan render:**
- Semua jurus = siluet shikigami **bangkit dari genangan bayangan** di lantai (bukan plasma/api/tebasan).
- Bayangan **mengalir & melebar** (blob + turbulence filter, tepi organik) — bukan bentuk kaku.
- Highlight perak tipis di tepi siluet (biar kebaca di tema gelap) + rim indigo.
- **Bukan GIF untuk petir/bayangan** — CSS/SVG murni (aturan Yuji/Sukuna: tajam semua ukuran). GIF hanya untuk cut-in kanon (kalau user punya).
- `prefers-reduced-motion`: kanji + siluet **tetap tampil** (informasi kanon); shake/aliran bayangan/flash disembunyikan.

## 🎧 Voice — 9 klip (✅ sudah dibuat user, TTS web)

Lokasi target: `public/voices/megumi/` — **aturan nama**: `/^\/voices\/megumi\/[a-z0-9_]+\.mp3$/` (lowercase + underscore, **spasi & strip DILARANG**).

**Rename saat copy dari folder user → `public/voices/megumi/`:**

| Nama file user | → Target | Isi |
|---|---|---|
| `gyokuken` | `gyokuken.mp3` | 「玉犬」 |
| `nue` | `nue.mp3` | 「鵺」 |
| `orochi` | `orochi.mp3` | 「大蛇」 |
| `bansou` | `bansou.mp3` | 「満象」 |
| `kosou` | `kosou.mp3` | 「虎葬」 |
| `mahoraga` | `mahoraga.mp3` | 「布瑠部由良由良……魔虚羅」 (chant, ultimate) |
| `hazushitaka` | `hazushita.mp3` | 「外したか」 (salah) |
| `tch` | `chi.mp3` | 「ちっ」 (salah) |
| `tsugi de kimeru` | `tsugi_de_kimeru.mp3` | 「次で決める」 (salah) |

**Backup dulu** 9 file generik lama (`correct_1..3`, `wrong_1..3`, `streak_1..3`) → `.voice-backup/megumi-placeholder/` (pola Yuji/Sukuna).

> ⚠️ Timing klip (lead diam / durasi) **belum diukur** — sebelum bikin SFX & timeline cinematic, **ukur RMS Web Audio** dulu (pola `SUKUNA_CAST_VOICE` / `GOJO_CAST_VOICE`). **Jangan tebak** angka timing.
> ⚠️ Klip generik lama Megumi semuanya durasi **1.872s** (red flag) — abaikan, kita ganti total dengan 9 klip user ini.

### Mapping momen → klip (deterministik, pola `sukunaTechniqueFor`)
```
non-streak  → rotasi 玉犬 ↔ 鵺       (gyokuken / nue, bergantian — bukan acak)
streak 10   → orochi                  (大蛇 — momen)
streak 20   → bansou                  (満象 — momen)
streak 30+  → kosou                   (虎葬 — momen)
bar penuh tap → mahoraga              (chant 布瑠部由良由良 → summon 魔虚羅)
salah       → hazushita / chi / tsugi_de_kimeru  (ACAK 3 pilihan)
```

## ⚔️ Spec efek per skill (TEBAL — ≥2 lapis)

### 1. 玉犬 — non-streak (base)
- **Visual (3 lapis):** ① **2 siluet serigala** meleset dari genangan bayangan di lantai (kiri & kanan) ② **3 goresan cakar** melintang (garis bayangan tajam + rim perak) ③ genangan menutup balik (shadow wash 0.4s).
- **SFX (2 lapis):** `playGyokuken` (lolongan rendah 420→180Hz + noise growl) + `playClawSwipe` (3 whoosh cakar 2200→600Hz, cepat).
- GIF: opsional (kalau ada `gyokuken.gif` → cut-in; kalau tidak → **kanji 玉犬 cukup**).

### 2. 鵺 — non-streak (rotasi)
- **Visual (3 lapis):** ① **siluet burung 人面** bangkit dari bayangan (bukan api) ② **petir ungu nyamber dari ATAS** (beda dari Gojo yang dari tepi!) — 3 sambaran kiri-tengah-kanan ③ bulu/sayap bayangan melebar menutupi layar 0.3s lalu hilang.
- **SFX (3 lapis):** `playNueScreech` (jeritan 950→320Hz) + `playNueThunder` (guntur 130→28Hz) + `playShadowRustle` (noise bandpass = desir bayangan).
  - ⚠️ `playNueThunder`/`playNueScreech` juga dipakai Sukuna (Meguna) — **reuse kalau sudah dibikin**; kalau belum, bikin sekali di `sfx.js` (shared), jangan duplikat.

### 3. 大蛇 — streak 10 (momen)
- **Visual (3 lapis):** ① **ular raksasa** nyembul dari bayangan & **nglilit** ② sisik bayangan berkilau perak ③ tanah/lantai "pecah" garis retak gelap.
- **SFX (2 lapis):** `playOrochiHiss` (desis 3 lapis 4000→800Hz, panjang) + `playOrochiRumble` (rumble 38→22Hz, berat).
- GIF: opsional → kanji 大蛇 cukup kalau tidak ada.

### 4. 満象 — streak 20 (momen)
- **Visual (3 lapis):** ① **gajah bayangan** bangkit ② **semburan air** dari belalai (gradient biru, bukan api) ③ riak air menyebar di lantai.
- **SFX (2 lapis):** `playBansouWater` (semburan air 1600→300Hz + noise) + `playBansouTrumpet` (terompet gajah 300→140Hz).
- GIF: opsional → kanji 満象 cukup kalau tidak ada.

### 5. 虎葬 — streak 30 (momen)
- **Visual (3 lapis):** ① **harimau bayangan** menerkam dari sisi ② **cakar raksasa** 3 goresan membara amber ③ lantai retak membentuk pola taring.
- **SFX (2 lapis):** `playKosouRoar` (auman harimau 260→90Hz, ganas) + `playKosouSlash` (3 tebasan 2600→500Hz + ekor boom 60Hz).
- GIF: opsional → kanji 虎葬 cukup kalau tidak ada.

### 6. 魔虚羅 · 適応 — ULTIMATE (bar penuh → tap) ⭐⭐⭐

**Urutan cinematic cast (SEMUA sync ke klip `mahoraga.mp3` — angka detik DIISI SETELAH UKUR RMS):**
```
0.00  veil gelap total + dread (drone bayangan mulai)
0.10  genangan bayangan menyebar dari TENGAH ke seluruh lantai
~0.3  kanji 布瑠部由良由良 muncul PER-KARAKTER (sync frasa chant)
--    RODA 八握剣 muncul di atas, muter 8 jari-jari (法輪)
--    siluet raksasa 魔虚羅 bangkit dari bayangan (badan hitam, kepala ular, pedang 八握剣)
--    kanji 魔虚羅 raksasa muncul 1× glow ungu-bayangan
--    SHAKE layar + aura 影 + bara hitam naik
--    FLASH + BOOM (playDomainBoom('bang') + playMakoraRoar)
--    settle: siluet+kanji naik & mengecil → RODA KECIL persist di UI
── persist 30 dtk ──
```

**Mekanik 適応 (Adaptation) — inti ultimate:**
- Charge bar 20 → tap = **summon**. Saat cast: `streakRef` di-reset 0 (charge habis), state hidup **30 dtk**, **timer JALAN** (pola `rare`).
- **RODA 八握剣 = 8 takik** tampil persist selama summon (penanda "Mahoraga aktif" + meter adaptasi).
- **Jawaban BENAR** selama summon → streak lanjut normal, roda **tidak** maju (tidak ada yang perlu diadaptasi).
- **Jawaban SALAH** selama summon → **適応**: **streak TIDAK hangus**, roda **+1 takik**, kanji **適応** flash + auman, dan **1 opsi salah di soal BERIKUTNYA dihapus** (diadaptasi — di-arm ke soal berikut, pola skill Sukuna).
- **RODA PENUH (8/8 八握)** → Mahoraga **cabut 八握剣** (`playSwordUnsheathe`) → **sisa durasi: SEMUA opsi salah terpotong tiap soal** (mini-必中, pola `sukunaHitsumeCut` tapi window lebih pendek).
- **SALAH saat roda sudah penuh (ke-9)** → **輪砕け** (`playWheelShatter`) → roda pecah, summon **bubar seketika**, **streak HANGUS** = backlash 切札 (kanon: Mahoraga membunuh pemanggilnya).
- **Timeout** (30 dtk habis) → summon padam alami, **streak tetap** (`playDomainCollapse('timeout')`).
- **Salah di LUAR summon** (biasa) → streak reset normal + klip kalah.

**Filosofi (dokumentasi wajib di komentar kode):**
> Megumi = **KETAHANAN**. Ultimate ini **asuransi yang snowball jadi kekuatan**: makin sering lu salah, makin kebal (streak gak hangus) & makin ngebantu (opsi salah dihapus). Bayarannya = risiko 輪砕け kalau kebanyakan salah. Bedakan dari Sukuna yang menyerang (必中) — Megumi **bertahan**.

**Konstanta (tuning = 1 baris):**
```js
export const MEGUMI_ULT_THRESHOLD = 20;        // bar 20 (pola JJK konsisten)
export const MEGUMI_SUMMON_DURATION_S = 30;    // state, timer JALAN (rare)
export const MEGUMI_WHEEL_NOTCHES = 8;         // 八握剣 = 8 takik
export const MEGUMI_ADAPT_CUT = 1;             // 適応: 1 opsi salah / salah
```

## 🔊 SFX — yang perlu dibikin (REUSE dulu yang ada!)

**Reuse (kalau sudah ada dari Sukuna/Yuji/Gojo):** `playDomainBoom`, `playDomainCollapse`, `playSlash`, `playWheelCreak`, `playGiantStep`, `playNueThunder`/`playNueScreech` (shared), `duckAmbience`.

**Baru (~13 fungsi, pola params-murni + play, min 2 lapis per skill):**

| Fungsi | Dipakai | Karakter bunyi |
|---|---|---|
| `playGyokuken` | 玉犬 | lolongan 420→180Hz + noise growl |
| `playClawSwipe` | 玉犬 | 3 whoosh cakar 2200→600Hz |
| `playNueScreech` | 鵺 | jeritan 950→320Hz *(shared Sukuna)* |
| `playNueThunder` | 鵺 | guntur 130→28Hz *(shared Sukuna)* |
| `playShadowRustle` | 鵺 | noise bandpass = desir bayangan |
| `playOrochiHiss` | 大蛇 | desis 3 lapis 4000→800Hz |
| `playOrochiRumble` | 大蛇 | rumble 38→22Hz |
| `playBansouWater` | 満象 | semburan air 1600→300Hz |
| `playBansouTrumpet` | 満象 | terompet gajah 300→140Hz |
| `playKosouRoar` | 虎葬 | auman harimau 260→90Hz |
| `playKosouSlash` | 虎葬 | 3 tebasan 2600→500Hz + boom 60Hz |
| `playMakoraChant` | mahoraga | drone ritual bayangan 55Hz + bel inharmonik |
| `playMakoraRoar` | mahoraga | auman raksasa 70→30Hz |
| `playAdaptFlash` | 適応 | chime gelap + shimmer (momen "belajar") |
| `playSwordUnsheathe` | roda penuh | tarikan logam 1200→400Hz (cabut pedang) |
| `playWheelShatter` | 輪砕け | pecah kaca/logam 3000→200Hz + boom |
| `playShadowSwallow` | salah | bayangan nelan (whoosh turun 500→80Hz) |

**Registry lapisan** (pola `TECHNIQUE_SFX_LAYERS`, dites: tiap teknik ≥2 lapis):
```js
export const MEGUMI_TECHNIQUE_SFX_LAYERS = {
  gyokuken: ['playGyokuken', 'playClawSwipe'],
  nue:      ['playNueScreech', 'playNueThunder', 'playShadowRustle'],
  orochi:   ['playOrochiHiss', 'playOrochiRumble'],
  bansou:   ['playBansouWater', 'playBansouTrumpet'],
  kosou:    ['playKosouRoar', 'playKosouSlash'],
  mahoraga: ['playMakoraChant', 'playWheelCreak', 'playGiantStep', 'playMakoraRoar'],
  adapt:    ['playAdaptFlash'],
  sword:    ['playSwordUnsheathe'],
  shatter:  ['playWheelShatter'],
  wrong:    ['playShadowSwallow'],
};
```

**Ambience baru — `src/utils/megumiAmbience.js`** (mirror `gojoAmbience.js`/`sukunaAmbience.js`):
- `startMegumiShadowBgm()` — drone bayangan 55/110Hz + pad gelap + **bisikan 呪詞** (noise bandpass 200–900Hz termodulasi pelan) + level 0.20, fadeIn 1600ms, fadeOut 900ms. Hidup selama summon.
- `stopMegumiShadowBgm()` — ramp down.
- Ducking: reuse `duckAmbience` dari `gojoAmbience.js`.
- **Semua fungsi no-op di node/test** (return false) — aman di-import.

## 📁 Aset & penamaan

```
public/voices/megumi/    ← 9 klip mp3 (tabel rename di atas)
public/effects/          ← GIF opsional (kalau ada): megumi_gyokuken.gif, megumi_mahoraga.gif, dst
.voice-backup/megumi-placeholder/  ← backup 9 klip generik lama
```

## 🔌 Wiring (mengikuti pola `yuji*`/`sukuna*` — JANGAN ganggu jalur Gojo/Yuji/Sukuna)

**`voices.js`** — ganti entry `megumi` jadi pola `clips` (kayak Gojo/Yuji/Sukuna):
```js
megumi: {
  files: {
    correct: [],
    wrong: ['/voices/megumi/hazushita.mp3', '/voices/megumi/chi.mp3', '/voices/megumi/tsugi_de_kimeru.mp3'],
    streak: [],
  },
  clips: [
    '/voices/megumi/gyokuken.mp3', '/voices/megumi/nue.mp3',
    '/voices/megumi/orochi.mp3', '/voices/megumi/bansou.mp3',
    '/voices/megumi/kosou.mp3', '/voices/megumi/mahoraga.mp3',
  ],
  synth: { correct: 'gong', wrong: 'thud', streak: 'gong-big' },
}
```

**File kode baru:**
```
src/features/effects/megumiFx.js + megumiFx.test.js   ← logika murni (ladder, roda, timeline, warna, partikel)
src/features/effects/MegumiBurst.jsx                   ← visual per-skill (serigala/nue/ular/gajah/harimau)
src/features/effects/MegumiShadow.jsx                  ← MegumiCurseBar (20 slot + roda 8) + MegumiSummonCine + MegumiAura
src/utils/megumiAmbience.js + test                     ← BGM bayangan + bisikan + ducking
```

**Edit:**
- `visuals.js` → tambah `megumi: { id:'megumi', label:'Megumi Ten Shadows', component:'megumi' }`
- `packs.js` → `pack_10` visual: `'dummy'` → `'megumi'` + update `desc`/`desc_en` (dari "visual menyusul")
- `EffectContext.jsx` → tambah jalur `'megumi'` (mirror `triggerYuji`/`triggerSukuna`, jalur terpisah)
- `sfx.js` → ~17 fungsi baru + params + `MEGUMI_TECHNIQUE_SFX_LAYERS`
- `voices.test.js` → test megumi diubah ke pola `clips` (6 klip, wrong 3, correct/streak kosong)
- `reviewClips.test.js` → keluarkan `'megumi'` dari loop generik; tambah assertion pola ladder

**Konstanta penting di `megumiFx.js`:**
```js
export const MEGUMI_MILESTONES = [3,5,10,20,30,40,50,60,70,80,90,100]; // konsisten JJK
export const MEGUMI_ULT_THRESHOLD = 20;
export const MEGUMI_SUMMON_DURATION_S = 30;
export const MEGUMI_WHEEL_NOTCHES = 8;
export const MEGUMI_ADAPT_CUT = 1;
// + megumiTechniqueFor(kind, streak) → 'gyokuken'|'nue'|'orochi'|'bansou'|'kosou'
// + megumiCurseCharge / megumiUltReady / megumiSummonLeft / megumiSummonStartDelayMs
// + MEGUMI_STYLE (kanji + warna per jurus) + partikel generator (rng injectable)
// + megumiWheelNext / megumiAdaptCut (murni, deterministik, dites)
```

## 🚫 Aturan anti-nabrak (WAJIB)

| | Megumi (`rare`) | Sukuna (`special`) |
|---|---|---|
| 魔虚羅 | versi **kecil/terbatas/切札** (ultimate bar, 適応) | versi **raksasa/terkontrol** (Meguna, streak 20 `furube`) |
| Domain | ❌ tidak ada (rare) | ✅ 伏魔御廚子 |
| 鵺 | **pemilik kanon** (bayangan + petir dari atas) | pakai karena Meguna (akurat) |
| Ultimate | **適応** (bertahan) | **必中** (menyerang) |
| Kalah | hazushita / chi / tsugi_de_kimeru | gambare / bakana |

- ⚠️ Jangan pakai GIF buat petir/bayangan/air — CSS/SVG murni (aturan Yuji: tajam semua ukuran). GIF hanya cut-in kanon kalau user punya.
- ⚠️ `prefers-reduced-motion`: kanji/siluet tetap; shake/aliran/flash disembunyikan.

## 🪜 Tahap Eksekusi (bertahap — commit per tahap, pola Yuji/Sukuna)

**Tahap 1 — Fondasi aset + voice (kecil, aman)**
- [ ] Backup 9 file generik lama → `.voice-backup/megumi-placeholder/`
- [ ] Copy 9 klip dari folder user → `public/voices/megumi/` **dengan rename tabel di atas**
- [ ] **Ukur timing klip** (RMS Web Audio) — khususnya `mahoraga` (chant 2 frasa + jeda) → isi `MEGUMI_CAST_VOICE`
- [ ] Update `voices.js` (pola `clips`) + `voices.test.js` + `reviewClips.test.js`
- **Acceptance:** `npm test` hijau (test voice megumi pola ladder), lint 0 error, tidak ada jalur lain berubah.

**Tahap 2 — megumiFx.js (logika murni) + test**
- [ ] `megumiTechniqueFor` ladder (non-streak rotasi + 10/20/30)
- [ ] Charge bar 20 + summon (30s, timer jalan) + roda 8 + `megumiWheelNext`/`megumiAdaptCut`
- [ ] `MEGUMI_CAST_VOICE` + timeline cinematic + `MEGUMI_STYLE` + generator partikel
- [ ] Test lengkap (pola `sukunaFx.test.js`): ladder tiap batas, roda penuh → cabut pedang, salah ke-9 → 輪砕け, rng injectable
- **Acceptance:** `node --test` hijau; semua angka timing = hasil ukur.

**Tahap 3 — SFX streak skills (5 skill + adapt/sword/shatter)**
- [ ] ~17 fungsi baru di `sfx.js` (params murni + play) + `MEGUMI_TECHNIQUE_SFX_LAYERS` (reuse yang ada dulu)
- [ ] Test: tiap teknik ≥2 lapis, params valid (pola `sfx.yuji.test.js`)
- [ ] `playMegumiTechnique(technique)` — play klip deterministik (pola `playSukunaTechnique`)
- **Acceptance:** `npm test` hijau; di browser tiap jurus bunyi 2–4 lapis.

**Tahap 4 — Visual streak skills (`MegumiBurst.jsx`) + jalur EffectContext**
- [ ] Visual 玉犬 / 鵺 / 大蛇 / 満象 / 虎葬 (bayangan bangkit, ≥3 lapis)
- [ ] Tambah jalur `'megumi'` di `EffectContext` (mirror `triggerSukuna`)
- [ ] `visuals.js` + `packs.js` (visual `'megumi'` + desc)
- [ ] Hit-testing `[data-megumi-hit]` (pola `yujiHit`/`sukunaHit`)
- **Acceptance:** smoke test browser: streak 1→10→20→30 semua jurus tampil & bunyi; reduced-motion OK.

**Tahap 5 — Bar 20 slot + roda 8 + Cinematic summon 魔虚羅**
- [ ] `MegumiCurseBar` — 20 slot, label 魔虚羅 saat penuh, roda 8 takik persist saat summon
- [ ] `MegumiSummonCine` — genangan → chant 布瑠部由良由良 → roda 八握剣 → siluet raksasa → flash/boom → settle
- [ ] Persist: aura 影 + roda kecil + **適応 (salah gak hangus + hapus 1 opsi)** + **roda penuh → cabut pedang → 必中 mini** + **輪砕け → bubar + streak hangus**
- **Acceptance:** cast → cinematic sync ke `mahoraga.mp3`; 適応 & 輪砕け jalan; summon padam saat timeout/shatter.

**Tahap 6 — Ambience bayangan + polish + verifikasi**
- [ ] `megumiAmbience.js` (drone bayangan + bisikan) + ducking
- [ ] Polish: transisi, mobile (breakpoint 768), reduced-motion
- [ ] Verifikasi browser penuh + `npm test` + lint + build + commit/push (push hanya kalau disuruh)
- **Acceptance:** summon kerasa "masuk bayangan" (drone + bisikan); build ✓; 0 error lint.

**Verifikasi akhir tiap tahap:** `npm test` · `npm run lint` (baseline 20 warning OK, 0 error) · `npm run build` · smoke test browser via DevPanel (tambah `megumiPreviewStreak` pola `gojoPreviewStreak`).

## Terkait

- [[Efek JJK]] — index karakter
- [[Yuji Itadori]] — pola kode `rare` (JANGAN nabrak)
- [[Sukuna]] — pola ladder + SFX + pembagian 魔虚羅
- [[Key Decisions]] — keputusan desain pack
