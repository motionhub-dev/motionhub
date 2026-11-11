// Trusted main-branch release tooling, with no dependencies: what a release artifact holds, recorded in its manifest.json
// with the commit and run that made it, and checked again on the runner that publishes it. Artifacts are data: never
// import or execute anything inside them. The npm packages are staged with it here (tools/npm-package.mjs,
// .github/workflows/publish.yaml); the site's deploy adds its own publishing to storage on top of it (site/ci/release.mjs).
//
//   node tools/release.mjs create <dir> <kind>   writes <dir>/manifest.json (kind: npm, site or video)
//   node tools/release.mjs verify <dir> <kind>   fails unless <dir> is exactly what its manifest records
// The commit is SOURCE_SHA, else GITHUB_SHA; the run is GITHUB_RUN_ID.
import {createHash} from 'node:crypto';
import {existsSync, lstatSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const safe = (path) => /^[A-Za-z0-9@._%+/-]+$/.test(path) && !path.startsWith('/') && path.split('/').every(p => p && p !== '.' && p !== '..');
export const fail = (message) => { throw new Error(message); };

export function inventory(root, prefix = '') {
  const files = [];
  for (const name of readdirSync(join(root, prefix)).sort()) {
    const path = prefix + name;
    if (!safe(path)) fail('unsafe artifact path');
    const stat = lstatSync(join(root, path));
    if (stat.isSymbolicLink()) fail('artifact contains a symbolic link');
    if (stat.isDirectory()) files.push(...inventory(root, path + '/'));
    else if (!stat.isFile()) fail('artifact contains a special file');
    else if (path !== 'manifest.json') {
      if (stat.size > 512 * 1024 * 1024) fail('artifact file is too large');
      files.push({path, bytes: stat.size, sha256: hash(readFileSync(join(root, path)))});
    }
  }
  return files;
}

export function createManifest(root, kind, sourceSha, runId) {
  if (!['site', 'video', 'npm'].includes(kind) || !/^[a-f0-9]{40}$/.test(sourceSha) || !/^\d+$/.test(String(runId))) fail('invalid release provenance');
  const files = inventory(root);
  if (!files.length) fail('empty release');
  const manifest = {schema: 1, kind, sourceSha, runId: String(runId), files};
  writeFileSync(join(root, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

export function verifyManifest(root, kind, sourceSha, runId) {
  if (lstatSync(join(root, 'manifest.json')).isSymbolicLink()) fail('manifest is a symbolic link');
  const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));
  if (manifest.schema !== 1 || manifest.kind !== kind || manifest.sourceSha !== sourceSha || manifest.runId !== String(runId)) fail('release provenance mismatch');
  if (JSON.stringify(manifest.files) !== JSON.stringify(inventory(root))) fail('release bytes or file list changed');
  if (kind === 'npm' && (manifest.files.length !== 1 || !/^[a-z0-9.-]+\.tgz$/.test(manifest.files[0].path))) fail('invalid npm release');
  if (kind === 'video' && (!manifest.files.length || manifest.files.some(f => !/^m\/@[a-z0-9-]+\/[a-z0-9-]+\/[0-9A-Za-z.+-]+\.mp4$/.test(f.path)))) fail('invalid video release');
  if (kind === 'site' && (!existsSync(join(root, 'player-assets/_headers')) || !manifest.files.some(f => /^player-assets\/play\/.+\/index\.html$/.test(f.path)) || !existsSync(join(root, 'assets/index.html')) || !manifest.files.some(f => /^worker\/worker\.(mjs|js)$/.test(f.path)))) fail('incomplete site release');
  return manifest;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [command, dir, kind] = process.argv.slice(2);
    const root = resolve(dir ?? 'release'), sha = process.env.SOURCE_SHA ?? process.env.GITHUB_SHA, run = process.env.GITHUB_RUN_ID;
    if (command === 'create') createManifest(root, kind, sha, run);
    else if (command === 'verify') verifyManifest(root, kind, sha, run);
    else fail('unknown release command');
  } catch {
    console.error('Release failed: invalid artifact or provenance.');
    process.exitCode = 1;
  }
}
