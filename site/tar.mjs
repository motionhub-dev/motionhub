// A motion package read in the Worker, strictly: a gzipped ustar archive of regular files under one motion's id, as
// tools/pack.mjs writes it. Anything else (a link, a device, a directory entry with contents, an extended header, a
// path that climbs out or is absolute, a name twice, more than the limits) is refused before any of it is kept.
// No dependencies: DecompressionStream, as in every Worker and in Node.

export const LIMITS = {packed: 1024 * 1024, unpacked: 2 * 1024 * 1024, files: 300};

/** A segment of a path in a package: letters, digits, @ . _ - (not only dots). */
const SEGMENT = /^(?!\.+$)[A-Za-z0-9@._-]{1,100}$/;

export class PackageError extends Error {}
const refuse = (message) => { throw new PackageError(message); };

/** The bytes of a gzip stream, refused past `most`. */
async function gunzip(bytes, most) {
  const reader = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')).getReader();
  const chunks = [];
  let total = 0;
  try {
    for (;;) {
      const {done, value} = await reader.read();
      if (done) break;
      total += value.length;
      if (total > most) { await reader.cancel(); refuse(`the package unpacks to more than ${most} bytes`); }
      chunks.push(value);
    }
  } catch (e) {
    if (e instanceof PackageError) throw e;
    refuse('the package is not a gzip stream');
  }
  const out = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) { out.set(c, at); at += c.length; }
  return out;
}

const text = (block, from, width) => {
  const raw = block.subarray(from, from + width);
  const end = raw.indexOf(0);
  return new TextDecoder().decode(end < 0 ? raw : raw.subarray(0, end));
};
const octal = (block, from, width) => {
  const s = text(block, from, width).trim();
  if (!/^[0-7]+$/.test(s)) refuse('a tar header has a number that is not octal');
  return parseInt(s, 8);
};

/**
 * The files of a gzipped tar, as [{path, data}] in the archive's order. Only regular files with safe relative paths;
 * `limits` caps the packed size, the unpacked size and the number of files.
 */
export async function untgz(bytes, limits = LIMITS) {
  if (bytes.byteLength > limits.packed) refuse(`the package is larger than ${limits.packed} bytes`);
  const tar = await gunzip(bytes, limits.unpacked + 1024 * 1024);
  const out = [], seen = new Set();
  let size = 0;
  for (let at = 0; at + 512 <= tar.length;) {
    const header = tar.subarray(at, at + 512);
    if (header.every((b) => b === 0)) break;
    let sum = 0;
    for (let i = 0; i < 512; i++) sum += i >= 148 && i < 156 ? 32 : header[i];
    if (sum !== octal(header, 148, 8)) refuse('a tar header fails its checksum');
    const type = String.fromCharCode(header[156] || 48);
    if (type !== '0') refuse('a package holds regular files only: no links, directories or extended headers');
    const name = text(header, 0, 100), prefix = text(header, 345, 155);
    const path = prefix ? `${prefix}/${name}` : name;
    const length = octal(header, 124, 12);
    if (!path.split('/').every((s) => SEGMENT.test(s))) refuse(`a path in the package is not allowed: ${JSON.stringify(path.slice(0, 120))}`);
    if (seen.has(path)) refuse(`the package holds ${path} twice`);
    seen.add(path);
    size += length;
    if (size > limits.unpacked) refuse(`the package unpacks to more than ${limits.unpacked} bytes`);
    if (out.length >= limits.files) refuse(`the package holds more than ${limits.files} files`);
    const start = at + 512;
    if (start + length > tar.length) refuse('the package ends in the middle of a file');
    out.push({path, data: tar.slice(start, start + length)});
    at = start + Math.ceil(length / 512) * 512;
  }
  if (!out.length) refuse('the package is empty');
  return out;
}
