# Light Bench

A real experiment on a black optical table, in real 3D: glass on steel posts in a dark lab, and light that is computed through it, never drawn by eye.

## Essence, and what it is not

- The picture is an experiment you could build. Everything stands on a holed optical table and has a post, a foot and a job.
- The light is calculated. `Bench` traces each colour through the elements by Snell's law, so a fan is the width it really is and colours that meet really add up to white.
- Light is the only colour in the frame. The lab is near black, the steel is grey and the glass is clear.
- The camera walks round the table as a person would. The change of angle is what makes it 3D, so it never stops for long.

Not Clay World (a soft, made tabletop world; here hard steel and glass). Not Night Diagram (a flat dark diagram with instruments round a big subject; here a lit solid set whose beams obey a law). Not Stage Light (a dark stage presenting figures; here the picture is the experiment). Not a sci-fi lab: no holograms, no scan lines, no glow on anything but light.

## Ground and material

`Bench` is the set and the only canvas: a black anodised table with threaded holes at one unit's pitch, fading into a dark room under one soft overhead light. Glass is faintly tinted and clear, with bright edges and hard reflections from a dim room. Steel is brushed; mounts and jaws are matte black; a card is grey, so a spot of light shows up on it. Beams are a thin white-hot core with two soft blooms of their colour and a faint reflection on the table. There is no bloom filter and no fog of light.

## Colour roles

- Seven beam colours belong to the light alone, from red to violet, and white is all of them on one path. Never tint a beam by hand: change what it passes through.
- A tag takes the colour of the light it names. `text` white is for names, `muted` for figures.
- Nothing solid is coloured. Never a coloured post, card or background.

## Type and captions

Hanken Grotesk at 700 to 800 for questions (64 to 72 px) and names (40 px), JetBrains Mono at 28 px for every number, wavelength and source, and at 40 px for a law or an index. Sans notes are 28 px. Chinese: Noto Sans SC. The caption is white on a thin dark glass, low in the frame, and words never sit inside the 3D: they are placed above it with `toScreen`, so they stay on what they name as the camera moves.

## Motion

- The camera tweens `yaw`, `pitch`, `dist`, `tx`, `tz` together, eased, over 2.5 to 5 s. Keep it moving slowly through a long line.
- Light travels: `reach` runs fast and linearly from the lamp, stops at the first element, then goes on.
- An element is lowered into place (`in`, `easeOutQuart`) and acts only when it has landed, so the light changes at the moment it touches down.
- Jaws close linearly over about 2 s (`close`), so the colours go out one by one. Open them before lifting them away.
- Tags draw their line, then their words, and leave before what they name does.

## Composition and framing

Run the beam away from the camera wherever it lands on a card: light lands on the far side of a thing, so a card facing you shows its spot. Keep one thing in sharp attention: start wide, go in on the event, pull back for the conclusion. The top left is for the question and the lower left for a law; numbers sit in the dark at the top right. Keep what matters above y 880.

## Sound

A quiet room with a faint hum. A soft mechanical click as an element lands. Music is sparse and low.

## Components

- **data** — Index card (`react/parts/spectrum.tsx`): A thin row of three colours, each with its wavelength and the refractive index the trace really used. Fits: showing the numbers behind what a beam does
- **ground** — Optical bench (`react/parts/bench.tsx`): A black optical table with its grid of threaded holes in a dark lab; glass stands on steel posts and the beams are computed through it by Snell's law, one colour at a time. Fits: every scene: how prisms and lenses treat light, in the plane of the beam
- **mark** — Measured angle (`react/parts/angle.tsx`): A thin arc drawn in the plane of the beams between two directions, seen in true perspective, with its size in degrees at the end of it. Fits: how far a beam turned, how wide a fan is, the angle in the law
- **term** — Law line (`react/parts/law.tsx`): The one law at work, set in mono on a thin rule with a word on what it says, so the viewer knows the picture is calculated. Fits: Snell's law, the thin-lens equation, the one formula a film rests on
- **term** — Bench label (`react/parts/tag.tsx`): A dot on a point in the 3D scene that stays on it as the camera moves, a hairline to a thin rule, and the name in white with a figure in mono under it. Fits: naming an element or a beam on the word it is said
- **title** — Question (`react/parts/heading.tsx`): The question in heavy white, top left, over the dark of the lab; it leaves once the light is on. Fits: stating what the experiment will answer

## Native moves

- **Switch it on.** A beam runs out from the lamp and stops at the glass, then goes on through. *Fits content like:* any prism or lens setup; one pure colour from `colors`.
- **It fans out.** One white beam leaves a prism as colours at their true angles, and an arc states the angle. *Fits content like:* dispersion; how a spectrometer reads; why glass edges show colour.
- **Close the jaws.** A slit closes across the fan and the colours go out one by one. *Fits content like:* picking one colour; how a monochromator works; a stop in a lens.
- **Lower another element.** Something lands on the table on the word and the light changes when it touches down. *Fits content like:* a second prism; adding a lens to a telescope; a camera's lens group.
- **Bring it back.** A lens gathers what was spread, and it lands as one white spot on the same card. *Fits content like:* recombining; focusing; forming an image.

## Avoid: pitfalls

- A beam landing on a card seen from behind hides the event. Fix: run the light away from the camera at that moment.
- Positions set by eye miss the light. Fix: ask `trace` where it lands, and work out a layout from it.
- A tag tied to where light lands flies off when the element moves. Fix: take it away before the element.
- Two prisms at once look like a wire model. Fix: go close, or lift the camera to see the glass from above.
- A prism at the wrong angle reflects everything inside. Fix: enter near least deviation.

## Freedom in each work

Each film decides which prisms, lenses, jaws and cards stand on the table, in what order they arrive, which colours run and where the camera goes. Far-apart structures: rerunning one historic experiment; building up an instrument one element at a time; one beam followed through a whole instrument of lenses.
