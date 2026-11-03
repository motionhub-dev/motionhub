# HyperFrames

[HyperFrames](https://hyperframes.heygen.com) turns HTML, CSS, media and seekable animations into deterministic MP4 video, made by HeyGen and open source under the Apache 2.0 licence ([github.com/heygen-com/hyperframes](https://github.com/heygen-com/hyperframes)). A motion's components draw in it unchanged, at your GSAP timeline's time, so a film in HyperFrames can take any look on motionhub.

## With your agent

HyperFrames keeps skills that teach an agent to make a HyperFrames video; motionhub's skill teaches it to take a motion and draw in its look. Install both once, for every agent on your computer:

```sh
npx hyperframes skills update
npx skills add motionhub-dev/motions -g
```

The first installs HyperFrames' core skills, as [its README](https://github.com/heygen-com/hyperframes#readme) recommends for agents. Then, in a HyperFrames project or an empty folder, ask:

```text
/motionhub make a HyperFrames film about <your topic> in @iamsuosi/clay-world
```

The motionhub skill fetches the motion into `./motion` and checks it against its SHA-256, reads `MOTION.md` and `tokens.json` whole, adds the [HyperFrames binding](../packages/hyperframes/README.md), and builds your story from the motion's components and tokens; HyperFrames' skills keep the composition to HyperFrames' own practice and render it.

An agent without motionhub's skill can take the same request as a prompt that starts by reading it:

```text
Read https://motionhub.dev/llms.txt, then make a HyperFrames film about "<your topic>" in the motion https://motionhub.dev/m/@iamsuosi/clay-world/
```

## By hand

The [HyperFrames binding](../packages/hyperframes/README.md) is the package the skill uses: it writes the motion's tokens as CSS variables and eases and its faces as local files, and `Motion.mount` draws the components in `./motion/react/parts/` from your timeline.
