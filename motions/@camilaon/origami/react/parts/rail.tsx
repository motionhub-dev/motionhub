// The step list beside the model: steps done in ink, the step in hand in the accent, the rest in pencil.
import type {ModelDef} from './fold.ts';

export const meta = {
  name: {en: 'Step rail', 'zh-CN': '步骤栏'},
  purpose: 'steps',
  line: 'The model\'s steps as a numbered list: done in ink, the one in hand in the accent, the rest in pencil.',
  fits: 'beside the fold stage while a model is folded; a contents list before the folding starts',
  params: {
    model: {type: 'ModelDef', doc: 'the model whose steps are listed'},
    at: {type: 'number', doc: 'steps done, fractional, the same value the fold stage takes'},
    step: {type: 'number', default: 'the one after the last done', doc: 'the step in hand, from 1: pass it so a step stays in hand through its hold, and the next one is in hand while it is marked'},
    size: {type: 'px', default: 32, doc: 'the step titles\' size'},
  },
  preview: 6.7,
};

export function StepRail({model, at, step, size = 32}: {model: ModelDef; at: number; step?: number; size?: number}) {
  const current = step ?? Math.min(Math.floor(at) + 1, model.steps.length + 1);
  return (
    <div style={{fontFamily: 'var(--font-sans)'}}>
      {model.steps.map((st, i) => {
        const n = i + 1, now = n === current, past = n < current;
        return (
          <div key={n} style={{display: 'flex', alignItems: 'baseline', gap: size * 0.7, height: size * 2,
            color: now ? 'var(--color-now)' : past ? 'var(--color-ink)' : 'var(--color-pencil)', opacity: now || past ? 1 : 0.75}}>
            <span style={{fontSize: size * 0.88, fontWeight: 700, width: size * 1.4, fontVariantNumeric: 'tabular-nums'}}>{String(n).padStart(2, '0')}</span>
            <span style={{fontSize: size, fontWeight: now ? 700 : 500, whiteSpace: 'nowrap'}}>{st.title}</span>
          </div>
        );
      })}
    </div>
  );
}
