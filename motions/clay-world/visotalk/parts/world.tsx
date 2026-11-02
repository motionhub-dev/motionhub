// The clay world every Clay World component stands in: one three.js scene per scene, lit like a tabletop set (a warm soft key, a cool rim,
// a sky-and-floor fill), with a backdrop that curves up from the floor so the world has no horizon. Every frame is drawn from the clock and
// the props in a layout effect; a component adds its forms with `useClay` and sets them while it renders, so the world draws once, last.
// The helpers below (the clay material, the thumbprinted bump, the hand-made wobble, squash and landing) are shared by every component.
import React, {createContext, useContext, useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {useCanvas, useDocTime, useFrame, useTheme, random} from '@visotalk/runtime';

export const meta = {
  name: {en: 'Clay world', 'zh-CN': '黏土小世界'},
  purpose: 'ground',
  line: 'A small tabletop set of matte clay under soft studio light, one camera orbiting and dollying, a sun that can circle it; every component stands in it.',
  fits: 'every scene, one per scene: tween yaw to turn, dist to push in, sun for days passing, shake on an impact',
  params: {
    yaw: {type: 'number', default: 0, doc: 'degrees the camera has turned round the set; positive turns to the right'},
    pitch: {type: 'number', default: 22, doc: 'degrees the camera looks down from level'},
    dist: {type: 'number', default: 40, doc: 'how far the camera is from what it looks at, in clay units (a ball is 2 to 6)'},
    tx: {type: 'number', default: 0, doc: 'what the camera looks at, across'},
    ty: {type: 'number', default: 4, doc: 'what the camera looks at, up'},
    tz: {type: 'number', default: 0, doc: 'what the camera looks at, towards the camera'},
    fov: {type: 'number', default: 26, doc: 'the lens: smaller is longer and flatter'},
    floor: {type: 'text', default: 'panel', doc: 'the floor clay: a colour token (panel, warn, good …) or a hex'},
    wall: {type: 'text', default: 'bg', doc: 'the backdrop clay the floor curves up into: a token or a hex'},
    sun: {type: 'number', default: 0, doc: 'degrees the key light has swung round the set: it dips low and warm half way round; tween it through whole turns for days passing'},
    shake: {type: 'progress', default: 0, doc: 'a jolt of the camera on an impact: tween it to 1 on the landing and back to 0 over about half a second'},
    island: {type: 'number', default: 0, doc: 'radius of a round clay base the scene stands on; 0 for the open floor'},
    base: {type: 'text', default: 'good', doc: 'the clay of the island: a token or a hex'},
  },
  preview: 20.8,
};

// ── numbers ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const unit = (v: number) => Math.max(0, Math.min(1, v));
export const mix = (a: number, b: number, k: number) => a + (b - a) * k;
export const smooth = (v: number) => {
  const k = unit(v);
  return k * k * (3 - 2 * k);
};
const DEG = Math.PI / 180;

/** Smooth 3D value noise in -1..1, the same for the same seed on every machine */
function noise3(seed: number) {
  const hash = (x: number, y: number, z: number) => {
    let h = (x * 374761393 + y * 668265263 + z * 2147483647 + seed * 144269) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295 * 2 - 1;
  };
  return (x: number, y: number, z: number) => {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const f = (v: number) => v * v * (3 - 2 * v);
    const u = f(x - xi), v = f(y - yi), w = f(z - zi);
    const c = (dx: number, dy: number, dz: number) => hash(xi + dx, yi + dy, zi + dz);
    return mix(
      mix(mix(c(0, 0, 0), c(1, 0, 0), u), mix(c(0, 1, 0), c(1, 1, 0), u), v),
      mix(mix(c(0, 0, 1), c(1, 0, 1), u), mix(c(0, 1, 1), c(1, 1, 1), u), v), w);
  };
}
export const seedOf = (key: string) => Math.floor(random(key)() * 1e6);

// ── the clay ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * The surface every form shares, as a bump map: broad soft pressure from fingers, a few whorls of fingerprint where a thumb smoothed it,
 * and fine pits. Drawn once on a canvas from a fixed seed.
 */
let THUMB: THREE.CanvasTexture | null = null;
function thumbprints(): THREE.CanvasTexture {
  if (THUMB) return THUMB;
  const N = 1024, c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d')!;
  const r = random('clay-world/thumbprints');
  g.fillStyle = 'rgb(128,128,128)';
  g.fillRect(0, 0, N, N);
  // draw each mark three times across the seam, so the texture tiles
  const around = (fn: (ox: number, oy: number) => void) => { for (const ox of [-N, 0, N]) for (const oy of [-N, 0, N]) fn(ox, oy); };
  for (let i = 0; i < 70; i++) {          // pressure: broad, soft hollows and swells
    const x = r() * N, y = r() * N, rad = 40 + r() * 140, up = r() < 0.5, a = 0.05 + r() * 0.08;
    around((ox, oy) => {
      const grd = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, rad);
      grd.addColorStop(0, up ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`);
      grd.addColorStop(1, 'rgba(128,128,128,0)');
      g.fillStyle = grd;
      g.fillRect(x + ox - rad, y + oy - rad, rad * 2, rad * 2);
    });
  }
  for (let i = 0; i < 14; i++) {          // thumbprints: concentric ridges, faint
    const x = r() * N, y = r() * N, rx = 40 + r() * 30, ry = rx * (0.62 + r() * 0.2), rot = r() * Math.PI;
    around((ox, oy) => {
      g.save();
      g.translate(x + ox, y + oy);
      g.rotate(rot);
      for (let k = 3; k < rx; k += 3.2) {
        g.strokeStyle = `rgba(0,0,0,${0.3 * (1 - k / rx) + 0.08})`;
        g.lineWidth = 1.3;
        g.beginPath();
        g.ellipse(0, 0, k, k * ry / rx, 0, 0.2 + r() * 0.4, Math.PI * 2 - r() * 0.5);
        g.stroke();
      }
      g.restore();
    });
  }
  for (let i = 0; i < 1600; i++) {        // pits and grains
    const x = r() * N, y = r() * N, s = 0.6 + r() * 1.6;
    g.fillStyle = r() < 0.7 ? `rgba(0,0,0,${0.1 + r() * 0.15})` : `rgba(255,255,255,${0.08 + r() * 0.1})`;
    g.beginPath();
    g.arc(x, y, s, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  THUMB = t;
  return t;
}

/** A colour token (`data`, `good`, `panel` …) or a CSS colour, as a three colour */
export function useClayColor() {
  const theme = useTheme() as unknown as {colors: Record<string, string>};
  return (c: string) => new THREE.Color(theme.colors[c] ?? c);
}

/** Matte modelling clay: soft broad highlight, a faint velvet at the rim, thumbprinted. One material per form, so each can change colour. */
export function clay(color: THREE.Color, {repeat = 1, bump = 1}: {repeat?: number; bump?: number} = {}) {
  const map = thumbprints().clone();
  map.needsUpdate = true;
  map.repeat.set(repeat, repeat);
  return new THREE.MeshPhysicalMaterial({
    color, roughness: 0.68, metalness: 0, bumpMap: map, bumpScale: 5 * bump,
    sheen: 0.35, sheenRoughness: 0.7, sheenColor: new THREE.Color('#fff4e6'),
    specularIntensity: 0.35,
  });
}

// ── forms ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

export type Shape = 'ball' | 'egg' | 'pebble' | 'drop' | 'fruit' | 'disc' | 'bean' | 'leaf' | 'petal' | 'cone';

/** Where a point of the unit sphere goes on each shape (y up), before the wobble */
function shapePoint(shape: Shape, p: THREE.Vector3): THREE.Vector3 {
  const {x, y, z} = p;
  const r = Math.hypot(x, z);
  switch (shape) {
    case 'egg': { const k = 1 - 0.16 * y; return new THREE.Vector3(x * k * 0.86, y * 1.12, z * k * 0.86); }
    case 'pebble': return new THREE.Vector3(x * 1.15, y * 0.58, z * 0.95);
    case 'drop': { const th = Math.acos(Math.max(-1, Math.min(1, y))), k = Math.pow(Math.sin(th / 2), 1.6); return new THREE.Vector3(x * k * 1.05, y * 1.2, z * k * 1.05); }
    case 'fruit': { const dimple = 0.2 * Math.exp(-(r * r) / 0.05); return new THREE.Vector3(x * 1.02, y * 0.9 - Math.sign(y) * dimple, z * 1.02); }
    case 'disc': { const e = 0.22; const s = Math.sign(y) * Math.pow(Math.abs(y), e); const rr = Math.pow(r, 0.3); return new THREE.Vector3(x / Math.max(1e-6, r) * rr, s * 0.3, z / Math.max(1e-6, r) * rr); }
    case 'bean': { const a = x * 0.9; const bend = 0.35 * a * a; return new THREE.Vector3(x * 1.5, y * 0.62 + bend - 0.15, z * 0.68 - (1 - x * x) * 0.0); }
    case 'leaf': { const along = (z + 1) / 2, w = Math.sin(Math.PI * Math.pow(along, 0.8)) * 0.42; return new THREE.Vector3(x * w, y * 0.1 + 0.18 * (along - 0.5) ** 2 * 2 - 0.1 * x * x, z * 1.1); }
    case 'petal': { const along = (z + 1) / 2, w = 0.72 * (0.22 + 0.78 * Math.sin(Math.PI / 2 * Math.min(1, along * 1.25))); return new THREE.Vector3(x * w, y * 0.13 + 0.3 * along * along - 0.22 * x * x, z * 0.9); }
    case 'cone': { const h = (y + 1) / 2, k = Math.pow(1 - h, 0.9) * 1.05 + 0.04; return new THREE.Vector3(x * k, y * 1.1, z * k); }
    default: return p.clone();
  }
}

/**
 * How a hand-made form bends the unit sphere: the shape, pressed out of true by low noise so no two are alike, with a few real thumb dents
 * that catch the light. `lumpy` (0 smooth, 1 freshly squeezed) raises the noise; `boil` shifts it slightly, as handled clay shifts between frames.
 */
export function deformer(shape: Shape, seed: number, lumpy = 0, boil = 0) {
  const n = noise3(seed), nb = noise3(seed + 991);
  const r = random(`dents/${seed}`);
  const dents = Array.from({length: 5}, () => new THREE.Vector3(r() * 2 - 1, r() * 1.6 - 0.5, r() * 2 - 1).normalize());
  return (p: THREE.Vector3) => {
    const u = p.clone().normalize();
    let d = 0.045 * n(u.x * 1.6, u.y * 1.6, u.z * 1.6) + (0.028 + 0.09 * lumpy) * n(u.x * 3.4 + 7, u.y * 3.4, u.z * 3.4) + 0.008 * n(u.x * 9, u.y * 9 + 3, u.z * 9);
    if (boil) d += 0.006 * nb(u.x * 5 + boil * 1.7, u.y * 5, u.z * 5 + boil);
    for (const dn of dents) d -= 0.045 * Math.exp(-u.distanceToSquared(dn) / 0.022);
    return shapePoint(shape, u.multiplyScalar(1 + d));
  };
}

/**
 * A whole form as geometry, about `size` wide, its base on y = 0. With `into` and `k`, it is part way to being re-kneaded into another shape:
 * every point of the clay travels from where the first shape holds it to where the second does, so the volume flows rather than cross-fades.
 */
export function formGeometry(shape: Shape, seed: number, size: number, lumpy = 0, boil = 0, segments = 56, into?: Shape, k = 0) {
  const g = new THREE.SphereGeometry(1, segments, Math.round(segments * 0.75));
  const pos = g.attributes.position as THREE.BufferAttribute;
  const bend = deformer(shape, seed, lumpy, boil);
  const other = into && k > 0 ? deformer(into, seed, lumpy, boil) : null;
  const v = new THREE.Vector3();
  let minY = Infinity;
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const s = other ? bend(v).lerp(other(v), k) : bend(v);
    pos.setXYZ(i, s.x, s.y, s.z);
    minY = Math.min(minY, s.y);
  }
  g.translate(0, -minY, 0);
  g.scale(size / 2, size / 2, size / 2);
  g.computeVertexNormals();
  return g;
}

/**
 * Squash and stretch about the base, keeping the volume: `k` above 1 stretches up, below 1 squashes flat.
 */
export function squash(obj: THREE.Object3D, k: number, base = 1) {
  const s = Math.max(0.2, k);
  obj.scale.set(base / Math.sqrt(s), base * s, base / Math.sqrt(s));
}

/**
 * A drop onto the floor from `height`, as `p` runs 0 to 1 (drive it with a linear tween): it falls under gravity, stretching as it speeds,
 * squashes flat on contact, springs up into a small hop and settles. Returns the height of its base and its squash.
 */
export function landing(p: number, height: number) {
  const k = unit(p);
  const fall = 0.42, hop = 0.62;
  if (k <= 0) return {y: height, s: 1};
  if (k < fall) { const f = k / fall; return {y: height * (1 - f * f), s: 1 + 0.22 * f * f}; }
  if (k < fall + 0.08) { const f = (k - fall) / 0.08; return {y: 0, s: 1 - 0.36 * Math.sin(f * Math.PI / 2) + 0.36 * Math.max(0, f - 0.7) / 0.3 * 0.4}; }
  if (k < hop + 0.08) { const f = (k - fall - 0.08) / (hop + 0.08 - fall - 0.08); return {y: height * 0.09 * Math.sin(f * Math.PI), s: 1 + 0.1 * Math.sin(f * Math.PI) - 0.2 * (1 - f) * (1 - f) * 0.6}; }
  const f = (k - hop - 0.08) / (1 - hop - 0.08);
  return {y: 0, s: 1 - 0.12 * Math.sin(f * Math.PI * 2.2) * Math.exp(-4 * f)};
}

/** Squeezed into being, as `p` runs 0 to 1: it swells from a pinch, overshoots tall, wobbles and settles. Returns its scale and squash. */
export function forming(p: number) {
  const k = unit(p);
  if (k <= 0) return {g: 0, s: 1, lumpy: 1};
  const g = 1 - Math.pow(1 - Math.min(1, k / 0.55), 3);
  const w = Math.max(0, k - 0.3) / 0.7;
  const s = 1 + 0.32 * Math.cos(w * Math.PI * 3.2) * Math.exp(-3.4 * w) * (k < 0.3 ? k / 0.3 : 1);
  return {g, s, lumpy: 1 - smooth(k / 0.9)};
}

// ── the world ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

export type World = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  /** where a point of the world lands on the 1920×1080 frame */
  project: (x: number, y: number, z: number) => {x: number; y: number};
  /** the frame number, halved: what changes when clay is handled between exposures */
  boil: number;
  t: number;
};
const WorldContext = createContext<World | null>(null);
export const useWorld = () => {
  const w = useContext(WorldContext);
  if (!w) throw new Error('a Clay World component stands inside <ClayWorld>');
  return w;
};

/**
 * Add a form to the world once, and set it every frame: `build` makes the object when the component first draws; `update` runs as it draws,
 * so the world renders after every component has set its forms.
 */
export function useClay<T extends THREE.Object3D>(build: () => T, update: (o: T, w: World) => void): T {
  const w = useWorld();
  const ref = useRef<T | null>(null);
  if (!ref.current) ref.current = build();
  const o = ref.current;
  update(o, w);
  useLayoutEffect(() => {
    w.scene.add(o);
    return () => {
      w.scene.remove(o);
      o.traverse((c) => {
        const m = c as THREE.Mesh;
        m.geometry?.dispose();
        const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
        for (const x of mats) { (x as THREE.MeshStandardMaterial).bumpMap?.dispose(); (x as THREE.MeshStandardMaterial).map?.dispose(); x.dispose(); }
      });
    };
  }, [w.scene, o]);
  return o;
}

/** A soft round shadow on the floor under a form, darker and tighter as the form comes down to it */
let SHADOW: THREE.CanvasTexture | null = null;
export function contactShadow() {
  if (!SHADOW) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(0,0,0,1)');
    grd.addColorStop(0.45, 'rgba(0,0,0,0.55)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    SHADOW = new THREE.CanvasTexture(c);
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({map: SHADOW, transparent: true, depthWrite: false, color: '#3a2420', opacity: 0.5}));
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 1;
  return m;
}
/** Place a contact shadow under a form `width` wide whose base is `height` above the floor at (x, z) */
export function placeShadow(m: THREE.Mesh, x: number, z: number, width: number, height: number, alpha = 1) {
  const lift = Math.max(0, height);
  const spread = 1 + lift / Math.max(1, width) * 0.8;
  m.position.set(x + lift * 0.12, 0.02, z + lift * 0.05);
  m.scale.set(width * 1.25 * spread, width * 1.05 * spread, 1);
  (m.material as THREE.MeshBasicMaterial).opacity = 0.42 * alpha / (spread * spread);
  m.visible = alpha > 0.01 && width > 0.01;
}

/** The floor that curves up into the backdrop: one rolled slab of clay, floor colour shading into wall colour along the bend */
function backdrop(floor: THREE.Color, wall: THREE.Color) {
  const W = 640, steps = 110, R = 26, FRONT = 160, BACK = -40, TOP = 220;
  const L1 = FRONT - BACK, L2 = Math.PI / 2 * R, L3 = TOP - R, L = L1 + L2 + L3;
  const g = new THREE.PlaneGeometry(W, 1, 48, steps);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), s = (pos.getY(i) + 0.5) * L;   // 0 at the front edge, L at the top of the wall
    let y = 0, z = 0, k = 0;
    if (s < L1) { z = FRONT - s; }
    else if (s < L1 + L2) { const a = (s - L1) / R; z = BACK - Math.sin(a) * R; y = R - Math.cos(a) * R; k = a / (Math.PI / 2); }
    else { z = BACK - R; y = R + (s - L1 - L2); k = 1; }
    pos.setXYZ(i, x, y, z);
    uv.setXY(i, x / 26, s / 26);   // the slab reaches past any framing, so a pulled-back camera never finds its edge
    const c = floor.clone().lerp(wall, smooth(k * 1.1));
    col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  const m = clay(new THREE.Color('#ffffff'), {repeat: 1, bump: 1.4});
  m.vertexColors = true;
  m.sheen = 0;
  m.roughness = 0.85;
  const mesh = new THREE.Mesh(g, m);
  mesh.receiveShadow = true;
  return mesh;
}

/** A round slab of clay the scene stands on, with a soft rolled edge */
function islandMesh(radius: number, color: THREE.Color) {
  const g = new THREE.CylinderGeometry(radius, radius * 1.02, 1.6, 96, 3);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const n = noise3(77);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const a = Math.atan2(z, x), k = 1 + 0.012 * n(Math.cos(a) * 3, y, Math.sin(a) * 3);
    pos.setXYZ(i, x * k, y, z * k);
  }
  g.translate(0, -0.8, 0);
  g.computeVertexNormals();
  const m = clay(color, {repeat: 3, bump: 0.8});
  const mesh = new THREE.Mesh(g, m);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  return mesh;
}

const GRAIN = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.4  0 0 0 0 0.35  0 0 0 1.4 -0.5"/></filter><rect width="300" height="300" filter="url(#n)"/></svg>')}")`;

export function ClayWorld({yaw = 0, pitch = 22, dist = 40, tx = 0, ty = 4, tz = 0, fov = 26, floor = 'panel', wall = 'bg', sun = 0, shake = 0, island = 0, base = 'good', children}: {
  yaw?: number; pitch?: number; dist?: number; tx?: number; ty?: number; tz?: number; fov?: number; floor?: string; wall?: string; sun?: number; shake?: number; island?: number; base?: string; children?: React.ReactNode;
}) {
  const t = useDocTime();
  const frame = useFrame();
  const {width, height} = useCanvas();
  const color = useClayColor();
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<THREE.WebGLRenderer | null>(null);

  const set = useMemo(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(fov, width / height, 0.5, 600);
    const hemi = new THREE.HemisphereLight('#fff8ee', '#b89c88', 1.25);
    const key = new THREE.DirectionalLight('#fff0da', 2.6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.radius = 8;
    key.shadow.blurSamples = 8;
    key.shadow.bias = -0.0006;
    key.shadow.normalBias = 0.04;
    Object.assign(key.shadow.camera, {left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 220});
    const rim = new THREE.DirectionalLight('#dfe9ff', 1.1);
    scene.add(hemi, key, key.target, rim);
    return {scene, camera, key, rim, hemi};
  }, []);

  // the backdrop and the island are built once per scene from the tokens they were given
  const floorC = color(floor).getHexString(), wallC = color(wall).getHexString(), baseC = color(base).getHexString();
  const ground = useMemo(() => {
    const g = new THREE.Group();
    const back = backdrop(new THREE.Color(`#${floorC}`), new THREE.Color(`#${wallC}`));
    if (island > 0) back.position.y = -1.6;   // the island's slab stands on the floor; its top is the world's y = 0
    g.add(back);
    if (island > 0) g.add(islandMesh(island, new THREE.Color(`#${baseC}`)));
    set.scene.background = new THREE.Color(`#${wallC}`);
    set.scene.add(g);
    return g;
  }, [floorC, wallC, baseC, island]);
  useLayoutEffect(() => () => { set.scene.remove(ground); }, [ground]);

  // the camera: an orbit round what it looks at, breathing a little so a held frame is never frozen
  const {camera, key, rim} = set;
  const breathe = Math.sin(t * 0.31) * 0.35;
  const a = (yaw + breathe) * DEG, e = (pitch + Math.sin(t * 0.23) * 0.25) * DEG;
  // an impact jolts the camera mostly up and down, fast and decaying, the same on every render of the frame
  const j = unit(shake) * dist * 0.012;
  const jx = j * (Math.sin(t * 61) * 0.6 + Math.sin(t * 97 + 1) * 0.4), jy = j * (Math.sin(t * 73 + 2) * 0.8 + Math.sin(t * 131) * 0.5);
  camera.fov = fov;
  camera.aspect = width / height;
  camera.position.set(tx + jx + Math.sin(a) * Math.cos(e) * dist, ty + jy + Math.sin(e) * dist, tz + Math.cos(a) * Math.cos(e) * dist);
  camera.lookAt(tx + jx * 0.5, ty + jy * 0.5, tz);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  // the sun: swung round by `sun`, lower and warmer the further round it is, so its shadows lengthen and turn
  const s = (-38 + sun) * DEG, low = (1 - Math.cos(sun * DEG)) / 2;
  const elev = (49 - 27 * low) * DEG;
  key.position.set(tx + Math.sin(s) * Math.cos(elev) * 92, Math.sin(elev) * 92, tz + Math.cos(s) * Math.cos(elev) * 92);
  key.color.set('#fff0da').lerp(new THREE.Color('#ffb877'), low * 0.8);
  key.intensity = 2.6 - 0.5 * low;
  key.target.position.set(tx, 0, tz);
  key.target.updateMatrixWorld();
  rim.position.set(tx - Math.sin(s) * 40, 30, tz - 70);

  const v = new THREE.Vector3();
  const world: World = {
    scene: set.scene, camera, t, boil: Math.floor(frame / 2),
    project: (x, y, z) => {
      v.set(x, y, z).project(camera);
      return {x: (v.x + 1) / 2 * width, y: (1 - v.y) / 2 * height};
    },
  };

  useLayoutEffect(() => {
    if (!canvas.current) return;
    if (!renderer.current) {
      const r = new THREE.WebGLRenderer({canvas: canvas.current, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance'});
      r.setPixelRatio(1);
      r.outputColorSpace = THREE.SRGBColorSpace;
      r.toneMapping = THREE.ACESFilmicToneMapping;
      r.toneMappingExposure = 1.02;
      r.shadowMap.enabled = true;
      r.shadowMap.type = THREE.VSMShadowMap;   // soft, blurred shadows, as under a large diffused key
      renderer.current = r;
    }
    renderer.current.setSize(width, height, false);
    renderer.current.render(set.scene, camera);
  });
  useLayoutEffect(() => () => { renderer.current?.dispose(); renderer.current?.forceContextLoss(); renderer.current = null; }, []);

  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: 'var(--vt-bg)'}}>
      <canvas ref={canvas} width={width} height={height} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />
      {/* a soft studio falloff at the corners and a fine grain, so the long clay gradients do not band in a compressed video */}
      <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(130% 95% at 50% 42%, transparent 55%, rgba(70, 44, 34, 0.22) 100%)'}} />
      <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: GRAIN, opacity: 0.16, mixBlendMode: 'multiply'}} />
      <WorldContext.Provider value={world}>{children}</WorldContext.Provider>
    </div>
  );
}
