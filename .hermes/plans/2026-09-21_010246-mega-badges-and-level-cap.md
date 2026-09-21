# Plan: Mega Expansion — 36 Badges + Level 1000 Cap & "The End" Badge

## Goal
Implement a comprehensive 36-badge system, cap the player level at 1000, and add a final prestige badge for players who reach the level cap.

## Current context / assumptions
- `ProgressContext.jsx` currently calculates levels as `Math.floor(xp / 100) + 1`.
- Need to clamp this value at 1000.
- Add `zenith` badge to `ACHIEVEMENT_META`.

## Architecture / proposed approach
- Update `addXp` in `ProgressContext.jsx` to clamp `newLevel` at 1000.
- Expand `ACHIEVEMENT_META` with 36 badges plus the special `zenith` badge.
- Update `checkAchievements` logic to include level-based and count-based triggers.

## Step-by-step tasks

### Task 1: Update `ProgressContext.jsx` with Badge Catalog & Level Cap
- **File path:** `src/features/progress/ProgressContext.jsx`
- **Changes:**
    - Update `ACHIEVEMENT_META` with 37 entries (36 standard + 1 Zenith).
    - Clamp `newLevel` at 1000 in `addXp`.
    - Update `checkAchievements` with logic for all new badges.

### Task 2: Build & Verify
- **Command:** `npm run build`
- **Expected Output:** Success.

## Risks
- Players with XP > 100,000 might already be near cap; clamping should be retroactive.
