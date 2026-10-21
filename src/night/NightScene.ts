import Phaser from 'phaser';
import SceneBase from '../arcade/SceneBase';
import type {ArcadeEvents} from '../arcade/types';
import {initial,step,solids,puddles,bonuses,cartX,GOAL,WIDTH} from './model';
export default class NightScene extends SceneBase{
 private model=initial();private ink!:Phaser.GameObjects.Graphics;private hud!:Phaser.GameObjects.Text;private sign!:Phaser.GameObjects.Text;private held=new Map<string,string>();private stamp=0;
 constructor(events:ArcadeEvents){super('night',events);}
 create(){
  this.view={status:'ready',title:'Ночной маршрут',detail:'Доберись до туалета. ← → / A D — идти, пробел / ↑ / W — прыгать. Держи прыжок дольше, чтобы прыгнуть выше. Перепрыгивай ремонтные участки, тележку и лужи. Лунные жетоны возвращают терпение.',actions:[]};this.setup();
  this.box(210,280,420,560,0x172d3b);this.ink=this.add.graphics();this.hud=this.text(16,16,'',14,'#f8e9bd');this.sign=this.text(210,448,'',12,'#eee0b8',true);
  for(const [id,label,x,w] of [['left','←',60,75],['right','→',150,75],['jump','ПРЫЖОК',305,150]] as const){const b=this.box(x,510,w,55,id==='jump'?0xe9b875:0x88a8a1).setInteractive({useHandCursor:true});this.text(x,510,label,16,'#203c40',true);b.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(this.running)this.held.set(`p${p.id}`,id);});}
  this.input.on('pointerup',(p:Phaser.Input.Pointer)=>this.held.delete(`p${p.id}`));this.input.on('pointerupoutside',(p:Phaser.Input.Pointer)=>this.held.delete(`p${p.id}`));this.input.keyboard?.on('keyup',(e:KeyboardEvent)=>this.held.delete(e.code));this.paint();
 }
 protected key(e:KeyboardEvent){const map:Record<string,string>={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'jump',ArrowUp:'jump',KeyW:'jump'};if(map[e.code]){e.preventDefault();this.held.set(e.code,map[e.code]);}}
 protected pause(){this.held.clear();super.pause();}
 action(id:string){if(!this.running)return;if(id.startsWith('down:')){const [,dir,...source]=id.split(':');if(['left','right','jump'].includes(dir))this.held.set(source.join(':'),dir);}else if(id.startsWith('up:'))this.held.delete(id.slice(3));}
 protected sync(){const s=this.model;this.view={status:'playing',title:s.status==='ending'?'Наконец-то дверь…':`До туалета ${Math.ceil(Math.max(0,GOAL-s.x)/20)} м · терпение ${Math.ceil(s.patience)}%`,detail:s.status==='ending'?'Кажется, самое трудное позади.':'Лунные жетоны +12 терпения · лужи и тележка −18.',actions:[]};this.bridge.publish(this.view);}
 private person(x:number,y:number,nurse=false){const g=this.ink;g.fillStyle(nurse?0x83afbf:0x3a9b8c);g.fillRoundedRect(x-11,y-30,22,27,5);g.fillStyle(0xe8c4a4);g.fillCircle(x,y-35,10);g.fillStyle(nurse?0x60453d:0xf0e8d5);g.fillEllipse(x,y-42,22,10);if(!nurse){g.fillStyle(0xf0e8d5);g.fillEllipse(x,y-27,16,10);}g.fillStyle(nurse?0x32485b:0xeaa064);g.fillRoundedRect(x-13,y-5,11,7,3);g.fillRoundedRect(x+2,y-5,11,7,3);}
 private paint(){const s=this.model,g=this.ink,cam=Phaser.Math.Clamp(s.x-100,0,WIDTH-420);g.clear();
  g.fillStyle(0x223d4c);g.fillRect(0,70,420,350);g.fillStyle(0x335765);for(let i=0;i<16;i++){const x=i*190-cam*.6;g.fillRoundedRect(x,110,80,105,4);g.fillStyle(0xe9d9a0);g.fillCircle(x+56,135,10);g.fillStyle(0x335765);g.fillCircle(x+61,131,10);g.lineStyle(3,0x527681);g.lineBetween(x+40,110,x+40,215);}
  for(const b of solids){if(b.x+b.w<cam||b.x>cam+420)continue;g.fillStyle(b.y===400?0x6b807e:0x8a7968);g.fillRoundedRect(b.x-cam,b.y,b.w,Math.min(b.h,30),3);g.fillStyle(0xb6b99d);g.fillRect(b.x-cam,b.y,b.w,4);if(b.y!==400){g.lineStyle(2,0x4f514d);g.lineBetween(b.x-cam+8,b.y+17,b.x-cam+b.w-8,b.y+17);}}
  for(const p of puddles){g.fillStyle(0x78b7c2,.8);g.fillEllipse(p.x+p.w/2-cam,398,p.w,8);}
  for(let i=0;i<bonuses.length;i++)if(!s.collected.includes(i)){const b=bonuses[i];g.fillStyle(0xf3d27b);g.fillCircle(b.x-cam,b.y,11);g.fillStyle(0x294552);g.fillCircle(b.x-cam+5,b.y-3,9);}
  const cx=cartX(s.time)-cam;g.fillStyle(0xa7b4af);g.fillRoundedRect(cx-22,375,44,20,3);g.fillStyle(0xe7b577);g.fillRect(cx-18,365,28,10);g.fillStyle(0x1c3038);g.fillCircle(cx-15,398,5);g.fillCircle(cx+15,398,5);
  const door=GOAL-cam;g.fillStyle(0x669b91);g.fillRoundedRect(door-17,308,48,92,3);g.fillStyle(0xd8e9cf);g.fillRect(door-8,319,29,18);g.fillStyle(0x213942);g.fillCircle(door+8,326,3);g.fillRect(door+5,329,6,6);
  const plant=door-70;g.fillStyle(0xb57f5a);g.fillRoundedRect(plant-12,378,25,22,3);g.fillStyle(0x649a68);g.fillEllipse(plant-7,368,17,28);g.fillEllipse(plant+7,361,17,30);
  if(s.status==='ending'||s.status==='done'){g.lineStyle(4,0xf0c373);g.strokeCircle(door+7,349,8);g.fillStyle(0xf0c373);g.fillRect(door-3,348,20,16);if(s.ending>1.2)this.person(door-140+Math.min(1,s.ending-1.2)*65,400,true);}
  if(s.shield===0||Math.floor(s.time*12)%2===0)this.person(s.x-cam,s.y);
  this.hud.setText(`НОЧНОЙ МАРШРУТ / ${Math.min(3,1+Math.floor(s.x/870))} ИЗ 3\nТЕРПЕНИЕ ${Math.ceil(s.patience)}% · ДО ДВЕРИ ${Math.ceil(Math.max(0,GOAL-s.x)/20)} М`);g.fillStyle(0x425a60);g.fillRect(16,58,388,6);g.fillStyle(s.patience<25?0xe47e65:0xebc977);g.fillRect(16,58,388*s.patience/100,6);
  this.sign.setText(s.status==='ending'?'ЩЁЛК. Дверь не открывается.':'Перепрыгивай разрывы пола · Держи прыжок выше');
 }
 update(_t:number,delta:number){if(!this.running)return;if(delta>500){this.pause();return;}const values=[...this.held.values()];this.model=step(this.model,delta/1000,{move:Number(values.includes('right'))-Number(values.includes('left')),jump:values.includes('jump')});this.paint();if(this.model.status==='lost'){this.held.clear();this.finish(false,'Не добрался.',this.model.reason+' Попробуй ещё раз: не задерживайся и рассчитывай прыжки.');return;}if(this.model.status==='done'){this.running=false;this.bridge.publish({status:'story',title:'Закрыто на ночь.',detail:'До туалета добрался. Осталось решить последнюю проблему.',actions:[]});return;}this.stamp+=delta;if(this.stamp>150){this.stamp=0;this.sync();}}
}
