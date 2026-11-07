import {sound} from '../audio/sound';
import {haptics} from '../haptics';
import {saveBest} from '../best';
import Phaser from 'phaser';
import SceneBase from '../arcade/SceneBase';
import type {ArcadeEvents} from '../arcade/types';
import {bonuses,CARD,cartX,CHECKPOINTS,CONE,CONE_TOP,CRUMBLE,DOOR,finalScore,FLOOD,GOAL,GROUND,initial,movers,nightRating,NURSES,nurseAt,puddles,robotX,SCREENS,screenNear,solids,spareHearts,SPRING,step,WIDTH,ZONES,zoneAt} from './model';
// Survives retries within a visit: the scene is rebuilt, the kindness is not.
let losses=0;
const SKY=[0x223d4c,0x2b3a48,0x2a3550,0x3a2f46];
export default class NightScene extends SceneBase{
 private spare=spareHearts(losses);private model=initial(this.spare);private ink!:Phaser.GameObjects.Graphics;private hud!:Phaser.GameObjects.Text;private sign!:Phaser.GameObjects.Text;private held=new Map<string,string>();private stamp=0;private zone=0;private seenNews=0;private tapped=new Set<string>();
 constructor(events:ArcadeEvents){super('night',events);}
 create(){
  this.view={status:'ready',title:'Ночной маршрут',detail:'Доберись до туалета через четыре зоны. Держи прыжок, чтобы взлететь выше. Каталки перевезут над разрывом, доски проваливаются, матрас подбрасывает к верхней полке с картой-ключом. Медсёстры светят фонарём: прячься за ширмы, за стойки или иди верхом. Контрольные точки и три сердца. Терпение тает всё время.',actions:[]};
  if(this.spare)this.view.detail=`Ночная смена притомилась: +${this.spare} к сердцам. `+this.view.detail;this.setup();
  this.box(210,280,420,560,0x172d3b);this.ink=this.add.graphics();this.hud=this.text(16,16,'',14,'#f8e9bd');this.sign=this.text(210,470,'',13,'#eee0b8',true);this.sign.setWordWrapWidth(390);
  this.input.keyboard?.on('keyup',(e:KeyboardEvent)=>this.held.delete(e.code));this.paint();
 }
 protected key(e:KeyboardEvent){const map:Record<string,string>={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'jump',ArrowUp:'jump',KeyW:'jump',ArrowDown:'hide',KeyS:'hide'};if(map[e.code]){e.preventDefault();this.held.set(e.code,map[e.code]);if(map[e.code]==='jump'||map[e.code]==='hide')this.tapped.add(map[e.code]);}}
 protected pause(){this.held.clear();this.tapped.clear();super.pause();}
 action(id:string){if(!this.running)return;if(id.startsWith('down:')){const [,dir,...source]=id.split(':');if(['left','right','jump','hide'].includes(dir)){this.held.set(source.join(':'),dir);if(dir==='jump'||dir==='hide')this.tapped.add(dir);}}else if(id.startsWith('up:'))this.held.delete(id.slice(3));}
 protected sync(){const s=this.model;this.view={status:'playing',title:s.status==='ending'?'Наконец-то дверь…':`${ZONES[zoneAt(s.x)].name} · до туалета ${Math.ceil(Math.max(0,GOAL-s.x)/20)} м · терпение ${Math.ceil(s.patience)}%`,detail:s.status==='ending'?'Кажется, самое трудное позади.':ZONES[zoneAt(s.x)].hint,actions:s.status==='playing'?[{id:'hide',label:s.hidden?'ВЫЙТИ':'ПРЯТАТЬСЯ',disabled:!s.hidden&&screenNear(s.x)===undefined}]:[]};this.bridge.publish(this.view);}
 private person(x:number,y:number,nurse=false,facing=1){const g=this.ink;g.fillStyle(nurse?0x83afbf:0x3a9b8c);g.fillRoundedRect(x-11,y-30,22,27,5);g.fillStyle(0xe8c4a4);g.fillCircle(x,y-35,10);g.fillStyle(nurse?0x60453d:0xf0e8d5);g.fillEllipse(x,y-42,22,10);if(!nurse){g.fillStyle(0xf0e8d5);g.fillEllipse(x,y-27,16,10);}else{g.fillStyle(0x30453e);g.fillCircle(x+facing*4,y-36,1.6);}g.fillStyle(nurse?0x32485b:0xeaa064);g.fillRoundedRect(x-13,y-5,11,7,3);g.fillRoundedRect(x+2,y-5,11,7,3);}
 private paint(){const s=this.model,g=this.ink,cam=Phaser.Math.Clamp(s.x-120,0,WIDTH-420),zone=zoneAt(s.x);g.clear();
  g.fillStyle(SKY[zone]);g.fillRect(0,70,420,350);g.fillStyle(0x335765);for(let i=0;i<26;i++){const x=i*190-cam*.6;if(x<-90||x>430)continue;g.fillRoundedRect(x,110,80,105,4);g.fillStyle(0xe9d9a0);g.fillCircle(x+56,135,10);g.fillStyle(0x335765);g.fillCircle(x+61,131,10);g.lineStyle(3,0x527681);g.lineBetween(x+40,110,x+40,215);}
  if(zone===3&&!this.reduced){g.fillStyle(0xd9473a,.06+.05*Math.sin(s.time*5));g.fillRect(0,70,420,350);}
  // Checkpoints are water coolers.
  CHECKPOINTS.forEach((c,i)=>{if(i===0)return;const x=c-cam;if(x<-30||x>450)return;g.fillStyle(0xcfe7ef);g.fillRoundedRect(x-9,GROUND-52,18,20,4);g.fillStyle(i<=s.checkpoint?0x6eb394:0xb9c4c9);g.fillRoundedRect(x-11,GROUND-32,22,32,3);});
  for(const sx of SCREENS){const x=sx-cam;if(x<-40||x>460)continue;const near=screenNear(s.x)===sx;g.fillStyle(near?0xf3e8c9:0xd9cfb4);for(const dx of [-22,-7,8])g.fillRect(x+dx,GROUND-60,14,60);g.lineStyle(2,0x8a7d60);g.strokeRect(x-22,GROUND-60,44,60);}
  // Flood and puddles.
  {const x=FLOOD.x-cam;if(x<430&&x+FLOOD.w>-10){g.fillStyle(0x4f93a8,.75);g.fillRect(x,GROUND-6,FLOOD.w,12);if(!this.reduced){g.lineStyle(2,0xcfe7ef,.7);for(let i=0;i<8;i++){const w=x+i*48+Math.sin(s.time*3+i)*8;g.lineBetween(w,GROUND-5,w+14,GROUND-5);}}}}
  for(const p of puddles){g.fillStyle(0x78b7c2,.8);g.fillEllipse(p.x+p.w/2-cam,398,p.w,8);}
  for(const b of solids){if(b.x+b.w<cam||b.x>cam+420)continue;const low=b.y===GROUND;g.fillStyle(low?0x6b807e:b.h<=14?0x9a8c74:0x8a7968);g.fillRoundedRect(b.x-cam,b.y,b.w,Math.min(b.h,30),3);g.fillStyle(0xb6b99d);g.fillRect(b.x-cam,b.y,b.w,4);if(!low&&b.h>14){g.lineStyle(2,0x4f514d);g.lineBetween(b.x-cam+8,b.y+17,b.x-cam+b.w-8,b.y+17);}}
  CRUMBLE.forEach((b,i)=>{const t=s.crumble[i];if(t<0||b.x+b.w<cam||b.x>cam+420)return;const shake=t>0&&!this.reduced?Math.sin(s.time*50)*2:0;g.fillStyle(t>0?0xb9825a:0xa08a6c);g.fillRect(b.x-cam+shake,b.y,b.w,b.h);g.lineStyle(2,0x5c4630);g.lineBetween(b.x-cam+b.w*.35+shake,b.y,b.x-cam+b.w*.5+shake,b.y+b.h);g.lineBetween(b.x-cam+b.w*.7+shake,b.y,b.x-cam+b.w*.6+shake,b.y+b.h);});
  movers(s.time).forEach((b,i)=>{const x=b.x-cam;if(x+b.w<0||x>420)return;if(i===2){g.lineStyle(3,0x8a9aa0);g.lineBetween(x+6,b.y,x+6,GROUND);g.lineBetween(x+b.w-6,b.y,x+b.w-6,GROUND);g.fillStyle(0xc4a24f);g.fillRect(x,b.y,b.w,b.h);}else{g.fillStyle(0xdfe7e4);g.fillRoundedRect(x,b.y,b.w,b.h,4);g.lineStyle(2,0x4f5d63);g.strokeRoundedRect(x,b.y,b.w,b.h,4);g.fillStyle(0x30453e);g.fillCircle(x+14,b.y+18,4);g.fillCircle(x+b.w-14,b.y+18,4);}});
  {const x=SPRING.x-cam;if(x>-60&&x<430){g.fillStyle(0xe59370);g.fillRoundedRect(x,GROUND-10,SPRING.w,12,4);g.lineStyle(2,0xfff3d6);for(let i=1;i<4;i++)g.lineBetween(x+i*12,GROUND-8,x+i*12,GROUND-2);}}
  if(!s.card){const x=CARD.x-cam;if(x>-20&&x<440){g.fillStyle(0xe8c04f);g.fillRoundedRect(x-12,CARD.y-8+(this.reduced?0:Math.sin(s.time*4)*3),24,16,3);g.fillStyle(0x30453e);g.fillRect(x-8,CARD.y-4,16,3);}
   const d=DOOR.x-cam;if(d>-40&&d<440){g.fillStyle(0x5c6f7a);g.fillRect(d,DOOR.y,DOOR.w,DOOR.h);g.fillStyle(0xd9473a);g.fillCircle(d+11,GROUND-70,5);}}
  else{const d=DOOR.x-cam;if(d>-40&&d<440){g.fillStyle(0x5c6f7a,.35);g.fillRect(d,DOOR.y,DOOR.w,DOOR.h);g.fillStyle(0x6eb394);g.fillCircle(d+11,GROUND-70,5);}}
  for(let i=0;i<bonuses.length;i++)if(!s.collected.includes(i)){const b=bonuses[i],x=b.x-cam;if(x<-20||x>440)continue;g.fillStyle(0xf3d27b);g.fillCircle(x,b.y,11);g.fillStyle(0x294552);g.fillCircle(x+5,b.y-3,9);}
  {const cx=cartX(s.time)-cam;if(cx>-40&&cx<460){g.fillStyle(0xa7b4af);g.fillRoundedRect(cx-22,375,44,20,3);g.fillStyle(0xe7b577);g.fillRect(cx-18,365,28,10);g.fillStyle(0x1c3038);g.fillCircle(cx-15,398,5);g.fillCircle(cx+15,398,5);}}
  {const rx=robotX(s.time)-cam;if(rx>-30&&rx<450){g.fillStyle(0x4f5d63);g.fillEllipse(rx,GROUND-7,38,14);g.fillStyle(0xd9473a);g.fillCircle(rx,GROUND-10,3);}}
  NURSES.forEach((_,n)=>{const nurse=nurseAt(n,s.time),x=nurse.x-cam;if(x<-210||x>630)return;
   const reach=nurse.facing*CONE;g.fillStyle(0xfff2b0,s.suspicion>.05?.34:.2);g.fillTriangle(x+nurse.facing*8,GROUND-32,x+reach,CONE_TOP-8,x+reach,GROUND);
   this.person(x,GROUND,true,nurse.facing);g.fillStyle(0x30453e);g.fillRect(x+nurse.facing*8-3,GROUND-34,7,5);
   if(nurse.turning){g.fillStyle(0xd9473a);g.fillCircle(x,GROUND-62,8);g.fillStyle(0xfff3d6);g.fillRect(x-1.5,GROUND-67,3,7);g.fillCircle(x,GROUND-58,1.6);}});
  const door=GOAL-cam;g.fillStyle(0x669b91);g.fillRoundedRect(door-17,308,48,92,3);g.fillStyle(0xd8e9cf);g.fillRect(door-8,319,29,18);g.fillStyle(0x213942);g.fillCircle(door+8,326,3);g.fillRect(door+5,329,6,6);
  const plant=door-70;g.fillStyle(0xb57f5a);g.fillRoundedRect(plant-12,378,25,22,3);g.fillStyle(0x649a68);g.fillEllipse(plant-7,368,17,28);g.fillEllipse(plant+7,361,17,30);
  if(s.status==='ending'||s.status==='done'){g.lineStyle(4,0xf0c373);g.strokeCircle(door+7,349,8);g.fillStyle(0xf0c373);g.fillRect(door-3,348,20,16);if(s.ending>1.2)this.person(door-140+Math.min(1,s.ending-1.2)*65,400,true);}
  if(s.hidden)g.setAlpha(.35);if(s.shield===0||Math.floor(s.time*12)%2===0)this.person(s.x-cam,s.y);g.setAlpha(1);
  // A bubble tells the player what to press at a screen.
  const near=s.status==='playing'&&!s.hidden&&screenNear(s.x)!==undefined;if(near){g.fillStyle(0xfff3d6);g.fillRoundedRect(s.x-cam-9,s.y-72,18,18,4);g.fillStyle(0x294552);g.fillTriangle(s.x-cam-5,s.y-67,s.x-cam+5,s.y-67,s.x-cam,s.y-58);}
  this.hud.setText(`${ZONES[zone].name.toUpperCase()} · ${'♥'.repeat(Math.max(0,s.lives))}${'♡'.repeat(Math.max(0,3-s.lives))}${s.card?' · КАРТА':''}\nТЕРПЕНИЕ ${Math.ceil(s.patience)}% · ДО ДВЕРИ ${Math.ceil(Math.max(0,GOAL-s.x)/20)} М`);
  g.fillStyle(0x425a60);g.fillRect(16,58,388,6);g.fillStyle(s.patience<25?0xe47e65:0xebc977);g.fillRect(16,58,388*s.patience/100,6);
  if(s.suspicion>0){g.fillStyle(0x1c3038);g.fillRect(s.x-cam-20,s.y-70,40,6);g.fillStyle(0xd9473a);g.fillRect(s.x-cam-20,s.y-70,40*s.suspicion,6);}
  this.sign.setText(s.status==='ending'?'ЩЁЛК. Дверь не открывается.':s.hidden?'За ширмой тебя не видно. Двинься, чтобы выйти.':near?'Нажми «Прятаться», пока свет не дошёл':zone===2&&!s.card&&s.x>DOOR.x-120?'Дверь заперта. Карта-ключ на высокой полке в зоне ремонта.':ZONES[zone].hint);
 }
 update(_t:number,delta:number){if(!this.running)return;if(delta>500){this.pause();return;}const values=[...this.held.values()];const before=this.model;
  // A press shorter than one frame still counts for that frame.
  const press=(name:string)=>values.includes(name)||this.tapped.has(name);
  this.model=step(this.model,delta/1000,{move:Number(values.includes('right'))-Number(values.includes('left')),jump:press('jump'),hide:press('hide')});this.tapped.clear();const s=this.model;
  if(s.hits>before.hits&&s.status!=='lost')sound.cue('hit');else if(s.collected.length>before.collected.length)sound.cue('good');else if(before.grounded&&!s.grounded&&s.vy<0)sound.cue('jump');
  if(s.news!==this.seenNews){this.seenNews=s.news;const bad=s.flash.startsWith('«')||s.flash==='ПРОВАЛИЛСЯ!';this.pop(Phaser.Math.Clamp(s.x-Phaser.Math.Clamp(s.x-120,0,WIDTH-420),80,340),Math.max(110,s.y-80),s.flash,bad?'#aa4933':'#286b56',false);if(bad){haptics.cue('error');if(!this.reduced)this.cameras.main.shake(130,.005);}}
  const zone=zoneAt(s.x);if(zone>this.zone){this.zone=zone;this.pop(210,120,ZONES[zone].name.toUpperCase(),'#9b5725');}
  this.paint();
  if(s.status==='lost'){losses++;this.held.clear();this.finish(false,'Не добрался.',`${s.reason} Зона «${ZONES[zoneAt(s.x)].name}». Жетоны возвращают терпение, у ширмы жми «Прятаться», а карта-ключ лежит на полке над матрасом. ${losses%2===1?'В следующий раз смена устанет: будет лишнее сердце.':''}`);return;}
  if(s.status==='done'){losses=0;this.running=false;const stars=nightRating(s),total=finalScore(s),saved=saveBest('night-best',total);this.bridge.publish({status:'story',title:`${'★'.repeat(stars)}${'☆'.repeat(3-stars)} Закрыто на ночь.`,detail:`${total} очков, жетонов ${s.collected.length} из ${bonuses.length}, поймали ${s.caught} раз. ${saved.record?'Новый личный рекорд!':`Рекорд: ${saved.best}.`} До туалета добрался. Осталось решить последнюю проблему.`,actions:[]});return;}
  this.stamp+=delta;if(this.stamp>150){this.stamp=0;this.sync();}}
}
