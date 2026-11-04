// Traditional models, written as steps for fold.ts. Traditional designs only: a modern designer's model is theirs.
import type {ModelDef} from './fold.ts';

export const meta = {
  name: {en: 'Models', 'zh-CN': '作品'},
  purpose: 'data',
  line: 'Traditional models written as steps, ready for the fold stage, the step rail and the crease pattern.',
  fits: 'a film that folds a known model; a starting point for writing your own',
  params: {},
  preview: 16,
};

const L = Math.SQRT2;
const t = Math.tan(Math.PI / 8);

/** The classic dart, from one A4 sheet (1 × √2), nose at the top */
export const paperPlane: ModelDef = {
  name: 'Paper plane',
  sheet: [1, L],
  steps: [
    {title: 'Crease the centre', say: 'Fold it in half lengthways, then open it again.', precrease: true,
      folds: [{line: [[0.5, 0], [0.5, L]], moving: [0.2, 0.5]}]},
    {title: 'Corners to the centre', say: 'Fold the two top corners in to the centre line.',
      folds: [{line: [[0.5, L], [0, L - 0.5]], moving: [0, L]}, {line: [[0.5, L], [1, L - 0.5]], moving: [1, L]}]},
    {title: 'Edges to the centre', say: 'Fold the new slanted edges to the centre once more.',
      folds: [{line: [[0.5, L], [0.5 - t * L, 0]], moving: [0, L - 0.5]}, {line: [[0.5, L], [0.5 + t * L, 0]], moving: [1, L - 0.5]}]},
    // free: both halves rise together, so the plane ends standing on its keel rather than lying on its side
    {title: 'Fold in half', say: 'Fold the plane in half along the centre crease.', free: true,
      folds: [{line: [[0.5, 0], [0.5, 1]], moving: [0.2, 0.3]}]},
    // after step 4 both halves lie right of x = 0.5: the near half (from the sheet's left) folds up, the far half down
    {title: 'Fold the wings', say: 'Fold each wing down along a line parallel to the keel.',
      folds: [
        {line: [[0.615, 0], [0.615, 1]], moving: [0.95, 0.2], layers: ([x]) => x < 0.5},
        {line: [[0.615, 0], [0.615, 1]], moving: [0.95, 0.2], as: 'mountain', layers: ([x]) => x > 0.5},
      ]},
    {title: 'Open the wings', say: 'Open the wings out level, and it is ready to fly.', reopen: [{step: 5, angle: 90}, {step: 4, angle: 162}]},
  ],
};
