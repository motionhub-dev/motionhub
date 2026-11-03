import {C, ICONS, Screen, Sprite, Window, Words, TEXT, px, steps} from './pixel.ts';

export const meta = {
  name: {en: 'Quest log', 'zh-CN': '冒险日志'},
  purpose: 'close',
  line: 'The run looked back on: a window lists the stages beaten, a gold star each, the last row the next quest.',
  fits: 'the end of a how-to or a lesson: the steps done, and what to learn next',
  params: {
    rows: {type: 'list', doc: 'the stages, a few words each; the last is the next quest when next is set'},
    shown: {type: 'number', default: 0, doc: 'how many rows are written; tween it up one row per word that names it'},
    next: {type: 'boolean', default: true, doc: 'the last row is the next quest: an arrow, no star'},
    title: {type: 'text', default: 'QUEST LOG', doc: 'the window\'s tab'},
    x: {type: 'px', default: 128, doc: 'the window\'s left edge, in game pixels'},
    y: {type: 'px', default: 48, doc: 'its top edge, in game pixels'},
    w: {type: 'px', default: 224, doc: 'its width, in game pixels'},
    open: {type: 'progress', default: 0, doc: '0 to 1: the window unfolds downwards in four steps'},
  },
  preview: 45.4,
};

export function Results({rows, shown = 0, next = true, title = 'QUEST LOG', x = 128, y = 48, w = 224, open = 0}: {rows: string[]; shown?: number; next?: boolean; title?: string; x?: number; y?: number; w?: number; open?: number}) {
  if (open <= 0) return null;
  const h = 18 + rows.length * 18;
  const hh = Math.max(8, Math.round(h * steps(open, 4)));
  return (
    <Screen>
      <Window x={x} y={y} w={w} h={hh} />
      {open >= 1 && (
        <g>
          <rect x={px(x) + 8} y={px(y) - 6} width={title.length * 6 + 9} height={11} fill={C.ink} />
          <rect x={px(x) + 9} y={px(y) - 5} width={title.length * 6 + 7} height={9} fill={C.gold} />
          <Words x={px(x) + 13} y={px(y) + 2} size={8} weight={700} color={C.ink} outline={null}>{title}</Words>
          {rows.map((row, i) => {
            if (i >= Math.floor(shown + 1e-6)) return null;
            const ry = px(y) + 14 + i * 18;
            const isNext = next && i === rows.length - 1;
            return (
              <g key={i}>
                {isNext
                  ? <path d={`M${px(x) + 10} ${ry + 2}h2v1h1v1h1v1h1v1h-1v1h-1v1h-1v1h-2z`} fill={C.mint} />
                  : <Sprite art={ICONS.star.art} pal={ICONS.star.pal} x={px(x) + 8} y={ry} />}
                <Words x={px(x) + 24} y={ry + 9} size={12} font={TEXT} color={isNext ? C.mint : C.bone} outline={null}>{row}</Words>
              </g>
            );
          })}
        </g>
      )}
    </Screen>
  );
}
