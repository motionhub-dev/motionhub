# The hub

> **Status:** Plan — the build, the site, the generic skill and the deploy are written; sample videos, listing levels and votes are not

How this repository is published at [motionhub.dev](https://motionhub.dev): the catalogue, the files a tool or an agent fetches, sample videos and the levels a motion is listed at. This is the hub's policy and distribution, not the motion format: the format is [SPEC.md](SPEC.md), and nothing here changes it.

## Where things are

| Path | What it is |
| --- | --- |
| `motions/<slug>/` | One official motion, in the [format](SPEC.md). Unscoped ids are the hub's own: only its maintainers, listed in `.github/maintainers`, publish them |
| `motions/@<scope>/<slug>/` | One motion published by the GitHub account `<scope>`, id `@<scope>/<slug>`. The newest version of each is the one in the main branch |
| `tools/check.mjs` | The checker every pull request runs, with no dependencies: the one place the rules are written as code |
| `bin/motionhub.mjs`, `tools/hub.mjs`, `package.json` | The npm package `@motionhub/cli` (command `motionhub`): `check` (the checker, for tools and people outside this repository), `search` and `get` (the index, and a package checked against its SHA-256 and unpacked into `./motion`). A tag `v<version>` stages it on npm (`.github/workflows/publish.yaml`, trusted publishing, no token) and a maintainer approves it with `npm stage approve` |
| `packages/runtime/`, `packages/remotion/`, `packages/hyperframes/` | The npm packages `@motionhub/runtime` (what a motion's components draw with, in any engine) and its bindings for Remotion and HyperFrames. A tag `<package>-v<version>` stages one the same way |
| `tools/build.mjs` | Builds the files below into `dist/` from `motions/` and the skill, refusing while any motion has an issue |
| `brand/`, `tools/brand.mjs` | The brand: tokens (colours for both themes, type, sizes), the logo, icons, favicons and default share card, and the rules for using them ([brand/BRAND.md](brand/BRAND.md)). `node tools/brand.mjs` writes `brand/tokens.css` from the tokens |
| `tools/site.mjs`, `tools/site.css` | The site's pages: the gallery, a page per motion, the 404 page, `_headers`, `robots.txt` and `sitemap.xml` |
| `site/worker.mjs`, `wrangler.jsonc` | The Cloudflare Worker: it serves the build as static assets and the packages from the R2 bucket `motionhub` |
| `.github/workflows/deploy.yml` | Builds, publishes each new package to R2 and deploys, on every push to the main branch and every six hours. It refuses to replace a published package |
| `skills/motionhub/SKILL.md` | The generic skill: how any agent chooses a motion, fetches it and makes a film in it. `/llms.txt` is the same text |

The repository keeps text, code and posters only. Sample videos are not committed (below).

## What motionhub.dev serves

A static site, rebuilt from the main branch whenever it changes and every six hours.

| Path | What it is |
| --- | --- |
| `/` and `/m/<id>` | The gallery and a page per motion: poster, sample, colours, faces, `MOTION.md` |
| `/api/motions.json` | The index: `spec`, and `motions`, one row per motion ordered by id, with `slug` (the motion's id, `<slug>` or `@<scope>/<slug>`, so a client that only knows `motion/0.1` never takes one motion for another), `scope` (when it has one), `spec` (its motion's), `version`, `name`, `line`, `lang`, `tags`, `authors`, `license`, `poster`, `tools` (the directories it has for tools) and `package` (`url`, `sha256`, `bytes`). Paths are relative to the site |
| `/m/<id>/MOTION.md`, `/m/<id>/tokens.json`, `/m/<id>/motion.json` | The newest version's files, to read directly |
| `/m/<id>/<version>.tgz` | The whole motion at that version, its paths under `<id>/`, with its SHA-256 in the index. The same files always give the same bytes |
| `/llms.txt` | For agents: what a motion is, how to choose one from the index and how to use it |

A tool needs the index to search and one package to use a motion; it never downloads the repository. Every published package stays at its URL: the build knows only the newest versions, so the deploy adds packages and never replaces or removes one.

Sample players run code written by contributors. They are served from their own host, which no cookie is set for, under a content security policy that lets them load nothing from anywhere else.

## Sample videos

A motion with a sample has a short video of it (at most 20 seconds, H.264, at most 8 MB), stored next to the site rather than in the repository. A pull request's sample is built by its checks and shown on the pull request.

## Listing levels

| Level | Means |
| --- | --- |
| `research` | The text and tokens are there; no film has been made in it yet |
| `sample` | One film has been made in it, by a tool whose directory it has, and its sample is published |
| `verified` | Films on clearly different subjects have been made in it, and someone who did not make them has reviewed them |

The hub records the level, not the motion: it can change without a new version. A motion listed as **official** is maintained by the hub's maintainers.

## Votes

A 👍 on a motion's pull request or issue counts as a vote. Votes order the gallery; they never decide what is merged.
