// Byte-level checks shared by the zero-dependency CLI and Worker. Never include a matching value in diagnostics.
const PRIVATE = /-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----/;
const TOKEN = /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|sk-ant-(?:api\d+|oat\d+)-[A-Za-z0-9_-]{30,}|AKIA[0-9A-Z]{16})\b/;
const CREDENTIAL = /^(?:\.env(?:\..*)?|\.npmrc|\.pypirc|\.netrc|credentials(?:\.json)?|id_(?:rsa|dsa|ecdsa|ed25519)(?:\.pub)?|.*\.(?:key|p12|pfx))$/i;
const FORBIDDEN = new Set(['.git', '.aws', '.ssh', '.wrangler', 'node_modules', 'dist', 'build', 'out', '.next']);

export function sensitivePath(path) {
  return path.split('/').some((part) => CREDENTIAL.test(part) || FORBIDDEN.has(part.toLowerCase()));
}

export function sensitiveFile(path, data) {
  if (sensitivePath(path)) return {code: 'hub.secret', at: path, message: 'credential files, private keys, dependencies and build output cannot be shared'};
  let text;
  try { text = new TextDecoder('utf-8', {fatal: true}).decode(data); } catch { return null; }
  if (PRIVATE.test(text) || TOKEN.test(text)) return {code: 'hub.secret', at: path, message: 'contains a private key or credential; remove it and rotate any exposed credential before sharing'};
  return null;
}
