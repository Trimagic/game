import {haptics} from '../haptics.ts';
export type Cue='tap'|'good'|'hit'|'jump'|'win'|'lose';
export type Fx='click'|'tick'|'step'|'whoosh'|'coin'|'pickup'|'powerup'|'thud'|'land'|'splash'|'cut'|'ding'|'buzz'|'alarm'|'crash'|'ring'|'warn'|'hiss'|'boing'|'creak'|'rustle';
type Note=[hz:number,duration:number,type:OscillatorType,gain:number,delay?:number];
// Each effect is a few short oscillator notes and the vibration that goes with it.
export const EFFECTS:Record<Fx,{notes:Note[];haptic?:string}>={
 click:{notes:[[640,.035,'square',.07]],haptic:'tap'},
 tick:{notes:[[880,.025,'square',.06]],haptic:'tap'},
 step:{notes:[[150,.045,'sine',.13]],haptic:'tap'},
 whoosh:{notes:[[560,.05,'sine',.16],[390,.05,'sine',.14,.04],[250,.06,'sine',.12,.08]],haptic:'jump'},
 coin:{notes:[[988,.06,'triangle',.2],[1319,.1,'triangle',.18,.05]],haptic:'good'},
 pickup:{notes:[[523,.07,'triangle',.22],[784,.07,'triangle',.22,.06],[1047,.12,'triangle',.2,.12]],haptic:'good'},
 powerup:{notes:[[392,.07,'triangle',.22],[523,.07,'triangle',.22,.07],[659,.07,'triangle',.22,.14],[784,.16,'triangle',.22,.21]],haptic:'good'},
 thud:{notes:[[92,.14,'sine',.34],[58,.16,'sine',.3,.03]],haptic:'thud'},
 land:{notes:[[120,.07,'sine',.2]],haptic:'jump'},
 splash:{notes:[[300,.05,'sawtooth',.1],[190,.09,'sawtooth',.08,.04]],haptic:'hit'},
 cut:{notes:[[1500,.03,'square',.08],[760,.04,'square',.07,.025]],haptic:'tap'},
 ding:{notes:[[1175,.16,'triangle',.18]],haptic:'good'},
 buzz:{notes:[[150,.16,'sawtooth',.16]],haptic:'error'},
 alarm:{notes:[[880,.1,'square',.1],[660,.1,'square',.1,.11],[880,.12,'square',.1,.22]],haptic:'error'},
 crash:{notes:[[210,.1,'sawtooth',.2],[110,.16,'sawtooth',.2,.05],[70,.2,'sine',.3,.08]],haptic:'thud'},
 ring:{notes:[[1320,.07,'square',.08],[1040,.07,'square',.08,.08],[1320,.07,'square',.08,.16],[1040,.07,'square',.08,.24]],haptic:'hit'},
 warn:{notes:[[740,.07,'square',.08]],haptic:'tap'},
 hiss:{notes:[[2300,.12,'sawtooth',.03],[1900,.14,'sawtooth',.025,.06]]},
 boing:{notes:[[260,.09,'triangle',.22],[620,.16,'triangle',.2,.06]],haptic:'hit'},
 creak:{notes:[[1200,.06,'square',.05],[900,.09,'square',.05,.05]],haptic:'error'},
 rustle:{notes:[[1700,.04,'sawtooth',.03],[1400,.05,'sawtooth',.03,.04]],haptic:'tap'},
};
export class Soundtrack {
 enabled=true;
 private context:AudioContext|null=null;
 private master:GainNode|null=null;
 private voices=new Set<OscillatorNode>();
 private timer:ReturnType<typeof setInterval>|undefined;
 private theme='';private playing=false;private step=0;private blocked=false;private ending=false;
 private listeners=new Set<()=>void>();
 constructor(){try{this.enabled=localStorage.getItem('game-sound')!=='off';}catch{/* Storage is optional. */}}
 subscribe=(fn:()=>void)=>{this.listeners.add(fn);return()=>{this.listeners.delete(fn);};};
 snapshot=()=>this.enabled;
 unlock(){try{this.context??=new AudioContext();if(!this.master){this.master=this.context.createGain();this.master.gain.value=this.enabled?.18:0;this.master.connect(this.context.destination);}void this.context.resume().then(()=>this.begin()).catch(()=>{});}catch{/* Silent play remains available. */}}
 toggle(){this.enabled=!this.enabled;try{localStorage.setItem('game-sound',this.enabled?'on':'off');}catch{/* Optional. */}if(this.master)this.master.gain.value=this.enabled?.18:0;if(!this.enabled)this.clear();else this.unlock();this.listeners.forEach(fn=>fn());}
 set(theme:string,playing:boolean){if(theme!==this.theme){this.step=0;this.clear();}this.theme=theme;this.playing=playing;if(!playing)this.clear();else {this.ending=false;this.begin();}}
 suspend(){this.blocked=true;this.clear();}
 foreground(){this.blocked=false;if(this.theme==='birthday')this.begin();}
 stop(){this.playing=false;if(this.ending){if(this.timer!==undefined)clearInterval(this.timer);this.timer=undefined;this.ending=false;}else this.clear();}
 private clear(){if(this.timer!==undefined)clearInterval(this.timer);this.timer=undefined;for(const voice of this.voices){try{voice.stop();}catch{/* Already ended. */}}this.voices.clear();}
 tone(frequency:number,duration=.1,type:OscillatorType='sine',gain=.25,delay=0){const c=this.context;if(!this.enabled||this.blocked||!c||c.state!=='running'||!this.master||this.voices.size>24)return;const o=c.createOscillator(),g=c.createGain(),t=c.currentTime+delay;o.type=type;o.frequency.value=frequency;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(gain,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(this.master);this.voices.add(o);o.onended=()=>{this.voices.delete(o);o.disconnect();g.disconnect();};o.start(t);o.stop(t+duration+.01);}
 /** Vibrates even with the sound off, like cues do. */
 fx(name:Fx){const effect=EFFECTS[name];if(effect.haptic&&!this.blocked)haptics.cue(effect.haptic);effect.notes.forEach(([hz,duration,type,gain,delay])=>this.tone(hz,duration,type,gain,delay??0));}
 cue(cue:Cue){if(!this.blocked)haptics.cue(cue);this.ending=cue==='win'||cue==='lose';if(this.ending)this.clear();const notes:Record<Cue,number[]>={tap:[220],good:[523,784],hit:[130,80],jump:[330,660],win:[523,659,784,1047],lose:[330,262,196]};notes[cue].forEach((hz,i)=>this.tone(hz,cue==='win'||cue==='lose'?.22:.09,cue==='hit'?'sawtooth':'sine',.32,i*.09));}
 private begin(){if(this.timer!==undefined||!this.playing||!this.enabled||this.blocked||this.context?.state!=='running'||this.theme==='gym')return;
  if(this.theme==='birthday'){
   const melody:[number,number][]=[[67,1],[67,1],[69,2],[67,2],[72,2],[71,4],[67,1],[67,1],[69,2],[67,2],[74,2],[72,4],[67,1],[67,1],[79,2],[76,2],[72,2],[71,2],[69,4],[77,1],[77,1],[76,2],[72,2],[74,2],[72,6],[0,8]];
   const total=melody.reduce((n,[,beats])=>n+beats,0);
   const play=()=>{const beat=this.step++%total;let at=0;for(const [midi,beats]of melody){if(at===beat&&midi){const hz=440*2**((midi-69)/12);this.tone(hz,beats*.26*.9,'triangle',.2);this.tone(hz*2,Math.min(.2,beats*.2),'sine',.045);if(beat===0||beat===12||beat===24||beat===38)this.tone(130.81,.65,'sine',.16);break;}at+=beats;}};
   play();this.timer=setInterval(play,260);return;
  }
  const calm=['sleep','night','delivery','remote'].includes(this.theme),pace=calm?420:260;
  const patterns:Record<string,number[]>={bike:[0,4,7,12,7,4,2,7],pool:[0,7,4,9,7,4,2,4],shop:[0,4,7,4,2,5,9,5],cook:[0,7,9,7,4,2,4,7],run:[0,7,12,7,4,7,9,7],schedule:[0,2,4,7,9,7,4,2],sleep:[0,7,12,7,4,7,11,7],remote:[0,3,7,3,5,3,2,7],delivery:[0,3,7,10,7,5,3,2],night:[0,7,3,7,2,7,5,3]};
  this.timer=setInterval(()=>{const n=this.step++,pattern=patterns[this.theme]??patterns.bike;this.tone(220*2**(pattern[n%8]/12),calm?.45:.18,'triangle',.12);if(n%4===0)this.tone(n%8===0?110:146.83,.3,'sine',.18);},pace);
 }
}
export const sound=new Soundtrack();

