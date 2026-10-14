# SPEC — Gerbang Era untuk Voice Pack Anime (多元-only)

**Versi:** 1.0
**Status:** Rencana (belum dieksekusi)
**Tanggal:** 2026-10-14
**Pemilik:** pemilik proyek
**Induk:** `docs/tema/anime.md` §11 (arsitektur 3 lapis) · `docs/tema/anime-mekanik.md` §A16 (karakter/voice)
**Modul terkait:** `src/features/packs/`, `src/features/audio/voiceKey.js`, `src/features/effects/EffectContext.jsx`, `src/App.jsx` (VoiceSync)

---

## Ringkasan Satu Layar

Aturan pemilik: **voice pack anime hanya ada dan hanya bisa dipakai di tema 多元 (Anime Multiverse); di era lain tidak bisa dipakai.** Saat ini aturan itu **belum ditegakkan** — voice, efek, dan equip pack anime bebas dipakai di era mana pun. Spec ini menutup 3 titik bocor dengan **gerbang yang dihitung hidup dari `era`** (tanpa state baru), sehingga pack otomatis mati di luar 多元 dan **hidup lagi sendiri** begitu masuk 多元.

Cakupan pack anime = **JJK saja** (`pack_07`–`pack_14`). Hina (`kotodama_burst`), Sumi Taiko (`pack_06`), dan Dummy **tidak** termasuk.

---

## 1. Aturan (yang harus berlaku)

1. **Pack anime = terikat era `anime`.** Voice + efeknya **hanya** aktif saat `era === 'anime'`.
2. **Di luar 多元:** voice & efek pack anime **mati** → jatuh ke **default** (synth gong/thud, tanpa visual pack). Pack **tetap tersimpan** di `progress.activePack` (tidak di-unset).
3. **Kembali ke 多元:** pack anime **hidup lagi otomatis** (tanpa klik ulang), karena gerbang dihitung ulang tiap render dari `era`.
4. **Pack tetap bisa di-equip** dari mana saja (tidak dikunci) — yang dikunci hanyalah **efeknya**, bukan tombolnya.
5. **Di Shop/Inventory/gacha, pack anime tetap tampil** dan diberi label **「多元」/ "Khusus 多元"**.

---

## 2. Kondisi sekarang — 3 titik bocor

| # | Titik | Berkas:baris | Masalah |
|---|-------|--------------|---------|
| 1 | **Voice** | `src/features/audio/voiceKey.js:30` | `return packVoice \|\| null` **tanpa cek era**. Hanya jalur 推し yang digerbang `era === 'anime'`; jalur **pack** tidak. |
| 2 | **Efek/visual** | `src/features/effects/EffectContext.jsx:373-376` | `activeVisual = getPack(progress.activePack)?.visual` **tanpa cek era** → efek Gojo/JJK muncul di Heian/Edo/Shōwa. |
| 3 | **Equip & tampil** | `src/features/inventory/Inventory.jsx:28`, `PackCard.jsx`, `src/features/progress/ProgressContext.jsx:627` (`togglePack`) | Pack apa pun bisa di-ON di era mana pun; tak ada penanda "khusus 多元". |

Catatan: **lapis 2 (franchise/warna)** sudah aman — `EraContext.jsx:44` hanya melukis `[data-franchise]` saat `era === 'anime'`. Yang bocor = **lapis 3 (pack: voice + efek)**.

---

## 3. Desain

### 3.1 Data — tandai pack anime di registry

Tambah satu field `era: 'anime'` pada **`pack_07`–`pack_14`** di `src/features/packs/packs.js`. Pack lain tidak diberi field (default = bebas era).

```js
{
  id: 'pack_07', name: 'Gojo Satoru', kanji: '五条悟', icon: 'infinity',
  desc: '…', desc_en: '…',
  price: 2500, rarity: 'special', visual: 'gojo', voice: 'gojo',
  era: 'anime',           // ← BARU: terikat era 多元
}
```

### 3.2 Helper murni (dites `node --test`)

Di `packs.js`:

```js
// Pack terikat era? (mis. pack anime → 'anime'). Pack tanpa `era` = bebas.
export const isEraBoundPack = (pack) => Boolean(pack && pack.era);

// Boleh dipakai di era ini? Pack tanpa `era` selalu boleh.
export const packAllowedInEra = (pack, era) => !pack?.era || pack.era === era;
```

### 3.3 Gerbang VOICE (`voiceKey.js`)

Tambah parameter `packEra` (era milik pack) dan gerbang **sebelum** jatuh ke `packVoice`:

```js
export const resolveVoiceKey = ({ era, oshiId, packVoice, packEra, voiceOfCharacter } = {}) => {
  // 推し hanya menang di era 多元 (tidak berubah).
  if (era === 'anime' && oshiId && typeof voiceOfCharacter === 'function') {
    const cv = voiceOfCharacter(oshiId);
    if (cv) return cv;
  }
  // Pack terikat era (mis. anime) HANYA bunyi di era-nya → di luar itu null
  // (sfx.js memakai synth dasar sebagai default).
  if (packEra && packEra !== era) return null;
  return packVoice || null;
};
```

Pemanggil (`App.jsx` `VoiceSync`) menambah `packEra: pack?.era`. Karena `preloadVoice`/`primeVoice` memakai `key` hasil fungsi ini, preload ikut ter-gerbang otomatis.

### 3.4 Gerbang EFEK (`EffectContext.jsx`)

Pakai era aktif (EffectProvider sudah berada **di dalam** `EraProvider` di `App.jsx`):

```js
import { useEra } from '../theme/EraContext';
import { getPack, packAllowedInEra } from '../packs/packs';
// …
const { era } = useEra();
const activePack = getPack(progress.activePack);
const activeVisual = packAllowedInEra(activePack, era) ? (activePack?.visual || null) : null;
const active = Boolean(getVisual(activeVisual));
```

Karena `activeVisual` di-`null`-kan, **semua** cabang `if (activeVisual === 'gojo'|'yuji'|…)` di `triggerEffect`/`cast*` mati sendiri di luar 多元 — tanpa menyentuh masing-masing cabang. (Tambah `era` ke dep-array efek terkait bila perlu.)

### 3.5 UI — label 「多元」

- `src/features/packs/PackCard.jsx`: tampilkan badge kecil **「多元」** (title/aria-label dari `language`) saat `pack.era === 'anime'`. Bila `era !== 'anime'` dan pack ini sedang **aktif**, tampilkan keterangan kecil: *"Aktif lagi saat masuk 多元"*.
- `gachaPoolInfo()` di `packs.js` ikut mengembalikan field `era` supaya Shop/gacha bisa memberi label yang sama.
- **Tombol equip tidak dikunci** (sesuai keputusan: efek mati, pack tersimpan).

---

## 4. Rencana Implementasi (T0–T6) — TDD

> Konvensi: tulis test (RED) → implement (GREEN) → commit. Commit: `feat(anime): …` / `test(...)`.

| # | Task | Berkas | Test |
|---|------|--------|------|
| T0 | Tandai `era:'anime'` pada `pack_07`–`pack_14` | `packs.js` | `packs.test.js` |
| T1 | Helper `isEraBoundPack` + `packAllowedInEra` | `packs.js` | `packs.test.js` (matriks era) |
| T2 | Gerbang `packEra` di `resolveVoiceKey` | `voiceKey.js` | `voiceKey.test.js` |
| T3 | Kirim `packEra` dari `VoiceSync` | `App.jsx` | guard test (baca sumber) |
| T4 | Gerbang `activeVisual` via `useEra` | `EffectContext.jsx` | guard test (baca sumber) |
| T5 | Badge 「多元」 di kartu pack (+ `era` di `gachaPoolInfo`) | `PackCard.jsx`, `packs.js` | `packs.test.js` |
| T6 | Guard regresi: gate tidak boleh hilang | `packEra.test.js` (baru) | `node --test` |

**Uji wajib setelah selesai:** `npm test`, `npm run lint` (0 error), `npm run build`.

---

## 5. Kriteria Penerimaan

| # | Kriteria | Cara uji |
|---|----------|----------|
| 1 | `pack_07`–`pack_14` punya `era === 'anime'`; `pack_01`–`pack_06` tidak | unit test |
| 2 | `packAllowedInEra(animePack, 'heian') === false`; `(…, 'anime') === true`; pack non-anime selalu true | unit test |
| 3 | `resolveVoiceKey({era:'heian', packVoice:'gojo', packEra:'anime'}) === null` | unit test |
| 4 | `resolveVoiceKey({era:'anime', packVoice:'gojo', packEra:'anime'}) === 'gojo'` | unit test |
| 5 | 推し tetap menang di 多元; tidak bocor ke era lain | unit test (sudah ada) |
| 6 | `EffectContext` memakai `useEra` + `packAllowedInEra` | guard test (baca sumber) |
| 7 | `VoiceSync` mengirim `packEra` | guard test (baca sumber) |
| 8 | Kartu pack anime menampilkan label 「多元」 | guard test / render |
| 9 | `npm test` hijau, `lint` 0 error, `build` sukses | CLI |

---

## 6. Risiko

- **Regresi 推し:** jangan sampai gerbang `packEra` menimpa jalur 推し di 多元. Urutan: 推し **dulu**, lalu gerbang pack. Dikunci test 5.
- **Cycle import:** `EffectContext` → `EraContext`. Aman (EraContext tidak mengimpor effects), tapi verifikasi saat build.
- **`useEra` di luar provider:** `EffectProvider` sudah di dalam `EraProvider`; kalau dipindah, `useEra` melempar. Dikunci oleh urutan provider di `App.jsx`.
- **Lupa dep-array:** menambah `era` sebagai sumber gerbang → pastikan efek yang bergantung era punya `era` di dep-array agar tidak stale.

---

## 7. Yang TIDAK termasuk

- **Tidak** menyentuh pack Hina/Sumi Taiko/Dummy (bukan pack anime).
- **Tidak** mengunci tombol equip (keputusan: efek mati, pack tersimpan).
- **Tidak** menyembunyikan pack dari Shop/gacha (keputusan: tampil + label).
- **Tidak** mengubah lapis 2 (franchise/warna) — sudah benar.
- **Tidak** mengubah data `characters.js`/`franchises.js`.

---

## Ringkasan

Tambah `era:'anime'` di `pack_07`–`pack_14`, lalu pasang **dua gerbang murni** — `voiceKey` (`packEra`) dan `EffectContext` (`packAllowedInEra` + `useEra`) — plus badge 「多元」 di kartu pack. Gerbang dihitung hidup dari `era`, jadi pack anime mati di era lain dan **hidup lagi otomatis** di 多元 tanpa state baru. Semua dikunci `node --test` + guard test sumber.
