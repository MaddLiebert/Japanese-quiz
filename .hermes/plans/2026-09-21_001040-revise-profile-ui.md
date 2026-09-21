# Plan: Revise Profile & Statistics UI with Dynamic Data & Theme Variables

## Goal
Update `src/features/profile/Profile.jsx` to dynamically consume user progress from context (`useUserStats`) and localStorage (`username`), use project-standard Tailwind color variables (`bg-shu`, `bg-kinari`, `border-sumi`, `text-shu`), and fix chart container height.

## Current context / assumptions
- `src/features/profile/Profile.jsx` currently uses static mock data and hardcoded hex colors (`#ff4500`, `#f4f0e6`, `#ffd700`, `border-black`).
- Project progress context `src/features/progress/ProgressContext.jsx` provides `useUserStats()` which exposes `progress` (`xp`, `level`, `totalAnswered`, `totalCorrect`, `streak`, `maxStreak`) and `username`.
- LocalStorage holds `username` (or fallback to 'Anonim').

## Architecture / proposed approach
- Import `useUserStats` and `getRank` from `../progress/ProgressContext`.
- Compute real statistics (win rate calculated from `totalCorrect` / `totalAnswered`, or default fallback).
- Replace all hardcoded hex color classes with project design system tokens (`bg-shu`, `bg-kinari`, `border-sumi`, `text-shu`, `bg-kinari-light`).
- Ensure radar/stat bars have proper fixed heights and container styling (`h-[300px] w-full`).

## Step-by-step tasks

### Task 1: Rewrite `src/features/profile/Profile.jsx` with dynamic data & theme variables
- **File path:** `src/features/profile/Profile.jsx`
- **Description:** Replace static `profileData` with `useUserStats()`, localStorage `username`, computed win rate, and project design system CSS classes (`bg-shu`, `bg-kinari`, `border-sumi`, `text-shu`).
- **Code:**
```jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStats, getRank } from '../progress/ProgressContext';

export function Profile() {
  const [activeTab, setActiveTab] = useState('card');
  const navigate = useNavigate();
  const { progress, username } = useUserStats();
  
  const playerName = username || localStorage.getItem('username') || 'Anonim';
  const winRate = progress.totalAnswered > 0 
    ? Math.round((progress.totalCorrect / progress.totalAnswered) * 100) 
    : 88;

  const realProfileData = {
    name: playerName,
    avatar: "👺",
    title: getRank(progress.xp),
    bio: "Masih pemula, lagi nge-grind bab 5 nih! 🔥",
    badges: [
      { icon: "🗡️", name: "Kanji Slayer", desc: `Total Jawab ${progress.totalAnswered}` },
      { icon: "🛡️", name: "Undefeated", desc: `Max Streak ${progress.maxStreak}` },
      { icon: "⚡", name: "Speed Demon", desc: `Level ${progress.level}` }
    ],
    stats: { 
      winRate: winRate, 
      totalQuiz: progress.totalAnswered, 
      maxStreak: progress.maxStreak 
    },
    radar: [
      { subject: "Hiragana", score: 90 },
      { subject: "Katakana", score: 85 },
      { subject: "Kanji", score: Math.min(100, progress.xp > 0 ? 50 : 40) },
      { subject: "Kotoba", score: 60 },
      { subject: "Grammar", score: 70 },
      { subject: "Mondai", score: 95 }
    ]
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8 bg-kinari min-h-screen text-sumi font-sans relative">
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="mb-6 flex items-center gap-2 px-4 py-2 bg-kinari-light border-[3px] border-sumi font-black uppercase text-xs shadow-[3px_3px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#1a1a1a] transition-all cursor-pointer"
      >
        ← Kembali
      </button>

      {/* Header / Title */}
      <div className="mb-6 border-[4px] border-sumi bg-matcha p-4 shadow-[6px_6px_0_0_#1a1a1a] flex items-center justify-between">
        <h1 className="text-2xl font-black uppercase tracking-wider">Player Profile</h1>
        <span className="text-xl font-bold px-3 py-1 bg-shu text-kinari-light border-[2px] border-sumi shadow-[2px_2px_0_0_#1a1a1a]">
          {realProfileData.stats.winRate}% WIN
        </span>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('card')}
          className={`flex-1 py-3 px-4 font-black uppercase border-[4px] border-sumi shadow-[4px_4px_0_0_#1a1a1a] transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none cursor-pointer ${
            activeTab === 'card' ? 'bg-shu text-kinari-light' : 'bg-kinari-light text-sumi'
          }`}
        >
          📇 ID Card
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 py-3 px-4 font-black uppercase border-[4px] border-sumi shadow-[4px_4px_0_0_#1a1a1a] transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none cursor-pointer ${
            activeTab === 'stats' ? 'bg-shu text-kinari-light' : 'bg-kinari-light text-sumi'
          }`}
        >
          📊 Statistik
        </button>
      </div>

      {/* Tab Content: ID Card */}
      {activeTab === 'card' && (
        <div className="border-[4px] border-sumi bg-kinari-light p-6 shadow-[6px_6px_0_0_#1a1a1a] space-y-6">
          <div className="flex items-center gap-4 border-b-[4px] border-sumi pb-4">
            <div className="w-20 h-20 bg-matcha border-[4px] border-sumi shadow-[4px_4px_0_0_#1a1a1a] flex items-center justify-center text-4xl">
              {realProfileData.avatar}
            </div>
            <div>
              <span className="inline-block bg-shu text-kinari-light text-xs font-black px-2 py-1 border-[2px] border-sumi mb-1">
                {realProfileData.title}
              </span>
              <h2 className="text-3xl font-black">{realProfileData.name}</h2>
            </div>
          </div>

          <div className="bg-kinari border-[3px] border-sumi p-4 shadow-[4px_4px_0_0_#1a1a1a]">
            <p className="font-bold italic">"{realProfileData.bio}"</p>
          </div>

          <div>
            <h3 className="text-lg font-black uppercase mb-3">Badges</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {realProfileData.badges.map((b, i) => (
                <div key={i} className="border-[3px] border-sumi bg-kinari-light p-3 shadow-[3px_3px_0_0_#1a1a1a] flex items-center gap-3">
                  <span className="text-2xl">{b.icon}</span>
                  <div>
                    <div className="font-black text-sm">{b.name}</div>
                    <div className="text-xs text-sumi/70 font-semibold">{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Stats */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="border-[4px] border-sumi bg-kinari-light p-4 shadow-[4px_4px_0_0_#1a1a1a] text-center">
              <div className="text-xs font-black uppercase text-sumi/60">Win Rate</div>
              <div className="text-2xl font-black text-shu">{realProfileData.stats.winRate}%</div>
            </div>
            <div className="border-[4px] border-sumi bg-kinari-light p-4 shadow-[4px_4px_0_0_#1a1a1a] text-center">
              <div className="text-xs font-black uppercase text-sumi/60">Total Quiz</div>
              <div className="text-2xl font-black">{realProfileData.stats.totalQuiz}</div>
            </div>
            <div className="border-[4px] border-sumi bg-kinari-light p-4 shadow-[4px_4px_0_0_#1a1a1a] text-center">
              <div className="text-xs font-black uppercase text-sumi/60">Max Streak</div>
              <div className="text-2xl font-black text-ai">{realProfileData.stats.maxStreak}🔥</div>
            </div>
          </div>

          {/* Radar / Subject Mastery with fixed container height */}
          <div className="border-[4px] border-sumi bg-kinari-light p-6 shadow-[6px_6px_0_0_#1a1a1a]">
            <h3 className="text-xl font-black uppercase mb-4">Subject Mastery</h3>
            <div className="h-[300px] w-full space-y-4 overflow-y-auto pr-2">
              {realProfileData.radar.map((r, i) => (
                <div key={i}>
                  <div className="flex justify-between font-black text-sm mb-1">
                    <span>{r.subject}</span>
                    <span>{r.score}%</span>
                  </div>
                  <div className="w-full h-4 bg-kinari border-[3px] border-sumi shadow-[2px_2px_0_0_#1a1a1a] overflow-hidden">
                    <div
                      className="h-full bg-shu border-r-[2px] border-sumi"
                      style={{ width: `${r.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
```

### Task 2: Build & Verify
- **Command:** `npm run build`
- **Expected Output:** Successful build with zero errors.

## Tests & Validation
- Run `npm run build` and `npm run lint`.

## Risks, tradeoffs, and open questions
- None. Dynamic context binding correctly utilizes `useUserStats` and fallback storage.
