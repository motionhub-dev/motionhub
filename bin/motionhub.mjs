#!/usr/bin/env node
// The motionhub command, published as @motionhub/cli: check motions against the format and the hub's rules
// (tools/check.mjs, the same checks a pull request runs); search, get, start and share them (tools/hub.mjs).
//
//   motionhub check [dir ...] [--format-only] [--author <github-login>] [--author-id <github-id>] [--was <motion.json>]
//   motionhub search [words ...]
//   motionhub get <id> [--out <dir>]
//   motionhub init <slug> [--github <login>]
//   motionhub share <dir> [--github <login>] [--pr]

import {readFileSync} from 'node:fs';
import {main as check} from '../tools/check.mjs';
import {main as hub} from '../tools/hub.mjs';

const USAGE = `usage: motionhub check [dir ...] [--format-only] [--author <github-login>] [--author-id <github-id>] [--was <motion.json>]
       motionhub search [words ...]
       motionhub get <id> [--out <dir>]
       motionhub init <slug> [--github <login>]
       motionhub share <dir> [--github <login>] [--pr]

check   a motion against the motion format (https://github.com/motionhub-dev/motions/blob/main/SPEC.md) and motionhub's
        rules; with no directory, the current directory when it is a motion, else every motion under ./motions/
search  motionhub.dev's motions that have every word
get     the newest version of a motion (@iamsuosi/red-pencil) into ./motion (or --out), checked against its SHA-256
init    a new motion @<you>/<slug> in ./<slug>/, every required file but the poster, to fill in
share   a motion through the checks its pull request will run, as you (gh, or --github) and against what is published;
        with --pr, open that pull request from your fork of github.com/motionhub-dev/motions, signed off, as the
        account gh is signed in as`;

const [command, ...args] = process.argv.slice(2);
try {
  if (command === 'check') process.exitCode = await check(args);
  else if (['search', 'get', 'init', 'share'].includes(command)) process.exitCode = await hub(command, args);
  else if (command === '--version' || command === '-v') console.log(JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version);
  else { console.log(USAGE); process.exitCode = command && command !== '--help' && command !== '-h' ? 2 : 0; }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
