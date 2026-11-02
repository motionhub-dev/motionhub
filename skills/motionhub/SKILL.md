---
name: motionhub
description: Find a motion (a reusable look for narrated and explanatory video) on motionhub.dev and make a film in it with any engine. Use when asked to make a video, animation or explainer "in the style of" a named motion or a motionhub link, to pick a look for one, or to read a motion directory (motion.json, MOTION.md, tokens.json).
---

# Making a film in a motion

A **motion** is a look for narrated and explanatory video, written down: how a film looks (ground, colour, type) and how it moves (how things arrive, change and leave). It holds no film: no story, script, scenes or timings. You bring the story; the motion decides how it looks and moves. The format is [SPEC.md](https://github.com/motionhub-dev/motions/blob/main/SPEC.md) (`motion/0.1`).

A motion is a directory:

| File | What you take from it |
| --- | --- |
| `motion.json` | Its slug, version, name, one line, authors and licence; `lang` is the language of `MOTION.md` |
| `MOTION.md` | The look in words. Five sections always: **Essence**, **Colour**, **Type**, **Motion**, **Avoid** |
| `tokens.json` | The exact values, as W3C design tokens: `color`, `font`, and often `duration` and `cubicBezier` |
| `poster.jpg` | One frame of a film made in it |
| `CREDITS.md` | Every font and asset it needs, with its licence and source |
| `<tool>/` | Ready-made pieces for one tool (`visotalk/` for VisoTalk). Ignore the directories of tools you are not using |

## 1. Choose the motion

- **The person named one** (a name, a slug, or a `motionhub.dev/m/<slug>` link): use it.
- **Otherwise** fetch the index, `https://motionhub.dev/api/motions.json`. Each row has `slug`, `name`, `line`, `tags`, `lang`, `poster` and `package`; paths are relative to `https://motionhub.dev`. Match the `line` and `tags` against the subject and the medium (a screen recording, a person's own footage, a dataset, a story), offer two or three with their posters, and let the person choose. Choose yourself only when they asked you to.

## 2. Get it

Copy the whole motion into the project, so the film keeps the version it was made in:

```sh
curl -fsSLO https://motionhub.dev/m/<slug>/<version>.tgz
echo "<sha256 from the index>  <version>.tgz" | sha256sum -c -
tar -xzf <version>.tgz && mv <slug> motion
```

Without a shell, fetch `https://motionhub.dev/m/<slug>/MOTION.md`, `tokens.json`, `motion.json` and `CREDITS.md` one by one.

## 3. Read it whole

Read all of `MOTION.md` before drawing anything, and `tokens.json` beside it. If a `MOTION.<lang>.md` matches the language you work in, you may read it; it says nothing `MOTION.md` does not.

## 4. Make the film

- **Values are exact.** Every colour, face, duration and easing comes from `tokens.json`, by its token, in your engine's terms. A font token is a stack: use its faces in order. Never approximate a colour by eye.
- **Essence decides every frame.** Each frame must have the traits it names, and must not drift into what it says the motion is not.
- **Colour and Type are roles, not a palette.** Use each token only for what its section says it is for; what it says is never coloured, stays uncoloured.
- **Motion is timing.** Things arrive, change and leave the way it says, on the narration or music the way it says. What it says never moves, stays still.
- **Avoid is binding.** Before you finish, check the film against every point under Avoid.
- **The story is yours.** Lay each scene out for what this film says. Do not copy the poster's or any sample's subject, words or layout.
- **A tool directory is a shortcut.** If the motion has a directory for the tool you are using, follow that tool's own documentation for it (VisoTalk's built-in motions: `npx visotalk motion use <slug>`). The words and tokens still govern.

## 5. Fonts and credit

- Install the faces `CREDITS.md` names, from their sources and under their licences. If one is unavailable, use the closest open face in the same role and tell the person which.
- Assets named in `CREDITS.md` are used under their licences, with the credit they ask for.
- `license.text` covers the motion's words, tokens and pictures; `CC-BY-4.0` and `CC-BY-SA-4.0` ask for credit. Put a line like this in the film's description or end credits: *Look: Ink Scroll by VisoTalk, motionhub.dev/m/ink-scroll, CC BY 4.0.* `license.code` covers the code in tool directories.

## 6. Changing it

Adapt your own copy freely for one film. A changed copy is no longer that version: do not publish it under the same slug and version. To share a changed or a new motion, add it to [github.com/motionhub-dev/motions](https://github.com/motionhub-dev/motions) by pull request ([CONTRIBUTING.md](https://github.com/motionhub-dev/motions/blob/main/CONTRIBUTING.md)) and check it first with `node tools/check.mjs motions/<slug>`.

## 7. Check before you hand it over

Put a frame of your film beside `poster.jpg`: the same ground, the same colours in the same roles, the same faces. Then read Essence and Avoid once more against the film, and fix what does not hold.
