# Plan — Pack Toji Fushiguro (天与呪縛・術師殺し) `pack_13`

**Tanggal:** 2026-09-30 · **Rarity:** `legendary` · **Visual baru:** `toji` · **Voice:** `toji`
**Spec kanon:** `obsidian-mind/brain/Efek JJK/Toji.md` (riset terverifikasi + kana)
**Aset distage:** `C:\\Users\\maddo\\Downloads\\toji\\cuts\\` (README.txt + manifest.txt)

> ✅ **STATUS: SELESAI (30/09) — T1–T6 tuntas.** Commit: `8145c24` (T1) · `8195bfe` (T2) · `d3e7ae5` (T3) · `f24a64b` (T4) · `d1b820a` (T5) · `0cc60a2` (T6). Belum push.
> **Verifikasi T6 (browser CDP):** bar 0→20 → cast → cinematic penuh (veil/武器庫呪霊/cabut pedang/quote/tebasan X) → state 一撃離脱 30 dtk (timer 30→18s) → amunisi ×0→×1 → KILL 術師殺し (4 tombol data-toji-kill + auto-skip Q22→Q23) → bounding box 0 overlap → reduced-motion → 0 console error. GIF kalah mounted 8/8 (naturalW 220).
> **Bonus T3 — 3 latent bug ditemukan via `oxlint --deny no-undef` & difix:** `isNanamiCut` ×4 (Practice — regresi Nanami T3), `SUKUNA_SKILL_COOLDOWN` (import hilang EC), `TOJI_WORM` (import hilang TojiShadow).
> **Final:** 743/743 test · lint 0 error · build OK.

---

## 🎯 Goal

Pack **legendary pertama dengan state ultimate TANPA Domain** — identitas **baja dingin (冷たい鋼)**:
satu-satunya pack yang **TIDAK ADA GLOW 呪力** (呪力ゼロ). Efek fisik: kilau bilah, rantai, debu, darah.

---

## ⚔️ Ladder (usul FINAL — konfirmasi Nacht)

| Streak | Jurus | Visual (≥2 lapis) | SFX (≥2 lapis) |
|---|---|---|---|
| non-streak (rotasi) | **釈魂刀** (しゃっこんとう) | kilau bilah diagonal → flash putih 1 frame → opsi terbelah 2 (soul-cut): belahan putih baja + tepi hitam + 2 percikan | `playSteelRing` + `playSoulSplit` |
| non-streak (rotasi) | **万里ノ鎖** (ばんりのくさり) | rantai masuk dari luar layar → nyangkut di opsi yang dipencet → DISERET keluar + debu + goresan lantai | `playChainRattle` + `playChainYank` |
| **10** | **天逆鉾** (あまのさかほこ) | belati ditusukkan ke kartu soal → gelombang pembatalan (kartu desaturasi 0,4 dtk) → bilah ditarik + pecahan | `playSpearPierce` + `playTechniqueCancel` |
| **20** | **遊雲** (ゆううん) | tongkat 3 ruas berputar menyapu seluruh grid opsi (arc baja lebar) → shockwave + debu + tepi retak | `playStaffWhirl` + `playBoneCrunch` |
| **30** | **武器庫呪霊** (ぶきこじゅれい) | 呪霊 ulat melintas → memuntahkan senjata (rotasi deterministik: 大鉈→槍→刀→銃) → hantam tombol + bayangan | `playInventoryGrowl` + `playWeaponEject` |
| **bar penuh → tap** | **天与呪縛・全開** (てんよじゅばく・ぜんかい) | §Ultimate | `playTojiChant` + `playDomainBoom('cast')` |

Rotasi non-streak = `tojiNonStreakIndex(streak)` deterministik (pola `nanamiNonStreakIndex`).

## 🕐 Ultimate — bar 20 → tap · state 30 dtk (timer JALAN)

**Cinematic (~4 dtk — sinkron cast.mp3 4,54 dtk, quote per-frasa):** veil hitam → hening (angin berhenti — 呪力ゼロ) → 武器庫呪霊 masuk dari tepi,
mulut menganga → tangan masuk & mencabut 釈魂刀 (kilau baja) → quote 「禪院じゃねぇのか」「よかったな」
per-frasa (merah darah, TANPA glow — hard text) → tebasan silang X seluruh layar + shake + debu →
settle: state 30 dtk + rail amunisi + counter.

**Mekanik FINAL — A · 武器庫・一撃離脱 (ぶきこ・いちげきりだつ):**
- Benar selama state → **+1 amunisi** di rail (cap `TOJI_AMMO_MAX = 3`).
- Salah → **bayar 1 amunisi**: soal itu "dibunuh" (skip ke soal berikutnya, streak AMAN, tanpa XP).
- Salah saat amunisi 0 → salah biasa (streak hangus) + state bubar. Timeout = sama seperti salah.
- *Filosofi: PERSIAPAN — kesalahan dibayar dengan hasil kerja benar sebelumnya.*
- Ammo helper: `tojiAmmoSpend(ammo)` / `tojiAmmoGain(ammo)` — dipakai EffectContext; beda dari Nanami
  (puing menghancurkan opsi salah di soal berikutnya), Toji **melewati soal** pakai amunisi.

**Ambience:** tanpa BGM (呪力ゼロ) — angin tipis + langkah; **bukan** drone/taiko (itu Sukuna).

---

## 🧩 Arsitektur file

| File | Isi | Test |
|---|---|---|
| `src/features/effects/tojiFx.js` (BARU) | generator murni: `tojiTechniqueFor`, `tojiNonStreakIndex`, `tojiBlade()`, `tojiChain()`, `tojiSoulSplit()`, `tojiWorm()`, `tojiCutOptions(options, correctId, ammo)` (mekanik A), `TOJI_TIMELINE`, `TOJI_COLORS`, konstanta (milestones 10/20/30, threshold 20, durasi 30, cap amunisi 3) | `tojiFx.test.js` — determinisme, ladder, cut/ammo logic, timeline |
| `src/features/effects/TojiBurst.jsx` (BARU) | 5 komponen skill + `TojiUltimate` + `TechKanji` | — (smoke browser) |
| `src/features/effects/TojiShadow.jsx` (BARU) | bar 呪力 + cinematic + state + rail amunisi + counter | — |
| `src/features/audio/voices.js` (EDIT) | `toji` → pola `clips` (5 jurus) + `wrong` 3; `correct`/`streak` = [] | `voices.test.js` update |
| `src/features/effects/visuals.js` + `packs.js` (EDIT) | visual `'toji'` (pack_13 ganti `dummy` → `toji`) | `visuals.test.js`, `packs.test.js` |
| `src/features/effects/EffectContext.jsx` (EDIT) | jalur `'toji'`: `triggerToji`, `castTojiUlt`, `setTojiQuizOptions`, state amunisi, mekanik | — |
| `src/features/effects/tojiGifs.js` (BARU) | 2 GIF kalah + durasi loop terukur + hold | `tojiGifs.test.js` |
| `src/utils/sfx.js` (EDIT) | ~10 SFX baru (§SFX spec) + layer registry ≥2/lapisan | `sfx.routing.test.js` |
| `src/features/dev/reviewClips.test.js` (EDIT) | Toji pindah dari grup generik → pola clips | — |

## 📋 Tahapan eksekusi (TDD, commit per tahap)

### T1 — `tojiFx.js` + test
Konstanta + ladder + rotasi + generator deterministik (blade/chain/soulSplit/worm — TANPA rng) +
cut/ammo logic + timeline cast. **RED → GREEN.**

### T2 — `TojiBurst.jsx` + `TojiShadow.jsx` + wiring dasar
5 komponen skill + bar + `TechKanji`; stage anchor pola Megumi (`useStageAnchor`) — efek sayap soal,
gap ≥12px, TIDAK nutupin soal/tombol; `prefers-reduced-motion` → state akhir.
Wiring: `visuals.js` + `packs.js` + jalur `'toji'` di `EffectContext.jsx`.

### T3 — Ultimate 天与呪縛・全開 (cinematic + mekanik A)
Timeline §Ultimate; mekanik **A · 武器庫・一撃離脱** (rail amunisi + skip soal saat salah);
test state transitions + ammo logic (gain cap 3, spend skip, spend di 0 → bubar).

### T4 — SFX (~11 fungsi)
`playSteelRing` · `playSoulSplit` · `playChainRattle` · `playChainYank` · `playSpearPierce` ·
`playTechniqueCancel` · `playStaffWhirl` · `playBoneCrunch` · `playInventoryGrowl` ·
`playWeaponEject` · `playTojiChant`. Reuse: `playSlash(heavy)`, `playBlackSpark`,
`playKokusenCrackle`, `playDomainBoom`, `playDomainCollapse`, `playCurseTick`, `playCurseReady`,
`playChainBurst`, `playNailThud`. Layer registry ≥2 per jurus.

### T5 — Klip suara + registry
- Copy set FINAL dari `Downloads/toji/cuts/final/` → `public/voices/toji/` (nama sudah final:
  `shakkontou` `banri_no_kusari` `amanosakahoko` `yuuyun` `bukiko_jurei` + `wrong_1..3` + `cast`)
- `git mv` placeholder lama → `.voice-backup/toji-placeholder/` + commit backup
- `voices.js` pola clips; `reviewClips.test.js` + `voices.test.js` + `sfx.toji.test.js`
- Verifikasi: STT ulang (sudah dilakukan di staging — 8/8) + ukur lead-silence via PyAV

### T6 — Polish + verifikasi browser (WAJIB — pelajaran Nobara/Nanami)
Chrome CDP (`references/effect-browser-smoke.md` + helper `.hermes/_cdp.py`):
bar 0→20 → cast → cinematic penuh → state 30 dtk timing → mekanik (rail amunisi / cut) →
bounding box (bar di tepi, 0 overlap opsi) → reduced-motion → 0 console error.
Audit import `EffectContext` SEBELUM smoke (grep export fx/sfx/ambience).
`npm test` penuh + lint 0 error + build. Update spec Obsidian → status SELESAI.

---

## ⚠️ Risiko & aturan
1. Jangan nabrak jalur pack lain — jalur `'toji'` terpisah bersih.
2. **TANPA glow 呪力** (identitas #1) — semua efek fisik: baja/rantai/debu/darah.
3. Efek gak boleh nutupin soal (pelajaran Megumi v2.5): sayap soal, gap 12px, clip dalam band aman.
4. Determinisme — semua generator `(seed)` tetap; TANPA rng.
5. Reduced motion wajib.
6. Aset suara — sampai klip masuk repo, fallback synth otomatis.
7. Klip `問題なし` vs `問題です` (QC STT) — cek audisi Nacht sebelum final; konteks kanon tetap 「全て、問題なし」.
8. Commit per tahap, JANGAN push.

## 📎 Referensi
- Spec kanon: `obsidian-mind/brain/Efek JJK/Toji.md`
- Pola struktur: `nanamiFx.js` (state 30 dtk + cut options + registry clips — paling baru) ·
  `megumiFx.js` (state + adapt) · `NobaraBurst.jsx` (one-shot, layout)
- Aset: `Downloads/toji/cuts/README.txt` + `manifest.txt` · GIF di `Downloads/toji/`
- Design tokens: tercatat di spec §Identitas visual (Photography Studio + silver + back.out/expo.out)
