/**
 * Asset paths.
 *
 * Content files reference masters as `/assets/<folder>/<file>.jpg`.
 * - `asset()` prefixes the optional deploy sub-path (NEXT_PUBLIC_BASE_PATH).
 * - `tex()` points at the GPU-friendly copy written by scripts/optimize-textures.mjs,
 *   used for everything rendered inside the 3D world.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const asset = (path: string) => (path.startsWith("http") ? path : `${BASE_PATH}${path}`);

export const tex = (path: string) =>
  asset(path.replace(/^\/assets\//, "/tex/").replace(/\.png$/i, ".jpg"));
