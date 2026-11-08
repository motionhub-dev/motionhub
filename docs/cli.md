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
npx @motionhub/cli get
```

The newest version of a motion, by its id (`@iamsuosi/lab-notebook`), into `./motions/<id>/`, checked against the SHA-256 in the index and recorded in `./motions.lock.json`. A project holds as many motions as its film uses, each at its id, beside its own motions in `./motions/<name>/` ([a project's motions](../SPEC.md#13-a-projects-motions)). A motion already there is kept: to take a newer version, remove its directory and get it again. With `--out` it goes into that directory instead, and is not recorded.

With no id, `get` takes every motion the lock records, at the version it records, as `npm install` does from a lockfile: so a project's motions come back on another computer or in a cloud session. A motion already there is packed the way the hub packs it and compared with the recorded SHA-256; one that was changed is named, and the exit status is 1.

### motions.lock.json

What a project took from motionhub, so the same film is made in the same motions everywhere. `get` writes it; keep it with the project.

```json
{
  "lockfileVersion": 1,
  "motions": {
    "@iamsuosi/lab-notebook": {"version": "1.0.2", "sha256": "<the SHA-256 of its package>"},
    "@iamsuosi/red-pencil": {"version": "1.0.2", "sha256": "<the SHA-256 of its package>"}
  }
}
```

`sha256` is the SHA-256 of the motion's package at `https://motionhub.dev/m/<id>/<version>.tgz`, which never changes once published.

## init

```sh
npx @motionhub/cli init <slug> [--github <login>]
```

A new motion `@<you>/<slug>` in `./motions/<slug>/`, a motion of the project's own, with every required file but the poster, to fill in. Your GitHub login comes from `--github`, or from `gh` when it is signed in.

## tokens

```sh
npx @motionhub/cli tokens [MOTION.md] [--out <file>]
```

The tokens of a [motion in one file](../SPEC.md#11-a-motion-in-one-file) as `tokens.json`, for a binding or a theme. It prints them, or writes them to `--out`, and refuses a file that is not a valid motion. With no file, it reads the project's: `./MOTION.md`, or else `./motion/MOTION.md`. For a motion in `./motions/`, name its file: `motionhub tokens motions/my-look/MOTION.md --out motions/my-look/tokens.json`.

## check

```sh
npx @motionhub/cli check [dir or MOTION.md ...] [--format-only] [--author <github-login>] [--was <motion.json>]
```

A motion against the [specification](../SPEC.md) and motionhub's rules. With no directory it checks the current directory when it is a motion, and otherwise every motion under `./motions/`, in a project as [the specification](../SPEC.md#13-a-projects-motions) keeps them: a copy from motionhub at its id, a motion of the project's own under a name of its own. `--format-only` leaves out the hub's rules, for a motion that is not headed for motionhub; `--author` and `--was` check it as a pull request by that account, changing that published `motion.json`.

## share

```sh
npx @motionhub/cli share <dir> [--wait]
npx @motionhub/cli share <dir> --pr [--github <login>]
```

A motion through the checks its pull request will run, against what is published, then uploaded to motionhub.dev. It prints a link and a code. Open the link and sign in with GitHub; motionhub asks for no permissions. Check the motion and type the code: motionhub's GitHub App opens the pull request on your behalf, with your account and DCO sign-off recorded in an App-signed commit. The motion must have one author. Only that account can read its private draft. CLI 0.8.0 polls using a request header, never a token in the URL. No git, `gh` or GitHub token is needed, so it works from a cloud agent too. `--wait` waits for the pull request, up to 30 minutes, and prints its address. A link works for a day. Shared again while your pull request is open, the new version is added to it.

With `--pr` it opens the pull request itself, from your fork, with git and `gh`, signed off, as the account `gh` is signed in as. `--github <login>` alone runs the checks as that account and opens nothing. [Share a motion](../CONTRIBUTING.md) explains what happens next.
