# Contributing a motion

A motion arrives as a pull request that adds `motions/@<you>/<slug>/` in the [format](SPEC.md). Your GitHub account is your identity here: the motion's `scope` is your GitHub username in lowercase, its id is `@<you>/<slug>`, and the `github` of at least one author in `motion.json` must be the account that opens the pull request. Every motion here has a scope, the maintainers' own included: there are no unscoped, official ids.

## The quick way

With the [motionhub skill](skills/motionhub/SKILL.md) installed (`npx skills add motionhub-dev/motions -g`), ask your agent from the project whose look you want to share:

```text
/motionhub share this project's look as a motion
```

It runs the steps below for you and asks before it opens the pull request. By hand:

```sh
npx @motionhub/cli init <slug>          # ./<slug>/ with every required file to fill in, scoped to you
npx @motionhub/cli share <slug>         # the checks below, as your GitHub account (gh)
npx @motionhub/cli share <slug> --pr    # the pull request, from your fork, signed off
```

## Before you open it

```sh
npx @motionhub/cli check <slug> --author <you>     # or, in a clone of this repository: node tools/check.mjs motions/@<you>/<slug> --author <you>
```

The checker has no dependencies (Node 20 or later). It runs the same rules as the pull request's checks: the format, then the rules below.

Write `MOTION.md` in English if you can, or add an English translation next to it (`MOTION.en.md` when `MOTION.md` is in another language): more people and agents can use it. Neither is required.

## What is accepted

- **Licences.** `license.text`: `CC-BY-4.0` (the default), `CC-BY-SA-4.0` or `CC0-1.0`. `license.code`: `MIT` (the default), `Apache-2.0`, `BSD-2-Clause`, `BSD-3-Clause`, `ISC` or `0BSD`.
- **Fonts.** Open licences only (SIL Open Font License, Apache 2.0, Ubuntu Font Licence), each named in `CREDITS.md`.
- **Assets.** Your own, or CC0, CC BY or OFL, each named in `CREDITS.md` with its source. Public-domain artworks are welcome when `CREDITS.md` says where they come from.
- **Size.** At most 1 MB for the whole motion, the poster included. No video, audio over 500 KB, or build output in the repository.
- **Scope and directory.** A motion has a `scope` (`hub.scope`) and sits in `motions/@<scope>/<slug>/`, named by its id (`hub.slug`).
- **Built on.** Every motion named in `basedOn` is one in this catalogue (`hub.basedOn`).
- **Signed commits.** Every commit carries a `Signed-off-by:` line (`git commit -s`), certifying the [Developer Certificate of Origin](https://developercertificate.org): you have the right to contribute what it contains under its licence.

## Original work

A motion is a look of your own. You may learn from any film or project, and say so in `CREDITS.md`, but you build it anew:

- No brand, logo, trademark, product interface or character of someone else, and no look that would be mistaken for one.
- No copy of another project's code, artwork, fonts or text, whatever its licence, unless that licence allows it and `CREDITS.md` names it.
- An art movement or a painter's manner is fine. A copy of a particular protected artwork is not.

Building on another motion is welcome when its licence allows it (every licence accepted here does): publish yours under your own scope, name it in `basedOn` in `motion.json` ([SPEC.md](SPEC.md) §3, a motion in this catalogue), say in `CREDITS.md` what you took and what you changed, and keep its notices for any code you copied. The motion you built on shows yours, and its creator's page counts it.

A pull request that breaks these is closed. If you hold rights in something here, open an issue and it will be looked at quickly.

## Tool directories

A tool keeps its own files in a directory named after it (SPEC.md §7). Where several people write for one tool, the directory follows that tool's convention here:

- **`react/`**: the motion's components, for any React engine. `react/parts/*.tsx` are React components that import only `react`, `@motionhub/runtime`, `three` and each other, colour with `var(--color-<name>)`, set type with `var(--font-<name>)`, and take their words, data, progress and video `src` as props, so they run unchanged in Remotion through [`@motionhub/remotion`](packages/remotion/README.md) and in HyperFrames through [`@motionhub/hyperframes`](packages/hyperframes/README.md). Each exports a literal `meta` beside it: `name`, `purpose`, `line`, `fits`, `params` (each with `type` and `doc`) and `preview`. Files they import sit in `react/assets/`, and `react/previews/<file>.jpg` shows each one. A face Google Fonts does not serve goes in `react/fonts/` as WOFF2, cut to the characters the components draw (at most 300 KB each), with `react/fonts/fonts.json` naming each (`[{family, file, weight, style}]`) and `CREDITS.md` its licence (`hub.font`); players and bindings use it before Google Fonts. `react/sound.json` is how its world sounds: `{bpm, root, kit, roles: {land, move, draw, count, cut, out}}`, each role a voice of `@motionhub/runtime/sound` (`hub.sound`), and the reel says when with `export const cues = [{at, role, dur}]`. `react/reel.tsx` is the reel the motion's page plays live (HUB.md, "Reels"): a default export that composes the components by `useTime()`, with `Sequence`, `interpolate` and `Easing` from the runtime, and `export const reel = {seconds}`, at most 30.
- **`remotion/`**: only what `react/` and `@motionhub/remotion` do not already give a Remotion project (a component that needs `@remotion/*`, say), imported from `../motion/remotion`, with a `README.md` saying what each piece is for and its props. Components there follow the same rules, and faces may be bundled under `remotion/fonts/` with their licence text.

A convention for another tool is added here when its first motion arrives.

## Code in a tool directory

Code under a tool directory runs in other people's browsers and render machines, so the checks refuse code that:

- reaches the network (`fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `navigator.sendBeacon`);
- evaluates text as code (`eval`, `new Function`, a string passed to `setTimeout` or `setInterval`) or imports at run time (`import(…)`);
- reads or writes cookies or storage (`document.cookie`, `localStorage`, `sessionStorage`, `indexedDB`).

A tool may add rules of its own for its directory.

## Review

1. The checks run on every pull request and post the result.
2. A reviewer agent reads the motion for originality, safety and whether `MOTION.md` lets someone make a film in it, and leaves its notes as a comment. It advises; it does not merge.
3. A maintainer merges. A first-time contributor's pull request always waits for a person.

## Changing a published motion

Only one of a motion's published authors may change it: the checks compare the pull request's author with the authors of the version on the main branch, so adding yourself to `authors` does not make a motion yours. To build on someone else's motion, publish your own under your scope and credit theirs, by its id, in `CREDITS.md`.

A change carries a higher `version` than the published one, since a published version never changes ([SPEC.md](SPEC.md) §9). The newest version replaces the previous one in its directory; published packages of earlier versions stay where they are ([HUB.md](HUB.md)).
