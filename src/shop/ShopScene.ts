import Phaser from 'phaser';
import SceneBase from '../arcade/SceneBase';
import type {ArcadeEvents} from '../arcade/types';
import {products,recipe} from './model';
import {BELT_MS,beltInitial,beltStep,beltOffers,beltReady,beltCost,beltCount,beltSpeed} from './belt';
const frames=[[0,70,405,400],[410,40,330,455],[745,45,405,435],[1150,60,385,420],[65,490,215,480],[350,550,405,410],[770,530,380,405],[1165,535,371,440]];
export default class ShopScene extends SceneBase{
 private model=beltInitial();private clock!:Phaser.GameObjects.Text;private banner!:Phaser.GameObjects.Text;private rollers:Phaser.GameObjects.Rectangle[]=[];
 private cards=new Map<number,Phaser.GameObjects.Container>();private held:number|null=null;private lastHud=0;
 constructor(events:ArcadeEvents){super('belt',events);}
 preload(){this.load.image('products','/art/chapter-03-products.png');this.load.on('loaderror',this.bridge.error);}
 create(){if(!this.textures.exists('products'))return;frames.forEach(([x,y,w,h],i)=>this.textures.get('products').add(i,0,x,y,w,h));
  this.view={title:'Лови будущий ужин!',detail:'60 секунд, 35 монет. Товары едут по ленте: нажимай или тащи в корзину. К финалу лента ускорится. Две кнопки «Стоп-лента» дадут по 3 секунды передышки.',status:'ready',actions:[]};this.setup();this.draw();this.moveCards();
  this.input.on('dragstart',(_p:Phaser.Input.Pointer,o:Phaser.GameObjects.Container)=>{if(this.running){this.held=o.getData('offer');o.setDepth(30).setScale(1.05);}});
  this.input.on('drag',(_p:Phaser.Input.Pointer,o:Phaser.GameObjects.Container,x:number,y:number)=>{if(this.running&&this.held===o.getData('offer'))o.setPosition(x,y);});
  this.input.on('dragend',(_p:Phaser.Input.Pointer,o:Phaser.GameObjects.Container)=>{const id=o.getData('offer') as number;const drop=o.y>=375&&o.y<=505&&o.x>=0&&o.x<=420;this.held=null;if(this.running&&drop)this.action('buy:'+id);if(o.active)o.setScale(1).setDepth(10).setY(255);this.moveCards();});
 }
 protected pause(){this.held=null;for(const c of this.cards.values())c.setY(255).setScale(1).setDepth(10);super.pause();}
 protected key(e:KeyboardEvent){if(['Space','Enter','Digit1','Digit2','Digit3'].includes(e.code))e.preventDefault();if(e.code==='Space')this.action('freeze');if(e.code==='Enter')this.action('checkout');const n=['Digit1','Digit2','Digit3'].indexOf(e.code);const offer=this.visible()[n];if(n>=0&&offer)this.action('buy:'+offer.id);}
 private visible(){return beltOffers(this.model).filter(o=>o.x>=20&&o.x<=400);}
 action(id:string){if(!this.running)return;const [type,value]=id.split(':');const old=this.model;
  if(type==='buy'||type==='remove')this.model=beltStep(old,{type,id:Number(value)});else if(type==='freeze'||type==='checkout')this.model=beltStep(old,{type});
  if(this.model.cart.length>old.cart.length){this.pop(210,398,this.model.combo?'СЕРИЯ '+this.model.combo+'!':'ЛИШНЕЕ','#286b56');}
  this.draw();this.moveCards();if(this.model.status==='won')this.result();else this.sync();
 }
 private result(){const win=this.model.status==='won';this.finish(win,win?'Ужин пойман!':'Лента уехала. Ужин — не весь.',win?'Пять продуктов, '+beltCost(this.model)+' монет. Лучшая серия: '+this.model.best+'. Очки внимательности: '+this.model.score+'.':beltCount(this.model)+' из 5 продуктов. Используй стоп-ленту и возвращай лишнее. Продукты появляются снова.');}
 protected sync(){this.view={status:'playing',title:beltCount(this.model)+' / 5 · '+beltCost(this.model)+' / 35 монет · серия '+this.model.combo,detail:this.model.notice,actions:[...this.visible().map((o,i)=>({id:'buy:'+o.id,label:(i+1)+'. '+products[o.product].name+' · '+products[o.product].price})),{id:'freeze',label:'Стоп-лента · '+this.model.freezes,disabled:this.model.freezes===0||this.model.freeze>0},...this.model.cart.map(p=>({id:'remove:'+p.offer,label:'Убрать: '+products[p.product].name+' #'+p.offer})),{id:'checkout',label:this.model.elapsed<45000?'Касса с 45-й секунды':'Оплатить →',disabled:this.model.elapsed<45000||!beltReady(this.model)}]};this.bridge.publish(this.view);}
 private draw(){this.clear();this.rollers=[];const s=this.model;
  this.box(210,32,420,64,0x274e49);this.text(15,12,'ЛОВИ УЖИН / СЕРИЯ '+s.combo,14,'#fff3d6');this.clock=this.text(405,39,'',17,'#ffe0a4').setOrigin(1,.5);
  recipe.forEach((r,i)=>{const got=s.cart.some(p=>products[p.product].key===r.key);this.box(43+i*83,86,78,36,got?0xb8d9bd:0xfff6e0);this.text(43+i*83,86,(got?'✓ ':'○ ')+r.name,10,'#293a34',true);});
  this.banner=this.text(210,128,'',13,'#785438',true);this.box(210,263,420,214,0xc3d6c6);this.box(210,352,420,26,0x455c54);
  for(let i=0;i<16;i++)this.rollers.push(this.box(i*30,352,8,20,0x91a494,0x91a494));
  this.box(210,439,400,128,0xe5d6b6);this.text(22,380,'КОРЗИНА · ЛИШНЕЕ ВЕРНИ НАЖАТИЕМ',10);this.text(397,399,beltCost(s)+' / 35',17,beltCost(s)>35?'#ac412c':'#293a34').setOrigin(1,0);
  s.cart.forEach((p,i)=>{const x=39+i%5*82,y=433+Math.floor(i/5)*43;const image=this.image(x,y,'products',products[p.product].icon,35,35).setInteractive({useHandCursor:true});image.on('pointerup',()=>this.action('remove:'+p.offer));this.text(x+21,y-12,'×',14,'#a23e2b',true);});
  if(!s.cart.length)this.text(210,456,'ТАЩИ ПОКУПКИ СЮДА ↓',15,'#897751',true);
  this.button(105,534,190,37,'СТОП-ЛЕНТА · '+s.freezes,()=>this.action('freeze'),0xb8d9cd);this.button(310,534,190,37,s.elapsed<45000?'КАССА С 45 С':'ОПЛАТИТЬ →',()=>this.action('checkout'),beltReady(s)?0xf1bb64:0xe3d4bb);this.refresh();
 }
 private moveCards(){const offers=beltOffers(this.model);const live=new Set(offers.map(o=>o.id));
  for(const [id,c] of this.cards)if(!live.has(id)&&id!==this.held){c.destroy();this.cards.delete(id);}
  for(const offer of offers){let c=this.cards.get(offer.id);if(!c){const p=products[offer.product];const panel=this.add.rectangle(0,0,116,170,0xfff7e3).setStrokeStyle(2,0x293a34);const image=this.add.image(0,-15,'products',p.icon);image.setScale(Math.min(75/image.width,80/image.height));const label=this.add.text(0,-72,p.label,{fontFamily:'Arial',fontSize:'8px',color:'#825b39',resolution:2}).setOrigin(.5);const title=this.add.text(0,40,p.name,{fontFamily:'Arial',fontSize:'11px',fontStyle:'bold',color:'#293a34',align:'center',wordWrap:{width:108},resolution:2}).setOrigin(.5);const price=this.add.text(0,67,p.price+' монет',{fontFamily:'Arial',fontSize:'15px',fontStyle:'bold',color:'#80512b',resolution:2}).setOrigin(.5);c=this.add.container(offer.x,255,[panel,image,label,title,price]).setDepth(10).setSize(116,170).setInteractive(new Phaser.Geom.Rectangle(0,0,116,170),Phaser.Geom.Rectangle.Contains);c.setData('offer',offer.id);this.input.setDraggable(c);c.on('pointerup',()=>{if(this.held===null)this.action('buy:'+offer.id);});this.cards.set(offer.id,c);}if(offer.id!==this.held)c.setX(offer.x);}
 }
 private refresh(){const s=this.model;this.clock.setText(Math.ceil((BELT_MS-s.elapsed)/1000)+' С · '+s.score+' ОЧКОВ');this.banner.setText(s.freeze>0?'❄ СТОП-ЛЕНТА · '+Math.ceil(s.freeze/1000)+' С':s.elapsed<30000?'ЛОВИ НУЖНОЕ. РЕКЛАМУ ПРОПУСКАЙ.':s.elapsed<45000?'ЛЕНТА УСКОРЯЕТСЯ!':'ФИНАЛЬНЫЙ РАЗГОН · КАССА ОТКРЫТА');this.rollers.forEach((r,i)=>r.x=(i*30-this.model.distance%30));}
 update(_time:number,delta:number){if(!this.running)return;const oldPhase=beltSpeed(this.model.elapsed);const before=this.model.elapsed;this.model=beltStep(this.model,{type:'tick',delta:Math.min(50,delta)});this.moveCards();if(oldPhase!==beltSpeed(this.model.elapsed)||before<45000&&this.model.elapsed>=45000)this.draw();this.refresh();if(this.model.status!=='playing'){this.held=null;this.result();return;}if(this.model.elapsed-this.lastHud>=150){this.lastHud=this.model.elapsed;this.sync();}}
}

