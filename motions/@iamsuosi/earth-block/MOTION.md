# Earth Block

One block of the world on a textbook plate, cut open while it is explained: the top is what everyone sees, the cut face is what the film is about.

## Essence, and what it is not

- There is one subject, and it is one solid block in isometric, hanging on pale paper with no floor. The film never cuts away from it; it moves, turns and opens.
- The inside is the point. The top shows the familiar thing; the layers under it show what nobody sees, each a material with its own colour and grain.
- Things happen inside: beads seep, a line rises and sinks, a core comes out.
- Words stay in the margin like a plate's key, tied to the block by thin leaders.

Not Iso Works (a floor of many buildings with cubes on belts: a system running; here one block and its inside). Not Drafting Table (line art on a blue sheet; here lit solids). Not Night Diagram (a dark field and a glowing subject seen flat; here a daylit solid you can walk around). Not Clay World (no real 3D, no soft light: flat faces in three tones).

## Ground and material

`Paper` is the ground: pale green-grey with a fine dot lattice, and small print for what is out of scale. The block has three lit faces of one material: top the colour itself, the cut face that colour, the far side darker. Layer lines are slightly wavy and agree at every corner. Each layer is flecked with its own grain. No gradients, outlines, blur or shadows.

## Colour roles

- Materials are named colours, not tokens: grass, soil, sand, clay, rock, wall, leaf. A film about another subject swaps them for its own (skin, fat, muscle; asphalt, pipe, gravel), all muted and earthy.
- `data` blue is the one thing moving through the block: water here, a signal or a current elsewhere. Nothing else is saturated.
- `op` deep blue names what the blue does. `grad` is held back for a warning.
- `text` ink for names; `muted` for notes. A tag takes its material's colour.

## Type and captions

Fraunces at 800 for the question (64 to 76 px) and at 700 for tags (40 px) and figures (84 px): an old textbook's voice. Atkinson Hyperlegible Next for notes (28 to 30 px) and captions. JetBrains Mono 26 px for sources and small print. Chinese: Noto Serif SC for Fraunces' roles, Noto Sans SC for the rest. The caption is ink on the paper's own colour, with no box to speak of: it belongs to the page.

## Motion

- Solids have weight: they arrive quickly and come to rest (`easeOutQuart`), with no bounce. Layers drop onto each other to open a film (`lift`).
- The slice slides out along its own axis and fades as it goes (`slide`).
- The camera is one continuous move of `yaw`, `at` and `k`, eased over about 2 s: turn to the cut, move aside for what comes next. Never a cut. Keep `yaw` under 40° either way.
- What moves inside moves steadily (`clock` tweened linearly); how far it has got (`reach`) goes with the words.
- A level takes its time: 2.5 to 3 s to rise or fall.

## Composition and framing

The block fills the middle, its top about a third of the frame and its layers about a third. Tags run to the left and right margins, each on its own level, no two leaders crossing. After a cut, turn so that the cut faces the viewer, and name its layers from the left. When a new thing arrives, the block moves aside rather than leaving. Keep it above y 880, with the small print low on the left.

## Sound

A quiet room. Material sounds under the opening, a soft slide on the cut. Sparse music.

## Components

- **compare** — Measured slabs (`react/parts/slabs.tsx`): Square slabs of one thickness, each with an area true to its number, so a hundred times more looks a hundred times bigger. Fits: two or three quantities whose ratio is the point
- **data** — Seeping beads (`react/parts/seep.tsx`): Beads that creep along paths through the block at a steady rate, each at its own time, leaving a faint trail. Fits: water sinking, roots drinking, heat or a signal passing through layers
- **ground** — Plate paper (`react/parts/paper.tsx`): A pale textbook plate with a fine dot lattice and no floor, and a line of small print for what is drawn out of scale. Fits: every scene
- **mark** — Falling marks (`react/parts/fall.tsx`): Short slanted strokes that fall on the block and land with a small ring, at a rate you can see. Fits: rain, snow, ash, anything arriving from above
- **mark** — Sunk shaft (`react/parts/shaft.tsx`): A pipe sunk from the top down the cut face on the word, with what it brings up rising inside it. Fits: a well, a mine, a pile, a root, a needle: anything that goes down through the layers to reach one
- **open** — Cut block (`react/parts/block.tsx`): One block of the world in isometric: a lit top with what stands on it, and layers of material down its sides, which can be stacked, sliced open and filled. Fits: ground, a body, a wall, a city street, a chip: anything whose inside is in layers
- **term** — Drawn core (`react/parts/core.tsx`): A cylinder drawn straight up out of the block and set down beside it: the same layers, in the hand, to look at. Fits: a soil core, an ice core, a biopsy, a section through anything you could sample
- **term** — Sample window (`react/parts/grains.tsx`): A square of the material far above life size, tied to the spot it came from, with what fills its gaps rising through it. Fits: water between sand grains, cells in a tissue, air in a foam: the small truth inside one layer
- **term** — Margin tag (`react/parts/tag.tsx`): A dot on the thing named that stays on it as the block turns, a thin leader out to the margin, the name set on the rule like a plate's key. Fits: naming a layer or a part on the word it is said
- **title** — Plate title (`react/parts/heading.tsx`): The question in a heavy old-style serif, top left of the plate, with one plain line under it. Fits: stating what the plate answers

## Native moves

- **Stack the layers.** They come down from above and settle into one block as the film opens. *Fits content like:* an atmosphere; a layered cake of rock; the OSI layers.
- **Slice it open.** A slab of the block slides away on the word, and the camera turns to face what it uncovered. *Fits content like:* soil under a field; a street's pipes; a wall's insulation.
- **Follow it down.** Beads creep through the layers, their `reach` advancing with the words, and each layer is named as they get there. *Fits content like:* rain sinking; a drug through skin; heat through a wall.
- **Fill it up.** A line rises through one layer and the layer changes colour below it. *Fits content like:* an aquifer; a flood plain; a battery charging.
- **Draw it down.** A shaft goes in and the level sinks around it in a smooth curve. *Fits content like:* a well; a mine's drainage; a blood draw.
- **Pull a core.** A cylinder rises from the top and moves aside, and a window opens on one of its bands. *Fits content like:* an ice core; a biopsy; a soil sample.
- **Weigh it in slabs.** The block moves aside, and slabs of one thickness show the ratio by area. *Fits content like:* where the water is; how much is reserve and how much is used.

## Avoid: pitfalls

- Many small blocks make Iso Works. Fix: one block, and a second subject is a move of the same block.
- A cut that shows what the sides showed is wasted. Fix: name and animate inside it at once.
- A layer's name on the cut face gets lost in its grain. Fix: tags in the margin.
- A real depth looks wrong drawn true. Fix: exaggerate, and say so in `Paper`'s `note`.
- Parts with different cameras come apart. Fix: draw them all in one part, from one `view`.

## Freedom in each work

Each film decides what the block is, its layers and their colours, what stands on top, which one thing moves inside it and where it stops. Far-apart structures: from the top down to the bottom layer; one layer's secret, opened by a core; a slow change over years in which only the level moves.
