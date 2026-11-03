// The faces a motion names, as @font-face blocks whose files can be made local. No dependencies.

/**
 * Faces Google Fonts does not have, by family: stylesheets that split them by unicode-range, at an exact version so that
 * a film renders the same next year. Google has only "LXGW WenKai TC", so LXGW WenKai comes from its OFL-1.1 webfont
 * package on npm, through jsDelivr. The same table is in @motionhub/remotion (tests/bindings.test.mjs keeps them equal).
 */
export const ELSEWHERE = {
  'LXGW WenKai': ['regular', 'bold'].map((w) => `https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/lxgwwenkai-${w}.css`),
};

/** Families written for Chinese, Japanese or Korean: large, split into many files, and only taken when asked for */
export const HAN = /^(Noto (Sans|Serif) (SC|TC|JP|KR)|LXGW WenKai|Fusion Pixel.*)$/;

/**
 * The @font-face blocks of a stylesheet fetched from `href`: each with the subset its comment names (Google's "latin",
 * "[12]", a package's "LXGW WenKai [4]"), its style and weight, and its file's absolute URL.
 */
export function blocks(css, href) {
  return [...css.matchAll(/(?:\/\*\s*([^*]*?)\s*\*\/\s*)?(@font-face\s*\{[^}]*\})/g)].flatMap(([, subset = '', block]) => {
    const src = /url\((["']?)([^)"']+)\1\)/.exec(block)?.[2];
    if (!src) return [];
    return [{
      subset,
      block,
      url: new URL(src, href).href,
      style: /font-style:\s*(\w+)/.exec(block)?.[1] ?? 'normal',
      weight: (/font-weight:\s*([\d ]+)/.exec(block)?.[1] ?? '400').trim().replace(/\s+/g, '-'),
    }];
  });
}

/**
 * A block made local: its file at `fonts/<file>`, shown only once loaded (block), since a frame is rendered once. Each
 * file gets its own name, as a face split by unicode-range has many files for one style and weight.
 */
export function localBlock(face, family, index) {
  const ext = /\.woff2(\?|$)/.test(face.url) ? '.woff2' : /\.woff(\?|$)/.test(face.url) ? '.woff' : '.ttf';
  const file = `${family.replace(/\W+/g, '-')}-${face.style}-${face.weight}-${index}${ext}`;
  const format = ext === '.woff2' ? 'woff2' : ext === '.woff' ? 'woff' : 'truetype';
  const block = face.block
    .replace(/src:\s*[^;}]*/, `src: url('fonts/${file}') format('${format}')`)
    .replace(/font-display:\s*\w+/, 'font-display: block');
  return {file, block: /font-display/.test(block) ? block : block.replace(/\}\s*$/, '  font-display: block;\n}')};
}
