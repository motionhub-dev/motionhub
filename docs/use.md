# Use a motion

Pick a motion on [motionhub.dev](https://motionhub.dev), then make your film in it whichever way you work. Every motion's page has these steps with its own id filled in.

## With any agent

Ask an agent that has the motionhub skill, or that can read `llms.txt`:

```text
Make a film about <your topic> in the motion https://motionhub.dev/m/red-pencil/
```

The agent fetches the motion, checks it against its SHA-256, reads `MOTION.md` and `tokens.json` whole, and makes your film in its look with whatever engine it uses. The [agent skill](../skills/motionhub/SKILL.md) is the same instructions as a skill: install it the way your agent installs skills. An agent that cannot install skills can read [/llms.txt](https://motionhub.dev/llms.txt) instead.

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

A motion needs no tool. `MOTION.md` says in words how it looks and moves, and `tokens.json` gives the exact colours, faces and timings, the way a design system would. Follow them in your own engine, and credit the motion and its fonts as its `CREDITS.md` asks.
