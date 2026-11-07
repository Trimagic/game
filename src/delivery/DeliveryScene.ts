import Phaser from 'phaser';
import SceneBase from '../arcade/SceneBase';
import type {ArcadeEvents} from '../arcade/types';
import {haptics} from '../haptics';
import {saveBest} from '../best';
import {deliveryRating,finalScore,guards,hidden,initial,locations,makeNoise,nextLocation,sees,spareHearts,tick,tileAt,TOTAL_COINS,type Direction} from './model';
// Survives retries within a visit: the scene is rebuilt, the kindness is not.
let losses=0;
const SIZE=32,LEFT=34,TOP=83;
const keys:Record<string,Direction>={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};
export default class DeliveryScene extends SceneBase{
 private spare=spareHearts(losses);private model=initial(this.spare);private stick:Direction|null=null;private pending:Direction|null=null;private pendingAge=0;private drag:{id:number;x:number;y:number}|null=null;private ink!:Phaser.GameObjects.Graphics;private hud!:Phaser.GameObjects.Text;private note!:Phaser.GameObjects.Text;
 private status!:Phaser.GameObjects.Text;private marks:Phaser.GameObjects.Text[]=[];
 private held=new Map<string,Direction>();private stamp=0;
 constructor(events:ArcadeEvents){super('delivery',events);}
 create(){
  this.view={status:'ready',title:'Операция «Обед»',detail:'Три комнаты до курьера. Нажимай или держи стрелки, отпусти — ждать. Жёлтые клетки видны персоналу. В кадке с фикусом тебя не видно, кнопка «Шум» на время всех останавливает, на мокром полу скользко. Врач видит дальше, охранник оглядывается, в вестибюле камера. Собирай приправы в опасных местах. Три сердца: поймали — назад к двери этой комнаты.',actions:[]};
  if(this.spare)this.view.detail=`Персонал притомился: +${this.spare} к сердцам. `+this.view.detail;this.setup();this.box(210,34,420,68,0x294e49);this.hud=this.text(16,12,'',14,'#fff3d6');this.ink=this.add.graphics();this.note=this.text(210,451,'',12,'#294e49',true);this.note.setWordWrapWidth(390);this.status=this.text(210,500,'',16,'#294e49',true);for(let i=0;i<4;i++)this.marks.push(this.add.text(0,0,'!',{fontFamily:'sans-serif',fontSize:'20px',fontStyle:'bold',color:'#c4302b',stroke:'#fff3d6',strokeThickness:4}).setOrigin(.5).setDepth(5).setVisible(false));
  // The floor itself also works as a stick for one-handed play.
  this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(this.running&&p.y>=TOP&&p.y<=TOP+SIZE*11)this.drag={id:p.id,x:p.x,y:p.y};});
  this.input.on('pointermove',(p:Phaser.Input.Pointer)=>{const d=this.drag;if(!d||d.id!==p.id||!p.isDown||!this.running)return;this.stick=this.heading((p.x-d.x)/30,(p.y-d.y)/30);});
  const release=(p:Phaser.Input.Pointer)=>{if(this.drag?.id===p.id){this.drag=null;this.stick=null;}};this.input.on('pointerup',release);this.input.on('pointerupoutside',release);
  this.input.keyboard?.on('keyup',(e:KeyboardEvent)=>this.held.delete(e.code));
  this.paint();
 }
 /** Moves at once if it can, otherwise remembers the press briefly so a quick tap is never lost. */
 private press(dir:Direction){const before=this.model.hero;this.model=tick(this.model,.001,dir);this.react();if(this.model.hero===before){this.pending=dir;this.pendingAge=0;}else this.pending=null;this.paint();}
 private heading(x:number,y:number):Direction|null{if(Math.hypot(x,y)<.3)return null;return Math.abs(x)>Math.abs(y)?x>0?'right':'left':y>0?'down':'up';}
 protected key(e:KeyboardEvent){if(keys[e.code]){e.preventDefault();this.held.set(e.code,keys[e.code]);}if(e.code==='Enter')this.action('next');if(e.code==='Space'&&!(e.target instanceof HTMLButtonElement)){e.preventDefault();this.action('noise');}}
 protected pause(){this.held.clear();this.stick=null;this.drag=null;this.pending=null;super.pause();}
 action(id:string){
  if(!this.running)return;
  if(id.startsWith('stick:')){const [x,y]=id.slice(6).split(',').map(Number);const dir=this.heading(x,y);if(dir&&dir!==this.stick)this.press(dir);this.stick=dir;return;}
  if(id==='release:fire')return;
  if(id==='press:fire')id=this.model.status==='between'?'next':'noise';
  if(id==='next'){this.model=nextLocation(this.model);this.held.clear();}
  if(id==='noise'){const old=this.model;this.model=makeNoise(old);if(this.model!==old)this.react();}
  this.paint();this.sync();
 }
 protected sync(){
  const s=this.model,map=locations[s.level];
  this.view={status:'playing',title:s.status==='between'?'Прошёл незаметно!':s.status==='ending'?'Заказ совсем рядом…':`${s.level+1} / 3 · ${map.name} · подозрение ${Math.round(s.suspicion*100)}%`,
   detail:s.status==='between'?'Передохни и нажми «Дальше».':s.status==='ending'?'Сейчас наконец пообедаешь.':map.hint,
   actions:s.status==='between'?[{id:'next',label:'ДАЛЬШЕ →'}]:s.status==='playing'?[{id:'noise',label:s.noise>0?`ТИХО ${Math.ceil(s.noise)} С`:`ШУМ ×${s.charges}`,disabled:s.charges===0||s.noise>0}]:[]};
  this.bridge.publish(this.view);
 }
 private person(x:number,y:number,color:number,hero=false){
  const g=this.ink;g.fillStyle(0x1c3631,.18);g.fillEllipse(x,y+10,24,8);g.fillStyle(color);g.fillRoundedRect(x-9,y-2,18,17,5);g.fillStyle(0xe8bb94);g.fillCircle(x,y-6,8);
  g.fillStyle(hero?0xe8dfcd:color===0xe9e7dd?0x644b3a:0x394d48);g.fillEllipse(x,y-12,18,8);
  if(hero){g.fillStyle(0xe8dfcd);g.fillEllipse(x,y,12,7);}else{g.fillStyle(0xeac16c);g.fillRect(x+3,y+3,4,5);}
 }
 private react(){for(const f of this.model.flashes){const x=LEFT+f.cell.x*SIZE+16,y=TOP+f.cell.y*SIZE;this.pop(Phaser.Math.Clamp(x,90,330),Math.max(100,y-8),f.text,f.good?'#286b56':'#aa4933',f.good||f.text.startsWith('«'));if(f.text.startsWith('«')){haptics.cue('error');if(!this.reduced)this.cameras.main.shake(130,.005);}}this.model={...this.model,flashes:[]};}
 private paint(){
  const s=this.model,map=locations[s.level],staff=guards(map,s.staffTime),g=this.ink;g.clear();const quiet=s.noise>0;
    this.hud.setText(`ОПЕРАЦИЯ «ОБЕД» / ${s.level+1} ИЗ 3 · ОЧКИ ${s.score}\n${map.name.toUpperCase()} · ПОДОЗРЕНИЕ ${Math.round(s.suspicion*100)}%`);
  const taken=s.found.filter(id=>{const [lv,at]=id.split(':');const [x,y]=at.split(',').map(Number);return tileAt(locations[Number(lv)],{x,y})==='o';}).length;
  this.status.setText(`${'♥'.repeat(Math.max(0,s.lives))}${'♡'.repeat(Math.max(0,3-s.lives))}   ПРИПРАВЫ ${taken}/${TOTAL_COINS}   ШУМ ${s.charges}`);
  g.fillStyle(0x67786b);g.fillRect(16,58,388,5);g.fillStyle(s.suspicion>=.6?0xc4302b:0xd16b45);g.fillRect(16,58,388*s.suspicion,5);
  for(let y=0;y<11;y++)for(let x=0;x<11;x++){
   const px=LEFT+x*SIZE,py=TOP+y*SIZE,wall=map.rows[y][x]==='#';
   g.fillStyle(wall?0x54776b:(x+y)%2?0xe9ddbd:0xf1e6cb);g.fillRect(px,py,SIZE-1,SIZE-1);
   if(wall){g.fillStyle(0x739183);g.fillRect(px+3,py+3,SIZE-7,4);}
   else{const mark=tileAt(map,{x,y});if(mark==='w'){g.fillStyle(0x8fc7dd,.7);g.fillRect(px+1,py+1,SIZE-3,SIZE-3);g.lineStyle(2,0xfaf7e8);g.lineBetween(px+7,py+10,px+16,py+10);g.lineBetween(px+13,py+20,px+24,py+20);}if(!quiet&&staff.some(a=>sees(map,a,{x,y}))){g.fillStyle(0xe5ac42,.45);g.fillRect(px+1,py+1,SIZE-3,SIZE-3);}if(mark==='h'){g.fillStyle(0x8a5c3a);g.fillRoundedRect(px+9,py+18,14,10,2);g.fillStyle(0x5c8f5a);g.fillCircle(px+16,py+12,10);g.fillStyle(0x76a970);g.fillCircle(px+11,py+9,5);}const id=s.level+':'+x+','+y;if(mark==='o'&&!s.found.includes(id)){g.fillStyle(0xfff3d6);g.fillRoundedRect(px+10,py+8,12,17,3);g.lineStyle(2,0x8a5c3a);g.strokeRoundedRect(px+10,py+8,12,17,3);g.fillStyle(0x8a5c3a);g.fillRect(px+12,py+5,8,4);}if(mark==='n'&&!s.found.includes(id)){g.fillStyle(0xe8be78);g.fillCircle(px+16,py+16,10);g.lineStyle(2,0x8a5c3a);g.strokeCircle(px+16,py+16,10);g.lineBetween(px+12,py+16,px+20,py+16);g.lineBetween(px+16,py+12,px+16,py+20);}}
  }
  const ex=LEFT+map.exit.x*SIZE,ey=TOP+map.exit.y*SIZE;g.fillStyle(0x64a381);g.fillRoundedRect(ex+2,ey+2,28,28,4);g.lineStyle(3,0xfaf3cf);g.lineBetween(ex+7,ey+16,ex+24,ey+16);g.lineBetween(ex+18,ey+10,ex+24,ey+16);g.lineBetween(ex+18,ey+22,ex+24,ey+16);
  staff.forEach((a,i)=>{const x=LEFT+a.x*SIZE+16,y=TOP+a.y*SIZE+16;const mark=this.marks[i];mark.setVisible(!!a.warn&&!quiet&&s.status==='playing').setPosition(x,y-26);
   if(a.role==='camera'){g.fillStyle(0x30453e);g.fillRoundedRect(x-11,y-7,22,14,3);g.fillStyle(quiet?0x9aa8ae:0xd9473a);g.fillCircle(x,y+a.facing.y*5,4);return;}
   this.person(x,y,a.role==='nurse'?0x6b9eae:a.role==='doctor'?0xe9e7dd:0x3b4c60);g.lineStyle(2,0x314d46);g.lineBetween(x,y,x+a.facing.x*18,y+a.facing.y*18);if(quiet){g.fillStyle(0xf7d57b);g.fillCircle(x-11,y-18,3);g.fillCircle(x+10,y-17,3);}});
  const hx=LEFT+s.hero.x*SIZE+16,hy=TOP+s.hero.y*SIZE+16;g.setAlpha(hidden(map,s.hero)?.45:1);this.person(hx,hy,0x398b7b,true);g.setAlpha(1);
  if(s.status==='ending'||s.status==='done'){
   this.person(hx-32-Math.max(0,1-s.ending)*55,hy,0x6b9eae);g.fillStyle(0xae784b);g.fillRoundedRect(hx+5,hy+13,19,15,2);
   if(s.ending>1.3){g.fillStyle(0x4c843d);g.fillCircle(hx+12,hy+12,8);g.fillStyle(0xa5d5d4);g.fillRect(hx+27,hy+9,8,16);}
  }
  this.note.setText(s.status==='between'?'ЛОКАЦИЯ ПРОЙДЕНА · ДАЛЬШЕ →':s.status==='lost'?'«А вы куда без сопровождения?»':s.status==='ending'?'«Ваш заказ? У меня для вас другой».':quiet?`ГРОХОТ! Все замерли ещё на ${Math.ceil(s.noise)} с`:s.suspicion>=.6?'ТРЕВОГА! Персонал ускорился, прячься!':hidden(map,s.hero)?'В фикусе тебя не видно':map.hint);
 }
 update(_t:number,delta:number){
  if(!this.running)return;if(delta>500){this.pause();return;}
  const before=this.model.hero;this.pendingAge+=delta;if(this.pendingAge>220)this.pending=null;
  this.model=tick(this.model,delta/1000,this.stick??[...this.held.values()].at(-1)??this.pending);if(this.model.hero!==before)this.pending=null;this.react();this.paint();
  if(this.model.status==='lost'){losses++;this.held.clear();this.stick=null;this.finish(false,'Обед отменяется.',`Сердца кончились в комнате «${locations[this.model.level].name}». Дождись прохода, прячься в фикусах и береги шум для опасного участка. ${losses%2===1?'В следующий раз персонал устанет: будет лишнее сердце.':''}`);return;}
  if(this.model.status==='done'){losses=0;this.running=false;const stars=deliveryRating(this.model),total=finalScore(this.model),saved=saveBest('delivery-best',total);this.bridge.publish({status:'story',title:`${'★'.repeat(stars)}${'☆'.repeat(3-stars)} Доставка перехвачена.`,detail:`${total} очков. ${saved.record?'Новый личный рекорд!':`Рекорд: ${saved.best}.`} Медсестра уже подготовила встречное предложение.`,actions:[]});return;}
  this.stamp+=delta;if(this.stamp>120){this.stamp=0;this.sync();}
 }
}
