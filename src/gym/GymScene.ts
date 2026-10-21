import Phaser from 'phaser';
import SceneBase from '../arcade/SceneBase';
import type {ArcadeEvents} from '../arcade/types';
import {chart,END,initial,input,tick,phases,secondWind,type Lane} from './model';
const colors=[0xffae68,0x83e2d6];
export default class GymScene extends SceneBase {
 private model=initial(); private elapsed=0; private hudAt=0;
 private ink!:Phaser.GameObjects.Graphics; private stats!:Phaser.GameObjects.Text;
 private coach!:Phaser.GameObjects.Text; private judgement!:Phaser.GameObjects.Text;
 private sources=[new Set<string>(),new Set<string>()]; private pointers=new Map<number,Lane>();
 private audio:AudioContext|null=null; private muted=false; private beat=''; private stage=-1;
 constructor(events:ArcadeEvents){super('gym',events);}
 create(){
  this.view={status:'ready',title:'Железо тоже любит ритм.',detail:'Три подхода: гантели, приседания и финальный жим. Круг — нажми, хвост — держи и отпусти на белой линии, пара — обе руки. После серии из 8 попаданий можно один раз вернуть 25 сил: пробел или «Второе дыхание».',actions:[]};
  this.setup();this.box(210,32,420,64,0x274e49);this.stats=this.text(16,17,'',14,'#fff3d6');
  this.box(210,137,420,146,0xe9d8b6);this.coach=this.text(168,91,'',13);this.coach.setWordWrapWidth(238);
  this.box(210,350,420,280,0x173d40);this.ink=this.add.graphics();
  this.judgement=this.text(210,480,'',13,'#fff3d6',true).setDepth(4);
  for(const lane of [0,1] as Lane[]){const x=lane?310:110;const pad=this.box(x,528,186,50,colors[lane]).setInteractive({useHandCursor:true});this.text(x,528,lane?'ПРАВАЯ →':'← ЛЕВАЯ',15,'#293a34',true);
   pad.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(this.running){this.pointers.set(p.id,lane);this.setSource(lane,'p'+p.id,true);}});
  }
  this.input.on('pointerup',(p:Phaser.Input.Pointer)=>this.releasePointer(p));
  this.input.on('pointerupoutside',(p:Phaser.Input.Pointer)=>this.releasePointer(p));
  this.input.keyboard?.on('keyup',(e:KeyboardEvent)=>{const lane=this.lane(e.code);if(lane!==undefined)this.setSource(lane,e.code,false);});
  this.events.once('shutdown',()=>{void this.audio?.close();this.audio=null;});this.paint();
 }
 private lane(code:string):Lane|undefined{return ['KeyA','ArrowLeft'].includes(code)?0:['KeyD','ArrowRight'].includes(code)?1:undefined;}
 protected key(e:KeyboardEvent){const lane=this.lane(e.code);if(lane!==undefined){e.preventDefault();this.setSource(lane,e.code,true);}if(e.code==='Space'&&!(e.target instanceof HTMLButtonElement)){e.preventDefault();this.action('wind');}if(e.code==='KeyM')this.action('mute');}
 private releasePointer(p:Phaser.Input.Pointer){const lane=this.pointers.get(p.id);if(lane!==undefined){this.pointers.delete(p.id);this.setSource(lane,'p'+p.id,false);}}
 private setSource(lane:Lane,id:string,down:boolean){if(!this.running)return;down?this.sources[lane].add(id):this.sources[lane].delete(id);const before=this.model;this.model=input(before,lane,this.sources[lane].size>0,this.elapsed);if(this.model.score>before.score){this.pop(lane?310:110,435,this.model.feedback,this.model.feedback==='В ТОЧКУ!'?'#9b5725':'#286b56');}this.paint();this.publishResult();}
 protected pause(){this.sources.forEach(s=>s.clear());this.pointers.clear();this.model={...this.model,pressed:[false,false]};super.pause();}
 action(id:string){if(!this.running)return;if(id==='unlock'){try{this.audio??=new AudioContext();void this.audio.resume().catch(()=>{});}catch{/* Visual timing works without sound. */}}else if(id==='mute')this.muted=!this.muted;else if(id==='wind'){const old=this.model;this.model=secondWind(old);if(this.model!==old)this.pop(210,330,'ВТОРОЕ ДЫХАНИЕ!','#286b56');}else {const [kind,lane,source]=id.split(':');if(kind==='down'||kind==='up')this.setSource(Number(lane) as Lane,source??'button',kind==='down');}this.sync();}
 protected sync(){const judged=Object.keys(this.model.results).length;this.view={status:'playing',title:`Подход ${Math.max(0,this.stage)+1}/3 · точность ${judged?Math.floor(this.model.score/judged):100}% · серия ×${this.model.combo}`,detail:'Круг — нажми. Хвост — удерживай и отпусти на линии. Пара — обе руки. После паузы удержание нужно зажать снова.',actions:[{id:'wind',label:this.model.windUsed?'Второе дыхание использовано':`Второе дыхание · ${Math.min(8,this.model.combo)}/8`,disabled:this.model.windUsed||this.model.combo<8},{id:'mute',label:this.muted?'Звук: выкл.':'Звук: вкл.'}]};this.bridge.publish(this.view);}
 private publishResult(){if(this.model.status!=='playing'){const accuracy=Math.floor(this.model.score/Math.max(1,Object.keys(this.model.results).length));this.finish(this.model.status==='won',this.model.status==='won'?'Вот теперь последний!':'Сбились с ритма?',`Точность ${accuracy}% · лучшая серия ×${this.model.best}. ${this.model.status==='won'?'Все три подхода позади.':this.model.energy===0?'Силы закончились. Попробуй спокойнее ловить белую линию.':'Для победы нужна точность от 65%.'}`);}else this.sync();}
 private playBeat(){const phase=phases[Math.max(0,this.stage)];const beat=Math.floor((this.elapsed-phase.start)/(60000/phase.bpm));const id=phase.start+':'+beat;if(id===this.beat||beat>=phase.beats||beat< -4)return;this.beat=id;const ctx=this.audio;if(!ctx||ctx.state!=='running'||this.muted)return;const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=beat%4===0?660:330;g.gain.setValueAtTime(.1,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.09);o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+.1);o.onended=()=>{o.disconnect();g.disconnect();};}
 private paint(){
  const s=this.model,t=this.elapsed;this.stage=t<21000?0:t<38000?1:2;const phase=phases[this.stage];const rest=t>19000&&t<22000||t>35500&&t<39000;const beat=(t-phase.start)/(60000/phase.bpm);
  const g=this.ink;g.clear();g.fillStyle(0x8b7a60);g.fillRect(12,67,396,7);g.fillStyle(s.energy<30?0xe66b48:0x86c8a5);g.fillRect(12,67,396*s.energy/100,7);
  this.stats.setText(`СИЛЫ ${s.energy}   СЕРИЯ ×${s.combo}\n${phase.bpm} BPM                         ${Math.ceil((END-t)/1000)} С`);
  this.coach.setText(`${this.stage+1} / ${phase.title.toUpperCase()}\n\n${rest?'«Отдыхаем. Но недолго!»':this.stage===0?'«Поднимаем уверенность. Гантель тоже.»':this.stage===1?'«Вниз. Держим. Нет, это ещё не всё.»':'«Последний повтор! Я уже говорил?»'}`);
  // The athlete follows actual presses; squats bend both knees.
  const lift=s.pressed.some(Boolean)?1:0,bob=this.reduced?0:this.stage===1?lift*10:-lift*5;
  g.lineStyle(6,0x796f5c);g.lineBetween(20,190,145,190);g.lineBetween(27,100,27,190);g.lineBetween(140,100,140,190);
  g.lineStyle(10,0x304a48);g.lineBetween(76,161+bob,64-lift*4,195);g.lineBetween(95,161+bob,110+lift*4,195);
  g.fillStyle(0x417b70);g.fillRoundedRect(65,120+bob,42,47,12);g.fillStyle(0xf0ba94);g.fillCircle(86,104+bob,19);g.fillStyle(0xb36d39);g.fillEllipse(86,88+bob,39,18);g.fillRoundedRect(72,112+bob,29,12,7);g.fillStyle(0x243c39);g.fillCircle(80,103+bob,2);g.fillCircle(93,103+bob,2);
  for(const lane of [0,1] as Lane[]){const x=lane?123:47,y=(s.pressed[lane]?115:154)+bob;g.lineStyle(8,0xf0ba94);g.lineBetween(lane?105:66,131+bob,x,y);g.lineStyle(5,0x344845);g.lineBetween(x-14,y,x+14,y);g.fillStyle(0x344845);g.fillRoundedRect(x-17,y-11,9,22,2);g.fillRoundedRect(x+8,y-11,9,22,2);}
  g.lineStyle(1,0x89b9ae,.18);for(let i=0;i<7;i++){const y=220+((i*38+t*.035)%230);g.lineBetween(12,y,408,y);}g.lineBetween(210,215,210,462);
  const pulse=this.reduced?0:1-(beat-Math.floor(beat));g.fillStyle(0xffffff,.04+pulse*.08);g.fillRect(10,426,400,28);
  for(const n of chart){if(n.id in s.results)continue;const held=s.holding[n.lane]===n.id;const y=held?440:440-(n.at-t)*.118;const tail=n.end?440-(n.end-t)*.118:y;if(y<216||tail>465)continue;const x=n.lane?310:110;
   if(n.end){g.lineStyle(17,held?0xffed9e:colors[n.lane],.85);g.lineBetween(x,Math.max(220,tail),x,Math.min(455,y));g.lineStyle(3,0xfff6da);g.lineBetween(x-15,Math.max(220,tail),x+15,Math.max(220,tail));}
   if(y<=462){g.fillStyle(held?0xffed9e:colors[n.lane]);g.fillCircle(x,y,18);g.lineStyle(3,0xfff4d7);g.strokeCircle(x,y,18);g.lineStyle(3,0x294941);g.lineBetween(x-6,y,x+6,y);if(n.end)g.lineBetween(x,y-6,x,y+6);}
  }
  g.lineStyle(3,0xfff6df);g.lineBetween(15,440,405,440);for(const lane of [0,1] as Lane[]){g.lineStyle(s.pressed[lane]?5:2,s.pressed[lane]?0xffed9e:colors[lane]);g.strokeCircle(lane?310:110,440,25);}
  const next=phases.find(p=>t<p.start);this.judgement.setText(t<3000||rest?`ГОТОВЬСЯ · ${Math.max(1,Math.ceil(((next?.start??t)-t)/1000))}`:s.feedback);
  g.fillStyle(0xefb569);g.fillRect(0,558,420*t/END,2);
 }
 update(_time:number,delta:number){if(!this.running)return;if(delta>500){this.pause();return;}this.elapsed+=delta;this.model=tick(this.model,this.elapsed);this.paint();this.playBeat();if(this.model.status!=='playing')this.publishResult();else if(this.elapsed-this.hudAt>120){this.hudAt=this.elapsed;this.sync();}}
}


