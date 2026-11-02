// The recording, 51.6 s: speech 0.0–51.4 s in 13 lines.
// The picture cuts to a new shot at 6.9, 7.8, 10.2, 18.6, 20.3, 21.4, 22.6, 23.8, 32.5, 35.1, 42.0, 48.9, 50.3 s (14 shots); from 23.8 a Roman god a word, 0.6 s each, then the solar system.
// On Air's sample: one example among many. Do not reuse its story, its tags or their timings; read it for technique, after your own scenes are planned.
// The footage is NASA's "How Do Planets Get Their Names? We Asked a NASA Scientist" (2023), seconds 5.97 to 57.57, a work of the US government.
import {Doc, Scene, Line, Asset, Canvas, Preset, Part, Animation, Appear, Disappear, Tween} from '@visotalk/jsx';
import {useProp} from '@visotalk/runtime';
import {Scrim} from '../parts/scrim.tsx';
import {Chapter} from '../parts/chapter.tsx';
import {Chips} from '../parts/chips.tsx';
import {Figure} from '../parts/figure.tsx';
import {Swap} from '../parts/swap.tsx';
import {NameTag} from '../parts/name-tag.tsx';
import {Headline} from '../parts/headline.tsx';
import {Callout} from '../parts/callout.tsx';
import {Bars} from '../parts/bars.tsx';
import {Quote} from '../parts/quote.tsx';
import {Versus} from '../parts/versus.tsx';
import {Verdict} from '../parts/verdict.tsx';
import {Inset} from '../parts/inset.tsx';

export default <Doc spec="0.7.0" id="on-air-sample" title="How the planets got their names" lang={"en"} voice="recording:take" poster={44.2} keepClear={[{x: 500, y: 40, w: 940, h: 1040, from: 0, to: 6.9}, {x: 960, y: 800, w: 900, h: 200, from: 2.5, to: 6.9}, {x: 985, y: 90, w: 845, h: 742, from: 35.1, to: 51.6}]} exports={{"fps":30,"captions":"burned"}} theme={"visotalk/dark"} tokens={{"colors":{"bg":"#0B0C0E","panel":"#0F1114","panel2":"#1A1D22","border":"#2C3038","text":"#F6F5F2","muted":"#B4B8BF","faint":"#4A4F58","data":"#35E0C2","grad":"#35E0C2","op":"#9AA7FF","good":"#7FD6A0","bad":"#FF6B5B","warn":"#FFC857"},"fonts":{"sans":"\"Atkinson Hyperlegible Next\", \"Noto Sans SC\", sans-serif","mono":"\"JetBrains Mono\", monospace","display":"\"Atkinson Hyperlegible Next\", \"Noto Sans SC\", sans-serif"},"caption":{"font":"sans","size":40,"weight":700,"color":"#F6F5F2","background":"rgba(12, 13, 15, 0.74)","radius":6,"padding":[8,20],"bottom":54}}}>
<Canvas><Preset id="recording" width={1920} height={1080}/></Canvas>
<Asset id="take" kind="video" src={"media/take.mp4"} analysis={{"duration":51.6,"width":1920,"height":1080,"fps":30,"frameRate":"30/1","frames":1548}} license={{id: 'public-domain', source: 'https://images.nasa.gov/details/How%20Do%20Planets%20Get%20Their%20Names_%20-%20Horizontal%20Video', obligations: ['credit NASA; implies no endorsement']}}/>
<Scene id="names">
<Part id="scrim">{() => <Scrim side="bottom" depth={useProp('depth', 1)} reach={42} />}</Part>
<Part id="inset" x={0} y={0} w={1920} h={1080}>{() => <Inset asset="take" side="right" size={0.44} focus={0.5} move={useProp('move', 0)} />}</Part>
<Part id="chapter" x={80} y={56} w={520} h={64}>{() => <Chapter n="Q·01" title="Planet names" show={useProp('show', 0)} />}</Part>
<Part id="chapter2" x={80} y={56} w={600} h={64}>{() => <Chapter n="Q·02" title="Further out" show={useProp('show', 0)} />}</Part>
<Part id="planets" x={1460} y={150} w={400} h={520}>{() => <Chips items={['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']} shown={useProp('shown', 0)} focus={useProp('focus', -1)} column />}</Part>
<Part id="sky" x={0} y={0} w={1920} h={1080}>{() => <Callout at={[505, 700]} to={[740, 600]} r={60} label="Easy to see by eye" draw={useProp('draw', 0)} />}</Part>
<Part id="five" x={90} y={150} w={620} h={220}>{() => <Figure value={useProp('value', 0)} unit="planets" label="Seen without a telescope" show={useProp('show', 0)} />}</Part>
<Part id="swap" x={90} y={150} w={1100} h={110}>{() => <Swap from="A name in every culture" to="Roman names" strike={useProp('strike', 0)} turn={useProp('turn', 0)} />}</Part>
<Part id="latin" x={90} y={640} w={760} h={150}>{() => <NameTag name="Latin" role="The language of the Roman Empire" show={useProp('show', 0)} width={720} />}</Part>
<Part id="gods" x={80} y={330} w={600} h={260}>{() => <Headline text="Named after the Roman gods" mark="Roman gods" under={useProp('under', 0)} show={useProp('show', 0)} width={560} />}</Part>
<Part id="count" x={90} y={150} w={760} h={240}>{() => <Bars title="Historically called planets" labels={['Known to every culture', 'Further out']} values={[5, 3]} grown={useProp('grown', 0)} focus={useProp('focus', -1)} />}</Part>
<Part id="theme" x={90} y={200} w={820} h={340}>{() => <Quote text="Fit in with the existing theme of the mythology" source="On naming Uranus, Neptune and Pluto" show={useProp('show', 0)} width={800} />}</Part>
<Part id="versus" x={90} y={240} w={820} h={200}>{() => <Versus a="Seen by every culture" aNote="The inner five" b="Discovered recently" bNote="The outer three" winner="b" show={useProp('show', 0)} decide={useProp('decide', 0)} width={800} />}</Part>
<Part id="verdict" x={90} y={180} w={700} h={520}>{() => <Verdict title="Uranus · Neptune · Pluto" items={['+ Named like the old five', '- Fainter', '- Slower', '- Not seen by the naked eye']} shown={useProp('shown', 0)} result="Found by telescope" settle={useProp('settle', 0)} width={660} />}</Part>
<Line id="line-1" text="So if you step back in time, thousands of years ago, people knew about the brightest planets pretty much everywhere." span={{"start":0.04,"end":4.28}} words={[{"w":"So","t0":0,"t1":0.06},{"w":"if","t0":0.06,"t1":0.14},{"w":"you","t0":0.14,"t1":0.2},{"w":"stick","t0":0.2,"t1":0.42},{"w":"back","t0":0.42,"t1":0.64},{"w":"in","t0":0.64,"t1":0.7},{"w":"time,","t0":0.7,"t1":1.04},{"w":"thousands","t0":1.3,"t1":1.66},{"w":"of","t0":1.66,"t1":1.7},{"w":"years","t0":1.7,"t1":1.9},{"w":"ago,","t0":1.9,"t1":2.08},{"w":"people","t0":2.08,"t1":2.3},{"w":"knew","t0":2.3,"t1":2.4},{"w":"about","t0":2.4,"t1":2.54},{"w":"the","t0":2.54,"t1":2.62},{"w":"brightest","t0":2.64,"t1":2.96},{"w":"planets","t0":2.96,"t1":3.3},{"w":"pretty","t0":3.3,"t1":3.5},{"w":"much","t0":3.5,"t1":3.72},{"w":"everywhere.","t0":3.76,"t1":4.24}]}>So if you stick back in time, thousands of years ago, people knew about the brightest planets pretty much everywhere.</Line>
<Line id="line-2" span={{"start":4.64,"end":7.6}} words={[{"w":"These","t0":0,"t1":0.14},{"w":"are","t0":0.14,"t1":0.2},{"w":"Mercury,","t0":0.2,"t1":0.66},{"w":"Venus,","t0":0.78,"t1":1.22},{"w":"Mars,","t0":1.28,"t1":1.78},{"w":"Jupiter,","t0":1.86,"t1":2.3},{"w":"and","t0":2.42,"t1":2.5},{"w":"Saturn.","t0":2.5,"t1":2.96}]}>These are Mercury, Venus, Mars, Jupiter, and Saturn.</Line>
<Line id="line-3" span={{"start":7.92,"end":11.9}} words={[{"w":"Pretty","t0":0,"t1":0.12},{"w":"much","t0":0.12,"t1":0.32},{"w":"every","t0":0.34,"t1":0.58},{"w":"culture","t0":0.6,"t1":0.96},{"w":"knew","t0":0.96,"t1":1.16},{"w":"about","t0":1.16,"t1":1.34},{"w":"these","t0":1.34,"t1":1.52},{"w":"five","t0":1.52,"t1":1.76},{"w":"planets","t0":1.76,"t1":2.14},{"w":"because","t0":2.14,"t1":2.32},{"w":"they","t0":2.32,"t1":2.4},{"w":"could","t0":2.4,"t1":2.56},{"w":"easily","t0":2.6,"t1":2.9},{"w":"see","t0":2.9,"t1":3.22},{"w":"up","t0":3.34,"t1":3.48},{"w":"in","t0":3.48,"t1":3.54},{"w":"the","t0":3.54,"t1":3.6},{"w":"sky.","t0":3.6,"t1":3.98}]}>Pretty much every culture knew about these five planets because they could easily see up in the sky.</Line>
<Line id="line-4" span={{"start":12.4,"end":14.76}} words={[{"w":"They","t0":0,"t1":0.08},{"w":"had","t0":0.08,"t1":0.18},{"w":"different","t0":0.18,"t1":0.44},{"w":"names","t0":0.44,"t1":0.74},{"w":"for","t0":0.74,"t1":0.86},{"w":"them","t0":0.86,"t1":0.94},{"w":"than","t0":0.94,"t1":1.02},{"w":"the","t0":1.02,"t1":1.1},{"w":"names","t0":1.1,"t1":1.26},{"w":"that","t0":1.26,"t1":1.38},{"w":"we","t0":1.38,"t1":1.56},{"w":"use","t0":1.56,"t1":1.76},{"w":"now","t0":1.76,"t1":2},{"w":"in","t0":2,"t1":2.06},{"w":"English.","t0":2.06,"t1":2.36}]}>They had different names for them than the names that we use now in English.</Line>
<Line id="line-5" span={{"start":14.76,"end":26.6}} words={[{"w":"These","t0":0,"t1":0.16},{"w":"come","t0":0.16,"t1":0.32},{"w":"from","t0":0.32,"t1":0.42},{"w":"the","t0":0.42,"t1":0.5},{"w":"Roman","t0":0.52,"t1":0.84},{"w":"names,","t0":0.84,"t1":1.26},{"w":"and","t0":1.6,"t1":1.66},{"w":"that's","t0":1.66,"t1":1.78},{"w":"because","t0":1.78,"t1":2},{"w":"the","t0":2,"t1":2.1},{"w":"early","t0":2.1,"t1":2.34},{"w":"astronomers","t0":2.34,"t1":2.96},{"w":"in","t0":3.02,"t1":3.16},{"w":"Europe","t0":3.16,"t1":3.56},{"w":"wrote","t0":3.96,"t1":4.16},{"w":"in","t0":4.16,"t1":4.28},{"w":"Latin,","t0":4.28,"t1":4.54},{"w":"and","t0":4.54,"t1":4.82},{"w":"Latin","t0":4.82,"t1":5.14},{"w":"was","t0":5.14,"t1":5.28},{"w":"the","t0":5.28,"t1":5.52},{"w":"language","t0":5.62,"t1":5.96},{"w":"of","t0":5.96,"t1":6},{"w":"the","t0":6,"t1":6.08},{"w":"Roman","t0":6.1,"t1":6.32},{"w":"Empire,","t0":6.32,"t1":6.7},{"w":"so","t0":6.7,"t1":6.82},{"w":"we","t0":6.82,"t1":6.9},{"w":"ended","t0":6.9,"t1":7},{"w":"up","t0":7,"t1":7.12},{"w":"with","t0":7.12,"t1":7.22},{"w":"these","t0":7.22,"t1":7.36},{"w":"Roman","t0":7.38,"t1":7.64},{"w":"names","t0":7.64,"t1":7.96},{"w":"after","t0":7.96,"t1":8.14},{"w":"the","t0":8.14,"t1":8.24},{"w":"Roman","t0":8.24,"t1":8.58},{"w":"gods,","t0":8.58,"t1":8.98},{"w":"Mercury,","t0":9,"t1":9.46},{"w":"Venus,","t0":9.6,"t1":10.14},{"w":"Mars,","t0":10.2,"t1":10.68},{"w":"Jupiter,","t0":10.78,"t1":11.18},{"w":"and","t0":11.38,"t1":11.46},{"w":"Saturn.","t0":11.46,"t1":11.84}]}>These come from the Roman names, and that's because the early astronomers in Europe wrote in Latin, and Latin was the language of the Roman Empire, so we ended up with these Roman names after the Roman gods, Mercury, Venus, Mars, Jupiter, and Saturn.</Line>
<Line id="line-6" span={{"start":27.24,"end":31}} words={[{"w":"If","t0":0,"t1":0.08},{"w":"we","t0":0.08,"t1":0.18},{"w":"keep","t0":0.18,"t1":0.38},{"w":"on","t0":0.38,"t1":0.48},{"w":"going","t0":0.48,"t1":0.68},{"w":"outward,","t0":0.7,"t1":1.08},{"w":"we","t0":1.08,"t1":1.18},{"w":"have","t0":1.18,"t1":1.4},{"w":"three","t0":1.6,"t1":1.86},{"w":"more","t0":1.86,"t1":2.06},{"w":"things","t0":2.06,"t1":2.38},{"w":"that","t0":2.38,"t1":2.46},{"w":"historically","t0":2.46,"t1":2.98},{"w":"have","t0":2.98,"t1":3.06},{"w":"been","t0":3.06,"t1":3.16},{"w":"called","t0":3.16,"t1":3.38},{"w":"planets.","t0":3.38,"t1":3.76}]}>If we keep on going outward, we have three more things that historically have been called planets.</Line>
<Line id="line-7" span={{"start":31,"end":32.76}} words={[{"w":"You","t0":0,"t1":0.08},{"w":"have","t0":0.08,"t1":0.26},{"w":"Uranus,","t0":0.26,"t1":0.82},{"w":"Neptune,","t0":0.92,"t1":1.34},{"w":"and","t0":1.34,"t1":1.4},{"w":"Pluto.","t0":1.4,"t1":1.76}]}>You have Uranus, Neptune, and Pluto.</Line>
<Line id="line-8" span={{"start":33.38,"end":34.74}} words={[{"w":"These","t0":0,"t1":0.22},{"w":"are","t0":0.22,"t1":0.36},{"w":"Greek","t0":0.44,"t1":0.8},{"w":"or","t0":0.8,"t1":0.88},{"w":"Roman","t0":0.9,"t1":1.14},{"w":"names.","t0":1.14,"t1":1.36}]}>These are Greek or Roman names.</Line>
<Line id="line-9" span={{"start":34.76,"end":41.94}} words={[{"w":"These","t0":0,"t1":0.14},{"w":"planets","t0":0.16,"t1":0.44},{"w":"weren't","t0":0.44,"t1":0.56},{"w":"seen","t0":0.58,"t1":0.84},{"w":"by","t0":0.84,"t1":0.96},{"w":"the","t0":0.96,"t1":1.02},{"w":"Greeks","t0":1.02,"t1":1.28},{"w":"or","t0":1.28,"t1":1.34},{"w":"Romans,","t0":1.36,"t1":1.76},{"w":"but","t0":2.16,"t1":2.32},{"w":"because","t0":2.32,"t1":2.58},{"w":"the","t0":2.58,"t1":2.68},{"w":"discoverers","t0":2.68,"t1":3.12},{"w":"wanted","t0":3.14,"t1":3.36},{"w":"their","t0":3.36,"t1":3.46},{"w":"planets","t0":3.46,"t1":3.74},{"w":"to","t0":3.74,"t1":3.84},{"w":"fit","t0":3.84,"t1":4.02},{"w":"in","t0":4.02,"t1":4.14},{"w":"with","t0":4.14,"t1":4.28},{"w":"the","t0":4.28,"t1":4.34},{"w":"existing","t0":4.34,"t1":4.82},{"w":"theme","t0":4.88,"t1":5.3},{"w":"of","t0":5.4,"t1":5.5},{"w":"the","t0":5.5,"t1":5.56},{"w":"mythology","t0":5.56,"t1":6.1},{"w":"of","t0":6.1,"t1":6.16},{"w":"the","t0":6.16,"t1":6.24},{"w":"existing","t0":6.24,"t1":6.68},{"w":"planets.","t0":6.68,"t1":7.18}]}>These planets weren't seen by the Greeks or Romans, but because the discoverers wanted their planets to fit in with the existing theme of the mythology of the existing planets.</Line>
<Line id="line-10" span={{"start":42.02,"end":46.2}} words={[{"w":"And","t0":0,"t1":0.12},{"w":"all","t0":0.12,"t1":0.22},{"w":"these","t0":0.22,"t1":0.4},{"w":"are","t0":0.4,"t1":0.46},{"w":"totally","t0":0.48,"t1":0.98},{"w":"different","t0":0.98,"t1":1.26},{"w":"than","t0":1.26,"t1":1.34},{"w":"the","t0":1.34,"t1":1.46},{"w":"inner","t0":1.46,"t1":1.68},{"w":"planets","t0":1.68,"t1":2.06},{"w":"because","t0":2.06,"t1":2.32},{"w":"they","t0":2.32,"t1":2.48},{"w":"were","t0":2.6,"t1":2.84},{"w":"discovered","t0":3.12,"t1":3.5},{"w":"more","t0":3.5,"t1":3.7},{"w":"recently.","t0":3.72,"t1":4.18}]}>And all these are totally different than the inner planets because they were discovered more recently.</Line>
<Line id="line-11" span={{"start":46.4,"end":47.92}} words={[{"w":"They're","t0":0,"t1":0.14},{"w":"fainter","t0":0.14,"t1":0.52},{"w":"and","t0":0.52,"t1":0.6},{"w":"they","t0":0.6,"t1":0.72},{"w":"move","t0":0.8,"t1":0.92},{"w":"more","t0":0.92,"t1":1.1},{"w":"slowly.","t0":1.1,"t1":1.52}]}>They're fainter and they move more slowly.</Line>
<Line id="line-12" span={{"start":47.92,"end":49.38}} words={[{"w":"You","t0":0,"t1":0.1},{"w":"can't","t0":0.12,"t1":0.38},{"w":"see","t0":0.38,"t1":0.56},{"w":"them","t0":0.56,"t1":0.64},{"w":"with","t0":0.64,"t1":0.76},{"w":"your","t0":0.76,"t1":0.92},{"w":"naked","t0":0.92,"t1":1.24},{"w":"eye.","t0":1.26,"t1":1.46}]}>You can't see them with your naked eye.</Line>
<Line id="line-13" span={{"start":49.38,"end":51.42}} words={[{"w":"You","t0":0,"t1":0.06},{"w":"have","t0":0.08,"t1":0.2},{"w":"to","t0":0.2,"t1":0.3},{"w":"use","t0":0.3,"t1":0.48},{"w":"a","t0":0.48,"t1":0.52},{"w":"telescope,","t0":0.52,"t1":1.04},{"w":"and","t0":1.04,"t1":1.1},{"w":"that's","t0":1.1,"t1":1.24},{"w":"how","t0":1.24,"t1":1.34},{"w":"they","t0":1.36,"t1":1.52},{"w":"were","t0":1.52,"t1":1.62},{"w":"discovered.","t0":1.62,"t1":2.04}]}>You have to use a telescope, and that's how they were discovered.</Line>
<Animation>
<Appear target="scrim" at="start" dur={0} />
<Appear target="chapter" at={0.4} dur={0} />
<Tween target="chapter" to={{show: 1}} at={0.4} dur={0.5} />

<Appear target="planets" line="line-2" word="Mercury" dur={0} />
<Tween target="planets" to={{shown: 1, focus: 0}} line="line-2" word="Mercury" dur={0.35} />
<Tween target="planets" to={{shown: 2, focus: 1}} line="line-2" word="Venus" dur={0.35} />
<Tween target="planets" to={{shown: 3, focus: 2}} line="line-2" word="Mars" dur={0.35} />
<Tween target="planets" to={{shown: 4, focus: 3}} line="line-2" word="Jupiter" dur={0.35} />
<Tween target="planets" to={{shown: 5, focus: 4}} line="line-2" word="Saturn" dur={0.35} />
<Tween target="planets" to={{focus: -1}} line="line-3" word="five planets" dur={0.3} />
<Disappear target="planets" line="line-3" word="five planets" />

<Appear target="sky" at={7.8} dur={0} />
<Tween target="sky" to={{draw: 1}} at={7.8} dur={1} />
<Tween target="sky" to={{x: 90}} at={7.8} dur={2.4} easing="linear" />
<Disappear target="sky" at={10.2} dur={0} />

<Appear target="five" line="line-3" word="five" dur={0} />
<Tween target="five" to={{show: 1}} line="line-3" word="five" dur={0.4} />
<Tween target="five" to={{value: 5}} line="line-3" word="five" dur={0.8} easing="easeOutQuart" />
<Disappear target="five" line="line-4" word="They had" />

<Appear target="swap" line="line-4" word="different names" dur={0.3} />
<Tween target="swap" to={{strike: 1}} line="line-4" word="different names" offset={0.3} dur={0.5} />
<Tween target="swap" to={{turn: 1}} line="line-5" word="from the Roman names" dur={0.6} />
<Disappear target="swap" at={18.6} dur={0} />

<Appear target="latin" at={21.4} dur={0} />
<Tween target="latin" to={{show: 1}} at={21.4} dur={0.7} />
<Disappear target="latin" at={23.8} dur={0} />

<Appear target="gods" line="line-5" word="Roman gods" dur={0} />
<Tween target="gods" to={{show: 1}} line="line-5" word="Roman gods" dur={0.4} />
<Tween target="gods" to={{under: 1}} line="line-5" word="Roman gods" offset={0.3} dur={0.6} />
<Disappear target="gods" at={26.87} dur={0} />

<Disappear target="chapter" line="line-6" word="If we" dur={0.3} />
<Appear target="chapter2" line="line-6" word="going outward" dur={0} />
<Tween target="chapter2" to={{show: 1}} line="line-6" word="going outward" dur={0.5} />

<Appear target="count" line="line-6" word="outward" dur={0} />
<Tween target="count" to={{grown: 1}} line="line-6" word="outward" dur={0.6} />
<Tween target="count" to={{grown: 2, focus: 1}} line="line-6" word="three more" dur={0.6} />
<Disappear target="count" line="line-7" word="Pluto" edge="end" />

<Appear target="inset" at="start" dur={0} />
<Tween target="inset" to={{move: 1}} at={35.1} dur={0.9} easing="easeInOut" />

<Appear target="theme" line="line-9" word="the discoverers" dur={0} />
<Tween target="theme" to={{show: 1}} line="line-9" word="the discoverers" dur={3.6} easing="linear" />
<Disappear target="theme" line="line-9" word="existing planets" edge="end" />

<Appear target="versus" line="line-10" word="And all these" dur={0} />
<Tween target="versus" to={{show: 1}} line="line-10" word="And all these" dur={0.8} />
<Tween target="versus" to={{decide: 1}} line="line-10" word="totally different" dur={0.5} />
<Disappear target="versus" line="line-10" word="recently." edge="end" />

<Appear target="verdict" line="line-11" word="They're" dur={0} />
<Tween target="verdict" to={{shown: 1}} line="line-11" word="They're" dur={0.4} />
<Tween target="verdict" to={{shown: 2}} line="line-11" word="fainter" dur={0.4} />
<Tween target="verdict" to={{shown: 3}} line="line-11" word="move" dur={0.4} />
<Tween target="verdict" to={{shown: 4}} line="line-12" word="naked eye" dur={0.4} />
<Tween target="verdict" to={{settle: 1}} line="line-13" word="telescope" dur={0.6} />
</Animation>
</Scene>
</Doc>;
