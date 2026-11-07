import {sound} from '../audio/sound';
import {haptics} from '../haptics';
import Phaser from 'phaser';
import SceneBase from '../arcade/SceneBase';
import type {ArcadeEvents} from '../arcade/types';
import {precisionInitial,preciseAction,cookRating,PREP_PAR,type PreciseAction} from './precision';
import {DISHES,PERFECT,READY,finished,ready} from './stove';
import {saveBest} from '../best';
import {BOARD,NEED,type ChopEvent,type Kind} from './chop';
const frameOf:Record<Kind,number>={tomato:1,broccoli:2,chicken:0};
const juice:Record<Kind,number>={tomato:0xd9473a,broccoli:0x5c9e4a,chicken:0xf2b8a8};
const names:Record<Kind,string>={tomato:'Помидоры',broccoli:'Брокколи',chicken:'Курица'};
const BAR=116;
const burnerX=[72,210,348];
export default class CookScene extends SceneBase{
 private model=precisionInitial(Date.now());private ringIn=0;private hot=[false,false,false];private prepClock?:Phaser.GameObjects.Text;private drawn='';private lastHud=0;
 private clock?:Phaser.GameObjects.Text;private panels:Phaser.GameObjects.Rectangle[]=[];private fills:Phaser.GameObjects.Rectangle[]=[];private stepLabels:Phaser.GameObjects.Text[]=[];
 private steam:Phaser.GameObjects.Arc[]=[];private foodSprites:Phaser.GameObjects.Image[]=[];
 private phone?:Phaser.GameObjects.Rectangle;private phoneText?:Phaser.GameObjects.Text;
 private stroke:{x:number;y:number;id:number}|null=null;private trail?:Phaser.GameObjects.Graphics;private trailPts:{x:number;y:number;t:number}[]=[];
 private pieces=new Map<number,Phaser.GameObjects.Image>();private chopHud?:Phaser.GameObjects.Text;private drawnBoard='';
 constructor(events:ArcadeEvents){super('kitchen',events);}
 preload(){this.load.image('food','/art/chapter-04-food.png');this.load.on('loaderror',this.bridge.error);}
 create(){
  if(!this.textures.exists('food'))return;for(let i=0;i<6;i++)this.textures.get('food').add(i,0,i%3*512,Math.floor(i/3)*512,512,512);
  this.view={title:'Сегодня ты — шеф.',detail:'Овощи падают на доску — режь их свайпом, несколько за раз дают бонус. Сырую курицу на овощной доске не трогай: для неё будет своя доска. Потом три конфорки сразу: еда сама доходит до зелёной зоны — жми на неё вовремя, иначе подгорит. Мама позвонит в самый разгар. Три подгорания — повтор.',status:'ready',actions:[]};this.setup();this.draw();
  this.trail=this.add.graphics().setDepth(40);
  // Every pointer move inside the board is a blade stroke from the previous point.
  this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(this.running&&this.model.cook.stage==='prep'&&p.y>=BOARD.top-20&&p.y<=BOARD.bottom+20){this.stroke={x:p.x,y:p.y,id:p.id};this.trailPts=[{x:p.x,y:p.y,t:this.time.now}];}});
  this.input.on('pointermove',(p:Phaser.Input.Pointer)=>{if(!this.running||this.stroke?.id!==p.id||!p.isDown)return;const from={x:this.stroke.x,y:this.stroke.y},to={x:p.x,y:p.y};this.stroke={...to,id:p.id};this.trailPts.push({...to,t:this.time.now});this.cut(from,to);});
  const end=()=>{this.stroke=null;};this.input.on('pointerup',end);this.input.on('pointerupoutside',end);
  this.input.on('drag',(_p:Phaser.Input.Pointer,obj:Phaser.GameObjects.Image,x:number,y:number)=>{if(this.running)obj.setPosition(x,y);});
  this.input.on('dragend',(_p:Phaser.Input.Pointer,obj:Phaser.GameObjects.Image)=>{const id=obj.getData('part') as number;const target=this.platePosition(id);if(this.running&&Phaser.Math.Distance.Between(obj.x,obj.y,target.x,target.y)<63)this.action(`plate:${id}`);else{if(this.running)sound.fx('buzz');this.model.feedback='Перенеси часть блюда в подсвеченную область с её названием.';this.draw();this.sync();}});
 }
 protected pause(){this.stroke=null;this.trailPts=[];this.trail?.clear();super.pause();}
 private cut(from:{x:number;y:number},to:{x:number;y:number}){if(this.model.cook.stage!=='prep')return;const old=this.model;this.model=preciseAction(old,{type:'slice',from,to});if(this.model!==old)this.afterChop(old);}
 private afterChop(old:typeof this.model){this.reactChop(this.model.chop===old.chop?[]:this.model.chop.events);if(this.drawn!==this.model.cook.stage||this.drawnBoard!==this.model.chop.board)this.draw();this.syncPieces();this.refreshPrep();this.sync();}
 private reactChop(events:ChopEvent[]){
  for(const e of events){
   if(e.type==='cut'&&e.kind){sound.fx('cut');this.splitPiece(e.x,e.y,e.kind);}
   if(e.type==='wrong'){haptics.cue('error');this.pop(Phaser.Math.Clamp(e.x,110,310),Math.max(150,e.y-30),e.label,'#aa4933');if(!this.reduced)this.cameras.main.shake(140,.006);}
   if(e.type==='multi')this.pop(Phaser.Math.Clamp(e.x,90,330),Math.max(150,e.y-40),e.label,'#9b5725');
   if(e.type==='board')this.pop(210,280,e.label,'#286b56');
  }
 }
 private splitPiece(x:number,y:number,kind:Kind){
  if(this.reduced)return;
  for(const side of [0,1]){const half=this.add.image(x+(side?8:-8),y,'food',frameOf[kind]).setDepth(30);half.setScale(62/half.width).setCrop(side*256,0,256,512);this.tweens.add({targets:half,x:half.x+(side?36:-36),y:y+50,angle:side?28:-28,alpha:0,duration:450,onComplete:()=>half.destroy()});}
  for(let i=0;i<5;i++){const drop=this.add.circle(x,y,3+Math.random()*3,juice[kind]).setDepth(29);this.tweens.add({targets:drop,x:x+(Math.random()-.5)*80,y:y+(Math.random()-.2)*60,alpha:0,duration:380,onComplete:()=>drop.destroy()});}
 }
 private syncPieces(){
  const prep=this.model.cook.stage==='prep';const live=new Set(prep?this.model.chop.pieces.map(p=>p.id):[]);
  for(const [id,img] of this.pieces)if(!live.has(id)){img.destroy();this.pieces.delete(id);}
  if(!prep)return;
  for(const p of this.model.chop.pieces){let img=this.pieces.get(p.id);if(!img){img=this.add.image(p.x,p.y,'food',frameOf[p.kind]).setDepth(20);img.setScale(62/img.width);this.pieces.set(p.id,img);}img.setPosition(p.x,p.y).setAngle(this.reduced?0:(p.y*.6+p.id*37)%360);}
 }
 private drawTrail(){const now=this.time.now;this.trailPts=this.trailPts.filter(p=>now-p.t<160);this.trail?.clear();for(let i=1;i<this.trailPts.length;i++){const a=this.trailPts[i-1],b=this.trailPts[i];this.trail?.lineStyle(6*(1-(now-b.t)/160)+1,0xfffbe8,.9).lineBetween(a.x,a.y,b.x,b.y);}}
 protected key(e:KeyboardEvent){if(['Space','Digit1','Digit2','Digit3','KeyM'].includes(e.code))e.preventDefault();if(e.code==='Space'&&this.model.cook.stage==='prep')this.action('cut');const n=['Digit1','Digit2','Digit3'].indexOf(e.code);if(n>=0)this.action(`burner:${n}`);if(e.code==='KeyM')this.action('answer');}
 action(id:string){
  if(!this.running)return;const [type,value]=id.split(':');let a:PreciseAction|undefined;
  if(type==='start'||type==='serve'||type==='answer'||type==='cut')a={type};
  if(type==='burner')a={type:'burner',index:Number(value)};
  if(type==='plate')a={type:'plate',part:Number(value)};
  if(!a)return;const old=this.model;this.model=preciseAction(this.model,a);if(type==='cut'){this.afterChop(old);return;}
  if(type==='burner'&&this.model.stove.events.some(e=>e.type==='early'))sound.fx('buzz');
  if(type==='start'&&this.model!==old)sound.fx('hiss');if(type==='plate'&&this.model!==old)sound.fx('pickup');
  this.react(old);if(this.drawn!==this.model.cook.stage)this.draw();else if(type==='answer')this.refreshStove();
  if(type!=='burner'&&this.model.quality>old.quality)this.pop(210,170,`+${this.model.quality-old.quality} ${type==='answer'?'МАМА ДОВОЛЬНА':'✓'}`);
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
   if(e.type==='finish'){sound.fx('ding');this.pop(x,190,'СНЯТО ✓','#286b56',false);}
  }
 }
 /** The phone keeps ringing until answered; a dish reaching the green zone calls for attention. */
 private stoveCues(delta:number){const st=this.model.stove;if(st.phone==='ringing'){this.ringIn-=delta;if(this.ringIn<=0){this.ringIn=1100;sound.fx('ring');}}else this.ringIn=0;DISHES.forEach((_,i)=>{const hot=ready(st,i)&&!finished(st,i);if(hot&&!this.hot[i])sound.fx('tick');this.hot[i]=hot;});}
 protected sync(){const s=this.model.cook,st=this.model.stove;const actions=[];
  if(s.stage==='prep')actions.push({id:'cut',label:'Резать нижний кусок · пробел'});
  if(s.stage==='ready')actions.push({id:'start',label:'Включить плиту →'});
  if(s.stage==='stove'){DISHES.forEach((d,i)=>actions.push({id:`burner:${i}`,label:`${d.key}. ${d.name}: ${finished(st,i)?'готово ✓':d.steps[st.burners[i].step]}${ready(st,i)?' · ЖМИ!':''}`,disabled:finished(st,i)||st.burners[i].delay>0||st.phone==='ringing'}));if(st.phone==='ringing')actions.push({id:'answer',label:'Ответить маме · M'});}
  if(s.stage==='plate'){['Курица','Рис','Овощи'].forEach((name,i)=>actions.push({id:`plate:${i}`,label:`На тарелку: ${name}`,disabled:s.plated.includes(i)}));actions.push({id:'serve',label:'Подать ужин →',disabled:s.plated.length!==3});}
  this.view={status:'playing',title:`${s.stage==='prep'?'Нарезка':s.stage==='ready'?'Всё подготовлено':s.stage==='stove'?'Три конфорки': 'Подача'} · ${this.model.quality} очков${s.stage==='stove'?` · серия ${this.model.combo}`:''}`,detail:this.model.feedback,actions};this.bridge.publish(this.view);
 }
 private platePosition(id:number){return [{x:145,y:264},{x:275,y:264},{x:210,y:365}][id]??{x:210,y:300};}
 private draw(){
  if(!this.root)return;this.clear();this.panels=[];this.fills=[];this.stepLabels=[];this.steam=[];this.foodSprites=[];this.clock=undefined;this.phone=undefined;this.phoneText=undefined;
  const s=this.model.cook;this.drawn=s.stage;this.drawnBoard=this.model.chop.board;this.chopHud=undefined;this.syncPieces();
  this.box(210,30,420,60,0x274e49);this.text(15,13,'КУХНЯ / РЕЦЕПТ БЫЛ ОПТИМИСТОМ',12,'#fff5da');this.text(15,36,`МАСТЕРСТВО ${this.model.quality} · СЕРИЯ ${this.model.combo}`,11,'#f5ca77');
  ['НАРЕЗКА','ПЛИТА','ПОДАЧА'].forEach((name,i)=>{const active=i===0?s.stage==='prep':i===1?['ready','stove'].includes(s.stage):s.stage==='plate';this.box(70+i*140,82,136,35,active?0xf1bb64:0xe5decc);this.text(70+i*140,82,`${i+1}. ${name}`,12,'#293a34',true);});
  if(s.stage==='prep'){
   const meat=this.model.chop.board==='meat';
   this.box(210,(BOARD.top+BOARD.bottom)/2,BOARD.right-BOARD.left,BOARD.bottom-BOARD.top,meat?0xe6c3b4:0xd7bc80,meat?0xa04f3c:0x293a34);
   for(let i=1;i<9;i++)this.box(210,BOARD.top+i*33,BOARD.right-BOARD.left-20,1,meat?0xcfa392:0xc3a16c,meat?0xcfa392:0xc3a16c);
   this.text(210,(BOARD.top+BOARD.bottom)/2,meat?'ДЛЯ КУРИЦЫ':'ОВОЩИ',40,meat?'#c99a88':'#c7a874',true).setAlpha(.55);
   this.chopHud=this.text(210,116,'',14,'#293a34',true);
   this.text(210,452,meat?'РЕЖЬ КУРИЦУ · ОВОЩИ НЕ ТРОГАЙ':'РЕЖЬ ОВОЩИ СВАЙПОМ · СЫРУЮ КУРИЦУ НЕ ТРОГАЙ',11,meat?'#a04f3c':'#6a5136',true);
   this.prepClock=this.text(405,43,'',11,'#f5ca77').setOrigin(1,.5);this.refreshPrep();this.button(210,510,370,40,'РЕЗАТЬ НИЖНИЙ КУСОК · ПРОБЕЛ',()=>this.action('cut'));
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
 private refreshPrep(){const c=this.model.chop;if(c.board!=='done')this.chopHud?.setText((Object.entries(NEED[c.board]) as [Kind,number][]).map(([k,n])=>`${c.counts[k]>=n?'✓':'○'} ${names[k]} ${Math.min(c.counts[k],n)}/${n}`).join('   ')+(c.switchMs>0?'   · меняем доску…':''));const ms=this.model.prepMs;this.prepClock?.setText(`⏱ ${(ms/1000).toFixed(1)} с${ms<PREP_PAR?' · бонус +'+Math.min(40,Math.round((PREP_PAR-ms)/250)):''}`);}
 private refreshStove(){const st=this.model.stove;
  this.clock?.setText(`${st.time.toFixed(0)} с у плиты · ${'♥'.repeat(Math.max(0,3-st.mistakes))}${'♡'.repeat(Math.min(3,st.mistakes))}`);
  DISHES.forEach((dish,i)=>{const b=st.burners[i],done=finished(st,i),hot=ready(st,i),burning=hot&&b.progress>PERFECT[1];
   this.panels[i]?.setFillStyle(done?0xcfd8cc:burning?0xf3c3a8:hot?0xd9efcf:0xe4dbc5);
   this.fills[i]?.setSize(done?BAR:b.progress*BAR,8).setFillStyle(burning?0xc4302b:0x293a34);
   if(i===0&&this.foodSprites[0]&&b.step>=1)this.foodSprites[0].setFrame(3);
   this.stepLabels[i]?.setText(done?'Снято с огня ✓':b.delay>0?`Греется… ${Math.ceil(b.delay)} с`:`${dish.steps[b.step]}\n${b.step+1} / ${dish.steps.length}${hot?' · ЖМИ!':''}`);
  });
  this.steam.forEach((p,n)=>{const i=Math.floor(n/3),b=st.burners[i];const phase=(st.time/1.4+n/3)%1;p.setY(this.reduced?190:212-phase*36).setAlpha(finished(st,i)||b.delay>0?0:this.reduced?.2:(1-phase)*(.3+b.progress*.5)).setFillStyle(b.progress>PERFECT[1]?0x8a8a8a:0xfff9e9);});
  const call=st.phone==='ringing';this.phone?.setFillStyle(call?0xefb085:st.phone==='answered'?0xbfe3c4:0xd3ddd0).setScale(call&&!this.reduced?1+.025*Math.abs(Math.sin(st.time*9)):1);this.phoneText?.setText(call?'МАМА: «ТЫ ПОЕЛ?» · РУКИ ЗАНЯТЫ!\nНАЖМИ, ЧТОБЫ ОТВЕТИТЬ · M':st.phone==='answered'?'«МАМ, Я ГОТОВЛЮ! ПЕРЕЗВОНЮ!»':st.phone==='missed'?'ПРОПУЩЕННЫЙ ВЫЗОВ: МАМА (1)':'МАМА ПОЗВОНИТ. КАК ВСЕГДА ВОВРЕМЯ.');
 }
 update(_time:number,delta:number){this.drawTrail();if(!this.running)return;if(this.model.cook.stage==='prep'){const old=this.model;this.model=preciseAction(this.model,{type:'tick',delta:Math.min(50,delta)});if(this.drawnBoard!==this.model.chop.board||this.drawn!==this.model.cook.stage)this.afterChop(old);else{this.syncPieces();this.refreshPrep();}return;}if(this.model.cook.stage!=='stove')return;const before=this.model;this.model=preciseAction(this.model,{type:'tick',delta:Math.min(50,delta)});this.react(before);this.stoveCues(delta);if(this.model.cook.stage==='lost'){this.finish(false,'Дым — не приправа.','Три раза подгорело. Следи за всеми тремя конфорками: когда полоска в зелёном — жми. Звонок мамы занимает руки — отвечай сразу.');return;}if(this.drawn!==this.model.cook.stage)this.draw();else this.refreshStove();if(this.model.stove.time*1000-this.lastHud>=100||this.model.cook.stage==='plate'){this.lastHud=this.model.stove.time*1000;this.sync();}}
}
