// The recording, 53.6 s: speech 0.5–52.6 s in 13 lines.
// The picture cuts at 0.9 (the show's title dissolves into the studio), 22.2 (the pad), 26.7, 30.4 (the rocket, close), 36.5 (its trail), 42.6 (the approach), 44.6, 47.6 (docked) and 49.5 (a dissolve to the crew inside).
// The studio two-shot holds the hosts' faces at x 500–1420, y 90–500; the left column (x 96–500) and the right (x 1420–1824) are free.
// The launch shots carry Roscosmos's mark in their top-left corner: nothing goes there.
// Live Studio's sample: one example among many. Do not reuse its story, scenes, layout or timings; read it for technique, after your own scenes are planned.
// The footage is NASA's "Space to Ground: Changing Space: April 11, 2025", seconds 4.5 to 34.9 and 42.45 to 65.7 (the launch commentator's second sentence cut),
// a work of the US government; media/kim.mp4 is seconds 128.2 to 135.2 of the same episode, cropped. NASA does not endorse this sample.
// The launch, docking and crew shots are archive: the bug says REPLAY from the first of them.
import {Doc, Scene, Line, Asset, Canvas, Preset, Part, Animation, Appear, Disappear, Tween, Set} from '@visotalk/jsx';
import {useProp} from '@visotalk/runtime';
import {Bug} from '../parts/bug.tsx';
import {Ticker} from '../parts/ticker.tsx';
import {Strap} from '../parts/strap.tsx';
import {Scorebar} from '../parts/scorebar.tsx';
import {Pip} from '../parts/pip.tsx';
import {Headline} from '../parts/headline.tsx';
import {Roster} from '../parts/roster.tsx';
import {Locator} from '../parts/locator.tsx';
import {Readout} from '../parts/readout.tsx';
import {Sting} from '../parts/sting.tsx';

const LABELS = ['L.A. – New York', 'Oslo – Athens', 'Earth – station'];
const TIMES = [306, 230, 180];
const NEWS = ['Soyuz MS-27 docks at the Prichal module', 'Space to Ground: the station, every week', 'Launched from Baikonur, Kazakhstan, April 8', 'Ryzhikov commands Soyuz MS-27'];

export default <Doc spec="0.7.0" id="live-studio-sample" title="Faster than a flight to New York" lang={"en"} voice="recording:take" poster={18.6} keepClear={[{x: 530, y: 124, w: 860, h: 406, from: 0, to: 21.3}, {x: 150, y: 120, w: 1130, h: 300, from: 49.5, to: 53.65}]} exports={{"fps":30,"captions":"burned"}} theme={"visotalk/dark"} tokens={{"colors":{"bg":"#07090D","panel":"#0C0F15","panel2":"#171B23","border":"#2A2F3A","text":"#F4F5F7","muted":"#A7ADB8","faint":"#4A505B","data":"#FF2E4D","grad":"#FF2E4D","op":"#A7ADB8","good":"#F4F5F7","bad":"#FF2E4D","warn":"#FFB547"},"fonts":{"sans":"\"Hanken Grotesk\", \"Noto Sans SC\", sans-serif","mono":"\"JetBrains Mono\", monospace","display":"\"Big Shoulders Display\", \"Noto Sans SC\", sans-serif"},"caption":{"font":"sans","size":40,"weight":600,"color":"#F4F5F7","background":"rgba(7, 9, 13, 0.86)","radius":0,"padding":[8,22],"bottom":128,"rule":"#FF2E4D","ruleSide":"left","maxWidth":1560}}}>
<Canvas><Preset id="recording" width={1920} height={1080}/></Canvas>
<Asset id="take" kind="video" src={"media/take.mp4"} analysis={{"duration":53.65,"width":1920,"height":1080,"fps":30,"frameRate":"30/1","frames":1610}} license={{id: 'public-domain', source: 'https://images.nasa.gov/details/jcs2025m000065_Space%20to%20Ground_565_250411', obligations: ['credit NASA; implies no endorsement']}}/>
<Asset id="kim" kind="video" src={"media/kim.mp4"} analysis={{"duration":7.033333,"width":800,"height":600,"fps":30,"frameRate":"30/1","frames":211}} license={{id: 'public-domain', source: 'https://images.nasa.gov/details/jcs2025m000065_Space%20to%20Ground_565_250411', obligations: ['credit NASA; implies no endorsement']}}/>
<Scene id="desk">
<Part id="sting" x={0} y={0} w={1920} h={1080}>{() => <Sting word="Replay" line="Baikonur · April 8" pass={useProp('pass', 0)} />}</Part>
<Part id="bug" x={1224} y={54} w={600} h={68}>{() => <Bug mark="WK 15" state="THIS WEEK" next={useProp('next', 'REPLAY')} flip={useProp('flip', 0)} date="APR 11 2025" show={useProp('show', 0)} />}</Part>
<Part id="ticker" x={96} y={964} w={1728} h={62}>{() => <Ticker label="Latest" items={NEWS} show={useProp('show', 0)} />}</Part>
<Part id="raegan" x={96} y={606} w={640} h={190}>{() => <Strap name="Raegan Scharfetter" role="Space to Ground" tag="Host" show={useProp('show', 0)} />}</Part>
<Part id="nilufar" x={1184} y={606} w={640} h={190}>{() => <Strap name="Nilufar Ramji" role="Space to Ground" tag="Host" side="right" show={useProp('show', 0)} />}</Part>
<Part id="board" x={96} y={240} w={430} h={460}>{() => <Scorebar title="Flight time" labels={LABELS} values={TIMES} notes={['', '', '+']} format="hm" shown={useProp('shown', 0)} ask={2} reveal={useProp('reveal', 0)} focus={useProp('focus', -1)} badge="Fastest" win={useProp('win', 0)} show={useProp('show', 0)} />}</Part>
<Part id="pip" x={1400} y={180} w={424} h={352}>{() => <Pip asset="kim" start={15.1} name="Jonny Kim" role="NASA" show={useProp('show', 0)} />}</Part>
<Part id="headline" x={96} y={722} w={1100} h={74}>{() => <Headline tab="Launch" text="Soyuz MS-27 lifts off" next="Three crew, bound for the station" flip={useProp('flip', 0)} show={useProp('show', 0)} />}</Part>
<Part id="crew" x={96} y={190} w={700} h={420}>{() => <Roster title="Crew" names={['Kim', 'Ryzhikov', 'Zubritsky']} roles={['NASA', 'Roscosmos', 'Roscosmos']} shown={useProp('shown', 0)} show={useProp('show', 0)} />}</Part>
<Part id="place" x={96} y={666} w={800} h={130}>{() => <Locator place="Baikonur Cosmodrome" line="Kazakhstan · Apr 8 2025" show={useProp('show', 0)} />}</Part>
<Part id="months" x={1290} y={196} w={534} h={340}>{() => <Readout value={useProp('value', 0)} places={1} unit="Months" tab="Mission" note="Research on the station" show={useProp('show', 0)} />}</Part>
<Line id="line-1" span={{"start":0.54,"end":1.56}} words={[{"w":"Welcome","t0":0,"t1":0.28},{"w":"to","t0":0.28,"t1":0.34},{"w":"Space","t0":0.34,"t1":0.66},{"w":"to","t0":0.66,"t1":0.72},{"w":"Ground.","t0":0.72,"t1":1.02}]}>Welcome to Space to Ground.</Line>
<Line id="line-2" text="I'm Raegan Scharfetter." span={{"start":1.66,"end":2.6}} words={[{"w":"I'm","t0":0,"t1":0.18},{"w":"Reagan","t0":0.18,"t1":0.44},{"w":"Sharfetter.","t0":0.44,"t1":0.94}]}>I'm Reagan Sharfetter.</Line>
<Line id="line-3" text="And I'm Nilufar Ramji." span={{"start":2.86,"end":3.86}} words={[{"w":"And","t0":0,"t1":0.14},{"w":"I'm","t0":0.14,"t1":0.26},{"w":"Nilafor","t0":0.26,"t1":0.44},{"w":"Ramjee.","t0":0.44,"t1":1}]}>And I'm Nilafor Ramjee.</Line>
<Line id="line-4" span={{"start":4.18,"end":9.1}} words={[{"w":"If","t0":0,"t1":0.16},{"w":"you","t0":0.16,"t1":0.28},{"w":"were","t0":0.28,"t1":0.36},{"w":"to","t0":0.36,"t1":0.44},{"w":"fly","t0":0.44,"t1":0.68},{"w":"nonstop","t0":0.7,"t1":1.24},{"w":"from","t0":1.24,"t1":1.4},{"w":"Los","t0":1.4,"t1":1.68},{"w":"Angeles","t0":1.68,"t1":2.12},{"w":"to","t0":2.12,"t1":2.36},{"w":"New","t0":2.36,"t1":2.56},{"w":"York,","t0":2.56,"t1":2.86},{"w":"it","t0":2.88,"t1":2.98},{"w":"would","t0":2.98,"t1":3.08},{"w":"take","t0":3.08,"t1":3.26},{"w":"five","t0":3.28,"t1":3.62},{"w":"hours","t0":3.66,"t1":4.04},{"w":"and","t0":4.04,"t1":4.16},{"w":"six","t0":4.16,"t1":4.46},{"w":"minutes.","t0":4.46,"t1":4.92}]}>If you were to fly nonstop from Los Angeles to New York, it would take five hours and six minutes.</Line>
<Line id="line-5" span={{"start":9.36,"end":13.32}} words={[{"w":"A","t0":0,"t1":0.12},{"w":"flight","t0":0.12,"t1":0.36},{"w":"from","t0":0.36,"t1":0.52},{"w":"Oslo,","t0":0.54,"t1":0.92},{"w":"Norway","t0":0.92,"t1":1.34},{"w":"to","t0":1.34,"t1":1.48},{"w":"Athens,","t0":1.5,"t1":1.94},{"w":"Greece,","t0":1.94,"t1":2.24},{"w":"three","t0":2.36,"t1":2.64},{"w":"hours","t0":2.66,"t1":2.98},{"w":"and","t0":2.98,"t1":3.08},{"w":"fifty","t0":3.08,"t1":3.5},{"w":"minutes.","t0":3.5,"t1":3.96}]}>A flight from Oslo, Norway to Athens, Greece, three hours and fifty minutes.</Line>
<Line id="line-6" text="However, it took NASA astronaut Jonny Kim less time this week to fly from Earth to the International Space Station." span={{"start":13.38,"end":19.52}} words={[{"w":"However,","t0":0,"t1":0.5},{"w":"it","t0":0.52,"t1":0.7},{"w":"took","t0":0.7,"t1":0.92},{"w":"NASA","t0":0.94,"t1":1.32},{"w":"astronaut","t0":1.34,"t1":1.82},{"w":"Johnny","t0":1.82,"t1":2.12},{"w":"Kim","t0":2.12,"t1":2.42},{"w":"less","t0":2.5,"t1":2.8},{"w":"time","t0":2.8,"t1":3.08},{"w":"this","t0":3.1,"t1":3.36},{"w":"week","t0":3.36,"t1":3.6},{"w":"to","t0":3.62,"t1":3.76},{"w":"fly","t0":3.76,"t1":3.96},{"w":"from","t0":3.96,"t1":4.16},{"w":"Earth","t0":4.16,"t1":4.44},{"w":"to","t0":4.46,"t1":4.58},{"w":"the","t0":4.58,"t1":4.74},{"w":"International","t0":4.74,"t1":5.32},{"w":"Space","t0":5.32,"t1":5.62},{"w":"Station.","t0":5.62,"t1":6.14}]}>However, it took NASA astronaut Johnny Kim less time this week to fly from Earth to the International Space Station.</Line>
<Line id="line-7" text="On [April] eighth in the early morning hours, the Los Angeles native launched to the station." span={{"start":19.8,"end":23.82}} words={[{"w":"On","t0":0,"t1":0.16},{"w":"March","t0":0.16,"t1":0.42},{"w":"eighth","t0":0.44,"t1":0.7},{"w":"in","t0":0.72,"t1":0.84},{"w":"the","t0":0.84,"t1":0.96},{"w":"early","t0":0.96,"t1":1.22},{"w":"morning","t0":1.22,"t1":1.5},{"w":"hours,","t0":1.52,"t1":1.86},{"w":"the","t0":1.86,"t1":1.98},{"w":"Los","t0":1.98,"t1":2.26},{"w":"Angeles","t0":2.26,"t1":2.68},{"w":"native","t0":2.68,"t1":3.02},{"w":"launched","t0":3.04,"t1":3.38},{"w":"to","t0":3.4,"t1":3.5},{"w":"the","t0":3.5,"t1":3.6},{"w":"station.","t0":3.6,"t1":4.02}]}>On March eighth in the early morning hours, the Los Angeles native launched to the station.</Line>
<Line id="line-8" span={{"start":25.34,"end":27.08}} words={[{"w":"Engine","t0":0,"t1":0.38},{"w":"ignition","t0":0.38,"t1":0.9},{"w":"and","t0":0.92,"t1":1.14},{"w":"liftoff.","t0":1.24,"t1":1.74}]}>Engine ignition and liftoff.</Line>
<Line id="line-9" text="Liftoff of Soyuz MS-27." span={{"start":28.02,"end":30.36}} words={[{"w":"Liftoff","t0":0,"t1":0.52},{"w":"of","t0":0.62,"t1":0.74},{"w":"Soyuz","t0":0.74,"t1":1.22},{"w":"MS-","t0":1.22,"t1":1.54},{"w":"27.","t0":1.54,"t1":2.34}]}>Liftoff of Soyuz MS- 27.</Line>
<Line id="line-10" text="Kim, along with his two cosmonaut crewmates, Sergey Ryzhikov and Alexander Zubritsky, launched aboard the Soyuz MS-27 spacecraft at 1:47 a.m." span={{"start":30.6,"end":39.46}} words={[{"w":"Kim,","t0":0,"t1":0.32},{"w":"along","t0":0.34,"t1":0.62},{"w":"with","t0":0.62,"t1":0.74},{"w":"his","t0":0.74,"t1":0.9},{"w":"two","t0":0.9,"t1":1.08},{"w":"cosmonaut","t0":1.1,"t1":1.6},{"w":"crewmates,","t0":1.6,"t1":2.1},{"w":"Sergei","t0":2.1,"t1":2.48},{"w":"Ryzikov","t0":2.5,"t1":3.04},{"w":"and","t0":3.06,"t1":3.22},{"w":"Alexander","t0":3.24,"t1":3.86},{"w":"Zoubritsky,","t0":3.86,"t1":4.44},{"w":"launched","t0":4.5,"t1":4.88},{"w":"aboard","t0":4.88,"t1":5.12},{"w":"the","t0":5.12,"t1":5.2},{"w":"Soyuz","t0":5.2,"t1":5.68},{"w":"MS-","t0":5.72,"t1":6.04},{"w":"27","t0":6.04,"t1":6.56},{"w":"spacecraft","t0":6.58,"t1":7.24},{"w":"at","t0":7.56,"t1":7.76},{"w":"1:","t0":7.76,"t1":7.98},{"w":"47","t0":8,"t1":8.58},{"w":"a.","t0":8.6,"t1":8.86}]}>Kim, along with his two cosmonaut crewmates, Sergei Ryzikov and Alexander Zoubritsky, launched aboard the Soyuz MS- 27 spacecraft at 1: 47 a.</Line>
<Line id="line-11" text="a.m." span={{"start":39.46,"end":39.54}} words={[{"w":"m.","t0":0,"t1":0.08}]}>m.</Line>
<Line id="line-12" span={{"start":39.54,"end":43.18}} words={[{"w":"Central","t0":0,"t1":0.38},{"w":"Time","t0":0.38,"t1":0.68},{"w":"on","t0":0.7,"t1":0.86},{"w":"April","t0":0.86,"t1":1.18},{"w":"eighth","t0":1.2,"t1":1.46},{"w":"from","t0":1.46,"t1":1.62},{"w":"the","t0":1.62,"t1":1.72},{"w":"Baikonur","t0":1.72,"t1":2.16},{"w":"Cosmodrome","t0":2.16,"t1":2.78},{"w":"in","t0":2.8,"t1":2.9},{"w":"Kazakhstan.","t0":2.9,"t1":3.64}]}>Central Time on April eighth from the Baikonur Cosmodrome in Kazakhstan.</Line>
<Line id="line-13" text="The trio orbited Earth for just over three hours before docking to the Prichal docking module of the orbital outpost, beginning their eight-month research mission." span={{"start":44.22,"end":52.62}} words={[{"w":"The","t0":0,"t1":0.12},{"w":"trio","t0":0.12,"t1":0.42},{"w":"orbited","t0":0.44,"t1":0.92},{"w":"Earth","t0":0.94,"t1":1.2},{"w":"for","t0":1.2,"t1":1.32},{"w":"just","t0":1.32,"t1":1.56},{"w":"over","t0":1.56,"t1":1.76},{"w":"three","t0":1.76,"t1":2.08},{"w":"hours","t0":2.08,"t1":2.54},{"w":"before","t0":2.54,"t1":2.86},{"w":"docking","t0":2.88,"t1":3.24},{"w":"to","t0":3.26,"t1":3.38},{"w":"the","t0":3.38,"t1":3.46},{"w":"Prichal","t0":3.46,"t1":3.94},{"w":"docking","t0":3.98,"t1":4.34},{"w":"module","t0":4.34,"t1":4.74},{"w":"of","t0":4.76,"t1":4.88},{"w":"the","t0":4.88,"t1":5},{"w":"orbital","t0":5,"t1":5.36},{"w":"outpost,","t0":5.38,"t1":6.04},{"w":"beginning","t0":6.2,"t1":6.52},{"w":"their","t0":6.54,"t1":6.84},{"w":"eight-","t0":6.86,"t1":7.1},{"w":"month","t0":7.1,"t1":7.46},{"w":"research","t0":7.46,"t1":7.94},{"w":"mission.","t0":7.94,"t1":8.4}]}>The trio orbited Earth for just over three hours before docking to the Prichal docking module of the orbital outpost, beginning their eight- month research mission.</Line>
<Animation>
<Appear target="bug" at={1.2} dur={0} />
<Tween target="bug" to={{show: 1}} at={1.2} dur={1.0} easing="linear" />
<Appear target="ticker" line="line-1" word="Ground" dur={0} />
<Tween target="ticker" to={{show: 1}} line="line-1" word="Ground" dur={0.8} />

<Appear target="raegan" line="line-2" word="Reagan" dur={0} />
<Tween target="raegan" to={{show: 1}} line="line-2" word="Reagan" dur={1.2} easing="linear" />
<Appear target="nilufar" line="line-3" word="Nilafor" dur={0} />
<Tween target="nilufar" to={{show: 1}} line="line-3" word="Nilafor" dur={1.2} easing="linear" />
<Tween target="raegan" to={{show: 0}} at={5.15} dur={0.35} />
<Tween target="nilufar" to={{show: 0}} at={5.25} dur={0.35} />
<Disappear target="raegan" at={5.5} dur={0} />
<Disappear target="nilufar" at={5.6} dur={0} />

<Appear target="board" line="line-4" word="Los Angeles" dur={0} />
<Tween target="board" to={{show: 1}} line="line-4" word="Los Angeles" dur={0.6} />
<Tween target="board" to={{shown: 0.4}} line="line-4" word="Los Angeles" offset={0.3} dur={0.4} />
<Tween target="board" to={{shown: 1}} line="line-4" word="five" dur={1.3} easing="easeOutQuart" />
<Tween target="board" to={{shown: 1.4}} line="line-5" word="Oslo" dur={0.4} />
<Tween target="board" to={{shown: 2}} line="line-5" word="three" dur={1.3} easing="easeOutQuart" />
<Tween target="board" to={{shown: 3}} line="line-6" word="Earth" dur={0.5} />
<Tween target="board" to={{focus: 2}} line="line-6" word="Earth" dur={0} />

<Appear target="pip" line="line-6" word="Johnny" dur={0} />
<Tween target="pip" to={{show: 1}} line="line-6" word="Johnny" dur={1.1} easing="linear" />
<Appear target="sting" at={21.2} dur={0} />
<Tween target="sting" to={{pass: 1}} at={21.2} dur={2} easing="linear" />
<Disappear target="sting" at={23.25} dur={0} />
<Disappear target="pip" at={22.2} dur={0} />
<Disappear target="board" at={22.2} dur={0} />

<Appear target="headline" line="line-7" word="station" dur={0} />
<Tween target="headline" to={{show: 1}} line="line-7" word="station" dur={1.0} easing="linear" />
<Tween target="bug" to={{flip: 1}} at={22.2} dur={0.4} />
<Tween target="headline" to={{flip: 1}} line="line-9" word="Soyuz" dur={0.45} />
<Disappear target="headline" at={30.4} dur={0} />

<Appear target="crew" at={30.4} dur={0} />
<Tween target="crew" to={{show: 1}} at={30.4} dur={0.3} />
<Tween target="crew" to={{shown: 1}} line="line-10" word="Kim" dur={0.5} />
<Tween target="crew" to={{shown: 2}} line="line-10" word="Sergei" dur={0.5} />
<Tween target="crew" to={{shown: 3}} line="line-10" word="Alexander" dur={0.5} />
<Disappear target="crew" at={36.5} dur={0} />

<Appear target="place" line="line-12" word="April" dur={0} />
<Tween target="place" to={{show: 1}} line="line-12" word="April" dur={1.0} easing="linear" />
<Disappear target="place" at={42.6} dur={0} />

<Appear target="board" line="line-13" word="trio" dur={0} />
<Set target="board" to={{shown: 3, focus: 2, show: 0, reveal: 0, win: 0}} line="line-13" word="trio" />
<Tween target="board" to={{show: 1}} line="line-13" word="trio" dur={0.6} />
<Tween target="board" to={{reveal: 1}} line="line-13" word="three" dur={1.2} easing="easeOutQuart" />
<Tween target="board" to={{win: 1}} at={47.05} dur={0.8} easing="linear" />
<Tween target="board" to={{show: 0}} at={49.15} dur={0.35} />
<Disappear target="board" at={49.5} dur={0} />

<Appear target="months" line="line-13" word="beginning" dur={0} />
<Tween target="months" to={{show: 1}} line="line-13" word="beginning" dur={1.0} easing="linear" />
<Tween target="months" to={{value: 8}} line="line-13" word="eight" dur={1.1} easing="easeOutQuart" />
</Animation>
</Scene>
</Doc>;
