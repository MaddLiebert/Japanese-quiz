# CHECKLIST PRIORITAS — Tema MEIJI 明治

> Turunan kerja dari `docs/tema/meiji.md` (PRD) + `docs/tema/meiji-mekanik.md` (SPEC).
> Urutan = **skala penting** (dampak × risiko). Prinsip: **tanpa kesalahan** —
> tiap item TDD (test RED → implement GREEN), lint 0, test lama tetap hijau.

## Legenda status
`[ ]` belum · `[~]` setengah · `[x]` selesai · `[!]` butuh aset/eksternal

---

## TIER 1 — Fondasi & kontrak yang menggantung (paling penting) ✅ SELESAI
> Cepat, murni, low-risk, menutup ketidakkonsistenan yang sudah ada di repo.

- [x] P1. `medaruCopy.js` — Meiji → **円 en** (+ test)
- [x] P2. Gacha **福引** — `gacha/meijiCopy.js` + wire dispatcher (+ test)
- [x] P3. Peta **8 perhentian** — `cinematic/meiji/meijiStops.js` (+ test)
- [x] P4. Checkpoint **国会** — `cinematic/meiji/meijiCheckpoint.js` (+ test) + halaman `pages/KokkaiCheckpoint.jsx`
- [x] P5. Registry cinematic + `data/scenes.js` Meiji (+ test) + view `MeijiBackdrop`/`MeijiScenes`/`MeijiCinematic` + route + halaman `pages/MeijiHistory.jsx` + Settings + wiring `CinematicContext.jsx`

## TIER 2 — Modul mekanik ★★★ (inti belajar)
- [x] M2. 和魂洋才 — `theme/waYo.js` ✅ (sudah ada)
- [x] M1. 活字組み (typesetting/grammar) — `features/typesetting/`:
  - `typesetting.js` (murni: POS_COLORS, buildPool, checkOrder, misprintAmount, isComplete, validateQuestion, PRNG deterministik) + `typesetting.test.js` (**19 pass**)
  - `typesettingBank.js` (12 soal, 3 level, SOV, distraktor partikel/konjugasi)
  - `useTypesetting.js` (hook sesi) + `TypesettingBoard.jsx` (UI blok 活字, misprint CSS)
  - halaman `pages/Typesetting.jsx` (gate era Meiji Lv 50) + route `/typesetting` + entri Home
- [ ] M12. Jejak Nacht/Saku — `companion/footprints.js`

## TIER 3 — Modul ★★
- [ ] M3. 第二面 (sisi gelap) — `news/newsPages.js`
- [ ] M4. Codex つながり — `codex/threads.js`
- [ ] M7. 時刻 (timer musiman→standar) — `time/temporal.js`
- [ ] M8. 新語 (cipta kata) — `neologism/neologism.js`
- [ ] M9. GLITCH (kebocoran cyberpunk) — `glitch/glitch.js`
- [ ] M11. 戸籍 (buku hidup) — `profile/koseki.js`

## TIER 4 — Modul ★ (rasa hidup / easter egg)
- [ ] M5. 活字 lepas — `typesetting/looseType.js`
- [ ] M6. 縦→横 (arah teks) — `theme/textFlow.js`
- [ ] M10. 号外 (koran larut malam) — `news/gogo.js`
- [ ] M13. 電信 (telegraf diegetik) — `telegram/telegram.js`
- [ ] M14. 印刷所 (easter egg) — `printshop/`
- [ ] M15. Napas & bertanya balik — `companion/breathing.js`, `questions.js`

## TIER 5 — Audio, aset, CSS, verifikasi
- [x] T5-audio. Mood ambience Meiji (port/city/press/school/diet) + SFX (pressClack/steamWhistle/telegraph/paperCry) di `heianHistoryAudio.js`
- [ ] T10. Audio tema BGM — `THEME_BGM_PLANS.meiji` (brass, tangga mayor) + test
- [!] T11. Voice cinematic — `public/voices/meiji/` (7 klip) **butuh mp3**
- [!] T11b. Video cinematic — `public/themes/meiji/` **butuh mp4/webm**
- [~] T3. Motif tersisa — `.bg-karakusa`, `.bg-renga`, `.bg-halftone`, `.era-rule-top`
- [~] T4. Font Playfair Display (masthead Latin) + wiring display
- [ ] T8. Verifikasi dark mode 6 kombinasi (3 era × terang/gelap)
- [x] T12. Verifikasi akhir — `npm test` (**1096 pass / 0 fail**), `npm run lint` (**exit 0**), `npm run build` (**exit 0**)
- [x] T12b. Wiring app: route `/meiji-history`, `/kokkai-checkpoint`, `/typesetting` di `App.jsx`, entri cinematic Meiji di `Settings.jsx`, token warna `--color-renga`/`--color-gas`/`--color-nezumi` + default `:root` di `index.css`

---

## Catatan eksekusi
- Test dijalankan: `node --test` (Node 24). Lint: `oxlint`. Build: `vite build`.
- Item `[!]` (voice/video) tidak bisa dibuat tanpa aset biner → ditandai, bukan dikarang.
- Sisa prioritas tertinggi: **M12 footprints** (★★★).
