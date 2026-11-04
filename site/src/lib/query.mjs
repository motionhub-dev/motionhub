// The gallery's search and filters, with no dependencies, so the page's script and tests/query.test.mjs share them.
//
// A search is words a motion must all contain, with "an exact phrase", -a word it must not contain, and field:value to
// look in one field only (kind:topic, tag:dark, by:iamsuosi, engine:remotion, colour:blue, type:serif). A motion is
//   {text: 'everything a search matches, in lower case', facets: {tag: ['dark'], by: ['iamsuosi'], ...}}.

const FIELDS = {kind: 'kind', tag: 'tag', by: 'by', engine: 'engine', colour: 'colour', color: 'colour', type: 'type'};
const TERM = /(-)?(?:([a-z]+):)?(?:"([^"]*)"?|(\S+))/gi;

/** A search as its terms: `{value, field?, not?}`. A word before a colon that names no field is an ordinary word. */
export function parseQuery(text) {
  const terms = [];
  for (const [whole, not, name, phrase, word] of String(text ?? '').matchAll(TERM)) {
    const field = name && FIELDS[name.toLowerCase()];
    const value = (name && !field ? whole.replace(/^-/, '') : phrase ?? word ?? '').toLowerCase();
    if (value) terms.push({value, ...(field ? {field} : {}), ...(not ? {not: true} : {})});
  }
  return terms;
}

const holds = (motion, {value, field}) => (field ? (motion.facets[field] ?? []).some((v) => v.toLowerCase().includes(value)) : motion.text.includes(value));

/** Whether a motion meets every term of a parsed search. */
export const meetsQuery = (motion, terms) => terms.every((t) => holds(motion, t) !== Boolean(t.not));

/** Facets a motion must have all of what is picked; in any other, one of what is picked is enough. */
const ALL_OF = new Set(['tag']);

/** Whether a motion has what is picked, as `{facet: [values]}`, in every facet. */
export function meetsPicks(motion, picks) {
  return Object.entries(picks).every(([facet, chosen]) => {
    if (!chosen.length) return true;
    const has = motion.facets[facet] ?? [];
    return ALL_OF.has(facet) ? chosen.every((v) => has.includes(v)) : chosen.some((v) => has.includes(v));
  });
}

/** How many motions picking `value` as well would leave: what a filter's count says before it is picked. */
export function countWith(motions, terms, picks, facet, value) {
  const chosen = picks[facet] ?? [];
  const next = {...picks, [facet]: chosen.includes(value) ? chosen : [...chosen, value]};
  return motions.filter((m) => meetsQuery(m, terms) && meetsPicks(m, next)).length;
}
