# The hub

> **Status:** Plan — the build, the site, the generic skill, the deploy and reels are written; listing levels and votes are not

How this repository is published at [motionhub.dev](https://motionhub.dev): the catalogue, the files a tool or an agent fetches, reels and the levels a motion is listed at. This is the hub's policy and distribution, not the motion format: the format is [SPEC.md](SPEC.md), and nothing here changes it.

## Where things are

| Path | What it is |
| --- | --- |
| `motions/@<scope>/<slug>/` | One motion in the [format](SPEC.md), published by the GitHub account `<scope>`, id `@<scope>/<slug>`. Every motion on the hub has a scope; there are no unscoped, official ones. The newest version of each is the one in the main branch |
| `accounts/<login>.json` | Each GitHub login a motion names, recorded once with its account's numeric id (`{"login", "id"}`). A login can change hands, and an id cannot, so who owns a scope or a motion is decided by the id ([CONTRIBUTING.md](CONTRIBUTING.md), "Accounts") |
| `tools/check.mjs` | The checker every pull request runs, with no dependencies: the one place the rules are written as code. Who may publish or change a motion is judged by the copy on the main branch, not the pull request's |
| `bin/motionhub.mjs`, `tools/hub.mjs`, `package.json` | The npm package `@motionhub/cli` (command `motionhub`): `check` (the checker, for tools and people outside this repository), `search` and `get` (the index, and a package checked against its SHA-256 and unpacked into `./motion`). A tag `v<version>` stages it on npm (`.github/workflows/publish.yaml`, trusted publishing, no token) and a maintainer approves it with `npm stage approve` |
| `packages/runtime/`, `packages/remotion/`, `packages/hyperframes/` | The npm packages `@motionhub/runtime` (what a motion's components draw with, in any engine) and its bindings for Remotion and HyperFrames. A tag `<package>-v<version>` stages one the same way |
| `tools/build.mjs` | Builds the files below into `dist/` from `motions/` and the skill, refusing while any motion has an issue |
| `brand/`, `tools/brand.mjs` | The brand: tokens (colours for both themes, type, sizes), the logo, icons, favicons and default share card, and the rules for using them ([brand/BRAND.md](brand/BRAND.md)). `node tools/brand.mjs` writes `brand/tokens.css` from the tokens |
| `site/` | The site's pages, an [Astro](https://astro.build) project with its own `package.json`: the home page, the gallery, a page per motion and the 404 page, in the brand's tokens and self-hosted fonts. `npm run build` there runs `tools/build.mjs` into `dist/`, builds the pages over it and adds them, never replacing a served file |
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
| `/`, `/motions/` and `/m/<id>` | The home page, the gallery to search and filter, and a page per motion: poster, reel, colours, `MOTION.md`, credits |
| `/creators/` and `/creators/<login>/` | Everyone who is an author of a motion, one page per GitHub account (`accounts/`): their motions, the motions of others built on them (`basedOn`), and their downloads and likes. The page is at a scope the account publishes under (else its login), in lowercase; every other login it published under is redirected there (`_redirects`). It shows the account's login now when the build can ask GitHub, else that address's login |
| `/api/motions.json` | The index: `spec`, and `motions`, one row per motion ordered by id, with `slug` (the motion's id, `<slug>` or `@<scope>/<slug>`, so a client that only knows `motion/0.1` never takes one motion for another), `scope` (when it has one), `spec` (its motion's), `version`, `name`, `line`, `lang`, `tags`, `authors`, `basedOn` (when it has one), `fit` (what it is for, when it says: SPEC.md §3), `license`, `poster`, `tools` (the directories it has for tools), `package` (`url`, `sha256`, `bytes`) and, when it has a reel, `reel` (the path of its player). Paths are relative to the site |
| `/api/stats.json` | Each motion's downloads and likes: `motions`, by id, with `downloads.total`, `downloads.last30` and `likes`, and `generated`. Kept for five minutes; see Counts below |
| `/auth/login`, `/auth/callback`, `/auth/logout`, `/api/me`, `/api/likes/<id>` | Signing in with GitHub, who is signed in (their GitHub account's `id`, `login`, `name` and `avatar`) and what they like, and giving (`POST`) or taking back (`DELETE`) a like. `DELETE /api/me` forgets the person. See Likes below |
| `/avatar/<id>?s=<size>` and `/api/accounts.json` | A GitHub account's avatar, by its numeric id, for the accounts the site shows (recorded in `accounts/`, listed login → id in `/api/accounts.json`, or signed in): fetched from GitHub at most once a day and kept at the edge, a day in the browser and a week more while it checks, at a few fixed sizes. When GitHub cannot be reached (waited on 3 s, then not asked again for a minute), the last copy. Only JPEG, PNG, GIF or WebP is served. The edge cache works on the custom domain, not on `workers.dev` |
| `/you/` and `/api/me/pulls` | The signed-in person's own page: the motions they may change (by their account's id in `accounts/`), their open pull requests on this repository with each one's checks, review and motions (read from GitHub's public API by the account's id, kept for a minute), and what they liked. Nothing there changes a motion: it says how to open the pull request |
| `/m/<id>/MOTION.md`, `/m/<id>/tokens.json`, `/m/<id>/motion.json` | The newest version's files, to read directly |
| `/m/<id>/<version>.tgz` | The whole motion at that version, its paths under `<id>/`, with its SHA-256 in the index. The same files always give the same bytes |
| `/play/<id>/` | The motion's reel, playing live: its `react/reel.tsx`, its components, React and `@motionhub/runtime` in one script, with its faces. Served under a policy that lets it load nothing from anywhere else |
| `/llms.txt` | For agents: what a motion is, how to choose one from the index and how to use it, then every docs page's Markdown twin |
| `/docs/<page>/`, `/docs/<page>.md`, `/llms-full.txt` | The docs: the repository's own documents (`SPEC.md`, `CONTRIBUTING.md`, the packages' READMEs, `brand/BRAND.md`) and the guides in `docs/`, each as a page and as Markdown, and all of them in one file. The list is `tools/docs.mjs` |

A tool needs the index to search and one package to use a motion; it never downloads the repository. Every published package stays at its URL: the build knows only the newest versions, so the deploy adds packages and never replaces or removes one.

## Reels

A motion's page plays the motion live, from its reel: `react/reel.tsx`, a React component that composes the motion's components and animates them by `useTime()` for at most 30 seconds (`export const reel = {seconds}` and a default export; `hub.reel`). It shows how the motion moves, at a brisk pace, with no narration and no story of a film. The site's build bundles each reel with its components, React and `@motionhub/runtime` into `/play/<id>/` (`site/player/build.mjs`), and the page shows it in a frame sandboxed to scripts alone, with no origin of its own; `/play/*` is served under a content security policy that loads nothing from anywhere else and connects nowhere. A component's `<Video>` draws a quiet stand-in there, since the catalogue holds no footage. Its sound is synthesised in the page by `@motionhub/runtime/sound` from the motion's `react/sound.json` (`hub.sound`) and the reel's `export const cues`, off until the viewer turns it on. Its faces are the motion's own (`react/fonts/`) and, for the rest, Google Fonts' Latin files, copied in at build: the player fetches nothing. The player stops drawing while it is scrolled out of sight, and a reel that draws in 3D waits for a tap on a device with few cores, little memory or a touch screen. When the motion's version has its video (`/m/<id>/<version>.mp4`, below), the page plays that by default, since any phone plays a video smoothly, and the viewer can switch to the live player; the choice is remembered in the browser. A version not rendered yet, or a video the browser cannot play, plays live. A card in the gallery shows the poster.

Every pull request and every push to main plays every reel (`site/player/smoke.mjs`, the check's "Every reel plays"). Each player opens in a headless Chrome under the policy above and is scrubbed to four moments. A reel fails when its page throws or logs an error, a request fails or is refused, a moment draws nothing, or every moment draws the same picture. A change to `@motionhub/runtime` or the player is a change to every reel, and this is how it shows which reels it broke.

## The gallery's order

The gallery (`/motions/`) lists motions in a recommended order, and anyone can switch to A to Z, most downloaded or most liked. The home page shows the first ten.

- First come the few motions named in `FEATURED` (`site/src/lib/catalogue.mjs`), in that order. This is the only part kept by hand: a short pick for a catalogue with little data yet, of looks that carry most subjects and cost an agent little. The home page's try card offers the same looks.
- The rest are ordered by what they are for (`fit.kind`, SPEC.md §3): general motions first, then motions drawn over the maker's own footage, then topic motions, then motions that do not say.
- Within a kind, a motion whose components cover more of the core purposes comes first. The core purposes are title, data, compare, steps, term, link and transition, read from each component's `meta.purpose`.
- Motions that tie are listed A to Z.

A new motion takes its place with no one moving it. Downloads and likes will weigh in once there are enough of them.

## Listing levels

| Level | Means |
| --- | --- |
| `research` | The text and tokens are there; no film has been made in it yet |
| `sample` | One film has been made in it, by a tool whose directory it has, and its sample is published |
| `verified` | Films on clearly different subjects have been made in it, and someone who did not make them has reviewed them |

The hub records the level, not the motion: it can change without a new version.

## Counts

motionhub counts two things, to show which motions people use: a download of a package, and a person opening a motion's page. Each is one event of what happened (`download` or `view`), the motion's id, the version (for a download) and the country Cloudflare saw the request from. Nothing else is kept: no cookie, no address, no browser, nothing that names a person, and nothing is counted on any other page. Crawlers and link previews are not counted; a command line or an agent fetching a package is.

Downloads are public at `/api/stats.json` and on the site. Views are not published: they are for the maintainers, to see what people look at. The events are kept by Cloudflare Workers Analytics Engine for three months; what lasts longer is each motion's number of downloads, added up once a day.

## Likes

Anyone with a GitHub account can sign in and like a motion, once. Signing in asks GitHub for no permission: motionhub learns the account's public id, login, name and avatar, and does not keep GitHub's token. A session lasts 30 days in an HttpOnly cookie, and the database keeps only a hash of it. A like is public as a count; who liked what is not published. Taking a like back removes it; *Forget me*, in the account menu, removes the person's likes, sessions and record. Likes are kept in Cloudflare D1; the schema is `site/migrations/`.

## Votes

A 👍 on a motion's pull request or issue counts as a vote. Votes order the gallery; they never decide what is merged.
