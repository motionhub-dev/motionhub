// The recording, 51.6 s: speech 0.4–51.0 s in 11 lines.
// The picture cuts to a new shot at 2.8, 8.2, 13.0 (a whip into a split), 18.2, 24.2, 29.6, 32.8, 38.5, 44.1, 51.1 s.
// Marker Margin's sample: one example among many. Do not reuse its story, scenes, layout or timings; read it for technique, after your own scenes are planned.
// The footage is NASA's "Connecting Classrooms to Space: Ham Radio Explainer by NASA Astronaut Nichole Ayers" (2025), seconds 42.0 to 93.6, a work of the US government.
// media/screen.mp4 is a screen recording made for this sample: an invented pass planner with invented times, no real service.
import {Doc, Scene, Line, Asset, Canvas, Preset, Part, Animation, Appear, Disappear, Tween} from '@visotalk/jsx';
import {useProp} from '@visotalk/runtime';
import {Loop} from '../parts/loop.tsx';
import {Note} from '../parts/note.tsx';
import {Arrow} from '../parts/arrow.tsx';
import {Figure} from '../parts/figure.tsx';
import {Span} from '../parts/span.tsx';
import {Steps} from '../parts/steps.tsx';
import {Screen} from '../parts/screen.tsx';
import {Box} from '../parts/box.tsx';
import {Click} from '../parts/click.tsx';

export default <Doc spec="0.7.0" id="marker-margin-sample" title="How a school calls the space station" lang={"en"} voice="recording:take" poster={7.9} keepClear={[{x: 1100, y: 190, w: 270, h: 320, from: 0, to: 2.8}, {x: 1150, y: 90, w: 260, h: 300, from: 2.8, to: 8.2}, {x: 1720, y: 330, w: 200, h: 260, from: 13.6, to: 18.2}, {x: 1080, y: 70, w: 300, h: 340, from: 24.2, to: 29.6}, {x: 1000, y: 160, w: 300, h: 340, from: 32.8, to: 38.5}, {x: 1000, y: 160, w: 300, h: 340, from: 49.1, to: 51.6}]} exports={{"fps":30,"captions":"burned"}} theme={"visotalk/dark"} tokens={{"colors": {"bg": "#0E0E0C", "panel": "#171714", "panel2": "#22221E", "border": "#3A3933", "text": "#FFFDF6", "muted": "#CBC7BB", "faint": "#5C5A52", "data": "#FFD93B", "grad": "#FFD93B", "op": "#8FD3FF", "good": "#9BE38A", "bad": "#FF6F61", "warn": "#FFB23B"}, "fonts": {"sans": "\"Shantell Sans\", \"LXGW WenKai\", sans-serif", "mono": "\"JetBrains Mono\", monospace", "display": "\"Shantell Sans\", \"LXGW WenKai\", sans-serif"}, "caption": {"font": "sans", "size": 42, "weight": 600, "color": "#FFFDF6", "background": "none", "padding": [6, 18], "bottom": 46, "maxWidth": 1500, "shadow": "0 0 2px rgba(14, 14, 12, 0.95), 0 2px 1px rgba(14, 14, 12, 0.85), 0 0 10px rgba(14, 14, 12, 0.8), 0 0 26px rgba(14, 14, 12, 0.6)"}}}>
<Canvas><Preset id="recording" width={1920} height={1080}/></Canvas>
<Asset id="take" kind="video" src={"media/take.mp4"} analysis={{"duration":51.6,"width":1920,"height":1080,"fps":30,"frameRate":"30/1","frames":1548}} license={{id: 'public-domain', source: 'https://images.nasa.gov/details/jsc2025m000040_Connecting_Classrooms_to_Space-Ham_Radio_Explainer_by_NASA_Astronaut_Nichole_Ayers', obligations: ['credit NASA; implies no endorsement']}}/>
<Asset id="screen" kind="video" src={"media/screen.mp4"} analysis={{"duration":6.5,"width":1920,"height":1080,"fps":30,"frameRate":"30/1","frames":195}} license={{id: 'user-owned', obligations: []}}/>
<Scene id="contact">
<Part id="lab" x={1390} y={100} w={460} h={170}>{() => <Note text="Columbus lab" mark="Columbus" write={useProp('write', 0)} under={useProp('under', 0)} seed="lab" />}</Part>
<Part id="transceiver" x={0} y={0} w={1920} h={1080}>{() => <Loop at={[690, 300]} rx={130} ry={112} draw={useProp('draw', 0)} seed="transceiver" />}</Part>
<Part id="panel" x={0} y={0} w={1920} h={1080}>{() => <Arrow text="control panel" at={[96, 640]} from={[286, 640]} to={[520, 470]} bow={-0.25} draw={useProp('draw', 0)} seed="panel" />}</Part>
<Part id="video-box" x={0} y={0} w={1920} h={1080}>{() => <Box x={300} y={175} w={1310} h={690} draw={useProp('draw', 0)} seed="video" />}</Part>
<Part id="video-note" x={330} y={40} w={700} h={150}>{() => <Note text="video, too!" mark="too!" write={useProp('write', 0)} under={useProp('under', 0)} seed="video-note" />}</Part>
<Part id="link" x={0} y={0} w={1920} h={1080}>{() => <Arrow from={[720, 160]} to={[1160, 160]} bow={-0.08} kind="wave" heads={2} draw={useProp('draw', 0)} seed="link" />}</Part>
<Part id="iss" x={1190} y={70} w={260} h={150}>{() => <Note text="ISS" write={useProp('write', 0)} seed="iss" />}</Part>
<Part id="school" x={240} y={70} w={440} h={150}>{() => <Note text="your school" write={useProp('write', 0)} seed="school" />}</Part>
<Part id="speed" x={430} y={290} w={1100} h={400}>{() => <Figure value="17,500" unit="mph" note="over the ground station" write={useProp('write', 0)} under={useProp('under', 0)} size={160} seed="speed" />}</Part>
<Part id="sound" x={110} y={100} w={580} h={240}>{() => <Note text={'25× the\nspeed of sound'} mark="25×" write={useProp('write', 0)} under={useProp('under', 0)} size={62} seed="sound" />}</Part>
<Part id="pass" x={0} y={0} w={1920} h={1080}>{() => <Span from={[1325, 55]} to={[1425, 860]} bow={-0.05} label={'9–10 min\nof contact'} at={[1480, 360]} draw={useProp('draw', 0)} seed="pass" />}</Part>
<Part id="steps" x={100} y={110} w={480} h={300}>{() => <Steps items={['float in', 'set channel', 'call school']} shown={useProp('shown', 0)} done={useProp('done', 0)} size={48} />}</Part>
<Part id="channel" x={0} y={0} w={1920} h={1080}>{() => <Arrow text="channel" at={[1150, 560]} from={[1210, 570]} to={[1085, 425]} bow={0.2} draw={useProp('draw', 0)} seed="channel" />}</Part>
<Part id="planner" x={0} y={0} w={1920} h={1080}>{() => (
  <Screen asset="screen" start={42.98} show={useProp('show', 0)}>
    <Box x={1150} y={214} w={485} h={72} draw={useProp('box', 0)} seed="window" />
    <Click at={[1263, 772]} r={86} draw={useProp('click', 0)} seed="call" />
  </Screen>
)}</Part>
<Line id="line-1" span={{"start":0.38,"end":4.08}} words={[{"w":"This","t0":0,"t1":0.16},{"w":"is","t0":0.16,"t1":0.28},{"w":"the","t0":0.28,"t1":0.42},{"w":"equipment","t0":0.42,"t1":0.96},{"w":"here","t0":1.06,"t1":1.3},{"w":"in","t0":1.3,"t1":1.36},{"w":"the","t0":1.36,"t1":1.44},{"w":"Columbus","t0":1.46,"t1":1.82},{"w":"laboratory,","t0":1.82,"t1":2.28},{"w":"which","t0":2.64,"t1":2.82},{"w":"consists","t0":2.82,"t1":3.24},{"w":"of","t0":3.24,"t1":3.36},{"w":"a","t0":3.36,"t1":3.4},{"w":"radio.","t0":3.4,"t1":3.7}]}>This is the equipment here in the Columbus laboratory, which consists of a radio.</Line>
<Line id="line-2" span={{"start":4.08,"end":7.94}} words={[{"w":"We've","t0":0,"t1":0.1},{"w":"got","t0":0.1,"t1":0.24},{"w":"the","t0":0.24,"t1":0.34},{"w":"transceiver","t0":0.34,"t1":0.82},{"w":"here,","t0":0.82,"t1":1.08},{"w":"we've","t0":1.24,"t1":1.34},{"w":"got","t0":1.34,"t1":1.48},{"w":"a","t0":1.48,"t1":1.52},{"w":"control","t0":1.52,"t1":1.86},{"w":"panel,","t0":1.86,"t1":2.18},{"w":"and","t0":2.68,"t1":2.82},{"w":"we've","t0":2.82,"t1":2.98},{"w":"also","t0":2.98,"t1":3.18},{"w":"got","t0":3.18,"t1":3.32},{"w":"the","t0":3.32,"t1":3.42},{"w":"microphone.","t0":3.42,"t1":3.86}]}>We've got the transceiver here, we've got a control panel, and we've also got the microphone.</Line>
<Line id="line-3" span={{"start":8.3,"end":11.76}} words={[{"w":"Some","t0":0,"t1":0.24},{"w":"ham","t0":0.24,"t1":0.4},{"w":"passes","t0":0.42,"t1":0.82},{"w":"also","t0":0.82,"t1":1.18},{"w":"allow","t0":1.18,"t1":1.42},{"w":"for","t0":1.42,"t1":1.54},{"w":"a","t0":1.54,"t1":1.6},{"w":"video","t0":1.6,"t1":1.86},{"w":"connection","t0":1.86,"t1":2.36},{"w":"in","t0":2.36,"t1":2.5},{"w":"addition","t0":2.5,"t1":2.84},{"w":"to","t0":2.84,"t1":2.96},{"w":"the","t0":2.96,"t1":3.1},{"w":"audio.","t0":3.12,"t1":3.46}]}>Some ham passes also allow for a video connection in addition to the audio.</Line>
<Line id="line-4" span={{"start":13.1,"end":17.94}} words={[{"w":"We","t0":0,"t1":0.12},{"w":"talk","t0":0.12,"t1":0.26},{"w":"to","t0":0.26,"t1":0.36},{"w":"each","t0":0.36,"t1":0.52},{"w":"other","t0":0.52,"t1":0.72},{"w":"by","t0":0.72,"t1":0.86},{"w":"establishing","t0":0.86,"t1":1.38},{"w":"a","t0":1.38,"t1":1.44},{"w":"radio","t0":1.44,"t1":1.76},{"w":"link","t0":1.76,"t1":1.98},{"w":"between","t0":1.98,"t1":2.32},{"w":"the","t0":2.32,"t1":2.44},{"w":"ISS","t0":2.44,"t1":2.96},{"w":"and","t0":2.98,"t1":3.12},{"w":"your","t0":3.12,"t1":3.22},{"w":"school","t0":3.22,"t1":3.54},{"w":"as","t0":3.58,"t1":3.76},{"w":"we","t0":3.76,"t1":3.88},{"w":"fly","t0":3.88,"t1":4.1},{"w":"over","t0":4.1,"t1":4.26},{"w":"your","t0":4.26,"t1":4.4},{"w":"location.","t0":4.4,"t1":4.84}]}>We talk to each other by establishing a radio link between the ISS and your school as we fly over your location.</Line>
<Line id="line-5" span={{"start":18.5,"end":24}} words={[{"w":"We","t0":0,"t1":0.1},{"w":"won't","t0":0.1,"t1":0.22},{"w":"have","t0":0.22,"t1":0.36},{"w":"a","t0":0.36,"t1":0.4},{"w":"lot","t0":0.4,"t1":0.56},{"w":"of","t0":0.56,"t1":0.62},{"w":"time","t0":0.64,"t1":0.86},{"w":"to","t0":0.86,"t1":0.94},{"w":"talk","t0":0.94,"t1":1.2},{"w":"because","t0":1.2,"t1":1.52},{"w":"we'll","t0":1.54,"t1":1.7},{"w":"be","t0":1.7,"t1":1.88},{"w":"cruising","t0":1.88,"t1":2.34},{"w":"over","t0":2.36,"t1":2.56},{"w":"the","t0":2.56,"t1":2.64},{"w":"ground","t0":2.64,"t1":2.9},{"w":"station","t0":2.9,"t1":3.36},{"w":"at","t0":3.42,"t1":3.56},{"w":"17,500","t0":3.56,"t1":4.94},{"w":"miles","t0":4.94,"t1":5.2},{"w":"an","t0":5.2,"t1":5.3},{"w":"hour.","t0":5.3,"t1":5.5}]}>We won't have a lot of time to talk because we'll be cruising over the ground station at 17,500 miles an hour.</Line>
<Line id="line-6" span={{"start":24.52,"end":26.2}} words={[{"w":"That's","t0":0,"t1":0.22},{"w":"25","t0":0.22,"t1":0.66},{"w":"times","t0":0.66,"t1":0.96},{"w":"the","t0":0.96,"t1":1.02},{"w":"speed","t0":1.02,"t1":1.28},{"w":"of","t0":1.28,"t1":1.36},{"w":"sound.","t0":1.36,"t1":1.68}]}>That's 25 times the speed of sound.</Line>
<Line id="line-7" span={{"start":26.92,"end":31.46}} words={[{"w":"So","t0":0,"t1":0.16},{"w":"we'll","t0":0.16,"t1":0.32},{"w":"actually","t0":0.32,"t1":0.64},{"w":"only","t0":0.64,"t1":0.8},{"w":"have","t0":0.8,"t1":1.02},{"w":"about","t0":1.02,"t1":1.24},{"w":"nine","t0":1.26,"t1":1.48},{"w":"or","t0":1.48,"t1":1.54},{"w":"ten","t0":1.54,"t1":1.74},{"w":"minutes","t0":1.74,"t1":2.02},{"w":"of","t0":2.02,"t1":2.1},{"w":"good","t0":2.12,"t1":2.32},{"w":"radio","t0":2.34,"t1":2.64},{"w":"contact","t0":2.66,"t1":3.12},{"w":"from","t0":3.12,"t1":3.3},{"w":"the","t0":3.3,"t1":3.4},{"w":"horizon","t0":3.4,"t1":3.86},{"w":"to","t0":3.88,"t1":4},{"w":"the","t0":4,"t1":4.14},{"w":"horizon.","t0":4.14,"t1":4.54}]}>So we'll actually only have about nine or ten minutes of good radio contact from the horizon to the horizon.</Line>
<Line id="line-8" span={{"start":33.24,"end":34.64}} words={[{"w":"This","t0":0,"t1":0.14},{"w":"is","t0":0.14,"t1":0.26},{"w":"how","t0":0.26,"t1":0.38},{"w":"our","t0":0.38,"t1":0.44},{"w":"radio","t0":0.46,"t1":0.7},{"w":"contact","t0":0.7,"t1":1.02},{"w":"works.","t0":1.02,"t1":1.4}]}>This is how our radio contact works.</Line>
<Line id="line-9" span={{"start":34.9,"end":38.74}} words={[{"w":"So","t0":0,"t1":0.18},{"w":"about","t0":0.18,"t1":0.36},{"w":"five","t0":0.38,"t1":0.62},{"w":"minutes","t0":0.62,"t1":0.86},{"w":"before","t0":0.86,"t1":1.22},{"w":"the","t0":1.22,"t1":1.52},{"w":"scheduled","t0":1.54,"t1":1.88},{"w":"start","t0":1.88,"t1":2.1},{"w":"time,","t0":2.1,"t1":2.34},{"w":"I'll","t0":2.44,"t1":2.54},{"w":"float","t0":2.54,"t1":2.78},{"w":"over","t0":2.78,"t1":2.96},{"w":"here","t0":2.96,"t1":3.12},{"w":"into","t0":3.12,"t1":3.26},{"w":"Columbus.","t0":3.28,"t1":3.84}]}>So about five minutes before the scheduled start time, I'll float over here into Columbus.</Line>
<Line id="line-10" span={{"start":39.22,"end":43.7}} words={[{"w":"I'll","t0":0,"t1":0.1},{"w":"configure","t0":0.1,"t1":0.48},{"w":"the","t0":0.48,"t1":0.58},{"w":"radio","t0":0.58,"t1":0.9},{"w":"so","t0":0.9,"t1":1.04},{"w":"that","t0":1.04,"t1":1.14},{"w":"I'm","t0":1.14,"t1":1.26},{"w":"on","t0":1.26,"t1":1.4},{"w":"the","t0":1.4,"t1":1.6},{"w":"correct","t0":1.62,"t1":1.96},{"w":"channel,","t0":1.98,"t1":2.34},{"w":"and","t0":2.76,"t1":2.88},{"w":"I","t0":2.88,"t1":2.94},{"w":"may","t0":2.94,"t1":3.08},{"w":"set","t0":3.08,"t1":3.26},{"w":"up","t0":3.26,"t1":3.4},{"w":"the","t0":3.4,"t1":3.5},{"w":"video","t0":3.5,"t1":3.82},{"w":"unit","t0":3.84,"t1":4.12},{"w":"as","t0":4.14,"t1":4.28},{"w":"well.","t0":4.28,"t1":4.48}]}>I'll configure the radio so that I'm on the correct channel, and I may set up the video unit as well.</Line>
<Line id="line-11" text="And then just before the contact time that ARISS predicts for us, I'll begin calling the school using the standard amateur radio calling techniques." span={{"start":44.24,"end":51}} words={[{"w":"And","t0":0,"t1":0.08},{"w":"then","t0":0.08,"t1":0.18},{"w":"just","t0":0.18,"t1":0.36},{"w":"before","t0":0.36,"t1":0.6},{"w":"the","t0":0.6,"t1":0.68},{"w":"contact","t0":0.68,"t1":1.06},{"w":"time","t0":1.06,"t1":1.3},{"w":"that","t0":1.3,"t1":1.4},{"w":"ARES","t0":1.4,"t1":1.62},{"w":"predicts","t0":1.64,"t1":1.92},{"w":"for","t0":1.92,"t1":2.08},{"w":"us,","t0":2.08,"t1":2.46},{"w":"I'll","t0":2.64,"t1":2.78},{"w":"begin","t0":2.78,"t1":3.12},{"w":"calling","t0":3.14,"t1":3.54},{"w":"the","t0":3.54,"t1":3.62},{"w":"school","t0":3.62,"t1":3.88},{"w":"using","t0":4.36,"t1":4.66},{"w":"the","t0":4.66,"t1":4.76},{"w":"standard","t0":4.76,"t1":5.14},{"w":"amateur","t0":5.14,"t1":5.52},{"w":"radio","t0":5.54,"t1":5.88},{"w":"calling","t0":5.9,"t1":6.18},{"w":"techniques.","t0":6.18,"t1":6.76}]}>And then just before the contact time that ARES predicts for us, I'll begin calling the school using the standard amateur radio calling techniques.</Line>
<Animation>
<Appear target="lab" line="line-1" word="equipment" dur={0} />
<Tween target="lab" to={{write: 1}} line="line-1" word="equipment" dur={0.9} easing="linear" />
<Tween target="lab" to={{under: 1}} line="line-1" word="Columbus" offset={0.15} dur={0.35} />
<Disappear target="lab" at={2.8} dur={0} />

<Appear target="transceiver" line="line-2" word="transceiver" dur={0} />
<Tween target="transceiver" to={{draw: 1}} line="line-2" word="transceiver" dur={0.42} />
<Appear target="panel" line="line-2" word="control" dur={0} />
<Tween target="panel" to={{draw: 1}} line="line-2" word="control" dur={1.1} easing="linear" />
<Disappear target="transceiver" at={8.2} dur={0} />
<Disappear target="panel" at={8.2} dur={0} />

<Appear target="video-box" line="line-3" word="video" dur={0} />
<Tween target="video-box" to={{draw: 1}} line="line-3" word="video" dur={0.6} />
<Appear target="video-note" line="line-3" word="connection" dur={0} />
<Tween target="video-note" to={{write: 1}} line="line-3" word="connection" dur={0.75} easing="linear" />
<Tween target="video-note" to={{under: 1}} line="line-3" word="addition" dur={0.35} />
<Disappear target="video-box" at={13.0} dur={0} />
<Disappear target="video-note" at={13.0} dur={0} />

<Appear target="link" line="line-4" word="radio link" dur={0} />
<Tween target="link" to={{draw: 1}} line="line-4" word="radio link" dur={0.7} />
<Appear target="iss" line="line-4" word="ISS" dur={0} />
<Tween target="iss" to={{write: 1}} line="line-4" word="ISS" dur={0.3} easing="linear" />
<Appear target="school" line="line-4" word="and your" dur={0} />
<Tween target="school" to={{write: 1}} line="line-4" word="and your" dur={0.6} easing="linear" />
<Disappear target="link" at={18.2} dur={0} />
<Disappear target="iss" at={18.2} dur={0} />
<Disappear target="school" at={18.2} dur={0} />

<Appear target="speed" line="line-5" word="17,500" dur={0} />
<Tween target="speed" to={{write: 1}} line="line-5" word="17,500" dur={1.8} easing="linear" />
<Tween target="speed" to={{under: 1}} line="line-5" word="miles" dur={0.45} />
<Disappear target="speed" at={24.2} dur={0} />

<Appear target="sound" line="line-6" word="25" dur={0} />
<Tween target="sound" to={{write: 1}} line="line-6" word="25" dur={1.1} easing="linear" />
<Tween target="sound" to={{under: 1}} line="line-6" word="times" dur={0.35} />
<Disappear target="sound" at={29.6} dur={0} />

<Appear target="pass" line="line-7" word="from the horizon" dur={0} />
<Tween target="pass" to={{draw: 1}} line="line-7" word="from the horizon" dur={1.3} easing="linear" />
<Disappear target="pass" at={32.8} dur={0} />

<Appear target="steps" line="line-9" word="float" dur={0} />
<Tween target="steps" to={{shown: 1}} line="line-9" word="float" dur={0.8} easing="linear" />
<Tween target="steps" to={{x: 1280}} at={38.5} dur={0} />
<Tween target="steps" to={{done: 1, shown: 2}} line="line-10" word="configure" dur={0.9} easing="linear" />
<Disappear target="steps" at={44.1} dur={0} />
<Appear target="channel" line="line-10" word="correct channel" dur={0} />
<Tween target="channel" to={{draw: 1}} line="line-10" word="correct channel" dur={1.0} easing="linear" />
<Disappear target="channel" at={44.1} dur={0} />

<Appear target="planner" at={44.3} dur={0} />
<Tween target="planner" to={{show: 1}} at={44.3} dur={0.8} easing="linear" />
<Tween target="planner" to={{box: 1}} line="line-11" word="predicts" dur={0.6} />
<Tween target="planner" to={{click: 1}} line="line-11" word="begin calling" dur={0.42} />
<Tween target="planner" to={{show: 0}} line="line-11" word="using" dur={0.5} easing="easeIn" />
<Disappear target="planner" line="line-11" word="using" offset={0.5} dur={0} />
<Tween target="steps" to={{x: 100}} at={44.1} dur={0} />
<Appear target="steps" line="line-11" word="using" offset={0.5} dur={0} />
<Tween target="steps" to={{done: 2, shown: 3}} line="line-11" word="using" offset={0.5} dur={0.9} easing="linear" />
</Animation>
</Scene>
</Doc>;
