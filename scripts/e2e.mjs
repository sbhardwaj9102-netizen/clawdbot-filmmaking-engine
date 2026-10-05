// End-to-end check of the built site (./out) in headless Chromium with software WebGL.
//
//   npm run build && npm run test:e2e
//
// Walks the real experience: loader → intro → avatar walks → script → the three
// branches → a film's world → media → back → about → resume → contact → Quick
// Mode → mobile → reduced motion → keyboard, menu, continue, deep link, and
// fails on any page error.
// Screenshots go to ./test-results. Uses `?speed=8&quality=low` so software
// rendering finishes in minutes; the logic under test is the same.
import { createReadStream, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join } from "node:path";

const OUT = "out";
const SHOTS = "test-results";
mkdirSync(SHOTS, { recursive: true });
if (!existsSync(join(OUT, "index.html"))) {
  console.error("Build first: npm run build");
  process.exit(1);
}

// ── static server ───────────────────────────────────────────────
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".woff": "font/woff", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".png": "image/png", ".mp4": "video/mp4", ".pdf": "application/pdf", ".txt": "text/plain" };
const server = createServer((req, res) => {
  const p = decodeURIComponent((req.url ?? "/").split("?")[0]);
  let file = join(OUT, p);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!existsSync(file)) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const BASE = `http://localhost:${server.address().port}`;

function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const roots = [process.env.PLAYWRIGHT_BROWSERS_PATH, join(process.env.HOME ?? "", ".cache/ms-playwright"), "/opt/pw-browsers"].filter(Boolean);
  for (const root of roots) {
    if (!existsSync(root)) continue;
    for (const d of readdirSync(root).filter((d) => /^chromium-\d+/.test(d)).sort().reverse()) {
      for (const bin of ["chrome-linux/chrome", "chrome-linux64/chrome", "chrome-mac/Chromium.app/Contents/MacOS/Chromium", "chrome-win/chrome.exe"]) {
        const f = join(root, d, bin);
        if (existsSync(f)) return f;
      }
    }
  }
  return undefined;
}

const { chromium } = await import("playwright-core");
const browser = await chromium.launch({
  executablePath: findChromium(),
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});

// ── tiny harness ────────────────────────────────────────────────
const results = [];
const pageErrors = [];
async function check(name, fn) {
  const t = Date.now();
  try {
    await fn();
    results.push({ name, ok: true, ms: Date.now() - t });
    console.log(`  ✓ ${name} (${((Date.now() - t) / 1000).toFixed(1)}s)`);
  } catch (e) {
    results.push({ name, ok: false, err: String(e?.message ?? e).split("\n")[0] });
    console.log(`  ✗ ${name}\n      ${String(e?.message ?? e).split("\n")[0]}`);
  }
}
const assert = (c, msg) => {
  if (!c) throw new Error(msg);
};

async function open(opts = {}) {
  const context = await browser.newContext({
    permissions: ["clipboard-read", "clipboard-write"],
    viewport: opts.viewport ?? { width: 1280, height: 720 },
    isMobile: !!opts.mobile,
    hasTouch: !!opts.mobile,
    reducedMotion: opts.reduced ? "reduce" : "no-preference",
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => pageErrors.push(`${opts.label ?? "page"}: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") pageErrors.push(`${opts.label ?? "page"} console: ${m.text()}`);
  });
  await page.goto(`${BASE}/?quality=low&speed=8${opts.query ?? ""}`, { waitUntil: "load" });
  return { context, page };
}
const S = (page) => page.evaluate(() => window.__sb.store.getState());
const until = (page, fn, arg, timeout = 120000) => page.waitForFunction(fn, arg, { timeout, polling: 250 });
const shot = (page, name) => page.screenshot({ path: `${SHOTS}/${name}.png` });
async function enterExperience(page) {
  await until(page, () => window.__sb?.store.getState().phase === "ready", null, 120000);
  await page.getByRole("button", { name: /^Enter/ }).click();
}
async function walkToQuestion(page) {
  for (let i = 0; i < 60; i++) {
    const s = await S(page);
    if (s.questionOpen || s.transition) return;
    await page.mouse.move(640, 360);
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(350);
  }
  throw new Error("question never opened");
}

console.log(`\nE2E against ${BASE}\n`);

// ── desktop journey ─────────────────────────────────────────────
{
  const { context, page } = await open({ label: "desktop" });
  await check("1. site opens with the loader", async () => {
    await page.getByRole("button", { name: /^Enter/ }).waitFor({ timeout: 30000 });
    assert(await page.getByText("Quick mode").first().isVisible(), "quick mode shortcut missing on loader");
  });
  await check("2. loading completes (stage + fonts + studio prepared)", async () => {
    await until(page, () => window.__sb?.store.getState().phase === "ready");
    await shot(page, "01-loader");
  });
  await check("3. enter starts the opening", async () => {
    await page.getByRole("button", { name: /^Enter/ }).click();
    await until(page, () => window.__sb.store.getState().phase === "intro");
  });
  await check("4. avatar is in the world", async () => {
    const has = await page.evaluate(() => !!window.__sb3?.scene.getObjectByName("avatar"));
    assert(has, "avatar not found in scene");
    await until(page, () => window.__sb.store.getState().phase === "explore");
    await shot(page, "02-arrival");
  });
  let p0;
  await check("5. scrolling walks the avatar", async () => {
    p0 = (await page.evaluate(() => window.__sb.state())).pos;
    await page.mouse.move(640, 360);
    for (let i = 0; i < 6; i++) {
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(250);
    }
    await page.waitForTimeout(1500);
    const p1 = (await page.evaluate(() => window.__sb.state())).pos;
    assert(Math.hypot(p1[0] - p0[0], p1[2] - p0[2]) > 1, `avatar did not move (${p0} → ${p1})`);
  });
  await check("6. camera follows the avatar", async () => {
    const st = await page.evaluate(() => window.__sb.state());
    const d = Math.hypot(st.cam[0] - st.pos[0], st.cam[2] - st.pos[2]);
    assert(d < 9 && d > 1.5, `camera ${d.toFixed(1)}m from avatar`);
  });
  await check("7. the script moment plays and the question opens", async () => {
    await walkToQuestion(page);
    const s = await S(page);
    assert(s.worldEvents["script-glow"] && s.worldEvents["reveal-choices"], "script beats did not fire");
    await page.waitForTimeout(1200);
    await shot(page, "03-question");
  });
  await check("8. choices are presented in the world (MAKE / FINANCE / BUILD)", async () => {
    for (const id of ["make", "finance", "build"]) assert(await page.locator(`button[data-choice="${id}"]`).count(), `choice ${id} missing`);
  });
  await check("9. MAKE IT → film world via the corridor", async () => {
    await page.locator('button[data-choice="make"]').click({ force: true });
    await until(page, () => !!window.__sb.store.getState().corridor);
    await page.waitForTimeout(800);
    await shot(page, "04-corridor");
    await until(page, () => window.__sb.store.getState().currentScene === "film" && !window.__sb.store.getState().transition);
    await page.waitForTimeout(800);
    await shot(page, "05-film");
  });
  await check("12. a film's monitor dives into its world (ASTER)", async () => {
    await page.evaluate(() => window.__sb.engine.openHotspot("monitor-aster"));
    await until(page, () => !!window.__sb.store.getState().dive);
    await until(page, () => window.__sb.store.getState().currentScene === "aster" && !window.__sb.store.getState().transition);
    await page.waitForTimeout(1000);
    await shot(page, "06-aster");
    const s = await S(page);
    assert(s.selectedProjects.includes("aster"), "selectedProjects not recorded");
  });
  await check("13. project media opens (stills → lightbox)", async () => {
    await page.evaluate(() => window.__sb.engine.openHotspot("aster-stills"));
    await until(page, () => window.__sb.store.getState().hotspot?.status === "open");
    await page.locator('aside[role="dialog"] ul li button').first().click();
    await until(page, () => !!window.__sb.store.getState().lightbox);
    await shot(page, "07-lightbox");
    await page.keyboard.press("Escape");
    await until(page, () => !window.__sb.store.getState().lightbox);
    await page.keyboard.press("Escape");
    await until(page, () => !window.__sb.store.getState().hotspot);
  });
  await check("14. back returns to the film set, at the monitor", async () => {
    await page.getByRole("button", { name: "← Back" }).click();
    await until(page, () => window.__sb.store.getState().currentScene === "film" && !window.__sb.store.getState().transition);
  });
  await check("15. about works", async () => {
    await page.evaluate(() => window.__sb.engine.jump("about"));
    await until(page, () => window.__sb.store.getState().currentScene === "about" && !window.__sb.store.getState().transition);
    await page.evaluate(() => window.__sb.engine.openHotspot("about-screen"));
    await until(page, () => window.__sb.store.getState().hotspot?.status === "open");
    assert(await page.getByRole("heading", { name: "Satyam Bhardwaj" }).count(), "about panel missing name");
    await shot(page, "08-about");
    await page.keyboard.press("Escape");
  });
  await check("16. resume opens from the desk, PDF downloadable", async () => {
    await page.evaluate(() => window.__sb.engine.openHotspot("about-resume"));
    await until(page, () => window.__sb.store.getState().overlay === "resume");
    await shot(page, "09-resume");
    const href = await page.locator('a[download]').first().getAttribute("href");
    const res = await page.request.get(`${BASE}${href}`);
    assert(res.status() === 200 && (res.headers()["content-type"] ?? "").includes("pdf"), `resume PDF ${res.status()}`);
    await page.keyboard.press("Escape");
  });
  await check("17a. Contact button opens the contact card: email copies, WhatsApp opens a chat", async () => {
    await page.locator('button[data-shortcut="contact"]').click();
    await until(page, () => window.__sb.store.getState().contactOpen);
    const card = page.locator('section[role="dialog"]');
    const wa = await card.locator('a[data-contact="whatsapp"]').getAttribute("href");
    assert(wa?.startsWith("https://wa.me/") && (await card.locator('a[data-contact="whatsapp"]').getAttribute("target")) === "_blank", `whatsapp link ${wa}`);
    assert((await card.locator('a[data-contact="email"]').getAttribute("href"))?.startsWith("mailto:"), "email link");
    await card.locator('a[data-contact="email"]').click();
    await card.getByText(/Copied/).waitFor({ timeout: 10000 });
    const clip = await page.evaluate(() => navigator.clipboard.readText().catch(() => ""));
    assert(clip.includes("@"), `clipboard has "${clip}"`);
    await shot(page, "09b-contact-button");
    await card.getByRole("button", { name: "Back to the story" }).click();
    await until(page, () => !window.__sb.store.getState().contactOpen);
  });
  await check("17. contact: the final door → contact card", async () => {
    await page.evaluate(() => window.__sb.engine.jump("final"));
    await until(page, () => window.__sb.store.getState().contactOpen, null, 180000);
    await page.waitForTimeout(3000);
    await shot(page, "10-contact");
    const mail = await page.locator('section[role="dialog"] a[href^="mailto:"]').getAttribute("href");
    assert(mail?.includes("@"), "no email link");
    assert(await page.locator('section[role="dialog"] a[data-contact="whatsapp"]').count(), "no WhatsApp link");
  });
  await check("18. Quick Mode opens over the experience", async () => {
    // from the contact card (the control bar steps aside while it is up)
    await page.locator('section[role="dialog"]').getByRole("button", { name: "Quick mode" }).click();
    await until(page, () => window.__sb.store.getState().overlay === "quick");
    for (const id of ["work", "experience", "capabilities", "about", "resume", "contact"]) assert(await page.locator(`#${id}`).count(), `section #${id} missing`);
    await shot(page, "11-quick");
  });
  await context.close();
}

// ── the other two branches ──────────────────────────────────────
for (const [option, scene, n] of [
  ["finance", "finance", "10"],
  ["build", "business", "11"],
]) {
  const { context, page } = await open({ label: option });
  await check(`${n}. ${option.toUpperCase()} IT → ${scene} world`, async () => {
    await enterExperience(page);
    await until(page, () => window.__sb.store.getState().phase === "explore");
    await walkToQuestion(page);
    await page.locator(`button[data-choice="${option}"]`).click({ force: true });
    await until(page, (sc) => window.__sb.store.getState().currentScene === sc && !window.__sb.store.getState().transition, scene);
    await page.waitForTimeout(1000);
    await shot(page, `12-${scene}`);
  });
  await context.close();
}

// ── static pages ────────────────────────────────────────────────
{
  const { context, page } = await open({ label: "static" });
  await check("18b. /quick and /resume pages render", async () => {
    await page.goto(`${BASE}/quick/`);
    assert(await page.getByRole("heading", { name: "Satyam Bhardwaj", level: 1 }).count(), "quick page heading");
    await page.goto(`${BASE}/resume/`);
    assert(await page.getByRole("heading", { name: "Experience" }).count(), "resume page");
    await page.goto(`${BASE}/work/aster/`);
    assert(await page.getByRole("heading", { name: "ASTER" }).count(), "work page");
  });
  await context.close();
}

// ── mobile ──────────────────────────────────────────────────────
{
  const { context, page } = await open({ label: "mobile", mobile: true, viewport: { width: 390, height: 844 } });
  await check("19. mobile: enter, swipe to walk, choose with large buttons", async () => {
    await enterExperience(page);
    await until(page, () => window.__sb.store.getState().phase === "explore");
    const p0 = (await page.evaluate(() => window.__sb.state())).pos;
    for (let i = 0; i < 30; i++) {
      const s = await S(page);
      if (s.questionOpen) break;
      await page.evaluate(() => {
        const t = (y) => new Touch({ identifier: 1, target: document.body, clientX: 195, clientY: y });
        document.body.dispatchEvent(new TouchEvent("touchstart", { touches: [t(700)], bubbles: true }));
        for (let y = 700; y >= 200; y -= 50) window.dispatchEvent(new TouchEvent("touchmove", { touches: [t(y)], bubbles: true, cancelable: true }));
        window.dispatchEvent(new TouchEvent("touchend", { touches: [], bubbles: true }));
      });
      await page.waitForTimeout(500);
    }
    const p1 = (await page.evaluate(() => window.__sb.state())).pos;
    assert(Math.hypot(p1[0] - p0[0], p1[2] - p0[2]) > 1, "swipe did not walk");
    await until(page, () => window.__sb.store.getState().questionOpen);
    await page.waitForTimeout(1000);
    await shot(page, "13-mobile-question");
    const btn = page.locator('button[data-option="make"]');
    assert(await btn.isVisible(), "mobile choice buttons not visible");
    await btn.click();
    await until(page, () => window.__sb.store.getState().currentScene === "film");
    await page.waitForTimeout(1500);
    await shot(page, "14-mobile-film");
  });
  await context.close();
}

// ── reduced motion ──────────────────────────────────────────────
{
  const { context, page } = await open({ label: "reduced", reduced: true });
  await check("20. reduced motion: preference detected, travel becomes a cut", async () => {
    await enterExperience(page);
    await until(page, () => window.__sb.store.getState().phase === "explore");
    assert((await S(page)).reducedMotion, "reducedMotion not set");
    await walkToQuestion(page);
    await page.evaluate(() => window.__sb.engine.choose("after-story", "finance"));
    await until(page, () => window.__sb.store.getState().transition);
    const kind = (await S(page)).transition.kind;
    assert(kind === "cut", `transition was ${kind}`);
    await until(page, () => window.__sb.store.getState().currentScene === "finance" && !window.__sb.store.getState().transition);
  });
  await context.close();
}

// ── keyboard, menu, returning visitor, deep link ────────────────
{
  const { context, page } = await open({ label: "returning" });
  await check("20b. keyboard: ↓ walks, Tab reaches the objects, Esc closes", async () => {
    await enterExperience(page);
    await until(page, () => window.__sb.store.getState().phase === "explore");
    const u0 = (await page.evaluate(() => window.__sb.state())).u;
    await page.keyboard.down("ArrowDown");
    await page.waitForTimeout(1200);
    await page.keyboard.up("ArrowDown");
    await page.waitForTimeout(400);
    assert((await page.evaluate(() => window.__sb.state())).u > u0, "ArrowDown did not walk");
    let inList = false;
    for (let i = 0; i < 30 && !inList; i++) {
      await page.keyboard.press("Tab");
      inList = await page.evaluate(() => !!document.activeElement?.closest('nav[aria-label="Objects in this space"]'));
    }
    assert(inList, "Tab never reached the object list");
    await page.keyboard.press("Enter");
    await until(page, () => !!window.__sb.store.getState().hotspot);
    for (let i = 0; i < 3; i++) {
      const s = await S(page);
      if (!s.hotspot && !s.overlay) break;
      await page.keyboard.press("Escape");
      await page.waitForTimeout(400);
    }
    const s = await S(page);
    assert(!s.hotspot && !s.overlay, "Esc did not close the object");
  });
  await check("20c. Menu jumps to a world", async () => {
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("dialog", { name: "Menu" }).getByRole("button", { name: /^Finance/ }).click();
    await until(page, () => window.__sb.store.getState().currentScene === "finance" && !window.__sb.store.getState().transition);
  });
  await check("20d. a returning visitor continues where they left off", async () => {
    await page.waitForTimeout(500);
    await page.reload({ waitUntil: "load" });
    const cont = page.getByRole("button", { name: /^Continue where you left off/ });
    await cont.waitFor({ timeout: 60000 });
    await until(page, () => window.__sb?.store.getState().phase === "ready");
    await cont.click();
    await until(page, () => window.__sb.store.getState().phase === "explore");
    const s = await S(page);
    assert(s.currentScene === "finance", `continued at ${s.currentScene}`);
    assert(s.visitedScenes.includes("finance"), "visited scenes not restored");
  });
  await context.close();
}
{
  const { context, page } = await open({ label: "deeplink", query: "&go=rana" });
  await check("20e. a deep link (/?go=rana) enters at that film", async () => {
    await until(page, () => window.__sb?.store.getState().phase === "ready");
    await page.getByRole("button", { name: "Enter at RANA" }).click();
    await until(page, () => window.__sb.store.getState().phase === "explore");
    assert((await S(page)).currentScene === "rana", "not in RANA");
    await page.waitForTimeout(1200);
    await shot(page, "15-deeplink-rana");
  });
  await context.close();
}

await check("21. no page errors", async () => {
  assert(pageErrors.length === 0, pageErrors.slice(0, 5).join(" | "));
});

await browser.close();
server.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed. Screenshots: ./${SHOTS}\n`);
process.exit(failed.length ? 1 : 0);
