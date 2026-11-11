// Trusted main-branch release tooling for the site: an artifact's manifest is the public repository's (tools/release.mjs);
// this adds the site's artifact layout and publishing packages and videos to R2. Artifacts are data: never import or
// execute anything inside them.
import {createHash} from 'node:crypto';
import {cpSync, mkdirSync, readFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createManifest, fail, hash, verifyManifest} from '../../tools/release.mjs';

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
