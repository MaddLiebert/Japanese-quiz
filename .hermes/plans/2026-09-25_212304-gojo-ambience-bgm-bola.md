# Gojo Satoru — Suara Tambahan: Efek Bola + BGM 領域展開 (brainstorm + plan)

> Lanjutan dari `.hermes/plans/2026-09-25_113500-gojo-ryoiki-tenkai-ultimate-cinematic.md`
> (cinematic domain sudah jalan: bar 呪力, teks per-karakter, Six Eyes, bigbang, persist).
> Sekarang yang diminta user: **scene Gojo terasa HIDUP** — bukan cuma klip suara Gojo,
> tapi tiap momen visual punya lapisan suara: **efek bola (蒼/赫/茈)** dan **BGM pas ryoiki**.
> Semua **synth Web Audio** (tanpa aset mp3 baru) supaya tidak nunggu file user.

## Goal

Tambah lapisan suara non-voice untuk pack Gojo: **suara bola 蒼/赫 saat muncul + hum persist,
riser & impact saat 茈, tick bar 呪力, chime penuh, cue 六眼, BGM ambient selama 領域展開,
dan dentuman saat domain padam** — semuanya synth murni, angka di satu tempat, dites di node.

## Current context / assumptions

Repo: `C:\Users\maddo\Documents\japanese-quiz`, branch `feat/gojo-pack7-dummy`.
**JANGAN PUSH** (aturan user). Semua perintah dari root repo (bash).

**Kondisi sekarang (ground truth, sudah dicek):**

- `npm test` → **193 pass / 0 fail**. `npm run lint` → exit 0 (warning lama, bukan error).
- Suara Gojo yang SUDAH ada (jangan diubah perilakunya):
  - benar → `playGojoTechnique(tech)` = klip deterministik `ao.mp3` / `aka.mp3` / `Murasaki.mp3` (dari `EffectContext` baris ~202).
  - salah → `playWrongSound()` = 4 klip "gojo kalah" acak (`VOICES.gojo.files.wrong`).
  - cast → `playDomainBoom('cast')` (synth) + `playGojoCast()` (klip `ryoiki tenkai.mp3`).
  - bigbang → `playDomainBoom('bang')` dipanggil dari `GojoDomainCine` (timeout `t.bangStart`).
- Bola persist: `gojoBalls {ao, aka}` + `gojoExplode` di `EffectContext`; visual di `GojoSpheres.jsx` (slide ke tengah **0.42s** saat 茈, `d0 = 0.42` di `GojoBurst.jsx`).
- Domain: state `gojoDomain`, durasi 30s, `gojoDomainStartDelayMs()` = settle+0.7s ≈ **5.7s** (countdown mulai setelah cinematic). Efek padam di `triggerEffect` (salah) & tick effect (habis waktu).
- `sfx.js` pola: **params murni** (dites di node) + **pemutar** (guard `typeof window === 'undefined'` → no-op). Test runner `node --test` auto-discover `*.test.js`.
- `public/voices/gojo/` berisi: ao.mp3, aka.mp3, Murasaki.mp3, ryoiki tenkai.mp3, 4 klip kalah. **TIDAK ada aset BGM** → BGM harus synth.
- DevPanel (`src/features/dev/DevPanel.jsx`) sudah punya tombol `茈 #3/#50/#100`, `Isi Bar #20`, `Cast 領域展開`.

**Asumsi:**

- Ambience hanya untuk pack visual `gojo`; pack lain tidak tersentuh.
- Autoplay policy aman: semua suara dipicu dari gesture (klik jawaban / tap bar); `ctx.resume()` sudah jadi pola di `sfx.js`.
- Level mix: klip voice tetap 0.9 (`playFile`), ambience sengaja ≤ 0.09 → tidak menutupi suara Gojo.
- `prefers-reduced-motion` tidak mematikan suara (hanya animasi) — konsisten dengan perilaku sekarang.

## Brainstorm — opsi & pilihan (semua angka bisa di-tune di 1 tempat)

| # | Ide | Penilaian | Alasan |
|---|---|---|---|
| 1 | **Suara bola muncul** — ao = "hisap" (sweep naik + desis), aka = "ledak" (sweep turun + crackle) | ✅ **DIPILIH** | 1 satu tembakan pendek per kemunculan; pas dengan gerak bola |
| 2 | **Hum bola persist** — ao = desir tinggi, aka = gemuruh rendah + crackle, nyala selama bola di layar | ✅ **DIPILIH** | Ini yang bikin "hidup" — bola tidak cuma gambar diam; padam instan saat 茈 meledak |
| 3 | **茈: riser + impact** — sweep naik 0.42s (pas slide bola) lalu dentuman tabrakan | ✅ **DIPILIH** | Momen tabrakan jadi punya "tarikan" sebelum meledak |
| 4 | **BGM 領域展開** — loop ambient synth (drone 55/82.5Hz + pad triangle filter LFO), mulai setelah settle, mati saat domain padam | ✅ **DIPILIH** | "bgm pas ryoiki" langsung kejawab; tanpa aset; loop tak terbatas |
| 5 | **Tick bar 呪力** — blip pitch naik tiap +1 benar (520→1204Hz) + chime 2 nada saat 20/20 | ✅ **DIPILIH** | Bar jadi terasa "mengisi"; chime = sinyal ult siap |
| 6 | **Cue 六眼 + collapse** — shimmer halus saat mata membuka; dentuman "ruang runtuh" saat domain padam (salah = keras, timeout = lembut) | ✅ **DIPILIH** | Menutup momen buka/tutup domain |
| 7 | Ducking ambience saat klip suara jawaban bunyi | ✅ **DIPILIH** | Tanpa ini scene berisik (voice + BGM + hum bertumpuk) |
| 8 | Melodi/loop per-bola (tiap bola punya "lagu") | ❌ | Berisik & mengganggu belajar; hum tipis sudah cukup |
| 9 | BGM dari file mp3 (`public/voices/gojo/bgm ryoiki.mp3`) | ❌ v1 | Aset belum ada; jalur mp3 bisa ditambah kapan saja (lihat Open Questions) |
| 10 | Suara jawaban salah tambahan (thud di bawah klip "kalah") | ❌ v1 | Klip meme "kalah" sudah jadi identitas; jangan ditumpuk |

## Architecture / proposed approach

Tambah **params murni + pemutar synth** di `src/utils/sfx.js` (pola sama dengan `domainBoomParams`/`playDomainBoom`),
lalu **modul lifecycle baru `src/utils/gojoAmbience.js`** yang mengelola node graph BGM + hum bola
(nyala/mati/ducking, idempotent, no-op di node). Wiring di `src/features/effects/EffectContext.jsx`:
suara peristiwa dipanggil di `triggerEffect` (bola/riser/tick/chime/collapse), BGM nyala lewat `useEffect`
saat `gojoDomain` (delay = `gojoDomainStartDelayMs()`), hum bola lewat `useEffect` pada `gojoBalls`/`gojoExplode`.
Cue 六眼 ditambah di `GojoDomainCine.jsx` (timeout `t.eyesStart`, pola sama dengan dentuman bang).

## Step-by-step tasks

TDD: RED (tulis test, jalankan, lihat GAGAL) → GREEN (implement, jalankan, lihat LULUS) → commit.
**Jangan push.** Satu commit per task.

### Task 0 — Baseline (jangan lanjut kalau merah)

```bash
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```

Harapan:
```
ℹ tests 193
ℹ pass 193
ℹ fail 0
```

Kalau tidak → STOP, perbaiki dulu. (`git status --short` boleh berisi file plan di `.hermes/plans/` — biarkan.)

---

### Task 1 — TDD: params & pemutar synth baru di `src/utils/sfx.js`

**1a. RED — buat file test baru `src/utils/sfx.gojoAmbience.test.js`:**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ballAppearParams, murasakiRiserParams, curseTickParams, curseReadyParams,
  domainCollapseParams, domainCueParams, domainBgmPlan, ballHumPlan,
  playBallSound, playMurasakiRiser, playCurseTick, playCurseReady,
  playDomainCollapse, playDomainCue, getAudioContext,
} from './sfx.js';
import { GOJO_ULT_THRESHOLD } from '../features/effects/gojoFx.js';

// ── Bola 蒼/赫 ──────────────────────────────────────────────────────────────

test('ballAppearParams: ao naik (hisap), aka turun (ledak)', () => {
  const ao = ballAppearParams('ao');
  const aka = ballAppearParams('aka');
  assert.ok(ao.to > ao.from, 'ao harus naik');
  assert.ok(aka.to < aka.from, 'aka harus turun');
  for (const p of [ao, aka]) {
    assert.ok(p.dur > 0.2 && p.dur <= 1, 'durasi wajar');
    assert.ok(p.gain > 0 && p.gain <= 0.3, 'gain sehat (jangan menutupi voice)');
    assert.ok(p.airGain >= 0 && p.airGain <= 0.15, 'desis sehat');
  }
});

test('ballAppearParams: teknik lain / null → null', () => {
  assert.equal(ballAppearParams('murasaki'), null);
  assert.equal(ballAppearParams(null), null);
  assert.equal(ballAppearParams('zzz'), null);
});

// ── 茈 (riser + impact) ─────────────────────────────────────────────────────

test('murasakiRiserParams: riser naik berakhir tepat di tabrakan (0.42s)', () => {
  const p = murasakiRiserParams();
  assert.ok(p.to > p.from, 'riser harus naik');
  assert.ok(Math.abs(p.dur - 0.42) < 0.001, 'dur = durasi slide bola (0.42s)');
  assert.ok(p.filterTo > p.filterFrom, 'filter ikut membuka');
  assert.ok(p.impact.freqStart > p.impact.freqEnd, 'impact sweep turun');
  assert.ok(p.impact.gain > 0 && p.impact.gain <= 0.5, 'impact sehat');
});

// ── Bar 呪力 ────────────────────────────────────────────────────────────────

test('curseTickParams: pitch naik seiring charge, mentok di penuh (20)', () => {
  const freqs = [];
  for (let c = 1; c <= 20; c++) freqs.push(curseTickParams(c).freq);
  for (let i = 1; i < freqs.length; i++) assert.ok(freqs[i] > freqs[i - 1], `tick ${i} harus naik`);
  assert.equal(curseTickParams(20).freq, curseTickParams(999).freq, 'tidak lebih tinggi dari penuh');
  assert.equal(curseTickParams(20).freq, curseTickParams(GOJO_ULT_THRESHOLD).freq, 'batas = GOJO_ULT_THRESHOLD');
  for (const bad of [0, -5, NaN, null, undefined, 'x']) {
    assert.ok(Number.isFinite(curseTickParams(bad).freq), `input ${String(bad)} aman`);
  }
});

test('curseReadyParams: 2 nada naik, gain pelan (bukan fanfare gacha)', () => {
  const p = curseReadyParams();
  assert.equal(p.notes.length, 2);
  assert.ok(p.notes[1] > p.notes[0]);
  assert.ok(p.gain > 0 && p.gain <= 0.3);
});

// ── Domain padam & cue 六眼 ─────────────────────────────────────────────────

test('domainCollapseParams: sweep turun; timeout lebih panjang & lebih pelan', () => {
  const w = domainCollapseParams('wrong');
  const t = domainCollapseParams('timeout');
  for (const p of [w, t]) assert.ok(p.freqStart > p.freqEnd, 'sweep turun');
  assert.ok(t.dur > w.dur, 'timeout lebih panjang (padam alami)');
  assert.ok(t.gain < w.gain, 'timeout lebih pelan (bukan hukuman)');
});

test('domainCueParams: eyes = shimmer tinggi halus; kind lain → null', () => {
  const p = domainCueParams('eyes');
  assert.equal(p.notes.length, 2);
  assert.ok(Math.min(...p.notes) >= 1000, 'di oktaf atas (halus, bukan bass)');
  assert.ok(p.gain <= 0.1, 'sangat pelan — hanya aksen');
  assert.equal(domainCueParams('zzz'), null);
});

// ── Rencana ambience (dipakai gojoAmbience.js) ──────────────────────────────

test('domainBgmPlan: drone + pad lengkap, level pelan, fade wajar', () => {
  const p = domainBgmPlan();
  assert.deepEqual(p, domainBgmPlan(), 'deterministik');
  assert.ok(p.level > 0 && p.level <= 0.12, 'level = latar, bukan lagu');
  assert.ok(p.fadeInMs >= 500 && p.fadeInMs <= 3000);
  assert.ok(p.fadeOutMs >= 300 && p.fadeOutMs <= 2000);
  assert.ok(p.drone.freqs.length >= 2, 'drone minimal 2 lapis');
  assert.ok(p.pad.freqs.length >= 2, 'pad minimal 2 lapis');
  assert.ok(p.pad.lfoHz > 0 && p.pad.lfoHz <= 0.5, 'LFO pelan');
  for (const f of [...p.drone.freqs, ...p.pad.freqs]) {
    assert.ok(f >= 30 && f <= 2000, `freq ${f} audible`);
  }
});

test('ballHumPlan: {} → {}; ao = desir tinggi, aka = gemuruh + crackle', () => {
  assert.deepEqual(ballHumPlan({}), {});
  const ao = ballHumPlan({ ao: true });
  assert.deepEqual(Object.keys(ao), ['ao']);
  const aka = ballHumPlan({ aka: true });
  assert.deepEqual(Object.keys(aka), ['aka']);
  assert.ok(ao.ao.osc.freq > aka.aka.osc.freq, 'ao lebih tinggi dari aka');
  assert.equal(ao.ao.noise.filterType, 'highpass');
  assert.equal(aka.aka.noise.filterType, 'bandpass');
  for (const l of [ao.ao, aka.aka]) {
    assert.ok(l.level > 0 && l.level <= 0.08, 'hum sangat pelan');
    assert.ok(l.tremolo.hz > 0 && l.tremolo.hz < 2, 'tremolo lambat');
  }
});

// ── Pemutar: aman di node ───────────────────────────────────────────────────

test('pemutar baru & getAudioContext aman di node (0 / null, tanpa throw)', () => {
  assert.equal(getAudioContext(), null);
  assert.equal(playBallSound('ao'), 0);
  assert.equal(playMurasakiRiser(), 0);
  assert.equal(playCurseTick(3), 0);
  assert.equal(playCurseReady(), 0);
  assert.equal(playDomainCollapse('wrong'), 0);
  assert.equal(playDomainCue('eyes'), 0);
  assert.equal(playBallSound('zzz'), 0);
  assert.equal(playDomainCue('zzz'), 0);
});
```

> **PENTING:** file test ini JANGAN meng-import `gojoAmbience.js` dulu (modulnya belum ada —
> named import yang gagal membuat SELURUH file test gagal load). Import modul itu ditambah di Task 2.

**1b. RED — verifikasi gagal:**

```bash
node --test src/utils/sfx.gojoAmbience.test.js 2>&1 | grep -E "^ℹ (tests|pass|fail)|does not provide"
```

Harapan: `does not provide an export named 'ballAppearParams'` + `ℹ fail 1` (bukti test benar-benar menguji).

**1c. GREEN — `src/utils/sfx.js`.**

**(i)** Ganti isi `playFanfare` (blok paling bawah file, ~baris 446–466) supaya memakai helper
`playNotes` (dipakai ulang oleh chime bar penuh). Cari **tepat** teks ini:

```js
export const playFanfare = (rarity = 'common') => {
  const ctx = initAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  const { notes, dur, gap, gain } = fanfareParams(rarity);
  const start = ctx.currentTime;
  notes.forEach((freq, i) => {
    const t = start + i * gap;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  });
};
```

Ganti menjadi:

```js
// Pemutar nada berurutan (dipakai fanfare gacha & chime bar 呪力 penuh — DRY).
const playNotes = (notes, dur, gap, gain) => {
  const ctx = initAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  const start = ctx.currentTime;
  notes.forEach((freq, i) => {
    const t = start + i * gap;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  });
};

export const playFanfare = (rarity = 'common') => {
  const { notes, dur, gap, gain } = fanfareParams(rarity);
  playNotes(notes, dur, gap, gain);
};
```

**(ii)** Tempel blok berikut **di AKHIR `src/utils/sfx.js`** (setelah `playFanfare`):

```js
// ── Ambience & SFX tambahan Gojo (pack_07) — bola, bar, domain ──────────────
// Prinsip: setiap momen VISUAL dapat lapisan SUARA non-voice supaya scene terasa
// hidup (bukan cuma klip suara Gojo). Semua angka murni & deterministik → dites
// di sfx.gojoAmbience.test.js. Pemutar = no-op di node (guard window).

// AudioContext untuk modul ambience (gojoAmbience.js) — jangan buat context baru.
export const getAudioContext = () => initAudioContext();

// Burst noise pendek (desis/angin). Sengaja TIDAK me-refactor playDomainBoom
// (kode lama sudah stabil & punya test sendiri) — helper ini untuk pemutar baru.
const noiseBurst = (ctx, t, { dur, gain, type = 'lowpass', fromHz = 900, toHz = 120 }) => {
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(fromHz, t);
  f.frequency.exponentialRampToValueAtTime(Math.max(30, toHz), t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  src.connect(f);
  f.connect(g);
  g.connect(ctx.destination);
  src.start(t);
};

// ── Bola 蒼/赫: suara saat muncul ───────────────────────────────────────────
// ao = "hisap" (nada NAIK + desis bandpass tinggi) · aka = "ledak" (nada TURUN + desis berat).
export const ballAppearParams = (technique) => {
  if (technique === 'ao') return { type: 'sine', from: 170, to: 560, dur: 0.6, gain: 0.16, airGain: 0.05, airHz: 1600 };
  if (technique === 'aka') return { type: 'sawtooth', from: 420, to: 110, dur: 0.5, gain: 0.18, airGain: 0.07, airHz: 900 };
  return null;
};

export const playBallSound = (technique) => {
  const p = ballAppearParams(technique);
  if (!p || typeof window === 'undefined') return 0;
  const ctx = initAudioContext();
  if (!ctx) return 0;
  if (ctx.state === 'suspended') ctx.resume();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = p.type;
  osc.frequency.setValueAtTime(p.from, t);
  osc.frequency.exponentialRampToValueAtTime(p.to, t + p.dur * 0.85);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(p.gain, t + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0008, t + p.dur);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + p.dur + 0.05);
  noiseBurst(ctx, t, { dur: p.dur * 0.7, gain: p.airGain, type: 'bandpass', fromHz: p.airHz, toHz: p.airHz * 0.4 });
  return Math.round(p.dur * 1000);
};

// ── 茈 (murasaki): riser sebelum tabrakan + impact saat bola bertemu ────────
// dur riser = 0.42s = durasi slide bola ke tengah (d0 di GojoBurst/GojoSpheres).
export const murasakiRiserParams = () => ({
  type: 'sawtooth', from: 180, to: 1500, dur: 0.42, gain: 0.15,
  filterFrom: 350, filterTo: 2600,
  impact: { freqStart: 150, freqEnd: 40, dur: 0.9, gain: 0.3, noiseGain: 0.1 },
});

export const playMurasakiRiser = () => {
  if (typeof window === 'undefined') return 0;
  const ctx = initAudioContext();
  if (!ctx) return 0;
  if (ctx.state === 'suspended') ctx.resume();
  const p = murasakiRiserParams();
  const t = ctx.currentTime;

  // Riser: sweep naik + filter membuka.
  const osc = ctx.createOscillator();
  const f = ctx.createBiquadFilter();
  const g = ctx.createGain();
  osc.type = p.type;
  osc.frequency.setValueAtTime(p.from, t);
  osc.frequency.exponentialRampToValueAtTime(p.to, t + p.dur);
  f.type = 'lowpass';
  f.frequency.setValueAtTime(p.filterFrom, t);
  f.frequency.exponentialRampToValueAtTime(p.filterTo, t + p.dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(p.gain, t + p.dur * 0.9);
  g.gain.exponentialRampToValueAtTime(0.0008, t + p.dur + 0.06);
  osc.connect(f);
  f.connect(g);
  g.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + p.dur + 0.1);

  // Impact: tepat saat kedua bola bertemu (bareng ledakan visual + klip 茈).
  const imp = p.impact;
  const osc2 = ctx.createOscillator();
  const g2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(imp.freqStart, t + p.dur);
  osc2.frequency.exponentialRampToValueAtTime(imp.freqEnd, t + p.dur + imp.dur);
  g2.gain.setValueAtTime(0, t + p.dur);
  g2.gain.linearRampToValueAtTime(imp.gain, t + p.dur + 0.015);
  g2.gain.exponentialRampToValueAtTime(0.0008, t + p.dur + imp.dur);
  osc2.connect(g2);
  g2.connect(ctx.destination);
  osc2.start(t + p.dur);
  osc2.stop(t + p.dur + imp.dur + 0.05);
  noiseBurst(ctx, t + p.dur, { dur: 0.4, gain: imp.noiseGain, type: 'lowpass', fromHz: 800, toHz: 90 });
  return Math.round((p.dur + imp.dur) * 1000);
};

// ── Bar 呪力: tick naik tiap +1 benar + chime saat penuh ────────────────────
// Batas 20 = GOJO_ULT_THRESHOLD (gojoFx.js); kesamaannya dikunci di test.
const CURSE_TICK_MAX = 20;

export const curseTickParams = (charge = 1) => {
  const n = Number(charge);
  const c = Math.min(CURSE_TICK_MAX, Math.max(1, Number.isFinite(n) ? Math.floor(n) : 1));
  return { freq: 520 + (c - 1) * 36, dur: 0.055, gain: 0.09, type: 'triangle' };
};

export const playCurseTick = (charge = 1) => {
  if (typeof window === 'undefined') return 0;
  const ctx = initAudioContext();
  if (!ctx) return 0;
  if (ctx.state === 'suspended') ctx.resume();
  const p = curseTickParams(charge);
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = p.type;
  osc.frequency.setValueAtTime(p.freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(p.gain, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0008, t + p.dur);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + p.dur + 0.02);
  return Math.round(p.dur * 1000);
};

export const curseReadyParams = () => ({ notes: [659.25, 987.77], dur: 0.16, gap: 0.1, gain: 0.2 });

export const playCurseReady = () => {
  if (typeof window === 'undefined') return 0;
  const p = curseReadyParams();
  playNotes(p.notes, p.dur, p.gap, p.gain);
  return Math.round((p.notes.length * p.gap + p.dur) * 1000);
};

// ── Domain padam (jawab salah / waktu habis) ────────────────────────────────
export const domainCollapseParams = (kind = 'wrong') => {
  const timeout = kind === 'timeout';
  return {
    freqStart: timeout ? 180 : 240,
    freqEnd: timeout ? 46 : 52,
    dur: timeout ? 1.6 : 1.1,
    gain: timeout ? 0.22 : 0.32,
    noiseGain: timeout ? 0.07 : 0.11,
  };
};

export const playDomainCollapse = (kind = 'wrong') => {
  if (typeof window === 'undefined') return 0;
  const ctx = initAudioContext();
  if (!ctx) return 0;
  if (ctx.state === 'suspended') ctx.resume();
  const p = domainCollapseParams(kind);
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(p.freqStart, t);
  osc.frequency.exponentialRampToValueAtTime(p.freqEnd, t + p.dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(p.gain, t + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0008, t + p.dur);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + p.dur + 0.05);
  noiseBurst(ctx, t, { dur: p.dur * 0.4, gain: p.noiseGain, type: 'lowpass', fromHz: 700, toHz: 90 });
  return Math.round(p.dur * 1000);
};

// ── Cue halus 六眼 membuka ──────────────────────────────────────────────────
export const domainCueParams = (kind) => (kind === 'eyes'
  ? { notes: [1318.51, 1567.98], dur: 0.22, gap: 0.09, gain: 0.07 }
  : null);

export const playDomainCue = (kind) => {
  const p = domainCueParams(kind);
  if (!p || typeof window === 'undefined') return 0;
  playNotes(p.notes, p.dur, p.gap, p.gain);
  return Math.round((p.notes.length * p.gap + p.dur) * 1000);
};

// ── Rencana ambience (dipakai gojoAmbience.js; murni → dites) ───────────────
// BGM 領域展開: drone bass (55/82.5Hz) + pad triangle yang filternya dibuka-tutup
// LFO pelan (0.06Hz) → terasa "ruang bernapas", bukan lagu.
export const domainBgmPlan = () => ({
  level: 0.085,          // master — sengaja pelan (latar, bukan lagu)
  fadeInMs: 1600,
  fadeOutMs: 900,
  drone: { freqs: [55, 82.5], detune: [0, -5], gain: 0.5 },
  pad: { type: 'triangle', freqs: [110, 165, 220], filterHz: 420, lfoHz: 0.06, lfoDepth: 150, gain: 0.3 },
});

// Hum bola persist: ao = desir tinggi (highpass), aka = gemuruh rendah + crackle (bandpass).
export const ballHumPlan = (balls = {}) => {
  const out = {};
  if (balls.ao) {
    out.ao = {
      level: 0.05, fadeInMs: 900,
      osc: { type: 'sine', freq: 330, gain: 0.5 },
      tremolo: { hz: 0.4, depth: 0.18 },
      noise: { filterType: 'highpass', filterHz: 1200, gain: 0.05 },
    };
  }
  if (balls.aka) {
    out.aka = {
      level: 0.055, fadeInMs: 900,
      osc: { type: 'sawtooth', freq: 92, gain: 0.4 },
      tremolo: { hz: 0.55, depth: 0.22 },
      noise: { filterType: 'bandpass', filterHz: 1400, gain: 0.08 },
    };
  }
  return out;
};
```

**1d. GREEN — verifikasi lulus:**

```bash
node --test src/utils/sfx.gojoAmbience.test.js 2>&1 | grep -E "^ℹ (tests|pass|fail)"
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```

Harapan:
```
ℹ tests 10
ℹ pass 10
ℹ fail 0
ℹ tests 203
ℹ pass 203
ℹ fail 0
```

**1e. Commit:**

```bash
git add src/utils/sfx.js src/utils/sfx.gojoAmbience.test.js
git commit -m "feat(gojo): sfx tambahan (bola/riser/bar/collapse/cue) + rencana ambience BGM & hum - synth murni + tes"
```

---

### Task 2 — TDD: modul lifecycle `src/utils/gojoAmbience.js` (BGM + hum + duck)

**2a. RED — tambah ke `src/utils/sfx.gojoAmbience.test.js`.** Ubah blok import paling atas:
tambahkan baris baru **setelah** import `sfx.js`:

```js
import {
  startDomainBgm, stopDomainBgm, setBallHum, stopBallHum, duckAmbience, stopAllAmbience,
} from './gojoAmbience.js';
```

Lalu tempel di **akhir file**:

```js
// ── Modul ambience: aman di node (semua no-op) ──────────────────────────────

test('gojoAmbience: semua fungsi no-op aman di node (false, tanpa throw)', () => {
  assert.equal(startDomainBgm(), false);
  assert.equal(stopDomainBgm(), false);
  assert.equal(setBallHum({ ao: true, aka: true }), false);
  assert.equal(stopBallHum(), false);
  assert.equal(duckAmbience(500), false);
  assert.equal(stopAllAmbience(), false);
});
```

**2b. RED — verifikasi gagal:**

```bash
node --test src/utils/sfx.gojoAmbience.test.js 2>&1 | grep -E "^ℹ (tests|pass|fail)|does not provide"
```

Harapan: `does not provide an export named 'startDomainBgm'` + `ℹ fail 1`.

**2c. GREEN — buat file baru `src/utils/gojoAmbience.js`:**

```js
// ─────────────────────────────────────────────────────────────────────────────
// Ambience Gojo: BGM 領域展開 + hum bola persist + ducking.
// Semua fungsi no-op (return false) di node/test — aman di-import di mana pun.
// Angka ada di sfx.js (domainBgmPlan / ballHumPlan) — satu titik tune.
// ─────────────────────────────────────────────────────────────────────────────
import { getAudioContext, domainBgmPlan, ballHumPlan } from './sfx.js';   // WAJIB pakai .js: file ini di-load node --test (ESM butuh specifier lengkap)

const hasWindow = () => typeof window !== 'undefined';

let bgm = null;              // { master, nodes, level, fadeOutMs }
let hums = { ao: null, aka: null };
let duckTimer = null;

// Debug hook (dev-only): window.__gojoAmbience → dipakai verifikasi browser & DevPanel.
const setDebug = (patch) => {
  if (!hasWindow()) return;
  if (!(import.meta.env && import.meta.env.DEV)) return;   // Vite: hilang di build produksi
  window.__gojoAmbience = {
    ...(window.__gojoAmbience || { bgm: false, balls: { ao: false, aka: false }, duckUntil: 0 }),
    ...patch,
  };
};

// Ramp turun + matikan node (stop aman walau node sudah berhenti).
const rampDown = (entry, fadeMs, target) => {
  const ctx = getAudioContext();
  if (!ctx || !entry) return;
  const t = ctx.currentTime;
  const fade = Math.max(0.05, fadeMs / 1000);
  entry.master.gain.cancelScheduledValues(t);
  entry.master.gain.setValueAtTime(Math.max(entry.master.gain.value, 0.0001), t);
  entry.master.gain.exponentialRampToValueAtTime(Math.max(target, 0.0001), t + fade);
  entry.nodes.forEach((n) => { try { n.stop(t + fade + 0.1); } catch { /* sudah berhenti */ } });
};

// ── BGM 領域展開 ────────────────────────────────────────────────────────────
export const startDomainBgm = () => {
  if (!hasWindow() || bgm) return false;
  const ctx = getAudioContext();
  if (!ctx) return false;
  if (ctx.state === 'suspended') ctx.resume();
  const p = domainBgmPlan();
  const t = ctx.currentTime;

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, t);
  master.gain.exponentialRampToValueAtTime(p.level, t + p.fadeInMs / 1000);
  master.connect(ctx.destination);
  const nodes = [];

  // Drone bass: 2 sine nyaris sama (detune kecil) → beat pelan, terasa "hidup".
  p.drone.freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (osc.detune) osc.detune.setValueAtTime(p.drone.detune[i] || 0, t);
    g.gain.setValueAtTime(p.drone.gain / p.drone.freqs.length, t);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    nodes.push(osc);
  });

  // Pad: triangle lewat lowpass yang dibuka-tutup LFO 0.06Hz.
  const padFilter = ctx.createBiquadFilter();
  padFilter.type = 'lowpass';
  padFilter.frequency.setValueAtTime(p.pad.filterHz, t);
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.setValueAtTime(p.pad.lfoHz, t);
  lfoGain.gain.setValueAtTime(p.pad.lfoDepth, t);
  lfo.connect(lfoGain);
  lfoGain.connect(padFilter.frequency);
  lfo.start(t);
  nodes.push(lfo);
  p.pad.freqs.forEach((freq) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = p.pad.type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(p.pad.gain / p.pad.freqs.length, t);
    osc.connect(g);
    g.connect(padFilter);
    osc.start(t);
    nodes.push(osc);
  });
  padFilter.connect(master);

  bgm = { master, nodes, level: p.level, fadeOutMs: p.fadeOutMs };
  setDebug({ bgm: true });
  return true;
};

export const stopDomainBgm = () => {
  if (!bgm) return false;
  rampDown(bgm, bgm.fadeOutMs, 0.0001);
  bgm = null;
  setDebug({ bgm: false });
  return true;
};

// ── Hum bola persist ────────────────────────────────────────────────────────
const makeHum = (kind) => {
  const ctx = getAudioContext();
  if (!ctx) return null;
  const plan = ballHumPlan({ ao: kind === 'ao', aka: kind === 'aka' })[kind];
  const t = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, t);
  master.gain.exponentialRampToValueAtTime(plan.level, t + plan.fadeInMs / 1000);
  master.connect(ctx.destination);
  const nodes = [];

  // Osc + tremolo pelan (desir/gemuruh yang "bernafas", bukan nada datar).
  const osc = ctx.createOscillator();
  osc.type = plan.osc.type;
  osc.frequency.setValueAtTime(plan.osc.freq, t);
  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(plan.osc.gain, t);
  const trem = ctx.createOscillator();
  const tremGain = ctx.createGain();
  trem.frequency.setValueAtTime(plan.tremolo.hz, t);
  tremGain.gain.setValueAtTime(plan.tremolo.depth, t);
  trem.connect(tremGain);
  tremGain.connect(oscGain.gain);
  trem.start(t);
  nodes.push(trem);
  osc.connect(oscGain);
  oscGain.connect(master);
  osc.start(t);
  nodes.push(osc);

  // Lapisan noise loop (ao = desis udara, aka = crackle) — buffer 1.5s di-loop.
  const len = Math.max(1, Math.floor(ctx.sampleRate * 1.5));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = plan.noise.filterType;
  f.frequency.setValueAtTime(plan.noise.filterHz, t);
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(plan.noise.gain, t);
  src.connect(f);
  f.connect(ng);
  ng.connect(master);
  src.start(t);
  nodes.push(src);

  return { master, nodes, level: plan.level, fadeOutMs: 400 };
};

// Idempotent: panggil berkali-kali dengan set bola yang sama → tidak dobel.
export const setBallHum = (balls = {}) => {
  if (!hasWindow()) return false;
  const want = { ao: Boolean(balls.ao), aka: Boolean(balls.aka) };
  let changed = false;
  for (const kind of ['ao', 'aka']) {
    if (want[kind] && !hums[kind]) { hums[kind] = makeHum(kind); changed = true; }
    if (!want[kind] && hums[kind]) { rampDown(hums[kind], 400, 0.0001); hums[kind] = null; changed = true; }
  }
  if (changed) setDebug({ balls: { ao: Boolean(hums.ao), aka: Boolean(hums.aka) } });
  return changed;
};

export const stopBallHum = () => {
  if (!hums.ao && !hums.aka) return false;
  for (const kind of ['ao', 'aka']) {
    if (hums[kind]) { rampDown(hums[kind], 400, 0.0001); hums[kind] = null; }
  }
  setDebug({ balls: { ao: false, aka: false } });
  return true;
};

// ── Ducking: pelankan ambience saat klip suara jawaban/cast berbunyi ────────
export const duckAmbience = (ms = 1200) => {
  if (!hasWindow()) return false;
  const ctx = getAudioContext();
  if (!ctx) return false;
  const entries = [bgm, hums.ao, hums.aka].filter(Boolean);
  if (!entries.length) return false;
  const t = ctx.currentTime;
  entries.forEach((e) => {
    e.master.gain.cancelScheduledValues(t);
    e.master.gain.setValueAtTime(Math.max(e.master.gain.value, 0.0001), t);
    e.master.gain.exponentialRampToValueAtTime(Math.max(e.level * 0.25, 0.0001), t + 0.12);
  });
  if (duckTimer) clearTimeout(duckTimer);
  duckTimer = setTimeout(() => {
    const now = getAudioContext();
    if (!now) return;
    const t2 = now.currentTime;
    [bgm, hums.ao, hums.aka].filter(Boolean).forEach((e) => {
      e.master.gain.cancelScheduledValues(t2);
      e.master.gain.setValueAtTime(Math.max(e.master.gain.value, 0.0001), t2);
      e.master.gain.exponentialRampToValueAtTime(e.level, t2 + 0.35);
    });
  }, Math.max(300, ms));
  setDebug({ duckUntil: Date.now() + ms });
  return true;
};

export const stopAllAmbience = () => {
  const a = stopDomainBgm();
  const b = stopBallHum();
  return a || b;
};
```

**2d. GREEN — verifikasi lulus:**

```bash
node --test src/utils/sfx.gojoAmbience.test.js 2>&1 | grep -E "^ℹ (tests|pass|fail)"
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"
npm run lint >/dev/null 2>&1; echo "lint exit=$?"
```

Harapan:
```
ℹ tests 11
ℹ pass 11
ℹ fail 0
ℹ tests 204
ℹ pass 204
ℹ fail 0
lint exit=0
```

**2e. Commit:**

```bash
git add src/utils/gojoAmbience.js src/utils/sfx.gojoAmbience.test.js
git commit -m "feat(gojo): modul ambience - BGM 領域展開 (drone+pad) + hum bola persist + ducking, no-op di node"
```

---

### Task 3 — Wiring `src/features/effects/EffectContext.jsx`

**3a. Import (baris 4).** Cari **tepat**:

```js
import { playCorrectSound, playWrongSound, playStreakSound, answerFeedbackKind, hinaGifHoldMs, playDomainBoom, playGojoTechnique, playGojoCast } from '../../utils/sfx';
```

Ganti menjadi (2 baris):

```js
import { playCorrectSound, playWrongSound, playStreakSound, answerFeedbackKind, hinaGifHoldMs, playDomainBoom, playGojoTechnique, playGojoCast, playBallSound, playMurasakiRiser, playCurseTick, playCurseReady, playDomainCollapse } from '../../utils/sfx';
import { startDomainBgm, stopDomainBgm, setBallHum, stopBallHum, duckAmbience, stopAllAmbience } from '../../utils/gojoAmbience';
```

**3b. Ref.** Cari **tepat**:

```js
  const streakRef = useRef(0);
```

Ganti menjadi:

```js
  const streakRef = useRef(0);
  const domainEndedRef = useRef(false);   // suara "domain padam" hanya sekali per cast
```

**3c. Cleanup unmount.** Cari **tepat**:

```js
  useEffect(() => () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);
```

Ganti menjadi:

```js
  useEffect(() => () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    stopAllAmbience();   // BGM/hum tidak boleh hidup setelah provider unmount
  }, []);
```

**3d. Duck sebelum suara jawaban.** Cari **tepat**:

```js
    const clipMs = activeVisual === 'gojo'
```

Ganti menjadi:

```js
    // Ambience (BGM domain / hum bola) dipelankan saat klip suara jawaban bunyi —
    // tanpa ini scene berisik (suara Gojo + ambience bertumpuk).
    if (activeVisual === 'gojo') duckAmbience(1500);

    const clipMs = activeVisual === 'gojo'
```

**3e. Suara bola.** Cari **tepat**:

```js
    if (activeVisual === 'gojo') {
      const tech = gojoTechniqueFor(kind, type === 'correct' ? streakRef.current : 0);
      // Generasi bola baru: reset milik generasi lama (mis. timer 茈 3.2s) TIDAK
```

Ganti menjadi:

```js
    if (activeVisual === 'gojo') {
      const tech = gojoTechniqueFor(kind, type === 'correct' ? streakRef.current : 0);
      // Suara peristiwa (non-voice): bola muncul (蒼/赫) + riser tabrakan 茈.
      if (tech === 'ao' || tech === 'aka') playBallSound(tech);
      if (tech === 'murasaki') playMurasakiRiser();
      // Generasi bola baru: reset milik generasi lama (mis. timer 茈 3.2s) TIDAK
```

**3f. Tick bar + chime penuh + collapse.** Cari **tepat**:

```js
      // Bar energi kutukan ikut streak; SATU salah = domain padam & bar kosong.
      setUltCharge(gojoCurseCharge(streakRef.current));
      if (type === 'wrong') setGojoDomain(false);
```

Ganti menjadi:

```js
      // Bar energi kutukan ikut streak; SATU salah = domain padam & bar kosong.
      // Suara bar: tick makin tinggi tiap +1 benar; chime saat penuh (20/20).
      const newCharge = gojoCurseCharge(streakRef.current);
      setUltCharge(newCharge);
      if (type === 'correct' && newCharge > 0) {
        if (newCharge >= GOJO_ULT_THRESHOLD) playCurseReady();
        else playCurseTick(newCharge);
      }
      if (type === 'wrong') {
        // Domain padam karena SALAH → dentuman "ruang runtuh" (sekali per cast).
        if (gojoDomain && !domainEndedRef.current) {
          domainEndedRef.current = true;
          playDomainCollapse('wrong');
        }
        setGojoDomain(false);
      }
```

**3g. Dependency `useCallback`.** Cari **tepat**:

```js
  }, [active, spawnInk, activeVisual]);
```

Ganti menjadi:

```js
  }, [active, spawnInk, activeVisual, gojoDomain]);
```

**3h. `resetEffectStreak`.** Cari **tepat**:

```js
  const resetEffectStreak = useCallback(() => {
    streakRef.current = 0;
```

Ganti menjadi:

```js
  const resetEffectStreak = useCallback(() => {
    streakRef.current = 0;
    domainEndedRef.current = false;
```

**3i. `endQuizSession`.** Cari **tepat**:

```js
    setUltCharge(0);
    domainEndsAtRef.current = null;
  }, []);
```

Ganti menjadi:

```js
    setUltCharge(0);
    domainEndsAtRef.current = null;
    domainEndedRef.current = false;
    stopAllAmbience();
  }, []);
```

**3j. `castDomain`.** Cari **tepat**:

```js
  const castDomain = useCallback(() => {
    if (activeVisual !== 'gojo') return;
    streakRef.current = 0;
```

Ganti menjadi:

```js
  const castDomain = useCallback(() => {
    if (activeVisual !== 'gojo') return;
    streakRef.current = 0;
    domainEndedRef.current = false;
```

**3k. Collapse saat waktu habis.** Cari **tepat**:

```js
    const tick = () => {
      const left = gojoDomainLeft(domainEndsAtRef.current);
      setDomainLeft(left);
      if (left <= 0) setGojoDomain(false);
    };
```

Ganti menjadi:

```js
    const tick = () => {
      const left = gojoDomainLeft(domainEndsAtRef.current);
      setDomainLeft(left);
      if (left <= 0) {
        // Waktu habis (bukan salah) → padam alami + suara collapse lembut.
        if (!domainEndedRef.current) {
          domainEndedRef.current = true;
          playDomainCollapse('timeout');
        }
        setGojoDomain(false);
      }
    };
```

**3l. Effect ambience (2 blok baru).** Cari **tepat**:

```js
  // Domain padam (habis waktu / jawab salah / keluar) → timer balik penuh.
  useEffect(() => {
    if (gojoDomain) return;
    domainEndsAtRef.current = null;
    setDomainLeft(GOJO_DOMAIN_DURATION_S);
  }, [gojoDomain]);
```

Tambahkan **setelah** blok itu:

```js
  // ── Ambience (BGM 領域展開 + hum bola) ─────────────────────────────────────
  // BGM hidup SETELAH cinematic settle (voice cast & dentuman sudah selesai) dan
  // mati saat domain padam. Pending timer dibatalkan kalau domain mati lebih dulu.
  useEffect(() => {
    if (!gojoDomain || activeVisual !== 'gojo') { stopDomainBgm(); return undefined; }
    const t = setTimeout(() => startDomainBgm(), gojoDomainStartDelayMs());
    timersRef.current.push(t);
    return () => clearTimeout(t);
  }, [gojoDomain, activeVisual]);

  // Hum bola mengikuti bola yang benar-benar tampil; padam SEKETIKA saat 茈
  // meledak (gojoExplode) — jangan ikut "meledak" 3.2s sampai reset.
  useEffect(() => {
    if (activeVisual !== 'gojo' || gojoExplode) { stopBallHum(); return undefined; }
    setBallHum(gojoBalls);
    return undefined;
  }, [activeVisual, gojoBalls, gojoExplode]);
```

**3m. Gates + commit:**

```bash
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"   # 204 pass, 0 fail
npm run lint >/dev/null 2>&1; echo "lint exit=$?" # lint exit=0
git add src/features/effects/EffectContext.jsx
git commit -m "feat(gojo): wiring ambience - suara bola/riser/tick/chime/collapse + BGM setelah settle + ducking"
```

---

### Task 4 — Cue 六眼 di `src/features/effects/GojoDomainCine.jsx`

**4a.** Cari **tepat**:

```js
import { playDomainBoom } from '../../utils/sfx';
```

Ganti menjadi:

```js
import { playDomainBoom, playDomainCue } from '../../utils/sfx';
```

**4b.** Cari **tepat**:

```js
  // Dentuman bigbang (cast sudah dibunyikan EffectProvider).
  useEffect(() => {
    if (reduced) return undefined;
    const id = setTimeout(() => playDomainBoom('bang'), t.bangStart * 1000);
    return () => clearTimeout(id);
  }, [reduced, t.bangStart]);
```

Tambahkan **setelah** blok itu:

```js
  // Cue halus saat 六眼 membuka — aksen kecil di atas voice cast (jangan bertumpuk).
  useEffect(() => {
    if (reduced) return undefined;
    const id = setTimeout(() => playDomainCue('eyes'), t.eyesStart * 1000);
    return () => clearTimeout(id);
  }, [reduced, t.eyesStart]);
```

**4c. Gates + commit:**

```bash
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"   # 204 pass
npm run lint >/dev/null 2>&1; echo "lint exit=$?" # 0
git add src/features/effects/GojoDomainCine.jsx
git commit -m "feat(gojo): cue shimmer halus saat 六眼 membuka (sinkron eyesStart)"
```

---

### Task 5 — DevPanel: tombol verifikasi (蒼 #1 / 赫 #2 / tes BGM / tes hum)

**5a. `src/features/dev/DevPanel.jsx` — import.** Cari **tepat**:

```js
import { useEffectLayer } from "../effects/EffectContext";
```

Ganti menjadi:

```js
import { useEffectLayer } from "../effects/EffectContext";
import { startDomainBgm, stopDomainBgm, setBallHum, stopBallHum } from "../../utils/gojoAmbience";
```

**5b. Tambah 4 tombol.** Cari **tepat**:

```jsx
            <button type="button" onClick={castNow} className={`${btn} bg-[#7c4dff] text-kinari-light`}>
              🌌 {id ? "Cast 領域展開" : "Cast Domain"}
            </button>
```

Tambahkan **setelah** blok tombol itu:

```jsx
            <button type="button" onClick={() => previewGojo(1)} className={`${btn} bg-[#38bdf8] text-sumi`}>
              🔵 {id ? "蒼 #1" : "Ao #1"}
            </button>
            <button type="button" onClick={() => previewGojo(2)} className={`${btn} bg-[#ef4444] text-kinari-light`}>
              🔴 {id ? "赫 #2" : "Aka #2"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.__gojoAmbience?.bgm) stopDomainBgm();
                else startDomainBgm();
              }}
              className={`${btn} bg-[#7c4dff] text-kinari-light`}
            >
              🎵 {id ? "Tes BGM 領域展開" : "Test Domain BGM"}
            </button>
            <button
              type="button"
              onClick={() => {
                const on = window.__gojoAmbience?.balls?.ao || window.__gojoAmbience?.balls?.aka;
                if (on) stopBallHum();
                else setBallHum({ ao: true, aka: true });
              }}
              className={`${btn} bg-[#0ea5e9] text-kinari-light`}
            >
              🔊 {id ? "Tes Hum Bola" : "Test Ball Hum"}
            </button>
```

> Grid `sm:grid-cols-5` di blok itu **tidak perlu diubah** — 9 tombol otomatis jadi 2 baris (5 + 4).

**5c. Gates + commit:**

```bash
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"   # 204 pass
npm run lint >/dev/null 2>&1; echo "lint exit=$?" # 0
git add src/features/dev/DevPanel.jsx
git commit -m "feat(dev): tombol 蒼 #1 / 赫 #2 + toggle tes BGM & hum bola di DevPanel"
```

---

### Task 6 — Verifikasi browser (ground truth; test node tidak merender audio)

**6a.** Jalankan dev server (pakai port bebas, mis. 5174):

```bash
npm run dev -- --port 5174 --strictPort
```

Cek siap: `curl -s -o /dev/null -w "%{http_code}" http://localhost:5174/` → `200`.

**6b. BGM nyala setelah settle + mati saat domain padam.** Dengan browser helper:

```python
import time
new_tab("http://localhost:5174/settings")
wait_for_load()
# Klik "Cast 領域展開" DUA kali: klik-1 menyiapkan pack Gojo (bila belum), klik-2 cast.
for _ in range(2):
    js("""(() => { const b=[...document.querySelectorAll('button')].find(x=>/Cast 領域展開/i.test(x.textContent)); if (b) b.click(); return !!b; })()""")
    time.sleep(1.2)
time.sleep(7)   # settle ~5.7s → BGM mulai
print("bgm:", js("window.__gojoAmbience"))   # harapan: { bgm: true, ... }
```

Harapan: `bgm: true`. Lalu uji duck & collapse lewat quiz:
buka `/practice`, mulai quiz kana, jawab **salah** sekali → cek:

```python
print(js("""(() => ({
  bgm: window.__gojoAmbience && window.__gojoAmbience.bgm,
  domainEl: !!document.querySelector('[data-gojo-domain]'),
  duck: window.__gojoAmbience && window.__gojoAmbience.duckUntil > Date.now(),
}))()"""))
```

Harapan: `domainEl: false` (domain padam karena salah), `bgm: false` (BGM mati), `duck: true` (baru saja duck untuk klip jawaban).
Dengar: ada dentuman "runtuh" sesaat setelah jawab salah (collapse).

**6c. Hum bola + suara muncul.** Dari `/settings` klik `🔵 蒼 #1` → cek `window.__gojoAmbience.balls.ao === true` (hum nyala) dan dengar "hisap" + desir. Klik `🔴 赫 #2` → `balls.aka === true`. Klik `🟣 茈 #3` → dengar riser naik 0.42s lalu dentuman tabrakan; cek hum padam:

```python
print(js("window.__gojoAmbience.balls"))   # harapan: { ao: false, aka: false } (padam saat ledakan)
```

**6d. Bukti osilator benar-benar dibuat** (pola sama seperti plan sebelumnya). Sebelum aksi:

```python
js("""(() => {
  window.__osc = 0;
  const _co = AudioContext.prototype.createOscillator;
  AudioContext.prototype.createOscillator = function () { window.__osc++; return _co.apply(this, arguments); };
  return true;
})()""")
# klik 🔵 蒼 #1 → cek window.__osc naik (suara bola dibuat)
# klik 🎵 Tes BGM 領域展開 → cek window.__osc naik (node BGM dibuat) dan window.__gojoAmbience.bgm berubah
# klik 🎵 lagi → bgm kembali false (BGM berhenti tanpa error)
```

Harapan: hitungan naik di tiap aksi; console bersih dari error.

**6e. HP 390×844** (spot-check tidak ada regresi layout):

```python
cdp('Emulation.setDeviceMetricsOverride', width=390, height=844, deviceScaleFactor=3, mobile=True)
# klik Cast 領域展開 → tunggu 7s → window.__gojoAmbience.bgm === true
cdp('Emulation.clearDeviceMetricsOverride')
```

**6f. Regresi visual murasaki** (jangan sampai wiring mengubah efek lama): klik `🟣 茈 #3` → petir `stroke-width 5.5`, ring `border 10px` masih ada (seperti sebelum perubahan).

**6g. Matikan dev server** setelah selesai.

---

### Task 7 — Gates akhir

```bash
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"   # 204 pass, 0 fail
npm run lint >/dev/null 2>&1; echo "lint exit=$?" # 0
npm run build 2>&1 | tail -2                      # ✓ built in ...
git status --short
git ls-remote --heads origin                      # pastikan cuma refs/heads/main → tidak ada push
```

Kalau ada temuan dari Task 6:

```bash
git add -A -- src/
git commit -m "fix(gojo): poles ambience setelah verifikasi browser (level/duck/lifecycle)"
```

## Tests / validation

- **Unit (node --test):** file baru `src/utils/sfx.gojoAmbience.test.js` **11 test**
  (2 bola, 1 riser, 2 bar, 2 domain/cue, 2 rencana ambience, 1 pemutar node-safe, 1 modul node-safe).
  **193 → 204 pass / 0 fail.**
- Kontrak yang dikunci test:
  - `ballAppearParams`: ao naik / aka turun; gain ≤ 0.3 (tidak menutupi voice).
  - `murasakiRiserParams.dur === 0.42` (sinkron slide bola).
  - `curseTickParams`: pitch naik monoton, mentok di `GOJO_ULT_THRESHOLD` (cross-check ke `gojoFx.js`).
  - `domainCollapseParams`: timeout > wrong di durasi, < wrong di gain.
  - `domainBgmPlan`/`ballHumPlan`: level pelan (≤ 0.12 / ≤ 0.08), frekuensi audible, deterministik.
  - Semua pemutar & `gojoAmbience` **no-op aman di node** (tanpa throw).
- **Browser (ground truth):** BGM nyala setelah settle & mati saat salah/waktu habis; hum bola nyala/padam
  mengikuti bola; riser 茈 terdengar sebelum tabrakan; osilator dibuat di tiap aksi; console bersih;
  HP 390×844 tidak regresi; murasaki visual tidak berubah.
- **Gates:** lint 0 error, build sukses. **Commit lokal saja — JANGAN PUSH.**

## Risks, tradeoffs, and open questions

- **Berisik / tabrakan suara** (risiko utama). Mitigasi: semua level ambience ≤ 0.09, duck otomatis 25%
  selama klip suara jawaban. Kalau masih terlalu ramai: turunkan `domainBgmPlan().level` (1 angka) atau
  `ballHumPlan().level`.
- **`import.meta.env` di `gojoAmbience.js`** — kalau oxlint/rollup mengeluh, ganti guard debug jadi
  `const DEV = import.meta.env?.DEV` di top-level dan pakai variabel itu. DevPanel sudah memakai pola
  `import.meta.env.DEV` dan lolos lint, jadi kemungkinan besar aman.
- **Duck memakai `setTimeout` global** (bukan `timersRef` provider) — kalau komponen unmount saat duck
  berjalan, timer hanya menyentuh node yang sudah dimatikan (aman, semua ramp di-guard). Catat kalau ada
  kebocoran suara saat navigasi cepat.
- **BGM hanya mulai setelah settle (±5.7s)** — disengaja supaya voice cast + dentuman tidak tertimpa.
  Kalau user mau BGM dari detik 0 cast: ganti `gojoDomainStartDelayMs()` → `0` (1 baris di Task 3l).
- **`Murasaki.mp3` mungkin sudah berisi dentuman** — kalau impact riser terasa dobel, turunkan
  `murasakiRiserParams().impact.gain` (0.3 → 0.15) — 1 angka.
- **Domain persist lintas halaman** (perilaku lama): kalau user cast lalu navigasi tanpa memicu
  `endQuizSession`, BGM ikut terbawa. V1 dibiarkan (konsisten dengan domain yang juga terbawa).
- **Tidak ada tombol mute global** — belum ada UI setting suara di app ini. Kalau user mau, itu fitur
  terpisah (tambah 1 state + 1 toggle di Settings).
- **BGM synth vs mp3**: kalau nanti user punya file BGM sendiri (mis. `bgm ryoiki.mp3`), jalur loop
  `<audio loop>` bisa ditambah di `startDomainBgm` (fallback synth tetap ada) — bilang saja.
- **Open questions (bisa dijawab sambil jalan, tidak memblokir):**
  1. Level BGM 0.085 terasa pas / terlalu pelan / terlalu keras? (1 angka)
  2. Hum bola perlu ada terus, atau hanya 2–3 detik setelah bola muncul lalu diam? (v1: terus selama bola ada)
  3. Perlu suara khusus saat jawaban **salah** Gojo (thud di bawah klip "kalah")? (v1: tidak)

---

## Log Eksekusi (2026-09-25, "coba dulu eksekusi tanpa kesalahan")

Dieksekusi penuh per task, TDD ketat, commit per task, **tanpa push**. Branch `feat/gojo-pack7-dummy`.

### Commit
| Task | Commit | Isi |
|---|---|---|
| 1 | `fa6b44a` | sfx tambahan (bola/riser/bar/collapse/cue) + refactor `playFanfare` → `playNotes` (DRY) |
| 2 | `aae9a53` | modul `gojoAmbience.js` (BGM + hum + duck), no-op di node |
| 3 | `2741ba1` | wiring `EffectContext.jsx` (suara bola/riser/tick/chime/collapse, BGM setelah settle, ducking) |
| 4 | `c2925be` | cue 六眼 di `GojoDomainCine.jsx` |
| 5 | `78adf2b` | DevPanel: 蒼 #1 / 赫 #2 + toggle tes BGM & hum |

### Hasil gates
- `npm test` → **204 pass / 0 fail** (193 → 204; +11 tes baru)
- `npm run lint` → exit 0
- `npm run build` → ✓ built in 6.08s

### Verifikasi browser (ground truth, Chromium via CDP)
- ✅ Cast dari `/settings` → settle ±5.7s → **BGM `bgm: true`** (osc node dibuat di t≈5796–5802ms, terlihat di log osilator)
- ✅ Bola: 蒼 #1 → `balls.ao: true` (hum +4 osc), 赫 #2 → `balls.aka: true` (+4 osc), 茈 #3 → hum padam + riser (+3 osc)
- ✅ E2E quiz asli: 20 benar → bar `READY` → **tap bar cast** → `無量空処` hidup + BGM nyala setelah settle → jawab **salah** → domain padam + **BGM mati** + `duckUntil` ter-set (duck aktif)
- ✅ Timeout alami (30s): domain padam, BGM mati, collapse `'timeout'` dibunyikan (osc di t≈35.8s)
- ✅ Toggle DevPanel (Tes BGM / Tes Hum Bola on-off) bekerja, **console 0 error**
- ✅ Quiz selesai (22/25, grade A) → bola 蒼→赫 akumulasi, 茈 meledak di streak 20 (hum padam saat ledakan)

### Catatan eksekusi (penting untuk implementer lain)
- **Cast dari Settings lalu navigasi = domain padam** — itu perilaku lama `Practice.jsx:115-118`
  (`endQuizSession()` saat unmount), **bukan regresi**. Jalur cast yang benar saat testing: **dari dalam quiz**.
- `previewStreak`/DevPanel hanya DEV; produksi tidak berubah.
- Debug hook `window.__gojoAmbience` ter-set setelah aksi audio pertama (butuh gesture user); sebelum itu `null`.
- Tes node tidak merender audio — semua pemutar di-guard `typeof window === 'undefined'` dan return 0/false.

### Status
Semua task plan selesai & terverifikasi. **Belum di-push** (aturan repo). Siap untuk review user / push manual.

---

## Tuning v2 (feedback user: "bgm gak kedengeran, dentuman kurang keras")

**Feedback:** bola 蒼/赫 sudah bagus (hum terus sampai meledak — dipertahankan); BGM 領域展開 terlalu pelan;
dentuman ryoiki kurang nendang.

**Diagnosis:** konten BGM v1 didominasi sub-bass 55–82.5Hz & dentuman sweep 92→28Hz. Speaker HP/laptop
tidak memutar sub-bass dengan baik → "hilang" di device asli. Fix = naikkan level + tambah konten mid.

**Commit:** `33b8b5a` — `tune(gojo): BGM lebih kedengaran & dentuman lebih nendang`.

| Perubahan | v1 | v2 |
|---|---|---|
| BGM `level` | 0.085 | **0.18** |
| BGM drone | `[55, 82.5]` | `[55, 110]` (110 = oktaf atas, audible di HP) |
| BGM pad | `[110, 165, 220]`, filter 420Hz | `[165, 220, 330]`, filter 900Hz, gain 0.42 |
| Boom cast `gain` | 0.34 | **0.5** |
| Boom cast `noiseGain` | 0.06 | **0.1** |
| Boom cast **punch mid** (BARU) | — | triangle **190Hz**, dur 0.22s, gain **0.26** |
| Boom bang `gain` | 0.5 | **0.62** |
| Boom bang **punch** | — | triangle **240Hz**, dur 0.28s, gain **0.34** |

**Tes:** `sfx.gojoAmbience.test.js` + `sfx.params.test.js` di-update (TDD: RED 3 gagal → GREEN).
**205 pass / 0 fail** (204 → 205), lint 0, build ✓ 13.31s.

**Verifikasi browser (ground truth):** semua frekuensi v2 terekam di scheduler audio —
`92` (sweep cast), `190` (punch cast), `55/110` (drone), `165/220/330` (pad), `900` (filter),
`240` (punch bang), `0.06` (LFO). Console 0 error, HP 390×844 tidak regresi, BGM hidup di HP.

**Kalau masih kurang keras / kebalikan:** tune 1–2 angka saja:
- BGM masih kurang → `domainBgmPlan().level` 0.18 → 0.22 (maks aman ~0.3 sebelum nutupin voice)
- Dentuman masih kurang → `domainBoomParams('cast').punchGain` 0.26 → 0.35 / `gain` 0.5 → 0.6
- Terlalu keras → turunkan dengan rasio yang sama.
