# Remotion

[Remotion](https://www.remotion.dev) makes videos in React: a film is a component, drawn frame by frame and rendered to MP4 ([github.com/remotion-dev/remotion](https://github.com/remotion-dev/remotion)). It is its makers' work and under [their licence](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md): free for individuals, non-profits and companies of up to three people, with a company licence beyond that. A motion's components run in it unchanged, so a film in Remotion can take any look on motionhub.

## With your agent

Remotion keeps [Agent Skills](https://www.remotion.dev/docs/ai/skills) that teach an agent to write a Remotion project well; motionhub's skill teaches it to take a motion and draw in its look. Install both once, for every agent on your computer:

```sh
npx skills add remotion-dev/skills -g
npx skills add motionhub-dev/motions -g
```

Then, in a Remotion project or an empty folder, ask:

```text
/motionhub make a Remotion film about <your topic> in @iamsuosi/clay-world
```

The motionhub skill fetches the motion into `./motion` and checks it against its SHA-256, reads `MOTION.md` and `tokens.json` whole, adds the [Remotion binding](../packages/remotion/README.md), and builds your story from the motion's components and tokens; Remotion's skills keep the project to Remotion's own practice. Preview and render it as any Remotion project:

```sh
npx remotion studio
npx remotion render
```

An agent without motionhub's skill can take the same request as a prompt that starts by reading it:

```text
Read https://motionhub.dev/llms.txt, then make a Remotion film about "<your topic>" in the motion https://motionhub.dev/m/@iamsuosi/clay-world/
```

## By hand

The [Remotion binding](../packages/remotion/README.md) is the package the skill uses: `<MotionProvider>` gives a composition the motion's tokens and fonts, and the components in `./motion/react/parts/` draw by Remotion's frame.
