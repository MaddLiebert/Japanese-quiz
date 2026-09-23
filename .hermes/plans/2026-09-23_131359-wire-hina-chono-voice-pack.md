# Plan — Pasang Voice Pack "Hina Chono" ke Kotodama Burst (pack #1)

## Goal

Wire the 13 already-downloaded Hina Chono MP3 clips into the game so that pack #1
(`kotodama_burst`) plays them for correct / wrong / streak feedback, including
**per-milestone streak files** (streak 50 and 100 never get the wrong clip).

---

## Current context / assumptions

Repo: `C:\Users\maddo\Documents\japanese-quiz` (Vite + React 19, tests = `node --test`).

Facts verified by reading the repo (do NOT re-guess these):

- **Assets already exist** (13 files, all unique, all valid MP3 with `ID3` header):
  `C:\Users\maddo\Downloads\Hina\HINA_CHONO_*.mp3`. Sizes 15–48 KB each (~380 KB total).
  The two other files in `Downloads` (`Hina chono voice.mp3`,
  `Phone Link/Best Waifu Moments …mp3`) are **NOT** game clips — ignore them.
- `public/voices/` exists but contains only `.gitkeep` → the target folder is empty.
- `src/features/audio/voices.js` — `VOICES` registry currently has only `taiko` + `dummy`
  (both with empty `files` arrays → synth fallback). `getVoice()` + `pickFile()` already exported.
- `src/features/packs/packs.js` — pack #1 `kotodama_burst` currently has `voice: 'taiko'` (line 23).
  `isPackReady()` needs `visual` + `voice` (both present) so the pack is gacha-eligible.
- `src/utils/sfx.js` — `playCorrectSound()` / `playWrongSound()` pick a random file from the
  array. **`playStreakSound(level)` also picks a random file** → if we put all 6 streak tiers in
  the same array, streak 100 can play the streak-3 clip. This is the one real bug we must fix.
- `src/features/effects/EffectContext.jsx` calls `playStreakSound(streakSoundLevel(streak))`
  with a **fractional** level (e.g. `3.4`), level ∈ [1..12] once streak ≥ 3. So the tier selector
  must `Math.floor()` the level.
- `src/App.jsx` `VoiceSync()` already calls `setActiveVoice(pack?.voice)` whenever `activePack`
  changes → no wiring needed there.
- `playStreakSound`/`playFile` need a browser `AudioContext`; only the **pure** helpers are
  unit-tested. Tests run in Node (`npm test` → currently **46 pass / 0 fail**).
- Existing tests: `src/features/audio/voices.test.js`, `src/utils/sfx.routing.test.js`.
- DevPanel (`src/features/dev/DevPanel.jsx`, dev-only) has "✨ Buka & Pakai Efek" which sets
  `ownedPacks:['kotodama_burst'], activePack:'kotodama_burst'` — use it to test locally.
- `.gitignore` does **not** ignore `public/**/*.mp3`, so the clips will be committed (intended).

Assumptions:
- Pack #1 is the target (matches `docs/voice-pack-1-hina.md`). Other packs stay on synth.
- The 4th correct clip (`余裕でしょ？`) is a bonus line → all 4 are used (random pick).
- `docs/voice-pack-1-hina.md` is a *design doc*, not an executed plan — it is slightly stale
  (it lists 3 correct; we have 4) and its streak fix is **mandatory** here, not optional.

### Asset → slot mapping (decided; copy exactly)

| Target file (`public/voices/hina/…`) | Source file in `Downloads/Hina/` | Meaning | Slot |
|---|---|---|---|
| `correct_1.mp3` | `HINA_CHONO_うん、大正解！.mp3` | un, daiseikai! | correct |
| `correct_2.mp3` | `HINA_CHONO_いい感じ！.mp3` | ii kanji! | correct |
| `correct_3.mp3` | `HINA_CHONO_さすがだね！.mp3` | sasuga da ne! | correct |
| `correct_4.mp3` | `HINA_CHONO_余裕でしょ？.mp3` | yoyū desho? | correct |
| `wrong_1.mp3` | `HINA_CHONO_えー？はずれ〜！.mp3` | ē? hazure~! | wrong |
| `wrong_2.mp3` | `HINA_CHONO_おしいっ！.mp3` | oshii! | wrong |
| `wrong_3.mp3` | `HINA_CHONO_ちゃんと集中してよね！.mp3` | chanto shūchū shite yo ne! | wrong |
| `streak_1.mp3` | `HINA_CHONO_いい調子〜！.mp3` | ii chōshi~! | streak tier 1 (3–5) |
| `streak_2.mp3` | `HINA_CHONO_すごいすごい！.mp3` | sugoi sugoi! | streak tier 2 (10–20) |
| `streak_3.mp3` | `HINA_CHONO_止まらないね！.mp3` | tomaranai ne! | streak tier 3 (30–40) |
| `streak_4.mp3` | `HINA_CHONO_五十連続！？天才でしょ！.mp3` | gojū renzoku!? tensai desho! | streak tier 4 (**50**) |
| `streak_5.mp3` | `HINA_CHONO_もう誰も止められない！.mp3` | mō dare mo tomerarenai! | streak tier 5 (60–90) |
| `streak_6.mp3` | `HINA_CHONO_ひゃく！！もう伝説じゃん！.mp3` | hyaku!! mō densetsu jan! | streak tier 6 (**100**) |

---

## Architecture / proposed approach

Keep the existing registry/`sfx.js` design: register a new `hina` voice entry pointing at
`/voices/hina/*.mp3`, then point pack #1's `voice` at it. The only code change beyond data is a
pure `streakTierIndex(level)` helper that maps the 12 milestone levels to the 6 streak tiers
(with 50 and 100 isolated), used by `playStreakSound` when the streak array has exactly 6 files;
fallback to random/synth stays for safety. Everything is test-first on the pure helpers.

---

## Step-by-step tasks

> Run all commands from `C:\Users\maddo\Documents\japanese-quiz` in Git Bash.

### Task 1 — Copy the 13 clips into `public/voices/hina/` (commit A)

```bash
cd /c/Users/maddo/Documents/japanese-quiz
mkdir -p public/voices/hina
SRC="/c/Users/maddo/Downloads/Hina"
cp "$SRC/HINA_CHONO_うん、大正解！.mp3"            public/voices/hina/correct_1.mp3
cp "$SRC/HINA_CHONO_いい感じ！.mp3"                public/voices/hina/correct_2.mp3
cp "$SRC/HINA_CHONO_さすがだね！.mp3"              public/voices/hina/correct_3.mp3
cp "$SRC/HINA_CHONO_余裕でしょ？.mp3"              public/voices/hina/correct_4.mp3
cp "$SRC/HINA_CHONO_えー？はずれ〜！.mp3"          public/voices/hina/wrong_1.mp3
cp "$SRC/HINA_CHONO_おしいっ！.mp3"                public/voices/hina/wrong_2.mp3
cp "$SRC/HINA_CHONO_ちゃんと集中してよね！.mp3"    public/voices/hina/wrong_3.mp3
cp "$SRC/HINA_CHONO_いい調子〜！.mp3"              public/voices/hina/streak_1.mp3
cp "$SRC/HINA_CHONO_すごいすごい！.mp3"            public/voices/hina/streak_2.mp3
cp "$SRC/HINA_CHONO_止まらないね！.mp3"            public/voices/hina/streak_3.mp3
cp "$SRC/HINA_CHONO_五十連続！？天才でしょ！.mp3"  public/voices/hina/streak_4.mp3
cp "$SRC/HINA_CHONO_もう誰も止められない！.mp3"    public/voices/hina/streak_5.mp3
cp "$SRC/HINA_CHONO_ひゃく！！もう伝説じゃん！.mp3" public/voices/hina/streak_6.mp3
```

**Verify** (expected: exactly the 13 names, every size > 0, no `0`-byte files):

```bash
ls -1 public/voices/hina | sort
# correct_1.mp3 correct_2.mp3 correct_3.mp3 correct_4.mp3
# streak_1.mp3 streak_2.mp3 streak_3.mp3 streak_4.mp3 streak_5.mp3 streak_6.mp3
# wrong_1.mp3 wrong_2.mp3 wrong_3.mp3
ls -1 public/voices/hina | wc -l        # -> 13
find public/voices/hina -size 0         # -> (no output)
```

Commit:

```bash
git add public/voices/hina
git commit -m "assets(voice): 13 klip Hina Chono untuk pack kotodama_burst"
```

---

### Task 2 — TDD: register the `hina` voice in `voices.js` (commit B)

**2a. Write the failing test.** Append to `src/features/audio/voices.test.js`:

```js
test('voice hina terdaftar dengan 4 correct / 3 wrong / 6 streak', () => {
  const v = VOICES.hina;
  assert.ok(v, 'VOICES.hina harus ada');
  assert.equal(v.files.correct.length, 4);
  assert.equal(v.files.wrong.length, 3);
  assert.equal(v.files.streak.length, 6);
});

test('semua file hina ada di /voices/hina/ dan path unik', () => {
  const all = [
    ...VOICES.hina.files.correct,
    ...VOICES.hina.files.wrong,
    ...VOICES.hina.files.streak,
  ];
  assert.equal(all.length, 13);
  assert.equal(new Set(all).size, 13, 'tidak boleh ada path duplikat');
  for (const p of all) assert.match(p, /^\/voices\/hina\/[a-z]+_\d+\.mp3$/);
});

test('getVoice("hina") mengembalikan voice hina', () => {
  assert.equal(getVoice('hina'), VOICES.hina);
});
```

**2b. Run → expect FAIL** (`VOICES.hina` undefined):

```bash
npm test 2>&1 | grep -E "voice hina|getVoice\(\"hina\"\)|# fail|ℹ (tests|pass|fail)"
# expect: the 3 new tests listed as failed; ℹ fail 3
```

**2c. Implement.** In `src/features/audio/voices.js`, insert this entry inside `VOICES`,
right after the `dummy` entry and before the closing `};`:

```js
  // Pack #1 — suara Hina Chono (klip TTS). 4 correct / 3 wrong / 6 streak tier.
  hina: {
    files: {
      correct: ['/voices/hina/correct_1.mp3', '/voices/hina/correct_2.mp3',
                '/voices/hina/correct_3.mp3', '/voices/hina/correct_4.mp3'],
      wrong:   ['/voices/hina/wrong_1.mp3',   '/voices/hina/wrong_2.mp3',
                '/voices/hina/wrong_3.mp3'],
      streak:  ['/voices/hina/streak_1.mp3',  '/voices/hina/streak_2.mp3',
                '/voices/hina/streak_3.mp3',  '/voices/hina/streak_4.mp3',
                '/voices/hina/streak_5.mp3',  '/voices/hina/streak_6.mp3'],
    },
    synth: { correct: 'gong', wrong: 'thud', streak: 'gong-big' },
  },
```

**2d. Run → expect PASS:**

```bash
npm test 2>&1 | grep -E "ℹ (tests|pass|fail)"
# expect: ℹ tests 49 / ℹ pass 49 / ℹ fail 0
```

Commit:

```bash
git add src/features/audio/voices.js src/features/audio/voices.test.js
git commit -m "feat(voice): daftarkan voice hina (4/3/6 klip)"
```

---

### Task 3 — TDD: per-milestone streak selection in `sfx.js` (commit C)

**3a. Write the failing test.** Replace the import line at the top of
`src/utils/sfx.routing.test.js`:

```js
import { setActiveVoice, getActiveVoiceKey } from './sfx.js';
```

with:

```js
import { setActiveVoice, getActiveVoiceKey, streakTierIndex, STREAK_TIER_BY_LEVEL } from './sfx.js';
```

Then append:

```js
test('STREAK_TIER_BY_LEVEL memetakan 12 milestone → 6 tier (50 & 100 sendiri)', () => {
  assert.deepEqual(STREAK_TIER_BY_LEVEL, [0, 0, 1, 1, 2, 2, 3, 4, 4, 4, 4, 5]);
  assert.equal(STREAK_TIER_BY_LEVEL[6], 3);   // level 7  = streak 50
  assert.equal(STREAK_TIER_BY_LEVEL[11], 5);  // level 12 = streak 100
});

test('streakTierIndex: level → indeks tier (clamp + pecahan)', () => {
  assert.equal(streakTierIndex(1), 0);     // streak 3  → tier 1
  assert.equal(streakTierIndex(2.7), 0);   // floor 2   → tier 1
  assert.equal(streakTierIndex(7), 3);     // streak 50 → tier 4
  assert.equal(streakTierIndex(12), 5);    // streak 100 → tier 6
  assert.equal(streakTierIndex(0), 0);     // clamp bawah
  assert.equal(streakTierIndex(99), 5);    // clamp atas
});
```

**3b. Run → expect FAIL** (`streakTierIndex` / `STREAK_TIER_BY_LEVEL` not exported):

```bash
npm test 2>&1 | grep -E "STREAK_TIER_BY_LEVEL|streakTierIndex|ℹ (tests|pass|fail)"
# expect: import error / the 2 new tests fail; ℹ fail 2
```

**3c. Implement.** In `src/utils/sfx.js`, add just above the existing
`// Voice khusus milestone streak …` comment + `playStreakSound`:

```js
// level milestone (1..12, boleh pecahan dari streakSoundLevel) → indeks tier streak (0..5).
// 50 = tier 4 (indeks 3, sendiri), 100 = tier 6 (indeks 5, sendiri).
// Sengaja pakai array, BUKAN pembagian rata: Math.floor((level-1)/2) menaruh streak 60
// di tier yang sama dengan 50 → kalimat 「五十連続」 ikut keputar di 60.
export const STREAK_TIER_BY_LEVEL = [0, 0, 1, 1, 2, 2, 3, 4, 4, 4, 4, 5];

export const streakTierIndex = (level = 0) => {
  const lvl = Math.min(12, Math.max(1, Math.floor(level))); // 1..12
  return STREAK_TIER_BY_LEVEL[lvl - 1];
};
```

Then replace the body of `playStreakSound` with:

```js
export const playStreakSound = (level = 0) => {
  if (!activeVoiceKey) return synthGong(level);
  const voice = getVoice(activeVoiceKey);
  const streakFiles = voice.files?.streak;
  // 6 file = 6 tier → pilih sesuai milestone (bukan acak).
  if (Array.isArray(streakFiles) && streakFiles.length === 6) {
    if (playFile(streakFiles[streakTierIndex(level)])) return;
  }
  // Selain itu (array kosong / bukan 6) → perilaku lama (acak → synth).
  if (playFile(pickFile(streakFiles))) return;
  synthGong(level);
};
```

**3d. Run → expect PASS:**

```bash
npm test 2>&1 | grep -E "ℹ (tests|pass|fail)"
# expect: ℹ tests 51 / ℹ pass 51 / ℹ fail 0
```

Commit:

```bash
git add src/utils/sfx.js src/utils/sfx.routing.test.js
git commit -m "feat(sfx): streak pilih tier per-milestone (50 & 100 sendiri)"
```

---

### Task 4 — Point pack #1 at the `hina` voice (commit D)

In `src/features/packs/packs.js`, in the `kotodama_burst` entry, change line 23:

```js
    voice: 'taiko',     // → src/features/audio/voices.js
```

to:

```js
    voice: 'hina',      // → src/features/audio/voices.js
```

**Verify** the pack is still "ready" and tests stay green:

```bash
grep -n "voice:" src/features/packs/packs.js
# line 23 -> voice: 'hina',  (pack_02..pack_06 tetap 'dummy')
npm test 2>&1 | grep -E "ℹ (tests|pass|fail)"
# expect: ℹ tests 51 / ℹ pass 51 / ℹ fail 0
```

Commit:

```bash
git add src/features/packs/packs.js
git commit -m "feat(packs): kotodama_burst pakai voice hina"
```

---

### Task 5 — Full validation (no commit)

```bash
npm test 2>&1 | grep -E "ℹ (tests|pass|fail)"     # ℹ tests 51 / pass 51 / fail 0
npm run lint                                      # 0 errors (oxlint)
npm run build 2>&1 | grep -E "built in|error"     # "✓ built in …" , no "error"
ls -1 public/voices/hina | wc -l                  # 13
```

Manual listen (browser):

```bash
npm run dev
```

1. Open the printed `http://localhost:5173`.
2. Go to **/settings** → Developer panel → **✨ Buka & Pakai Efek** (equips `kotodama_burst`).
3. Start a quiz, answer correctly:
   - Correct answers → hear a random `correct_*.mp3` (and the ink hanko visual).
   - Wrong answer → hear a random `wrong_*.mp3`.
   - Get a **3-answer streak** → hear `streak_1.mp3` (`いい調子〜！`).
4. Confirm streak clips escalate at milestones (hard to reach 50/100 manually; trust the unit
   tests for tier mapping, or temporarily lower `MILESTONES` locally — do not commit that).

---

## Tests / validation

- Unit (Node): the 5 new tests above pin the registry shape and the level→tier mapping.
  Final gate: `npm test` → `ℹ tests 51 / ℹ pass 51 / ℹ fail 0`.
- Lint/build gates: `npm run lint` (0 errors), `npm run build` (built, no error).
- Asset gate: 13 non-zero files under `public/voices/hina/`, no path duplicates (asserted in test).
- Manual audio gate: the Task 5 dev-server walkthrough (browser-only code can't be unit-tested).
- TDD cycle per code task: write test → run (fail) → implement → run (pass) → commit.

## Risks, tradeoffs, and open questions

- **Random streak bug is the main risk.** If Task 3 is skipped, streak 100 can play the streak-3
  clip. The `streakFiles.length === 6` guard keeps old behavior for any voice with ≠6 streak files.
- **Silent files / wrong mapping.** If a clip fails to load, `playFile` returns `false` → falls back
  to `synthGong`; nothing errors, but a wrong mapping would be *audible* — the Task 5 listen step
  is the check. (Files were verified non-empty; audio content wasn't machine-verified.)
- **Autoplay policy.** Browsers need a user gesture before audio plays; already satisfied because
  sounds fire on quiz answers. Existing behavior, unchanged.
- **Overlap.** Streak sound plays on *every* correct answer once streak ≥ 3 (existing design), so
  clips may talk over each other on fast answering. Out of scope; note only.
- **`voice.synth` field is vestigial** — `sfx.js` never reads it (only tests assert it). Kept for
  consistency; not a functional dependency.
- **Open question:** attach `hina` to pack #1 only (this plan, matches the design doc) — or also
  to the dummy packs (`pack_02..06`) / a brand-new pack? Default = pack #1; change Task 4's file
  if the intent differs.
- **Open question:** license — Hina Chono is a copyrighted character; the doc notes this is fine
  for personal use but risky if the app is published/sold. Not a code blocker.
- **Repo hygiene:** `docs/` is currently untracked (`git status` shows `?? docs/`). Decide whether
  to commit `docs/voice-pack-1-hina.md` alongside this work (harmless; not required).
