# Use a motion

Pick a motion on [motionhub.dev](https://motionhub.dev), then make your film in it whichever way you work. Every motion's page has these steps with its own id filled in.

## With any agent

Nothing to install. Paste this into any agent that can open a URL, with your topic and the motion you picked:

```text
Read https://motionhub.dev/llms.txt, then make a film about "<your topic>" in the motion https://motionhub.dev/m/red-pencil/
```

[/llms.txt](https://motionhub.dev/llms.txt) tells the agent how: it fetches the motion, checks it against its SHA-256, reads `MOTION.md` and `tokens.json` whole, and makes your film in its look with whatever engine it uses.

### Install the skill

The [agent skill](../skills/motionhub/SKILL.md) is the same instructions, kept by your agent so it needs no first line. In Claude Code, put it in the project's skills:

```sh
mkdir -p .claude/skills/motionhub
curl -fsSL https://raw.githubusercontent.com/motionhub-dev/motions/main/skills/motionhub/SKILL.md -o .claude/skills/motionhub/SKILL.md
```

or in `~/.claude/skills/motionhub/` for every project. Another agent takes the same `SKILL.md` wherever it keeps skills. Then ask:

```text
Make a film about <your topic> in the motion red-pencil
```

## From the command line

```sh
npx @motionhub/cli search hand-drawn    # motions with every word
npx @motionhub/cli get red-pencil       # into ./motion, checked against its SHA-256
```

`get` takes an official id (`red-pencil`) or a creator's (`@ana/ledger-pencil`). The [command line](cli.md) page has every command.

## In Remotion or HyperFrames

A motion's tokens become values in either engine, and a motion with `react/` brings components that run in both unchanged:

- **Remotion**: [`@motionhub/remotion`](../packages/remotion/README.md)
- **HyperFrames**: [`@motionhub/hyperframes`](../packages/hyperframes/README.md)

Both provide [`@motionhub/runtime`](../packages/runtime/README.md), which is all a motion's components import besides React.

## In anything else

A motion needs no tool, and no particular engine: HTML and CSS, GSAP, Motion Canvas or a renderer of your own. `MOTION.md` says in words how it looks and moves, and `tokens.json` gives the exact colours, faces and timings, the way a design system would. Follow them in your own engine, and credit the motion and its fonts as its `CREDITS.md` asks.
