# Contributing a motion

A motion arrives as a pull request that adds `motions/<slug>/` in the [format](SPEC.md). Your GitHub account is your identity here: the `github` of at least one author in `motion.json` must be the account that opens the pull request.

## Before you open it

```sh
npx @motionhub/cli check motions/<slug>     # or, in a clone of this repository: node tools/check.mjs motions/<slug>
```

The checker has no dependencies (Node 20 or later). It runs the same rules as the pull request's checks: the format, then the rules below.

Write `MOTION.md` in English if you can, or add an English translation next to it (`MOTION.en.md` when `MOTION.md` is in another language): more people and agents can use it. Neither is required.

## What is accepted

- **Licences.** `license.text`: `CC-BY-4.0` (the default), `CC-BY-SA-4.0` or `CC0-1.0`. `license.code`: `MIT` (the default), `Apache-2.0`, `BSD-2-Clause`, `BSD-3-Clause`, `ISC` or `0BSD`.
- **Fonts.** Open licences only (SIL Open Font License, Apache 2.0, Ubuntu Font Licence), each named in `CREDITS.md`.
- **Assets.** Your own, or CC0, CC BY or OFL, each named in `CREDITS.md` with its source. Public-domain artworks are welcome when `CREDITS.md` says where they come from.
- **Size.** At most 1 MB for the whole motion, the poster included. No video, audio over 500 KB, or build output in the repository.
- **Signed commits.** Every commit carries a `Signed-off-by:` line (`git commit -s`), certifying the [Developer Certificate of Origin](https://developercertificate.org): you have the right to contribute what it contains under its licence.

## Original work

A motion is a look of your own. You may learn from any film or project, and say so in `CREDITS.md`, but you build it anew:

- No brand, logo, trademark, product interface or character of someone else, and no look that would be mistaken for one.
- No copy of another project's code, artwork, fonts or text, whatever its licence, unless that licence allows it and `CREDITS.md` names it.
- An art movement or a painter's manner is fine. A copy of a particular protected artwork is not.

A pull request that breaks these is closed. If you hold rights in something here, open an issue and it will be looked at quickly.

## Code in a tool directory

Code under a tool directory runs in other people's browsers and render machines, so the checks refuse code that:

- reaches the network (`fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `navigator.sendBeacon`);
- evaluates text as code (`eval`, `new Function`, a string passed to `setTimeout` or `setInterval`) or imports at run time (`import(…)`);
- reads or writes cookies or storage (`document.cookie`, `localStorage`, `sessionStorage`, `indexedDB`).

A tool may add rules of its own for its directory.

## Review

1. The checks run on every pull request and post the result.
2. A reviewer agent reads the motion for originality, safety and whether `MOTION.md` lets someone make a film in it, and leaves its notes as a comment. It advises; it does not merge.
3. A maintainer merges. A first-time contributor's pull request always waits for a person.

## Changing a published motion

Only one of a motion's published authors may change it: the checks compare the pull request's author with the authors of the version on the main branch, so adding yourself to `authors` does not make a motion yours. To build on someone else's motion, publish your own under a new slug and credit theirs in `CREDITS.md`.

A change carries a higher `version` than the published one, since a published version never changes ([SPEC.md](SPEC.md) §9). The newest version replaces the previous one in `motions/<slug>/`; published packages of earlier versions stay where they are ([HUB.md](HUB.md)).
