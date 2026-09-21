# Plan: Comprehensive Win Rate System Audit & Root-Cause Fix

## Goal
Diagnose and permanently fix the Win Rate (WR) persisting at 0% despite completed quizzes, through systematic analysis of state flow, context updates, and UI rendering.

## Current Context
- `completeQuiz` is called on the last question.
- State is managed via `ProgressContext`.
- Profile displays `weightedWinRate`.
- Despite shifting logic to `handleSelectOption`, WR remains 0%, indicating either:
  1. `completeQuiz` is not actually being reached or executed.
  2. The `progress` state is being overwritten or initialized to 0 elsewhere.
  3. Profile component is reading from an old/detached state object.

## Architecture / Proposed Approach
1. Trace the entire event chain from quiz completion to state storage (`localStorage`) and UI consumption (`Profile.jsx`).
2. Add comprehensive console tracing (debug logs) at every critical junction (`completeQuiz` execution, `setProgress` state change, `localStorage` write, `Profile.jsx` read).
3. Ensure `weightedWinRate` is robustly saved and retrieved, and defaults correctly.

## Step-by-Step Tasks

### Task 1: Add End-to-End Tracing Logs
- **File:** `src/features/progress/ProgressContext.jsx`
- **Action:** Log `completeQuiz` entry, calculated `newWR`, updated `progress` state, and `localStorage` sync.
- **File:** `src/features/profile/Profile.jsx`
- **Action:** Log the exact `progress` object received from `useUserStats()`.

### Task 2: Inspect Quiz Component Execution
- **File:** `src/features/quiz/Quiz.jsx` and `src/features/quiz/MondaiQuiz.jsx`
- **Action:** Log when `currentQuestionIndex === questions.length - 1` and `completeQuiz` is invoked.

### Task 3: Fix State Mutator or Storage Mismatch
- **File:** `src/features/progress/ProgressContext.jsx`
- **Action:** Based on trace logs, fix any race condition or property name mismatch (e.g., `weightedWinRate` vs `winRate`).

## Tests / Validation
- Run `npm run build` to ensure no syntax errors.
- Execute a full quiz flow in the app, inspect console logs to pinpoint the exact failure point.

## Risks, Tradeoffs, and Open Questions
- Without runtime access to the browser console directly, adding explicit verbose logs is the only way to expose the hidden state mismatch.
