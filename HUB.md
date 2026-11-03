# The hub

> **Status:** Plan — the build, the site, the generic skill, the deploy and reels are written; listing levels and votes are not

How this repository is published at [motionhub.dev](https://motionhub.dev): the catalogue, the files a tool or an agent fetches, reels and the levels a motion is listed at. This is the hub's policy and distribution, not the motion format: the format is [SPEC.md](SPEC.md), and nothing here changes it.

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
| `site/` | The site's pages, an [Astro](https://astro.build) project with its own `package.json`: the gallery, a page per motion and the 404 page, in the brand's tokens and self-hosted fonts. `npm run build` there runs `tools/build.mjs` into `dist/`, builds the pages over it and adds them, never replacing a served file |
| `docs/`, `tools/docs.mjs` | The guides only the docs have (overview, using a motion, the command line), and the list of every docs page with the document it is. A docs page is a document where it already lives in the repository, never a copy |
| `tools/site.mjs` | What the pages share with the build, with no dependencies: the Markdown a motion's documents use, its colours and faces, and `_headers`, `robots.txt` and `sitemap.xml` |
| `site/player/` | The reel player and its build: one page and one script per motion with a reel, under `/play/<id>/` |
| `site/worker.mjs`, `wrangler.jsonc` | The Cloudflare Worker: it serves the build as static assets and the packages from the R2 bucket `motionhub` |
| `.github/workflows/deploy.yml` | Builds, publishes each new package to R2 and deploys, on every push to the main branch and every six hours. It refuses to replace a published package |
| `skills/motionhub/SKILL.md` | The generic skill: how any agent chooses a motion, fetches it and makes a film in it. `/llms.txt` is the same text, followed by the index of the docs |

The repository keeps text, code and posters only: no video.

## What motionhub.dev serves

A static site, rebuilt from the main branch whenever it changes and every six hours.

| Path | What it is |
| --- | --- |
| `/` and `/m/<id>` | The gallery and a page per motion: poster, reel, colours, faces, `MOTION.md` |
| `/creators/` and `/creators/<login>/` | Everyone who is an author of a motion, by GitHub login in lowercase: their motions, the motions of others built on them (`basedOn`), and their downloads and likes |
| `/api/motions.json` | The index: `spec`, and `motions`, one row per motion ordered by id, with `slug` (the motion's id, `<slug>` or `@<scope>/<slug>`, so a client that only knows `motion/0.1` never takes one motion for another), `scope` (when it has one), `spec` (its motion's), `version`, `name`, `line`, `lang`, `tags`, `authors`, `basedOn` (when it has one), `license`, `poster`, `tools` (the directories it has for tools), `package` (`url`, `sha256`, `bytes`) and, when it has a reel, `reel` (the path of its player). Paths are relative to the site |
| `/api/stats.json` | Each motion's downloads and likes: `motions`, by id, with `downloads.total`, `downloads.last30` and `likes`, and `generated`. Kept for five minutes; see Counts below |
| `/auth/login`, `/auth/callback`, `/auth/logout`, `/api/me`, `/api/likes/<id>` | Signing in with GitHub, who is signed in and what they like, and giving (`POST`) or taking back (`DELETE`) a like. `DELETE /api/me` forgets the person. See Likes below |
| `/m/<id>/MOTION.md`, `/m/<id>/tokens.json`, `/m/<id>/motion.json` | The newest version's files, to read directly |
| `/m/<id>/<version>.tgz` | The whole motion at that version, its paths under `<id>/`, with its SHA-256 in the index. The same files always give the same bytes |
| `/play/<id>/` | The motion's reel, playing live: its `react/reel.tsx`, its components, React and `@motionhub/runtime` in one script, with its faces. Served under a policy that lets it load nothing from anywhere else |
| `/llms.txt` | For agents: what a motion is, how to choose one from the index and how to use it, then every docs page's Markdown twin |
| `/docs/<page>/`, `/docs/<page>.md`, `/llms-full.txt` | The docs: the repository's own documents (`SPEC.md`, `CONTRIBUTING.md`, this file, the skill, the packages' READMEs, `brand/BRAND.md`) and the guides in `docs/`, each as a page and as Markdown, and all of them in one file. The list is `tools/docs.mjs` |

A tool needs the index to search and one package to use a motion; it never downloads the repository. Every published package stays at its URL: the build knows only the newest versions, so the deploy adds packages and never replaces or removes one.

## Reels

A motion's page plays the motion live, from its reel: `react/reel.tsx`, a React component that composes the motion's components and animates them by `useTime()` for at most 30 seconds (`export const reel = {seconds}` and a default export; `hub.reel`). It shows how the motion moves, at a brisk pace, with no narration and no story of a film. The site's build bundles each reel with its components, React and `@motionhub/runtime` into `/play/<id>/` (`site/player/build.mjs`), and the page shows it in a frame sandboxed to scripts alone, with no origin of its own; `/play/*` is served under a content security policy that loads nothing from anywhere else and connects nowhere. A component's `<Video>` draws a quiet stand-in there, since the catalogue holds no footage. A card in the gallery shows the poster.

## Listing levels

| Level | Means |
| --- | --- |
| `research` | The text and tokens are there; no film has been made in it yet |
| `sample` | One film has been made in it, by a tool whose directory it has, and its sample is published |
| `verified` | Films on clearly different subjects have been made in it, and someone who did not make them has reviewed them |

The hub records the level, not the motion: it can change without a new version. A motion listed as **official** is maintained by the hub's maintainers.

## Counts

motionhub counts two things, to show which motions people use: a download of a package, and a person opening a motion's page. Each is one event of what happened (`download` or `view`), the motion's id, the version (for a download) and the country Cloudflare saw the request from. Nothing else is kept: no cookie, no address, no browser, nothing that names a person, and nothing is counted on any other page. Crawlers and link previews are not counted; a command line or an agent fetching a package is.

Downloads are public at `/api/stats.json` and on the site. Views are not published: they are for the maintainers, to see what people look at. The events are kept by Cloudflare Workers Analytics Engine for three months; what lasts longer is each motion's number of downloads, added up once a day.

## Likes

Anyone with a GitHub account can sign in and like a motion, once. Signing in asks GitHub for no permission: motionhub learns the account's public id, login, name and avatar, and does not keep GitHub's token. A session lasts 30 days in an HttpOnly cookie, and the database keeps only a hash of it. A like is public as a count; who liked what is not published. Taking a like back removes it; *Forget me*, in the account menu, removes the person's likes, sessions and record. Likes are kept in Cloudflare D1; the schema is `site/migrations/`.

## Votes

A 👍 on a motion's pull request or issue counts as a vote. Votes order the gallery; they never decide what is merged.
