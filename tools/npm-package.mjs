// Packs the npm package a release tag names (v<version>: @motionhub/cli; <package>-v<version>: packages/<package>) into a
// directory with its manifest (tools/release.mjs), for .github/workflows/publish.yaml. Packing runs without OIDC
// permission. The staging runner only reads the resulting tarball.
//
//   node tools/npm-package.mjs <dir>   from the repository's root, with GITHUB_REF_NAME, GITHUB_SHA and GITHUB_RUN_ID
import {execFileSync} from 'node:child_process';
import {readFileSync, mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {createManifest} from './release.mjs';
const [destination] = process.argv.slice(2);
const tag = process.env.GITHUB_REF_NAME;
const match = /^(?:(runtime|remotion|hyperframes)-)?v(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/.exec(tag ?? '');
if (!match) throw new Error('Unrecognized release tag.');
const dir = match[1] ? `packages/${match[1]}` : '.';
if (JSON.parse(readFileSync(`${dir}/package.json`)).version !== match[2]) throw new Error('The release tag does not match the package version.');
const out = resolve(destination);
mkdirSync(out, {recursive: true});
execFileSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', out], {cwd: resolve(dir), stdio: 'pipe'});
createManifest(out, 'npm', process.env.GITHUB_SHA, process.env.GITHUB_RUN_ID);
