// The reel player: a motion's react/reel.tsx drawn live by @motionhub/runtime at the time this clock is at, scaled to
// the frame, with play, pause and a scrubber, and the motion's sound (react/sound.json) on the reel's cues when the viewer turns
// it on. It runs in a sandboxed frame (site/player/build.mjs, _headers).
import {useEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MotionRoot, MotionRuntimeProvider} from '@motionhub/runtime';
import * as R from 'motionhub:reel';
import sound from 'motionhub:sound';
import {renderSound} from 'motionhub:sound-lib';
import tokens from 'motionhub:tokens';

// a reel plays no footage (the catalogue holds no video): a component's <Video> is a quiet stand-in of its size
const Footage = ({style}) => <div style={{width: '100%', height: '100%', background: 'radial-gradient(120% 90% at 50% 35%, #5b6068, #2a2d33 60%, #17191d)', ...style}} />;

const Reel = R.default, reel = R.reel, cues = Array.isArray(R.cues) ? R.cues : [];
// a reel sounds when its motion has a sound and it says when things happen
const audible = !!sound && cues.length > 0;
const W = reel.width ?? 1920, H = reel.height ?? 1080, LENGTH = reel.seconds;
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
// a reel that draws in 3D waits for a tap on a device that would struggle with it: few cores, little memory, or a phone
const heavy = document.getElementById('player').dataset.heavy === '1';
const weak = (navigator.hardwareConcurrency ?? 8) <= 4 || (navigator.deviceMemory ?? 8) <= 4 || matchMedia('(pointer: coarse)').matches;
const wait = still || (heavy && weak);
const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function Player() {
  const [t, setT] = useState(wait ? (reel.poster ?? 0) : 0);
  const [playing, setPlaying] = useState(!wait);
  // drawing stops while the frame is scrolled out of sight, and starts again where it was
  const [seen, setSeen] = useState(true);
  const [scale, setScale] = useState(1);
  const last = useRef(0);
  // the sound: off until the viewer turns it on (a browser plays nothing before a gesture); rendered once, then played from where the picture is
  const [muted, setMuted] = useState(true);
  const audio = useRef({ctx: null, buffer: null, src: null, startedAt: 0});
  const tRef = useRef(t);
  tRef.current = t;
  const stopSound = () => { try { audio.current.src?.stop(); } catch {} audio.current.src = null; };
  const startSound = (at) => {
    stopSound();
    const a = audio.current;
    if (!a.ctx) {
      a.ctx = new AudioContext();
      const samples = renderSound({seconds: LENGTH, cues, sound, rate: a.ctx.sampleRate});
      a.buffer = a.ctx.createBuffer(1, samples.length, a.ctx.sampleRate);
      a.buffer.copyToChannel(samples, 0);
    }
    a.ctx.resume();
    a.src = a.ctx.createBufferSource();
    a.src.buffer = a.buffer;
    a.src.connect(a.ctx.destination);
    a.src.start(0, Math.min(at, LENGTH - 0.01));
    a.startedAt = a.ctx.currentTime - at;
  };
  useEffect(() => {
    if (muted || !playing || !seen) { stopSound(); return; }
    startSound(tRef.current);
    return stopSound;
  }, [muted, playing, seen]);
  useEffect(() => {
    const fit = () => setScale(Math.min(innerWidth / W, innerHeight / H));
    fit();
    addEventListener('resize', fit);
    return () => removeEventListener('resize', fit);
  }, []);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting));
    io.observe(document.getElementById('player'));
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!playing || !seen) return;
    let id;
    last.current = performance.now();
    const tick = (now) => {
      // a hidden tab or a throttled frame resumes where it was, not seconds later
      const dt = Math.min(0.1, (now - last.current) / 1000);
      last.current = now;
      const a = audio.current;
      // while the sound plays, its clock is the picture's, so the two never drift
      let next = a.src ? a.ctx.currentTime - a.startedAt : tRef.current + dt;
      if (next >= LENGTH) { next -= LENGTH * Math.floor(next / LENGTH); if (a.src) startSound(next); }
      setT(next);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [playing, seen]);
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
      {!playing && <button type="button" className="big" aria-label="Play" onClick={() => setPlaying(true)}>
        <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true"><path d="M8 5l11 7-11 7z" fill="currentColor"/></svg>
      </button>}
      <div className="bar">
        <button type="button" aria-label={playing ? 'Pause' : 'Play'} onClick={() => setPlaying((p) => !p)}>
          {playing
            ? <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M7 5h3v14H7zM14 5h3v14h-3z" fill="currentColor"/></svg>
            : <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M8 5l11 7-11 7z" fill="currentColor"/></svg>}
        </button>
        <input type="range" min="0" max={LENGTH} step="0.01" value={t} aria-label="Time" onChange={(e) => { setPlaying(false); setT(Number(e.target.value)); }} />
        <span className="time">{clock(t)} / {clock(LENGTH)}</span>
        {audible && <button type="button" aria-label={muted ? 'Sound on' : 'Sound off'} aria-pressed={!muted} onClick={() => setMuted((m) => !m)}>
          {muted
            ? <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4zM16 9l5 6M21 9l-5 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            : <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>}
        </button>}
      </div>
    </>
  );
}

createRoot(document.getElementById('player')).render(<Player />);
