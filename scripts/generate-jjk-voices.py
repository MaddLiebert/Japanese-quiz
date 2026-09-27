#!/usr/bin/env python3
# ─────────────────────────────────────────────────────────────────────────────
# Generator klip voice pack Jujutsu Kaisen (edge-tts) → public/voices/<key>/.
# Pakai:  python scripts/generate-jjk-voices.py            # semua karakter
#         python scripts/generate-jjk-voices.py nobara     # satu karakter
# Output: 9 file per karakter (correct_1..3, wrong_1..3, streak_1..3).
# Tuning & alasan casting: docs/voice-pack-2-jujutsu.md
# ─────────────────────────────────────────────────────────────────────────────
import asyncio
import sys
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "voices"

# key: (voice, rate, pitch)
CAST = {
    "nobara": ("ja-JP-NanamiNeural", "+14%", "+6Hz"),
    "yuji":   ("ja-JP-KeitaNeural",  "+10%", "+5Hz"),
    "megumi": ("ja-JP-KeitaNeural",  "-6%",  "-2Hz"),
    "nanami": ("ja-JP-KeitaNeural",  "-8%",  "-4Hz"),
    "yuta":   ("ja-JP-KeitaNeural",  "+2%",  "+1Hz"),
    "toji":   ("ja-JP-KeitaNeural",  "-12%", "-10Hz"),
    "sukuna": ("ja-JP-KeitaNeural",  "-18%", "-6Hz"),
}

LINES = {
    "nobara": {
        "correct": ["よし！", "当然でしょ！", "決まりね！"],
        "wrong":   ["はぁ？", "うそでしょ…", "次は負けない！"],
        "streak":  ["この調子！", "ノってきた！", "止まらないわよ！"],
    },
    "yuji": {
        "correct": ["よしっ！", "やった！", "いける！"],
        "wrong":   ["うわっ！", "ドンマイ！", "次、次！"],
        "streak":  ["いい感じ！", "まだまだ！", "限界まで！"],
    },
    "megumi": {
        "correct": ["…よし", "そうだね", "上出来だ"],
        "wrong":   ["…しくじった", "次で決める", "落ち着け"],
        "streak":  ["悪くない", "調子いいね", "このまま行く"],
    },
    "nanami": {
        "correct": ["よし", "上々だ", "悪くない"],
        "wrong":   ["…残念だ", "仕切り直そう", "気を抜くな"],
        "streak":  ["良いペースだ", "堅実に", "この調子で"],
    },
    "yuta": {
        "correct": ["はい！", "やりました", "合ってますね"],
        "wrong":   ["あ…すみません", "大丈夫です", "次、頑張ります"],
        "streak":  ["いい流れですね", "ついてきてます", "このまま行きましょう"],
    },
    "toji": {
        "correct": ["ふん", "悪くねえ", "当然だ"],
        "wrong":   ["チッ", "次だ", "まだだ"],
        "streak":  ["やるじゃねえか", "まだ足りねえ", "このまま行くぞ"],
    },
    "sukuna": {
        "correct": ["愚問だ", "当然よ", "退屈しないな"],
        "wrong":   ["くだらん", "次は無いぞ", "弱すぎる"],
        "streak":  ["面白い", "もっとだ", "我を楽しませろ"],
    },
}

async def generate(key: str) -> None:
    voice, rate, pitch = CAST[key]
    for kind, lines in LINES[key].items():
        folder = OUT_DIR / key
        folder.mkdir(parents=True, exist_ok=True)
        for i, text in enumerate(lines, start=1):
            target = folder / f"{kind}_{i}.mp3"
            await edge_tts.Communicate(text, voice, rate=rate, pitch=pitch).save(str(target))
            print(f"  {target.relative_to(ROOT)}  {target.stat().st_size} B  「{text}」")

def main() -> None:
    keys = sys.argv[1:] or list(CAST)
    unknown = [k for k in keys if k not in CAST]
    if unknown:
        raise SystemExit(f"Karakter tak dikenal: {unknown}. Pilihan: {list(CAST)}")
    for key in keys:
        print(f"[{key}]")
        asyncio.run(generate(key))

if __name__ == "__main__":
    main()
