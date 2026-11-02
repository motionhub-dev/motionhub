// A splash of clay crumbs where something lands hard: small pellets thrown out in a ring, each flying its own arc, landing with a squash,
// skidding a little and settling where it stops. Every pellet's size, direction and speed come from the seed, so a frame is the same twice.
import * as THREE from 'three';
import {clay, formGeometry, seedOf, squash, unit, useClay, useClayColor} from './world.tsx';
import {random} from '@visotalk/runtime';

export const meta = {
  name: {en: 'Splash of crumbs', 'zh-CN': '泥屑飞溅'},
  purpose: 'mark',
  line: 'Clay crumbs thrown out in a ring from an impact, each flying its own arc and landing with a squash.',
  fits: 'a fruit hitting the ground, a splash, a meteor, a hammer blow',
  params: {
    x: {type: 'number', default: 0, doc: 'where the impact is, across'},
    z: {type: 'number', default: 0, doc: 'where the impact is, towards the camera'},
    count: {type: 'number', default: 12, doc: 'how many crumbs'},
    reach: {type: 'number', default: 6, doc: 'how far the farthest crumb flies'},
    size: {type: 'number', default: 0.6, doc: 'the size of a large crumb'},
    color: {type: 'text', default: 'faint', doc: 'their clay, or several separated by commas'},
    burst: {type: 'progress', default: 0, doc: '0 not thrown, 1 every crumb settled: tween it linearly over about a second, on the word of the impact'},
    seed: {type: 'text', default: '', doc: 'a word that makes this splash its own'},
  },
  preview: 19.1,
};

export function Crumbs({x = 0, z = 0, count = 12, reach = 6, size = 0.6, color = 'faint', burst = 0, seed = ''}: {
  x?: number; z?: number; count?: number; reach?: number; size?: number; color?: string; burst?: number; seed?: string;
}) {
  const paint = useClayColor();
  const b = unit(burst);
  useClay(() => {
    const r = random(`crumbs/${seed || `${x}/${z}`}`);
    const colours = color.split(',').map((c) => c.trim());
    const group = new THREE.Group();
    for (let i = 0; i < count; i++) {
      const s = size * (0.45 + r() * 0.55);
      const mesh = new THREE.Mesh(formGeometry(r() < 0.5 ? 'ball' : 'pebble', seedOf(`${seed}${i}`), 2, 0.4, 0, 18), clay(paint(colours[i % colours.length]), {bump: 0.5}));
      mesh.castShadow = true;
      const pivot = new THREE.Group();
      pivot.add(mesh);
      // each crumb: its direction round the ring, how far it goes, how high it flies, and when it leaves
      pivot.userData = {s, a: (i / count) * Math.PI * 2 + (r() - 0.5) * 0.9, d: reach * (0.35 + r() * 0.65), h: 1.2 + r() * 2.6, t0: r() * 0.12, spin: (r() - 0.5) * 8};
      group.add(pivot);
    }
    return group;
  }, (g) => {
    g.visible = b > 0;
    for (const pivot of g.children) {
      const {s, a, d, h, t0, spin} = pivot.userData as {s: number; a: number; d: number; h: number; t0: number; spin: number};
      const p = unit((b - t0) / (1 - t0));
      const fly = unit(p / 0.55), after = unit((p - 0.55) / 0.45);
      // out along a parabola, then a short skid that slows to a stop
      const along = d * (fly * 0.86 + 0.14 * (1 - (1 - after) * (1 - after)));
      const y = 4 * h * fly * (1 - fly) * (1 - after);
      pivot.position.set(x + Math.cos(a) * along, y, z + Math.sin(a) * along * 0.8);
      pivot.rotation.set(spin * fly, spin * 0.5 * fly, 0);
      // stretched in flight, squashed on landing, then round
      const k = p <= 0 ? 0 : fly < 1 ? 1.25 : 1 - 0.38 * Math.sin(Math.min(1, after * 3) * Math.PI) * (1 - after);
      pivot.scale.setScalar(p > 0 ? s / 2 * Math.min(1, p * 8) : 0.0001);
      squash(pivot.children[0], k <= 0 ? 1 : k, 1);
    }
  });
  return null;
}
