// The pages of motionhub.dev, written by tools/build.mjs beside the files it serves: the gallery at /, a page per motion
// at /m/<slug>/, a 404 page, the stylesheet, the mark and the headers file. Plain HTML and one small script, no
// dependencies; the gallery is complete without the script, which only filters it.

import {readFileSync, writeFileSync, mkdirSync, existsSync} from 'node:fs';
import {join} from 'node:path';

export const SITE = 'https://motionhub.dev';
const REPO = 'https://github.com/motionhub-dev/motions';
const MARK = '<svg viewBox="0 0 96 56" aria-hidden="true"><circle cx="10" cy="40" r="5" fill="#E2442B" fill-opacity="0.18"/><circle cx="27" cy="31" r="7" fill="#E2442B" fill-opacity="0.35"/><circle cx="47" cy="24" r="9" fill="#E2442B" fill-opacity="0.6"/><circle cx="72" cy="21" r="14" fill="#E2442B"/></svg>';

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const en = (localized) => localized?.en ?? Object.values(localized ?? {})[0] ?? '';
const other = (localized) => Object.entries(localized ?? {}).filter(([k]) => k !== 'en').map(([, v]) => v)[0];

/** Inline Markdown: code, links, bold and italic, on escaped text. */
function inline(text) {
  const codes = [];
  let s = esc(text).replace(/`([^`]+)`/g, (_, c) => `\u0000${codes.push(`<code>${c}</code>`) - 1}\u0000`);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => (/^(https?:|\/|#|mailto:)/.test(u) ? `<a href="${u}">${t}</a>` : t));
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[\s(])[*_]([^*_\s][^*_]*?)[*_](?=[\s).,;:!?]|$)/g, '$1<em>$2</em>');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => codes[i]);
}

/** The Markdown a motion's documents use: headings, paragraphs, lists, code blocks and inline marks. Raw HTML is shown as text. */
export function markdown(text) {
  const out = [];
  let para = [];
  let list = null;
  const flush = () => {
    if (para.length) out.push(`<p>${inline(para.join(' '))}</p>`);
    para = [];
    if (list) out.push(`<${list.tag}>${list.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${list.tag}>`);
    list = null;
  };
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let m;
    if (/^```/.test(line)) {
      flush();
      const body = [];
      while (++i < lines.length && !/^```/.test(lines[i])) body.push(lines[i]);
      out.push(`<pre><code>${esc(body.join('\n'))}</code></pre>`);
    } else if ((m = /^(#{1,4})\s+(.*)$/.exec(line))) {
      flush();
      out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`);
    } else if ((m = /^\s*([-*]|\d+\.)\s+(.*)$/.exec(line))) {
      const tag = /\d/.test(m[1]) ? 'ol' : 'ul';
      if (para.length || (list && list.tag !== tag)) flush();
      list ??= {tag, items: []};
      list.items.push(m[2]);
    } else if (!line.trim()) {
      flush();
    } else if (list && /^\s+\S/.test(line)) {
      list.items[list.items.length - 1] += ` ${line.trim()}`;
    } else {
      if (list) flush();
      para.push(line.trim());
    }
  }
  flush();
  return out.join('\n');
}

/** The colour tokens as `{name, hex, description}`, an alias resolved to the colour it names. */
export function colours(tokens) {
  const group = tokens.color ?? {};
  const value = (v, seen = 0) => {
    if (typeof v === 'string') {
      const m = /^\{color\.([^}]+)\}$/.exec(v);
      return m && seen < 8 ? value(group[m[1]]?.$value, seen + 1) : undefined;
    }
    if (v?.hex) return v.hex;
    if (Array.isArray(v?.components) && v.colorSpace === 'srgb') return `#${v.components.slice(0, 3).map((c) => Math.round(c * 255).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
    return undefined;
  };
  return Object.entries(group).filter(([k]) => !k.startsWith('$')).map(([name, t]) => ({name, hex: value(t.$value), description: t.$description})).filter((c) => c.hex);
}

/** The font tokens as `{name, faces}`. */
export function faces(tokens) {
  return Object.entries(tokens.font ?? {}).filter(([k]) => !k.startsWith('$')).map(([name, t]) => ({name, faces: [].concat(t.$value ?? [])}));
}

function page({title, description, path, image, body, script = ''}) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${SITE}${path}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${SITE}${path}">
<meta property="og:image" content="${SITE}${image ?? '/og-default.png'}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&display=swap">
<link rel="stylesheet" href="/site.css">
</head>
<body>
<div class="wrap">
<header class="top">
  <a class="brand" href="/">${MARK}<span>motion<i>hub</i></span></a>
  <nav>
    <a href="/#gallery">Gallery</a>
    <a class="wide" href="/#how">How it works</a>
    <a href="${REPO}">GitHub</a>
    <a class="pill" href="${REPO}/blob/main/CONTRIBUTING.md">Share a motion</a>
  </nav>
</header>
${body}
<footer class="foot">
  <span>motionhub · open format motion/0.1 · maintained by <a href="https://github.com/iamsuosi">SuoSi</a></span>
  <span><a href="/llms.txt">llms.txt</a> · <a href="/api/motions.json">api/motions.json</a> · <a href="${REPO}">GitHub</a></span>
</footer>
</div>
${script}
</body>
</html>
`;
}

function card(row) {
  const zh = other(row.name);
  return `<a class="card" href="/m/${row.slug}/" title="${esc(en(row.line))}" data-tags="${esc(row.tags.join(' '))}" data-text="${esc([row.slug, ...Object.values(row.name), ...Object.values(row.line), ...row.tags].join(' ').toLowerCase())}">
  <img src="${row.poster}" alt="A frame of a film in ${esc(en(row.name))}" loading="lazy" width="960" height="540">
  <span class="row"><b>${esc(en(row.name))}</b>${zh ? `<small>${esc(zh)}</small>` : ''}</span>
  <span class="tags">${esc(row.tags.join(' · '))}</span>
</a>`;
}

function home(rows) {
  const counts = new Map();
  for (const r of rows) for (const t of r.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  const chips = [...counts].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, 10).map(([t]) => t);
  const body = `<section class="hero">
  <h1>Find the look for your <em>next explainer.</em></h1>
  <p>Open motions made by people and agents. Pick one, and any agent can make your film in it.</p>
</section>
<section id="gallery">
  <div class="filters">
    <form class="search" role="search" onsubmit="return false">
      <label for="q" class="sr">Search motions</label>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
      <input id="q" type="search" placeholder="Search: hand-drawn, 3d, dark…" autocomplete="off">
    </form>
    <div class="chips"><button type="button" data-tag="" aria-pressed="true">All</button>${chips.map((t) => `<button type="button" data-tag="${esc(t)}" aria-pressed="false">${esc(t)}</button>`).join('')}</div>
  </div>
  <p class="count"><span id="count">${rows.length} ${rows.length === 1 ? 'motion' : 'motions'}</span><span>A to Z</span></p>
  <div class="grid" id="grid">
${rows.map(card).join('\n')}
  </div>
  <p class="empty" id="empty" hidden>No motion matches. <a href="${REPO}/blob/main/CONTRIBUTING.md">Make the first one.</a></p>
</section>
<section id="how">
  <h2>One look, <em>every film</em></h2>
  <div class="steps">
    <div><span>01</span><b>Pick a motion</b><p>Search by what it looks like or what you are making: a lesson, a product, a story, a report.</p></div>
    <div><span>02</span><b>Hand it to your agent</b><p>Its MOTION.md and design tokens tell any agent the colours, type and motion to use. Give it <a href="/llms.txt">llms.txt</a> or install the <a href="${REPO}/tree/main/skills/motionhub">skill</a>.</p></div>
    <div><span>03</span><b>Make your own film</b><p>Your story, your structure: the motion keeps the look, never the script.</p></div>
  </div>
</section>
<section id="share" class="share">
  <div><h2>Made a look people should see? <em>Share it.</em></h2><p>Open a pull request from your GitHub account. Credited to you, under CC BY 4.0.</p></div>
  <a class="cta" href="${REPO}/blob/main/CONTRIBUTING.md">Share a motion</a>
</section>`;
  const script = `<script>
(() => {
  const q = document.getElementById('q'), cards = [...document.querySelectorAll('.card')], chips = [...document.querySelectorAll('.chips button')];
  let tag = '';
  const apply = () => {
    const words = q.value.toLowerCase().split(/\\s+/).filter(Boolean);
    let n = 0;
    for (const c of cards) {
      const show = (!tag || c.dataset.tags.split(' ').includes(tag)) && words.every((w) => c.dataset.text.includes(w));
      c.hidden = !show; n += show;
    }
    document.getElementById('count').textContent = n + (n === 1 ? ' motion' : ' motions');
    document.getElementById('empty').hidden = n > 0;
  };
  q.addEventListener('input', apply);
  for (const b of chips) b.addEventListener('click', () => { tag = b.dataset.tag; for (const o of chips) o.setAttribute('aria-pressed', String(o === b)); apply(); });
})();
</script>`;
  return page({title: 'motionhub: open looks for explainer videos', description: 'Open motions for narrated and explanatory video: pick a look, and any agent can make your film in it.', path: '/', image: rows[0]?.poster, body, script});
}

function motionPage(row, dir) {
  const read = (f) => (existsSync(join(dir, f)) ? readFileSync(join(dir, f), 'utf8') : '');
  const tokens = JSON.parse(read('tokens.json') || '{}');
  const zh = other(row.name);
  const authors = row.authors.map((a) => `<a href="https://github.com/${esc(a.github)}">${esc(a.name)}</a>`).join(', ');
  const licence = [row.license.text, row.license.code].filter(Boolean).map((l) => `<code>${esc(l)}</code>`).join(' + ');
  const doc = read('MOTION.md').replace(/^# .*\n+/, '');
  const ask = `Make a film about <your topic> in the motion ${SITE}/m/${row.slug}/`;
  const body = `<p class="crumb"><a href="/#gallery">Gallery</a> / ${esc(row.slug)}</p>
<section class="motion-head">
  <img src="/m/${row.slug}/poster.jpg" alt="A frame of a film in ${esc(en(row.name))}" width="960" height="540">
  <div>
    <h1>${esc(en(row.name))}${zh ? ` <small>${esc(zh)}</small>` : ''}</h1>
    <p class="line">${esc(en(row.line))}</p>
    <dl>
      <dt>Version</dt><dd>${esc(row.version)}</dd>
      <dt>By</dt><dd>${authors}</dd>
      <dt>Licence</dt><dd>${licence}</dd>
      ${row.tags.length ? `<dt>Looks</dt><dd>${esc(row.tags.join(' · '))}</dd>` : ''}
      ${row.tools.length ? `<dt>Tools</dt><dd>${row.tools.map((t) => `<code>${esc(t)}</code>`).join(' ')}</dd>` : ''}
    </dl>
  </div>
</section>
<section class="use">
  <h2>Use it</h2>
  <p>Ask any agent that has the <a href="${REPO}/tree/main/skills/motionhub">motionhub skill</a> (or can read <a href="/llms.txt">llms.txt</a>):</p>
  <pre><code>${esc(ask)}</code></pre>
  <p>Or take the files: <a href="${row.package.url}">${esc(row.version)}.tgz</a> (${Math.ceil(row.package.bytes / 1024)} KB, SHA-256 <code class="hash">${row.package.sha256}</code>), or read <a href="/m/${row.slug}/MOTION.md">MOTION.md</a>, <a href="/m/${row.slug}/tokens.json">tokens.json</a> and <a href="/m/${row.slug}/motion.json">motion.json</a> directly.</p>
</section>
<section class="tokens">
  <h2>Colours</h2>
  <ul class="swatches">${colours(tokens).map((c) => `<li><span style="background:${esc(c.hex)}"></span><b>${esc(c.name)}</b><code>${esc(c.hex)}</code>${c.description ? `<small>${esc(c.description)}</small>` : ''}</li>`).join('')}</ul>
  <h2>Faces</h2>
  <ul class="faces">${faces(tokens).map((f) => `<li><b>${esc(f.name)}</b><span>${f.faces.map(esc).join(', ')}</span></li>`).join('')}</ul>
</section>
<article class="doc">
${markdown(doc)}
</article>
<article class="doc credits">
${markdown(read('CREDITS.md'))}
</article>
<p class="source"><a href="${REPO}/tree/main/motions/${row.slug}">The source of ${esc(en(row.name))} on GitHub</a></p>`;
  return page({title: `${en(row.name)}: a motion on motionhub`, description: en(row.line), path: `/m/${row.slug}/`, image: row.poster, body});
}

const NOT_FOUND = () => page({title: 'Not found: motionhub', description: 'This page is not on motionhub.', path: '/404', body: '<section class="hero"><h1>Nothing <em>here.</em></h1><p><a href="/#gallery">Back to the gallery</a></p></section>'});

const HEADERS = `/api/*
  Access-Control-Allow-Origin: *
  Cache-Control: public, max-age=300
/m/*
  Access-Control-Allow-Origin: *
/llms.txt
  Access-Control-Allow-Origin: *
  Content-Type: text/plain; charset=utf-8
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
`;

export function writeSite(out, rows, motionsDir, css) {
  writeFileSync(join(out, 'index.html'), home(rows));
  for (const row of rows) {
    mkdirSync(join(out, 'm', row.slug), {recursive: true});
    writeFileSync(join(out, 'm', row.slug, 'index.html'), motionPage(row, join(motionsDir, row.slug)));
  }
  writeFileSync(join(out, '404.html'), NOT_FOUND());
  writeFileSync(join(out, 'site.css'), css);
  writeFileSync(join(out, '_headers'), HEADERS);
  writeFileSync(join(out, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
  const urls = ['/', ...rows.map((r) => `/m/${r.slug}/`)];
  writeFileSync(join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${SITE}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
}
