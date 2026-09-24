# Plan — Gojo Satoru: Progresi SUARA 蒼 → 赫 → 茈 → 無量空処

Sumber: `~/Documents/obsidian-mind/brain/Next update.md` →
`### 9/23/2026 (Rencana — Gojo Satoru, Pack #7) 🟣`, bagian **§B (Suara)** + **§C5/§C7**.

---

## 1. Goal

Bikin **suara Gojo Satoru sinkron dengan efek visualnya**: jawaban benar #1 = nada **蒼 (Ao)**, #2 = **赫 (Aka)**, #3 & tiap milestone = **茈 (Murasaki)**, milestone 50/100 = **無量空処** — pakai synth Web Audio murni (tanpa aset mp3), mengikuti mapping teknik yang **sudah ada** di `gojoFx.js`.

---

## 2. Current context / assumptions

Repo: `C:\Users\maddo\Documents\japanese-quiz` (Vite + React 19, Tailwind v4). Branch aktif `feat/gojo-pack7-dummy`, **ahead 69 commit dari `origin/main`**, **JANGAN push** (aturan user, hanya commit).

**Yang SUDAH selesai dari rencana 9/23** (jangan dikerjakan ulang):
- §C0 tier SPECIAL 2% (`PACK_RARITY = common25/rare15/legendary9/special2`) — commit `67a00e9`
- §C1 pack `pack_07` "Gojo Satoru" 🟣 — commit `67a00e9`
- §A/§A2/§C2/§C3/§C4 efek visual berlapis (`gojoFx.js`, `GojoBurst.jsx`, cabang `visual==='gojo'`, `VISUALS.gojo`, `VOICES.gojo`) — commit `d40b6ab`, `55f1cd2`
- §C7 sound priming — **otomatis** sudah jalan lewat `App.jsx` (`preloadVoice`/`primeVoice`), tidak perlu diubah.

**Yang BELUM (inti plan ini):** §B — belum ada suara khusus Gojo sama sekali. Sekarang setiap jawaban benar Gojo cuma bunyi `synthChime()` generik (karena `VOICES.gojo.files` kosong → fallback), dan milestone bunyi gong generik. **Tidak ada progresi ao→aka→murasaki.**

**Asumsi penting (sudah dicek di kode):**
- Mapping streak→teknik **sudah ada & teruji**: `gojoTechniqueFor(kind, streak)` di `src/features/effects/gojoFx.js` → `'ao' | 'aka' | 'murasaki' | 'domain' | 'domain_zenith' | null`. **Pakai ulang ini (DRY)** — jangan tulis mapping kedua.
- `VOICES.gojo.synth` (`{correct:'gong',...}`) saat ini **dekoratif/tidak dipakai** untuk playback (`playCorrectSound` fallback ke `synthChime()` hardcoded). Plan ini **tidak** mengubah itu; nada Gojo ditaruh di `sfx.js` (konsisten dengan `streakGongParams`/`fanfareParams`/`reelTickParams` yang juga pure di sana).
- Test runner = `node --test` (auto-discover `*.test.js`). Baseline sekarang **118 pass / 0 fail**.
- User: "kita kerjain efek dulu, baru nanti kita sesuaikan sound yang cocok buat efeknya" → nada di plan ini **first pass yang bisa di-tune**, bukan final.

**Prerequisite (Phase 0):** ada perubahan **belum di-commit** dari sesi lalu (fitur bola ao/aka/murasaki): `src/features/effects/GojoBurst.jsx`, `src/features/effects/gojoFx.js`, `src/features/effects/gojoFx.test.js` (118 pass, sudah diverifikasi di browser). Commit dulu biar baseline bersih.

---

## 3. Architecture / proposed approach

Tambah **satu tabel nada murni** (`GOJO_TONES`) + helper `gojoSoundParams(technique)` + pemutar `playGojoSound(technique)` di `src/utils/sfx.js` (pola sama seperti `fanfareParams`/`streakGongParams`). Lalu di `src/features/effects/EffectContext.jsx`, saat `activeVisual === 'gojo'`, tentukan teknik lewat `gojoTechniqueFor(type, streakRef.current)` (fungsi yang sudah ada) dan putar `playGojoSound(teknik)` — **menggantikan** jalur chime/gong generik untuk pack Gojo saja. Suara & visual jadi satu sumber kebenaran (mapping teknik sama), sesuai §B.

---

## 4. Step-by-step tasks

> Semua perintah dijalankan dari `C:\Users\maddo\Documents\japanese-quiz` (bash). **Commit tiap fase, JANGAN push.**

### Phase 0 — Commit dulu fitur bola yang belum masuk (bersihkan baseline)

**0.1** Cek status:
```bash
git status --short
```
Harapan:
```
 M src/features/effects/GojoBurst.jsx
 M src/features/effects/gojoFx.js
 M src/features/effects/gojoFx.test.js
```

**0.2** Konfirmasi hijau:
```bash
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```
Harapan:
```
ℹ tests 118
ℹ pass 118
ℹ fail 0
```

**0.3** Commit (JANGAN push):
```bash
git add src/features/effects/GojoBurst.jsx src/features/effects/gojoFx.js src/features/effects/gojoFx.test.js
git commit -m "feat(gojo): bola teknik ao/aka/murasaki (kanan/kiri/tabrakan di tengah)"
```

---

### Phase 1 — TDD: nada teknik di `src/utils/sfx.js`

**1.1 (RED)** Tulis test baru `src/utils/sfx.gojo.test.js`:
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { gojoSoundParams, playGojoSound } from './sfx.js';

test('gojoSoundParams: tiap teknik punya nada & durasi', () => {
  for (const t of ['ao', 'aka', 'murasaki', 'domain', 'domain_zenith']) {
    const p = gojoSoundParams(t);
    assert.ok(p, `${t} tanpa params`);
    assert.ok(p.type, `${t} tanpa tipe osc`);
    assert.ok(Number.isFinite(p.from) && p.from > 0, `${t} from tak valid`);
    assert.ok(Number.isFinite(p.to) && p.to > 0, `${t} to tak valid`);
    assert.ok(Number.isFinite(p.dur) && p.dur > 0, `${t} dur tak valid`);
    assert.ok(Number.isFinite(p.gain) && p.gain > 0 && p.gain <= 0.6, `${t} gain tak sehat`);
  }
});

test('ao = hisap (nada naik), aka = ledak (nada turun)', () => {
  assert.ok(gojoSoundParams('ao').to > gojoSoundParams('ao').from, 'ao harus naik (hisap)');
  assert.ok(gojoSoundParams('aka').to < gojoSoundParams('aka').from, 'aka harus turun (ledak)');
});

test('murasaki beda dari ao & aka (momen penyatuan)', () => {
  const m = gojoSoundParams('murasaki');
  assert.notDeepEqual(m, gojoSoundParams('ao'));
  assert.notDeepEqual(m, gojoSoundParams('aka'));
});

test('teknik tak dikenal / null → null (fallback thud)', () => {
  assert.equal(gojoSoundParams(null), null);
  assert.equal(gojoSoundParams(undefined), null);
  assert.equal(gojoSoundParams('zzz'), null);
});

test('playGojoSound aman di luar browser (node) → 0, tanpa throw', () => {
  assert.equal(playGojoSound('ao'), 0);
  assert.equal(playGojoSound(null), 0);
});
```

**1.2 (RED — verifikasi gagal)** Jalankan:
```bash
node --test src/utils/sfx.gojo.test.js 2>&1 | grep -E "^ℹ (tests|pass|fail)|SyntaxError|does not provide"
```
Harapan: **GAGAL** — `gojoSoundParams` belum ada, muncul `SyntaxError: The requested module './sfx.js' does not provide an export named 'gojoSoundParams'` (atau `ℹ fail 1`). Ini bukti test-nya benar-benar menguji.

**1.3 (GREEN)** Tambahkan blok ini di **akhir** `src/utils/sfx.js` (setelah `playFanfare`, agar `synthThud`/`initAudioContext` sudah terdefinisi):
```js
// ── Suara teknik Gojo (蒼→赫→茈→Domain) ─────────────────────────────────────
// Satu nada "glide" per teknik, meniru gerak efek visualnya:
//   ao            = partikel HISAP ke dalam   → nada NAIK   (220→660 Hz)
//   aka           = partikel LEDAK ke luar    → nada TURUN  (660→220 Hz)
//   murasaki      = dua aliran MENYATU        → naik, timbre kasar (sawtooth)
//   domain/zenith = gelombang domain          → bass naik, makin panjang & terang
// Murni & deterministik → dites di node (sfx.gojo.test.js). Bisa di-tune nanti.
export const GOJO_TONES = {
  ao:            { type: 'sine',     from: 220, to: 660,    dur: 0.55, gain: 0.35 },
  aka:           { type: 'triangle', from: 660, to: 220,    dur: 0.50, gain: 0.40 },
  murasaki:      { type: 'sawtooth', from: 392, to: 523.25, dur: 0.75, gain: 0.40 },
  domain:        { type: 'sine',     from: 110, to: 220,    dur: 1.20, gain: 0.45 },
  domain_zenith: { type: 'sine',     from: 110, to: 330,    dur: 1.60, gain: 0.50 },
};

export const gojoSoundParams = (technique) => GOJO_TONES[technique] || null;

// Pemutar (butuh AudioContext; tidak dites di node). teknik null (jawaban salah) → thud.
export const playGojoSound = (technique) => {
  const p = gojoSoundParams(technique);
  if (!p) { synthThud(); return 0; }
  const ctx = initAudioContext();
  if (!ctx) return 0;
  if (ctx.state === 'suspended') ctx.resume();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = p.type;
  osc.frequency.setValueAtTime(p.from, t);
  osc.frequency.exponentialRampToValueAtTime(p.to, t + p.dur * 0.8);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(p.gain, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0008, t + p.dur);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + p.dur + 0.05);
  return 0;
};
```

**1.4 (GREEN — verifikasi lulus)**:
```bash
node --test src/utils/sfx.gojo.test.js 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```
Harapan:
```
ℹ tests 5
ℹ pass 5
ℹ fail 0
```

**1.5** Commit:
```bash
git add src/utils/sfx.js src/utils/sfx.gojo.test.js
git commit -m "feat(gojo): nada teknik ao/aka/murasaki/domain (synth) + tes"
```

---

### Phase 2 — Wiring ke `src/features/effects/EffectContext.jsx`

**2.1** Tambah import. Ubah **baris 4** dari:
```js
import { playCorrectSound, playWrongSound, playStreakSound, answerFeedbackKind, hinaGifHoldMs } from '../../utils/sfx';
```
menjadi:
```js
import { playCorrectSound, playWrongSound, playStreakSound, playGojoSound, answerFeedbackKind, hinaGifHoldMs } from '../../utils/sfx';
```
Dan tambah satu import baru setelah **baris 8** (`import { hinaSparkles, ... } from './hinaFx';`):
```js
import { gojoTechniqueFor } from './gojoFx';
```

**2.2** Ganti blok penentuan suara. Cari **tepat** teks ini (sekitar baris 180–183):
```js
    const feedback = answerFeedbackKind(type, onMilestone);
    const clipMs = feedback === 'streak' ? playStreakSound(streakSoundLevel(streakRef.current))
      : feedback === 'wrong' ? playWrongSound()
        : playCorrectSound();
```
Ganti menjadi:
```js
    const feedback = answerFeedbackKind(type, onMilestone);
    // Pack Gojo: suara mengikuti teknik visual (ao→aka→murasaki→domain).
    // Teknik ditentukan fungsi yang SAMA dengan efek visual → suara & visual sinkron.
    const clipMs = activeVisual === 'gojo'
      ? playGojoSound(gojoTechniqueFor(type, streakRef.current))
      : feedback === 'streak' ? playStreakSound(streakSoundLevel(streakRef.current))
        : feedback === 'wrong' ? playWrongSound()
          : playCorrectSound();
```

**2.3** Perbaiki dependency `useCallback` supaya `activeVisual` tidak basi (stale closure). Cari **tepat** teks ini (sekitar baris 209):
```js
  }, [active, spawnInk]);
```
Ganti menjadi:
```js
  }, [active, spawnInk, activeVisual]);
```

**2.4** Verifikasi:
```bash
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"
npm run lint >/dev/null 2>&1; echo "lint exit=$?"
npm run build 2>&1 | grep -E "built in|error" | tail -2
```
Harapan:
```
ℹ tests 123
ℹ pass 123
ℹ fail 0
lint exit=0
✓ built in <beberapa>s
```

**2.5** Commit:
```bash
git add src/features/effects/EffectContext.jsx
git commit -m "feat(gojo): suara per-answer (ao/aka/murasaki/domain) disinkron ke visual"
```

---

### Phase 3 — Verifikasi di browser sungguhan (port 5174, JANGAN sentuh 5173)

**3.1** Jalankan dev server (background):
```bash
npm run dev -- --port 5174 --strictPort
```
Cek siap:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:5174/
```
Harapan: `200`.

**3.2** Equip pack Gojo + cek mapping teknik (tempel di Console browser):
```js
// equip pack_07
const p = JSON.parse(localStorage.getItem('user_progress_v2') || '{}');
p.ownedPacks = ['pack_07']; p.activePack = 'pack_07';
localStorage.setItem('user_progress_v2', JSON.stringify(p));
location.reload();
```
Setelah reload, jalankan di Console:
```js
import('/src/features/effects/gojoFx.js').then(m =>
  console.log([1,2,3,4,5,50,100].map(n => n + '=' + m.gojoTechniqueFor('correct', n))));
```
Harapan (urutan teknik per jawaban benar ke-n):
```
["1=ao","2=aka","3=murasaki","4=ao","5=murasaki","50=domain","100=domain_zenith"]
```
Ini membuktikan progresi ao→aka→murasaki→domain benar **sebelum** dihubungkan ke audio.

**3.3** Buktikan audio benar-benar terpanggil. Di Console, sebelum menjawab:
```js
window.__osc = 0;
const _co = AudioContext.prototype.createOscillator;
AudioContext.prototype.createOscillator = function () { window.__osc++; return _co.apply(this, arguments); };
```
Lalu jawab 1 soal di halaman practice (kunci `1`–`6`), cek:
```js
window.__osc
```
Harapan: **> 0** (osilator dibuat = suara Gojo berbunyi) dan `console` bersih dari error.

**3.4** Cek tidak ada error runtime:
```js
// setelah 3-4 jawaban
console.log('errs:', (window.__errs || []).length);
```
Harapan: `errs: 0`.

**3.5** **Verifikasi manual (telinga user — tidak bisa diotomasi):** mainkan 3 jawaban benar berturut-turut dan dengar:
- #1 **ao** → nada **naik** (kesan "menghisap").
- #2 **aka** → nada **turun** (kesan "meledak").
- #3 **murasaki** → nada naik kasar (momen penyatuan).
Kalau arah nada sudah benar → Phase 3 lulus. Kalau "kurang cocok", tune angka di `GOJO_TONES` (bagian yang user bilang mau disesuaikan nanti).

**3.6** Matikan dev server (port 5174) setelah selesai.

---

## 5. Tests / validation

- **TDD per fase**: Phase 1 menulis `sfx.gojo.test.js` dulu (RED → GREEN), baru Phase 2 wiring.
- Perintah gerbang: `npm test` (harus **123 pass / 0 fail**), `npm run lint` (exit 0), `npm run build` (✓).
- Test yang mengunci: 5 test di `src/utils/sfx.gojo.test.js` (bentuk params, arah nada ao vs aka, murasaki beda, fallback null, aman di node).
- Verifikasi mapping end-to-end: langkah browser 3.2 (daftar `1=ao … 100=domain_zenith`) + 3.3 (osilator terbuat) + 3.5 (dengar arah nada).
- **Aturan commit**: satu commit per fase (0,1,2). **JANGAN push** — tunggu perintah eksplisit user.

---

## 6. Risks, tradeoffs, and open questions

- **Angka nada = first pass.** User bilang sound akan disesuaikan belakangan. `GOJO_TONES` sengaja ditaruh di satu tempat supaya gampang di-tune tanpa sentuh logika.
- **Gating pakai `activeVisual === 'gojo'`, bukan `activeVoiceKey`.** `EffectContext` belum baca voice key, dan pack_07 punya visual & voice `'gojo'` (konsisten). Kalau nanti ada pack visual `gojo` dengan voice beda → perlu ditinjau ulang.
- **`VOICES.gojo.synth` tetap dekoratif** (pola lama repo). Nada Gojo ada di `sfx.js`. Tidak mengubah perilaku pack lain.
- **Jawaban SALAH Gojo** → `gojoTechniqueFor('wrong', …)` = `null` → `playGojoSound(null)` → `synthThud()` generik. Sesuai §B ("klip salah menyusul, user akan masukkan 3 klip sendiri nanti"). Aset mp3 (§C5) **sengaja belum** dikerjakan.
- **§C5 aset mp3 Gojo** (`public/voices/gojo/*.mp3`) & **§C6 generalisasi GIF** tetap **di luar scope** plan ini.
- **Tidak menyentuh** efek visual (sudah selesai) maupun sistem EVENT JJK 9/24 (di luar scope, sesuai keputusan sebelumnya).
- **Open question (interpretasi):** tugas user "baca next update di obsidian tanggal 23" → plan ini mengasumsikan sisa kerja = **§B suara** (satu-satunya bagian 9/23 yang belum dieksekusi). Kalau maksudnya lain (mis. langsung ke event 9/24), bilang saja sebelum eksekusi.
