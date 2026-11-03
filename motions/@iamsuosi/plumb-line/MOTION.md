# Plumb Line

A brass weight on a line, let down through sheets of cut paper beside a card of real measures: the film is one long descent, and its turn is the moment you pull back and see the whole thing true to scale.

## Essence, and what it is not

- Everything stands on one axis. Every sheet, figure and label is placed by its real depth through one camera, so a move can never lie about scale.
- The weight is what you follow: it drops, the figure runs, and the card beside it slides past real ticks.
- The picture changes by going further, never by cutting. Each level has something you can recognise.
- The payoff is the pull-back: the proportions the close-ups hid, shown at last.

Not Depth Stage (a place's silhouettes receding under a perspective camera; here no perspective, and the motion is along a measured axis). Not Night Diagram (a dark field and instruments around one subject; here the axis is the subject). Not Earth Block (one solid that opens; here flat sheets, too long for one screen). Not Watercolor Tale or Riso Pop: it is paper you could cut, with no brush and no ink.

## Ground and material

`Strata` is the ground: sheets of plain cut paper, each with a soft wavy edge that shades the next one below. They are flat colour, darkening as they go. Figures are flat cut paper too (`Cutouts`). The only other material is the cream card of `Gauge`, `Bob` and `Callout`, which lies on top of everything. The only glows are real lights: `Rays` from above, `Sparks` in the dark. No gradients on the sheets, no outlines, no texture.

## Colour roles

- The sheets are one hue walking from light to dark along the axis; a film about the sky walks the other way.
- `panel` cream is the card: every measured thing is written on it, in `text` ink, with `muted` notes.
- `grad` brass belongs to the weight alone.
- `warn` amber and a pale tint are for figures. One warm thing in the light, pale things in the dark. Lights are one pale yellow.

## Type and captions

Fraunces at 800 for the question (68 to 72 px) and the running figure (58 px), at 700 for zone names and card labels (38 px). Atkinson Hyperlegible Next for notes (28 px) and captions. JetBrains Mono 28 px for ticks, sources and small print. Chinese: Noto Serif SC for Fraunces' roles, Noto Sans SC for the rest. The caption is the same cream card, centred. Keep captions short: a long one runs into the depth card.

## Motion

- The camera is `at` and the logarithm of `scale`, tweened together and eased over 2.5 to 3 s, so a change of scale feels steady. One unbroken take: never a cut.
- The weight's `d` moves with the camera, and its figure runs to a rounded value.
- Sheets stir slowly with `clock`; figures swim slightly. Nothing is ever still.
- Lights pulse at their own times. A card's line draws, then the card arrives; it leaves before the camera moves.

## Composition and framing

The depth card takes the right 350 px, and the weight hangs just left of it. The picture is everything left of that. Keep figures and leaders above y 880 by drawing them inside a `data-camera` box. Hold each stop so that one zone nearly fills the frame, with its two ticks in view. Cards go to the empty side of what they name.

## Sound

A descent: the room gets quieter as you go. A low tone under the deep part; nothing at all at the pull-back until the last line.

## Components

- **compare** — Thing for scale (`react/parts/standard.tsx`): Something everybody knows the size of, cut from pale paper and raised to its true height on the same axis as everything else. Fits: a mountain in a trench, a skyscraper in the twilight zone, a person against a dinosaur
- **data** — Depth card (`react/parts/gauge.tsx`): A strip of cream card pinned down the right of the frame, with true ticks that slide as the camera moves and each zone's name beside its span. Fits: every scene: it is what makes the picture a measurement
- **ground** — Cut-paper strata (`react/parts/strata.tsx`): The whole height of the subject as sheets of cut paper, each with a wavy edge and a soft shadow on the sheet below, darkening as they go, all placed at their true depth. Fits: every scene: the sea, the sky, the Earth's interior, a tall building
- **mark** — Plumb bob (`react/parts/bob.tsx`): A brass weight on a line let down from the top of the frame, carrying a card with how far it has gone, the figure running as it drops. Fits: every descent or climb: the one thing the viewer follows
- **mark** — Falling light (`react/parts/rays.tsx`): Pale shafts from the top of the subject that thin out and end at the depth the light really reaches. Fits: sunlight in water, heat from above, anything from the surface that gives out on the way down
- **mark** — Points of light (`react/parts/sparks.tsx`): Small lights that pulse on and off through one dark span, each at its own time, the only bright things left on the sheet. Fits: animals that glow, stars, city lights from above: what shows up once the background has gone dark
- **term** — Card label (`react/parts/callout.tsx`): A small piece of the same cream card, tied by a thin line to a point at its true depth, with a name, a note and where the figure comes from. Fits: naming what is at a level, or the one number that belongs to it
- **term** — Paper cutouts (`react/parts/cutouts.tsx`): Flat cut-paper figures, each with a soft shadow, hung at the depth where they really belong and moving with the sheets behind them. Fits: who or what lives at each level: fish, planes, climbers, satellites; pass your own outline in d
- **title** — Question (`react/parts/heading.tsx`): The question in a heavy old-style serif, top left of the first sheet, gone as soon as the line starts down. Fits: stating what the descent will answer

## Native moves

- **Let the line down.** The weight drops, its figure runs and the sheets slide up past the camera. *Fits content like:* how deep the sea goes; a drill into the Earth; climbing through the atmosphere.
- **The light gives out.** Shafts from the top thin to nothing at the depth they really reach. *Fits content like:* sunlight in water; how far heat reaches; signal strength with distance.
- **Only what makes its own.** The sheets go dark and small lights come on across a whole span. *Fits content like:* living light; city lights; stars after sunset.
- **Something you know, at its depth.** A recognisable figure hangs at its true level with a card. *Fits content like:* a famous wreck; a jet's cruising height; the deepest mine.
- **Pull back to true scale.** One move from the close-up to the whole axis on one screen; figures shrink with it. *Fits content like:* the turn in any film about proportion.
- **Stand a known thing in it.** Something everybody knows rises to its true height on the same axis. *Fits content like:* a mountain in a trench; a tower against the clouds.

## Avoid: pitfalls

- A figure drawn at full size after the pull-back lies about scale. Fix: `Cutouts` shrink below `full`; keep it set.
- A stop with no ticks in view is just a colour. Fix: frame two ticks.
- A long caption runs under the depth card. Fix: under about 70 characters.
- Figures on the wrong sheet make the axis meaningless. Fix: real depths, or say that it is illustrative.
- A camera per part drifts apart. Fix: one `useCam`; tween `at` and `ls` on every part that reads them.

## Freedom in each work

Each film decides the axis and its unit, the hue the sheets walk through, what stands at each level, what its weight is measuring beside distance, and what it finally pulls back to reveal. Far-apart structures: one descent with one reveal; up and then down again; the same axis visited twice, then and now.
