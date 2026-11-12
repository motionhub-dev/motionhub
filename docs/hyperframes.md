# HyperFrames

Made by HeyGen: HTML, CSS, media and seekable animations become deterministic MP4 video. A motion's components draw unchanged, at your GSAP timeline's time.

## With your agent

HyperFrames keeps skills that teach an agent to make a HyperFrames video; motionhub's skill teaches it to take a motion and draw in its look. Install both once, for every agent on your computer:

```sh
npx hyperframes skills update
npx skills add motionhub-dev/motionhub -g
```

The first installs HyperFrames' core skills, as [its README](https://github.com/heygen-com/hyperframes#readme) recommends for agents. Then, in a HyperFrames project or an empty folder, ask:

```text
/motionhub make a HyperFrames film about <your topic> in @iamsuosi/lab-notebook
```

The motionhub skill fetches the motion into `./motions/<id>/` and checks it against its SHA-256, reads `MOTION.md` and `tokens.json` whole, adds the [HyperFrames binding](../packages/hyperframes/README.md), and builds your story from the motion's components and tokens; HyperFrames' skills keep the composition to HyperFrames' own practice and render it.

An agent without motionhub's skill can take the same request as a prompt that starts by reading it:

```text
Read https://motionhub.dev/llms.txt, then make a HyperFrames film about "<your topic>" in the motion @iamsuosi/lab-notebook
```

## By hand

The [HyperFrames binding](../packages/hyperframes/README.md) is the package the skill uses: it writes the motion's tokens as CSS variables and eases and its faces as local files, and `Motions[<id>].mount` draws the components in `./motions/<id>/react/parts/` from your timeline, for each motion the project holds.
