import {RESTING} from './window.tsx';

export const meta = {
  name: {en: 'Title card', 'zh-CN': '标题卡'},
  purpose: 'title',
  line: 'A white card dropped on the desk: the app\'s icon, a small blue label and the title in bold ink.',
  fits: 'the opening of a tutorial or walkthrough',
  params: {
    title: {type: 'text', doc: 'the title, a few words on one or two lines'},
    eyebrow: {type: 'text', default: '', doc: 'above it, in small capitals: "How to · 3 steps", "New in 4.2"'},
    icon: {type: 'text', default: '', doc: 'one or two letters on the app\'s icon'},
    width: {type: 'px', default: 720, doc: 'the card\'s width in desk pixels'},
  },
  preview: 6.6,
};

export function TitleCard({title, eyebrow = '', icon = '', width = 720}: {title: string; eyebrow?: string; icon?: string; width?: number}) {
  return (
    <div style={{width, boxSizing: 'border-box', padding: '40px 46px 46px', borderRadius: 22, background: 'var(--vt-panel)', boxShadow: RESTING, fontFamily: 'var(--vt-sans)', color: 'var(--vt-text)'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 18, marginBottom: 30}}>
        {icon && <div style={{width: 64, height: 64, borderRadius: 16, background: 'var(--vt-text)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700}}>{icon}</div>}
        {eyebrow && <div style={{fontFamily: 'var(--vt-mono)', fontSize: 22, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--vt-data)', fontWeight: 700}}>{eyebrow}</div>}
      </div>
      <div style={{fontSize: 68, fontWeight: 700, lineHeight: 1.08, letterSpacing: '-0.02em', whiteSpace: 'pre-line'}}>{title}</div>
    </div>
  );
}
