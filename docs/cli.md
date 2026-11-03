# Command line

`@motionhub/cli` finds, fetches and checks motions. It needs Node.js 20 or later and has no dependencies; run it with `npx` or install it with `npm i -g @motionhub/cli` for the `motionhub` command.

```sh
npx @motionhub/cli <command> [options]
```

## search

```sh
npx @motionhub/cli search [words ...]
```

The motions on motionhub.dev that have every word, in their id, names, line or tags.

## get

```sh
npx @motionhub/cli get <id> [--out <dir>]
```

The newest version of a motion, by its id (`@iamsuosi/red-pencil`), into `./motion` (or `--out`), checked against the SHA-256 in the index.

## init

```sh
npx @motionhub/cli init <slug> [--github <login>]
```

A new motion `@<you>/<slug>` in `./<slug>/`, with every required file but the poster, to fill in. Your GitHub login comes from `gh`, or `--github`.

## check

```sh
npx @motionhub/cli check [dir ...] [--format-only] [--author <github-login>] [--was <motion.json>]
```

A motion against the [specification](../SPEC.md) and motionhub's rules. With no directory it checks the current directory when it is a motion, and otherwise every motion under `./motions/`. `--format-only` leaves out the hub's rules, for a motion that is not headed for motionhub; `--author` and `--was` check it as a pull request by that account, changing that published `motion.json`.

## share

```sh
npx @motionhub/cli share <dir> [--github <login>] [--pr]
```

A motion through the checks its pull request will run, as you and against what is published. With `--pr` it opens that pull request from your fork of the repository, signed off, as the account `gh` is signed in as. [Share a motion](../CONTRIBUTING.md) explains what happens next.
