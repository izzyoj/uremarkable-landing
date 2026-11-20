"""Build an autoplay presenter from a teleprompter script.

Usage: python3 tools/presenter/build.py tools/teleprompter/scripts/<script>.txt [words_per_second]

Reads (SCREEN: tag) cues, times every line like the timed/ files, and writes
tools/presenter/out/<slug>.js (paste into the browser console on the live page)
and <slug>.bookmarklet.txt (save as a bookmark URL).
Tags: map | off | stage:NN | jtbd|forces|drop|champion|ai|head:NN, joined with +.
"""
import json, re, sys, urllib.parse
from pathlib import Path

GAP_SHORT, GAP_LONG, BREATHE, HOLD = 0.4, 1.0, 0.5, 2.0

def timeline(path, wps):
    t, cues = 0.0, []
    for line in Path(path).read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        for tag in re.findall(r"\(SCREEN:\s*([^)]+)\)", line):
            cues.append({"t": round(t, 1), "tag": tag.strip()})
        clean = re.sub(r"\{[^}]*\}|\([^)]*\)|//pause longer|/pause|↗rise|↘drop", "", line)
        clean = re.sub(r"\s+", " ", clean.replace("[", "").replace("]", "")).strip()
        gap = (BREATHE if "(breathe)" in line else 0) + \
              (GAP_LONG if "//pause longer" in line else GAP_SHORT if "/pause" in line else 0) + \
              (HOLD if "2 seconds" in line else 0)
        t += len(clean.split()) / wps + gap
    return cues, t

def main():
    src = sys.argv[1]
    wps = float(sys.argv[2]) if len(sys.argv) > 2 else 2.4
    cues, total = timeline(src, wps)
    here = Path(__file__).parent
    player = (here / "player.src.js").read_text(encoding="utf-8")
    js = f"window.__CUES={json.dumps(cues)};\n{player}"
    out = here / "out"; out.mkdir(exist_ok=True)
    slug = Path(src).stem
    (out / f"{slug}.js").write_text(js, encoding="utf-8")
    (out / f"{slug}.bookmarklet.txt").write_text("javascript:" + urllib.parse.quote(js), encoding="utf-8")
    for c in cues:
        print(f"{int(c['t']//60)}:{c['t']%60:04.1f}  {c['tag']}")
    print(f"total {int(total//60)}:{total%60:04.1f} at {wps} words/s -> {out}/{slug}.js")

if __name__ == "__main__":
    main()
