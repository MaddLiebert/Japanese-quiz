# Plan: Mondai Quiz Results Screen

## Goal
Add a results screen at the end of Mondai Quiz showing: score (benar/salah), XP earned, grade (S/A/B/C), review of wrong answers, with "Main Lagi" and "Kembali ke Beranda" buttons. Match the neo-brutalist design of `QuizResult` in `Practice.jsx`.

## Current Context / Assumptions
- `MondaiQuiz.jsx` currently has 5 questions (`mondaiData.length`), tracks `currentIndex`
- On last question `handleNext` calls `navigate("/")` — no results screen
- `Practice.jsx` lines 20-90 has `QuizResult` component — reference for design
- Design system: cream `#FAFAFA` (`kinari-light`), red `#E60012` (`shu`), thick borders `border-[4px]`, shadows `shadow-[8px_8px_0_0_#1a1a1a]`, font-serif for headings, font-mono for labels
- XP per correct: 15 (from `handleSelectOption`)
- `useLanguage()` for i18n (id/en)

## Architecture / Approach
Add state: `score`, `wrongAnswers` (array of indices). When `currentIndex === mondaiData.length - 1` and answered, show `MondaiQuizResult` component instead of quiz UI. Reuse design patterns from `QuizResult` in `Practice.jsx`.

## Step-by-Step Tasks

### Task 1: Add score/wrongAnswers state to MondaiQuiz
**File**: `src/features/quiz/MondaiQuiz.jsx`
**Location**: After line 14 (`isAnswered` state)
**Change**: Add two state variables
```jsx
const [score, setScore] = useState(0);
const [wrongAnswers, setWrongAnswers] = useState([]);
```

### Task 2: Update handleSelectOption to track score/wrong
**File**: `src/features/quiz/MondaiQuiz.jsx`
**Location**: Lines 29-42
**Change**: Push wrong answer index to `wrongAnswers`, increment `score` on correct

```jsx
const handleSelectOption = (index) => {
  if (isAnswered) return;

  setSelectedOption(index);
  setIsAnswered(true);

  if (index === currentItem.correctIndex) {
    playCorrectSound();
    addXp(15);
    incrementStreak();
    setScore((prev) => prev + 1);
  } else {
    playWrongSound();
    setWrongAnswers((prev) => [...prev, currentIndex]);
  }
};
```

### Task 3: Add isFinished state and logic
**File**: `src/features/quiz/MondaiQuiz.jsx`
**Location**: After `isAnswered` state
**Change**: Add `isFinished` state, set true on last question answered
```jsx
const [isFinished, setIsFinished] = useState(false);
```

In `handleNext`:
```jsx
const handleNext = () => {
  setIsPlaying(false);

  if (currentIndex < mondaiData.length - 1) {
    setCurrentIndex((prev) => prev + 1);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsPlaying(false);
  } else {
    setIsFinished(true); // Show results instead of navigating home
  }
};
```

### Task 4: Create MondaiQuizResult component
**File**: `src/components/MondaiComponents.jsx` (add new export)
**Location**: After `ExplanationBox` (around line 319)
**Reference**: Copy/adapt `QuizResult` from `Practice.jsx` lines 20-90

Key props:
- `score` (number correct)
- `totalQuestions` (mondaiData.length)
- `wrongAnswers` (array of indices)
- `mondaiData` (to look up wrong question details)
- `onPlayAgain` (reset quiz)
- `onGoHome` (navigate to "/")

Display:
- Grade circle (S/A/B/C) with spring animation
- "Benar: X / 5" 
- Wrong items list with question text + correct answer
- Two buttons: "Main Lagi" / "Kembali ke Beranda"

Grade logic (from Practice):
```js
const percentage = (score / totalQuestions) * 100;
let grade = 'C';
if (percentage === 100) grade = 'S';
else if (percentage >= 80) grade = 'A';
else if (percentage >= 60) grade = 'B';
```

### Task 5: Render MondaiQuizResult in MondaiQuiz
**File**: `src/features/quiz/MondaiQuiz.jsx`
**Location**: Replace early return / wrap return
**Change**: Conditional render
```jsx
if (isFinished) {
  return (
    <MondaiQuizResult
      score={score}
      totalQuestions={mondaiData.length}
      wrongAnswers={wrongAnswers}
      mondaiData={mondaiData}
      onPlayAgain={() => {
        setCurrentIndex(0);
        setScore(0);
        setWrongAnswers([]);
        setIsFinished(false);
        setSelectedOption(null);
        setIsAnswered(false);
        setIsPlaying(false);
      }}
      onGoHome={() => navigate("/")}
    />
  );
}
```

### Task 6: Import MondaiQuizResult
**File**: `src/features/quiz/MondaiQuiz.jsx`
**Location**: Line 3 import
```jsx
import { QuizHeader, AudioPlayer, ExplanationBox, MondaiQuizResult } from "../../components/MondaiComponents";
```

### Task 7: Verify build and lint
```bash
npm run lint
npm run build
```

## Tests / Validation
- Manual: Complete all 5 questions → results screen appears
- Manual: Grade shows correctly (5/5 = S, 4/5 = A, 3/5 = B, ≤2 = C)
- Manual: Wrong items list shows question + correct answer
- Manual: "Main Lagi" resets to question 1, score 0
- Manual: "Kembali ke Beranda" navigates to "/"
- `npm run lint` passes (only pre-existing warnings)
- `npm run build` passes

## Risks, Tradeoffs, Open Questions
- **Design**: Should XP earned be shown separately from score? Current: 15 XP per correct. Could show "XP Earned: +75" if all correct.
- **Wrong items**: Need to map index → question data for display. `mondaiData[wrongIndex]` gives full item.
- **Audio**: Results screen shouldn't play audio. `isFinished` bypasses AudioPlayer.
- **State reset**: `onPlayAgain` must clear all state cleanly.
- **No persist**: Score not saved to ProgressContext beyond XP (already added per-question). Acceptable.