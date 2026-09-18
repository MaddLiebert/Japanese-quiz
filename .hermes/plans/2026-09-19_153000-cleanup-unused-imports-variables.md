# Plan: Cleanup Unused Imports & Variables

## Goal
Remove all unused imports, variables, and parameters flagged by oxlint/eslint to reduce bundle size and improve code clarity.

## Current Context
- Repository: Japanese Quiz (Vite + React + Tailwind)
- Linter: oxlint (ESLint-compatible)
- 5 files with unused declarations detected

## Architecture / Approach
Direct surgical removal of each unused declaration. Each change is isolated, verified with `npm run lint`, and committed atomically. No functional changes — only dead code elimination.

## Step-by-Step Tasks

### Task 1: Remove unused `id` parameter from `AchievementStamp` in `src/pages/Home.jsx`
- **File**: `src/pages/Home.jsx`, line 23
- **Change**: Remove `id` from destructuring

```diff
-const AchievementStamp = ({ id, meta, index }) => (
+const AchievementStamp = ({ meta, index }) => (
```

- **Verification**: `npm run lint` — should eliminate "Parameter 'id' is declared but never used" warning

### Task 2: Remove unused `mixedPools` state in `src/pages/Practice.jsx`
- **File**: `src/pages/Practice.jsx`, line 98
- **Change**: Delete the entire line

```diff
-  const [mixedPools, setMixedPools] = useState(['hiragana', 'katakana', 'kotoba', 'grammar', 'kanji']);
```

- **Verification**: `npm run lint` — should eliminate "Variable 'mixedPools' is declared but never used"

### Task 3: Remove unused `toggleMixedPool` function in `src/pages/Practice.jsx`
- **File**: `src/pages/Practice.jsx`, lines 246-249
- **Change**: Delete the entire function block

```diff
-  const toggleMixedPool = (pool) => {
-    setMixedPools(prev =>
-      prev.includes(pool)
-        ? prev.filter(p => p !== pool)
-        : [...prev, pool]
-    );
-  };
```

- **Verification**: `npm run lint` — should eliminate "Variable 'toggleMixedPool' is declared but never used"

### Task 4: Remove unused `isKanaMode` constant in `src/pages/Practice.jsx`
- **File**: `src/pages/Practice.jsx`, line 287
- **Change**: Delete the line

```diff
-      const isKanaMode = !isKotobaMode && !isKanjiMode && !isGrammarMode;
```

- **Verification**: `npm run lint` — should eliminate "Variable 'isKanaMode' is declared but never used"

### Task 5: Remove unused `wasCorrect` parameter in `src/pages/Review.jsx`
- **File**: `src/pages/Review.jsx`, line 116
- **Change**: Remove the parameter (default value is never read)

```diff
-  const handleNextQuestion = (wasCorrect = isCorrect) => {
+  const handleNextQuestion = () => {
```

- **Verification**: `npm run lint` — should eliminate "Parameter 'wasCorrect' is declared but never used"

## Tests / Validation
After each task:
1. Run `npm run lint` — confirm specific warning is gone
2. Run `npm run build` — confirm build still passes (exit 0)
3. Commit with message: `chore: remove unused <item> in <file>`

## Risks, Tradeoffs, Open Questions
- **Low risk**: All removals are pure dead code (verified unused by linter)
- **No behavioral change**: None of these declarations affect runtime
- **Order independence**: Tasks 2-4 can run in any order; Task 5 independent
- **Potential false positive**: If any removed item is actually used via dynamic reference (unlikely for plain variables), build/tests will catch it