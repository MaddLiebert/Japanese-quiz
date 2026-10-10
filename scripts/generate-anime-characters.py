#!/usr/bin/env python3
# ─────────────────────────────────────────────────────────────────────────────
# Generator klip voice 5 KARAKTER 多元 (Anime Multiverse) — LAPIS 3 / A16.
# Pola sama dengan scripts/generate-jjk-voices.py (edge-tts) → public/voices/<key>/.
#
# ⚠️ INI FALLBACK TTS (R9: "aset menyusul (fallback synth)"). Karakter 多元 =
#    FIKTIF/ORISINAL (§6.4) → tak ada rekaman asli. Klip ini mengisi slot yang
#    tadinya KOSONG (murni synth gong/thud) supaya tiap karakter PUNYA SUARA
#    SENDIRI yang khas — BUKAN TTS generik. Kalau nanti ada rekaman asli, taruh
#    di public/voices/<key>/ lalu ganti isi array files di voices.js.
#
# Identitas suara per karakter (edge-tts hanya punya 2 suara JA: Nanami=F,
# Keita=M) → dibedakan lewat RATE + PITCH + baris yang mencerminkan persona:
#   hoshi_hikari  Hikari 星の旅人   — ceria, petualang shōnen (F, cepat, tinggi)
#   kage_kuro     Kuro   影の忍者   — pendiam, kalem ninja (M, pelan, rendah)
#   mahou_mira    Mira   魔法学園   — riang, magical girl (F, paling cepat/tinggi)
#   kishin_zero   Zero   機神      — dingin, pilot mecha (M, sedang, agak rendah)
#   yokai_kitsune Kitsune 妖奇譚    — misterius, rubah halus (F, pelan, sedang)
#
# Pakai:  python scripts/generate-anime-characters.py            # semua
#         python scripts/generate-anime-characters.py hoshi_hikari
# Output: 9 file per karakter (correct_1..3, wrong_1..3, streak_1..3).
# ─────────────────────────────────────────────────────────────────────────────
import asyncio
import sys
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "voices"

# key: (voice, rate, pitch)
CAST = {
    "hoshi_hikari":  ("ja-JP-NanamiNeural", "+12%", "+6Hz"),   # ceria, energik
    "kage_kuro":     ("ja-JP-KeitaNeural",  "-8%",  "-4Hz"),   # pelan, rendah
    "mahou_mira":    ("ja-JP-NanamiNeural", "+16%", "+10Hz"),  # paling riang
    "kishin_zero":   ("ja-JP-KeitaNeural",  "-2%",  "-8Hz"),   # dingin, mekanis
    "yokai_kitsune": ("ja-JP-NanamiNeural", "-4%",  "+2Hz"),   # misterius, halus
}

# Baris mencerminkan PERSONA tiap karakter (bukan kalimat template yang sama).
LINES = {
    "hoshi_hikari": {
        "correct": ["よしっ！", "やった！", "星が導いてる！"],
        "wrong":   ["うわっ…", "まだまだ！", "次は行ける！"],
        "streak":  ["流れが来た！", "銀河を越えてく！", "止まらないよ！"],
    },
    "kage_kuro": {
        "correct": ["…よし", "決まった", "影は裏切らない"],
        "wrong":   ["…しくじった", "気配を消せ", "次で決める"],
        "streak":  ["忍びの道", "影が伸びる", "このまま潜む"],
    },
    "mahou_mira": {
        "correct": ["成功！", "魔法が効いた！", "キラキラ！"],
        "wrong":   ["あれっ？", "呪文ミス！", "もう一回！"],
        "streak":  ["魔力が満ちてる！", "星屑が舞う！", "もっと輝いて！"],
    },
    "kishin_zero": {
        "correct": ["よし", "システム正常", "任務完了"],
        "wrong":   ["…エラー", "再計算する", "次で補正"],
        "streak":  ["出力上昇", "機神、起動", "このまま行く"],
    },
    "yokai_kitsune": {
        "correct": ["ふふ", "当たりよ", "狐火が笑う"],
        "wrong":   ["あら…", "化かされたわ", "次は本気"],
        "streak":  ["妖の力", "しっぽが増える", "楽しくなってきた"],
    },
}


async def synth_retry(text: str, voice: str, rate: str, pitch: str, target: Path, tries: int = 4) -> None:
    """Simpan 1 klip dengan retry — edge-tts (server Microsoft) sering timeout."""
    last = None
    for attempt in range(1, tries + 1):
        try:
            await edge_tts.Communicate(text, voice, rate=rate, pitch=pitch).save(str(target))
            return
        except Exception as e:  # noqa: BLE001 — timeout/koneksi, ulang saja
            last = e
            if attempt < tries:
                await asyncio.sleep(1.5 * attempt)
    raise RuntimeError(f"gagal {target.name} setelah {tries} percobaan: {last}")


async def generate(key: str) -> None:
    voice, rate, pitch = CAST[key]
    for kind, lines in LINES[key].items():
        folder = OUT_DIR / key
        folder.mkdir(parents=True, exist_ok=True)
        for i, text in enumerate(lines, start=1):
            target = folder / f"{kind}_{i}.mp3"
            await synth_retry(text, voice, rate, pitch, target)
            print(f"  {target.relative_to(ROOT)}  {target.stat().st_size} B  「{text}」")


def main() -> None:
    keys = sys.argv[1:] or list(CAST)
    unknown = [k for k in keys if k not in CAST]
    if unknown:
        raise SystemExit(f"Karakter tak dikenal: {unknown}. Pilihan: {list(CAST)}")
    for key in keys:
        print(f"[{key}]  {CAST[key]}")
        asyncio.run(generate(key))
    print(f"\n✅ selesai: {len(keys)} karakter. Isi files di src/features/audio/voices.js.")


if __name__ == "__main__":
    main()
