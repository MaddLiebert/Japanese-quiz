"""Interactive helper to redesign mondai quiz items from transcripts.

Usage: python scripts/design-mondai-questions.py [item_id]
If no item_id given, runs interactive batch mode.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT / "src" / "data" / "mondai.json"
TRANSCRIPT_PATH = ROOT / "reports" / "mondai-transcripts.json"

data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
transcripts = {e["id"]: e["transcript"] for e in json.loads(TRANSCRIPT_PATH.read_text(encoding="utf-8"))}
by_id = {item["id"]: item for item in data}

PLACEHOLDER_OPTIONS = [
    "はい、そうです。",
    "いいえ、ちがいます。",
    "わかりました。",
    "どうぞよろしくおねがいします。",
]

def norm(s: str) -> str:
    return re.sub(r"[^\u3040-\u30ff\u30a0-\u30ff\u4e00-\u9fff]", "", s)

def split_dialog(transcript: str):
    """Heuristic: split by sentence-ending punctuation, alternate speakers."""
    sentences = re.split(r"([。！？])", transcript)
    segments = []
    for i in range(0, len(sentences), 2):
        text = (sentences[i] + (sentences[i+1] if i+1 < len(sentences) else "")).strip()
        if text:
            segments.append(text)
    dialog = []
    for idx, seg in enumerate(segments):
        speaker = "男" if idx % 2 == 0 else "女"
        dialog.append({"speaker": speaker, "text": seg})
    return dialog

def show_item(item_id: str):
    item = by_id[item_id]
    t = transcripts[item_id]
    print(f"\n{'='*60}")
    print(f"{item_id} | {item['title']} | Chapter {item['chapter']}")
    print(f"{'='*60}")
    print(f"Transcript: {t}")
    print(f"\nCurrent:")
    print(f"  questionText: {item['questionText']}")
    print(f"  options: {item['options']}")
    print(f"  correctIndex: {item['correctIndex']}")
    print(f"  explanation: {item['explanation']}")
    print(f"  dialogScript: {item['dialogScript']}")
    suggested_dialog = split_dialog(t)
    print(f"\nSuggested dialogScript ({len(suggested_dialog)} lines):")
    for d in suggested_dialog:
        print(f"  {d['speaker']}: {d['text'][:80]}")
    return item, t, suggested_dialog

def update_item(item_id: str, question_text: str, options: list, correct_index: int, 
                explanation: str, dialog_script: list):
    item = by_id[item_id]
    item["questionText"] = question_text
    item["options"] = options
    item["correctIndex"] = correct_index
    item["explanation"] = explanation
    item["dialogScript"] = dialog_script
    DATA_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✓ Updated {item_id}")

def interactive_design(item_id: str):
    item, transcript, suggested_dialog = show_item(item_id)
    
    print("\n--- Design new question ---")
    print("Enter questionText (Indonesian):")
    question_text = input("> ").strip()
    if not question_text:
        print("Skipped.")
        return
    
    print("\nEnter correct answer (exact substring from transcript, or Japanese text):")
    correct_ans = input("> ").strip()
    if not correct_ans:
        print("Skipped.")
        return
    
    print("\nEnter 3 distractors (one per line, empty to skip):")
    distractors = []
    for i in range(3):
        d = input(f"  Distractor {i+1}: ").strip()
        if not d:
            # Use generic ones as fallback
            for opt in PLACEHOLDER_OPTIONS:
                if opt != correct_ans and opt not in distractors:
                    distractors.append(opt)
                    break
        else:
            distractors.append(d)
    
    # Build options list with correct at random position
    import random
    options = distractors[:]
    correct_index = random.randint(0, 3)
    options.insert(correct_index, correct_ans)
    
    print("\nEnter explanation (Indonesian):")
    explanation = input("> ").strip()
    if not explanation:
        explanation = f"Jawaban benar berdasarkan audio: {correct_ans}"
    
    print("\nUse suggested dialogScript? (y/n):")
    use_suggested = input("> ").strip().lower()
    if use_suggested == 'y':
        dialog_script = suggested_dialog
    else:
        print("Enter dialog lines as 'speaker|text' (empty to finish):")
        dialog_script = []
        while True:
            line = input("  > ").strip()
            if not line:
                break
            if '|' in line:
                sp, txt = line.split('|', 1)
                dialog_script.append({"speaker": sp.strip(), "text": txt.strip()})
    
    update_item(item_id, question_text, options, correct_index, explanation, dialog_script)

def batch_mode(start_chapter: int = 1, end_chapter: int = 25):
    """Process all NO_MATCH items in chapter range."""
    # Load analysis to get NO_MATCH list
    analysis = json.loads((ROOT / "reports" / "mondai-analysis.json").read_text(encoding="utf-8"))
    no_match_ids = [r["id"] for r in analysis if r["status"] == "NO_MATCH" and start_chapter <= by_id[r["id"]]["chapter"] <= end_chapter]
    
    print(f"Processing {len(no_match_ids)} NO_MATCH items in chapters {start_chapter}-{end_chapter}")
    for item_id in no_match_ids:
        try:
            interactive_design(item_id)
        except KeyboardInterrupt:
            print("\nBatch interrupted.")
            break
        except Exception as e:
            print(f"Error on {item_id}: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        interactive_design(sys.argv[1])
    else:
        batch_mode()