import {haptics} from '../haptics.ts';
export type Cue='tap'|'good'|'hit'|'jump'|'win'|'lose';
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
 foreground(){this.blocked=false;}
 stop(){this.playing=false;if(this.ending){if(this.timer!==undefined)clearInterval(this.timer);this.timer=undefined;this.ending=false;}else this.clear();}
 private clear(){if(this.timer!==undefined)clearInterval(this.timer);this.timer=undefined;for(const voice of this.voices){try{voice.stop();}catch{/* Already ended. */}}this.voices.clear();}
 tone(frequency:number,duration=.1,type:OscillatorType='sine',gain=.25,delay=0){const c=this.context;if(!this.enabled||this.blocked||!c||c.state!=='running'||!this.master||this.voices.size>24)return;const o=c.createOscillator(),g=c.createGain(),t=c.currentTime+delay;o.type=type;o.frequency.value=frequency;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(gain,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(this.master);this.voices.add(o);o.onended=()=>{this.voices.delete(o);o.disconnect();g.disconnect();};o.start(t);o.stop(t+duration+.01);}
 cue(cue:Cue){if(!this.blocked)haptics.cue(cue);this.ending=cue==='win'||cue==='lose';if(this.ending)this.clear();const notes:Record<Cue,number[]>={tap:[220],good:[523,784],hit:[130,80],jump:[330,660],win:[523,659,784,1047],lose:[330,262,196]};notes[cue].forEach((hz,i)=>this.tone(hz,cue==='win'||cue==='lose'?.22:.09,cue==='hit'?'sawtooth':'sine',.32,i*.09));}
 private begin(){if(this.timer!==undefined||!this.playing||!this.enabled||this.blocked||this.context?.state!=='running'||this.theme==='gym')return;
  const calm=['sleep','night','delivery','remote'].includes(this.theme),pace=calm?420:260;
  const patterns:Record<string,number[]>={bike:[0,4,7,12,7,4,2,7],pool:[0,7,4,9,7,4,2,4],shop:[0,4,7,4,2,5,9,5],cook:[0,7,9,7,4,2,4,7],run:[0,7,12,7,4,7,9,7],schedule:[0,2,4,7,9,7,4,2],sleep:[0,7,12,7,4,7,11,7],remote:[0,3,7,3,5,3,2,7],delivery:[0,3,7,10,7,5,3,2],night:[0,7,3,7,2,7,5,3]};
  this.timer=setInterval(()=>{const n=this.step++,pattern=patterns[this.theme]??patterns.bike;this.tone(220*2**(pattern[n%8]/12),calm?.45:.18,'triangle',.12);if(n%4===0)this.tone(n%8===0?110:146.83,.3,'sine',.18);},pace);
 }
}
export const sound=new Soundtrack();

