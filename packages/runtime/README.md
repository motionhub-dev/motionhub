# @motionhub/runtime

What a motion's React components draw with, in any engine: their time, their frame, the motion's tokens, seeded randomness, video and a caption. The components in a motion's `react/parts/` import only this and React, so they run unchanged wherever an engine provides it.

You do not use this package on its own: an engine binding provides it.

- **Remotion**: [`@motionhub/remotion`](../remotion/README.md)
- **HyperFrames**: [`@motionhub/hyperframes`](../hyperframes/README.md)

| Export | What it is |
| --- | --- |
| `useTime()` | Seconds since the component's sequence began (a Remotion `<Sequence>`, a HyperFrames composition) |
| `useCompositionTime()` | Seconds since the film began, for motion that must run on across sequences |
| `useCurrentFrame()`, `useVideoConfig()` | As Remotion's: the sequence's frame, and `{width, height, fps}` |
| `useTokens()` | The motion's `tokens.json` resolved: `color.ink` (a CSS colour), `font.display` (a CSS stack), `duration.light` (seconds), `easing.light` (`[x1, y1, x2, y2]`), `caption.*` |
| `seededRandom(seed)` | A stream of numbers in [0, 1) for a string or number seed: the same seed draws the same picture in every engine |
| `<Video src startAt trimBefore playbackRate objectFit>` | The engine's video: shown from `startAt` s of the sequence, its source from `trimBefore` s |
| `<Caption line opacity>` | One spoken line, drawn from the `caption` tokens (font, size, weight, color, background, radius, padding-y, padding-x, bottom, max-width, shadow, rule-left or rule-top); with `line`, that line of the film's while it is said |
| `<Sequence from duration>`, `interpolate(t, input, output, {easing})`, `Easing` | As Remotion's, in seconds: a span whose children count time from its start, a value mapped through a curve, and the curves (`Easing.bezier` takes a cubicBezier token). For composing components, as a reel does |
| `<MotionRoot tokens>` | A full-frame box carrying the tokens as CSS custom properties |
| `<MotionScope tokens root>` | Its children drawn in another motion, on the engine's clock: `useTokens()` under it gives that motion's tokens (a `tokens.json`, or tokens already resolved), set as custom properties on a full-frame root (`root={false}` leaves it out). A film in several motions wraps each scene, or each part of a frame, in one |
| `<Film captions>`, `<Scene id duration>`, `<Layer id x y w h z>`, `<Line id text at dur>`, `<Sound src at …>` | A film made of scenes, for an engine that plays a whole film rather than one component: below |
| `resolveTokens(dtcg)`, `tokenVariables(tokens)` | `tokens.json` (W3C design tokens) as values, and those values as custom properties: `--color-ink`, `--font-display`, `--duration-light`, `--easing-light`, `--caption-size` |

A component colours with `var(--color-<name>)` and sets type with `var(--font-<name>)`, reads its time from `useTime()`, never from a clock, a timer or `Math.random`, and takes what changes (words, a progress from 0 to 1, a video's `src`) as props. So the same moment draws the same picture every time.

## A film of scenes

A film written for an engine that draws it whole (the Open Motion Studio's, for one) can say what it is made of, so the engine can show and
check it scene by scene without running it:

```tsx
<Film>
  <Layer id="logo" x={60} y={50} w={240} h={80}>…</Layer>
  <Scene id="intro" duration={4}>
    <Line id="l1">Heat moves uphill.</Line>
    <Layer id="title" y={320} h={440}>…</Layer>
  </Scene>
  <Scene id="how" duration={6}>…</Scene>
</Film>
```

- **`<Scene id duration>`**: the scenes are laid end to end, so the film is as long as their durations together (each a finite number of
  seconds above 0). A scene is drawn only in its span, and `useTime()` inside it counts from its start; the last one holds at the film's
  end, and past the end no scene is drawn.
- **`<Layer id x y w h z>`**: a box of the frame in its pixels (the whole frame when left out), stacked by `z`, shown for the whole of its
  scene. How its content moves is the content's own, from `useTime()`. A layer that is a child of `<Film>` is the film's own: drawn across
  every scene, on the film's clock, and no scene's layer may take its id, since a picked element is told by its layer.
- **`<Line id text at dur>`**: what a scene says, its words as children (`text` where the caption differs). It draws nothing; an engine may
  speak it or caption it. It is said from `at` seconds into its scene (without one, where the line before it ends) for `dur` seconds
  (without one, an equal share of the time to the next line that gives its `at`, or to the scene's end), so lines that give no time share
  their scene evenly. `<Film captions>` draws the line being said as a `<Caption>`, over everything, fading in and out; `<Caption line="id">`
  draws one line's caption where a component wants it, while that line is said.
- **A narration**: `<Film voice="provider:name">` names the voice a film's lines are spoken in, and the engine that speaks them gives each
  voiced line's speech in its runtime (`voice: {[line id]: {seconds, words: [{text, start, end}]}}`, word times into the speech). A voiced
  line lasts as long as its speech, after a lead (0.4 s, before a scene's first line) or a hold (0.4 s, between lines) when it gives no
  `at` (`NARRATION`); its `dur` gives way to the speech. Speech that runs past its scene's end, or into the next line that gives its `at`,
  is cut there, and the line says by how much (`over`), for the engine to tell; lines it leaves no time are said where it ends, in none.
  Speech never makes the outline fail, since its length is the engine's; times the author wrote that cannot all hold still do. A voiced line in the outline has `voiced` and its `words`, in the film's seconds. `useLine(id)` gives a
  line's `{start, end, words}` in its scene's time, so a picture can move with what is said; `<Film captions="words">` draws a voiced line
  word by word, each full once it is said.
- **`<Sound src at dur trim loop volume fadeIn fadeOut duck>`**: a sound the film plays, the file `src` (a path the engine serves), from
  `at` seconds of its scene, or of the film when it is one of `<Film>`'s own; `dur` seconds of it, from `trim` seconds into the file (the
  whole file when left out); with `loop`, again and again to the end of its scene or of the film; at `volume` dB (0 is the file as it is),
  faded in and out over `fadeIn` and `fadeOut` seconds, and `duck` dB lower while a narration speaks. It never plays past the end of its
  scene (or the film). It draws nothing: the engine plays it from the structure, so a `<Sound>` is a child of `<Film>` or a `<Scene>`.
- Anything else among `<Film>`'s children is drawn across the whole film.
- `<FilmScene id>` around a film draws its scene `id` alone, on the engine's clock, with the film's own layers on the film's: for an
  engine that places each scene itself. A Remotion project exported from the Open Motion Studio puts each scene in a `Series.Sequence`
  this way, so the scenes are named clips on Remotion Studio's timeline. A scene the film does not have is an error.
- `filmOutline(children, {width, height})` reads that structure from the elements themselves, without drawing them: `{seconds, scenes:
  [{id, start, duration, layers, lines, sounds}], layers, sounds, captions, voice}`, each line `{id, text, start, end}` (and, voiced,
  `voiced`, `words` and `over`) and each sound `{src, at, dur, until, trim, loop, volume, fadeIn, fadeOut,
  duck?}` in the film's seconds (`dur` null for the whole file). A line's and a word's times are in whole milliseconds. `<Film>` reports it to the engine's `onFilm` while it is drawn, once for each structure (a new `onFilm` function on every
  render is not called again for the same structure), when its value has one. A scene without an
  id or a positive duration, an id used twice (scenes, lines, layers in one scene, the film's own layers), a sound without a `src`, a line
  that starts past its scene's end or before the line before it ends, lines that would be left no time, and a time that is no number of
  seconds, is an error.

## Sound

`@motionhub/runtime/sound` synthesises a motion's sound, with no React and no audio API: `renderSound({seconds, cues, sound, rate})` returns mono samples from the motion's `react/sound.json` (a bed at a tempo, and a voice for each role: `land`, `move`, `draw`, `count`, `cut`, `out`) and a list of cues (`[{at, role, dur}]`, a reel's `export const cues`). The same input gives the same samples, so a player plays them and a renderer can write them to a WAV for Remotion's `<Audio>` or a HyperFrames track.

An engine binding passes `<MotionRuntimeProvider value>` an object with `useTime` and `useCompositionTime` (hooks returning seconds), `fps`, `width`, `height`, `tokens` (resolved), if it plays video `Video`, if it wants a `<Film>`'s structure, `onFilm(outline)`, and, if it speaks the film's lines, `voice`.
