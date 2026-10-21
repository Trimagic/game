import Phaser from 'phaser';
import SceneBase from '../arcade/SceneBase';
import type {ArcadeEvents} from '../arcade/types';
import {END,fire,furniture,initial,tick} from './model';
export default class RemoteScene extends SceneBase{
 private model=initial();private ink!:Phaser.GameObjects.Graphics;private hud!:Phaser.GameObjects.Text;private caption!:Phaser.GameObjects.Text;private keys=new Set<string>();private touches=new Map<number,string>();private publishAt=0;
 constructor(events:ArcadeEvents){super('remote',events);}
 create(){this.view={status:'ready',title:'Кто взял пульт?',detail:'Удержи пульт до начала передачи. Двигайся между диванами и отвлекай соперников орешками. Орешки летят к ближайшему сопернику. WASD / стрелки — движение, пробел — бросок; на телефоне — кнопки.',actions:[]};this.setup();this.box(210,34,420,68,0x274e49);this.hud=this.text(14,14,'',14,'#fff3d6');this.ink=this.add.graphics();this.caption=this.text(210,456,'',12,'#29473e',true);this.caption.setWordWrapWidth(390);
  const pads=[['left','←',45,529],['up','↑',104,496],['down','↓',104,539],['right','→',164,529],['fire','ОРЕШЕК',308,526]] as const;
  for(const [id,label,x,y] of pads){const b=this.box(x,y,id==='fire'?160:50,38,id==='fire'?0xe9b671:0xb5d5c7).setInteractive({useHandCursor:true});this.text(x,y,label,14,'#29473e',true);b.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(this.running){this.touches.set(p.id,id);if(id==='fire')this.action('fire');}});}
  const release=(p:Phaser.Input.Pointer)=>this.touches.delete(p.id);this.input.on('pointerup',release);this.input.on('pointerupoutside',release);this.input.keyboard?.on('keyup',(e:KeyboardEvent)=>this.keys.delete(e.code));this.paint();}
 protected pause(){this.keys.clear();this.touches.clear();super.pause();}
 protected key(e:KeyboardEvent){if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)){e.preventDefault();this.keys.add(e.code);if(e.code==='Space')this.action('fire');}}
 action(id:string){if(!this.running)return;if(id==='fire'){this.model=fire(this.model);this.paint();this.sync();}}
 protected sync(){const s=this.model;this.view={status:'playing',title:s.status==='playing'?`До передачи ${Math.ceil(END-s.time)} с · отвлечено ${s.hits}`:'Пульт почти твой…',detail:s.status==='playing'?'Обходи диваны. Орешки ненадолго отвлекают ближайшего соперника.':'За спиной кто-то есть.',actions:[{id:'fire',label:'Бросить орешек · пробел',disabled:s.status!=='playing'||s.cooldown>0}]};this.bridge.publish(this.view);}
 private paint(){const s=this.model,g=this.ink;g.clear();this.hud.setText(`ОБЩАЯ ГОСТИНАЯ / ОДИН ПУЛЬТ\nДО ПЕРЕДАЧИ ${Math.ceil(END-s.time)} С · ПОПАДАНИЯ ${s.hits}`);this.caption.setText(s.status==='lost'?'Тебя догнали!':s.status==='playing'?'«Я только новости посмотрю!» — сказали все.':s.ending<1.4?'Кажется, отстоял…':s.ending<2.3?'БДЫЩ!':'Пульт сменил владельца.');
  g.fillStyle(0xd7c7a7);g.fillRoundedRect(20,97,380,337,10);g.lineStyle(1,0xb8ab8e);for(let y=108;y<434;y+=24)g.lineBetween(22,y,398,y);g.fillStyle(0x314c48);g.fillRoundedRect(162,73,96,35,5);g.fillStyle(0x8fb4a6);g.fillRect(170,80,80,20);
  for(const b of furniture){g.fillStyle(0x476b61);g.fillRoundedRect(b.x,b.y,b.w,b.h,9);g.lineStyle(3,0x779788);g.strokeRoundedRect(b.x+7,b.y+7,b.w-14,b.h-14,5);}
  for(const e of s.rivals)this.person(e.x,e.y,[0x8b7562,0x637d95,0x9c776c,0x888c61][e.id],e.stun>0);
  for(const n of s.nuts){g.fillStyle(0xa46c37);g.fillEllipse(n.x,n.y,9,6);g.lineStyle(1,0xf0c68e);g.lineBetween(n.x-2,n.y,n.x+2,n.y);}
  this.person(s.hero.x,s.hero.y,0x398b7b,s.stun>0||s.ending>=1.5);
  const stolen=s.ending>=2.1;const gy=s.hero.y+Math.max(0,65-s.ending*43);if(s.status==='ending'||s.status==='done'){
   const gx=s.hero.x+Math.max(0,s.ending-2.1)*65;this.person(Math.min(370,gx),Math.min(421,gy),0x80526e,false,true);
   if(s.ending<1.7){g.lineStyle(4,0x856342);g.lineBetween(gx+16,gy,gx+28,gy-28);g.lineStyle(6,0x9ca8a3);g.lineBetween(gx+14,gy-29,gx+36,gy-20);}
   if(s.ending>=1.4&&s.ending<2){g.fillStyle(0xffe5a1);g.fillCircle(s.hero.x,s.hero.y,34);g.lineStyle(4,0xe6a050);for(let i=0;i<8;i++){const a=i*Math.PI/4;g.lineBetween(s.hero.x+Math.cos(a)*36,s.hero.y+Math.sin(a)*36,s.hero.x+Math.cos(a)*47,s.hero.y+Math.sin(a)*47);}}
   if(stolen){g.fillStyle(0x233e3b);g.fillRoundedRect(Math.min(370,gx)+15,gy-7,7,18,2);}
  }
  if(!stolen){g.fillStyle(0x233e3b);g.fillRoundedRect(s.hero.x+15,s.hero.y-7,7,18,2);}
 }
 private person(x:number,y:number,color:number,stun:boolean,granny=false){const g=this.ink;g.fillStyle(0x263f38,.15);g.fillEllipse(x,y+13,29,9);g.fillStyle(color);g.fillRoundedRect(x-12,y-4,24,22,7);g.fillStyle(0xebc4a1);g.fillCircle(x,y-9,10);g.fillStyle(granny?0x9e4b52:0xe6e1d1);g.fillEllipse(x,y-17,24,12);g.fillStyle(0x334d46);g.fillCircle(x-4,y-9,1.5);g.fillCircle(x+4,y-9,1.5);if(granny){g.lineStyle(1,0xe9d7af);g.strokeCircle(x-4,y-9,4);g.strokeCircle(x+4,y-9,4);}else{g.fillStyle(0xe6e1d1);g.fillEllipse(x,y-1,15,7);}if(stun){g.fillStyle(0xf7d57b);g.fillCircle(x-15,y-24,3);g.fillCircle(x+13,y-23,3);}}
 update(_time:number,delta:number){if(!this.running)return;if(delta>500){this.pause();return;}const touch=[...this.touches.values()];const has=(id:string,...codes:string[])=>touch.includes(id)||codes.some(c=>this.keys.has(c));const input={x:Number(has('right','KeyD','ArrowRight'))-Number(has('left','KeyA','ArrowLeft')),y:Number(has('down','KeyS','ArrowDown'))-Number(has('up','KeyW','ArrowUp'))};if(has('fire','Space'))this.model=fire(this.model);this.model=tick(this.model,delta/1000,input);this.paint();if(this.model.status==='lost'){this.keys.clear();this.touches.clear();this.finish(false,'Тебя догнали!','Соперники отобрали пульт раньше начала передачи. Попробуй снова: двигайся и отвлекай их орешками.');return;}if(this.model.status==='done'){this.running=false;this.bridge.publish({status:'story',title:'Пульт потерян.',detail:'Передачу выбрал кто-то другой.',actions:[]});return;}this.publishAt+=delta;if(this.publishAt>150){this.publishAt=0;this.sync();}}
}

