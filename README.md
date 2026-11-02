# motionhub

Motions are reusable looks for narrated and explanatory video: how a film looks and how it moves, written so that a person or an agent can make a new film in it with any engine. This repository is the open format and the public catalogue behind [motionhub.dev](https://motionhub.dev).

- **[SPEC.md](SPEC.md)**: the motion format, `motion/0.1`. Five files: `motion.json`, `MOTION.md`, `tokens.json` (W3C DTCG), `poster.jpg`, `CREDITS.md`, and a directory for each tool that wants one.
- **[CONTRIBUTING.md](CONTRIBUTING.md)**: how to add a motion by pull request, what is accepted and how it is reviewed.
- **[HUB.md](HUB.md)**: how the catalogue is published and fetched (planned).

```
motions/<slug>/
  motion.json   MOTION.md   tokens.json   poster.jpg   CREDITS.md
  visotalk/     files only VisoTalk reads
```

## Using a motion

Any agent can read a motion's `MOTION.md` and `tokens.json` and follow them in its own engine, the way it would follow a design system. A tool that has its own directory in a motion gets ready-made pieces as well.

## Checking a motion

```sh
node tools/check.mjs motions/<slug>    # one motion
node tools/check.mjs                   # all of them
```

## Maintainers

Maintained by [VisoTalk](https://visotalk.dev), its first tool and reference implementation. The format belongs to everyone who uses it; proposals to change it are issues on this repository.

The tools in this repository are MIT-licensed ([LICENSE](LICENSE)). Each motion carries its own licence in its `motion.json`.
