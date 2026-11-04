# Credits

Origami is an original motion. Its folding engine (`react/parts/fold.ts`) is written for it.

## Method

- Bar-and-hinge origami simulation: Schenk & Guest, "Origami folding: a structural engineering approach" (2011); Liu & Paulino, "Nonlinear mechanics of non-rigid origami" (2017); Ghassaei, Demaine & Gershenfeld, "Fast, interactive origami simulation using GPU computation" (2018).
- The dihedral angle's gradient: Bridson, Marino & Fedkiw, "Simulation of clothing with folds and wrinkles" (2003).
- The notation of fold diagrams (valley dashed, mountain dash-dot) is the shared convention of origami diagrams since Yoshizawa and Randlett.

## Models

- The paper plane in `react/parts/models.ts` is the traditional dart, a public-domain design.

## Fonts

- IBM Plex Sans, IBM Plex Mono: SIL Open Font License 1.1
- Noto Sans SC: SIL Open Font License 1.1

## Code

- three.js (MIT), imported by the fold stage, including its `examples/jsm/lines` for wide lines.
