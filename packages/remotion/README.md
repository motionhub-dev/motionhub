# @motionhub/remotion

Use a motion from [motionhub.dev](https://motionhub.dev) in Remotion. Its React components (`react/parts/`) run as they are, drawn by Remotion's frame; its tokens become Remotion values for anything you draw yourself.

```sh
npx @motionhub/cli get @iamsuosi/stage-light   # into ./motions/@iamsuosi/stage-light/
npm i @motionhub/remotion @motionhub/runtime
```

Wrap the composition once, outside every `<Sequence>`, with the motion's tokens, and use the components with props. Inside a `<Sequence>`, a component's `useTime()` starts with it.

```tsx
import {Sequence, interpolate, useCurrentFrame} from 'remotion';
import {Caption} from '@motionhub/runtime';
import {MotionFonts, MotionProvider} from '@motionhub/remotion';
import tokens from '../motions/@iamsuosi/stage-light/tokens.json';
import {Plate} from '../motions/@iamsuosi/stage-light/react/parts/plate.tsx';
import {Numeral} from '../motions/@iamsuosi/stage-light/react/parts/numeral.tsx';

export const Film = () => {
  const frame = useCurrentFrame();
  const value = interpolate(frame, [30, 90], [0, 3], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <MotionProvider tokens={tokens}>
      <MotionFonts />
      <div style={{position: 'absolute', left: 200, top: 170, width: 680, height: 200}}><Plate title="Heat pump" sub="1 kWh in" /></div>
      <div style={{position: 'absolute', left: 200, top: 420, width: 680, height: 360}}><Numeral value={value} unit="kWh" accent /></div>
      <Sequence from={30} durationInFrames={90}><Caption>A heat pump moves three units of heat for each one it uses.</Caption></Sequence>
    </MotionProvider>
  );
};
```

- Each component's props are in its file's `meta` (what it is for, what fits it, each parameter) and signature, and the motion's `react/previews/<file>.jpg` shows it. A parameter of type `progress` runs from 0 to 1: animate it with `interpolate`.
- `MotionProvider` gives the components their runtime (`@motionhub/runtime`) from Remotion's frame, and sets the tokens as `--color-*`, `--font-*` and `--caption-*` on a full-frame root (`root={false}` leaves it out). A component's `<Video src>` is an `<OffthreadVideo>`: `src` is a URL or a path in `public/`.
- A face the motion carries in its `react/fonts/` (`fonts.json` names each) is loaded with `@remotion/fonts`' `loadFont`, from a copy in `public/`.
- `MotionFonts` loads the faces the tokens name before the first frame, from Google Fonts or, for one it lacks (LXGW WenKai), from where it is. `han` adds the Chinese, Japanese and Korean faces, every part of them (several MB each), since a part fetched only when its text is first drawn arrives too late for that frame. A face no source has is named in the console: bundle it with `@remotion/fonts`.
- `useMotion()` turns the tokens into Remotion values: `tokens`, `frames('light')` (a duration in frames), `ease('light')` (an `Easing.bezier`), `progress(frame, start, 'light', 'light')`, for a motion with `duration` and `easing` tokens.
- A component that draws in 3D imports `three`: `npm i three`.
- The components are imported with their `.tsx` extension; set `"allowImportingTsExtensions": true` and `"noEmit": true` in `tsconfig.json` if you type-check them, and `"resolveJsonModule": true` for `tokens.json`.

## A film of scenes

A film drawn as `@motionhub/runtime`'s `<Film>` of `<Scene>`s (0.6 or later; the Open Motion Studio's films are, and its Remotion export
writes this for one) plays in Remotion with each scene in a `Series.Sequence` of its own, so the scenes are named clips on the Studio's
timeline. `<FilmScene id>` draws one scene of the film on the sequence's clock; `sceneFrames` gives each its length in frames, and
`filmMetadata` the composition's, checking that the film's scenes are the ones placed:

```tsx
import {Composition, Series} from 'remotion';
import {FilmScene} from '@motionhub/runtime';
import {MotionProvider, filmMetadata, sceneFrames} from '@motionhub/remotion';
import Main, {film} from '../film';

const frames = sceneFrames(Main, film);
const scene = (id: string) => <FilmScene id={id}><Main /></FilmScene>;

const Film = () => (
  <MotionProvider tokens={{}} root={false}>
    <Series>
      <Series.Sequence name="intro" durationInFrames={frames.intro}>{scene('intro')}</Series.Sequence>
      <Series.Sequence name="how" durationInFrames={frames.how}>{scene('how')}</Series.Sequence>
    </Series>
  </MotionProvider>
);

export const Root = () => (
  <Composition id="film" component={Film} durationInFrames={1} fps={film.fps ?? 30} width={film.width ?? 1920} height={film.height ?? 1080}
    calculateMetadata={() => filmMetadata(Main, film, ['intro', 'how'])} />
);
```

Each `Series.Sequence` is written on a line of its own because Remotion Studio's timeline tells sequences apart by where they are written:
made in a loop, they would show as one row. A scene's seconds are put on whole frames that meet end to end. A scene's length changed in
the film follows by itself; a scene added, taken out or moved is an error until the `Series` places it. The film's own motions are its
`<MotionScope>`s, so the provider's tokens can be empty.

## Several motions in one film

A film can change motion from scene to scene, or hold two in one frame ([a project's motions](../../SPEC.md#13-a-projects-motions)). Keep one `<MotionProvider>` outside every `<Sequence>`, and wrap each scene in `<MotionScope tokens>` from `@motionhub/runtime` (0.4 or later): the components under it read that motion's tokens and custom properties, and keep Remotion's frame and the film's time. Load every motion's faces before the first frame, each `<MotionFonts>` in its own scope with `root={false}`:

```tsx
import {Sequence} from 'remotion';
import {MotionScope} from '@motionhub/runtime';
import {MotionFonts, MotionProvider} from '@motionhub/remotion';
import notebook from '../motions/@iamsuosi/lab-notebook/tokens.json';
import pencil from '../motions/@iamsuosi/red-pencil/tokens.json';
import {Opening} from '../motions/@iamsuosi/lab-notebook/react/parts/opening.tsx';
import {Headline} from '../motions/@iamsuosi/red-pencil/react/parts/headline.tsx';

export const Film = () => (
  <MotionProvider tokens={notebook} root={false}>
    <MotionScope tokens={notebook} root={false}><MotionFonts /></MotionScope>
    <MotionScope tokens={pencil} root={false}><MotionFonts /></MotionScope>
    <Sequence durationInFrames={150}><MotionScope tokens={notebook}><Opening lines={["Heat pumps"]} /></MotionScope></Sequence>
    <Sequence from={150} durationInFrames={210}><MotionScope tokens={pencil}><Headline title="Where they came from" /></MotionScope></Sequence>
  </MotionProvider>
);
```

Do not nest a second `<MotionProvider>` inside a `<Sequence>` for this: it would count the film's time from that sequence's start.
