# Plan: Fix Audio Playback in MondaiQuiz

**Date**: 2025-09-18  
**Issue**: Audio tidak bisa diputar di halaman Mondai Listening Quiz  
**Root Cause**: Dual audio element architecture — `MondaiQuiz` creates its own `Audio` object in `handlePlayAudio`, while `AudioPlayer` has its own internal `<audio>` element. They don't share state.

---

## Goal

Unify audio playback under `AudioPlayer` component as single source of truth; `MondaiQuiz` only controls via props (`isPlaying`, `onPlay`, `onPause`).

---

## Current Context / Assumptions

- `MondaiQuiz.jsx` (lines 20-40): Creates `new Audio(currentItem.audio)` in `handlePlayAudio`, stores in local `audioRef`
- `AudioPlayer.jsx` (lines 65-70): Has its own `<audio ref={audioRef} src={audioSrc} />` element with internal `audioRef`
- `MondaiQuiz` passes `isPlaying`, `onPlay={handlePlayAudio}`, `onPause={handlePauseAudio}` to `AudioPlayer`
- When user clicks play button in `AudioPlayer`, it calls `onPlay` → `handlePlayAudio` creates **new** Audio object, but `AudioPlayer`'s internal audio element never plays
- Audio files in `public/audio/` only has `01 Dai 1 Ka - Kaiwa.mp3`; JSON references `02`–`06` which 404 (handled gracefully)

---

## Architecture / Approach

**Single audio element owned by `AudioPlayer`**. `MondaiQuiz` becomes a controlled consumer:
- Remove `audioRef` and `handlePlayAudio`/`handlePauseAudio` from `MondaiQuiz`
- `AudioPlayer` manages its own `<audio>` element internally
- `MondaiQuiz` passes only `isPlaying` (boolean) and receives `onPlay`/`onPause` callbacks to sync state
- `AudioPlayer`'s `useEffect` (lines 53-61) already handles syncing when `externalIsPlaying` changes — this works once parent stops creating separate Audio

---

## Step-by-Step Tasks

### Task 1: Refactor `MondaiQuiz.jsx` — remove local audio management

**File**: `src/features/quiz/MondaiQuiz.jsx`  
**Changes**:
1. Remove `audioRef` (line 14)
2. Remove `handlePlayAudio` (lines 20-33) and `handlePauseAudio` (lines 35-40)
3. Remove `useEffect` cleanup (lines 42-48)
4. Add `const [isPlaying, setIsPlaying] = useState(false)` (already exists line 12)
5. Pass `onPlay={() => setIsPlaying(true)}` and `onPause={() => setIsPlaying(false)}` to `AudioPlayer`

```jsx
// After refactor, relevant section:
const [isPlaying, setIsPlaying] = useState(false);
// ... remove audioRef, handlePlayAudio, handlePauseAudio, useEffect cleanup

<AudioPlayer
  audioSrc={currentItem.audio}
  duration="0:30"
  isPlaying={isPlaying}
  onPlay={() => setIsPlaying(true)}
  onPause={() => setIsPlaying(false)}
/>
```

**Verification**: `npm run lint && npm run build` → 0 errors

---

### Task 2: Verify `AudioPlayer` internal sync works

**File**: `src/components/MondaiComponents.jsx`  
**Check**: `useEffect` at lines 53-61 already syncs internal audio when `externalIsPlaying` changes:
```jsx
useEffect(() => {
  if (isControlled && audioRef.current) {
    if (externalIsPlaying && audioRef.current.paused) {
      audioRef.current.play().catch(() => {});
    } else if (!externalIsPlaying && !audioRef.current.paused) {
      audioRef.current.pause();
    }
  }
}, [externalIsPlaying, isControlled]);
```
This will work once parent stops fighting for control.

**Verification**: Manual test at `http://localhost:5173/mondai` — click play button, audio plays, button turns red with pulse, waveform progresses.

---

### Task 3: Handle missing audio files gracefully

**File**: `src/components/MondaiComponents.jsx`  
**Add**: Error boundary UI in `AudioPlayer` when `audioRef.current.error` exists (404 on missing files)

```jsx
// Inside AudioPlayer, after audio element:
const [audioError, setAudioError] = useState(false);

// Add onError to <audio>:
<audio
  ref={audioRef}
  src={audioSrc}
  onTimeUpdate={handleTimeUpdate}
  onEnded={handleEnded}
  onError={() => setAudioError(true)}
/>

// Show fallback:
{audioError && (
  <p className="text-[#e60012] font-mono text-xs mt-2">
    File audio tidak ditemukan: {audioSrc}
  </p>
)}
```

**Verification**: With missing files, shows error message instead of silent failure.

---

### Task 4: Run lint, build, test

**Commands**:
```bash
npm run lint
npm run build
# Manual test: open http://localhost:5173/mondai, click play
```

---

## Tests / Validation

| Step | Action | Expected |
|------|--------|----------|
| 1 | `npm run lint` | 0 errors (warnings OK) |
| 2 | `npm run build` | Success |
| 3 | Open `/mondai` | Page loads, shows question 1 |
| 4 | Click play button (round circle) | Button turns red `#e60012`, pulse animation, "PAUSE" text |
| 5 | Audio plays (if file exists) | Waveform bars fill red progressively, progress bar moves, timestamp updates |
| 6 | Click again (pause) | Button returns to white, "AUDIO PLAY", audio pauses |
| 7 | Audio ends naturally | Button resets to play state, progress resets to 0 |
| 8 | Missing audio file (Q2–Q5) | Red error text "File audio tidak ditemukan: /audio/..." |

---

## Risks, Tradeoffs, Open Questions

- **Audio files missing**: Only `01 Kaiwa.mp3` exists. Questions 2–5 will show error. Need actual MP3 files in `public/audio/` for full test.
- **Waveform progress**: Currently decorative (static heights). Real progress works via `handleTimeUpdate` — verified in code.
- **Controlled vs uncontrolled**: `AudioPlayer` supports both modes via `isControlled` flag. Parent now uses controlled mode correctly.
- **Cleanup**: `MondaiQuiz` no longer needs cleanup effect since `AudioPlayer` owns the audio element lifecycle.

---

## Execution Offer

Plan saved to `.hermes/plans/2025-09-18_153000-fix-mondai-audio-playback.md`.

Ready to execute — want me to proceed?