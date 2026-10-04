"""
Scene recipes for the placeholder plates. Each returns a finished RGB float image.
"""
import math

import numpy as np

from core import (Cam, add, blur, camera_rig, circle, cone, ellipse, finish, grid, halo, hexc,
                  lerp, light_stand, line, noise, noise1, person, poly, radial, rays, rim,
                  silhouette, vgrad)


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def haze_field(h, w, rng, big=0.35, small=0.1, k=0.9):
    a = noise(h, w, w * big, h * big * 0.7, rng, 5)
    b = noise(h, w, w * small, h * small * 0.6, rng, 4)
    return np.clip(0.55 + k * (a * 0.7 + b * 0.3 - 0.5), 0.05, 2)


# ------------------------------------------------------------ FILM SET ---

def film_set(w, h, seed, objects, light=(0.0, 3.2, 16.0), key="#ffb36b", fill="#5b7186",
             floor="#151619", top="#06070a", exposure=1.0, cam_h=1.35, cy=0.5, f=0.8,
             grade=None, extra_lights=(), fog=1.0):
    """
    A hazy set lit from behind. objects = [(kind, X, Z, opts), ...]
    kind: person | camera | softbox | fresnel | cstand
    """
    rng = np.random.default_rng(seed)
    cam = Cam(w, h, f=w * f, cy=h * cy, height=cam_h)
    kc, fc = hexc(key), hexc(fill)
    img = vgrad(h, w, [(0, hexc(top)), (cy, fc * 0.08), (cy + 0.02, hexc(floor) * 0.8), (1, hexc(floor) * 0.35)])
    dens = haze_field(h, w, rng) * fog

    lx, ly = cam.p(*light)
    g = halo(h, w, lx, ly, w * 0.06)
    r = rays(h, w, lx, ly, rng, center=math.pi / 2, spread=math.pi * 0.62, length=w * 0.55, streaks=46, sharp=1.6)
    r = blur(r, 2.0)
    amb = radial(h, w, lx, ly, w * 0.55, power=1.1)
    img += kc * (g * 4.0 + r * 0.38 * dens + amb * 0.11 * dens)[..., None]
    # cool fill haze from the opposite side
    img += fc * (radial(h, w, w * 0.1, h * 0.35, w * 0.6, power=1.4) * 0.12 * dens)[..., None]

    # glossy floor: reflection of the source + sheen
    fy = cam.p(light[0], 0, light[2])[1]
    x, y = grid(h, w)
    below = smooth(fy - 4, fy + 30, y)
    streak = np.exp(-((x - lx) / (w * 0.035)) ** 2) * np.exp(-(y - fy) / (h * 0.5)) * below
    sheen = radial(h, w, lx, fy + h * 0.06, w * 0.3, power=1.6, aspect=2.6) * below
    img += kc * (streak * 0.35 + sheen * 0.22)[..., None]

    for (ex, ey, ez, col, power) in extra_lights:
        px, py = cam.p(ex, ey, ez)
        img += hexc(col) * (halo(h, w, px, py, cam.scale(0.25, ez)) * power)[..., None]

    # draw objects far -> near
    for kind, X, Z, o in sorted(objects, key=lambda t: -t[2]):
        m = np.zeros((h, w), np.float32)
        fx, fyy = cam.p(X, 0, Z)
        facing = o.get("facing", 1)
        if kind == "person":
            person(m, fx, fyy, cam.scale(o.get("height", 1.76), Z), pose=o.get("pose", "stand"),
                   facing=facing, width=o.get("width", 1.0), cap=o.get("cap", False))
        elif kind == "camera":
            camera_rig(m, fx, fyy, cam.scale(1.75, Z), facing=facing)
        elif kind in ("softbox", "fresnel", "cstand"):
            pos, d = light_stand(m, fx, fyy, cam.scale(o.get("height", 2.3), Z), kind=kind, facing=facing,
                                 tilt=o.get("tilt", 0.25))
            if kind != "cstand" and o.get("on", True):
                col = hexc(o.get("color", "#fff1dc"))
                c = cone(h, w, pos[0], pos[1], d, o.get("spread", 0.42), cam.scale(o.get("throw", 5.5), Z), soft=0.95)
                c = blur(c, w * 0.006)
                img += col * (c * dens * o.get("power", 0.6) * 0.55)[..., None]
                img += col * (halo(h, w, pos[0], pos[1], cam.scale(0.18, Z)) * o.get("glow", 1.4))[..., None]
        depth = np.clip((Z - 2) / 18, 0, 1)
        focus = o.get("focus", 8.0)
        m = blur(m, 0.4 + abs(1.0 / Z - 1.0 / focus) * w * 0.035)
        img = silhouette(img, m, opacity=0.985 - 0.42 * depth)
        rr = rim(m, 1.0, 1.0) * (amb * 0.6 + g * 0.6)
        img += kc * (rr * (0.5 - 0.3 * depth))[..., None]
        # haze in front of the object
        img += kc * (r * 0.08 * depth * dens)[..., None]

    img += kc * (r * 0.05 * dens)[..., None]
    gr = grade or {}
    return finish(img, rng, exposure=exposure, **gr)


# ----------------------------------------------------------- LANDSCAPE ---

def landscape(w, h, seed, sky, sun=(0.68, 0.52), sun_col="#ffc890", ridges=None, fog_col="#c9b6a8",
              horizon=0.58, layers=6, road=False, figure=None, mist=1.0, sun_power=1.0, grade=None,
              clouds=0.5, exposure=1.0, structure=None):
    rng = np.random.default_rng(seed)
    x, y = grid(h, w)
    stops = [(p, hexc(c)) for p, c in sky]
    img = vgrad(h, w, stops)
    sc = hexc(sun_col)
    sx, sy = sun[0] * w, sun[1] * h

    if clouds:
        cl = noise(h, w, w * 0.45, h * 0.04, rng, 5)
        cl = smooth(0.52, 0.78, cl) * smooth(h * horizon, h * 0.05, y)
        lit = radial(h, w, sx, sy, w * 0.5, power=1.2)
        img = img * (1 - cl[..., None] * 0.35 * clouds) + sc * (cl * lit * 0.6 * clouds)[..., None]

    img += sc * (halo(h, w, sx, sy, w * 0.05) * 3.0 * sun_power)[..., None]
    img += sc * (radial(h, w, sx, sy, w * 0.45, power=1.0) * 0.35 * sun_power)[..., None]

    fc = hexc(fog_col)
    ridges = ridges or ["#8b7f86", "#5d5560", "#3c3640", "#26222a", "#17141a", "#0c0a0e"]
    n = len(ridges)
    hy = horizon * h
    for i, col in enumerate(ridges):
        t = i / max(1, n - 1)
        base = hy + (t ** 1.7) * h * 0.42 - h * 0.02
        amp = h * (0.05 + 0.16 * (1 - abs(t - 0.4)))
        v = noise1(w, w * (0.5 - 0.3 * t), rng, octaves=6, pers=0.52)
        rid = 1 - np.abs(noise1(w, w * (0.25 - 0.1 * t), rng, octaves=5, pers=0.5))
        prof = base - amp * (0.55 * (v + 1) / 2 + 0.45 * rid ** 2)
        if structure is not None and i == structure.get("layer", 2):
            prof = _fort(prof, w, h, structure)
        m = smooth(prof[None, :] - 1.2, prof[None, :] + 1.2, y)
        c = hexc(col)
        # atmospheric perspective: distant layers lean to the fog colour lit by the sun
        lit = radial(h, w, sx, sy, w * 0.6, power=1.0)
        cc = c[None, None, :] + fc[None, None, :] * (lit * (1 - t) ** 2 * 0.25)[..., None]
        # ridge edge light toward the sun
        edge = np.exp(-np.maximum(y - prof[None, :], 0) / (h * 0.01)) * lit * (1 - t * 0.6)
        img = img * (1 - m[..., None]) + cc * m[..., None]
        img += sc * (edge * m * 0.25)[..., None]
        # mist settling in the valley in front of this ridge
        if i < n - 1 and mist:
            nb = noise(h, w, w * 0.3, h * 0.03, rng, 4)
            band = np.exp(-((y - (base + h * 0.025)) / (h * (0.03 + 0.03 * t))) ** 2)
            img += fc * (band * nb * mist * (0.55 - 0.35 * t) * (0.4 + lit))[..., None]

    if road:
        img = _road(img, w, h, rng, road, sc)
    if figure:
        m = np.zeros((h, w), np.float32)
        fx, fy, fh = figure
        person(m, fx * w, fy * h, fh * h, pose="walk", facing=1)
        img = silhouette(img, m, 0.95)

    r = rays(h, w, sx, sy, rng, center=math.pi / 2, spread=math.pi * 0.7, length=w * 0.6, streaks=60, sharp=2.5)
    img += sc * (blur(r, 2) * 0.08 * sun_power * smooth(sy - 40, sy + 200, y))[..., None]
    rng2 = np.random.default_rng(seed + 1)
    return finish(img, rng2, exposure=exposure, **(grade or {}))


def _fort(prof, w, h, s):
    x0, x1, top = int(s["x0"] * w), int(s["x1"] * w), s["top"] * h
    out = prof.copy()
    base = prof[x0:x1].min()
    out[x0:x1] = np.minimum(prof[x0:x1], top)
    # crenellations + towers
    step = max(6, int(w * 0.008))
    for xx in range(x0, x1, step * 2):
        out[xx:xx + step] = np.minimum(out[xx:xx + step], top - h * 0.012)
    for tx in s.get("towers", []):
        cx = int(tx * w)
        tw = int(w * 0.018)
        out[cx - tw:cx + tw] = np.minimum(out[cx - tw:cx + tw], top - h * 0.06)
        out[cx - tw // 3:cx + tw // 3] = np.minimum(out[cx - tw // 3:cx + tw // 3], top - h * 0.085)
    return np.minimum(out, base + 0 * out)


def _road(img, w, h, rng, spec, sc):
    vx, vy = spec.get("vp", (0.55, 0.6))
    vx, vy = vx * w, vy * h
    m = np.zeros((h, w), np.float32)
    pts_l, pts_r = [], []
    for i in range(41):
        t = i / 40
        yy = vy + (h - vy) * t ** 1.6
        bend = math.sin(t * 2.4 + 0.8) * w * 0.06 * (1 - t)
        half = w * (0.004 + 0.32 * t ** 1.6)
        pts_l.append((vx + bend - half, yy))
        pts_r.append((vx + bend + half, yy))
    poly(m, pts_l + pts_r[::-1])
    col = hexc(spec.get("color", "#3a3a40"))
    img = img * (1 - m[..., None]) + col * m[..., None] * 0.6
    # centre dashes
    d = np.zeros((h, w), np.float32)
    for i in range(0, 40, 3):
        a, b = i / 40, (i + 1.3) / 40
        ya, yb = vy + (h - vy) * a ** 1.6, vy + (h - vy) * b ** 1.6
        xa = vx + math.sin(a * 2.4 + 0.8) * w * 0.06 * (1 - a)
        xb = vx + math.sin(b * 2.4 + 0.8) * w * 0.06 * (1 - b)
        line(d, (xa, ya), (xb, yb), max(1, 1 + 10 * a ** 1.6))
    img += sc * (d * 0.35)[..., None]
    return img


# ------------------------------------------------------------ INTERIOR ---

def room(w, h, seed, wall="#2a1f3a", floor_c="#140f1c", ceil="#0d0a12", W=6.0, H=3.2, D=10.0,
         door=None, window=None, practicals=(), figures=(), furniture=(), cam_x=0.0, cam_h=1.5,
         f=0.62, haze="#8f6fb8", door_col="#ffb26e", win_col="#b6a2ff", grade=None, exposure=1.0,
         arches=None, fire=None, embers=0, smoke=0.0, return_raw=False):
    rng = np.random.default_rng(seed)
    cam = Cam(w, h, f=w * f, cy=h * 0.5, height=cam_h)
    x, y = grid(h, w)
    X0, X1 = -W / 2 - cam_x, W / 2 - cam_x
    zn = 0.4
    P = cam.p
    albedo = np.zeros((h, w, 3), np.float32)
    m = np.zeros((h, w), np.float32)

    def face(pts, col):
        m[:] = 0
        poly(m, [P(*p) for p in pts])
        albedo[:] = albedo * (1 - m[..., None]) + hexc(col) * m[..., None]

    face([(X0, 0, zn), (X1, 0, zn), (X1, 0, D), (X0, 0, D)], floor_c)
    face([(X0, H, zn), (X1, H, zn), (X1, H, D), (X0, H, D)], ceil)
    face([(X0, 0, zn), (X0, 0, D), (X0, H, D), (X0, H, zn)], wall)
    face([(X1, 0, zn), (X1, 0, D), (X1, H, D), (X1, H, zn)], wall)
    face([(X0, 0, D), (X1, 0, D), (X1, H, D), (X0, H, D)], wall)

    tex = noise(h, w, w * 0.02, h * 0.02, rng, 4)
    albedo *= (0.85 + 0.3 * tex)[..., None]
    # mouldings
    lines_m = np.zeros((h, w), np.float32)
    for Xw in (X0, X1):
        line(lines_m, P(Xw, 0.95, zn), P(Xw, 0.95, D), 2)
        line(lines_m, P(Xw, H - 0.15, zn), P(Xw, H - 0.15, D), 2)
    line(lines_m, P(X0, 0.95, D), P(X1, 0.95, D), 2)
    if arches:
        for z in np.arange(arches[0], D, arches[1]):
            for Xw in (X0, X1):
                a, b = P(Xw, 0, z), P(Xw, H, z)
                line(lines_m, a, b, max(2, cam.scale(0.25, z)))
    albedo *= (1 - lines_m[..., None] * 0.5)

    light = np.zeros((h, w, 3), np.float32) + hexc(haze) * 0.05
    glow = np.zeros((h, w, 3), np.float32)
    dens = haze_field(h, w, rng)

    if door:
        dx0, dx1, dh = door
        dx0, dx1 = dx0 - cam_x, dx1 - cam_x
        dm = np.zeros((h, w), np.float32)
        poly(dm, [P(dx0, 0, D), P(dx1, 0, D), P(dx1, dh, D), P(dx0, dh, D)])
        dc = hexc(door_col)
        glow += dc * (dm * 3.5)[..., None]
        # spill on the floor
        sm = np.zeros((h, w), np.float32)
        poly(sm, [P(dx0, 0, D), P(dx1, 0, D), P(dx1 + 1.2, 0, D - 5), P(dx0 - 1.2, 0, D - 5)])
        sm = blur(sm, w * 0.01)
        light += dc * (sm * 0.9)[..., None]
        cxp, cyp = P((dx0 + dx1) / 2, dh * 0.5, D)
        light += dc * (radial(h, w, cxp, cyp, w * 0.35, power=1.2) * 0.45)[..., None]
        glow += dc * (radial(h, w, cxp, cyp, w * 0.25, power=1.0) * 0.25 * dens)[..., None]

    if window:
        side, z0, z1, y0, y1, dirx = window
        Xw = X0 if side < 0 else X1
        wm = np.zeros((h, w), np.float32)
        poly(wm, [P(Xw, y0, z0), P(Xw, y0, z1), P(Xw, y1, z1), P(Xw, y1, z0)])
        wc = hexc(win_col)
        glow += wc * (blur(wm, 1.5) * 2.2)[..., None]
        # window bars
        bars = np.zeros((h, w), np.float32)
        zm = (z0 + z1) / 2
        line(bars, P(Xw, y0, zm), P(Xw, y1, zm), max(2, cam.scale(0.06, zm)))
        line(bars, P(Xw, (y0 + y1) / 2, z0), P(Xw, (y0 + y1) / 2, z1), max(2, cam.scale(0.06, zm)))
        glow *= (1 - bars[..., None] * 0.9)
        # projected patch on floor + volumetric shaft
        sl = 1.3
        patch = [(Xw + dirx * y0 * sl, 0, z0 + 0.6), (Xw + dirx * y0 * sl, 0, z1 + 0.6),
                 (Xw + dirx * y1 * sl, 0, z1 + 0.6), (Xw + dirx * y1 * sl, 0, z0 + 0.6)]
        pm = np.zeros((h, w), np.float32)
        poly(pm, [P(*p) for p in patch])
        light += wc * (blur(pm, 3) * 1.4)[..., None]
        sh = np.zeros((h, w), np.float32)
        a = [P(Xw, y0, z0), P(Xw, y1, z0), P(Xw, y1, z1), P(Xw, y0, z1)]
        b = [P(*p) for p in patch]
        for i in range(4):
            j = (i + 1) % 4
            poly(sh, [a[i], a[j], b[j], b[i]], 0.25)
        sh = np.clip(blur(sh, w * 0.004), 0, 1)
        streak = rays(h, w, *P(Xw - dirx * 3, y1 + 3, (z0 + z1) / 2), rng, center=math.pi / 2 - dirx * 0.6,
                      spread=1.2, length=w * 2, streaks=50, sharp=1.5)
        glow += wc * (sh * dens * (0.3 + streak * 1.4) * 0.35)[..., None]
        wcx, wcy = P(Xw, (y0 + y1) / 2, (z0 + z1) / 2)
        light += wc * (radial(h, w, wcx, wcy, w * 0.45, power=1.3) * 0.5)[..., None]

    for (px, py, pz, col, power) in practicals:
        sx, sy = P(px - cam_x, py, pz)
        c = hexc(col)
        glow += c * (halo(h, w, sx, sy, cam.scale(0.12, pz)) * power)[..., None]
        light += c * (radial(h, w, sx, sy, cam.scale(2.4, pz), power=1.3) * power * 0.25)[..., None]

    fire_layer = None
    if fire:
        fire_layer, flight = _fire(h, w, rng, cam, fire, cam_x)
        light += flight
        glow += fire_layer

    img = albedo * light + glow
    img += hexc(haze) * (dens * 0.02)[..., None]

    if smoke:
        sm = noise(h, w, w * 0.22, h * 0.18, rng, 5)
        sm = smooth(0.45, 0.8, sm) * smooth(h * 0.75, h * 0.05, y)
        tint = hexc("#ff7a2a") * 0.35 if fire else hexc(haze) * 0.2
        img = img * (1 - sm[..., None] * 0.45 * smoke) + tint * (sm * smoke * 0.6)[..., None]

    for kind, X, Z, o in sorted(list(furniture) + list(figures), key=lambda t: -t[2]):
        mm = np.zeros((h, w), np.float32)
        fx, fy = P(X - cam_x, 0, Z)
        if kind == "person":
            person(mm, fx, fy, cam.scale(o.get("height", 1.76), Z), pose=o.get("pose", "stand"),
                   facing=o.get("facing", 1), width=o.get("width", 1.0), cap=o.get("cap", False))
        elif kind == "chair":
            s = cam.scale(1.0, Z)
            poly(mm, [(fx - 0.22 * s, fy - 0.48 * s), (fx + 0.22 * s, fy - 0.48 * s), (fx + 0.22 * s, fy - 0.42 * s),
                      (fx - 0.22 * s, fy - 0.42 * s)])
            for lx in (-0.2, 0.2):
                line(mm, (fx + lx * s, fy - 0.45 * s), (fx + lx * s, fy), max(2, 0.04 * s))
            poly(mm, [(fx - 0.2 * s, fy - 0.48 * s), (fx - 0.16 * s, fy - 1.0 * s), (fx + 0.16 * s, fy - 1.0 * s),
                      (fx + 0.2 * s, fy - 0.48 * s), (fx + 0.15 * s, fy - 0.48 * s), (fx + 0.12 * s, fy - 0.9 * s),
                      (fx - 0.12 * s, fy - 0.9 * s), (fx - 0.15 * s, fy - 0.48 * s)])
        elif kind == "table":
            s = cam.scale(1.0, Z)
            tw = o.get("width", 1.2)
            poly(mm, [(fx - tw / 2 * s, fy - 0.78 * s), (fx + tw / 2 * s, fy - 0.78 * s),
                      (fx + tw / 2 * s, fy - 0.72 * s), (fx - tw / 2 * s, fy - 0.72 * s)])
            for lx in (-tw / 2 + 0.05, tw / 2 - 0.05):
                line(mm, (fx + lx * s, fy - 0.75 * s), (fx + lx * s, fy), max(2, 0.05 * s))
        elif kind == "lamp":
            s = cam.scale(1.0, Z)
            line(mm, (fx, fy), (fx, fy - 1.4 * s), max(2, 0.03 * s))
            poly(mm, [(fx - 0.18 * s, fy - 1.4 * s), (fx + 0.18 * s, fy - 1.4 * s), (fx + 0.12 * s, fy - 1.65 * s),
                      (fx - 0.12 * s, fy - 1.65 * s)])
            sx, sy = fx, fy - 1.45 * s
            img += hexc(o.get("color", "#ffb46a")) * (halo(h, w, sx, sy, s * 0.4) * 1.2)[..., None]
        elif kind == "extinguisher":
            s = cam.scale(1.0, Z)
            poly(mm, [(fx - 0.09 * s, fy), (fx + 0.09 * s, fy), (fx + 0.09 * s, fy - 0.55 * s), (fx - 0.09 * s, fy - 0.55 * s)])
            line(mm, (fx, fy - 0.55 * s), (fx, fy - 0.65 * s), max(2, 0.05 * s))
        depth = np.clip((Z - 2) / 14, 0, 1)
        img = silhouette(img, mm, opacity=0.97 - 0.35 * depth)
        img += (hexc(door_col) * 0.5) * (blur(rim(mm, 1.0), 1.2) * 0.15)[..., None]

    if embers:
        img = _embers(img, h, w, rng, embers, fire, cam, cam_x)

    if return_raw:
        return img
    rng2 = np.random.default_rng(seed + 7)
    return finish(img, rng2, exposure=exposure, **(grade or {}))


def _fire(h, w, rng, cam, spec, cam_x):
    """Controlled flame bar on set. spec: dict(x0, x1, z, height)."""
    x, y = grid(h, w)
    x0, x1, z, fh = spec["x0"] - cam_x, spec["x1"] - cam_x, spec["z"], spec.get("height", 1.2)
    ax, ay = cam.p(x0, 0, z)
    bx, by = cam.p(x1, 0, z)
    hpx = cam.scale(fh, z)
    n1 = noise(h, w, w * 0.012, h * 0.06, rng, 5)
    n2 = noise(h, w, w * 0.035, h * 0.12, rng, 4)
    warp = (n2 - 0.5) * w * 0.02
    xx = x + warp
    base = ay
    u = (base - y) / hpx
    span = np.clip(np.minimum(xx - ax, bx - xx) / (w * 0.02), 0, 1)
    tongue = (n1 * 0.7 + n2 * 0.3)
    f = np.clip((1.05 - u) * 1.2 + (tongue - 0.5) * 1.8 - 0.15, 0, 1) * smooth(-0.04, 0.03, u) * span
    f = f ** 1.4
    stops = [(0.0, (0, 0, 0)), (0.2, (0.35, 0.02, 0.0)), (0.45, (1.0, 0.18, 0.01)),
             (0.7, (1.0, 0.45, 0.06)), (0.88, (1.0, 0.75, 0.25)), (1.0, (1.0, 0.95, 0.75))]
    ps = [s[0] for s in stops]
    col = np.stack([np.interp(f, ps, [s[1][c] for s in stops]) for c in range(3)], -1).astype(np.float32)
    layer = col * (f * 9.0)[..., None]
    mx, my = (ax + bx) / 2, base - hpx * 0.3
    fc = np.array([1.0, 0.32, 0.06], np.float32)
    light = fc * ((radial(h, w, mx, my, w * 0.4, power=1.2) * 1.6 + radial(h, w, mx, my, w * 0.14) * 2.0))[..., None]
    layer += fc * (radial(h, w, mx, my, w * 0.16, power=1.2) * 0.35)[..., None]
    return layer.astype(np.float32), light.astype(np.float32)


def _embers(img, h, w, rng, count, spec, cam, cam_x):
    lay = np.zeros((h, w), np.float32)
    if spec:
        ax, ay = cam.p(spec["x0"] - cam_x, 0, spec["z"])
        bx, _ = cam.p(spec["x1"] - cam_x, 0, spec["z"])
        hp = cam.scale(spec.get("height", 1.2), spec["z"])
    else:
        ax, bx, ay, hp = w * 0.2, w * 0.8, h * 0.9, h * 0.5
    soft = np.zeros((h, w), np.float32)
    for i in range(count):
        px = rng.uniform(ax, bx) + rng.normal(0, w * 0.03)
        py = ay - rng.exponential(0.9) * hp - hp * 0.2
        L = rng.uniform(2, 9) * (w / 1600)
        ang = -math.pi / 2 + rng.normal(0, 0.5)
        tgt = soft if i % 4 == 0 else lay
        line(tgt, (px, py), (px + math.cos(ang) * L, py + math.sin(ang) * L), 1, rng.uniform(0.2, 0.9))
    lay = blur(lay, 0.6) + blur(soft, 3.0) * 2.0
    img += np.array([1.0, 0.45, 0.1], np.float32) * (lay * 3.0)[..., None]
    return img


# --------------------------------------------------------------- BOKEH ---

def bokeh(w, h, seed, colors, count=160, band=(0.2, 0.75), bg=("#05060a", "#0d0f17"), sizes=(6, 60),
          big=6, glow=None, figures=(), grade=None, exposure=1.0, trails=None, floor=None):
    rng = np.random.default_rng(seed)
    img = vgrad(h, w, [(0, hexc(bg[0])), (1, hexc(bg[1]))])
    if glow:
        gx, gy, gr, gc, gp = glow
        img += hexc(gc) * (radial(h, w, gx * w, gy * h, gr * w, power=1.2) * gp)[..., None]
    if trails:
        img = _trails(img, h, w, rng, trails)
    lay = np.zeros((h, w, 3), np.float32)
    cols = [hexc(c) for c in colors]
    for i in range(count + big):
        is_big = i >= count
        r = rng.uniform(sizes[1] * 1.4, sizes[1] * 2.6) if is_big else math.exp(rng.uniform(math.log(sizes[0]), math.log(sizes[1])))
        cx = rng.uniform(-0.05, 1.05) * w
        cy = (rng.uniform(band[0], band[1]) if not is_big else rng.uniform(0, 1)) * h
        c = cols[rng.integers(len(cols))] * rng.uniform(0.4, 1.4) * (0.35 if is_big else 1.0)
        disk = np.zeros((h, w), np.float32)
        circle(disk, cx, cy, r, 1.0)
        ring = np.zeros((h, w), np.float32)
        cv_r = max(1.0, r - max(1.5, r * 0.08))
        circle(ring, cx, cy, cv_r, 1.0)
        d = disk * 0.75 + (disk - ring) * 0.7
        d = blur(d, max(0.8, r * 0.04))
        lay += d[..., None] * c[None, None, :] * (0.9 / (1 + r / 40))
    img += lay * 2.4
    for kind, fx, fy, fh, o in figures:
        m = np.zeros((h, w), np.float32)
        person(m, fx * w, fy * h, fh * h, pose=o.get("pose", "stand"), facing=o.get("facing", 1))
        m = blur(m, o.get("blur", 1.5))
        img = silhouette(img, m, o.get("opacity", 0.99))
    return finish(img, rng, exposure=exposure, **(grade or {}))


def _trails(img, h, w, rng, spec):
    lay = np.zeros((h, w, 3), np.float32)
    vx, vy = spec.get("vp", (0.6, 0.48))
    vx, vy = vx * w, vy * h
    for i in range(spec.get("count", 40)):
        side = rng.choice([-1, 1])
        col = hexc("#ff3b2a") if side < 0 else hexc("#fff0d0")
        spread = rng.uniform(0.05, 0.6)
        m = np.zeros((h, w), np.float32)
        pts = []
        for k in range(40):
            t = k / 39
            xx = vx + side * (spread * w * t ** 1.4) + math.sin(t * 2) * w * 0.03
            yy = vy + (h * 0.55) * t ** 1.4 * rng.uniform(0.98, 1.02)
            pts.append((xx, yy))
        for a, b in zip(pts[:-1], pts[1:]):
            line(m, a, b, max(1, 1 + 6 * (b[1] - vy) / h))
        m = blur(m, 1.6)
        lay += m[..., None] * col * rng.uniform(0.3, 1.0)
    return img + lay * 1.4 + blur(lay, 12) * 1.2 + blur(lay, 40) * 0.8


# --------------------------------------------------------------- VENUE ---

def venue(w, h, seed, stage, grade=None, exposure=1.0):
    """Event hall from a fixed camera: stage in {'empty', 'setup', 'live'}."""
    rng = np.random.default_rng(seed)
    cam = Cam(w, h, f=w * 0.55, cy=h * 0.52, height=1.65)
    P = cam.p
    x, y = grid(h, w)
    W, H, D, zn = 18.0, 8.0, 38.0, 0.6
    X0, X1 = -W / 2 + 0.6, W / 2 + 0.6
    palette = {
        "empty": dict(wall="#b9b2a6", floor="#6b665f", ceil="#8a847a", amb="#9fb2c8", amb_k=0.5),
        "setup": dict(wall="#7d756b", floor="#3e3a36", ceil="#4c4740", amb="#5a6878", amb_k=0.16),
        "live": dict(wall="#5a4436", floor="#2a1d17", ceil="#2e211b", amb="#ff9a52", amb_k=0.07),
    }[stage]
    albedo = np.zeros((h, w, 3), np.float32)
    m = np.zeros((h, w), np.float32)

    def face(pts, col, k=1.0):
        m[:] = 0
        poly(m, [P(*p) for p in pts])
        albedo[:] = albedo * (1 - m[..., None]) + hexc(col) * k * m[..., None]

    face([(X0, 0, zn), (X1, 0, zn), (X1, 0, D), (X0, 0, D)], palette["floor"])
    face([(X0, H, zn), (X1, H, zn), (X1, H, D), (X0, H, D)], palette["ceil"])
    face([(X0, 0, zn), (X0, 0, D), (X0, H, D), (X0, H, zn)], palette["wall"])
    face([(X1, 0, zn), (X1, 0, D), (X1, H, D), (X1, H, zn)], palette["wall"])
    face([(X0, 0, D), (X1, 0, D), (X1, H, D), (X0, H, D)], palette["wall"], 0.9)
    tex = noise(h, w, w * 0.01, h * 0.01, rng, 3)
    albedo *= (0.9 + 0.2 * tex)[..., None]

    # columns & arched windows on both walls, ceiling beams
    detail = np.zeros((h, w), np.float32)
    windows = np.zeros((h, w), np.float32)
    for z in np.arange(3.0, D, 5.0):
        for Xw, s in ((X0, 1), (X1, -1)):
            poly(detail, [P(Xw, 0, z), P(Xw + s * 0.5, 0, z), P(Xw + s * 0.5, H, z), P(Xw, H, z)])
            if z + 4.2 < D:
                za, zb = z + 1.0, z + 4.0
                pts = [P(Xw, 1.2, za), P(Xw, 1.2, zb), P(Xw, 5.2, zb)]
                for k in range(1, 12):
                    a = k / 12 * math.pi
                    zz = (za + zb) / 2 + math.cos(a) * (zb - za) / 2
                    pts.append(P(Xw, 5.2 + math.sin(a) * 1.4, zz))
                pts.append(P(Xw, 5.2, za))
                poly(windows, pts)
        line(detail, P(X0, H, z), P(X1, H, z), max(2, cam.scale(0.35, z)))
    albedo *= (1 - detail[..., None] * 0.35)

    light = np.zeros((h, w, 3), np.float32) + hexc(palette["amb"]) * palette["amb_k"]
    glow = np.zeros((h, w, 3), np.float32)
    dens = haze_field(h, w, rng, k=0.7)

    if stage == "empty":
        wc = hexc("#e8eeff")
        glow += wc * (windows * 2.2)[..., None]
        # daylight shafts from the left windows onto the floor
        r = rays(h, w, w * 0.02, -h * 0.3, rng, center=math.pi / 2 - 0.55, spread=0.5, length=w * 3, streaks=26, sharp=3)
        glow += wc * (r * 0.5 * dens)[..., None]
        light += wc * (radial(h, w, w * 0.6, h * 0.95, w * 0.5, power=1.5, aspect=2) * 0.35)[..., None]
        albedo_floor = 1
    elif stage == "setup":
        glow += hexc("#c9d4e6") * (windows * 0.25)[..., None]
        # work lights
        for (lx, ly, lz) in ((-5.5, 3.2, 12), (6.5, 3.4, 18), (-2, 4.5, 26), (4, 2.6, 8)):
            sx, sy = P(lx, ly, lz)
            c = hexc("#f4f1ea")
            glow += c * (halo(h, w, sx, sy, cam.scale(0.35, lz)) * 3.0)[..., None]
            light += c * (radial(h, w, sx, sy, cam.scale(7, lz), power=1.2) * 0.55)[..., None]
            glow += c * (radial(h, w, sx, sy, cam.scale(4, lz), power=1.0) * 0.12 * dens)[..., None]
    else:
        glow += hexc("#2a3550") * (windows * 0.25)[..., None]

    img = albedo * light + glow

    # polished floor reflection
    hor = cam.cy
    floor_m = smooth(hor + 2, hor + 10, y)
    flip = img[::-1]
    shift = int(2 * hor - h)
    refl = np.zeros_like(img)
    if shift >= 0:
        refl[shift:] = flip[:h - shift]
    refl = blur(refl, 6)
    img += refl * (floor_m * (0.18 if stage != "live" else 0.3))[..., None]

    objs = []
    if stage in ("setup", "live"):
        img = _truss(img, h, w, cam, stage, rng)
        img = _tables(img, h, w, cam, stage, rng)
    if stage == "setup":
        img = _string_lights(img, h, w, cam, rng, lit=False)
        objs = [("person", -2.5, 9, dict(pose="hold", facing=1, cap=True)), ("person", 3.5, 14, dict(pose="walk", facing=-1)),
                ("person", 1.2, 21, dict(pose="point")), ("person", -6.0, 17, dict(pose="walk")),
                ("ladder", 5.0, 11, {}), ("ladder", -4.5, 24, {})]
    if stage == "live":
        img = _string_lights(img, h, w, cam, rng, lit=True)
        img = _stage_flowers(img, h, w, cam, rng)
        for i in range(46):
            Z = rng.uniform(7, 30)
            X = rng.uniform(-8, 8.5)
            if abs(X - 0.6) < 1.0 and Z < 20:
                continue
            objs.append(("person", X, Z, dict(pose=rng.choice(["stand", "walk", "hold"]),
                                              facing=int(rng.choice([-1, 1])), height=rng.uniform(1.55, 1.85))))

    for kind, X, Z, o in sorted(objs, key=lambda t: -t[2]):
        mm = np.zeros((h, w), np.float32)
        fx, fy = P(X, 0, Z)
        if kind == "person":
            person(mm, fx, fy, cam.scale(o.get("height", 1.75), Z), pose=o.get("pose", "stand"),
                   facing=o.get("facing", 1), cap=o.get("cap", False))
        elif kind == "ladder":
            s = cam.scale(1.0, Z)
            for dx in (-0.35, 0.35):
                line(mm, (fx + dx * s, fy), (fx + dx * 0.3 * s, fy - 3.0 * s), max(2, 0.06 * s))
            for k in range(1, 9):
                yy = fy - k * 0.33 * s
                hw = 0.35 * s * (1 - k * 0.33 / 3.0 * 0.7)
                line(mm, (fx - hw, yy), (fx + hw, yy), max(1, 0.04 * s))
        depth = np.clip((Z - 4) / 26, 0, 1)
        mm = blur(mm, 0.5 + depth * 1.2)
        img = silhouette(img, mm, 0.94 - 0.45 * depth, tint=hexc("#2a1810") * 0.1 if stage == "live" else None)
        if stage == "live":
            img += hexc("#ffb36b") * (rim(mm, 1.0) * 0.25)[..., None]

    if stage == "live":
        r = rays(h, w, *P(0.6, 6.5, 36), rng, center=math.pi / 2, spread=1.1, length=w * 0.8, streaks=40, sharp=2.5)
        img += hexc("#ffb36b") * (r * 0.35 * dens)[..., None]
        img += hexc("#ff7a3d") * (dens * 0.04)[..., None]
    rng2 = np.random.default_rng(seed + 3)
    return finish(img, rng2, exposure=exposure, **(grade or {}))


def _truss(img, h, w, cam, stage, rng):
    P = cam.p
    m = np.zeros((h, w), np.float32)
    z = 33.0
    top = 6.2
    for X in (-5.4, 6.6):
        a, b = P(X, 0, z), P(X, top, z)
        line(m, a, b, max(2, cam.scale(0.3, z)))
    line(m, P(-5.4, top, z), P(6.6, top, z), max(2, cam.scale(0.3, z)))
    for k in range(0, 24):
        X = -5.4 + k * 0.5
        line(m, P(X, top - 0.3, z), P(X + 0.25, top, z), 1)
    if stage == "live":
        sx0, sy0 = P(-5.0, 0.0, z)
        sx1, sy1 = P(6.2, top - 0.3, z)
        st = np.zeros((h, w), np.float32)
        poly(st, [(sx0, sy0), (sx1, sy0), (sx1, sy1), (sx0, sy1)])
        img += hexc("#ffb070") * (blur(st, 4) * 0.55)[..., None]
        cx, cy = (sx0 + sx1) / 2, (sy0 + sy1) / 2
        img += hexc("#ff9a52") * (radial(h, w, cx, cy, w * 0.25, power=1.1) * 1.0)[..., None]
    img = silhouette(img, m, 0.85)
    return img


def _tables(img, h, w, cam, stage, rng):
    P = cam.p
    for z in np.arange(7, 30, 4.2):
        for X in (-6.0, -2.6, 4.0, 7.2):
            Xj = X + rng.uniform(-0.4, 0.4)
            cx, cy = P(Xj, 0.76, z)
            r = cam.scale(0.9, z)
            m = np.zeros((h, w), np.float32)
            ellipse(m, cx, cy, r, r * 0.22)
            sk = np.zeros((h, w), np.float32)
            poly(sk, [(cx - r, cy), (cx + r, cy), (cx + r * 0.95, cy + cam.scale(0.76, z)), (cx - r * 0.95, cy + cam.scale(0.76, z))])
            if stage == "live":
                cloth = hexc("#f1e3d0") * 0.55
                img = img * (1 - (m + sk * 0.9)[..., None]) + cloth * ((m * 1.0 + sk * 0.45)[..., None])
                for k in range(3):
                    px, py = cx + rng.uniform(-0.5, 0.5) * r, cy - r * 0.05
                    img += hexc("#ffb15e") * (halo(h, w, px, py, max(2, r * 0.18)) * 0.9)[..., None]
                fl = np.zeros((h, w), np.float32)
                ellipse(fl, cx, cy - r * 0.18, r * 0.28, r * 0.2)
                fl = blur(fl, max(1, r * 0.06))
                img = img * (1 - fl[..., None] * 0.8) + hexc("#ff8a1c") * (fl * 0.45 * (0.6 + noise(h, w, 6, 6, rng, 2) * 0.8))[..., None]
            else:
                bare = hexc("#3a342e")
                img = img * (1 - (m + sk * 0.8)[..., None] * 0.9) + bare * ((m * 0.8 + sk * 0.5)[..., None])
    return img


def _string_lights(img, h, w, cam, rng, lit=True):
    P = cam.p
    lay = np.zeros((h, w), np.float32)
    wires = np.zeros((h, w), np.float32)
    for z in np.arange(4, 36, 2.6):
        for k in range(28):
            t = k / 27
            X = -8.4 + t * 18
            sag = 1.1 * 4 * t * (1 - t)
            Y = 7.4 - sag
            zz = z + math.sin(t * math.pi) * 1.2
            px, py = P(X, Y, zz)
            if lit:
                r = max(1.2, cam.scale(0.06, zz))
                circle(lay, px, py, r, rng.uniform(0.6, 1.0))
            if k:
                line(wires, prev, (px, py), 1, 0.6)
            prev = (px, py)
    if lit:
        c = hexc("#ffc27a")
        b = blur(lay, 1.0)
        img += c * (b * 6.0 + blur(lay, 8) * 6.0 + blur(lay, 30) * 4)[..., None]
    else:
        img = silhouette(img, blur(wires, 0.6), 0.5)
    return img


def _stage_flowers(img, h, w, cam, rng):
    P = cam.p
    m = np.zeros((h, w), np.float32)
    z = 33.0
    for k in range(240):
        a = rng.uniform(0, math.pi)
        rr = rng.uniform(4.6, 5.6)
        X = 0.6 + math.cos(a) * rr
        Y = 0.4 + math.sin(a) * rr * 1.05
        px, py = P(X, Y, z)
        circle(m, px, py, cam.scale(rng.uniform(0.12, 0.3), z), rng.uniform(0.6, 1))
    m = blur(m, 1.5)
    n = noise(h, w, 4, 4, rng, 2)
    col = hexc("#ff7e1a") * (0.6 + n * 0.8)[..., None] * 0.9 + hexc("#ffd2b0") * (n > 0.65)[..., None] * 0.6
    img = img * (1 - m[..., None] * 0.9) + col * m[..., None] * 1.4
    return img


# ------------------------------------------------------------ PAPERWORK ---

def _warp_onto(desk, sheet, quad):
    import cv2
    h, w = desk.shape[:2]
    sh, sw = sheet.shape[:2]
    src = np.float32([[0, 0], [sw, 0], [sw, sh], [0, sh]])
    M = cv2.getPerspectiveTransform(src, np.float32(quad))
    warped = cv2.warpPerspective(sheet, M, (w, h), flags=cv2.INTER_LINEAR)
    mask = cv2.warpPerspective(np.ones((sh, sw), np.float32), M, (w, h), flags=cv2.INTER_LINEAR)
    return desk * (1 - mask[..., None]) + warped * mask[..., None], mask


def _desk(w, h, rng, wood="#2a1a12"):
    x, y = grid(h, w)
    grain_n = noise(h, w, w * 0.6, h * 0.004, rng, 4)
    base = hexc(wood)
    return base[None, None, :] * (0.6 + grain_n * 0.8)[..., None]


def stripboard(w, h, seed, lamp=(0.62, 0.35), grade=None):
    rng = np.random.default_rng(seed)
    img = _desk(w, h, rng)
    bw, bh = 2200, 1300
    sheet = np.zeros((bh, bw, 3), np.float32) + hexc("#151515")
    palette = [hexc("#efeae0"), hexc("#f2d24a"), hexc("#3f6fc4"), hexc("#3e9a5a"), hexc("#efeae0"), hexc("#f2d24a")]
    xx = 40
    k = 0
    while xx < bw - 40:
        if rng.random() < 0.1 and k > 3:
            sheet[60:bh - 60, xx:xx + 14] = hexc("#050505")
            xx += 22
            k = 0
            continue
        sw = rng.integers(24, 30)
        c = palette[rng.integers(len(palette))]
        sheet[60:bh - 60, xx:xx + sw] = c * 0.85
        for yy in range(110, bh - 120, 36):
            if rng.random() < 0.75:
                L = rng.integers(6, 18)
                sheet[yy:yy + 8, xx + 6:xx + 6 + L] = c * 0.25
        xx += sw + 3
        k += 1
    sheet[60:120, 40:bw - 40] = hexc("#e9e2d2") * 0.9
    for xx in range(60, bw - 80, 90):
        sheet[80:96, xx:xx + rng.integers(30, 70)] = hexc("#222222")
    quad = [(w * 0.12, h * 0.18), (w * 0.98, h * 0.08), (w * 1.12, h * 1.05), (w * 0.02, h * 1.18)]
    img, _ = _warp_onto(img, sheet, quad)
    lx, ly = lamp[0] * w, lamp[1] * h
    light = 0.08 + radial(h, w, lx, ly, w * 0.55, power=1.6) * 1.6
    img = img * light[..., None] * hexc("#ffe2b8")[None, None, :] * 1.6
    x, y = grid(h, w)
    focus = np.exp(-((y - h * 0.5) / (h * 0.28)) ** 2)
    img = img * focus[..., None] + blur(img, 9) * (1 - focus[..., None])
    return finish(img, rng, **(grade or {}))


def plans(w, h, seed, paper="#e8e1d2", ink="#1d2430", accent="#c0392b", lamp=(0.4, 0.3), grade=None, hatch=True):
    import cv2
    rng = np.random.default_rng(seed)
    img = _desk(w, h, rng, wood="#1b1512")
    sw_, sh_ = 2400, 1700
    sheet = np.zeros((sh_, sw_, 3), np.float32) + hexc(paper)
    sheet *= (0.92 + 0.08 * noise(sh_, sw_, 200, 200, rng, 3))[..., None]
    ink_c = tuple(float(v) for v in hexc(ink))
    acc = tuple(float(v) for v in hexc(accent))
    # rooms
    rooms = [(200, 220, 1100, 900), (1100, 220, 1900, 700), (1100, 700, 1900, 1350), (200, 900, 1100, 1350),
             (1900, 220, 2200, 1350)]
    for (a, b, c, d) in rooms:
        cv2.rectangle(sheet, (a, b), (c, d), ink_c, 14, cv2.LINE_AA)
    for (cx, cy, r, a0) in ((1100, 450, 160, 90), (650, 900, 140, 0), (1500, 700, 150, 180), (1900, 1000, 130, 90)):
        cv2.ellipse(sheet, (cx, cy), (r, r), a0, 0, 90, ink_c, 4, cv2.LINE_AA)
        sheet[cy - 20:cy + 20, cx - 20:cx + 20] = hexc(paper)
    for yy in (140, 1430):
        cv2.line(sheet, (200, yy), (2200, yy), ink_c, 3, cv2.LINE_AA)
        for xx in (200, 1100, 1900, 2200):
            cv2.line(sheet, (xx, yy - 25), (xx, yy + 25), ink_c, 3, cv2.LINE_AA)
    for k in range(60):
        xx, yy = rng.integers(250, 2100), rng.integers(260, 1300)
        cv2.rectangle(sheet, (int(xx), int(yy)), (int(xx + rng.integers(40, 160)), int(yy + 14)), ink_c, -1)
    if hatch:
        cv2.ellipse(sheet, (1500, 1020), (330, 230), -8, 0, 360, acc, 10, cv2.LINE_AA)
        for k in range(-300, 320, 40):
            cv2.line(sheet, (1500 + k - 160, 1180), (1500 + k + 160, 860), acc, 3, cv2.LINE_AA)
        cv2.rectangle(sheet, (1220, 820), (1780, 1220), hexc(paper).tolist(), 0)
    quad = [(w * 0.05, h * 0.12), (w * 0.9, h * 0.02), (w * 1.08, h * 0.98), (w * -0.06, h * 1.1)]
    img, _ = _warp_onto(img, sheet, quad)
    # pencil + ruler
    m = np.zeros((h, w), np.float32)
    poly(m, [(w * 0.58, h * 0.78), (w * 0.95, h * 0.55), (w * 0.955, h * 0.565), (w * 0.585, h * 0.795)])
    img = img * (1 - m[..., None]) + hexc("#d9a520") * m[..., None] * 0.8
    lx, ly = lamp[0] * w, lamp[1] * h
    light = 0.06 + radial(h, w, lx, ly, w * 0.6, power=1.5) * 1.5
    img = img * light[..., None] * hexc("#ffe7c4")[None, None, :] * 1.5
    x, y = grid(h, w)
    focus = np.exp(-((y - h * 0.48) / (h * 0.3)) ** 2)
    img = img * focus[..., None] + blur(img, 8) * (1 - focus[..., None])
    return finish(img, rng, **(grade or {}))


# ------------------------------------------------------------- MONITOR ---

def monitor(w, h, seed, screen, grade=None):
    import cv2
    rng = np.random.default_rng(seed)
    bg = bokeh(w, h, seed + 1, ["#ffb36b", "#8fb4ff", "#ffe2b0"], count=60, band=(0.1, 0.7), sizes=(14, 70),
               big=3, grade=dict(grain=0, vignette=0, ca=0, sat=0.8), exposure=0.5)
    img = np.power(bg, 2.2) * 0.6
    sh, sw = screen.shape[:2]
    scr = np.power(screen, 2.2).astype(np.float32) * 1.15
    bez = 26
    frame = np.zeros((sh + bez * 2, sw + bez * 2, 3), np.float32) + 0.012
    frame[bez:-bez, bez:-bez] = scr
    quad = [(w * 0.26, h * 0.2), (w * 0.86, h * 0.24), (w * 0.85, h * 0.78), (w * 0.27, h * 0.84)]
    img, mk = _warp_onto(img, frame, quad)
    cx, cy = w * 0.56, h * 0.52
    img += hexc("#cfe0ff") * (radial(h, w, cx, cy, w * 0.5, power=1.3) * 0.08)[..., None]
    m = np.zeros((h, w), np.float32)
    ellipse(m, w * 0.08, h * 0.95, w * 0.2, h * 0.5)
    circle(m, w * 0.12, h * 0.36, h * 0.17)
    m = blur(m, 18)
    img = silhouette(img, m, 0.97)
    img += hexc("#cfe0ff") * (rim(m, 3, 0.6) * 0.3)[..., None]
    return finish(img, rng, **(grade or {}))


# -------------------------------------------------------------- SAFETY ---

def safety(w, h, seed, grade=None):
    rng = np.random.default_rng(seed)
    cam = Cam(w, h, f=w * 0.9, cy=h * 0.38, height=1.2)
    P = cam.p
    x, y = grid(h, w)
    img = vgrad(h, w, [(0, hexc("#0b0d12")), (0.55, hexc("#141821")), (0.56, hexc("#1b1c1f")), (1, hexc("#0c0c0d"))])
    # back wall at Z=5, floor
    fy = P(0, 0, 5)[1]
    floor = smooth(fy - 1, fy + 1, y)
    conc = noise(h, w, w * 0.03, h * 0.01, rng, 4)
    img *= (0.8 + 0.4 * conc)[..., None]
    # hazard tape on the floor
    tape = np.zeros((h, w), np.float32)
    stripes = np.zeros((h, w), np.float32)
    for (z0, z1) in ((3.2, 3.5),):
        poly(tape, [P(-5, 0, z0), P(5, 0, z0), P(5, 0, z1), P(-5, 0, z1)])
        for k in range(-30, 30):
            X = k * 0.35
            poly(stripes, [P(X, 0, z0), P(X + 0.17, 0, z0), P(X + 0.27, 0, z1), P(X + 0.1, 0, z1)])
    tcol = hexc("#e8b417") * (1 - stripes[..., None]) + hexc("#0a0a0a") * stripes[..., None]
    img = img * (1 - tape[..., None]) + tcol * tape[..., None] * 0.9
    light = 0.12 + radial(h, w, w * 0.5, P(0, 0, 4.4)[1] - h * 0.25, w * 0.42, power=1.6) * 1.6
    img *= light[..., None] * hexc("#e8eefc")[None, None, :]
    # extinguishers
    for X, Z, s in ((-0.75, 4.3, 1.0), (-0.15, 4.4, 0.95), (0.55, 4.25, 1.0)):
        bx, by = P(X, 0, Z)
        r = cam.scale(0.09 * s, Z)
        H = cam.scale(0.6 * s, Z)
        sh = np.zeros((h, w), np.float32)
        ellipse(sh, bx + r * 0.6, by, r * 2.2, r * 0.5)
        img *= (1 - blur(sh, 6)[..., None] * 0.7)
        body = np.zeros((h, w), np.float32)
        poly(body, [(bx - r, by), (bx + r, by), (bx + r, by - H), (bx - r, by - H)])
        ellipse(body, bx, by - H, r, r * 0.9)
        n = np.clip((x - bx) / r, -1, 1)
        lam = np.sqrt(np.clip(1 - n * n, 0, 1)) * (0.55 + 0.45 * n * -0.6 + 0.3)
        spec = np.exp(-((n + 0.45) / 0.12) ** 2) * 1.2
        col = hexc("#b5140f")[None, None, :] * (0.08 + lam * 1.1)[..., None] + (spec * 0.7)[..., None]
        lab = np.zeros((h, w), np.float32)
        poly(lab, [(bx - r * 0.85, by - H * 0.35), (bx + r * 0.85, by - H * 0.35), (bx + r * 0.85, by - H * 0.7), (bx - r * 0.85, by - H * 0.7)])
        col = col * (1 - lab[..., None]) + (hexc("#e6e0d2") * (0.15 + lam * 0.8)[..., None]) * lab[..., None]
        img = img * (1 - body[..., None]) + col * body[..., None]
        head = np.zeros((h, w), np.float32)
        poly(head, [(bx - r * 0.4, by - H - r * 0.6), (bx + r * 0.4, by - H - r * 0.6), (bx + r * 0.35, by - H - r * 1.6), (bx - r * 0.35, by - H - r * 1.6)])
        poly(head, [(bx - r * 0.3, by - H - r * 1.5), (bx + r * 1.4, by - H - r * 1.9), (bx + r * 1.4, by - H - r * 1.7), (bx - r * 0.3, by - H - r * 1.3)])
        img = silhouette(img, head, 0.92)
        img += np.array([0.6, 0.6, 0.65], np.float32) * (rim(head, 1, 0.4))[..., None]
        hose = np.zeros((h, w), np.float32)
        pts = [(bx + r * 0.3, by - H - r * 1.0)]
        for k in range(1, 12):
            t = k / 11
            pts.append((bx + r * (0.3 + 1.2 * math.sin(t * math.pi)), by - H - r + t * H * 0.7))
        for a, b in zip(pts[:-1], pts[1:]):
            line(hose, a, b, max(2, r * 0.22))
        img = silhouette(img, hose, 0.95)
    return finish(img, rng, **(grade or {}))


# -------------------------------------------------------- CONSTRUCTION ---

def construction(w, h, seed, ambient="#3b2a5a", grade=None):
    rng = np.random.default_rng(seed)
    base = room(w, h, seed, wall="#151218", floor_c="#1c1a1d", ceil="#08070a", W=16, H=8, D=26,
                practicals=[(-4.5, 3.6, 10, "#fff2dc", 6.0), (5.0, 4.2, 16, "#fff2dc", 5.0), (0.5, 6.5, 22, "#ffe2b0", 4.0)],
                haze=ambient, return_raw=True, f=0.6, door=(-2.0, 2.0, 5.0), door_col="#6a4fb0")
    cam = Cam(w, h, f=w * 0.6, cy=h * 0.5, height=1.5)
    P = cam.p
    wood = hexc("#c89a62")
    flats = [(-5.5, -1.5, 12, 3.6, "frame"), (-1.0, 3.0, 15, 3.6, "ply"), (3.4, 7.0, 11, 3.6, "paint"),
             (-7.0, -5.8, 8, 3.6, "frame")]
    for (xa, xb, z, Ht, kind) in flats:
        quad = [P(xa, 0, z), P(xb, 0, z + 0.6), P(xb, Ht, z + 0.6), P(xa, Ht, z)]
        m = np.zeros((h, w), np.float32)
        lm = np.zeros((h, w), np.float32)
        if kind == "frame":
            for t in np.linspace(0, 1, 7):
                X = xa + (xb - xa) * t
                Z = z + 0.6 * t
                line(lm, P(X, 0, Z), P(X, Ht, Z), max(2, cam.scale(0.06, Z)))
            for Y in (0.05, Ht / 2, Ht - 0.05):
                line(lm, P(xa, Y, z), P(xb, Y, z + 0.6), max(2, cam.scale(0.06, z)))
            lit = radial(h, w, *P(xa, Ht, z - 2), w * 0.3, power=1.2)
            base = base * (1 - lm[..., None]) + wood * (lm * (0.25 + lit * 1.4))[..., None]
        else:
            poly(m, quad)
            col = wood * 0.7 if kind == "ply" else hexc("#4a2f6e")
            tex = noise(h, w, w * 0.3, h * 0.004, rng, 3) if kind == "ply" else noise(h, w, 40, 40, rng, 2)
            lit = 0.15 + radial(h, w, *P(xa - 1, Ht + 0.5, z - 2), w * 0.35, power=1.2) * 1.4
            base = base * (1 - m[..., None]) + (col[None, None, :] * (0.7 + tex * 0.5)[..., None] * lit[..., None]) * m[..., None]
    figs = np.zeros((h, w), np.float32)
    for (X, Z, pose, f) in ((-0.6, 9.0, "hold", 1), (4.2, 14.0, "point", -1), (-3.8, 17, "walk", 1)):
        fx, fy = P(X, 0, Z)
        person(figs, fx, fy, cam.scale(1.75, Z), pose=pose, facing=f, cap=True)
    figs = blur(figs, 0.8)
    base = silhouette(base, figs, 0.95)
    base += hexc("#fff2dc") * (rim(figs, 1.0, 0.12))[..., None]
    for (lx, ly, lz) in ((-4.5, 3.6, 10), (5.0, 4.2, 16)):
        sx, sy = P(lx, ly, lz)
        base += hexc("#fff2dc") * (halo(h, w, sx, sy, cam.scale(0.3, lz)) * 2.4)[..., None]
    return finish(base, np.random.default_rng(seed + 2), **(grade or {}))


# ------------------------------------------------------------ PORTRAIT ---

def portrait(w, h, seed, key="#ffb36b", grade=None):
    """A producer seen from behind, overlooking a lit set."""
    img = film_set(w, h, seed,
                   objects=[("camera", 1.4, 9.0, dict(facing=-1)), ("softbox", -2.5, 11, dict(facing=1, power=0.5)),
                            ("person", 2.4, 10.0, dict(pose="operate", facing=-1)), ("cstand", 3.8, 12, dict(facing=-1)),
                            ("person", -0.2, 1.7, dict(pose="hold", facing=1, height=1.8))],
                   light=(0.6, 3.0, 18), key=key, cam_h=1.55, cy=0.42, f=0.75, grade=grade)
    return img


def table_scene(w, h, seed, grade=None):
    """Long banquet table in perspective (GLUTTONY)."""
    rng = np.random.default_rng(seed)
    raw = room(w, h, seed, wall="#3a0c10", floor_c="#140405", ceil="#0a0203", W=7, H=3.6, D=14,
               door=(-0.8, 0.8, 2.6), door_col="#ff9a5a", haze="#5a1016", practicals=[(-2.6, 2.2, 9, "#ffb46a", 1.2), (2.6, 2.2, 9, "#ffb46a", 1.2)],
               return_raw=True, f=0.7)
    cam = Cam(w, h, f=w * 0.7, cy=h * 0.5, height=1.5)
    P = cam.p
    top = np.zeros((h, w), np.float32)
    poly(top, [P(-0.9, 0.78, 2.2), P(0.9, 0.78, 2.2), P(0.75, 0.78, 12.5), P(-0.75, 0.78, 12.5)])
    skirt = np.zeros((h, w), np.float32)
    poly(skirt, [P(-0.9, 0.78, 2.2), P(-0.75, 0.78, 12.5), P(-0.75, 0.0, 12.5), P(-0.9, 0.0, 2.2)])
    poly(skirt, [P(0.9, 0.78, 2.2), P(0.75, 0.78, 12.5), P(0.75, 0.0, 12.5), P(0.9, 0.0, 2.2)])
    cloth = hexc("#d8c7b4")
    lit = 0.12 + radial(h, w, w * 0.5, h * 0.45, w * 0.4, power=1.2) * 0.8
    raw = raw * (1 - top[..., None]) + cloth * (top * lit)[..., None]
    raw = raw * (1 - skirt[..., None]) + cloth * (skirt * lit * 0.35)[..., None]
    food = np.zeros((h, w), np.float32)
    for z in np.arange(2.8, 12, 0.9):
        for X in (-0.45, 0.0, 0.45):
            px, py = P(X + rng.uniform(-0.1, 0.1), 0.8, z)
            r = cam.scale(rng.uniform(0.1, 0.17), z)
            ellipse(food, px, py, r, r * 0.35, val=rng.uniform(0.6, 1))
    nf = noise(h, w, 8, 8, rng, 2)
    fcol = hexc("#6a1a10") * (0.5 + nf)[..., None] + hexc("#c8641e") * (nf > 0.62)[..., None] * 0.6
    raw = raw * (1 - food[..., None]) + fcol * (food * lit)[..., None] * 1.3
    for z in np.arange(3.0, 12.5, 1.5):
        for X in (-0.55, 0.55):
            px, py = P(X, 0.78, z)
            s = cam.scale(1, z)
            cm = np.zeros((h, w), np.float32)
            line(cm, (px, py), (px, py - 0.32 * s), max(1, 0.03 * s))
            raw = silhouette(raw, cm, 0.6, tint=hexc("#e8d8c0") * 0.3)
            raw += hexc("#ffb050") * (halo(h, w, px, py - 0.36 * s, max(2, s * 0.05)) * 2.2)[..., None]
            raw += hexc("#ff8a3a") * (radial(h, w, px, py - 0.36 * s, s * 0.9, power=1.2) * 0.12)[..., None]
    figs = np.zeros((h, w), np.float32)
    fx, fy = P(0, 0.4, 13.2)
    person(figs, fx, fy + cam.scale(0.0, 13), cam.scale(1.3, 13.2), pose="stand")
    raw = silhouette(raw, figs, 0.9)
    return finish(raw, np.random.default_rng(seed + 4), **(grade or {}))
