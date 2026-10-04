// Turns the static export in ./out into a fully relative, host-anywhere copy
// in ./out-preview — it works from any sub-path or folder, not just a domain
// root. Pages are linked with full page loads (see TransitionProvider).
//
//   npm run build:preview
import { cpSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const SRC = "out";
const DST = "out-preview";

rmSync(DST, { recursive: true, force: true });
cpSync(SRC, DST, { recursive: true });
// Some hosts reserve names starting with "_", so `_next/` becomes `nx/`.
renameSync(join(DST, "_next"), join(DST, "nx"));

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const files = walk(DST);

for (const file of files) {
  const rel = relative(DST, file).split(sep).join("/");

  if (rel.endsWith(".html")) {
    const depth = rel.split("/").length - 1;
    const base = depth ? "../".repeat(depth) : "./";
    const route = rel === "index.html" ? "/" : `/${rel.replace(/\/?index\.html$/, "")}`;
    let html = readFileSync(file, "utf8");
    // asset + chunk references (plain attributes and the escaped RSC payload)
    html = html.replace(/(["'(]|\\")\/_next\//g, `$1${base}nx/`);
    html = html.replace(/(["'(]|\\")\/assets\//g, `$1${base}assets/`);
    html = html.replace(/(["']|\\")\/icon\.svg/g, `$1${base}icon.svg`);
    // internal links → relative index.html files
    html = html.replace(/href="\/(work\/[^"#]+?)\/?"/g, `href="${base}$1/index.html"`);
    html = html.replace(/href="\/(#[^"]*)?"/g, (_, hash = "") => `href="${base}index.html${hash}"`);
    const boot =
      `<script>window.__B=${JSON.stringify(base)};window.__ROUTE=${JSON.stringify(route)};` +
      `window.TURBOPACK_CHUNK_BASE_PATH=${JSON.stringify(base + "nx/")};</script>`;
    html = html.replace(/<head>/, `<head>${boot}`);
    writeFileSync(file, html);
  } else if (rel.endsWith(".js")) {
    const js = readFileSync(file, "utf8");
    const out = js.replace(/"\/assets\//g, '(window.__B||"/")+"assets/').replace(/\/_next\//g, "/nx/")
      // literal U+FFFD in library code → the equivalent JS escape (some hosts reject the raw character)
      .replace(/\uFFFD/g, "\\uFFFD");
    if (out !== js) writeFileSync(file, out);
  } else if (rel.endsWith(".css")) {
    const depth = rel.split("/").length - 1;
    const css = readFileSync(file, "utf8");
    const out = css.replace(/url\((["']?)\/assets\//g, `url($1${"../".repeat(depth)}assets/`);
    if (out !== css) writeFileSync(file, out);
  }
}

console.log(`static preview written to ./${DST} (${files.length} files)`);
