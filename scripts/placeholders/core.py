"""
Core helpers for the procedural placeholder plates.

All compositing happens in linear light (float32, HDR) and is tone-mapped,
graded and grained at the end so every plate shares one "film stock".
"""
import math

import cv2
import numpy as np


# ---------------------------------------------------------------- colour --

def hexc(s):
    s = s.lstrip("#")
    srgb = np.array([int(s[i:i + 2], 16) / 255.0 for i in (0, 2, 4)], np.float32)
    return np.power(srgb, 2.2)


def lerp(a, b, t):
    return a + (b - a) * t


def grid(h, w):
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    return x, y


# ----------------------------------------------------------------- noise --

def noise(h, w, cx, cy, rng, octaves=4, pers=0.5):
    """Smooth value-noise fBm; cx/cy = feature size in px (x/y independent)."""
    out = np.zeros((h, w), np.float32)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        sx = max(1.5, cx / 2 ** o)
        sy = max(1.5, cy / 2 ** o)
        gw, gh = int(w / sx) + 3, int(h / sy) + 3
        g = rng.random((gh, gw), dtype=np.float32)
        up = cv2.resize(g, (int(gw * sx), int(gh * sy)), interpolation=cv2.INTER_CUBIC)
        out += up[:h, :w] * amp
        tot += amp
        amp *= pers
    return np.clip(out / tot, 0, 1)


def noise1(n, cell, rng, octaves=5, pers=0.5):
    out = np.zeros(n, np.float32)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        c = max(2.0, cell / 2 ** o)
        k = int(n / c) + 4
        pts = rng.random((1, k), dtype=np.float32) * 2 - 1
        up = cv2.resize(pts, (int(k * c), 1), interpolation=cv2.INTER_CUBIC)[0]
        out += up[:n] * amp
        tot += amp
        amp *= pers
    return out / tot


# ------------------------------------------------------------ gradients --

def vgrad(h, w, stops):
    """stops: [(pos 0..1, linear rgb), ...] top -> bottom."""
    y = np.linspace(0, 1, h)
    col = np.zeros((h, 3), np.float32)
    ps = [s[0] for s in stops]
    for c in range(3):
        col[:, c] = np.interp(y, ps, [s[1][c] for s in stops])
    return np.repeat(col[:, None, :], w, axis=1)


def radial(h, w, cx, cy, r, power=2.0, aspect=1.0):
    x, y = grid(h, w)
    d = np.sqrt(((x - cx) / aspect) ** 2 + (y - cy) ** 2) / max(r, 1e-3)
    return np.exp(-np.power(d, power)).astype(np.float32)


def halo(h, w, cx, cy, r):
    """Core + long tail, like a light seen through haze."""
    x, y = grid(h, w)
    d2 = ((x - cx) ** 2 + (y - cy) ** 2) / (r * r)
    return (np.exp(-d2 * 4.0) * 1.0 + 1.0 / (1.0 + d2 * 6.0) * 0.35).astype(np.float32)


def blur(img, sigma):
    if sigma <= 0:
        return img
    return cv2.GaussianBlur(img, (0, 0), sigma)


def add(img, layer, color, k=1.0):
    img += layer[..., None] * color[None, None, :] * k
    return img


# ------------------------------------------------------------ light ---

def rays(h, w, ox, oy, rng, center, spread, length, streaks=90, sharp=3.0, falloff=1.0):
    """Volumetric god-rays fanning around `center` (radians, image coords) +/- spread."""
    x, y = grid(h, w)
    ang = np.arctan2(y - oy, x - ox)
    da = np.angle(np.exp(1j * (ang - center))).astype(np.float32)
    t = (da + spread) / (2 * spread)
    inside = np.clip(np.minimum(t, 1 - t) * 6, 0, 1)
    s = noise1(4096, 4096 / streaks, rng, octaves=3, pers=0.6)
    s = (s - s.min()) / (s.max() - s.min() + 1e-6)
    st = np.interp(np.clip(t, 0, 1) * 4095, np.arange(4096), s)
    st = np.power(st, sharp)
    dist = np.hypot(x - ox, y - oy)
    fall = np.exp(-np.power(dist / length, falloff))
    return (st * fall * inside).astype(np.float32)


def cone(h, w, ox, oy, direction, half_angle, length, soft=0.35):
    """A soft light cone from a fixture (direction in radians)."""
    x, y = grid(h, w)
    ang = np.arctan2(y - oy, x - ox)
    da = np.abs(np.angle(np.exp(1j * (ang - direction))))
    edge = np.clip((half_angle - da) / (half_angle * soft), 0, 1)
    dist = np.hypot(x - ox, y - oy)
    fall = np.exp(-dist / length) * np.clip(dist / 30.0, 0, 1)
    return (edge * edge * fall).astype(np.float32)


def bloom(img, thr=0.9, k=0.35, sigmas=(6, 24, 70)):
    bright = np.maximum(img - thr, 0)
    acc = np.zeros_like(img)
    for i, s in enumerate(sigmas):
        acc += blur(bright, s) * (1.0 / (i + 1))
    return img + acc * k


# ---------------------------------------------------------- silhouettes --

def poly(m, pts, val=1.0):
    p = np.array([[int(round(a * 4)), int(round(b * 4))] for a, b in pts], np.int32)
    cv2.fillPoly(m, [p], val, lineType=cv2.LINE_AA, shift=2)


def circle(m, cx, cy, r, val=1.0):
    cv2.circle(m, (int(round(cx * 4)), int(round(cy * 4))), max(1, int(round(r * 4))), val, -1,
               lineType=cv2.LINE_AA, shift=2)


def ellipse(m, cx, cy, rx, ry, angle=0, val=1.0):
    cv2.ellipse(m, (int(round(cx * 4)), int(round(cy * 4))),
                (max(1, int(round(rx * 4))), max(1, int(round(ry * 4)))), angle, 0, 360, val, -1,
                lineType=cv2.LINE_AA, shift=2)


def line(m, p1, p2, width, val=1.0):
    cv2.line(m, (int(round(p1[0] * 4)), int(round(p1[1] * 4))),
             (int(round(p2[0] * 4)), int(round(p2[1] * 4))), val, max(1, int(round(width))),
             lineType=cv2.LINE_AA, shift=2)


def limb(m, p1, p2, w1, w2):
    (x1, y1), (x2, y2) = p1, p2
    dx, dy = x2 - x1, y2 - y1
    L = math.hypot(dx, dy) or 1
    nx, ny = -dy / L, dx / L
    poly(m, [(x1 + nx * w1 / 2, y1 + ny * w1 / 2), (x2 + nx * w2 / 2, y2 + ny * w2 / 2),
             (x2 - nx * w2 / 2, y2 - ny * w2 / 2), (x1 - nx * w1 / 2, y1 - ny * w1 / 2)])
    circle(m, x1, y1, w1 / 2)
    circle(m, x2, y2, w2 / 2)


def person(m, x, y, H, pose="stand", facing=1, width=1.0, cap=False, rng=None):
    """Draw a human silhouette with feet at (x, y) and height H."""
    u = H
    fw = width
    sh_y, hip_y, knee_y = y - 0.80 * u, y - 0.50 * u, y - 0.27 * u
    stride = {"walk": 0.09, "stand": 0.025, "hold": 0.03, "point": 0.04, "operate": 0.05}.get(pose, 0.03)
    # legs
    for side, s in ((-1, -stride), (1, stride)):
        hip = (x + side * 0.045 * u * fw, hip_y)
        knee = (x + side * 0.05 * u * fw + s * 0.4 * u, knee_y)
        ankle = (x + side * 0.045 * u * fw + s * u, y - 0.03 * u)
        limb(m, hip, knee, 0.085 * u * fw, 0.062 * u * fw)
        limb(m, knee, ankle, 0.062 * u * fw, 0.045 * u * fw)
        ellipse(m, ankle[0] + facing * 0.03 * u, y - 0.012 * u, 0.055 * u, 0.02 * u)
    # torso
    poly(m, [(x - 0.095 * u * fw, hip_y + 0.02 * u), (x + 0.095 * u * fw, hip_y + 0.02 * u),
             (x + 0.125 * u * fw, sh_y + 0.02 * u), (x + 0.10 * u * fw, sh_y - 0.015 * u),
             (x - 0.10 * u * fw, sh_y - 0.015 * u), (x - 0.125 * u * fw, sh_y + 0.02 * u)])
    limb(m, (x, sh_y), (x + facing * 0.005 * u, y - 0.87 * u), 0.055 * u, 0.05 * u)
    hx, hy = x + facing * 0.01 * u, y - 0.925 * u
    ellipse(m, hx, hy, 0.052 * u * (0.85 + 0.15 * fw), 0.064 * u)
    if cap:
        ellipse(m, hx, hy - 0.03 * u, 0.056 * u, 0.03 * u)
        ellipse(m, hx + facing * 0.05 * u, hy - 0.02 * u, 0.05 * u, 0.012 * u)
    # arms
    for side in (-1, 1):
        sh = (x + side * 0.115 * u * fw, sh_y + 0.01 * u)
        if pose == "point" and side == facing:
            el = (sh[0] + side * 0.12 * u, sh[1] - 0.04 * u)
            wr = (el[0] + side * 0.14 * u, el[1] - 0.08 * u)
        elif pose == "hold" and side == facing:
            el = (sh[0] + side * 0.03 * u, sh[1] + 0.16 * u)
            wr = (x + facing * 0.08 * u, sh[1] + 0.08 * u)
            ellipse(m, wr[0] + facing * 0.01 * u, wr[1] - 0.03 * u, 0.018 * u, 0.045 * u)
        elif pose == "operate":
            el = (sh[0] + facing * 0.06 * u, sh[1] + 0.15 * u)
            wr = (el[0] + facing * 0.13 * u, el[1] - 0.02 * u)
        elif pose == "walk":
            sw = 0.07 * u * (1 if side == 1 else -1)
            el = (sh[0] + side * 0.02 * u + sw * 0.5, sh[1] + 0.17 * u)
            wr = (el[0] + sw, el[1] + 0.15 * u)
        else:
            el = (sh[0] + side * 0.03 * u, sh[1] + 0.17 * u)
            wr = (el[0] + side * 0.01 * u, el[1] + 0.16 * u)
        limb(m, sh, el, 0.055 * u, 0.045 * u)
        limb(m, el, wr, 0.045 * u, 0.035 * u)


def camera_rig(m, x, y, s, facing=1):
    """Cinema camera on sticks. (x, y) = centre of tripod feet, s = overall height."""
    hx, hy = x, y - 0.62 * s
    for fx, fy in ((-0.34, 0), (0.30, 0), (0.06, 0.04)):
        line(m, (hx, hy), (x + fx * s, y + fy * s), 0.025 * s)
    line(m, (x - 0.2 * s, y - 0.18 * s), (x + 0.18 * s, y - 0.18 * s), 0.012 * s)
    poly(m, [(hx - 0.07 * s, hy), (hx + 0.07 * s, hy), (hx + 0.05 * s, hy - 0.08 * s), (hx - 0.05 * s, hy - 0.08 * s)])
    # pan bar
    line(m, (hx - facing * 0.04 * s, hy - 0.05 * s), (hx - facing * 0.36 * s, hy + 0.06 * s), 0.02 * s)
    by = hy - 0.08 * s
    bx0 = hx - facing * 0.2 * s
    bx1 = hx + facing * 0.18 * s
    poly(m, [(bx0, by), (bx1, by), (bx1, by - 0.2 * s), (bx0, by - 0.2 * s)])
    # lens + matte box
    lx1 = bx1 + facing * 0.2 * s
    poly(m, [(bx1, by - 0.04 * s), (lx1, by - 0.05 * s), (lx1, by - 0.16 * s), (bx1, by - 0.17 * s)])
    mb = lx1 + facing * 0.09 * s
    poly(m, [(lx1, by - 0.02 * s), (mb, by + 0.03 * s), (mb, by - 0.24 * s), (lx1, by - 0.19 * s)])
    circle(m, bx1 + facing * 0.08 * s, by - 0.02 * s, 0.045 * s)
    # top handle + monitor
    line(m, (bx0 + facing * 0.04 * s, by - 0.2 * s), (bx0 + facing * 0.04 * s, by - 0.26 * s), 0.015 * s)
    line(m, (bx0 + facing * 0.04 * s, by - 0.26 * s), (bx1, by - 0.26 * s), 0.015 * s)
    poly(m, [(bx0 - facing * 0.02 * s, by - 0.22 * s), (bx0 - facing * 0.16 * s, by - 0.24 * s),
             (bx0 - facing * 0.16 * s, by - 0.34 * s), (bx0 - facing * 0.02 * s, by - 0.32 * s)])


def light_stand(m, x, y, s, kind="softbox", facing=1, tilt=0.0):
    """Light stand with a fixture. Returns the emitting point and direction."""
    top = y - s
    for fx in (-0.18, 0.16, 0.02):
        line(m, (x, y - 0.22 * s), (x + fx * s, y), 0.012 * s)
    line(m, (x, y), (x, top), 0.016 * s)
    if kind == "softbox":
        fx = x + facing * 0.05 * s
        poly(m, [(fx - facing * 0.04 * s, top - 0.08 * s), (fx - facing * 0.04 * s, top + 0.08 * s),
                 (fx + facing * 0.22 * s, top + 0.2 * s), (fx + facing * 0.22 * s, top - 0.2 * s)])
        return (fx + facing * 0.22 * s, top), (0 if facing > 0 else math.pi) + tilt
    if kind == "fresnel":
        poly(m, [(x - 0.07 * s, top - 0.07 * s), (x + 0.07 * s, top - 0.07 * s),
                 (x + 0.07 * s, top + 0.07 * s), (x - 0.07 * s, top + 0.07 * s)])
        ex = x + facing * 0.1 * s
        poly(m, [(x + facing * 0.07 * s, top - 0.07 * s), (ex, top - 0.11 * s),
                 (ex, top + 0.11 * s), (x + facing * 0.07 * s, top + 0.07 * s)])
        return (ex, top), (0 if facing > 0 else math.pi) + tilt
    # c-stand with flag
    line(m, (x, top), (x + facing * 0.35 * s, top - 0.05 * s), 0.012 * s)
    fx = x + facing * 0.35 * s
    poly(m, [(fx, top - 0.05 * s), (fx + facing * 0.22 * s, top - 0.08 * s),
             (fx + facing * 0.22 * s, top + 0.14 * s), (fx, top + 0.17 * s)])
    return (fx, top), 0


def silhouette(img, mask, opacity=0.97, tint=None):
    """Darken the plate where the mask is (objects block the light behind)."""
    m = mask[..., None] * opacity
    base = img * (1 - m)
    if tint is not None:
        base += m * tint[None, None, :]
    return base


def rim(mask, width=2.0, strength=1.0):
    er = cv2.erode(mask, np.ones((3, 3), np.uint8), iterations=max(1, int(width)))
    edge = np.clip(mask - er, 0, 1)
    return blur(edge, 0.8) * strength


# ------------------------------------------------------------- finish ---

def aces(x):
    a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    return np.clip((x * (a * x + b)) / (x * (c * x + d) + e), 0, 1)


def finish(img, rng, exposure=1.0, lift=(0.0, 0.0, 0.0), gain=(1.0, 1.0, 1.0), sat=0.9,
           vignette=0.45, grain=0.035, ca=1.0, bloom_k=0.3, bloom_thr=0.85, contrast=1.05):
    h, w = img.shape[:2]
    x = bloom(img * exposure, bloom_thr, bloom_k)
    x = aces(x)
    x = np.power(np.clip(x, 0, 1), 1 / 2.2)
    lift = np.array(lift, np.float32)
    gain = np.array(gain, np.float32)
    x = x * gain + lift * (1 - x)
    x = np.clip((x - 0.5) * contrast + 0.5, 0, 1)
    lum = (x @ np.array([0.2126, 0.7152, 0.0722], np.float32))[..., None]
    x = lum + (x - lum) * sat
    if vignette:
        xx, yy = grid(h, w)
        d = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2) / math.sqrt(2)
        x *= (1 - vignette * np.power(d, 2.2))[..., None]
    if ca:
        x = chroma(x, ca)
    if grain:
        g = rng.normal(0, 1, (h, w)).astype(np.float32)
        g = blur(g, 0.7)
        lum = (x @ np.array([0.3, 0.6, 0.1], np.float32))
        amt = grain * (0.5 + 1.2 * lum * (1 - lum) * 2)
        x += (g * amt)[..., None]
    return np.clip(x, 0, 1)


def chroma(x, px):
    h, w = x.shape[:2]
    out = x.copy()
    for ch, k in ((0, 1), (2, -1)):
        s = 1 + k * px / w
        M = np.float32([[s, 0, (1 - s) * w / 2], [0, s, (1 - s) * h / 2]])
        out[..., ch] = cv2.warpAffine(x[..., ch], M, (w, h), borderMode=cv2.BORDER_REFLECT)
    return out


def save(x, path, quality=84):
    import os
    os.makedirs(os.path.dirname(path), exist_ok=True)
    u8 = (np.clip(x, 0, 1) * 255 + 0.5).astype(np.uint8)
    cv2.imwrite(path, cv2.cvtColor(u8, cv2.COLOR_RGB2BGR),
                [cv2.IMWRITE_JPEG_QUALITY, quality, cv2.IMWRITE_JPEG_PROGRESSIVE, 1,
                 cv2.IMWRITE_JPEG_OPTIMIZE, 1])


# ---------------------------------------------------------- 3D helper ---

class Cam:
    """Pin-hole camera at the origin looking down +Z (y up)."""

    def __init__(self, w, h, f=None, cx=None, cy=None, height=1.6):
        self.w, self.h = w, h
        self.f = f or w * 0.75
        self.cx = w / 2 if cx is None else cx
        self.cy = h * 0.5 if cy is None else cy
        self.height = height

    def p(self, X, Y, Z):
        Z = max(Z, 0.05)
        return (self.cx + self.f * X / Z, self.cy - self.f * (Y - self.height) / Z)

    def scale(self, size, Z):
        return self.f * size / max(Z, 0.05)
