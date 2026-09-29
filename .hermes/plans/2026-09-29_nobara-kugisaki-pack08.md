# Plan — Pack Nobara Kugisaki (芻霊呪法) `pack_08`

**Tanggal:** 2026-09-29 · **Rarity:** `common` · **Visual baru:** `nobara` · **Voice:** `nobara`
**Spec kanon:** `obsidian-mind/brain/Efek JJK/Nobara.md` (riset terverifikasi)
**Keputusan Nacht:** 1) mekanik ultimate **A · 全弾爆発** 2) ladder **OK** 3) klip suara **TTS web** 4) **efek jangan slop — pakai design tools**

> ✅ **STATUS: SELESAI** (2026-09-29). Commit: `73fba0b` (T1) · `8f49e00` (T2+T3) · `0c381b6` (T4) · `65ad809` (T5) · `7447048` (test) · `ea55753` (fix T6).
> 647 tes pass · 0 lint error · build sukses · **belum di-push** (origin tetap `1d176ba`).
> Verifikasi browser: hit `kanzashi/ren/jigen/tomonari/kokusen/wrong` ✓ · ultimate 全弾爆発 cut 2 opsi + marker ✓ · bar 20/20 ✓ · 0 console error.
> Temuan T6: (1) `playStrawRustle` belum di-import di EffectContext (jalur salah error) (2) `data-option-id` belum di-set → `NobaraCutMarker` tak pernah render. Keduanya fixed di `ea55753`.

---

## 🎯 Goal

Bikin efek pack Nobara yang **berkarakter** — paku melesat, menancap, meledak, retakan menjalar — TANPA terasa seperti "template efek". Semua nilai visual (warna, timing, easing, partikel) punya alasan, bukan angka random.

---

## 📐 Design direction (dari ui-ux-pro-max)

Query yang dipakai & hasilnya:

| Query | Domain | Keputusan yang diambil |
|---|---|---|
| `"animation duration easing reduced motion"` | ux | **Motion tokens per-elemen** (bukan satu durasi untuk semua). Feedback jawaban = 150-300ms (responsif); cinematic ultimate = 1.8-2.4s (boleh lambat karena momen). **Wajib `prefers-reduced-motion`** → render state akhir, skip shake/flash |
| `"impact hit punch scale shake"` | gsap | Impact = `scale` + `shake` singkat, easing **`back.out`** (overshoot kecil = "kena"), bukan `ease-in-out` (itu bikin lembek) |
| `"fire explosion orange red energy"` | color | Palet: **`#f97316`** (oranye utama) + **`#fb923c`** (oranye terang/highlight) + **`#dc2626`** (merah dalam) + **`#0f172a`** (gelap, dari On-Primary) — dipakai konsisten di SEMUA elemen, bukan tebak-tebakan |
| Aturan UX yang wajib dipatuhi | ux | **"Animate 1-2 key elements per view maximum"** — ledakan = 1 elemen utama (paku+burs), retakan = pendukung; JANGAN semua elemen goyang bareng. **"Continuous animation = loading only"** — retakan/glow harus punya akhir, bukan loop |

**Anti-slop checklist (kenapa efek lama "slop"):**
1. ❌ Satu easing untuk semua elemen → ✅ beda easing per peran (masuk: `back.out`, keluar: `power2.in`, retakan: `power1.out`)
2. ❌ Semua elemen animasi bareng → ✅ **stagger**: paku 1→5 jeda 60-90ms, ledakan nyusul, retakan terakhir
3. ❌ Partikel random tanpa arah → ✅ **arah keluar dari titik tancap** (radial, konsisten)
4. ❌ Warna flat satu tone → ✅ 3 lapis: core putih-panas → oranye → merah gelap di tepi

---

## 🎨 Bahasa visual: 釘と爆発 (kugi to bakuhatsu — paku & ledakan)

**Tiga lapis tiap efek (wajib):**
1. **Core** — putih-kuning panas `#fef3c7`, kecil, sebentar (80ms) = titik impact
2. **Body** — oranye `#f97316` / `#fb923c`, bentuk utama (burs, percikan)
3. **Edge** — merah `#dc2626` → transparan, tepi luar (retakan, sisa panas)

**Bentuk:**
- **Paku (釘)** = garis tebal pendek miring (bukan titik) — biar kebaca "tertancap"
- **Ledakan (爆発)** = burs bersudut (polygon bergerigi, bukan lingkaran halus — lingkaran = slop)
- **Retakan** = polyline bercabang 2-3, sudut tajam, makin tipis makin jauh
- **Resonansi** = riak elips (khas suara/dampak getaran), bukan lingkaran penuh

---

## ⚔️ Ladder (FINAL)

| Streak | Jurus | Visual (3 lapis + stagger) | SFX (≥2 lapis) |
|---|---|---|---|
| non-streak (rotasi) | **簪** (kanzashi) | 1 paku melesat diagonal → tancap → core flash 80ms → burs oranye + 2 retakan pendek | `playNailShot` (swish) → `playNailBurst` (burst) |
| non-streak (rotasi) | **簪・連** (kanzashi-ren) | 3 paku stagger 70ms, masing-masing burs kecil, retakan menyambung antar tancapan | `playNailShot`×3 (pitch naik) → `playChainBurst` |
| **10** | **簪・時限** (kanzashi-jigen) | 5 paku tancap dulu (jeda 350ms, cuma "tuk" + paku getar) → SEMUA meledak serentak + shake 250ms + retakan besar | `playNailThud`×5 → `playChainBurst` (big) |
| **20** | **共鳴り** (tomonari) | boneka jerami muncul tepi (fade+slide) → palu naik → HANTAM → riak resonansi elips menjalar dari boneka ke kartu + retakan merah tipis di jalur riak | `playHammerStrike` (whack) + `playResonanceWave` (sine sweep) |
| **30+** | **黒閃** (kokusen) | layar dim 120ms → garis merah tipis (flash frame) → burs BESAR putih→oranye→merah + retakan hitam + shake kuat 400ms + afterimage | `playBlackFlash` (bass drop) + `playBoomBig` |
| **ultimate** | **共鳴り・魂** (tomonari tamashii) | §Ultimate di bawah | `playHammerStrike` + `playResonanceWave` + `playBoomBig` |

**Pola rotasi non-streak** = `nobaraNonStreakIndex(streak)` sama seperti Megumi (`megumiNonStreakIndex`) — deterministik, bukan random.

---

## 🌟 Ultimate — 全弾爆発 (zendan bakuhatsu — semua meledak)

**Trigger:** bar 20 slot penuh → tap.

**Timeline (total ~2.2s, sekali jalan — BUKAN state):**

| t | Kejadian | Detail |
|---|---|---|
| 0ms | Veil gelap | layar turun ke 25% brightness, 200ms |
| 150ms | Paku bermunculan | 12 paku muncul dari tepi layar (stagger 40ms), arah nuju kartu jawaban |
| 500ms | Semua tancap | "tuk" serentak + paku getar 80ms |
| 650ms | Core flash | putih penuh 60ms (1 frame) |
| 700ms | **LEDAKAN BESAR** | burs utama + 8 percikan radial + retakan besar menyebar + shake 350ms |
| 1000ms | Opsi salah meledak | tiap opsi salah dapat burs kecil (stagger 80ms) → **terhapus dari DOM** |
| 1600ms | Kanji 共鳴り・魂 | muncul atas-tengah, glow, 600ms |
| 2200ms | Settle | veil naik, sisa retakan pudar 400ms |

**Mekanik:** semua opsi salah **terhapus** dari soal saat itu (soal langsung jadi 1 pilihan = auto jawab benar? **TIDAK** — minimal 2 opsi tersisa; kalau soal cuma 4 opsi, sisa 1 benar + 1 salah terakhir tetap ada. **Keputusan:** hapus `min(3, salah - 1)` opsi salah, sisakan 1 opsi salah biar user tetap harus mikir).

**Wajib:** ini **one-shot** — no state, no timer, no mekanik lanjutan. Balik ke quiz normal setelah settle.

---

## 🧩 Arsitektur file

| File | Isi | Test |
|---|---|---|
| `src/features/effects/nobaraFx.js` (BARU) | Generator murni: `nobaraNails()`, `nobaraBurst()`, `nobaraCracks()`, `nobaraRipple()`, `nobaraStrawDoll()`, `nobaraTechniqueFor(kind, streak)`, `nobaraNonStreakIndex()`, `NOBARA_MILESTONES`, `NOBARA_LADDER`, `NOBARA_COLORS` | `nobaraFx.test.js` — determinisme (`deepEqual(gen(x), gen(x))`), ladder mapping, milestone |
| `src/features/effects/NobaraBurst.jsx` (BARU) | Komponen visual: `Kanzashi`, `KanzashiRen`, `KanzashiJigen`, `Tomonari`, `Kokusen`, `NobaraUltimate`, `TechKanji` | — (visual, di-smoke-test browser) |
| `src/features/audio/voices.js` (EDIT) | `nobara` → pola `clips` (kanzashi/tomonari/kokusen) + `wrong` 3 | `voices.test.js` update |
| `src/features/effects/visuals.js` (EDIT) | `nobara: { id:'nobara', label:'Nobara Straw Doll', component:'nobara' }` | `visuals.test.js` |
| `src/features/packs/packs.js` (EDIT) | `pack_08` → `visual: 'nobara'` | `packs.test.js` (jumlah ready) |
| `src/features/effects/EffectContext.jsx` (EDIT) | Jalur `'nobara'`: trigger, ultimate cast, opsi cut | — |
| `src/utils/sfx.js` (EDIT) | 8 SFX baru | `sfx.routing.test.js` |
| `src/features/dev/reviewClips.test.js` (EDIT) | Nobara pindah dari grup "3 klip generik" ke pola clips | — |

---

## 📋 Tahapan eksekusi (TDD, commit per tahap)

### T1 — `nobaraFx.js` (logika murni) + test
- `NOBARA_MILESTONES = [3,5,10,20,30,40,50,60,70,80,90,100]` (sama pola Megumi)
- `NOBARA_LADDER = { 10:'jigen', 20:'tomonari' }`, `NOBARA_TOP = 30` (kokusen)
- `nobaraTechniqueFor(kind, streak)` — kind: `'correct'|'wrong'`, mapping sama pola `megumiTechniqueFor`
- Generator deterministik: `nobaraNails(seed, count)`, `nobaraBurst(seed, size)`, `nobaraCracks(seed, count)`, `nobaraRipple(seed)`, `nobaraStrawDoll(seed)`
- **RED:** tulis test dulu (determinisme + ladder) → **GREEN:** implement

### T2 — `NobaraBurst.jsx` visual + wiring dasar
- 5 komponen skill + `TechKanji` (warisan pola Megumi, kanji + kana di komentar)
- Stage anchor: baca rect soal live (pola `useStageAnchor` Megumi) — **efek gak boleh nutupin soal/tombol**
- `prefers-reduced-motion` → state akhir langsung
- Wiring di `EffectContext.jsx` + `visuals.js` + `packs.js` (`visual:'nobara'`)

### T3 — Ultimate 全弾爆発 (cinematic + mekanik cut)
- Komponen `NobaraUltimate` — timeline §Ultimate
- Mekanik: hapus opsi salah saat cast (`nobaraUltimateCut(options, correctId)`)
- Test: cut function (sisakan min 1 salah) + timeline konstanta

### T4 — SFX 8 fungsi + ambience (opsional ringan)
- `playNailShot` · `playNailThud` · `playNailBurst` · `playChainBurst` · `playHammerStrike` · `playResonanceWave` · `playBlackFlash` · `playStrawRustle`
- Test routing: tiap fungsi ada & fallback aman

### T5 — Klip suara TTS web (aset dari Nacht) + registry
- Nacht generate klip → taruh `public/voices/nobara/` (nama: `kanzashi.mp3`, `tomonari.mp3`, `kokusen.mp3`, `wrong_1..3.mp3`)
- `voices.js` pola `clips` + backup placeholder lama ke `.voice-backup/nobara-placeholder/`
- Update `reviewClips.test.js`

### T6 — Polish + verifikasi
- Cek tiap skill di browser (HP 390×844): posisi, gak nutupin UI, timing
- `npm test` · `npm run lint` · `npm run build`
- Update spec Obsidian `Nobara.md` → status EKSEKUSI SELESAI
- **Commit per tahap** (T1..T6) — **JANGAN push** sampai Nacht bilang

---

## ⚠️ Risiko & aturan

1. **Jangan nabrak jalur lain** — Gojo/Yuji/Sukuna/Megumi punya wiring sendiri di EffectContext; jalur `'nobara'` harus terpisah bersih.
2. **`common` = paling ringan** — ultimate one-shot TANPA state/timer. Kalau nanti kerasa kurang, naikkan ke `rare` (tapi rarity pack_08 = common, jangan diubah sembarangan — gacha weight).
3. **Efek gak boleh nutupin soal** — pelajaran dari Megumi v2.5: hewan/efek di sayap soal, gap 12px, clip dalam band aman. Paku+ledakan harus tunduk aturan yang sama.
4. **Determinisme** — semua generator pakai `(seed)` tetap, tanpa `rng()`.
5. **Reduced motion** — wajib; render state akhir, skip shake/flash/veil.
6. **Aset suara** — sampai Nacht kasih klip, fallback synth gong/thud otomatis (sudah ada).
7. **Jangan commit sebelum Nacht bilang** (kecuali commit per tahap yang memang diminta).

---

## 📎 Referensi
- Spec kanon: `obsidian-mind/brain/Efek JJK/Nobara.md`
- Pola struktur: `MegumiBurst.jsx` + `megumiFx.js` (rare, state) · `SukunaBurst.jsx` (special, domain)
- Design tools: ui-ux-pro-max (queries tercatat di §Design direction)
