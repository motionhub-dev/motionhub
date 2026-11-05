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

The newest version of a motion, by its id (`@iamsuosi/lab-notebook`), into `./motion` (or `--out`), checked against the SHA-256 in the index.

## init

```sh
npx @motionhub/cli init <slug> [--github <login>]
```

A new motion `@<you>/<slug>` in `./<slug>/`, with every required file but the poster, to fill in. Your GitHub login comes from `--github`, or from `gh` when it is signed in.

## tokens

```sh
npx @motionhub/cli tokens [MOTION.md] [--out <file>]
```

The tokens of a [motion in one file](../SPEC.md#11-a-motion-in-one-file) as `tokens.json`, for a binding or a theme. It prints them, or writes them to `--out`, and refuses a file that is not a valid motion. With no file, it reads the project's: `./MOTION.md`, or else `./motion/MOTION.md`.

## check

```sh
npx @motionhub/cli check [dir or MOTION.md ...] [--format-only] [--author <github-login>] [--was <motion.json>]
```

A motion against the [specification](../SPEC.md) and motionhub's rules. With no directory it checks the current directory when it is a motion, and otherwise every motion under `./motions/`. `--format-only` leaves out the hub's rules, for a motion that is not headed for motionhub; `--author` and `--was` check it as a pull request by that account, changing that published `motion.json`.

## share

```sh
npx @motionhub/cli share <dir> [--wait]
npx @motionhub/cli share <dir> --pr [--github <login>]
```

A motion through the checks its pull request will run, against what is published, then uploaded to motionhub.dev. It prints a link and a code. Open the link and sign in with GitHub; motionhub asks for no permissions. Check the motion and type the code: motionhub's GitHub App opens the pull request on your behalf, with your name on the commit, signed off. No git, `gh` or GitHub token is needed, so it works from a cloud agent too. `--wait` waits for the pull request, up to 30 minutes, and prints its address. A link works for a day. Shared again while your pull request is open, the new version is added to it.

With `--pr` it opens the pull request itself, from your fork, with git and `gh`, signed off, as the account `gh` is signed in as. `--github <login>` alone runs the checks as that account and opens nothing. [Share a motion](../CONTRIBUTING.md) explains what happens next.
