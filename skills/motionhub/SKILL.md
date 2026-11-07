---
name: motionhub
description: Find a motion (a reusable look for narrated and explanatory video) on motionhub.dev and make a film in it with any engine. Use when asked to make a video, animation or explainer "in the style of" a named motion or a motionhub link, to pick a look for one, to read a motion directory (motion.json, MOTION.md, tokens.json), to share a look of their own as a motion on motionhub, or to upload and update an Artifact preview.
---

# Making a film in a motion

A **motion** is a look for narrated and explanatory video, written down: how a film looks (ground, colour, type) and how it moves (how things arrive, change and leave). It holds no film: no story, script, scenes or timings. You bring the story; the motion decides how it looks and moves. The format is [SPEC.md](https://github.com/motionhub-dev/motions/blob/main/SPEC.md) (`motion/0.5`). A motion is named by its id, its creator's GitHub name and its slug: `@iamsuosi/lab-notebook`. On motionhub every id has both.

A motion is a directory:

| File | What you take from it |
| --- | --- |
| `motion.json` | Its scope and slug (together its id), version, name, one line, authors and licence; `lang` is the language of `MOTION.md`; `fit` is what it is for |
| `MOTION.md` | The look in words. Five sections always: **Essence**, **Colour**, **Type**, **Motion**, **Avoid**. The format's definition: https://github.com/motionhub-dev/motions/blob/main/SPEC.md#5-motionmd |
| `tokens.json` | The exact values, as W3C design tokens: `color`, `font`, and often `duration` and `cubicBezier` |
| `poster.jpg` | One frame of a film made in it |
| `CREDITS.md` | Every font and asset it needs, with its licence and source |
| `react/` | The motion's components, for any React engine (section 5): `parts/`, the files they import in `assets/`, and a picture of each in `previews/` |
| `<tool>/` | Ready-made pieces for one other tool. Ignore the directories of tools you are not using |

A motion can also be one file: a `MOTION.md` that starts with front matter holding its `spec`, `name` and `tokens`, in a short form (`floor: "#E8D5B7"`). It says the same as `tokens.json` would, and it has no components, poster or credits.

## 1. Choose the motion

- **The person named one** (a name, an id, or a `motionhub.dev/m/<id>` link): use it.
- **The project has one**: `MOTION.md` at the project's root, or else `motion/MOTION.md`: use it, and go to section 3. A project may hold several in `motions/`: copies from motionhub at `motions/@<scope>/<slug>/`, and its own at `motions/<name>/`. Use the one each scene is planned in; if the plan does not say, ask which. A project may also hold other design files, such as `frame.md` or `design.md`. The motion decides how the film looks and moves; follow the others for what it does not say, and tell the person where they disagree.
- **Otherwise** search: `npx @motionhub/cli search <words>` (no words lists them all), or read the index, `https://motionhub.dev/api/motions.json`, whose rows have `slug` (the id), `name`, `line`, `fit`, `catalogs`, `tags`, `lang`, `poster` and `package`, with paths relative to `https://motionhub.dev`. Start from the form of the film: `catalogs` names the catalogs a motion is in (`explainers`, `data`, `stories`, `tutorials`, `breakdowns`, and `footage` for one drawn over a video the person brings, so offer that only when they have it; `https://motionhub.dev/api/catalogs.json` lists them). Then match the subject and the medium against `fit`, where a motion has it: `fit.for` says what it is for and `fit.not` what it handles badly. A motion made for the film's subject is the better choice over one that carries many. Offer two or three with their posters, and let the person choose. Choose yourself only when they asked you to.

## 2. Get it

Copy the whole motion into the project, so the film keeps the version it was made in:

```sh
npx @motionhub/cli get <id>            # into ./motions/<id>/, checked against the index's SHA-256, recorded in motions.lock.json
npx @motionhub/cli get                 # every motion motions.lock.json records, when the project has one and they are missing
```

A film may be made in several motions, one for each part or each kind of scene: get each, and they sit side by side in `./motions/`. Never change a copy in `./motions/@<scope>/`: to adapt one, copy it to `./motions/<name>/` and change that.

Without Node: download `https://motionhub.dev/m/<id>/<version>.tgz`, check it against the row's `package.sha256`, and unpack it. Without a shell, fetch `https://motionhub.dev/m/<id>/MOTION.md`, `tokens.json`, `motion.json` and `CREDITS.md` one by one.

## 3. Read it whole

Read all of `MOTION.md` before drawing anything, and `tokens.json` beside it, or the `tokens` in its front matter. If a `MOTION.<lang>.md` matches the language you work in, you may read it; it says nothing `MOTION.md` does not.

## 4. Make the film

- **Values are exact.** Every colour, face, duration and easing comes from the motion's tokens, by name, in your engine's terms. A font token is a stack: use its faces in order. Never approximate a colour by eye.
- **Essence decides every frame.** Each frame must have the traits it names, and must not drift into what it says the motion is not.
- **Colour and Type are roles, not a palette.** Use each token only for what its section says it is for; what it says is never coloured, stays uncoloured.
- **Motion is timing.** Things arrive, change and leave the way it says, on the narration or music the way it says. What it says never moves, stays still.
- **Avoid is binding.** Before you finish, check the film against every point under Avoid.
- **Never invent a number.** Every figure, date and count in the film comes from the person's story or a source they gave you. Where one is missing, leave a visible placeholder and tell them.
- **The story is yours.** Lay each scene out for what this film says. Do not copy the poster's or any sample's subject, words or layout.
- **Components are a shortcut.** If the motion has `react/` or a directory for the tool you are using, use its pieces (section 5). The words and tokens still govern.

## 5. In your engine

**When the motion has `react/`**, use its components rather than drawing the look again. They are React components that import only `@motionhub/runtime`, and a binding gives them their time and tokens in your engine:

| Engine | Binding | How |
| --- | --- | --- |
| Remotion | `npm i @motionhub/remotion` | Wrap the composition in `<MotionProvider tokens={tokens}>` (`import tokens from '../motions/<id>/tokens.json'`), add `<MotionFonts />`, and import components from `../motions/<id>/react/parts/<file>.tsx`. In several motions, wrap each scene in `<MotionScope tokens>` from `@motionhub/runtime` |
| HyperFrames | `npm i @motionhub/hyperframes`, then `npx motionhub-hyperframes --out assets/motion` (every motion in `./motions/`) | Load `assets/motion/motion.css` and `motion.js`; `Motion.mount(el, (t) => [...])` draws `Motion.components` from your GSAP timeline. In several motions, `Motions[<id>]` is each |

Read the binding's README first. Each component's `meta` says what it is for (`purpose`, `line`, `fits`) and what each parameter means, and `react/previews/<file>.jpg` shows it; read a component's code only when you use it. A parameter of type `progress` runs from 0 to 1: animate it in your engine, on the words that call for it. A component that draws in 3D imports `three`, which you install. `Caption` (from `@motionhub/runtime`) draws a spoken line in the motion's caption skin. Lay out each scene for your story; the components are the look, not the film.

**Otherwise**, or for anything the components do not draw: the tokens are DTCG values, and `npx @motionhub/cli tokens --out tokens.json` writes them out from a motion in one file, for a binding or a theme; turn each into your engine's own once, in one place (a theme module), and use it by name everywhere:

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

Adapt a motion freely for one film, in a copy of your own (`./motions/<name>/`). A changed copy is no longer that version: do not publish it under the same id and version.

To publish a look the person made (only when they ask):

1. `npx @motionhub/cli init <slug> --github <their GitHub login>` writes `./motions/<slug>/` with every required file to fill in, as the motion `@<their login>/<slug>` (ask them for their login; with gh signed in, `--github` can be left out).
2. Take the look from their project, never the film: the theme's colours and faces into `tokens.json` (with the durations and curves the project uses); `MOTION.md` in the five sections, saying what any film in this look shares and nothing of this film's story; `CREDITS.md` naming every face and asset with its licence; `fit` in `motion.json`, honestly: `general` only if it would carry three unrelated subjects, otherwise `topic` with the subject it is made for, or `overlay` when it draws over their own footage.
3. `poster.jpg`: one frame of their film, a JPEG 960 to 3840 pixels wide and at most 500 KB (Remotion: `npx remotion still <composition> poster.jpg --frame=<n> --image-format=jpeg`).
4. Optionally the reusable components, in `react/parts/` as [CONTRIBUTING.md](https://github.com/motionhub-dev/motions/blob/main/CONTRIBUTING.md) describes: React components that import only `react` and `@motionhub/runtime` (in Remotion, `useTime()` and `useVideoConfig()` from it instead of Remotion's), take what changes as props, and hold nothing of this film's story.
5. With their yes, `npx @motionhub/cli share motions/<slug> --wait` runs the checks its pull request will run and uploads it to motionhub.dev. No git, gh or GitHub token is needed. Give the person the link and the code it prints, exactly as printed. They open the link, sign in with GitHub, check the motion, type the code and certify the DCO, and motionhub opens the pull request under their name. The command then prints the pull request's address: give them that too. Never type the code or submit on their behalf. If they would rather use their own fork with gh, `npx @motionhub/cli share motions/<slug> --pr` does it.

A motion in one file publishes the same way, from step 1. Then `npx @motionhub/cli tokens --out motions/<slug>/tokens.json` writes its values, its `name` and `lang` go into `motion.json`, and its body goes into `motions/<slug>/MOTION.md` without the front matter. The rest of `motion.json`, `CREDITS.md` and `poster.jpg` are filled in as below.

To publish a new version of a motion the person published (only when they ask, as in "publish a new version of @<scope>/<slug> from this project"):

1. Have the motion at hand: their own copy in `./motions/<name>/`, or `npx @motionhub/cli get @<scope>/<slug>` and copy `./motions/@<scope>/<slug>/` to `./motions/<slug>/` to change it there.
2. Make the change they want, from their project, holding to what `MOTION.md` says the look is; a new look is a new motion.
3. Raise `version` in `motion.json` above the published one: the patch for a fix, the minor for something added (a component, a section), the major for a change films already made in it would not survive. A published version never changes.
4. `npx @motionhub/cli share <dir> --wait`, as above: they open the link and submit; if their pull request for it is open already, the new version is added to it. Only one of the motion's authors can change it; another author's share opens a pull request of its own. `--wait` waits up to 30 minutes.

To change a motion after review notes on its pull request, read the notes (`https://api.github.com/repos/motionhub-dev/motions/issues/<n>/comments` and `.../pulls/<n>/comments`, no token needed), make the changes they ask for, and share again the same way.

To build on someone else's motion, publish yours under your own scope, name theirs in `motion.json`'s `basedOn` (`[{"id": "@iamsuosi/lab-notebook", "version": "1.0.2"}]`) and say in `CREDITS.md` what you took and changed; only its authors change the original.

## 8. Check before you hand it over

Put a frame of your film beside `poster.jpg`, if the motion has one: the same ground, the same colours in the same roles, the same faces. Then read Essence and Avoid once more against the film, and fix what does not hold.


## 9. Upload an Artifact preview

When the person asks to preview a page, motion demo or built static site on MotionHub, upload it with the CLI.

1. Build a self-contained HTML file or a static directory with `index.html` at its root and relative asset URLs. For Vite, build with `--base ./`.
2. Run `npx @motionhub/cli@latest artifact upload ./dist --title "Descriptive name"`. Use the person's name for the work when provided. Keep titles within 1–100 characters and quote names containing spaces.
3. For subsequent iterations, reuse the Artifact UUID from the returned `/artifact/<id>/preview` URL with `--id <id>`. Add `--title "New name"` to rename it on a successful upload, or omit the title to keep it.
4. If login is required, give the person the authorization link printed by the CLI and keep the process running while they confirm in their browser. Continue the upload after authorization.
5. Return the single Preview URL printed by the CLI. The author signs in to see the latest draft with a slim management header. Publishing and share links are available in Manage.

For example, create with `npx @motionhub/cli@latest artifact upload index.html --title "账目桥"`, then update with `npx @motionhub/cli@latest artifact upload index.html --id <id>`. Uploading creates a private draft.
