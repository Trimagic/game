import {sound} from '../audio/sound';
import {haptics} from '../haptics';
import Phaser from 'phaser';
import SceneBase from '../arcade/SceneBase';
import type {ArcadeEvents} from '../arcade/types';
import {products,recipe} from './model';
import {saveBest} from '../best';
import {aim,cartCost,cartInitial,cartRating,hold,level,LEVELS,tickCart,CART_HALF,CART_Y,MEDAL_POINTS,SPAWN_Y,WIDTH} from './cart';
const frames=[[0,70,405,400],[410,40,330,455],[745,45,405,435],[1150,60,385,420],[65,490,215,480],[350,550,405,410],[770,530,380,405],[1165,535,371,440]];
const keys:Record<string,number>={ArrowLeft:-1,KeyA:-1,ArrowRight:1,KeyD:1};
export default class ShopScene extends SceneBase{
 private countdown=0;
 private model=cartInitial();private lastHud=0;private drawnLevel=-1;
 private header!:Phaser.GameObjects.Text;private budget!:Phaser.GameObjects.Text;private chips:Phaser.GameObjects.Text[]=[];
 private cartBody!:Phaser.GameObjects.Container;private cartLoad!:Phaser.GameObjects.Text;private banner!:Phaser.GameObjects.Text;
 private sprites=new Map<number,Phaser.GameObjects.Container>();private held=new Set<string>();private drag:{id:number;x:number;cart:number}|null=null;private lane!:Phaser.GameObjects.Rectangle;
 constructor(events:ArcadeEvents){super('belt',events);}
 preload(){this.load.image('products','/art/chapter-03-products.png');this.load.on('loaderror',this.bridge.error);}
 create(){if(!this.textures.exists('products'))return;frames.forEach(([x,y,w,h],i)=>this.textures.get('products').add(i,0,x,y,w,h));
  this.view={title:'Лови будущий ужин!',detail:'Три списка подряд: «Ужин», «Гости придут» и «Распродажа». Продукты падают с полок — веди тележку пальцем или стрелками и лови только то, что в списке. Лишнее, просрочка и перерасход бюджета отнимают жизнь. Дешёвая копия по акции заменит дорогую. Быстрее соберёшь — больше очков.',status:'ready',actions:[]};
  this.setup();this.drawStatic();
  // Drag works like a touchpad anywhere on the board, so the finger never hides the cart.
  this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(!this.running)return;this.held.clear();this.drag={id:p.id,x:p.x,cart:this.model.cartX};});
  this.input.on('pointermove',(p:Phaser.Input.Pointer)=>{if(this.running&&this.drag?.id===p.id&&p.isDown)this.model=aim(this.model,this.drag.cart+(p.x-this.drag.x)*1.4);});
  const release=(p:Phaser.Input.Pointer)=>{if(this.drag?.id===p.id)this.drag=null;};this.input.on('pointerup',release);this.input.on('pointerupoutside',release);
  this.input.keyboard?.on('keyup',(e:KeyboardEvent)=>{if(keys[e.code]===undefined)return;this.held.delete(e.code);this.model=hold(this.model,this.heldDir());});
 }
 private heldDir(){return [...this.held].reduce((n,c)=>n+(keys[c]??(c.startsWith('padleft')?-1:c.startsWith('padright')?1:0)),0);}
 protected pause(){this.held.clear();this.drag=null;this.model=hold(this.model,0);super.pause();}
 protected key(e:KeyboardEvent){if(keys[e.code]===undefined)return;e.preventDefault();this.held.add(e.code);this.model=hold(this.model,this.heldDir());}
 action(id:string){if(!this.running)return;const [kind,dir,source]=id.split(':');
  if(kind==='down'||kind==='up'){const code='pad'+dir+(source??'');kind==='down'?this.held.add(code):this.held.delete(code);this.model=hold(this.model,this.heldDir());}
  else if(id==='left'||id==='right')this.model=aim(this.model,this.model.cartX+(id==='left'?-110:110));}
 private drawStatic(){
  this.box(210,28,420,56,0x274e49);this.header=this.text(15,10,'',13,'#fff3d6');
  this.box(210,76,420,40,0xfff6e0);this.budget=this.text(405,76,'',13,'#293a34').setOrigin(1,.5);
  this.box(210,308,420,424,0xd8e6d9);
  // Shelves behind the falling goods.
  for(const y of [118,170])this.box(210,y,420,8,0xb6a27e,0x8a7656);
  this.box(210,CART_Y+40,420,28,0x455c54);
  // A faint column shows where falling goods will land in the cart.
  this.lane=this.add.rectangle(this.model.cartX,(SPAWN_Y+CART_Y)/2,CART_HALF*2,CART_Y-SPAWN_Y,0xf1bb64,.12).setDepth(5);this.root.add(this.lane);
  const g=this.add.graphics();g.fillStyle(0xf1bb64);g.lineStyle(3,0x293a34);g.beginPath();g.moveTo(-CART_HALF,-18);g.lineTo(CART_HALF,-18);g.lineTo(CART_HALF-10,16);g.lineTo(-CART_HALF+10,16);g.closePath();g.fillPath();g.strokePath();
  g.lineStyle(2,0x293a34);for(const x of [-24,0,24])g.lineBetween(x,-18,x*.8,16);g.fillStyle(0x293a34);g.fillCircle(-26,22,6);g.fillCircle(26,22,6);g.lineStyle(4,0x293a34);g.lineBetween(CART_HALF,-18,CART_HALF+12,-30);
  this.cartLoad=this.add.text(0,-34,'',{fontFamily:'Arial',fontSize:'12px',fontStyle:'bold',color:'#293a34',backgroundColor:'#fff6e0',padding:{x:4,y:1},resolution:2}).setOrigin(.5);
  this.cartBody=this.add.container(this.model.cartX,CART_Y,[g,this.cartLoad]).setDepth(20);this.root.add(this.cartBody);
  this.banner=this.text(210,300,'',22,'#fff3d6',true).setBackgroundColor('#274e49').setPadding(14,10,14,10).setDepth(40).setVisible(false);
  this.drawList();
 }
 private drawList(){
  this.chips.forEach(c=>c.destroy());const lv=level(this.model);this.drawnLevel=this.model.level;
  this.chips=lv.list.map((_,i)=>this.text(14+i*(320/lv.list.length),76,'',11,'#293a34').setOrigin(0,.5));
  this.refreshHud();
 }
 private refreshHud(){
  const s=this.model,lv=level(s);
  this.header.setText(`${s.level+1}/${LEVELS.length} · ${lv.name.toUpperCase()}   ${Math.max(0,Math.ceil((lv.ms-s.levelTime)/1000))} С   ★ ${s.score}\n${'♥'.repeat(Math.max(0,s.lives))}${'♡'.repeat(Math.max(0,3-s.lives))}   СЕРИЯ ${s.combo}`);
  lv.list.forEach((key,i)=>{const got=s.cart.some(p=>products[p.product].key===key);const name=recipe.find(r=>r.key===key)!.name;this.chips[i]?.setText(`${got?'✓':'○'} ${name}`).setColor(got?'#286b56':'#293a34');});
  const cost=cartCost(s);this.budget.setText(`${cost} / ${lv.budget}`).setColor(cost>lv.budget-4?'#ac412c':'#293a34');
  this.cartLoad.setText(`${s.cart.length} / ${lv.list.length}`);
 }
 private syncItems(){
  const live=new Set(this.model.items.map(i=>i.id));
  for(const [id,c] of this.sprites)if(!live.has(id)){c.destroy();this.sprites.delete(id);}
  for(const item of this.model.items){
   let c=this.sprites.get(item.id);
   if(!c){
    const p=products[item.product];const image=this.add.image(0,0,'products',p.icon);image.setScale(Math.min(58/image.width,62/image.height));
    const parts:Phaser.GameObjects.GameObject[]=[image];
    if(item.sale)parts.push(this.add.text(0,-34,'−50%',{fontFamily:'Arial',fontSize:'12px',fontStyle:'bold',color:'#fff7e3',backgroundColor:'#c4552d',padding:{x:4,y:1},resolution:2}).setOrigin(.5));
    if(item.expired)parts.push(this.add.text(0,4,'ПРОСРОЧЕНО',{fontFamily:'Arial',fontSize:'11px',fontStyle:'bold',color:'#c4302b',backgroundColor:'#fff7e3dd',padding:{x:3,y:1},resolution:2}).setOrigin(.5).setAngle(-18));
    c=this.add.container(item.x,item.y,parts).setDepth(10);this.sprites.set(item.id,c);
   }
   c.setPosition(item.x,item.y).setAngle(this.reduced?0:Math.sin((item.y+item.id*40)/40)*8);
  }
 }
 private react(){
  for(const e of this.model.events){
   const bad=e.type==='slip'||e.type==='timeout';if(bad)haptics.cue('error');
   if(e.type==='clear'){sound.fx('powerup');this.flash(e.label);continue;}if(e.type==='dup')sound.fx('buzz');
   this.pop(Math.max(60,Math.min(WIDTH-60,e.x)),CART_Y-60,e.type==='slip'?'МИНУС ЖИЗНЬ':e.label,bad?'#aa4933':e.type==='swap'?'#9b5725':'#286b56',e.type!=='dup');
   if(bad&&!this.reduced)this.cameras.main.shake(140,.006);
  }
 }
 private flash(label:string){this.banner.setText(label).setVisible(true).setAlpha(1);this.tweens.killTweensOf(this.banner);this.tweens.add({targets:this.banner,alpha:0,delay:1200,duration:400,onComplete:()=>this.banner.setVisible(false)});}
 private result(){const s=this.model;if(s.status==='lost'){this.finish(false,'Магазин закрылся. Ужин — не весь.',`Дошёл до списка «${level(s).name}». Лови только то, что в списке, следи за бюджетом и не хватай просрочку. Дешёвая копия по акции спасает от перерасхода.`);return;}
  const saved=saveBest('shop-best',s.score),stars=cartRating(s);
  this.finish(true,`${'★'.repeat(stars)}${'☆'.repeat(3-stars)} Всё куплено! ${s.score} очков`,`Три списка за ${(s.cleared.reduce((n,c)=>n+c.time,0)/1000).toFixed(0)} с, жизней осталось ${s.lives}, лучшая серия ${s.best}. ${s.medals.length?'Медали: '+s.medals.join(', ')+' (+'+s.medals.length*MEDAL_POINTS+'). ':'Медали: без промахов, две акции, все списки за 45 с, серия из 10. '}${saved.record?'Новый личный рекорд!':'Рекорд: '+saved.best+'.'}`);}
 protected sync(){const s=this.model,lv=level(s);this.view={status:'playing',title:`Список ${s.level+1}/${LEVELS.length} «${lv.name}» · ${cartCost(s)} / ${lv.budget} монет · ★ ${s.score}`,detail:s.notice,actions:[]};this.bridge.publish(this.view);}
 update(_time:number,delta:number){
  if(!this.running)return;
  const before=this.model;this.model=tickCart(this.model,Math.min(50,delta));
  // The last seconds of a list count down out loud.
  const left=Math.ceil((level(this.model).ms-this.model.levelTime)/1000);if(left<=5&&left>0&&left!==this.countdown){this.countdown=left;sound.fx('warn');}
  this.react();if(this.model.level!==this.drawnLevel)this.drawList();
  this.lane.setX(this.model.cartX);this.cartBody.setX(this.model.cartX).setAngle(this.reduced?0:Phaser.Math.Clamp((this.model.cartX-before.cartX)*.8,-6,6));
  this.syncItems();this.refreshHud();
  if(this.model.status!=='playing'){this.result();return;}
  if(this.model.time-this.lastHud>=150||this.model.events.length){this.lastHud=this.model.time;this.sync();}
 }
}
