// The optical table every Light Bench film stands on, in real 3D: one three.js scene, one camera, glass on posts, and light that is traced, not drawn.
// Every frame is drawn from the props in a layout effect, never from three's clock; words go in the DOM above it, placed with `toScreen`.
import {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {useVideoConfig} from '@motionhub/runtime';
import {BLADE, WAVES, dirOf, jawOpen, prismCorners, trace, upTo, type Optic, type P2, type Traced} from './optics.ts';

export const meta = {
  name: {en: 'Optical bench', 'zh-CN': '光学平台'},
  purpose: 'ground',
  line: "A black optical table with its grid of threaded holes in a dark lab; glass stands on steel posts and the beams are computed through it by Snell's law, one colour at a time.",
  fits: "every scene: how prisms and lenses treat light, in the plane of the beam",
  params: {
    view: {type: '{yaw, pitch, dist, tx, ty, tz}', doc: 'the camera: it orbits (tx, ty, tz) at dist, in table units; tween each, and pass the same view to every tag'},
    from: {type: '[x, z]', doc: 'where the lamp stands on the table'},
    aim: {type: 'number', doc: 'the way the lamp points, in degrees: 0 is +x, 90 is +z, towards the camera'},
    colors: {type: 'number[]', doc: 'which of the seven colours the lamp gives, 0 is red and 6 is violet; leave it out for white'},
    reach: {type: 'number', default: 40, doc: 'how far the light has got, in table units: tween it to switch the beam on'},
    optics: {type: 'Optic[]', doc: "what stands on the table: prism {at, rot, side, flip}, lens {at, rot, f, dia} with f above 0, jaws {at, rot, slit, close, width}, card {at, rot, w}; each takes in, 0 to 1, to lower it into place, and acts once it has landed; keep the lamp and the elements clear of one another"},
    children: {type: 'ReactNode', doc: 'the words above the picture'},
  },
  preview: 8.6,
};

export type View = {yaw?: number; pitch?: number; dist?: number; tx?: number; ty?: number; tz?: number};
const BEAM_Y = 1.2;

const cameraOf = ({yaw = 0, pitch = 24, dist = 19, tx = 1.2, ty = 1, tz = -1}: View, aspect: number) => {
  const a = (yaw * Math.PI) / 180, p = (pitch * Math.PI) / 180, cam = new THREE.PerspectiveCamera(30, aspect, 0.1, 200);
  cam.position.set(tx + dist * Math.sin(a) * Math.cos(p), ty + dist * Math.sin(p), tz + dist * Math.cos(a) * Math.cos(p));
  cam.lookAt(tx, ty, tz);
  cam.updateMatrixWorld();
  return cam;
};
/** Where a point on the table lands on the frame, in px: what a tag ties itself to. */
export const toScreen = (view: View, [x, y, z]: [number, number, number], w = 1920, h = 1080): P2 => {
  const v = new THREE.Vector3(x, y, z).project(cameraOf(view, w / h));
  return [((v.x + 1) / 2) * w, ((1 - v.y) / 2) * h];
};
/** The height of the beams, for a tag that names a point on one. */
export const onBeam = ([x, z]: P2): [number, number, number] => [x, BEAM_Y, z];

// the table's top: one threaded hole a tile, repeated at one unit's pitch
const holes = () => {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#16181c'; g.fillRect(0, 0, 128, 128);
  g.fillStyle = '#272a30'; g.beginPath(); g.arc(64, 64, 15, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#050607'; g.beginPath(); g.arc(64, 64, 11, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(80, 80); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
};
const soft = () => {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d')!, r = g.createRadialGradient(64, 64, 2, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.3, 'rgba(255,255,255,0.55)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
};

const makeSet = () => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#050608');
  scene.fog = new THREE.Fog('#050608', 16, 34);
  const table = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({map: holes(), metalness: 0.55, roughness: 0.5}));
  table.rotation.x = -Math.PI / 2; table.position.set(1.5, 0, -1); table.receiveShadow = true;
  scene.add(table);
  scene.add(new THREE.HemisphereLight('#aab8d0', '#050608', 0.28));
  const key = new THREE.SpotLight('#ffffff', 230, 42, 0.55, 0.95, 1.6);
  key.position.set(1, 15, 2); key.target.position.set(2, 0, -1); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 6; key.shadow.bias = -0.0004;
  scene.add(key, key.target);
  const dynamic = new THREE.Group();
  scene.add(dynamic);
  return {scene, dynamic, glow: soft(),
    steel: new THREE.MeshStandardMaterial({color: '#AEB4BC', metalness: 0.95, roughness: 0.32}),
    black: new THREE.MeshStandardMaterial({color: '#0D0E11', metalness: 0.5, roughness: 0.55}),
    paper: new THREE.MeshStandardMaterial({color: '#5E6268', metalness: 0, roughness: 0.92}),
    glass: new THREE.MeshPhysicalMaterial({color: '#BFD8E8', metalness: 0, roughness: 0.02, transparent: true, opacity: 0.2, envMapIntensity: 9, specularIntensity: 1, clearcoat: 1, clearcoatRoughness: 0.02, depthWrite: false, side: THREE.DoubleSide}),
    edge: new THREE.LineBasicMaterial({color: '#EAF4FB', transparent: true, opacity: 0.9}),
    unit: new THREE.CylinderGeometry(1, 1, 1, 12, 1, true),
    disc: new THREE.CircleGeometry(1, 32),
    beams: WAVES.map((w) => {
      const color = new THREE.Color(...w.color), mat = (opacity: number) => new THREE.MeshBasicMaterial({color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false});
      return {core: mat(1), near: mat(0.28), far: mat(0.07), floor: mat(0.022)};
    }),
  };
};
type Set = ReturnType<typeof makeSet>;

const prismGeometry = (corners: P2[], y0: number, y1: number) => {
  const v: number[] = [], tri = (a: number[], b: number[], c: number[]) => v.push(...a, ...b, ...c);
  corners.forEach(([x, z], i) => {
    const [x2, z2] = corners[(i + 1) % 3];
    tri([x, y0, z], [x2, y1, z2], [x2, y0, z2]); tri([x, y0, z], [x, y1, z], [x2, y1, z2]);
  });
  const up = corners.map(([x, z]) => [x, y1, z]), down = corners.map(([x, z]) => [x, y0, z]);
  tri(up[0], up[2], up[1]); tri(down[0], down[1], down[2]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.computeVertexNormals();
  return g;
};
const lensGeometry = (dia: number) => {
  const R = dia / 2, pts = Array.from({length: 17}, (_, i) => { const k = i / 16; return new THREE.Vector2(Math.max(0.0001, R * Math.sin((k * Math.PI) / 2) * 1), 0.2 * Math.cos((k * Math.PI) / 2)); });
  return new THREE.LatheGeometry([...pts, ...pts.slice(0, -1).reverse().map((p) => new THREE.Vector2(p.x, -p.y))], 48);
};

const post = (set: Set, g: THREE.Group, x: number, z: number, top: number) => {
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, top, 16), set.steel);
  shaft.position.set(x, top / 2, z); shaft.castShadow = true;
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.1, 24), set.black);
  foot.position.set(x, 0.05, z); foot.castShadow = true;
  g.add(shaft, foot);
};

const place = (set: Set, g: THREE.Group, o: Optic) => {
  const lift = (1 - (o.in ?? 1)) * 6;
  if ((o.in ?? 1) <= 0) return;
  const piece = new THREE.Group();
  piece.position.y = lift;
  g.add(piece);
  if (o.kind === 'prism') {
    const corners = prismCorners(o), side = o.side ?? 2.4, top = BEAM_Y + 0.8, base = BEAM_Y - 0.72;
    const geo = prismGeometry(corners, base, top), body = new THREE.Mesh(geo, set.glass);
    body.renderOrder = 1;
    piece.add(body, new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), set.edge));
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(side * 0.72, side * 0.72, 0.06, 40), set.black);
    plate.position.set(o.at[0], base - 0.05, o.at[1]); plate.castShadow = true;
    piece.add(plate);
    post(set, piece, o.at[0], o.at[1], base - 0.06);
  } else if (o.kind === 'lens') {
    const dia = o.dia ?? 1.4, axis = dirOf(o.rot), geo = lensGeometry(dia), body = new THREE.Mesh(geo, set.glass), turn = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(axis[0], 0, axis[1]));
    body.position.set(o.at[0], BEAM_Y, o.at[1]); body.quaternion.copy(turn); body.renderOrder = 1;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(dia / 2 + 0.03, 0.05, 12, 64), set.black);
    ring.position.copy(body.position); ring.quaternion.copy(turn).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2)); ring.castShadow = true;
    piece.add(body, ring);
    post(set, piece, o.at[0], o.at[1], BEAM_Y - dia / 2);
  } else if (o.kind === 'jaws') {
    // two blades on one rail, which stands on its own posts wherever they are
    const open = jawOpen(o), tan = dirOf(o.rot + 90), blade = BLADE, rail = 3.6, face = -(o.rot * Math.PI) / 180, on = (s: number): P2 => [o.at[0] + tan[0] * (o.slit + s), o.at[1] + tan[1] * (o.slit + s)];
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, rail), set.steel), mid = on(0);
    bar.position.set(mid[0], BEAM_Y - 0.66, mid[1]); bar.rotation.y = face; bar.castShadow = true;
    piece.add(bar);
    for (const s of [-1, 1]) {
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.2, blade), set.black), c = on(s * (open + blade / 2)), foot = on(s * (rail / 2 - 0.1));
      box.position.set(c[0], BEAM_Y, c[1]); box.rotation.y = face; box.castShadow = true;
      piece.add(box);
      post(set, piece, foot[0], foot[1], BEAM_Y - 0.66);
    }
  } else {
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.9, o.w ?? 3), set.paper);
    box.position.set(o.at[0], BEAM_Y, o.at[1]); box.rotation.y = -(o.rot * Math.PI) / 180; box.castShadow = true;
    piece.add(box);
    post(set, piece, o.at[0], o.at[1], BEAM_Y - 0.95);
  }
};

const drawRay = (set: Set, g: THREE.Group, ray: Traced, wave: number, reach: number) => {
  const pts = upTo(ray.pts, reach), m = set.beams[wave];
  const seg = (a: P2, b: P2, y: number, r: number, mat: THREE.Material, flat = false) => {
    const from = new THREE.Vector3(a[0], y, a[1]), to = new THREE.Vector3(b[0], y, b[1]), len = from.distanceTo(to);
    if (len < 1e-4) return;
    const mesh = new THREE.Mesh(set.unit, mat);
    mesh.position.copy(from).add(to).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
    mesh.scale.set(r, len, flat ? 0.002 : r);
    mesh.renderOrder = 2;
    g.add(mesh);
  };
  pts.slice(1).forEach((b, i) => {
    const a = pts[i];
    seg(a, b, BEAM_Y, 0.016, m.core); seg(a, b, BEAM_Y, 0.04, m.near); seg(a, b, BEAM_Y, 0.1, m.far); seg(a, b, 0.012, 0.12, m.floor);
  });
  // where it lands, it lights what it lands on
  const end = pts[pts.length - 1], last = ray.pts[ray.pts.length - 1];
  if (ray.ended !== 'free' && Math.hypot(end[0] - last[0], end[1] - last[1]) < 1e-3) {
    const before = pts[pts.length - 2], back = new THREE.Vector3(before[0] - end[0], 0, before[1] - end[1]).normalize(), spot = new THREE.Mesh(set.disc, new THREE.MeshBasicMaterial({map: set.glow, color: new THREE.Color(...WAVES[wave].color), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false}));
    const at = new THREE.Vector3(end[0], BEAM_Y, end[1]).addScaledVector(back, 0.05);
    spot.position.copy(at); spot.lookAt(at.clone().add(back)); spot.scale.setScalar(ray.ended === 'card' ? 0.24 : 0.1); spot.renderOrder = 3;
    g.add(spot);
  }
};

export function Bench({view, from, aim, colors, reach = 40, optics, children}: {view: View; from: P2; aim: number; colors?: number[]; reach?: number; optics: Optic[]; children?: React.ReactNode}) {
  const {width, height} = useVideoConfig();
  const canvas = useRef<HTMLCanvasElement>(null), renderer = useRef<THREE.WebGLRenderer | null>(null);
  const set = useMemo(makeSet, []);
  useLayoutEffect(() => {
    if (!canvas.current) return;
    if (!renderer.current) {
      const r = new THREE.WebGLRenderer({canvas: canvas.current, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance'});
      r.setPixelRatio(1); r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1; r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
      const pm = new THREE.PMREMGenerator(r);
      set.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; set.scene.environmentIntensity = 0.32;
      pm.dispose();
      renderer.current = r;
    }
    set.dynamic.clear();
    const lamp = new THREE.Group(), d = dirOf(aim);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 1.3, 24), set.black);
    body.position.set(from[0] - d[0] * 0.65, BEAM_Y, from[1] - d[1] * 0.65); body.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(d[0], 0, d[1])); body.castShadow = true;
    lamp.add(body);
    post(set, lamp, from[0] - d[0] * 0.65, from[1] - d[1] * 0.65, BEAM_Y - 0.24);
    set.dynamic.add(lamp);
    for (const o of optics) place(set, set.dynamic, o);
    if (reach > 0) WAVES.forEach((w, i) => (colors ?? [0, 1, 2, 3, 4, 5, 6]).includes(i) && drawRay(set, set.dynamic, trace(from, d, w, optics), i, reach));
    renderer.current.setSize(width, height, false);
    renderer.current.render(set.scene, cameraOf(view, width / height));
  });
  useLayoutEffect(() => () => { renderer.current?.dispose(); renderer.current?.forceContextLoss(); renderer.current = null; }, []);
  return (
    <>
      <canvas ref={canvas} width={width} height={height} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />
      {children}
    </>
  );
}
