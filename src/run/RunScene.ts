import {sound} from '../audio/sound';
import Phaser from 'phaser';
import SceneBase from '../arcade/SceneBase';
import type {ArcadeEvents} from '../arcade/types';
import {DURATION,HERO_X,obstacleX,pickupX,travel,ZONES,zoneAt} from './model';
import {runInitial,runAction,runRating,runTick,tokenX} from './round';
import {saveBest} from '../best';
const GROUND=390;
export default class RunScene extends SceneBase{
 private zone=0;private model=runInitial(Date.now());private ink!:Phaser.GameObjects.Graphics;private hud!:Phaser.GameObjects.Text;private cue!:Phaser.GameObjects.Text;private coach!:Phaser.GameObjects.Text;private focusLabel!:Phaser.GameObjects.Text;private lastHud=0;
 private crouching=new Set<string>();private pointerIds=new Set<number>();
 constructor(events:ArcadeEvents){super('run',events);}
 create(){
  this.view={status:'ready',title:'У парка свои планы.',detail:'Каждый забег новый: аллея, собачья площадка, дождь и рывок к автобусу. Прыгай через лужи, пакеты и собак, под ветками пригибайся, а под голубями просто беги — прыгать нельзя. Кроссовки дают двойной прыжок, вода возвращает сердце. Пять искр дают замедление. Три сердца, один километр.',actions:[]};this.setup();
  this.box(210,33,420,66,0x274e49);this.hud=this.text(14,12,'',14,'#fff3d6');this.cue=this.text(210,93,'',14,'#29473e',true);
  this.ink=this.add.graphics();this.coach=this.text(210,451,'',13,'#29473e',true);this.coach.setWordWrapWidth(390);
  this.button(210,488,390,32,'',()=>this.action('focus'),0xc2dcd0);this.focusLabel=this.text(210,488,'',12,'#29473e',true);
  const jump=this.box(107,533,185,44,0xefb46b).setInteractive({useHandCursor:true});this.text(107,533,'↑ ПРЫЖОК',14,'#29473e',true);jump.on('pointerdown',()=>this.action('jump'));
  const down=this.box(313,533,185,44,0x98cec2).setInteractive({useHandCursor:true});this.text(313,533,'↓ ПРИГНУТЬСЯ',14,'#29473e',true);
  down.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(this.running){this.pointerIds.add(p.id);this.setDuck('p'+p.id,true);}});
  const release=(p:Phaser.Input.Pointer)=>{if(this.pointerIds.delete(p.id))this.setDuck('p'+p.id,false);};this.input.on('pointerup',release);this.input.on('pointerupoutside',release);
  this.input.keyboard?.on('keyup',(e:KeyboardEvent)=>{if(['ArrowDown','KeyS'].includes(e.code))this.setDuck(e.code,false);});this.paint();
 }
 private setDuck(id:string,down:boolean){if(!this.running)return;down?this.crouching.add(id):this.crouching.delete(id);const was=this.model.runner.duck;this.model=runAction(this.model,this.crouching.size?'down':'up');if(this.model.runner.duck&&!was)sound.fx('whoosh');this.paint();}
 protected pause(){this.crouching.clear();this.pointerIds.clear();this.model=runAction(this.model,'up');super.pause();}
 protected key(e:KeyboardEvent){if(['ArrowUp','KeyW','Space','ArrowDown','KeyS','KeyF'].includes(e.code)){if(e.target instanceof HTMLButtonElement&&e.code==='Space')return;e.preventDefault();if(['ArrowDown','KeyS'].includes(e.code))this.setDuck(e.code,true);else this.action(e.code==='KeyF'?'focus':'jump');}}
 action(id:string){if(!this.running)return;if(id.startsWith('down:')||id.startsWith('up:')){const [kind,...source]=id.split(':');this.setDuck(source.join(':'),kind==='down');return;}if(id==='jump'||id==='focus'){const old=this.model;this.model=runAction(old,id);if(id==='jump'&&this.model!==old)sound.cue('jump');if(id==='focus'&&old!==this.model)this.pop(210,245,'ФОКУС · ВРЕМЯ МЕДЛЕННЕЕ','#286b56');}this.paint();this.sync();}
 protected sync(){const s=this.model,r=s.runner;this.view={status:'playing',title:`${Math.floor(r.time/DURATION*1000)} / 1000 м · ${r.lives} сердца · ${s.score} очков`,detail:`Серия ×${s.combo} · искры ${s.collected.length-s.spent}. Прыжок: ↑ / W / пробел. Пригибание: удерживай ↓ / S. Фокус: F.`,actions:[{id:'focus',label:s.focus>0?`Фокус · ${s.focus.toFixed(1)} с`:`Фокус · ${s.collected.length-s.spent}/5 искр`,disabled:s.focus>0||s.collected.length-s.spent<5}]};this.bridge.publish(this.view);}
 private paint(){const s=this.model,r=s.runner,t=r.time,d=travel(t),g=this.ink;g.clear();
  this.hud.setText(`${'♥'.repeat(r.lives)}${'♡'.repeat(3-r.lives)}     ${Math.floor(t/60*1000)} / 1000 М\nОЧКИ ${s.score}    СЕРИЯ ×${s.combo}    ИСКРЫ ${s.collected.length-s.spent}`);
  const next=r.course.obstacles.find(o=>obstacleX(o,t)+o.width/2>HERO_X-12);this.cue.setText(next?next.kind==='branch'?'↓ НИЖЕ ВЕТКИ · ДЕРЖИ КНОПКУ':next.kind==='pigeons'?'ГОЛУБИ · НЕ ПРЫГАЙ!':next.kind==='dog'?'↑ СОБАКА НЕСЁТСЯ!':next.kind==='pond'?'↑ ШИРОКАЯ ЛУЖА · ПРЫГАЙ ТОЧНО':'↑ ПРЫЖОК · СОБЕРИ ИСКРЫ':'ФИНИШ ПРЯМО ПО КУРСУ!');
  const zone=zoneAt(t);this.coach.setText(r.boots>0?`ДВОЙНОЙ ПРЫЖОК · ЕЩЁ ${Math.ceil(r.boots)} С`:ZONES[zone].coach);
  this.focusLabel.setText(s.focus>0?`ФОКУС · ${s.focus.toFixed(1)} С`:`ФОКУС: ${s.collected.length-s.spent} / 5 ИСКР · F`);
  g.fillStyle(s.focus>0?0xd3e9df:[0xf4ddaf,0xf7cf94,0xb9c6cc,0xf0a878][zone]);g.fillRect(0,118,420,305);g.fillStyle(zone===2?0x9aa8ae:0xf0b264);g.fillCircle(342,165,26);if(zone===2){g.fillStyle(0x8d9ba2);g.fillEllipse(120,150,170,34);g.fillEllipse(300,142,190,38);}
  for(let i=0;i<7;i++){const x=i*90-d*.12%90;g.fillStyle(i%2?0xb6bfa7:0xc9c9ad);g.fillRect(x,218-i%3*18,59,103+i%3*18);g.fillStyle(0xf2e7c7);for(let j=0;j<3;j++)g.fillRect(x+12+j*14,238,7,13);}
  g.fillStyle(0x95b092);g.fillEllipse(120,329,360,105);g.fillEllipse(360,326,320,105);
  for(let i=0;i<5;i++){const x=i*140-d*.36%140;g.fillStyle(0x7e7656);g.fillRect(x+24,250,7,141);g.fillStyle(0x648768);g.fillEllipse(x+28,262,70,100);g.fillStyle(0x7f9d74);g.fillEllipse(x+13,246,35,60);}
  g.fillStyle(0xd4b88c);g.fillRect(0,GROUND,420,33);g.lineStyle(3,0x304941);g.lineBetween(0,GROUND,420,GROUND);
  for(let i=0;i<9;i++){g.lineStyle(2,0xb49669);g.lineBetween(i*65-d%65,408,i*65-d%65+25,408);}
  // The bus stays behind the obstacles so it can never hide one.
  if(zone===3){const x=250+(DURATION-t)*30;g.fillStyle(0xd9b84a);g.fillRoundedRect(x,GROUND-92,170,80,8);g.lineStyle(3,0x304941);g.strokeRoundedRect(x,GROUND-92,170,80,8);g.fillStyle(0xcfe7ef);for(let i=0;i<4;i++)g.fillRect(x+10+i*39,GROUND-82,31,26);g.fillStyle(0x304941);g.fillCircle(x+36,GROUND-10,11);g.fillCircle(x+134,GROUND-10,11);}
  for(const o of r.course.obstacles){const x=obstacleX(o,t);if(x< -90||x>510)continue;const w=o.width;g.setAlpha(r.hits.includes(o.id)?.35:1);
   if(o.kind==='branch'){g.fillStyle(0x62865d);g.fillRoundedRect(x-w/2,GROUND-107,w,43,12);g.lineStyle(10,0x70583b);g.lineBetween(x-w/2,GROUND-42,x+w/2,GROUND-42);g.lineBetween(x+w/2-4,GROUND-102,x+w/2-4,GROUND-42);g.lineStyle(4,0x70583b);g.lineBetween(x,GROUND-42,x-12,GROUND-62);}
   else if(o.kind==='puddle'||o.kind==='pond'){g.fillStyle(0x6bafb9);g.fillEllipse(x,GROUND-3,w,13);g.lineStyle(2,0xd8f0de);g.lineBetween(x-15,GROUND-5,x+12,GROUND-5);}
   else if(o.kind==='dog')this.dog(g,x,t);
   else if(o.kind==='pigeons')this.pigeons(g,x,t);
   else if(o.kind==='barrier'){g.fillStyle(0xe78549);g.fillRect(x-w/2,GROUND-43,w,13);g.lineStyle(4,0x51635a);g.lineBetween(x-15,GROUND-30,x-15,GROUND);g.lineBetween(x+15,GROUND-30,x+15,GROUND);g.lineStyle(4,0xffefca);g.lineBetween(x-12,GROUND-41,x-4,GROUND-32);g.lineBetween(x+6,GROUND-41,x+14,GROUND-32);}
   else if(o.kind==='scooter'){g.lineStyle(5,0x344c47);g.lineBetween(x-23,GROUND-7,x+22,GROUND-7);g.lineBetween(x+18,GROUND-7,x+12,GROUND-30);g.lineBetween(x+4,GROUND-30,x+20,GROUND-30);g.fillStyle(0x263d3b);g.fillCircle(x-20,GROUND-3,6);g.fillCircle(x+20,GROUND-3,6);}
   else{for(const offset of o.kind==='double'?[-25,25]:[0]){g.fillStyle(0xbc8b55);g.fillRoundedRect(x+offset-14,GROUND-o.height,28,o.height,3);g.lineStyle(3,0x785533);g.strokeRoundedRect(x+offset-7,GROUND-o.height-4,14,10,4);g.fillStyle(0x719261);g.fillCircle(x+offset,GROUND-o.height+4,8);}}
  }g.setAlpha(1);
  for(const p of r.course.pickups){if(r.taken.includes(p.id))continue;const x=pickupX(p,t);if(x< -20||x>440)continue;const y=GROUND-46+(this.reduced?0:Math.sin(t*5)*4);g.fillStyle(0xfff3d6,.75);g.fillCircle(x,y,18);if(p.kind==='boots'){g.fillStyle(0xe5944d);g.fillRoundedRect(x-12,y-2,24,9,3);g.fillRoundedRect(x-12,y-10,11,10,3);g.fillStyle(0xfff3d6);g.fillRect(x-11,y+5,22,2);}else{g.fillStyle(0x5aa9c9);g.fillRoundedRect(x-6,y-9,12,20,3);g.fillStyle(0x30453e);g.fillRect(x-3,y-13,6,4);}}
  for(const c of s.tokens){if(s.collected.includes(c.id))continue;const x=tokenX(c.at,t);if(x< -20||x>440)continue;const y=GROUND-c.y;g.fillStyle(0xffe4a0);g.fillCircle(x,y,8);g.lineStyle(2,0xc38a35);g.strokeCircle(x,y,8);g.lineBetween(x-3,y,x+3,y);g.lineBetween(x,y-3,x,y+3);}
  if(zone===2&&!this.reduced){g.lineStyle(2,0x7f97a3,.6);for(let i=0;i<26;i++){const x=(i*47+t*-160)%440,y=118+((i*83+t*520)%300);g.lineBetween(x<0?x+440:x,y,(x<0?x+440:x)-5,y+13);}}
  if(t>57){const x=HERO_X+travel(60)-d;g.lineStyle(4,0x304941);g.lineBetween(x,GROUND,x,GROUND-120);g.fillStyle(0xfff3d7);g.fillRect(x,GROUND-120,60,23);for(let i=0;i<6;i++){g.fillStyle(i%2?0xfff3d7:0x304941);g.fillRect(x+i*10,GROUND-120,10,11);g.fillRect(x+i*10,GROUND-109,10,11);}}
  g.fillStyle(0x304941,.2);g.fillEllipse(HERO_X,GROUND+3,r.duck?48:30,7);
  if(!(r.shield>0&&Math.floor(t*12)%2===0))this.hero(g);
  if(r.boots>0&&r.y>0&&!this.reduced){g.fillStyle(0xe5944d,.5);g.fillCircle(HERO_X-8,GROUND-r.y+6,6);g.fillCircle(HERO_X+10,GROUND-r.y+10,4);}
  if(s.focus>0){g.lineStyle(3,0x4b9b87);g.strokeRect(2,120,416,301);}
  g.fillStyle(0xec9254);g.fillRect(0,423,420*t/DURATION,4);
 }
 private dog(g:Phaser.GameObjects.Graphics,x:number,t:number){const run=this.reduced?0:Math.sin(t*26)*5;g.lineStyle(5,0x7a5233);g.lineBetween(x-13,GROUND-12,x-13-run,GROUND);g.lineBetween(x+12,GROUND-12,x+12+run,GROUND);g.fillStyle(0xa8743f);g.fillRoundedRect(x-18,GROUND-27,36,17,7);g.fillCircle(x-22,GROUND-31,10);g.fillStyle(0x7a5233);g.fillEllipse(x-27,GROUND-37,8,13);g.lineStyle(4,0xa8743f);g.lineBetween(x+17,GROUND-24,x+27,GROUND-34);g.fillStyle(0x30453e);g.fillCircle(x-26,GROUND-32,2);}
 private pigeons(g:Phaser.GameObjects.Graphics,x:number,t:number){for(const [dx,dy] of [[-20,4],[4,-6],[22,6]]){const bx=x+dx,by=GROUND-74+dy,flap=this.reduced?0:Math.sin(t*22+dx)*7;g.fillStyle(0x8a95a0);g.fillEllipse(bx,by,22,12);g.fillCircle(bx-11,by-4,5);g.lineStyle(4,0x6d7883);g.lineBetween(bx,by,bx+6,by-8-flap);g.fillStyle(0xe5944d);g.fillTriangle(bx-16,by-5,bx-16,by-2,bx-20,by-3);}}
 private hero(g:Phaser.GameObjects.Graphics){const r=this.model.runner;const x=HERO_X,y=GROUND-r.y;const low=r.duck&&r.y===0;const swing=this.reduced?0:Math.sin(r.time*18)*11;
  const line=(x1:number,y1:number,x2:number,y2:number,color:number,width:number)=>{g.lineStyle(width+3,0x30453e);g.lineBetween(x+x1,y+y1,x+x2,y+y2);g.lineStyle(width,color);g.lineBetween(x+x1,y+y1,x+x2,y+y2);};
  if(low){line(-10,-12,-25,-2,0x344b49,9);line(5,-14,21,-2,0x344b49,9);g.fillStyle(0xf5ecd3);g.fillRoundedRect(x-21,y-29,40,16,7);g.fillStyle(0xf0bc91);g.fillCircle(x+23,y-25,10);g.fillStyle(0xb66b34);g.fillEllipse(x+23,y-33,22,10);line(15,-20,31,-6,0xf0bc91,6);return;}
  const stride=r.y>0?12:swing;line(-4,-25,-13-stride,-4,0x334d4a,10);line(7,-25,13+stride,-4,0x334d4a,10);g.fillStyle(0xe5944d);g.fillRoundedRect(x-23-stride,y-6,18,7,3);g.fillRoundedRect(x+8+stride,y-6,18,7,3);
  g.fillStyle(0x30453e);g.fillRoundedRect(x-14,y-51,30,29,8);g.fillStyle(0xf4ead2);g.fillRoundedRect(x-12,y-49,26,26,7);line(-8,-44,-18+stride,-29,0xefba91,7);line(11,-44,24-stride,-36,0xefba91,7);
  g.fillStyle(0xefba91);g.fillCircle(x+3,y-61,12);g.fillStyle(0xaf6533);for(let i=0;i<5;i++)g.fillCircle(x-7+i*5,y-71+(i%2)*2,5);g.fillRoundedRect(x-4,y-58,18,9,5);g.fillStyle(0x30453e);g.fillCircle(x+10,y-63,2);
 }
 update(_time:number,delta:number){if(!this.running)return;if(delta>500){this.pause();return;}const old=this.model;this.model=runTick(old,delta/1000);const s=this.model;
  const zone=zoneAt(s.runner.time);if(zone!==this.zone){this.zone=zone;this.pop(210,180,ZONES[zone].name.toUpperCase(),'#286b56');}
  if(s.runner.taken.length>old.runner.taken.length)this.pop(210,190,s.runner.boots>old.runner.boots?'ДВОЙНОЙ ПРЫЖОК!':'ВОДА: ПЛЮС СЕРДЦЕ','#9b5725');
  if(s.runner.lives<old.runner.lives){this.pop(210,200,'ОЙ! МИНУС СЕРДЦЕ','#aa4933',s.runner.status==='playing');if(!this.reduced)this.cameras.main.shake(110,.004);}
  else if(s.collected.length>old.collected.length)sound.fx('coin');
  if(old.runner.y>0&&s.runner.y===0)sound.fx('land');
  if(s.runner.lives===old.runner.lives&&s.combo>old.combo)this.pop(210,210,`ЧИСТО! СЕРИЯ ×${s.combo}`,'#286b56');this.paint();
  if(s.runner.status!=='playing'){const won=s.runner.status==='won';if(won){const stars=runRating(s),saved=saveBest('run-best',s.score);this.finish(true,`${'★'.repeat(stars)}${'☆'.repeat(3-stars)} Километр позади! ${s.score} очков`,`Искр ${s.collected.length} из ${s.tokens.length}, столкновений ${s.runner.hits.length}, лучшая серия ×${s.best}. ${saved.record?'Новый личный рекорд!':`Рекорд: ${saved.best}.`} Успел на автобус.`);}else this.finish(false,'Сбавим обороты?',`${Math.floor(s.runner.time/60*1000)} метров · ${s.score} очков · лучшая серия ×${s.best}. Зона: ${ZONES[zoneAt(s.runner.time)].name}. ${s.runner.message}`);return;}
  if(s.runner.time-this.lastHud>.12){this.lastHud=s.runner.time;this.sync();}
 }
}


