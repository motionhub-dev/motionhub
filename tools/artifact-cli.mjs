import {parseArgs} from 'node:util';
import {mkdir, readFile, readdir, stat, unlink, writeFile} from 'node:fs/promises';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';

const home = join(homedir(), '.motionhub');
const production = 'https://motionhub.dev';
const base = process.env.MOTIONHUB_ARTIFACT_ORIGIN || production;
const credentialPath = () => {
  const origin = new URL(base);
  if (origin.protocol !== 'https:' || origin.origin !== base) throw new Error('MOTIONHUB_ARTIFACT_ORIGIN must be an HTTPS origin.');
  return join(home, origin.origin === production ? 'artifact-token' : 'artifact-token-' + encodeURIComponent(origin.host));
};
const limit = 8 * 1024 * 1024;
const readToken = () => readFile(credentialPath(), 'utf8').catch((error) => {
  if (error.code === 'ENOENT') return '';
  throw error;
});

async function api(path, method, token, body, headers = {}) {
  credentialPath();
  if (token) headers.authorization = 'Bearer ' + token;
  const response = await fetch(base + path, {method, headers, body, redirect: 'error', signal: AbortSignal.timeout(30000)});
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error ?? `MotionHub returned HTTP ${response.status}.`), {status: response.status});
  return data;
}

async function login() {
  const device = await api('/api/cli/device', 'POST');
  console.log('Open this link in your browser, signed in to motionhub.dev, and confirm it is you:\n' + device.url);
  const end = Date.now() + 600000;
  while (Date.now() < end) {
    await delay(5000);
    const result = await api('/api/cli/token', 'POST', device.secret);
    if (result.token) {
      await mkdir(home, {recursive: true, mode: 0o700});
      await writeFile(credentialPath(), result.token, {mode: 0o600});
      return result.token;
    }
  }
  throw new Error('Device authorization expired.');
}

function crc32(bytes) {
  let crc = -1;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ -1) >>> 0;
}

export async function zipDirectory(root) {
  const files = [], central = [];
  let offset = 0, centralSize = 0;
  async function walk(relative) {
    for (const entry of await readdir(join(root, relative), {withFileTypes: true})) {
      if (!/^(?!\.{1,2}$)[a-zA-Z0-9_.-]+$/.test(entry.name)) throw new Error('Unsupported path: ' + entry.name);
      const path = relative ? relative + '/' + entry.name : entry.name;
      if (entry.isDirectory()) { await walk(path); continue; }
      if (!entry.isFile() || central.length >= 256 || path.length > 240) throw new Error('Unsupported or oversized directory.');
      const file = join(root, path);
      const name = Buffer.from(path);
      if (offset + centralSize + name.length * 2 + 98 + (await stat(file)).size > limit) throw new Error('Artifact exceeds 8 MiB.');
      const data = await readFile(file);
      const local = Buffer.alloc(30), record = Buffer.alloc(46);
      local.writeUInt32LE(0x04034b50);
      local.writeUInt16LE(20, 4);
      record.writeUInt32LE(0x02014b50);
      record.writeUInt16LE(20, 4);
      local.writeUInt16LE(name.length, 26);
      record.writeUInt16LE(name.length, 28);
      const crc = crc32(data);
      local.writeUInt32LE(crc, 14);
      record.writeUInt32LE(crc, 16);
      local.writeUInt32LE(data.length, 18);
      local.writeUInt32LE(data.length, 22);
      record.writeUInt32LE(data.length, 20);
      record.writeUInt32LE(data.length, 24);
      record.writeUInt32LE(offset, 42);
      files.push(local, name, data);
      central.push(Buffer.concat([record, name]));
      offset += local.length + name.length + data.length;
      centralSize += record.length + name.length;
    }
  }
  if (!(await stat(join(root, 'index.html')).catch(() => null))?.isFile()) throw new Error('Directory needs index.html at its root.');
  await walk('');
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(central.length, 8);
  end.writeUInt16LE(central.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...files, ...central, end]);
}

export async function artifactCli(command, args) {
  if (command === 'login' && !args.length) {
    const old = await readToken();
    const me = old && await api('/api/cli/me', 'GET', old).catch((error) => {
      if (error.status !== 401) throw error;
    });
    console.log('Signed in as @' + (me || await api('/api/cli/me', 'GET', await login())).login);
    return;
  }
  const token = await readToken();
  if (command === 'whoami' && !args.length) {
    if (!token) throw new Error('Run motionhub login first.');
    console.log('@' + (await api('/api/cli/me', 'GET', token)).login);
    return;
  }
  if (command === 'logout' && !args.length) {
    if (token) {
      await api('/api/cli/logout', 'POST', token);
      await unlink(credentialPath());
    }
    return;
  }
  const usage = 'Usage: motionhub artifact upload <index.html|site.zip|directory> [--id <artifact-id>] [--title <name>]';
  const [action, path, ...flags] = args;
  if (command !== 'artifact' || action !== 'upload' || !path) throw new Error(usage);
  let values;
  try {
    ({values} = parseArgs({args: flags, options: {
      id: {type: 'string'}, title: {type: 'string'},
    }}));
  } catch {
    throw new Error(usage);
  }
  const {id, title: suppliedTitle} = values;
  if (id !== undefined && !/^[a-f0-9-]{36}$/.test(id)) throw new Error('Invalid Artifact ID.');
  const title = suppliedTitle?.trim();
  if (title !== undefined && (!title || title.length > 100)) throw new Error('Title must contain 1 to 100 characters.');
  const info = await stat(path);
  const type = info.isDirectory() || /\.zip$/i.test(path) ? 'application/zip' : /\.html$/i.test(path) ? 'text/html' : '';
  if (!type || (!info.isFile() && !info.isDirectory()) || (info.isFile() && info.size > limit)) throw new Error('Use HTML, ZIP, or a static site directory up to 8 MiB.');
  const body = info.isDirectory() ? await zipDirectory(path) : await readFile(path);
  const endpoint = '/api/artifacts' + (id ? '/' + id : '');
  const headers = {'content-type': type};
  if (title !== undefined) headers['x-artifact-title'] = encodeURIComponent(title);
  const upload = (credential) => api(endpoint, 'POST', credential, body, {...headers});
  const result = await upload(token || await login()).catch(async (error) => {
    if (error.status !== 401 || !token) throw error;
    return upload(await login());
  });
  console.log(`Preview: ${new URL(result.preview, base)}`);
}
