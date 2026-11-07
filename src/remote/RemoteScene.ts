import Phaser from 'phaser';
import SceneBase from '../arcade/SceneBase';
import type {ArcadeEvents} from '../arcade/types';
import {haptics} from '../haptics';
import {saveBest} from '../best';
import {awake,END,fire,furniture,initial,MAX_NUTS,PHASES,phaseAt,remoteRating,rugMultiplier,RUG_RADIUS,spareHearts,tick,totalScore,type Point} from './model';
// Survives retries within a visit: the scene is rebuilt, the kindness is not.
let losses=0;
export default class RemoteScene extends SceneBase{
 private spare=spareHearts(losses);private model=initial(Date.now(),this.spare);private ink!:Phaser.GameObjects.Graphics;private hud!:Phaser.GameObjects.Text;private caption!:Phaser.GameObjects.Text;private status!:Phaser.GameObjects.Text;private marks:Phaser.GameObjects.Text[]=[];
 private keys=new Set<string>();private stick:Point={x:0,y:0};private firing=false;private drag:{id:number;x:number;y:number}|null=null;private phase=0;private publishAt=0;
 constructor(events:ArcadeEvents){super('remote',events);}
 create(){this.view={status:'ready',title:'Кто взял пульт?',detail:'Удержи пульт до начала передачи. Левым пальцем веди джойстик, правым держи «Орешек»: орешек летит в ближайшего соседа. Орешков мало, миски появляются в комнате. Стой на светящемся ковре ради очков: чем дольше, тем больше. Сосед после орешка на время невосприимчив. Ходок кидается тапками, от них прикрывает мебель, а тележка оставляет скользкий компот. WASD / стрелки и пробел тоже работают.',actions:[]};if(this.spare)this.view.detail=`Соседи притомились: +${this.spare} к сердцам. `+this.view.detail;this.setup();this.box(210,34,420,68,0x274e49);this.hud=this.text(14,14,'',14,'#fff3d6');this.ink=this.add.graphics();this.caption=this.text(210,456,'',12,'#29473e',true);this.caption.setWordWrapWidth(390);
  this.status=this.text(210,512,'',16,'#29473e',true);
  for(let i=0;i<5;i++)this.marks.push(this.add.text(0,0,'',{fontFamily:'sans-serif',fontSize:'20px',fontStyle:'bold',color:'#c4302b',stroke:'#fff3d6',strokeThickness:4}).setOrigin(.5).setDepth(5).setVisible(false));
  // The room itself also works as a stick for one-handed play.
  this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(this.running&&p.y>=97&&p.y<=434)this.drag={id:p.id,x:p.x,y:p.y};});
  this.input.on('pointermove',(p:Phaser.Input.Pointer)=>{const d=this.drag;if(!d||d.id!==p.id||!p.isDown||!this.running)return;const dx=p.x-d.x,dy=p.y-d.y,len=Math.hypot(dx,dy),k=len>40?40/len:1;this.stick={x:dx*k/40,y:dy*k/40};});
  const release=(p:Phaser.Input.Pointer)=>{if(this.drag?.id===p.id){this.drag=null;this.stick={x:0,y:0};}};this.input.on('pointerup',release);this.input.on('pointerupoutside',release);
  this.input.keyboard?.on('keyup',(e:KeyboardEvent)=>this.keys.delete(e.code));this.paint();}
 protected pause(){this.keys.clear();this.stick={x:0,y:0};this.firing=false;this.drag=null;super.pause();}
 protected key(e:KeyboardEvent){if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)){e.preventDefault();this.keys.add(e.code);if(e.code==='Space')this.action('fire');}}
 action(id:string){if(!this.running)return;
  if(id.startsWith('stick:')){const [x,y]=id.slice(6).split(',').map(Number);this.stick={x,y};return;}
  if(id==='press:fire'){this.firing=true;this.action('fire');return;}
  if(id==='release:fire'){this.firing=false;return;}
  if(id==='fire'){this.model=fire(this.model);this.paint();this.sync();}}
 protected sync(){const s=this.model;this.view={status:'playing',title:s.status==='playing'?`${PHASES[phaseAt(s.time)].name} · до передачи ${Math.ceil(END-s.time)} с · ${s.score} очков`:'Пульт почти твой…',detail:s.status==='playing'?this.caption.text:'За спиной кто-то есть.',actions:[{id:'fire',label:'Бросить орешек · пробел',disabled:s.status!=='playing'||s.cooldown>0||s.ammo===0}]};this.bridge.publish(this.view);}
 private paint(){const s=this.model,g=this.ink;g.clear();const phase=phaseAt(s.time);
  this.hud.setText(`${PHASES[phase].name.toUpperCase()}\nДО ПЕРЕДАЧИ ${Math.ceil(END-s.time)} С · ОЧКИ ${s.score}`);
  this.caption.setText(s.status==='lost'?'Тебя догнали!':s.status==='playing'?(s.ammo===0?'Орешки кончились! Ищи миску.':PHASES[phase].news):s.ending<1.4?'Кажется, отстоял…':s.ending<2.3?'БДЫЩ!':'Пульт сменил владельца.');
  this.status.setText(`${'♥'.repeat(Math.max(0,s.lives))}${'♡'.repeat(Math.max(0,3-s.lives))}   ОРЕШКИ ${s.ammo}/${MAX_NUTS}${s.pillow?' · ПОДУШКА':''}${s.boost>0?' · ТАПОЧКИ':''}${s.rugTime>0?` · КОВЁР ×${rugMultiplier(s.rugTime)}`:''}`).setColor(s.ammo===0?'#c4302b':'#29473e');
  g.fillStyle(phase===3?0xd9b98f:0xd7c7a7);g.fillRoundedRect(20,97,380,337,10);g.lineStyle(1,0xb8ab8e);for(let y=108;y<434;y+=24)g.lineBetween(22,y,398,y);g.fillStyle(0x314c48);g.fillRoundedRect(162,73,96,35,5);g.fillStyle(phase===3&&Math.floor(s.time*4)%2?0xf0d58a:0x8fb4a6);g.fillRect(170,80,80,20);
  if(s.cart&&s.cart.warn>0){g.fillStyle(0xd9473a,.14+.18*Math.abs(Math.sin(s.time*12)));g.fillRect(21,s.cart.y-22,378,44);g.fillStyle(0xd9473a);const ax=s.cart.dir>0?36:384;g.fillTriangle(ax,s.cart.y-10,ax,s.cart.y+10,ax+s.cart.dir*16,s.cart.y);}
  for(const k of s.spills){g.fillStyle(0x9a6b3c,k.life<1.5?.3:.55);g.fillEllipse(k.x,k.y,64,40);g.fillStyle(0xc99a62,.5);g.fillEllipse(k.x-10,k.y-5,22,10);}
  if(s.rug){const on=s.rugTime>0;g.fillStyle(0xf0d58a,(on?.75:.45)+(this.reduced?0:.12*Math.sin(s.time*6)));g.fillEllipse(s.rug.x,s.rug.y,RUG_RADIUS*2,RUG_RADIUS*1.5);g.lineStyle(3,s.rug.life<1.5?0xd9473a:0xc4902f);g.strokeEllipse(s.rug.x,s.rug.y,RUG_RADIUS*2,RUG_RADIUS*1.5);}
  for(const b of furniture){g.fillStyle(0x476b61);g.fillRoundedRect(b.x,b.y,b.w,b.h,9);g.lineStyle(3,0x779788);g.strokeRoundedRect(b.x+7,b.y+7,b.w-14,b.h-14,5);}
  for(const it of s.items){const a=it.life<2&&Math.floor(s.time*8)%2?.35:1;g.setAlpha(a);g.fillStyle(0xfff3d6,.7);g.fillCircle(it.x,it.y,16);
   if(it.kind==='bowl'){g.fillStyle(0x8a6a45);g.fillRoundedRect(it.x-11,it.y-1,22,9,4);g.fillStyle(0xa46c37);for(const dx of [-6,0,6])g.fillEllipse(it.x+dx,it.y-3,8,6);}
   else if(it.kind==='slippers'){g.fillStyle(0x5a8ec9);g.fillRoundedRect(it.x-11,it.y-7,9,15,4);g.fillRoundedRect(it.x+2,it.y-7,9,15,4);}
   else{g.fillStyle(0xf7f1e3);g.fillRoundedRect(it.x-12,it.y-8,24,16,6);g.lineStyle(2,0x9a8a6e);g.strokeRoundedRect(it.x-12,it.y-8,24,16,6);}
   g.setAlpha(1);}
  s.rivals.forEach((e,i)=>{const mark=this.marks[i];const asleep=!awake(s,e);const wind=e.mode==='wind'||e.mode==='aim';if(e.mode==='aim'&&e.dash){g.lineStyle(3,0xd9473a,.55);g.lineBetween(e.x,e.y,e.x+e.dash.x*230,e.y+e.dash.y*230);}if(e.immune&&!e.stun&&awake(s,e)){g.lineStyle(2,0xf7f1e3,.9);g.strokeCircle(e.x,e.y,22);}const dash=e.mode==='dash';
   if(dash&&e.dash){g.lineStyle(5,0xe6a050,.5);g.lineBetween(e.x,e.y,e.x-e.dash.x*34,e.y-e.dash.y*34);}
   this.person(e.x,e.y,asleep?0xa9a397:[0x8b7562,0x637d95,0x9c776c,0x888c61,0x7a5a8c][e.id],e.stun>0);
   mark.setVisible(asleep||wind).setPosition(e.x+(asleep?14:0),e.y-34).setText(asleep?'z':'!').setColor(asleep?'#5a6f8c':'#c4302b');});
  for(const k of s.shots){g.fillStyle(0x5a8ec9);g.fillRoundedRect(k.x-9,k.y-5,18,10,4);g.lineStyle(2,0x2f5478);g.strokeRoundedRect(k.x-9,k.y-5,18,10,4);}
  for(const n of s.nuts){g.fillStyle(0xa46c37);g.fillEllipse(n.x,n.y,9,6);g.lineStyle(1,0xf0c68e);g.lineBetween(n.x-2,n.y,n.x+2,n.y);}
  if(s.cart&&s.cart.warn===0){const c=s.cart;g.fillStyle(0xb9c4c9);g.fillRoundedRect(c.x-26,c.y-16,52,26,4);g.lineStyle(3,0x4f5d63);g.strokeRoundedRect(c.x-26,c.y-16,52,26,4);g.fillStyle(0xf7f1e3);g.fillCircle(c.x-11,c.y-8,7);g.fillCircle(c.x+11,c.y-8,7);g.fillStyle(0x30453e);g.fillCircle(c.x-18,c.y+13,4);g.fillCircle(c.x+18,c.y+13,4);}
  if(s.pillow){g.lineStyle(3,0xf7f1e3,.9);g.strokeCircle(s.hero.x,s.hero.y,24);}
  if(s.boost>0&&!this.reduced){g.fillStyle(0x5a8ec9,.35);g.fillCircle(s.hero.x-s.facing.x*18,s.hero.y-s.facing.y*18+8,7);}
  g.setAlpha(s.safe>0&&Math.floor(s.time*10)%2?.4:1);
  this.person(s.hero.x,s.hero.y,0x398b7b,s.stun>0||s.ending>=1.5);g.setAlpha(1);
  const stolen=s.ending>=2.1;const gy=s.hero.y+Math.max(0,65-s.ending*43);if(s.status==='ending'||s.status==='done'){
   const gx=s.hero.x+Math.max(0,s.ending-2.1)*65;this.person(Math.min(370,gx),Math.min(421,gy),0x80526e,false,true);
   if(s.ending<1.7){g.lineStyle(4,0x856342);g.lineBetween(gx+16,gy,gx+28,gy-28);g.lineStyle(6,0x9ca8a3);g.lineBetween(gx+14,gy-29,gx+36,gy-20);}
   if(s.ending>=1.4&&s.ending<2){g.fillStyle(0xffe5a1);g.fillCircle(s.hero.x,s.hero.y,34);g.lineStyle(4,0xe6a050);for(let i=0;i<8;i++){const a=i*Math.PI/4;g.lineBetween(s.hero.x+Math.cos(a)*36,s.hero.y+Math.sin(a)*36,s.hero.x+Math.cos(a)*47,s.hero.y+Math.sin(a)*47);}}
   if(stolen){g.fillStyle(0x233e3b);g.fillRoundedRect(Math.min(370,gx)+15,gy-7,7,18,2);}
  }
  if(!stolen){g.fillStyle(0x233e3b);g.fillRoundedRect(s.hero.x+15,s.hero.y-7,7,18,2);}
 }
 private person(x:number,y:number,color:number,stun:boolean,granny=false){const g=this.ink;g.fillStyle(0x263f38,.15);g.fillEllipse(x,y+13,29,9);g.fillStyle(color);g.fillRoundedRect(x-12,y-4,24,22,7);g.fillStyle(0xebc4a1);g.fillCircle(x,y-9,10);g.fillStyle(granny?0x9e4b52:0xe6e1d1);g.fillEllipse(x,y-17,24,12);g.fillStyle(0x334d46);g.fillCircle(x-4,y-9,1.5);g.fillCircle(x+4,y-9,1.5);if(granny){g.lineStyle(1,0xe9d7af);g.strokeCircle(x-4,y-9,4);g.strokeCircle(x+4,y-9,4);}else{g.fillStyle(0xe6e1d1);g.fillEllipse(x,y-1,15,7);}if(stun){g.fillStyle(0xf7d57b);g.fillCircle(x-15,y-24,3);g.fillCircle(x+13,y-23,3);}}
 update(_time:number,delta:number){if(!this.running)return;if(delta>500){this.pause();return;}
  const has=(...codes:string[])=>codes.some(c=>this.keys.has(c));
  const keyed={x:Number(has('KeyD','ArrowRight'))-Number(has('KeyA','ArrowLeft')),y:Number(has('KeyS','ArrowDown'))-Number(has('KeyW','ArrowUp'))};
  const input=this.stick.x||this.stick.y?this.stick:keyed;
  if(this.firing||has('Space'))this.model=fire(this.model);
  const old=this.model;this.model=tick(old,delta/1000,input);const s=this.model;
  for(const f of s.flashes){this.pop(Phaser.Math.Clamp(f.x,70,350),Math.max(120,f.y-34),f.text,f.good?'#286b56':'#aa4933');if(!f.good){haptics.cue('error');if(!this.reduced)this.cameras.main.shake(130,.005);}}
  if(s.hits>old.hits)this.pop(Phaser.Math.Clamp(s.hero.x,70,350),Math.max(120,s.hero.y-46),'+10 ОРЕШЕК','#9b5725',false);
  const phase=phaseAt(s.time);if(phase!==this.phase&&s.status==='playing'){this.phase=phase;this.pop(210,122,PHASES[phase].name.toUpperCase(),'#286b56');}
  this.paint();
  if(s.status==='lost'){losses++;this.keys.clear();this.stick={x:0,y:0};this.firing=false;this.finish(false,'Тебя догнали!',`Продержался ${Math.floor(s.time)} из ${END} секунд, этап «${PHASES[phaseAt(s.time)].name}». Ищи миски с орешками, у «!» уходи вбок, тележку заманивай на соседей, от тапка прячься за диван. ${losses>=1&&losses%2===1?'В следующий раз соседи устанут: будет лишнее сердце.':''}`);return;}
  if(s.status==='done'){losses=0;this.running=false;const total=totalScore(s),stars=remoteRating(s),saved=saveBest('remote-best',total);this.bridge.publish({status:'story',title:`${'★'.repeat(stars)}${'☆'.repeat(3-stars)} Пульт потерян.`,detail:`${total} очков, попаданий орешком ${s.hits}, соседей сбито тележкой ${s.cartHits}. ${saved.record?'Новый личный рекорд!':`Рекорд: ${saved.best}.`} Передачу выбрал кто-то другой.`,actions:[]});return;}
  this.publishAt+=delta;if(this.publishAt>150){this.publishAt=0;this.sync();}}
}
