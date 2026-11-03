// One hand-made form of clay: a ball, an egg, a pebble, a drop, a fruit, a disc, a bean, a leaf, a petal or a cone. It is squeezed into being
// (`form`), falls and lands with squash and stretch (`drop`), is re-kneaded into another shape (`into`, `knead`) and changes colour as
// fresh clay is worked into it (`to`, `tint`).
import * as THREE from 'three';
import {clay, contactShadow, formGeometry, forming, landing, placeShadow, seedOf, squash, unit, useClay, useClayColor, type Shape} from './world.tsx';

export const meta = {
  name: {en: 'Clay form', 'zh-CN': '黏土团'},
  purpose: 'mark',
  line: 'One rounded, hand-pressed clay form, squeezed into being, dropped in with a squash, or re-kneaded into another shape.',
  fits: 'a seed, a drop, a cell, a stone, a fruit, a planet, a leaf: anything with a body',
  params: {
    shape: {type: 'text', default: 'ball', doc: 'ball, egg, pebble, drop, fruit, disc, bean, leaf, petal or cone'},
    x: {type: 'number', default: 0, doc: 'where it stands, across (clay units)'},
    y: {type: 'number', default: 0, doc: 'the height of its base above the floor'},
    z: {type: 'number', default: 0, doc: 'where it stands, towards the camera'},
    size: {type: 'number', default: 4, doc: 'how wide it is'},
    color: {type: 'text', default: 'data', doc: 'its clay: a colour token or a hex'},
    to: {type: 'text', default: '', doc: 'the clays it turns into, in order, separated by commas ("good,data")'},
    tint: {type: 'number', default: 0, doc: '0 its colour, 1 the first clay of to, 2 the second …'},
    into: {type: 'text', default: '', doc: 'another shape it is re-kneaded into as knead runs to 1'},
    knead: {type: 'progress', default: 0, doc: '0 its shape, 1 the shape named by into: the clay flows, bulges and settles, never cross-fades'},
    rx: {type: 'number', default: 0, doc: 'tilt forward, degrees'},
    ry: {type: 'number', default: 0, doc: 'turn round, degrees'},
    rz: {type: 'number', default: 0, doc: 'lean sideways, degrees'},
    form: {type: 'progress', default: 1, doc: '0 not there, 1 squeezed fully into shape: tween it on the word that names it'},
    drop: {type: 'progress', default: 1, doc: '0 held at height above its place, 1 landed and settled: tween it linearly over about a second'},
    height: {type: 'number', default: 10, doc: 'how far above its place it falls from'},
    grow: {type: 'number', default: 1, doc: 'its size multiplied, for a form that grows'},
    shadow: {type: 'number', default: 1, doc: '0 for a form held in the air with nothing below it'},
    seed: {type: 'text', default: '', doc: 'a word that makes this form\'s dents and wobble its own'},
  },
  preview: 12.2,
};

export function Lump({shape = 'ball', x = 0, y = 0, z = 0, size = 4, color = 'data', to = '', tint = 0, into = '', knead = 0, rx = 0, ry = 0, rz = 0, form = 1, drop = 1, height = 10, grow = 1, shadow = 1, seed = ''}: {
  shape?: string; x?: number; y?: number; z?: number; size?: number; color?: string; to?: string; tint?: number; into?: string; knead?: number; rx?: number; ry?: number; rz?: number;
  form?: number; drop?: number; height?: number; grow?: number; shadow?: number; seed?: string;
}) {
  const paint = useClayColor();
  const key = seed || `${shape}/${x}/${z}/${color}`;
  const f = forming(form);
  const fall = landing(drop, height);
  useClay(() => {
    const group = new THREE.Group();
    const body = new THREE.Group();
    const mesh = new THREE.Mesh(undefined, clay(paint(color), {repeat: 0.6 + size * 0.06}));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    body.add(mesh);
    group.add(body);
    group.add(contactShadow());
    group.userData.cache = new Map<string, THREE.BufferGeometry>();
    return group;
  }, (g, w) => {
    const body = g.children[0] as THREE.Group, mesh = body.children[0] as THREE.Mesh, sh = g.children[1] as THREE.Mesh;
    // the geometry: a few lumpiness levels while it is squeezed, then four states of the boil it cycles through
    // re-kneading: the shape flows over with a slow-fast-slow ease, lumpier half way as if worked by thumbs, bulging and twisting as it goes
    const kn = into ? unit(knead) : 0, working = Math.sin(Math.PI * kn);
    const flow = Math.round(kn * kn * (3 - 2 * kn) * 30) / 30;
    const lumpy = Math.round(Math.max(f.lumpy, working * 0.7) * 6) / 6;
    const boil = lumpy > 0 || (flow > 0 && flow < 1) ? 0 : (w.boil % 4) + 1;
    const id = `${lumpy}|${boil}|${flow}`;
    const cache = g.userData.cache as Map<string, THREE.BufferGeometry>;
    if (!cache.has(id)) {
      if (cache.size > 48) { for (const [k, geo] of cache) if (k.split('|')[2] !== '0' && k.split('|')[2] !== '1') { geo.dispose(); cache.delete(k); } }
      cache.set(id, formGeometry(shape as Shape, seedOf(key), 2, lumpy, boil, 56, into ? into as Shape : undefined, flow));
    }
    mesh.geometry = cache.get(id)!;
    const m = mesh.material as THREE.MeshPhysicalMaterial;
    // the colour: its own clay, then each clay of `to` in turn as tint counts up
    const stops = [color, ...to.split(',').map((c) => c.trim()).filter(Boolean)];
    const ti = Math.max(0, Math.min(stops.length - 1, tint)), lo = Math.floor(ti);
    m.color.copy(paint(stops[lo]));
    if (lo < stops.length - 1) m.color.lerp(paint(stops[lo + 1]), ti - lo);
    const s = size / 2 * grow * f.g;
    body.visible = s > 0.001;
    body.position.set(x, y + fall.y, z);
    body.rotation.set(rx * Math.PI / 180, (ry + 50 * working) * Math.PI / 180, rz * Math.PI / 180);
    squash(mesh, f.s * fall.s * (1 - 0.16 * Math.sin(2 * Math.PI * kn)), 1);
    body.scale.setScalar(Math.max(0.001, s));
    placeShadow(sh, x, z, size * grow * f.g * (shape === 'leaf' || shape === 'petal' ? 0.6 : 0.9), y + fall.y, shadow * unit(f.g * 3));
  });
  return null;
}
