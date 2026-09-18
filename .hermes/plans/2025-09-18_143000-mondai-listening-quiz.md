# Plan: Mondai Listening Quiz Feature

**Date**: 2025-09-18  
**Source**: Obsidian `brain/Task_Mondai.md`  
**Repo**: `C:\Users\maddo\Documents\japanese-quiz`

---

## Goal

Integrate a complete **Mondai Listening Quiz** page (JLPT N4) using the existing neo-brutalist design system, consuming the pre-built components in `src/components/MondaiComponents.jsx` and expanding the question dataset.

---

## Current Context / Assumptions

- **Tech**: React 19 + Vite + Tailwind CSS v4 + React Router v7 + Motion (Framer Motion)
- **Design system** already defined in `src/index.css` (CSS variables + `@theme`):
  - Colors: `sumi` (#1a1a1a), `kinari` (#f3f0e8), `kinari-light` (#fdfcf9), `shu` (#e60012), `matcha` (#87a96b), `ai` (#1b315e)
  - Fonts: `Noto Serif JP` (serif), `JetBrains Mono` (mono via `font-mono`)
  - Shadows: hard offset `shadow-[4px_4px_0_0_#1a1a1a]` etc.
  - Borders: 3-4px solid `sumi`
- **Existing components** in `src/components/MondaiComponents.jsx`:
  - `QuizHeader` — branding stamp, user stats (streak/XP), chapter tags, question counter
  - `AudioPlayer` — large round play/pause button, waveform visualizer, progress bar, timestamps
  - `ExplanationBox` — result banner, transcript with speaker labels (男=red, 女=blue), explanation, retry/next buttons
- **Existing page** `src/features/quiz/MondaiQuiz.jsx` — basic implementation, **does not use** the above components
- **Data** `src/data/mondai.json` — only 1 question, needs 5+ for Chapter 1
- **Route** `/mondai` already linked in `Home.jsx` (line 295)
- **Progress context** (`useUserStats`) provides `addXp`, `incrementStreak`

---

## Architecture / Approach

1. **Refactor `MondaiQuiz.jsx`** to compose the three pre-built components (`QuizHeader`, `AudioPlayer`, `ExplanationBox`) instead of inline UI
2. **Expand `mondai.json`** to 5 questions for Chapter 1 with realistic JLPT N4 listening content
3. **Wire up state** — `currentIndex`, `isPlaying`, `selectedOption`, `isAnswered` — passed as props to components
4. **No new files** needed — reuse existing components, extend data, update page

---

## Step-by-Step Tasks

### Task 1: Expand `mondai.json` to 5 Chapter 1 questions

**File**: `src/data/mondai.json`  
**Action**: Replace entire file with 5 questions (id m01–m05), each with: `audio`, `questionText`, `options[4]`, `correctIndex`, `explanation`, `dialogScript` (for transcript)

```json
[
  {
    "id": "m01",
    "chapter": 1,
    "title": "Dai 1 Ka - Mondai 1",
    "audio": "/audio/02 Dai 1 Ka - Mondai 1.mp3",
    "questionText": "Pertanyaan 1: Dengarkan audio berikut dan pilih jawaban yang paling tepat.",
    "options": [
      "はい、わたしはがくせいです。",
      "いいえ、いしゃではありません。",
      "はじめまして、マイク・ミラーです。",
      "アメリカからきました。"
    ],
    "correctIndex": 2,
    "explanation": "Pada percakapan audio pertama, pembicara memperkenalkan diri dengan salam 'Hajimemashite, Maiku Miraa desu'.",
    "dialogScript": [
      { "speaker": "男", "text": "はじめまして、マイク・ミラーです。アメリカから来ました。" },
      { "speaker": "女", "text": "はじめまして。私は田中です。よろしくお願いします。" }
    ]
  },
  {
    "id": "m02",
    "chapter": 1,
    "title": "Dai 1 Ka - Mondai 2",
    "audio": "/audio/03 Dai 1 Ka - Mondai 2.mp3",
    "questionText": "Pertanyaan 2: Apa yang dikatakan pria tersebut?",
    "options": [
      "わたし は がくせい です。",
      "わたし は せんせい です。",
      "わたし は かいしゃいん です。",
      "わたし は いしゃ です。"
    ],
    "correctIndex": 0,
    "explanation": "Pria tersebut menyatakan 'Watashi wa gakusei desu' (Saya adalah mahasiswa).",
    "dialogScript": [
      { "speaker": "女", "text": "ミラーさんは、学生ですか。" },
      { "speaker": "男", "text": "はい、私は学生です。" }
    ]
  },
  {
    "id": "m03",
    "chapter": 1,
    "title": "Dai 1 Ka - Mondai 3",
    "audio": "/audio/04 Dai 1 Ka - Mondai 3.mp3",
    "questionText": "Pertanyaan 3: Siapa nama pria tersebut?",
    "options": [
      "たなか さん",
      "まいく・みらー さん",
      "さとう さん",
      "すずき さん"
    ],
    "correctIndex": 1,
    "explanation": "Nama pria tersebut adalah Maiku Miraa (Mike Miller) seperti yang diperkenalkannya.",
    "dialogScript": [
      { "speaker": "女", "text": "ミラーさん、お国はどちらですか。" },
      { "speaker": "男", "text": "アメリカです。" }
    ]
  },
  {
    "id": "m04",
    "chapter": 1,
    "title": "Dai 1 Ka - Mondai 4",
    "audio": "/audio/05 Dai 1 Ka - Mondai 4.mp3",
    "questionText": "Pertanyaan 4: Dari mana asal pria tersebut?",
    "options": [
      "イギリス から きました。",
      "アメリカ から きました。",
      "オーストラリア から きました。",
      "カナダ から きました。"
    ],
    "correctIndex": 1,
    "explanation": "Pria tersebut menjawab 'Amerika desu' ketika ditanya asal negaranya.",
    "dialogScript": [
      { "speaker": "女", "text": "ミラーさん、お国はどちらですか。" },
      { "speaker": "男", "text": "アメリカです。" }
    ]
  },
  {
    "id": "m05",
    "chapter": 1,
    "title": "Dai 1 Ka - Mondai 5",
    "audio": "/audio/06 Dai 1 Ka - Mondai 5.mp3",
    "questionText": "Pertanyaan 5: Apa pekerjaan wanita tersebut?",
    "options": [
      "せんせい です。",
      "かいしゃいん です。",
      "がくせい です。",
      "いしゃ です。"
    ],
    "correctIndex": 0,
    "explanation": "Wanita tersebut memperkenalkan diri sebagai sensei (guru).",
    "dialogScript": [
      { "speaker": "男", "text": "田中さんは、お仕事は何ですか。" },
      { "speaker": "女", "text": "私は先生です。" }
    ]
  }
]
```

**Verification**: `cat src/data/mondai.json | jq length` → `5`

---

### Task 2: Refactor `MondaiQuiz.jsx` to use pre-built components

**File**: `src/features/quiz/MondaiQuiz.jsx`  
**Action**: Replace entire file content with composition of `QuizHeader`, `AudioPlayer`, `ExplanationBox`

```jsx
import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { QuizHeader, AudioPlayer, ExplanationBox } from "../../components/MondaiComponents";
import { playCorrectSound, playWrongSound } from "../../utils/sfx";
import { useUserStats } from "../progress/ProgressContext";
import mondaiData from "../../data/mondai.json";
import { useNavigate } from "react-router-dom";

export function MondaiQuiz() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const audioRef = useRef(null);
  const { addXp, incrementStreak, progress } = useUserStats();
  const navigate = useNavigate();

  const currentItem = mondaiData[currentIndex];

  const handlePlayAudio = () => {
    if (!currentItem?.audio || audioRef.current) return;
    const audio = new Audio(currentItem.audio);
    audioRef.current = audio;
    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    audio.onended = () => { setIsPlaying(false); audioRef.current = null; };
    audio.onerror = () => { setIsPlaying(false); audioRef.current = null; };
  };

  const handlePauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    return () => { if (audioRef.current) audioRef.current.pause(); };
  }, []);

  const handleSelectOption = (index) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
    if (index === currentItem.correctIndex) {
      playCorrectSound();
      addXp(15);
      incrementStreak();
    } else {
      playWrongSound();
    }
  };

  const handleNext = () => {
    if (currentIndex < mondaiData.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setIsPlaying(false);
    } else {
      navigate("/");
    }
  };

  const handleRetry = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    setIsPlaying(false);
  };

  if (!currentItem) return null;

  const audioDuration = "0:30"; // fallback; could parse from audio metadata

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 min-h-screen flex flex-col justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-[4px] border-sumi bg-kinari-light p-6 sm:p-10 shadow-[12px_12px_0_0_rgba(26,26,26,0.1)] relative"
      >
        <QuizHeader
          chapter={currentItem.chapter}
          chapterTitle={currentItem.title}
          currentStep={currentIndex + 1}
          totalSteps={mondaiData.length}
          streak={progress.streak}
          xp={progress.xp}
        />

        <h2 className="text-lg sm:text-xl font-serif font-bold text-sumi mb-6 text-center">
          {currentItem.questionText}
        </h2>

        <AudioPlayer
          audioSrc={currentItem.audio}
          duration={audioDuration}
          isPlaying={isPlaying}
          onPlay={handlePlayAudio}
          onPause={handlePauseAudio}
          audioRef={audioRef}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          {currentItem.options.map((option, idx) => {
            let buttonStyle = "bg-kinari text-sumi border-sumi hover:bg-kinari-light";
            if (isAnswered) {
              if (idx === currentItem.correctIndex) buttonStyle = "bg-matcha text-sumi border-sumi font-bold";
              else if (idx === selectedOption) buttonStyle = "bg-shu text-kinari-light border-sumi font-bold";
              else buttonStyle = "bg-kinari/50 text-sumi/40 border-sumi/40";
            }
            return (
              <motion.button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleSelectOption(idx)}
                whileHover={!isAnswered ? { y: -2 } : {}}
                className={`p-4 border-[3px] text-left text-sm sm:text-base font-serif font-bold transition-all shadow-[4px_4px_0_0_#1a1a1a] ${buttonStyle}`}
              >
                <span className="inline-block w-6 text-xs font-sans text-sumi/60 mr-2">
                  {String.fromCharCode(65 + idx)}.
                </span>
                {option}
              </motion.button>
            );
          })}
        </div>

        {isAnswered && (
          <ExplanationBox
            dialogScript={currentItem.dialogScript}
            explanation={currentItem.explanation}
            onNext={handleNext}
            onRetry={handleRetry}
          />
        )}
      </motion.div>
    </div>
  );
}
```

**Verification**: `npm run dev` → navigate to `/mondai` → page loads, shows 5 questions, audio plays, answer selection works, explanation shows, next/retry work.

---

### Task 3: Fix `AudioPlayer` prop interface (align with usage)

**File**: `src/components/MondaiComponents.jsx`  
**Action**: Update `AudioPlayer` component signature to accept `isPlaying`, `onPlay`, `onPause`, `audioRef` props (currently uses internal state)

**Change**: Lines 3–119 — replace internal `useState/useRef` with props:
- Remove `const [isPlaying, setIsPlaying] = useState(false);`
- Remove `const audioRef = useRef(null);`
- Remove `togglePlay`, `handleTimeUpdate`, `handleEnded`
- Use `props.isPlaying`, `props.onPlay`, `props.onPause`, `props.audioRef`
- Keep waveform visualizer (static decorative bars) — progress can stay static or bind to audio `currentTime` if desired

**Verification**: Audio play/pause works from parent, waveform decorates.

---

### Task 4: Run lint & build

**Commands**:
```bash
npm run lint
npm run build
```

**Expected**: Both exit 0, no errors.

---

## Tests / Validation

| Step | Command | Expected Output |
|------|---------|-----------------|
| 1 | `npm run dev` | Vite starts, no console errors |
| 2 | Open `http://localhost:5173/mondai` | Quiz page renders with header, audio player, 4 options |
| 3 | Click play button | Audio plays, button turns red with pulse, waveform fills |
| 4 | Select correct answer | Green "正解" stamp, +15 XP toast, explanation box appears |
| 5 | Click "SOAL BERIKUTNYA" | Next question loads, state resets |
| 6 | Select wrong answer | Red highlight on wrong, green on correct, explanation appears |
| 7 | Click "↺ ULANGI SOAL" | Same question resets, can re-answer |
| 8 | Complete all 5 questions | Redirects to `/` (home) |
| 9 | `npm run lint` | 0 errors |
| 10 | `npm run build` | Production build succeeds |

---

## Risks, Tradeoffs, Open Questions

- **Audio files** — placeholder paths `/audio/02 Dai 1 Ka - Mondai 1.mp3` etc. must exist in `public/audio/` or quiz will error silently. Verify or add dummy files.
- **Waveform progress** — currently decorative (static bars). Real-time progress requires binding to `audioRef.current.currentTime` in `AudioPlayer`; can be added later.
- **`dialogScript`** — added to JSON for transcript display; `ExplanationBox` expects it.
- **Dark mode** — shadows/colors handled via CSS variables in `index.css`; components use semantic color classes (`sumi`, `shu`, etc.) so should work.
- **No new dependencies** — all components exist, only wiring needed.

---

## Execution Offer

Plan saved to `.hermes/plans/2025-09-18_143000-mondai-listening-quiz.md`.

Ready to execute via subagent-driven development — want me to proceed?