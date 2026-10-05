// Renders the /resume page of the built site to public/resume/Satyam-Bhardwaj-Resume.pdf.
//
//   npm run build && npm run resume:pdf && npm run build
//
// (The second build copies the fresh PDF into ./out.) The resume content comes
// from src/data/profile.ts, so the PDF never drifts from the site.
//
// Needs a Chromium: set CHROMIUM_PATH, or have Playwright browsers installed.
import { createReadStream, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join } from "node:path";

const OUT = "out";
const DEST = "public/resume/Satyam-Bhardwaj-Resume.pdf";

if (!existsSync(join(OUT, "resume", "index.html"))) {
  console.error("[resume:pdf] ./out/resume/index.html not found — run `npm run build` first.");
  process.exit(1);
}

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".woff": "font/woff", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".png": "image/png", ".txt": "text/plain" };
const server = createServer((req, res) => {
  let p = decodeURIComponent((req.url ?? "/").split("?")[0]);
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
const port = server.address().port;

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
const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage();
await page.goto(`http://localhost:${port}/resume/`, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
mkdirSync("public/resume", { recursive: true });
await page.pdf({ path: DEST, format: "A4", printBackground: true, preferCSSPageSize: true });
await browser.close();
server.close();
console.log(`[resume:pdf] wrote ${DEST}`);
