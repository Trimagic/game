import {haptics} from '../haptics';
import Phaser from 'phaser';
import SceneBase from '../arcade/SceneBase';
import type {ArcadeEvents} from '../arcade/types';
import {PREP,validCut} from './model';
import {precisionInitial,preciseAction,cookRating,PREP_PAR,type PreciseAction} from './precision';
import {DISHES,PERFECT,READY,finished,ready} from './stove';
import {saveBest} from '../best';
const BAR=116;
const burnerX=[72,210,348];
export default class CookScene extends SceneBase{
 private model=precisionInitial(Date.now());private prepClock?:Phaser.GameObjects.Text;private drawn='';private lastHud=0;
 private clock?:Phaser.GameObjects.Text;private panels:Phaser.GameObjects.Rectangle[]=[];private fills:Phaser.GameObjects.Rectangle[]=[];private stepLabels:Phaser.GameObjects.Text[]=[];
 private steam:Phaser.GameObjects.Arc[]=[];private foodSprites:Phaser.GameObjects.Image[]=[];
 private phone?:Phaser.GameObjects.Rectangle;private phoneText?:Phaser.GameObjects.Text;
 private stroke:{x:number;y:number;id:number}|null=null;private trail?:Phaser.GameObjects.Graphics;
 constructor(events:ArcadeEvents){super('kitchen',events);}
 preload(){this.load.image('food','/art/chapter-04-food.png');this.load.on('loaderror',this.bridge.error);}
 create(){
  if(!this.textures.exists('food'))return;for(let i=0;i<6;i++)this.textures.get('food').add(i,0,i%3*512,Math.floor(i/3)*512,512,512);
  this.view={title:'Сегодня ты — шеф.',detail:'Нарежь продукты — ровный разрез по линии даёт больше очков, а быстрая нарезка — бонус. Потом три конфорки сразу: еда сама доходит до зелёной зоны — жми на неё вовремя, иначе подгорит. Мама позвонит в самый разгар. Три подгорания — повтор.',status:'ready',actions:[]};this.setup();this.draw();
  this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(this.running&&this.model.cook.stage==='prep'&&p.x>=20&&p.x<=400&&p.y>=130&&p.y<=430){this.stroke={x:(p.x-20)/380,y:(p.y-130)/300,id:p.id};this.trail=this.add.graphics().setDepth(40);}});
  this.input.on('pointermove',(p:Phaser.Input.Pointer)=>{if(this.running&&this.stroke?.id===p.id&&p.isDown){this.trail?.clear().lineStyle(3,0xfff5d4).lineBetween(20+this.stroke.x*380,130+this.stroke.y*300,p.x,p.y);}});
  this.input.on('pointerup',(p:Phaser.Input.Pointer)=>{if(this.running&&this.stroke?.id===p.id){const line=this.model.cook.cuts%2===0?.44:.56;const end={x:(p.x-20)/380,y:(p.y-130)/300};if(validCut(this.stroke,end,line))this.action(Math.abs(this.stroke.x-line)<=.06&&Math.abs(end.x-line)<=.06?'cut:precise':'cut');else{if(this.running)haptics.cue('error');this.model.feedback='Проведи через всю доску вдоль пунктирной линии.';this.sync();}}this.stroke=null;this.trail?.destroy();});
  this.input.on('pointerupoutside',()=>{this.stroke=null;this.trail?.destroy();});
  this.input.on('drag',(_p:Phaser.Input.Pointer,obj:Phaser.GameObjects.Image,x:number,y:number)=>{if(this.running)obj.setPosition(x,y);});
  this.input.on('dragend',(_p:Phaser.Input.Pointer,obj:Phaser.GameObjects.Image)=>{const id=obj.getData('part') as number;const target=this.platePosition(id);if(this.running&&Phaser.Math.Distance.Between(obj.x,obj.y,target.x,target.y)<63)this.action(`plate:${id}`);else{if(this.running)haptics.cue('error');this.model.feedback='Перенеси часть блюда в подсвеченную область с её названием.';this.draw();this.sync();}});
 }
 protected pause(){this.stroke=null;this.trail?.destroy();super.pause();}
 protected key(e:KeyboardEvent){if(['Space','Digit1','Digit2','Digit3','KeyM'].includes(e.code))e.preventDefault();if(e.code==='Space'&&this.model.cook.stage==='prep')this.action('cut');const n=['Digit1','Digit2','Digit3'].indexOf(e.code);if(n>=0)this.action(`burner:${n}`);if(e.code==='KeyM')this.action('answer');}
 action(id:string){
  if(!this.running)return;const [type,value]=id.split(':');let a:PreciseAction|undefined;
  if(type==='start'||type==='serve'||type==='answer')a={type};
  if(type==='cut')a={type:'cut',precise:value==='precise'};
  if(type==='burner')a={type:'burner',index:Number(value)};
  if(type==='plate')a={type:'plate',part:Number(value)};
  if(!a)return;const old=this.model;this.model=preciseAction(this.model,a);
  if(type==='burner'&&this.model.stove.events.some(e=>e.type==='early'))haptics.cue('error');
  this.react(old);if(this.drawn!==this.model.cook.stage)this.draw();
  if(type!=='burner'&&this.model.quality>old.quality)this.pop(210,170,`+${this.model.quality-old.quality} ${type==='answer'?'МАМА ДОВОЛЬНА':value==='precise'?'РОВНО!':'✓'}`);
  if(this.model.cook.stage==='won'){const m=this.model,stars=cookRating(m.quality),saved=saveBest('cook-best',m.quality),burns=m.stove.burners.reduce((n,b)=>n+b.burns,0);this.finish(true,`${'★'.repeat(stars)}${'☆'.repeat(3-stars)} Ужин готов! ${m.quality} очков`,`Нарезка за ${(m.prepMs/1000).toFixed(1)} с (+${m.prepBonus}), у плиты ${m.stove.time.toFixed(0)} с, подгорело: ${burns}, лучшая серия: ${m.best}, ${m.stove.phone==='answered'?'маме ответил':'мама обиделась'}. ${saved.record?'Новый личный рекорд!':`Рекорд: ${saved.best}.`}`);}else this.sync();
 }
 /** Turns stove events from the last step into pops, wobbles and smoke. */
 private react(old:typeof this.model){
  if(this.model.stove===old.stove)return;
  for(const e of this.model.stove.events){
   const x=burnerX[e.burner];
   if(e.type==='perfect'||e.type==='done'){this.pop(x,140,e.type==='perfect'?'+30 ИДЕАЛЬНО':'+20 ВОВРЕМЯ',e.type==='perfect'?'#9b5725':'#286b56');const food=this.foodSprites[e.burner];if(food&&!this.reduced)this.tweens.add({targets:food,angle:16,y:food.y-10,duration:160,yoyo:true});}
   if(e.type==='early')this.pop(x,140,'РАНО!','#aa4933',false);
   if(e.type==='burn'){haptics.cue('error');this.pop(x,140,'ГОРИТ!','#aa4933');if(!this.reduced)this.cameras.main.shake(140,.006);}
   if(e.type==='finish')this.pop(x,190,'СНЯТО ✓','#286b56',false);
  }
 }
 protected sync(){const s=this.model.cook,st=this.model.stove;const actions=[];
  if(s.stage==='prep')actions.push({id:'cut',label:'Сделать разрез · пробел'});
  if(s.stage==='ready')actions.push({id:'start',label:'Включить плиту →'});
  if(s.stage==='stove'){DISHES.forEach((d,i)=>actions.push({id:`burner:${i}`,label:`${d.key}. ${d.name}: ${finished(st,i)?'готово ✓':d.steps[st.burners[i].step]}${ready(st,i)?' · ЖМИ!':''}`,disabled:finished(st,i)||st.burners[i].delay>0||st.phone==='ringing'}));if(st.phone==='ringing')actions.push({id:'answer',label:'Ответить маме · M'});}
  if(s.stage==='plate'){['Курица','Рис','Овощи'].forEach((name,i)=>actions.push({id:`plate:${i}`,label:`На тарелку: ${name}`,disabled:s.plated.includes(i)}));actions.push({id:'serve',label:'Подать ужин →',disabled:s.plated.length!==3});}
  this.view={status:'playing',title:`${s.stage==='prep'?'Нарезка':s.stage==='ready'?'Всё подготовлено':s.stage==='stove'?'Три конфорки': 'Подача'} · ${this.model.quality} очков${s.stage==='stove'?` · серия ${this.model.combo}`:''}`,detail:this.model.feedback,actions};this.bridge.publish(this.view);
 }
 private platePosition(id:number){return [{x:145,y:264},{x:275,y:264},{x:210,y:365}][id]??{x:210,y:300};}
 private draw(){
  if(!this.root)return;this.clear();this.panels=[];this.fills=[];this.stepLabels=[];this.steam=[];this.foodSprites=[];this.clock=undefined;this.phone=undefined;this.phoneText=undefined;
  const s=this.model.cook;this.drawn=s.stage;
  this.box(210,30,420,60,0x274e49);this.text(15,13,'КУХНЯ / РЕЦЕПТ БЫЛ ОПТИМИСТОМ',12,'#fff5da');this.text(15,36,`МАСТЕРСТВО ${this.model.quality} · СЕРИЯ ${this.model.combo}`,11,'#f5ca77');
  ['НАРЕЗКА','ПЛИТА','ПОДАЧА'].forEach((name,i)=>{const active=i===0?s.stage==='prep':i===1?['ready','stove'].includes(s.stage):s.stage==='plate';this.box(70+i*140,82,136,35,active?0xf1bb64:0xe5decc);this.text(70+i*140,82,`${i+1}. ${name}`,12,'#293a34',true);});
  if(s.stage==='prep'){
   const index=Math.min(2,Math.floor(s.cuts/2));this.text(210,116,`${PREP[index].name} · разрез ${s.cuts%2+1} / 2`,17,'#293a34',true);this.box(210,280,380,300,index===2?0xd5b6a0:0xd7bc80);
   for(let i=0;i<9;i++)this.box(210,151+i*32,360,1,0xc3a16c,0xc3a16c);
   this.image(s.cuts%2?175:210,280,'food',[1,2,0][index],220,200);if(s.cuts%2)this.image(270,300,'food',[1,2,0][index],90,120);
   const x=20+(s.cuts%2===0?.44:.56)*380;for(let y=146;y<419;y+=18)this.box(x,y,3,10,0xfff6df,0xfff6df);
   this.text(x,151,'↓',25,'#fff9ec',true);this.text(210,450,index===2?'ОТДЕЛЬНАЯ ДОСКА ДЛЯ КУРИЦЫ':'ПРОВЕДИ ПО ЛИНИИ СВЕРХУ ВНИЗ',11,'#6a5136',true);this.text(210,478,`${'●'.repeat(s.cuts)}${'○'.repeat(6-s.cuts)}`,22,'#367c62',true);this.prepClock=this.text(405,43,'',11,'#f5ca77').setOrigin(1,.5);this.refreshPrep();this.button(210,526,370,40,'СДЕЛАТЬ РАЗРЕЗ · ПРОБЕЛ',()=>this.action('cut'));
  }else if(s.stage==='ready'){
   this.text(210,150,'ТРИ КОНФОРКИ СРАЗУ.',22,'#293a34',true);DISHES.forEach((_,i)=>this.image(burnerX[i],250,'food',[0,4,2][i],110,110));this.text(210,380,'Еда сама доходит до зелёной зоны.\nЖми вовремя — центр зоны идеален.\nПроспишь — подгорит.',16,'#293a34',true);this.button(210,510,370,48,'ВКЛЮЧИТЬ ПЛИТУ →',()=>this.action('start'));
  }else if(s.stage==='stove'){
   this.clock=this.text(210,116,'',16,'#293a34',true);
   DISHES.forEach((dish,i)=>{const x=burnerX[i];
    const panel=this.box(x,283,132,284,0xe4dbc5).setInteractive({useHandCursor:true});panel.on('pointerdown',()=>this.action(`burner:${i}`));this.panels.push(panel);
    this.text(x,153,dish.name.toUpperCase(),13,'#293a34',true);this.text(x,170,dish.station,10,'#715f45',true);
    const ring=this.add.circle(x,232,46,0x34423c).setStrokeStyle(5,0xe8a34f);this.root.add(ring);
    this.foodSprites.push(this.image(x,228,'food',[0,4,2][i],80,78));
    for(let n=0;n<3;n++){const puff=this.add.circle(x-18+n*18,196,4+n,0xfff9e9,.35);this.root.add(puff);this.steam.push(puff);}
    // Ready window and the perfect band sit on a fill bar that creeps right.
    const left=x-BAR/2;this.box(x,300,BAR,16,0xd1bfa0);
    const zone=this.add.rectangle(left+READY*BAR,300,(1-READY)*BAR,16,0xb4dbb0).setOrigin(0,.5);const best=this.add.rectangle(left+PERFECT[0]*BAR,300,(PERFECT[1]-PERFECT[0])*BAR,16,0x4c9e79).setOrigin(0,.5);
    const fill=this.add.rectangle(left,300,0,8,0x293a34).setOrigin(0,.5);this.root.add([zone,best,fill]);this.fills.push(fill);
    this.stepLabels.push(this.text(x,334,'',12,'#293a34',true).setWordWrapWidth(124));
    this.text(x,404,`${dish.key} · ЖМИ`,12,'#715f45',true);
   });
   this.phone=this.button(210,468,390,52,'',()=>this.action('answer'),0xd3ddd0);this.phoneText=this.text(210,468,'',12,'#293a34',true);this.text(210,520,'ЗЕЛЁНОЕ — ЖМИ · ТЁМНО-ЗЕЛЁНОЕ — ИДЕАЛЬНО · 1 2 3',10,'#715f45',true);this.refreshStove();
  }else if(s.stage==='plate'){
   this.text(210,124,'РАЗЛОЖИ УЖИН ПО МЕСТАМ',16,'#293a34',true);const plate=this.add.circle(210,300,153,0xfffcf0).setStrokeStyle(10,0xc9d7c9);this.root.add(plate);
   ['Курица','Рис','Овощи'].forEach((name,i)=>{const target=this.platePosition(i);const zone=this.add.circle(target.x,target.y,53,0xe4e8d6).setStrokeStyle(2,0x99ad92);this.root.add(zone);if(s.plated.includes(i))this.image(target.x,target.y,'food',[3,4,5][i],105,100);else{this.text(target.x,target.y,name,12,'#6f8065',true);const image=this.image(80+i*130,477,'food',[3,4,5][i],90,70).setInteractive({useHandCursor:true});image.setData('part',i);this.input.setDraggable(image);}});this.button(210,536,390,34,s.plated.length===3?'ПОДАТЬ УЖИН →':'ПЕРЕТАЩИ ЕДУ В ОБЛАСТИ НА ТАРЕЛКЕ',()=>this.action('serve'),s.plated.length===3?0xadd7b4:0xe3cba2);
  }
 }
 private refreshPrep(){const ms=this.model.prepMs;this.prepClock?.setText(`⏱ ${(ms/1000).toFixed(1)} с${ms<PREP_PAR?' · бонус +'+Math.min(40,Math.round((PREP_PAR-ms)/250)):''}`);}
 private refreshStove(){const st=this.model.stove;
  this.clock?.setText(`${st.time.toFixed(0)} с у плиты · ${'♥'.repeat(Math.max(0,3-st.mistakes))}${'♡'.repeat(Math.min(3,st.mistakes))}`);
  DISHES.forEach((dish,i)=>{const b=st.burners[i],done=finished(st,i),hot=ready(st,i),burning=hot&&b.progress>PERFECT[1];
   this.panels[i]?.setFillStyle(done?0xcfd8cc:burning?0xf3c3a8:hot?0xd9efcf:0xe4dbc5);
   this.fills[i]?.setSize(done?BAR:b.progress*BAR,8).setFillStyle(burning?0xc4302b:0x293a34);
   if(i===0&&this.foodSprites[0]&&b.step>=1)this.foodSprites[0].setFrame(3);
   this.stepLabels[i]?.setText(done?'Снято с огня ✓':b.delay>0?`Греется… ${Math.ceil(b.delay)} с`:`${dish.steps[b.step]}\n${b.step+1} / ${dish.steps.length}${hot?' · ЖМИ!':''}`);
  });
  this.steam.forEach((p,n)=>{const i=Math.floor(n/3),b=st.burners[i];const phase=(st.time/1.4+n/3)%1;p.setY(this.reduced?190:212-phase*36).setAlpha(finished(st,i)||b.delay>0?0:this.reduced?.2:(1-phase)*(.3+b.progress*.5)).setFillStyle(b.progress>PERFECT[1]?0x8a8a8a:0xfff9e9);});
  const call=st.phone==='ringing';this.phone?.setFillStyle(call?0xefb085:0xd3ddd0);this.phoneText?.setText(call?'МАМА: «ТЫ ПОЕЛ?» · РУКИ ЗАНЯТЫ!\nНАЖМИ, ЧТОБЫ ОТВЕТИТЬ · M':st.phone==='answered'?'«МАМ, Я ГОТОВЛЮ! ПЕРЕЗВОНЮ!»':st.phone==='missed'?'ПРОПУЩЕННЫЙ ВЫЗОВ: МАМА (1)':'МАМА ПОЗВОНИТ. КАК ВСЕГДА ВОВРЕМЯ.');
 }
 update(_time:number,delta:number){if(!this.running)return;if(this.model.cook.stage==='prep'){this.model=preciseAction(this.model,{type:'tick',delta:Math.min(50,delta)});this.refreshPrep();return;}if(this.model.cook.stage!=='stove')return;const before=this.model;this.model=preciseAction(this.model,{type:'tick',delta:Math.min(50,delta)});this.react(before);if(this.model.cook.stage==='lost'){this.finish(false,'Дым — не приправа.','Три раза подгорело. Следи за всеми тремя конфорками: когда полоска в зелёном — жми. Звонок мамы занимает руки — отвечай сразу.');return;}if(this.drawn!==this.model.cook.stage)this.draw();else this.refreshStove();if(this.model.stove.time*1000-this.lastHud>=100||this.model.cook.stage==='plate'){this.lastHud=this.model.stove.time*1000;this.sync();}}
}
