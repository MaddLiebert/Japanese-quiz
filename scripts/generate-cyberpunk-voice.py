#!/usr/bin/env python3
# ─────────────────────────────────────────────────────────────────────────────
# Generator klip voice cinematic 電脳 (Cyberpunk) — narator Nacht (wujud asli).
#
# Pola sama dengan scripts/generate-anime-voice.py (edge-tts). Narator cinematic
# bergantian per era (docs/story.md §4): Heian → Saku, Edo → Nacht, Meiji → Saku,
# Shōwa → Nacht, 多元 → SAKU, 電脳 → NACHT. 9 baris di public/voices/cyberpunk/.
#
# Pakai:
#   python scripts/generate-cyberpunk-voice.py            # generate 9 klip
#   python scripts/generate-cyberpunk-voice.py --list      # cuma lihat daftar
#   python scripts/generate-cyberpunk-voice.py 03_peak     # satu klip saja
#
# Naskah + timing authoritative: src/features/cinematic/cyberpunk/data/scenes.js
# (voiceCues()).
#
# ⚠️ Ini voice SINTETIS (edge-tts, Microsoft neural). Kalau mau memakai rekaman
#    Nacht ASLI (seperti Edo/Shōwa), taruh sumber di voice-source/cyberpunk/ lalu
#    potong dengan scripts/split-voice.py.
# ─────────────────────────────────────────────────────────────────────────────
import asyncio
import sys
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "voices" / "cyberpunk"

# Casting Nacht: berat, tenang, sedikit dingin (narator malam abadi — bukan
# tokoh ceria). KeitaNeural = suara pria Jepang dalam & mantap.
VOICE = "ja-JP-KeitaNeural"
RATE = "-6%"
PITCH = "-4Hz"

# (file, teks kana untuk TTS) — urut sesuai voiceCues().
LINES = [
    ("01_yoi", "ようこそ、常夜へ。"),
    ("02_machi", "眠らない街。"),
    ("03_peak", "これが、文明の果て。"),
    ("04_tower", "光の塔、空を穿つ。"),
    ("05_yoru", "だが、夜は明けない。"),
    ("06_owari", "終わらない夜。"),
    ("07_ie", "それでも、家がある。"),
    ("08_era", "電脳。常夜の果て。"),
    ("09_welcome", "ようこそ、電脳へ。"),
]


async def synth(name: str, text: str) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUT_DIR / f"{name}.mp3"
    comm = edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH)
    await comm.save(str(out))
    print(f"  ✓ {out.relative_to(ROOT)}  ({out.stat().st_size} bytes)")


async def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if "--list" in sys.argv:
        for name, text in LINES:
            print(f"{name}: {text}")
        return
    picks = LINES if not args else [l for l in LINES if l[0] in args]
    if not picks:
        print("Tidak ada baris cocok. Pakai --list untuk melihat daftar.")
        return
    print(f"Generate {len(picks)} klip voice 電脳 (Nacht) → {OUT_DIR.relative_to(ROOT)}/")
    for name, text in picks:
        await synth(name, text)


if __name__ == "__main__":
    asyncio.run(main())
