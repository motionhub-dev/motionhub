# Depth Stage

A place at dusk built from flat silhouette layers under a perspective camera: haze pales what is far, the lens softens all but one depth, and the camera travels through the layers instead of cutting. It tells history, places and journeys, and explains on the way: a term defined in the air, things measured side by side, a thread from one place to another.

## Essence, and what it is not

- Flat painted layers at real depths (near, middle, far), each one tone, paler and cooler the farther it stands.
- One depth is sharp; the rest is soft. Focus is the narration's attention, and it moves by racking, never by a highlight.
- One warm light in a cool dusk: the sky's low light, a crater, a lamp. It is the only warm thing, and what the sentence is about stands nearest to it.
- Words live in the world: a title, a figure or a pin stands on the plane of the thing it names, blurred with it when the focus leaves.

Not a flat cartoon (no outlines, bright fills or daylight), not Stage Light (a flat floor with a spot; here attention is a depth and the camera moves through space), not a 3D render (every layer is a flat card).

## Ground and material

`Stage` is the camera and the sky (dusk gradient, the light's bloom, grain, vignette). Each layer is a `Plane` at a depth `z`: CSS perspective places it, the same numbers give its blur and haze. Silhouettes are SVG masks on sheets larger than the frame. Three to five planes make a place.

## Colour roles

- `bg` the sky overhead; `grad` the haze, the colour every distant thing tends to; `panel` the near silhouette ink, the darkest value.
- `data` the one warm light and the thing nearest it: a kindled point, a figure's unit, a pin's ring, a rim of light on a ridge.
- `text` titles and labels, hazed like the plane they stand on; `muted` notes.
- Never: a second warm colour, a fill that is brighter than the sky behind it, pure black or white.

## Type and captions

Newsreader (light to regular, 120–220 px) for titles and figures, set like a film's title card; Hanken Grotesk for labels (spaced capitals, 26–30 px) and captions. Chinese: Noto Serif SC for both. The caption is plain light type with a soft dark halo and no plate, low over the dark near ground, as a film subtitle sits.

## Motion

- The camera moves; the world stays. Dolly forward, drift sideways (parallax by depth), rack focus. Easing is slow in and out (`easeInOutSine`), 1.2–3.5 s; nothing bounces.
- Things arrive by coming into focus out of the haze (`show`; a title letter by letter), a light kindles, a column rises. Nothing slides in from an edge.
- The air moves: `Motes` on several depths (near ones soft discs). One blow per film may shake the camera and flash the sky (`quake`, `flash`).
- The camera always breathes a few pixels; a held frame is never frozen.

## Composition and framing

The rest composition is the widest frame: dolly in from it, or start close and pull back to it, never beyond. The top third is sky and light; the subject sits at the middle depth, a near layer frames the foot; words take a quiet corner of sky. Between ideas the camera travels (through a fog `veil`, or into a set built `Ahead`), not a cut.

## Sound

A low wind bed, far sounds softened by the haze, one clear near sound when the focus arrives; narration close and dry.

## Components

- **compare** — Columns of light (`react/parts/columns.tsx`): Two to four slender columns standing on one plane, rising one after another to heights in proportion; the one the sentence is about is warm, the rest hazed. Fits: how high or deep or long things are against each other: a column of ash against a mountain, a tower against a cathedral, then against now
- **data** — Figure in depth (`react/parts/figure.tsx`): A large light serif figure with its unit and label, on the plane of what it measures, counting up as it is said. Fits: the height of a column, a depth, a distance, a span of years
- **ground** — Motes in the air (`react/parts/motes.tsx`): Dust, falling ash or rising embers on several depths: near ones soft discs of light, far ones fine specks, so the air shows the depth. Fits: dust in a low sun, ash after an eruption, sparks over a fire, snow
- **ground** — Silhouette layer (`react/parts/ridge.tsx`): One flat silhouette of the land (hills, peaks, a volcano, a town, trees, boughs), paled and softened by its depth. Fits: the far mountains, the middle town and the near trees of a place; three to five of them, each on its own plane, make the depth
- **ground** — Depth stage (`react/parts/stage.tsx`): A dusk sky and its haze seen through one camera that dollies, pans and racks focus; every other component stands on a plane in it. Fits: every scene: one per scene, holding that scene's planes; tween cam to dolly through the layers, focus to rack between them
- **link** — Thread between places (`react/parts/thread.tsx`): A dashed hairline arcing from one place to another on one plane, a spark leading it, a ring where it lands and its words at the top of the arc. Fits: what travelled from one place to the next (ash on the wind, a road, a message, a cause and what it caused); how far apart two things are
- **mark** — Distant light (`react/parts/beacon.tsx`): A warm point of light kindling far off in the dusk, its halo carried by the haze. Fits: a crater waking, a first lamp, a signal fire, a star
- **mark** — Depth pin (`react/parts/pin.tsx`): A ring on a place and a hairline rising to its name, on that place's plane: sharp only while the focus is there. Fits: a forum, a summit, a crater, a house
- **steps** — Mileposts into the depth (`react/parts/mileposts.tsx`): Slender posts, each a date or a stage, one behind another into the haze; the camera dollies past them as they are counted. Fits: centuries passing, the stages of a journey, distances along a route, eras of a history
- **steps** — Cross-section (`react/parts/section.tsx`): The ground cut open: layers laid one on another as they are named, each labelled, burying what stood on the old surface. Fits: how a city was buried, how strata form, sediment over a fossil
- **term** — Word in the haze (`react/parts/term.tsx`): A term in italic serif with a hairline drawn under it and its meaning in plain type, on a plane of the world; the meaning comes into focus on its own beat. Fits: a word the narration defines (a pyroclastic surge, a caldera, a stratum, an era); what a name means
- **title** — Title in the haze (`react/parts/title.tsx`): A serif title under a small spaced line, on a plane of the world; it comes into focus out of the haze, letter by letter. Fits: the place and year a story opens on; a chapter; the question a film asks
- **transition** — Parting layer (`react/parts/parting.tsx`): A covering layer (buried ground, cloud) cracks and slides apart to reveal what lies behind. Fits: ash lifted off a city, rock opened on a fossil, cloud parting on a summit

## Native moves

- **Dolly through the layers into the next place.** The near layers grow, soften and pass the lens; the next set, built `Ahead`, lands at its rest framing. Fits content like: a journey's next stop; centuries passing; down a valley.
- **Rack focus between depths.** The sharp plane moves from near to far (or back) on the word that names it. Fits content like: a town, then the mountain behind it; a clue, then the suspect; a moon, then its planet.
- **Layers part on what lies between them.** A covering layer (`Parting`) cracks and slides apart to reveal the plane behind. Fits content like: ash lifted off a city; rock opened on a fossil; cloud parting on a summit.
- **Stand them side by side.** Columns rise one after another on one plane in focus, the subject's warm and last. Fits content like: the column of ash against Everest; a cathedral against a tower; a sea level then and now.
- **Name it in the air.** A term comes into focus over the place it belongs to, a hairline draws under it, and its meaning follows on its own word. Fits content like: a pyroclastic surge; a caldera; a stratum.
- **A thread from here to there.** A spark draws an arc from one place to another on the plane in focus and lands a ring. Fits content like: ash carried to a town; a road between two cities; the cause and the place it struck.
- **A light kindles far off.** A warm point (`Beacon`) appears in the dusk and the haze carries its halo. Fits content like: a crater waking; the first lamp of a settlement; a star that is not where it should be.

## Avoid: pitfalls

- **Every layer the same grey** → step the depths (each plane at least 1.5× the next one's) and keep the near layer darkest.
- **A pull-back past the rest frame shows the cards' edges** → design the widest framing at `cam` 0 and move only forward of it.
- **The figure is soft when it is said** → stand it on the plane in focus, or rack to it on its word.
- **Text blurred while it must be read** → read a label only while the focus is on its plane; 30 px or more.
- **Several warm points** → one warm source per frame (its embers count as it); the rest is cool.
- **Five soft planes on a held frame** → keep two or three soft; blur is costly to draw.
- **A near title grows off the frame in a push** → let it go back into the haze before the camera moves in.

## Freedom in each work

The place, the hour, the planes, the light, the moves, the opening and ending. Three far-apart structures:

- **A journey**: one dolly per stop, each a set built `Ahead`, one continuous camera.
- **One place in time**: one framing that changes as focus and light move over a day or a century.
- **A mystery**: open on a covered layer, rack between clues at different depths, end with the parting that shows what was there.
