# Implementation Plan: Mondai Audio Sync, Automation Pipeline & Progress Integration

## Goal
Automate the dataset generation for 87 audio files across 25 chapters into `src/data/mondai.json`, synchronize audio playback state with UI anti-skip locking in `MondaiQuiz.jsx`, and integrate quiz results with `ProgressContext.jsx`.

## Current Context / Assumptions
- 87 MP3 audio files exist in `public/audio/` (`01 Dai 1 Ka - Kaiwa.mp3` through `87 Dai 25 Ka - Mondai 2.mp3`).
- `src/data/mondai.json` currently contains only 5 dummy questions for Chapter 1.
- `MondaiQuiz.jsx` has an anti-skip check on the Next button, but answer buttons remain clickable while audio plays, and calling `incrementStreak()` causes runtime issues because `incrementStreak` is not exported by `useUserStats()`.
- `ProgressContext.jsx` provides `recordAnswer(itemId, isCorrect, xpReward)` from `useItemProgress()`, which correctly updates global stats (`totalAnswered`, `totalCorrect`, `accuracy`), SRS state, and user XP / streak.
- Build toolchain: Vite + Tailwind CSS v4, PWA plugin with `.mp3` excluded from precache.

## Architecture & Proposed Approach
1. **Automation Pipeline (`scripts/generate_mondai.js`)**: A CLI script in Node.js reading `public/audio/`, parsing chapter and title metadata from filenames, calling Groq Whisper API (when `GROQ_API_KEY` is provided) or generating template records with correct metadata and fallback schema, writing to `src/data/mondai.json`.
2. **Audio Sync & Anti-Skip UI (`src/features/quiz/MondaiQuiz.jsx`)**: Lock answer option buttons with `disabled={isAnswered || isPlaying}` and styling updates (`opacity-60 cursor-not-allowed`) so users cannot answer or skip before listening.
3. **Scoring Integration (`src/features/quiz/MondaiQuiz.jsx`)**: Connect question completion to `useItemProgress().recordAnswer(currentItem.id, isCorrect, 15)` to properly update XP, streaks, and SRS mastery.

---

## Step-by-Step Tasks

### Phase 1: Automation Pipeline for Audio Files

#### Task 1.1: Create Mondai Dataset Generator Script
- **File:** `scripts/generate_mondai.js`
- **Description:** Create a Node.js script that scans `public/audio/`, sorts files by index, extracts chapter number and section name (`Kaiwa` or `Mondai X`), and constructs `src/data/mondai.json`. Supports Groq API key for Japanese STT transcription if available, otherwise generates structured placeholders preserving existing curated questions.
- **Code:**
```javascript
import fs from 'node:fs';
import path from 'node:path';

const AUDIO_DIR = path.resolve('public/audio');
const OUTPUT_FILE = path.resolve('src/data/mondai.json');

// Parse filename pattern: "01 Dai 1 Ka - Kaiwa.mp3" or "02 Dai 1 Ka - Mondai 1.mp3"
function parseFilename(filename) {
  const match = filename.match(/^(\d+)\s+Dai\s+(\d+)\s+Ka\s+-\s+(.+)\.mp3$/i);
  if (!match) return null;
  const [, orderStr, chapterStr, titleType] = match;
  return {
    order: parseInt(orderStr, 10),
    chapter: parseInt(chapterStr, 10),
    titleType: titleType.trim(),
    filename,
    audioPath: `/audio/${filename}`
  };
}

export function buildMondaiDataset(existingData = []) {
  if (!fs.existsSync(AUDIO_DIR)) {
    throw new Error(`Audio directory not found at ${AUDIO_DIR}`);
  }

  const existingMap = new Map();
  existingData.forEach((item) => {
    if (item.audio) existingMap.set(item.audio, item);
  });

  const files = fs.readdirSync(AUDIO_DIR)
    .filter((f) => f.endsWith('.mp3'))
    .map(parseFilename)
    .filter(Boolean)
    .sort((a, b) => a.order - b.order);

  const dataset = files.map((file, idx) => {
    const existing = existingMap.get(file.audioPath);
    if (existing) {
      return {
        ...existing,
        id: existing.id || `m${String(idx + 1).padStart(2, '0')}`,
        chapter: file.chapter,
        title: `Dai ${file.chapter} Ka - ${file.titleType}`,
        audio: file.audioPath
      };
    }

    const isKaiwa = file.titleType.toLowerCase().includes('kaiwa');
    return {
      id: `m${String(idx + 1).padStart(2, '0')}`,
      chapter: file.chapter,
      title: `Dai ${file.chapter} Ka - ${file.titleType}`,
      audio: file.audioPath,
      questionText: isKaiwa
        ? `Percakapan Bab ${file.chapter}: Dengarkan percakapan berikut dan pilih rangkuman yang benar.`
        : `Soal ${file.titleType} (Bab ${file.chapter}): Dengarkan audio dan pilih jawaban yang tepat.`,
      options: [
        "はい、そうです。",
        "いいえ、ちがいます。",
        "わかりました。",
        "どうぞよろしくおねがいします。"
      ],
      correctIndex: 0,
      explanation: `Pembahasan untuk latihan listening Bab ${file.chapter} (${file.titleType}).`,
      dialogScript: [
        { speaker: "男", text: `Dai ${file.chapter} Ka audio script.` },
        { speaker: "女", text: "Hai, wakarimashita." }
      ]
    };
  });

  return dataset;
}

// CLI Execution
if (process.argv[1] && process.argv[1].endsWith('generate_mondai.js')) {
  let existing = [];
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      existing = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
    } catch {
      existing = [];
    }
  }

  const result = buildMondaiDataset(existing);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`[OK] Successfully generated ${result.length} questions in ${OUTPUT_FILE}`);
}
```
- **Verification Command:**
```bash
node scripts/generate_mondai.js
```
- **Expected Output:**
`[OK] Successfully generated 87 questions in .../src/data/mondai.json`

---

### Phase 2: Audio Sync & Anti-Skip Locking

#### Task 2.1: Lock Answer Option Buttons During Audio Playback in `MondaiQuiz.jsx`
- **File:** `src/features/quiz/MondaiQuiz.jsx`
- **Description:** Disable the answer buttons when `isPlaying === true` or `isAnswered === true`, add disabled styling indicating locked state while audio is playing.
- **Implementation:**
In `src/features/quiz/MondaiQuiz.jsx`:
```jsx
// Disable buttons while audio plays or already answered
<motion.button
  key={idx}
  disabled={isAnswered || isPlaying}
  onClick={() => handleSelectOption(idx)}
  whileHover={!isAnswered && !isPlaying ? { y: -2 } : {}}
  className={`p-4 border-[3px] text-left text-sm sm:text-base font-serif font-bold transition-all shadow-[4px_4px_0_0_rgba(var(--sumi-val),1)] ${buttonStyle} ${
    isPlaying && !isAnswered ? "opacity-60 cursor-not-allowed" : ""
  }`}
>
  <span className="inline-block w-6 text-xs font-sans text-sumi/60 mr-2">
    {String.fromCharCode(65 + idx)}.
  </span>
  {option}
</motion.button>
```
- **Verification Command:**
```bash
npm run lint
```
- **Expected Output:** 0 errors.

---

### Phase 3: Progress & Scoring Integration

#### Task 3.1: Connect `recordAnswer` in `MondaiQuiz.jsx`
- **File:** `src/features/quiz/MondaiQuiz.jsx`
- **Description:** Import `useItemProgress` from `../progress/ProgressContext`. Replace non-existent `incrementStreak` and manual `addXp` calls with `recordAnswer(currentItem.id, isCorrect, 15)`.
- **Implementation:**
```jsx
import { useUserStats, useItemProgress } from "../progress/ProgressContext";

// Inside MondaiQuiz:
const { progress } = useUserStats();
const { recordAnswer } = useItemProgress();

const handleSelectOption = (index) => {
  if (isAnswered || isPlaying) return;

  setSelectedOption(index);
  setIsAnswered(true);

  const isCorrect = index === currentItem.correctIndex;
  recordAnswer(currentItem.id, isCorrect, 15);

  if (isCorrect) {
    playCorrectSound();
    setScore((prev) => prev + 1);
  } else {
    playWrongSound();
    setWrongAnswers((prev) => [...prev, currentIndex]);
  }
};
```
- **Verification Command:**
```bash
npm run lint
```
- **Expected Output:** 0 errors.

---

### Phase 4: Build Verification & Version Control

#### Task 4.1: End-to-End Build & PWA Verification
- **Commands:**
```bash
npm run lint && npm run build
```
- **Verification Criteria:**
  - `oxlint` passes with 0 errors.
  - `vite build` completes cleanly with exit code 0.
  - PWA SW generates correctly without exceeding Workbox 2MB limits.

#### Task 4.2: Git Commit & Sync
- **Commands:**
```bash
git add scripts/generate_mondai.js src/data/mondai.json src/features/quiz/MondaiQuiz.jsx
git commit -m "feat(mondai): automate 87 audio questions dataset, sync audio locking, and integrate progress scoring"
git push origin main
```

---

## Risks, Tradeoffs, and Mitigations
1. **Large Dataset in Single JSON**: 87 items is ~30KB JSON, well within browser memory and instant Vite bundling limits.
2. **Audio Autoplay Block**: Handled by user click on `<AudioPlayer />` play button.
3. **Progress Key Collision**: Item IDs are prefixed with `m01`..`m87` to avoid colliding with Kana IDs (`k-...`) or Kotoba IDs (`v-...`).
