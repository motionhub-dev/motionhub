# @motionhub/hyperframes

Use a motion from [motionhub.dev](https://motionhub.dev) in HyperFrames. Its React components (`motion/react/parts/`) are drawn at the time your GSAP timeline is at; its tokens become CSS variables and GSAP eases; its faces become local files. Nothing is fetched at render.

```sh
npx @motionhub/cli get @iamsuosi/stage-light   # into ./motion
npm i @motionhub/hyperframes
npx motionhub-hyperframes motion --out assets/motion
```

That writes `assets/motion/motion.js` (the components, React and `@motionhub/runtime` in one file), `motion.css` and `fonts/`. Add `--han` for a film with Chinese, Japanese or Korean text: it adds those faces, every part of them (several MB each). In `index.html`, before the compositions' scripts:

```html
<link rel="stylesheet" href="assets/motion/motion.css">
<script src="assets/motion/motion.js"></script>
```

In a composition, a state object your timeline tweens, and one mount that draws from it on every update:

```html
<div id="parts" class="clip" data-start="0" data-duration="8"></div>
<script>
  const {h, box, components: C} = Motion;
  const s = {value: 0, caption: 0};
  const tl = gsap.timeline({paused: true});
  tl.to(s, {value: 3, duration: 1.2, ease: 'power2.out'}, 1.0);
  tl.to(s, {caption: 1, duration: 0.3}, 1.0);
  const m = Motion.mount(document.getElementById('parts'), () => [
    box(200, 170, 680, 200, h(C.Plate, {title: 'Heat pump', sub: '1 kWh in'})),
    box(200, 420, 680, 360, h(C.Numeral, {value: s.value, unit: 'kWh', accent: true})),
    h(C.Caption, {opacity: s.caption}, 'A heat pump moves three units of heat for each one it uses.'),
  ]);
  tl.eventCallback('onUpdate', () => m.render(tl.time()));
  m.render(0);
  window.__timelines['main'] = tl;
</script>
```

- `Motion.components` holds every component and `Caption`; their props are in each file's `meta` (what it is for, what fits it, each parameter) and signature, and `motion/react/previews/<file>.jpg` shows it. A parameter of type `progress` runs from 0 to 1: tween `s.x` and pass it. A component that draws in 3D imports `three`: `npm i three` before bundling.
- `Motion.mount(el, draw, {width, height, fps, offset})` draws `draw(t)` into `el`; the components read `t` as their `useTime()`, and `offset + t` (the composition's start in the film) as their `useCompositionTime()`. Mount one per composition. A component that plays video (`<Video>`) is not supported here: use HyperFrames' own `<video>`.
- `Motion.box(x, y, w, h, child)` places a component in a box of that size; `Motion.h` is React's `createElement`.
- `Motion.tokens` are the resolved tokens; `Motion.seconds(name)` and `Motion.ease(name)` a duration and an easing for GSAP, when the motion has `duration` and `easing` tokens. `motion.css` has them all as `--color-*`, `--font-*`, `--duration-*`, `--easing-*` and `--caption-*`.
