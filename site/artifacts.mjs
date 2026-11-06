import {cliPerson} from './cli-auth.mjs';
import {person, sameOrigin, sha256} from './people.mjs';
import {artifactFiles, limitedBytes, MAX_UPLOAD, mime, safePath} from './artifact-files.mjs';

const idPattern = '[a-f0-9-]{36}';
const draftRoute = new RegExp(`^/artifacts/(${idPattern})$`);
const uploadRoute = new RegExp(`^/api/artifacts(?:/(${idPattern}))?$`);
const contentRoute = /^\/(preview|shared|published)\/([a-f0-9-]+)\/(.+)$/;
const privateHeaders = {'cache-control': 'private, no-store', 'referrer-policy': 'no-referrer', 'x-content-type-options': 'nosniff'};
const now = () => Math.floor(Date.now() / 1000);
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));
const reply = (message, status) => new Response(message, {status, headers: privateHeaders});
const json = (data, status = 200) => Response.json(data, {status, headers: privateHeaders});
const randomToken = () => crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
const objectKey = (version, path) => `versions/${version}/${path}`;

function contentOrigin(env, origin) {
  if (!env.ARTIFACTS || !env.ARTIFACT_CONTENT_ORIGIN) return null;
  try {
    const configured = new URL(env.ARTIFACT_CONTENT_ORIGIN);
    const site = new URL(origin);
    const pilot = configured.hostname === 'artifacts.motionhub.dev' &&
      ['motionhub.dev', 'staging.motionhub.dev'].includes(site.hostname);
    if (configured.protocol === 'https:' && configured.origin === env.ARTIFACT_CONTENT_ORIGIN &&
      configured.hostname !== site.hostname &&
      (pilot || (!configured.hostname.endsWith('.' + site.hostname) && !site.hostname.endsWith('.' + configured.hostname)))) return configured.origin;
  } catch {}
  return null;
}

async function content(request, env, url) {
  const match = contentRoute.exec(url.pathname);
  if (!match || !['GET', 'HEAD'].includes(request.method) || !env.ARTIFACTS || !env.DB) return reply('Not found', 404);
  const [, mode, token, path] = match;
  if (!safePath(path) || !mime(path)) return reply('Not found', 404);
  const grant = mode === 'published'
    ? await env.DB.prepare('SELECT public_version AS version FROM artifacts WHERE public_version = ?').bind(token).first()
    : mode === 'shared'
      ? await env.DB.prepare('SELECT version FROM artifact_shares WHERE id = ? AND expires_at > ?').bind(token, now()).first()
      : await env.DB.prepare(`SELECT g.version FROM artifact_preview_grants g
    JOIN artifact_versions v ON v.id = g.version AND v.ready = 1
    WHERE g.token_hash = ? AND g.expires_at > ?`).bind(await sha256(token), now()).first();
  if (!grant) return reply('Not found', 404);
  const object = await env.ARTIFACTS.get(objectKey(grant.version, path));
  if (!object) return reply('Not found', 404);
  const site = env.ARTIFACT_SITE_ORIGIN ?? 'https://motionhub.dev';
  // Sandboxed frames send Origin: null for modules, fonts and fetches. Do not grant
  // ordinary web origins cross-origin read access to bearer URLs.
  const cors = request.headers.get('origin') === 'null' ? {'access-control-allow-origin': 'null'} : {};
  return new Response(request.method === 'HEAD' ? null : object.body, {headers: {
    ...privateHeaders, ...cors, vary: 'Origin', 'content-type': mime(path),
    'content-security-policy': `sandbox allow-scripts; default-src 'none'; script-src 'unsafe-inline' ${url.origin}; style-src 'unsafe-inline' ${url.origin}; img-src ${url.origin} data: blob:; font-src ${url.origin} data:; connect-src ${url.origin}; frame-ancestors ${site}; base-uri 'none'; form-action 'none'`,
  }});
}

async function upload(request, env, me, artifactId) {
  const existing = artifactId && await env.DB.prepare('SELECT id FROM artifacts WHERE id = ? AND person = ?').bind(artifactId, me.id).first();
  if (artifactId && !existing) return json({error: 'Artifact not found.'}, 404);
  let files, title;
  try {
    title = decodeURIComponent(request.headers.get('x-artifact-title') ?? '').trim().slice(0, 100) || 'Untitled artifact';
    const bytes = await limitedBytes(request.body, MAX_UPLOAD);
    files = await artifactFiles(bytes, request.headers.get('content-type')?.split(';')[0].trim());
  } catch (error) {
    return json({error: error.message}, 400);
  }
  const id = artifactId ?? crypto.randomUUID();
  const version = crypto.randomUUID();
  const time = now();
  if (!existing) {
    const result = await env.DB.prepare(`INSERT INTO artifacts (id, person, title, updated_at)
      SELECT ?, ?, ?, ? WHERE (SELECT count(*) FROM artifacts WHERE person = ?) < 20`).bind(id, me.id, title, time, me.id).run();
    if (!result.meta.changes) return json({error: 'Artifact limit reached.'}, 429);
  }
  const reserved = await env.DB.prepare(`INSERT INTO artifact_versions (id, artifact, created_at)
    SELECT ?, id, ? FROM artifacts WHERE id = ? AND person = ?
    AND (SELECT count(*) FROM artifact_versions WHERE artifact = ?) < 20`).bind(version, time, id, me.id, id).run();
  if (!reserved.meta.changes) return json({error: 'Version limit reached.'}, 429);
  const keys = [];
  try {
    for (const [path, bytes] of files) {
      const key = objectKey(version, path);
      keys.push(key);
      await env.ARTIFACTS.put(key, bytes);
    }
    const results = await env.DB.batch([
      env.DB.prepare('UPDATE artifact_versions SET ready = 1 WHERE id = ?').bind(version),
      env.DB.prepare('UPDATE artifacts SET draft_version = ?, updated_at = ? WHERE id = ? AND person = ?').bind(version, time, id, me.id),
    ]);
    if (!results[1].meta.changes) throw new Error('Artifact was removed.');
  } catch (error) {
    if (keys.length) await env.ARTIFACTS.delete(keys).catch(() => {});
    await env.DB.prepare('DELETE FROM artifact_versions WHERE id = ? AND ready = 0').bind(version).run();
    if (!existing) await env.DB.prepare('DELETE FROM artifacts WHERE id = ? AND draft_version IS NULL').bind(id).run();
    throw error;
  }
  return json({id, version, preview: `/artifacts/${id}`}, 201);
}

function page(title, body, frameOrigin = "'none'", publicPage = false) {
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escape(title)} · motionhub</title>
<style>body{font:1rem system-ui;margin:2rem auto;padding:0 1rem;max-width:72rem}form{display:grid;gap:1rem;max-width:30rem}iframe{width:100%;height:75vh;border:1px solid #aaa}a{color:inherit}</style><main>${body}</main></html>`, {headers: {
    ...privateHeaders, 'content-type': 'text/html; charset=utf-8', 'x-robots-tag': publicPage ? 'index' : 'noindex',
    'content-security-policy': `default-src 'none'; style-src 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-src ${frameOrigin}; frame-ancestors 'none'; base-uri 'none'; form-action 'self'`,
  }});
}

const uploadScript = `
const form = document.querySelector('form[data-endpoint]');
const status = document.querySelector('output');
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = form.querySelector('button');
  button.disabled = true;
  status.textContent = 'Uploading…';
  try {
    const file = form.elements.bundle.files[0];
    const title = form.elements.title?.value.trim();
    const headers = {'content-type': /\\.zip$/i.test(file.name) ? 'application/zip' : 'text/html'};
    if (title) headers['x-artifact-title'] = encodeURIComponent(title);
    const response = await fetch(form.dataset.endpoint, {method: 'POST', headers, body: file});
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    location.assign(result.preview);
  } catch (error) {
    status.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});
`;
const form = (id) => `<form data-endpoint="/api/artifacts${id ? '/' + id : ''}">
${id ? '' : '<label>Title <input name="title" maxlength="100"></label>'}
<label>HTML or ZIP <input name="bundle" type="file" accept=".html,.zip" required></label>
<button>${id ? 'Upload new draft' : 'Upload artifact'}</button><output aria-live="polite"></output>
</form><script src="/artifacts/upload.js" defer></script>`;

const frame = (origin, mode, key) => `<iframe title="Artifact preview" sandbox="allow-scripts" referrerpolicy="no-referrer" src="${origin}/${mode}/${key}/index.html"></iframe>`;
const motionId = /^@[a-z0-9-]+\/[a-z0-9-]+$/;
const motionLink = (id) => `<a href="/m/${id}/">${escape(id)}</a>`;
const artifactLink = (id, title) => `<li><a href="/works/${id}">${escape(title)}</a></li>`;

async function publication(request, env, url, origin) {
  const work = /^\/works\/([a-f0-9-]{36})$/.exec(url.pathname);
  const share = /^\/artifact-share\/([a-f0-9]{64})$/.exec(url.pathname);
  const portfolio = /^\/portfolio\/([a-zA-Z0-9-]+)\/?$/.exec(url.pathname);
  if (!work && !share && !portfolio) return null;
  if (request.method !== 'GET') return reply('Method not allowed', 405);
  if (portfolio) {
    const owner = await env.DB.prepare('SELECT id, login, name FROM people WHERE lower(login) = lower(?) ORDER BY seen_at DESC LIMIT 1').bind(portfolio[1]).first();
    if (!owner) return reply('Not found', 404);
    const {results} = await env.DB.prepare('SELECT id, title FROM artifacts WHERE person = ? AND public_version IS NOT NULL ORDER BY updated_at DESC').bind(owner.id).all();
    return page(owner.name || owner.login, `<h1>${escape(owner.name || owner.login)}</h1><ul>${results.map(({id, title}) => artifactLink(id, title)).join('')}</ul>`, undefined, true);
  }
  if (share) {
    const row = await env.DB.prepare(`SELECT a.title FROM artifact_shares s JOIN artifact_versions v ON s.version = v.id
      JOIN artifacts a ON a.id = v.artifact WHERE s.id = ? AND s.expires_at > ?`).bind(share[1], now()).first();
    return row ? page(row.title, `<h1>${escape(row.title)}</h1>${frame(origin, 'shared', share[1])}`, origin) : reply('Not found', 404);
  }
  const row = await env.DB.prepare(`SELECT a.*, p.login FROM artifacts a JOIN people p ON a.person = p.id
    WHERE a.id = ? AND a.public_version IS NOT NULL`).bind(work[1]).first();
  if (!row) return reply('Not found', 404);
  const related = [row.main_motion, ...row.other_motions.split(',')].filter((id) => motionId.test(id));
  return page(row.title, `<h1>${escape(row.title)}</h1><p><a href="/portfolio/${encodeURIComponent(row.login)}">@${escape(row.login)}</a></p>
    <p>${escape(row.description)}</p>${frame(origin, 'published', row.public_version)}
    <p>${related.map(motionLink).join(' · ')}</p>`, origin, true);
}

async function manage(request, env, me, id) {
  if (!sameOrigin(request)) return reply('Invalid request origin', 403);
  const owner = await env.DB.prepare('SELECT id FROM artifacts WHERE id = ? AND person = ?').bind(id, me.id).first();
  if (!owner) return reply('Not found', 404);
  let data;
  try { data = new URLSearchParams(new TextDecoder().decode(await limitedBytes(request.body, 8192))); }
  catch { return reply('Invalid form', 400); }
  const action = data.get('action'), version = data.get('version');
  if (action === 'publish' || action === 'share') {
    const ready = await env.DB.prepare('SELECT id FROM artifact_versions WHERE id = ? AND artifact = ? AND ready = 1').bind(version, id).first();
    if (!ready) return reply('Version not found', 404);
  }
  if (action === 'publish') {
    const description = (data.get('description') ?? '').trim().slice(0, 1200);
    const main = (data.get('main_motion') ?? '').trim();
    const other = [...new Set((data.get('other_motions') ?? '').split(',').map((value) => value.trim()).filter(Boolean))];
    if ((main && !motionId.test(main)) || other.length > 8 || other.some((value) => !motionId.test(value) || value === main)) return reply('Invalid Motion IDs', 400);
    await env.DB.prepare('UPDATE artifacts SET public_version = ?, description = ?, main_motion = ?, other_motions = ? WHERE id = ? AND person = ?')
      .bind(version, description, main, other.join(','), id, me.id).run();
  } else if (action === 'unpublish') {
    await env.DB.prepare('UPDATE artifacts SET public_version = NULL WHERE id = ? AND person = ?').bind(id, me.id).run();
  } else if (action === 'delete-version') {
    const deleted = await env.DB.prepare(`DELETE FROM artifact_versions
      WHERE id = ? AND artifact = ? AND ready = 1
      AND NOT EXISTS (SELECT 1 FROM artifacts WHERE id = ? AND (draft_version = ? OR public_version = ?))
      AND NOT EXISTS (SELECT 1 FROM artifact_shares WHERE version = ? AND expires_at > ?)`)
      .bind(version, id, id, version, version, version, now()).run();
    if (!deleted.meta.changes) return reply('Only versions that are neither current, published, nor shared can be deleted.', 409);
  } else if (action === 'share') {
    await env.DB.prepare('INSERT INTO artifact_shares (id, version, expires_at) VALUES (?, ?, ?)').bind(randomToken(), version, now() + 7 * 86400).run();
  } else if (action === 'revoke') {
    await env.DB.prepare('DELETE FROM artifact_shares WHERE id = ? AND version IN (SELECT id FROM artifact_versions WHERE artifact = ?)')
      .bind(data.get('share'), id).run();
  } else return reply('Unknown action', 400);
  return Response.redirect(new URL('/artifacts/' + id, request.url), 303);
}

async function publicationControls(env, id, row) {
  const {results: versions} = await env.DB.prepare('SELECT id, created_at FROM artifact_versions WHERE artifact = ? AND ready = 1 ORDER BY created_at DESC, id').bind(id).all();
  const {results: shares} = await env.DB.prepare('SELECT s.id, s.version FROM artifact_shares s JOIN artifact_versions v ON v.id = s.version WHERE v.artifact = ? AND s.expires_at > ?').bind(id, now()).all();
  const options = versions.map(({id: version, created_at}) => `<option value="${version}"${version === row.draft_version ? ' selected' : ''}>${new Date(created_at * 1000).toISOString()} · ${version.slice(0, 8)}</option>`).join('');
  const removable = versions.filter(({id: version}) =>
    version !== row.draft_version && version !== row.public_version && !shares.some((share) => share.version === version));
  return `<h2>Publish or share a version</h2>
  ${row.public_version ? `<p><a href="/works/${id}">Public work</a></p><form method="post"><button name="action" value="unpublish">Unpublish</button></form>` : ''}
  <form method="post"><label>Version <select name="version">${options}</select></label>
  <label>Description <textarea name="description" maxlength="1200">${escape(row.description)}</textarea></label>
  <label>Main Motion <input name="main_motion" value="${escape(row.main_motion)}" placeholder="@author/slug"></label>
  <label>Supporting Motions <input name="other_motions" value="${escape(row.other_motions)}" placeholder="Comma-separated IDs"></label>
  <button name="action" value="publish">Publish selected version</button><button name="action" value="share">Create 7-day share link</button></form>
  ${removable.length ? `<h2>Delete an old version</h2><form method="post">
  <label>Version <select name="version">${removable.map(({id: version, created_at}) => `<option value="${version}">${new Date(created_at * 1000).toISOString()} · ${version.slice(0, 8)}</option>`).join('')}</select></label>
  <button name="action" value="delete-version">Delete selected version</button></form>` : ''}
  ${shares.map(({id: share}) => `<form method="post"><a href="/artifact-share/${share}">Share link …${share.slice(-8)}</a><input type="hidden" name="share" value="${share}"><button name="action" value="revoke">Revoke link</button></form>`).join('')}`;
}

export async function artifacts(request, env) {
  const url = new URL(request.url);
  if (url.origin === env.ARTIFACT_CONTENT_ORIGIN) {
    if (url.origin === (env.ARTIFACT_SITE_ORIGIN ?? 'https://motionhub.dev')) return reply('Not found', 404);
    return content(request, env, url);
  }
  const draft = draftRoute.exec(url.pathname);
  const api = uploadRoute.exec(url.pathname);
  const list = url.pathname === '/artifacts' || url.pathname === '/artifacts/';
  const publicRoute = /^\/(works|artifact-share|portfolio)\//.test(url.pathname);
  if (!list && !draft && !api && !publicRoute && url.pathname !== '/artifacts/upload.js') return null;
  const origin = contentOrigin(env, url.origin);
  if (!origin || !env.DB || url.origin !== (env.ARTIFACT_SITE_ORIGIN ?? 'https://motionhub.dev')) return reply('Not found', 404);
  if (publicRoute) return await publication(request, env, url, origin) ?? reply('Not found', 404);
  if (url.pathname === '/artifacts/upload.js' && request.method === 'GET') return new Response(uploadScript, {
    headers: {...privateHeaders, 'content-type': 'text/javascript; charset=utf-8'},
  });
  if (request.method !== (api ? 'POST' : 'GET') && !(draft && request.method === 'POST')) return reply('Method not allowed', 405);
  const cli = api && request.headers.has('authorization');
  if (api && !cli && !sameOrigin(request)) return json({error: 'Invalid request origin.'}, 403);
  const me = await (cli ? cliPerson(request, env) : person(request, env));
  if (!me) return api ? json({error: 'Sign in to upload.'}, 401) :
    page('Artifacts', `<h1>Artifacts</h1><a href="/auth/login?next=${encodeURIComponent(url.pathname)}">Sign in with GitHub</a>`);
  if (draft && request.method === 'POST') return manage(request, env, me, draft[1]);
  if (api) return upload(request, env, me, api[1]).catch(() => json({error: 'Upload failed. Try again.'}, 500));
  if (list) {
    const {results} = await env.DB.prepare('SELECT id, title FROM artifacts WHERE person = ? AND draft_version IS NOT NULL ORDER BY updated_at DESC').bind(me.id).all();
    return page('Artifacts', `<h1>Artifacts</h1>${form()}<h2>Your drafts</h2><ul>${results.map(({id, title}) => `<li><a href="/artifacts/${id}">${escape(title)}</a></li>`).join('')}</ul>`);
  }
  const row = await env.DB.prepare('SELECT title, draft_version, public_version, description, main_motion, other_motions FROM artifacts WHERE id = ? AND person = ?').bind(draft[1], me.id).first();
  if (!row?.draft_version) return reply('Not found', 404);
  const token = randomToken();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM artifact_preview_grants WHERE expires_at <= ?').bind(now()),
    env.DB.prepare('INSERT INTO artifact_preview_grants (token_hash, version, expires_at) VALUES (?, ?, ?)').bind(await sha256(token), row.draft_version, now() + 900),
  ]);
  return page(row.title, `<p><a href="/artifacts/">All artifacts</a></p><h1>${escape(row.title)}</h1>
${frame(origin, 'preview', token)}${form(draft[1])}${await publicationControls(env, draft[1], row)}`, origin);
}

/** Pending uploads and account removals leave a durable deletion record before any R2 cleanup. */
export async function sweepArtifacts(env) {
  if (!env.DB || !env.ARTIFACTS || !env.ARTIFACT_CONTENT_ORIGIN) return;
  const at = now();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM artifact_shares WHERE expires_at <= ?').bind(at),
    env.DB.prepare('DELETE FROM cli_devices WHERE expires_at <= ?').bind(at),
    env.DB.prepare('DELETE FROM artifact_preview_grants WHERE expires_at <= ?').bind(at),
    env.DB.prepare('DELETE FROM artifact_versions WHERE ready = 0 AND created_at <= ?').bind(at - 3600),
    env.DB.prepare('DELETE FROM artifacts WHERE draft_version IS NULL AND updated_at <= ?').bind(at - 3600),
  ]);
  const {results} = await env.DB.prepare('SELECT version FROM artifact_storage_deletions LIMIT 100').all();
  for (const {version} of results) {
    const listed = await env.ARTIFACTS.list({prefix: `versions/${version}/`, limit: 256});
    if (listed.objects.length) await env.ARTIFACTS.delete(listed.objects.map(({key}) => key));
    if (!listed.truncated) await env.DB.prepare('DELETE FROM artifact_storage_deletions WHERE version = ?').bind(version).run();
  }
}
