# Plan: Implement Profile & Statistics UI (MOBA Style x Neo-Brutalis)

## Goal
Implement the Profile & Statistics view at `src/features/profile/Profile.jsx` adhering to neo-brutalist design principles and the specifications from the Obsidian note dated 9/20/2026.

## Current context / assumptions
- Obsidian note `Next update.md` (9/20/2026) outlines the requirement for `src/features/profile/Profile.jsx`.
- Project uses React (Vite + Tailwind) with neo-brutalist styling (`border-[4px] border-black`, `shadow-[6px_6px_0_0_#000]`, background `#f4f0e6`).
- Existing components use Tailwind and Lucide icons (or standard emoji/SVG icons).

## Architecture / proposed approach
- Create `src/features/profile/Profile.jsx` containing `profileData` mock structure, Tab Navigation (ID Card vs Stats/Radar), badges grid, and neo-brutalist card styling.
- Expose the Profile view in the app navigation (`src/App.jsx` or pages) so users can access it.

## Step-by-step tasks

### Task 1: Create `src/features/profile/Profile.jsx`
- **File path:** `src/features/profile/Profile.jsx`
- **Description:** Implement Profile component with Tab Navigation (ID Card / Stats), badges, bio, win rate, and radar stats breakdown using neo-brutalist styling.
- **Code:**
```jsx
import React, { useState } from 'react';

const profileData = {
  name: "Maddo",
  avatar: "👺",
  title: "🏆 TOP GLOBAL SHOGUN",
  bio: "Masih pemula, lagi nge-grind bab 5 nih! 🔥",
  badges: [
    { icon: "🗡️", name: "Kanji Slayer", desc: "Jawab 50 Kanji" },
    { icon: "🛡️", name: "Undefeated", desc: "Max Streak 15" },
    { icon: "⚡", name: "Speed Demon", desc: "Sub 3-detik" }
  ],
  stats: { winRate: 88, totalQuiz: 142, maxStreak: 15 },
  radar: [
    { subject: "Hiragana", score: 90 },
    { subject: "Katakana", score: 85 },
    { subject: "Kanji", score: 40 },
    { subject: "Kotoba", score: 60 },
    { subject: "Grammar", score: 70 },
    { subject: "Mondai", score: 95 }
  ]
};

export default function Profile() {
  const [activeTab, setActiveTab] = useState('card');

  return (
    <div className="max-w-2xl mx-auto p-4 bg-[#f4f0e6] min-h-screen text-black font-sans">
      {/* Header / Title */}
      <div className="mb-6 border-[4px] border-black bg-[#ffd700] p-4 shadow-[6px_6px_0_0_#000] flex items-center justify-between">
        <h1 className="text-2xl font-black uppercase tracking-wider">Player Profile</h1>
        <span className="text-xl font-bold px-3 py-1 bg-[#ff4500] text-white border-[2px] border-black shadow-[2px_2px_0_0_#000]">
          {profileData.stats.winRate}% WIN
        </span>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('card')}
          className={`flex-1 py-3 px-4 font-black uppercase border-[4px] border-black shadow-[4px_4px_0_0_#000] transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none ${
            activeTab === 'card' ? 'bg-[#ff4500] text-white' : 'bg-white text-black'
          }`}
        >
          📇 ID Card
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 py-3 px-4 font-black uppercase border-[4px] border-black shadow-[4px_4px_0_0_#000] transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none ${
            activeTab === 'stats' ? 'bg-[#ff4500] text-white' : 'bg-white text-black'
          }`}
        >
          📊 Statistik
        </button>
      </div>

      {/* Tab Content: ID Card */}
      {activeTab === 'card' && (
        <div className="border-[4px] border-black bg-white p-6 shadow-[6px_6px_0_0_#000] space-y-6">
          <div className="flex items-center gap-4 border-b-[4px] border-black pb-4">
            <div className="w-20 h-20 bg-[#ffd700] border-[4px] border-black shadow-[4px_4px_0_0_#000] flex items-center justify-center text-4xl">
              {profileData.avatar}
            </div>
            <div>
              <span className="inline-block bg-[#ff4500] text-white text-xs font-black px-2 py-1 border-[2px] border-black mb-1">
                {profileData.title}
              </span>
              <h2 className="text-3xl font-black">{profileData.name}</h2>
            </div>
          </div>

          <div className="bg-[#f4f0e6] border-[3px] border-black p-4 shadow-[4px_4px_0_0_#000]">
            <p className="font-bold italic">"{profileData.bio}"</p>
          </div>

          <div>
            <h3 className="text-lg font-black uppercase mb-3">Badges</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {profileData.badges.map((b, i) => (
                <div key={i} className="border-[3px] border-black bg-white p-3 shadow-[3px_3px_0_0_#000] flex items-center gap-3">
                  <span className="text-2xl">{b.icon}</span>
                  <div>
                    <div className="font-black text-sm">{b.name}</div>
                    <div className="text-xs text-gray-700 font-semibold">{b.desc}</div>
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
            <div className="border-[4px] border-black bg-white p-4 shadow-[4px_4px_0_0_#000] text-center">
              <div className="text-xs font-black uppercase text-gray-600">Win Rate</div>
              <div className="text-2xl font-black text-[#ff4500]">{profileData.stats.winRate}%</div>
            </div>
            <div className="border-[4px] border-black bg-white p-4 shadow-[4px_4px_0_0_#000] text-center">
              <div className="text-xs font-black uppercase text-gray-600">Total Quiz</div>
              <div className="text-2xl font-black">{profileData.stats.totalQuiz}</div>
            </div>
            <div className="border-[4px] border-black bg-white p-4 shadow-[4px_4px_0_0_#000] text-center">
              <div className="text-xs font-black uppercase text-gray-600">Max Streak</div>
              <div className="text-2xl font-black text-[#ffd700]">{profileData.stats.maxStreak}🔥</div>
            </div>
          </div>

          {/* Radar / Subject Mastery */}
          <div className="border-[4px] border-black bg-white p-6 shadow-[6px_6px_0_0_#000]">
            <h3 className="text-xl font-black uppercase mb-4">Subject Mastery</h3>
            <div className="space-y-4">
              {profileData.radar.map((r, i) => (
                <div key={i}>
                  <div className="flex justify-between font-black text-sm mb-1">
                    <span>{r.subject}</span>
                    <span>{r.score}%</span>
                  </div>
                  <div className="w-full h-4 bg-[#f4f0e6] border-[3px] border-black shadow-[2px_2px_0_0_#000] overflow-hidden">
                    <div
                      className="h-full bg-[#ff4500] border-r-[2px] border-black"
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
```

### Task 2: Integrate Profile into Application Navigation
- **File path:** `src/App.jsx` (or routing file)
- **Description:** Add route / navigation item for Profile component.
- **Verification Command:** `npm run build`
- **Expected Output:** Clean build without bundling errors.

## Tests & Validation
- Run `npm run build` to verify JSX compilation.
- Run `npm run lint` to check for syntax/lint errors.

## Risks, tradeoffs, and open questions
- None. Styling strictly matches neo-brutalist guidelines specified in the Obsidian update note.
