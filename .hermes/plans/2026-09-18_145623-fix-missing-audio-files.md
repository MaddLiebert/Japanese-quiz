# Plan: Fix Missing Audio Files for Mondai Quiz

## Goal
Audio tidak bisa diputar karena file audio yang direferensikan di `mondai.json` tidak ada di `public/audio/`. Hanya file `01 Dai 1 Ka - Kaiwa.mp3` yang ada, sedangkan data butuh file 02-06.

## Current Context / Assumptions
- Project: Vite + React + Tailwind (Japanese quiz app)
- Audio files referensi di `src/data/mondai.json` lines 6, 25, 44, 63, 82
- File aktual di `public/audio/` hanya `01 Dai 1 Ka - Kaiwa.mp3` (959KB)
- AudioPlayer component di `src/components/MondaiComponents.jsx` memakai `<audio src={audioSrc}>`
- User constraint: 4GB RAM, avoid heavy browser automation

## Architecture / Approach
Two options:
1. **Download/generate missing audio files** (02-06) - but source unknown
2. **Update `mondai.json` to point to existing file** (01) for all entries - quick fix
3. **Remove audio feature** - not ideal for listening quiz

Recommended: Option 2 (quick fix) + Option 1 (long term). Update JSON to use existing file for now, so quiz works. Later add proper audio files.

## Step-by-Step Tasks

### Task 1: Verify current audio files and JSON references
**File**: `src/data/mondai.json`, `public/audio/`
**Action**: Confirm mismatch
```bash
ls -la public/audio/
cat src/data/mondai.json | grep audio
```
**Expected**: Shows only 01 file exists, JSON references 02-06

### Task 2: Update mondai.json to use existing audio file
**File**: `src/data/mondai.json`
**Change**: Replace all `/audio/02 Dai 1 Ka - Mondai 1.mp3` etc with `/audio/01 Dai 1 Ka - Kaiwa.mp3`
**Code**:
```json
// Line 6, 25, 44, 63, 82 - change all to:
"audio": "/audio/01 Dai 1 Ka - Kaiwa.mp3",
```
**Command**:
```bash
sed -i 's|/audio/0[2-6] Dai 1 Ka - Mondai [1-5]\.mp3|/audio/01 Dai 1 Ka - Kaiwa.mp3|g' src/data/mondai.json
```
**Verify**: `grep audio src/data/mondai.json` - all should show same file

### Task 3: Test audio plays in dev
**Command**: `npm run dev`
**Manual test**: Open localhost, go to Mondai Quiz, click play button
**Expected**: Audio plays (same file for all questions, but functional)

### Task 4: Run lint and build
**Commands**:
```bash
npm run lint
npm run build
```
**Expected**: No errors, build succeeds

## Tests / Validation
- `npm run lint` passes (oxlint)
- `npm run build` passes (vite build)
- Manual: audio plays on click in browser dev server

## Risks, Tradeoffs, Open Questions
- **Tradeoff**: All questions use same audio file (Kaiwa dialog) - not question-specific
- **Risk**: User may notice same audio repeats; but functional > broken
- **Open**: Where to source proper per-question audio files? Need to download from Minna no Nihongo CD or record
- **Future**: Add proper audio files when available, revert JSON to specific paths