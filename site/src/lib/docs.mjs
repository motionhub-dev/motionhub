// The docs' pages as HTML: each document rendered with marked, its links resolved the way its Markdown twin's are
// (tools/docs.mjs), and its headings given GitHub's anchors so a link to SPEC.md#7-extensions lands the same here.
import {Marked} from 'marked';
import {DOCS, PAGES, pagePath, readDoc, resolveLink, twinPath} from '../../../tools/docs.mjs';
import {ROOT} from './catalogue.mjs';

export {DOCS, PAGES, pagePath, twinPath};

/** GitHub's anchor for a heading: lower case, punctuation dropped, spaces to hyphens, repeats numbered. */
function slugger() {
  const seen = new Map();
  return (text) => {
    let id = text.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\p{L}\p{N}\s_-]/gu, '').trim().replace(/\s/g, '-');
    const n = seen.get(id) ?? 0;
    seen.set(id, n + 1);
    return n ? `${id}-${n}` : id;
  };
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** A docs page: its title, its HTML, the headings it lists on the page (h2 and h3), and its text for search. */
export function renderDoc(p) {
  const {title, body} = readDoc(ROOT, p);
  const slug = slugger();
  const toc = [];
  const marked = new Marked({
    gfm: true,
    renderer: {
      heading({tokens, depth, text}) {
        const html = this.parser.parseInline(tokens);
        const id = slug(text.replace(/`/g, ''));
        if (depth === 2 || depth === 3) toc.push({depth, id, text: html.replace(/<[^>]+>/g, '')});
        return `<h${depth} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true" tabindex="-1">#</a>${html}</h${depth}>\n`;
      },
      link({href, title: t, tokens}) {
        const to = resolveLink(ROOT, p.file, href, 'html');
        const out = /^https?:/.test(to) && !to.startsWith('https://motionhub.dev');
        return `<a href="${esc(to)}"${t ? ` title="${esc(t)}"` : ''}${out ? ' rel="noopener"' : ''}>${this.parser.parseInline(tokens)}</a>`;
      },
    },
  });
  const html = marked.parse(body).replace(/<pre>/g, '<pre tabindex="0">').replace(/<table>/g, '<div class="table"><table>').replace(/<\/table>/g, '</table></div>');
  return {title, html, toc, text: body};
}
