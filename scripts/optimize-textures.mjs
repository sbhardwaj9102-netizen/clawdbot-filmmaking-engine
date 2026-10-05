// Builds GPU-friendly copies of every still in public/assets → public/tex.
//
// The 3D world samples images as textures, which never needs the 2000–2400px
// masters used by Quick Mode and the lightbox. This writes 1280px (covers) /
// 1024px (everything else) JPEGs with the same relative paths, so
//   /assets/aster/cover.jpg  →  /tex/aster/cover.jpg
//
// Runs automatically before `npm run build` and `npm run dev`. Only stale files are
// rebuilt; pass --force to rebuild everything. If `sharp` is unavailable the
// originals are copied instead so a build never fails because of this step.
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";

const SRC = "public/assets";
const DST = "public/tex";
const force = process.argv.includes("--force");

let sharp = null;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.warn("[textures] sharp not installed — copying originals instead.");
}

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const files = walk(SRC).filter((f) => /\.(jpe?g|png)$/i.test(f) && !f.includes("grain"));
let built = 0;

for (const file of files) {
  const rel = relative(SRC, file);
  const out = join(DST, rel).replace(/\.png$/i, ".jpg");
  if (!force && existsSync(out) && statSync(out).mtimeMs >= statSync(file).mtimeMs) continue;
  mkdirSync(dirname(out), { recursive: true });
  if (!sharp) {
    copyFileSync(file, out);
  } else {
    const width = /cover|hero/.test(rel) ? 1280 : 1024;
    await sharp(file)
      .resize({ width, height: width, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 74, mozjpeg: true })
      .toFile(out);
  }
  built++;
}

console.log(`[textures] ${built} built, ${files.length - built} up to date → ${DST}/`);
