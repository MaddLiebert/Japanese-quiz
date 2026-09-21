# Plan: Dynamic Win Rate Penalty

## Goal
Implement dynamic Win Rate (WR) reduction based on quiz difficulty and chapter progression.

## Current Context
Current WR reduction is flat and ignores context. Needs sensitivity to difficulty and chapter advancement.

## Architecture / Proposed Approach
Apply multiplicative penalty to loss: `ActualPenalty = BasePenalty * DifficultyFactor * ChapterFactor`.
1. Difficulty Factors: Easy (0.8), Medium (1.0), Hard (1.2).
2. Chapter Factor: `1 + (chapter * 0.05)`.
3. Update `recordAnswer` signature and implementation.

## Step-by-Step Tasks

### Task 1: Define Penalty Constants
- **File:** `src/features/progress/ProgressContext.jsx`
- **Action:** Add constants for `BASE_LOSS`, `DIFFICULTY_MAP`, `CHAPTER_FACTOR`.

### Task 2: Update `recordAnswer`
- **File:** `src/features/progress/ProgressContext.jsx`
- **Action:** Update signature: `recordAnswer(itemId, isCorrect, difficulty, chapter, xpReward = 10)`.
- **Action:** Calculate `penalty = BASE_LOSS * DIFFICULTY_MAP[difficulty] * (1 + chapter * 0.05)`.
- **Action:** Apply `newWR = Math.max(0, oldWR - penalty)`.

### Task 3: Update Call Sites
- **File:** `src/features/quiz/QuizComponent.jsx` (or relevant quiz runner)
- **Action:** Update all calls to `recordAnswer` to pass `difficulty` and `chapter` variables.

## Tests / Validation
- TDD: Write test case: `lossAtEasyCh1 < lossAtHardCh5`.
- Verify: Penalty logic holds across varying inputs.

## Risks / Tradeoffs
- WR volatility if factors are too aggressive.
- Dependency on correct `difficulty`/`chapter` being passed from UI.
