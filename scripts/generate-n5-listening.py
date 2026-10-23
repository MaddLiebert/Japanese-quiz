#!/usr/bin/env python3
# ─────────────────────────────────────────────────────────────────────────────
# Generator klip listening N5 yang BOLONG: 言語表現 (verbal_expression) +
# 応答 (quick_response) di src/data/n5-exam.json. Dua mondai ini di JLPT asli
# murni DENGAR — tanpa audio, soalnya cuma jadi soal baca dan prompt kana-nya
# membocorkan jawaban.
#
# Pola sama dengan scripts/generate-cyberpunk-voice.py (edge-tts).
#
#   python scripts/generate-n5-listening.py            # generate semua
#   python scripts/generate-n5-listening.py --list     # lihat teks TTS
#   python scripts/generate-n5-listening.py n5ve_001   # satu klip
#
# Output: public/audio/n5-ve-001.mp3 dst (huruf kecil, tanpa spasi — Vercel
# case-sensitive). Setelah itu unggah dengan scripts/upload-audio.mjs.
# ─────────────────────────────────────────────────────────────────────────────
import asyncio
import json
import re
import sys
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
BANK = ROOT / "src" / "data" / "n5-exam.json"
OUT_DIR = ROOT / "public" / "audio"

# Suara penguji: perempuan, netral, tempo sedikit lambat (pemula N5).
VOICE = "ja-JP-NanamiNeural"
RATE = "-8%"

# n5ve_001 → n5-ve-001.mp3
FILE_STEM = {"verbal_expression": "ve", "quick_response": "qr"}


def spoken(prompt: str) -> str:
    """Prompt bank → teks TTS. Buang tanda kurung petunjuk adegan, sisakan
    ujaran + pertanyaan. 例: （ともだちの いえを でます）なんと いますか。
    → ともだちの いえを でます。なんと いますか。"""
    text = re.sub(r"[（）()「」]", "、", prompt)
    text = re.sub(r"、+", "、", text).strip("、 ")
    return text


def lines() -> list[tuple[str, str]]:
    bank = json.loads(BANK.read_text(encoding="utf-8"))
    out = []
    for key, stem in FILE_STEM.items():
        for item in bank.get(key, []):
            item_id = item["id"]
            name = f"n5-{stem}-{item_id.split('_')[-1]}"
            out.append((name, spoken(item["prompt"])))
    return out


async def synth(name: str, text: str) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUT_DIR / f"{name}.mp3"
    await edge_tts.Communicate(text, VOICE, rate=RATE).save(str(out))
    print(f"  ✓ {out.relative_to(ROOT)}  ({out.stat().st_size} bytes)")


async def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    all_lines = lines()
    if "--list" in sys.argv:
        for name, text in all_lines:
            print(f"{name}: {text}")
        return
    picks = all_lines if not args else [l for l in all_lines if l[0] in args]
    if not picks:
        print("Tidak ada klip yang cocok.")
        return
    for name, text in picks:
        await synth(name, text)
    print(f"\n{len(picks)} klip. Unggah: node scripts/upload-audio.mjs")


if __name__ == "__main__":
    asyncio.run(main())
