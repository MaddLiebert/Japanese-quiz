#!/usr/bin/env python3
# ─────────────────────────────────────────────────────────────────────────────
# Generator klip voice cinematic 多元 (Anime Multiverse) — narator Saku 咲.
#
# Pola sama dengan scripts/generate-jjk-voices.py (edge-tts). Narator cinematic
# bergantian per era (docs/story.md §4): Heian → Saku, Edo → Nacht, Meiji → Saku,
# Shōwa → Nacht, 多元 → SAKU. 7 baris di public/voices/anime/.
#
# Pakai:
#   python scripts/generate-anime-voice.py            # generate 7 klip
#   python scripts/generate-anime-voice.py --list      # cuma lihat daftar
#   python scripts/generate-anime-voice.py 03_stories  # satu klip saja
#
# Naskah + timing authoritative: docs/voice-cinematic-anime.md (§1/§2) dan
# src/features/cinematic/anime/data/scenes.js (voiceCues()).
#
# ⚠️ Ini voice SINTETIS (edge-tts, Microsoft neural). Kalau mau memakai rekaman
#    Saku ASLI (seperti Heian/Meiji), taruh sumber di voice-source/anime/ lalu
#    potong dengan scripts/split-voice.py (lihat docs/voice-cinematic-anime.md).
# ─────────────────────────────────────────────────────────────────────────────
import asyncio
import sys
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "voices" / "anime"

# Casting Saku 咲: hangat, ramah, PELAN (narator, bukan tokoh aksi).
# NanamiNeural = suara wanita Jepang jernih; rate pelan + pitch sedikit naik →
# nada hangat. (Beda dari casting aksi JJK yang cepat/tinggi.)
VOICE = "ja-JP-NanamiNeural"
RATE = "-4%"
PITCH = "+2Hz"

# (file, teks kana untuk TTS, rate khusus opsional) — urut sesuai voiceCues().
# Rate khusus dipakai bila klip lebih panjang dari gap-nya di scenes.js:
#   01_world gap hanya 2.8s (baris 02_turn at 3.4 − 0.6) → dipercepat agar pas.
LINES = [
    ("01_world",   "ページの むこうに、せかいが ある。", "+12%"),  # 頁の向こうに、世界がある。
    ("02_turn",    "ここは じだいじゃない。せかいだ。", None),     # ここは時代じゃない。世界だ。
    ("03_stories", "いくつもの ものがたりが、まっている。", None),   # いくつもの物語が、待っている。
    ("04_choose",  "どの せかいへ、いく？", None),                # どの世界へ、行く？
    ("05_grow",    "せかいが、ふえていく。", None),                # 世界が、増えていく。
    ("06_era",     "たげん — せかいが ふえる", None),             # 多元 — 世界が増える
    ("07_welcome", "ようこそ、たげんへ。", None),                 # ようこそ、多元へ。
]


async def synth(name: str, text: str, rate: str = RATE) -> None:
    out = OUT_DIR / f"{name}.mp3"
    c = edge_tts.Communicate(text, VOICE, rate=rate, pitch=PITCH)
    await c.save(str(out))
    print(f"   ✓ {out.relative_to(ROOT)}  ({rate})  ← 「{text}」")


async def main() -> None:
    only = [a for a in sys.argv[1:] if not a.startswith("-")]
    if "--list" in sys.argv:
        print("7 klip cinematic 多元 (narator Saku 咲):")
        for n, t, _r in LINES:
            print(f"   {n:12s} 「{t}」")
        return
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    todo = [ln for ln in LINES if not only or ln[0] in only]
    if not todo:
        print("tak ada klip cocok dengan filter:", only)
        sys.exit(1)
    print(f"generate {len(todo)} klip → {OUT_DIR.relative_to(ROOT)}/  ({VOICE} {RATE} {PITCH})")
    for name, text, rate in todo:
        await synth(name, text, rate or RATE)
    print(f"\n✅ selesai: {len(todo)} klip. Wire sudah ada di anime/data/scenes.js.")


if __name__ == "__main__":
    asyncio.run(main())
