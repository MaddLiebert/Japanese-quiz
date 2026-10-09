#!/usr/bin/env python3
"""
stitch-showa-voice.py — satukan 7 klip voice Shōwa jadi SATU mp3, dengan
JEDA (gap) presisi per detik supaya tiap baris mendarat di detik absolutnya.

Dipakai untuk voice cinematic Shōwa (docs/voice-cinematic-showa.md §2/§3).
Timeline diambil dari `voiceCues()` di src/features/cinematic/showa/data/scenes.js
(mulai scene: ruins 0 · yamichi 10 · build 24 · tower 38 · change 52; total 69s).

Pakai:
  python scripts/stitch-showa-voice.py
  python scripts/stitch-showa-voice.py --indir public/voices/showa \
      --out voice-source/showa/nacht-showa.mp3
  python scripts/stitch-showa-voice.py --no-lead   # tanpa senyap 10.6s di depan

Tanpa ffmpeg sistem → memakai imageio-ffmpeg (sama seperti split-voice.py).
Setelah jadi satu file, potong lagi bila perlu:
  python scripts/split-voice.py voice-source/showa/nacht-showa.mp3 public/voices/showa \
    --names 01_era,02_survive,03_concrete,04_rise,05_turn,06_era2,07_welcome
"""
import argparse
import os
import subprocess
import sys

try:
    import imageio_ffmpeg
except ImportError:
    print("imageio-ffmpeg tidak ada. jalankan: python -m pip install imageio-ffmpeg")
    sys.exit(2)

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
SR = 44100
CH = 2

# ── Timeline voice Shōwa (detik ABSOLUT) — sinkron dengan scenes.js / voiceCues() ──
# Urut sesuai scene: yamichi(10) → build(24) → tower(38) → change(52).
NAMES = ['01_era', '02_survive', '03_concrete', '04_rise', '05_turn', '06_era2', '07_welcome']
STARTS = [10.6, 13.6, 24.8, 38.7, 52.6, 57.0, 59.6]
TOTAL = 69.0  # total durasi cinematic (detik)


def run(args):
    return subprocess.run([FFMPEG, *args], capture_output=True, text=True,
                          encoding="utf-8", errors="replace")


def duration(path):
    r = run(["-i", path, "-f", "null", "-"])
    import re
    m = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.\d+)", r.stderr or "")
    if not m:
        return None
    h, mm, s = m.groups()
    return int(h) * 3600 + int(mm) * 60 + float(s)


def make_silence(path, seconds):
    """Buat file mp3 senyap `seconds` detik (format seragam)."""
    r = run(["-y", "-f", "lavfi", "-i",
             f"anullsrc=r={SR}:cl={'stereo' if CH == 2 else 'mono'}",
             "-t", f"{max(0.0, seconds):.3f}",
             "-c:a", "libmp3lame", "-q:a", "2", path])
    return r.returncode == 0 and os.path.exists(path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--indir", default="public/voices/showa")
    ap.add_argument("--out", default="voice-source/showa/nacht-showa.mp3")
    ap.add_argument("--no-lead", action="store_true", help="tanpa senyap di depan (10.6s)")
    ap.add_argument("--gap-db", type=float, default=-35.0)
    ap.add_argument("--min-sil", type=float, default=0.8)
    ap.add_argument("--times", default="", help="override start absolut: 10.6,13.6,...")
    a = ap.parse_args()

    starts = [float(x) for x in a.times.split(",") if x.strip()] or STARTS
    if len(starts) != len(NAMES):
        print(f"--times butuh {len(NAMES)} angka, dapat {len(starts)}")
        sys.exit(1)

    clips = [os.path.join(a.indir, f"{n}.mp3") for n in NAMES]
    missing = [c for c in clips if not os.path.exists(c)]
    if missing:
        print("klip tidak ditemukan:")
        for c in missing:
            print("   -", c)
        print("\nTaruh 7 klip (nama di atas) di", a.indir, "lalu ulangi.")
        sys.exit(1)

    durs = []
    for c in clips:
        d = duration(c)
        if d is None:
            print("gagal baca durasi:", c)
            sys.exit(1)
        durs.append(d)

    # Hitung senyap: lead, antar-baris, tail.
    lead = 0.0 if a.no_lead else max(0.0, starts[0])
    gaps = []
    for i in range(len(clips) - 1):
        gap = starts[i + 1] - (starts[i] + durs[i])
        gaps.append(gap)
    tail = max(0.0, TOTAL - (starts[-1] + durs[-1]))

    print("klip:")
    for n, d, s in zip(NAMES, durs, starts):
        print(f"   {n:12s} dur={d:6.2f}s  start={s:6.2f}s")
    print(f"\nlead silence : {lead:6.2f}s" + ("  (dimatikan)" if a.no_lead else ""))
    print("gap per detik (senyap antar-baris):")
    warn = []
    for i, g in enumerate(gaps):
        flag = ""
        if g < 0:
            flag = "  ⚠️ NEGATIF — klip lebih panjang dari gap! dipangkas ke 0.2s"
            warn.append(NAMES[i])
        print(f"   {NAMES[i]:12s} → {NAMES[i+1]:12s}: {g:6.2f}s{flag}")
    print(f"tail silence : {tail:6.2f}s")
    if warn:
        print("\n⚠️  Peringatan: klip ini menimpa baris berikutnya →", ", ".join(warn))
        print("    (perpendek klip atau perbesar gap di scenes.js)")

    os.makedirs(os.path.dirname(a.out) or ".", exist_ok=True)
    tmp = os.path.join(os.path.dirname(a.out) or ".", "_stitch_parts")
    os.makedirs(tmp, exist_ok=True)

    parts = []
    seq = []  # (label, path)
    if lead > 0.01:
        p = os.path.join(tmp, "00_lead.mp3")
        make_silence(p, lead)
        parts.append(p); seq.append(("lead", p))
    for i, c in enumerate(clips):
        parts.append(c); seq.append((NAMES[i], c))
        if i < len(clips) - 1:
            g = max(0.2 if gaps[i] < 0 else 0.0, gaps[i])
            if g > 0.01:
                p = os.path.join(tmp, f"gap_{i+1:02d}.mp3")
                make_silence(p, g)
                parts.append(p); seq.append((f"gap{i+1}", p))
    if tail > 0.01:
        p = os.path.join(tmp, "99_tail.mp3")
        make_silence(p, tail)
        parts.append(p); seq.append(("tail", p))

    listfile = os.path.join(tmp, "concat.txt")
    with open(listfile, "w", encoding="utf-8") as f:
        for _, p in seq:
            f.write(f"file '{os.path.abspath(p).replace(chr(92), '/')}'\n")

    r = run(["-y", "-f", "concat", "-safe", "0", "-i", listfile,
             "-c:a", "libmp3lame", "-q:a", "2", a.out])
    if r.returncode != 0 or not os.path.exists(a.out):
        print("GAGAL menyatukan:", (r.stderr or "")[-400:])
        sys.exit(1)

    total = duration(a.out)
    print(f"\n✅ satu file → {a.out}  ({total:.2f}s)" if total else f"\n✅ satu file → {a.out}")
    print("\nVerifikasi jeda (opsional):")
    print(f"  python scripts/split-voice.py {a.out} --inspect --min-sil {a.min_sil}")


if __name__ == "__main__":
    main()
