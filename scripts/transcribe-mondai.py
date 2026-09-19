"""Transcribe all mondai audio and diff correctIndex against the transcript.

Usage:  python scripts/transcribe-mondai.py
Output: reports/mondai-transcripts.json + mismatch table on stdout.
"""
import difflib
import json
import re
from pathlib import Path

from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parent.parent
data = json.loads((ROOT / "src" / "data" / "mondai.json").read_text(encoding="utf-8"))
model = WhisperModel("base", device="cpu", compute_type="int8")

def norm(s: str) -> str:
    # buang semua karakter non-Jepang (punctuation, spasi, Latin) — opsi & transkrip
    # dinormalisasi cara yang sama, jadi substring match tetap valid
    return re.sub(r"[^\u3040-\u30ff\u30a0-\u30ff\u4e00-\u9fff]", "", s)


report, mismatches = [], []
for i, item in enumerate(data):
    audio = ROOT / "public" / "audio" / item["audio"].split("/")[-1]
    segments, _ = model.transcribe(str(audio), language="ja", vad_filter=True)
    transcript = "".join(seg.text for seg in segments)
    n = norm(transcript)

    scores = []
    for opt in item["options"]:
        no = norm(opt)
        # opsi frasa pendek: substring = kecocokan penuh; fallback similarity
        scores.append(1.0 if no in n else difflib.SequenceMatcher(None, no, n).ratio())

    best = max(range(len(item["options"])), key=lambda j: scores[j])
    entry = {
        "id": item["id"],
        "title": item["title"],
        "transcript": transcript,
        "scores": [round(s, 3) for s in scores],
        "currentIndex": item["correctIndex"],
        "bestIndex": best,
        "topGap": round(scores[best] - max(s for j, s in enumerate(scores) if j != best), 3),
    }
    report.append(entry)
    print(f"[{i + 1}/{len(data)}] {item['id']} best={best} cur={item['correctIndex']} gap={entry['topGap']}", flush=True)
    if best != item["correctIndex"]:
        mismatches.append(entry)

out = ROOT / "reports" / "mondai-transcripts.json"
out.parent.mkdir(exist_ok=True)
out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

print(f"\nSelesai: {len(report)} item. Mismatch: {len(mismatches)}")
for m in mismatches:
    print(f'  {m["id"]} current={m["currentIndex"]} best={m["bestIndex"]} '
          f'scores={m["scores"]} gap={m["topGap"]}')
    print(f'    transkrip: {m["transcript"][:120]}')
