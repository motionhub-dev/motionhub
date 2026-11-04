# What is MOTION.md

`MOTION.md` is an open format for how a film looks and moves. It is a Markdown file that leads a directory, with the exact values and ready-made React components beside it. Your agent reads it before it draws anything and uses those components first, so the film it makes for your story keeps one look from the first frame to the last.

You may already give your agent files like it:

| File | Tells an agent |
| --- | --- |
| `AGENTS.md` | How to work in this project |
| `SKILL.md` | How to do a kind of task, with the scripts that come with it |
| `MOTION.md` | How a film looks and moves, with the components that come with it |

## What comes with it

A `MOTION.md` is not on its own. It leads a directory:

```
clay-world/
  MOTION.md     the look, in words
  tokens.json   the exact values, as W3C design tokens
  react/        its components, ready to use
    parts/      slice.tsx, figure.tsx, world.tsx and more
  motion.json   its id, version, authors and licence
  poster.jpg    one frame of a film made in it
  CREDITS.md    every font and asset it needs
```

- **Components come first.** Where a motion has them, your agent uses them rather than drawing the look again. They run in Remotion and HyperFrames, through a binding, and in any other React engine you bind them to.
- **The words and tokens govern.** `MOTION.md` says what each piece is for and what to avoid, and `tokens.json` says exactly which colour, face and easing to use. Anything the components do not draw is made from these, in any engine.

## What it says

Every `MOTION.md` has five sections, so an agent always knows where to look:

| Section | Says |
| --- | --- |
| `Essence` | What makes a frame read as this look at a glance, and what it is easily confused with |
| `Colour` | What each colour is for, and what is never coloured |
| `Type` | The faces and their roles, sizes, and how words sit in the frame |
| `Motion` | How things arrive, change and leave, and how they follow the narration or music |
| `Avoid` | The mistakes this look invites, and what to do instead |

It describes a look and never a particular film. It has no story, script, scenes or timings: you bring those.

## An example

From [Clay World](https://motionhub.dev/m/@iamsuosi/clay-world/), a look on motionhub:

```md
# Clay World

## Essence, and what it is not

- Everything is a rounded, hand-pressed form of matte clay, slightly out of true, thumb-dented; no sharp edge, no gloss.
- Things have weight: what falls stretches, squashes flat, throws up crumbs and jolts the camera.

## Colour roles

- One saturated clay leads a frame. Never pure white or black, a gradient on a form, or a glow.
```

The [whole file](https://motionhub.dev/m/@iamsuosi/clay-world/MOTION.md) goes on to its type, its motion and what to avoid.

## Use one, or write your own

To make a film in a look, follow [Use a motion](use.md). To write a `MOTION.md` for a look of your own, ask your agent from the project whose look you want to share:

```text
/motionhub share this project's look as a motion
```

[Share a motion](../CONTRIBUTING.md) has the rest.

## The definition

The format is defined in the [specification](../SPEC.md): `MOTION.md` is its [section 5](https://github.com/motionhub-dev/motions/blob/main/SPEC.md#5-motionmd), and the directory and `tokens.json` are there too. The rules for components are in [Share a motion](../CONTRIBUTING.md#tool-directories). The format is still a draft, and it only grows: a later version never changes the meaning of what an earlier one says.

## Propose a change

The format is open, and changes to it are made in the open:

- **[Open an issue](https://github.com/motionhub-dev/motions/issues/new?title=MOTION.md%3A%20&body=What%20should%20change%20in%20the%20format%2C%20and%20why%3F%0A)** to say what should change and why.
- **[Edit the specification](https://github.com/motionhub-dev/motions/edit/main/SPEC.md)** to open a pull request from your browser. Add a `Signed-off-by: Your Name <you@example.com>` line to the commit message, or the checks refuse it.

Or from a terminal:

```sh
gh issue create --repo motionhub-dev/motions --title "MOTION.md: <your change>"
```
