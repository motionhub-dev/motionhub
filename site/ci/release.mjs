// Trusted main-branch release tooling. Artifacts are data: never import or execute anything inside them.
import {createHash} from 'node:crypto';
import {cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const safe = (path) => /^[A-Za-z0-9@._%+/-]+$/.test(path) && !path.startsWith('/') && path.split('/').every(p => p && p !== '.' && p !== '..');
const fail = (message) => { throw new Error(message); };

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

/** Only a real 404 permits creation, and conditional PUT prevents races from overwriting an existing version. */
export async function publishObject(client, url, bytes, type, {keepExisting = false} = {}) {
  const digest = hash(bytes);
  const check = async () => {
    const response = await client.fetch(url, {method: 'GET', redirect: 'error'});
    if (response.status === 404) return false;
    if (response.status !== 200) fail('R2 could not confirm the published object');
    if (keepExisting) { await response.body?.cancel(); return true; }
    const h = createHash('sha256');
    for await (const chunk of response.body) h.update(chunk);
    if (h.digest('hex') !== digest) fail('published version has different bytes; increase its version');
    return true;
  };
  if (await check()) return 'kept';
  const response = await client.fetch(url, {method: 'PUT', body: bytes, redirect: 'error', headers: {
    'content-type': type, 'if-none-match': '*', 'x-amz-content-sha256': digest, 'x-amz-meta-sha256': digest,
  }});
  if (response.status === 412) {
    if (!(await check())) fail('a concurrent publication could not be reconciled');
    return 'kept';
  }
  if (!response.ok) fail('R2 refused the conditional publication');
  return 'published';
}

async function main() {
  const [command, rootArg, kind] = process.argv.slice(2);
  const root = resolve(rootArg ?? 'release');
  const sha = process.env.SOURCE_SHA ?? process.env.GITHUB_SHA;
  const run = process.env.GITHUB_RUN_ID;
  if (command === 'create') {
    if (kind === 'site') {
      mkdirSync(root, {recursive: true});
      cpSync('dist', join(root, 'assets'), {recursive: true});
      mkdirSync(join(root, 'player-assets'), {recursive: true});
      cpSync('dist/play', join(root, 'player-assets/play'), {recursive: true});
      cpSync('dist/_headers', join(root, 'player-assets/_headers'));
    }
    createManifest(root, kind, sha, run);
    return;
  }
  const manifest = verifyManifest(root, kind, sha, run);
  if (command === 'verify') return;
  if (command !== 'publish') fail('unknown release command');
  const {AwsClient} = await import('aws4fetch');
  const {R2_ACCESS_KEY_ID: accessKeyId, R2_SECRET_ACCESS_KEY: secretAccessKey, CLOUDFLARE_ACCOUNT_ID: account} = process.env;
  if (!accessKeyId || !secretAccessKey || !/^[a-f0-9]{32}$/.test(account ?? '')) fail('missing bucket-scoped release credentials');
  const client = new AwsClient({accessKeyId, secretAccessKey, service: 's3', region: 'auto'});
  const pattern = kind === 'video' ? /^m\/@[a-z0-9-]+\/[a-z0-9-]+\/[0-9A-Za-z.+-]+\.mp4$/ : /^assets\/m\/@[a-z0-9-]+\/[a-z0-9-]+\/[0-9A-Za-z.+-]+\.tgz$/;
  for (const file of manifest.files.filter(f => pattern.test(f.path))) {
    const key = file.path.replace(/^assets\//, '');
    const url = `https://${account}.r2.cloudflarestorage.com/motionhub/${key.split('/').map(encodeURIComponent).join('/')}`;
    const result = await publishObject(client, url, readFileSync(join(root, file.path)), kind === 'video' ? 'video/mp4' : 'application/gzip', {keepExisting: kind === 'video'});
    console.log(`${result} ${key}`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(() => { console.error('Release failed: invalid artifact, missing credentials, conflicting version or storage error.'); process.exitCode = 1; });
