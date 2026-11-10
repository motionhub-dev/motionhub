// A component's params (SPEC.md §12, Parameters) as a Remotion composition's schema: each param whose type is in the vocabulary
// becomes a zod field, described by its doc, so Remotion Studio edits it; any other is left to code and kept as it is. zod is the
// project's own (pass `z`), since Remotion wants its version. No Remotion here, so it is tested on its own (test.mjs).

const TYPES = {
  text: (z) => z.string(),
  string: (z) => z.string(),
  color: (z) => z.string(),
  number: (z) => z.number(),
  px: (z) => z.number(),
  degrees: (z) => z.number(),
  progress: (z) => z.number().min(0).max(1),
  boolean: (z) => z.boolean(),
  '[x, y]': (z) => z.tuple([z.number(), z.number()]),
  'text[]': (z) => z.array(z.string()),
};

/** The types of the vocabulary a field is made for */
export const PARAM_TYPES = Object.keys(TYPES);

/** The choices of a type written `a | b | c` (words or numbers, none of them a type of the vocabulary or null); null for any other type */
export function paramChoices(type) {
  if (!/^[a-z0-9-]+( \| [a-z0-9-]+)+$/.test(type)) return null;
  const words = type.split(' | ');
  return words.some((w) => w in TYPES || w === 'null') ? null : words;
}

/** The zod field for one param, or null when its type is outside the vocabulary */
function field(param, z) {
  let f = TYPES[param.type]?.(z) ?? null;
  const choices = f ? null : paramChoices(param.type);
  if (choices) f = choices.every((c) => /^-?\d+(\.\d+)?$/.test(c)) ? z.union(choices.map((c) => z.literal(Number(c)))) : z.enum(choices);
  if (!f) return null;
  if (param.default === null) f = f.nullable();
  else if (param.default === undefined) f = f.optional();
  return f.describe(param.doc);
}

/**
 * A composition's `schema` for a component, from its `meta`: `schema={paramsSchema(meta, z)}`. A param of a type outside the
 * vocabulary is not in it, and passes through untouched; one with no default is optional, one whose default is null is nullable.
 */
export function paramsSchema(meta, z) {
  const shape = {};
  for (const [name, param] of Object.entries(meta?.params ?? {})) {
    const f = field(param, z);
    if (f) shape[name] = f;
  }
  return z.looseObject ? z.looseObject(shape) : z.object(shape).passthrough();
}

/** A composition's `defaultProps` for a component, from its `meta`: every param's default, where it has one */
export function paramDefaults(meta) {
  return Object.fromEntries(Object.entries(meta?.params ?? {}).filter(([, p]) => p.default !== undefined).map(([name, p]) => [name, p.default]));
}
