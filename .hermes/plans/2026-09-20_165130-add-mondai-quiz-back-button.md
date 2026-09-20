# Plan: Add Standardized Back Button to Active Mondai Quiz

## Goal
Add a standardized back button to the active Mondai chapter quiz view (`src/features/quiz/Quiz.jsx`) so users can exit mid-quiz back to the chapter intro, matching the styling and pattern used across other quiz views.

## Current Context / Assumptions
- The `/mondai` route is rendered by `MondaiChapterFlow.jsx`, which manages three view states: `"selector"`, `"intro"`, and `"quiz"`.
- Both `"selector"` and `"intro"` views in `MondaiChapterFlow.jsx` display a top back button with exact neo-brutalist styling:
  ```jsx
  <button 
    onClick={...}
    className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/60 hover:text-shu transition-colors flex items-center gap-2 mb-6 group relative z-20 w-fit"
  >
    <span className="group-hover:-translate-x-1 transition-transform">←</span> {language === 'id' ? 'Kembali' : 'Back'}
  </button>
  ```
- When `view === "quiz"`, `MondaiChapterFlow.jsx` renders `<Quiz chapter={selectedChapter} onComplete={handleQuizComplete} />`.
- `Quiz.jsx` currently does not accept an `onBack` prop nor render a back button at the top of the view, leaving users stuck during an active quiz session without a back action.

## Architecture / Proposed Approach
Pass an `onBack` callback from `MondaiChapterFlow.jsx` to `Quiz.jsx` that sets the view state back to `"intro"`. Inside `Quiz.jsx`, accept the `onBack` prop and render the standardized back button at the top of the container before the header section.

## Step-by-Step Tasks

### Task 1: Update `Quiz.jsx` to accept `onBack` and render the back button
**File:** `src/features/quiz/Quiz.jsx`

Add `onBack` to props, and insert the standard back button component at line ~76 (just inside the main container `div`, above the `{/* Header */}` element).

#### Complete Code Changes:
In `src/features/quiz/Quiz.jsx`:

1. Update component parameters:
```jsx
const Quiz = ({ chapter, onComplete, onBack }) => {
```

2. Add the back button JSX inside the return statement right above `{/* Header */}`:
```jsx
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 sm:py-20 min-h-screen flex flex-col relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-seigaiha opacity-[0.03] pointer-events-none"></div>

      {onBack && (
        <button
          onClick={onBack}
          className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/60 hover:text-shu transition-colors flex items-center gap-2 mb-6 group relative z-20 w-fit"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> {language === 'id' ? 'Kembali' : 'Back'}
        </button>
      )}

      {/* Header */}
```

#### Verification Command:
```bash
npx vite build
```
Expected output:
```
vite v8.2.1 building client environment for production...
...
✓ built in ...
```

---

### Task 2: Wire `onBack` prop in `MondaiChapterFlow.jsx`
**File:** `src/features/quiz/MondaiChapterFlow.jsx`

Pass `onBack={() => setView("intro")}` to `<Quiz />` component when `view === "quiz"`.

#### Complete Code Changes:
In `src/features/quiz/MondaiChapterFlow.jsx`:

Replace lines 175-184:
```jsx
  // ── Quiz View ───────────────────────────────────────────────────────────────
  if (view === "quiz" && selectedChapter) {
    return (
      <div className="min-h-screen bg-kinari-light flex flex-col">
        <Quiz
          chapter={selectedChapter}
          onComplete={handleQuizComplete}
          onBack={() => setView("intro")}
        />
      </div>
    );
  }
```

#### Verification Command:
```bash
npx vite build
```
Expected output:
```
✓ built in ...
```

---

### Task 3: Clean up unused imports/variables in `Quiz.jsx` to pass linter
**File:** `src/features/quiz/Quiz.jsx`

Remove unused `useEffect` import and unused variables (`audioRef`, `progress`, `wrongAnswers`) so linter stays clean.

#### Complete Code Changes:
In `src/features/quiz/Quiz.jsx`:
- Line 1: `import React, { useState, useRef } from "react";` (remove `useEffect`)
- Line 13: Remove `const [wrongAnswers, setWrongAnswers] = useState([]);` if unused or prefix with `_`
- Line 20: Remove `const audioRef = useRef(null);`
- Line 69: Remove `const progress = ...` if unused

#### Verification Command:
```bash
npx vite build
```
Expected output:
```
✓ built in ...
```

## Tests / Validation
1. Build verification:
   Command: `npm run build`
   Expected Result: Exit code 0, build succeeds cleanly.

2. Visual / Functional verification:
   - Navigate to `/mondai` in browser.
   - Select any chapter (e.g. Chapter 1) to go to Intro view.
   - Click "Mulai Quiz" / "Start Quiz".
   - Confirm back button `← KEMBALI` / `← BACK` appears at top left above the chapter header during quiz execution.
   - Click the back button and verify it returns to the Chapter Intro screen (`view === "intro"`).

## Risks, Tradeoffs, and Open Questions
- **Risk:** Clicking back during an in-progress quiz will discard current question progress for that session.
  - **Tradeoff:** Acceptable and standard behavior for this app flow; user explicitly requested returning to intro view.
- **Open Questions:** None. Requirement is straightforward and matches existing design patterns.
