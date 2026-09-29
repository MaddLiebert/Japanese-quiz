# Redesign efek Sukuna (kritik user 28/09, sesi 2)

Sumber kritik (verbatim ringkas):
1. **Logic ladder salah**: 蜘蛛の糸 & 鵺 dipakai di streak 1–19 → tiap jawaban benar terus muncul, membosankan.
   → 蜘蛛の糸 & 鵺 = **NON-STREAK** (cuma streak 1–2 / tepat milestone kecil), jangan tiap jawaban.
2. **蜘蛛の糸** = jaring harus muncul **di kartu jawaban yang dipencet** (ngejerat pilihan), bukan overlay layar penuh.
3. **鵺** = desainnya polos/mati (siluet tempelan). Pakai GIF hidup + petir.
4. **Mahoraga (streak 20)** = "apaan item", harus lore-accurate, design gak jelas, roda jangan ada mata → **GIF mahoraga.gif** (kanon: roda adaptasi 8 handle tanpa mata).
5. **Streak 30 & 50** = tambah **fitur skill yang berguna buat quiz** (bukan cuma visual), sesuai lore:
   - 30 龍鱗反発 = "counter/refleksi" → pecah 1 opsi salah (refleksi ke arah lawan).
   - 50 世界を断つ斬撃 = "memotong dunia" → semua opsi salah terbelah.
6. **Domain**: tangan gak jelas, hewan gak jelas, kuil ditaruh di DEPAN layar quiz → salah.
   → kuil = **LATAR BELAKANG** layar quiz, gede. Pakai **GIF ryoiki.gif** (Sukuna + 掌印 + kuil kanon).
7. **Salah**: buang semua efek (veil/garis) → cukup **kanji 馬鹿な + GIF** (`sukuna kalah.gif`).

## Aset baru (dari Downloads\sukuna, di-copy ke public/effects)
| Downloads | public/effects | Dipakai |
|---|---|---|
| `ryoiki.gif` (14f, 1.4s) | `ryoiki.gif` | cinematic domain + LATAR persist (kuil di belakang quiz, gede, redup) |
| `mahoraga.gif` (23f, 2.3s) | `mahoraga.gif` | streak 20 布瑠部由良由良 (cut-in) |
| `bakana.gif` (18f, 1.8s) | `sukuna kalah.gif` | jawaban salah (gantikan ganbare) |

## Perubahan kode
- **sukunaGifs.js + test** (baru): registry GIF + `sukunaGifForAnswer` + hold + preload.
- **sukunaFx.js**: `SUKUNA_STYLE` flag `inWeb` (kumo), `gif` (furube), wrong → 馬鹿な + merah;
  `SUKUNA_QUIZ_SKILLS` = { 30: 龍鱗反発(1 opsi), 50: 世界を断つ斬撃(semua opsi salah) } + `sukunaQuizSkillAt`.
- **SukunaBurst.jsx**:
  - `KumoNoIto` → `WebTrap` (portal, ikat KARTU yang dipencet: jaring laba-laba di dalam kartu, bukan overlay layar).
  - `Nue` → GIF (roda/鵺 hidup) + petir dari atas (svg tipis) — hapus siluet polos.
  - `Furube` → GIF mahoraga + aura + shake + mantra ring — **hapus roda SVG bermata + siluet ular**.
  - `SukunaWrong` → **hapus semua efek**, sisa kanji 馬鹿な + GIF kalah.
- **SukunaDomain.jsx**:
  - `SukunaDomainCine`: hapus 掌印 SVG + kuil SVG; GIF ryoiki muncul di `shrineAt` (cut-in) → settle jadi LATAR gede redup.
  - `SukunaAura`: hapus `Shrine` SVG (kuil di depan) — GIF dari cine yang jadi latar; sisa hujan tebasan + bara + mata/senyum.
  - `SukunaCurseBar`: tombol **skill quiz** (龍鱗反発 @30, 世界を断つ斬撃 @50).
- **EffectContext.jsx**: fx bawa `gifSrc`; registrasi opsi quiz (`setSukunaQuizOptions`) + `castSukunaQuizSkill` + state `sukunaSkillCutIds` (cut = opsi nonaktif).
- **Practice.jsx**: daftarkan options+correctId ke provider, gabung `sukunaSkillCutIds` ke `sukunaCutIds`.
- **sfx.js**: `SUKUNA_CLIP_MS` (durasi klip terukur) → hold benar walau metadata <audio> belum siap.
- **DevPanel**: tombol preview skill 30/50.

## Verifikasi
`npm test` · `npm run lint` · `npm run build` · smoke browser: preview 1/3/20/30/50 + cast domain (cek `data-sukuna-gif`, `naturalWidth>0`, elemen latar).
