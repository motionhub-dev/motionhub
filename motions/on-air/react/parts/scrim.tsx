import {unit} from './ink.ts';

export const meta = {
  name: {en: 'Scrim', 'zh-CN': '压暗'},
  purpose: 'ground',
  line: 'A soft shadow over one edge of the shot, so tags on a bright or busy picture stay readable.',
  fits: 'a sunny exterior under a tag; captions over a busy floor',
  params: {
    side: {type: 'text', default: 'bottom', doc: 'the edge it darkens: bottom, left, right or top'},
    depth: {type: 'progress', default: 1, doc: '0 to 1: how dark, 1 at its darkest'},
    reach: {type: 'number', default: 45, doc: 'how far into the frame it reaches, in percent'},
  },
  preview: 2,
};

const TOWARD = {bottom: 'to top', top: 'to bottom', left: 'to right', right: 'to left'} as const;

export function Scrim({side = 'bottom', depth = 1, reach = 45}: {side?: keyof typeof TOWARD; depth?: number; reach?: number}) {
  const a = (0.62 * unit(depth)).toFixed(3);
  return <div style={{position: 'absolute', inset: 0, background: `linear-gradient(${TOWARD[side]}, rgba(0, 0, 0, ${a}) 0%, rgba(0, 0, 0, 0) ${reach}%)`}} />;
}
