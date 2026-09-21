# Plan: Fix Win Rate Initialization

## Goal
Ensure the Win Rate (WR) initializes to 100% upon the very first quiz win for new players.

## Current Context
The current `completeQuiz` logic increments `matchesPlayed` first and then calculates WR. If `matchesPlayed` is 0 before the first quiz, it becomes 1. The code checks `if (newMatchesPlayed === 1)` to set 100%. If it's not updating, the state might not be persisting, or the condition is being bypassed.

## Architecture / Proposed Approach
Investigate why `completeQuiz` doesn't update `weightedWinRate` to 100% on the first match. Ensure the state update is atomic and correctly persists to `localStorage`.

## Step-by-Step Tasks

### Task 1: Debug State Persistence
- **File:** `src/features/progress/ProgressContext.jsx`
- **Action:** Add `console.log` in `completeQuiz` to trace `newMatchesPlayed`, `isWin`, and `newWR`.

### Task 2: Fix Initialization Logic
- **File:** `src/features/progress/ProgressContext.jsx`
- **Action:** Ensure `completeQuiz` uses the *updated* `newMatchesPlayed` to check for the first match condition.

### Task 3: Verify Persistence
- **File:** `src/features/progress/ProgressContext.jsx`
- **Action:** Add an `useEffect` hook to explicitly save `progress` (including `weightedWinRate`) to `localStorage` whenever it changes, to guarantee persistence.

## Tests / Validation
- Run app, perform a quiz, win it.
- Open console, check logs for WR update.
- Navigate to profile, verify WR shows 100%.

## Risks / Tradeoffs
- None. This is a fix for initialization logic.
