# Plan: MOBA-Inspired Win Rate System

## Goal
Implement a Win Rate (WR) system that initializes at 100% on first win and uses dynamic difficulty/chapter-based scaling for subsequent matches.

## Current Context
Current WR logic updates per question, causing excessive volatility. MOBA-style WR should update per quiz session.

## Architecture / Proposed Approach
1.  **State Change:** Add `matchesPlayed` to `DEFAULT_PROGRESS` in `src/features/progress/ProgressContext.jsx`.
2.  **Logic Change:** Move WR update logic from `recordAnswer` (per-question) to a new `completeQuiz(isWin, difficulty, chapter)` function (per-session).
3.  **Delta Calculation:**
    - If `matchesPlayed === 0` and `isWin`: WR = 100%.
    - If `matchesPlayed === 0` and `!isWin`: WR = 0%.
    - Subsequent matches: `Delta = (isWin ? (100 - WR) * GainFactor : WR * LossFactor) * DifficultyMultiplier * ChapterMultiplier`.

## Step-by-Step Tasks

### Task 1: Update Progress State
- **File:** `src/features/progress/ProgressContext.jsx`
- **Action:** Add `matchesPlayed: 0` to `DEFAULT_PROGRESS`.

### Task 2: Implement `completeQuiz`
- **File:** `src/features/progress/ProgressContext.jsx`
- **Action:** Add `completeQuiz` to `ProgressProvider`:
  ```javascript
  const completeQuiz = useCallback((isWin, difficulty, chapter) => {
    setProgress(prev => {
      const newMatchesPlayed = prev.matchesPlayed + 1;
      let newWR = prev.weightedWinRate;

      if (newMatchesPlayed === 1) {
        newWR = isWin ? 100 : 0;
      } else {
        const difficultyMult = DIFFICULTY_MAP[difficulty] || 1.0;
        const chapterMult = 1 + (chapter - 1) * 0.05;
        const factor = difficultyMult * chapterMult;
        
        if (isWin) {
            newWR += (100 - newWR) * 0.1 * factor;
        } else {
            newWR -= (newWR * 0.15 * factor); // Penalty
        }
      }
      return { ...prev, matchesPlayed: newMatchesPlayed, weightedWinRate: Math.max(0, Math.min(100, newWR)) };
    });
  }, []);
  ```
- **Action:** Expose `completeQuiz` in `UserStatsContext.Provider`.

### Task 3: Migrate Quiz Completion
- **Files:** `src/features/quiz/Quiz.jsx`, `src/features/quiz/MondaiQuiz.jsx`
- **Action:** Remove WR logic from `recordAnswer`. Call `completeQuiz` when the quiz completes (in `onComplete` or `setIsFinished(true)` handlers).

## Tests / Validation
- Verify: Win 1st match -> WR 100%.
- Verify: Lose 2nd match -> WR < 100%.
- Verify: Win Ch 5 quiz (Hard) -> WR gain is larger than Ch 1.

## Risks / Tradeoffs
- Requires UI refactoring to call `completeQuiz` only at session end.
- `recordAnswer` remains for item-level SRS tracking, separating session statistics from item mastery.
