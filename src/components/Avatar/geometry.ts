import { LatheGeometry, MeshPhysicalMaterial, MeshStandardMaterial, Vector2 } from "three";

/**
 * Avatar geometry & materials — a 1.80 m figure built from lathed, tapered
 * forms (no external model needed). Dark contemporary clothing: an unstructured
 * charcoal jacket, dark navy crew-neck, near-black trousers, black leather shoes.
 */

/** Tapered capsule hanging down from its top joint (length = joint to joint). */
export function limb(rTop: number, rBottom: number, length: number, segments = 14) {
  const capTop = 6;
  const out: Vector2[] = [];
  // top cap (from pole down to equator)
  for (let i = 0; i <= capTop; i++) {
    const a = (i / capTop) * (Math.PI / 2);
    out.push(new Vector2(Math.sin(a) * rTop, Math.cos(a) * rTop * 0.85));
  }
  // shaft with a soft muscle bulge
  const steps = 8;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const r = rTop + (rBottom - rTop) * t + Math.sin(t * Math.PI) * (rTop - rBottom) * 0.25;
    out.push(new Vector2(r, -length * t));
  }
  // bottom cap
  for (let i = 0; i <= capTop; i++) {
    const a = (i / capTop) * (Math.PI / 2);
    out.push(new Vector2(Math.cos(a) * rBottom, -length - Math.sin(a) * rBottom * 0.85));
  }
  // LatheGeometry expects the profile bottom → top for outward-facing normals.
  return new LatheGeometry(out.reverse(), segments);
}

/** Jacket torso: hem → waist → chest → shoulders → collar. */
export function torso() {
  const p = [
    [0.0, -0.24],
    [0.178, -0.235],
    [0.182, -0.12],
    [0.168, 0.0],
    [0.172, 0.1],
    [0.188, 0.22],
    [0.198, 0.31],
    [0.196, 0.37],
    [0.175, 0.415],
    [0.13, 0.445],
    [0.075, 0.468],
    [0.06, 0.475],
    [0.0, 0.475],
  ].map(([x, y]) => new Vector2(x, y));
  const g = new LatheGeometry(p, 28);
  g.scale(1, 1, 0.64);
  return g;
}

/** Trouser seat / pelvis. */
export function pelvis() {
  const p = [
    [0.0, -0.13],
    [0.12, -0.125],
    [0.165, -0.06],
    [0.17, 0.04],
    [0.16, 0.11],
    [0.0, 0.11],
  ].map(([x, y]) => new Vector2(x, y));
  const g = new LatheGeometry(p, 22);
  g.scale(1, 1, 0.7);
  return g;
}

/** Head: a slightly long ovoid with a defined jaw. */
export function head() {
  const p = [
    [0.0, -0.118],
    [0.04, -0.116],
    [0.066, -0.098],
    [0.08, -0.06],
    [0.088, -0.01],
    [0.094, 0.04],
    [0.092, 0.08],
    [0.078, 0.112],
    [0.05, 0.13],
    [0.0, 0.136],
  ].map(([x, y]) => new Vector2(x, y));
  const g = new LatheGeometry(p, 24);
  g.scale(1, 1, 1.1);
  return g;
}

export function hair() {
  // bottom → top (outward normals)
  const p = [
    [0.0, -0.012],
    [0.097, -0.012],
    [0.103, 0.03],
    [0.103, 0.075],
    [0.091, 0.118],
    [0.057, 0.143],
    [0.0, 0.148],
  ].map(([x, y]) => new Vector2(x, y));
  const g = new LatheGeometry(p, 24);
  g.scale(1, 1, 1.14);
  return g;
}

export const AVATAR_MATERIALS = () => ({
  jacket: new MeshPhysicalMaterial({
    color: "#22252b",
    roughness: 0.82,
    metalness: 0,
    sheen: 0.6,
    sheenRoughness: 0.55,
    sheenColor: "#5b6170",
  }),
  shirt: new MeshPhysicalMaterial({ color: "#141b2a", roughness: 0.9, sheen: 0.4, sheenColor: "#3a4660" }),
  trousers: new MeshPhysicalMaterial({
    color: "#131417",
    roughness: 0.85,
    sheen: 0.45,
    sheenRoughness: 0.6,
    sheenColor: "#43474f",
  }),
  skin: new MeshStandardMaterial({ color: "#8a5a40", roughness: 0.55, metalness: 0 }),
  hair: new MeshStandardMaterial({ color: "#0c0a09", roughness: 0.65, metalness: 0 }),
  shoes: new MeshStandardMaterial({ color: "#09090a", roughness: 0.32, metalness: 0.15 }),
  watch: new MeshStandardMaterial({ color: "#6b6e73", roughness: 0.3, metalness: 0.9 }),
});
