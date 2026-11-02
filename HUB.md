# The hub

> **Status:** Plan — the build, the site, the generic skill and the deploy are written; sample videos, listing levels and votes are not

How this repository is published at [motionhub.dev](https://motionhub.dev): the catalogue, the files a tool or an agent fetches, sample videos and the levels a motion is listed at. This is the hub's policy and distribution, not the motion format: the format is [SPEC.md](SPEC.md), and nothing here changes it.

## Where things are

| Path | What it is |
| --- | --- |
| `motions/<slug>/` | One motion, in the [format](SPEC.md). The newest version is the one in the main branch |
| `tools/check.mjs` | The checker every pull request runs, with no dependencies: the one place the rules are written as code |
| `bin/motionhub.mjs`, `package.json` | The npm package `@motionhub/cli` (command `motionhub`): the checker for tools and people outside this repository. `.github/workflows/publish.yml` publishes it by hand when its version moves |
| `tools/build.mjs` | Builds the files below into `dist/` from `motions/` and the skill, refusing while any motion has an issue |
| `tools/site.mjs`, `tools/site.css` | The site's pages: the gallery, a page per motion, the 404 page, `_headers`, `robots.txt` and `sitemap.xml` |
| `site/worker.mjs`, `wrangler.jsonc` | The Cloudflare Worker: it serves the build as static assets and the packages from the R2 bucket `motionhub` |
| `.github/workflows/deploy.yml` | Builds, publishes each new package to R2 and deploys, on every push to the main branch and every six hours. It refuses to replace a published package |
| `skills/motionhub/SKILL.md` | The generic skill: how any agent chooses a motion, fetches it and makes a film in it. `/llms.txt` is the same text |

The repository keeps text, code and posters only. Sample videos are not committed (below).

## What motionhub.dev serves

A static site, rebuilt from the main branch whenever it changes and every six hours.

| Path | What it is |
| --- | --- |
| `/` and `/m/<slug>` | The gallery and a page per motion: poster, sample, colours, faces, `MOTION.md` |
| `/api/motions.json` | The index: `spec`, and `motions`, one row per motion ordered by slug, with `slug`, `version`, `name`, `line`, `lang`, `tags`, `authors`, `license`, `poster`, `tools` (the directories it has for tools) and `package` (`url`, `sha256`, `bytes`). Paths are relative to the site |
| `/m/<slug>/MOTION.md`, `/m/<slug>/tokens.json`, `/m/<slug>/motion.json` | The newest version's files, to read directly |
| `/m/<slug>/<version>.tgz` | The whole motion at that version, its paths under `<slug>/`, with its SHA-256 in the index. The same files always give the same bytes |
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
