// What motionhub.dev's pages share with tools/build.mjs, with no dependencies: the Markdown a motion's documents use, its
// colours and faces as the pages show them, and the files written beside the pages (_headers, robots.txt and
// sitemap.xml). The pages themselves are the Astro project in site/.

import {writeFileSync} from 'node:fs';
import {join} from 'node:path';

export const SITE = 'https://motionhub.dev';
export const REPO = 'https://github.com/motionhub-dev/motions';

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const en = (localized) => localized?.en ?? Object.values(localized ?? {})[0] ?? '';
export const other = (localized) => Object.entries(localized ?? {}).filter(([k]) => k !== 'en').map(([, v]) => v)[0];

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

const HEADERS = `/api/*
  Access-Control-Allow-Origin: *
  Cache-Control: public, max-age=300
/m/*
  Access-Control-Allow-Origin: *
/_astro/*
  Cache-Control: public, max-age=31536000, immutable
/llms.txt
  Access-Control-Allow-Origin: *
  Content-Type: text/plain; charset=utf-8
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
`;

/** The files beside the pages: the headers file, robots.txt and the sitemap of the gallery and every motion's page. */
export function writeSiteFiles(out, rows) {
  writeFileSync(join(out, '_headers'), HEADERS);
  writeFileSync(join(out, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
  const urls = ['/', ...rows.map((r) => `/m/${r.slug}/`)];
  writeFileSync(join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${SITE}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
}
