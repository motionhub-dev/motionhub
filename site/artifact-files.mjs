// A static site bundle. ZIP metadata is untrusted, so bound both its input and actual inflated output.
export const MAX_UPLOAD = 8 * 1024 * 1024;
const MAX_OUTPUT = 24 * 1024 * 1024;
const MAX_FILES = 256;
const MIME = {
  html: 'text/html; charset=utf-8', css: 'text/css; charset=utf-8', js: 'text/javascript; charset=utf-8',
  mjs: 'text/javascript; charset=utf-8', json: 'application/json', png: 'image/png', jpg: 'image/jpeg',
  jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml', ico: 'image/x-icon',
  woff: 'font/woff', woff2: 'font/woff2', avif: 'image/avif', txt: 'text/plain; charset=utf-8',
};
export const mime = (path) => Object.hasOwn(MIME, path.split('.').at(-1).toLowerCase()) ? MIME[path.split('.').at(-1).toLowerCase()] : null;
export const safePath = (path) => path.length <= 240 && path.split('/').every((part) => /^(?!\.{1,2}$)[a-zA-Z0-9_.-]+$/.test(part));

export async function limitedBytes(stream, limit) {
  if (!stream) return new Uint8Array();
  const reader = stream.getReader();
  const parts = [];
  let size = 0;
  try {
    for (;;) {
      const {value, done} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) throw new Error('File exceeds its size limit.');
      parts.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.byteLength;
  }
  return bytes;
}

export async function artifactFiles(bytes, type) {
  if (!bytes.length || bytes.length > MAX_UPLOAD) throw new Error('Upload an HTML file or ZIP up to 8 MiB.');
  if (type === 'text/html') return new Map([['index.html', bytes]]);
  if (type !== 'application/zip') throw new Error('Upload HTML or ZIP.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const u16 = (at) => view.getUint16(at, true);
  const u32 = (at) => view.getUint32(at, true);
  const invalid = () => { throw new Error('Invalid or unsupported ZIP.'); };
  let end = bytes.length - 22;
  while (end >= Math.max(0, bytes.length - 65557) &&
    (u32(end) !== 0x06054b50 || end + 22 + u16(end + 20) !== bytes.length)) end--;
  if (end < Math.max(0, bytes.length - 65557)) invalid();
  const count = u16(end + 10);
  const start = u32(end + 16);
  if (u16(end + 4) || u16(end + 6) || u16(end + 8) !== count || count > MAX_FILES || start + u32(end + 12) !== end) invalid();
  const files = new Map();
  const names = new Set();
  let at = start, total = 0;
  for (let index = 0; index < count; index++) {
    if (at + 46 > end || u32(at) !== 0x02014b50) invalid();
    const flags = u16(at + 8), method = u16(at + 10), packed = u32(at + 20), size = u32(at + 24);
    const nameSize = u16(at + 28), local = u32(at + 42);
    const next = at + 46 + nameSize + u16(at + 30) + u16(at + 32);
    if (next > end || u16(at + 34) || (flags & ~0x080e) || ![0, 8].includes(method) ||
      ((u32(at + 38) >>> 16) & 0xf000) === 0xa000) invalid();
    const rawName = bytes.subarray(at + 46, at + 46 + nameSize);
    const name = new TextDecoder('utf-8', {fatal: true}).decode(rawName);
    at = next;
    const directory = name.endsWith('/');
    const path = directory ? name.slice(0, -1) : name;
    if (!safePath(path) || names.has(path.toLowerCase())) invalid();
    names.add(path.toLowerCase());
    if (directory) continue;
    if (!mime(path) || size > MAX_UPLOAD || (total += size) > MAX_OUTPUT) invalid();
    if (local + 30 > start || u32(local) !== 0x04034b50 || u16(local + 8) !== method ||
      u16(local + 6) !== flags || u16(local + 26) !== nameSize ||
      !rawName.every((byte, i) => bytes[local + 30 + i] === byte)) invalid();
    const data = local + 30 + nameSize + u16(local + 28);
    if (data + packed > start) invalid();
    const payload = bytes.subarray(data, data + packed);
    const result = method === 0 ? payload : await limitedBytes(
      new Blob([payload]).stream().pipeThrough(new DecompressionStream('deflate-raw')), size);
    if (result.length !== size) invalid();
    files.set(path, result);
  }
  if (at !== end || !files.has('index.html')) throw new Error('The ZIP must contain index.html at its root.');
  return files;
}
