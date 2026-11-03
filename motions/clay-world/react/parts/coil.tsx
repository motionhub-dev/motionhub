// A coil of clay rolled out along a path, the way a child rolls a snake between their palms: thicker and thinner along its length, a round
// end leading as it is laid down. It is a stem, a branch, a root, a river, a vessel, or an arrow from one form to the next.
import * as THREE from 'three';
import {clay, seedOf, unit, useClay, useClayColor} from './world.tsx';

export const meta = {
  name: {en: 'Rolled coil', 'zh-CN': '搓泥条'},
  purpose: 'link',
  line: 'A snake of clay rolled out along a path as it is said, its round end leading; with an arrow it points onward.',
  fits: 'a stem or branch, a root, a river, a vessel, the arrow of a cycle',
  params: {
    path: {type: 'points', doc: 'the points it runs through, each [x, y, z] in clay units; it curves smoothly through them'},
    radius: {type: 'number', default: 0.5, doc: 'how thick it is rolled'},
    taper: {type: 'number', default: 0, doc: '0 even; 1 thins to a point at its far end, like a branch or a root'},
    color: {type: 'text', default: 'text', doc: 'its clay: a colour token or a hex'},
    draw: {type: 'progress', default: 1, doc: '0 not laid, 1 laid all the way: tween it on the word'},
    arrow: {type: 'boolean', default: false, doc: 'a round arrowhead at its far end, pressed on once it arrives'},
    seed: {type: 'text', default: '', doc: 'a word that makes its unevenness its own'},
  },
  preview: 1.0,
};

const T = 160, R = 14;

export function Coil({path, radius = 0.5, taper = 0, color = 'text', draw = 1, arrow = false, seed = ''}: {
  path: number[][]; radius?: number; taper?: number; color?: string; draw?: number; arrow?: boolean; seed?: string;
}) {
  const paint = useClayColor();
  const d = unit(draw);
  useClay(() => {
    const curve = new THREE.CatmullRomCurve3(path.map(([x, y, z]) => new THREE.Vector3(x, y, z)), false, 'centripetal');
    const g = new THREE.TubeGeometry(curve, T, 1, R, false);
    // roll it by hand: the thickness swells and thins along its length, and it tapers if asked
    const pos = g.attributes.position as THREE.BufferAttribute;
    const n = seedOf(seed || JSON.stringify(path));
    const L = curve.getLength() / Math.max(0.2, radius);   // its length in thicknesses: a short twig swells once, a long branch many times
    const wob = (s: number) => 1 + 0.07 * Math.sin(s * L * 0.35 + n % 7) + 0.04 * Math.sin(s * L * 0.9 + n % 13);
    const thick = (s: number) => radius * wob(s) * (1 - taper * 0.85 * s);
    const c = new THREE.Vector3(), v = new THREE.Vector3();
    for (let i = 0; i <= T; i++) {
      const s = i / T;
      curve.getPointAt(s, c);
      for (let j = 0; j <= R; j++) {
        const k = i * (R + 1) + j;
        v.fromBufferAttribute(pos, k).sub(c).multiplyScalar(thick(s)).add(c);
        pos.setXYZ(k, v.x, v.y, v.z);
      }
    }
    g.computeVertexNormals();
    const mat = clay(paint(color), {repeat: 0.5, bump: 0.8});
    const tube = new THREE.Mesh(g, mat);
    const cap = () => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), mat); m.castShadow = true; return m; };
    const head = new THREE.Mesh(new THREE.ConeGeometry(1, 1.6, 24, 1), mat);
    head.geometry.translate(0, 0.8, 0);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 12), mat);
    tip.position.y = 1.5;
    head.add(tip);
    for (const m of [tube, head, tip]) { m.castShadow = true; m.receiveShadow = true; }
    const group = new THREE.Group();
    group.add(tube, cap(), cap(), head);
    group.userData = {curve, thick};
    return group;
  }, (g) => {
    const [tube, start, end, head] = g.children as THREE.Mesh[];
    const {curve, thick} = g.userData as {curve: THREE.CatmullRomCurve3; thick: (s: number) => number};
    (tube.material as THREE.MeshPhysicalMaterial).color.copy(paint(color));
    const segs = Math.floor(d * T);
    tube.geometry.setDrawRange(0, segs * R * 6);
    g.visible = d > 0.002;
    start.position.copy(curve.getPointAt(0));
    start.scale.setScalar(thick(0) * unit(d * 40));
    const at = segs / T;
    end.position.copy(curve.getPointAt(at));
    end.scale.setScalar(thick(at) * 1.02);
    // the arrowhead is pressed on after the coil arrives, with a small squash
    const a = arrow ? unit((d - 0.9) / 0.1) : 0;
    head.visible = a > 0;
    if (a > 0) {
      const p = curve.getPointAt(1), dir = curve.getTangentAt(1);
      const r = Math.max(thick(1), radius * 0.9) * 2.1;
      head.position.copy(p);
      head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      const pop = a < 1 ? 1 + 0.25 * Math.sin(a * Math.PI) : 1;
      head.scale.set(r * a * pop, r * a / pop, r * a * pop);
    }
  });
  return null;
}
