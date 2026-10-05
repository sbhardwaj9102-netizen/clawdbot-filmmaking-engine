"use client";

import { canvasTexture, FONT, rand, spaced } from "./canvasTextures";

/**
 * Canvas art for the two rooms. Illustrative only: the location map, the
 * louvre panels and the "why finance" display carry labels, never figures.
 */

/** Seven pin positions on the ASTER location map, in UV (0–1, v up). */
export const ASTER_PINS: [number, number][] = [
  [0.12, 0.62],
  [0.24, 0.36],
  [0.37, 0.7],
  [0.5, 0.44],
  [0.63, 0.74],
  [0.77, 0.38],
  [0.89, 0.6],
];

/** A topographic location map — contours, roads, a faint grid. Pins are 3D, added on top. */
export function routeMapTexture() {
  return canvasTexture("routemap", 1024, 768, (ctx, w, h) => {
    const r = rand(23);
    ctx.fillStyle = "#1b1914";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(220,200,160,.13)";
    ctx.lineWidth = 1.2;
    for (let k = 0; k < 10; k++) {
      const cx = r() * w;
      const cy = r() * h;
      for (let ring = 1; ring < 9; ring++) {
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.15) {
          const rad = ring * 20 * (1 + 0.25 * Math.sin(a * 3 + k));
          const x = cx + Math.cos(a) * rad;
          const y = cy + Math.sin(a) * rad * 0.8;
          if (a === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
    // roads
    ctx.strokeStyle = "rgba(236,230,218,.16)";
    ctx.lineWidth = 3;
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      let x = 0;
      let y = r() * h;
      ctx.moveTo(x, y);
      while (x < w) {
        x += 60;
        y += (r() - 0.5) * 70;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // grid
    ctx.strokeStyle = "rgba(236,230,218,.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    // faint numbered rings where the pins will land
    ASTER_PINS.forEach(([u, v], i) => {
      const x = u * w;
      const y = (1 - v) * h;
      ctx.strokeStyle = "rgba(217,160,102,.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(236,230,218,.55)";
      ctx.font = `500 18px ${FONT.mono}`;
      ctx.textAlign = "center";
      ctx.fillText(String(i + 1).padStart(2, "0"), x, y - 32);
    });
    ctx.textAlign = "left";
    ctx.fillStyle = "#ece6da";
    ctx.font = `500 22px ${FONT.mono}`;
    spaced(ctx, "ASTER — LOCATIONS", 36, 46, 5);
  });
}

/** The three faces of the louvre wall: production → business → finance. */
export function shiftTexture(kind: "production" | "business" | "finance") {
  return canvasTexture(`shift:${kind}`, 1536, 864, (ctx, w, h) => {
    const r = rand(kind === "production" ? 7 : kind === "business" ? 13 : 19);
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, kind === "production" ? "#17130f" : kind === "business" ? "#0f1420" : "#0b1018");
    bg.addColorStop(1, "#07080a");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    if (kind === "production") {
      // stripboard strips across the wall
      const colors = ["#f2efe6", "#f2d36b", "#7fb2e5", "#86c48a", "#e9e4d6", "#e9a96b"];
      const cw = 30;
      for (let x = 40; x < w - 40; x += cw + 6) {
        ctx.fillStyle = colors[Math.floor(r() * colors.length)];
        ctx.globalAlpha = 0.78;
        ctx.fillRect(x, 230, cw, h - 300);
        ctx.globalAlpha = 1;
        ctx.fillStyle = "rgba(0,0,0,.28)";
        for (let k = 0; k < 12; k++) ctx.fillRect(x + 4, 260 + k * 40 + r() * 10, cw * 0.6, 4);
      }
    } else if (kind === "business") {
      // cost bars on a grid
      ctx.strokeStyle = "rgba(160,190,230,.12)";
      for (let y = 240; y < h - 60; y += 64) {
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.lineTo(w - 40, y);
        ctx.stroke();
      }
      const n = 22;
      const bw = (w - 120) / n;
      for (let i = 0; i < n; i++) {
        const bh = 120 + r() * 420;
        ctx.fillStyle = i % 5 === 0 ? "#e2a25e" : `rgba(160,190,230,${0.35 + r() * 0.3})`;
        ctx.fillRect(60 + i * bw, h - 70 - bh, bw * 0.62, bh);
      }
    } else {
      // a rising line over an area, with a faint second series
      ctx.strokeStyle = "rgba(160,190,230,.1)";
      for (let x = 40; x < w; x += 96) {
        ctx.beginPath();
        ctx.moveTo(x, 220);
        ctx.lineTo(x, h - 60);
        ctx.stroke();
      }
      const pts: [number, number][] = [];
      let y = h - 160;
      for (let x = 40; x <= w - 40; x += 32) {
        y -= 6 + (r() - 0.35) * 26;
        y = Math.max(250, Math.min(h - 90, y));
        pts.push([x, y]);
      }
      const area = ctx.createLinearGradient(0, 250, 0, h);
      area.addColorStop(0, "rgba(143,184,255,.35)");
      area.addColorStop(1, "rgba(143,184,255,0)");
      ctx.fillStyle = area;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], h - 60);
      pts.forEach(([x, py]) => ctx.lineTo(x, py));
      ctx.lineTo(pts[pts.length - 1][0], h - 60);
      ctx.fill();
      ctx.strokeStyle = "#8fb8ff";
      ctx.lineWidth = 6;
      ctx.beginPath();
      pts.forEach(([x, py], i) => (i ? ctx.lineTo(x, py) : ctx.moveTo(x, py)));
      ctx.stroke();
      ctx.strokeStyle = "rgba(226,162,94,.8)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      pts.forEach(([x, py], i) => (i ? ctx.lineTo(x, py + 60 + Math.sin(i * 0.7) * 30) : ctx.moveTo(x, py + 60)));
      ctx.stroke();
    }

    const title = kind === "production" ? "PRODUCTION" : kind === "business" ? "BUSINESS" : "FINANCE";
    const sub =
      kind === "production" ? "SCHEDULE · LOCATIONS · CREW · EXECUTION" : kind === "business" ? "COST · OPERATIONS · MARKETS" : "BUDGETS · ANALYSIS · STRATEGY";
    ctx.fillStyle = "#ece6da";
    ctx.font = `400 120px ${FONT.serif}`;
    ctx.fillText(title.charAt(0) + title.slice(1).toLowerCase(), 60, 150);
    ctx.font = `500 26px ${FONT.mono}`;
    ctx.fillStyle = kind === "production" ? "#e2a25e" : "#8fb8ff";
    spaced(ctx, sub, 64, 200, 6);
  });
}

/** Layout of the chain on the strategist's display (shared with the 3D overlays). */
export const CHAIN = {
  w: 1792,
  h: 1008,
  words: ["Production", "Cost", "Operations", "Business", "Finance"],
  box: (i: number) => ({ x: 80 + i * 336, y: 380, w: 288, h: 200 }),
};

/** "Why finance": production → cost → operations → business → finance. `lit` draws the highlighted state. */
export function chainTexture(lit: boolean) {
  return canvasTexture(`chain:${lit}`, CHAIN.w, CHAIN.h, (ctx, w, h) => {
    if (!lit) {
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "#0d1422");
      bg.addColorStop(1, "#070a10");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#ece6da";
      ctx.font = `500 30px ${FONT.mono}`;
      spaced(ctx, "WHY FINANCE", 80, 120, 8);
      ctx.fillStyle = "rgba(236,230,218,.62)";
      ctx.font = `400 64px ${FONT.serif}`;
      ctx.fillText("Every creative decision has a cost.", 80, 220);
      ctx.font = `500 24px ${FONT.mono}`;
      ctx.fillStyle = "rgba(143,184,255,.8)";
      spaced(ctx, "FROM THE SET TO THE BALANCE SHEET", 80, h - 110, 6);
    } else {
      ctx.clearRect(0, 0, w, h);
    }
    CHAIN.words.forEach((word, i) => {
      const b = CHAIN.box(i);
      ctx.lineWidth = 3;
      if (lit) {
        ctx.fillStyle = i === CHAIN.words.length - 1 ? "rgba(143,184,255,.95)" : "rgba(226,162,94,.92)";
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = "#0b0b0d";
      } else {
        ctx.strokeStyle = "rgba(236,230,218,.28)";
        ctx.strokeRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = "rgba(236,230,218,.45)";
      }
      ctx.font = `500 22px ${FONT.mono}`;
      spaced(ctx, String(i + 1).padStart(2, "0"), b.x + 24, b.y + 44, 4);
      ctx.font = `400 50px ${FONT.serif}`;
      ctx.fillText(word, b.x + 24, b.y + b.h - 40);
      if (!lit && i < CHAIN.words.length - 1) {
        ctx.strokeStyle = "rgba(236,230,218,.35)";
        ctx.beginPath();
        const ax = b.x + b.w + 10;
        const ay = b.y + b.h / 2;
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax + 28, ay);
        ctx.lineTo(ax + 20, ay - 8);
        ctx.moveTo(ax + 28, ay);
        ctx.lineTo(ax + 20, ay + 8);
        ctx.stroke();
      }
    });
  });
}
