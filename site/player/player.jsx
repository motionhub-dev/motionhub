// The reel player: a motion's react/reel.tsx drawn live by @motionhub/runtime at the time this clock is at, scaled to
// the frame, with play, pause and a scrubber. It runs in a sandboxed frame (site/player/build.mjs, _headers).
import {useEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MotionRoot, MotionRuntimeProvider} from '@motionhub/runtime';
import Reel, {reel} from 'motionhub:reel';
import tokens from 'motionhub:tokens';

// a reel plays no footage (the catalogue holds no video): a component's <Video> is a quiet stand-in of its size
const Footage = ({style}) => <div style={{width: '100%', height: '100%', background: 'radial-gradient(120% 90% at 50% 35%, #5b6068, #2a2d33 60%, #17191d)', ...style}} />;

const W = reel.width ?? 1920, H = reel.height ?? 1080, LENGTH = reel.seconds;
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function Player() {
  const [t, setT] = useState(still ? (reel.poster ?? 0) : 0);
  const [playing, setPlaying] = useState(!still);
  const [scale, setScale] = useState(1);
  const last = useRef(0);
  useEffect(() => {
    const fit = () => setScale(Math.min(innerWidth / W, innerHeight / H));
    fit();
    addEventListener('resize', fit);
    return () => removeEventListener('resize', fit);
  }, []);
  useEffect(() => {
    if (!playing) return;
    let id;
    last.current = performance.now();
    const tick = (now) => {
      const dt = (now - last.current) / 1000;
      last.current = now;
      setT((v) => (v + dt) % LENGTH);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [playing]);
  useEffect(() => {
    const key = (e) => { if (e.key === ' ' || e.key === 'k') { e.preventDefault(); setPlaying((p) => !p); } };
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  }, []);
  const value = {useTime: () => t, useCompositionTime: () => t, fps: 30, width: W, height: H, tokens, Video: Footage};
  return (
    <>
      <div className="frame" style={{width: W, height: H, transform: `translate(-50%, -50%) scale(${scale})`}} onClick={() => setPlaying((p) => !p)}>
        <MotionRuntimeProvider value={value}><MotionRoot tokens={tokens}><Reel /></MotionRoot></MotionRuntimeProvider>
      </div>
      <div className="bar">
        <button type="button" aria-label={playing ? 'Pause' : 'Play'} onClick={() => setPlaying((p) => !p)}>
          {playing
            ? <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M7 5h3v14H7zM14 5h3v14h-3z" fill="currentColor"/></svg>
            : <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M8 5l11 7-11 7z" fill="currentColor"/></svg>}
        </button>
        <input type="range" min="0" max={LENGTH} step="0.01" value={t} aria-label="Time" onChange={(e) => { setPlaying(false); setT(Number(e.target.value)); }} />
        <span className="time">{clock(t)} / {clock(LENGTH)}</span>
      </div>
    </>
  );
}

createRoot(document.getElementById('player')).render(<Player />);
