// The fold stage: one sheet folding in 3D on a pale table, lit from the upper left; earlier creases stay as faint
// marks, and the fold about to happen is drawn on the paper in the accent, in the notation of fold diagrams.
import {useLayoutEffect, useMemo, useRef} from 'react';
import {useTokens, useVideoConfig} from '@motionhub/runtime';
import * as THREE from 'three';
import {LineSegments2} from 'three/examples/jsm/lines/LineSegments2.js';
import {LineSegmentsGeometry} from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import {LineMaterial} from 'three/examples/jsm/lines/LineMaterial.js';
import {foldModel, positionsAt, stateAt, stepEdges, type Baked, type ModelDef} from './fold.ts';

export const meta = {
  name: {en: 'Fold stage', 'zh-CN': '折纸台'},
  purpose: 'ground',
  line: 'One sheet folding in 3D, step by step, on a pale table; the next fold is marked on the paper in the accent before it is made.',
  fits: 'every scene: a model folded step by step; a finished model turned to be looked at; a crease pattern collapsing at once',
  params: {
    model: {type: 'ModelDef', doc: 'the model, as steps (fold.ts); models.ts has traditional ones'},
    at: {type: 'number', doc: 'steps done, fractional: 0 the flat sheet, 2.5 halfway through step 3, steps.length finished. Tween it across each step'},
    mark: {type: '{step, draw?, opacity?}', default: 'none', doc: 'draw step `step`\'s fold line in the accent: draw 0 to 1 draws it on, opacity fades it. Mark a step before its fold, keep it through the fold'},
    az: {type: 'degrees', default: 25, doc: 'the camera\'s bearing round the model; 0 looks from the sheet\'s bottom edge'},
    el: {type: 'degrees', default: 50, doc: 'the camera\'s height: 90 straight down, 20 low across the table'},
    zoom: {type: 'number', default: 1, doc: '1 frames the whole sheet; 1.5 comes closer once the model is small'},
    shift: {type: 'px', default: 0, doc: 'slides the picture left (positive) to leave room for a step list on the right'},
    creases: {type: 'boolean', default: true, doc: 'faint marks where earlier steps folded'},
    baked: {type: 'Baked', default: 'none', doc: 'the model\'s solve from bake.ts, so the render skips solving; a stale one is solved again'},
  },
  preview: 6.7,
};

const FALLBACK = {table: '#ECE7DE', front: '#2E4F8C', back: '#F4F0E6', ink: '#1D2433', now: '#E4572E'};
type Edge = [number, number, 'M' | 'V', string];

/**
 * One fold line through stacked layers makes a crease on each layer; a diagram draws it once, on the layer nearest the
 * eye. Edges of the same fold line that lie close together and overlap along it are one mark: keep the nearest.
 */
function oncePerLine(edges: Edge[], world: (v: number) => THREE.Vector3, eye: THREE.Vector3, near: number): Edge[] {
  const groups = new Map<string, Edge[]>();
  for (const e of edges) groups.set(e[3], [...(groups.get(e[3]) ?? []), e]);
  const out: Edge[] = [];
  for (const g of groups.values()) {
    const ends = new Map(g.map((e) => [e, [world(e[0]), world(e[1])] as const]));
    const dist = (e: Edge) => { const [a, b] = ends.get(e)!; return a.clone().add(b).multiplyScalar(0.5).distanceTo(eye); };
    const kept: (readonly [THREE.Vector3, THREE.Vector3])[] = [];
    for (const e of [...g].sort((x, y) => dist(x) - dist(y))) {
      const [a, b] = ends.get(e)!;
      const covered = kept.some(([ka, kb]) => {
        const axis = kb.clone().sub(ka), L = axis.length() || 1e-9; axis.divideScalar(L);
        const t = (q: THREE.Vector3) => q.clone().sub(ka).dot(axis) / L;
        const off = (q: THREE.Vector3) => { const r = q.clone().sub(ka); return r.sub(axis.clone().multiplyScalar(r.dot(axis))).length(); };
        const ta = t(a), tb = t(b), lo = Math.max(0, Math.min(ta, tb)), hi = Math.min(1, Math.max(ta, tb));
        return (hi - lo) / Math.max(1e-9, Math.abs(tb - ta)) > 0.6 && off(a) < near && off(b) < near;
      });
      if (!covered) { kept.push([a, b]); out.push(e); }
    }
  }
  return out;
}

export function FoldStage({model, at, mark, az = 25, el = 50, zoom = 1, shift = 0, creases = true, baked}: {
  model: ModelDef; at: number; baked?: Baked; mark?: {step: number; draw?: number; opacity?: number}; az?: number; el?: number; zoom?: number; shift?: number; creases?: boolean;
}) {
  const {width: W, height: H} = useVideoConfig();
  const tokens = useTokens() as unknown as {color?: Record<string, string>};
  const col = {...FALLBACK, ...(tokens?.color ?? {})};
  const F = useMemo(() => foldModel(model, {baked}), [model, baked]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<THREE.WebGLRenderer | null>(null);

  const S = useMemo(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(col.table);
    const root = new THREE.Group(); scene.add(root);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(F.tris.length * 9), 3));
    const paper = {roughness: 0.88, metalness: 0, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1, flatShading: true};
    for (const [color, side] of [[col.front, THREE.FrontSide], [col.back, THREE.BackSide]] as const) {
      const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({...paper, color, side}));
      mesh.castShadow = true; mesh.receiveShadow = true; root.add(mesh);
    }
    // WebGL draws lines one pixel wide whatever is asked: fold lines are screen-space ribbons
    const fat = (width: number, color: string, dash?: [number, number]) => {
      const mat = new LineMaterial({color: new THREE.Color(color).getHex(), linewidth: width, transparent: true, dashed: !!dash,
        dashSize: dash?.[0] ?? 1, gapSize: dash?.[1] ?? 1, depthTest: !dash, worldUnits: false});
      mat.resolution.set(W, H);
      const seg = new LineSegments2(new LineSegmentsGeometry(), mat);
      if (dash) seg.renderOrder = 10;
      root.add(seg); return seg;
    };
    const marks = fat(2, col.back), valley = fat(5, col.now, [0.022, 0.014]), mountain = fat(5, col.now, [0.05, 0.014]);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({opacity: 0.16}));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
    scene.add(new THREE.HemisphereLight('#ffffff', '#b9ae9c', 1.5));
    const key = new THREE.DirectionalLight('#fff3e3', 2.6);
    key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 5; key.shadow.bias = -0.0004;
    Object.assign(key.shadow.camera, {left: -2, right: 2, top: 2, bottom: -2, near: 0.1, far: 12});
    scene.add(key, key.target);
    const camera = new THREE.PerspectiveCamera(28, W / H, 0.01, 60);
    return {scene, root, geo, marks, valley, mountain, floor, key, camera};
  }, [F, W, H, col.table, col.front, col.back, col.now]);

  useLayoutEffect(() => {
    if (!renderer.current) {
      const r = new THREE.WebGLRenderer({canvas: canvas.current!, antialias: true, preserveDrawingBuffer: true});
      r.setPixelRatio(1); r.setSize(W, H, false);
      r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap; r.outputColorSpace = THREE.SRGBColorSpace;
      renderer.current = r;
    }
    // sheet frame (x, y in the sheet, z toward the viewer) -> scene (y up): the sheet lies on the table, its top edge away
    const P = positionsAt(F, stateAt(F, at));
    const pos = S.geo.getAttribute('position') as THREE.BufferAttribute;
    F.tris.forEach((t, i) => t.forEach((v, j) => pos.setXYZ(i * 3 + j, P[v * 3], P[v * 3 + 2], -P[v * 3 + 1])));
    pos.needsUpdate = true; S.geo.computeVertexNormals(); S.geo.computeBoundingBox();

    // turning the paper over is a half turn about the sheet's vertical, eased over its step
    const turns = F.turned.reduce((acc, n) => acc + Math.max(0, Math.min(1, (at - (n - 1)) / (F.turnShare[n] || 1))), 0);
    const ease = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
    const whole = Math.floor(turns), part = turns - whole;
    const bb0 = S.geo.boundingBox!, c0 = new THREE.Vector3(); bb0.getCenter(c0);
    S.root.position.set(0, 0, 0); S.root.rotation.set(0, 0, 0);
    S.root.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), Math.PI * (whole + ease(part)));
    S.root.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(S.root.children[0]), c = new THREE.Vector3(); bb.getCenter(c);
    S.floor.position.y = bb.min.y - 0.001;

    const [sw, sh] = F.def.sheet, dist = Math.hypot(sw, sh) * 2.25 / zoom;
    const A = az * Math.PI / 180, E = el * Math.PI / 180;
    S.camera.position.set(c.x + dist * Math.cos(E) * Math.sin(A), c.y + dist * Math.sin(E), c.z + dist * Math.cos(E) * Math.cos(A));
    S.camera.lookAt(c);
    S.camera.setViewOffset(W, H, shift, 0, W, H);
    S.camera.updateMatrixWorld();
    S.key.position.set(c.x - 1.2, c.y + 2.6, c.z + 1.4); S.key.target.position.copy(c);

    const setFat = (seg: LineSegments2, edges: Edge[], opacity: number, lift: number) => {
      const arr: number[] = [];
      for (const [a, b] of edges) arr.push(P[a * 3], P[a * 3 + 2] + lift, -P[a * 3 + 1], P[b * 3], P[b * 3 + 2] + lift, -P[b * 3 + 1]);
      seg.geometry.dispose();
      seg.geometry = new LineSegmentsGeometry().setPositions(arr.length ? arr : [0, -99, 0, 0, -99, 0]);
      seg.computeLineDistances();
      (seg.material as LineMaterial).opacity = edges.length ? opacity : 0;
    };
    const done = creases ? Array.from({length: Math.floor(Math.min(at, F.def.steps.length))}, (_, i) => stepEdges(F, i + 1)).flat() : [];
    setFat(S.marks, done, 0.5, 0.001);
    let now: Edge[] = [];
    if (mark && mark.step >= 1 && mark.step <= F.def.steps.length) {
      // a step that only reopens or turns the paper makes no new crease, so it marks nothing
      const all = stepEdges(F, mark.step), draw = mark.draw ?? 1;
      const world = (v: number) => S.root.localToWorld(new THREE.Vector3(P[v * 3], P[v * 3 + 2], -P[v * 3 + 1]));
      now = oncePerLine(all.slice(0, Math.ceil(all.length * draw)), world, S.camera.position, Math.hypot(sw, sh) * 0.05);
    }
    // the root carries the turn: lines are drawn in its frame, so they turn with the paper; while the paper is on
    // its edge mid-turn its layers part on screen, so a step's mark waits for its turn to finish
    const turning = mark && F.turnShare[mark.step] !== undefined && at < mark.step - 1 + F.turnShare[mark.step];
    const op = turning ? 0 : 0.95 * (mark?.opacity ?? 1);
    setFat(S.valley, now.filter((e) => e[2] === 'V'), op, 0.002);
    setFat(S.mountain, now.filter((e) => e[2] === 'M'), op, 0.002);
    renderer.current.render(S.scene, S.camera);
  });
  return <canvas ref={canvas} width={W} height={H} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />;
}
