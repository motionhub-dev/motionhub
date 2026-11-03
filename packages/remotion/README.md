# @motionhub/remotion

Use a motion from [motionhub.dev](https://motionhub.dev) in Remotion. Its React components (`motion/react/parts/`) run as they are, drawn by Remotion's frame; its tokens become Remotion values for anything you draw yourself.

```sh
npx @motionhub/cli get @iamsuosi/stage-light   # into ./motion
npm i @motionhub/remotion
```

Wrap the composition once, outside every `<Sequence>`, with the motion's tokens, and use the components with props. Inside a `<Sequence>`, a component's `useTime()` starts with it.

```tsx
import {Sequence, interpolate, useCurrentFrame} from 'remotion';
import {Caption} from '@motionhub/runtime';
import {MotionFonts, MotionProvider} from '@motionhub/remotion';
import tokens from '../motion/tokens.json';
import {Plate} from '../motion/react/parts/plate.tsx';
import {Numeral} from '../motion/react/parts/numeral.tsx';

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

- Each component's props are in its file's `meta` (what it is for, what fits it, each parameter) and signature, and `motion/react/previews/<file>.jpg` shows it. A parameter of type `progress` runs from 0 to 1: animate it with `interpolate`.
- `MotionProvider` gives the components their runtime (`@motionhub/runtime`) from Remotion's frame, and sets the tokens as `--color-*`, `--font-*` and `--caption-*` on a full-frame root (`root={false}` leaves it out). A component's `<Video src>` is an `<OffthreadVideo>`: `src` is a URL or a path in `public/`.
- A face the motion carries in `motion/react/fonts/` (`fonts.json` names each) is loaded with `@remotion/fonts`' `loadFont`, from a copy in `public/`.
- `MotionFonts` loads the faces the tokens name from Google Fonts before the first frame (`han` adds the large Chinese, Japanese and Korean ones). A face it cannot find is named in the console: bundle it with `@remotion/fonts`.
- `useMotion()` turns the tokens into Remotion values: `tokens`, `frames('light')` (a duration in frames), `ease('light')` (an `Easing.bezier`), `progress(frame, start, 'light', 'light')`, for a motion with `duration` and `easing` tokens.
- A component that draws in 3D imports `three`: `npm i three`.
- The components are imported with their `.tsx` extension; set `"allowImportingTsExtensions": true` and `"noEmit": true` in `tsconfig.json` if you type-check them, and `"resolveJsonModule": true` for `tokens.json`.
