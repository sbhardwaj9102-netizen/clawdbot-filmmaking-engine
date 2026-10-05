"use client";

import { CanvasTexture, LinearMipmapLinearFilter, RepeatWrapping, SRGBColorSpace } from "three";

/**
 * Procedural textures drawn on canvas: signage, paper documents, stripboards,
 * maps, screens, concrete. Typography uses the site's web fonts, so these are
 * created only after `document.fonts` is ready (the loader waits for it).
 * Decorative documents never carry invented numbers.
 */
export const FONT = {
  serif: '"Instrument Serif", "Times New Roman", serif',
  sans: '"Archivo Variable", "Archivo", "Helvetica Neue", Arial, sans-serif',
  mono: '"JetBrains Mono Variable", ui-monospace, Menlo, monospace',
};

const cache = new Map<string, CanvasTexture>();

export function canvasTexture(key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, repeat = false) {
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  draw(ctx, w, h);
  const t = new CanvasTexture(canvas);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  t.minFilter = LinearMipmapLinearFilter;
  if (repeat) t.wrapS = t.wrapT = RepeatWrapping;
  cache.set(key, t);
  return t;
}

export function rand(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export function spaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number, align: "left" | "center" | "right" = "left") {
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let cx = align === "center" ? x - total / 2 : align === "right" ? x - total : x;
  const prev = ctx.textAlign;
  ctx.textAlign = "left";
  chars.forEach((c, i) => {
    ctx.fillText(c, cx, y);
    cx += widths[i] + spacing;
  });
  ctx.textAlign = prev;
  return total;
}

/** Floating lettering on a transparent background. */
export function textTexture(
  text: string,
  opts: { font?: "serif" | "sans" | "mono"; size?: number; weight?: number; color?: string; tracking?: number; w?: number; h?: number; sub?: string; subColor?: string; align?: "left" | "center" } = {},
) {
  const { font = "sans", size = 120, weight = 500, color = "#ece6da", tracking = 0.12, w = 1024, h = 256, sub, subColor, align = "center" } = opts;
  return canvasTexture(`text:${text}:${font}:${size}:${weight}:${color}:${tracking}:${w}:${h}:${sub}:${align}`, w, h, (ctx) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = color;
    ctx.textBaseline = "middle";
    ctx.font = `${font === "serif" ? 400 : weight} ${size}px ${FONT[font]}`;
    const x = align === "center" ? w / 2 : 24;
    const y = sub ? h * 0.4 : h / 2;
    spaced(ctx, text, x, y, size * tracking, align);
    if (sub) {
      ctx.fillStyle = subColor ?? color;
      ctx.globalAlpha = 0.7;
      const s = Math.round(size * 0.24);
      ctx.font = `400 ${s}px ${FONT.mono}`;
      spaced(ctx, sub.toUpperCase(), x, h * 0.8, s * 0.3, align);
      ctx.globalAlpha = 1;
    }
  });
}

/** A sheet of paper: header, title and ruled body (no invented figures). */
export function documentTexture(kind: string, title: string, opts: { seed?: number; lines?: number; columns?: boolean; accent?: string; stamp?: string } = {}) {
  const { seed = 7, lines = 18, columns = false, accent = "#8a2a1d", stamp } = opts;
  return canvasTexture(`doc:${kind}:${title}:${seed}:${lines}:${columns}:${stamp}`, 512, 704, (ctx, w, h) => {
    const r = rand(seed);
    ctx.fillStyle = "#ebe4d4";
    ctx.fillRect(0, 0, w, h);
    // paper grain
    for (let i = 0; i < 1800; i++) {
      ctx.fillStyle = `rgba(80,60,40,${r() * 0.05})`;
      ctx.fillRect(r() * w, r() * h, 1.5, 1.5);
    }
    ctx.fillStyle = "#1a1a1a";
    ctx.font = `500 15px ${FONT.mono}`;
    spaced(ctx, kind.toUpperCase(), 40, 52, 3);
    ctx.fillStyle = accent;
    ctx.fillRect(40, 66, 60, 3);
    ctx.fillStyle = "#151515";
    ctx.font = `400 40px ${FONT.serif}`;
    ctx.fillText(title, 40, 116);
    ctx.fillStyle = "rgba(20,20,20,.18)";
    ctx.fillRect(40, 136, w - 80, 1);
    let y = 172;
    for (let i = 0; i < lines; i++) {
      if (columns) {
        ctx.fillStyle = "rgba(20,20,20,.55)";
        ctx.fillRect(40, y, 120 + r() * 80, 7);
        ctx.fillStyle = "rgba(20,20,20,.18)";
        ctx.fillRect(300, y + 9, w - 340, 1);
      } else {
        ctx.fillStyle = `rgba(20,20,20,${0.28 + r() * 0.2})`;
        ctx.fillRect(40, y, (w - 80) * (0.55 + r() * 0.45), 6);
      }
      y += columns ? 28 : 24;
      if (y > h - 70) break;
    }
    if (stamp) {
      ctx.save();
      ctx.translate(w - 150, h - 110);
      ctx.rotate(-0.18);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 3;
      ctx.strokeRect(-70, -26, 140, 52);
      ctx.fillStyle = accent;
      ctx.font = `600 18px ${FONT.mono}`;
      ctx.textAlign = "center";
      ctx.fillText(stamp, 0, 6);
      ctx.restore();
    }
  });
}

/** Screenplay page — the script on the production table. */
export function screenplayTexture() {
  return canvasTexture("screenplay", 512, 704, (ctx, w, h) => {
    ctx.fillStyle = "#efe9dc";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#151515";
    ctx.font = `400 17px "Courier New", ${FONT.mono}`;
    const L = 70;
    const lines: [number, string][] = [
      [70, "FADE IN:"],
      [120, "INT. PRODUCTION STUDIO - NIGHT"],
      [170, "A single work light. A long table."],
      [194, "On it, a script."],
      [244, "A figure crosses the floor and stops."],
      [268, "He opens the first page."],
      [330, "                 SATYAM (V.O.)"],
      [354, "          Everything starts with a"],
      [378, "          story."],
      [428, "Beat."],
      [478, "                 SATYAM (V.O.)"],
      [502, "          But what happens after"],
      [526, "          the story?"],
      [600, "                          CUT TO:"],
    ];
    for (const [y, t] of lines) ctx.fillText(t, L, y);
    ctx.font = `400 14px "Courier New", ${FONT.mono}`;
    ctx.fillText("1.", w - 60, 40);
  });
}

/** A stripboard: one column per shoot day, coloured strips per scene type. */
export function stripboardTexture(days: number, seed = 3) {
  return canvasTexture(`strip:${days}:${seed}`, 1024, 512, (ctx, w, h) => {
    const r = rand(seed);
    ctx.fillStyle = "#121315";
    ctx.fillRect(0, 0, w, h);
    const colors = ["#f2efe6", "#f2d36b", "#7fb2e5", "#86c48a", "#e9e4d6"];
    const cols = 40;
    const cw = (w - 80) / cols;
    let day = 0;
    const perDay = Math.floor(cols / days);
    for (let i = 0; i < cols; i++) {
      const x = 40 + i * cw;
      if (i > 0 && i % perDay === 0 && day < days - 1) {
        day++;
        ctx.fillStyle = "#050505";
        ctx.fillRect(x, 70, cw * 0.9, h - 110);
        continue;
      }
      ctx.fillStyle = colors[Math.floor(r() * colors.length)];
      ctx.fillRect(x, 70, cw * 0.86, h - 110);
      ctx.fillStyle = "rgba(0,0,0,.25)";
      for (let k = 0; k < 6; k++) ctx.fillRect(x + 3, 90 + k * 22 + r() * 6, cw * 0.6, 3);
    }
    ctx.fillStyle = "#ece6da";
    ctx.font = `500 22px ${FONT.mono}`;
    for (let d = 0; d < days; d++) {
      spaced(ctx, `DAY ${String(d + 1).padStart(2, "0")}`, 40 + d * perDay * cw + 4, 44, 4);
    }
  });
}

/** A topographic location map with numbered pins and a route between them. */
export function mapTexture(pins: number, seed = 11, tint = "#d9a066") {
  return canvasTexture(`map:${pins}:${seed}:${tint}`, 1024, 768, (ctx, w, h) => {
    const r = rand(seed);
    ctx.fillStyle = "#1a1813";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(220,200,160,.14)";
    ctx.lineWidth = 1.2;
    for (let k = 0; k < 9; k++) {
      const cx = r() * w;
      const cy = r() * h;
      for (let ring = 1; ring < 9; ring++) {
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.15) {
          const rad = ring * 22 * (1 + 0.25 * Math.sin(a * 3 + k));
          const x = cx + Math.cos(a) * rad;
          const y = cy + Math.sin(a) * rad * 0.8;
          a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
    const pts = Array.from({ length: pins }, (_, i) => [120 + (i / Math.max(1, pins - 1)) * (w - 240) + (r() - 0.5) * 80, 140 + r() * (h - 280)]);
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = tint;
    ctx.lineWidth = 3;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
    ctx.setLineDash([]);
    pts.forEach(([x, y], i) => {
      ctx.fillStyle = tint;
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#111";
      ctx.font = `600 15px ${FONT.mono}`;
      ctx.textAlign = "center";
      ctx.fillText(String(i + 1).padStart(2, "0"), x, y + 5);
    });
    ctx.textAlign = "left";
    ctx.fillStyle = "#ece6da";
    ctx.font = `500 20px ${FONT.mono}`;
    spaced(ctx, `LOCATIONS — ${String(pins).padStart(2, "0")}`, 40, 50, 4);
  });
}

/** An abstract analysis screen: grid, a curve, bars — illustrative, with no figures. */
export function chartTexture(seed: number, tint = "#7fb2e5", title = "MODEL") {
  return canvasTexture(`chart:${seed}:${tint}:${title}`, 1024, 576, (ctx, w, h) => {
    const r = rand(seed);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#0b1322");
    g.addColorStop(1, "#060a12");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(160,190,230,.08)";
    for (let x = 60; x < w; x += 56) {
      ctx.beginPath();
      ctx.moveTo(x, 70);
      ctx.lineTo(x, h - 40);
      ctx.stroke();
    }
    for (let y = 70; y < h - 30; y += 48) {
      ctx.beginPath();
      ctx.moveTo(60, y);
      ctx.lineTo(w - 30, y);
      ctx.stroke();
    }
    // bars
    for (let i = 0; i < 16; i++) {
      const bh = 40 + r() * 180;
      ctx.fillStyle = `rgba(160,190,230,${0.12 + r() * 0.1})`;
      ctx.fillRect(80 + i * 56, h - 40 - bh, 30, bh);
    }
    // curve
    ctx.strokeStyle = tint;
    ctx.lineWidth = 4;
    ctx.beginPath();
    let y = h * 0.6;
    for (let x = 60; x < w - 30; x += 12) {
      y += (r() - 0.46) * 22;
      y = Math.max(110, Math.min(h - 80, y));
      x === 60 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.fillStyle = "#ece6da";
    ctx.font = `500 22px ${FONT.mono}`;
    spaced(ctx, title, 60, 44, 5);
    ctx.fillStyle = tint;
    ctx.fillRect(60, 56, 50, 3);
  });
}

/** Editing timeline UI for the edit bay. */
export function timelineTexture(seed = 5) {
  return canvasTexture(`timeline:${seed}`, 1024, 576, (ctx, w, h) => {
    const r = rand(seed);
    ctx.fillStyle = "#0d0e10";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#16181b";
    ctx.fillRect(20, 20, w * 0.62, h * 0.52);
    const g = ctx.createLinearGradient(20, 20, w * 0.62, h * 0.52);
    g.addColorStop(0, "#3a2c1e");
    g.addColorStop(1, "#0e1420");
    ctx.fillStyle = g;
    ctx.fillRect(28, 28, w * 0.62 - 16, h * 0.52 - 16);
    const tracks = ["V2", "V1", "A1", "A2", "A3"];
    tracks.forEach((t, i) => {
      const ty = h * 0.6 + i * 40;
      ctx.fillStyle = "#6b6f78";
      ctx.font = `500 14px ${FONT.mono}`;
      ctx.fillText(t, 26, ty + 20);
      let x = 70;
      while (x < w - 30) {
        const cw = 40 + r() * 140;
        ctx.fillStyle = i < 2 ? `hsl(${30 + r() * 20},45%,${38 + r() * 12}%)` : `hsl(150,30%,${28 + r() * 10}%)`;
        ctx.fillRect(x, ty + 4, Math.min(cw, w - 30 - x), 28);
        x += cw + 3;
      }
    });
    ctx.fillStyle = "#e2a25e";
    ctx.fillRect(w * 0.45, h * 0.57, 2, h * 0.43);
  });
}

/** Newsprint wall for the journalism chapter — headline, rules, column blocks. */
export function newsprintTexture(seed = 2) {
  return canvasTexture(`news:${seed}`, 768, 1024, (ctx, w, h) => {
    const r = rand(seed);
    ctx.fillStyle = "#dcd6c8";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#141414";
    ctx.font = `400 92px ${FONT.serif}`;
    ctx.textAlign = "center";
    ctx.fillText("The Story", w / 2, 120);
    ctx.textAlign = "left";
    ctx.fillRect(40, 150, w - 80, 3);
    ctx.fillRect(40, 158, w - 80, 1);
    const cols = 4;
    const cw = (w - 80 - (cols - 1) * 20) / cols;
    for (let c = 0; c < cols; c++) {
      let y = 190;
      while (y < h - 40) {
        if (r() < 0.08) {
          ctx.fillStyle = "rgba(20,20,20,.75)";
          ctx.fillRect(40 + c * (cw + 20), y, cw, 14);
          y += 26;
        }
        ctx.fillStyle = `rgba(20,20,20,${0.3 + r() * 0.15})`;
        ctx.fillRect(40 + c * (cw + 20), y, cw * (0.7 + r() * 0.3), 5);
        y += 13;
      }
    }
  });
}

/** Seamless concrete for the floor. */
export function concreteTexture() {
  return canvasTexture(
    "concrete",
    512,
    512,
    (ctx, w, h) => {
      const r = rand(42);
      ctx.fillStyle = "#808080";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 26000; i++) {
        const v = 110 + r() * 40;
        ctx.fillStyle = `rgba(${v},${v},${v},0.08)`;
        ctx.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
      }
      for (let i = 0; i < 40; i++) {
        const x = r() * w;
        const y = r() * h;
        const rad = 20 + r() * 70;
        const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
        const v = r() < 0.5 ? 0 : 255;
        g.addColorStop(0, `rgba(${v},${v},${v},0.05)`);
        g.addColorStop(1, `rgba(${v},${v},${v},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }
      // slab joints
      ctx.strokeStyle = "rgba(0,0,0,.25)";
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, w, h);
    },
    true,
  );
}

/** Soft radial blob — contact shadows and floor glows. */
export function radialTexture(inner = "rgba(0,0,0,0.65)", outer = "rgba(0,0,0,0)") {
  return canvasTexture(`radial:${inner}:${outer}`, 128, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, inner);
    g.addColorStop(1, outer);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

/** Vertical gradient (sky / hill layers / light falloff). */
export function gradientTexture(stops: [number, string][], key: string) {
  return canvasTexture(`grad:${key}`, 4, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    for (const [o, c] of stops) g.addColorStop(o, c);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

/** Lit window grid for city towers. */
export function windowsTexture(seed = 9) {
  return canvasTexture(
    `windows:${seed}`,
    256,
    512,
    (ctx, w, h) => {
      const r = rand(seed);
      ctx.fillStyle = "#06080d";
      ctx.fillRect(0, 0, w, h);
      for (let y = 6; y < h; y += 14) {
        for (let x = 6; x < w; x += 12) {
          if (r() < 0.38) {
            const warm = r() < 0.7;
            ctx.fillStyle = warm ? `rgba(255,${190 + r() * 40},${120 + r() * 50},${0.35 + r() * 0.6})` : `rgba(170,200,255,${0.25 + r() * 0.5})`;
            ctx.fillRect(x, y, 7, 8);
          }
        }
      }
    },
    true,
  );
}
