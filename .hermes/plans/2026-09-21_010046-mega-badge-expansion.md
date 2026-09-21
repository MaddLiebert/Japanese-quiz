# Plan: Mega Expansion — 36 Specialized Badges (The Path of the Shogun)

## Goal
Expand `ACHIEVEMENT_META` to include 36 distinct badges categorized by mastery type, intensity, and secret habits, using authentic Kanji stamps and high-flavor titles.

## Current context / assumptions
- `ProgressContext.jsx` currently has 8-10 basic badges.
- User wants "more" (much more) to make the progression feel deep and rewarding.
- Profile UI can handle many badges in selection mode (grid).

## Catalog: The 36 Seals of Mastery

### 1. The Script Pillars (Kana & Kanji)
1.  `平` **Hiragana Origin**: Clear all Hiragana.
2.  `片` **Katakana Edge**: Clear all Katakana.
3.  `斬` **Kanji Slayer**: Correct 50 Kanji.
4.  `獄` **Kanji Hell**: Correct 200 Kanji.
5.  `眼` **Eagle Eye**: Correct 500 total questions.
6.  `墨` **Master Calligrapher**: Correct 1000 total questions.

### 2. The Language Arts (Grammar & Vocab)
7.  `文` **Bunpo Student**: Clear 10 Grammar sessions.
8.  `典` **Bunpo Master**: Clear 50 Grammar sessions.
9.  `語` **Wordsmith**: Master 100 Kotoba.
10. `蔵` **The Vault**: Master 300 Kotoba.
11. `辞` **Dictionary Eater**: Master 500 Kotoba.
12. `通` **The Fluent**: Correct 100 Grammar questions.

### 3. The Auditory Path (Mondai/Listening)
13. `聴` **Golden Ears**: Complete 5 Mondai chapters.
14. `響` **Echo of Truth**: Perfect score (100%) on a long Mondai session.
15. `波` **Sonic Wave**: Complete 20 Mondai chapters.
16. `心` **Inner Ear**: Complete all available Mondai content.

### 4. The Warrior's Spirit (Streaks & Discipline)
17. `不` **Undefeated**: 15x Correct Streak.
18. `神` **Godlike**: 50x Correct Streak.
19. `極` **Persistent**: 7-day study streak.
20. `魂` **Eternal Soul**: 30-day study streak.
21. `恒` **Consistent**: 100-day study streak.
22. `無` **Void**: Correct 100 questions in one sitting.

### 5. Combat Prowess (Speed & Accuracy)
23. `雷` **Lightning Bolt**: Answer sub-2 seconds (average).
24. `的` **Bullseye**: 100% Accuracy (min 20 questions).
25. `疾` **Hurricane**: Clear a 50-question quiz in record time.
26. `覚` **Awakened**: Answer 10 questions correctly in under 20 seconds total.

### 6. The Hermit's Habits (Special Triggers)
27. `夜` **Night Owl**: Study after 23:00.
28. `暁` **Early Bird**: Study before 07:00.
29. `清` **Purifier**: Clear all Weak Items.
30. `忙` **Busy Samurai**: Study 3 times in one day (separated by 4 hours).
31. `休` **No Rest**: Study on a weekend (Sat & Sun).
32. `祭` **Festival Goer**: Study on a holiday (Date-specific trigger).

### 7. Rank & Prestige (XP Milestones)
33. `初` **Novice**: Reach 100 XP.
34. `武` **Warrior**: Reach 1,000 XP.
35. `伯` **Venerable**: Reach 5,000 XP.
36. `将` **Grand Shogun**: Reach 10,000 XP.

## Step-by-step tasks
1. **Define META**: Bulk update `ACHIEVEMENT_META` in `src/features/progress/ProgressContext.jsx`.
2. **Logic Triggers**: Update `checkAchievements` to handle counts (Kanji corrected, chapters cleared, etc.). Note: Some may require adding new fields to the `progress` object (e.g., `kanjiCorrectCount`).
3. **Refine UI**: Ensure the badge selection grid in `Profile.jsx` is clean.

## Risks
- Data Migration: Adding new tracking fields (like `kanjiCorrectCount`) to existing `localStorage` objects needs default values.
- Performance: Checking 36 conditions on every update; keep it inside `useCallback`/`useEffect` with proper deps.
