import Phaser from 'phaser';
import SceneBase from '../arcade/SceneBase';
import type {ArcadeEvents} from '../arcade/types';
import {PREP,COOK_MS,nextTask,phoneActive,validCut,type Station,type CookAction} from './model';
import {precisionInitial,preciseAction,needle,inGreen} from './precision';
export default class CookScene extends SceneBase{
 private model=precisionInitial();private drawn='';private lastHud=0;
 private clock?:Phaser.GameObjects.Text;private indicators:Phaser.GameObjects.Rectangle[]=[];private stationLabels:Phaser.GameObjects.Text[]=[];
 private steam:Phaser.GameObjects.Arc[]=[];private foodSprites:Phaser.GameObjects.Image[]=[];
 private heat:Phaser.GameObjects.Rectangle[]=[];private phone?:Phaser.GameObjects.Rectangle;private phoneText?:Phaser.GameObjects.Text;
 private stroke:{x:number;y:number;id:number}|null=null;private trail?:Phaser.GameObjects.Graphics;
 constructor(events:ArcadeEvents){super('kitchen',events);}
 preload(){this.load.image('food','/art/chapter-04-food.png');this.load.on('loaderror',this.bridge.error);}
 create(){
  if(!this.textures.exists('food'))return;for(let i=0;i<6;i++)this.textures.get('food').add(i,0,i%3*512,Math.floor(i/3)*512,512,512);
  this.view={title:'Сегодня ты — шеф.',detail:'Нарежь продукты, поймай зелёную зону на двух конфорках и собери тарелку. Три пропуска — повтор. За точность растёт оценка ужина.',status:'ready',actions:[]};this.setup();this.draw();
  this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(this.running&&this.model.cook.stage==='prep'&&p.x>=20&&p.x<=400&&p.y>=130&&p.y<=430){this.stroke={x:(p.x-20)/380,y:(p.y-130)/300,id:p.id};this.trail=this.add.graphics().setDepth(40);}});
  this.input.on('pointermove',(p:Phaser.Input.Pointer)=>{if(this.running&&this.stroke?.id===p.id&&p.isDown){this.trail?.clear().lineStyle(3,0xfff5d4).lineBetween(20+this.stroke.x*380,130+this.stroke.y*300,p.x,p.y);}});
  this.input.on('pointerup',(p:Phaser.Input.Pointer)=>{if(this.running&&this.stroke?.id===p.id){const line=this.model.cook.cuts%2===0?.44:.56;if(validCut(this.stroke,{x:(p.x-20)/380,y:(p.y-130)/300},line))this.action('cut');else{this.model.feedback='Проведи через всю доску вдоль пунктирной линии.';this.sync();}}this.stroke=null;this.trail?.destroy();});
  this.input.on('pointerupoutside',()=>{this.stroke=null;this.trail?.destroy();});
  this.input.on('drag',(_p:Phaser.Input.Pointer,obj:Phaser.GameObjects.Image,x:number,y:number)=>{if(this.running)obj.setPosition(x,y);});
  this.input.on('dragend',(_p:Phaser.Input.Pointer,obj:Phaser.GameObjects.Image)=>{const id=obj.getData('part') as number;const target=this.platePosition(id);if(this.running&&Phaser.Math.Distance.Between(obj.x,obj.y,target.x,target.y)<63)this.action(`plate:${id}`);else{this.model.feedback='Перенеси часть блюда в подсвеченную область с её названием.';this.draw();this.sync();}});
 }
 protected pause(){this.stroke=null;this.trail?.destroy();super.pause();}
 protected key(e:KeyboardEvent){if(['Space','Digit1','Digit2','KeyM'].includes(e.code))e.preventDefault();if(e.code==='Space'&&this.model.cook.stage==='prep')this.action('cut');if(e.code==='Digit1')this.action('act:pan');if(e.code==='Digit2')this.action('act:pot');if(e.code==='KeyM')this.action('dismiss');}
 action(id:string){
  if(!this.running)return;const [type,value]=id.split(':');let a:CookAction|undefined;
  if(type==='cut'||type==='start'||type==='dismiss'||type==='serve')a={type};
  if(type==='act'&&(value==='pan'||value==='pot'))a={type:'act',station:value};
  if(type==='plate')a={type:'plate',part:Number(value)};
  if(!a)return;const old=this.model;this.model=preciseAction(this.model,a);this.draw();
  if(type==='act'&&this.model.quality>old.quality&&!this.reduced){const food=this.foodSprites[value==='pan'?0:1];if(food)this.tweens.add({targets:food,angle:value==='pan'?16:8,y:food.y-9,duration:180,yoyo:true});}
  if(this.model.quality>old.quality)this.pop(210,170,`+${this.model.quality-old.quality} ${type==='act'?'ВКУСНО!':'✓'}`);
  if(this.model.cook.stage==='won'){this.finish(true,`${this.model.quality>=160?'★★★':this.model.quality>=110?'★★':'★'} Ужин готов!`,`${this.model.quality} очков мастерства. Лучшая серия: ${this.model.best}. Курица, гарнир и овощи на тарелке. Маме можно перезвонить.`);}else this.sync();
 }
 protected sync(){const s=this.model.cook;const call=phoneActive(s);const actions=[];
  if(s.stage==='prep')actions.push({id:'cut',label:'Сделать разрез · пробел'});
  if(s.stage==='ready')actions.push({id:'start',label:'Включить плиту →'});
  if(s.stage==='stove'){for(const station of ['pan','pot'] as Station[]){const task=nextTask(s,station);actions.push({id:`act:${station}`,label:`${station==='pan'?'1':'2'}. ${task?.label??'Готово ✓'}${task&&s.elapsed>=task.at&&inGreen(needle(s.elapsed,station))?' · ЗЕЛЁНАЯ ЗОНА':''}`,disabled:call||!task||s.elapsed<task.at||s.elapsed>task.until});}if(call)actions.push({id:'dismiss',label:'Мам, перезвоню · M'});}
  if(s.stage==='plate'){['Курица','Рис','Овощи'].forEach((name,i)=>actions.push({id:`plate:${i}`,label:`На тарелку: ${name}`,disabled:s.plated.includes(i)}));actions.push({id:'serve',label:'Подать ужин →',disabled:s.plated.length!==3});}
  this.view={status:'playing',title:`${s.stage==='prep'?'Нарезка':s.stage==='ready'?'Всё подготовлено':s.stage==='stove'?'Две конфорки': 'Подача'} · ${this.model.quality} очков${s.stage==='stove'?` · ${Math.ceil((COOK_MS-s.elapsed)/1000)} с`:''}`,detail:this.model.feedback,actions};this.bridge.publish(this.view);
 }
 private platePosition(id:number){return [{x:145,y:264},{x:275,y:264},{x:210,y:365}][id]??{x:210,y:300};}
 private draw(){
  if(!this.root)return;this.clear();this.indicators=[];this.stationLabels=[];this.heat=[];this.steam=[];this.foodSprites=[];this.clock=undefined;this.phone=undefined;this.phoneText=undefined;
  const s=this.model.cook;this.drawn=s.stage;
  this.box(210,30,420,60,0x274e49);this.text(15,13,'КУХНЯ / РЕЦЕПТ БЫЛ ОПТИМИСТОМ',12,'#fff5da');this.text(15,36,`МАСТЕРСТВО ${this.model.quality} · СЕРИЯ ${this.model.combo}`,11,'#f5ca77');
  ['НАРЕЗКА','ПЛИТА','ПОДАЧА'].forEach((name,i)=>{const active=i===0?s.stage==='prep':i===1?['ready','stove'].includes(s.stage):s.stage==='plate';this.box(70+i*140,82,136,35,active?0xf1bb64:0xe5decc);this.text(70+i*140,82,`${i+1}. ${name}`,12,'#293a34',true);});
  if(s.stage==='prep'){
   const index=Math.min(2,Math.floor(s.cuts/2));this.text(210,116,`${PREP[index].name} · разрез ${s.cuts%2+1} / 2`,17,'#293a34',true);this.box(210,280,380,300,index===2?0xd5b6a0:0xd7bc80);
   for(let i=0;i<9;i++)this.box(210,151+i*32,360,1,0xc3a16c,0xc3a16c);
   this.image(s.cuts%2?175:210,280,'food',[1,2,0][index],220,200);if(s.cuts%2)this.image(270,300,'food',[1,2,0][index],90,120);
   const x=20+(s.cuts%2===0?.44:.56)*380;for(let y=146;y<419;y+=18)this.box(x,y,3,10,0xfff6df,0xfff6df);
   this.text(x,151,'↓',25,'#fff9ec',true);this.text(210,450,index===2?'ОТДЕЛЬНАЯ ДОСКА ДЛЯ КУРИЦЫ':'ПРОВЕДИ ПО ЛИНИИ СВЕРХУ ВНИЗ',11,'#6a5136',true);this.text(210,478,`${'●'.repeat(s.cuts)}${'○'.repeat(6-s.cuts)}`,22,'#367c62',true);this.button(210,526,370,40,'СДЕЛАТЬ РАЗРЕЗ · ПРОБЕЛ',()=>this.action('cut'));
  }else if(s.stage==='ready'){
   this.text(210,160,'ВСЁ ОДНОВРЕМЕННО.',24,'#293a34',true);this.image(125,280,'food',0,150,150);this.image(295,280,'food',4,150,150);this.text(210,400,'Зелёная зона — действуй.\nЦентр зоны — идеально!\nСледи за обеими конфорками.',17,'#293a34',true);this.button(210,510,370,48,'ВКЛЮЧИТЬ ПЛИТУ →',()=>this.action('start'));
  }else if(s.stage==='stove'){
   this.clock=this.text(210,120,'',18,'#293a34',true);
   (['pan','pot'] as Station[]).forEach((station,i)=>{const x=110+i*200;this.box(x,298,190,286,0xe4dbc5);this.text(x,175,i===0?'КУРИЦА':'РИС + БРОККОЛИ',13,'#293a34',true);const ring=this.add.circle(x,259,60,0x34423c).setStrokeStyle(5,0xe8a34f);this.root.add(ring);this.foodSprites.push(this.image(x,249,'food',i===0?(s.results['pan-first']?3:0):4,102,100));for(let n=0;n<3;n++){const puff=this.add.circle(x-22+n*22,224,5+n,0xfff9e9,.35);this.root.add(puff);this.steam.push(puff);}if(i===1)this.image(x+29,268,'food',2,48,48);
    this.stationLabels.push(this.text(x,335,'',12,'#293a34',true).setWordWrapWidth(175));this.box(x,374,160,15,0xd1bfa0);this.heat.push(this.box(x,374,83,15,0xb4dbb0,0xb4dbb0));this.box(x,374,26,15,0x4c9e79,0x4c9e79);this.indicators.push(this.box(x-80,374,4,25,0x27352f));this.button(x,418,170,35,i===0?'1 · СКОВОРОДА':'2 · КАСТРЮЛЯ',()=>this.action(`act:${station}`),0xeeb66e);});
   this.phone=this.button(210,487,390,58,'',()=>this.action('dismiss'),0xd3ddd0);this.phoneText=this.text(210,487,'',12,'#293a34',true);this.text(210,539,'ПОЙМАЙ ЗЕЛЁНУЮ ЗОНУ · ЦЕНТР ДАЁТ +30',10,'#715f45',true);this.refreshStove();
  }else if(s.stage==='plate'){
   this.text(210,124,'РАЗЛОЖИ УЖИН ПО МЕСТАМ',16,'#293a34',true);const plate=this.add.circle(210,300,153,0xfffcf0).setStrokeStyle(10,0xc9d7c9);this.root.add(plate);
   ['Курица','Рис','Овощи'].forEach((name,i)=>{const target=this.platePosition(i);const zone=this.add.circle(target.x,target.y,53,0xe4e8d6).setStrokeStyle(2,0x99ad92);this.root.add(zone);if(s.plated.includes(i))this.image(target.x,target.y,'food',[3,4,5][i],105,100);else{this.text(target.x,target.y,name,12,'#6f8065',true);const image=this.image(80+i*130,477,'food',[3,4,5][i],90,70).setInteractive({useHandCursor:true});image.setData('part',i);this.input.setDraggable(image);}});this.button(210,536,390,34,s.plated.length===3?'ПОДАТЬ УЖИН →':'ПЕРЕТАЩИ ЕДУ В ОБЛАСТИ НА ТАРЕЛКЕ',()=>this.action('serve'),s.plated.length===3?0xadd7b4:0xe3cba2);
  }
 }
 private refreshStove(){const s=this.model.cook;this.clock?.setText(`${Math.ceil((COOK_MS-s.elapsed)/1000)} с · ${'♥'.repeat(Math.max(0,3-s.mistakes))}${'♡'.repeat(Math.min(3,s.mistakes))}`);
  (['pan','pot'] as Station[]).forEach((station,i)=>{const task=nextTask(s,station);const active=!!task&&s.elapsed>=task.at&&s.elapsed<=task.until;this.stationLabels[i]?.setText(!task?'Снято с огня ✓':active?`${task.label}\nОсталось ${Math.ceil((task.until-s.elapsed)/1000)} с`:`${task.label}\nЧерез ${Math.ceil((task.at-s.elapsed)/1000)} с`);this.indicators[i]?.setX(30+i*200+needle(s.elapsed,station)*160).setAlpha(active?1:.25);this.heat[i]?.setAlpha(active?1:.3);});
  this.steam.forEach((p,i)=>{const done=s.results[i<3?'pan-off':'rice-off'];const phase=(s.elapsed/1800+i/3)%1;p.setY(this.reduced?216:240-phase*40).setAlpha(done?0:this.reduced?.2:(1-phase)*.5);});
  const call=phoneActive(s);this.phone?.setFillStyle(call?0xefb085:0xd3ddd0);this.phoneText?.setText(call?'МАМА: «ТЫ ПОЕЛ?»\nНАЖМИ, ЧТОБЫ ПЕРЕЗВОНИТЬ · M':s.dismissed?'«МАМ, Я ПЕРЕЗВОНЮ ПОСЛЕ УЖИНА»':'МАМА ПОЗВОНИТ. КАК ВСЕГДА ВОВРЕМЯ.');
 }
 update(_time:number,delta:number){if(!this.running||this.model.cook.stage!=='stove')return;this.model=preciseAction(this.model,{type:'tick',delta:Math.min(50,delta)});if(this.model.cook.stage==='lost'){this.finish(false,'Дым — не приправа.', 'Три действия пропущены. Следи за обеими конфорками и нажимай, когда бегунок в зелёной зоне. Звонок можно сразу отклонить.');return;}if(this.drawn!==this.model.cook.stage)this.draw();else this.refreshStove();if(this.model.cook.elapsed-this.lastHud>=100||this.model.cook.stage==='plate'){this.lastHud=this.model.cook.elapsed;this.sync();}}
}
