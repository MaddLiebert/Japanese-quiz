# Plan — Gojo Satoru Pack #7 + Tier Rarity SPECIAL

> Source of truth: `~/Documents/obsidian-mind/brain/Next update.md`
> → section `### 9/23/2026 (Rencana — Gojo Satoru, Pack #7) 🟣` (the "next update" dated 23).
> Codebase: `~/Documents/japanese-quiz` (Vite + React 19 + Tailwind v4, `node --test`, oxlint).

---

## 1. Goal

Add a **7th theme pack `pack_07` "Gojo Satoru"** and a new **`special` rarity tier** (drop ~2%, above `legendary`), including a layered Gojo visual effect (`蒼`→`赫`→`茈`→`無量空処`) and a per-answer sound progression, without breaking any of the 99 existing tests.

---

## 2. Current context / assumptions

- **Pack registry is data-driven.** `src/features/packs/packs.js` holds `PACK_RARITY` (per-rarity weight) and `PACKS` (array). Gacha logic `rollPackId(rng, poolIds, weights)` is generic — adding a pack does **not** require touching gacha logic, only registries + UI style maps.
- **Weights are PER-PACK, not per-tier.** Today `common 50 / rare 30 / legendary 20` with **2 packs each** → `2×50 + 2×30 + 2×20 = 200` → effective 50% / 30% / 20%. Adding one `special` pack means the numbers must be rebalanced so the **per-pack** weight still sums to a clean 100 across the pool (see §4 Phase 1).
- **Rarity styling is duplicated in 3 files** (`GachaSlotOverlay.jsx`, `Inventory.jsx`, `Shop.jsx`), and rarity ranking lives in a 4th (`gacha/slot.js`). The vault calls these the "6 places that MUST change" (plus `sfx.js` fanfare + tests).
- **Effect engine** is `src/features/effects/EffectContext.jsx` (~670 lines). It already:
  - computes `streakRef.current` (correct-answer count in the current streak; **resets to 0 on a wrong answer**) and passes it to the overlay as `fx.streak`;
  - exposes `fx.onMilestone` (true only at an exact milestone), `fx.milestone` (highest milestone reached), `fx.kind` (`'correct' | 'wrong' | 'streak'`), `fx.level`;
  - renders per-`visual` branches (`ink`, `hina`, `dummy`).
  `MILESTONES = [3,5,10,20,30,40,50,60,70,80,90,100]`.
- **Voice registry** `src/features/audio/voices.js` maps a pack's `voice` key → `{ files, overlays, synth }`. Empty `files` → falls back to synth (no error). `App.jsx` calls `setActiveVoice` / `preloadVoice` / `primeVoice` automatically when `activePack` changes — **no change needed there**.
- **Assets:** `public/voices/` only has `hina/`. **No Gojo audio exists yet** → this plan uses **synth** for Gojo sound (drop-in mp3 later via `public/voices/gojo/`).
- **Assumption:** we implement the **9/23** plan only (Gojo pack #7 + SPECIAL tier). The **9/24 event system** (`events.js`, banner, 6 other JJK chars) is a **separate** plan — **out of scope**.
- **Assumption:** implementer runs commands from `~/Documents/japanese-quiz`.
- **Baseline (verified):** `npm test` → `pass 99 / fail 0`; working tree clean; repo is **66 commits ahead of `origin/main`**.

**Do NOT `git push`.** The vault rule is: commit locally, wait for an explicit push command.

---

## 3. Architecture / proposed approach

1. **Foundations first:** introduce the `special` tier across the 6 known spots + rebalance weights, with updated tests, and add the `pack_07` data entry + `gojo` visual/voice registry keys. This makes Gojo appear end-to-end (gacha → shop → inventory → equip) **before** any custom effect exists (it degrades gracefully to the `dummy`-like synth/placeholder path until Phase 4/5).
2. **Effect as an isolated module:** pure, node-testable logic in `src/features/effects/gojoFx.js` (technique resolver, particle/crack generators), rendered by a dedicated `src/features/effects/GojoBurst.jsx`, wired via a single new `visual === 'gojo'` branch in `EffectContext.jsx` (mirrors the existing `hina` branch).
3. **Sound mirrors the visual progression** using pure synth params (`gojoToneParams`) + a `playGojoSound(technique)` player in `src/utils/sfx.js`, driven by the technique resolved in `EffectContext`.

Performance rules carried over from the Hina work (enforce in Phase 4): animate **only `transform`/`opacity`**, use **`text-shadow` (never `filter: drop-shadow`)** on large text, honor **`prefers-reduced-motion`**, set `will-change` only while active.

---

## 4. Step-by-step tasks

Each phase = one commit. Run the **verification** block at the end of each phase before committing.

### Phase 0 — Baseline & branch

**Task 0.1** — Confirm clean baseline and create the branch.

```bash
cd ~/Documents/japanese-quiz
git status                       # expect: nothing to commit, working tree clean
npm test 2>&1 | tail -4          # expect: pass 99 / fail 0
git checkout -b feat/gojo-pack7-special
```

Expected: branch `feat/gojo-pack7-special` created.

---

### Phase 1 — Tier `special` + rebalanced weights (TDD)

#### Task 1.1 — Write the failing tests

**File:** `src/features/packs/packs.test.js` — apply these edits.

1. Change the count test (line 5-8):

```js
test('PACKS berisi 7 pack dan semuanya ready', () => {
  assert.equal(PACKS.length, 7);
  assert.equal(PACKS.filter(isPackReady).length, 7);
});
```

2. Change the unique-id test (line 10-17): `assert.equal(ids.size, 7);`

3. Add a new test at the end of the file:

```js
test('PACK_RARITY punya tier special (bobot 2) & bobot total pool = 100', () => {
  assert.equal(PACK_RARITY.special.weight, 2);
  const total = PACKS.reduce((s, p) => s + PACK_RARITY[p.rarity].weight, 0);
  assert.equal(total, 100, 'per-pack weight harus total 100');
});
```

**File:** `src/features/gacha/slot.test.js` — add to the `maxRarity` test (after line 88):

```js
  assert.equal(maxRarity(['common', 'special', 'legendary']), 'special');
```

**File:** `src/utils/sfx.gacha.test.js` — extend the fanfare tests to include `special`:

```js
test('fanfareParams: special = 5 nada (di atas legendary)', () => {
  assert.equal(fanfareParams('special').notes.length, 5);
});
```
…and add `'special'` to every `for (const r of ['common', 'rare', 'legendary'])` loop in that file (3 loops → `['common','rare','legendary','special']`).

**Run to verify failure:**

```bash
npm test 2>&1 | tail -8
```

Expected: **failures** — `7 !== 6`, `special` undefined in `PACK_RARITY`, `maxRarity` returns `'legendary'`, `fanfareParams('special')` length `2` (falls to common).

#### Task 1.2 — Implement the tier

**File:** `src/features/packs/packs.js` — replace `PACK_RARITY` (lines 6-10):

```js
export const PACK_RARITY = {
  common:    { label: 'COMMON',    weight: 25 },
  rare:      { label: 'RARE',      weight: 15 },
  legendary: { label: 'LEGENDARY', weight: 9  },
  special:   { label: 'SPECIAL',   weight: 2  },
};
```

**File:** `src/features/gacha/slot.js` — line 44:

```js
const RARITY_RANK = { common: 0, rare: 1, legendary: 2, special: 3 };
```

**File:** `src/utils/sfx.js` — replace `fanfareParams` (lines 335-342):

```js
export function fanfareParams(rarity = 'common') {
  const notes = rarity === 'special'
    ? [523.25, 659.25, 783.99, 1046.5, 1318.51]   // C5 E5 G5 C6 E6
    : rarity === 'legendary'
      ? [523.25, 659.25, 783.99, 1046.5]          // C5 E5 G5 C6
      : rarity === 'rare'
        ? [523.25, 659.25, 783.99]                // C5 E5 G5
        : [523.25, 659.25];                       // C5 E5
  return { notes, dur: 0.18, gap: 0.12, gain: 0.5 };
}
```

**Add `special` to the 3 `RARITY_STYLE` maps** (identical line to add to each). Use the murasaki purple `#9c27b0`:

- `src/features/gacha/GachaSlotOverlay.jsx` (after line 23)
- `src/features/inventory/Inventory.jsx` (after line 12)
- `src/features/shop/Shop.jsx` (after line 16)

```js
  special:   { bg: 'bg-[#9c27b0]', text: 'text-kinari-light', border: 'border-sumi' },
```

**File:** `src/features/shop/Shop.jsx` — update the odds text (lines 160-161):

```js
                  ? 'Duplikat di-refund 50 🪙. Peluang: common 50% · rare 30% · legendary 18% · special 2%.'
                  : 'Duplicates refund 50 🪙. Odds: common 50% · rare 30% · legendary 18% · special 2%.'}
```

**Run to verify pass:**

```bash
npm test 2>&1 | tail -4
npm run lint 2>&1 | tail -3
npm run build 2>&1 | tail -3
```

Expected: `pass 99 / fail 0` **or more** (the new tests increase the count); lint exit 0, 0 errors; build `✓ built`.

> Note: after Phase 1 alone, `PACKS.length` is still 6, so the "7 pack" test will still fail until Phase 2. That's expected — **Phase 1 + Phase 2 are one atomic green state**; commit at the end of Phase 2 (see below). If you prefer a green commit per phase, do Phase 2's `pack_07` entry before running the suite.

#### Task 1.3 — Commit

```bash
git add src/features/packs/packs.js src/features/gacha/slot.js src/utils/sfx.js \
        src/features/gacha/GachaSlotOverlay.jsx src/features/inventory/Inventory.jsx \
        src/features/shop/Shop.jsx src/features/packs/packs.test.js \
        src/features/gacha/slot.test.js src/utils/sfx.gacha.test.js
git commit -m "feat(rarity): tier SPECIAL (bobot 2) + rebalance common25/rare15/legendary9"
```

---

### Phase 2 — Pack `pack_07` "Gojo Satoru" (TDD)

#### Task 2.1 — Write the failing test

**File:** `src/features/packs/packs.test.js` — add:

```js
test('pack_07 = Gojo Satoru, rarity special, visual/voice gojo', () => {
  const p = getPack('pack_07');
  assert.ok(p, 'pack_07 harus ada');
  assert.equal(p.rarity, 'special');
  assert.equal(p.visual, 'gojo');
  assert.equal(p.voice, 'gojo');
  assert.equal(p.name, 'Gojo Satoru');
  assert.equal(p.kanji, '五条悟');
  assert.equal(p.icon, '🟣');
});
```

Also update the deterministic rng test (line 55-58) — the last pack is now `pack_07`:

```js
test('rollPackId deterministik dengan rng inject', () => {
  assert.equal(rollPackId(() => 0), 'kotodama_burst');      // ticket 0 → pack pertama
  assert.equal(rollPackId(() => 0.999), 'pack_07');         // ticket ~max → pack terakhir
});
```

**Run to verify failure:** `npm test 2>&1 | tail -8` → `pack_07` undefined; `0.999` returns `pack_06`.

#### Task 2.2 — Add the pack entry

**File:** `src/features/packs/packs.js` — append to the end of the `PACKS` array (after the `pack_06` object, before the closing `];` on line 51):

```js
  {
    id: 'pack_07', name: 'Gojo Satoru', kanji: '五条悟', icon: '🟣',
    desc: 'Domain & Infinity: 蒼→赫→茈, efek mewah berlapis',
    desc_en: 'Domain & Infinity: Ao→Aka→Murasaki, layered deluxe FX',
    price: 2500, rarity: 'special', visual: 'gojo', voice: 'gojo',
  },
```

> `pack_07` **must stay last** so `rollPackId(() => 0.999)` resolves to it.

**Run to verify pass:** `npm test 2>&1 | tail -4` → `fail 0`.

#### Task 2.3 — Commit

```bash
git add src/features/packs/packs.js src/features/packs/packs.test.js
git commit -m "feat(packs): pack_07 Gojo Satoru (rarity special, visual/voice gojo)"
```

---

### Phase 3 — Registries `gojo` (visual + voice) + asset dir (TDD)

#### Task 3.1 — Write the failing tests

**File:** `src/features/effects/visuals.test.js` — replace line 5-7:

```js
test('VISUALS punya ink, hina, dummy & gojo', () => {
  assert.deepEqual(Object.keys(VISUALS).sort(), ['dummy', 'gojo', 'hina', 'ink']);
});
```

And add to the fallback test (line 9-14):

```js
  assert.equal(getVisual('gojo')?.component, 'gojo');
```

**File:** `src/features/audio/voices.test.js` — add:

```js
test('voice gojo ada, murni synth dulu (files kosong → fallback synth)', () => {
  const v = VOICES.gojo;
  assert.ok(v, 'VOICES.gojo harus ada');
  assert.deepEqual(v.files.correct, []);
  assert.deepEqual(v.files.wrong, []);
  assert.deepEqual(v.files.streak, []);
  assert.equal(getVoice('gojo'), VOICES.gojo);
});
```

**Run to verify failure:** `npm test 2>&1 | tail -8` → key lists don't match / `VOICES.gojo` undefined.

#### Task 3.2 — Implement registries

**File:** `src/features/effects/visuals.js` — add a line inside `VISUALS`:

```js
  gojo:  { id: 'gojo',  label: 'Gojo Domain',       component: 'gojo'  },
```

**File:** `src/features/audio/voices.js` — add before the closing `};` of `VOICES` (after the `hina` block, line 52):

```js
  // Pack #7 — Gojo Satoru. Aset voice menyusul di public/voices/gojo/;
  // sementara pakai synth progresi (ao → aka → murasaki) lewat gojoToneParams.
  gojo: {
    files: { correct: [], wrong: [], streak: [] },
    synth: { correct: 'gojo-ao', wrong: 'thud', streak: 'gojo-murasaki' },
  },
```

**Create the asset folder placeholder** so future mp3s have a home:

```bash
mkdir -p public/voices/gojo && touch public/voices/gojo/.gitkeep
```

**Run to verify pass:** `npm test 2>&1 | tail -4` → `fail 0`.

#### Task 3.3 — Commit

```bash
git add src/features/effects/visuals.js src/features/audio/voices.js \
        src/features/effects/visuals.test.js src/features/audio/voices.test.js \
        public/voices/gojo/.gitkeep
git commit -m "feat(gojo): daftarkan visual + voice gojo (synth dulu) & folder aset"
```

> **Checkpoint:** at this point the app already works end-to-end for Gojo (gacha can drop it, Shop/Inventory show a purple SPECIAL card, equip routes to voice `gojo` → falls back to synth). Run `npm run build` and, if desired, click through in the dev server before continuing.

---

### Phase 4 — Gojo visual effect (`gojoFx.js` + `GojoBurst.jsx` + `EffectContext` branch)

#### Task 4.1 — Write the failing test for the pure logic

**New file:** `src/features/effects/gojoFx.test.js`

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  gojoTechniqueFor, isGojoMilestone, gojoCrackCount, gojoParticles, GOJO_STYLE,
} from './gojoFx.js';

test('gojoTechniqueFor: benar#1 = ao, benar#2 = aka', () => {
  assert.equal(gojoTechniqueFor('correct', 1), 'ao');
  assert.equal(gojoTechniqueFor('correct', 2), 'aka');
});

test('gojoTechniqueFor: streak 3 = murasaki (penyatuan), milestone = murasaki', () => {
  assert.equal(gojoTechniqueFor('streak', 3), 'murasaki');
  assert.equal(gojoTechniqueFor('streak', 5), 'murasaki');
  assert.equal(gojoTechniqueFor('streak', 10), 'murasaki');
});

test('gojoTechniqueFor: non-milestone setelah 3 = ao/aka selang-seling', () => {
  assert.equal(gojoTechniqueFor('streak', 4), 'ao');
  assert.equal(gojoTechniqueFor('streak', 6), 'aka');
  assert.equal(gojoTechniqueFor('streak', 7), 'ao');
  assert.equal(gojoTechniqueFor('streak', 8), 'aka');
  assert.equal(gojoTechniqueFor('streak', 9), 'ao');
});

test('gojoTechniqueFor: milestone 50 = domain, 100 = domain_zenith', () => {
  assert.equal(gojoTechniqueFor('streak', 50), 'domain');
  assert.equal(gojoTechniqueFor('streak', 100), 'domain_zenith');
});

test('gojoTechniqueFor: salah = null (menyusul, tanpa retak)', () => {
  assert.equal(gojoTechniqueFor('wrong', 0), null);
  assert.equal(gojoTechniqueFor('wrong', 7), null);
});

test('gojoCrackCount: naik per level, ada batas atas', () => {
  assert.ok(gojoCrackCount(3) < gojoCrackCount(20));
  assert.ok(gojoCrackCount(100) <= 14);
});

test('gojoParticles: jumlah wajar & deterministik dengan rng inject', () => {
  const a = gojoParticles('ao', 1, () => 0.5);
  const b = gojoParticles('ao', 1, () => 0.5);
  assert.ok(a.length >= 12 && a.length <= 30);
  assert.deepEqual(a, b);
});

test('GOJO_STYLE punya warna & kanji untuk tiap teknik', () => {
  for (const t of ['ao', 'aka', 'murasaki', 'domain', 'domain_zenith']) {
    assert.ok(GOJO_STYLE[t].color, `${t} tanpa warna`);
    assert.ok(GOJO_STYLE[t].kanji, `${t} tanpa kanji`);
  }
  assert.equal(GOJO_STYLE.ao.kanji, '蒼');
  assert.equal(GOJO_STYLE.aka.kanji, '赫');
  assert.equal(GOJO_STYLE.murasaki.kanji, '茈');
});
```

**Run to verify failure:** `npm test 2>&1 | tail -8` → `Cannot find module './gojoFx.js'`.

#### Task 4.2 — Implement `src/features/effects/gojoFx.js`

```js
// ─────────────────────────────────────────────────────────────────────────────
// Logika murni efek Gojo Satoru (visual 'gojo'). Tanpa React/DOM → dites di node.
// Kanon: 蒼 (Ao) → 赫 (Aka) → 茈 (Murasaki = Ao+Aka) → 領域展開・無量空処 (Domain).
// Aturan (keputusan user, plan 9/23):
//   - retak (cracks) HANYA di streak, makin gila per level
//   - Domain di milestone 50; 100 = zenith (lebih terang/rapat)
//   - salah TIDAK pakai retak
// ─────────────────────────────────────────────────────────────────────────────

export const GOJO_MILESTONES = [3, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

export const isGojoMilestone = (streak) => GOJO_MILESTONES.includes(streak);

const milestonesAtOrBelow = (streak) =>
  GOJO_MILESTONES.filter((m) => m <= streak).length;

// Teknik untuk satu jawaban. kind: 'correct' | 'wrong' | 'streak'.
// streak = jumlah jawaban benar beruntun (fx.streak dari EffectContext).
//   benar#1 → ao, benar#2 → aka, #3 & milestone → murasaki, 50/100 → domain.
//   Non-milestone setelah #3 → ao/aka selang-seling (counter tidak reset).
//   wrong → null (klip menyusul, tanpa retak).
export const gojoTechniqueFor = (kind, streak = 0) => {
  if (kind === 'wrong') return null;
  if (isGojoMilestone(streak)) {
    if (streak >= 100) return 'domain_zenith';
    if (streak >= 50) return 'domain';
    return 'murasaki';
  }
  const altIndex = streak - milestonesAtOrBelow(streak); // 1,2,3,4,… hanya untuk non-milestone
  return altIndex % 2 === 1 ? 'ao' : 'aka';
};

export const GOJO_STYLE = {
  ao:            { kanji: '蒼',       color: '#00b0ff', label: '蒼 · Ao' },
  aka:           { kanji: '赫',       color: '#e53935', label: '赫 · Aka' },
  murasaki:      { kanji: '茈',       color: '#9c27b0', label: '茈 · Murasaki' },
  domain:        { kanji: '無量空処', color: '#7c4dff', label: '領域展開・無量空処' },
  domain_zenith: { kanji: '無量空処', color: '#b388ff', label: '領域展開・無量空処' },
};

// Retak: HANYA streak. Jumlah cabang naik per level, dibatasi 14 (performa).
export const gojoCrackCount = (streak = 0) =>
  Math.min(3 + Math.floor(streak / 2), 14);

// Partikel: hisap (ao/domain) / ledak (aka) / spiral (murasaki).
// Murni & deterministik (rng bisa di-inject). Animasinya pakai transform/opacity.
export const gojoParticles = (technique, seed = 1, rng = Math.random) => {
  const spiral = technique === 'murasaki';
  const out = technique === 'aka';
  const count = spiral ? 22 : 16;
  const list = [];
  for (let i = 0; i < count; i++) {
    const angle = rng() * Math.PI * 2;
    const dist = 60 + rng() * 220;
    list.push({
      id: `${seed}-${i}`,
      angle,
      dist,
      size: 5 + rng() * 12,
      delay: rng() * 0.18,
      dur: 0.5 + rng() * 0.5,
      spin: spiral ? (rng() * 2 - 1) * 260 : 0,
      out,
      spiral,
    });
  }
  return list;
};
```

**Run to verify pass:** `npm test 2>&1 | tail -4` → `fail 0`.

#### Task 4.3 — Implement `src/features/effects/GojoBurst.jsx`

New file. Renders 5 layers (wash+shake, particles, corner frames, cracks [streak only], technique text). Animate **only** `transform`/`opacity`; large text uses `text-shadow`.

```jsx
import { useState } from 'react';
import { motion } from 'motion/react';
import {
  gojoTechniqueFor, GOJO_STYLE, gojoParticles, gojoCrackCount,
} from './gojoFx';

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function GojoBurst({ fx, kind }) {
  const [reduced] = useState(prefersReduced);
  const technique = gojoTechniqueFor(kind, fx?.streak || 0);
  const [particles] = useState(() =>
    technique ? gojoParticles(technique, fx?.id || 1) : []
  );

  // Salah: wash merah lembut, TANPA retak (retak = ciri streak saja).
  if (!technique) {
    return (
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: reduced ? 0.5 : [0, 0.5, 0] }}
        transition={{ duration: reduced ? 0 : 0.6, ease: 'easeOut' }}
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(229,57,53,0.28), transparent 70%)' }}
      />
    );
  }

  const st = GOJO_STYLE[technique];
  const isDomain = technique === 'domain' || technique === 'domain_zenith';
  const zenith = technique === 'domain_zenith';
  const isStreak = kind === 'streak';
  const cracks = isStreak ? gojoCrackCount(fx.streak || 0) : 0;

  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.16 } }}
      style={{ willChange: 'transform, opacity' }}
    >
      {/* Layer 1 — WASH + SHAKE (warna dasar + getar; domain = gelombang transparan) */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: reduced ? 0.35 : [0, isDomain ? 0.5 : 0.35, 0] }}
        transition={{ duration: reduced ? 0 : (zenith ? 1.1 : 0.7), ease: 'easeOut' }}
        style={{
          background: isDomain
            ? `repeating-radial-gradient(circle at 50% 50%, ${st.color}22 0px, transparent 18px, transparent 40px)`
            : `radial-gradient(circle at 50% 50%, ${st.color}55, transparent 70%)`,
        }}
      />
      <motion.div
        className="absolute inset-0"
        animate={reduced || (!isDomain && !isStreak) ? { x: 0, y: 0 } : {
          x: [0, -10, 9, -6, 4, 0],
          y: [0, -6, 5, -4, 3, 0],
        }}
        transition={{ duration: zenith ? 0.8 : 0.5, ease: 'easeOut' }}
      >
        {/* Layer 3 — BINGKAI SUDUT (frame 4 ujung + glow) */}
        {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
          <motion.div
            key={pos}
            className={`absolute ${pos} w-[12vw] h-[12vw] border-[6px]`}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: reduced ? 0.9 : [0, 0.9, 0.7], scale: 1 }}
            transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : i * 0.06, ease: 'easeOut' }}
            style={{ borderColor: st.color, boxShadow: `0 0 24px ${st.color}88` }}
          />
        ))}

        {/* Layer 2 — PARTIKEL (hisap / ledak / spiral) */}
        {particles.map((p) => {
          const dx = Math.cos(p.angle) * p.dist;
          const dy = Math.sin(p.angle) * p.dist;
          return (
            <motion.span
              key={p.id}
              className="absolute left-1/2 top-1/2 rounded-full"
              initial={{ x: p.out || p.spiral ? 0 : dx, y: p.out || p.spiral ? 0 : dy, opacity: 0.9, scale: 0.5 }}
              animate={{ x: p.out || p.spiral ? dx : 0, y: p.out || p.spiral ? dy : 0, opacity: 0, scale: 1, rotate: p.spin }}
              transition={{ duration: reduced ? 0 : p.dur, delay: reduced ? 0 : p.delay, ease: [0.16, 1, 0.3, 1] }}
              style={{ width: p.size, height: p.size, marginLeft: -p.size / 2, marginTop: -p.size / 2, background: st.color }}
            />
          );
        })}

        {/* Layer 4 — RETAK (HANYA streak; makin gila per level) */}
        {isStreak && !reduced && (
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {Array.from({ length: cracks }).map((_, i) => {
              const a = (i / cracks) * Math.PI * 2;
              const x2 = 50 + Math.cos(a) * 46;
              const y2 = 50 + Math.sin(a) * 46;
              return (
                <motion.line
                  key={i}
                  x1="50" y1="50" x2={x2} y2={y2}
                  stroke={st.color} strokeWidth="0.35" strokeLinecap="round" pathLength={1}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: [0, 0.95, 0.6] }}
                  transition={{ duration: 0.4, delay: i * 0.05, ease: 'easeOut' }}
                />
              );
            })}
          </svg>
        )}

        {/* Layer 5 — TEKS TEKNIK (chromatic aberration via text-shadow) */}
        <div className="absolute left-0 right-0 flex justify-center" style={{ top: isDomain ? '40%' : '46%' }}>
          <motion.span
            className="font-serif font-black select-none"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: reduced ? 0 : 0.15, duration: reduced ? 0 : 0.35, ease: [0.34, 1.56, 0.64, 1] }}
            style={{
              fontSize: isDomain ? 'clamp(48px, 11vw, 132px)' : 'clamp(64px, 15vw, 190px)',
              color: st.color,
              textShadow: `2px 0 #ff1744, -2px 0 #2979ff, 0 0 18px ${st.color}`,
              willChange: 'transform, opacity',
            }}
          >
            {st.kanji}
          </motion.span>
        </div>

        {/* Teks kecil 領域展開 → 無量空処 saat domain */}
        {isDomain && (
          <motion.div
            className="absolute left-0 right-0 flex justify-center text-kinari-light"
            style={{ top: '28%' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduced ? 0 : 0.35, duration: reduced ? 0 : 0.4 }}
          >
            <span className="font-serif font-black tracking-[0.3em]" style={{ fontSize: 'clamp(14px, 3vw, 30px)' }}>
              領域展開
            </span>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default GojoBurst;
```

#### Task 4.4 — Wire the branch into `EffectContext.jsx`

**File:** `src/features/effects/EffectContext.jsx`

1. Add the import after line 8:

```js
import { GojoBurst } from './GojoBurst';
```

2. Inside `EffectLayer`, after the `visual === 'hina'` block (after line 337), add:

```jsx
      {/* ── Gojo Satoru (pack 'gojo') — 蒼 → 赫 → 茈 → 無量空処 ──────────────── */}
      {visual === 'gojo' && (
        <AnimatePresence>
          {fx && <GojoBurst key={`gj-${fx.id}`} fx={fx} kind={kind} />}
        </AnimatePresence>
      )}
```

**Run to verify:**

```bash
npm test 2>&1 | tail -4        # pass / fail 0
npm run lint 2>&1 | tail -3    # 0 errors
npm run build 2>&1 | tail -3   # ✓ built
```

**Manual visual check (dev server):** `npm run dev`, open `http://localhost:5173`, use the DevPanel "Buka Semua Pack" cheat in Settings, equip Gojo, then answer quiz items: expect `蒼` (blue, particles pulled inward) on the 1st correct, `赫` (red, burst) on the 2nd, `茈` (purple + cracks) from the 3rd, and `領域展開・無量空処` at streak 50. Verify **no console errors** and no jank.

#### Task 4.5 — Commit

```bash
git add src/features/effects/gojoFx.js src/features/effects/gojoFx.test.js \
        src/features/effects/GojoBurst.jsx src/features/effects/EffectContext.jsx
git commit -m "feat(gojo): efek visual berlapis (ao/aka/murasaki/domain + retak streak)"
```

---

### Phase 5 — Gojo sound progression (synth, TDD)

#### Task 5.1 — Write the failing test

**File:** `src/utils/sfx.gacha.test.js` — add at the end:

```js
test('gojoToneParams: teknik dikenal → freq/tipe/dur/gain sehat', () => {
  for (const t of ['ao', 'aka', 'murasaki', 'domain', 'domain_zenith']) {
    const p = gojoToneParams(t);
    assert.ok(p.freq >= 200 && p.freq <= 2000, `${t}: freq ${p.freq}`);
    assert.ok(p.dur > 0 && p.dur <= 2, `${t}: dur ${p.dur}`);
    assert.ok(p.gain > 0 && p.gain <= 1, `${t}: gain ${p.gain}`);
  }
});
```

Add `gojoToneParams` to the import on line 3:

```js
import { reelTickParams, fanfareParams, gojoToneParams } from './sfx.js';
```

**Run to verify failure:** `npm test 2>&1 | tail -6` → `gojoToneParams is not a function`.

#### Task 5.2 — Implement in `src/utils/sfx.js`

Add after `playFanfare` (end of file):

```js
// ── Suara progresi Gojo (ao → aka → murasaki) ───────────────────────────────
// Parameter murni (dites). Nada berbeda per teknik; domain lebih panjang.
export function gojoToneParams(technique = 'ao') {
  const MAP = {
    ao:            { freq: 880,    type: 'sine',     dur: 0.35, gain: 0.5 },
    aka:           { freq: 587.33, type: 'triangle', dur: 0.40, gain: 0.5 },
    murasaki:      { freq: 660,    type: 'sawtooth', dur: 0.60, gain: 0.45 },
    domain:        { freq: 440,    type: 'sine',     dur: 0.90, gain: 0.6 },
    domain_zenith: { freq: 523.25, type: 'sine',     dur: 1.20, gain: 0.65 },
  };
  return MAP[technique] || MAP.ao;
}

// Pemutar (butuh AudioContext; tidak dites di node).
export const playGojoSound = (technique) => {
  const ctx = initAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  const { freq, type, dur, gain } = gojoToneParams(technique);
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(freq * 1.25, t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
};
```

#### Task 5.3 — Route Gojo sound in `EffectContext.jsx`

The sound block currently lives at lines 179-182. Change it so Gojo uses its own progression (technique resolved from `fx.streak`), while every other pack keeps the existing behavior.

**File:** `src/features/effects/EffectContext.jsx`

1. Add `gojoTechniqueFor` to the gojoFx import:

```js
import { gojoTechniqueFor } from './gojoFx';
```

2. Add `playGojoSound` to the sfx import (line 4):

```js
import { playCorrectSound, playWrongSound, playStreakSound, answerFeedbackKind, hinaGifHoldMs, playGojoSound } from '../../utils/sfx';
```

3. Replace the sound block (lines 179-182) with:

```js
    const feedback = answerFeedbackKind(type, onMilestone);
    let clipMs;
    if (activeVisual === 'gojo') {
      // Progresi Gojo: benar#1 ao → #2 aka → #3/milestone murasaki; salah = thud.
      const tech = gojoTechniqueFor(kind, streakRef.current);
      playGojoSound(tech || 'aka');
      clipMs = 0;
    } else {
      clipMs = feedback === 'streak' ? playStreakSound(streakSoundLevel(streakRef.current))
        : feedback === 'wrong' ? playWrongSound()
          : playCorrectSound();
    }
```

> `holdMs` on line 186-188 already branches on `activeVisual === 'hina'`; for `gojo` it falls through to `cfg.hold` (the ink-style hold), which is correct — the Gojo overlay self-timers its animation and is cleared by the existing `setTimeout(() => setFx(null), holdMs)`.

**Run to verify:**

```bash
npm test 2>&1 | tail -4        # fail 0
npm run lint 2>&1 | tail -3    # 0 errors
npm run build 2>&1 | tail -3   # ✓ built
```

**Manual sound check:** with Gojo equipped, the 1st correct answer plays a high sine (`ao`), the 2nd a mid triangle (`aka`), the 3rd+ and milestones a sawtooth (`murasaki`); a wrong answer plays the thud. No console warnings.

#### Task 5.4 — Commit

```bash
git add src/utils/sfx.js src/utils/sfx.gacha.test.js src/features/effects/EffectContext.jsx
git commit -m "feat(gojo): suara progresi synth ao/aka/murasaki + routing per-visual"
```

---

### Phase 6 — Final verification

**Task 6.1** — Full gate.

```bash
npm test 2>&1 | tail -6        # expect: fail 0
npm run lint 2>&1 | tail -3    # expect: 0 errors
npm run build 2>&1 | tail -3   # expect: ✓ built
git status                     # expect: clean
git log --oneline -6           # expect: the 5 phase commits
```

**Task 6.2** — Confirm Gojo end-to-end in the dev server (see Task 4.4 / 5.3 checks). Optionally run the headless CDP check used previously: equip Gojo via DevPanel, answer a quiz, assert 0 console/page errors.

**Task 6.3** — **Do NOT push.** Report the commit range and stop.

---

## 5. Tests / validation

- **Unit (`node --test`):** new/updated assertions in
  `src/features/packs/packs.test.js` (7 packs, `special` weight 2, total 100, `pack_07` fields, rng `0.999 → pack_07`),
  `src/features/gacha/slot.test.js` (`maxRarity` with `special`),
  `src/utils/sfx.gacha.test.js` (`special` = 5 notes, ascending/audible; `gojoToneParams`),
  `src/features/effects/visuals.test.js` (`gojo` key),
  `src/features/audio/voices.test.js` (`gojo` voice, empty files),
  `src/features/effects/gojoFx.test.js` (technique resolver, crack count, particles, style).
- **TDD discipline:** each phase writes the failing test first, runs it (`npm test`), implements minimally, re-runs to green, commits.
- **Build + lint:** every phase runs `npm run build` and `npm run lint`; both must be green (0 errors) before commit.
- **Manual/browser:** Gojo card shows purple SPECIAL in Shop/Inventory; gacha can drop it; equipping triggers `蒼/赫/茈/無量空処` visuals and the tone progression; no console errors. (Visual components aren't unit-testable in `node`, so this is the acceptance check.)

---

## 6. Risks, tradeoffs, and open questions

1. **Weight semantics.** Weights are **per-pack**, so `PACK_RARITY.special.weight = 2` yields ~2% only while there is **exactly one** special pack. Adding a second special pack later (e.g. Sukuna) halves each to ~1% — the 9/24 event plan addresses this via per-event `weights` override. **No action now**; documented for the follow-up.
2. **Existing UI shows `{rarity.weight}%` per card.** With the rebalance, cards now read `COMMON · 25%`, `RARE · 15%`, `LEGENDARY · 9%`, `SPECIAL · 2%` — these are correct **per-pack** rates, but may confuse users vs the tier-total odds footer (50/30/18/2). Open question: relabel the card to `per-pack` or show tier totals? (Left as-is to keep scope minimal.)
3. **No real Gojo audio assets.** Phase 5 ships synth tones; the wrong-answer clips are "menyusul" (user supplies 3 clips later). Drop-in path: `public/voices/gojo/correct_1..3.mp3`, `wrong_1..3.mp3`, `streak_*.mp3` + fill `VOICES.gojo.files` and adjust the routing if real clips should replace synth.
4. **Performance of the Gojo overlay.** Deliberately uses `transform`/`opacity` only, `text-shadow` (not `drop-shadow`), and caps cracks at 14 + particles at 22. `prefers-reduced-motion` short-circuits animation. Risk if violated: jank on low-end devices (lesson from the Hina effect).
5. **`EffectContext.jsx` is large (~670 lines) and touched by both Gojo and the future event work.** Keeping Gojo logic in `gojoFx.js` + `GojoBurst.jsx` minimizes the diff to one branch + one sound `if`, reducing merge risk.
6. **`onMilestone` vs `streak` derivation.** `gojoTechniqueFor` recomputes milestones from `streak` itself (pure), rather than relying on `fx.onMilestone`, so the resolver is independently testable and can't drift from `EffectContext`'s internal flags.
7. **Copy/id tradeoff.** `RARITY_STYLE` remains duplicated in 3 files (pre-existing). Extracting a shared `rarityStyle` helper is **out of scope** (YAGNI) but a reasonable later cleanup.
8. **Out of scope (explicitly):** the 9/24 event system (7 JJK packs, `events.js`, rotation, banner) and the remaining 6 JJK characters — those belong to the follow-up plan.
