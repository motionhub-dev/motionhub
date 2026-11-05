// A motion as a package: every file under its directory, in a gzipped tar with fixed owner, mode and time, so the same
// files always give the same bytes (and the same SHA-256). The hub's build publishes motions this way, and the command
// line packs a motion the same way to share it. No dependencies.

import {readdirSync} from 'node:fs';
import {join} from 'node:path';
import {gzipSync} from 'node:zlib';

/** Every file under `dir`, as paths relative to it, A to Z. */
export function files(dir, prefix = '') {
  return readdirSync(dir, {withFileTypes: true})
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
    .flatMap((e) => (e.isDirectory() ? files(join(dir, e.name), `${prefix}${e.name}/`) : [`${prefix}${e.name}`]));
}

/** A ustar header field: text or an octal number, NUL-padded to its width. */
function field(buf, at, width, value) {
  buf.write(typeof value === 'number' ? value.toString(8).padStart(width - 1, '0') : value, at, width, 'utf8');
}

/** A gzipped tar of `entries` ([path, bytes] in order), with fixed owner, mode and time so it is reproducible. */
export function tgz(entries) {
  const blocks = [];
  for (const [path, data] of entries) {
    const header = Buffer.alloc(512);
    const bytes = Buffer.byteLength(path);
    let name = path;
    let prefix = '';
    if (bytes > 100) {
      const cut = path.lastIndexOf('/', path.length - 1);
      [prefix, name] = [path.slice(0, cut), path.slice(cut + 1)];
      if (Buffer.byteLength(prefix) > 155 || Buffer.byteLength(name) > 100 || cut < 0) throw new Error(`path too long for a tar: ${path}`);
    }
    field(header, 0, 100, name);
    field(header, 100, 8, 0o644);
    field(header, 108, 8, 0);
    field(header, 116, 8, 0);
    field(header, 124, 12, data.length);
    field(header, 136, 12, 0);
    header.fill(' ', 148, 156);
    header.write('0', 156);
    header.write('ustar\u000000', 257, 8, 'latin1');
    field(header, 345, 155, prefix);
    let sum = 0;
    for (const b of header) sum += b;
    header.write(`${sum.toString(8).padStart(6, '0')}\u0000 `, 148, 8, 'latin1');
    blocks.push(header, data, Buffer.alloc((512 - (data.length % 512)) % 512));
  }
  blocks.push(Buffer.alloc(1024));
  return gzipSync(Buffer.concat(blocks), {level: 9});
}
