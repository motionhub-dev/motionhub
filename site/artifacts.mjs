import {cliPerson} from './cli-auth.mjs';
import {person, sameOrigin, sha256} from './people.mjs';
import {shellPage} from './shell.mjs';
import {artifactFiles, limitedBytes, MAX_UPLOAD, mime, safePath} from './artifact-files.mjs';

const idPattern = '[a-f0-9-]{36}';
const previewRoute = new RegExp(`^/artifact/(${idPattern})/preview/?$`);
const draftRoute = new RegExp(`^/artifacts/(${idPattern})$`);
const uploadRoute = new RegExp(`^/api/artifacts(?:/(${idPattern}))?$`);
const contentRoute = /^\/(preview|shared|published)\/([a-f0-9-]+)\/(.+)$/;
const privateHeaders = {'cache-control': 'private, no-store', 'referrer-policy': 'no-referrer', 'x-content-type-options': 'nosniff'};
const now = () => Math.floor(Date.now() / 1000);
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));
const reply = (message, status) => new Response(message, {status, headers: privateHeaders});
const json = (data, status = 200) => Response.json(data, {status, headers: privateHeaders});
const PREVIEW_TTL = 900;
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
  return json({id, version, preview: `/artifact/${id}/preview`}, 201);
}

// the pages, in the site's layout (site/shell.mjs); private ones are never indexed
const view = (request, env, {title, description = 'Artifacts on motionhub: pages and sites made with motions.', body, status = 200, frame = "'none'", indexable = false}) =>
  shellPage(request, env, {
    title: `${title}: motionhub`, description, body: `<div class="art">${body}</div>`, status, frame,
    head: indexable ? '' : '<meta name="robots" content="noindex">',
    headers: {'x-robots-tag': indexable ? 'index' : 'noindex'},
  });
const notFound = (request, env, message = 'This artifact is not here: it was unpublished, the link expired, or it never existed.') => view(request, env, {
  title: 'Not found', status: 404,
  body: `<section class="you-out"><h1>Not found</h1><p>${escape(message)}</p><a class="btn" href="/">Back to motionhub</a></section>`,
});
const problem = (request, env, id, message, status) => view(request, env, {
  title: 'Something went wrong', status,
  body: `<section class="you-out"><h1>That didn't work</h1><p>${escape(message)}</p><a class="btn primary" href="/artifacts/${id}">Back to the artifact</a></section>`,
});

const when = (seconds) => new Date(seconds * 1000).toISOString().slice(0, 16).replace('T', ' ') + ' UTC';

const uploadScript = `
const size = (bytes) => bytes < 1048576 ? Math.max(1, Math.round(bytes / 1024)) + ' KB' : (bytes / 1048576).toFixed(1) + ' MB';
for (const form of document.querySelectorAll('form[data-endpoint]')) {
  const status = form.querySelector('output');
  const input = form.elements.bundle;
  const drop = input.closest('.drop');
  const name = drop.querySelector('.file');
  const say = (text, error = false) => { status.textContent = text; status.className = error ? 'is-error' : ''; };
  input.addEventListener('change', () => { const file = input.files[0]; name.textContent = file ? file.name + ' · ' + size(file.size) : ''; say(''); });
  for (const type of ['dragenter', 'dragover']) drop.addEventListener(type, () => drop.classList.add('over'));
  for (const type of ['dragleave', 'drop']) drop.addEventListener(type, () => drop.classList.remove('over'));
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('button');
    const file = input.files[0];
    if (!file) return say('Choose an HTML file or a ZIP first.', true);
    if (!/\\.(html?|zip)$/i.test(file.name)) return say('Upload an .html file or a .zip.', true);
    if (file.size > 8 * 1024 * 1024) return say('That file is ' + size(file.size) + ': an upload is at most 8 MB.', true);
    button.disabled = true;
    say('Uploading ' + file.name + '…');
    try {
      const title = form.elements.title?.value.trim();
      const headers = {'content-type': /\\.zip$/i.test(file.name) ? 'application/zip' : 'text/html'};
      if (title) headers['x-artifact-title'] = encodeURIComponent(title);
      const response = await fetch(form.dataset.endpoint, {method: 'POST', headers, body: file});
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Upload failed. Try again.');
      say('Uploaded. Opening the preview…');
      location.assign(result.preview);
    } catch (error) {
      say(error.message, true);
      button.disabled = false;
    }
  });
}
for (const button of document.querySelectorAll('[data-copy-text]')) {
  const label = button.textContent;
  button.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(new URL(button.dataset.copyText, location.href).href); button.textContent = 'Copied'; }
    catch { button.textContent = 'Copy failed'; }
    setTimeout(() => (button.textContent = label), 1600);
  });
}
for (const form of document.querySelectorAll('form[data-confirm]')) {
  form.addEventListener('submit', (event) => { if (!confirm(form.dataset.confirm)) event.preventDefault(); });
}
`;
const script = '<script src="/artifacts/upload.js" defer></script>';
const uploadForm = (id) => `<form class="art-upload" data-endpoint="/api/artifacts${id ? '/' + id : ''}">
${id ? '' : '<label class="field"><span>Title <small>Optional</small></span><input name="title" maxlength="100" placeholder="Untitled artifact" autocomplete="off"></label>'}
<label class="drop"><input name="bundle" type="file" accept=".html,.htm,.zip,text/html,application/zip" required><b>${id ? 'Drop a new version here' : 'Drop an HTML file or a ZIP'}</b><small>or click to choose · up to 8 MB · a ZIP with index.html at its root</small><span class="file"></span></label>
<button class="btn${id ? '' : ' accent'}">${id ? 'Upload new version' : 'Upload artifact'}</button><output aria-live="polite"></output>
</form>`;

const frame = (origin, mode, key) => `<iframe class="art-frame" title="Artifact preview" sandbox="allow-scripts" referrerpolicy="no-referrer" src="${origin}/${mode}/${key}/index.html"></iframe>`;
const motionId = /^@[a-z0-9-]+\/[a-z0-9-]+$/;
const motionLink = (id) => `<a class="pill" href="/m/${id}/">${escape(id)}</a>`;
const byline = (person) => `<a class="art-by" href="/portfolio/${encodeURIComponent(person.login)}"><img src="/avatar/${person.id}?s=44" alt="" width="22" height="22">${escape(person.name || '@' + person.login)}</a>`;

async function publication(request, env, url, origin) {
  const work = /^\/works\/([a-f0-9-]{36})$/.exec(url.pathname);
  const share = /^\/artifact-share\/([a-f0-9]{64})$/.exec(url.pathname);
  const portfolio = /^\/portfolio\/([a-zA-Z0-9-]+)\/?$/.exec(url.pathname);
  if (!work && !share && !portfolio) return null;
  if (request.method !== 'GET') return reply('Method not allowed', 405);
  if (portfolio) {
    const owner = await env.DB.prepare('SELECT id, login, name FROM people WHERE lower(login) = lower(?) ORDER BY seen_at DESC LIMIT 1').bind(portfolio[1]).first();
    if (!owner) return notFound(request, env, 'No one on motionhub has that name.');
    const {results} = await env.DB.prepare('SELECT id, title, description, updated_at FROM artifacts WHERE person = ? AND public_version IS NOT NULL ORDER BY updated_at DESC').bind(owner.id).all();
    const name = owner.name || owner.login;
    return view(request, env, {
      title: `${name}'s artifacts`, description: `Artifacts @${owner.login} published on motionhub.`, indexable: true,
      body: `<div class="art-head"><div><h1>${escape(name)}</h1><p class="art-by"><img src="/avatar/${owner.id}?s=44" alt="" width="22" height="22">@${escape(owner.login)} · ${results.length} published artifact${results.length === 1 ? '' : 's'}</p></div></div>
${results.length ? `<ul class="art-list">${results.map(({id, title, description, updated_at}) => `<li><div class="art-main"><a class="art-name" href="/works/${id}">${escape(title)}</a>${description ? `<span class="art-meta">${escape(description.length > 160 ? description.slice(0, 157) + '…' : description)}</span>` : ''}</div><span class="art-meta">${when(updated_at).slice(0, 10)}</span></li>`).join('')}</ul>`
  : '<div class="art-empty"><p>Nothing published yet.</p></div>'}`,
    });
  }
  if (share) {
    const row = await env.DB.prepare(`SELECT a.title, s.expires_at, p.id, p.login, p.name FROM artifact_shares s JOIN artifact_versions v ON s.version = v.id
      JOIN artifacts a ON a.id = v.artifact JOIN people p ON p.id = a.person WHERE s.id = ? AND s.expires_at > ?`).bind(share[1], now()).first();
    if (!row) return notFound(request, env, 'This share link expired or was revoked. Ask whoever sent it for a new one.');
    return view(request, env, {
      title: row.title, frame: origin,
      body: `<div class="art-head"><div><div class="art-tags"><span class="art-status is-shared">Shared privately</span></div><h1>${escape(row.title)}</h1><p>${byline(row)}</p></div></div>
<section class="art-stage"><div class="art-bar"><span>Only people with this link can see it · until ${when(row.expires_at)}</span></div>${frame(origin, 'shared', share[1])}</section>`,
    });
  }
  const row = await env.DB.prepare(`SELECT a.*, p.login, p.name FROM artifacts a JOIN people p ON a.person = p.id
    WHERE a.id = ? AND a.public_version IS NOT NULL`).bind(work[1]).first();
  if (!row) return notFound(request, env);
  const related = [row.main_motion, ...row.other_motions.split(',')].filter((id) => motionId.test(id));
  return view(request, env, {
    title: row.title, frame: origin, indexable: true,
    description: row.description || `An artifact by @${row.login} on motionhub.`,
    body: `<div class="art-head"><div><h1>${escape(row.title)}</h1><p>${byline({id: row.person, login: row.login, name: row.name})}</p>${row.description ? `<p>${escape(row.description)}</p>` : ''}</div></div>
<section class="art-stage"><div class="art-bar"><span>Published ${when(row.updated_at).slice(0, 10)}</span>${related.length ? `<span class="art-made">Made with ${related.map(motionLink).join('')}</span>` : ''}</div>${frame(origin, 'published', row.public_version)}</section>`,
  });
}

async function manage(request, env, me, id) {
  if (!sameOrigin(request)) return reply('Invalid request origin', 403);
  const owner = await env.DB.prepare('SELECT id FROM artifacts WHERE id = ? AND person = ?').bind(id, me.id).first();
  if (!owner) return notFound(request, env);
  let data;
  try { data = new URLSearchParams(new TextDecoder().decode(await limitedBytes(request.body, 8192))); }
  catch { return problem(request, env, id, 'The form was too large to read.', 400); }
  const action = data.get('action'), version = data.get('version');
  if (action === 'publish' || action === 'share') {
    const ready = await env.DB.prepare('SELECT id FROM artifact_versions WHERE id = ? AND artifact = ? AND ready = 1').bind(version, id).first();
    if (!ready) return problem(request, env, id, 'That version is gone. Pick another one.', 404);
  }
  if (action === 'publish') {
    const description = (data.get('description') ?? '').trim().slice(0, 1200);
    const main = (data.get('main_motion') ?? '').trim();
    const other = [...new Set((data.get('other_motions') ?? '').split(',').map((value) => value.trim()).filter(Boolean))];
    if ((main && !motionId.test(main)) || other.length > 8 || other.some((value) => !motionId.test(value) || value === main)) {
      return problem(request, env, id, 'A motion is named by its id, like @iamsuosi/lab-notebook: at most 8 supporting motions, separated by commas, and none the same as the main one.', 400);
    }
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
    if (!deleted.meta.changes) return problem(request, env, id, 'Only a version that is not the latest draft, not published and not shared can be deleted.', 409);
  } else if (action === 'share') {
    await env.DB.prepare('INSERT INTO artifact_shares (id, version, expires_at) VALUES (?, ?, ?)').bind(randomToken(), version, now() + 7 * 86400).run();
  } else if (action === 'revoke') {
    await env.DB.prepare('DELETE FROM artifact_shares WHERE id = ? AND version IN (SELECT id FROM artifact_versions WHERE artifact = ?)')
      .bind(data.get('share'), id).run();
  } else return problem(request, env, id, 'That is not something this page does.', 400);
  return Response.redirect(new URL(`/artifact/${id}/preview`, request.url), 303);
}

async function draftPage(request, env, id, row, origin, token, compact = false) {
  const {results: versions} = await env.DB.prepare('SELECT id, created_at FROM artifact_versions WHERE artifact = ? AND ready = 1 ORDER BY created_at DESC, id').bind(id).all();
  const {results: shares} = await env.DB.prepare('SELECT s.id, s.version, s.expires_at FROM artifact_shares s JOIN artifact_versions v ON v.id = s.version WHERE v.artifact = ? AND s.expires_at > ? ORDER BY s.expires_at DESC').bind(id, now()).all();
  const label = (version) => {
    const found = versions.find(({id: candidate}) => candidate === version);
    const tags = [version === row.draft_version && 'latest', version === row.public_version && 'published'].filter(Boolean);
    return `${found ? when(found.created_at).slice(5, 16) : 'removed'} · ${version.slice(0, 8)}${tags.length ? ` · ${tags.join(', ')}` : ''}`;
  };
  const options = (selected) => versions.map(({id: version}) => `<option value="${version}"${version === selected ? ' selected' : ''}>${escape(label(version))}</option>`).join('');
  const removable = versions.filter(({id: version}) =>
    version !== row.draft_version && version !== row.public_version && !shares.some((share) => share.version === version));
  const latest = versions.find(({id: version}) => version === row.draft_version);
  const tags = [
    row.public_version ? '<span class="art-status is-live">Published</span>' : '<span class="art-status">Private draft</span>',
    shares.length ? `<span class="art-status is-shared">${shares.length} share link${shares.length === 1 ? '' : 's'}</span>` : '',
    `<span class="art-status">${versions.length} version${versions.length === 1 ? '' : 's'}</span>`,
  ].join('');
  const publish = `<section class="art-panel"><h2>${row.public_version ? 'Published' : 'Publish'}</h2>
<p>${row.public_version ? `Anyone can see <a href="/works/${id}">its public page</a>, and it is on <a href="/portfolio/${encodeURIComponent(row.login)}">your portfolio</a>. Publish another version to replace it.` : 'Give it a public page, listed on your portfolio, for anyone to see.'}</p>
<form method="post">
<label class="field">Version<select name="version">${options(row.draft_version)}</select></label>
<label class="field"><span>Description <small>Optional, up to 1200 characters</small></span><textarea name="description" maxlength="1200" placeholder="What it is, and what you made it with">${escape(row.description)}</textarea></label>
<label class="field"><span>Main motion <small>Optional</small></span><input name="main_motion" value="${escape(row.main_motion)}" placeholder="@author/slug" autocomplete="off" spellcheck="false"></label>
<label class="field"><span>Other motions <small>Optional, separated by commas</small></span><input name="other_motions" value="${escape(row.other_motions.replaceAll(',', ', '))}" placeholder="@author/slug, @author/other" autocomplete="off" spellcheck="false"></label>
<button class="btn accent" name="action" value="publish">${row.public_version ? 'Publish this version' : 'Publish'}</button>
</form>
${row.public_version ? `<form method="post" data-confirm="Unpublish it? Its public page and its place on your portfolio go away; your drafts and share links stay."><button class="btn" name="action" value="unpublish">Unpublish</button></form>` : ''}
</section>`;
  const share = `<section class="art-panel"><h2>Share privately</h2>
<p>A link anyone can open for 7 days without signing in. Not listed anywhere.</p>
<form method="post"><label class="field">Version<select name="version">${options(row.draft_version)}</select></label><button class="btn" name="action" value="share">Create a share link</button></form>
${shares.length ? `<ul class="art-links">${shares.map(({id: key, version, expires_at}) => `<li><span>Version ${version.slice(0, 8)}<small>Open until ${when(expires_at)}</small></span>
<button type="button" class="btn sm" data-copy-text="/artifact-share/${key}">Copy link</button><a class="btn sm" href="/artifact-share/${key}" target="_blank" rel="noopener">Open</a>
<form method="post" data-confirm="Revoke this link? Anyone who has it can no longer open the artifact."><input type="hidden" name="share" value="${key}"><button class="btn sm" name="action" value="revoke">Revoke</button></form></li>`).join('')}</ul>` : ''}
</section>`;
  const old = removable.length ? `<details class="art-panel"><summary>Older versions</summary>
<p class="note">A version that is not the latest, not published and not shared can be deleted, for good.</p>
<form method="post" data-confirm="Delete this version for good?"><label class="field">Version<select name="version">${removable.map(({id: version}) => `<option value="${version}">${escape(label(version))}</option>`).join('')}</select></label><button class="btn" name="action" value="delete-version">Delete version</button></form>
</details>` : '';
  if (compact) {
    const panels = `${publish}${share}<section class="art-panel"><h2>New version</h2>${uploadForm(id)}</section>${old}`;
    return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(row.title)} · motionhub</title><link rel="stylesheet" href="/brand/tokens.css">
<style>
*{box-sizing:border-box}body{margin:0;background:var(--color-bg);color:var(--color-text);font:14px system-ui}
.workspace{height:100vh;height:100dvh;display:flex;flex-direction:column}
.preview-header{display:flex;align-items:center;gap:16px;min-height:44px;padding:8px 16px;border-bottom:1px solid var(--color-line)}
.preview-header a{color:inherit;text-decoration:none}.preview-title{flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.art-frame{flex:1;min-height:0;width:100%;border:0;display:block}.preview-actions>summary{cursor:pointer}
.preview-panel{position:absolute;z-index:1;right:0;top:44px;bottom:0;width:min(420px,100%);overflow:auto;padding:16px;background:var(--color-surface);border-left:1px solid var(--color-line)}
.preview-panel form,.field{display:grid;gap:8px}.preview-panel form{margin:12px 0}.preview-panel section{margin-bottom:24px}
input,textarea,select,button{max-width:100%;font:inherit;color:inherit;background:var(--color-surface);border:1px solid var(--color-line);padding:8px}button{cursor:pointer}textarea{min-height:80px}
.preview-panel a{color:inherit}.preview-panel small{display:block;color:var(--color-muted)}
</style></head><body><main class="workspace">
<header class="preview-header"><a href="/artifacts/">motionhub</a><span class="preview-title">${escape(row.title)}</span>
<a href="/artifact/${id}/preview">Reload</a><details class="preview-actions"><summary>Manage</summary><div class="preview-panel">${panels}</div></details></header>
${frame(origin, 'preview', token)}</main>${script}</body></html>`, {headers: {
      ...privateHeaders, 'content-type': 'text/html; charset=utf-8', 'x-robots-tag': 'noindex',
      'referrer-policy': 'same-origin',
      'content-security-policy': `default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-src ${origin}; frame-ancestors 'none'; base-uri 'none'; form-action 'self'`,
    }});
  }
  return view(request, env, {
    title: row.title, frame: origin,
    body: `<p class="crumb"><a href="/artifacts/">Your artifacts</a> / ${escape(row.title)}</p>
<div class="art-head"><div><h1>${escape(row.title)}</h1><div class="art-tags">${tags}</div></div>${row.public_version ? `<a class="btn" href="/works/${id}">View public page</a>` : ''}</div>
<div class="art-grid">
<section class="art-stage"><div class="art-bar"><span>Private preview of the latest version${latest ? `, uploaded ${when(latest.created_at)}` : ''}</span><a href="/artifacts/${id}">Reload</a></div>${frame(origin, 'preview', token)}</section>
<aside class="art-side">${publish}${share}<section class="art-panel"><h2>New version</h2>${uploadForm(id)}</section>${old}</aside>
</div>${script}`,
  });
}

export async function artifacts(request, env) {
  const url = new URL(request.url);
  if (url.origin === env.ARTIFACT_CONTENT_ORIGIN) {
    if (url.origin === (env.ARTIFACT_SITE_ORIGIN ?? 'https://motionhub.dev')) return reply('Not found', 404);
    return content(request, env, url);
  }
  const compact = previewRoute.exec(url.pathname);
  const draft = compact || draftRoute.exec(url.pathname);
  const api = uploadRoute.exec(url.pathname);
  const list = url.pathname === '/artifacts' || url.pathname === '/artifacts/';
  const publicRoute = /^\/(works|artifact-share|portfolio)\//.test(url.pathname);
  if (!list && !draft && !api && !publicRoute && url.pathname !== '/artifacts/upload.js') return null;
  const origin = contentOrigin(env, url.origin);
  if (!origin || !env.DB || url.origin !== (env.ARTIFACT_SITE_ORIGIN ?? 'https://motionhub.dev')) return reply('Not found', 404);
  if (publicRoute) return await publication(request, env, url, origin) ?? notFound(request, env);
  if (url.pathname === '/artifacts/upload.js' && request.method === 'GET') return new Response(uploadScript, {
    headers: {...privateHeaders, 'content-type': 'text/javascript; charset=utf-8'},
  });
  if (request.method !== (api ? 'POST' : 'GET') && !(draft && request.method === 'POST')) return reply('Method not allowed', 405);
  const cli = api && request.headers.has('authorization');
  if (api && !cli && !sameOrigin(request)) return json({error: 'Invalid request origin.'}, 403);
  const me = await (cli ? cliPerson(request, env) : person(request, env));
  if (!me) return api ? json({error: 'Sign in to upload.'}, 401) : view(request, env, {
    title: 'Artifacts',
    body: `<section class="you-out"><h1>Artifacts</h1><p>Upload a page or a site you made with motions, look at it privately, then publish it or share a link.</p>
<a class="btn primary" href="/auth/login?next=${encodeURIComponent(url.pathname)}" rel="nofollow">Sign in with GitHub</a></section>`,
  });
  if (draft && request.method === 'POST') return manage(request, env, me, draft[1]);
  if (api) return upload(request, env, me, api[1]).catch(() => json({error: 'Upload failed. Try again.'}, 500));
  if (list) {
    const {results} = await env.DB.prepare('SELECT id, title, updated_at, public_version IS NOT NULL AS live FROM artifacts WHERE person = ? AND draft_version IS NOT NULL ORDER BY updated_at DESC').bind(me.id).all();
    return view(request, env, {
      title: 'Your artifacts',
      body: `<div class="art-head"><div><h1>Your artifacts</h1><p>Pages and sites made with motions. Each stays private to you until you publish it or share a link.</p></div><a class="btn" href="/portfolio/${encodeURIComponent(me.login)}">Your portfolio</a></div>
<div class="art-grid">
<div>${results.length ? `<ul class="art-list">${results.map(({id, title, updated_at, live}) => `<li><div class="art-main"><a class="art-name" href="/artifacts/${id}">${escape(title)}</a><span class="art-meta">Updated ${when(updated_at)}</span></div>${live ? '<span class="art-status is-live">Published</span>' : '<span class="art-status">Private draft</span>'}</li>`).join('')}</ul>`
  : '<div class="art-empty"><p><b>No artifacts yet.</b></p><p>Upload an HTML file, or a ZIP of a built site, to see it in a private preview. Up to 20 artifacts, 20 versions each.</p></div>'}</div>
<aside class="art-side"><section class="art-panel"><h2>New artifact</h2>${uploadForm()}</section>
<section class="art-panel art-cli"><h2>From your terminal</h2><p>Upload a built site's folder, zipped for you:</p><pre data-copy>npx @motionhub/cli artifact upload ./dist</pre><p class="note">Build with relative asset URLs; for Vite, <code>--base ./</code>.</p></section></aside>
</div>${script}`,
    });
  }
  const row = await env.DB.prepare('SELECT title, draft_version, public_version, description, main_motion, other_motions FROM artifacts WHERE id = ? AND person = ?').bind(draft[1], me.id).first();
  if (!row?.draft_version) return notFound(request, env);
  const token = randomToken();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM artifact_preview_grants WHERE expires_at <= ?').bind(now()),
    env.DB.prepare('INSERT INTO artifact_preview_grants (token_hash, version, expires_at) VALUES (?, ?, ?)').bind(await sha256(token), row.draft_version, now() + PREVIEW_TTL),
  ]);
  return draftPage(request, env, draft[1], {...row, login: me.login}, origin, token, Boolean(compact));
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
