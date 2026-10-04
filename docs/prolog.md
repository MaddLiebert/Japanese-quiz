# SPEC — PROLOG: 「絵巻、ひらく」 *Emaki, hiraku*

**Versi:** v0.1 · **Dibuat:** 2026-10-04
**Status:** SPEC — belum diimplementasikan
**Peran:** perkenalan Nacht & Saku, dijalankan **sebelum** cinematic Heian
**Terkait:** `docs/story.md` §6 (Babak 1), `docs/tema/heian.md` §10 (cinematic Heian)
**Target implementasi:** terminal baru (task P0–P9 di §10)

---

## 1. Prinsip

1. **Heian tidak dibongkar.** Prolog = **lapisan baru di atas** cinematic Heian yang sudah ada. Cinematic `heian-history` tetap utuh, hanya dijalankan **setelah** prolog.
2. **Hook = pilih karakter + kasih nama.** Prolog ini ADALAH hook. Pendek, personal, langsung.
3. **Cerita = lapisan tipis.** Bisa di-skip; setelah skip, pemain langsung masuk Heian seperti biasa.
4. **Data-driven.** Ikut pola `src/features/cinematic/heian/data/scenes.js` → tambah scene = edit array, logic tak disentuh.
5. **Tanpa audio wajib.** Tanpa aset suara pun prolog tetap jalan penuh.

---

## 2. Tujuan prolog

| # | Yang dicapai | Kenapa |
|---|---|---|
| 1 | Memperkenalkan **pemain = anak bangsawan Heian males** | Identifikasi pemain |
| 2 | Memunculkan **絵巻** & **dua roh** (Nacht & Saku) | Dunia cerita |
| 3 | **PILIH Nacht / Saku** | Hook utama |
| 4 | **Isi nama** → *「おかえり、[nama]」* | Personal, bikin balik |
| 5 | Pelajaran pertama **あいうえお** | Transisi mulus ke belajar |
| 6 | Membuka **halaman 1 (Heian)** | Serahkan ke cinematic Heian yang sudah ada |

---

## 3. Storyboard — 6 adegan

| # | Adegan | Visual | Teks (JP / ID) | Interaksi |
|---|---|---|---|---|
| P1 | 授業 — pelajaran | Kelas Heian, pagi berkabut. Anak ngantuk. | 先生：`また居眠りか。` / "Ngantuk lagi?" | tap untuk lanjut |
| P2 | 抜け出し — kabur | Anak keluar diam-diam → kamar tua berdebu | *(tanpa teks)* · SFX: pintu geser | tap |
| P3 | 絵巻 — ketemu gulungan | 絵巻 terbaring di balik tumpukan barang | `古い絵巻だ。` / "絵巻 tua." | tap → BUKA |
| P4 | 対面 — dua cahaya | Dua cahaya keluar dari 絵巻 kosong | `…開けたのは、君か。` (Nacht) · `わあ、久しぶり！` (Saku) | tap |
| P5 | 選択 — pilih & nama | Nacht & Saku mengambang; dua kartu pilihan | `俺たちは、君に学びを与えに来た。` `でも——君が選ぶんだ。` | PILIH + ISI NAMA |
| P6 | 第一歩 — あいうえお | 絵巻 mulai menulis sendiri; muncul `あ い う え お` | `この絵巻は、時代を旅する。` | tap → Heian |

---

## 4. Struktur data (usulan) — ikut pola `scenes.js`

File baru: `src/features/cinematic/prolog/data/prologScenes.js`

```js
// PROLOG_SCENES — bentuk scene SAMA dengan HEIAN_SCENES (lihat scenes.js),
// supaya bisa pakai komponen SceneText / SceneLayer yang sama.
// Tambahan field baru: `step` untuk adegan interaktif (p5).
export const PROLOG_SCENES = [
  {
    id: 'class', duration: 6, visual: 'heianClass', mood: 'calm',
    lines: [
      { id: 'teacher', jp: 'また居眠りか。', translation: 'Ngantuk lagi?', kind: 'sentence', at: 0.6, translationAt: 2.6 },
      { id: 'boy',     jp: '…（なんで勉強しなきゃ…）', translation: '…(Buat apa sih belajar…)', kind: 'sentence', at: 3.4, translationAt: 4.6 },
    ],
    audio: { cues: [{ sfx: 'brushSweep', at: 0.3 }] },
  },
  {
    id: 'escape', duration: 5, visual: 'dustyRoom', mood: 'calm',
    lines: [],
    audio: { cues: [{ sfx: 'doorSlide', at: 0.4 }, { sfx: 'wind', at: 0.2 }] },
  },
  {
    id: 'emaki', duration: 6, visual: 'emakiFound', mood: 'calm',
    lines: [
      { id: 'find', jp: '古い絵巻だ。', translation: '絵巻 tua.', kind: 'sentence', at: 0.8, translationAt: 2.6 },
    ],
    audio: { cues: [{ sfx: 'paperRustle', at: 0.5 }] },
  },
  {
    id: 'meet', duration: 8, visual: 'twoLights', mood: 'court',
    lines: [
      { id: 'nacht', jp: '…開けたのは、君か。', translation: '…Yang membuka, kamu ya.', kind: 'sentence', at: 0.8, translationAt: 3.0, voice: '/voices/prolog/01_nacht.mp3' },
      { id: 'saku',  jp: 'わあ、久しぶりだね！', translation: 'Wah, lama nggak ketemu!', kind: 'sentence', at: 4.2, translationAt: 6.0, voice: '/voices/prolog/02_saku.mp3' },
    ],
    audio: { cues: [{ sfx: 'shimmer', at: 0.5 }, { sfx: 'shimmer', at: 4.0 }] },
  },
  {
    id: 'choose', duration: 0, visual: 'choose', mood: 'court',
    step: 'choose', // hentikan timeline, tampilkan kartu pilihan + input nama
    lines: [
      { id: 'offer', jp: '俺たちは、君に学びを与えに来た。', translation: 'Kami datang untuk memberimu ilmu.', kind: 'sentence', at: 0.4, translationAt: 2.4 },
      { id: 'choose', jp: 'でも——君が選ぶんだ。', translation: 'Tapi — kamu yang memilih.', kind: 'sentence', at: 3.6, translationAt: 5.0 },
    ],
    audio: { cues: [{ sfx: 'shimmer', at: 0.5 }] },
  },
  {
    id: 'first', duration: 7, visual: 'kanaRise', mood: 'kana',
    lines: [
      { id: 'welcome', jp: 'おかえり、{name}。', translation: 'Selamat datang kembali, {name}.', kind: 'welcome', at: 0.6, translationAt: 2.6 },
      { id: 'rule', jp: 'この絵巻は、時代を旅する。', translation: '絵巻 ini mengembara menembus zaman.', kind: 'sentence', at: 3.4, translationAt: 5.2 },
    ],
    kana: { glyphs: ['あ', 'い', 'う', 'え', 'お'], at: 1.2, gap: 0.5 },
    audio: { cues: [{ sfx: 'inkDrip', at: 1.0 }] },
  },
];
```

- `{name}` = placeholder → diganti nama pemain saat render (fungsi murni `fillName(line, name)`).
- `step: 'choose'` = satu-satunya adegan interaktif; timeline berhenti, tunggu pilihan user.

---

## 5. Komponen & file baru (usulan)

```
src/features/cinematic/prolog/
├── data/
│   ├── prologScenes.js        # PROLOG_SCENES (di atas)
│   └── prologScenes.test.js   # test murni (durasi, placeholder, step)
├── components/
│   ├── ChooseStep.jsx         # kartu pilih Nacht/Saku + input nama
│   └── NameInput.jsx          # input nama (validasi: 1–12 char, kosong → default)
├── scenes/
│   ├── SceneHeianClass.jsx
│   ├── SceneDustyRoom.jsx
│   ├── SceneEmakiFound.jsx
│   ├── SceneTwoLights.jsx
│   └── SceneKanaRise.jsx
├── PrologCinematic.jsx        # orkestrator (pola sama HeianCinematic.jsx)
└── prologAudio.js             # reuse heianHistoryAudio (mood sama) — jangan bikin baru
```

**Reuse, jangan duplikat:**
- `SceneText`, `SceneLayer`, `WashiBackdrop`, `useIsPortrait` → pakai yang sudah ada.
- Audio → reuse `heianHistoryAudio.js` (mood `calm`/`court`/`kana` sudah ada). Tidak perlu sistem audio baru.
- `playClipFile`, `preloadClips` dari `src/utils/sfx.js` → untuk voice narasi.

---

## 6. Registrasi (ikut pola yang sudah ada)

### 6.1 `cinematics.js`
Tambah entri prolog ke `CINEMATICS`:
```js
export const CINEMATICS = {
  prolog: { id: 'prolog', era: 'heian', kind: 'story', title: '絵巻、ひらく', route: '/prolog' },
  heian:  { id: 'heian',  era: 'heian', kind: 'history', title: '平安', route: '/heian-history' },
};
```

### 6.2 Urutan auto-play
`nextCinematic(eraId, seen)` harus memutar **prolog dulu, baru heian-history**.
Usul: tambah field `order`; `nextCinematic` memilih `order` terkecil yang belum dilihat.
```js
prolog: { ..., order: 0 }
heian:  { ..., order: 1 }
```

### 6.3 Route
`src/App.jsx` (dekat `/heian-history`):
```jsx
<Route path="/prolog" element={<PrologCinematic ... />} />
```

### 6.4 State pemain (BARU — kecil)
Simpan hasil pilihan prolog ke progress (ikut pola `cinematicsSeen`):
```js
{
  guide: 'nacht' | 'saku',   // roh pilihan (null = belum pilih)
  playerName: 'string',      // nama pemain (default '旅人' kalau kosong)
}
```
- `guide` dipakai di seluruh app (tutorial, dialog, gacha copy).
- `playerName` dipakai untuk *「おかえり、[nama]」* & sapaan.
- Ikut "Reset Semua Data".

> Catatan: `storyMode` & `storySeen` (mode pemain) diatur di `docs/story.md` §9 — bukan bagian prolog.

---

## 7. Aturan teks & bahasa

| Aturan | Nilai |
|---|---|
| Teks Jepang | elemen utama (font brush) |
| Terjemahan ID | muncul menyusul (font sans) — sama seperti cinematic Heian |
| Kanji di prolog | boleh (kalimat cerita, bukan label UI) — konsisten dengan catatan di `scenes.js` |
| `{name}` | placeholder, diisi saat render |
| Nama kosong | fallback ke **旅人** (tabibito) supaya kalimat tetap utuh |
| Panjang nama | batasi **1–12 karakter** |

---

## 8. Nada tiap adegan

| Adegan | Rasa | Detail |
|---|---|---|
| P1 授業 | lucu | anak ngantuk, guru kesal — ringan, relatable |
| P2 抜け出し | sepi | tanpa teks, cuma SFX — jeda napas |
| P3 絵巻 | penasaran | momen "ada sesuatu" |
| P4 対面 | ajaib | dua cahaya; Nacht dingin, Saku hangat (kontras langsung) |
| P5 選択 | momen kunci | hening, serius — pilihan pemain |
| P6 第一歩 | hangat | `おかえり` + kana muncul → langsung ke Heian |

**Kontras Nacht vs Saku harus terasa di P4** (ini pertama kali pemain "mengenal" mereka):
- Nacht: kalimat pendek, jeda, tenang.
- Saku: seru, tanda seru, hangat.

---

## 9. A11y & aset

**Perilaku:**
- `role="dialog" aria-modal`, fokus ke tombol skip, ESC = skip (sama seperti Heian).
- `prefers-reduced-motion`: tanpa gerak, timeline dipercepat, teks tetap terbaca.
- Skip prolog → default `guide = null`, `playerName = '旅人'`; bisa diisi nanti di Pengaturan.
- Input nama: `maxLength=12`, trim spasi, tidak boleh kosong → tombol "Lanjut" disabled (atau auto-fallback 旅人).

**Aset:**

| Aset | Wajib? | Catatan |
|---|---|---|
| 5 latar scene (SVG/CSS) | ya | pola sama `scenes/*.jsx` Heian |
| Voice Nacht (P4) | tidak | `/voices/prolog/01_nacht.mp3` — kosong = no-op |
| Voice Saku (P4) | tidak | `/voices/prolog/02_saku.mp3` |
| SFX: doorSlide, paperRustle | tidak | reuse `playCinematicSfx` bila ada; kalau tidak, no-op |
| Portrait Nacht & Saku (desain FINAL) | disarankan | untuk kartu pilihan P5 — pakai gambar final user |

> Semua aset opsional kecuali latar. **Prolog jalan penuh tanpa audio.**

---

## 10. Rencana implementasi (bertahap, TDD)

| # | Task | Hasil |
|---|---|---|
| P0 | Baseline: `npm test` hijau | acuan |
| P1 | `prologScenes.js` + test murni (`totalDuration`, `fillName`, validasi step) | data siap |
| P2 | `PrologCinematic.jsx` — orkestrator pakai `SceneText`/`SceneLayer` yang ada | alur P1–P4 |
| P3 | `ChooseStep.jsx` + `NameInput.jsx` — pilih Nacht/Saku + nama | hook jalan |
| P4 | Simpan `guide` + `playerName` ke progress (+ reset) | state |
| P5 | `cinematics.js` — daftar prolog, `order`, urutan auto-play | registrasi |
| P6 | Route `/prolog` di `App.jsx` | navigasi |
| P7 | Scene P6 (kana rise) → serahkan ke `heian-history` | sambungan |
| P8 | A11y (skip/ESC/reduced-motion) + uji 4 kombinasi terang/gelap × era | rilis |
| P9 | Verifikasi: `npm test` (+ test baru), lint 0, build exit 0 | selesai |

---

## 11. Kriteria penerimaan

| # | Kriteria | Cara uji |
|---|---|---|
| 1 | Pemain baru (Lv 1, belum lihat apa pun) → prolog diputar dulu, lalu cinematic Heian | Alur baru |
| 2 | Prolog bisa di-skip → langsung masuk Heian tanpa error | Tombol skip / ESC |
| 3 | Pilih Nacht/Saku tersimpan; tutorial memakai pemandu itu | Cek progress `guide` |
| 4 | Isi nama → muncul `おかえり、[nama]` | Visual |
| 5 | Nama kosong → fallback 旅人 (tak ada kalimat rusak) | Isi kosong |
| 6 | Cinematic Heian yang lama tetap jalan apa adanya (tak diubah) | Bandingkan sebelum/sesudah |
| 7 | `prefers-reduced-motion` → tanpa gerak, teks tetap terbaca | DevTools emulate |
| 8 | Tanpa aset audio → prolog tetap penuh | Hapus `/voices/prolog/*` |
| 9 | `npm test` tetap lulus (+ test baru), lint 0, build exit 0 | Terminal |

---

## 12. Yang TIDAK termasuk prolog ini

- Bukan pengganti cinematic Heian — ia berjalan **sebelum**-nya.
- Bukan tutorial belajar (itu `docs/saku-tutorial.md`, tetap terpisah).
- Tidak mengubah `docs/tema/heian.md` (tema/mekanik Heian) sama sekali.
- Tidak butuh backend/akun.
