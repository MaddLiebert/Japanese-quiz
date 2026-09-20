# Plan: Fix Mondai Quiz Mobile Layout Overflow and Button Sizing Consistency

- Goal — Fix mobile layout overflow/clipping issues in `MondaiQuiz` and standardize button sizing and padding across explanation and question navigation states.
- Current context / assumptions — `MondaiQuiz` and associated components (`ExplanationBox`, `QuizHeader`) suffer from restrictive or fixed max widths on mobile, lack responsive wrapping/spacing, and have mismatched button padding/dimensions (e.g., "ULANGI SOAL" vs "SOAL BERIKUTNYA").
- Architecture / proposed approach — Update CSS classes in `src/features/quiz/MondaiQuiz.jsx` and `src/components/MondaiComponents.jsx` to enforce flexible responsive wrapping, full-width container margins on small viewports (`w-full px-4`), and equalized dimensions/padding for action buttons.

- Step-by-step tasks:
  1. Audit and patch container wrappers in `src/features/quiz/MondaiQuiz.jsx` to use fluid padding and prevent horizontal/vertical clipping on mobile viewports.
     - File: `src/features/quiz/MondaiQuiz.jsx`
     - Content change: Ensure outer container uses `w-full max-w-xl mx-auto px-4 py-4` instead of fixed restrictive widths.
  2. Standardize button dimensions in `src/components/MondaiComponents.jsx` (`ExplanationBox` and related buttons).
     - File: `src/components/MondaiComponents.jsx`
     - Content change: Give `onRetry` and `onNext` buttons consistent flex styling, equal padding (`py-3`), and standard typography classes so they match in height and visual weight.
  3. Verify responsive layout and build output.
     - Command: `npm run build`
     - Expected output: Successful production bundle without compilation errors.

- Tests / validation — Run `npm run build` to confirm compilation success.
- Risks, tradeoffs, and open questions — None.
