---
name: motionhub
description: Find a motion (a reusable look for narrated and explanatory video) on motionhub.dev and make a film in it with any engine. Use when asked to make a video, animation or explainer "in the style of" a named motion or a motionhub link, to pick a look for one, to read a motion directory (motion.json, MOTION.md, tokens.json), or to share a look of their own as a motion on motionhub.
---

# Making a film in a motion

A **motion** is a look for narrated and explanatory video, written down: how a film looks (ground, colour, type) and how it moves (how things arrive, change and leave). It holds no film: no story, script, scenes or timings. You bring the story; the motion decides how it looks and moves. The format is [SPEC.md](https://github.com/motionhub-dev/motions/blob/main/SPEC.md) (`motion/0.4`). A motion is named by its id, its creator's GitHub name and its slug: `@iamsuosi/red-pencil`. On motionhub every id has both.

A motion is a directory:

| File | What you take from it |
| --- | --- |
| `motion.json` | Its scope and slug (together its id), version, name, one line, authors and licence; `lang` is the language of `MOTION.md`; `fit` is what it is for |
| `MOTION.md` | The look in words. Five sections always: **Essence**, **Colour**, **Type**, **Motion**, **Avoid**. The format's latest definition: https://motionhub.dev/MOTION.md |
| `tokens.json` | The exact values, as W3C design tokens: `color`, `font`, and often `duration` and `cubicBezier` |
| `poster.jpg` | One frame of a film made in it |
| `CREDITS.md` | Every font and asset it needs, with its licence and source |
| `react/` | The motion's components, for any React engine (section 5): `parts/`, the files they import in `assets/`, and a picture of each in `previews/` |
| `<tool>/` | Ready-made pieces for one other tool. Ignore the directories of tools you are not using |

## 1. Choose the motion

- **The person named one** (a name, an id, or a `motionhub.dev/m/<id>` link): use it.
- **Otherwise** search: `npx @motionhub/cli search <words>` (no words lists them all), or read the index, `https://motionhub.dev/api/motions.json`, whose rows have `slug` (the id), `name`, `line`, `fit`, `tags`, `lang`, `poster` and `package`, with paths relative to `https://motionhub.dev`. Match the subject and the medium (a screen recording, a person's own footage, a dataset, a story) against each motion's `fit`: `fit.for` says what it is for and `fit.not` what it handles badly. A `general` motion carries many subjects, a `topic` motion is made for one and is the better choice when the film is about it, and an `overlay` motion is drawn over footage the person brings, so offer one only when they have that footage. Offer two or three with their posters, and let the person choose. Choose yourself only when they asked you to.

## 2. Get it

Copy the whole motion into the project, so the film keeps the version it was made in:

```sh
npx @motionhub/cli get <id>            # into ./motion, checked against the index's SHA-256
```

Without Node: download `https://motionhub.dev/m/<id>/<version>.tgz`, check it against the row's `package.sha256`, and unpack it. Without a shell, fetch `https://motionhub.dev/m/<id>/MOTION.md`, `tokens.json`, `motion.json` and `CREDITS.md` one by one.

## 3. Read it whole

Read all of `MOTION.md` before drawing anything, and `tokens.json` beside it. If a `MOTION.<lang>.md` matches the language you work in, you may read it; it says nothing `MOTION.md` does not.

## 4. Make the film

- **Values are exact.** Every colour, face, duration and easing comes from `tokens.json`, by its token, in your engine's terms. A font token is a stack: use its faces in order. Never approximate a colour by eye.
- **Essence decides every frame.** Each frame must have the traits it names, and must not drift into what it says the motion is not.
- **Colour and Type are roles, not a palette.** Use each token only for what its section says it is for; what it says is never coloured, stays uncoloured.
- **Motion is timing.** Things arrive, change and leave the way it says, on the narration or music the way it says. What it says never moves, stays still.
- **Avoid is binding.** Before you finish, check the film against every point under Avoid.
- **The story is yours.** Lay each scene out for what this film says. Do not copy the poster's or any sample's subject, words or layout.
- **Components are a shortcut.** If the motion has `react/` or a directory for the tool you are using, use its pieces (section 5). The words and tokens still govern.

## 5. In your engine

**When the motion has `react/`**, use its components rather than drawing the look again. They are React components that import only `@motionhub/runtime`, and a binding gives them their time and tokens in your engine:

| Engine | Binding | How |
| --- | --- | --- |
| Remotion | `npm i @motionhub/remotion` | Wrap the composition in `<MotionProvider tokens={tokens}>` (`import tokens from '../motion/tokens.json'`), add `<MotionFonts />`, and import components from `../motion/react/parts/<file>.tsx` |
| HyperFrames | `npm i @motionhub/hyperframes`, then `npx motionhub-hyperframes motion --out assets/motion` | Load `assets/motion/motion.css` and `motion.js`; `Motion.mount(el, (t) => [...])` draws `Motion.components` from your GSAP timeline |

Read the binding's README first. Each component's `meta` says what it is for (`purpose`, `line`, `fits`) and what each parameter means, and `react/previews/<file>.jpg` shows it; read a component's code only when you use it. A parameter of type `progress` runs from 0 to 1: animate it in your engine, on the words that call for it. A component that draws in 3D imports `three`, which you install. `Caption` (from `@motionhub/runtime`) draws a spoken line in the motion's caption skin. Lay out each scene for your story; the components are the look, not the film.

**Otherwise**, or for anything the components do not draw: the tokens are DTCG values; turn each into your engine's own once, in one place (a theme module), and use it by name everywhere:

- **Colour**: `$value.hex`.
- **Font**: `$value` is a stack: the CSS `font-family` is its names in order, each quoted, the generic last.
- **Duration**: `$value` is `{value, unit}` in `s` or `ms`. An engine that counts frames multiplies seconds by its frame rate and rounds.
- **Easing** (`cubicBezier`): `$value` is `[x1, y1, x2, y2]`, the same curve as CSS `cubic-bezier(x1, y1, x2, y2)`. An engine without one samples it.

| Engine | Theme | Timing |
| --- | --- | --- |
| Remotion | `useMotion()` from `@motionhub/remotion`; otherwise a `theme.ts` exporting the colours and font stacks. Load the faces with `@remotion/google-fonts` or `@remotion/fonts` before the first frame | `const {fps} = useVideoConfig()`; a duration is `Math.round(seconds * fps)` frames; `interpolate(frame, [start, start + frames], [0, 1], {easing: Easing.bezier(x1, y1, x2, y2), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})`. Prefer `interpolate` with the motion's curve to `spring()`, whose overshoot the motion did not ask for |
| HTML and CSS | Custom properties on `:root` (`--color-ink: #1B2A47`) | `transition` or `animation` with the duration and `cubic-bezier(...)`; the Web Animations API takes the same `easing` string |
| GSAP | The same custom properties | `duration` in seconds; the curve through `CustomEase.create('arrive', 'M0,0 C x1,y1 x2,y2 1,1')` |

If the motion also has a directory for your engine (`remotion/`), its pieces add to the components: read its README first.

## 6. Fonts and credit

- Install the faces `CREDITS.md` names, from their sources and under their licences. If one is unavailable, use the closest open face in the same role and tell the person which.
- Assets named in `CREDITS.md` are used under their licences, with the credit they ask for.
- `license.text` covers the motion's words, tokens and pictures; `CC-BY-4.0` and `CC-BY-SA-4.0` ask for credit. Put a line like this in the film's description or end credits: *Look: Ink Scroll by SuoSi, motionhub.dev/m/@iamsuosi/ink-scroll, CC BY 4.0.* `license.code` covers the code in tool directories.

## 7. Changing it, and sharing a look of your own

Adapt your own copy freely for one film. A changed copy is no longer that version: do not publish it under the same id and version.

To publish a look the person made (only when they ask):

1. `npx @motionhub/cli init <slug>` writes `./<slug>/` with every required file to fill in, as the motion `@<their login>/<slug>`.
2. Take the look from their project, never the film: the theme's colours and faces into `tokens.json` (with the durations and curves the project uses); `MOTION.md` in the five sections, saying what any film in this look shares and nothing of this film's story; `CREDITS.md` naming every face and asset with its licence; `fit` in `motion.json`, honestly: `general` only if it would carry three unrelated subjects, otherwise `topic` with the subject it is made for, or `overlay` when it draws over their own footage.
3. `poster.jpg`: one frame of their film, a JPEG 960 to 3840 pixels wide and at most 500 KB (Remotion: `npx remotion still <composition> poster.jpg --frame=<n> --image-format=jpeg`).
4. Optionally the reusable components, in `react/parts/` as [CONTRIBUTING.md](https://github.com/motionhub-dev/motions/blob/main/CONTRIBUTING.md) describes: React components that import only `react` and `@motionhub/runtime` (in Remotion, `useTime()` and `useVideoConfig()` from it instead of Remotion's), take what changes as props, and hold nothing of this film's story.
5. `npx @motionhub/cli share <slug>` runs the checks its pull request will run, as the person's GitHub account. Show them the result; with their yes, `npx @motionhub/cli share <slug> --pr` opens the pull request from their fork, recording each login the motion names in `accounts/` with its GitHub id if it is not there yet.

To publish a new version of a motion the person published (only when they ask, as in "publish a new version of @<scope>/<slug> from this project"):

1. Have the motion at hand: their copy in the project, or `npx @motionhub/cli get @<scope>/<slug>` into `./motion`.
2. Make the change they want, from their project, holding to what `MOTION.md` says the look is; a new look is a new motion.
3. Raise `version` in `motion.json` above the published one: the patch for a fix, the minor for something added (a component, a section), the major for a change films already made in it would not survive. A published version never changes.
4. `npx @motionhub/cli share <dir>` runs the checks, then with their yes `npx @motionhub/cli share <dir> --pr`. Only one of the motion's authors can change it.

To build on someone else's motion, publish yours under your own scope, name theirs in `motion.json`'s `basedOn` (`[{"id": "@iamsuosi/red-pencil", "version": "1.0.2"}]`) and say in `CREDITS.md` what you took and changed; only its authors change the original.

## 8. Check before you hand it over

Put a frame of your film beside `poster.jpg`: the same ground, the same colours in the same roles, the same faces. Then read Essence and Avoid once more against the film, and fix what does not hold.
