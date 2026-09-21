# Plan: Feature — Customizable Profile Badges (Display & Selection)

## Goal
Implement a badge selection system in the Profile ID Card view where users can select up to 4 unlocked badges to display prominently.

## Current context / assumptions
- `src/features/progress/ProgressContext.jsx` already tracks unlocked `achievements`.
- `src/features/profile/Profile.jsx` currently lists all unlocked badges.
- Need to add state for `selectedBadges` (up to 4) and a selection UI in the Profile.

## Architecture / proposed approach
- Add `selectedBadges` state to `ProgressContext` (persisted in `localStorage`).
- In `Profile.jsx`, introduce an "Edit Mode" for badges:
    - If in edit mode, toggle selection of unlocked badges (max 4).
    - If not, display the selected badges.
- Persist `selectedBadges` to `localStorage` under `selected_badges`.

## Step-by-step tasks

### Task 1: Add `selectedBadges` to `ProgressContext`
- **File path:** `src/features/progress/ProgressContext.jsx`
- **Changes:**
    - Add `selectedBadges` state (persisted to localStorage).
    - Expose `selectedBadges` and `setSelectedBadges` in `useAchievements()`.

### Task 2: Implement Badge Selection UI in `Profile.jsx`
- **File path:** `src/features/profile/Profile.jsx`
- **Changes:**
    - Add `isEditingBadges` state.
    - If `isEditingBadges` is true, show ALL unlocked badges with a checkbox/toggle.
    - If max 4 selected, disable others.
    - Save selection to `selectedBadges`.
    - Update ID Card view to show only the selected badges when NOT in edit mode.

### Task 3: Build & Verify
- **Command:** `npm run build`
- **Expected Output:** Build success, badge toggling works, persistence check.

## Risks, tradeoffs, and open questions
- Need to handle edge case where `selectedBadges` contains badges that are no longer "unlocked" (though unlikely).
- UX: Clear distinction between "Unlocked" vs "Selected" in edit mode.
