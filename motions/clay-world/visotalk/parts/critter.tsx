// A little clay character: an egg of a body, two pressed-on eyes that blink and look, and what its kind needs (bands, wings, antennae, a beak).
// It flies or hops in along an arc and lands with a squash, so a story can follow it from place to place.
import * as THREE from 'three';
import {clay, contactShadow, formGeometry, landing, placeShadow, seedOf, squash, unit, useClay, useClayColor, mix} from './world.tsx';
import {useDocTime} from '@visotalk/runtime';

export const meta = {
  name: {en: 'Little clay character', 'zh-CN': '黏土小角色'},
  purpose: 'mark',
  line: 'A small clay character with pressed-on eyes that blink and look; it flies in, perhaps looping the loop, and lands with a squash.',
  fits: 'a bee, a ladybird, a bird, a germ: the one the story follows',
  params: {
    x: {type: 'number', default: 0, doc: 'where it lands, across'},
    y: {type: 'number', default: 0, doc: 'the height it lands at (a flower, a branch)'},
    z: {type: 'number', default: 0, doc: 'where it lands, towards the camera'},
    size: {type: 'number', default: 3, doc: 'how long its body is'},
    color: {type: 'text', default: 'warn', doc: 'the clay of its body'},
    bands: {type: 'number', default: 0, doc: 'dark bands round its body, for a bee or a wasp'},
    band: {type: 'text', default: 'text', doc: 'the clay of the bands'},
    wings: {type: 'boolean', default: false, doc: 'two pale wings that beat while it flies'},
    antennae: {type: 'boolean', default: false, doc: 'two feelers with round tips'},
    beak: {type: 'boolean', default: false, doc: 'a small cone of a beak, for a bird'},
    from: {type: 'point', default: [-20, 12, 0], doc: '[x, y, z] where it comes from'},
    arrive: {type: 'progress', default: 1, doc: '0 at from, 1 landed at its place: tween it linearly over a second or two'},
    loops: {type: 'number', default: 0, doc: 'loop-the-loops it turns on the way, for joy; 0 flies straight in'},
    turn: {type: 'number', default: 0, doc: 'degrees it faces round from the camera; it faces the way it flies until it lands'},
    look: {type: 'number', default: 0, doc: 'where its eyes look: -1 left, 1 right'},
    shadow: {type: 'number', default: 1, doc: '0 when it lands on something above the floor'},
  },
  preview: 4.8,
};

export function Critter({x = 0, y = 0, z = 0, size = 3, color = 'warn', bands = 0, band = 'text', wings = false, antennae = false, beak = false, from = [-20, 12, 0], arrive = 1, loops = 0, turn = 0, look = 0, shadow = 1}: {
  x?: number; y?: number; z?: number; size?: number; color?: string; bands?: number; band?: string; wings?: boolean; antennae?: boolean; beak?: boolean;
  from?: number[]; arrive?: number; loops?: number; turn?: number; look?: number; shadow?: number;
}) {
  const paint = useClayColor();
  const t = useDocTime();
  const a = unit(arrive);
  useClay(() => {
    const root = new THREE.Group(), body = new THREE.Group();
    // the body lies along z, its belly on y = 0; bands are painted into the clay by vertex colour
    const g = formGeometry('egg', seedOf('critter/body'), 2, 0, 0, 48);
    g.rotateX(Math.PI / 2);
    g.computeBoundingBox();
    g.translate(0, 0.86, -(g.boundingBox!.min.z + g.boundingBox!.max.z) / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const col = new Float32Array(pos.count * 3), cb = paint(color), cd = paint(band);
    for (let i = 0; i < pos.count; i++) {
      const zz = pos.getZ(i);
      const striped = bands > 0 && zz < 0.55 && Math.sin((zz + 1.2) * Math.PI * bands / 1.5) > 0.35;
      const c = striped ? cd : cb;
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const skin = clay(new THREE.Color('#ffffff'), {repeat: 0.6});
    skin.vertexColors = true;
    const trunk = new THREE.Mesh(g, skin);
    trunk.castShadow = trunk.receiveShadow = true;
    body.add(trunk);
    // eyes: white balls with dark pupils, on the front of the head
    const white = clay(new THREE.Color('#fbf6ee'), {bump: 0.3}), ink = new THREE.MeshPhysicalMaterial({color: paint('text'), roughness: 0.35, sheen: 0});
    const eyes: THREE.Group[] = [];
    for (const sx of [-1, 1]) {
      const eye = new THREE.Group();
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 16), white);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), ink);
      pupil.position.set(0, 0.02, 0.17);
      eye.add(ball, pupil);
      eye.position.set(sx * 0.23, 1.16, 0.93);
      eye.rotation.y = sx * 0.25;
      eyes.push(eye);
      body.add(eye);
    }
    // a smile pressed in with a tool
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.028, 6, 16, Math.PI * 0.8), ink);
    smile.position.set(0, 0.84, 1.07);
    smile.rotation.set(0.35, 0, Math.PI + Math.PI * 0.1);
    body.add(smile);
    const extras = new THREE.Group();
    if (wings) {
      const wingMat = clay(new THREE.Color('#f7f3ec'), {bump: 0.4});
      for (const sx of [-1, 1]) {
        const w = new THREE.Mesh(formGeometry('petal', seedOf(`wing${sx}`), 1.5), wingMat);
        w.castShadow = true;
        const hinge = new THREE.Group();
        w.rotation.y = sx * Math.PI / 2;     // the petal's tip points out to its side
        w.position.set(sx * 0.6, 0, 0);
        hinge.add(w);
        hinge.position.set(sx * 0.25, 1.55, -0.15);
        hinge.userData.side = sx;
        extras.add(hinge);
      }
    }
    if (antennae) {
      for (const sx of [-1, 1]) {
        const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(sx * 0.12, 1.3, 0.8), new THREE.Vector3(sx * 0.22, 1.95, 1.0), new THREE.Vector3(sx * 0.42, 1.95, 1.3));
        const stalk = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.04, 6), ink);
        const tip = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), ink);
        tip.position.copy(curve.getPoint(1));
        body.add(stalk, tip);
      }
    }
    if (beak) {
      const b = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 16), clay(paint('warn')));
      b.rotation.x = Math.PI / 2;
      b.position.set(0, 0.92, 1.18);
      body.add(b);
    }
    body.add(extras);
    root.add(body, contactShadow());
    root.userData.eyes = eyes;
    return root;
  }, (root) => {
    const body = root.children[0] as THREE.Group, sh = root.children[1] as THREE.Mesh;
    const s = size / 2;
    // the flight: an arc from `from` to its place, the last part a landing
    const fly = Math.min(1, a / 0.8);
    const e = fly * fly * (3 - 2 * fly);
    const [fx, fy, fz] = from;
    const arc = Math.sin(Math.PI * e) * 4;
    const settle = landing(a < 0.8 ? 0.42 : 0.42 + (a - 0.8) / 0.2 * 0.58, 1.5);
    const px = mix(fx, x, e), pz = mix(fz, z, e);
    const hover = a < 1 ? Math.sin(t * 9) * 0.25 * (1 - a) : 0;
    const heading = Math.atan2(x - fx, z - fz), k = a < 0.8 ? 0 : (a - 0.8) / 0.2;
    // a loop-the-loop in the middle of the flight: round a vertical circle in the plane it travels in, turning head over heels
    const u = loops > 0 ? unit((fly - 0.3) / 0.45) : 0, turnU = u * u * (3 - 2 * u) * loops;
    const R = size * 1.1, ahead = R * Math.sin(2 * Math.PI * turnU), up = R * (1 - Math.cos(2 * Math.PI * turnU));
    const py = a < 0.8 ? mix(fy, y, e) + arc + hover + up : y + settle.y;
    body.position.set(px + Math.sin(heading) * ahead, py, pz + Math.cos(heading) * ahead);
    body.rotation.order = 'YXZ';
    body.rotation.set((a < 0.8 ? -0.15 : 0) - 2 * Math.PI * turnU, mix(heading, turn * Math.PI / 180, k * k * (3 - 2 * k)), 0);
    squash(body, a < 0.8 ? 1.06 : settle.s, s);
    // wings beat fast while it flies, then fold and twitch
    const extras = body.children[body.children.length - 1];
    for (const hinge of extras.children) {
      const side = hinge.userData.side as number;
      const beat = a < 0.97 ? Math.sin(t * 46) * 0.7 : Math.sin(t * 2.3) * 0.06;
      hinge.rotation.set(0, -0.35 * side, side * (0.45 + beat));
    }
    // a blink every few seconds, and eyes that look
    const blink = ((t + 0.7) % 3.4) < 0.12 ? 0.12 : 1;
    for (const eye of root.userData.eyes as THREE.Group[]) {
      eye.scale.set(1, blink, 1);
      eye.children[1].position.x = 0.08 * look;
    }
    placeShadow(sh, px, pz, size * 0.8, py, shadow);
  });
  return null;
}
