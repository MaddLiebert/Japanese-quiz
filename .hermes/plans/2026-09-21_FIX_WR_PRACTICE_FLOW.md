# Plan: Fix WR Not Updating in Practice Quiz (useQuizSession)

## Goal
Make `completeQuiz` fire when the main Practice quiz (driven by `useQuizSession`) finishes, so Win Rate updates.

## Current Context / Root Cause (CONFIRMED)
The user's quizzes come from `src/pages/Practice.jsx`, which uses the `useQuizSession` hook
(`src/features/quiz/useQuizSession.js`). That hook:
- calls `recordAnswer` per question (item SRS only — it does NOT touch WR), and
- on the last question (`advanceQuestion`) just sets `setIsFinished(true)`.

`completeQuiz` is ONLY wired into `src/features/quiz/Quiz.jsx` and `src/features/quiz/MondaiQuiz.jsx`,
which are NOT the flow the user plays. Therefore WR stays 0 forever on Practice quizzes.

Second issue: `score` is React state; inside `advanceQuestion` (a `useCallback` with `[]` deps)
the closure would be stale. A `scoreRef` must be used, mirroring the existing
`currentIndexRef` / `isAnsweredRef` pattern.

## Architecture / Proposed Approach
Add a `scoreRef` in `useQuizSession`, increment it inside `selectAnswer` (the single place a
correct answer is recorded), and in `advanceQuestion` — when the queue is exhausted — compute
`isWin` from `scoreRef.current` and call `completeQuiz(isWin, difficultyRef.current, 1)`.

## Step-by-Step Tasks

### Task 1: Import useUserStats and add scoreRef
- **File:** `src/features/quiz/useQuizSession.js`
- **Action:** change import line 2 and add ref near line 123.
```js
import { useItemProgress, useUserStats } from '../progress/ProgressContext';
```
```js
  const scoreRef = useRef(0);
```

### Task 2: Get completeQuiz from context
- **File:** `src/features/quiz/useQuizSession.js`
- **Action:** after line 125 (`const { recordAnswer } = useItemProgress();`) add:
```js
  const { completeQuiz } = useUserStats();
```

### Task 3: Reset scoreRef in initializeQuiz
- **File:** `src/features/quiz/useQuizSession.js`
- **Action:** inside `initializeQuiz`, next to `currentIndexRef.current = 0;` add:
```js
    scoreRef.current = 0;
```

### Task 4: Increment scoreRef on correct answer
- **File:** `src/features/quiz/useQuizSession.js`
- **Action:** inside `selectAnswer`, in the `if (correct)` branch, replace:
```js
    if (correct) {
      setScore(prev => prev + 1);
    } else {
```
with:
```js
    if (correct) {
      scoreRef.current += 1;
      setScore(prev => prev + 1);
    } else {
```

### Task 5: Fire completeQuiz when queue ends
- **File:** `src/features/quiz/useQuizSession.js`
- **Action:** in `advanceQuestion`, replace the `else` branch:
```js
    } else {
      setIsFinished(true);
    }
```
with:
```js
    } else {
      setIsFinished(true);
      const total = questionsRef.current.length;
      const finalScore = scoreRef.current;
      const isWin = finalScore >= Math.ceil(total / 2);
      completeQuiz(isWin, difficultyRef.current, 1);
    }
```
- **Action:** add `completeQuiz` to the dependency array: `}, [completeQuiz]);`

### Task 6: Remove debug logs
- **Files:** `src/features/progress/ProgressContext.jsx`, `src/features/quiz/Quiz.jsx`, `src/features/quiz/MondaiQuiz.jsx`
- **Action:** delete the temporary `console.log(...)` lines added for tracing.

## Tests / Validation
- Run `npm run lint` → expect no NEW errors (existing warnings are pre-existing).
- Run `npm run build` → expect `✓ built in ...` with no PARSE_ERROR.
- Manual: Play a Practice quiz, win it, open Profile → WR shows 100% on first win.

## Risks, Tradeoffs, and Open Questions
- `chapter` is hardcoded to `1` in the Practice flow (no chapter concept there); acceptable for now.
- Only the first win sets 100%; a first loss sets 0% (matches the agreed MOBA rule).
