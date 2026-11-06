// The browser half of @motionhub/hyperframes, bundled by cli.js with the motions' components into assets/motion/motion.js.
// It sets window.Motions, by each motion's id: mount(), which draws the motion's components with their runtime
// (@motionhub/runtime) and its tokens at the time a GSAP timeline is at, so every frame is a function of timeline time; the
// components; and the tokens, with GSAP-ready eases. With one motion, window.Motion is that one.
import {createElement as h} from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {Caption, MotionRoot, MotionRuntimeProvider} from '@motionhub/runtime';
import {motions} from 'motionhub:motion';

/** The curve [x1, y1, x2, y2] as a function GSAP takes for `ease` */
function bezier(x1, y1, x2, y2) {
  const at = (a, b, t) => 3 * a * t * (1 - t) * (1 - t) + 3 * b * t * t * (1 - t) + t * t * t;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let lo = 0, hi = 1, t = x;
    for (let i = 0; i < 40; i++) { t = (lo + hi) / 2; if (at(x1, x2, t) < x) lo = t; else hi = t; }
    return at(y1, y2, t);
  };
}

/** A box at x, y of w × h pixels holding `child` */
const box = (x, y, w, hgt, child) => h('div', {style: {position: 'absolute', left: x, top: y, width: w, height: hgt}}, child);

/** One motion's side of window.Motions */
function motion({id, components, tokens}) {
  /**
   * Draw `draw(t)` (React elements, made with h) into `el` whenever render(t) is called, from the timeline's onUpdate:
   * `tl.eventCallback('onUpdate', () => m.render(tl.time())); m.render(0);`. `options`: width, height, fps (1920, 1080, 30), and `offset`, the
   * composition's start in the film, so useCompositionTime() counts from the film's start. `el` is marked as this motion's (data-motion), so its
   * own HTML takes this motion's custom properties from motion.css.
   */
  function mount(el, draw, options = {}) {
    const {width = 1920, height = 1080, fps = 30, offset = 0} = options;
    el.setAttribute('data-motion', id);
    const root = createRoot(el);
    const render = (t) => {
      const value = {useTime: () => t, useCompositionTime: () => offset + t, fps, width, height, tokens};
      flushSync(() => root.render(h(MotionRuntimeProvider, {value}, h(MotionRoot, {tokens}, draw(t)))));
    };
    return {render};
  }
  const need = (group, name) => {
    const v = tokens[group]?.[name];
    if (v === undefined) throw new Error(`${id} has no ${group} token "${name}": it has ${Object.keys(tokens[group] ?? {}).join(', ') || 'none'}`);
    return v;
  };
  return {id, h, mount, box, components: {...components, Caption}, tokens, seconds: (name) => need('duration', name), ease: (name) => bezier(...need('easing', name))};
}

window.Motions = Object.fromEntries(motions.map((m) => [m.id, motion(m)]));
if (motions.length === 1) window.Motion = window.Motions[motions[0].id];
