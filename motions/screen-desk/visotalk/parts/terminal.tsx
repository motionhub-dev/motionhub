import {useTime, random} from '@visotalk/runtime';
import {AppWindow} from './window.tsx';

export const meta = {
  name: {en: 'Terminal', 'zh-CN': '终端'},
  purpose: 'quote',
  line: 'A light terminal: the command typed at a hand\'s rhythm, output printed line by line, a success line ticked in green.',
  fits: 'a command and its output: an install, a status check, a deploy; an example, never a measurement',
  params: {
    title: {type: 'text', default: 'Terminal', doc: 'the window title'},
    prompt: {type: 'text', default: '~ $', doc: 'the prompt before the command'},
    command: {type: 'text', doc: 'the command, as typed'},
    typed: {type: 'progress', default: 1, doc: '0 to 1: how much of the command is typed'},
    output: {type: 'list', default: [], doc: 'the lines it prints; a line starting with ✓ is a success (its tick drawn, a green sweep across it while it prints), with ! a failure; two spaces or more line up as columns'},
    shown: {type: 'number', default: 0, doc: 'how many output lines have printed; tween it to print them one after another'},
    width: {type: 'px', default: 1000, doc: 'the window\'s width in desk pixels'},
    height: {type: 'px', default: 560, doc: 'the window\'s height in desk pixels'},
  },
  preview: 34.4,
};

const unit = (v: number) => Math.max(0, Math.min(1, v));
const LINE = 46;

/** How many characters are typed at `typed`: a hand's rhythm (uneven keys, a beat longer after a space), the same every time */
function typedChars(command: string, typed: number) {
  const g = random(`screen-desk:typing:${command}`);
  const weights = Array.from(command, (ch) => 0.6 + 0.9 * g() + (ch === ' ' ? 0.7 : 0));
  const total = weights.reduce((a, b) => a + b, 0);
  let at = unit(typed) * total, n = 0;
  for (const w of weights) { if (at < w) break; at -= w; n++; }
  return n;
}

export function Terminal({title = 'Terminal', prompt = '~ $', command, typed = 1, output = [], shown = 0, width = 1000, height = 560}: {title?: string; prompt?: string; command: string; typed?: number; output?: string[]; shown?: number; width?: number; height?: number}) {
  const t = useTime();
  const chars = typedChars(command, typed);
  const typing = typed < 0.999;
  const caret = typing || shown > 0.01 ? true : Math.floor(t * 1.6) % 2 === 0;
  const lines = Math.min(output.length, Math.max(0, shown));
  // rows that fit under the command; the text scrolls up once the output passes them
  const room = Math.floor((height - 52 - 44 - LINE) / LINE) - 1;
  const scroll = Math.max(0, lines - room) * LINE;
  return (
    <AppWindow title={title} width={width} height={height}>
      <div style={{position: 'absolute', inset: 0, padding: '26px 34px', overflow: 'hidden', fontFamily: 'var(--vt-mono)', fontSize: 27, lineHeight: `${LINE}px`, color: 'var(--vt-text)', background: '#FCFCFB'}}>
        <div style={{transform: `translateY(${-scroll.toFixed(1)}px)`}}>
          <div style={{whiteSpace: 'pre'}}>
            <span style={{color: 'var(--vt-muted)'}}>{prompt} </span>
            <span style={{fontWeight: 700}}>{command.slice(0, chars)}</span>
            {shown <= 0.01 && <span style={{display: 'inline-block', width: 15, height: 32, marginLeft: 2, verticalAlign: -6, background: 'var(--vt-text)', opacity: caret ? 1 : 0}} />}
          </div>
          {output.map((line, i) => {
            const k = unit(lines - i);
            if (k <= 0) return null;
            const ok = line.startsWith('✓'), bad = line.startsWith('!');
            const text = ok ? line.slice(1).trimStart() : line;
            const lit = k * 100;
            return (
              <div key={i} style={{whiteSpace: 'pre', display: 'flex', alignItems: 'center', margin: ok ? '12px -12px 0' : 0, padding: ok ? '0 12px' : 0, borderRadius: 8,
                opacity: ok ? 1 : k, transform: `translateY(${(10 * (1 - k)).toFixed(1)}px)`,
                background: ok ? `linear-gradient(90deg, rgba(30, 154, 91, 0.10) 0%, rgba(30, 154, 91, 0.10) ${Math.max(0, lit - 8)}%, rgba(30, 154, 91, ${(0.38 * (1 - k)).toFixed(3)}) ${lit}%, transparent ${lit}%)` : undefined,
                color: ok ? 'var(--vt-good)' : bad ? 'var(--vt-bad)' : 'var(--vt-muted)', fontWeight: ok || bad ? 700 : 400}}>
                {ok && (
                  <svg width={26} height={26} viewBox="0 0 26 26" style={{flex: 'none', marginRight: 12}}>
                    <path d="M4 14 L10.5 20 L22 6" fill="none" stroke="var(--vt-good)" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="30" strokeDashoffset={30 * (1 - unit(k * 1.6))} />
                  </svg>
                )}
                <span style={{opacity: ok ? unit(k * 1.4 - 0.2) : 1}}>
                  {text.split(/( {2,})/).map((cell, j) => (j % 2 ? <span key={j} style={{display: 'inline-block', width: 24}} /> : <span key={j} style={{display: 'inline-block', minWidth: j === 0 && output.some((l) => / {2,}/.test(l)) && / {2,}/.test(line) ? 210 : 0, color: j > 0 && !ok && !bad ? 'var(--vt-text)' : undefined}}>{cell}</span>))}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </AppWindow>
  );
}
