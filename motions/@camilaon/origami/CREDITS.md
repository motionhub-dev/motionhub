# Credits

Origami is an original motion. Its folding engine (`react/parts/fold.ts`) is written for it.

## Method

- Bar-and-hinge origami simulation: Schenk & Guest, "Origami folding: a structural engineering approach" (2011); Liu & Paulino, "Nonlinear mechanics of non-rigid origami" (2017); Ghassaei, Demaine & Gershenfeld, "Fast, interactive origami simulation using GPU computation" (2018).
- The dihedral angle's gradient: Bridson, Marino & Fedkiw, "Simulation of clothing with folds and wrinkles" (2003).
- The notation of fold diagrams (valley dashed, mountain dash-dot) is the shared convention of origami diagrams since Yoshizawa and Randlett.

## Models

- The paper plane in `react/parts/models.ts` is the traditional dart, a public-domain design.

## Fonts

- IBM Plex Sans: SIL Open Font License 1.1, https://fonts.google.com/specimen/IBM+Plex+Sans
- Noto Sans SC: SIL Open Font License 1.1, https://fonts.google.com/noto/specimen/Noto+Sans+SC

The motion ships no font files: films load the faces from their sources (Remotion: `MotionFonts`).

## Code

- three.js, MIT License, https://github.com/mrdoob/three.js: imported by the fold stage (`three` and `three/examples/jsm/lines`, for wide lines). Made and tested with three r181 to r187; install it beside the motion.
