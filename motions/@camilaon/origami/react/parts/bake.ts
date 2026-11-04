// Check and bake models in Node before filming them. Write a three-line script beside your model and run it:
//
//   // src/bake.ts               run: node --experimental-strip-types src/bake.ts
//   import {bakeModels} from '<the motion>/react/parts/bake.ts';
//   import * as models from './model.ts';
//   bakeModels(models, new URL('./model.baked.json', import.meta.url));
//
// For every ModelDef among `models`: each step's creases (a step that makes none has a wrong line or moving point),
// how long the solve takes, and the solve itself, written to `target`. Pass it to FoldStage
// (`baked={baked.myModel}`) and no render tab solves again: a still costs what drawing it costs.
// Bake again whenever a model changes; a stale bake is noticed and solved afresh, with a warning.
import {writeFileSync} from 'node:fs';
import {bake, sequence, type Baked, type ModelDef} from './fold.ts';

const isModel = (v: unknown): v is ModelDef => !!v && typeof v === 'object' && Array.isArray((v as ModelDef).steps) && Array.isArray((v as ModelDef).sheet);

export function bakeModels(models: Record<string, unknown>, target: string | URL): boolean {
  const found = Object.entries(models).filter((e): e is [string, ModelDef] => isModel(e[1]));
  if (!found.length) { console.error('no ModelDef among the models given'); process.exitCode = 1; return false; }
  const out: Record<string, Baked> = {};
  let problems = 0;
  for (const [key, def] of found) {
    console.log(`${key}: "${def.name}", ${def.steps.length} steps`);
    const {chords} = sequence(def);
    def.steps.forEach((st, i) => {
      const n = i + 1, mine = chords.filter((c) => c.step === n);
      const v = mine.filter((c) => c.kind === 'V').length;
      const kinds = mine.length ? `${mine.length} crease${mine.length > 1 ? 's' : ''} (${v} V, ${mine.length - v} M)` : 'no creases';
      const bad = !!st.folds?.length && !mine.length;
      if (bad) problems++;
      const extra = [st.precrease && 'precrease', st.turnOver && 'turn over', st.free && 'free', st.reopen && 'reopen'].filter(Boolean).join(', ');
      console.log(`  ${String(n).padStart(2)} ${st.title}: ${st.folds?.length ? kinds : st.reopen ? 'reopens' : 'no folds'}${extra ? ` [${extra}]` : ''}${bad ? '  <-- folds nothing: the line misses the paper or `moving` lies on it' : ''}`);
    });
    const t0 = Date.now();
    out[key] = bake(def);
    console.log(`  solved in ${((Date.now() - t0) / 1000).toFixed(1)} s, ${out[key].states} states`);
  }
  writeFileSync(target, JSON.stringify(out));
  console.log(`wrote ${target instanceof URL ? target.pathname : target}${problems ? `\n${problems} step(s) fold nothing: fix them before filming` : ''}`);
  if (problems) process.exitCode = 1;
  return !problems;
}
