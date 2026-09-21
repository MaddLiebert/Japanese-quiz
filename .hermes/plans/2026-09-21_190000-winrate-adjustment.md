# Plan: Weighted Win Rate Adjustment

## Goal
Adjust Win Rate calculation to use a weighted moving average, moderating loss impact and incorporating chapter difficulty.

## Current Context
Current Win Rate is `(totalCorrect / totalAnswered) * 100`, which is too volatile on losses.

## Architecture / Proposed Approach
Implement an Exponential Moving Average (EMA) for Win Rate.
1.  Define `DIFFICULTY_MULTIPLIER` per chapter (Ch 1-2 = 1.0, 3-4 = 1.2, 5+ = 1.5).
2.  Update `ProgressContext` to track `weightedWinRate` instead of simple raw percentage.
3.  Apply a dampening factor to losses (`0.5x` impact compared to wins) to keep WR movement smooth.

## Step-by-Step Tasks

### Task 1: Define Difficulty Mapping
- **File:** `src/features/progress/ProgressContext.jsx`
- **Action:** Add `CHAPTER_DIFFICULTY` object after `ACHIEVEMENT_META`.

### Task 2: Update ProgressContext State
- **File:** `src/features/progress/ProgressContext.jsx`
- **Action:** Add `weightedWinRate` to `DEFAULT_PROGRESS`.
- **Action:** Modify `recordAnswer` to:
    - Determine difficulty `D` for current chapter.
    - If Win: `newWR = oldWR + ( (100 - oldWR) * 0.1 * D )`.
    - If Loss: `newWR = oldWR - ( oldWR * 0.05 * D )`.
    - `0.1` (Win rate gain factor) and `0.05` (Loss dampening factor) ensure losses impact less than wins.

### Task 3: Update Profile Component
- **File:** `src/features/profile/Profile.jsx`
- **Action:** Update `realProfileData.stats.winRate` to use `progress.weightedWinRate` instead of calculating it on the fly.

## Tests / Validation
- Verify: Quiz win (Ch 1) increases WR slightly.
- Verify: Quiz loss (Ch 1) decreases WR, but less than an equivalent win increases it.
- Verify: Quiz win (Ch 5) increases WR more than Ch 1.

## Risks, Tradeoffs, and Open Questions
- EMA approach means past performance heavily influences current WR (slow to change).
- Need to ensure `weightedWinRate` persists in `localStorage` properly.
