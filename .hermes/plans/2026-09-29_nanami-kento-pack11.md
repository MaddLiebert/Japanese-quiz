# Plan — Pack Nanami Kento (十劃呪法) `pack_11`

**Tanggal:** 2026-09-29 · **Rarity:** `rare` · **Visual baru:** `nanami` · **Voice:** `nanami`
**Spec kanon:** `obsidian-mind/brain/Efek JJK/Nanami Kento.md` (riset terverifikasi)
**Keputusan Nacht:** 1) mekanik ultimate **B · 瓦落瓦落・連鎖** 2) ladder **OK** 3) klip suara **TTS web — Nacht generate dulu**, eksekusi T5 nunggu klip

> ✅ **STATUS: SELESAI (30/09) — T1–T6 tuntas.** Commit: `ba0b824` (T1) · `5ef169b` (T2) · `5051736` (T3) · `4b470dd` (T4) · `61ce2ee` (T5) · `2026d73` (T6 fix). Belum push.
> **Temuan T6 (fix `2026d73`):** bug `osc.type='bandpass'` (nama tipe filter bocor ke OscillatorNode — Chrome warning tiap pemutaran). Ketangkap HANYA di verifikasi browser, lolos dari 687 unit test (pelajaran Nobara T6 terbukti lagi). Fix: `sanitizeOscType()` + 3 test baru → 690/690 pass.

---

## 🎯 Goal

Efek pack Nanami yang **berkarakter profesional & presisi** — garis rasio 7:3 yang "memilih" titik lemah, tebasan tepat di titik itu, puing yang menghantam, aura emas lembur — TANPA terasa template. Semua nilai (warna, timing, easing) punya alasan dari design tools.

---

## 📐 Design direction (dari ui-ux-pro-max — query & hasil tercatat)

| Query | Domain | Hasil / Keputusan |
|---|---|---|
| `"professional navy gold corporate trust"` | color | Token **Legal Services**: primary `#1E3A8A` (authority navy) + accent `#B45309` (trust gold) + foreground `#0F172A` + border `#CBD5E1` + destructive `#DC2626`. → Palet Nanami: **navy `#1E3A8A`** (suit) + **emas `#B45309`→`#F59E0B`** (aura lembur) + putih (flash) + `#DC2626` HANYA untuk 黒閃/kontrak batal |
| `"stagger reveal sequence"` | gsap | Stagger List: durasi 400–700ms, easing **`expo.out`**, stagger per-item **0.02–0.04s** (maks 0.1s); SplitText cuma headline pendek; **`prefers-reduced-motion` wajib** (matchMedia → render state akhir) |
| `"impact shake slash"` | gsap | **0 match** (dicatat; fallback token sesi Nobara): impact = `scale`+`shake` pendek, easing **`back.out`** (overshoot kecil = "kena") |
| `"timer countdown state progress indicator"` | ux | **Progress Indicators**: state multi-step wajib punya indikator jelas → **counter puing 瓦 + jam kecil** = indikator state lembur; focus states rule (visible focus ring) tetap dipatuhi |
| `"cut slice divider line"` | gsap | **0 match** (dicatat); garis 7:3 dianimasikan pakai token sendiri: tumbuh `power2.out` 220ms (presisi, bukan bounce) |

**Anti-slop checklist (beda dari Nobara — kenapa ini bukan template):**
1. ❌ Garis lurus statis → ✅ garis 7:3 **tumbuh dari tepi → berhenti di titik 7:3 → titik nyala → tebasan tepat DI titik itu** (tebasan "memilih", bukan acak)
2. ❌ Puing random berserakan → ✅ puing meluncur **radial dari titik hancur**, rotasi searah luncuran (fisika dasar)
3. ❌ Aura emas = glow gradient biasa → ✅ aura = **partikel naik bergelombang (sin) + distorsi panas tipis**, bukan glow statis
4. ❌ Semua elemen bareng → ✅ stagger: garis 0ms → titik 120ms → tebasan 200ms → percikan 280ms → puing 360ms

**3 lapis tiap efek (wajib):**
1. **Core** — putih `#ffffff` flash tipis 60–80ms di titik 7:3
2. **Body** — emas `#F59E0B` / `#B45309` (tebasan, aura, percikan)
3. **Edge** — navy `#1E3A8A` gelap → transparan (bayangan garis, sisa); 黒閃 = hitam `#0a0a0a` + merah `#DC2626`

**Bentuk:**
- **Garis 7:3** = garis presisi + notch rasio kecil di titik 7 (tanda "7:3") — presisi = identitas
- **Tebasan** = polygon tipis tajam (bukan blur)
- **Puing** = poligon tak beraturan, rotasi searah luncuran
- **Aura** = partikel vertikal naik + gelombang sinus
- **Jam** = lingkaran 2 jarum (motif waktu — ultah 7/3, stress 残業)

---

## 🎨 Bahasa visual: 7:3 と黄金 (shichisan to ougon — garis rasio & emas)

Beda total dari yang lain: Gojo (plasma/ruang) · Yuji (api) · Sukuna (tebasan/kuil) · Megumi (bayangan) · Nobara (paku & ledakan) · **Nanami = garis rasio presisi + puing + aura emas korporat**.

---

## ⚔️ Ladder (FINAL)

| Streak | Jurus | Visual (3 lapis + stagger) | SFX (≥2 lapis) |
|---|---|---|---|
| non-streak (rotasi) | **七三** (shichisan) | garis 7:3 tumbuh melintang → titik 7:3 nyala → tebasan presisi + flash putih + 2 percikan emas | `playRatioSlash` → `playCriticalDing` |
| non-streak (rotasi) | **大鉈** (oonata) | siluet golok ber-呪符 menyapu dari samping → goresan lebar + 呪符 berterbangan | `playOonataSweep` → `playJufuFlutter` |
| **10** | **瓦落瓦落** (garagara) | dinding retak di belakang kartu → meledak → **puing meluncur radial menghantam kartu** + debu | `playWallCrack` → `playRubbleCrash` |
| **20** | **黒閃** (kokusen) | distorsi hitam di titik 7:3 → ledakan hitam-merah + retakan + kilat hitam | `playKokusenThunder` + `playKokusenCrackle` (reuse) |
| **30** | **時間外労働** (jikangai) | dasi mulai lepas + **jam berdetak** + aura emas tipis naik + kerah terbuka | `playTieSnap` + `playWatchTick` + `playOvertimeRiser` |
| **bar penuh → tap** | **時間外労働・全開** (zenkai) | §Ultimate | `playOvertimeChant` + `playDomainBoom` |

**Rotasi non-streak** = `nanamiNonStreakIndex(streak)` deterministik (pola `megumiNonStreakIndex` / `nobaraNonStreakIndex`).

---

## 🕐 Ultimate — 時間外労働・全開 + mekanik 瓦落瓦落・連鎖

**Trigger:** bar 20 slot penuh → tap.

**Cinematic (~2.4s, sekali jalan lalu masuk state):**

| t | Kejadian | Detail |
|---|---|---|
| 0ms | Veil | layar turun ke 25% brightness, 200ms |
| 150ms | Jam dilihat | motif jam muncul, 2 jarum berputar cepat → `playWatchTick` |
| 400ms | Dasi lepas | animasi dasi lepas + kain berkibar → `playTieSnap` |
| 700ms | Kanji quote | 「残念ですがここからは時間外労働です」 per-frasa, glow emas |
| 1400ms | Aura meledak | partikel emas naik bergelombang dari bawah + distorsi panas → `playOvertimeRiser` |
| 1800ms | Garis raksasa | garis 7:3 melintang SELURUH layar, titik nyala |
| 2400ms | Settle | masuk **state lembur 30 dtk** + counter puing 瓦 muncul |

**State 30 dtk (pola `rare` — timer JALAN, jam kecil di pojok):**

**Mekanik 瓦落瓦落・連鎖 (FINAL — pilihan B):**
- **Benar selama state → +1 puing** (cap `NANAMI_RUBBLE_MAX = 3`); puing ditumpuk di dekat bar (visual 瓦 ×N).
- **Soal berikutnya → puing dihabiskan:** tiap puing menghancurkan **1 opsi salah** (animasi puing menghantam opsi). `min(puing, salah − 1)` — **selalu sisakan ≥1 opsi salah** (gak pernah auto-benar).
  - 1 benar → soal berikut 1 opsi salah hancur; 2 benar beruntun → 2 opsi hancur (soal 4 opsi → sisa 2).
- **SALAH selama state → kontrak batal (縛り破棄):** state bubar + puing rontok + aura padam + **streak hangus** (normal) + kanji 「残念ですが…」 redup. SFX `playContractBreak`.
- **Timeout** → padam alami, streak tetap, puing reset.

> **Filosofi: KERJA BERBUAH** — hasil kerja benar menghancurkan rintangan berikutnya; salah = kontrak putus. Beda dari Megumi (適応: salah → cut, tahan) dan Nobara (one-shot). Nanami = **earned advantage + risiko hangus**.

---

## 🧩 Arsitektur file

| File | Isi | Test |
|---|---|---|
| `src/features/effects/nanamiFx.js` (BARU) | Generator murni: `nanamiRatioLine()`, `nanamiRubble()`, `nanamiAura()`, `nanamiCracks()`, `nanamiTechniqueFor(kind, streak)`, `nanamiNonStreakIndex()`, `nanamiRubbleCut(options, correctId, piles)`, konstanta (`NANAMI_MILESTONES`, `NANAMI_LADDER`, `NANAMI_TOP=30`, `NANAMI_ULT_THRESHOLD=20`, `NANAMI_OVERTIME_S=30`, `NANAMI_RUBBLE_MAX=3`, `NANAMI_ULT_MIN_WRONG=1`, `NANAMI_TIMELINE`, `NANAMI_COLORS`) | `nanamiFx.test.js` — determinisme (`deepEqual(gen(x), gen(x))`), ladder mapping, cut logic (sisakan min 1 salah), timeline |
| `src/features/effects/NanamiBurst.jsx` (BARU) | Komponen: `Shichisan`, `Oonata`, `Garagara`, `Kokusen`, `Jikangai`, `NanamiUltimate`, `TechKanji` | — (smoke-test browser) |
| `src/features/effects/NanamiShadow.jsx` (BARU) | Bar 呪力 + cinematic cast + state lembur (counter 瓦 + jam) | — |
| `src/features/audio/voices.js` (EDIT) | `nanami` → pola `clips` (5–6 klip) + `wrong` 3 | `voices.test.js` update |
| `src/features/effects/visuals.js` + `packs.js` (EDIT) | `nanami` registry + `pack_11` visual `'nanami'` | `visuals.test.js`, `packs.test.js` |
| `src/features/effects/EffectContext.jsx` (EDIT) | Jalur `'nanami'`: `triggerNanami`, `castNanamiUlt`, `setNanamiQuizOptions`, state puing, kontrak batal | — |
| `src/utils/sfx.js` (EDIT) | ~10 SFX baru | `sfx.routing.test.js` |
| `src/features/dev/reviewClips.test.js` (EDIT) | Nanami pindah dari grup generik ke pola clips | — |

---

## 📋 Tahapan eksekusi (TDD, commit per tahap)

### T1 — `nanamiFx.js` (logika murni) + test
- Konstanta + ladder + rotasi + **cut logic puing** + timeline cast
- Generator deterministik (seed tetap, tanpa rng)
- **RED:** test dulu → **GREEN:** implement

### T2 — `NanamiBurst.jsx` + `NanamiShadow.jsx` visual + wiring dasar
- 5 komponen skill + bar 呪力 + `TechKanji`
- Stage anchor pola Megumi (`useStageAnchor`) — **efek gak boleh nutupin soal/tombol**
- `prefers-reduced-motion` → state akhir langsung
- Wiring: `visuals.js` + `packs.js` + `EffectContext.jsx` jalur `'nanami'`

### T3 — Ultimate 時間外労働・全開 (cinematic + mekanik 連鎖)
- Komponen `NanamiUltimate` — timeline §Ultimate
- Mekanik: puing nambah saat benar, cut saat soal baru, kontrak batal saat salah
- Test: cut logic + state transitions

### T4 — SFX (~10 fungsi)
- `playRatioSlash` · `playCriticalDing` · `playOonataSweep` · `playJufuFlutter` · `playWallCrack` · `playRubbleCrash` · `playTieSnap` · `playWatchTick` · `playOvertimeRiser` · `playContractBreak`
- Reuse: `playKokusenThunder`, `playKokusenCrackle`, `playDomainBoom`, `playChainBurst`
- Test routing: tiap fungsi ada & fallback aman

### T5 — Klip suara + registry ✅ SELESAI (`61ce2ee`)
- ✅ Klip dari Nacht terpasang di `public/voices/nanami/`: `shichisan.mp3`, `oonata.mp3`, `garagara.mp3`, `kokusen.mp3`, `jikangai.mp3` + `wrong_1..3.mp3`
- ✅ Verifikasi isi klip via **faster-whisper STT** (8/8 cocok — bukan tebak) + lead-silence terukur via PyAV (0.10–0.38s)
- ✅ `voices.js` pola `clips` + backup placeholder lama → `.voice-backup/nanami-placeholder/`
- ✅ `reviewClips.test.js` + `sfx.nanami.test.js` + `voices.test.js` diupdate

### T6 — Polish + verifikasi browser ✅ SELESAI (`2026d73`)
- ✅ Verifikasi live via Chrome CDP (headless + websockets, helper `.hermes/_cdp.py`):
  - Bar 呪力 0→20/20 (label 時間外労働), cast tap → cinematic penuh (veil/jam/dasi/quote/garis 7:3/kanji)
  - State lembur: aura ON ≈3.0s → OFF ≈33.3s (2.4s cinematic + 0.3s settle + 30s) — sesuai spec
  - Mekanik 連鎖: benar → 瓦 ×1 (cut `hira_ki` disabled) → ×2 → ×3 cap; salah → kontrak batal (0/20, aura & puing reset)
  - Bounding box: bar di tepi kanan (x=1119), 0 overlap dgn opsi, `pointer-events:none`; topmost di opsi = opsi itu sendiri
  - Reduced-motion: veil/partikel di-skip, kanji/jam/counter tetap, countdown jalan (30s→27s)
- ✅ **Bug ketangkap & difix**: `osc.type='bandpass'` (playJufuFlutter + sweepNoise path) → `sanitizeOscType()`; verified 0 warning setelah reload
- ✅ `npm test` 690/690 · lint 0 error (26 pre-existing) · build OK
- ✅ Spec Obsidian diupdate → status SELESAI
- **Commit per tahap — JANGAN push** ✅ (6 commit lokal)

---

## ⚠️ Risiko & aturan

1. **Jangan nabrak jalur lain** — Gojo/Yuji/Sukuna/Megumi/Nobara punya wiring sendiri; jalur `'nanami'` terpisah bersih.
2. **`rare` = state 30 dtk** (pola Megumi) — timer JALAN; TAPI mekanik beda: Megumi bertahan (salah → cut), Nanami menyerang-ekonomis (benar → cut, salah → bubar).
3. **Efek gak boleh nutupin soal** — pelajaran Megumi v2.5: efek di sayap soal, gap 12px, clip dalam band aman.
4. **Determinisme** — semua generator pakai `(seed)` tetap.
5. **Reduced motion** — wajib; render state akhir, skip shake/flash/veil.
6. **Aset suara** — sampai klip Nacht ada, fallback synth otomatis (sudah ada).
7. **Pelajaran Nobara T6** — verifikasi browser WAJIB (2 bug lolos dari 647 unit test); cek import SFX + atribut `data-*` yang dibaca komponen marker.

---

## 📎 Referensi
- Spec kanon: `obsidian-mind/brain/Efek JJK/Nanami Kento.md`
- Pola struktur: `MegumiBurst.jsx` + `megumiFx.js` (rare, state) · `NobaraBurst.jsx` + `nobaraFx.js` (paling baru)
- Design tools: ui-ux-pro-max (queries tercatat di §Design direction)
