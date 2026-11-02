import {RED, Roll, Sheen, label, plate, rise, slide, slot, stage, wipe} from './package.ts';

export const meta = {
  name: {en: 'Headline strap', 'zh-CN': '标题条'},
  purpose: 'title',
  line: 'A headline plate shot out from behind a red category tab; its words roll over in place.',
  fits: 'what a passage is about; a story that develops',
  params: {
    tab: {type: 'text', doc: 'the category, one word: LAUNCH, MARKETS, REVIEW'},
    text: {type: 'text', doc: 'the headline, under about forty characters'},
    next: {type: 'text', default: '', doc: 'the headline it rolls over to'},
    flip: {type: 'progress', default: 0, doc: '0 to 1: the words roll from `text` to `next`'},
    show: {type: 'progress', default: 1, doc: '0 to 1 over about 1 s: tab, plate, words, a glint on the tab'},
  },
  preview: 29.4,
};

/** A box about 1100 × 80 on the lower third; the strap hugs its bottom-left corner. */
export function Headline({tab, text, next = '', flip = 0, show = 1}: {tab: string; text: string; next?: string; flip?: number; show?: number}) {
  const t1 = stage(show, 0, 0.25), type = stage(show, 0.32, 0.65);
  const words = (w: string) => <div style={{fontFamily: 'var(--vt-sans)', fontWeight: 800, fontSize: 50, lineHeight: '74px', letterSpacing: '-0.01em', whiteSpace: 'nowrap'}}>{w}</div>;
  return (
    <div style={{position: 'absolute', left: 0, bottom: 0, display: 'flex', alignItems: 'stretch', height: 74, filter: 'drop-shadow(0 10px 18px rgba(0, 0, 0, 0.55))'}}>
      <div style={{...wipe(t1, 'bottom'), position: 'relative', background: RED, padding: '0 22px', display: 'flex', alignItems: 'center', zIndex: 1}}>
        <span style={{...label, fontSize: 40, fontWeight: 900, color: '#FFFFFF'}}>{tab}</span>
        <Sheen p={(show - 0.66) / 0.3} />
      </div>
      <div data-vt-camera="" style={slot}>
        <div data-vt-camera="" style={{...plate, ...slide(show, 0.12, 0.5), overflow: 'hidden', padding: '0 30px', height: '100%'}}>
          <div style={rise(type)}>{next ? <Roll from={words(text)} to={words(next)} p={flip} style={{height: 74}} /> : words(text)}</div>
        </div>
      </div>
    </div>
  );
}
