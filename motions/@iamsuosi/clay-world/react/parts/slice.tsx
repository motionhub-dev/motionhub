// A round form cut in two to show what is inside: a taut cutting wire between two wooden toggles is drawn through its middle, leaving a seam;
// the top half slides on the cut, springs up, corkscrews over and lands beside the bottom one with a squash, both cut faces up. The inside is
// layered clay: rings from the skin inwards and chambers round the centre, from which the seeds pop up one by one.
import * as THREE from 'three';
import {clay, deformer, formGeometry, forming, landing, contactShadow, placeShadow, seedOf, unit, useClay, useClayColor, type Shape} from './world.tsx';

export const meta = {
  name: {en: 'Cut in two', 'zh-CN': '对半切开'},
  purpose: 'compare',
  line: 'A round form sliced across by a cutting wire; the top half corkscrews over and lands beside the other, showing its layers and chambers, and the seeds pop up.',
  fits: 'the seeds of an apple, the layers of the Earth, the rings of a tree, a cell',
  params: {
    x: {type: 'number', default: 0, doc: 'where the bottom half stands, across'},
    z: {type: 'number', default: 0, doc: 'where it stands, towards the camera'},
    size: {type: 'number', default: 8, doc: 'how wide the whole form is'},
    shape: {type: 'text', default: 'fruit', doc: 'ball, fruit or pebble'},
    color: {type: 'text', default: 'data', doc: 'the clay of its skin'},
    rings: {type: 'list', default: [], doc: 'the layers from the skin inwards, each {at, color}: at is the fraction of the radius where the layer begins'},
    chambers: {type: 'number', default: 0, doc: 'how many chambers sit round the centre, in a star; 0 for none'},
    chamber: {type: 'text', default: 'panel2', doc: 'the clay of the chambers\' walls'},
    seeds: {type: 'text', default: 'text', doc: 'the clay of the seed in each chamber'},
    pop: {type: 'progress', default: 0, doc: '0 the chambers empty, 1 a seed has popped up in each, one after another'},
    side: {type: 'number', default: 1, doc: '1 the top half lands to the right, -1 to the left'},
    cut: {type: 'progress', default: 0, doc: '0 whole, 1 the wire has gone right through and lifted away'},
    open: {type: 'progress', default: 0, doc: '0 closed, 1 the top half has corkscrewed over and landed beside it: tween it linearly over about two seconds'},
    seed: {type: 'text', default: '', doc: 'a word that makes its dents its own'},
  },
  preview: 26.6,
};

type Ring = {at: number; color: string};

/** The cut face, painted: the rings, then a star of chambers with a seed in each. Returns a colour map and a bump map from the same drawing. */
function face(rings: Ring[], chambers: number, paint: (c: string) => THREE.Color, chamber: string, seeds: string, skin: string) {
  const N = 1024, h = N / 2;
  const make = (bump: boolean) => {
    const c = document.createElement('canvas');
    c.width = c.height = N;
    const g = c.getContext('2d')!;
    const col = (name: string, level: number) => bump ? `rgb(${level},${level},${level})` : `#${paint(name).getHexString()}`;
    g.fillStyle = col(skin, 120);
    g.fillRect(0, 0, N, N);
    rings.forEach((r, i) => {
      g.fillStyle = col(r.color, 140 + i * 6);
      g.beginPath();
      g.arc(h, h, h * r.at, 0, Math.PI * 2);
      g.fill();
    });
    if (chambers > 0) {
      // the core: a soft star whose points are the chambers
      g.save();
      g.translate(h, h);
      g.rotate(-Math.PI / 2);
      g.beginPath();
      for (let i = 0; i <= chambers * 2; i++) {
        const a = i / (chambers * 2) * Math.PI * 2, r = i % 2 === 0 ? h * 0.5 : h * 0.22;
        const x = Math.cos(a) * r, y = Math.sin(a) * r;
        if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.closePath();
      g.lineJoin = 'round';
      g.lineWidth = 16;
      g.strokeStyle = bump ? 'rgb(170,170,170)' : `#${paint(chamber).clone().lerp(paint(skin), 0.08).getHexString()}`;
      g.fillStyle = bump ? 'rgb(150,150,150)' : `#${paint(chamber).getHexString()}`;
      g.fill();
      g.stroke();
      for (let i = 0; i < chambers; i++) {
        const a = i / chambers * Math.PI * 2;
        g.save();
        g.rotate(a);
        g.translate(h * 0.33, 0);
        g.fillStyle = bump ? 'rgb(110,110,110)' : `#${paint(chamber).clone().multiplyScalar(0.9).getHexString()}`;
        g.beginPath();
        g.ellipse(0, 0, h * 0.13, h * 0.07, 0, 0, Math.PI * 2);
        g.fill();
        // the bed a seed lies in: a teardrop pressed into the chamber, darker
        g.fillStyle = bump ? 'rgb(80,80,80)' : `#${paint(chamber).clone().lerp(paint(seeds), 0.35).getHexString()}`;
        g.beginPath();
        g.moveTo(-h * 0.1, 0);
        g.bezierCurveTo(-h * 0.02, -h * 0.055, h * 0.075, -h * 0.05, h * 0.1, 0);
        g.bezierCurveTo(h * 0.075, h * 0.05, -h * 0.02, h * 0.055, -h * 0.1, 0);
        g.fill();
        g.restore();
      }
      g.restore();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = bump ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  };
  return {map: make(false), bump: make(true)};
}

/** One half of the form, its cut face closed by a cap that follows the half's own uneven rim */
function half(bend: (p: THREE.Vector3) => THREE.Vector3, top: boolean) {
  const W = 72, H = 28;
  const g = new THREE.SphereGeometry(1, W, H, 0, Math.PI * 2, top ? 0 : Math.PI / 2, Math.PI / 2);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    const s = bend(v.fromBufferAttribute(pos, i));
    pos.setXYZ(i, s.x, s.y, s.z);
  }
  g.computeVertexNormals();
  // the rim: the row of the half that lies on the cut, flattened onto it
  const row = top ? H : 0, ring: THREE.Vector3[] = [];
  for (let j = 0; j <= W; j++) {
    const k = row * (W + 1) + j;
    ring.push(new THREE.Vector3(pos.getX(k), 0, pos.getZ(k)));
    pos.setY(k, 0);
  }
  const rmax = Math.max(...ring.map((p) => Math.hypot(p.x, p.z)));
  const cp: number[] = [0, 0, 0], cu: number[] = [0.5, 0.5], idx: number[] = [];
  ring.forEach((p, j) => { cp.push(p.x, 0, p.z); cu.push(0.5 + p.x / rmax / 2, 0.5 - p.z / rmax / 2); });
  for (let j = 1; j <= W; j++) top ? idx.push(0, j + 1, j) : idx.push(0, j, j + 1);
  const cap = new THREE.BufferGeometry();
  cap.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3));
  cap.setAttribute('uv', new THREE.Float32BufferAttribute(cu, 2));
  cap.setIndex(idx);
  cap.computeVertexNormals();
  let ext = 0;
  for (let i = 0; i < pos.count; i++) ext = Math.max(ext, Math.abs(pos.getY(i)));
  return {shell: g, cap, ext, rmax};
}

export function Slice({x = 0, z = 0, size = 8, shape = 'fruit', color = 'data', rings = [], chambers = 0, chamber = 'panel2', seeds = 'text', pop = 0, side = 1, cut = 0, open = 0, seed = ''}: {
  x?: number; z?: number; size?: number; shape?: string; color?: string; rings?: Ring[]; chambers?: number; chamber?: string; seeds?: string; pop?: number; side?: number; cut?: number; open?: number; seed?: string;
}) {
  const paint = useClayColor();
  const s = size / 2;
  useClay(() => {
    const bend = deformer(shape as Shape, seedOf(seed || `slice/${x}/${z}`));
    const skin = clay(paint(color), {repeat: 0.9});
    const {map, bump} = face(rings, chambers, paint, chamber, seeds, color);
    const inside = new THREE.MeshPhysicalMaterial({map, bumpMap: bump, bumpScale: 4, roughness: 0.72, sheen: 0.25, sheenRoughness: 0.7, sheenColor: new THREE.Color('#fff4e6'), specularIntensity: 0.4});
    const seedMat = clay(paint(seeds), {bump: 0.4});
    seedMat.roughness = 0.45;
    const seedGeo = formGeometry('drop', seedOf(`${seed}/seed`), 2, 0, 0, 20);
    const build = (top: boolean) => {
      const h = half(bend, top);
      const grp = new THREE.Group();
      const shell = new THREE.Mesh(h.shell, skin), cap = new THREE.Mesh(h.cap, inside);
      for (const m of [shell, cap]) { m.castShadow = true; m.receiveShadow = true; }
      grp.add(shell, cap);
      // a seed in each chamber, lying on the cut face with its point to the centre, where the face's drawing has its bed
      const beds = new THREE.Group();
      for (let i = 0; i < chambers; i++) {
        const a = (i / chambers) * Math.PI * 2 - Math.PI / 2;
        const dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
        const holder = new THREE.Group();
        holder.position.copy(dir.clone().multiplyScalar(0.33 * h.rmax));
        const m = new THREE.Mesh(seedGeo, seedMat);
        m.castShadow = true;
        m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().negate());
        m.position.copy(dir.clone().multiplyScalar(0.095 * h.rmax));
        holder.add(m);
        holder.scale.set(1, top ? -1 : 1, 1);
        beds.add(holder);
      }
      grp.add(beds);
      grp.userData.ext = h.ext;
      grp.userData.rmax = h.rmax;
      return grp;
    };
    const bottom = build(false), topHalf = build(true);
    // the seam the wire leaves, and the wire itself: taut between two wooden toggles
    const groove = new THREE.Mesh(new THREE.TorusGeometry(1, 0.022, 6, 4, 0.1), new THREE.MeshStandardMaterial({color: paint(color).multiplyScalar(0.3), roughness: 0.9}));
    const tool = new THREE.Group();
    const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 3.2, 6), new THREE.MeshStandardMaterial({color: '#c9c4bc', roughness: 0.3, metalness: 0.8}));
    wire.rotation.z = Math.PI / 2;
    const wood = clay(paint('muted'), {bump: 0.6});
    tool.add(wire);
    for (const sz of [-1, 1]) {
      const toggle = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.42, 6, 12), wood);
      toggle.position.set(sz * 1.62, 0.12, 0);
      toggle.castShadow = true;
      tool.add(toggle);
    }
    const group = new THREE.Group();
    group.add(bottom, topHalf, groove, tool, contactShadow(), contactShadow());
    return group;
  }, (g) => {
    const [bottom, topHalf, groove, tool, sh1, sh2] = g.children as [THREE.Group, THREE.Group, THREE.Mesh, THREE.Group, THREE.Mesh, THREE.Mesh];
    const lower = bottom.userData.ext as number, upper = topHalf.userData.ext as number, rmax = bottom.userData.rmax as number;
    const base = lower * s;
    bottom.position.set(x, base, z);
    bottom.scale.setScalar(s);
    const c = unit(cut), o = unit(open);
    // the wire, taut across the form, is drawn through its middle from the front to the back, then lifts away
    const sweep = unit(c / 0.8), away = unit((c - 0.8) / 0.2);
    const e = sweep * sweep * (3 - 2 * sweep);
    const wz = rmax * 1.35 - rmax * 2.7 * e;
    tool.visible = c > 0.002 && away < 1 && o < 0.02;
    tool.position.set(x, base + away * away * size * 0.9, z + wz * s);
    tool.scale.setScalar(s);
    tool.rotation.x = -0.3 * away;
    // the seam: the part of the rim the wire has passed, opening from the front
    const passed = Math.acos(Math.max(-1, Math.min(1, wz / rmax)));
    groove.visible = c > 0.002 && passed > 0.01 && o < 0.02;
    if (groove.visible) {
      groove.geometry.dispose();
      groove.geometry = new THREE.TorusGeometry(rmax * 0.985, 0.022, 6, Math.max(4, Math.round(80 * passed)), passed * 2);
    }
    groove.position.set(x, base, z);
    groove.scale.setScalar(s);
    groove.rotation.set(Math.PI / 2, 0, Math.PI / 2 - passed);
    // the top half: slides a little on the cut, springs up, corkscrews over the gap and lands cut face up with a squash
    const dx = side * (size * 1.08);
    const slide = unit(o / 0.18), flight = unit((o - 0.12) / 0.6);
    const fe = flight * flight * (3 - 2 * flight);
    const lift = Math.sin(Math.PI * flight) * size * 0.75;
    const restY = upper * s;
    const land = landing(unit((o - 0.72) / 0.28) * 0.58 + 0.42, size * 0.25);
    const settled = o >= 0.72;
    const shear = side * size * 0.06 * Math.sin(Math.PI * slide) * (1 - fe);
    topHalf.position.set(x + shear + dx * fe, settled ? restY + land.y : base + (restY - base) * fe + lift, z);
    topHalf.rotation.set(0, Math.PI * 2 * fe, -side * Math.PI * fe);
    const k = settled ? land.s : 1 + 0.12 * Math.sin(Math.PI * flight);
    topHalf.scale.set(s / Math.sqrt(k), s * k, s / Math.sqrt(k));
    // the seeds pop up out of their beds one after another, bottom half first
    const beds = [bottom.children[2], topHalf.children[2]];
    beds.forEach((grp, half) => grp.children.forEach((holder, i) => {
      const p = unit(pop * 1.7 - (i + half * chambers) / Math.max(1, chambers * 2) * 0.9);
      const f = forming(p);
      const m = holder.children[0];
      m.scale.setScalar(0.085 * f.g);
      m.visible = f.g > 0.01;
      holder.position.y = (half ? -1 : 1) * 0.01;
      holder.scale.y = (half ? -1 : 1) * f.s;
    }));
    placeShadow(sh1, x, z, size * 0.95, 0);
    placeShadow(sh2, x + dx * fe, z, size * 0.95, topHalf.position.y - restY, o > 0.01 ? 1 : 0);
  });
  return null;
}
