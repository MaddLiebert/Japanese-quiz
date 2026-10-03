#!/usr/bin/env python3
"""
split-voice.py — potong satu mp3 narasi panjang jadi klip per-baris.

Dipakai untuk voice cinematic Heian (public/voices/heian/). Deteksi SENYAP
(ffmpeg silencedetect) → pecah di tengah jeda → beri nama berurutan.

Pakai:
  python scripts/split-voice.py <input.mp3> <outdir> --names 01_year,02_capital,...
  python scripts/split-voice.py <input.mp3> --inspect          # cuma lihat jeda
  python scripts/split-voice.py <input.mp3> <outdir> --gap-db -38 --min-sil 0.4

Catatan: tanpa --names, klip dinamai seg_01.mp3, seg_02.mp3, ...
"""
import argparse
import json
import os
import re
import subprocess
import sys

try:
    import imageio_ffmpeg
except ImportError:
    print("imageio-ffmpeg tidak ada. jalankan: python -m pip install imageio-ffmpeg")
    sys.exit(2)

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


def run(args):
    return subprocess.run([FFMPEG, *args], capture_output=True, text=True, encoding="utf-8", errors="replace")


def duration(path):
    r = run(["-i", path, "-f", "null", "-"])
    m = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.\d+)", r.stderr or "")
    if not m:
        return None
    h, mm, s = m.groups()
    return int(h) * 3600 + int(mm) * 60 + float(s)


def detect_silence(path, gap_db=-35, min_sil=0.45):
    """Kembalikan list (start, end) jeda senyap."""
    r = run(["-i", path, "-af", f"silencedetect=noise={gap_db}dB:d={min_sil}", "-f", "null", "-"])
    err = r.stderr or ""
    starts = [float(x) for x in re.findall(r"silence_start:\s*([0-9.]+)", err)]
    ends = [float(x) for x in re.findall(r"silence_end:\s*([0-9.]+)", err)]
    spans = []
    for i, s in enumerate(starts):
        e = ends[i] if i < len(ends) else None
        spans.append((s, e))
    return spans


def _sound_spans(spans, total):
    """Komplemen jeda senyap → interval yang BENAR-BENAR bersuara."""
    out, cur = [], 0.0
    for s, e in spans:
        if e is None:
            continue
        if s > cur:
            out.append((cur, s))
        cur = max(cur, e)
    if cur < total:
        out.append((cur, total))
    return out


def segments_from_silence(spans, total, min_seg=0.35, lead=0.15, tail=0.30):
    """Segmen = rentang SUARA (komplemen jeda), dipangkas senyap tepi.

    Pangkas ke batas suara (bukan titik-tengah jeda) supaya tiap klip MULAI
    tepat saat kata mulai — kalau tidak, klip berisi senyap panjang di depan
    dan voice-nya mendarat telat saat dijadwalkan pada waktu visual.
    `lead`/`tail` = margin kecil agar konsonan awal/akhir tidak terpotong.
    """
    sil = [(s, e) for s, e in spans if e is not None]
    segs = []
    for a, b in _sound_spans(sil, total):
        a2 = max(0.0, a - lead)
        b2 = min(total, b + tail)
        if b2 - a2 >= min_seg:
            segs.append((a2, b2))
    return segs


def split(path, outdir, segs, names=None):
    os.makedirs(outdir, exist_ok=True)
    made = []
    for i, (a, b) in enumerate(segs):
        if names and i < len(names):
            name = names[i]
        else:
            name = f"seg_{i + 1:02d}"
        out = os.path.join(outdir, f"{name}.mp3")
        r = run(["-y", "-ss", f"{a:.3f}", "-to", f"{b:.3f}", "-i", path,
                 "-c:a", "libmp3lame", "-q:a", "2", out])
        if r.returncode != 0 or not os.path.exists(out):
            print(f"  GAGAL {name}: {(r.stderr or '')[-200:]}")
            continue
        made.append({"name": name, "start": round(a, 3), "end": round(b, 3),
                     "dur": round(b - a, 3), "path": out})
    return made


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input")
    ap.add_argument("outdir", nargs="?")
    ap.add_argument("--names", default="", help="01_year,02_capital,...")
    ap.add_argument("--gap-db", type=float, default=-35.0)
    ap.add_argument("--min-sil", type=float, default=0.8, help="jeda minimal (s) untuk dianggap pemisah; naikkan bila ada jeda internal dalam satu kalimat")
    ap.add_argument("--min-seg", type=float, default=0.35)
    ap.add_argument("--lead", type=float, default=0.15)
    ap.add_argument("--tail", type=float, default=0.30)
    ap.add_argument("--inspect", action="store_true")
    a = ap.parse_args()

    if not os.path.exists(a.input):
        print(f"input tidak ada: {a.input}")
        sys.exit(1)

    total = duration(a.input)
    print(f"input : {a.input}")
    print(f"durasi: {total:.2f}s" if total else "durasi: ?")

    spans = detect_silence(a.input, a.gap_db, a.min_sil)
    print(f"jeda terdeteksi ({len(spans)}):")
    for s, e in spans:
        print(f"   {s:6.2f} → {e:6.2f}" if e else f"   {s:6.2f} → (akhir)")

    if total is None:
        sys.exit(1)
    segs = segments_from_silence(spans, total, a.min_seg, a.lead, a.tail)
    print(f"segmen ({len(segs)}):")
    for i, (s, e) in enumerate(segs):
        print(f"   [{i + 1}] {s:6.2f} → {e:6.2f}  ({e - s:.2f}s)")

    if a.inspect or not a.outdir:
        if not a.outdir:
            print("\n(tanpa outdir → hanya inspeksi; tambahkan outdir untuk memotong)")
        return

    names = [n.strip() for n in a.names.split(",") if n.strip()] or None
    made = split(a.input, a.outdir, segs, names)
    print(f"\n{len(made)} klip → {a.outdir}")
    for m in made:
        print(f"   {m['name']}.mp3  {m['dur']:.2f}s")
    print("\nJSON:")
    print(json.dumps(made, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
