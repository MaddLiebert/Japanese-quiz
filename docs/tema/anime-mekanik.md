# SPEC MEKANIK — Tema Era **ANIME MULTIVERSE 多元** (sistem kode)

**Versi:** v0.1 · **Dibuat:** 2026-10-10
**Status:** ✅ TERPASANG di kode — sistem mekanik sudah aktif (lihat modul + test). Dokumen ini tetap **SPEC acuan**.
**Induk visual/konten:** `docs/tema/anime.md` (PRD tema 多元)
**Pola arsitektur:** mengikuti Meiji/Shōwa — **modul MURNI** (tanpa React/DOM) + test `node --test`, lalu UI React yang menipis.
**Prasyarat:** `docs/tema/anime.md` T1–T4 (eraNames + token CSS) sudah jalan.

> **Kenapa dipisah dari `anime.md`?** `anime.md` = bahasa visual, konten, narasi, arsitektur 3 lapis (bisa dinilai mata).
> File ini = **sistem yang butuh kode** (fungsi murni, data model, localStorage, test). Supaya eksekusi per-terminal bersih: satu file = satu jenis kerja.

> **⚠️ Aturan hak cipta (§6.4 `anime.md`) berlaku di SELURUH file ini:**
> franchise, karakter, dan aset = **FIKTIF & ORISINAL**. JANGAN menamai/menyalin IP nyata. Konten JJK yang sudah ada di repo = referensi sistem, bukan template.

---

## 0. Peta sistem

| Kode | Sistem | Butuh aset? | Prioritas |
|---|---|---|---|
| A1 | **オノマトペ** — bunyi kata (manga) | tidak | ★★★ inti |
| A2 | **タメ口↔敬語** — tukar register | tidak | ★★★ inti |
| A3 | **セリフ組み** — susun dialog | tidak | ★★★ inti |
| A4 | **推し** — karakter favorit | tidak | ★★ |
| A5 | **クレーンゲーム** — varian gacha | tidak | ★★ |
| A6 | **若者言葉** — slang muda | tidak | ★★ |
| A7 | **カタカナ** — loanwords | tidak | ★★ |
| A8 | **メタ / 4th-wall** — app "sadar" ini anime | tidak | ★★ |
| A9 | **GLITCH** — kebocoran cyberpunk (paling kuat) | tidak | ★★★ |
| A10 | **名刺** — profil = kartu tukar | tidak | ★ |
| A11 | **デイリー** — misi harian = episode | tidak | ★ |
| A12 | **集中線/ベタフラッシュ** — impact frame | tidak | ★ |
| A13 | **Codex つながり** — benang lintas-era | tidak | ★★ |
| A14 | **打ち切り** — sisi gelap industri pop | tidak | ★★ |
| A15 | **世界選択** — beli/pilih dunia (Lapis 2) | tidak | ★★★ inti |
| A16 | **必殺技** — wiring efek karakter (Lapis 3) | sebagian | ★★ |

> **Prinsip:** SEMUA modul murni & deterministik → bisa dites tanpa browser. Efek visual (impact frame, glitch, crane) = CSS/React di lapisan tipis di atasnya.
> **Beda dari Meiji:** A15 + A16 = **state baru** (`ownedFranchises`, `ownedCharacters`) yang menggerakkan arsitektur 3 lapis (`anime.md` §11).

---

## A1 — オノマトペ (Onomatopoeia) ★★★

### Konsep
**Bunyi kata = jantung manga.** オノマトペ Jepang jauh lebih kaya dari bahasa lain (ドキドキ, キラキラ, ゴゴゴ). Belajar lewat **konteks adegan** → pilih bunyi yang tepat. Ini register pop paling khas & paling berguna untuk membaca manga/anime.

### Data model
```js
// features/onoma/onoma.js — MURNI
// 3 kategori: gion 擬音 (suara benda) · gita 擬態 (keadaan) · gijō 擬情 (perasaan)
export const OTO = [
  { id: 'dokidoki', jp: 'ドキドキ', reading: 'どきどき', category: 'gijō',
    scene_jp: '告白の直前、心臓が…', meaning_id: 'jantung berdebar kencang', meaning_en: 'heart pounding',
    choices: ['dokidoki', 'wakuwaku', 'kirakira', 'gogogo'] },
  { id: 'kirakira', jp: 'キラキラ', reading: 'きらきら', category: 'gita',
    scene_jp: 'ヒロインが振り向く。光が…', meaning_id: 'berkilau', meaning_en: 'sparkling',
    choices: ['kirakira', 'dokidoki', 'batabata', 'shizuku'] },
  { id: 'ban', jp: 'バン！', reading: 'ばん', category: 'gion',
    scene_jp: '扉を思いきり開ける。', meaning_id: 'BANG! (bantingan)', meaning_en: 'BANG!',
    choices: ['ban', 'fuwafuwa', 'zaazaa', 'kosokoso'] },
  { id: 'gogogo', jp: 'ゴゴゴ', reading: 'ごごご', category: 'gita',
    scene_jp: '強敵が近づく。地響きが…', meaning_id: 'gemuruh mengancam', meaning_en: 'ominous rumble',
    choices: ['gogogo', 'pyonpyon', 'wanwan', 'chirin'] },
];
```

### Fungsi murni
```js
export const OTOMA_CATEGORIES = ['gion', 'gita', 'gijō'];
export const onomaById = (id) => OTO.find((o) => o.id === id) || null;
export const onomaPool = (category) => OTO.filter((o) => o.category === category);

// ok = pilihan cocok dengan `jp` item. `correct` = id jawaban (untuk reveal).
export const checkOnoma = (item, choiceJp) => ({ ok: item?.jp === choiceJp, correct: item?.jp || null });
```

### Aturan desain
- Level naik = pilihan makin mirip (ドキドキ vs ワクワク — dua-duanya "perasaan").
- **Feedback visual:** jawaban benar → **集中線 + オノマトペ melayang** di kartu (impact frame, §A12).
- Tiap soal menampilkan **adegan (scene_jp)** dulu → pemain menyimpulkan bunyi (bukan hafalan buta).

### Test (`onoma.test.js`)
- `checkOnoma(item, item.jp).ok === true`; pilihan salah → false.
- `onomaPool('gion')` hanya kategori gion; `onomaById('nope') === null`.

### Wiring UI
- Modul: `features/onoma/{onoma.js, OnomaBoard.jsx}` (pola `features/writing/`).
- Halaman/mode: `/anime-history` (perhentian 冒険) atau mode di `/practice`. Gate: era 多元 (Lv 150).

---

## A2 — タメ口↔敬語 (Tukar register) ★★★

### Konsep
**Register = inti bahasa pop.** Tokoh anime bicara タメ口 (santai) ke teman, 敬語 (hormat) ke atasan/orang baru. Mekanik: pemain **mengubah kalimat** dari satu register ke yang lain — keterampilan yang **langsung kepakai** di percakapan nyata.

### Data model
```js
// features/register/register.js — MURNI
// Pasangan kalimat santai ↔ hormat (bukan sekadar kamus — ada konteks).
export const REGISTER_PAIRS = [
  { id: 'taberu', casual: '食べる',     polite: '食べます',   meaning_id: 'makan',        level: 1 },
  { id: 'iku',    casual: '行く',       polite: '行きます',   meaning_id: 'pergi',        level: 1 },
  { id: 'da',     casual: '学生だ',     polite: '学生です',   meaning_id: 'murid',        level: 1 },
  { id: 'ii',     casual: 'いい',       polite: 'いいです',   meaning_id: 'bagus',        level: 1 },
  { id: 'shiteru',casual: '知ってる？', polite: 'ご存じですか？', meaning_id: 'tahu?',     level: 2 },
  { id: 'kure',   casual: '教えて',     polite: '教えてください', meaning_id: 'tolong ajar', level: 2 },
];
```

### Fungsi murni
```js
export const registerById = (id) => REGISTER_PAIRS.find((p) => p.id === id) || null;

// mode: 'polite' (santai→hormat) atau 'casual' (hormat→santai).
// guess = jawaban pemain. ok = cocok dengan target register.
export const checkRegister = (item, mode, guess) => {
  const target = mode === 'casual' ? item?.casual : item?.polite;
  return { ok: guess === target, target: target || null };
};

// Konversi cepat (lookup dua arah) untuk hint/auto-suggest.
export const toPolite = (casual) => REGISTER_PAIRS.find((p) => p.casual === casual)?.polite || null;
export const toCasual = (polite) => REGISTER_PAIRS.find((p) => p.polite === polite)?.casual || null;
```

### Aturan desain
- **Dua arah** (santai→hormat & hormat→santai) — keduanya penting.
- Sediakan **hint tabel konjugasi** di mode Jiplak (レベル1): だ→です, る→ます, する→します.
- Perhentian **日常** & **青春** = tempat paling cocok (sekolah & teman).
- **Konteks wajib:** tampilkan "siapa bicara ke siapa" (友達へ / 先生へ) — supaya pemain tahu register yang benar.

### Test (`register.test.js`)
- `checkRegister(pair, 'polite', pair.polite).ok === true`; salah → false.
- `toPolite('食べる') === '食べます'`; `toCasual('食べます') === '食べる'`.

### Wiring UI
- Modul: `features/register/{register.js, RegisterBoard.jsx}` (pola `typesetting/`).
- Halaman: mode di `/practice` atau halaman perhentian 日常/青春.

---

## A3 — セリフ組み (Susun dialog) ★★★

### Konsep
Pola **活字組み Meiji** (`features/typesetting/`) — tapi **balon manga (セリフ)**. Pemain menyusun potongan dialog jadi kalimat benar, dari **beberapa balon** yang saling menyambung (dialog). Ini melatih urutan kata (SOV) + partikel dalam konteks percakapan.

### Data model
```js
// features/serifu/serifu.js — MURNI
// Satu adegan = beberapa balon; tiap balon = kalimat yang disusun dari potongan.
export const SERIFU = [
  {
    id: 's-001',
    scene_jp: '教室、朝。',
    bubbles: [
      { who: 'saku', parts: [
        { id: 'p1', jp: 'おはよう',   pos: 'greeting', reading: 'おはよう' },
        { id: 'p2', jp: '！',         pos: 'punct',    reading: '' },
      ], distractors: [
        { id: 'd1', jp: 'こんばんは', pos: 'greeting', reading: 'こんばんは' },
      ] },
      { who: 'nacht', parts: [
        { id: 'p3', jp: 'おはよう',   pos: 'greeting', reading: 'おはよう' },
        { id: 'p4', jp: 'ございます', pos: 'aux',      reading: 'ございます' },
      ], distractors: [
        { id: 'd2', jp: 'です',       pos: 'aux',      reading: 'です' },
      ] },
    ],
    translation: 'Selamat pagi! / Selamat pagi (hormat).',
  },
];
```

### Fungsi murni
```js
export const POS_COLORS = { greeting: 'sora', noun: 'matcha', particle: 'sakura', verb: 'daidai', adj: 'kin', aux: 'nezumi', punct: 'sumi' };

export const buildPool = (bubble, seed) => /* acak parts + distractors, deterministik */;
export const checkOrder = (bubble, placedIds) => ({ ok, wrongAt });
export const bubbleAmount = (bubble, placedIds) => /* 0..1 — intensitas balon "kacau" */;
```

### Aturan desain
- **Reuse inti Meiji:** kalau memungkinkan, `serifu.js` memanggil fungsi murni `typesetting.js` (DRY) dan hanya menambah **lapisan balon + siapa bicara**.
- Partikel (は/が/を) = blok **kecil & beda warna** → struktur SOV tanpa ceramah.
- Feedback: susunan salah → balon **miring/robek** (bukan misprint Meiji — pakai `bubbleAmount` → CSS skew).
- **Konteks タメ口/敬語** muncul natural (balon Saku = おはよう！, balon Nacht = おはようございます).

### Test (`serifu.test.js`)
- `checkOrder` benar saat urut; salah saat ada distraktor.
- `buildPool` deterministik (seed sama → sama).
- `bubbleAmount` = 0 benar, > 0 salah.

### Wiring UI
- Modul: `features/serifu/{serifu.js, SerifuBoard.jsx}` (pola `typesetting/TypesettingBoard.jsx`).
- Halaman: mode di `/practice` atau halaman perhentian 冒険/日常.

---

## A4 — 推し (Karakter favorit) ★★

### Konsep
**推し (oshi)** = karakter yang pemain dukung/favoritkan. Mekanik: pilih **1 推し** → ia muncul di Home, bereaksi khusus tiap event (benar, streak, lulus), dan jadi "wajah" progres. Ini mengikat emosi pemain ke koleksi karakter (Lapis 3).

### Data model
```js
// features/oshi/oshi.js — MURNI
// oshi = id karakter yang dimiliki (dari A16). Bisa diganti kapan saja.
export const setOshi = (state, characterId) => ({ ...state, oshiId: characterId || null });

// Reaksi deterministik per event (bukan acak) → bisa dites.
export const OSHI_REACTIONS = {
  correct:  { jp: 'いいね！',        id_text: 'Bagus!' },
  wrong:    { jp: 'だいじょうぶ。',   id_text: 'Tidak apa-apa.' },
  streak:   { jp: 'すごい！',        id_text: 'Hebat!' },
  graduate: { jp: 'いっしょに、行こう。', id_text: 'Ayo pergi bersama.' },
};
export const oshiReaction = (event) => OSHI_REACTIONS[event] || null;
```

### Aturan desain
- 推し **hanya bisa dipilih dari karakter yang dimiliki** (hasil gacha A16) → mengikat koleksi ke emosi.
- Muncul **maks 1×/event**, tidak mengganggu belajar (pola `companion/footprints.js`).
- Bisa di-`off` di Pengaturan (mode belajar fokus).
- **Beda dari companion Nacht/Saku:** 推し = karakter fiksi pilihan pemain, bukan narator cerita.

### Test (`oshi.test.js`)
- `setOshi` menyimpan id; id kosong → null.
- `oshiReaction('correct')` mengembalikan teks; event tak dikenal → null.

---

## A5 — クレーンゲーム (Varian gacha) ★★

### Konsep
Gacha 多元 = **クレーンゲーム** (UFO catcher arcade). Pola mesin slot per-era (`slot.js`: Heian=貝合わせ, Edo=木札, Meiji=福引, Shōwa=ガチャガチャ) → 多元 = **cakar (claw)** menjatuhkan **figur/kapsul**.

### Data model
```js
// features/gacha/slot.js — TAMBAH varian 多元 (pola HEIAN_SHELL_* / EDO_SLIP_*)
export const ANIME_CLAW_COUNT = 3;               // 3 figur (meniru 3 reel)
export const ANIME_CLAW_MS = [1800, 3000, 4200]; // tiap figur diambil berurutan (ms) — paling cepat
export const ANIME_CLAW_TICK_MS = 60;            // bunyi mesin arcade (ms)
export const ANIME_CLAW_EASE = [0.34, 1.56, 0.64, 1]; // overshoot (cakar memantul — "kartun")
export const ANIME_CLAW_FADE = 28;               // fade tepi (px)

// Simbol yang lewat saat cakar bergerak — motif pop: bintang, hati, not, kilat, bunga.
export const ANIME_CLAW_POOL = ['star', 'heart', 'note', 'bolt', 'flower', 'crown', 'gem', 'sparkle'];

export function buildClawStrip(targetIcon, pool = ANIME_CLAW_POOL, length = STRIP_LEN, rng = Math.random) {
  return buildStrip(targetIcon, pool, length, rng);
}
export function buildClawStrips(targetIcons, pool = ANIME_CLAW_POOL, length = STRIP_LEN, rng = Math.random) {
  return Array.from({ length: ANIME_CLAW_COUNT }, (_, i) =>
    buildClawStrip(targetIcons[i % targetIcons.length], pool, length, rng));
}
```

### Aturan desain
- **Ease overshoot** (`1.56`) = cakar memantul → rasa "arcade", beda dari snap Shōwa.
- Copy UI di `features/gacha/animeCopy.js` (pola `showaCopy.js`): `title: 'クレーンゲーム'`, `titleSub: 'くれーんげーむ · crane game'`, `pull1: 'アーム 1回'`, dll.
- Hasil gacha = **karakter** (A16) & item koleksi (§16 `anime.md`).

### Test (`animeCopy.test.js` + tambahan `slot.test.js`)
- `buildClawStrips` menghasilkan 3 strip, elemen terakhir = target.
- `gachaCopyAnime().title === 'クレーンゲーム'`.

---

## A6 — 若者言葉 (Slang muda) ★★

### Konsep
**若者言葉** = slang yang benar-benar dipakai anak muda Jepang (やばい, エモい, きゅん, ガチ, すこ). Mekanik: cocokkan slang → arti + nuansa. Ini register paling "hidup" & paling sering muncul di anime/media sosial.

### Data model
```js
// features/slang/slang.js — MURNI
export const SLANG = [
  { id: 'yabai',  jp: 'やばい',  reading: 'やばい',  meaning_id: 'gila / keren / bahaya (tergantung konteks)', meaning_en: 'insane/cool/risky', nuance_id: 'serba bisa', level: 1 },
  { id: 'emoi',   jp: 'エモい',  reading: 'えもい',  meaning_id: 'menyentuh / bikin haru', meaning_en: 'emotional/vibey', nuance_id: 'perasaan', level: 1 },
  { id: 'kyun',   jp: 'きゅん',  reading: 'きゅん',  meaning_id: 'berdebar (karena gemas/cinta)', meaning_en: 'heart flutter', nuance_id: 'gema', level: 2 },
  { id: 'gachi',  jp: 'ガチ',    reading: 'がち',    meaning_id: 'sungguhan / serius', meaning_en: 'for real/serious', nuance_id: 'tegas', level: 2 },
  { id: 'suko',   jp: 'すこ',    reading: 'すこ',    meaning_id: 'suka (versi net)', meaning_en: 'like (net slang)', nuance_id: 'net', level: 3 },
];
```

### Fungsi murni
```js
export const slangById = (id) => SLANG.find((s) => s.id === id) || null;
export const checkSlang = (item, guessId) => ({ ok: guessId === item?.id, correct: item?.id || null });
export const slangByLevel = (level) => SLANG.filter((s) => s.level <= level);
```

### Aturan desain
- Slang punya **nuansa** (やばい = bisa keren/bahaya) → ajari bahwa arti tergantung konteks.
- Perhentian **青春** = tempatnya.
- **Hati-hati:** tandai mana slang yang **sopan dipakai** vs **hanya antar-teman** (jangan sampai pemain pakai ke atasan).

### Test (`slang.test.js`)
- `checkSlang(item, item.id).ok === true`; `slangByLevel(2)` memuat level 1+2.

---

## A7 — カタカナ loanwords ★★

### Konsep
**カタカナ** = pintu masuk kata serapan (マジック←magic, ドラゴン←dragon). Mekanik: cocokkan katakana → kata asal + arti. Berguna banget (banyak kata pop = serapan) & cepat dikuasai.

### Data model
```js
// features/loanwords/loanwords.js — MURNI
export const LOANWORDS = [
  { id: 'majikku', jp: 'マジック', origin: 'magic',       origin_lang: 'en', meaning_id: 'sihir / sulap' },
  { id: 'doragon', jp: 'ドラゴン', origin: 'dragon',      origin_lang: 'en', meaning_id: 'naga' },
  { id: 'kurisutaru', jp: 'クリスタル', origin: 'crystal', origin_lang: 'en', meaning_id: 'kristal' },
  { id: 'arubaito', jp: 'アルバイト', origin: 'Arbeit',    origin_lang: 'de', meaning_id: 'kerja sambilan' },
];
```

### Fungsi murni
```js
export const loanById = (id) => LOANWORDS.find((l) => l.id === id) || null;
export const checkLoan = (item, guessId) => ({ ok: guessId === item?.id, correct: item?.id ?? null });
export const loansByLang = (lang) => LOANWORDS.filter((l) => l.origin_lang === lang);
```

### Aturan desain
- Tunjukkan **bahasa asal** (en/de/pt) → pemain sadar katakana bukan cuma "Inggris".
- Perhentian **魔法** (fantasi) = paling cocok (banyak kata serapan fantasi).
- **Jebakan belajar:** sebagian kata serapan **bergeser arti** (例: マンション = apartemen, bukan mansion) → jadikan soal lanjutan.

### Test (`loanwords.test.js`)
- `checkLoan(item, item.id).ok === true`; `loansByLang('de')` memuat アルバイト.

---

## A8 — メタ / 4th-wall (App "sadar" ini anime) ★★

### Konsep
Pola `companion/questions.js`. Di era pop, app **sadar dirinya seperti anime**: muncul **「つづく」**, "to be continued", narrator komentar meta, "episode berikutnya". Rasa "bernyawa" yang murah (data sudah ada) & sangat cocok tema.

### Data model
```js
// features/meta/meta.js — MURNI
export const META_MOMENTS = [
  { id: 'tsuzuku', trigger: (s) => s.sessionEnd && s.answered >= 10,
    jp: 'つづく', id_text: 'Bersambung…' },
  { id: 'episode', trigger: (s) => s.dayStreak > 0,
    jp: `第${'{n}'}話`, id_text: 'Episode {n}' },
  { id: 'narrator', trigger: (s) => s.streak >= 20,
    jp: 'ここで、彼は気づいた。', id_text: 'Di sini, ia menyadari.' },
];
export const pickMeta = (stats, seenIds = []) =>
  META_MOMENTS.find((m) => m.trigger(stats) && !seenIds.includes(m.id)) || null;
```

### Aturan desain
- Muncul **maks 1×/sesi** (jangan ganggu belajar).
- 「つづく」 = tanda tangan penutup sesi 多元 (pola "完" di akhir dunia).
- Bisa di-`off` di Pengaturan.

### Test (`meta.test.js`)
- `pickMeta({sessionEnd:true, answered:12})` → `tsuzuku`; id yang sudah tampil dilewati.

---

## A9 — GLITCH (Kebocoran cyberpunk — PALING KUAT) ★★★

### Konsep
Pola `features/glitch/glitch.js` (Meiji). **Tapi 多元 = era paling dekat rumah Nacht/Saku (Cyberpunk)** → glitch **paling kuat & paling sering** dari semua era. Ini puncak benang sebelum twist Lv 300.

### Data model
```js
// features/glitch/glitch.js — TAMBAH varian 多元 (level lebih tinggi, max lebih besar)
export const GLITCH_MIN_LEVEL_ANIME = 150;

// Frekuensi 0..0.20 (Meiji 0..0.12) — naik dari Lv 150 → 300.
export const glitchChanceAnime = (level, minLevel = GLITCH_MIN_LEVEL_ANIME) => {
  const lv = Number(level) || 0;
  if (lv < minLevel) return 0;
  const t = Math.min(1, (lv - minLevel) / (300 - minLevel)); // 150 → 0 .. 300 → 1
  return t * 0.20;
};
export const glitchIntensityAnime = (level, minLevel = GLITCH_MIN_LEVEL_ANIME) => {
  const lv = Number(level) || 0;
  if (lv < minLevel) return 0;
  return Math.min(1, (lv - minLevel) / (300 - minLevel));
};
```

### Aturan desain
- **Paling kuat** — di Lv 300 (Cyberpunk) glitch jadi **permanen** (bukan lagi "bocor", tapi "terbuka").
- Efek: warna berkedip ke neon cyberpunk 1–2 frame, teks holografik, suara digital menembus BGM.
- **A11y:** matikan di `prefers-reduced-motion`; toggle di Pengaturan.
- Hanya aktif saat `era === 'anime'`.

### Test (`glitch.test.js`)
- `glitchChanceAnime(150) === 0`; `glitchChanceAnime(300) === 0.20`; `> glitchChance` versi Meiji di level sama.

---

## A10 — 名刺 (Profil = kartu tukar) ★

### Konsep
Pola `features/profile/koseki.js` (Meiji). Profil 多元 = **名刺** (kartu tukar ala 推し活) — menampilkan "nama", 推し, 戦闘力, lencana. Rarity kartu naik dengan progres.

### Data model
```js
// features/profile/meishi.js — MURNI
export const buildMeishi = (progress) => ({
  name: progress.playerName || '旅人',
  oshi: progress.oshiId || null,
  power: progress.level || 1,               // 戦闘力
  badges: progress.badges || [],
  since: progress.firstSeen || null,
  rarity: meishiRarity(progress),
});

export const meishiRarity = (p) => {
  const lv = Number(p?.level) || 1;
  if (lv >= 300) return 'UR';   // ultra rare
  if (lv >= 200) return 'SSR';
  if (lv >= 150) return 'SR';
  return 'R';
};
```

### Aturan desain
- Hanya **membaca** data yang sudah ada (`user_progress_v2`).
- Kartu = **bagian visual** (kartu bisa "dibagikan"/disimpan sebagai PNG nanti — opsional).

### Test (`meishi.test.js`)
- `meishiRarity({level:150}) === 'SR'`; `buildMeishi({...})` stabil.

---

## A11 — デイリー (Misi harian = episode) ★

### Konsep
Misi harian 多元 = **「第N話」** (episode hari ini). Pola `features/quests/`. Bukan daftar tugas — tapi **episode** yang berjudul.

### Data model
```js
// features/quests/episode.js — MURNI
export const episodeNumber = (dayIndex) => Math.max(1, Math.floor(dayIndex) + 1);
export const EPISODE_TITLES = ['出会い', '日常', '決意', '試練', '仲間', '対決', '勝利', 'そして…'];
export const episodeTitle = (dayIndex) => EPISODE_TITLES[dayIndex % EPISODE_TITLES.length];
export const dailyEpisode = (dayIndex) => ({ n: episodeNumber(dayIndex), title: episodeTitle(dayIndex) });
```

### Aturan desain
- Judul episode = **data** (mudah ditambah), bukan hardcode di komponen.
- Tidak mengubah mekanik quest (hanya framing).

### Test (`episode.test.js`)
- `episodeNumber(0) === 1`; `episodeTitle` bersiklus; `dailyEpisode(2).n === 3`.

---

## A12 — 集中線 & ベタフラッシュ (Impact frame) ★

### Konsep
Momen "wow" (streak, jawaban benar berturut, lulus) = **impact frame** ala manga: **集中線** (garis radial) + **ベタフラッシュ** (kedip penuh 1 frame). Ini tanda tangan visual 多元.

### Data model
```js
// features/effects/impact.js — MURNI
// streak → intensitas 0..1 (kapan garis radial & kedip muncul)
export const impactIntensity = (streak) => Math.min(1, Math.max(0, (Number(streak) || 0) / 10));
// frame: 'none' | 'burst' | 'flash' — untuk memilih efek CSS
export const impactFrame = (streak) => {
  const i = impactIntensity(streak);
  if (i >= 1) return 'flash';   // ベタフラッシュ penuh
  if (i >= 0.5) return 'burst'; // 集中線
  return 'none';
};
// Hormati reduced-motion.
export const impactAllowed = ({ reducedMotion = false, enabled = true } = {}) => enabled && !reducedMotion;
```

### Aturan desain
- Muncul **singkat** (≤ 300ms) — jangan bikin pusing.
- **A11y:** mati di `prefers-reduced-motion` + toggle.
- Dipakai bersama **オノマトペ melayang** (A1) saat benar.

### Test (`impact.test.js`)
- `impactFrame(0) === 'none'`; `impactFrame(5) === 'burst'`; `impactFrame(10) === 'flash'`.

---

## A13 — Codex つながり (Benang lintas-era) ★★

### Konsep
Pola `features/codex/threads.js` (Meiji). 多元 = **simpul lanjutan**: istilah pop yang meng-echo era sebelumnya. Benang sudah disiapkan Meiji; 多元 menambah node.

### Data model
```js
// features/codex/threads.js — TAMBAH node 多元 ke THREADS yang ada + 1 thread baru
// Tambahan node: chain lama (edo → meiji → showa) lanjut ke 多元:
//   light : 電気 (showa) → ネオン (anime)
//   road  : 新幹線 (showa) → ロケット (anime)   // "perjalanan" naik ke luar angkasa
//   money : 円 (showa) → コイン (anime)
//   news  : 新聞 (showa) → ネット (anime)
// Thread BARU khas 多元 (budaya pop):
//   hero  : { id: 'hero', label_jp: '英雄', chain: ['武士 (edo)', '軍人 (meiji)', 'ヒーロー (anime)'] }
```

### Fungsi murni
```js
// Reuse addNode / linkedNote dari threads.js (tidak berubah).
// Tambah: thread khusus 多元 (untuk toast 「つながり」 lintas-era).
export const ANIME_THREADS = [{ id: 'hero', label_jp: '英雄', chain: ['武士 (edo)', '軍人 (meiji)', 'ヒーロー (anime)'] }];
```

### Aturan desain
- Data-driven: nambah node = nambah data, bukan kode.
- **Benang 英雄** = inti: bagaimana "pahlawan" berubah dari samurai → tentara → ヒーロー fiksi.

### Test (`threads.test.js`)
- `threadById('hero').label_jp === '英雄'`; `addNode` idempoten.

---

## A14 — 打ち切り (Sisi gelap industri pop) ★★

### Konsep
Pola `第二面` Meiji & `灰の中の声` Shōwa. 多元 bukan cuma keceriaan — ada **harga di balik layar**. Disajikan **opsional & datar** (tanpa drama). Nada: **「照明は見せない」** — lampu panggung tidak diperlihatkan.

### Data model
```js
// features/news/darkPages.js — MURNI (pola newsPages.js Meiji)
export const DARK_PAGES = [
  { id: 'karoshi', jp: '過労',   headline_jp: '制作現場、また徹夜。', headline_id: 'Produksi lembur lagi.', stop: 'seishun' },
  { id: 'enjo',    jp: '炎上',   headline_jp: '一言で、燃え広がる。', headline_id: 'Satu ucapan, membakar luas.', stop: 'daily' },
  { id: 'haikakin',jp: '廃課金', headline_jp: '気づけば、財布が空。', headline_id: 'Sadar-sadar, dompet kosong.', stop: 'magic' },
  { id: 'chusho',  jp: '誹謗中傷',headline_jp: '言葉が、人を刺す。',   headline_id: 'Kata-kata menusuk orang.', stop: 'kaidan' },
  { id: 'uchikiri',jp: '打ち切り',headline_jp: 'その話は、打ち切られた。', headline_id: 'Cerita itu dipotong.', stop: 'saishukai' },
];
export const darkPagesForStop = (stopId) => DARK_PAGES.filter((p) => p.stop === stopId);
```

### Aturan desain
- **Selalu opsional** — pemain yang mau langsung main bisa lewati.
- Ditulis datar (headline pendek), **tanpa** emoji/dramatisasi.
- Hadiah baca = +1 entri codex (A13), bukan EXP besar.
- **Tidak menghakimi** — sajikan fakta, bukan ceramah.

### Test (`darkPages.test.js`)
- `darkPagesForStop('saishukai')` memuat `uchikiri`; stop tanpa halaman → [].

---

## A15 — 世界選択 (Beli/pilih dunia — LAPIS 2) ★★★

### Konsep
**Inti era ini** (`anime.md` §11). 多元 = kanvas kosong; pemain **membeli** franchise → satu **dunia** (palet + motif + gacha pool) dilukis ke kanvas. Ini yang membedakan 多元 dari semua era lain.

### Data model
```js
// features/anime/franchises.js — MURNI
// ⚠️ Dunia ORISINAL (tanpa `licensed`) = FIKTIF. Dunia LISENSI = IP nyata + credit.
export const FRANCHISES = [
  { id: 'hoshi',  kanji: '星の旅人', name: 'Star Traveler',  genre_id: 'Petualangan luar angkasa', price: 5000,
    fr1: '#2b6cb0', fr2: '#f0c862', motif: 'star',  pool: ['star', 'rocket', 'planet', 'comet'] },
  // … kage / mahou / kishin / yokai (orisinal) …

  // ── Dunia LISENSI (IP nyata) — tier "dunia besar" ~20k, wajib credit ──
  { id: 'jjk', kanji: '呪術廻戦', name: 'Jujutsu Kaisen', genre_id: '…', price: 20000,
    fr1: '#161a2b', fr2: '#7c4dff', motif: 'curse', pool: ['curse', 'seal', 'flash', 'domain'],
    licensed: true, status: 'live', nuance: 'cursed', credit: '呪術廻戦 © 芥見下々 / 集英社・MAPPA' },
  { id: 'onepiece', kanji: 'ワンピース', name: 'One Piece', …, licensed: true, status: 'soon', credit: '…' },
  { id: 'jojo',     kanji: 'ジョジョ',   name: "JoJo's Bizarre Adventure", …, licensed: true, status: 'soon', credit: '…' },
];
```

### Fungsi murni
```js
export const FRANCHISE_MIN_LEVEL = 150;
export const franchiseById = (id) => FRANCHISES.find((f) => f.id === id) || null;

// Pemain boleh beli bila level ≥150 & belum punya & medaru cukup.
export const canBuyFranchise = (progress, id) => {
  const f = franchiseById(id);
  if (!f) return false;
  const owned = progress?.ownedFranchises || [];
  return (Number(progress?.level) || 0) >= FRANCHISE_MIN_LEVEL
    && !owned.includes(id)
    && (Number(progress?.medaru) || 0) >= f.price;
};

// Tambah franchise ke state (immutable). Kembalikan state baru.
export const addFranchise = (progress, id) => {
  const owned = progress?.ownedFranchises || [];
  if (owned.includes(id)) return progress;
  return { ...progress, ownedFranchises: [...owned, id] };
};

// Token overlay dunia → dipakai CSS [data-franchise="…"] (§4.5 anime.md).
export const franchiseTokens = (id) => {
  const f = franchiseById(id);
  return f ? { fr1: f.fr1, fr2: f.fr2, motif: f.motif } : null;
};

// Nuansa dunia → dipakai CSS [data-franchise-nuance="…"] (LAPIS 2b). Dunia
// tanpa `nuance` → null (kanvas default).
export const franchiseNuance = (id) => franchiseById(id)?.nuance || null;

// Aktifkan dunia (equip) — 1 dunia aktif pada satu waktu.
export const equipFranchise = (progress, id) =>
  (franchiseById(id) && (progress?.ownedFranchises || []).includes(id))
    ? { ...progress, activeFranchise: id }
    : progress;
```

### Aturan desain
- Franchise **menimpa warna & motif**, **tidak menimpa bentuk** (outline/cel/radius/motion tetap milik era) — §4.5 `anime.md`.
- **1 dunia aktif** pada satu waktu (bisa diganti); semua yang dibeli tetap tersimpan.
- **BELI = AUTO-EQUIP:** dunia yang baru dibeli **langsung jadi `activeFranchise`** (kanvas langsung berubah warna). Fungsi murni `addFranchise` tetap hanya menambah daftar; auto-equip ada di `buyFranchise` (ProgressContext).
- **NUANSA (LAPIS 2b, opsional):** dunia boleh punya `nuance` → atribut `data-franchise-nuance` (mis. JJK `'cursed'` 呪力: screentone rapat + panel rapat). Mengubah **SUASANA (kepadatan tinta), BUKAN bentuk & TANPA ornamen tempelan** (percobaan segel 呪 di hero ditolak pemilik = "AI slop"). Data-driven (`franchiseNuance`); CSS hanya satu blok `[data-franchise-nuance="cursed"]`. Nuansa juga **mengganti judul mesin gacha** (`CLAW_NUANCE` di `animeCopy.js`, mis. クレーンゲーム → 呪具クレーン) **dan BGM** (`themeBgmKey(era, nuance)` → mis. `'anime-cursed'` di `THEME_BGM_PLANS`, §9.1 `anime.md`). Teks = GENERIK bertema kutukan, **tanpa nama IP**.
- Bisa **dibeli** (bukan gacha) — mahal, pakai medaru. Dunia lisensi = **tier besar ~20k**.
- **Dua jenis dunia:** ORISINAL (fiktif) vs LISENSI (`licensed: true` → wajib `credit`). Dunia `status:'soon'` = teaser → `canBuyFranchise` **selalu false**.
- Helper baru: `isFranchiseComingSoon(id)`, `isFranchiseLicensed(id)`, `franchiseNuance(id)`.
- State baru: `ownedFranchises: []`, `activeFranchise: null` di `ProgressContext`.

### Test (`franchises.test.js`)
- `canBuyFranchise({level:150, medaru:5000, ownedFranchises:[]}, 'hoshi') === true`; level <150 → false.
- `addFranchise` idempoten; `equipFranchise` hanya bila dimiliki.
- Tiap franchise punya `fr1`, `fr2`, `motif`, `pool` (validasi data).

---

## A16 — 必殺技 (Wiring efek karakter — LAPIS 3) ★★

### Konsep
Karakter (hasil gacha A5) → **voice + efek 必殺技** (jurus andalan). Pola `features/packs/` + `features/effects/` (JJK yang sudah ada = contoh sistem ini). 多元 = era yang **memberi rumah** untuk lapis karakter.

### Data model
```js
// features/anime/characters.js — MURNI
// ⚠️ SEMUA FIKTIF & ORISINAL. Jangan nama karakter berhak cipta.
export const CHARACTERS = [
  { id: 'hoshi_hikari', fr: 'hoshi', name: 'Hikari', kanji: '光',
    voice: 'hoshi_hikari', effect: 'hoshi', hissatsu_jp: '流星斬', hissatsu_id: 'Tebasan Meteor' },
  { id: 'kage_kuro',   fr: 'kage',  name: 'Kuro',   kanji: '黒',
    voice: 'kage_kuro',   effect: 'kage',  hissatsu_jp: '影分身', hissatsu_id: 'Klona Bayangan' },
  { id: 'mahou_mira',  fr: 'mahou', name: 'Mira',   kanji: '未来',
    voice: 'mahou_mira',  effect: 'mahou', hissatsu_jp: '星屑魔法', hissatsu_id: 'Sihir Bintang' },
  { id: 'kishin_zero', fr: 'kishin',name: 'Zero',   kanji: '零',
    voice: 'kishin_zero', effect: 'kishin',hissatsu_jp: '機神砲', hissatsu_id: 'Meriam Dewa Mesin' },
  { id: 'yokai_kitsune', fr: 'yokai', name: 'Kitsune', kanji: '狐',
    voice: 'yokai_kitsune', effect: 'yokai', hissatsu_jp: '狐火', hissatsu_id: 'Api Rubah' },
];
```

### Fungsi murni
```js
export const characterById = (id) => CHARACTERS.find((c) => c.id === id) || null;
export const charactersOf = (franchiseId) => CHARACTERS.filter((c) => c.fr === franchiseId);
export const characterEffect = (id) => characterById(id)?.effect || null;
export const characterVoice = (id) => characterById(id)?.voice || null;

// Validasi: tiap karakter menunjuk voice + effect yang terdaftar (registry).
export const validateCharacters = (voices = {}, visuals = {}) => {
  const errors = [];
  for (const c of CHARACTERS) {
    if (!c.voice || !(c.voice in voices)) errors.push(`${c.id}: voice '${c.voice}' tak terdaftar`);
    if (!c.effect || !(c.effect in visuals)) errors.push(`${c.id}: effect '${c.effect}' tak terdaftar`);
  }
  return errors;
};
```

### Aturan desain
- **Reuse mesin yang ADA:** `features/audio/voices.js` (registry voice) + `features/effects/visuals.js` (registry visual) + `effectGate.js` (gerbang senyap). JJK (`pack_07`..`pack_14`) = contoh hidup.
- Karakter di-`equip` seperti pack: `ownedCharacters{}` + aktif.
- **Voice/efek aset opsional** — kalau kosong, jatuh ke synth (tidak error, pola `voices.js`).
- **Gerbang senyap:** halaman fokus (mis. ujian) mematikan efek (pola `effectGate.js` QUIET_ROUTES).

### Test (`characters.test.js`)
- `charactersOf('hoshi')` memuat hikari; `characterEffect('hoshi_hikari') === 'hoshi'`.
- `validateCharacters(voices, visuals)` → [] saat semua terdaftar; error saat ada yang hilang.

---

## Rencana Implementasi (urutan eksekusi)

> Konvensi commit: `feat(anime):`, `feat(onoma):`, `feat(register):`, `feat(franchise):`, `fix(...)`, `test(...)`.
> **TDD wajib**: tulis test (RED) → implement (GREEN) → commit. Satu sistem = 1+ commit self-consistent.
> **Urutan penting:** A15/A16 (inti 3 lapis) **setelah** A1–A3 (isi belajar) supaya era punya konten dulu.

| # | Task | Modul | Test |
|---|---|---|---|
| E1 | A1 オノマトペ inti | `features/onoma/` | `onoma.test.js` |
| E2 | A2 タメ口↔敬語 | `features/register/` | `register.test.js` |
| E3 | A3 セリフ組み | `features/serifu/` | `serifu.test.js` |
| E4 | A6 若者言葉 | `features/slang/` | `slang.test.js` |
| E5 | A7 カタカナ loanwords | `features/loanwords/` | `loanwords.test.js` |
| E6 | A15 世界選択 (franchise) + state baru | `features/anime/franchises.js` | `franchises.test.js` |
| E7 | A16 必殺技 (characters) + wiring voice/effect | `features/anime/characters.js` | `characters.test.js` |
| E8 | A5 クレーンゲーム (slot varian + copy) | `features/gacha/{slot.js,animeCopy.js}` | ✅ |
| E9 | A4 推し | `features/oshi/` | `oshi.test.js` |
| E10 | A9 GLITCH (varian paling kuat) | `features/glitch/glitch.js` | ✅ |
| E11 | A13 Codex つながり (node 多元 + thread 英雄) | `features/codex/threads.js` | ✅ |
| E12 | A14 打ち切り (sisi gelap) | `features/news/darkPages.js` | ✅ |
| E13 | A10 名刺 + A11 デイリー + A12 impact | `features/profile/meishi.js`, `features/quests/episode.js`, `features/effects/impact.js` | ✅ |
| E14 | A8 メタ/4th-wall | `features/meta/meta.js` | ✅ |
| E15 | Wiring UI + halaman + Settings + Reset | `pages/*`, `Settings.jsx` | manual |
| E16 | Verifikasi: `npm test`, `npm run lint` (0), `npm run build` | — | — |

**Urutan disarankan:** E1–E3 dulu (inti belajar), lalu E4–E5 (register pop), lalu E6–E8 (inti 3 lapis — **jantung era**), lalu E9–E12 (rasa hidup & lintas-era), terakhir E13–E15 (wiring).

---

## Kriteria Penerimaan (mekanik)

| # | Kriteria | Cara uji |
|---|---|---|
| 1 | オノマトペ benar/salah akurat (3 kategori) | unit test |
| 2 | Tukar register dua arah benar (santai↔hormat) | unit test |
| 3 | セリフ susun benar (balon kacau saat salah) | unit test + visual |
| 4 | 若者言葉 & カタカナ cocok dengan arti/origin | unit test |
| 5 | **Lapis 2:** beli franchise → token `fr1/fr2/motif` aktif, bentuk tetap | unit test + visual |
| 6 | **Lapis 3:** karakter → voice + effect terdaftar & terpasang | unit test + visual |
| 7 | クレーンゲーム jalan (3 figur, overshoot) | uji gacha |
| 8 | 推し muncul maks 1×/event, bisa di-off | unit test |
| 9 | GLITCH 多元 > GLITCH Meiji di level sama; mati di reduced-motion | unit test + DevTools |
| 10 | Codex 英雄 terisi; 打ち切り opsional & datar | manual |
| 11 | Impact frame hormati reduced-motion | unit test |
| 12 | Semua modul murni dites `node --test`; lint 0; build exit 0 | terminal |
| 13 | **Nol IP berhak cipta baru** di franchise/karakter | review + grep |
| 14 | State baru (`ownedFranchises`, `ownedCharacters`, `oshiId`, `activeFranchise`) ikut "Reset Semua Data" | manual |

---

## Risiko & Catatan

| # | Risiko | Mitigasi |
|---|---|---|
| R1 | Terlalu banyak sistem → over-scope | **Prioritas ★**: kerjakan ★★★ dulu (A1, A2, A3, A15, A16); sisanya opsional |
| R2 | Glitch/impact/メタ bisa ganggu belajar | Semua **default konservatif** + toggle Pengaturan + hormati `prefers-reduced-motion` |
| R3 | **Hak cipta** — godaan memakai IP nyata | **Aturan §6.4 `anime.md` keras:** franchise/karakter fiktif; siluet bukan reproduksi; JJK = referensi sistem |
| R4 | A15/A16 tambah state → risiko persist | Catat key di `Project Japanese Quiz.md`; ikut "Reset Semua Data"; guard `ensure*` (pola `ensureCinematics`) |
| R5 | Sisi gelap (打ち切り) bisa merusak nada cerah | **Selalu opsional**, nada datar, tanpa drama |
| R6 | Register/slang bisa mengajarkan yang tidak sopan | Tandai mana **antar-teman** vs **sopan**; peringatan konteks |
| R7 | Modul murni harus bebas DOM | Guard `typeof window`; test di node |
| R8 | A9 glitch bocor ke era lain | Frekuensi hanya saat `era === 'anime'` & level ≥150 |
| R9 | Karakter/franchise butuh aset (voice/effect) | Mulai **1 franchise + 1 karakter percontohan**; aset menyusul (fallback synth) |

---

## Yang TIDAK termasuk file ini

- Bahasa visual, warna, tipografi, motif, arsitektur 3 lapis → `docs/tema/anime.md`.
- Naskah cinematic & voice → `docs/tema/anime.md` §10 + `docs/voice-cinematic-edo.md` (pola).
- Cerita utama → `docs/story.md`.
- Era lain (Cyberpunk) — tapi **benang A9 & A13 disiapkan** untuknya.
- **IP berhak cipta** — DILARANG (§6.4 `anime.md`).
