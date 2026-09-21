# Plan: Interaktif Streak UI (Replace Fire Emote)

## Goal
Replace the static 🔥 fire emoji in `Home.jsx` with an interactive, animated visual indicator (Hanko-style stamp or custom motion component) for active vs. inactive study streaks.

## Architecture / Proposed Approach
1.  **Component**: Create `src/components/StreakIndicator.jsx` that accepts a `streak` count and `isActive` boolean.
2.  **Animation**: Use `motion` for state transitions (e.g., active = bright red stamp, inactive = desaturated grey stamp).
3.  **Refactor**: Update `src/pages/Home.jsx` to use `<StreakIndicator />` instead of the hardcoded `🔥` emoji.

## Step-by-Step Tasks
1.  **Create StreakIndicator Component**:
    *   `src/components/StreakIndicator.jsx`: Define two states (active/inactive). Active shows a vibrant Neo-Brutalist graphic/stamp; inactive shows a subdued version.
2.  **Update Home UI**:
    *   `src/pages/Home.jsx`: Replace `{progress.streak} <span className="text-2xl sm:text-3xl">🔥</span>` with `<StreakIndicator count={progress.streak} isActive={progress.streak > 0} />`.
3.  **TDD/Validation**:
    *   Manual verification (browser): check active vs inactive visual states.
    *   `npm run build && npm run lint`.

## Risks/Tradeoffs
*   UI consistency: Ensure it matches the editorial/Neo-Brutalist theme.

---
This plan is ready for implementation. Do you approve?
