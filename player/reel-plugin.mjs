// What a reel's script is made of, the same wherever esbuild runs: in Node, for every published reel (player/build.mjs),
// and in a browser, for a private motion its owner previews on motionhub.dev (the site's /you/private/, in its own
// repository). No dependencies and no Node: the browser imports it as it is.
//
// A reel's script holds the motion's code alone. React, @motionhub/runtime and three.js come from the shared scripts
// every reel's page loads first (/play/_shared/), each found on globalThis.__motionhubPlayer; three.js's addons are the
// motion's own and bundled into its script; any other bare import is refused. Its sound (react/sound.json) and tokens
// (tokens.json, resolved) are modules of their own, and the script ends by mounting the reel in the player.

/** The modules a motion's script takes from the shared scripts, and the expression each is found at there. */
export const FROM_CORE = {'react': 'v1.modules["react"]', 'react/jsx-runtime': 'v1.modules["react/jsx-runtime"]', '@motionhub/runtime': 'v1.modules["@motionhub/runtime"]', 'three': 'three'};

/** three.js's addons, which a reel may import and bundles itself. */
export const ADDON = /^three\/(examples\/jsm|addons)\//;

/** The entry of every reel's script: its reel, sound and tokens, mounted in the player. */
export const ENTRY = "import * as module from 'motionhub:reel';\nimport sound from 'motionhub:sound';\nimport tokens from 'motionhub:tokens';\nglobalThis.__motionhubPlayer.v1.mount({module, sound, tokens});";

/**
 * The esbuild plugin that makes a reel's script: `reel` is what motionhub:reel resolves to (react/reel.tsx, however the
 * caller finds its files), `sound` the text of react/sound.json or null, `tokens` the resolved tokens, and `heavy` is
 * called when the reel imports three.js, so its page loads three.js and a weak device waits for a tap.
 */
export function reelPlugin({reel, sound, tokens, heavy = () => {}}) {
  return {name: 'motionhub', setup(b) {
    // the motion's script holds the motion's code alone: what the core offers it takes from there
    b.onResolve({filter: /^(react|react-dom|three|@motionhub\/runtime)(\/.*)?$/}, (args) => {
      if (args.path in FROM_CORE) {
        if (args.path === 'three') heavy();
        return {path: args.path, namespace: 'core'};
      }
      // three.js's addons are the motion's own, and import three.js from the shared script like the motion does
      if (ADDON.test(args.path)) return undefined;
      return {errors: [{text: `${args.path} is not something a reel can import: a reel has react, @motionhub/runtime, three and three's addons (three/addons/, three/examples/jsm/)`}]};
    });
    b.onLoad({filter: /.*/, namespace: 'core'}, ({path}) => ({contents: `module.exports = globalThis.__motionhubPlayer.${FROM_CORE[path]};`, loader: 'js'}));
    b.onResolve({filter: /^motionhub:reel$/}, () => reel);
    b.onResolve({filter: /^motionhub:(tokens|sound)$/}, (args) => ({path: args.path.slice(10), namespace: 'motionhub'}));
    // the motion's sound (react/sound.json), or none
    b.onLoad({filter: /.*/, namespace: 'motionhub'}, ({path}) => ({contents: `export default ${path === 'sound' ? (sound ?? 'null') : JSON.stringify(tokens)};`, loader: 'js'}));
  }};
}

const GENERIC = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui|math|emoji|ui-[a-z-]+)$/;
// faces for Chinese, Japanese and Korean are too large for a reel that shows Latin text
const HAN = /^(Noto (Sans|Serif) (SC|TC|JP|KR)|LXGW WenKai)$/;

/** The families a motion's font tokens name, generic ones and CJK faces left out. */
export const familiesOf = (tokens) => [...new Set(Object.values(tokens.font ?? {}).flatMap((s) => String(s).split(',').map((f) => f.trim().replace(/^["']|["']$/g, ''))))]
  .filter((f) => f && !GENERIC.test(f) && !HAN.test(f));

/** The weight ranges asked of Google Fonts in turn: it refuses (400) a range a face does not span. */
export const AXES = [':ital,wght@0,100..900;1,100..900', ':wght@100..900', ':wght@200..900', ':wght@100..800', ':wght@200..800', ':wght@300..800', ':wght@300..700', ':wght@400..700', ':wght@400;700', ''];

/** Google Fonts' stylesheet address for a family at one of AXES. */
export const googleUrl = (family, axes) => `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}${axes}&display=block`;

/** The @font-face blocks of a Google Fonts stylesheet a reel takes: the latin subset's, else the whole sheet. */
export function latinBlocks(css) {
  const blocks = [...css.matchAll(/\/\*\s*([a-z-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g)].filter(([, subset]) => subset === 'latin').map(([, , b]) => b);
  return blocks.length ? blocks : [css];
}
