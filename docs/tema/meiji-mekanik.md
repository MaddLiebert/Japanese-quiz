# SPEC MEKANIK — Tema Era **MEIJI 明治** (sistem kode)

**Versi:** v0.1 · **Dibuat:** 2026-10-08
**Status:** ✅ TERPASANG di kode — sistem mekanik sudah aktif (lihat modul + test). Dokumen ini tetap **SPEC acuan**.
**Induk visual/konten:** `docs/tema/meiji.md` (PRD tema Meiji)
**Pola arsitektur:** mengikuti Heian/Edo — **modul MURNI** (tanpa React/DOM) + test `node --test`, lalu UI React yang menipis.
**Prasyarat:** `docs/tema/meiji.md` T1–T4 (eraNames + token CSS) sudah jalan.

> **Kenapa dipisah dari `meiji.md`?** `meiji.md` = bahasa visual, konten, narasi (bisa dinilai mata).
> File ini = **sistem yang butuh kode** (fungsi murni, data model, localStorage, test). Supaya eksekusi per-terminal bersih: satu file = satu jenis kerja.

---

## 0. Peta sistem

| Kode | Sistem | Butuh aset? | Prioritas |
|---|---|---|---|
| M1 | **活字組み** — typesetting (grammar) | tidak | ★★★ inti |
| M2 | **和魂洋才** — rasio 和/洋 per perhentian | tidak | ★★★ inti |
| M3 | **第二面** — sisi gelap (pilihan pemain) | tidak | ★★ |
| M4 | **Codex つながり** — benang lintas-era | tidak | ★★ |
| M5 | **活字 lepas** — UI punya "fisik" | tidak | ★ |
| M6 | **縦→横** — progresi arah teks | tidak | ★ |
| M7 | **時刻 (waktu)** — timer musiman → standar | tidak | ★★ |
| M8 | **新語** — cipta kata Meiji | tidak | ★★ |
| M9 | **GLITCH** — kebocoran cyberpunk | tidak | ★★ |
| M10 | **号外** — koran larut malam | tidak | ★ |
| M11 | **戸籍** — buku hidup pemain | tidak | ★★ |
| M12 | **jejak Nacht/Saku** — app "memperhatikan" | tidak | ★★★ |
| M13 | **電信** — pesan telegraf diegetik | tidak | ★ |
| M14 | **印刷所** — easter egg "pabrik" app | tidak | ★ |
| M15 | **App bernapas / bertanya balik** | tidak | ★ |

> **Prinsip:** SEMUA modul murni & deterministik → bisa dites tanpa browser. Efek visual (glitch, napas) = CSS/React di lapisan tipis di atasnya.

---

## M1 — 活字組み (Typesetting) ★★★

### Konsep
Belajar grammar = **menyusun blok huruf (活字)** jadi kalimat benar. Susunan benar = cetakan bersih; salah = **chromatic misprint** (offset renga/biru) — jadi bahasa bentuk Meiji = output mekaniknya.

### Data model
```js
// features/typesetting/typesetting.js — MURNI
// Satu soal:
{
  id: 't-001',
  parts: [                       // blok yang BENAR, urut
    { id: 'p1', jp: '私',   pos: 'noun',  reading: 'わたし' },
    { id: 'p2', jp: 'は',   pos: 'particle', reading: 'は' },   // partikel: blok KECIL
    { id: 'p3', jp: '毎朝', pos: 'noun',  reading: 'まいにち' },
    { id: 'p4', jp: '新聞', pos: 'noun',  reading: 'しんぶん' },
    { id: 'p5', jp: 'を',   pos: 'particle', reading: 'を' },
    { id: 'p6', jp: '読む', pos: 'verb',  reading: 'よむ' },
  ],
  distractors: [                 // blok PALSU (mirip)
    { id: 'd1', jp: 'が',  pos: 'particle', reading: 'が' },
    { id: 'd2', jp: '読んだ', pos: 'verb', reading: 'よんだ' },
  ],
  level: 1,                      // 1 jiplak · 2 ingat · 3 buta (tanpa furigana)
  translation: 'Saya membaca koran setiap pagi.',
}
```

### Fungsi murni
```js
export const POS_COLORS = {      // warna blok per kelas kata (kasus huruf)
  noun: 'renga', particle: 'ai', verb: 'shu', adj: 'matcha', aux: 'nezumi',
};

// Acak blok + distraktor (deterministik via seed → bisa dites)
export const buildPool = (q, seed) => [...];

// Cek susunan: benar kalau id blok BENAR terpakai urut & tak ada distraktor
export const checkOrder = (q, placedIds) => ({ ok, misprintAt });

// Skor: berapa blok salah tempat → untuk intensitas misprint
export const misprintAmount = (q, placedIds) => 0..1;
```

### Aturan desain
- **Partikel (は/が/を) = blok kecil & beda warna** → ngajarin struktur SOV + partikel tanpa ceramah.
- Level naik = distraktor makin mirip (partikel salah, konjugasi salah).
- **Feedback visual:** `misprintAmount` → CSS `--misprint: <px>` (offset renga/biru). 0 = bersih.
- Trivia (opsional, tutorial): istilah "upper/lower case" asalnya dari **kotak huruf** tukang cetak.

### Test (`typesetting.test.js`)
- `checkOrder` benar saat urut benar; salah saat ada distraktor.
- `buildPool` deterministik (seed sama → urutan sama).
- `misprintAmount` = 0 untuk susunan benar, > 0 untuk salah.

### Wiring UI
- Modul: `features/typesetting/{typesetting.js, useTypesetting.js, TypesettingBoard.jsx}` (pola `features/writing/`).
- Halaman: `/typesetting` atau mode di `/practice`. Gate: era Meiji (Lv 50).
- **Streak Meiji** = penghitung cetakan (tiap hari berturut = 1 edisi koran) — lihat M11.

---

## M2 — 和魂洋才 (Rasio 和/洋 per perhentian) ★★★

### Konsep
Meiji = **satu-satunya era dengan dua budaya bertarung** (和魂洋才 = jiwa Jepang, ilmu Barat). Tiap perhentian punya **rasio 和/洋** → tiap halaman terasa beda **tanpa ganti warna**.

### Data model
```js
// features/theme/waYo.js — MURNI
export const WA_YO = {
  yokohama:   { wa: 40, yo: 60 },
  ginza:      { wa: 35, yo: 65 },
  shimbunsha: { wa: 75, yo: 25 },
  rokumeikan: { wa: 15, yo: 85 },   // paling Barat
  tetsudo:    { wa: 30, yo: 70 },
  shogakko:   { wa: 65, yo: 35 },
  hakurankai: { wa: 50, yo: 50 },   // seimbang
  kokkai:     { wa: 60, yo: 40 },
};

// rasio → bobot visual (0..1) yang dipakai CSS & pemilihan komponen
export const waYoFor = (stopId) => WA_YO[stopId] || { wa: 50, yo: 50 };
export const waYoMix = (stopId) => { /* {wa, yo, ratio} */ };
```

### Aturan desain
- `wa` tinggi → lebih banyak kanji, 唐草, ukiran, kertas.
- `yo` tinggi → lebih banyak serif Latin, geometris, 洋装, mesin.
- Dipakai sebagai **CSS var** `--wa-ratio` di root halaman perhentian → menggeser kepadatan motif & tipografi secara halus.
- **鹿鳴館 (85% yo)** = halaman paling "Barat" di seluruh app → kontras maksimal dengan Heian/Edo.

### Test
- `waYoFor('rokumeikan').yo === 85`; stop tak dikenal → default 50/50.

---

## M3 — 第二面 (Sisi gelap, pilihan pemain) ★★

### Konsep
Koran punya **halaman depan** (kemajuan) & **halaman belakang** (harga yang dibayar). Pemain **memilih** baca. Nada: **「新聞は叫ばない」** — koran tidak berteriak; ditulis datar, tanpa drama. Itu yang bikin merinding.

### Data model
```js
// features/news/newsPages.js — MURNI
export const SECOND_PAGE = [
  { id: 'chiso', year: 1873, jp: '地租改正', headline_jp: '農民一揆、各地で続く。',
    headline_id: 'Pemberontakan petani berlanjut di berbagai tempat.', stop: 'shogakko' },
  { id: 'chouhei', year: 1873, jp: '徴兵令', headline_jp: '村を出る若者、後を絶たず。',
    headline_id: 'Pemuda meninggalkan desa, tiada henti.', stop: 'tetsudo' },
  { id: 'seinan', year: 1877, jp: '西南戦争', headline_jp: '士族の乱、終わる。',
    headline_id: 'Pemberontakan samurai berakhir.', stop: 'kokkai' },
  { id: 'jiyuu', year: 1880, jp: '自由民権運動', headline_jp: '演説会、また中止に。',
    headline_id: 'Rapat pidato kembali dibatalkan.', stop: 'shimbunsha' },
  { id: 'korea', year: 1910, jp: '韓国併合', headline_jp: '半島、帝国に編入さる。',
    headline_id: 'Semenanjung dianeksasi ke kekaisaran.', stop: 'kokkai' },
];
export const pagesForStop = (stopId) => SECOND_PAGE.filter(p => p.stop === stopId);
```

### Aturan desain
- **Selalu opsional** — pemain yang mau main langsung bisa lewati.
- Ditulis datar (headline pendek + tahun), **tanpa** emoji/dramatisasi.
- Hadiah baca = +1 entri codex (M4), bukan EXP besar (supaya bukan "grind").

### Test
- `pagesForStop('kokkai')` memuat ≥1 (seinan/korea); stop tanpa halaman → [].

---

## M4 — Codex つながり (Benang lintas-era) ★★

### Konsep
Meiji = **simpul** penghubung Edo → Shōwa. Istilah yang meng-echo istilah era sebelumnya memunculkan catatan **「つながり」**.

### Data model
```js
// features/codex/threads.js — MURNI
export const THREADS = [
  { id: 'light',  label_jp: '灯り', chain: ['提灯 (edo)', '瓦斯灯 (meiji)', '電気 (showa)'] },
  { id: 'road',   label_jp: '道',   chain: ['東海道 (edo)', '鉄道 (meiji)', '新幹線 (showa)'] },
  { id: 'money',  label_jp: '銭',   chain: ['両 (edo)', '円 (meiji)', '円 (showa)'] },
  { id: 'news',   label_jp: '報',   chain: ['瓦版 (edo)', '新聞 (meiji)', '新聞 (showa)'] },
];
// tambah node ke thread saat perhentian memperkenalkannya; kembalikan catatan koneksi
export const addNode = (threads, threadId, node) => /* {threads, linked} */;
export const linkedNote = (threadId) => /* teks 「つながり」 untuk toast */;
```

### Aturan desain
- Codex = **glosarium lintas-era** yang terisi; saat echo muncul → toast kecil 「つながり」.
- Data-driven: nambah node = nambah data, bukan kode.
- Menyambung ke era Shōwa nanti (benang sudah disiapkan).

### Test
- `addNode` idempoten; `linkedNote` mengembalikan teks untuk thread valid.

---

## M5 — 活字 lepas (UI punya fisik) ★

### Konsep
Kalimat di UI = blok 活字. Kalau **streak putus**, beberapa blok **miring/lepas** → pemain "kencangkan" (review) untuk merapikan.

### Data model & fungsi
```js
// features/typesetting/looseType.js — MURNI
// streak 0 (putus) → 0.35 blok lepas; streak tinggi → 0.
export const looseAmount = (streakDays) => /* 0..0.35 */;
export const looseIndices = (count, amount, seed) => /* index blok yang miring */;
```

### Aturan
- Hanya **visual + review prompt** — tidak memblokir belajar.
- CSS: `transform: rotate()` kecil pada blok terpilih.

### Test
- `looseAmount(0) > 0`; `looseAmount(30) === 0`.

---

## M6 — 縦→横 (Progresi arah teks) ★

### Konsep
Meiji memindahkan tulisan **tegak (縦) → datar (横)**. Sepanjang era, sebagian teks **berputar** saat naik perhentian.

### Data model
```js
// features/theme/textFlow.js — MURNI
// perhentian 0..7 → progresi 0..1 (0 = tegak penuh, 1 = datar penuh)
export const flowAtStop = (stopIndex) => Math.min(1, stopIndex / 7);
export const writingMode = (t) => (t < 0.5 ? 'vertical-rl' : 'horizontal-tb');
```
- CSS: `writing-mode` + transisi → teks "roboh" halus.

### Test
- `flowAtStop(0) === 0`; `flowAtStop(7) === 1`; `writingMode(0.2) === 'vertical-rl'`.

---

## M7 — 時刻 (Waktu: musiman → standar) ★★

### Konsep
**Nyata:** sebelum Meiji, jam Jepang **temporal** (siang dibagi 6, panjang berubah tiap musim). Meiji baru pakai **jam 24 tetap**. Mekanik: **timer kuis Meiji awalnya tidak konsisten** (7–9s, ikut "musim"), lalu jadi **tetap & adil** setelah perhentian 鉄道 (jam standar).

### Data model
```js
// features/time/temporal.js — MURNI
// "musim" 0..3 (app) → panjang hari relatif (nyata: musim panas lebih panjang)
export const SEASON_FACTOR = [0.85, 1.0, 1.15, 1.0];  // semi/panas/gugur/dingin
// Sebelum 鉄道: timer = base * factor (tidak adil). Setelah: base (adil).
export const quizTimer = (baseS, season, standardTime) =>
  standardTime ? baseS : Math.round(baseS * SEASON_FACTOR[season]);
```

### Aturan desain
- **Wajib ada penjelasan** saat transisi (koran 号外) — supaya pemain **paham** kenapa timer berubah, bukan merasa bug.
- Setelah 鉄道: timer konstan. `standardTime` disimpan di progress.

### Test
- Sebelum standar: `quizTimer(7, 2, false) === 8` (gugur); sesudah: `quizTimer(7, 2, true) === 7`.

---

## M8 — 新語 (Cipta kata) ★★

### Konsep
**Nyata:** Meiji **menciptakan** kata untuk konsep Barat (哲学, 科学, 自由, 電報…). Mekanik: pemain diberi **konsep** tanpa kata Jepangnya → **menyusun istilah** dari kanji → dibandingkan dengan kata nyata.

### Data model
```js
// features/neologism/neologism.js — MURNI
export const NEOLOGISMS = [
  { id: 'philosophy', concept_id: 'Filsafat', answer: '哲学', pool: ['哲', '学', '自', '由', '科'] },
  { id: 'science',    concept_id: 'Ilmu pengetahuan', answer: '科学', pool: ['科', '学', '哲', '明'] },
  { id: 'freedom',    concept_id: 'Kebebasan', answer: '自由', pool: ['自', '由', '民', '権'] },
  { id: 'telegraph',  concept_id: 'Telegraf', answer: '電報', pool: ['電', '報', '信', '文'] },
];
export const checkNeologism = (item, kanjiIds) => /* {ok, exact} */;
```

### Aturan
- Menyusun dari kanji → **sama seperti kerja sarjana Meiji**.
- Boleh ada jawaban "benar tapi bukan yang dipakai sejarah" → beri tahu kata aslinya (pembelajaran).
- Sumber kanji = `src/data/kanji.json` (86 kanji yang sudah ada).

### Test
- `checkNeologism(item, ['哲','学']).ok === true`; urutan salah → false.

---

## M9 — GLITCH (Kebocoran cyberpunk) ★★

### Konsep
Meiji = era paling dekat dengan masa depan (asal Nacht/Saku = AI cyberpunk) → **celah paling tipis**. Sesekali UI berkedip ke cyberpunk. Makin tinggi level Meiji, makin sering.

### Data model
```js
// features/glitch/glitch.js — MURNI (deterministik utk test)
// frekuensi naik dengan level; intensitas 0..1
export const glitchChance = (level, minLevel = 50) => /* 0..0.12 */;
export const glitchIntensity = (level) => /* 0..1 */;
export const shouldGlitch = (level, rng) => rng < glitchChance(level);
```

### Aturan
- **Payoff twist** — ditanam dari jauh, terasa di Lv 300.
- Efek: neon 1 frame, teks holografik sekejap, **suara digital** menyusup di sela mesin cetak.
- **A11y:** matikan di `prefers-reduced-motion`; sediakan toggle di Pengaturan.

### Test
- `glitchChance(50) < glitchChance(200)`; `shouldGlitch` deterministik dengan rng tetap.

---

## M10 — 号外 (Koran larut malam) ★

### Konsep
Jam tertentu (00–04 waktu nyata) atau acak langka → Home jadi **edisi 号外** gelap. Bukan tombol; **dia yang datang**. Isinya: **laporan tentangmu** (dari progress nyata).

### Data model
```js
// features/news/gogo.js — MURNI
export const isGogoWindow = (hour) => hour >= 0 && hour < 4;
export const gogoHeadline = (stats) => /* headline dari stats nyata, mis. hari & kanji */;
```

### Aturan
- Frekuensi **dibatasi** (jangan ganggu). Maks 1×/hari, bisa dimatikan.
- Nada: laporan datar (lihat M3).

### Test
- `isGogoWindow(2) === true`; `isGogoWindow(12) === false`.

---

## M11 — 戸籍 (Buku hidup pemain) ★★

### Konsep
Meiji = era pendataan. `ProgressContext` sudah simpan semua → tampilkan sebagai **buku 戸籍** yang bertumbuh: "terdaftar sejak…", "hari ke-47", "kesalahan pertama: [kanji]". Dan — app bisa **salah tentangmu** → kamu **mengoreksi**, app **mencatat koreksimu**.

### Data model
```js
// features/profile/koseki.js — MURNI
export const buildKoseki = (progress) => ({
  since: progress.firstSeen,
  days: progress.daysActive,
  firstMistake: progress.firstMistakeKanji || null,
  entries: [ /* baris-baris buku */ ],
});
export const correctEntry = (koseki, entryId, note) => /* tambah koreksi pemain */;
```

### Aturan
- Hanya **membaca** data yang sudah ada (`user_progress_v2` dll) + key baru `app_koseki_v1` untuk koreksi.
- Nada manis-creepy: app mengingat, dan mengaku bisa salah.

### Test
- `buildKoseki({...})` menghasilkan entri stabil; `correctEntry` menambah 1 koreksi.

---

## M12 — Jejak Nacht/Saku (App "memperhatikan") ★★★

### Konsep
Sesi berikutnya, ada **catatan** dari Nacht/Saku berdasar **timestamp asli** sesi belajarmu. Mereka **berkomentar tentang hidupmu nyata**. Ini rasa "bernyawa" paling jujur & **murah** (data sudah ada).

### Data model
```js
// features/companion/footprints.js — MURNI
export const FOOTPRINT_RULES = [
  { id: 'lateNight', when: (s) => s.lastHour >= 1 && s.lastHour < 5,
    jp: '昨日、夜ふかししたね。', id_text: 'Kemarin begadang ya.' },
  { id: 'streak', when: (s) => s.streak >= 30,
    jp: 'よく続いてるね。疲れてない？', id_text: 'Rajin sekali. Tidak lelah?' },
  { id: 'comeback', when: (s) => s.gapDays >= 3,
    jp: '…おかえり。', id_text: '…Selamat kembali.' },
];
export const pickFootprint = (stats, seenIds) => /* rule pertama yang cocok & belum tampil */;
```

### Aturan
- Pakai **timestamp & streak nyata** — bukan acak.
- Muncul **maks 1×/sesi**, tidak mengganggu.
- Narrator bergantian (Meiji = Saku) sesuai `docs/voice-cinematic-edo.md`.

### Test
- `pickFootprint({lastHour: 2, ...})` → rule `lateNight`; aturan yang sudah tampil dilewati.

---

## M13 — 電信 (Pesan telegraf diegetik) ★

### Konsep
Notifikasi = **ketukan telegraf tit-tit** → teks muncul seperti kertas telegraf. Kadang **terpotong** ("...熟語...覚え...て...") karena kabel putus → misteri.

### Data model
```js
// features/telegram/telegram.js — MURNI
export const truncate = (msg, cutAt) => /* pesan terpotong + ellipsis */;
export const TELEGRAMS = [ /* pesan per-peristiwa, sebagian sengaja terpotong */ ];
```

### Test
- `truncate('abcdef', 3) === 'abc…'`.

---

## M14 — 印刷所 (Ruang "pabrik" app) ★

### Konsep
Easter egg: susun sesuatu tepat → masuk **印刷所** gelap: mesin berjalan, tumpukan halaman setengah jadi, **sisa era lain** (Heian belum dicetak, layout Edo dibuang), dan **satu halaman bertanggal masa depan (cyberpunk)**.

### Data model
```js
// features/printshop/printshop.js — MURNI
export const PRINT_SHOP_ARTIFACTS = [
  { id: 'heian',  jp: '平安 — 未印刷', id_text: 'Heian — belum dicetak' },
  { id: 'edo',    jp: '江戸 — 破棄',   id_text: 'Edo — dibuang' },
  { id: 'future', jp: '??? — 電脳',    id_text: '??? — Cyberpunk' },
];
export const isPrintShopUnlocked = (progress) => /* kondisi easter egg */;
```

### Test
- `isPrintShopUnlocked` hanya true saat kondisi terpenuhi.

---

## M15 — App bernapas & bertanya balik ★

### Konsep
- **Napas:** idle → gradien bergerak sangat lambat, drone BGM naik-turun, satu halaman berkedip seperti mata. Sentuh → berhenti (seolah ketahuan).
- **Bertanya balik:** di momen tenang, app bertanya *「なぜ、ぼくはここにいるんだと思う？」* → pemain menjawab → **app mengingat & mengutipnya kembali nanti** (era lain).

### Data model
```js
// features/companion/breathing.js — MURNI
export const breathPhase = (tMs) => /* 0..1 sinusoidal, periode ~6s */;
// features/companion/questions.js — MURNI
export const QUESTIONS = [ { id: 'why', jp: 'なぜ、ぼくはここにいるんだと思う？', id_text: 'Menurutmu kenapa aku ada di sini?' } ];
export const rememberAnswer = (answers, qid, answer) => /* simpan, kutip nanti */;
export const quoteAnswer = (answers, qid) => /* teks kutipan utk era lain */;
```

### Aturan
- Jawaban disimpan di `app_companion_v1` (persist lintas-era).
- **Kutip balik** = momen paling kuat; jadwalkan di era berikutnya (Shōwa), bukan langsung.

### Test
- `breathPhase` periodik; `rememberAnswer` + `quoteAnswer` round-trip.

---

## Rencana Implementasi (urutan eksekusi)

> Konvensi commit: `feat(meiji):`, `feat(typesetting):`, `feat(companion):`, `fix(...)`, `test(...)`.
> **TDD wajib**: tulis test (RED) → implement (GREEN) → commit. Satu sistem = 1+ commit self-consistent.

| # | Task | Modul | Test |
|---|---|---|---|
| E1 | M1 活字組み inti | `features/typesetting/` | `typesetting.test.js` |
| E2 | M1 wiring UI + misprint CSS | `TypesettingBoard.jsx` | manual |
| E3 | M2 和魂洋才 | `features/theme/waYo.js` | ✅ |
| E4 | M4 codex つながり | `features/codex/threads.js` | ✅ |
| E5 | M3 第二面 | `features/news/newsPages.js` | ✅ |
| E6 | M11 戸籍 | `features/profile/koseki.js` | ✅ |
| E7 | M12 jejak Nacht/Saku | `features/companion/footprints.js` | ✅ |
| E8 | M7 時刻 | `features/time/temporal.js` | ✅ |
| E9 | M8 新語 | `features/neologism/neologism.js` | ✅ |
| E10 | M9 GLITCH | `features/glitch/glitch.js` | ✅ |
| E11 | M5 + M6 (loose type, 縦→横) | `features/typesetting/looseType.js`, `features/theme/textFlow.js` | ✅ |
| E12 | M10 号外 + M13 電信 | `features/news/gogo.js`, `features/telegram/telegram.js` | ✅ |
| E13 | M14 印刷所 + M15 napas/tanya | `features/printshop/`, `features/companion/breathing.js` | ✅ |
| E14 | Verifikasi: `npm test`, `npm run lint` (0), `npm run build` | — | — |

**Urutan disarankan:** E1→E2 dulu (inti belajar), lalu E3–E5 (konten), lalu E7+E11+E12 (rasa hidup), terakhir E13 (easter egg).

---

## Kriteria Penerimaan (mekanik)

| # | Kriteria | Cara uji |
|---|---|---|
| 1 | `checkOrder` benar/salah akurat | unit test |
| 2 | Misprint CSS = 0 saat susunan benar | manual/visual |
| 3 | Rasio 和/洋 mengubah kepadatan motif per perhentian | visual 8 halaman |
| 4 | 第二面 opsional & nada datar | manual |
| 5 | Codex mengisi つながり saat echo | manual |
| 6 | Timer musiman → standar setelah 鉄道 (dengan penjelasan) | manual |
| 7 | 新語 cocok dengan kata sejarah | unit test |
| 8 | GLITCH naik dengan level, mati di reduced-motion | unit test + DevTools |
| 9 | Jejak Nacht/Saku pakai timestamp nyata | unit test |
| 10 | Semua modul murni dites `node --test`; lint 0; build exit 0 | terminal |

---

## Risiko & Catatan

| # | Risiko | Mitigasi |
|---|---|---|
| R1 | Terlalu banyak sistem → over-scope | **Prioritas ★**: kerjakan ★★★ dulu (M1, M2, M12); sisanya opsional |
| R2 | Glitch/号外/napas bisa ganggu belajar | Semua **default konservatif** + toggle di Pengaturan + hormati `prefers-reduced-motion` |
| R3 | 検閲 / 時刻 bisa terasa "bug" | **Wajib penjelasan in-story**; 時刻 diberi koran 号外 penjelas |
| R4 | Sisi gelap (第二面) bisa merusak nada hangat | **Selalu opsional**, nada datar, tanpa drama |
| R5 | localStorage key baru bertambah | Catat di `Project Japanese Quiz.md`; ikut "Reset Semua Data" |
| R6 | Modul murni harus bebas DOM | Guard `typeof window`; test di node |
| R7 | M9 glitch bocor ke era lain | Frekuensi hanya saat `era === 'meiji'` & level tinggi |

---

## Yang TIDAK termasuk file ini

- Bahasa visual, warna, tipografi, motif → `docs/tema/meiji.md`.
- Naskah cinematic & voice → `docs/tema/meiji.md` §10 + `docs/voice-cinematic-edo.md` (pola).
- Cerita utama → `docs/story.md`.
- Era lain (Shōwa dll) — tapi **benang M4 & M15 disiapkan** untuk mereka.
