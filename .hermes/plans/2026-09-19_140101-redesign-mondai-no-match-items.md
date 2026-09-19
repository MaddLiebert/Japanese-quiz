# Next Steps: Redesign Mondai Quiz Items (74 NO_MATCH)

## Goal
Redesign 74 quiz items where audio content doesn't match the generic options, so each item has proper questions/options derived from the actual audio transcript.

## Current Context / Assumptions
- 87 items total in `src/data/mondai.json`.
- 13 MATCH items already fixed (correctIndex aligned with audio).
- 74 NO_MATCH items: audio contains real Japanese dialog/questions, but options are 4 generic phrases (`はい、そうです。` / `いいえ、ちがいます。` / `わかりました。` / `どうぞよろしくおねがいします。`).
- Transcripts available in `reports/mondai-transcripts.json` (from faster-whisper).
- `dialogScript` fields are placeholders for most items.
- Structure per item: `id`, `chapter`, `title`, `audio`, `questionText`, `options[4]`, `correctIndex`, `explanation`, `dialogScript[{speaker, text}]`.
- App: Vite + React, neo-brutalist, `MondaiQuiz.jsx` reads `mondai.json` directly.

## Architecture / Proposed Approach
1. Use transcripts to generate per-item: a focused question, 4 plausible options (1 correct from audio, 3 distractors), and update `dialogScript` with actual speaker lines.
2. Process in batches by chapter (1–25) to keep scope small.
3. For each item: read transcript → design question → pick correct answer span → write 3 distractors → update JSON.
4. After each batch: run validation, lint, build.

## Step-by-Step Tasks

### Task 1: Build helper script `scripts/design-mondai-questions.py`
Create a script that loads transcripts + current data, and for a given item id:
- Prints transcript
- Suggests a question based on content type (Kaiwa vs Mondai)
- Lets user input: questionText, correctAnswer (exact substring from transcript), 3 distractors
- Writes back to `mondai.json` (updates `questionText`, `options`, `correctIndex`, `explanation`, `dialogScript` from transcript segments)

```python
# scripts/design-mondai-questions.py
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
data = json.loads((ROOT / "src" / "data" / "mondai.json").read_text(encoding="utf-8"))
transcripts = {e["id"]: e["transcript"] for e in json.loads((ROOT / "reports" / "mondai-transcripts.json").read_text(encoding="utf-8"))}
by_id = {item["id"]: item for item in data}

def norm(s): return re.sub(r"[^\u3040-\u30ff\u30a0-\u30ff\u4e00-\u9fff]", "", s)

def design_item(item_id):
    item = by_id[item_id]
    t = transcripts[item_id]
    print(f"\n=== {item_id} {item['title']} ===")
    print(f"Transcript: {t[:300]}")
    print(f"Current options: {item['options']}")
    print(f"Current correctIndex: {item['correctIndex']}")
    print(f"Current dialogScript: {item['dialogScript']}")
    # Interactive prompts would go here; for plan we describe the flow
```

### Task 2: Process Chapter 1 items (m02, m03, m04)
- m02 "Dai 1 Ka - Mondai 1" — transcript shows list of 5 questions. Design one question per sub-question or split into 5 items. Simpler: make one question "Audio berisi daftar pertanyaan. Pertanyaan pertama apa?" with options from transcript.
- m03, m04 similar.
- Update JSON for each.

### Task 3: Process Chapter 2 items (m05–m08)
- m05 Kaiwa, m06–m08 Mondai. Use transcripts to create relevant questions.

### Task 4: Continue chapters 3–25 in batches of 3–5 items
- Repeat Task 2/3 pattern.
- After each batch: `node check-mondai.js`, `npm run lint`, `npm run build`.

### Task 5: Update dialogScript for all items from transcript segments
- Split transcript by speaker cues (男/女) or sentence boundaries.
- Populate `dialogScript` array with `{speaker, text}`.

### Task 6: Final verification
- Run `node check-mondai.js` → all pass.
- `npm run lint` → 0 errors.
- `npm run build` → success.
- Spot-check 5 random items in browser (dev server) to confirm UI shows new questions/options.

## Tests / Validation
- After each batch: `node check-mondai.js` must output "Semua cek lolos."
- `npm run lint` exit 0 (warnings OK).
- `npm run build` exit 0.
- Manual: open `http://localhost:5173/mondai` (or route) and verify new questions render, audio plays, correct answer matches audio.

## Risks, Tradeoffs, Open Questions
- **Scope**: 74 items × ~5 min = ~6 hours. Consider splitting across sessions.
- **Question design**: Need Japanese proficiency to craft natural distractors. If unavailable, use LLM (prompt with transcript + "create 4-choice question") then human review.
- **Splitting long audio**: Some Mondai audio contains multiple sub-questions (e.g., m02 has 5). Decide: keep 1 item per audio file (question about overall content) or split into multiple items (requires new audio cuts). Plan assumes 1 item per file.
- **dialogScript speaker detection**: Transcript lacks speaker labels. Heuristic: alternate 男/女 per sentence, or keep as single speaker. Acceptable for display.
- **Audio replacement alternative**: If redesign too heavy, could regenerate audio to match existing generic options (TTS). But loses authentic listening practice.
- **Open**: Confirm with user whether to proceed with redesign (Option A) or replace audio with TTS matching current options (Option B).