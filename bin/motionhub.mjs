#!/usr/bin/env node
// The motionhub command, published as @motionhub/cli: check motions against the format and the hub's rules
// (tools/check.mjs, the same checks a pull request runs); search, get, start and share them (tools/hub.mjs).
//
//   motionhub check [dir or MOTION.md ...] [--format-only] [--author <github-login>] [--author-id <github-id>] [--was <motion.json>]
//   motionhub search [words ...]
//   motionhub get [<id>] [--out <dir>] [--private]
//   motionhub private push <dir> | list | delete <id>[@<version>]
//   motionhub init <slug> [--github <login>]
//   motionhub tokens [MOTION.md] [--out <file>]
//   motionhub share <dir> [--wait] | motionhub share <dir> --pr [--github <login>]

import {artifactCli} from '../tools/artifact-cli.mjs';
import {readFileSync} from 'node:fs';
import {main as check} from '../tools/check.mjs';
import {main as hub} from '../tools/hub.mjs';
import {privateCli} from '../tools/private-cli.mjs';

const USAGE = `usage: motionhub check [dir or MOTION.md ...] [--format-only] [--author <github-login>] [--author-id <github-id>] [--was <motion.json>]
       motionhub search [words ...]
       motionhub login | whoami | logout
       motionhub artifact upload <index.html|site.zip|directory> [--id <artifact-id>] [--title <name>]
       motionhub get [<id>] [--out <dir>] [--private]
       motionhub private push <dir> | motionhub private list | motionhub private delete <id>[@<version>]
       motionhub init <slug> [--github <login>]
       motionhub tokens [MOTION.md] [--out <file>]
       motionhub share <dir> [--wait]
       motionhub share <dir> --pr [--github <login>]

check   a motion against the motion format (https://github.com/motionhub-dev/motionhub/blob/main/SPEC.md) and motionhub's
        rules; with no directory, the current directory when it is a motion, else every motion under ./motions/
search  motionhub.dev's motions that have every word
get     the newest version of a motion (@iamsuosi/lab-notebook) into ./motions/<id>/, checked against its SHA-256 and
        recorded in ./motions.lock.json (with --out, into that directory, unrecorded); with no id, every motion the lock
        records, at its version: one missing is taken, one there is checked to be the copy as published. With
        --private, one of your own private motions, signed in
private a motion of your own kept on motionhub.dev for you alone, signed in with motionhub login: push checks it
        against the format and keeps a version (which never changes once kept), list and delete manage them
init    a new motion @<you>/<slug> in ./motions/<slug>/, every required file but the poster, to fill in
tokens  a motion in one file's tokens as tokens.json, to standard output or --out; with no file, the project's
        (./MOTION.md, else ./motion/MOTION.md)
share   a motion through the checks its pull request will run, against what is published, then uploaded to
        motionhub.dev: open the link it prints, sign in with GitHub and type its code to open the pull request under
        your name (no git, gh or token needed; --wait waits for it). With --pr, open the pull request yourself from
        your fork of github.com/motionhub-dev/motionhub with git and gh, signed off, as the account gh is signed in as`;

const [command, ...args] = process.argv.slice(2);
try {
  if (command === 'check') process.exitCode = await check(args);
  else if (['login', 'whoami', 'logout', 'artifact'].includes(command)) await artifactCli(command, args);
  else if (['search', 'get', 'init', 'tokens', 'share'].includes(command)) process.exitCode = await hub(command, args);
  else if (command === 'private') process.exitCode = await privateCli(args);
  else if (command === '--version' || command === '-v') console.log(JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version);
  else { console.log(USAGE); process.exitCode = command && command !== '--help' && command !== '-h' ? 2 : 0; }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
