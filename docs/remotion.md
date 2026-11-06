# Remotion

A film is a React component, drawn frame by frame and rendered to MP4. A motion's components run unchanged.

## With your agent

Remotion keeps [Agent Skills](https://www.remotion.dev/docs/ai/skills) that teach an agent to write a Remotion project well; motionhub's skill teaches it to take a motion and draw in its look. Install both once, for every agent on your computer:

```sh
npx skills add remotion-dev/skills -g
npx skills add motionhub-dev/motions -g
```

Then, in a Remotion project or an empty folder, ask:

```text
/motionhub make a Remotion film about <your topic> in @iamsuosi/lab-notebook
```

The motionhub skill fetches the motion into `./motions/<id>/` and checks it against its SHA-256, reads `MOTION.md` and `tokens.json` whole, adds the [Remotion binding](../packages/remotion/README.md), and builds your story from the motion's components and tokens; Remotion's skills keep the project to Remotion's own practice. Preview and render it as any Remotion project:

```sh
npx remotion studio
npx remotion render
```

An agent without motionhub's skill can take the same request as a prompt that starts by reading it:

```text
Read https://motionhub.dev/llms.txt, then make a Remotion film about "<your topic>" in the motion @iamsuosi/lab-notebook
```

## By hand

The [Remotion binding](../packages/remotion/README.md) is the package the skill uses: `<MotionProvider>` gives a composition the motion's tokens and fonts, and the components in `./motions/<id>/react/parts/` draw by Remotion's frame. A film in several motions wraps each scene in `<MotionScope>`.
