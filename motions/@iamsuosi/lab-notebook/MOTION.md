# Lab Notebook

A page of a squared notebook where an explanation is worked out by hand: the diagram is drawn stroke by stroke as the narration describes it, labelled as each part is named, and the result is boxed in red. It feels like watching someone who understands the thing think it through on paper.

## Essence, and what it is not

- One notebook page, squared, with a red margin rule and punched holes. Everything is drawn or written on it.
- Every line is drawn on the word that describes it, in the order a person would draw it: the vessel before the liquid, the atom before its bonds.
- Three pens with fixed meanings: ink draws and writes, red marks the one result, pencil is working and asides.
- Paper things are stuck on, never typeset: an index tab for what to come back to, a figure label under a framed drawing.

Not a whiteboard (no marker, no erasing: a notebook keeps its working), not a blueprint (no ruler-perfect lines, no title block), not a textbook diagram (nothing appears finished; the drawing is the explanation happening).

## Ground and material

`sheet.tsx` draws the ground: warm paper (`panel`) ruled in pale blue squares of 40 px (`faint`), a double red margin rule (`border`) at x 220, punched holes on the left, the heading written by hand at the top, the sheet lying on a grey desk (`bg`) and ending above the caption band. `SHEET` gives the writing area (x 260 to 1800). Ink has a feathered edge (a lighter hair beside each stroke); pencil is plain and thinner. A drawn shape may get a pale wash of colour once its outline closes.

## Colour roles

- `text`: the ink. Every drawn line and handwritten word unless it is the result or working.
- `grad`: the red pen. The one result of a scene (a boxed value, an exclamation), never more than one red thing at a time.
- `muted`: pencil. Construction lines, angles, figure labels, the date.
- `faint`, `border`: the paper's grid and margin. Never drawn with.
- `warn`, `good`, `data`, `op`: tab papers and the pale wash inside a drawn shape (`data`), nothing else.

## Type and captions

Shantell Sans (`display`) is the hand: labels 40 to 60 px, the heading 46 px, working 40 to 52 px at weight 500 to 600. Atkinson Hyperlegible Next (`sans`) only where the page needs print: the caption and dense small text. Chinese: LXGW WenKai writes, Noto Sans SC prints. The caption is a paper slip with a short red stroke above its text, in the print face, 34 px.

## Motion

Drawing is the motion. A line or outline draws over 0.6 to 1.5 s with an ease in and out (the hand slows at corners); writing is linear, about 0.15 s a word, left to right; a label's underline follows its words. Tabs are stuck on in one beat (no slide). Nothing that is drawn moves afterwards, and the page does not move: a new idea is drawn further along the page, or on a new scene's page.

## Composition and framing

The page fills the frame and stays. A scene's main drawing takes the left two thirds of the writing area at a size that fills it; labels sit beside what they name, close enough to need no leader, or with a short arrow; working and results sit to the right. A new scene may start a clean page. Leave room for the result: the boxed value is the last thing written and needs space beside or under the drawing. A tab sits between the heading and the date, so keep the date short.

## Sound

Optional: a soft nib scratch while a long line draws, very low. No music is part of the motion.

## Components

- **ground** — Notebook sheet (`react/parts/sheet.tsx`): A page of squared paper with a red margin rule and punched holes, the topic written at the top by hand. Fits: every scene; a new question is a new heading on the same page, or a clean page
- **open** — Opening question (`react/parts/opening.tsx`): The film's question written large across a clean page, line by line, with a small pencilled note above it and a line drawn under it. Fits: the first seconds of a film; a question or a claim to work through; a new chapter
- **close** — The takeaway (`react/parts/takeaway.tsx`): What was worked out, ticked off line by line in pencil, then the one thing to remember written large and boxed in red. Fits: the last seconds of a film; a summary; the answer to the question the film opened with
- **data** — Written figure (`react/parts/figure.tsx`): One number written large by hand, its unit beside it and what it counts pencilled underneath; boxed in red when it is the result. Fits: the one number to remember; a size, a price, a date, a share
- **data** — Hand-drawn bars (`react/parts/bars.tsx`): A bar chart ruled by hand: each bar outlined and washed in turn, its name and value written beside it, the one that matters in red. Fits: how much each thing is; a ranking; the same measure across a few things
- **data** — Ruled-off bar (`react/parts/breakdown.tsx`): One long bar standing for a whole, ruled off piece by piece as each share is named, what is left at the end in red. Fits: what a price is made of; where the money goes; what is left after costs
- **data** — Sketched graph (`react/parts/graph.tsx`): Two axes ruled by hand and a curve drawn through the points, an optional second curve in pencil, notes placed by the data's own units, the point that matters ringed in red. Fits: how something changes over time; growth and decline; a peak or a crossing
- **data** — Tally (`react/parts/tally.tsx`): A number of small circles drawn one by one in rows, so an amount can be seen and counted; some pale, struck through, or one group in red. Fits: one in three; how many out of a hundred; what is lost or left of a group
- **compare** — Facing columns (`react/parts/versus.tsx`): Two headings either side of a pencil line down the page, what differs written row by row across it, the verdict in red underneath. Fits: this against that; before and after; myth and fact
- **steps** — Working (`react/parts/formula.tsx`): Lines of working written one after another by hand, the last one boxed in red as the result. Fits: a short derivation; a definition then a value; a comparison reduced to one inequality
- **steps** — Numbered steps (`react/parts/list.tsx`): A list down the page, each step's number ringed by hand and its words written after, the step being said in red. Fits: a process in order; how to do something; reasons one by one
- **steps** — Pencil timeline (`react/parts/timeline.tsx`): A line ruled across the page and ticked at each date, the date written large and what happened in pencil, above and below the line in turn. Fits: what happened when; a history in dates; a project's stages
- **steps** — Ink line (`react/parts/ink.tsx`): Any line, shape or diagram as SVG path data, drawn with the pen as the narration describes it, its shapes one after another. Fits: a vessel, a molecule, a circuit, a graph's curve: whatever the explanation draws
- **term** — Hand label (`react/parts/label.tsx`): A word or a short phrase written by hand on the word that names it, underlined when it matters. Fits: naming a part of the drawing; a term the narration introduces; a quantity next to what it measures
- **mark** — Pen mark (`react/parts/mark.tsx`): A ring, an underline, a strike-through, a tick or a cross made with the pen, wrapped round what it marks so nothing needs measuring. Fits: pointing at one word or number; striking what turned out wrong; ticking what holds
- **quote** — Taped clipping (`react/parts/clipping.tsx`): A printed scrap taped to the page: a quotation, a line of a document or a fact from a source, with where it came from under it. Fits: what someone said; a line of a law or a report; anything too long to write by hand
- **link** — Curved arrow (`react/parts/arrow.tsx`): A hand-drawn arrow that bends from one place on the page to another, its head added when the line arrives. Fits: this leads to that; a cause and its effect; from a drawing to the formula it explains
- **title** — Figure frame (`react/parts/frame.tsx`): A pencil box drawn round a drawing, with its figure label written underneath. Fits: setting one drawing apart as the thing to look at; naming a view (from above, in section, magnified)
- **transition** — Index tab (`react/parts/tab.tsx`): A coloured paper tab stuck to the page with a strip of tape, marking a place to come back to. Fits: the question a section answers; a result to remember; a page that changes topic

Every part that takes words writes them smaller to fit its width, in any script, and a list or a table keeps one size throughout. The line under a narrated film is the runtime's `<Caption>`, on the desk band below the sheet.

## Native moves

- **Draw it as you say it.** An outline draws itself on the noun; its parts on theirs. *Fits content like:* a cell and its membrane; a circuit's loop; a gear train.
- **Label on the word.** A name is written next to its part the moment it is said, underlined if it is the key term. *Fits content like:* parts of an engine; the layers of the atmosphere; the axes of a graph.
- **Work it out.** Lines of working written one by one, the last boxed in red. *Fits content like:* a density; a speed from distance and time; a probability from counts.
- **Frame the figure.** A pencil box closes around a finished drawing and its figure label is written beneath. *Fits content like:* a view from above; a cross-section; a magnified detail.
- **Rule it off.** A whole drawn as one bar and cut share by share until what is left is in red. *Fits content like:* where the price goes; a budget; what remains of a day.
- **Set them facing.** Two columns, one row at a time, down to a verdict. *Fits content like:* ice against water; renting against buying; a claim against the evidence.
- **Tab the question.** A paper tab is stuck at the page edge with the scene's question or answer. *Fits content like:* the gap a theory fills; the step that changes everything; the thing to remember.

## Avoid: pitfalls

- A diagram drawn all at once: it is a picture, not a notebook. Fix: tween the drawing over the words that describe it.
- Lines too thin to read at 1920 × 1080: Fix: ink 4 to 6 px, pencil 3 px.
- Red for decoration: the result stops standing out. Fix: one red thing per scene.
- Handwriting for long sentences: Fix: keep written text to labels and short working; the narration carries the sentences.
- A label far from its part: Fix: write it beside, or draw a short arrow.
- A film of nothing but charts and tables: it turns into a slide deck in handwriting. Fix: draw the thing itself in at least one scene, however simple: the cup, the battery, the press.

## Freedom in each work

Each film decides its story, scenes, drawings, which pens, how many pages, tabs and the ending. Three far-apart structures: one drawing built up across the film until the result is boxed; a comparison of two drawings on facing halves of the page; a sequence of steps, each a small numbered drawing down the page.
