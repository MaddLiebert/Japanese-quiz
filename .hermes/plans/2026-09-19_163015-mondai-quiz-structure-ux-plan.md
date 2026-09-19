# UX Plan: Mondai Quiz Structure (Software Engineer Perspective)

## Goal
Membuat struktur soal yang mendukung *flow state* belajar bahasa Jepang secara optimal dengan mempertimbangkan kognisi, retensi, dan engagement.

---

## Current State
- 87 soal audio dalam 25 bab (Bab 1–25)
- Tiap bab: 1 percakapan + 1–3 soal latihan
- Tidak ada pembatasan akses — user bisa akses semua soal

---

## UX Principles untuk Belajar Bahasa

### 1. Progressive Difficulty (Spiral Curriculum)
- Setiap bab membangun dari bab sebelumnya
- Vocabulary & grammar complexity meningkat bertahap
- Revisit topics dengan depth bertambah

### 2. Chunking & Cognitive Load
- Otak manusia hold max 4-7 items dalam working memory
- Soal harus di-group jadi "单元" (chunks) yang bisa diselesaikan dalam 5-10 menit
- Istirahat antar bab = micro-break untuk consolidation

### 3. Mastery Learning
- User harus "pass" bab sebelum lanjut (atau minimal get minimal score)
- Tidak ada惩罚, tapi feedback clear: "Ready for next chapter?"

### 4. Contextual Retrieval
- Soal harus menguji *retrieval* dalam konteks audio natural
- Bukan hafalan vocab, tapi *listening comprehension* dalam kalimat

---

## Proposed Structure: Chapter-Based with Unlock & Progress

### Architecture
```
Quiz Layout
├── Chapter Selector (Sidebar/Grid)
│   ├── Locked chapters (grayed, padlock)
│   ├── Current chapter (highlight)
│   └── Completed chapters (checkmark, open)
├── Chapter Header (Chapter N — Title)
│   ├── Summary audio (replayable)
│   └── Learning objectives (3 bullet points)
└── Question Sequence (N questions)
    ├── Interactive audio player (diselesaikan sebelumnya)
    ├── Question card
    │   ├── Question text + audio trigger
    │   ├── 4 options
    │   └── Explanation toggle (post-answer)
    └── Navigation (Prev/Next/Submit)
```

### User Flow
1. **Chapter Selection Screen**
   - Grid 3x2 (mobile: 1 col)
   - Each card: Chapter number, title, status icon
   - Click to enter chapter → loads chapter intro

2. **Chapter Intro Screen**
   - "Learning Objectives" (3 specific outcomes)
   - Replay chapter audio summary
   - "Start Quiz" button
   - "Back to Menu" button

3. **Quiz Mode**
   - Sequential questions (prev/next disabled except current/previous)
   - Progress bar (X/Y questions)
   - Audio replay button (always visible)
   - Submit all → Results screen

4. **Results Screen**
   - Score (percentage)
   - Pass/Fail threshold (≥70%)
   - "Review Incorrect" button
   - "Next Chapter" (unlock if passed)
   - "Replay Chapter" button

---

## Implementation Priority (MVP → Polish)

### MVP (This Week)
- [ ] Chapter Selector Screen (grid 3x2)
- [ ] Chapter Intro Screen (objectives + audio summary)
- [ ] Sequential Question Flow (prev/next enabled)
- [ ] Progress bar (X/Y)
- [ ] Submit → Score → Results

### Polish (Next Week)
- [ ] Unlock mechanism (pass chapter to unlock next)
- [ ] Chapter audio summary (10-sec highlight)
- [ ] Review mode (incorrect answers only)
- [ ] Achievement badges (streak, speed, perfect chapter)
- [ ] Dark mode toggle (already exist)

### Advanced (Future)
- [ ] Speed control per question (0.8x → 1.25x)
- [ ] Transcript toggle (show/hide text)
- [ ] Personalized review (weak areas)
- [ ] Spaced repetition scheduling

---

## Data Structure Change

### Existing (Flat)
```json
[
  { "id": "m01", "chapter": 1, "title": "...", "audio": "...", ... },
  { "id": "m02", "chapter": 1, "title": "...", "audio": "...", ... },
  ...
]
```

### Proposed (Hierarchical)
```json
{
  "chapters": [
    {
      "id": "c01",
      "chapter": 1,
      "title": "Dai 1 Ka — Perkenalan Dasar",
      "summaryAudio": "/audio/c01-summary.mp3",
      "objectives": [
        "Mengenal kata sapaan dasar (先生, 学生, 会社員)",
        "Menguasai kalimat perkenalan (Hajimemashite...)",
        "Memahami percakapan 2 orang dalam situasi formal"
      ],
      "audio": "/audio/c01-kaiwa.mp3",
      "questions": [
        { "id": "m01", "type": "kaiwa", "order": 1, ... },
        { "id": "m02", "type": "mondai", "order": 2, ... }
      ]
    },
    ...
  ]
}
```

### Migration Steps
1. Read existing `mondai.json`
2. Group by `chapter`
3. Create chapter metadata (title, objectives, summaryAudio)
4. Save as `mondai-chapters.json`
5. Update `MondaiQuiz.jsx` & `Practice.jsx` → chapter-aware

---

## UI/UX Details (Neo-Brutalist + Pro Max)

### Chapter Card
```jsx
<motion.div
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  className={`
    border-[3px] p-6 shadow-[5px_5px_0_0_rgba(30,30,30,1)]
    ${isLocked ? "opacity-60 grayscale" : "bg-kinari-light"}
  `}
>
  <div className="flex justify-between items-start">
    <span className="text-[24px] font-bold text-sumi">第{chapter}課</span>
    {isCompleted && <CheckIcon className="text-shu" />}
  </div>
  <h3 className="font-bold text-lg mt-2 mb-1">{title}</h3>
  <p className="text-xs text-sumi/70">{numQuestions} soal</p>
</motion.div>
```

### Progress Bar
```jsx
<div className="w-full h-3 bg-kinari border border-sumi relative">
  <motion.div
    className="h-full bg-shu"
    initial={{ width: 0 }}
    animate={{ width: `${(currentIndex / total) * 100}%` }}
  />
  <span className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold">
    {currentIndex + 1} / {total}
  </span>
</div>
```

### Results Screen
```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  className="text-center"
>
  <h2 className="text-3xl font-bold mb-4">
    {score >= 70 ? "Sempurna! Chapter Selesai" : "Lanjutkan Latihan"}
  </h2>
  <div className="text-5xl font-mono font-bold text-shu my-6">
    {score}%
  </div>
  <p className="text-sumi/80 mb-8">{score >= 70 ? "Next chapter unlocked!" : "Target: 70%"} </p>
  <div className="flex flex-wrap justify-center gap-3">
    {score >= 70 && <Button onClick={nextChapter}>Chapter Berikutnya →</Button>}
    <Button variant="outline" onClick={review}>Review Jawaban Salah</Button>
    <Button variant="ghost" onClick={retry}>Ulangi Chapter</Button>
  </div>
</motion.div>
```

---

## Testing Strategy (TDD Per Module)

### Test 1: ChapterGrouping (unit)
- Input: flat array 87 soal
- Output: grouped object 25 chapters
- Edge case: missing chapter, duplicate IDs

### Test 2: ChapterSelector (component)
- Click locked chapter → no action + toast
- Click unlocked → navigate to chapter intro
- Keyboard: arrow keys + Enter to select

### Test 3: Quiz Flow (integration)
- Sequential navigation (prev/next)
- Submit → score calculation
- Results → unlock logic

### Test 4: Accessibility (automated)
- Keyboard navigation全程
- ARIA labels on all buttons
- Contrast ≥ 4.5:1

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Large JSON restructure | Breaking existing links | Add backward compat layer (read old JSON if new missing) |
| chapter intro adds latency | Slow first load | Lazy-load chapter details |
| Unlock mechanism frustrating | High dropout | Make "replay" easy, no hard lock |
| New screen confusion | Learning curve | Animation cues + clear navigation |

---

## Next Steps (Ready to Execute)
1. Generate `mondai-chapters.json` from existing data
2. Build `ChapterSelector.jsx` component
3. Build `ChapterIntro.jsx` component
4. Update `MondaiQuiz.jsx` → chapter-aware
5. Build `QuizResults.jsx` component
6. Add unlock logic & state persistence
7. TDD + lint + build + commit

---

## Estimated Effort
- Data migration: 15 min
- ChapterSelector + ChapterIntro: 45 min
- Quiz flow update: 30 min
- Results + unlock: 20 min
- TDD + lint + build: 20 min
- **Total**: ~2 hours MVP

---

*Plan ready for implementation. Next: approve structure, then run `hermes-agent` to execute.*
