# Overview

A **motion** is a reusable look for narrated and explanatory video: how a film looks (ground, colour, type) and how it moves (how things arrive, change and leave), written down so that a person or an agent can make a new film in it with any engine. It holds no film: no story, script, scenes or timings. You bring the story; the motion keeps the look.

[motionhub.dev](https://motionhub.dev) is the open catalogue of motions, and the format they are written in is open too. A motion works in any engine: its components run in Remotion and HyperFrames, and its words and tokens in anything else.

## Start in a minute

Pick a motion, then paste this into any agent that can open a URL, with your topic and the motion's id:

```text
Read https://motionhub.dev/llms.txt, then make a film about "<your topic>" in the motion https://motionhub.dev/m/clay-world/
```

That is all. [Use a motion](use.md) has the other ways: the skill, the command line, Remotion, HyperFrames and any other engine.

## What a motion is made of

A motion is a directory of five files, and a directory for each tool that wants ready-made pieces:

| File | What it holds |
| --- | --- |
| `motion.json` | Its id, version, name, one line, authors and licence |
| `MOTION.md` | The look in words, for people and agents: essence, colour, type, motion, what to avoid |
| `tokens.json` | The exact values, as W3C design tokens: colours, faces, durations, easings |
| `poster.jpg` | One frame of a film made in it |
| `CREDITS.md` | Every font and asset it needs, with its licence and source |
| `react/` | Optional: components that run unchanged in any React engine |

The [specification](../SPEC.md) says exactly what each file holds and what any tool can rely on.

## Where to go next

- **Make a film in a motion**: [Use a motion](use.md), with any agent, from the command line, or in Remotion or HyperFrames.
- **Share a look of your own**: [Share a motion](../CONTRIBUTING.md) explains the pull request, what is accepted and how it is reviewed.
- **Build a tool that reads motions**: the [specification](../SPEC.md), and [the hub](../HUB.md) for the index and the packages motionhub.dev serves.

## For agents

Every page here has a Markdown twin at the same address with `.md` at the end: this one is [/docs/index.md](https://motionhub.dev/docs/index.md). [/llms.txt](https://motionhub.dev/llms.txt) tells an agent how to choose a motion and make a film in it, and lists every page; [/llms-full.txt](https://motionhub.dev/llms-full.txt) is all of them in one file.
