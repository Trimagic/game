import {haptics} from '../haptics';
import {sound} from '../audio/sound';
import {gymBeat} from '../audio/music';
import Phaser from 'phaser';
import SceneBase from '../arcade/SceneBase';
import type {ArcadeEvents} from '../arcade/types';
import {chart,END,initial,input,tick,phases,secondWind,gymRating,multiplier,bonusSets,regular,FEVER_STREAK,type Lane} from './model';
import {saveBest} from '../best';
const colors=[0xffae68,0x83e2d6];
// Backing track: it follows the phase's own beat, so it can never drift off the notes.
export default class GymScene extends SceneBase {
 private model=initial(); private elapsed=0; private hudAt=0;
 private ink!:Phaser.GameObjects.Graphics; private stats!:Phaser.GameObjects.Text;
 private coach!:Phaser.GameObjects.Text; private judgement!:Phaser.GameObjects.Text;
 private sources=[new Set<string>(),new Set<string>()];private pads:Phaser.GameObjects.Rectangle[]=[]; private pointers=new Map<number,Lane>();
  private beat=''; private stage=-1; private bonusGroup=-1;
 constructor(events:ArcadeEvents){super('gym',events);}
 create(){
  this.view={status:'ready',title:'Железо тоже любит ритм.',detail:'Три подхода: гантели, приседания и финальный жим. Круг — нажми, хвост — держи и отпусти на белой линии, пара — обе руки. Серия умножает очки до ×4, а каждые 20 попаданий подряд включают «Режим зверя» с двойными очками. В перерывах тренер кричит «Ещё один!» — золотые ноты необязательны, но очень ценны. Пробел — второе дыхание после серии из 8.',actions:[]};
  this.setup();this.box(210,32,420,64,0x274e49);this.stats=this.text(16,17,'',14,'#fff3d6');
  this.box(210,137,420,146,0xe9d8b6);this.coach=this.text(168,91,'',13);this.coach.setWordWrapWidth(238);
  this.box(210,350,420,280,0x173d40);this.ink=this.add.graphics();
  this.judgement=this.text(210,480,'',13,'#fff3d6',true).setDepth(4);
  for(const lane of [0,1] as Lane[]){const x=lane?310:110;this.pads.push(this.box(x,528,186,50,colors[lane]));this.text(x,528,lane?'ПРАВАЯ →':'← ЛЕВАЯ',15,'#293a34',true);}
  // The whole lower half of each side is its hand, not just the drawn pad, so a slightly off tap still counts.
  this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(this.running&&p.y>=215)this.press(p.id,p.x<210?0:1);});
  this.input.on('pointerup',(p:Phaser.Input.Pointer)=>this.releasePointer(p));
  this.input.on('pointerupoutside',(p:Phaser.Input.Pointer)=>this.releasePointer(p));
  this.input.keyboard?.on('keyup',(e:KeyboardEvent)=>{const lane=this.lane(e.code);if(lane!==undefined)this.setSource(lane,e.code,false);});
  this.paint();
 }
 private lane(code:string):Lane|undefined{return ['KeyA','ArrowLeft'].includes(code)?0:['KeyD','ArrowRight'].includes(code)?1:undefined;}
 protected key(e:KeyboardEvent){const lane=this.lane(e.code);if(lane!==undefined){e.preventDefault();this.setSource(lane,e.code,true);}if(e.code==='Space'&&!(e.target instanceof HTMLButtonElement)){e.preventDefault();this.action('wind');}if(e.code==='KeyM')this.action('mute');}
 /** A finger takes one hand; if its id was holding the other hand, that hand is let go first. */
 private press(id:number,lane:Lane){const old=this.pointers.get(id);if(old!==undefined&&old!==lane)this.setSource(old,'p'+id,false);this.pointers.set(id,lane);this.setSource(lane,'p'+id,true);}
 /** A finger whose release was lost (left the canvas, cancelled by the app) would hold its hand forever; let it go. */
 private releaseLost(){for(const [id,lane] of [...this.pointers]){const pointer=this.input.manager.pointers.find(q=>q.id===id);if(!pointer||!pointer.isDown){this.pointers.delete(id);this.setSource(lane,'p'+id,false);}}}
 private releasePointer(p:Phaser.Input.Pointer){const lane=this.pointers.get(p.id);if(lane!==undefined){this.pointers.delete(p.id);this.setSource(lane,'p'+p.id,false);}}
 private setSource(lane:Lane,id:string,down:boolean){if(!this.running)return;if(down)haptics.cue('tap');down?this.sources[lane].add(id):this.sources[lane].delete(id);const before=this.model;this.model=input(before,lane,this.sources[lane].size>0,this.elapsed);if(this.model.points>before.points){this.pop(lane?310:110,435,this.model.feedback,this.model.feedback.startsWith('ЕЩЁ')||this.model.feedback==='В ТОЧКУ!'?'#9b5725':'#286b56');if(this.model.fevers>before.fevers){sound.fx('powerup');if(!this.reduced)this.cameras.main.flash(180,255,214,120);}}if(this.model.energy<before.energy&&this.model.status==='playing')sound.fx('buzz');this.paint();this.publishResult();}
 protected pause(){this.sources.forEach(s=>s.clear());this.pointers.clear();this.model={...this.model,pressed:[false,false]};super.pause();}
 action(id:string){if(!this.running)return;if(id==='unlock'){sound.unlock();}else if(id==='mute')sound.toggle();else if(id==='wind'){const old=this.model;this.model=secondWind(old);if(this.model!==old){sound.fx('powerup');this.pop(210,330,'ВТОРОЕ ДЫХАНИЕ!','#286b56',false);}}else {const [kind,lane,source]=id.split(':');if(kind==='down'||kind==='up')this.setSource(Number(lane) as Lane,source??'button',kind==='down');}this.sync();}
 protected sync(){const judged=regular.filter(n=>n.id in this.model.results).length;this.view={status:'playing',title:`Подход ${Math.max(0,this.stage)+1}/3 · ★ ${this.model.points} · точность ${judged?Math.floor(this.model.score/judged):100}% · серия ${this.model.combo} (×${multiplier(this.model.combo)})`,detail:'Круг — нажми. Хвост — удерживай и отпусти на линии. Пара — обе руки. После паузы удержание нужно зажать снова.',actions:[{id:'wind',label:this.model.windUsed?'Второе дыхание использовано':`Второе дыхание · ${Math.min(8,this.model.combo)}/8`,disabled:this.model.windUsed||this.model.combo<8},{id:'mute',label:!sound.enabled?'Звук: выкл.':'Звук: вкл.'}]};this.bridge.publish(this.view);}
 private publishResult(){const m=this.model;if(m.status==='playing'){this.sync();return;}const judged=regular.filter(n=>n.id in m.results).length;const accuracy=Math.floor(m.score/Math.max(1,judged));if(m.status!=='won'){this.finish(false,'Сбились с ритма?',`Точность ${accuracy}% · лучшая серия ${m.best}. ${m.energy===0?'Силы закончились. Попробуй спокойнее ловить белую линию.':'Для победы нужна точность от 65%.'}`);return;}const stars=gymRating(m),saved=saveBest('gym-best',m.points);this.finish(true,`${'★'.repeat(stars)}${'☆'.repeat(3-stars)} Вот теперь последний! ${m.points} очков`,`Точность ${Math.round(m.score/regular.length)}% · лучшая серия ${m.best} · «Режим зверя» ×${m.fevers} · бонусных повторов ${m.bonusHits} из ${chart.length-regular.length}. ${saved.record?'Новый личный рекорд!':`Рекорд: ${saved.best}.`}`);}
 private playBeat(){const phase=phases[Math.max(0,this.stage)];const beat=Math.floor((this.elapsed-phase.start)/(60000/phase.bpm));const id=phase.start+':'+beat;if(id===this.beat||beat>=phase.beats||beat< -4)return;this.beat=id;for(const n of gymBeat(Math.max(0,this.stage),beat))sound.tone(n.hz,n.duration,n.type,n.gain,0,n.endHz);}
 private paint(){
  const s=this.model,t=this.elapsed;this.stage=t<21000?0:t<38000?1:2;const phase=phases[this.stage];const rest=t>19000&&t<22000||t>35500&&t<39000||t>54300;const group=bonusSets.findIndex(set=>t>set[0].at-1800&&t<set[set.length-1].at+250);if(group>=0&&group!==this.bonusGroup){this.bonusGroup=group;sound.fx('ding');this.pop(210,300,'ТРЕНЕР: «ЕЩЁ ОДИН!»','#9b5725',false);}const fever=t<s.feverUntil;const beat=(t-phase.start)/(60000/phase.bpm);
  const g=this.ink;g.clear();g.fillStyle(0x8b7a60);g.fillRect(12,67,396,7);g.fillStyle(s.energy<30?0xe66b48:0x86c8a5);g.fillRect(12,67,396*s.energy/100,7);
  this.stats.setText(`СИЛЫ ${s.energy}   СЕРИЯ ${s.combo} · ×${multiplier(s.combo)}${fever?' · ЗВЕРЬ ×2':''}\n★ ${s.points}   ${phase.bpm} BPM          ${Math.ceil((END-t)/1000)} С`);
  this.coach.setText(`${this.stage+1} / ${phase.title.toUpperCase()}\n\n${group>=0?'«ЕЩЁ ОДИН! Золотые — по желанию!»':rest?'«Отдыхаем. Но недолго!»':this.stage===0?'«Поднимаем уверенность. Гантель тоже.»':this.stage===1?'«Вниз. Держим. Нет, это ещё не всё.»':'«Последний повтор! Я уже говорил?»'}`);
  // The athlete follows actual presses; squats bend both knees.
  const lift=s.pressed.some(Boolean)?1:0,bob=this.reduced?0:this.stage===1?lift*10:-lift*5;
  g.lineStyle(6,0x796f5c);g.lineBetween(20,190,145,190);g.lineBetween(27,100,27,190);g.lineBetween(140,100,140,190);
  g.lineStyle(10,0x304a48);g.lineBetween(76,161+bob,64-lift*4,195);g.lineBetween(95,161+bob,110+lift*4,195);
  g.fillStyle(0x417b70);g.fillRoundedRect(65,120+bob,42,47,12);g.fillStyle(0xf0ba94);g.fillCircle(86,104+bob,19);g.fillStyle(0xb36d39);g.fillEllipse(86,88+bob,39,18);g.fillRoundedRect(72,112+bob,29,12,7);g.fillStyle(0x243c39);g.fillCircle(80,103+bob,2);g.fillCircle(93,103+bob,2);
  for(const lane of [0,1] as Lane[]){const x=lane?123:47,y=(s.pressed[lane]?115:154)+bob;g.lineStyle(8,0xf0ba94);g.lineBetween(lane?105:66,131+bob,x,y);g.lineStyle(5,0x344845);g.lineBetween(x-14,y,x+14,y);g.fillStyle(0x344845);g.fillRoundedRect(x-17,y-11,9,22,2);g.fillRoundedRect(x+8,y-11,9,22,2);}
  if(fever){g.fillStyle(0xffb347,this.reduced?.12:.1+.08*Math.sin(t/120));g.fillRect(12,215,396,248);}else if(s.combo>=FEVER_STREAK-5){g.fillStyle(0xffb347,.05);g.fillRect(12,215,396,248);}g.lineStyle(1,0x89b9ae,.18);for(let i=0;i<7;i++){const y=220+((i*38+t*.035)%230);g.lineBetween(12,y,408,y);}g.lineBetween(210,215,210,462);
  const pulse=this.reduced?0:1-(beat-Math.floor(beat));g.fillStyle(0xffffff,.04+pulse*.08);g.fillRect(10,426,400,28);
  for(const n of chart){if(n.id in s.results)continue;const held=s.holding[n.lane]===n.id;const y=held?440:440-(n.at-t)*.118;const tail=n.end?440-(n.end-t)*.118:y;if(y<216||tail>465)continue;const x=n.lane?310:110;
   if(n.end){g.lineStyle(17,held?0xffed9e:colors[n.lane],.85);g.lineBetween(x,Math.max(220,tail),x,Math.min(455,y));g.lineStyle(3,0xfff6da);g.lineBetween(x-15,Math.max(220,tail),x+15,Math.max(220,tail));}
   if(y<=462&&n.bonus){g.fillStyle(0xf5cc5c);g.fillCircle(x,y,21);g.lineStyle(3,0x9b5725);g.strokeCircle(x,y,21);g.fillStyle(0x9b5725);g.fillTriangle(x,y-10,x-9,y+7,x+9,y+7);g.fillTriangle(x,y+12,x-9,y-4,x+9,y-4);continue;}
   if(y<=462){g.fillStyle(held?0xffed9e:colors[n.lane]);g.fillCircle(x,y,18);g.lineStyle(3,0xfff4d7);g.strokeCircle(x,y,18);g.lineStyle(3,0x294941);g.lineBetween(x-6,y,x+6,y);if(n.end)g.lineBetween(x,y-6,x,y+6);}
  }
  this.pads.forEach((pad,lane)=>pad.setFillStyle(s.pressed[lane]?0xffed9e:colors[lane]));
  g.lineStyle(3,0xfff6df);g.lineBetween(15,440,405,440);for(const lane of [0,1] as Lane[]){g.lineStyle(s.pressed[lane]?5:2,s.pressed[lane]?0xffed9e:colors[lane]);g.strokeCircle(lane?310:110,440,25);}
  const next=phases.find(p=>t<p.start);this.judgement.setText(group>=0&&!s.feedback.startsWith('ЕЩЁ')?'ЗОЛОТЫЕ ПОВТОРЫ — БОНУС':t<3000||rest&&next?`ГОТОВЬСЯ · ${Math.max(1,Math.ceil((next!.start-t)/1000))}`:fever&&['В ТОЧКУ!','В РИТМ!'].includes(s.feedback)?`РЕЖИМ ЗВЕРЯ · ${Math.ceil((s.feverUntil-t)/1000)} С`:s.feedback);
  g.fillStyle(0xefb569);g.fillRect(0,558,420*t/END,2);
 }
 update(_time:number,delta:number){if(!this.running)return;if(delta>500){this.pause();return;}this.elapsed+=delta;this.releaseLost();const before=this.model;this.model=tick(this.model,this.elapsed);if(this.model.energy<before.energy&&this.model.status==='playing')sound.fx('buzz');this.paint();this.playBeat();if(this.model.status!=='playing')this.publishResult();else if(this.elapsed-this.hudAt>120){this.hudAt=this.elapsed;this.sync();}}
}



