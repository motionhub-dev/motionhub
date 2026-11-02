import {useZoom} from './desk.tsx';

export const meta = {
  name: {en: 'Cursor', 'zh-CN': '光标'},
  purpose: 'mark',
  line: 'The viewer\'s pointer, ink edged in white: it lands just before the camera and clicks with a ripple and sparks.',
  fits: 'a click or choice the viewer makes; the viewer\'s hand, never the guide\'s',
  params: {
    x: {type: 'px', doc: 'the tip, across, in desk pixels'},
    y: {type: 'px', doc: 'the tip, down, in desk pixels'},
    click: {type: 'progress', default: 0, doc: '0 to 1 over a click: the pointer dips, sparks fly and a ripple spreads and fades; set it to 0 before the next click'},
  },
  preview: 18.3,
};

const unit = (v: number) => Math.max(0, Math.min(1, v));

export function Cursor({x, y, click = 0}: {x: number; y: number; click?: number}) {
  const z = useZoom();
  const c = unit(click);
  const live = c > 0.001 && c < 0.999;
  const dip = 1 - 0.16 * Math.sin(Math.PI * unit(c * 2.4));
  const ripple = 10 + 46 * (1 - (1 - c) * (1 - c));
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, transform: `scale(${(1 / z).toFixed(4)})`, transformOrigin: '0 0', pointerEvents: 'none'}}>
      {live && (
        <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <circle cx={0} cy={0} r={ripple} fill="var(--vt-data)" fillOpacity={0.14 * (1 - c)} stroke="var(--vt-data)" strokeWidth={3} strokeOpacity={1 - c} />
          {/* eight short sparks thrown out with the press, gone before the ripple */}
          {c < 0.6 && Array.from({length: 8}, (_, i) => {
            const a = (i / 8) * Math.PI * 2 + 0.3, k = c / 0.6, r0 = 20 + 34 * k, r1 = r0 + 14 * (1 - k);
            return <line key={i} x1={Math.cos(a) * r0} y1={Math.sin(a) * r0} x2={Math.cos(a) * r1} y2={Math.sin(a) * r1} stroke="var(--vt-data)" strokeWidth={3.5} strokeLinecap="round" opacity={1 - k} />;
          })}
        </svg>
      )}
      <svg width={40} height={48} viewBox="0 0 40 48" style={{position: 'absolute', left: -5, top: -3, overflow: 'visible', transform: `scale(${dip.toFixed(3)})`, transformOrigin: '5px 3px',
        filter: 'drop-shadow(0 6px 8px rgba(28, 29, 33, 0.30))'}}>
        <path d="M5 3 L5 37 L13.5 29.5 L19.5 43 L25.5 40.4 L19.6 27.2 L31 27 Z" fill="var(--vt-text)" stroke="#fff" strokeWidth={3} strokeLinejoin="round" />
      </svg>
    </div>
  );
}
