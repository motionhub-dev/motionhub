import React from 'react';
import {RESTING} from './window.tsx';

export const meta = {
  name: {en: 'Phone', 'zh-CN': '手机'},
  purpose: 'close',
  line: 'A plain phone slab on the desk showing the time; a notification drops in with the result and it buzzes.',
  fits: 'the result on another device: a backup done, a payment, a build shipped',
  params: {
    time: {type: 'text', default: '7:30', doc: 'the clock on the lock screen'},
    date: {type: 'text', default: '', doc: 'the line under the clock'},
    app: {type: 'text', default: '', doc: 'the app the notification is from'},
    icon: {type: 'text', default: '', doc: 'one or two letters on the app\'s icon'},
    title: {type: 'text', default: '', doc: 'the notification\'s first line, bold'},
    body: {type: 'text', default: '', doc: 'the notification\'s text, a sentence at most'},
    notify: {type: 'progress', default: 0, doc: '0 to 1: the notification drops in and settles while the phone buzzes'},
  },
  preview: 38.4,
};

const unit = (v: number) => Math.max(0, Math.min(1, v));
const backOut = (t: number) => { const c = 1.2; const u = t - 1; return 1 + (c + 1) * u * u * u + c * u * u; };

export const PHONE_W = 400;
export const PHONE_H = 820;

export function Phone({time = '7:30', date = '', app = '', icon = '', title = '', body = '', notify = 0, children}: {time?: string; date?: string; app?: string; icon?: string; title?: string; body?: string; notify?: number; children?: React.ReactNode}) {
  const n = unit(notify);
  const drop = backOut(n);
  // it buzzes as the notification lands: a few quick turns either way, dying out
  const buzz = n > 0.05 && n < 0.6 ? Math.sin((n - 0.05) * Math.PI * 2 * 6) * 1.6 * (1 - (n - 0.05) / 0.55) : 0;
  return (
    // a plain slab with an even bezel: a phone, not any maker's phone
    <div style={{position: 'relative', width: PHONE_W, height: PHONE_H, borderRadius: 46, background: '#1C1D21', padding: 18, boxSizing: 'border-box', boxShadow: RESTING,
      transform: buzz ? `rotate(${buzz.toFixed(3)}deg)` : undefined}}>
      <div style={{position: 'relative', width: '100%', height: '100%', borderRadius: 30, overflow: 'hidden', background: 'linear-gradient(180deg, var(--vt-panel2) 0%, #E6E8EC 100%)'}}>
        {children ?? (
          <div style={{position: 'absolute', left: 30, right: 30, top: 44, color: 'var(--vt-text)', fontFamily: 'var(--vt-sans)', borderBottom: '1px solid var(--vt-border)', paddingBottom: 22}}>
            <div style={{fontSize: 64, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em'}}>{time}</div>
            {date && <div style={{fontSize: 22, color: 'var(--vt-muted)', marginTop: 10}}>{date}</div>}
          </div>
        )}
        {(title || body) && (
          <div style={{position: 'absolute', left: 16, right: 16, top: 200, padding: '20px 22px', borderRadius: 16, background: 'var(--vt-panel)',
            boxShadow: RESTING, fontFamily: 'var(--vt-sans)', color: 'var(--vt-text)',
            opacity: unit(n * 3), transform: `translateY(${(-150 * (1 - drop)).toFixed(1)}px)`}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10}}>
              <div style={{width: 38, height: 38, borderRadius: 10, background: 'var(--vt-text)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700}}>{icon}</div>
              <div style={{fontSize: 21, fontWeight: 700, color: 'var(--vt-text)', flex: 1}}>{app}</div>
              <div style={{fontSize: 18, color: 'var(--vt-muted)'}}>now</div>
            </div>
            <div style={{fontSize: 29, fontWeight: 700, lineHeight: 1.2}}>{title}</div>
            <div style={{fontSize: 26, lineHeight: 1.3, color: 'var(--vt-text)', marginTop: 6}}>{body}</div>
          </div>
        )}
      </div>
    </div>
  );
}
