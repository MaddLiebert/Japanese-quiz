# Product Requirements Document — Japanese Quiz

## 1. Product Overview

"Japanese Quiz" is a singleplayer, offline-first web application designed for beginners learning Japanese. The product guides users from basic Kana mastery towards JLPT N5 readiness. The core learning loop emphasizes active recall, repeated practice, clear feedback, and gradual progression, avoiding passive study methods.

## 2. Problem Statement

Japanese beginners often struggle with rote memorization of Kana and introductory vocabulary. Existing tools are frequently bloated with social features, generic gamification, or overwhelming grammar explanations too early in the journey. Users need a focused, offline-first, aesthetically intentional environment that prioritizes active recall, identifies weak points, and enforces targeted review.

## 3. Goals

* Help beginners learn Hiragana.
* Expand learning progressively into Katakana and Kotoba (Vocabulary).
* Identify material the user struggles with automatically.
* Encourage and facilitate repeated review of weak items.
* Track learning progress seamlessly.
* Gradually introduce Grammar, Reading, and Listening.
* Eventually provide an N5 Challenge as an end-goal benchmark.

## 4. Non-Goals

The MVP and immediate roadmap explicitly exclude:

* User accounts / Login authentication
* Backend infrastructure / Cloud synchronization
* Multiplayer / Social features / Chat
* Leaderboards
* Payments / Subscriptions

## 5. Target Users

* Japanese beginners starting from zero.
* Students preparing for the JLPT N5 exam.
* Self-learners seeking structured repetition.
* Users who prefer interactive, quiz-based learning over passive reading.

## 6. User Journey

The core loop is strict and cyclic:
**LEARN** → **PRACTICE** → **MAKE MISTAKES** → **REVIEW** → **MASTER** → **EARN XP** → **CONTINUE**

## 7. Information Architecture

* **Home:** Dashboard for progress, streaks, and quick-start actions.
* **Learn:** Sequential flashcard modules for Kana and Kotoba.
* **Practice:** Configurable quiz setup.
* **Review:** Dedicated mode for addressing weak/failed items.
* **Progress:** Detailed statistics, mastery percentages, and achievements.

## 8. Current Product State

The product currently exists as a functional prototype containing:

* Basic row-based Hiragana & Katakana learning (Flashcards).
* Configurable Quiz system with difficulty levels and S/A/B/C grading.
* Small Kotoba engine (basic vocabulary).
* Mixed Quiz (Hiragana + Kotoba).
* Basic Weak Characters review system.
* LocalStorage-based progress tracking (XP, level, streak, achievements).

## 9. Feature Requirements

### 9.1 Kana Learning (Hiragana & Katakana)

* **[EXISTING]** Basic Hiragana and Katakana organized by rows (あ行, か行, etc.).
* **[EXISTING]** Flashcard interface: character, Romaji, tip, audio/pronunciation, flip action, previous/next, mastered toggle.
* **[PLANNED]** Dakuten (が, ざ, だ, ば).
* **[PLANNED]** Handakuten (ぱ).
* **[PLANNED]** Yōon (きゃ, しゃ, etc.).
* **[PROPOSED]** Visual stroke order animations on flashcard flip.

### 9.2 Practice / Quiz Engine

* **[EXISTING]** Select category (Hiragana/Katakana/Kotoba/Mixed) and specific rows.
* **[EXISTING]** Difficulty Selection:
* Easy: 5 questions, 3 options.
* Medium: 10 questions, 4 options.
* Hard: 15 questions, 6 options.


* **[EXISTING]** Randomized questions and answer positions.
* **[EXISTING]** Results screen: Score %, Correct/Total, Grade (S: 100%, A: 80-99%, B: 60-79%, C: <60%), Feedback, Retry.
* **[PLANNED]** Full Kana Challenge combining all learned Kana.

### 9.3 Kotoba (Vocabulary)

* **[EXISTING]** Small dataset of vocabulary (Hiragana, Romaji, Meaning).
* **[EXISTING]** Quiz Mode 1: Japanese → Romaji + Meaning.
* **[PLANNED]** Expand dataset to 20+, 50+, 100+, 200+ words.
* **[PLANNED]** Categorization (Greetings, Numbers, Time, Days, Family, etc.).
* **[PLANNED]** Quiz Mode 2: Japanese → Meaning.
* **[PLANNED]** Quiz Mode 3: Meaning → Japanese.
* **[PLANNED]** Quiz Mode 4: Japanese → Romaji.
* **[PLANNED]** Quiz Mode 5: Listening → Japanese.
* **[PLANNED]** Quiz Mode 6: Vocabulary in sentence context.

### 9.4 Mixed Quiz

* **[EXISTING]** Combines Hiragana and Kotoba.
* **[PLANNED]** Expand to include Katakana, Grammar, Reading, and Listening.

### 9.5 Review System

* **[EXISTING]** Weak list populated by incorrect quiz answers.
* **[EXISTING]** Ability to practice weak characters directly.
* **[PLANNED]** Expand weak list to include Katakana, Kotoba, and Grammar.

### 9.6 Gamification & Progress

* **[EXISTING]** XP, Level, Streak, Max Streak tracking.
* **[EXISTING]** Mastery % and Accuracy % metrics.
* **[EXISTING]** Achievements: First Quiz, Perfect Score, 100 XP, 5 Day Streak, Clean Up.
* **[PROPOSED]** Achievements: Master 10 Hiragana, Master all Hiragana/Katakana, Learn 50 Kotoba, 7-day streak, Perfect Hiragana/Kotoba quiz, Complete N5 Challenge.

### 9.7 Grammar

* **[PLANNED]** Introduce particles: は, が, を, に, で, の, と, も.
* **[PLANNED]** Introduce basic verbs/copula: です, ます.
* **[PLANNED]** Example sentence structures.
* **[PLANNED]** Quiz types: Multiple choice, Fill in the blank, Sentence ordering.

### 9.8 Reading & Listening

* **[PLANNED]** Reading progression: Short sentence → Daily-life sentences → Short paragraph.
* **[PLANNED]** Reading focus: Vocabulary/Grammar recognition, basic comprehension.
* **[PLANNED]** Listening progression: Character → Vocabulary → Short sentence.
* **[EXISTING]** Audio engine foundation via current character pronunciation tool.

### 9.9 N5 Challenge

* **[PLANNED]** Final singleplayer exam mode combining all categories.
* **[PLANNED]** Results breakdown by category to recommend next study steps.

## 10. UX Requirements

* **Focus:** No distractions. The UI must support the learning loop directly.
* **Active Recall:** Users must guess before seeing answers whenever possible.
* **Feedback:** Immediate, unambiguous visual and physical (animation) feedback on correct/incorrect actions.
* **Progression:** Gamification must feel earned and secondary to actual language acquisition.

## 11. Visual Design System

**Direction:** MODERN JAPANESE EDITORIAL.
The UI must NOT resemble a generic SaaS dashboard, a Duolingo clone, or rely on AI-generated anime/sakura tropes.

* **Palette:**
* *Sumi (Dark Ink):* Primary text and high-contrast borders.
* *Ai (Deep Indigo):* Primary buttons, active states.
* *Shu (Vermilion):* Accents, incorrect answers, notifications, Hanko stamps.
* *Kinari (Warm Paper):* Backgrounds, card faces.
* *Matcha (Muted Green):* Success states, S-grades, mastered badges.


* **Textures/Patterns:** Subtle Washi paper grain, Seigaiha/Asanoha patterns at low opacity, organic brush stroke decorations.
* **Typography:** Japanese editorial style (clean sans-serif for UI, highly legible Mincho/Gothic for Japanese characters).
* **Shapes:** Slightly rounded cards, medium radius buttons, circular Japanese seals (Hanko) for achievements/grades, clean rectangular forms for progress bars.

## 12. Animation Guidelines

* **[PROPOSED]** Stack: Framer Motion.
* **Required Animations:**
* Page transitions (fade + slight upward drift).
* Flashcard flip (3D rotation with spring physics).
* Quiz question transitions (slide in/out).
* Correct-answer: Subtle scale up + color shift.
* Wrong-answer: Quick horizontal shake + color shift.
* Floating XP text on quiz completion.
* Smooth, eased progress bar fills.
* Achievement stamp: Scale down and lock into place with a slight rotation (Hanko effect).
* Button hover/press: Slight scale down to feel tactile.


* **Constraints:** Avoid excessive bouncing, particle spam, and flashy gradients. Motion must feel intentional and rooted in physical materials.

## 13. Screen Specifications

### 13.1 Home

* Product identity/logo.
* Today's progress (XP, Level, Streak).
* Recommended next lesson based on weak items or next logical row.
* Quick navigation: Learn, Practice, Review.

### 13.2 Learn

* Vertical/grid layout of Hiragana/Katakana rows.
* Flashcard view modal/overlay.
* Clear mastered toggle button.
* Pronunciation audio trigger.

### 13.3 Practice (Quiz Setup)

* Category selection (Hiragana, Katakana, Kotoba, Mixed).
* Scope selection (Specific rows vs. All).
* Difficulty toggle (Easy/Medium/Hard).
* "Start Quiz" sticky action.

### 13.4 Quiz Session

* Top bar: Question counter (e.g., 3/10) and linear progress bar.
* Center: Large, highly legible Japanese content.
* Bottom/Grid: Answer options (large touch targets).
* Immediate color/animation feedback upon selection.

### 13.5 Quiz Result

* Large Grade letter (S/A/B/C) styled as a Hanko seal.
* Score percentage and Correct/Total ratio.
* XP gained animation.
* List of items answered incorrectly (Weak items added).
* Actions: Retry, Go to Review, Return Home.

### 13.6 Review

* List/Grid of current weak items.
* "Start Review" button.
* Updates mastery visually upon successful review.

### 13.7 Progress

* Detailed stats: Global Mastery %, Accuracy %, Total XP, Current Level, Streak metrics.
* Achievement grid (locked vs. unlocked).

## 14. Quiz Logic

* **[EXISTING]** Questions are pulled dynamically based on user selection.
* **[EXISTING]** Distractors (wrong answers) are selected randomly from the same category/pool as the correct answer.
* **[NEEDS DECISION]** Logic for generating distractors for complex Grammar/Sentence questions.
* **[EXISTING]** Grades: S (100%), A (80–99%), B (60–79%), C (<60%).

## 15. Mastery & Review Logic

* **[EXISTING]** Incorrectly answered quiz item → added to Weak list.
* **[EXISTING]** Correctly answered in Review → removed from Weak list.
* **[NEEDS DECISION]** Spaced Repetition (SRS) parameters for the MVP: How many consecutive correct answers dictate "Mastery"? Does a mastered item instantly degrade to "Weak" on a single failure?
* **[PROPOSED]** MVP Logic: 1 failure = Weak. 2 consecutive correct quiz/review answers = Mastered.

## 16. XP & Achievement Logic

* **[NEEDS DECISION]** Base XP values per question answered correctly (e.g., 10 XP per correct Kana, 20 XP per Kotoba).
* **[PROPOSED]** Streak multiplier: +5% XP for every consecutive day, capped at +50% (10 days).
* **[EXISTING]** Level thresholds scale progressively.
* **[EXISTING]** Local evaluation of Achievement triggers at the end of every quiz session.

## 17. Data Model

All data is stored in browser `localStorage`.

* `user_progress`: `{ xp: int, level: int, accuracy: float, totalAnswered: int, totalCorrect: int, streak: int, maxStreak: int, lastActiveDate: string }`
* `mastery_data`: `{ hiragana: { 'あ': status, ... }, katakana: {}, kotoba: {} }` (status: 'new' | 'learning' | 'weak' | 'mastered')
* `weak_items`: Array of item IDs currently flagged for review.
* `achievements_unlocked`: Array of achievement IDs and timestamps.
* `app_settings`: `{ audioEnabled: boolean, difficultyPreference: string }`

*Static Data (JSON imported locally, not in localStorage):* Kana definitions, Vocabulary lists, Grammar rules.

## 18. Technical Constraints

* **Stack:** React, Vite, Tailwind CSS, Framer Motion.
* **Architecture:** Must separate UI components, Quiz logic, Progress logic, Storage utilities, and Static data into distinct directories (`components/`, `features/`, `pages/`, `data/`, `utils/`).
* **Offline-First:** No API calls required for core loop. Static assets (audio, images) must be bundled or cached locally.

## 19. Accessibility

* **Touch:** Answer options and navigation buttons must have a minimum touch target of 44x44px.
* **Keyboard:** Full keyboard navigability for the quiz session (e.g., number keys 1-6 for answer selection, Space/Enter to advance).
* **Visual:** Minimum WCAG AA contrast ratios, especially against Kinari (warm paper) backgrounds. Correct/Wrong states must use icons or text labels, not solely rely on Matcha/Shu colors.
* **Motion:** Respect `prefers-reduced-motion` CSS media query by disabling shake/flip animations and falling back to fades.

## 20. Responsive Design

* **Mobile-first approach.**
* **Mobile:** Single column, bottom-anchored actions for easy thumb reach.
* **Tablet:** Two-column layouts for Progress and Review screens.
* **Desktop:** Constrained max-width container (e.g., `max-w-2xl` or `max-w-4xl`) centered on screen to maintain editorial proportions; do not stretch to full width.

## 21. Performance

* Instantaneous transitions between questions (<50ms).
* Audio files must be pre-loaded for the current quiz session to prevent lag on flip/pronunciation.
* Bundle sizes kept minimal; lazy load distinct phases (e.g., N5 Challenge module) if they grow too large.

## 22. MVP Roadmap

* **Phase 1 — Existing Foundation:** Stabilize basic Hiragana/Katakana, Flashcards, Practice, Difficulty, Results, and localStorage architecture.
* **Phase 2 — Review & Gamification:** Implement Review screen, Weak Characters routing, XP, Level, Streak, Achievements, and Progress dashboard.

## 23. Future Roadmap

* **Phase 3:** Full Hiragana (Dakuten, Handakuten, Yōon, Full Challenge).
* **Phase 4:** Full Katakana (parity with Hiragana features).
* **Phase 5:** Expanded Kotoba (Categories, various Quiz modes).
* **Phase 6:** Mixed Kana + Kotoba quizzes.
* **Phase 7:** Grammar (Particles, basic verbs, sentence structure).
* **Phase 8:** Reading (Sentence to paragraph progression).
* **Phase 9:** Listening (Character to sentence audio comprehension).
* **Phase 10:** N5 Challenge (Comprehensive exam mode).
* **Phase 11 (Future):** Accounts, backend infrastructure, cloud sync, multiplayer, and leaderboards (only after singleplayer maturity).

## 24. Acceptance Criteria (MVP Phase 1 & 2)

* User can view and interact with all basic Hiragana and Katakana flashcards.
* User can play a quiz on Easy, Medium, and Hard difficulties without crashes.
* Quiz accurately calculates S/A/B/C grades and saves XP to localStorage.
* Incorrect answers automatically populate the Weak Items list.
* User can successfully complete a Review session that removes items from the Weak list upon correct answers.
* UI strictly adheres to the "Modern Japanese Editorial" design system (no generic SaaS styling).
* All progress persists after a browser refresh.