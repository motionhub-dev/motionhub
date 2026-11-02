# motionhub/motions

The open motion format and the public catalogue behind motionhub.dev. Read [README.md](README.md), then [SPEC.md](SPEC.md).

- **SPEC.md only grows.** A change never alters the meaning of what a published version says; it adds, under a new `spec` version. What only one tool needs stays in that tool's directory and `x-<tool>` members (SPEC.md §7) until several tools share it.
- **The rules live in one place as code:** `tools/check.mjs` (format and hub rules, no dependencies) with its tests in `tests/`. A rule written in SPEC.md or CONTRIBUTING.md and not in the checker is a bug, and the other way round.
- **English** for everything a developer reads: code, comments, documents, commit messages. A motion's own `MOTION.md`, translations and descriptions are in whatever language its author chooses (SPEC.md §8).
- **Every commit is signed off** (`git commit -s`); the checks refuse a pull request without it.
- Before pushing: `npm test` and `node tools/check.mjs`.
- Talk to the developer in Chinese.
