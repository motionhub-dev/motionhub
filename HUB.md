# The hub

> **Status:** Plan · not built yet

How this repository is published at [motionhub.dev](https://motionhub.dev): the catalogue, the files a tool or an agent fetches, sample videos and the levels a motion is listed at. This is the hub's policy and distribution, not the motion format: the format is [SPEC.md](SPEC.md), and nothing here changes it.

## Where things are

| Path | What it is |
| --- | --- |
| `motions/<slug>/` | One motion, in the [format](SPEC.md). The newest version is the one in the main branch |
| `tools/` | The checker every pull request runs, with no dependencies: the one place the rules are written as code |

The repository keeps text, code and posters only. Sample videos are not committed (below).

## What motionhub.dev serves

A static site, rebuilt from the main branch whenever it changes and every six hours.

| Path | What it is |
| --- | --- |
| `/` and `/m/<slug>` | The gallery and a page per motion: poster, sample, colours, faces, `MOTION.md` |
| `/api/motions.json` | The index: one row per motion with `slug`, `version`, `name`, `line`, `tags`, `authors`, `license`, `poster`, the tools it has a directory for, and its package |
| `/m/<slug>/MOTION.md`, `/m/<slug>/tokens.json`, `/m/<slug>/motion.json` | The newest version's files, to read directly |
| `/m/<slug>/<version>.tgz` | The whole motion at that version, without its sample video, with its SHA-256 in the index |
| `/llms.txt` | For agents: what a motion is, how to choose one from the index and how to use it |

A tool needs the index to search and one package to use a motion; it never downloads the repository. Every published package stays at its URL.

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
