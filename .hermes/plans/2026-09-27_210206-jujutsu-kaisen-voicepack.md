# Plan — Jujutsu Kaisen Voice Pack: selesaikan Gojo → 7 pack dummy → VP per karakter

> Dibuat: 2026-09-27 21:02 · Target repo: `/c/Users/maddo/Documents/japanese-quiz` (Git Bash, Windows)
> Untuk implementer tanpa konteks: baca bagian 0–3 dulu, baru kerjakan task berurutan.

---

## 0. TL;DR (urutan eksekusi)

1. **FASE A** — Merge `feat/gojo-pack7-dummy` → `main` (6 konflik; semuanya sudah dipetakan di bawah, tinggal ikuti).
2. **FASE B** — "Edit tipis gojo": rapikan desc & 2 komentar yang sudah basi (efek/aset sudah jadi).
3. **FASE C** — 7 pack JJK baru (`pack_08`..`pack_14`) sebagai **dummy** (visual `'dummy'` + voice placeholder synth) + teks odds Shop dihitung otomatis.
4. **FASE D** — Dokumen `docs/voice-pack-2-jujutsu.md` + skrip generator TTS `scripts/generate-jjk-voices.py`.
5. **FASE E** — **VP per karakter** (Nobara → Yuji → Megumi → Nanami → Yuta → Toji → Sukuna): 9 klip TTS + registrasi `voices.js` + tes + commit.
6. **FASE F** — Verifikasi akhir (test/lint/build + smoke browser). **Push HANYA kalau user menyuruh.**

Perkiraan: **~13 commit kecil**. Semua perintah dijalankan dari Git Bash:

```bash
cd /c/Users/maddo/Documents/japanese-quiz
```

---

## 1. Goal

Selesaikan Gojo (merge ke `main`) lalu tambahkan **8 karakter Jujutsu Kaisen** ke sistem Theme Pack: 7 pack baru (`pack_08`..`pack_14`) dibuat dummy dulu, lalu diisi voice pack (klip TTS) per karakter — tanpa mengubah mesin audio (`sfx.js` sudah generik).

---

## 2. Current context / assumptions

### 2.1 State repo

- `main` = `1d176ba` (sinkron dengan `origin/main`). **Baseline: 297 tes pass, lint 0 error, build ✓.**
- Branch `feat/gojo-pack7-dummy` = `f1ebdf5` (sudah di-push). Berisi **seluruh** kerjaan pack_07 Gojo (69 commit): tier `SPECIAL`, pack `pack_07`, efek berlapis 蒼→赫→茈→無量空処 (`GojoBurst.jsx`, `GojoDomainCine.jsx`, `GojoSpheres.jsx`, `gojoFx.js`, `gojoGifs.js`, `fxLifecycle.js`), ambience BGM (`src/utils/gojoAmbience.js`), 8 mp3 di `public/voices/gojo/`, 4 gif di `public/effects/`, tombol preview DevPanel. **Belum di-merge ke main.**
- Dry-run merge (read-only, sudah dijalankan): `git merge-tree --write-tree main feat/gojo-pack7-dummy` → hasil merge = **403 tes**, dengan **6 file konflik**:

| File | Sisi main | Sisi branch | Resolusi |
|---|---|---|---|
| `src/features/packs/packs.test.js` | 4 tes `gachaPoolInfo` | 2 tes special+pack_07 | **PERTAHANKAN DUA-DUANYA** (lihat A3) |
| `src/features/profile/Profile.jsx` | i18n "Streak Maks/Max Streak" | teks lama "hari" | **ambil main** (A7) |
| `src/features/progress/ProgressContext.jsx` | import n5exam + `desc_en` | versi lama tanpa i18n | **ambil main** (A6) |
| `src/features/shop/Shop.jsx` | `RARITY_BADGE` | `RARITY_STYLE` + `special` | **ambil main + baris `special`** (A4) |
| `src/index.css` | CSS badge 満 + print N5 | CSS domain 領域展開 | **PERTAHANKAN DUA-DUANYA** (A5) |
| `src/pages/Home.jsx` | `{ weakItems, itemProgress }` | `{ weakItems }` | **ambil main** (A8) |

- Semua file lain auto-merge bersih (branch tidak menghapus file apa pun milik main; file yang "hilang" dari branch = file baru main yang tetap dipertahankan).

### 2.2 Konvensi repo (WAJIB diikuti)

- Pack id: `pack_0X` (Gojo = `pack_07`) → lanjutkan `pack_08`..`pack_14`.
- Voice key: lowercase (`nobara`), file klip: `public/voices/<key>/<kind>_<n>.mp3` (lowercase + underscore, **tanpa spasi**).
- `VOICES` entry: `{ files: { correct, wrong, streak }, synth }`. `files` kosong → otomatis fallback synth (gong/thud) — tidak error.
- Visual placeholder yang sudah ada: `VISUALS.dummy` (registry di `src/features/effects/visuals.js`).
- Tes pakai `node:test` + `node:assert/strict`, file `*.test.js` sebelah modulnya. `npm test` = `node --test`.
- Plan `.md` di `.hermes/plans/` **di-track git** (62 file sudah tracked). `.gitignore` hanya mengabaikan `.hermes/*.png`.
- **Push hanya kalau user menyuruh.** Commit lokal boleh.

### 2.3 Aset & TTS

- Tidak ada file audio nobara/yuji/yuta/toji/megumi/nanami/sukuna di disk (sudah dicek sampai `~/Downloads`). Audio Gojo ada di `public/voices/gojo/` (branch).
- `edge-tts` **terverifikasi jalan** di mesin ini: `ja-JP-NanamiNeural` (F) & `ja-JP-KeitaNeural` (M), parameter `rate`/`pitch` didukung (contoh sukses: `+14%`/`+6Hz`, `-18%`/`-6Hz`). Python dipanggil via `python`.
- Klip TTS = **placeholder aman** (bukan kloning seiyuu — sama prinsip dengan `docs/voice-pack-1-hina.md`). User bisa menimpa dengan klip asli nanti **dengan nama file sama**, tanpa ubah kode.

### 2.4 Mapping rarity (keputusan proyek, sudah final kecuali Nanami)

| Pack | Karakter | Rarity | Voice key |
|---|---|---|---|
| pack_08 | Nobara Kugisaki 釘崎野薔薇 | common | `nobara` |
| pack_09 | Yuji Itadori 虎杖悠仁 | rare | `yuji` |
| pack_10 | Megumi Fushiguro 伏黒恵 | rare | `megumi` |
| pack_11 | Nanami Kento 七海建人 | rare *(default; bisa diubah 1 baris)* | `nanami` |
| pack_12 | Yuta Okkotsu 乙骨憂太 | legendary | `yuta` |
| pack_13 | Toji Fushiguro 伏黒甚爾 | legendary | `toji` |
| pack_14 | Ryomen Sukuna 両面宿儺 | special | `sukuna` |

### 2.5 Angka tes yang diharapkan (gate tiap fase)

| Setelah | tests | fail |
|---|---|---|
| Merge (FASE A) | 403 | 0 |
| FASE C1 (pack dummy) | 404 | 0 |
| FASE C2 (odds otomatis) | 405 | 0 |
| FASE E (7× VP) | 412 | 0 |

---

## 3. Architecture / proposed approach

Merge dulu supaya Gojo live di `main`; lalu tambahkan 7 pack sebagai entri data murni (packs.js + voices.js placeholder) yang otomatis ikut gacha/Inventory/Shop tanpa UI baru; terakhir isi klip TTS per karakter ke `public/voices/<key>/` dan daftarkan di `voices.js` — mesin audio (`sfx.js`, `EffectContext.jsx`) tidak perlu disentuh karena fallback synth & pemilihan klip sudah generik per-voice. Tidak membangun fitur "event banner" terpisah (YAGNI; rate cukup dihitung ulang otomatis di Shop).

---

## 4. Step-by-step tasks

### FASE A — Merge Gojo ke main

#### A0. Commit file plan ini (biar tree bersih sebelum merge)

```bash
cd /c/Users/maddo/Documents/japanese-quiz
git status --short          # harus menunjukkan file plan ini (untracked/??)
git add .hermes/plans/2026-09-27_210206-jujutsu-kaisen-voicepack.md
git commit -m "docs(plan): rencana JJK voicepack — merge gojo + 7 pack dummy→VP"
```

Ekspektasi: `git status --short` → kosong (clean). `git log --oneline -1` → commit docs(plan).

#### A1. Preflight + backup tag

```bash
git branch --show-current      # harus: main
git status --short             # harus kosong
git tag backup-pre-jjk-merge main
git tag -l backup-pre-jjk-merge   # harus mencetak: backup-pre-jjk-merge
```

Kalau branch bukan `main` atau tree tidak bersih → STOP, jangan lanjut.

#### A2. Jalankan merge (akan konflik — itu normal)

```bash
git merge feat/gojo-pack7-dummy
```

Ekspektasi (bagian akhir output):

```
CONFLICT (content): Merge conflict in src/features/packs/packs.test.js
CONFLICT (content): Merge conflict in src/features/profile/Profile.jsx
CONFLICT (content): Merge conflict in src/features/progress/ProgressContext.jsx
CONFLICT (content): Merge conflict in src/features/shop/Shop.jsx
CONFLICT (content): Merge conflict in src/index.css
CONFLICT (content): Merge conflict in src/pages/Home.jsx
Automatic merge failed; fix conflicts and then commit the result.
```

`git status --short` → 6 file `UU`. **JANGAN** pakai `git checkout --theirs/--ours` — ikuti A3–A8 satu per satu.

#### A3. Resolve `src/features/packs/packs.test.js` (pertahankan DUA sisi)

Buka file, cari blok mulai `<<<<<<< main` sampai baris `});` tepat SETELAH `>>>>>>> feat/gojo-pack7-dummy`. **Ganti seluruh span itu** dengan blok berikut (persis):

```js
// ── Info isi gacha (ditampilkan di Shop) ─────────────────────────────────────

test('gachaPoolInfo: daftar semua pack ready + peluang dihitung dari bobot', () => {
  const info = gachaPoolInfo();
  assert.equal(info.length, PACKS.filter(isPackReady).length);

  // semua pack punya chance > 0 dan field tampilan lengkap
  for (const p of info) {
    assert.ok(p.id && p.name && p.icon, `pack ${p.id} kurang field tampilan`);
    assert.ok(PACK_RARITY[p.rarity], `rarity ${p.rarity} tidak dikenal`);
    assert.ok(p.chance > 0, `chance ${p.id} harus > 0`);
    assert.equal(typeof p.owned, 'boolean');
  }

  // total peluang = 100% (dibulatkan)
  const total = info.reduce((s, p) => s + p.chance, 0);
  assert.ok(Math.abs(total - 100) < 0.01, `total chance ${total} harus 100`);
});

test('gachaPoolInfo: rarity legendary peluangnya lebih kecil dari common', () => {
  const info = gachaPoolInfo();
  const legendary = info.find((p) => p.rarity === 'legendary');
  const common = info.find((p) => p.rarity === 'common');
  assert.ok(legendary.chance < common.chance, `legendary(${legendary.chance}) harus < common(${common.chance})`);
});

test('gachaPoolInfo: tandai pack yang sudah dimiliki', () => {
  const info = gachaPoolInfo(['kotodama_burst']);
  assert.equal(info.find((p) => p.id === 'kotodama_burst').owned, true);
  assert.equal(info.find((p) => p.id === 'pack_02').owned, false);
});

test('gachaPoolInfo: input kotor aman (null / bukan array / id hantu)', () => {
  for (const bad of [null, undefined, 'bukan-array', 42, ['tidak_ada']]) {
    const info = gachaPoolInfo(bad);
    assert.equal(info.length, PACKS.filter(isPackReady).length);
    assert.ok(info.every((p) => p.chance > 0));
  }
  // id hantu tidak bikin crash, cuma tidak menandai apa pun
  assert.ok(gachaPoolInfo(['tidak_ada']).every((p) => p.owned === false));
});

// ── Fase 2 (Gojo): tier SPECIAL + pack_07 ────────────────────────────────────

test('PACK_RARITY punya tier special (bobot 2) & bobot total pool = 100', () => {
  assert.equal(PACK_RARITY.special.weight, 2);
  const total = PACKS.reduce((s, p) => s + PACK_RARITY[p.rarity].weight, 0);
  assert.equal(total, 100, 'per-pack weight harus total 100');
});

test('pack_07 = Gojo Satoru, rarity special, visual/voice gojo', () => {
  const p = getPack('pack_07');
  assert.ok(p, 'pack_07 harus ada');
  assert.equal(p.rarity, 'special');
  assert.equal(p.visual, 'gojo');
  assert.equal(p.voice, 'gojo');
  assert.equal(p.name, 'Gojo Satoru');
  assert.equal(p.kanji, '五条悟');
  assert.equal(p.icon, '🟣');
});
```

> Catatan: di file hasil merge, tes `gachaPoolInfo` milik main kehilangan `});` penutupnya (dipakai bersama dengan sisi branch). Blok di atas sudah memperbaikinya — pastikan tidak ada `});` dobel di akhir.

#### A4. Resolve `src/features/shop/Shop.jsx`

Ganti blok konflik (dari `<<<<<<< main` s/d `>>>>>>> feat/gojo-pack7-dummy`) dengan:

```js
const RARITY_BADGE = {
  common:    'bg-kinari-light/90 text-sumi',
  rare:      'bg-ai text-kinari-light',
  legendary: 'bg-[#ffd700] text-sumi',
  special:   'bg-[#9c27b0] text-kinari-light',
};
```

(Ambil gaya main `RARITY_BADGE` + tambah baris `special` ungu. **Jangan** pakai `RARITY_STYLE` — badan file hasil merge memakai `RARITY_BADGE`, `RARITY_STYLE` akan jadi dead code.)

#### A5. Resolve `src/index.css` (pertahankan DUA ekor CSS)

Struktur konflik: kedua sisi sama-sama menambah blok di AKHIR file dan sama-sama "kehilangan" 2 kurung penutup yang dipakai bersama (`  }` lalu `}`).

Langkah:
1. Hapus 3 baris marker (`<<<<<<< main`, `=======`, `>>>>>>> feat/gojo-pack7-dummy`).
2. Setelah baris terakhir sisi main (`    border-color: #1a1a1a !important;`) — yang menutup `.print-cert` di dalam `@media print` — **tambahkan 2 baris**: `  }` dan `}`.
3. Tambahkan 1 baris kosong, lalu blok sisi branch (komentar `/* ── Kartu kuis saat domain 領域展開 hidup ...` sampai `    filter: drop-shadow(0 0 10px rgba(56, 189, 248, 0.8));`) tetap seperti adanya.
4. Baris `  }` + `}` yang tersisa di paling bawah file menutup `@media (prefers-reduced-motion)` milik branch. **Total akhir file harus diakhiri `}` dan tidak ada marker.**

Verifikasi kurung seimbang:

```bash
node -e "const s=require('fs').readFileSync('src/index.css','utf8');const o=(s.match(/{/g)||[]).length,c=(s.match(/}/g)||[]).length;console.log('open',o,'close',c);if(o!==c)process.exit(1)"
```

Ekspektasi: `open N close N` (N sama, exit 0).

#### A6. Resolve `src/features/progress/ProgressContext.jsx` (2 titik)

Titik 1 (dekat baris ~5) — ganti blok konflik dengan **sisi main saja**:

```js
import { WRITE_GATE_KEY } from '../writing/writeGate';
import { emptyExamRecord, mergeExamRecord, n5BadgesFor } from '../n5exam/certificate';
```

Titik 2 (di `ACHIEVEMENT_META`, sekitar baris ~121) — ganti blok konflik dengan **sisi main saja** (6 baris ber-`desc_en`):

```js
  undefeated: { label: '不', title: 'Undefeated', desc: 'Streak belajar 15 hari', desc_en: '15-day study streak' },
  godlike: { label: '神', title: 'Godlike', desc: 'Streak belajar 50 hari', desc_en: '50-day study streak' },
  persistent: { label: '極', title: 'Persistent', desc: 'Streak belajar 7 hari', desc_en: '7-day study streak' },
  eternal_soul: { label: '魂', title: 'Eternal Soul', desc: 'Streak belajar 30 hari', desc_en: '30-day study streak' },
  consistent: { label: '恒', title: 'Consistent', desc: 'Streak belajar 100 hari', desc_en: '100-day study streak' },
  void: { label: '無', title: 'Void', desc: '100 Correct in one sitting', desc_en: '100 Correct in one sitting' },
```

#### A7. Resolve `src/features/profile/Profile.jsx` — ambil sisi main

Ganti blok konflik dengan:

```jsx
                  <div className="text-xs font-black uppercase text-sumi/60 mb-1">{language === 'id' ? 'Streak Maks' : 'Max Streak'}</div>
                  <div className="text-4xl font-serif font-black text-ai">{realProfileData.stats.maxStreak} {language === 'id' ? 'hari' : 'days'} 🔥</div>
```

#### A8. Resolve `src/pages/Home.jsx` — ambil sisi main

Ganti blok konflik dengan:

```jsx
  const { weakItems, itemProgress } = useItemProgress();
```

(`itemProgress` dibutuhkan untuk gate N5 `countMasteredKanji(itemProgress)`.)

#### A9. Verifikasi merge + commit

```bash
grep -rn "^<<<<<<<\|^>>>>>>>" src/ || echo "BERSIH: tidak ada marker"
npm test 2>&1 | tail -8
npm run lint 2>&1 | tail -3
npm run build 2>&1 | tail -4
```

Ekspektasi:
- `BERSIH: tidak ada marker`
- `ℹ tests 403 / ℹ pass 403 / ℹ fail 0`
- lint: **0 error** (warning boleh ada)
- build: `✓ built in ...`

Kalau ada tes gagal: jalankan `npm test 2>&1 | grep -B2 -A20 "not ok"` untuk lihat detail, perbaiki penyebabnya (bukan menghapus tes), lalu ulangi. Baru commit:

```bash
git add -A
git commit -m "Merge branch 'feat/gojo-pack7-dummy' — pack_07 Gojo Satoru (SPECIAL): efek 蒼/赫/茈/無量空処 + suara + ambience"
git log --oneline -3
```

Ekspektasi: commit merge muncul di paling atas. Branch `feat/gojo-pack7-dummy` **jangan dihapus** (backup).

---

### FASE B — "Edit tipis gojo" (rapikan yang basi)

#### B1. Update komentar + desc pack_07 di `src/features/packs/packs.js`

Ganti:

```js
  {
    // Pack #7 — Gojo Satoru. Sementara DUMMY dulu: pakai visual 'gojo'
    // (placeholder ungu) + voice 'gojo' (synth). Efek mewah 蒼→赫→茈→無量空処
    // & aset suara menyusul.
    id: 'pack_07', name: 'Gojo Satoru', kanji: '五条悟', icon: '🟣',
    desc: 'Domain & Infinity: 蒼→赫→茈 (efek menyusul)',
    desc_en: 'Domain & Infinity: Ao→Aka→Murasaki (FX coming)',
    price: 2500, rarity: 'special', visual: 'gojo', voice: 'gojo',
  },
```

dengan:

```js
  {
    // Pack #7 — Gojo Satoru (SPECIAL 特別). Efek berlapis 蒼→赫→茈→無量空処
    // + aset suara user (public/voices/gojo/) + ambience BGM — sudah live.
    id: 'pack_07', name: 'Gojo Satoru', kanji: '五条悟', icon: '🟣',
    desc: 'Domain & Infinity: 蒼→赫→茈→無量空処',
    desc_en: 'Domain & Infinity: Ao→Aka→Murasaki→Domain',
    price: 2500, rarity: 'special', visual: 'gojo', voice: 'gojo',
  },
```

#### B2. Perbaiki komentar basi di `src/utils/sfx.js`

Cari (sekitar baris ~327):

```js
// Teknik diputar DETERMINISTIK (bukan pickFile acak): 蒼 → ao.mp3, 赫 → aka.mp3.
// 茈 (murasaki) belum punya klip — GIF murasaki yang tampil, jadi senyap.
```

Ganti baris kedua dengan:

```js
// 茈 → Murasaki.mp3 (klip asli; GIF 茈 ikut tampil bareng).
```

#### B3. Verifikasi + commit

```bash
npm test 2>&1 | tail -4
git add src/features/packs/packs.js src/utils/sfx.js
git commit -m "chore(gojo): rapikan desc & komentar pack_07 — efek & aset sudah jadi, bukan 'menyusul'"
```

Ekspektasi: `fail 0` (jumlah tetap 403 — tidak ada tes baru di fase ini).

---

### FASE C — 7 pack dummy + odds otomatis

#### C1. TDD: pack dummy (tes dulu → merah → implementasi → hijau → commit)

**C1a. Tulis tes dulu** — edit `src/features/packs/packs.test.js`:

1. Ganti `assert.equal(PACKS.length, 7);` → `assert.equal(PACKS.length, 14);`
2. Ganti `assert.equal(PACKS.filter(isPackReady).length, 7);` → `... 14);`
3. Ganti `assert.equal(ids.size, 7);` → `assert.equal(ids.size, 14);`
4. Ganti baris `assert.equal(rollPackId(() => 0.999), 'pack_07');          // ticket ~max → pack terakhir` → `assert.equal(rollPackId(() => 0.999), 'pack_14');          // ticket ~max → pack terakhir`
5. Ganti tes `'PACK_RARITY punya tier special (bobot 2) & bobot total pool = 100'` dengan:

```js
test('PACK_RARITY: special paling langka; agregat special ~2% dari pool', () => {
  assert.equal(PACK_RARITY.special.weight, 2);
  const total = PACKS.reduce((s, p) => s + PACK_RARITY[p.rarity].weight, 0);
  const specialWeight = PACKS.filter((p) => p.rarity === 'special')
    .reduce((s) => s + PACK_RARITY.special.weight, 0);
  const pct = (specialWeight / total) * 100;
  assert.ok(pct > 1.5 && pct < 2.5, `agregat special ${pct.toFixed(2)}% harus ~2%`);
  assert.ok(PACK_RARITY.special.weight < PACK_RARITY.legendary.weight);
});
```

6. Tambahkan tes baru di akhir file:

```js
// ── Seri Jujutsu Kaisen: 7 pack (dummy → VP) ─────────────────────────────────

test('7 pack JJK: id, nama, rarity & voice key sesuai peta', () => {
  const want = {
    pack_08: ['Nobara Kugisaki', 'common', 'nobara'],
    pack_09: ['Yuji Itadori', 'rare', 'yuji'],
    pack_10: ['Megumi Fushiguro', 'rare', 'megumi'],
    pack_11: ['Nanami Kento', 'rare', 'nanami'],
    pack_12: ['Yuta Okkotsu', 'legendary', 'yuta'],
    pack_13: ['Toji Fushiguro', 'legendary', 'toji'],
    pack_14: ['Ryomen Sukuna', 'special', 'sukuna'],
  };
  for (const [id, [name, rarity, voice]] of Object.entries(want)) {
    const p = getPack(id);
    assert.ok(p, `${id} harus ada`);
    assert.equal(p.name, name);
    assert.equal(p.rarity, rarity);
    assert.equal(p.voice, voice);
    assert.ok(p.visual && p.kanji && p.icon && p.desc && p.desc_en, `${id} field kurang`);
  }
});
```

**C1b. Jalankan → harus MERAH:**

```bash
npm test 2>&1 | tail -8
```

Ekspektasi: `fail` > 0 (mis. `PACKS.length 7 !== 14`, `pack_08 harus ada`).

**C1c. Implementasi** — di `src/features/packs/packs.js`, sisipkan 7 entri berikut **tepat setelah entri `pack_07` dan sebelum `];` penutup `PACKS`**:

```js
  // ── Seri Jujutsu Kaisen (pack_08..pack_14) ──────────────────────────────────
  // Fase 1 "dummy": visual masih placeholder 'dummy', voice menunjuk ke
  // VOICES.<key> yang masih kosong (jatuh ke synth gong/thud). Klip mp3 diisi
  // bertahap (task VP). Rarity: common Nobara · rare Yuji/Megumi/Nanami ·
  // legendary Yuta/Toji · special Sukuna.
  {
    id: 'pack_08', name: 'Nobara Kugisaki', kanji: '釘崎野薔薇', icon: '🔨',
    desc: 'Voice pack Nobara (visual menyusul)', desc_en: 'Nobara voice pack (visual coming)',
    price: 2500, rarity: 'common', visual: 'dummy', voice: 'nobara',
  },
  {
    id: 'pack_09', name: 'Yuji Itadori', kanji: '虎杖悠仁', icon: '👊',
    desc: 'Voice pack Yuji (visual menyusul)', desc_en: 'Yuji voice pack (visual coming)',
    price: 2500, rarity: 'rare', visual: 'dummy', voice: 'yuji',
  },
  {
    id: 'pack_10', name: 'Megumi Fushiguro', kanji: '伏黒恵', icon: '🐺',
    desc: 'Voice pack Megumi (visual menyusul)', desc_en: 'Megumi voice pack (visual coming)',
    price: 2500, rarity: 'rare', visual: 'dummy', voice: 'megumi',
  },
  {
    id: 'pack_11', name: 'Nanami Kento', kanji: '七海建人', icon: '👔',
    desc: 'Voice pack Nanami (visual menyusul)', desc_en: 'Nanami voice pack (visual coming)',
    price: 2500, rarity: 'rare', visual: 'dummy', voice: 'nanami',
  },
  {
    id: 'pack_12', name: 'Yuta Okkotsu', kanji: '乙骨憂太', icon: '💍',
    desc: 'Voice pack Yuta (visual menyusul)', desc_en: 'Yuta voice pack (visual coming)',
    price: 2500, rarity: 'legendary', visual: 'dummy', voice: 'yuta',
  },
  {
    id: 'pack_13', name: 'Toji Fushiguro', kanji: '伏黒甚爾', icon: '🗡️',
    desc: 'Voice pack Toji (visual menyusul)', desc_en: 'Toji voice pack (visual coming)',
    price: 2500, rarity: 'legendary', visual: 'dummy', voice: 'toji',
  },
  {
    id: 'pack_14', name: 'Ryomen Sukuna', kanji: '両面宿儺', icon: '👹',
    desc: 'Voice pack Sukuna (visual menyusul)', desc_en: 'Sukuna voice pack (visual coming)',
    price: 2500, rarity: 'special', visual: 'dummy', voice: 'sukuna',
  },
```

**C1d. TDD voices placeholder** — di `src/features/audio/voices.js`, sisipkan **tepat sebelum baris `};` penutup objek `VOICES`** (setelah entri `gojo`):

```js
  // ── Seri Jujutsu Kaisen (pack_08..pack_14) — placeholder DUMMY ──────────────
  // files kosong → otomatis fallback synth (gong/thud), perilakunya sama
  // seperti voice 'dummy'. Klip mp3 diisi bertahap oleh task "VP <karakter>".
  nobara: { files: { correct: [], wrong: [], streak: [] }, synth: { correct: 'gong', wrong: 'thud', streak: 'gong-big' } },
  yuji:   { files: { correct: [], wrong: [], streak: [] }, synth: { correct: 'gong', wrong: 'thud', streak: 'gong-big' } },
  megumi: { files: { correct: [], wrong: [], streak: [] }, synth: { correct: 'gong', wrong: 'thud', streak: 'gong-big' } },
  nanami: { files: { correct: [], wrong: [], streak: [] }, synth: { correct: 'gong', wrong: 'thud', streak: 'gong-big' } },
  yuta:   { files: { correct: [], wrong: [], streak: [] }, synth: { correct: 'gong', wrong: 'thud', streak: 'gong-big' } },
  toji:   { files: { correct: [], wrong: [], streak: [] }, synth: { correct: 'gong', wrong: 'thud', streak: 'gong-big' } },
  sukuna: { files: { correct: [], wrong: [], streak: [] }, synth: { correct: 'gong', wrong: 'thud', streak: 'gong-big' } },
```

Lalu tambahkan tes baru di akhir `src/features/audio/voices.test.js`:

```js
test('voice JJK placeholder: 7 key terdaftar & reachable (bukan fallback taiko)', () => {
  const keys = ['nobara', 'yuji', 'megumi', 'nanami', 'yuta', 'toji', 'sukuna'];
  for (const k of keys) {
    assert.ok(VOICES[k], `VOICES.${k} harus ada`);
    assert.equal(getVoice(k), VOICES[k], `getVoice('${k}') harus voice-nya sendiri`);
  }
});
```

**C1e. Jalankan → harus HIJAU:**

```bash
npm test 2>&1 | tail -6
```

Ekspektasi: `ℹ tests 404 / ℹ pass 404 / ℹ fail 0`.

**C1f. Commit:**

```bash
git add src/features/packs/packs.js src/features/packs/packs.test.js src/features/audio/voices.js src/features/audio/voices.test.js
git commit -m "feat(jjk): 7 pack dummy (Nobara..Sukuna) + placeholder VOICES"
```

#### C2. TDD: odds Shop dihitung dari pool (tidak hardcode lagi)

**C2a. Tes dulu** — tambahkan di akhir `src/features/packs/packs.test.js` (dan tambahkan `rarityOdds` ke daftar import di baris 3):

```js
test('rarityOdds: agregat per rarity, total ~100, special paling kecil', () => {
  const odds = rarityOdds();
  const total = odds.reduce((s, o) => s + o.chance, 0);
  assert.ok(Math.abs(total - 100) < 0.2, `total ${total} harus ~100`);
  const special = odds.find((o) => o.rarity === 'special');
  assert.ok(special && special.chance > 1.5 && special.chance < 2.5, `special ${special?.chance}% harus ~2%`);
  for (const o of odds) assert.ok(o.label && o.chance > 0);
});
```

Import baru: `import { PACKS, PACK_RARITY, getPack, isPackReady, rollPackId, gachaPoolInfo, rarityOdds } from './packs.js';`

Jalankan → MERAH (`SyntaxError: ... does not provide an export named 'rarityOdds'` — normal, seluruh file tes gagal load saat import belum ada):

```bash
npm test 2>&1 | grep -m1 "rarityOdds"
```

**C2b. Implementasi** — di `src/features/packs/packs.js`, tambahkan setelah fungsi `gachaPoolInfo`:

```js
// Peluang AGREGAT per rarity (%), dihitung dari pool yang siap — dipakai teks
// odds di Shop supaya tidak pernah basi saat pack baru ditambah.
export const RARITY_ORDER = ['common', 'rare', 'legendary', 'special'];
export const rarityOdds = () => {
  const pool = PACKS.filter(isPackReady);
  const total = pool.reduce((s, p) => s + (PACK_RARITY[p.rarity]?.weight ?? 1), 0);
  if (total <= 0) return [];
  return RARITY_ORDER
    .filter((r) => pool.some((p) => p.rarity === r))
    .map((r) => {
      const weight = pool.filter((p) => p.rarity === r)
        .reduce((s, p) => s + (PACK_RARITY[p.rarity]?.weight ?? 1), 0);
      return { rarity: r, label: PACK_RARITY[r]?.label || r.toUpperCase(), chance: Math.round((weight / total) * 1000) / 10 };
    });
};
```

**C2c. Wiring Shop** — di `src/features/shop/Shop.jsx`:

1. Baris import pack: `import { gachaPoolInfo, PACK_RARITY, rarityOdds } from "../packs/packs";`
2. Setelah `const pool = gachaPoolInfo(ownedPacks);` tambahkan:

```jsx
  // Teks odds dihitung dari pool (bukan hardcode) — aman saat pack bertambah.
  const oddsText = rarityOdds().map((o) => `${o.label.toLowerCase()} ${o.chance}%`).join(' · ');
```

3. Ganti paragraf odds yang hardcode:

```jsx
              <p className="text-[11px] font-bold mt-4 text-kinari-light/80">
                {language === 'id'
                  ? `Duplikat di-refund 50 🪙. Peluang: ${oddsText}.`
                  : `Duplicates refund 50 🪙. Odds: ${oddsText}.`}
              </p>
```

**C2d. Verifikasi → HIJAU:**

```bash
npm test 2>&1 | tail -6
npm run lint 2>&1 | tail -3
```

Ekspektasi: `tests 405 / pass 405 / fail 0`; lint 0 error.

**C2e. Commit:**

```bash
git add src/features/packs/packs.js src/features/packs/packs.test.js src/features/shop/Shop.jsx
git commit -m "feat(shop): peluang rarity dihitung dari pool (rarityOdds) — tidak hardcode lagi"
```

---

### FASE D — Dokumen + skrip generator TTS

#### D1. Buat `docs/voice-pack-2-jujutsu.md`

Isi lengkap:

````markdown
# Voice Pack 2 — Seri Jujutsu Kaisen (TTS generik)

Panduan klip suara untuk pack `pack_08`..`pack_14` (Nobara, Yuji, Megumi,
Nanami, Yuta, Toji, Sukuna). Sama seperti Hina (`docs/voice-pack-1-hina.md`):
**bukan kloning seiyuu** — pakai TTS Jepang generik yang di-tune per karakter.

> Semua klip di-generate oleh `scripts/generate-jjk-voices.py`.
> Ganti klip kapan saja dengan file asli **dengan nama file yang sama** —
> tidak perlu ubah kode.

## 1. Casting (edge-tts)

| Pack | Karakter | Voice | Rate | Pitch | Kesan |
|---|---|---|---|---|---|
| pack_08 | Nobara Kugisaki | ja-JP-NanamiNeural | +14% | +6Hz | energik, sok pede |
| pack_09 | Yuji Itadori | ja-JP-KeitaNeural | +10% | +5Hz | ceria, cepet |
| pack_10 | Megumi Fushiguro | ja-JP-KeitaNeural | −6% | −2Hz | kalem, datar |
| pack_11 | Nanami Kento | ja-JP-KeitaNeural | −8% | −4Hz | formal, datar |
| pack_12 | Yuta Okkotsu | ja-JP-KeitaNeural | +2% | +1Hz | lembut, sopan |
| pack_13 | Toji Fushiguro | ja-JP-KeitaNeural | −12% | −10Hz | berat, ketus |
| pack_14 | Ryomen Sukuna | ja-JP-KeitaNeural | −18% | −6Hz | mengancam, lambat |

## 2. Kalimat

Daftar kalimat (9 per karakter: 3 correct / 3 wrong / 3 streak) ada di `LINES`
dalam `scripts/generate-jjk-voices.py` — file itu **sumber tunggal** (DRY).

## 3. Generate / regenerate

```bash
python scripts/generate-jjk-voices.py            # semua karakter
python scripts/generate-jjk-voices.py nobara     # satu karakter saja
```

Output: `public/voices/<key>/correct_1..3.mp3`, `wrong_1..3.mp3`,
`streak_1..3.mp3` (9 file per karakter, target < 60 KB per klip).

## 4. Integrasi

1. Jalankan generator (lihat §3).
2. Pastikan `VOICES.<key>.files` di `src/features/audio/voices.js` menunjuk ke
   9 file itu (sudah diisi oleh task VP; kalau kosong → fallback synth).
3. `npm test` → tes `voice <key>: 3 correct + 3 wrong + 3 streak` hijau.

## 5. Catatan

- Streak: 3 klip **dirotasi** antar milestone oleh `pickStreakClip` (cursor) —
  bukan per-tier seperti Hina.
- Kalau mau klip asli (potongan anime), taruh dengan nama file sama; ukuran
  kecil (< 60 KB) & durasi < 3 dtk supaya tidak menabrak efek visual.
- Lisensi: TTS generik aman; klip anime asli = risiko hak cipta kalau dipublikasikan.
````

Commit:

```bash
git add docs/voice-pack-2-jujutsu.md
git commit -m "docs(jjk): voice-pack-2 — casting TTS + cara regenerate"
```

#### D2. Buat `scripts/generate-jjk-voices.py`

Isi lengkap:

```python
#!/usr/bin/env python3
# ─────────────────────────────────────────────────────────────────────────────
# Generator klip voice pack Jujutsu Kaisen (edge-tts) → public/voices/<key>/.
# Pakai:  python scripts/generate-jjk-voices.py            # semua karakter
#         python scripts/generate-jjk-voices.py nobara     # satu karakter
# Output: 9 file per karakter (correct_1..3, wrong_1..3, streak_1..3).
# Tuning & alasan casting: docs/voice-pack-2-jujutsu.md
# ─────────────────────────────────────────────────────────────────────────────
import asyncio
import sys
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "voices"

# key: (voice, rate, pitch)
CAST = {
    "nobara": ("ja-JP-NanamiNeural", "+14%", "+6Hz"),
    "yuji":   ("ja-JP-KeitaNeural",  "+10%", "+5Hz"),
    "megumi": ("ja-JP-KeitaNeural",  "-6%",  "-2Hz"),
    "nanami": ("ja-JP-KeitaNeural",  "-8%",  "-4Hz"),
    "yuta":   ("ja-JP-KeitaNeural",  "+2%",  "+1Hz"),
    "toji":   ("ja-JP-KeitaNeural",  "-12%", "-10Hz"),
    "sukuna": ("ja-JP-KeitaNeural",  "-18%", "-6Hz"),
}

LINES = {
    "nobara": {
        "correct": ["よし！", "当然でしょ！", "決まりね！"],
        "wrong":   ["はぁ？", "うそでしょ…", "次は負けない！"],
        "streak":  ["この調子！", "ノってきた！", "止まらないわよ！"],
    },
    "yuji": {
        "correct": ["よしっ！", "やった！", "いける！"],
        "wrong":   ["うわっ！", "ドンマイ！", "次、次！"],
        "streak":  ["いい感じ！", "まだまだ！", "限界まで！"],
    },
    "megumi": {
        "correct": ["…よし", "そうだね", "上出来だ"],
        "wrong":   ["…しくじった", "次で決める", "落ち着け"],
        "streak":  ["悪くない", "調子いいね", "このまま行く"],
    },
    "nanami": {
        "correct": ["よし", "上々だ", "悪くない"],
        "wrong":   ["…残念だ", "仕切り直そう", "気を抜くな"],
        "streak":  ["良いペースだ", "堅実に", "この調子で"],
    },
    "yuta": {
        "correct": ["はい！", "やりました", "合ってますね"],
        "wrong":   ["あ…すみません", "大丈夫です", "次、頑張ります"],
        "streak":  ["いい流れですね", "ついてきてます", "このまま行きましょう"],
    },
    "toji": {
        "correct": ["ふん", "悪くねえ", "当然だ"],
        "wrong":   ["チッ", "次だ", "まだだ"],
        "streak":  ["やるじゃねえか", "まだ足りねえ", "このまま行くぞ"],
    },
    "sukuna": {
        "correct": ["愚問だ", "当然よ", "退屈しないな"],
        "wrong":   ["くだらん", "次は無いぞ", "弱すぎる"],
        "streak":  ["面白い", "もっとだ", "我を楽しませろ"],
    },
}

async def generate(key: str) -> None:
    voice, rate, pitch = CAST[key]
    for kind, lines in LINES[key].items():
        folder = OUT_DIR / key
        folder.mkdir(parents=True, exist_ok=True)
        for i, text in enumerate(lines, start=1):
            target = folder / f"{kind}_{i}.mp3"
            await edge_tts.Communicate(text, voice, rate=rate, pitch=pitch).save(str(target))
            print(f"  {target.relative_to(ROOT)}  {target.stat().st_size} B  「{text}」")

def main() -> None:
    keys = sys.argv[1:] or list(CAST)
    unknown = [k for k in keys if k not in CAST]
    if unknown:
        raise SystemExit(f"Karakter tak dikenal: {unknown}. Pilihan: {list(CAST)}")
    for key in keys:
        print(f"[{key}]")
        asyncio.run(generate(key))

if __name__ == "__main__":
    main()
```

Verifikasi skrip dengan 1 karakter (sekaligus jadi aset VP Nobara):

```bash
python scripts/generate-jjk-voices.py nobara
ls -la public/voices/nobara/
```

Ekspektasi: 9 baris output berisi `public/voices/nobara/... <size> B 「...」`; `ls` → 9 file mp3. (Butuh internet; kalau gagal, ulangi — edge-tts kadang timeout.)

Commit (mp3 Nobara **jangan** ikut di commit ini — di-commit di task E1):

```bash
git add scripts/generate-jjk-voices.py
git commit -m "chore(jjk): skrip generator klip TTS (edge-tts) untuk 7 karakter"
```

---

### FASE E — VP per karakter (7× task, pola sama)

Pola tiap karakter (contoh: **Nobara**, `pack_08`, key `nobara`):

**E1a. Tulis tes dulu** — tambahkan di akhir `src/features/audio/voices.test.js`:

```js
test('voice nobara: 3 correct + 3 wrong + 3 streak, path unik & valid', () => {
  const v = VOICES.nobara;
  assert.ok(v, 'VOICES.nobara harus ada');
  assert.equal(v.files.correct.length, 3);
  assert.equal(v.files.wrong.length, 3);
  assert.equal(v.files.streak.length, 3);
  const all = [...v.files.correct, ...v.files.wrong, ...v.files.streak];
  assert.equal(new Set(all).size, 9, 'tidak boleh ada path duplikat');
  for (const p of all) assert.match(p, /^\/voices\/nobara\/[a-z0-9_]+\.mp3$/);
});
```

Jalankan → MERAH:

```bash
npm test 2>&1 | grep -A3 "voice nobara"
```

Ekspektasi: `fail` pada tes baru (0 !== 3).

**E1b. Isi `src/features/audio/voices.js`** — ganti baris placeholder:

```js
  nobara: { files: { correct: [], wrong: [], streak: [] }, synth: { correct: 'gong', wrong: 'thud', streak: 'gong-big' } },
```

dengan:

```js
  // VP Nobara Kugisaki (pack_08) — TTS generik, setelan di docs/voice-pack-2-jujutsu.md.
  nobara: {
    files: {
      correct: ['/voices/nobara/correct_1.mp3', '/voices/nobara/correct_2.mp3', '/voices/nobara/correct_3.mp3'],
      wrong:   ['/voices/nobara/wrong_1.mp3',   '/voices/nobara/wrong_2.mp3',   '/voices/nobara/wrong_3.mp3'],
      streak:  ['/voices/nobara/streak_1.mp3',  '/voices/nobara/streak_2.mp3',  '/voices/nobara/streak_3.mp3'],
    },
    synth: { correct: 'gong', wrong: 'thud', streak: 'gong-big' },
  },
```

Jalankan → HIJAU:

```bash
npm test 2>&1 | tail -4
```

**E1c. Pastikan klip ada** (Nobara sudah di-generate di D2; kalau belum / mau regenerate):

```bash
python scripts/generate-jjk-voices.py nobara
ls public/voices/nobara/    # harus 9 file: correct_1..3, wrong_1..3, streak_1..3
```

**E1d. Commit (kode + aset):**

```bash
git add src/features/audio/voices.js src/features/audio/voices.test.js public/voices/nobara/
git commit -m "feat(jjk): voice pack Nobara — 9 klip TTS + registrasi"
```

---

Ulangi pola **E1a–E1d** untuk 6 karakter berikut. Perbedaan hanya pada: key, nama pack, dan isi blok. Ganti `<key>`/`<Nama>`/`<pack>` sesuai tabel:

| Task | key | Nama (pack) | `voices.js` — baris placeholder yang diganti |
|---|---|---|---|
| E2 | `yuji` | Yuji Itadori (pack_09) | `  yuji:   { files: { correct: [], wrong: [], streak: [] }, ... }` |
| E3 | `megumi` | Megumi Fushiguro (pack_10) | `  megumi: { ... }` |
| E4 | `nanami` | Nanami Kento (pack_11) | `  nanami: { ... }` |
| E5 | `yuta` | Yuta Okkotsu (pack_12) | `  yuta:   { ... }` |
| E6 | `toji` | Toji Fushiguro (pack_13) | `  toji:   { ... }` |
| E7 | `sukuna` | Ryomen Sukuna (pack_14) | `  sukuna: { ... }` |

Template blok `voices.js` untuk tiap key (contoh `<key>` = `yuji`):

```js
  // VP <Nama> (pack_<NN>) — TTS generik, setelan di docs/voice-pack-2-jujutsu.md.
  <key>: {
    files: {
      correct: ['/voices/<key>/correct_1.mp3', '/voices/<key>/correct_2.mp3', '/voices/<key>/correct_3.mp3'],
      wrong:   ['/voices/<key>/wrong_1.mp3',   '/voices/<key>/wrong_2.mp3',   '/voices/<key>/wrong_3.mp3'],
      streak:  ['/voices/<key>/streak_1.mp3',  '/voices/<key>/streak_2.mp3',  '/voices/<key>/streak_3.mp3'],
    },
    synth: { correct: 'gong', wrong: 'thud', streak: 'gong-big' },
  },
```

Template blok tes (contoh `<key>` = `yuji`):

```js
test('voice <key>: 3 correct + 3 wrong + 3 streak, path unik & valid', () => {
  const v = VOICES.<key>;
  assert.ok(v, 'VOICES.<key> harus ada');
  assert.equal(v.files.correct.length, 3);
  assert.equal(v.files.wrong.length, 3);
  assert.equal(v.files.streak.length, 3);
  const all = [...v.files.correct, ...v.files.wrong, ...v.files.streak];
  assert.equal(new Set(all).size, 9, 'tidak boleh ada path duplikat');
  for (const p of all) assert.match(p, /^\/voices\/<key>\/[a-z0-9_]+\.mp3$/);
});
```

Perintah per karakter (contoh yuji):

```bash
python scripts/generate-jjk-voices.py yuji
npm test 2>&1 | tail -4          # setelah wiring: fail 0, tests bertambah 1
git add src/features/audio/voices.js src/features/audio/voices.test.js public/voices/yuji/
git commit -m "feat(jjk): voice pack Yuji — 9 klip TTS + registrasi"
```

Angka tes setelah tiap VP: E1 → 406, E2 → 407, E3 → 408, E4 → 409, E5 → 410, E6 → 411, E7 → 412. Yang wajib: **fail 0** di setiap langkah.

---

### FASE F — Verifikasi akhir

#### F1. Gate lengkap

```bash
npm test 2>&1 | tail -8      # ℹ tests 412 / pass 412 / fail 0
npm run lint 2>&1 | tail -3  # 0 error
npm run build 2>&1 | tail -4 # ✓ built in ...
git status --short           # harus bersih
```

#### F2. Smoke test browser (wajib sebelum bilang selesai)

```bash
npm run dev
```

Buka `http://localhost:5173` lalu cek daftar ini (pakai DevPanel di `/settings` untuk unlock):

- [ ] `/settings` → DevPanel → "Buka Semua Pack" → "Buka & Pakai Efek" (equip Gojo).
- [ ] `/practice` → jawab BENAR: bola 蒼/赫 plasma + klip suara Gojo; jawab SALAH: GIF "Gojo kalah" + klip.
- [ ] DevPanel → "Preview Efek Gojo (tanpa quiz)" → 50 → cinematic 領域展開 + BGM; tombol Cast Domain hidup.
- [ ] `/inventory` → equip "Nobara Kugisaki" → `/practice` → jawab benar → dengar klip 「よし！」 (bukan gong synth).
- [ ] Spot-check 2 karakter lain (mis. Sukuna, Toji) bunyi saat benar/salah.
- [ ] `/shop` → "Isi Gashapon" → 14 pack, badge SPECIAL ungu untuk Gojo & Sukuna, teks odds: `common 39.5% · rare 39.5% · legendary 18.9% · special 2.1%`.
- [ ] Console browser: 0 error.

#### F3. Push — HANYA kalau user menyuruh

```bash
git push origin main   # tunggu perintah user dulu!
```

---

## 5. Tests / validation (ringkas)

- TDD di setiap perubahan kode: tulis/ubah tes → jalankan (MERAH) → implementasi → jalankan (HIJAU) → commit.
- Gate numerik: 403 (merge) → 404 (C1) → 405 (C2) → 406..412 (E1..E7); **fail 0 di semua titik**, lint 0 error, build ✓.
- Aset diverifikasi dengan `ls` (9 file per karakter) — tes node tidak mengecek file fisik (konsisten dengan pola Hina/Gojo).
- Smoke browser (F2) = verifikasi end-to-end suara + efek + Shop.

## 6. Risks, tradeoffs & open questions

**Risks**
- **Resolusi merge salah** → mitigasi: ikuti A3–A8 persis, cek marker, 403 tes hijau, smoke F2. File auto-merge (App.jsx, Quiz.jsx, Inventory.jsx, dll.) tidak diperiksa manual — kalau ada teks i18n yang hilang, perbaiki saat smoke.
- **edge-tts butuh internet** & bisa timeout → ulangi perintah; skrip deterministik untuk input sama.
- **Dilusi rate gacha**: dengan 14 pack, special per-pack turun ke ~1,05% (agregat tetap ~2,1%). Diterima untuk sekarang; "event banner" = opsi masa depan (BELUM dibangun — YAGNI).
- **Hak cipta**: klip TTS generik aman; kalau nanti diganti potongan anime asli, risiko naik saat dipublikasikan (sudah dicatat di doc).
- **Repo size**: +63 mp3 ≈ ~1 MB total. mp3 tidak di-precache PWA (globPatterns workbox memang tanpa mp3, sama seperti Hina/Gojo) — dimuat on-demand + di-`primeVoice`.

**Open questions (default sudah dipilih — tinggal veto kalau salah)**
1. Nanami = **rare**. Kalau mau legendary → ubah 1 baris di C1c.
2. Id pack = `pack_08..pack_14` (bukan `jj_nobara`) — konsisten dengan `pack_07`. Ganti sebelum commit C1 kalau mau skema `jj_*`.
3. Visual 7 karakter masih `'dummy'` — efek prosedural per karakter (ala Gojo) = fase berikutnya, tidak masuk plan ini.
4. Push `main` ke origin: menunggu perintah user.

## 7. Definition of Done

- [ ] `main` berisi merge Gojo (merge commit ada), 403 tes hijau, lint 0 error, build ✓.
- [ ] 14 pack terdaftar; 7 pack JJK dummy + VOICES placeholder; teks odds Shop dihitung otomatis.
- [ ] `docs/voice-pack-2-jujutsu.md` + `scripts/generate-jjk-voices.py` ada.
- [ ] 7 VP terisi: 63 mp3 di `public/voices/<key>/`, 7 tes `voice <key>` hijau (total 412).
- [ ] Smoke F2 lulus; working tree bersih; **belum push** (menunggu perintah user).
