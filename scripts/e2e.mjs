// End-to-end check of the built site (./out) in headless Chromium with software WebGL.
//
//   npm run build && npm run test:e2e
//
// Plays the real thing: landing → the tour (pause, skip, back, the whole film to
// the end card) → exit → Explore (every section, galleries, lightbox) → Quick
// view → resume → contact → sound → light/dark → deep links → static routes →
// phone → reduced motion → no WebGL → keyboard, and fails on any page error.
// Screenshots go to ./test-results. Uses `?quality=low&speed=12` so software
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
    results.push({ name, ok: true });
    console.log(`  ✓ ${name} (${((Date.now() - t) / 1000).toFixed(1)}s)`);
  } catch (e) {
    results.push({ name, ok: false });
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
    colorScheme: opts.scheme ?? "dark",
  });
  if (opts.noWebGL) {
    await context.addInitScript(() => {
      const get = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
        if (/webgl/i.test(String(type))) return null;
        return get.call(this, type, ...rest);
      };
    });
  }
  const page = await context.newPage();
  page.on("pageerror", (e) => pageErrors.push(`${opts.label ?? "page"}: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") pageErrors.push(`${opts.label ?? "page"} console: ${m.text()}`);
  });
  await page.goto(`${BASE}/${opts.path ?? ""}?quality=low&speed=12${opts.query ?? ""}${opts.hash ?? ""}`, { waitUntil: "load" });
  return { context, page };
}
const S = (page) => page.evaluate(() => window.__sb.store.getState());
const until = (page, fn, arg, timeout = 120000) => page.waitForFunction(fn, arg, { timeout, polling: 250 });
const shot = (page, name) => page.screenshot({ path: `${SHOTS}/${name}.png` });
const ready = (page) => until(page, () => window.__sb?.store.getState().stageReady || window.__sb?.store.getState().webgl === false);

console.log(`\nE2E against ${BASE}\n`);

// ── desktop: landing and the tour ───────────────────────────────
{
  const { context, page } = await open({ label: "desktop" });
  await check("1. landing: name, role, Take the tour, Explore, sound, theme, Quick view", async () => {
    for (const name of [/^Take the tour/, /^Explore$/, /^Sound off/, /^Switch to (light|dark) mode$/, /^Quick view$/]) {
      assert(await page.getByRole("button", { name }).first().isVisible(), `missing ${name}`);
    }
    assert(await page.getByRole("heading", { name: "Satyam Bhardwaj", level: 1 }).isVisible(), "name heading");
  });
  await check("2. the 3D stage loads (both rooms, Satyam and PA-1)", async () => {
    await ready(page);
    const ok = await page.evaluate(() => !!window.__sb3?.scene.getObjectByName("avatar") && !!window.__sb3?.scene.getObjectByName("robot"));
    assert(ok, "avatar / robot missing");
    await shot(page, "01-landing");
  });
  await check("3. Take the tour: the film starts with its title", async () => {
    await page.getByRole("button", { name: /^Take the tour/ }).click();
    await until(page, () => window.__sb.store.getState().mode === "tour");
    await until(page, () => window.__sb.store.getState().caption >= 0);
    assert((await S(page)).chapter === "intro", "not at intro");
    await shot(page, "02-tour-intro");
  });
  await check("4. pause freezes the film, play resumes it", async () => {
    await page.getByRole("button", { name: "Pause" }).click();
    const a = await page.evaluate(() => window.__sb.rt.chapterT);
    await page.waitForTimeout(1500);
    const b = await page.evaluate(() => window.__sb.rt.chapterT);
    assert(a === b && (await S(page)).paused, "clock moved while paused");
    await page.getByRole("button", { name: "Play" }).click();
    await until(page, (t) => window.__sb.rt.chapterT > t, b);
  });
  await check("5. skip and back move one chapter", async () => {
    const before = (await S(page)).chapter;
    await page.getByRole("button", { name: "Skip to the next part" }).click();
    await until(page, (c) => window.__sb.store.getState().chapter !== c, before);
    const after = (await S(page)).chapter;
    await page.getByRole("button", { name: "Previous part" }).click();
    await until(page, (c) => window.__sb.store.getState().chapter !== c, after);
  });
  await check("6. the whole film plays to the end card: 11 chapters, PA-1 speaks 8–12 times", async () => {
    await page.evaluate(() => {
      window.__seen = new Set([window.__sb.store.getState().chapter]);
      window.__lines = new Set();
      window.__sb.store.subscribe((s) => {
        window.__seen.add(s.chapter);
        if (s.robotLine) window.__lines.add(s.robotLine.text);
      });
      window.__sb.tour.start(0);
    });
    await until(page, () => window.__sb.store.getState().ended, null, 400000);
    const { seen, lines } = await page.evaluate(() => ({ seen: [...window.__seen], lines: [...window.__lines] }));
    assert(seen.length === 11, `chapters seen: ${seen.join(",")}`);
    assert(lines.length >= 8 && lines.length <= 12, `PA-1 lines: ${lines.length}`);
    await page.waitForTimeout(1500);
    await shot(page, "03-end-card");
  });
  await check("7. end card: Download resume, Contact Satyam, View work, Watch again", async () => {
    const href = await page.locator('[data-action="download-resume"]').getAttribute("href");
    const res = await page.request.get(BASE + href);
    assert(res.ok() && res.headers()["content-type"].includes("pdf"), "resume PDF");
    await page.locator('[data-action="contact-satyam"]').click();
    await until(page, () => window.__sb.store.getState().overlay === "contact");
    await page.keyboard.press("Escape");
    await until(page, () => window.__sb.store.getState().overlay === null);
    await page.locator('[data-action="view-work"]').click();
    await until(page, () => window.__sb.store.getState().mode === "explore" && window.__sb.store.getState().section === "work");
  });
  await check("8. exit the tour at any point → Explore, at the matching section", async () => {
    await page.evaluate(() => window.__sb.tour.start(0));
    await page.evaluate(() => window.__sb.tour.goTo("purple"));
    await page.getByRole("button", { name: /Exit tour/ }).click();
    await until(page, () => window.__sb.store.getState().mode === "explore");
    const s = await S(page);
    assert(s.section === "work" && s.work === "purple", `landed at ${s.section}/${s.work}`);
    assert((await page.evaluate(() => location.hash)) === "#work-purple", "hash");
  });
  await check("9. Explore: About · Work · Strategy · Contact, project tabs", async () => {
    for (const [section, heading] of [
      ["about", "Satyam Bhardwaj"],
      ["work", null],
      ["strategy", "Why finance"],
      ["contact", "Let's talk."],
    ]) {
      await page.locator(`[data-section="${section}"]`).click();
      await until(page, (s) => window.__sb.store.getState().section === s, section);
      if (heading) assert(await page.locator("#explore-title").textContent() === heading, `${section} heading`);
    }
    await page.locator('[data-section="work"]').click();
    for (const [id, title] of [
      ["aster", "ASTER"],
      ["purple", "Death at the House of Purple"],
      ["live", "Weddings and live events"],
      ["more", "RANA · GLUTTONY"],
    ]) {
      await page.locator(`[data-work="${id}"]`).click();
      await until(page, (w) => window.__sb.store.getState().work === w, id);
      assert((await page.locator("#explore-title").textContent()) === title, `${id} title`);
    }
    await shot(page, "04-explore-work");
  });
  await check("10. galleries open in the lightbox; Esc closes it", async () => {
    await page.locator('[data-work="aster"]').click();
    await page.getByRole("button", { name: /^View image/ }).first().click();
    await until(page, () => !!window.__sb.store.getState().lightbox);
    await page.keyboard.press("ArrowRight");
    await until(page, () => window.__sb.store.getState().lightbox?.index === 1);
    await page.keyboard.press("Escape");
    await until(page, () => !window.__sb.store.getState().lightbox);
  });
  await check("11. Quick view: About, Selected work, Resume, Skills, Education, Contact", async () => {
    await page.locator('[data-action="quick"]').click();
    await until(page, () => window.__sb.store.getState().overlay === "quick");
    for (const id of ["qv-about", "qv-work", "qv-resume", "qv-skills", "qv-education", "qv-contact"]) assert(await page.locator(`#${id}`).count(), `#${id}`);
    await shot(page, "05-quick-view");
    await page.getByRole("button", { name: "See it on set" }).nth(1).click();
    await until(page, () => window.__sb.store.getState().overlay === null && window.__sb.store.getState().work === "purple");
  });
  await check("12. Resume: the document, PDF one click away; Esc closes", async () => {
    await page.locator('[data-action="resume"]').click();
    await until(page, () => window.__sb.store.getState().overlay === "resume");
    assert(await page.getByRole("heading", { name: "Experience" }).isVisible(), "resume content");
    const href = await page.locator('[data-action="resume-pdf"]').getAttribute("href");
    assert((await page.request.get(BASE + href)).ok(), "PDF");
    await page.keyboard.press("Escape");
    await until(page, () => window.__sb.store.getState().overlay === null);
  });
  await check("13. Contact: email copies, WhatsApp opens a chat, phone dials", async () => {
    await page.locator('[data-action="contact"]').click();
    const dialog = page.getByRole("dialog", { name: "Contact Satyam" });
    await dialog.waitFor();
    await dialog.locator('[data-contact="email"]').evaluate((a) => a.addEventListener("click", (e) => e.preventDefault(), { once: true }));
    await dialog.locator('[data-contact="email"]').click();
    await page.waitForTimeout(300);
    assert((await page.evaluate(() => navigator.clipboard.readText())) === "mrbhardwaj2207@gmail.com", "email not copied");
    const wa = await dialog.locator('[data-contact="whatsapp"]').getAttribute("href");
    assert(/^https:\/\/wa\.me\/919102458875/.test(wa ?? ""), "WhatsApp link");
    assert((await dialog.locator('[data-contact="phone"]').getAttribute("href")) === "tel:+919102458875", "phone link");
    await page.keyboard.press("Escape");
  });
  await check("14. sound on/off (off by default, starts only on a click)", async () => {
    assert((await S(page)).sound === false, "sound on by default");
    await page.locator('header [data-action="sound"]').click();
    assert((await S(page)).sound === true, "sound did not turn on");
    await page.waitForTimeout(800);
    await page.locator('header [data-action="sound"]').click();
    assert((await S(page)).sound === false, "sound did not turn off");
  });
  await check("15. light / dark: switches, and is remembered after a reload", async () => {
    const before = await page.evaluate(() => document.documentElement.dataset.theme);
    await page.locator('header [data-action="theme"]').click();
    const after = await page.evaluate(() => document.documentElement.dataset.theme);
    assert(before !== after, "theme did not switch");
    await shot(page, "06-light");
    await page.reload({ waitUntil: "load" });
    assert((await page.evaluate(() => document.documentElement.dataset.theme)) === after, "theme not remembered");
    await page.evaluate(() => localStorage.removeItem("sb.theme"));
  });
  await check("16. PA-1's lines can be dismissed", async () => {
    await ready(page);
    await page.evaluate(() => window.__sb.tour.start(0));
    // at test speed a line is only up for a moment: hold the tour while one is showing
    let held = false;
    for (let k = 0; k < 4 && !held; k++) {
      await until(page, () => !!window.__sb.store.getState().robotLine, null, 60000);
      await page.evaluate(() => window.__sb.tour.pause());
      held = !!(await S(page)).robotLine;
      if (!held) await page.evaluate(() => window.__sb.tour.resume());
    }
    assert(held, "never caught a line on screen");
    // a plain mouse click on the button (the locator's actionability wait trips over software-rendered frames)
    const box = await page.evaluate(() => {
      const r = document.querySelector('[data-action="skip-line"]')?.getBoundingClientRect();
      return r && r.width ? { x: r.x, y: r.y, width: r.width, height: r.height } : null;
    });
    assert(box, `no skip button (${JSON.stringify(await page.evaluate(() => window.__sb.state()))})`);
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    assert(!(await S(page)).robotLine, "line still up");
    await page.evaluate(() => window.__sb.tour.resume());
  });
  await check("17. keyboard: Space pauses, → skips, Esc exits the tour", async () => {
    await page.evaluate(() => window.__sb.store.getState().mode === "tour" || window.__sb.tour.start(0));
    await page.evaluate(() => window.__sb.tour.resume());
    await page.locator("body").click({ position: { x: 900, y: 360 } });
    await page.keyboard.press("Space");
    assert((await S(page)).paused, "Space did not pause");
    await page.keyboard.press("Space");
    const c = (await S(page)).chapter;
    await page.keyboard.press("ArrowRight");
    await until(page, (c) => window.__sb.store.getState().chapter !== c, c);
    await page.keyboard.press("Escape");
    await until(page, () => window.__sb.store.getState().mode === "explore");
  });
  await context.close();
}

// ── deep links and static routes ────────────────────────────────
await check("18. deep links: #strategy, #work-live, ?go=rana, #tour", async () => {
  for (const [opts, expect] of [
    [{ hash: "#strategy" }, (s) => s.mode === "explore" && s.section === "strategy"],
    [{ hash: "#work-live" }, (s) => s.mode === "explore" && s.work === "live"],
    [{ query: "&go=rana" }, (s) => s.mode === "explore" && s.work === "more"],
    [{ hash: "#tour" }, (s) => s.mode === "tour"],
  ]) {
    const { context, page } = await open({ label: "deeplink", ...opts });
    await until(page, () => !!window.__sb);
    const s = await S(page);
    assert(expect(s), `${JSON.stringify(opts)} → ${s.mode}/${s.section}/${s.work}`);
    await context.close();
  }
});
{
  const { context, page } = await open({ label: "static", path: "quick/" });
  await check("19. /quick/, /resume/ and every /work/ page render; their links resolve", async () => {
    for (const [path, heading] of [
      ["/quick/", "Satyam Bhardwaj"],
      ["/resume/", "Satyam Bhardwaj"],
      ["/work/aster/", "ASTER"],
      ["/work/death-at-the-house-of-purple/", "DEATH AT THE HOUSE OF PURPLE"],
      ["/work/rana/", "RANA"],
      ["/work/gluttony/", "GLUTTONY"],
    ]) {
      await page.goto(BASE + path);
      assert(await page.getByRole("heading", { name: heading, level: 1 }).count(), `${path} heading`);
      const hrefs = await page.$$eval("a[href^='/']", (as) => as.map((a) => a.getAttribute("href")));
      for (const h of new Set(hrefs)) {
        const url = h.split("#")[0];
        if (!url) continue;
        assert((await page.request.get(BASE + url)).ok(), `${path} → broken link ${h}`);
      }
    }
  });
  await context.close();
}

// ── phone ───────────────────────────────────────────────────────
{
  const { context, page } = await open({ label: "mobile", mobile: true, viewport: { width: 390, height: 844 } });
  await check("20. phone: the tour and Explore are laid out for a small screen", async () => {
    await ready(page);
    await page.getByRole("button", { name: /^Take the tour/ }).tap();
    await until(page, () => window.__sb.store.getState().caption >= 0);
    const ctl = await page.getByRole("group", { name: "Tour controls" }).boundingBox();
    assert(ctl && ctl.y + ctl.height <= 844 && ctl.width <= 390, "controls off screen");
    await page.getByRole("button", { name: /Exit tour/ }).tap();
    await until(page, () => window.__sb.store.getState().mode === "explore");
    const nav = await page.getByRole("navigation", { name: "Sections" }).boundingBox();
    assert(nav && nav.y > 844 * 0.8, "section bar should sit at the bottom on a phone");
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    assert(width <= 390, `page scrolls sideways (${width}px)`);
    await shot(page, "07-mobile-explore");
  });
  await context.close();
}

// ── reduced motion ──────────────────────────────────────────────
{
  const { context, page } = await open({ label: "reduced", reduced: true });
  await check("21. reduced motion: detected; camera moves become cuts", async () => {
    await ready(page);
    assert((await S(page)).reducedMotion, "not detected");
    await page.getByRole("button", { name: /^Take the tour/ }).click();
    await until(page, () => window.__sb.store.getState().mode === "tour");
    await page.evaluate(() => window.__sb.tour.next());
    assert((await page.evaluate(() => window.__sb.rt.shot.blend)) === 0, "camera still moving");
  });
  await context.close();
}

// ── no WebGL ────────────────────────────────────────────────────
{
  const { context, page } = await open({ label: "nowebgl", noWebGL: true });
  await check("22. without WebGL the story still plays over still images", async () => {
    await until(page, () => window.__sb?.store.getState().webgl === false);
    await page.getByRole("button", { name: /^Take the tour/ }).click();
    await until(page, () => window.__sb.store.getState().chapter === "who", null, 60000);
    await page.getByRole("button", { name: /Exit tour/ }).click();
    await until(page, () => window.__sb.store.getState().mode === "explore");
    await shot(page, "08-no-webgl");
  });
  await context.close();
}

// ── keyboard from a cold start ──────────────────────────────────
{
  const { context, page } = await open({ label: "keyboard" });
  await check("23. keyboard only: Tab reaches the choices; Enter starts the tour", async () => {
    await ready(page);
    let found = false;
    for (let i = 0; i < 8 && !found; i++) {
      found = await page.evaluate(() => document.activeElement?.getAttribute("data-action") === "tour");
      if (!found) await page.keyboard.press("Tab");
    }
    assert(found, "Take the tour never received focus");
    await page.keyboard.press("Enter");
    await until(page, () => window.__sb.store.getState().mode === "tour");
  });
  await context.close();
}

await check("24. no page errors", async () => {
  assert(pageErrors.length === 0, pageErrors.slice(0, 5).join(" | "));
});

await browser.close();
server.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed. Screenshots: ./${SHOTS}\n`);
process.exit(failed.length ? 1 : 0);
