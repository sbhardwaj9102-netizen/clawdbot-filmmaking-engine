#!/usr/bin/env python3
"""
Generate every placeholder plate used by the portfolio prototype.

    pip install numpy opencv-python-headless
    python3 scripts/placeholders/generate.py            # everything
    python3 scripts/placeholders/generate.py aster      # only paths containing "aster"

Output goes to public/assets/<project>/... — the exact paths referenced in
data/*.ts. To use real footage/stills, simply overwrite a file with the same
name (or point the data file at a new path). Nothing else needs to change.
"""
import math
import os
import subprocess
import sys
from multiprocessing import Pool

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
import cv2  # noqa: E402

import scenes as S  # noqa: E402
from core import hexc, noise, save  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "public", "assets")

HERO = (2400, 1350)
L = (2000, 1125)
P = (1200, 1500)
WIDE = (2000, 840)

WARM = dict(lift=(0.0, 0.012, 0.022), gain=(1.0, 0.97, 0.92), contrast=1.08)
COOL = dict(lift=(0.0, 0.015, 0.03), gain=(0.95, 0.98, 1.0), contrast=1.08)
VIOLET = dict(lift=(0.012, 0.0, 0.03), gain=(1.0, 0.95, 1.0), contrast=1.1)
OCHRE = dict(lift=(0.02, 0.01, 0.0), gain=(1.0, 0.95, 0.85), contrast=1.06, sat=0.85)
CRIMSON = dict(lift=(0.02, 0.0, 0.005), gain=(1.0, 0.93, 0.9), contrast=1.1)

DAWN = [(0, "#16213a"), (0.3, "#3d4a6b"), (0.55, "#d7a283"), (1, "#e8b48c")]
BLUE_HOUR = [(0, "#0b1424"), (0.35, "#22324f"), (0.58, "#7f8fa8"), (1, "#7f8fa8")]
DUSK = [(0, "#1a1426"), (0.35, "#4a2f4f"), (0.58, "#d4806a"), (1, "#d4806a")]
DUST = [(0, "#2b1d12"), (0.3, "#6b4a2a"), (0.56, "#e0a35c"), (1, "#e0a35c")]


def crew_set(seed, key="#ffb36b", fill="#5b7186", light=(3.2, 3.4, 18), n=0, **kw):
    objs = [
        ("camera", 1.6, 7.0, dict(facing=1)),
        ("person", 0.9, 7.6, dict(pose="operate", facing=1)),
        ("person", 4.2, 11.0, dict(pose="hold", facing=-1, cap=True)),
        ("softbox", -1.2, 12.5, dict(facing=1, power=0.45)),
        ("fresnel", 6.5, 15, dict(facing=-1, power=0.45, color="#bcd2ff")),
        ("cstand", 5.0, 9.5, dict(facing=-1)),
        ("person", -3.0, 16, dict(pose="walk")),
    ]
    variants = {
        1: [("camera", -0.4, 4.2, dict(facing=1)), ("person", -1.0, 4.7, dict(pose="operate", facing=1, cap=True)),
            ("softbox", 3.2, 9.0, dict(facing=-1, power=0.5)), ("person", 2.0, 12, dict(pose="point", facing=-1)),
            ("cstand", -3.5, 10, dict(facing=1))],
        2: [("person", -2.2, 8.0, dict(pose="hold", cap=True)), ("person", -1.2, 8.6, dict(pose="stand", facing=-1)),
            ("person", 0.3, 9.4, dict(pose="point", facing=-1)), ("person", 1.6, 8.2, dict(pose="stand", facing=-1)),
            ("person", 2.8, 10.5, dict(pose="hold", facing=-1, cap=True)), ("person", -4.0, 12, dict(pose="walk")),
            ("fresnel", 5.5, 13, dict(facing=-1, power=0.5)), ("camera", 4.0, 9.5, dict(facing=-1))],
        3: [("softbox", 0.6, 3.6, dict(facing=-1, power=0.6, focus=3.6)), ("person", -1.4, 7.5, dict(pose="hold")),
            ("camera", 1.8, 12, dict(facing=-1)), ("cstand", -3.0, 11, dict(facing=1))],
        4: [("camera", 2.2, 6.0, dict(facing=-1)), ("person", 2.9, 6.5, dict(pose="operate", facing=-1)),
            ("person", -2.4, 9.0, dict(pose="walk", facing=1)), ("fresnel", -4.4, 12, dict(facing=1, power=0.55)),
            ("person", 0.4, 14, dict(pose="stand"))],
    }
    if n:
        objs = variants[n]
    for o in objs:
        o[3].setdefault("focus", 8.0)
    return lambda w, h: S.film_set(w, h, seed, objs, light=light, key=key, fill=fill, **kw)


def land(seed, sky, **kw):
    return lambda w, h: S.landscape(w, h, seed, sky, **kw)


def room(seed, **kw):
    return lambda w, h: S.room(w, h, seed, **kw)


def fire_room(seed, **kw):
    base = dict(wall="#1a1420", fire=dict(x0=-1.8, x1=1.8, z=7, height=1.1), embers=140, smoke=1.0,
                figures=[("person", 2.7, 4.6, dict(pose="hold", facing=-1, cap=True))], door_col="#ff8a3a",
                exposure=0.8, grade=VIOLET)
    base.update(kw)
    return lambda w, h: S.room(w, h, seed, **base)


def venue(seed, stage, **kw):
    return lambda w, h: S.venue(w, h, seed, stage, **kw)


def bok(seed, colors, **kw):
    return lambda w, h: S.bokeh(w, h, seed, colors, **kw)


def monitor_of(seed, inner):
    def f(w, h):
        scr = inner(1000, 563)
        return S.monitor(w, h, seed, scr, grade=WARM)
    return f


VIOLET_ROOM = dict(wall="#2a1f3a", floor_c="#140f1c", ceil="#0d0a12", haze="#8f6fb8", win_col="#b6a2ff",
                   door_col="#ffb26e", grade=VIOLET)

MANIFEST = {
    # ---------------------------------------------------------------- site
    "site/hero.jpg": (HERO, crew_set(101, exposure=0.85, grade=WARM)),
    "site/portrait.jpg": (P, lambda w, h: S.portrait(w, h, 102, grade=WARM)),

    # --------------------------------------------------------------- aster
    "aster/cover.jpg": (HERO, land(201, DAWN, sun=(0.64, 0.55), road={"vp": (0.6, 0.6)}, figure=(0.585, 0.86, 0.06), grade=WARM)),
    "aster/location-01.jpg": (L, land(202, BLUE_HOUR, sun=(0.3, 0.6), sun_col="#9fb6d8", fog_col="#8193ad",
                                      ridges=["#56607a", "#3d455a", "#2a3042", "#1b2030", "#11141f", "#080a10"],
                                      sun_power=0.5, mist=1.4, grade=COOL)),
    "aster/location-02.jpg": (L, land(203, DUSK, sun=(0.72, 0.56), sun_col="#ff9e7a", fog_col="#c88a86",
                                      ridges=["#7a5468", "#553a50", "#3a283a", "#251a28", "#160f19", "#0a070c"], grade=WARM)),
    "aster/location-03.jpg": (L, bok(204, ["#ffb36b", "#9fc4ff", "#ff5a4a", "#ffe9c8"], count=140, band=(0.3, 0.7),
                                     trails=dict(count=34, vp=(0.55, 0.52)), grade=COOL)),
    "aster/location-04.jpg": (L, room(205, wall="#2b2a2a", floor_c="#151311", ceil="#0c0b0a", haze="#9aa7b8",
                                      win_col="#cfe0ff", door=None, window=(-1, 3.5, 6.5, 0.9, 2.6, 1),
                                      figures=[("person", 0.8, 6.5, dict(pose="stand", facing=-1))],
                                      furniture=[("table", -0.6, 5.5, {}), ("chair", -1.6, 5.2, {}), ("lamp", 2.2, 8.0, {})],
                                      grade=COOL)),
    "aster/production.jpg": (L, crew_set(206, key="#cfe0ff", fill="#2b3a55", n=4, light=(-2.0, 3.6, 18), exposure=0.8, grade=COOL)),
    "aster/scheduling.jpg": (L, lambda w, h: S.stripboard(w, h, 207, grade=WARM)),
    "aster/crew.jpg": (L, crew_set(208, n=2, light=(0.5, 3.0, 20), exposure=0.85, grade=WARM)),
    "aster/execution.jpg": (L, monitor_of(209, land(2091, DAWN, sun=(0.64, 0.55), road={"vp": (0.6, 0.6)},
                                                     grade=dict(grain=0, vignette=0.2, ca=0)))),
    "aster/bts-01.jpg": (L, crew_set(210, n=1, light=(4.0, 3.0, 16), exposure=0.85, grade=WARM)),
    "aster/bts-02.jpg": (P, crew_set(211, n=3, key="#ffc890", light=(-1.0, 3.0, 15), exposure=0.85, grade=WARM)),
    "aster/bts-03.jpg": (L, crew_set(212, key="#9fc4ff", fill="#1c2a44", light=(-3.0, 4.0, 20), exposure=0.8, grade=COOL)),
    "aster/bts-04.jpg": (P, monitor_of(213, land(2131, BLUE_HOUR, sun=(0.3, 0.6), sun_col="#9fb6d8", fog_col="#8193ad",
                                                 ridges=["#56607a", "#3d455a", "#2a3042", "#1b2030", "#11141f", "#080a10"],
                                                 grade=dict(grain=0, vignette=0.2, ca=0)))),
    "aster/bts-05.jpg": (L, crew_set(214, n=4, key="#ffb36b", light=(1.0, 3.2, 17), exposure=0.85, grade=WARM)),
    "aster/bts-06.jpg": (P, crew_set(215, n=1, key="#ff9e6b", light=(3.0, 2.6, 14), exposure=0.85, grade=WARM)),
    "aster/frame-01.jpg": (WIDE, land(221, DAWN, sun=(0.5, 0.62), road={"vp": (0.5, 0.64)}, grade=WARM)),
    "aster/frame-02.jpg": (WIDE, land(222, BLUE_HOUR, sun=(0.75, 0.62), sun_col="#9fb6d8", fog_col="#8193ad",
                                      ridges=["#56607a", "#3d455a", "#2a3042", "#1b2030", "#11141f", "#080a10"],
                                      figure=(0.4, 0.9, 0.12), grade=COOL)),
    "aster/frame-03.jpg": (WIDE, room(223, wall="#3a2a22", floor_c="#1a120d", ceil="#0e0a08", haze="#d8a070",
                                      win_col="#ffd6a0", door=None, window=(1, 3.0, 6.0, 0.9, 2.6, -1),
                                      figures=[("person", -0.6, 5.5, dict(pose="stand", facing=1))], grade=WARM)),
    "aster/frame-04.jpg": (WIDE, bok(224, ["#ffb36b", "#ffe2b0", "#ff7a3d"], count=120, band=(0.25, 0.75),
                                     figures=[("p", 0.62, 1.1, 0.8, dict(facing=-1, blur=2.5))], grade=WARM)),
    "aster/frame-05.jpg": (WIDE, land(225, DUSK, sun=(0.3, 0.58), sun_col="#ff9e7a", fog_col="#c88a86",
                                      ridges=["#7a5468", "#553a50", "#3a283a", "#251a28", "#160f19", "#0a070c"],
                                      figure=(0.55, 0.88, 0.1), grade=WARM)),
    "aster/frame-06.jpg": (WIDE, room(226, wall="#24303a", floor_c="#10161b", ceil="#080b0e", haze="#7d97ad",
                                      win_col="#bcd6ff", door=(-0.6, 0.6, 2.2), door_col="#ffcf9a",
                                      window=(-1, 4.0, 6.5, 0.9, 2.6, 1),
                                      figures=[("person", 0.1, 9.6, dict(pose="stand"))], grade=COOL)),
    "aster/frame-07.jpg": (WIDE, land(227, DAWN, sun=(0.8, 0.58), mist=1.6, grade=WARM)),
    "aster/frame-08.jpg": (WIDE, bok(228, ["#ff5a4a", "#ffd28a", "#9fc4ff"], count=60, trails=dict(count=50, vp=(0.45, 0.5)), grade=COOL)),

    # -------------------------------------------------------------- purple
    "purple/cover.jpg": (HERO, room(301, door=(-0.6, 0.6, 2.3), window=(-1, 4.5, 7.0, 0.9, 2.6, 1),
                                    figures=[("person", 0.0, 9.6, dict())],
                                    furniture=[("chair", 1.6, 6, {}), ("lamp", -2.2, 7, {})], **VIOLET_ROOM)),
    "purple/planning.jpg": (L, lambda w, h: S.plans(w, h, 302, accent="#c0392b", grade=WARM)),
    "purple/construction.jpg": (L, lambda w, h: S.construction(w, h, 303, grade=VIOLET)),
    "purple/safety.jpg": (L, lambda w, h: S.safety(w, h, 304, grade=COOL)),
    "purple/execution.jpg": (L, fire_room(305)),
    "purple/fire-01.jpg": (HERO, fire_room(306, fire=dict(x0=-2.6, x1=2.6, z=6.5, height=1.5), embers=220, exposure=0.75,
                                           figures=[("person", -3.0, 4.2, dict(pose="hold", facing=1, cap=True)),
                                                    ("person", 3.2, 4.8, dict(pose="stand", facing=-1))])),
    "purple/set-01.jpg": (P, room(311, W=3.0, D=16, door=(-0.5, 0.5, 2.2), arches=(2.0, 2.5),
                                  practicals=[(-1.3, 2.0, 5, "#ffb46a", 1.0), (1.3, 2.0, 9, "#ffb46a", 0.8)],
                                  figures=[("person", 0.1, 12, dict())], **VIOLET_ROOM)),
    "purple/set-02.jpg": (L, room(312, window=(1, 3.5, 6.5, 0.9, 2.6, -1),
                                  furniture=[("table", -0.8, 5.0, dict(width=1.6)), ("chair", -1.9, 5.0, {}),
                                             ("lamp", -2.4, 7.5, {})], **VIOLET_ROOM)),
    "purple/set-03.jpg": (P, room(313, W=5, D=9, door=(-1.2, 0.2, 2.4), practicals=[(1.6, 1.2, 6, "#ffb46a", 1.6)],
                                  figures=[("person", 1.0, 6.0, dict(pose="hold", facing=-1))], **VIOLET_ROOM)),
    "purple/set-04.jpg": (L, lambda w, h: S.table_scene(w, h, 314, grade=VIOLET)),
    "purple/bts-01.jpg": (L, crew_set(321, key="#b48cff", fill="#2a1f3a", light=(2.0, 3.0, 16), exposure=0.85, grade=VIOLET)),
    "purple/bts-02.jpg": (P, crew_set(322, n=3, key="#ff9a5a", fill="#3a2350", light=(-1.0, 2.6, 13), exposure=0.85, grade=VIOLET)),
    "purple/bts-03.jpg": (L, crew_set(323, n=2, key="#c8a2ff", fill="#2a1f3a", light=(0.0, 3.2, 20), exposure=0.85, grade=VIOLET)),

    # ---------------------------------------------------------------- rana
    "rana/cover.jpg": (HERO, land(401, DUST, sun=(0.3, 0.52), sun_col="#ffc070", fog_col="#d8a066",
                                  ridges=["#9a6e48", "#7a5232", "#553820", "#3a2514", "#22150b", "#110a05"],
                                  structure=dict(layer=2, x0=0.55, x1=0.82, top=0.5, towers=[0.57, 0.68, 0.8]),
                                  figure=(0.38, 0.92, 0.09), grade=OCHRE)),
    "rana/poster.jpg": (P, land(402, DUST, sun=(0.5, 0.5), sun_col="#ffc070", fog_col="#d8a066",
                                ridges=["#9a6e48", "#7a5232", "#553820", "#3a2514", "#22150b", "#110a05"],
                                structure=dict(layer=2, x0=0.3, x1=0.75, top=0.48, towers=[0.33, 0.52, 0.72]),
                                grade=OCHRE)),
    "rana/still-01.jpg": (L, room(403, wall="#6a4a2c", floor_c="#2a1a0e", ceil="#1a1008", W=5, D=16, arches=(2.0, 3.0),
                                  haze="#e0a050", win_col="#ffd28a", door_col="#ffcf8a", door=(-0.7, 0.7, 2.6),
                                  window=(-1, 4.0, 7.0, 1.0, 2.8, 1), figures=[("person", 0.3, 11, dict())], grade=OCHRE)),
    "rana/still-02.jpg": (L, land(404, DUST, sun=(0.7, 0.55), sun_col="#ffc070", fog_col="#d8a066",
                                  ridges=["#9a6e48", "#7a5232", "#553820", "#3a2514", "#22150b", "#110a05"],
                                  road={"vp": (0.66, 0.58), "color": "#5a4430"}, figure=(0.64, 0.86, 0.07), grade=OCHRE)),
    "rana/still-03.jpg": (P, bok(405, ["#ffb050", "#ff7a2a", "#ffd890"], count=90, band=(0.15, 0.7),
                                 figures=[("p", 0.5, 1.15, 0.85, dict(blur=2.0))], grade=OCHRE)),
    "rana/still-04.jpg": (L, crew_set(406, key="#ffc070", fill="#5a4030", n=1, light=(3.0, 3.0, 16), exposure=0.85, grade=OCHRE)),

    # ------------------------------------------------------------ gluttony
    "gluttony/cover.jpg": (HERO, lambda w, h: S.table_scene(w, h, 501, grade=CRIMSON)),
    "gluttony/poster.jpg": (P, lambda w, h: S.table_scene(w, h, 502, grade=CRIMSON)),
    "gluttony/still-01.jpg": (L, bok(503, ["#ff3a2a", "#ffb050", "#ff7a50"], count=150, grade=CRIMSON)),
    "gluttony/still-02.jpg": (P, room(504, wall="#3a0c10", floor_c="#140405", ceil="#0a0203", haze="#7a1a20",
                                      door=(-0.5, 0.5, 2.3), door_col="#ff9a5a", W=4, D=12,
                                      figures=[("person", 0.0, 11, dict())],
                                      practicals=[(-1.6, 2.0, 6, "#ffb46a", 1.0)], grade=CRIMSON)),
    "gluttony/still-03.jpg": (L, room(505, wall="#3a0c10", floor_c="#140405", ceil="#0a0203", haze="#7a1a20",
                                      win_col="#ff8a6a", window=(1, 3.5, 6.5, 0.9, 2.6, -1), door=None,
                                      furniture=[("table", -0.4, 5.0, dict(width=1.8)), ("chair", -1.6, 5.2, {}),
                                                 ("chair", 0.9, 5.4, {}), ("lamp", -2.5, 7, {})], grade=CRIMSON)),
    "gluttony/still-04.jpg": (L, crew_set(506, key="#ff6a5a", fill="#3a1015", n=4, light=(-1.0, 3.0, 16), exposure=0.85, grade=CRIMSON)),

    # -------------------------------------------------------------- events
    "events/cover.jpg": (HERO, venue(601, "live", exposure=0.8, grade=WARM)),
    "events/venue-empty.jpg": (L, venue(602, "empty", grade=COOL)),
    "events/venue-setup.jpg": (L, venue(602, "setup", grade=COOL)),
    "events/venue-live.jpg": (L, venue(602, "live", exposure=0.8, grade=WARM)),
    "events/clients.jpg": (L, room(603, wall="#4a4038", floor_c="#1e1a16", ceil="#14110e", haze="#d8c0a0",
                                   win_col="#fff0d8", door=None, window=(1, 3.0, 6.0, 0.8, 2.7, -1),
                                   figures=[("person", -0.6, 5.0, dict(pose="hold", facing=1)),
                                            ("person", 0.5, 5.3, dict(pose="stand", facing=-1))],
                                   furniture=[("table", 0.0, 6.5, dict(width=1.6))], grade=WARM)),
    "events/vendors.jpg": (L, lambda w, h: S.construction(w, h, 604, ambient="#6a5040", grade=WARM)),
    "events/timelines.jpg": (L, lambda w, h: S.plans(w, h, 605, accent="#d08a2a", hatch=False, grade=WARM)),
    "events/logistics.jpg": (L, bok(606, ["#ffd28a", "#ff4a3a", "#9fc4ff"], count=50, trails=dict(count=60, vp=(0.62, 0.48)), grade=WARM)),
    "events/live.jpg": (L, bok(607, ["#ffb36b", "#ff8a3d", "#ffe2b0", "#ff6a8a"], count=180, band=(0.05, 0.6),
                               figures=[("p", 0.28, 1.12, 0.62, dict(facing=1, blur=2)), ("p", 0.42, 1.18, 0.66, dict(facing=-1, blur=2)),
                                        ("p", 0.74, 1.15, 0.6, dict(facing=-1, blur=2))], grade=WARM)),
    "events/gallery-01.jpg": (P, bok(608, ["#ffc27a", "#ffe2b0"], count=160, band=(0.0, 0.8), sizes=(5, 45), grade=WARM)),
    "events/gallery-02.jpg": (L, venue(609, "live", exposure=0.7, grade=WARM)),
}


def render(path):
    (w, h), fn = MANIFEST[path]
    out = os.path.join(OUT, path)
    img = fn(w, h)
    save(img, out)
    return path


def grain_tile():
    rng = np.random.default_rng(7)
    n = rng.normal(0.5, 0.22, (256, 256)).astype(np.float32)
    n = cv2.GaussianBlur(n, (0, 0), 0.6)
    a = (np.clip(n, 0, 1) * 255).astype(np.uint8)
    rgba = np.dstack([a, a, a, np.full_like(a, 255)])
    cv2.imwrite(os.path.join(OUT, "site", "grain.png"), rgba)


def hero_video(seconds=10, fps=24, size=(1600, 900)):
    """Slow 'breathing' push-in with drifting haze. Loops seamlessly."""
    W, H = size
    src_w, src_h = 2600, 1462
    rng = np.random.default_rng(11)
    plate = crew_set(101, exposure=0.85, grade=dict(WARM, grain=0, ca=0))(src_w, src_h).astype(np.float32)
    # tileable haze texture (period = W)
    per = W
    tex = np.zeros((H, per), np.float32)
    for cell, amp in ((380, 1.0), (170, 0.5), (80, 0.25)):
        gx, gy = per // cell, H // cell + 3
        g = rng.random((gy, gx)).astype(np.float32)
        g = np.concatenate([g[:, -2:], g, g[:, :3]], 1)
        up = cv2.resize(g, ((gx + 5) * cell, gy * cell), interpolation=cv2.INTER_CUBIC)
        tex += up[:H, 2 * cell:2 * cell + per] * amp
    tex = (tex - tex.min()) / (tex.max() - tex.min())
    tex = np.clip((tex - 0.35) * 1.6, 0, 1)
    key = np.power(np.array([1.0, 0.75, 0.5], np.float32), 1.0)
    out = os.path.join(OUT, "site", "hero.mp4")
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
           "-r", str(fps), "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "23", "-pix_fmt", "yuv420p",
           "-movflags", "+faststart", "-an", out]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    frames = seconds * fps
    for i in range(frames):
        ph = i / frames
        z = 1.05 + 0.03 * math.sin(2 * math.pi * ph)
        dx = math.sin(2 * math.pi * ph + 0.6) * 18
        s = (W / src_w) * z
        M = np.float32([[s, 0, W / 2 - s * src_w / 2 + dx], [0, s, H / 2 - s * src_h / 2]])
        f = cv2.warpAffine(plate, M, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
        off = ph * per
        o0 = int(off)
        fr = off - o0
        hz = np.roll(tex, o0, axis=1) * (1 - fr) + np.roll(tex, o0 + 1, axis=1) * fr
        lum = cv2.GaussianBlur(f.mean(axis=2), (0, 0), 25)
        flick = 1.0 + 0.012 * math.sin(2 * math.pi * ph * 5) + 0.006 * math.sin(2 * math.pi * ph * 13)
        f = f * flick + (hz * lum * 0.22)[..., None] * key
        proc.stdin.write((np.clip(f, 0, 1) * 255).astype(np.uint8).tobytes())
    proc.stdin.close()
    proc.wait()


def main():
    flt = sys.argv[1] if len(sys.argv) > 1 else ""
    os.makedirs(os.path.join(OUT, "site"), exist_ok=True)
    items = [k for k in MANIFEST if flt in k]
    with Pool(max(1, (os.cpu_count() or 2))) as pool:
        for p in pool.imap_unordered(render, items):
            print("  ✓", p, flush=True)
    if not flt or "grain" in flt:
        grain_tile()
        print("  ✓ site/grain.png")
    if not flt or "video" in flt:
        hero_video()
        print("  ✓ site/hero.mp4")


if __name__ == "__main__":
    main()
