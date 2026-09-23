# Voice Pack 1 — Gaya "Hina Chono" (TTS aman)

Panduan menghasilkan suara cewek anime **ceria + sok pede + suka ngegodain** untuk
pack #1 (`kotodama_burst`), tanpa mengkloning suara orang nyata.

> **Kenapa bukan kloning?** Meniru suara seiyuu (Akari Kitō) = memakai suara orang
> nyata + karakter berhak cipta. Untuk project pribadi biasanya aman, tapi untuk
> yang dipublikasikan/dijual risikonya nyata. Panduan ini pakai **TTS anime generik**
> yang di-tune supaya "rasanya" mirip Hina — legal dan aman.

---

## 1. Karakter suara yang dituju

| Aspek | Target |
|---|---|
| Pitch | **Tinggi** (cewek muda, bukan anak kecil) |
| Tempo | **Cepat** (energik, antusias) |
| Intonasi | **Ekspresif / banyak naik-turun** (bukan datar) |
| Emosi dasar | Ceria, sok pede, kadang ngegodain |
| Umur kesan | ~15–17 tahun |

Cocok dengan kepribadian Hina: *energetic, cheerful, likes to tease, "Princess Hina"*.

---

## 2. Setting VOICEVOX (kalau pakai Web版 / app)

| Slider | Nilai | Alasan |
|---|---|---|
| 話速 / **speedScale** | **1.15–1.25** | Cepat = energik |
| 音高 / **pitchScale** | **+0.04 – +0.08** | Sedikit lebih tinggi |
| 抑揚 / **intonationScale** | **1.5–1.8** | Naik-turun hidup |
| 音量 / **volumeScale** | 1.0 | Normal |

**Pilih speaker** yang nadanya "anime ceria" (mis. 春日部つむぎ / 四国めたん / ずんだもん).
Coba 2–3 speaker, pilih yang paling cocok di telinga. **Konsisten** pakai satu speaker
untuk semua file pack ini supaya terdengar seperti satu karakter.

> Kalau tidak pakai VOICEVOX, pakai TTS Jepang apa pun yang punya slider
> **speed / pitch / intonation**, atur ke nilai di atas.

---

## 3. Daftar kalimat

Kategori yang dibaca game: **correct**, **wrong**, **streak** (lihat
`src/features/audio/voices.js` + `EffectContext.jsx`).

### 3a. Correct — 「benar」 (pilih 3–4, acak)

| # | Jepang | Romaji | Arti | Intonasi |
|---|---|---|---|---|
| 1 | 正解！ | seikai! | Benar! | Tegas, senyum, naik di akhir |
| 2 | いいね！ | ii ne! | Bagus! | Ceria, ringan |
| 3 | さすがじゃん！ | sasuga jan! | Kayak yang aku duga~ | Sok pede, agak genit |
| 4 | その調子！ | sono chōshi! | Lanjut gitu! | Menyemangati |

### 3b. Wrong — 「salah」 (pilih 3, acak)

| # | Jepang | Romaji | Arti | Intonasi |
|---|---|---|---|---|
| 1 | えー、残念… | ē, zannen… | Eh, sayang… | Turun, cemberut sebentar |
| 2 | ドンマイ！ | donmai! | Nggak apa-apa! | Balik ceria cepat |
| 3 | 次いこう！ | tsugi ikō! | Lanjut berikutnya! | Semangat, dorong maju |

### 3c. Streak — 「milestone」 (SATU file per tier, bukan acak)

Milestone game: **3, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100**
(50 = *gold*, 100 = *zenith*). Dibagi 6 tier emosi:

| Tier | Streak | Jepang | Romaji | Arti | Intonasi |
|---|---|---|---|---|---|
| **1** | 3–5 | いい調子〜！ | ii chōshi~! | Bagus terus~! | Ceria, ringan |
| **2** | 10–20 | すごいすごい！ | sugoi sugoi! | Hebat, hebat! | Makin cepat, excited |
| **3** | 30–40 | 止まらないね！ | tomaranai ne! | Nggak berhenti ya! | Kagum |
| **4** | **50** | 五十連続！？天才でしょ！ | gojū renzoku!? tensai desho! | 50 berturut!? Jenius kan! | Kaget dramatis khas Hina |
| **5** | 60–90 | もう誰も止められない！ | mō dare mo tomerarenai! | Nggak ada yang bisa nge-stop! | Histeris kagum |
| **6** | **100** | ひゃく！！もう伝説じゃん！ | hyaku!! mō densetsu jan! | 100!! Udah legenda! | Puncak, meledak |

> **PENTING:** `playStreakSound()` memilih file streak **secara ACAK**. Jadi kalau
> kamu masukkan 6 file tier di atas ke array yang sama, streak 100 bisa dapat file
> tier 1 — kacau. Lihat bagian **5** untuk cara memilih **per-level**.

---

## 4. Taruh file-nya di mana

```
public/voices/hina/
  correct_1.mp3   correct_2.mp3   correct_3.mp3
  wrong_1.mp3     wrong_2.mp3     wrong_3.mp3
  streak_1.mp3    ← tier 1
  streak_2.mp3    ← tier 2
  streak_3.mp3    ← tier 3
  streak_4.mp3    ← tier 4 (50)
  streak_5.mp3    ← tier 5
  streak_6.mp3    ← tier 6 (100)
```

Total: **12 file** (3 + 3 + 6). Format **MP3** (ringan untuk web). Kalau hasil TTS
keluar WAV, konversi ke MP3 (bisa lewat web converter apa pun, atau minta Hermes).

---

## 5. Integrasi ke repo (2 langkah + 1 opsional)

### Langkah A — daftarkan voice

Buka `src/features/audio/voices.js`, tambah entry `hina` di dalam objek `VOICES`:

```js
  // Pack #1 — suara gaya anime ceria (hasil TTS).
  hina: {
    files: {
      correct: ['/voices/hina/correct_1.mp3', '/voices/hina/correct_2.mp3', '/voices/hina/correct_3.mp3'],
      wrong:   ['/voices/hina/wrong_1.mp3',   '/voices/hina/wrong_2.mp3',   '/voices/hina/wrong_3.mp3'],
      streak:  ['/voices/hina/streak_1.mp3',  '/voices/hina/streak_2.mp3',  '/voices/hina/streak_3.mp3',
                '/voices/hina/streak_4.mp3',  '/voices/hina/streak_5.mp3',  '/voices/hina/streak_6.mp3'],
    },
    synth: { correct: 'gong', wrong: 'thud', streak: 'gong-big' },
  },
```

### Langkah B — pasang ke pack 1

Buka `src/features/packs/packs.js`, ubah baris pack `kotodama_burst`:

```js
    voice: 'hina',     // was: 'taiko'
```

### Langkah C (OPSIONAL, disarankan) — streak dipilih per-level

Supaya 6 file tier dipakai **sesuai milestone** (bukan acak). Ada 12 level
milestone (`MILESTONES` di `EffectContext.jsx`) → dipetakan ke 6 tier. Perhatikan
50 dan 100 **sendiri** (karena kalimatnya menyebut angka):

| level | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| streak | 3 | 5 | 10 | 20 | 30 | 40 | **50** | 60 | 70 | 80 | 90 | **100** |
| tier | 1 | 1 | 2 | 2 | 3 | 3 | **4** | 5 | 5 | 5 | 5 | **6** |

Ubah `src/utils/sfx.js` — ganti `playStreakSound`:

```js
// level milestone (1..12) → indeks tier streak (0..5).
// 50 = tier 3 (sendiri), 100 = tier 5 (sendiri).
const STREAK_TIER_BY_LEVEL = [0, 0, 1, 1, 2, 2, 3, 4, 4, 4, 4, 5];

// Voice khusus milestone streak (dipakai EffectContext saat pack aktif).
// Kalau ada 6 file → pilih per-tier. Kalau tidak → acak seperti biasa.
export const playStreakSound = (level = 0) => {
  if (!activeVoiceKey) return synthGong(level);
  const voice = getVoice(activeVoiceKey);
  const streakFiles = voice.files?.streak;
  if (Array.isArray(streakFiles) && streakFiles.length === 6) {
    const lvl = Math.min(12, Math.max(1, Math.floor(level)));   // 1..12
    if (playFile(streakFiles[STREAK_TIER_BY_LEVEL[lvl - 1]])) return;
  }
  if (playFile(pickFile(streakFiles))) return;
  synthGong(level);
};
```

> **Kenapa array, bukan pembagian rata?** `Math.floor((level-1)/2)` menaruh streak
> **60** di tier yang sama dengan **50** → kalimat 「五十連続」 ikut keputar di 60.
> Array di atas menjaga 50 dan 100 tetap sendiri.

Lalu tambahkan tes (TDD) — lihat bagian 6.

---

## 6. Verifikasi

```bash
cd /c/Users/maddo/Documents/japanese-quiz

# 1) tes tetap hijau
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"

# 2) lint bersih
npm run lint

# 3) build sukses
npm run build 2>&1 | grep -E "built in|error"

# 4) jalankan & dengar sendiri
npm run dev     # buka /shop, beli pack 1, main sampai streak 3
```

Ekspektasi: `tests 46+ / pass semua / fail 0`, lint 0 error, build ✓.

---

## 7. Catatan & jebakan

- **Konsistensi speaker:** pakai satu speaker untuk semua file, kalau tidak akan
  terdengar seperti karakter berbeda-beda.
- **Jangan isi `files.streak` kalau belum mau ubah kode:** kalau array streak
  berisi 6 file tapi `sfx.js` belum diubah (Langkah C), file akan dipilih acak.
- **Fallback aman:** kalau file kosong / gagal load → otomatis ke synth gong
  (`playFile` mengembalikan false → `synthGong`). Tidak akan error.
- **Lisensi:** VOICEVOX boleh dipakai komersial **dengan kredit**. TTS generik
  lain cek ToS masing-masing. Suara kamu sendiri bebas.
- **Ukuran file:** target < 60 KB per mp3 (klip pendek, ~1–2 detik). Total 12 file
  ≈ < 700 KB — aman untuk PWA.
