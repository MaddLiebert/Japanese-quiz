# CHECKLIST PRIORITAS — Tema MEIJI 明治

> Turunan kerja dari `docs/tema/meiji.md` (PRD) + `docs/tema/meiji-mekanik.md` (SPEC).
> Urutan = **skala penting** (dampak × risiko). Prinsip: **tanpa kesalahan** —
> tiap item TDD (test RED → implement GREEN), lint 0, test lama tetap hijau.

## Legenda status
`[ ]` belum · `[~]` setengah · `[x]` selesai · `[!]` butuh aset/eksternal
> Catatan: **tidak ada lagi item `[!]`** — aset suara sudah terpasang, dan video
> sengaja tidak dipakai (lihat T11b).

---

## TIER 1 — Fondasi & kontrak yang menggantung (paling penting) ✅ SELESAI
> Cepat, murni, low-risk, menutup ketidakkonsistenan yang sudah ada di repo.

- [x] P1. `medaruCopy.js` — Meiji → **円 en** (+ test)
- [x] P2. Gacha **福引** — `gacha/meijiCopy.js` + wire dispatcher (+ test)
- [x] P3. Peta **8 perhentian** — `cinematic/meiji/meijiStops.js` (+ test)
- [x] P4. Checkpoint **国会** — `cinematic/meiji/meijiCheckpoint.js` (+ test) + halaman `pages/KokkaiCheckpoint.jsx`
- [x] P5. Registry cinematic + `data/scenes.js` Meiji (+ test) + view `MeijiBackdrop`/`MeijiScenes`/`MeijiCinematic` + route + halaman `pages/MeijiHistory.jsx` + Settings + wiring `CinematicContext.jsx`

## TIER 2 — Modul mekanik ★★★ (inti belajar) ✅ SELESAI
- [x] M2. 和魂洋才 — `theme/waYo.js` (+ test) + wiring `MeijiHistory.jsx` (kepadatan motif per perhentian)
- [x] M1. 活字組み (typesetting/grammar) — `features/typesetting/`:
  - `typesetting.js` (murni: POS_COLORS, buildPool, checkOrder, misprintAmount, isComplete, validateQuestion, PRNG deterministik) + `typesetting.test.js` (**19 pass**)
  - `typesettingBank.js` (12 soal, 3 level, SOV, distraktor partikel/konjugasi)
  - `useTypesetting.js` (hook sesi) + `TypesettingBoard.jsx` (UI blok 活字, misprint CSS)
  - halaman `pages/Typesetting.jsx` (gate era Meiji Lv 50) + route `/typesetting` + entri Home
- [x] M12. Jejak Nacht/Saku — `companion/footprints.js` (+ `companionStats`) + overlay `MeijiCompanion.jsx`

## TIER 3 — Modul ★★ ✅ SELESAI
- [x] M3. 第二面 (sisi gelap) — `news/newsPages.js` + `MeijiHistory.jsx` (toggle 第二面)
- [x] M4. Codex つながり — `codex/threads.js` + halaman `pages/Codex.jsx`
- [x] M7. 時刻 (timer musiman→standar) — `time/temporal.js` + `MeijiHistory.jsx`
- [x] M8. 新語 (cipta kata) — `neologism/neologism.js` + halaman `pages/Neologism.jsx`
- [x] M9. GLITCH (kebocoran cyberpunk) — `glitch/glitch.js` + overlay `MeijiCompanion.jsx` + toggle Settings
- [x] M11. 戸籍 (buku hidup) — `profile/koseki.js` + halaman `pages/Koseki.jsx`

## TIER 4 — Modul ★ (rasa hidup / easter egg) ✅ SELESAI
- [x] M5. 活字 lepas — `typesetting/looseType.js` + wiring `pages/Typesetting.jsx` (blok miring saat streak putus)
- [x] M6. 縦→横 (arah teks) — `theme/textFlow.js` + `MeijiHistory.jsx`
- [x] M10. 号外 (koran larut malam) — `news/gogo.js` + overlay `MeijiCompanion.jsx`
- [x] M13. 電信 (telegraf diegetik) — `telegram/telegram.js` + overlay `MeijiCompanion.jsx`
- [x] M14. 印刷所 (easter egg) — `printshop/printshop.js` + halaman `pages/PrintShop.jsx`
- [x] M15. Napas & bertanya balik — `companion/breathing.js`, `questions.js` + overlay `MeijiCompanion.jsx` + toggle Settings

## TIER 5 — Audio, aset, CSS, verifikasi ✅ SELESAI
- [x] T5-audio. Mood ambience Meiji (port/city/press/school/diet) + SFX (pressClack/steamWhistle/telegraph/paperCry) di `heianHistoryAudio.js`
- [x] T10. Audio tema BGM — `THEME_BGM_PLANS.meiji` (brass, tangga **mayor diatonik** C D E G A, drone +C3) + test (**4 test**)
- [x] T11. Voice cinematic — `public/voices/meiji/` **7 klip terpasang** (sumber `sakuu.mp3` 66,85s → split) + test penjaga file ada
- [x] T11b. Video cinematic — **TIDAK DIPAKAI.** Cinematic intro di-render **SVG/React** (`MeijiScenes.jsx` + `MeijiBackdrop.jsx` + `SceneLayer`), sama seperti Heian/Edo. Nol tag `<video>`/`.mp4`/`public/themes/` di `src/`. Baris "MP4/WebM" di PRD §10 = opsi alternatif yang tidak diambil; video jadi tak bisa reaktif ke waktu/mood/`prefers-reduced-motion` dan menambah ~8 MB bundle.
- [x] T3. Motif — `.bg-karakusa`, `.bg-renga`, `.bg-halftone`, `.era-rule-top` (+ varian gelap)
- [x] T3b. **Latar 唐草 karakusa (REVISI keputusan user)** — latar Meiji diganti dari dinding bata 煉瓦 → **唐草 karakusa (arabesque)**, sesuai motif UTAMA PRD §2 (`docs/tema/meiji.md`); bata cuma AKSEN. Alasan: bata bikin latar app MIRIP poster `nihongo-gakuen` (bertembok bata) — user mau BEDA. Aset: `public/art/meiji-karakusa-day.svg` + `meiji-karakusa-night.svg` (sulur S-curve + daun berlekuk acanthus + tendril, seamless). **Dipasang di DUA tempat**: (a) `.era-pattern` global; (b) `.home-hero-bg` panel hero Home. Guard: `meijiTheme.test.js` + `homeHero.test.js` (assert pakai karakusa DAN menolak `/meiji-brick/`).
- [x] T3c. **Ornamen hero Meiji** — 瓦斯灯 gaslight (lampu gas Ginza, analog 提灯 Edo: berayun ikut scroll, MENYALA+halo saat gelap) + 文選 bunsen (rak huruf 活字). `src/components/MeijiOrnament.jsx`, gate `.meiji-ornament`. Guard: `meijiTheme.test.js`.
- [x] T3d. **Seni kartu JLPT N5 Meiji** — 銀座煉瓦街 + 瓦斯灯 + 蒸気機関車 + 電信柱 + asap pabrik (letterpress + garis ukir hatching). `src/components/MeijiArtwork.jsx`, gate `.meiji-art`, mask luluh ke kertas. Sejajar EdoPrintArt (ukiyo-e) & lukisan 月夜 (Heian). Guard: `meijiTheme.test.js`.
- [x] T4. Font — Playfair Display dimuat di `index.html`; `--font-display` = Noto Serif JP (明朝体), `--font-masthead` = Playfair (masthead Latin)
- [x] T8. Verifikasi dark mode 6 kombinasi — test statis token (tiap era terang/gelap punya token inti, 3 latar gelap beda) + verifikasi CSS build ter-compile
- [x] T12. Verifikasi akhir — `npm test` (**1177 pass / 0 fail**), `npm run lint` (**exit 0**), `npm run build` (**exit 0**)
- [x] T12b. Wiring app: route `/meiji-history`, `/kokkai-checkpoint`, `/typesetting`, `/printshop`, `/neologism`, `/codex`, `/koseki` di `App.jsx`; entri cinematic Meiji di `Settings.jsx`; token warna `--color-renga`/`--color-gas`/`--color-nezumi` + default `:root` di `index.css`

---

## Catatan eksekusi
- Test dijalankan: `node --test` (Node 24). Lint: `oxlint`. Build: `vite build`.
- **Aset biner:** voice sudah **selesai** (aset user `sakuu.mp3` dipecah jadi 7 klip).
  Video **tidak dipakai** — cinematic di-render SVG/React (lihat T11b).
- Semua modul mekanik M1–M15 selesai + teruji. Tema Meiji **lengkap**.
