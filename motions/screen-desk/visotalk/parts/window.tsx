import React from 'react';

export const meta = {
  name: {en: 'App window', 'zh-CN': '应用窗口'},
  purpose: 'ground',
  line: 'A white app window on the desk with a long soft shadow, plain grey chrome, the app inside in greys and ink.',
  fits: 'the app a tutorial is about: settings, an editor, a dashboard; one window per app all film long',
  params: {
    title: {type: 'text', doc: 'the window title, as the app would write it'},
    width: {type: 'px', default: 1320, doc: 'the window\'s width in desk pixels'},
    height: {type: 'px', default: 740, doc: 'the window\'s height in desk pixels'},
  },
  preview: 16.8,
};

/** The shadow everything resting on the desk casts: long and soft, from a light above and to the left */
export const RESTING = '0 46px 90px -34px rgba(38, 36, 30, 0.38), 0 14px 30px -14px rgba(38, 36, 30, 0.20), 0 0 0 1px rgba(38, 36, 30, 0.06)';

export function AppWindow({title, width = 1320, height = 740, children}: {title: string; width?: number; height?: number; children?: React.ReactNode}) {
  return (
    <div style={{position: 'relative', width, height, borderRadius: 16, background: 'var(--vt-panel)', boxShadow: RESTING, overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
      <div style={{flex: '0 0 52px', display: 'flex', alignItems: 'center', position: 'relative', borderBottom: '1px solid var(--vt-border)', background: 'var(--vt-panel2)'}}>
        {/* one grip to hold the window by, no maker's buttons */}
        <div style={{width: 44, height: 6, marginLeft: 22, borderRadius: 3, background: 'var(--vt-faint)'}} />
        <div style={{position: 'absolute', left: 0, right: 0, textAlign: 'center', fontFamily: 'var(--vt-sans)', fontSize: 19, color: 'var(--vt-muted)', letterSpacing: '0.01em'}}>{title}</div>
      </div>
      <div style={{flex: '1 1 auto', position: 'relative', minHeight: 0}}>{children}</div>
    </div>
  );
}
