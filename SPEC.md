# Motion format 0.1

> **Status:** Draft · **Version:** `motion/0.1`

What a motion is on disk: the files, their fields and the rules any tool can rely on. This document only grows: a later version adds to it and never changes the meaning of what is here.

## 1. What a motion is

A **motion** is a reusable look for narrated and explanatory video: how a film looks (ground, colour, type) and how it moves (how things arrive, change and leave). It is written so that a person or an agent can make a new film in it with any engine.

A motion holds no film. It has no story, script, scene list, timings or end card. A sample made in it is one example among many.

## 2. Files

A motion is a directory named after its slug. A copy taken into a project may sit in a directory of another name (`motion/`); its `slug` still names it:

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

## 3. `motion.json`

A JSON object with these members and no others, except extension members (§7).

| Member | Required | Value |
| --- | --- | --- |
| `spec` | yes | `"motion/0.1"` |
| `slug` | yes | 3 to 40 characters of `a-z`, `0-9` and single hyphens, starting and ending with a letter or digit; the name of the directory it is published in (§2) |
| `version` | yes | A [Semantic Versioning 2.0](https://semver.org) version of this motion, for example `"1.0.0"` |
| `name` | yes | A localized string (§8) of at most 60 characters per language |
| `line` | yes | A localized string (§8) of at most 160 characters per language: one sentence saying what it looks like and what it is for |
| `authors` | yes | A non-empty array of `{ "name": string, "github": string }`; `github` is a GitHub username |
| `license` | yes | `{ "text": SPDX, "code": SPDX }`: `text` covers the documents, tokens and pictures; `code` covers any code under a tool directory and is required when there is any |
| `lang` | no | The [BCP 47](https://www.rfc-editor.org/info/bcp47) tag of the language `MOTION.md` is written in; `"en"` when absent |
| `tags` | no | Up to 10 keywords, each of `a-z`, `0-9` and single hyphens, in English |

An SPDX value is an [SPDX license expression](https://spdx.github.io/spdx-spec/v2.3/SPDX-license-expressions/), for example `"CC-BY-4.0"` or `"MIT"`.

```json
{
  "spec": "motion/0.1",
  "slug": "lab-notebook",
  "version": "1.0.0",
  "name": { "en": "Lab Notebook", "zh-CN": "实验手记" },
  "line": { "en": "A squared notebook page where the diagram is drawn stroke by stroke as it is explained." },
  "authors": [{ "name": "VisoTalk", "github": "motionhub-dev" }],
  "license": { "text": "CC-BY-4.0", "code": "MIT" },
  "tags": ["hand-drawn", "line-art", "light"]
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

Any other sections may follow, in any order. A number in the text says where it comes from when that matters: measured, from a source, or chosen.

`MOTION.<lang>.md` is a translation of `MOTION.md` into the language `<lang>` (a BCP 47 tag). It follows the same rules and says nothing `MOTION.md` does not.

## 6. `poster.jpg` and `CREDITS.md`

- `poster.jpg` is a JPEG frame of a film made in the motion: between 960 and 3840 pixels wide, at most 500 KB. It shows the look, not a title card.
- `CREDITS.md` names every font, image, sound, model or other asset the motion's files use or require, with its licence and where it comes from, and any work the motion learned from. A motion that uses none says so.

## 7. Extensions

Everything that belongs to one tool lives in that tool's space, and every other tool ignores it.

- **Directories.** A tool keeps its files in a directory named after it (`visotalk/`, `remotion/`): 2 to 40 characters of `a-z`, `0-9` and single hyphens.
- **Members.** A tool keeps its own `motion.json` members under one member named `x-<tool>`, for example `"x-visotalk": { "caption": {}, "pacing": {} }`.
- **Rule.** A tool reading a motion ignores directories and `x-` members it does not know, and does not report them. It never writes into another tool's space.

What several tools come to share moves into a later version of this format.

## 8. Languages

| Part | Language |
| --- | --- |
| File and directory names, member names, `slug`, `spec`, `version`, `license`, `tags`, token names, the start of the five `MOTION.md` headings | English (identifiers) |
| `name`, `line` | A localized string: an object whose keys are BCP 47 tags and whose values are text in that language. `en` is required; other languages are optional |
| The body of `MOTION.md`, translations, `$description`, `authors[].name`, `CREDITS.md`, words drawn in a film | Any language |

## 9. Versions

A motion's `version` changes whenever any of its files change. A published version is never changed: a fix is a new version. A film that uses a motion keeps the copy it took.

`spec` names the version of this format. A tool that meets a `spec` it does not know does not guess its meaning.
