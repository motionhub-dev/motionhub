# Use a motion

Pick a motion on [motionhub.dev](https://motionhub.dev), then make your film in it whichever way you work. The format is open, so the same motion gives the same look in every engine. Every motion's page has the prompt with its own id filled in.

## With any agent

Nothing to install. Paste this into any agent that can open a URL, with your topic and the motion you picked:

```text
Read https://motionhub.dev/llms.txt, then make a film about "<your topic>" in the motion @iamsuosi/lab-notebook
```

[/llms.txt](https://motionhub.dev/llms.txt) tells the agent how: it fetches the motion, checks it against its SHA-256, reads `MOTION.md` and `tokens.json` whole, and makes your film in its look with whatever engine it uses.

### Install the skill

The [agent skill](../skills/motionhub/SKILL.md) is the same instructions, kept by your agent so it needs no first line. Install it once, for every project and every agent on your computer (Claude Code, Codex and the others [skills](https://github.com/vercel-labs/skills) knows):

```sh
npx skills add motionhub-dev/motions -g
```

Leave out `-g` to install it in the current project only. Then call it by name:

```text
/motionhub make a film about <your topic> in @iamsuosi/lab-notebook
```

An agent without slash commands takes the same request in words: "Make a film about … in the motion @iamsuosi/lab-notebook".

## A look of your own, in one file

A look you only need in your own project can be [one `MOTION.md`](motion-md.md#start-with-one-file) at its root. An agent with the skill finds it, and uses it unless you name another.

## Share a look of your own

Made a film whose look others should have? With the skill installed, ask your agent from that project:

```text
/motionhub share this project's look as a motion
```

It writes the motion as `@<your GitHub login>/<slug>`, takes the look from the project and never the film's story, runs the checks the pull request will run and shows you the result. With your yes, it gives you a link and a code: open the link, sign in with GitHub, type the code, and the pull request opens under your name. No git, GitHub CLI or token is needed, so a cloud agent can do it too. [Share a motion](../CONTRIBUTING.md) has the rules it follows and the commands it runs.

## From the command line

```sh
npx @motionhub/cli search hand-drawn    # motions with every word
npx @motionhub/cli get @iamsuosi/lab-notebook   # into ./motions/@iamsuosi/lab-notebook/, checked against its SHA-256
npx @motionhub/cli get @iamsuosi/red-pencil     # a second look, beside the first
npx @motionhub/cli get                          # on another computer: every motion motions.lock.json records
```

`get` takes a motion's id: its creator's GitHub name and its slug, `@iamsuosi/lab-notebook`. The [command line](cli.md) page has every command.

## Several motions in one film

A long film can change its look from part to part: one motion for the opening and the data, another for a chapter told by hand. Get each into the project; they sit side by side in `./motions/`, each at its id, and a motion of your own sits beside them in `./motions/<name>/` ([the format](../SPEC.md#13-a-projects-motions)). Say in your plan which motion each scene is in, by its id, and ask your agent for it:

```text
/motionhub make a film about <your topic>: the opening and the data in @iamsuosi/lab-notebook, the history in @iamsuosi/red-pencil
```

Each motion's components draw in its own tokens, even side by side in one frame: in Remotion, wrap each scene in `<MotionScope tokens>` ([`@motionhub/runtime`](../packages/runtime/README.md)); in HyperFrames, `Motions[<id>].mount` ([`@motionhub/hyperframes`](../packages/hyperframes/README.md)).

## In Remotion or HyperFrames

A motion's tokens become values in either engine, and a motion with `react/` brings components that run in both unchanged. Each engine's guide starts from its own agent skills beside motionhub's:

- **[Remotion](remotion.md)**: with Remotion's skills, or by hand with [`@motionhub/remotion`](../packages/remotion/README.md)
- **[HyperFrames](hyperframes.md)**: with HyperFrames' skills, or by hand with [`@motionhub/hyperframes`](../packages/hyperframes/README.md)

Both provide [`@motionhub/runtime`](../packages/runtime/README.md), which is all a motion's components import besides React.

## In anything else

A motion needs no tool, and no particular engine: HTML and CSS, GSAP, Motion Canvas or a renderer of your own. `MOTION.md` says in words how it looks and moves, and `tokens.json` gives the exact colours, faces and timings, the way a design system would. Follow them in your own engine, and credit the motion and its fonts as its `CREDITS.md` asks.
