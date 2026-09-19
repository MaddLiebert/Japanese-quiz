"""Analisis kesesuaian data quiz dengan isi audio yang sebenarnya.

Input : reports/mondai-transcripts.json (hasil transcribe-mondai.py)
        src/data/mondai.json
Output: reports/mondai-analysis.json  +  reports/mondai-analysis.txt

Klasifikasi per item:
  MATCH       - tepat satu opsi substring di transkrip -> correctIndex harus menunjuk opsi itu
  MULTI_MATCH - >1 opsi substring di transkrip -> ambigu, review manual
  NO_MATCH    - tidak ada opsi yang sesuai isi audio -> konten soal perlu redesign
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
report = json.loads((ROOT / "reports" / "mondai-transcripts.json").read_text(encoding="utf-8"))
data = json.loads((ROOT / "src" / "data" / "mondai.json").read_text(encoding="utf-8"))
by_id = {item["id"]: item for item in data}

PLACEHOLDER_RE = re.compile(r"^第\d+課のリスニング問題です。$")


def norm(s: str) -> str:
    return re.sub(r"[^\u3040-\u30ff\u30a0-\u30ff\u4e00-\u9fff]", "", s)


rows = []
for e in report:
    item = by_id[e["id"]]
    matches = [i for i, s in enumerate(e["scores"]) if s == 1.0]
    if len(matches) == 1:
        status = "MATCH"
    elif len(matches) > 1:
        status = "MULTI_MATCH"
    else:
        status = "NO_MATCH"

    placeholder_script = all(
        PLACEHOLDER_RE.match(line["text"].strip()) or line["text"].strip() == "はい、わかりました。"
        for line in item["dialogScript"]
    )

    rows.append({
        "id": e["id"],
        "title": e["title"],
        "status": status,
        "correctIndex_now": item["correctIndex"],
        "correctIndex_should": matches[0] if len(matches) == 1 else None,
        "matching_options": [item["options"][i] for i in matches],
        "placeholder_script": placeholder_script,
        "transcript": e["transcript"],
    })

(ROOT / "reports" / "mondai-analysis.json").write_text(
    json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8"
)

counts = {}
for r in rows:
    counts[r["status"]] = counts.get(r["status"], 0) + 1

lines = []
lines.append(f"Analisis kesesuaian quiz Mondai (total {len(rows)} item)")
lines.append(f"Ringkasan: " + ", ".join(f"{k}={v}" for k, v in sorted(counts.items())) + "\n")

lines.append("=== MATCH (opsi cocok audio; correctIndex perlu dicek) ===")
for r in rows:
    if r["status"] == "MATCH":
        flag = "" if r["correctIndex_now"] == r["correctIndex_should"] else "  <-- SALAH SEKARANG"
        lines.append(f'{r["id"]} {r["title"]}: opsi#{r["correctIndex_should"]} "{r["matching_options"][0]}"{flag}')
lines.append("")

lines.append("=== MULTI_MATCH (ambigu, review manual) ===")
for r in rows:
    if r["status"] == "MULTI_MATCH":
        lines.append(f'{r["id"]} {r["title"]}: cocok opsi {r["matching_options"]}')
        lines.append(f'  transkrip: {r["transcript"][:150]}')
lines.append("")

lines.append("=== NO_MATCH (opsi tidak sesuai isi audio) ===")
for r in rows:
    if r["status"] == "NO_MATCH":
        script_flag = " [script placeholder]" if r["placeholder_script"] else ""
        lines.append(f'{r["id"]} {r["title"]}{script_flag} (correctIndex={r["correctIndex_now"]})')
        lines.append(f'  transkrip: {r["transcript"][:150]}')
lines.append("")

lines.append(f"Total script placeholder: {sum(1 for r in rows if r['placeholder_script'])}/{len(rows)}")

(ROOT / "reports" / "mondai-analysis.txt").write_text("\n".join(lines), encoding="utf-8")
print("\n".join(lines[:20]))
print(f"\n... (full report: reports/mondai-analysis.txt)")
