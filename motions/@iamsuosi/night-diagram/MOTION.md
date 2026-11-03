# Night Diagram

A science diagram at night: one big glowing subject in a deep blue field, and around it the instruments of someone measuring it.

## Essence, and what it is not

- The picture is a diagram that happens to be beautiful. Every frame explains one thing and could be paused and understood.
- Light is the event. The field stays dark so that whatever is happening (a stroke, a signal, a reaction) is the brightest thing on screen and lights what stands near it.
- Instruments are thin and quiet: hairline pins, a fine ruler, one dark glass card. Each measures or names something real.
- Scale is how it impresses: a small event in a lens, the big body it happens in, the planet that body is on.

Not Stage Light (a dark stage, one spot and big figures: there is no picture to explain there). Not Depth Stage (painted layers and racked focus for history and places). Not Drafting Table (white ruled line art on a blue sheet; here bodies are solid and lit). Not a sci-fi HUD: no scan lines, hex grids or rings that measure nothing.

## Ground and material

`Sky` is the field: near black at the top, a lighter blue at the horizon, fine stars, a dark land line or none. Bodies are flat soft rounds (`Mass`), darker low and lit on top, with no outline or texture. Glow is built by blur on real light only: a white core inside two blooms of colour (`Arc`), and a pool on the field where a light stands (`Sky` `glow`, `light`). Nothing that is not a light glows.

## Colour roles

- `bg`, `panel`, `panel2`: the field, darkest to lightest. Bodies are mixes of them.
- `grad` (ember) and `data` (ice) are the two sides of whatever opposes: positive and negative, hot and cold, up and down. A scene that has no opposition uses one.
- `text`: names and figures. `muted`: notes and numerals. `border`: the card's edge.
- White belongs to the brightest light. Never fill a large area in ember or ice, and never add a third accent.

## Type and captions

Hanken Grotesk, with Noto Sans SC for Chinese; JetBrains Mono for every instrument numeral and source. Question heading 64–76 px at 800; pin names 40 px at 700 with notes at 28 px; a reading's figure 104 px at 800; ruler numerals 26 px; a source 28 px. Nothing under 26 px. The caption is white on dark glass, the same material as the reading card.

## Motion

- A body swells from its base (`grow`) and keeps breathing (`drift`): the picture is never frozen.
- Particles take their own paths and keep stirring on arrival (`Motes`).
- Instruments draw themselves on the word: a pin's line, then its words.
- Light is the only thing that moves fast. A strike runs in under 0.2 s, spikes, flickers once, then decays over more than a second, and everything near it dims with it.
- A camera move is one unbroken change of scale (`Dive`), eased, with words and readings left outside it. Figures roll up to their true value.

## Composition and framing

The subject fills the middle two thirds. The question sits top left; pins run out to clear space; the reading sits low beside what it measures; the ruler stands just outside the subject. Keep the land line above y 880: the band below it holds the captions. Change the frame by changing scale, not by cutting to a new layout.

## Sound

Light gets the only loud sounds: a crack, a late rumble. Music is sparse and drops out before the big event.

## Components

- **data** — Moving motes (`react/parts/motes.tsx`): Small marks that travel between regions, each on its own path and time, so a process can be watched happening. Fits: charge separating, ions crossing, gas spreading; flashes all over a region
- **data** — Reading card (`react/parts/reading.tsx`): A dark glass card with one measured number: what it is, the figure rolling up, a comparison, and its source. Fits: the one number a scene is about; one on screen at a time
- **ground** — Night sky (`react/parts/sky.tsx`): A deep blue field, lighter at the horizon, with fine stars and a dark land line; a light in the scene pools on it. Fits: every scene
- **mark** — Light path (`react/parts/arc.tsx`): A line of real light, a white core in two blooms of colour, that runs along a path on the word and can fork. Fits: a stroke of lightning, a nerve signal, a current
- **mark** — Pressure rings (`react/parts/pulse.tsx`): Thin rings that leave a point one after another and thin out as they spread, cut at the ground if there is one. Fits: something spreading at a speed: thunder, a heartbeat, a signal
- **mark** — Instrument ruler (`react/parts/ruler.tsx`): A thin vertical scale with real units beside the subject, with a level line that can cross the picture. Fits: height, depth, time, temperature: any picture whose size is the point
- **open** — Glowing mass (`react/parts/mass.tsx`): A big body of soft overlapping rounds, lit on top, that swells from its base and can light from within. Fits: a storm cloud, a nebula, a lung: the large subject whose inside the film explains
- **term** — Magnifying lens (`react/parts/lens.tsx`): A round window tied to one spot in the picture, showing the small process that explains the large one. Fits: the invisible step inside a big picture: a collision, a cell, a wingtip
- **term** — Pin label (`react/parts/pin.tsx`): A dot on the thing named, a hairline with one elbow out to clear space, the name on the rule and a note under it. Fits: naming a part on the word it is said
- **title** — Question heading (`react/parts/heading.tsx`): The scene's question in heavy white, top left and out of the picture's way, with one quiet line below it. Fits: stating what the scene answers
- **transition** — Scale dive (`react/parts/dive.tsx`): One camera over a scene: an unbroken push in or pull back, so the change of scale is itself the explanation. Fits: from a thing to what it is part of, or into what it is made of

## Native moves

- **The lens opens.** A window ties to one spot in the big picture and shows the small event inside it. *Fits content like:* a collision between ice and hail; one cell dividing; a wingtip's vortex.
- **Watch it separate.** Two kinds of motes leave one region for two others, and pins name them as they arrive. *Fits content like:* charge in a cloud; ions in a battery; oil and water.
- **The strike.** After a slow build, one path of light runs in a blink, lights everything near it, flickers, and decays while a reading rolls up. *Fits content like:* lightning; a nerve firing; a star igniting.
- **The ring goes out.** Rings leave a source at a steady speed, and a reading says how fast. *Fits content like:* thunder; an earthquake's wave; a radio signal.
- **Pull back to the planet.** One move from the event to the world it happens on, and the event repeats all over it. *Fits content like:* how often lightning strikes; how many heartbeats a day; every volcano now erupting.
- **Mark the level.** A dashed line crosses the whole picture at a value on the ruler, and what is above and below it changes meaning. *Fits content like:* freezing height; sea level; a safe dose.

## Avoid: pitfalls

- A frame with nothing measured is a wallpaper. Fix: every scene gets a ruler, a pin, a lens or a reading.
- Everything glowing means nothing is lit. Fix: glow only the light in the sentence.
- A pin across its own words strikes them through. Fix: the name sits on the rule, the note under it.
- Two number cards compete. Fix: one reading.
- A figure with no source reads as invented. Fix: `source` on every reading, and "illustrative" where the picture is not to scale.
- A big zoom shows how plain a round is. Fix: push in less than 1.5, or open a lens with new detail.

## Freedom in each work

Each film decides its big subject, which side is ember and which ice, what its lens shows and which number earns the reading. Far-apart structures: one event from its smallest cause to its largest effect; one body seen at three scales; a slow build to a single strike and what follows it.
