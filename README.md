# motionhub

**English** | [简体中文](README.zh-CN.md)

Motions are reusable looks for narrated and explanatory video: how a film looks and how it moves, written so that a person or an agent can make a new film in it with any engine. This repository is the open format and the public catalogue behind [motionhub.dev](https://motionhub.dev).

- **[SPEC.md](SPEC.md)**: the motion format, `motion/0.3`. Five files: `motion.json`, `MOTION.md`, `tokens.json` (W3C DTCG), `poster.jpg`, `CREDITS.md`, and a directory for each tool that wants one.
- **[CONTRIBUTING.md](CONTRIBUTING.md)**: how to add a motion by pull request, what is accepted and how it is reviewed.
- **[HUB.md](HUB.md)**: how the catalogue is published and fetched (planned).

```
motions/<slug>/            an official motion, id <slug>
motions/@<scope>/<slug>/   a creator's motion, id @<scope>/<slug>
  motion.json   MOTION.md   tokens.json   poster.jpg   CREDITS.md
  react/        components any React engine draws (@motionhub/runtime)
```

## Using a motion

```sh
npx @motionhub/cli search hand-drawn    # motions with every word
npx @motionhub/cli get red-pencil       # into ./motion, checked against its SHA-256
```

Any agent can read a motion's `MOTION.md` and `tokens.json` and follow them in its own engine, the way it would follow a design system. A motion with `react/` also brings its components, which run unchanged in Remotion ([`@motionhub/remotion`](packages/remotion/README.md)) and HyperFrames ([`@motionhub/hyperframes`](packages/hyperframes/README.md)) through [`@motionhub/runtime`](packages/runtime/README.md).

[`skills/motionhub/SKILL.md`](skills/motionhub/SKILL.md) is a skill for any agent: how to choose a motion, fetch it and make a film in it. Install it the way your agent installs skills.

## Checking a motion

```sh
npx @motionhub/cli check path/to/<slug>   # one motion, anywhere, with the published checker
node tools/check.mjs motions/<slug>       # one motion, in this repository
node tools/check.mjs                      # all of them
node tools/build.mjs                   # the files motionhub.dev serves, into dist/
```

## Maintainers

Maintained by [SuoSi](https://github.com/iamsuosi). The format belongs to everyone who uses it; proposals to change it are issues on this repository.

The tools in this repository are MIT-licensed ([LICENSE](LICENSE)). Each motion carries its own licence in its `motion.json`.
