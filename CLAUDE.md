# motionhub/motions

The open motion format and the public catalogue behind motionhub.dev. Read [README.md](README.md), then [SPEC.md](SPEC.md).

- **SPEC.md only grows.** A change never alters the meaning of what a published version says; it adds, under a new `spec` version. What only one tool needs stays in that tool's directory and `x-<tool>` members (SPEC.md §7) until several tools share it.
- **The rules live in one place as code:** `tools/check.mjs` (format and hub rules, no dependencies) with its tests in `tests/`. A rule written in SPEC.md or CONTRIBUTING.md and not in the checker is a bug, and the other way round.
- **English** for everything a developer reads: code, comments, documents, commit messages. A motion's own `MOTION.md`, translations and descriptions are in whatever language its author chooses (SPEC.md §8).
- **Every commit is signed off** (`git commit -s`); the checks refuse a pull request without it.
- **The brand lives in `brand/`** ([brand/BRAND.md](brand/BRAND.md)): a colour, size or font is decided in `brand/brand.tokens.json` and nowhere else, and the site is quiet so the motions can be loud.
- Before pushing: `npm test`, `node tools/check.mjs` and `node tools/build.mjs`; for a change to the site, `npm run build` in `site/` too.
- **The docs at motionhub.dev/docs are the repository's own documents** (`tools/docs.mjs` lists them): change a document where it lives, and write a guide that has no home yet in `docs/`. A link between documents is a relative path to the file, which the docs turn into a page or its Markdown twin.
- **The site's dependencies stay in `site/`.** The repository's root is the zero-dependency `@motionhub/cli` package; the pages are an Astro project with its own `package.json` and lockfile.
- **Claude on GitHub.** `@claude` in an issue or pull request (`.github/workflows/claude.yml`) and the reviewer agent (`claude-review.yml`, following [REVIEW.md](REVIEW.md)) run as the Claude GitHub App with the `CLAUDE_CODE_OAUTH_TOKEN` secret. Only people with write access call either; a fork's pull request is reviewed when one of them comments `/review`.
- Talk to the developer in Chinese.
