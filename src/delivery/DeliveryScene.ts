import Phaser from 'phaser';
import SceneBase from '../arcade/SceneBase';
import type {ArcadeEvents} from '../arcade/types';
import {initial,tick,nextLocation,locations,guards,sees,type Direction} from './model';
const SIZE=32,LEFT=34,TOP=83;
const keys:Record<string,Direction>={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};
export default class DeliveryScene extends SceneBase{
 private model=initial();private ink!:Phaser.GameObjects.Graphics;private hud!:Phaser.GameObjects.Text;private note!:Phaser.GameObjects.Text;
 private nextButton!:Phaser.GameObjects.Rectangle;private nextLabel!:Phaser.GameObjects.Text;
 private held=new Map<string,Direction>();private stamp=0;
 constructor(events:ArcadeEvents){super('delivery',events);}
 create(){
  this.view={status:'ready',title:'Операция «Обед»',detail:'Три локации до курьера. Стрелки / WASD или кнопки — шагать, отпусти — ждать. Жёлтые клетки видны персоналу. Прячься за столами и перегородками: красная шкала должна успеть опустеть. Если догнали или шкала заполнилась — новая попытка.',actions:[]};
  this.setup();this.box(210,34,420,68,0x294e49);this.hud=this.text(16,12,'',14,'#fff3d6');this.ink=this.add.graphics();this.note=this.text(210,451,'',12,'#294e49',true);this.note.setWordWrapWidth(390);
  for(const [id,label,x,y] of [['left','←',58,516],['up','↑',119,492],['down','↓',119,539],['right','→',180,516]] as const){
   const b=this.box(x,y,52,38,0xb7d0bb).setInteractive({useHandCursor:true});this.text(x,y,label,19,'#294e49',true);
   b.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(this.running&&this.model.status==='playing')this.held.set(`p${p.id}`,id);});
  }
  this.nextButton=this.box(305,516,155,44,0xe8be78).setInteractive({useHandCursor:true});
  this.nextLabel=this.text(305,516,'ДАЛЬШЕ →',14,'#294e49',true);
  this.nextButton.on('pointerup',()=>this.action('next'));
  this.input.on('pointerup',(p:Phaser.Input.Pointer)=>this.held.delete(`p${p.id}`));
  this.input.on('pointerupoutside',(p:Phaser.Input.Pointer)=>this.held.delete(`p${p.id}`));
  this.input.keyboard?.on('keyup',(e:KeyboardEvent)=>this.held.delete(e.code));
  this.paint();
 }
 protected key(e:KeyboardEvent){if(keys[e.code]){e.preventDefault();this.held.set(e.code,keys[e.code]);}if(e.code==='Enter')this.action('next');}
 protected pause(){this.held.clear();super.pause();}
 action(id:string){
  if(!this.running)return;
  if(id==='next'){this.model=nextLocation(this.model);this.held.clear();}
  if(id in {up:1,down:1,left:1,right:1})this.model=tick(this.model,.025,id as Direction);
  this.paint();this.sync();
 }
 protected sync(){
  const s=this.model,map=locations[s.level];
  this.view={status:'playing',title:s.status==='between'?'Прошёл незаметно!':s.status==='ending'?'Заказ совсем рядом…':`${s.level+1} / 3 · ${map.name} · подозрение ${Math.round(s.suspicion*100)}%`,
   detail:s.status==='between'?'Передохни и нажми «Дальше».':s.status==='ending'?'Сейчас наконец пообедаешь.':map.hint,
   actions:s.status==='between'?[{id:'next',label:'Следующая локация →'}]:s.status==='playing'?(['left','up','down','right'] as Direction[]).map((id,i)=>({id,label:['← Влево','↑ Вверх','↓ Вниз','→ Вправо'][i]})):[]};
  this.bridge.publish(this.view);
 }
 private person(x:number,y:number,color:number,hero=false){
  const g=this.ink;g.fillStyle(0x1c3631,.18);g.fillEllipse(x,y+10,24,8);g.fillStyle(color);g.fillRoundedRect(x-9,y-2,18,17,5);g.fillStyle(0xe8bb94);g.fillCircle(x,y-6,8);
  g.fillStyle(hero?0xe8dfcd:color===0xe9e7dd?0x644b3a:0x394d48);g.fillEllipse(x,y-12,18,8);
  if(hero){g.fillStyle(0xe8dfcd);g.fillEllipse(x,y,12,7);}else{g.fillStyle(0xeac16c);g.fillRect(x+3,y+3,4,5);}
 }
 private paint(){
  const s=this.model,map=locations[s.level],staff=guards(map,s.time),g=this.ink;g.clear();
  this.nextButton.setVisible(s.status==='between');this.nextLabel.setVisible(s.status==='between');
  this.hud.setText(`ОПЕРАЦИЯ «ОБЕД» / ${s.level+1} ИЗ 3\n${map.name.toUpperCase()} · ПОДОЗРЕНИЕ ${Math.round(s.suspicion*100)}%`);
  g.fillStyle(0x67786b);g.fillRect(16,58,388,5);g.fillStyle(0xd16b45);g.fillRect(16,58,388*s.suspicion,5);
  for(let y=0;y<11;y++)for(let x=0;x<11;x++){
   const px=LEFT+x*SIZE,py=TOP+y*SIZE,wall=map.rows[y][x]==='#';
   g.fillStyle(wall?0x54776b:(x+y)%2?0xe9ddbd:0xf1e6cb);g.fillRect(px,py,SIZE-1,SIZE-1);
   if(wall){g.fillStyle(0x739183);g.fillRect(px+3,py+3,SIZE-7,4);}
   else if(staff.some(a=>sees(map,a,{x,y}))){g.fillStyle(0xe5ac42,.45);g.fillRect(px+1,py+1,SIZE-3,SIZE-3);}
  }
  const ex=LEFT+map.exit.x*SIZE,ey=TOP+map.exit.y*SIZE;g.fillStyle(0x64a381);g.fillRoundedRect(ex+2,ey+2,28,28,4);g.lineStyle(3,0xfaf3cf);g.lineBetween(ex+7,ey+16,ex+24,ey+16);g.lineBetween(ex+18,ey+10,ex+24,ey+16);g.lineBetween(ex+18,ey+22,ex+24,ey+16);
  for(const a of staff){const x=LEFT+a.x*SIZE+16,y=TOP+a.y*SIZE+16;this.person(x,y,a.role==='nurse'?0x6b9eae:a.role==='doctor'?0xe9e7dd:0x3b4c60);g.lineStyle(2,0x314d46);g.lineBetween(x,y,x+a.facing.x*18,y+a.facing.y*18);}
  const hx=LEFT+s.hero.x*SIZE+16,hy=TOP+s.hero.y*SIZE+16;this.person(hx,hy,0x398b7b,true);
  if(s.status==='ending'||s.status==='done'){
   this.person(hx-32-Math.max(0,1-s.ending)*55,hy,0x6b9eae);g.fillStyle(0xae784b);g.fillRoundedRect(hx+5,hy+13,19,15,2);
   if(s.ending>1.3){g.fillStyle(0x4c843d);g.fillCircle(hx+12,hy+12,8);g.fillStyle(0xa5d5d4);g.fillRect(hx+27,hy+9,8,16);}
  }
  this.note.setText(s.status==='between'?'ЛОКАЦИЯ ПРОЙДЕНА · ДАЛЬШЕ →':s.status==='lost'?'«А вы куда без сопровождения?»':s.status==='ending'?'«Ваш заказ? У меня для вас другой».':'Жёлтое — зона обзора · Зелёная дверь — выход');
 }
 update(_t:number,delta:number){
  if(!this.running)return;if(delta>500){this.pause();return;}
  this.model=tick(this.model,delta/1000,[...this.held.values()].at(-1)??null);this.paint();
  if(this.model.status==='lost'){this.held.clear();this.finish(false,'Обед отменяется.','Тебя заметили. Попробуй ещё раз: дождись прохода, затем двигайся от укрытия к укрытию.');return;}
  if(this.model.status==='done'){this.running=false;this.bridge.publish({status:'story',title:'Доставка перехвачена.',detail:'Медсестра уже подготовила встречное предложение.',actions:[]});return;}
  this.stamp+=delta;if(this.stamp>120){this.stamp=0;this.sync();}
 }
}
