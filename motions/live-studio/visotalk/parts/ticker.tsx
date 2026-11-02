import {useDocTime} from '@visotalk/runtime';
import {RED, ink, label, stage, wipe} from './package.ts';

export const meta = {
  name: {en: 'Ticker', 'zh-CN': '滚动字幕条'},
  purpose: 'steps',
  line: 'A crawl along the foot behind a red label; stays on air.',
  fits: 'the week\'s other items; a story\'s facts',
  params: {
    label: {type: 'text', doc: 'the red block\'s word: LATEST, THIS WEEK, MARKETS'},
    items: {type: 'list', doc: 'short headlines in capitals, a few words each; they repeat'},
    speed: {type: 'number', default: 110, doc: 'pixels a second the crawl moves'},
    show: {type: 'progress', default: 1, doc: '0 to 1: the label block, then the band pushes out of it'},
  },
  preview: 9,
};

/** A full-width band: <Part x={96} y={964} w={1728} h={62}>. It crawls by the film's clock, so it never jumps between scenes. */
export function Ticker({label: word, items, speed = 110, show = 1}: {label: string; items: string[]; speed?: number; show?: number}) {
  const t = useDocTime();
  const block = stage(show, 0, 0.45), band = stage(show, 0.3, 1);
  // enough copies to cover the crawl of a long film (an estimate of the text's width, generous on purpose)
  const chars = items.join('').length + items.length * 4;
  const copies = Math.max(2, Math.ceil((speed * Math.max(t, 1) + 2400) / (chars * 20)) + 1);
  const run = Array.from({length: copies}, () => items).flat();
  return (
    <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'stretch', boxShadow: '0 10px 26px -12px rgba(0, 0, 0, 0.9)'}}>
      <div style={{...wipe(block, 'bottom'), background: RED, padding: '0 22px', display: 'flex', alignItems: 'center', zIndex: 1}}>
        <span style={{...label, fontSize: 38, fontWeight: 900, color: '#FFFFFF', whiteSpace: 'nowrap'}}>{word}</span>
      </div>
      <div data-vt-camera="" style={{...ink, ...wipe(band), flex: 1, position: 'relative', overflow: 'hidden', borderTop: '2px solid var(--vt-border)'}}>
        <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', transform: `translateX(${Math.round(28 - speed * Math.max(0, t))}px)`}}>
          {run.map((it, i) => (
            <span key={i} style={{display: 'inline-flex', alignItems: 'center'}}>
              <span style={{fontFamily: 'var(--vt-sans)', fontWeight: 700, fontSize: 33, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--vt-text)'}}>{it}</span>
              <span style={{width: 10, height: 10, background: RED, margin: '0 28px'}} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
