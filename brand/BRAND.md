# The motionhub brand

The site is quiet so the motions can be loud. motionhub's own look is paper and ink, one ordinary type family, and
one vermilion that belongs to the logo. Everything here is the source the site and the logo files are made from.

## Files

| Path | What it is |
| --- | --- |
| `brand.tokens.json` | The tokens, in the [W3C Design Tokens Format](https://www.designtokens.org/tr/2025.10/format/): colours for the light and dark themes, font stacks, weights, sizes and radii. The one place a colour or a size is decided |
| `tokens.css` | The tokens as CSS custom properties (`--color-bg`, `--font-ui`, `--size-base`, …). Generated: `node tools/brand.mjs` |
| `logo/logo.svg`, `logo/logo-dark.svg` | The lockup, mark and wordmark, for light and dark grounds |
| `logo/mark.svg` | The mark alone |
| `logo/wordmark.svg` | The wordmark alone, in `currentColor` |
| `logo/icon.svg`, `logo/icon-light.svg`, `logo/icon-16.svg`, `logo/icon-square.svg` | The app icon: on ink (the default), on paper, one ball for 16 px and below, and square-cornered for platforms that round their own |
| `favicon/` | What a browser asks for: `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `site.webmanifest`. `tools/build.mjs` copies them to the site's root |
| `social/og-default.svg`, `social/og-default.png` | The 1200×630 share card a page without its own uses |
| `source/build-logo.py` | Draws every file in `logo/`, `favicon/` and `social/` |
| `source/OFL-InstrumentSerif.txt` | The licence of the wordmark's typeface |

## Colour

| Token | Light | Dark | Used for |
| --- | --- | --- | --- |
| `bg` | `#F3EEE4` | `#1A1714` | the page: paper |
| `surface` | `#FBF8F2` | `#221E1A` | inputs, code, panels on the page |
| `surface-2` | `#EAE2D4` | `#2C2722` | selected and hover |
| `line` | `#DDD3C3` | `#3B342D` | borders and rules |
| `text` | `#2A2622` | `#F1EBE0` | headings, primary buttons |
| `text-2` | `#4A453E` | `#D3CABC` | body copy |
| `muted` | `#6B645A` | `#A89E90` | labels, counts, captions |
| `mark` | `#E2442B` | `#FF6A4D` | the logo, and nothing else |
| `like` | `#C24A33` | `#FF7A5E` | a like that has been given, and nothing else |

- The interface is ink on paper. Buttons, links and focus are `text`, not a colour: colour on the page is the
  motions' posters and samples.
- Vermilion is two tokens with two jobs. `mark` is the logo; `like` is a like the viewer has given. Neither is an
  accent, a link colour or a warning.
- Every text colour reads on every ground at WCAG AA (4.5:1), and `mark` and `like` at 3:1. `tests/brand.test.mjs`
  holds the tokens to it, so a colour that fails does not merge.
- Dark follows the system unless a page sets `data-theme="light"`; `data-theme="dark"` forces it.

## Type

- **Inter** for Latin and figures, at 400, 500 and 600. Chinese is set in **Noto Sans SC** where it is installed and
  otherwise in the system's own: PingFang SC on Apple devices, Microsoft YaHei on Windows, Noto Sans CJK on Android.
  The site does not download a Chinese font: its pieces would be most of a page's weight, and every system has a good
  one.
- **JetBrains Mono** for commands, file names, versions and hex values.
- Sizes are few: 12, 13, 14 (body), 16, 20, 26 and 30 px. The interface is compact; a motion's name is the largest
  thing on its page.
- **Instrument Serif** is the wordmark's typeface and appears nowhere else. It ships as outlines in the logo files,
  never as a font on a page.

All four are under the SIL Open Font License 1.1. The site serves Inter and JetBrains Mono itself, not from a font
service.

## The logo

The mark is a ball in flight with its in-betweens, four circles rising up and to the right, the earlier ones fainter.
It reads as movement in one direction, which is what a motion gives a film.

- The mark always leans up and to the right. Do not mirror, rotate or reorder it.
- The wordmark is `motion` in roman and `hub` in italic, lower case, one word.
- In the lockup the mark is a little shorter than the wordmark's ink and sits centred on it, a quarter of the font
  size apart. Keep clear space of at least the height of the `h` around it.
- On paper or white use `logo.svg`; on ink use `logo-dark.svg`; on anything else use `wordmark.svg` in one colour
  that reads on it, without the mark.
- Below 24 px use an icon, not the lockup; at 16 px use `icon-16.svg`.
- Do not recolour the mark, add effects, set the wordmark in another typeface, or put the logo on a poster.

## Changing it

- A colour, size or font: edit `brand.tokens.json`, then `node tools/brand.mjs` (or `npm run brand`) to write
  `tokens.css`. `node tools/brand.mjs --check` and `npm test` fail while it is out of date.
- The logo, icons or share card: they are drawn from the mark's geometry in `source/build-logo.py` and the tokens'
  colours. Download Instrument Serif's two styles (github.com/google/fonts, `ofl/instrumentserif`), then

  ```
  pip install fonttools          # and librsvg for rsvg-convert
  python3 brand/source/build-logo.py InstrumentSerif-Regular.ttf InstrumentSerif-Italic.ttf
  ```

  Commit what it writes. The tests check that every SVG uses the brand's colours only and needs no font or script.
