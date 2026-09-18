# Plan: Prevent Skip to Next Question While Audio Playing

## Goal
Prevent user from advancing to next question (`handleNext` / "SOAL BERIKUTNYA →") while audio is still playing. Must pause/stop audio first or wait for it to finish.

## Current Context / Assumptions
- `MondaiQuiz.jsx` manages `isPlaying` state (line 13) via `handlePlayAudio`/`handlePauseAudio`
- `AudioPlayer` component (`MondaiComponents.jsx` lines 3-147) has its own `<audio>` ref and controlled/uncontrolled sync logic
- `ExplanationBox` (`MondaiComponents.jsx` lines 217-314) renders "SOAL BERIKUTNYA →" button calling `onNext` prop
- `handleNext` in `MondaiQuiz` (lines 67-76) advances index without checking `isPlaying`
- Audio and question index are coupled: changing `currentIndex` swaps `audioSrc` but old audio may still play

## Architecture / Approach
Pass `isPlaying` from `MondaiQuiz` → `ExplanationBox` via prop. Disable "SOAL BERIKUTNYA →" button when `isPlaying=true`. Also ensure `handleNext` stops audio before advancing (defensive).

## Step-by-Step Tasks

### Task 1: Pass isPlaying to ExplanationBox
**File**: `src/features/quiz/MondaiQuiz.jsx`
**Location**: Line ~147 where ExplanationBox is rendered
**Change**: Add `isPlaying={isPlaying}` prop

```jsx
<ExplanationBox
  dialogScript={currentItem.dialogScript}
  explanation={currentItem.explanation}
  isCorrect={selectedOption === currentItem.correctIndex}
  onNext={handleNext}
  onRetry={handleRetry}
  isPlaying={isPlaying}
/>
```

### Task 2: Accept isPlaying prop in ExplanationBox
**File**: `src/components/MondaiComponents.jsx`
**Location**: Line 217-223 (ExplanationBox function signature)
**Change**: Add `isPlaying = false` to destructured props

```jsx
export function ExplanationBox({
  dialogScript = [],
  explanation = "",
  isCorrect = true,
  onNext,
  onRetry,
  isPlaying = false,
}) {
```

### Task 3: Disable next button when audio playing
**File**: `src/components/MondaiComponents.jsx`
**Location**: Lines 306-311 (SOAL BERIKUTNYA button)
**Change**: Add `disabled={isPlaying}` and visual feedback

```jsx
<button
  onClick={onNext}
  disabled={isPlaying}
  className={`border-[3px] border-[#1a1a1a] font-mono text-xs font-bold uppercase tracking-wider px-6 py-2.5 shadow-[4px_4px_0_0_#1a1a1a] hover:bg-opacity-90 active:translate-x-[2px] active:translate-y-[2px] transition-opacity ${
    isPlaying ? "opacity-50 cursor-not-allowed bg-[#1b315e]/50" : "bg-[#1b315e] text-[#fcf9f4]"
  }`}
>
  {isPlaying ? "⏳ AUDIO BERJALAN..." : "SOAL BERIKUTNYA →"}
</button>
```

### Task 4: Stop audio in handleNext (defensive)
**File**: `src/features/quiz/MondaiQuiz.jsx`
**Location**: Lines 67-76 (handleNext function)
**Change**: Pause audio before advancing

```jsx
const handleNext = () => {
  // Stop audio before moving to next question
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current = null;
  }
  setIsPlaying(false);

  if (currentIndex < mondaiData.length - 1) {
    setCurrentIndex((prev) => prev + 1);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsPlaying(false);
  } else {
    navigate("/");
  }
};
```

### Task 5: Verify build and lint
```bash
npm run lint
npm run build
```
Expected: Both pass with no new errors.

## Tests / Validation
- Manual: Play audio → click "SOAL BERIKUTNYA" → button disabled, shows "⏳ AUDIO BERJALAN..."
- Manual: Pause audio → click "SOAL BERIKUTNYA" → advances normally
- Manual: Let audio finish → button enables auto via `onEnded` → advances
- `npm run lint` passes
- `npm run build` passes

## Risks, Tradeoffs, Open Questions
- **Tradeoff**: Button disabled state may confuse users if not obvious. Added text change clarifies.
- **Race condition**: If `isPlaying` state lags behind actual audio, brief window exists. Acceptable.
- **Alternative**: Could auto-pause audio in `handleNext` (Task 4 does this). Current plan: disable + defensive stop.
- **Future**: Could add toast "Hentikan audio dulu" but YAGNI for now.