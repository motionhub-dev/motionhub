# Idea Map

A concept map set in type on a cool layout sheet: each term stands on its own underline, which runs on as the line to the next term, drawn to say the relation.

## Essence, and what it is not

- Every term is typeset on a rule; its lines leave and arrive along the rule, so a relation reads as the underline running on.
- The stroke is the relation, never the colour: solid arrow causes, dashed contributes, chevrons lead to, dots to a ring are part of, a T-bar blocks, a double line opposes.
- A verb sits in a gap cut in its line, in italic.
- Pictures before words: a line pictogram over a word or two, acting out what is said; few glosses.
- A line comes before the term it reaches. One red for what matters now.

Closest is Lab Notebook, handwriting and drawings on squared paper; here words are typeset, lines ruled, and what is drawn is relations. Not Evidence Board (no cards, pins or thread), not a mind-map app (no bubbles, radial branches or colour coding).

## Ground and material

`sheet.tsx`: a cool off-white sheet (`bg`) with a faint cross every 160 px (`faint`) under one camera, between the running head (y 200) and the captions (y 900). Rules 3 px, 6 for an event, doubled for a root cause. A term may be a large pictogram (`kind: picture`) that multiplies, bursts, spins, beats or fills (`act`); carry a small one, a framed `image` or ruled `items`; be a figure or a quote; or be struck out.

## Colour roles

- `text`: every term, rule and line. `muted`: glosses, indices, sources. `border`: a dimmed term.
- `op`: the one red: the active term or line, a root tab, a bracket, a share's heavy run, a chart's marked bar.
- `data`: figures, in ink. `panel`: the locator's card.
- `grad`, `good`, `bad`, `warn` are unused: kinds are told by stroke.

## Type and captions

Hanken Grotesk (`sans`) for terms (46 to 80 px) and figures; Newsreader italic (`display`) for glosses and verbs (40 to 42); JetBrains Mono (`mono`) for indices and sources. Chinese: Noto Sans SC terms, Noto Serif SC 500 upright glosses, broken between words, a thin space beside Latin and digits. The caption sits on the sheet: Hanken 36 with a short red rule at its left.

## Motion

Grow the map with `grow`, a step per term on its word: the line runs out with a red nib (0.8 to 1.5 s), its verb appearing as the nib passes; the term's rule runs out, its pictogram draws stroke by stroke, the word stands, then it acts. A new cause is reached by a line run back out of the map. A `flow` line carries marks along it. Views change over 1.2 to 1.8 s; riding a line the crosses streak. Figures count up; units and bars draw in turn. Nothing bounces.

## Composition and framing

Let the map lay itself out (`flow`, wrapped into rows; `down`; `cycle`), and vary it from map to map; `beside`, `rank`, `order`, x and y last. Frame shots with `views` (and `grow` for what stands beside terms), never a computed camera. Under zoom 0.8 only terms and lines show. A condition sits above the stage it feeds, a part below its whole.

## Sound

Optional: a tick, a pen line, a marimba.

## Components

- **compare** — Two branches (`react/parts/compare.tsx`): Two terms side by side, points under each, joined by one relation; one side marked. Fits: two outcomes of one cause; before and after; two options
- **data** — Ruled chart (`react/parts/chart.tsx`): Bars ruled from zero, or one line on a valued scale with a reference mark; an estimate drawn open. Fits: a value and its forecast; a few groups; a series against a target
- **data** — Figure on a rule (`react/parts/figure.tsx`): A large figure on its rule beside a term, counted up, its source under it; a share as a heavy run. Fits: what a cause cost; a share of a whole
- **data** — Unit chart (`react/parts/units.tsx`): A share as a row of pictograms counted in, the share in red: three in ten without a sentence. Fits: one in three prescriptions; four in five households; nine in ten species
- **ground** — Sheet and camera (`react/parts/sheet.tsx`): A cool layout sheet with faint registration crosses, under one camera. Fits: every scene; the map inside is in map pixels
- **link** — Key of relations (`react/parts/key.tsx`): A sample of each kind of line the map uses, and what it means. Fits: the first time two kinds of relation meet
- **link** — Relation (`react/parts/relation.tsx`): A line run on from a term's rule; its stroke is the relation, its verb sits in a gap. Fits: a cause; a stage turning into the next; a part; a fix that blocks
- **mark** — Bracket (`react/parts/bracket.tsx`): A red square bracket along a group of terms, with a short note. Fits: the loop in a cycle; the root causes; the part a fix touches
- **mark** — Pictogram (`react/parts/pictogram.tsx`): A large line pictogram drawn stroke by stroke, then acting: multiplying, bursting, turning, beating, filling. Fits: bacteria multiplying; a cell bursting; a machine running; a heart beating; a reservoir filling
- **steps** — Idea map (`react/parts/map.tsx`): A map laid out from its terms and relations (flow, down, cycle), grown line before term, under a camera. Fits: a cycle; a chain of causes; a hierarchy; a root-cause review; a process
- **term** — Term on its rule (`react/parts/term.tsx`): A term typeset on its rule: with a gloss, index, pictogram (acting), picture or points; a large pictogram, a figure, a quote, or struck out. Fits: a stage; a cause; a person or a place; a count; a failure; a fix
- **title** — Running head (`react/parts/heading.tsx`): The map's question at the head of the sheet: a mono kicker by a red square, the title, a short rule. Fits: the question a lesson answers; the incident under review
- **transition** — Locator (`react/parts/locator.tsx`): The whole map in miniature, the frame a red box moving over it. Fits: a ride along a line; a close look at a large map

## Native moves

- **Run the rule on.** A term's underline keeps going as the line to the next, its verb in the gap. *Fits content like:* a stage into the next; a cause and its effect; a decision and its result.
- **Ride the line.** The camera follows the nib to a term off frame, the locator showing where. *Fits content like:* a gene making its enzyme; a policy reaching a group; an order passed down.
- **Close the loop.** The last line returns to the first term, chevrons showing the way round, a bracket naming it. *Fits content like:* the water cycle; a vicious circle; a feedback loop in a product.
- **Name the stroke.** Two kinds of relation meet and the key draws each. *Fits content like:* deep causes and a trigger; parts and effects; help and harm.
- **Block the cause.** An action sends a T-bar line into the cause it stops. *Fits content like:* a fix in a review; a vaccine; a law against a loophole.
- **A figure on its rule.** A large figure stands beside the term it measures, counted up, source under it; or bars rule out from zero, a forecast drawn open. *Fits content like:* deaths a cause led to; a share that failed; now and in 2050.
- **Lay a second sheet.** A sheet over the map sets two branches side by side. *Fits content like:* two outcomes; before and after a reform; two options.
- **Pull back to the view.** From close in, the camera moves out to the terms now discussed. *Fits content like:* the whole loop; all causes of an incident.
- **Act it out.** A pictogram multiplies, bursts or turns as said. *Fits content like:* bacteria dividing; a cell bursting; a mill.

## Avoid: pitfalls

- A verb laid on its line. Fix: give the relation a label; it finds its gap.
- A term standing before its line. Fix: `grow`.
- Every term red. Fix: one red per thought.
- A rounded figure, or a bar not from zero. Fix: values as said, sourced; bars from zero.

## Freedom in each work

Three structures: a cycle, then broken by a fix; a root-cause review from the incident back to the root, ending on its fixes; a cascade read top to bottom, then two outcomes compared.
