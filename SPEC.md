# Motion format 0.6

> **Status:** Draft · **Version:** `motion/0.6` · what each version added: §10

What a motion is on disk: the files, their fields and the rules any tool can rely on. This document only grows: a later version adds to it and never changes the meaning of what is here.

## 1. What a motion is

A **motion** is a reusable look for narrated and explanatory video: how a film looks (ground, colour, type) and how it moves (how things arrive, change and leave). It is written so that a person or an agent can make a new film in it with any engine.

A motion holds no film. It has no story, script, scene list, timings or end card. A sample made in it is one example among many.

## 2. Files

A motion is a directory named after its slug, or since `motion/0.5` a single `MOTION.md` (§11). A copy taken into a project may sit in a directory of another name (`motion/`); its `slug` still names it:

```
<slug>/
  motion.json      identity, authorship and licence          required
  MOTION.md        how it looks and moves, for agents        required
  tokens.json      colours and faces, in the DTCG format     required
  poster.jpg       one representative frame                  required
  CREDITS.md       fonts, assets and sources                 required
  MOTION.<lang>.md a translation of MOTION.md                optional
  <tool>/          files one tool needs (§7)                  optional
```

No other file may sit at the top of a motion. Names are exact and case-sensitive.

Where many motions are kept together, a scoped motion's directory sits in a directory named after its scope with an `@` before it: `@ana/ledger-pencil/` (§3, Identity).

## 3. `motion.json`

A JSON object with these members and no others, except extension members (§7).

| Member | Required | Value |
| --- | --- | --- |
| `spec` | yes | `"motion/0.6"`; or `"motion/0.5"` for a motion whose parameters' defaults are not held to their types, `"motion/0.4"` for one not held to §12, `"motion/0.3"` for one also without `fit`, `"motion/0.2"` for one without `fit` and `basedOn`, or `"motion/0.1"` for one without `fit`, `scope` and `basedOn` |
| `scope` | no | The GitHub username, in lowercase, of the person or organization that publishes the motion (since 0.2) |
| `slug` | yes | 3 to 40 characters of `a-z`, `0-9` and single hyphens, starting and ending with a letter or digit; the name of the directory it is published in (§2) |
| `version` | yes | A [Semantic Versioning 2.0](https://semver.org) version of this motion, for example `"1.0.0"` |
| `name` | yes | A localized string (§8) of at most 60 characters per language |
| `line` | yes | A localized string (§8) of at most 160 characters per language: one sentence saying what it looks like and what it is for |
| `authors` | yes | A non-empty array of `{ "name": string, "github": string }`; `github` is a GitHub username |
| `license` | yes | `{ "text": SPDX, "code": SPDX }`: `text` covers the documents, tokens and pictures; `code` covers any code under a tool directory and is required when there is any |
| `lang` | no | The [BCP 47](https://www.rfc-editor.org/info/bcp47) tag of the language `MOTION.md` is written in; `"en"` when absent |
| `tags` | no | Up to 10 keywords, each of `a-z`, `0-9` and single hyphens, in English |
| `basedOn` | no | The motions this one builds on: an array of 1 to 10 `{ "id": string, "version": string }`, each a motion's id (Identity) and, optionally, the version built on; no id twice, and never the motion's own (since 0.3) |
| `fit` | no | What the motion is for: `{ "for": localized string, "not": localized string }`, each string at most 200 characters per language; each is optional, and a `fit` has at least one (since 0.4; What it is for) |

### Identity

A motion's **id** is `@<scope>/<slug>` when it has a scope, and `<slug>` when it does not: `@ana/ledger-pencil`, `red-pencil`. Two motions under different scopes may have the same slug. Only the owner of a GitHub account publishes under its scope; what an unscoped id means is for the collection that holds it to say (motionhub accepts none: every motion there has a scope). Tools name, fetch and credit a motion by its id.

### Building on another motion

A motion made from another names it in `basedOn`, by its id and the version it started from: `"basedOn": [{ "id": "red-pencil", "version": "1.0.2" }]`. This is the credit tools show and follow; `CREDITS.md` still says what was taken and what changed, as its licence asks. A tool does not require a motion named in `basedOn` to be at hand.

### What it is for

`fit` tells a person or an agent choosing a look for a film whether this one will carry it:

- `for` says, in a sentence, the subjects and kinds of film it is for, and any footage the maker must bring (a person speaking, a screen recording) when it is drawn over that.
- `not` says what it handles badly, where that is not obvious from `for`.

A tool choosing a motion matches the film's subject against `for` and leaves out a motion whose `not` covers it. `fit` may also carry a `kind`, which earlier said what sort of motion it was; it is no longer used, a writer leaves it out, and a reader ignores it, whatever its value.

An SPDX value is an [SPDX license expression](https://spdx.github.io/spdx-spec/v2.3/SPDX-license-expressions/), for example `"CC-BY-4.0"` or `"MIT"`.

```json
{
  "spec": "motion/0.4",
  "scope": "ana",
  "slug": "lab-notebook",
  "version": "1.0.0",
  "name": { "en": "Lab Notebook", "zh-CN": "实验手记" },
  "line": { "en": "A squared notebook page where the diagram is drawn stroke by stroke as it is explained." },
  "authors": [{ "name": "Ana", "github": "ana" }],
  "license": { "text": "CC-BY-4.0", "code": "MIT" },
  "tags": ["hand-drawn", "line-art", "light"],
  "fit": {
    "for": { "en": "How things work, worked out by hand: physics, chemistry, maths and engineering, drawn as they are explained." },
    "not": { "en": "Brand films and stories with no mechanism to draw." }
  }
}
```

## 4. `tokens.json`

The motion's values in the [Design Tokens Format Module](https://www.designtokens.org/) of the W3C Design Tokens Community Group (DTCG), version 2025.10. Any tool that reads DTCG reads it.

- It has a `color` group and a `font` group, each with at least one token.
- `color` tokens are of type `color`; `font` tokens are of type `fontFamily`. A group may set `$type` once for its members.
- A token name contains no `$`, `{`, `}` or `.`, and is written in English (it is an identifier).
- Every colour and face the motion relies on is a token. A token's `$description` says what it is for, in any language.
- Other groups are allowed and are read as plain DTCG. For timing, use `duration` tokens and `cubicBezier` tokens; seconds, not frames.
- Values are literal or DTCG aliases (`"{color.ink}"`). No value refers to a file or a URL.

```json
{
  "color": {
    "$type": "color",
    "ground": { "$value": { "colorSpace": "srgb", "components": [0.98, 0.98, 0.96], "hex": "#FBFAF5" }, "$description": "the page" },
    "ink": { "$value": { "colorSpace": "srgb", "components": [0.11, 0.16, 0.28], "hex": "#1B2A47" }, "$description": "every line and word" },
    "accent": { "$value": { "colorSpace": "srgb", "components": [0.81, 0.31, 0.2], "hex": "#CF4F33" }, "$description": "the one result, never decoration" }
  },
  "font": {
    "$type": "fontFamily",
    "display": { "$value": ["Shantell Sans", "LXGW WenKai", "cursive"] },
    "sans": { "$value": ["Atkinson Hyperlegible Next", "Noto Sans SC", "sans-serif"] }
  },
  "duration": { "$type": "duration", "enter": { "$value": { "value": 0.6, "unit": "s" } } },
  "easing": { "$type": "cubicBezier", "arrive": { "$value": [0.22, 1, 0.36, 1] } }
}
```

## 5. `MOTION.md`

Markdown, at most 16 KB, in the language `lang` names. It is what an agent follows to make a film in this motion, so it describes the look and the motion, never a particular film.

It has a level-two heading for each of these five topics. The heading starts with the English word, which tools match without regard to case; any words may follow it (`## Motion 动法`).

| Heading | Says |
| --- | --- |
| `Essence` | The few traits that make a frame read as this motion at a glance, and what it is easily confused with |
| `Colour` (or `Color`) | What each colour token is for, and what is never coloured |
| `Type` | The faces and their roles, sizes, and how words sit in the frame |
| `Motion` | How things arrive, change and leave; the easing; how motion relates to narration or music; what never moves |
| `Avoid` | The mistakes this look invites, and what to do instead |

A motion with components (§12) also has a `Components` section, saying what each one is for (since 0.5).

Any other sections may follow, in any order. Two are recommended, and neither is required:

| Heading | Says |
| --- | --- |
| `Treatments` | A recipe for each kind of frame this look makes: what is the focal point, how much stays empty, what is fixed and what is free, how dense it is. It describes the layout, never a particular film's content |
| `Self-audit` | What to check before a film in this look is finished |
 A number in the text says where it comes from when that matters: measured, from a source, or chosen.

`MOTION.<lang>.md` is a translation of `MOTION.md` into the language `<lang>` (a BCP 47 tag). It follows the same rules and says nothing `MOTION.md` does not.

## 6. `poster.jpg` and `CREDITS.md`

- `poster.jpg` is a JPEG frame of a film made in the motion: between 960 and 3840 pixels wide, at most 500 KB. It shows the look, not a title card.
- `CREDITS.md` names every font, image, sound, model or other asset the motion's files use or require, with its licence and where it comes from, and any work the motion learned from. A motion that uses none says so.

## 7. Extensions

Everything that belongs to one tool lives in that tool's space, and every other tool ignores it.

- **Directories.** A tool keeps its files in a directory named after it (`react/`, `remotion/`): 2 to 40 characters of `a-z`, `0-9` and single hyphens.
- **Members.** A tool keeps its own `motion.json` members under one member named `x-<tool>`, for example `"x-remotion": { "fps": 30 }`.
- **Rule.** A tool reading a motion ignores directories and `x-` members it does not know, and does not report them. It never writes into another tool's space.

What several tools come to share moves into a later version of this format, as `react/` has (§12).

## 8. Languages

| Part | Language |
| --- | --- |
| File and directory names, member names, `scope`, `slug`, `spec`, `version`, `license`, `tags`, token names, the start of the five `MOTION.md` headings | English (identifiers) |
| `name`, `line`, `fit.for`, `fit.not` | A localized string: an object whose keys are BCP 47 tags and whose values are text in that language. `en` is required; other languages are optional |
| The body of `MOTION.md`, translations, `$description`, `authors[].name`, `CREDITS.md`, words drawn in a film | Any language |

## 9. Versions

A motion's `version` changes whenever any of its files change. A published version is never changed: a fix is a new version. A film that uses a motion keeps the copy it took.

`spec` names the version of this format. A tool that meets a `spec` it does not know does not guess its meaning. A tool that reads a version reads every version before it: a `motion/0.1` motion is a `motion/0.2` motion without a scope, a `motion/0.2` motion is a `motion/0.3` motion without `basedOn`, and a `motion/0.3` motion is a `motion/0.4` motion without `fit`. A `motion/0.4` motion is a `motion/0.5` motion not held to §12, and a `motion/0.5` motion is a `motion/0.6` motion whose parameters' defaults are not held to their types (§12, Parameters).

## 10. Versions of this format

| Version | Adds |
| --- | --- |
| `motion/0.1` | The format: five files, `motion.json`, `tokens.json`, `MOTION.md`, extensions, languages |
| `motion/0.2` | `scope`, and a motion's id `@<scope>/<slug>` (§3, Identity) |
| `motion/0.3` | `basedOn`: the motions a motion builds on (§3, Building on another motion) |
| `motion/0.4` | `fit`: what a motion is for and what it handles badly (§3, What it is for). Changed in place while the format is below 1.0, by its maintainers' decision: `fit.kind` is no longer used and `fit.for` is optional; every motion valid before is valid still |
| `motion/0.5` | A motion in one file (§11), components as part of the format (§12), and a `Components` section and recommended sections in `MOTION.md` (§5) |
| `motion/0.6` | A vocabulary of parameter types, and a parameter's `default` as a value of its type (§12, Parameters). A motion at `motion/0.5` is read as before, and a tool may read its types by the same vocabulary, since they were free text |

## 11. A motion in one file

Since `motion/0.5`, a `MOTION.md` is a motion on its own. It starts with front matter that holds what the other files would:

```markdown
---
spec: motion/0.6
name: Clay World
tokens:
  color:
    floor: "#E8D5B7"
    ink: "#3A2A2C"
    title: "{color.ink}"
  font:
    display: ["Fredoka", "sans-serif"]
  duration:
    enter: 0.6s
  easing:
    arrive: [0.22, 1, 0.36, 1]
---

# Clay World

## Essence
```

Its body follows §5. Its front matter has these members, and may also have `x-<tool>` members (§7):

| Member | Required | Value |
| --- | --- | --- |
| `spec` | yes | `motion/0.5` or later |
| `name` | yes | At most 60 characters |
| `tokens` | yes | Its values, in the short form below |
| `lang` | no | As in §3 |

`tokens` has a `color` group and a `font` group, each with at least one token, and may have `duration` and `easing` groups. It says what §4 says, more shortly, and a tool reads it as these tokens:

| Group | A token is | Read as |
| --- | --- | --- |
| `color` | `"#RRGGBB"`, or an alias such as `"{color.ink}"` | A `color` token in `srgb` |
| `font` | A name, or a list of names | A `fontFamily` token |
| `duration` | Seconds or milliseconds: `0.6s`, `600ms` | A `duration` token |
| `easing` | `[x1, y1, x2, y2]` | A `cubicBezier` token |

Front matter is a small part of YAML, so a tool needs no YAML library to read it: `key: value` lines, maps nested by two spaces, strings plain or in double quotes, lists on one line as JSON, and whole-line comments. Nothing else is allowed. A colour is always quoted, since `#` would start a comment.

A motion in a directory (§2) may have front matter in its `MOTION.md`, but never `tokens`: its values are in `tokens.json`, so they have one source. Its `motion.json` says its version and its name.

A tool looking for a project's motion reads `MOTION.md` at the project's root, and otherwise `motion/MOTION.md`. A project may hold other design files too; this format says nothing about them. A project that uses several motions keeps them as §13 says.

## 12. `react/`

Since `motion/0.5`, the directory `react/` is part of the format. It is optional, like any tool directory (§7), and it holds a motion's components, which run in any React engine through a binding. A tool uses a motion's components first, and makes what they do not draw from the motion's words and tokens. Every motion can be made from its words and tokens alone.

```
react/
  parts/       the components, one in each .tsx or .jsx file
  assets/      the files they import
  previews/    a picture of each component: <file>.jpg
```

A component in `react/parts/`:

- imports only `react`, `@motionhub/runtime`, `three`, parts of those packages, and files by a relative path
- colours with `var(--color-<name>)` and sets type with `var(--font-<name>)`, from the motion's tokens
- takes its words, data, progress and video `src` as props
- exports a literal `meta` with `name`, `purpose`, `line`, `fits`, `params` (each with `type` and `doc`) and `preview`

`purpose` is what the component is for: one of `title`, `open`, `close`, `data`, `compare`, `steps`, `term`, `link`, `quote`, `mark`, `transition` or `ground`.

### Parameters

Each entry of `params` is `{type, doc, default?}`: its `type` and `doc` are strings, and `default`, when it is given, is the value the
component takes without one. Since `motion/0.6`, a `type` from this vocabulary means what it says, so a tool can build a control for
it (a field, a slider, a list of choices) and check a value against it:

| `type` | A value of it |
| --- | --- |
| `text` | Words a viewer reads |
| `string` | Any other string |
| `color` | A colour: the name of one of the motion's colour tokens (`ink`), or a CSS colour |
| `number` | A number |
| `px` | A length in the frame's pixels |
| `degrees` | An angle in degrees |
| `progress` | A share from 0 to 1, most often how far something has gone, animated |
| `boolean` | `true` or `false` |
| `[x, y]` | A point: two numbers, in the frame's pixels or the component's box |
| `text[]` | A list of words, each a string |
| `a \| b \| c` | One of the choices written: words of `a`–`z`, `0`–`9` and hyphens, or numbers (`1 \| -1`, `0.5 \| 1`), joined by ` \| ` |

Any other `type` (`list`, `object`, a shape such as `{label, value}[]`) is free text that `doc` explains, and a tool leaves it to code.
Since `motion/0.6`, a `default` is a value of its type, or `null` for none: a description of what happens without one goes in `doc`
(`upTo: {type: 'number', default: null, doc: 'the last step drawn; all of them without one'}`). A `default` that is not a literal (a
name, a call) is not checked. The `meta` is read as data, never run.

## 13. A project's motions

A film can be made in more than one motion: one look for its titles and another for its data, or a look for each part of a long film. A project keeps the motions it uses in a directory `motions/` at its root:

```
motions/
  @iamsuosi/red-pencil/    a copy taken from a hub, at its id
  @ana/ledger-pencil/
  my-look/                 a motion of the project's own
```

- **A copy taken from a hub** sits at its id: `motions/@<scope>/<slug>/`, whose `motion.json` names that scope and slug. It is the motion as published, never changed in place: a project that wants it otherwise copies it to a directory of its own and changes that, naming the original in `basedOn` (§3).
- **A motion of the project's own** is any other directory directly in `motions/`, named as its maker likes with `a-z`, `0-9` and single hyphens. It is a motion in a directory (§2), or a directory holding only a motion in one file (§11). Its name in the project is its directory's; its id is still the one its `motion.json` gives, if any.
- A name starting with `@` is only ever a scope, so a project's own motion never collides with a copy from a hub, nor two copies with each other.

A tool looking for a project's motions reads the one §11 finds, if there is one, and every motion in `motions/`. Which motion draws which scene is the film's own matter: a tool names it by its id or its directory where it plans that scene, and this format says nothing about it. A binding gives each motion's components that motion's tokens only, so a component drawn in one motion never reads another's, even in the same frame.

This section adds no member to a motion and changes no motion's meaning, so it needs no new `spec`: it says only where a project keeps the motions it holds. What a tool records about them (where a copy came from, at which version) is that tool's own, such as `motions.lock.json` for `@motionhub/cli`.
