# Tideframe

A tide-navy operations frame for software infrastructure. The field is a flat grid. Parts of a system are tiles on a rail. A phosphor-green current runs the conduit the sentence is about. A glass board prints the numbers. A geometric headline arrives wide and locks tight, and a green rule draws under it.

## Essence, and what it is not

- One dark teal field, a square grid, and a low horizontal wash of green, like a tide under glass. No spotlight, no sky, no horizon, no desk.
- Infrastructure is a flat schematic: rounded tiles on hairline conduits. Packets are the only things that travel, and only on the conduit being told.
- Two lights, with fixed jobs. Cyan (`grad`) is structure being drawn: a conduit's head, a kicker, a token. Green (`data`) is whatever is live: the packets, the locked rule, the one row, the one figure.
- A headline is kinetic and then still. It tracks from wide to tight and a green rule locks under it. After that it does not move.
- A board is a typeset instrument: hairline rows, mono figures, one row in green. It is not a window, and it has no chrome, cursor or shadow on a desk.

Not Screen Desk (a pale desk, app windows, a cursor and a tutorial). Not Iso Works (isometric buildings and stacks of cubes on a pale floor). Not Night Diagram (a science diagram in a starry sky, where light itself is the event). Not Stage Light (one warm spotlight and condensed amber figures on neutral black). Not Idea Map (typed terms on a pale sheet, the underline being the relation). Not Field Atlas (a paper map). Not Red Pencil (a printed page judged by a red pencil: nothing here is a document being marked). Not Marker Margin (handwriting on footage the maker brings: this motion draws its own ground, sets type, and uses no footage and no handwriting).

## Ground and material

`field.tsx` draws the ground: `bg`, a square grid in `faint` every 64 px down to the caption band, a soft cyan pool in the upper left, and a wide green wash low in the frame (`wash`, kept under a fifth). A fine grain keeps the flat colour from banding. Tiles are `panel2` with a 16 px corner and a 1.5 px edge. Boards are `panel` glass, one hairline, no drop shadow. Nothing is glossy, extruded or isometric. The projection never tilts.

## Colour roles

- `bg`, `panel`, `panel2`: field, glass, tile. Three depths of the same teal, never a second hue.
- `border`: settled conduits, row rules, idle edges.
- `faint`: the grid, column heads, an idle pip.
- `grad` cyan: a conduit while it is drawing and its head, kickers, step indexes, the chip around a token. Never a fill of a tile or a row.
- `data` green: packets, the rule that locks a headline, a live pip and its load bar, the one focused row (a 3 px bar and its figure), the figure a comparison is arriving at, the corner brackets of a claim. One green subject at a time. A second live tile waits until the first has settled to idle.
- `text`: names, headlines, the figure in focus. `muted`: roles, notes, the figure being left behind.

No amber, no red, no brand purple. A gain and a loss are told by which figure is green, not by a third colour.

## Type and captions

Outfit (`display`) for headlines (72 to 104 px, weight 700, tracking from about 0.18 em down to −0.03 em), tile names (36 to 44 px) and the two figures of a comparison (96 to 128 px). Source Sans 3 (`sans`) for roles, row labels and definitions (22 to 32 px). IBM Plex Mono (`mono`) for kickers, indexes, tokens and every figure in a board (15 to 28 px, tracked uppercase for labels, tabular numerals for numbers). Chinese: Noto Sans SC with Outfit and with Source Sans 3. Nothing under 15 px. The caption is a glass chip of `panel` with a green rule on its left, Source Sans 3 at 34 px, sitting in the clear band under the grid.

## Motion

Crisp, and finished before the next thing starts. A headline locks over `lock` (0.7 s) on `easing.lock` `[0.16, 1, 0.3, 1]`: tracking tightens, it rises a few pixels, then holds. The green rule draws under it over `draw` (0.9 s) on `easing.draw`. A tile rises a few pixels and fades in over `settle` (0.45 s) on the same lock curve, and does not bounce. A conduit draws from its start over `draw`; packets then travel at constant speed (linear), several of them, evenly spaced. A board row prints in `row` (0.22 s), top to bottom, the rule with the words. A comparison's figure counts on `easing.lock` and then holds. A change of frame is a cut on the beat, not a crossfade and not a camera move. The grid may drift a few pixels; nothing else idles. Never: a spring, a bounce, a spotlight sweep, a cursor, a desk shadow.

## Composition and framing

The sentence's subject takes the left or the centre and at least a third of the frame. A schematic sits on one horizontal rail, tiles hanging from it, three to five of them. The board is one panel, four columns at most, four to six rows. A comparison is two figures on one baseline with a hairline between, the one that matters on the right in green. Kickers stay above the thing they name. Keep the grid and every tile above the caption band (about y 900). Wide margins: 120 px at the sides. One claim in green per frame.

## Sound

Optional, and electronic rather than musical: a short click as a tile or a row lands, a scratch as a conduit draws, a soft tick while packets travel, a marimba as a figure counts. No voice.

## Components

- **ground** — Field (`react/parts/field.tsx`): The tide-navy field, its grid, the upper cyan pool and the low green wash. Fits: every scene, behind everything else.
- **title** — Lockup (`react/parts/lockup.tsx`): A kicker, a headline that tracks from wide to tight, a green rule that draws under it, and one subline. Fits: the claim a film opens on; a section name; the sentence a schematic is about to show.
- **mark** — Node (`react/parts/node.tsx`): A tile on the schematic: an index, a pip, a name, a role, and a load bar. Live is green; idle is the field's own teal. Fits: a service, a queue, a region, a model, a stage of a pipeline.
- **link** — Conduit (`react/parts/conduit.tsx`): A hairline route drawn from its first point, then green packets travelling it. Fits: the path work takes between tiles; a bus the tiles hang from; the one route the sentence follows.
- **data** — Board (`react/parts/board.tsx`): A glass status board: a kicker, column heads, rows that print downward, one focused row in green. Fits: lanes, regions or models compared in a few columns; the numbers behind a schematic.
- **compare** — Split (`react/parts/split.tsx`): Two figures on one baseline, the one left behind in mute and the one that matters in green, a hairline between. Fits: before and after; a target against a reading; two regions, one of them the point.
- **steps** — Stages (`react/parts/stages.tsx`): Named stages in a row, indexes in cyan, the current one underlined in green, connectors filling as the line moves on. Fits: the steps of a request, a deploy or a job, in order.
- **term** — Spec (`react/parts/spec.tsx`): A term, the token it is known by in a cyan chip, then what it means. Fits: a limit, a header, a metric name, a flag the film defines.
- **quote** — Callout (`react/parts/callout.tsx`): One sentence in the display face, bracketed by two green corners that draw on, the tracking tightening as it arrives. Fits: the claim a section ends on; one sentence, not a paragraph.

## Native moves

- **Lock the claim.** The kicker is already set; the headline tracks tight and the green rule draws. *Fits content like:* the question a film opens on; the name of a pipeline; the result, stated once.
- **Hang the tiles.** Tiles rise onto a rail that draws first, and the one the sentence names turns live. *Fits content like:* edge, queue and workers; three regions; a model and the two services beside it.
- **Run the current.** Packets travel only the conduit just drawn, at one speed. *Fits content like:* requests in flight; tokens through a batcher; jobs leaving a queue.
- **Print the board.** Rows print downward and the row being read turns green, its figure included. *Fits content like:* latency by lane; cost by region; errors by model.
- **Count the change.** Two figures, the old one mute, the new one counting to its value in green. *Fits content like:* p95 then and now; a quota against what is used.
- **Name the token.** The word, then the token in a chip, then the meaning. *Fits content like:* a limit the narration defines; a header; a metric.

## Treatments

- **Schematic.** One rail, tiles under it, one of them live, packets on that branch. The lockup sits above, left aligned. The rest of the frame stays grid.
- **Board.** The board takes the left half. A split or a single live tile takes the right. No second board.
- **Definition.** Stages across the top, or a spec on the left and a callout on the right. Not both a full board and a full schematic.

## Self-audit

- The frame is teal, cyan and one green, and the green is doing a job.
- No window chrome, cursor, desk, isometric cube, star, spotlight or handwritten word.
- A headline has finished locking before a conduit starts, or the conduit is clearly the subject and the headline is already still.
- The caption band is empty of tiles and type.
- Every number on screen came from the film's own sources.

## Avoid

- A second green subject. Fix: the previous tile goes idle when the next turns live.
- Cyan used as a fill. Fix: cyan is a stroke, a kicker or a chip edge.
- A bounce or a spring on a tile or a headline. Fix: `easing.lock`, then hold.
- A board that looks like a product's real interface, or a window on a desk. Fix: no traffic lights, no address bar, no cursor, no device; hairline rows on glass.
- Packets on every conduit at once. Fix: packets ride only the route being told.
- Type under 15 px, or a grid running through the caption. Fix: the grid stops at the caption band.
- Footage underneath, or a marker stroke. Fix: the field is the ground; words are set, not written.
- A map, a pencil on a printed page, or a stack of cubes. Those are other motions.
