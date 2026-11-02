#!/usr/bin/env node
// The motionhub command, published as @motionhub/cli. Its one command checks motions against the format and the hub's
// rules (tools/check.mjs), the same checks a pull request runs.
//
//   motionhub check [dir ...] [--format-only] [--author <github-login>] [--was <motion.json>]

import {readFileSync} from 'node:fs';
import {main} from '../tools/check.mjs';

const [command, ...args] = process.argv.slice(2);
if (command === 'check') process.exitCode = main(args);
else if (command === '--version' || command === '-v') console.log(JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version);
else {
  console.log('usage: motionhub check [dir ...] [--format-only] [--author <github-login>] [--was <motion.json>]\n\nChecks motions against the motion format (https://github.com/motionhub-dev/motions/blob/main/SPEC.md) and motionhub\'s rules.\nWith no directory: the current directory when it is a motion, else every motion under ./motions/.');
  process.exitCode = command && command !== '--help' && command !== '-h' ? 2 : 0;
}
