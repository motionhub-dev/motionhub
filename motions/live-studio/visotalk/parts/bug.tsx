import {RED, Roll, Sheen, ink, label, shade, slide, slot, stage} from './package.ts';

export const meta = {
  name: {en: 'Channel bug', 'zh-CN': '台标角标'},
  purpose: 'open',
  line: 'Corner bug: the mark on a red block, state and date on ink; stays on air, flips its state in place.',
  fits: 'a show or week; live or replay',
  params: {
    mark: {type: 'text', doc: 'the channel\'s mark, two to five characters: an episode, a week, a desk'},
    state: {type: 'text', default: 'LIVE', doc: 'the state word after the dot: LIVE, REPLAY, THIS WEEK'},
    next: {type: 'text', default: '', doc: 'the state it flips to'},
    flip: {type: 'progress', default: 0, doc: '0 to 1: the state rolls from `state` to `next`'},
    date: {type: 'text', default: '', doc: 'a short dateline after the state'},
    show: {type: 'progress', default: 1, doc: '0 to 1 over about 1 s: the block drops in, the strip shoots out of it, a glint crosses the block'},
  },
  preview: 26.5,
};

/** Place it in the top corner: <Part x={1224} y={54} w={600} h={68}>; it sits against the box's right edge. */
export function Bug({mark, state = 'LIVE', next = '', flip = 0, date = '', show = 1}: {mark: string; state?: string; next?: string; flip?: number; date?: string; show?: number}) {
  const type = stage(show, 0.45, 0.7);
  const word = (w: string) => <span style={{...label, fontSize: 38, color: 'var(--vt-text)', whiteSpace: 'nowrap'}}>{w}</span>;
  return (
    <div style={{position: 'absolute', right: 0, top: 0, height: 68, display: 'flex', alignItems: 'stretch', boxShadow: shade}}>
      <div data-vt-camera="" style={{...slot, zIndex: 1}}>
        <div style={{...slide(show, 0, 0.3, 'top'), position: 'relative', height: '100%', background: RED, minWidth: 60, padding: '0 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box'}}>
          <span style={{...label, fontSize: 40, fontWeight: 900, color: '#FFFFFF', letterSpacing: '0.02em', whiteSpace: 'nowrap'}}>{mark}</span>
          <Sheen p={(show - 0.7) / 0.3} />
        </div>
      </div>
      <div data-vt-camera="" style={slot}>
      <div style={{...ink, ...slide(show, 0.2, 0.55), height: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '0 20px 0 18px'}}>
        <span style={{width: 14, height: 14, background: RED, flex: 'none', opacity: type}} />
        <div style={{opacity: type}}>{next ? <Roll from={word(state)} to={word(next)} p={flip} style={{height: 40, display: 'flex', alignItems: 'center'}} /> : word(state)}</div>
        {date && <span style={{fontFamily: 'var(--vt-sans)', fontWeight: 600, fontSize: 30, letterSpacing: '0.04em', color: 'var(--vt-muted)', whiteSpace: 'nowrap', opacity: type, borderLeft: '2px solid var(--vt-border)', paddingLeft: 14}}>{date}</span>}
      </div>
      </div>
    </div>
  );
}
