// The reel player: a motion's react/reel.tsx drawn live by @motionhub/runtime at the time this clock is at, scaled to
// the frame, with play and pause, a scrubber that keeps playing, the motion's sound (react/sound.json) on the reel's
// cues, full screen and keys. It runs in a sandboxed frame (site/player/build.mjs, _headers). A motion's page loads it
// when the viewer presses play, with ?autoplay=1&sound=1: it then starts at once with the sound on, and tells the page
// when its first frame is drawn (a "motionhub:ready" message), so the page can take its poster away. With ?render=1 it is
// a still for player/render.mjs instead: the frame at full size, no controls and no clock, moved by window.__motionhub.seek.
import {useCallback, useEffect, useRef, useState} from 'react';
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
const params = new URLSearchParams(location.search);
const asked = params.get('autoplay') === '1';
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
// opened on its own, a reel that draws in 3D waits for a tap on a device that would struggle with it: few cores, little
// memory, or a phone. Asked to play, it plays: the viewer pressed play on the motion's page
const heavy = document.getElementById('player').dataset.heavy === '1';
const weak = (navigator.hardwareConcurrency ?? 8) <= 4 || (navigator.deviceMemory ?? 8) <= 4 || matchMedia('(pointer: coarse)').matches;
const wait = !asked && (still || (heavy && weak));
const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const SEEK = 2, IDLE_MS = 2500;

const Icon = ({d, fill = false}) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path d={d} fill={fill ? 'currentColor' : 'none'} stroke={fill ? 'none' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const PLAY = 'M8 5l11 7-11 7z', PAUSE = 'M7 5h3v14H7zM14 5h3v14h-3z';
const SOUND_ON = 'M4 9h4l5-4v14l-5-4H4zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12';
const SOUND_OFF = 'M4 9h4l5-4v14l-5-4H4zM16 9l5 6M21 9l-5 6';
const FULL = 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5', SMALL = 'M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5';

function Player() {
  const [t, setT] = useState(wait ? (reel.poster ?? 0) : 0);
  const [playing, setPlaying] = useState(!wait);
  // drawing stops while the frame is scrolled out of sight, and starts again where it was
  const [seen, setSeen] = useState(true);
  const [scale, setScale] = useState(1);
  const [idle, setIdle] = useState(false);
  const [full, setFull] = useState(false);
  // the sound: on when the page asked for it and the browser lets it start, else off until the viewer turns it on
  const [muted, setMuted] = useState(!(asked && params.get('sound') === '1' && audible));
  const [blocked, setBlocked] = useState(false);
  const last = useRef(0);
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
    // a browser that will not start sound without a gesture in this frame leaves it suspended: say so, and wait for a tap
    a.ctx.resume().then(() => { if (a.ctx.state !== 'running') { setMuted(true); setBlocked(true); } }, () => { setMuted(true); setBlocked(true); });
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

  const seek = useCallback((to) => {
    const next = Math.max(0, Math.min(LENGTH - 0.01, to));
    tRef.current = next;
    setT(next);
    if (audio.current.src) startSound(next);
  }, []);
  const toggle = useCallback(() => setPlaying((p) => !p), []);
  const fullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);
  const toggleSound = useCallback(() => { setBlocked(false); setMuted((m) => !m); }, []);

  useEffect(() => {
    const fit = () => setScale(Math.min(innerWidth / W, innerHeight / H));
    fit();
    addEventListener('resize', fit);
    const onFull = () => setFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFull);
    return () => { removeEventListener('resize', fit); document.removeEventListener('fullscreenchange', onFull); };
  }, []);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting));
    io.observe(document.getElementById('player'));
    return () => io.disconnect();
  }, []);
  // the page that asked for the player hears when its first frame is up
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => parent.postMessage({type: 'motionhub:ready'}, '*')));
    return () => cancelAnimationFrame(id);
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
      tRef.current = next;
      setT(next);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [playing, seen]);
  // the controls step aside while the reel plays and the pointer rests; any move or key brings them back
  useEffect(() => {
    let timer;
    const wake = () => { setIdle(false); clearTimeout(timer); timer = setTimeout(() => setIdle(true), IDLE_MS); };
    wake();
    addEventListener('pointermove', wake);
    addEventListener('keydown', wake);
    return () => { clearTimeout(timer); removeEventListener('pointermove', wake); removeEventListener('keydown', wake); };
  }, []);
  useEffect(() => {
    const key = (e) => {
      if (e.target instanceof HTMLInputElement && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) return;
      if (e.key === ' ' || e.key === 'k') { e.preventDefault(); toggle(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); seek(tRef.current - SEEK); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); seek(tRef.current + SEEK); }
      else if (e.key === 'Home' || e.key === '0') { e.preventDefault(); seek(0); }
      else if (e.key === 'm' && audible) toggleSound();
      else if (e.key === 'f') fullscreen();
    };
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  }, [toggle, seek, toggleSound, fullscreen]);

  const value = {useTime: () => t, useCompositionTime: () => t, fps: 30, width: W, height: H, tokens, Video: Footage};
  const shown = !playing || !idle;
  return (
    <div className={`shell${shown ? '' : ' idle'}`}>
      <div className="frame" style={{width: W, height: H, transform: `translate(-50%, -50%) scale(${scale})`}} onClick={toggle} onDoubleClick={fullscreen}>
        <MotionRuntimeProvider value={value}><MotionRoot tokens={tokens}><Reel /></MotionRoot></MotionRuntimeProvider>
      </div>
      {!playing && <button type="button" className="big" aria-label="Play" onClick={() => setPlaying(true)}><Icon d={PLAY} fill /></button>}
      {blocked && <button type="button" className="chip" onClick={toggleSound}><Icon d={SOUND_OFF} /> Tap for sound</button>}
      <div className="bar">
        <input className="scrub" type="range" min="0" max={LENGTH} step="0.01" value={t} aria-label="Time" aria-valuetext={`${clock(t)} of ${clock(LENGTH)}`}
          style={{'--p': `${(t / LENGTH) * 100}%`}} onChange={(e) => seek(Number(e.target.value))} />
        <div className="row">
          <button type="button" aria-label={playing ? 'Pause (k)' : 'Play (k)'} title={playing ? 'Pause (k)' : 'Play (k)'} onClick={toggle}><Icon d={playing ? PAUSE : PLAY} fill /></button>
          {audible && <button type="button" aria-label={muted ? 'Sound on (m)' : 'Sound off (m)'} title={muted ? 'Sound on (m)' : 'Sound off (m)'} aria-pressed={!muted} onClick={toggleSound}><Icon d={muted ? SOUND_OFF : SOUND_ON} /></button>}
          <span className="time">{clock(t)} <span>/ {clock(LENGTH)}</span></span>
          <span className="gap" />
          <button type="button" aria-label={full ? 'Exit full screen (f)' : 'Full screen (f)'} title={full ? 'Exit full screen (f)' : 'Full screen (f)'} onClick={fullscreen}><Icon d={full ? SMALL : FULL} /></button>
        </div>
      </div>
    </div>
  );
}

/** The reel held still at a time it is told, for a renderer that photographs it frame by frame (player/render.mjs) */
function Still() {
  const [at, setAt] = useState({t: 0, n: 0});
  const drawn = useRef(null);
  useEffect(() => {
    // seek(t) resolves once the frame at t is painted; what the renderer needs to know of the reel rides along
    window.__motionhub = {seconds: LENGTH, width: W, height: H, cues, sound: audible ? sound : null,
      seek: (t) => new Promise((done) => { drawn.current = done; setAt((a) => ({t, n: a.n + 1})); })};
  }, []);
  useEffect(() => {
    const done = drawn.current;
    if (!done) return;
    drawn.current = null;
    requestAnimationFrame(() => requestAnimationFrame(() => done(at.t)));
  }, [at]);
  const value = {useTime: () => at.t, useCompositionTime: () => at.t, fps: 30, width: W, height: H, tokens, Video: Footage};
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden'}}>
      <MotionRuntimeProvider value={value}><MotionRoot tokens={tokens}><Reel /></MotionRoot></MotionRuntimeProvider>
    </div>
  );
}

createRoot(document.getElementById('player')).render(params.get('render') === '1' ? <Still /> : <Player />);
