# What is MOTION.md

`MOTION.md` is an open format for how a film looks and moves. It is a Markdown file your agent reads before it draws anything, so the film it makes for your story keeps one look from the first frame to the last. One file is enough to start. A directory around it can add ready-made React components, which your agent uses first.

You may already give your agent files like it:

| File | Tells an agent |
| --- | --- |
| `AGENTS.md` | How to work in this project |
| `SKILL.md` | How to do a kind of task, with the scripts that come with it |
| `MOTION.md` | How a film looks and moves, with the components that come with it |

## Start with one file

Put this at your project's root, as `MOTION.md`:

```markdown
---
spec: motion/0.6
name: Harbour Chart
tokens:
  color:
    paper: "#EFE6D2"
    sea: "#1F4E5F"
    buoy: "#C8553D"
  font:
    title: ["Fraunces", "serif"]
    label: ["IBM Plex Mono", "monospace"]
  duration:
    draw: 1.4s
---

# Harbour Chart

## Essence

An old nautical chart in two inks: thin lines and small labels, never a photo or 3D.

## Colour

`paper` is the ground, `sea` is every line and word, and `buoy` is the one mark in a frame.

## Type

`title` for the one heading in a frame, `label` for everything else.

## Motion

Lines draw on from left to right over `draw`. Nothing bounces.

## Avoid

- A second red mark → keep one per frame.
```

The front matter holds its exact values, so an agent never has to guess a colour. An agent with the [motionhub skill](use.md#install-the-skill) looks for `MOTION.md` at your project's root, and then at `motion/MOTION.md`:

```text
/motionhub make a film about <your topic>
```

Two commands help. The first checks the file, and the second writes its values out as `tokens.json`, for a binding or a theme:

```sh
npx @motionhub/cli check MOTION.md --format-only
npx @motionhub/cli tokens --out tokens.json
```

## Add components

A `MOTION.md` can lead a directory, the way a `SKILL.md` can bring scripts:

```
lab-notebook/
  MOTION.md     the look, in words
  tokens.json   the exact values, as W3C design tokens
  react/        its components, ready to use
    parts/      sheet.tsx, bars.tsx, versus.tsx and more
  motion.json   its id, version, authors and licence
  poster.jpg    one frame of a film made in it
  CREDITS.md    every font and asset it needs
```

- **Components come first.** Where a motion has them, your agent uses them rather than drawing the look again. They run in Remotion and HyperFrames through a binding, and in any other React engine you bind them to.
- **The words and tokens govern.** `MOTION.md` says what each piece is for and what to avoid, and the tokens say exactly which colour, face and easing to use. Anything the components do not draw is made from these, in any engine.

In a directory, the values live in `tokens.json` alone, and every motion on motionhub is a directory.

## What it says

Every `MOTION.md` has five sections, so an agent always knows where to look:

| Section | Says |
| --- | --- |
| `Essence` | What makes a frame read as this look at a glance, and what it is easily confused with |
| `Colour` | What each colour is for, and what is never coloured |
| `Type` | The faces and their roles, sizes, and how words sit in the frame |
| `Motion` | How things arrive, change and leave, and how they follow the narration or music |
| `Avoid` | The mistakes this look invites, and what to do instead |

A motion with components also has a `Components` section, saying what each one is for. Any other sections may follow, and two are recommended: `Treatments`, a recipe for each kind of frame, and `Self-audit`, what to check before a film is finished.

It describes a look and never a particular film. It has no story, script, scenes or timings: you bring those.

## An example

From [Lab Notebook](https://motionhub.dev/@iamsuosi/lab-notebook/), a look on motionhub:

```md
# Lab Notebook

## Essence, and what it is not

- One notebook page, squared, with a red margin rule and punched holes. Everything is drawn or written on it.
- Three pens with fixed meanings: ink draws and writes, red marks the one result, pencil is working and asides.

## Colour roles

- `grad`: the red pen. The one result of a scene (a boxed value, an exclamation), never more than one red thing at a time.
```

The [whole file](https://motionhub.dev/m/@iamsuosi/lab-notebook/MOTION.md) goes on to its type, its motion and what to avoid.

## Use one, or write your own

To make a film in a look from motionhub, follow [Use a motion](use.md). To publish a look of your own, ask your agent from the project whose look you want to share. It writes the whole directory that motionhub needs:

```text
/motionhub share this project's look as a motion
```

[Share a motion](../CONTRIBUTING.md) has the rest.

## The definition

The format is defined in the [specification](../SPEC.md): `MOTION.md` in [section 5](https://github.com/motionhub-dev/motions/blob/main/SPEC.md#5-motionmd), one file in [section 11](https://github.com/motionhub-dev/motions/blob/main/SPEC.md#11-a-motion-in-one-file) and components in [section 12](https://github.com/motionhub-dev/motions/blob/main/SPEC.md#12-react). The format is still a draft, and it only grows: a later version never changes the meaning of what an earlier one says.

## Propose a change

The format is open, and changes to it are made in the open:

- **[Open an issue](https://github.com/motionhub-dev/motions/issues/new?title=MOTION.md%3A%20&body=What%20should%20change%20in%20the%20format%2C%20and%20why%3F%0A)** to say what should change and why.
- **[Edit the specification](https://github.com/motionhub-dev/motions/edit/main/SPEC.md)** to open a pull request from your browser. Add a `Signed-off-by: Your Name <you@example.com>` line to the commit message, or the checks refuse it.

Or from a terminal:

```sh
gh issue create --repo motionhub-dev/motions --title "MOTION.md: <your change>"
```
