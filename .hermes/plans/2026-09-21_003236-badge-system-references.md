# Plan: Japanese Quiz Badge & Achievement System Expansion

## Goal
Design and catalog an expanded, lore-accurate Japanese gaming / Shogun-themed badge and achievement system (`ACHIEVEMENT_META`) with Kanji Hanko stamp labels, titles, and unlock conditions.

## Current context / assumptions
- `src/features/progress/ProgressContext.jsx` holds `ACHIEVEMENT_META` and `achievements` state.
- Currently only 3 basic badges exist (`first_quiz`, `100_xp`, `clean_up`).
- User wants cool, thematic badge names matching Japanese proficiency levels (N5, Kanji, Streaks, Speed, Mastery).

## Proposed Badge References (ACHIEVEMENT_META Expansion)
1. **`first_quiz`**: `初` | "First Steps" (Selesaikan kuis pertama)
2. **`100_xp`**: `百` | "Century Club" (Raih 100 XP total)
3. **`clean_up`**: `清` | "Clean Slate" (Selesaikan semua review soal lemah)
4. **`kanji_slayer`**: `斬` | "Kanji Slayer" (Jawab benar 50 pertanyaan Kanji)
5. **`speed_demon`**: `雷` | "Lightning Fast" (Jawab kuis dengan rata-rata < 3 detik per soal)
6. **`undefeated`**: `不` | "Undefeated" (Raih streak 15 kali berturut-turut tanpa salah)
7. **`master_shogun`**: `将` | "Shogun of N5" (Capai level 5 atau 5,000 XP)
8. **`choukai_master`**: `聴` | "Ears of Gold" (Selesaikan semua bab Mondai listening)
9. **`night_owl`**: `夜` | "Midnight Scholar" (Belajar di atas jam 11 malam)

## Step-by-step tasks
1. Update `src/features/progress/ProgressContext.jsx` with expanded `ACHIEVEMENT_META` and achievement check triggers.
2. Update `src/features/profile/Profile.jsx` to render unlocked badges with their Hanko stamp visual style.
3. Verify with `npm run build` and `npm run lint`.

## Risks, tradeoffs, and open questions
- Ensure unlock triggers are checked during quiz completion in `useQuizSession.js` or `ProgressContext.jsx`.
