// Which of check.yml's slower steps a pull request needs, from the files it changes. The job always runs, and its fast
// steps always do (the tests, the checker over every motion, the hub's build): `check` is a required status
// (.github/rulesets/main.json), and a workflow skipped by its paths would leave it waiting forever. What is skipped is
// what the changed files cannot reach. Anything not named as safe to skip runs, and a push to main runs everything.
//
//   node .github/scripts/changed.mjs <base> <head>   writes runtime=, remotion= and players= (true or false) to
//                                                    $GITHUB_OUTPUT, or prints them; with no commits, all true
import {execFileSync} from 'node:child_process';
import {appendFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

/** check.yml itself, the actions it uses and this plan: a change to them runs every step, so it is seen to work. */
const WORKFLOW = /^\.github\/(workflows\/check\.yml$|actions\/|scripts\/changed\.mjs$)/;

/**
 * What the reels' players (player/build.mjs, then every reel played in Chrome) cannot be broken by: documents, the
 * command line, the engine bindings, records the build does not draw, other workflows. A motion, the runtime, the
 * player, the hub's build, its served files' policy (tools/site.mjs) and the checker the player lists motions with are
 * not here, so a change to any of them plays every reel.
 */
const PLAYERS_UNREACHED = [
  /^[^/]+\.md$/, /^(LICENSE|\.gitignore|\.gitleaksignore|package\.json)$/,
  /^docs\//, /^accounts\//, /^catalogs\.json$/, /^skills\//, /^bin\//, /^tests\//, /^brand\//,
  /^tools\/(hub|pack|artifact-cli|private-cli|npm-package|release|docs|brand)\.mjs$/,
  /^packages\/(remotion|hyperframes)\//,
  /^\.github\/(?!workflows\/check\.yml$|actions\/|scripts\/changed\.mjs$)/,
];

/** What a pull request changing `files` needs: {runtime, remotion, players}, each true or false. */
export function plan(files) {
  // nothing known to have changed is never taken for nothing having changed
  if (!files.length) return {runtime: true, remotion: true, players: true};
  const any = (re) => files.some((f) => re.test(f));
  const workflow = any(WORKFLOW);
  return {
    runtime: workflow || any(/^packages\/runtime\//),
    // the binding is tested against the runtime it is copied together with
    remotion: workflow || any(/^packages\/(runtime|remotion)\//),
    players: workflow || files.some((f) => !PLAYERS_UNREACHED.some((re) => re.test(f))),
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [base, head] = process.argv.slice(2);
  let files = [];
  const commit = /^[0-9a-f]{40}$/;
  if (commit.test(base ?? '') && commit.test(head ?? '')) {
    try {
      files = execFileSync('git', ['diff', '--name-only', '--no-renames', `${base}...${head}`], {encoding: 'utf8'}).split('\n').filter(Boolean);
    } catch { files = []; }
  }
  const lines = Object.entries(plan(files)).map(([k, v]) => `${k}=${v}`);
  console.log(`${files.length} file(s) changed: ${lines.join(' ')}`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, lines.join('\n') + '\n');
}
