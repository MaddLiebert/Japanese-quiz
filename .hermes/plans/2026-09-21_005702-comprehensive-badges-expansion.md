# Plan: Comprehensive Expanded Badge & Achievement Catalog (N5 Lore & Samurai Mastery)

## Goal
Design and catalog a comprehensive, multi-tiered badge system covering all learning dimensions (Kana, Kanji, Kotoba, Grammar, Choukai, Streaks, Dedication, Speed) with Japanese Kanji stamps, cool titles, and concrete unlock conditions.

## Current context / assumptions
- `ACHIEVEMENT_META` in `src/features/progress/ProgressContext.jsx` currently has 8 badges.
- The app covers Hiragana, Katakana, Kanji, Kotoba, Grammar, and Mondai (Choukai/Listening).
- The user wants a broader, more complete badge catalog to reward various playstyles and study milestones.

## Catalog Architecture: 6 Pillars of Mastery

### 1. 🈲 Huruf & Fondasi (Scripts & Foundations)
- `平` **Hiragana Pioneer** (Kuasai 46 Hiragana dasar)
- `片` **Katakana Navigator** (Kuasai 46 Katakana dasar)
- `斬` **Kanji Slayer** (Jawab 50 Kanji dengan tepat)
- `文` **Grammar Architect** (Selesaikan 20 latihan Tata Bahasa)
- `語` **Kotoba Hoarder** (Kuasai 100 kosakata N5)

### 2. 🎧 Pendengaran & Auditori (Choukai & Listening)
- `聴` **Golden Ears** (Selesaikan bab 1 Mondai listening)
- `響` **Echo Master** (Skor sempurna 100% pada satu sesi Mondai)

### 3. 🔥 Ketahanan & Konsistensi (Streaks & Discipline)
- `不` **Undefeated** (Max streak 15 jawaban benar beruntun)
- `極` **Perseverance King** (Capai study streak 7 hari berturut-turut)
- `月` **Monthly Ronin** (Capai study streak 30 hari)

### 4. ⚡ Kecepatan & Akurasi (Skill & Precision)
- `雷` **Lightning Reflex** (Rata-rata waktu menjawab sub-3 detik)
- `的` **Dead Eye Bullseye** (Akurasi 100% pada kuis minimal 20 soal)

### 5. 🌙 Dedikasi Khusus (Special Habits)
- `夜` **Midnight Scholar** (Belajar di atas jam 23:00)
- `暁` **Early Bird Samurai** (Belajar di pagi hari sebelum jam 07:00)
- `清` **Clean Slate** (Bersihkan semua antrean review soal lemah)

### 6. 🏆 Jenjang Kepangkatan XP (Prestige & Level)
- `初` **First Steps** (Selesaikan kuis pertama)
- `百` **Century Club** (Kumpulkan 100 XP)
- `千` **Millennium Legend** (Kumpulkan 1,000 XP)
- `将` **Grand Shogun** (Capai Level 10 atau 10,000 XP)

## Step-by-step tasks

### Task 1: Update `ACHIEVEMENT_META` in `src/features/progress/ProgressContext.jsx`
- Add all newly designed badges with labels, titles, and descriptions.
- Ensure backwards compatibility with previously earned badges.

### Task 2: Implement Triggers in `checkAchievements`
- Add logic for early bird (`hour < 7`), accuracy, xp thresholds, and streak thresholds.

### Task 3: Build & Verify
- Run `npm run build && npm run lint` to guarantee clean bundle and execution.

## Risks, tradeoffs, and open questions
- UI overflow: With 18+ badges, `Profile.jsx` badge selection modal/grid should remain responsive and cleanly scrollable.
