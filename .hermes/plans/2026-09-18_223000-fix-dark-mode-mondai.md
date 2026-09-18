# Plan: Fix Dark Mode Issues in Mondai Components

## Goal
Replace all hardcoded hex colors in `MondaiComponents.jsx` with semantic Tailwind color tokens (`sumi`, `kinari`, `kinari-light`, `shu`, `matcha`, `ai`) so they automatically adapt to dark/light mode.

## Current Context / Assumptions
- Theme system: CSS custom properties in `src/index.css` lines 3-21 swap on `.dark` / `[data-theme="dark"]`
- Semantic Tailwind colors defined: `sumi`, `ai`, `shu`, `kinari`, `kinari-light`, `matcha`
- `MondaiComponents.jsx` uses many hardcoded hex: `#fcf9f4`, `#f6f3ee`, `#1a1a1a`, `#dcdad5`, `#e60012`, `#1b315e`, `#87a96b`, `#f3f0e8`, etc.
- These don't change in dark mode → white backgrounds stay white, dark text stays dark → invisible

## Architecture / Approach
Systematically replace every hardcoded color in `MondaiComponents.jsx` with its semantic token equivalent:
- `#1a1a1a` / `#f3efe6` (dark sumi) → `sumi`
- `#fcf9f4` / `#1c1d21` (dark kinari-light) → `kinari-light`
- `#f6f3ee` / `#141517` (dark kinari) → `kinari`
- `#f3f0e8` / `#141517` (dark kinari) → `kinari` (for `bg-kinari`)
- `#dcdad5` / dark variant → `kinari` or `backdrop`
- `#e60012` / `#ef4c3c` (dark shu) → `shu`
- `#1b315e` / `#4f80c2` (dark ai) → `ai`
- `#87a96b` / `#8fa874` (dark matcha) → `matcha`
- `#d3382f` / `#ef4c3c` (dark shu) → `shu`
- `shadow-[6px_6px_0_0_#1a1a1a]` → `shadow-[6px_6px_0_0_rgba(var(--sumi-val),1)]` or use `shadow-sumi` pattern

## Step-by-Step Tasks

### Task 1: Fix AudioPlayer component
**File**: `src/components/MondaiComponents.jsx`
**Lines**: 65-147
**Replacements**:
- Line 66: `bg-[#f6f3ee]` → `bg-kinari`
- Line 66: `border-[#1a1a1a]` → `border-sumi`
- Line 66: `shadow-[6px_6px_0_0_#1a1a1a]` → `shadow-[6px_6px_0_0_rgba(var(--sumi-val),1)]`
- Line 76: `bg-[#1a1a1a]` → `bg-sumi`
- Line 80: `border-[#1a1a1a]` → `border-sumi`
- Line 82: `bg-[#e60012]` → `bg-shu`
- Line 82: `text-[#fcf9f4]` → `text-kinari-light`
- Line 83: `bg-[#fcf9f4]` → `bg-kinari-light`
- Line 83: `text-[#1a1a1a]` → `text-sumi`
- Line 83: `hover:bg-[#f6f3ee]` → `hover:bg-kinari`
- Line 111: `bg-[#fcf9f4]` → `bg-kinari-light`
- Line 111: `border-[#1a1a1a]` → `border-sumi`
- Line 111: `shadow-[3px_3px_0_0_#1a1a1a]` → `shadow-[3px_3px_0_0_rgba(var(--sumi-val),1)]`
- Line 121: `bg-[#e60012]` → `bg-shu`
- Line 122: `bg-[#1a1a1a]` → `bg-sumi`
- Line 124: `bg-[#1a1a1a]/30` → `bg-sumi/30`
- Line 132: `bg-[#dcdad5]` → `bg-kinari` (or `bg-backdrop`)
- Line 132: `border-[#1a1a1a]` → `border-sumi`
- Line 133: `bg-[#e60012]` → `bg-shu`
- Line 138: `text-[#1a1a1a]` → `text-sumi`
- Line 144: `text-[#1a1a1a]/70` → `text-sumi/70`

### Task 2: Fix QuizHeader component
**File**: `src/components/MondaiComponents.jsx`
**Lines**: 151-207
**Replacements**:
- Line 162: `border-[#1a1a1a]` → `border-sumi`
- Line 165: `border-[#1a1a1a]` → `border-sumi`
- Line 165: `bg-[#fcf9f4]` → `bg-kinari-light`
- Line 168: `text-[#1a1a1a]/60` → `text-sumi/60`
- Line 173: `border-[#1a1a1a]` → `border-sumi`
- Line 173: `bg-[#fcf9f4]` → `bg-kinari-light`
- Line 176: `text-[#1a1a1a]/60` → `text-sumi/60`
- Line 184: `border-[#1a1a1a]` → `border-sumi`
- Line 184: `bg-[#f6f3ee]` → `bg-kinari`
- Line 184: `shadow-[4px_4px_0_0_#1a1a1a]` → `shadow-[4px_4px_0_0_rgba(var(--sumi-val),1)]`
- Line 186: `bg-[#1a1a1a]` → `bg-sumi`
- Line 186: `text-[#fcf9f4]` → `text-kinari-light`
- Line 193: `text-[#1a1a1a]/60` → `text-sumi/60`
- Line 195: `text-[#1a1a1a]` → `text-sumi`
- Line 200: `bg-[#e60012]` → `bg-shu`
- Line 200: `text-[#fcf9f4]` → `text-kinari-light`
- Line 200: `border-[#1a1a1a]` → `border-sumi`
- Line 200: `shadow-[2px_2px_0_0_#1a1a1a]` → `shadow-[2px_2px_0_0_rgba(var(--sumi-val),1)]`

### Task 3: Fix ExplanationBox component
**File**: `src/components/MondaiComponents.jsx`
**Lines**: 209-311
**Replacements**:
- Line 220: `border-[#1a1a1a]` → `border-sumi`
- Line 220: `bg-[#fcf9f4]` → `bg-kinari-light`
- Line 220: `shadow-[4px_4px_0_0_#1a1a1a]` → `shadow-[4px_4px_0_0_rgba(var(--sumi-val),1)]`
- Line 223: `border-[#1a1a1a]` → `border-sumi`
- Line 224: `bg-[#87a96b]` → `bg-matcha`
- Line 224: `text-[#1a1a1a]` → `text-sumi`
- Line 225: `bg-[#e60012]` → `bg-shu`
- Line 225: `text-[#fcf9f4]` → `text-kinari-light`
- Line 230: `text-[#1a1a1a]` → `text-sumi`
- Line 233: `text-[#1a1a1a]/70` → `text-sumi/70`
- Line 243: `border-[#1a1a1a]` → `border-sumi`
- Line 243: `bg-[#fcf9f4]` → `bg-kinari-light`
- Line 243: `shadow-[2px_2px_0_0_#1a1a1a]` → `shadow-[2px_2px_0_0_rgba(var(--sumi-val),1)]`
- Line 246: `border-[#1a1a1a]` → `border-sumi`
- Line 246: `bg-[#fcf9f4]` → `bg-kinari-light`
- Line 246: `shadow-[2px_2px_0_0_#1a1a1a]` → `shadow-[2px_2px_0_0_rgba(var(--sumi-val),1)]`
- Line 246: `text-[#e60012]` → `text-shu`
- Line 255: `border-[#1a1a1a]` → `border-sumi`
- Line 255: `bg-[#fcf9f4]` → `bg-kinari-light`
- Line 255: `shadow-[4px_4px_0_0_#1a1a1a]` → `shadow-[4px_4px_0_0_rgba(var(--sumi-val),1)]`
- Line 257: `bg-[#1a1a1a]` → `bg-sumi`
- Line 257: `text-white` → `text-kinari-light` (or keep white since on sumi bg)
- Line 260: `text-[#1a1a1a]/60` → `text-sumi/60`
- Line 265: `border-[#e60012]` → `border-shu`
- Line 265: `bg-[#f6f3ee]/60` → `bg-kinari/60`
- Line 268: `text-[#e60012]` → `text-shu`
- Line 269: `text-[#1b315e]` → `text-ai`
- Line 278: `border-[#1a1a1a]/20` → `border-sumi/20`
- Line 278: `bg-[#87a96b]/15` → `bg-matcha/15`
- Line 278: `border-[#1a1a1a]` → `border-sumi`
- Line 281: `text-[#1a1a1a]` → `text-sumi`
- Line 284: `text-[#1a1a1a]` → `text-sumi`
- Line 292: `border-[#1a1a1a]` → `border-sumi`
- Line 292: `bg-[#fcf9f4]` → `bg-kinari-light`
- Line 292: `shadow-[3px_3px_0_0_#1a1a1a]` → `shadow-[3px_3px_0_0_rgba(var(--sumi-val),1)]`
- Line 292: `hover:bg-[#f6f3ee]` → `hover:bg-kinari`
- Line 300: `border-[#1a1a1a]` → `border-sumi`
- Line 301: `bg-[#1b315e]` → `bg-ai`
- Line 301: `text-[#fcf9f4]` → `text-kinari-light`
- Line 301: `shadow-[4px_4px_0_0_#1a1a1a]` → `shadow-[4px_4px_0_0_rgba(var(--sumi-val),1)]`
- Line 301: `hover:bg-opacity-90` → keep
- Line 303: `opacity-50 cursor-not-allowed bg-[#1b315e]/50` → `opacity-50 cursor-not-allowed bg-ai/50`
- Line 304: `bg-[#1b315e] text-[#fcf9f4]` → `bg-ai text-kinari-light`

### Task 4: Fix MondaiQuizResult component
**File**: `src/components/MondaiComponents.jsx`
**Lines**: 313-407
**Replacements**:
- Line 333: `border-sumi` → keep (already semantic)
- Line 333: `bg-kinari-light` → keep
- Line 333: `shadow-[12px_12px_0_0_rgba(26,26,26,0.1)]` → `shadow-[12px_12px_0_0_rgba(var(--sumi-val),0.1)]`
- Line 335: `text-sumi` → keep
- Line 345: `border-shu` → keep
- Line 345: `text-shu` → keep
- Line 345: `bg-kinari-light` → keep
- Line 347: `border-shu` → keep
- Line 348: `text-shu` → keep
- Line 351: `text-ai` → keep
- Line 358: `text-sumi` → keep
- Line 358: `text-ai` → keep
- Line 358: `border-sumi` → keep
- Line 361: `text-sumi/80` → keep
- Line 362: `text-shu` → keep
- Line 364: `text-shu` → keep
- Line 369: `bg-kinari` → keep
- Line 369: `border-sumi` → keep
- Line 369: `shadow-[8px_8px_0_0_#1a1a1a]` → `shadow-[8px_8px_0_0_rgba(var(--sumi-val),1)]`
- Line 370: `text-sumi/60` → keep
- Line 370: `border-sumi/20` → keep
- Line 377: `bg-kinari-light` → keep
- Line 377: `border-sumi/10` → keep
- Line 378: `text-sumi` → keep
- Line 380: `text-ai` → keep
- Line 393: `border-sumi` → keep
- Line 393: `bg-kinari` → keep
- Line 393: `text-sumi` → keep
- Line 393: `shadow-[6px_6px_0_0_#1a1a1a]` → `shadow-[6px_6px_0_0_rgba(var(--sumi-val),1)]`
- Line 399: `border-sumi` → keep
- Line 399: `bg-sumi` → keep
- Line 399: `text-kinari-light` → keep
- Line 399: `shadow-[6px_6px_0_0_#1a1a1a]` → `shadow-[6px_6px_0_0_rgba(var(--sumi-val),1)]`

### Task 5: Verify build and test dark mode
```bash
npm run build
npm run dev
# Toggle dark mode in browser, inspect Mondai Quiz pages
```

## Tests / Validation
- `npm run build` passes
- Manual: Toggle dark mode in browser dev tools → all Mondai Quiz UI elements have proper contrast
- Check: AudioPlayer, QuizHeader, ExplanationBox, MondaiQuizResult all readable in both modes
- No hardcoded hex colors remain (grep for `#[0-9a-fA-F]{3,8}` in file)

## Risks, Tradeoffs, Open Questions
- **Shadow colors**: Using `rgba(var(--sumi-val), 1)` for shadows to match theme. Could also define `--shadow-color` CSS variable.
- **Inline styles**: Some dynamic classes use template literals — ensure token syntax works (`bg-sumi/30` etc.)
- **Performance**: No impact — compile-time Tailwind classes
- **Scope**: Only `MondaiComponents.jsx` fixed. Other components may have same issue.