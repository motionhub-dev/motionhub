// Private motions from the command line: a motion of your own, kept on motionhub.dev for you alone, signed in with
// `motionhub login` (tools/artifact-cli.mjs). A private motion is a motion in this format like any other, checked here
// against the format (tools/check.mjs, not the hub's rules: it is published nowhere) and on motionhub.dev against the
// package rules a share meets; its scope and its one author are your own login. Nothing of it is in git, in the index
// or on a page, and only your account can list, download or delete it. To publish one, share it (motionhub share).
//
//   motionhub private push <dir>                  check, pack and keep a version (a version, once kept, never changes)
//   motionhub private list                        your private motions, each version, newest first
//   motionhub private delete <id>[@<version>]     one version, or every version of a motion
//   motionhub get <id> --private [--out <dir>]    your newest version into ./motions/<id>/ (tools/hub.mjs), recorded in
//                                                 ./motions.lock.json as private, so `motionhub get` takes it back signed in
//
// The service is motionhub.dev's /api/private/ (motionhub-dev/motionhub-web, site/private-motions.mjs).

import {existsSync, readFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {api, asSignedIn, bytesAt, origin} from './artifact-cli.mjs';
import {ID, checkMotion, motionId} from './check.mjs';
import {files as filesOf, tgz} from './pack.mjs';

const USAGE = 'usage: motionhub private push <dir> | motionhub private list | motionhub private delete <id>[@<version>]';
/** The most a motion packs to, poster included: motionhub.dev refuses more (site/tar.mjs LIMITS.packed). */
const MOST = 1024 * 1024;

/** A motion's directory checked against the format and packed under its id: {id, version, bytes, files}. */
export function packPrivate(dir) {
  if (!existsSync(join(dir, 'motion.json'))) throw new Error(`${dir} has no motion.json: push a motion's directory (motionhub init <slug> makes one)`);
  const manifest = JSON.parse(readFileSync(join(dir, 'motion.json'), 'utf8'));
  const id = motionId(manifest);
  if (!id?.startsWith('@')) throw new Error(`${dir}: a private motion has a scope, your GitHub login: set "scope" in motion.json`);
  const issues = checkMotion(dir, {hub: false});
  if (issues.length) throw new Error(`${dir} is not a motion in the format yet:\n${issues.map((i) => `${i.at}  ${i.code}  ${i.message}`).join('\n')}`);
  const files = filesOf(dir);
  const bytes = tgz(files.map((n) => [`${id}/${n}`, readFileSync(join(dir, n))]));
  if (bytes.length > MOST) throw new Error(`${id} packs to ${bytes.length} bytes: a motion is at most 1 MB, its poster included`);
  return {id, version: manifest.version, bytes, files};
}

/** Your private motions, as rows shaped like the index's ({slug, version, package: {url, sha256}, versions}). */
export const privateIndex = async () => (await asSignedIn((token) => api('/api/private/motions.json', 'GET', token))).motions;

/** The package of a private row (or {slug, version, package: {url}}), downloaded signed in: its bytes, unchecked. */
export const privatePackage = (row) => asSignedIn((token) => bytesAt(row.package.url, token));

/** `<id>` or `<id>@<version>`, split: the version is what follows the last @ after the scope's. */
function target(text) {
  const at = text.lastIndexOf('@');
  const [id, version] = at > 0 ? [text.slice(0, at), text.slice(at + 1)] : [text, undefined];
  if (!ID.test(id) || !id.startsWith('@') || (version !== undefined && !/^[0-9A-Za-z.+-]+$/.test(version))) throw new Error(`"${text}" is not <id> or <id>@<version>: ${USAGE}`);
  return {id, version};
}

/** The command line for `motionhub private`: `args` after its name. Returns the exit status. */
export async function privateCli(args) {
  const [action, what, ...rest] = args;
  if (action === 'push' && what && !rest.length) {
    const {id, version, bytes, files} = packPrivate(resolve(what));
    const kept = await asSignedIn((token) => api('/api/private/motions', 'POST', token, bytes, {'content-type': 'application/gzip', 'user-agent': 'motionhub-cli'}));
    console.log(kept.kept
      ? `${id} ${version} is kept privately already, these same files. To keep a change, raise version in motion.json.`
      : `${id} ${version} kept privately on ${origin}, for you alone (${files.length} files, ${bytes.length} bytes). Take it into a project with: motionhub get ${id} --private`);
    return 0;
  }
  if (action === 'list' && !what) {
    const rows = await privateIndex();
    for (const m of rows) console.log(`${m.slug}  ${m.version}${m.versions.length > 1 ? `  (also ${m.versions.slice(1).map((v) => v.version).join(', ')})` : ''}`);
    console.log(rows.length ? `${rows.length} private motion(s); take one with: motionhub get <id> --private` : 'No private motions yet: keep one with motionhub private push <dir>');
    return 0;
  }
  if (action === 'delete' && what && !rest.length) {
    const {id, version} = target(what);
    const path = `/api/private/motions/${id}${version ? `/${version}` : ''}`;
    const {deleted} = await asSignedIn((token) => api(path, 'DELETE', token)).catch((error) => {
      throw error.status === 404 ? new Error(`you keep no ${id}${version ? ` ${version}` : ''} privately: motionhub private list`) : error;
    });
    console.log(`${id}${version ? ` ${version}` : ''}: ${deleted} version(s) deleted from ${origin}. A copy already taken into a project stays there.`);
    return 0;
  }
  console.error(USAGE);
  return 2;
}
