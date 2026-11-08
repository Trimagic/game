import {sound} from '../audio/sound';
import {haptics} from '../haptics';
import Phaser from 'phaser';
import SceneBase from '../arcade/SceneBase';
import type {ArcadeEvents} from '../arcade/types';
import {recipe} from './model';
import {saveBest} from '../best';
import {aim,cartCost,cartInitial,cartRating,goods as products,hold,level,LEVELS,tickCart,CART_HALF,CART_Y,MEDAL_POINTS,SPAWN_Y,WIDTH} from './cart';
const frames=[[0,70,405,400],[410,40,330,455],[745,45,405,435],[1150,60,385,420],[65,490,215,480],[350,550,405,410],[770,530,380,405],[1165,535,371,440]];
const keys:Record<string,number>={ArrowLeft:-1,KeyA:-1,ArrowRight:1,KeyD:1};
export default class ShopScene extends SceneBase{
 private countdown=0;
 private model=cartInitial();private lastHud=0;private drawnLevel=-1;
 private header!:Phaser.GameObjects.Text;private budget!:Phaser.GameObjects.Text;private chips:Phaser.GameObjects.Text[]=[];
 private cartBody!:Phaser.GameObjects.Container;private cartLoad!:Phaser.GameObjects.Text;private banner!:Phaser.GameObjects.Text;
 private sprites=new Map<number,Phaser.GameObjects.Container>();private thief?:Phaser.GameObjects.Container;private thiefLoot?:Phaser.GameObjects.Image;private thiefMark?:Phaser.GameObjects.Text;private held=new Set<string>();private drag:{id:number;x:number;cart:number}|null=null;private lane!:Phaser.GameObjects.Rectangle;
 constructor(events:ArcadeEvents){super('belt',events);}
 preload(){this.load.image('products','/art/chapter-03-products.png');this.load.on('loaderror',this.bridge.error);}
 create(){if(!this.textures.exists('products'))return;frames.forEach(([x,y,w,h],i)=>this.textures.get('products').add(i,0,x,y,w,h));this.makeExtras();
  this.view={title:'Лови будущий ужин!',detail:'Три списка подряд: «Ужин», «Гости придут» и «Распродажа». Продукты падают с полок — веди тележку пальцем или стрелками и лови только то, что в списке. Лишнее, просрочка и перерасход бюджета отнимают жизнь, арбуз ещё и заклинит тележку. В поздних списках приманки качаются из стороны в сторону. Вор крадётся к тележке и уносит последнее: толкни его тележкой на скорости, чтобы прогнать.',status:'ready',actions:[]};
  this.setup();this.drawStatic();
  // Drag works like a touchpad anywhere on the board, so the finger never hides the cart.
  this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(!this.running)return;this.held.clear();this.drag={id:p.id,x:p.x,cart:this.model.cartX};});
  this.input.on('pointermove',(p:Phaser.Input.Pointer)=>{if(this.running&&this.drag?.id===p.id&&p.isDown)this.model=aim(this.model,this.drag.cart+(p.x-this.drag.x)*1.4);});
  const release=(p:Phaser.Input.Pointer)=>{if(this.drag?.id===p.id)this.drag=null;};this.input.on('pointerup',release);this.input.on('pointerupoutside',release);
  this.input.keyboard?.on('keyup',(e:KeyboardEvent)=>{if(keys[e.code]===undefined)return;this.held.delete(e.code);this.model=hold(this.model,this.heldDir());});
 }
 /** Simple drawn icons for the goods that have no picture in the sprite sheet. */
 private makeExtras(){
  const make=(icon:number,draw:(g:Phaser.GameObjects.Graphics)=>void)=>{const key='extra'+icon;if(this.textures.exists(key))return;const g=this.make.graphics({x:0,y:0},false);draw(g);g.generateTexture(key,64,64);g.destroy();};
  make(8,g=>{g.fillStyle(0xe8b13a);g.fillRoundedRect(12,6,40,52,6);g.fillStyle(0xd9473a);g.fillRect(12,20,40,16);g.lineStyle(3,0x293a34);g.strokeRoundedRect(12,6,40,52,6);g.fillStyle(0xfff3d6);g.fillCircle(32,28,6);});
  make(9,g=>{g.fillStyle(0x6fb3d9);g.fillRoundedRect(22,14,20,46,7);g.fillRect(27,4,10,12);g.fillStyle(0xd9473a);g.fillRect(22,28,20,12);g.lineStyle(3,0x293a34);g.strokeRoundedRect(22,14,20,46,7);g.fillStyle(0x293a34);g.fillRect(26,2,12,5);});
  make(10,g=>{g.fillStyle(0xd9a05b);g.fillCircle(32,34,24);g.fillStyle(0xe88aac);g.fillCircle(32,32,20);g.fillStyle(0xd8e6d9);g.fillCircle(32,33,7);g.lineStyle(3,0x293a34);g.strokeCircle(32,34,24);g.fillStyle(0xfff3d6);g.fillRect(20,22,4,2);g.fillRect(38,40,4,2);g.fillRect(42,26,2,4);});
  make(11,g=>{g.fillStyle(0xd17a6a);for(const y of [18,30,42])g.fillRoundedRect(8,y,48,11,5);g.lineStyle(2,0x293a34);for(const y of [18,30,42])g.strokeRoundedRect(8,y,48,11,5);});
  make(12,g=>{g.fillStyle(0x3f8c4a);g.fillEllipse(32,34,58,48);g.lineStyle(4,0x2a5e33);for(const x of [16,28,40,50])g.lineBetween(x,14,x-2,54);g.lineStyle(3,0x293a34);g.strokeEllipse(32,34,58,48);});
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
    const p=products[item.product];const image=p.icon>=8?this.add.image(0,0,'extra'+p.icon):this.add.image(0,0,'products',p.icon);image.setScale(Math.min(58/image.width,62/image.height));
    const parts:Phaser.GameObjects.GameObject[]=[image];
    if(item.sale)parts.push(this.add.text(0,-34,'−50%',{fontFamily:'Arial',fontSize:'12px',fontStyle:'bold',color:'#fff7e3',backgroundColor:'#c4552d',padding:{x:4,y:1},resolution:2}).setOrigin(.5));
    if(item.expired)parts.push(this.add.text(0,4,'ПРОСРОЧЕНО',{fontFamily:'Arial',fontSize:'11px',fontStyle:'bold',color:'#c4302b',backgroundColor:'#fff7e3dd',padding:{x:3,y:1},resolution:2}).setOrigin(.5).setAngle(-18));
    c=this.add.container(item.x,item.y,parts).setDepth(10);this.sprites.set(item.id,c);
   }
   c.setPosition(item.x,item.y).setAngle(this.reduced?0:Math.sin((item.y+item.id*40)/40)*8);
  }
 }
 /** The thief walks at the cart's height and runs off with whatever he took. */
 private syncThief(){const t=this.model.thief;
  if(!t){this.thief?.destroy();this.thief=undefined;this.thiefLoot=undefined;this.thiefMark?.destroy();this.thiefMark=undefined;return;}
  if(!this.thief){const g=this.add.graphics();g.fillStyle(0x3d4a5c);g.fillRoundedRect(-14,-36,28,38,8);g.fillStyle(0xe8c4a4);g.fillCircle(0,-46,11);g.fillStyle(0x293a34);g.fillRoundedRect(-12,-52,24,9,4);g.fillRect(-10,-48,20,4);g.lineStyle(5,0x2c3440);g.lineBetween(-6,2,-9,18);g.lineBetween(6,2,9,18);
   this.thiefLoot=this.add.image(18,-24,'products',0).setVisible(false);this.thief=this.add.container(t.x,CART_Y+6,[g,this.thiefLoot]).setDepth(19);this.root.add(this.thief);
   this.thiefMark=this.text(t.dir>0?24:WIDTH-24,CART_Y-40,'!',30,'#c4302b',true).setDepth(30);}
  const walking=t.phase!=='warn';this.thief.setX(t.x).setScale(t.dir<0?-1:1,1).setAngle(walking&&!this.reduced?Math.sin(this.model.time/60)*6:0);
  this.thiefMark?.setVisible(t.phase==='warn'&&Math.floor(this.model.time/150)%2===0);
  if(t.loot!==null&&this.thiefLoot&&!this.thiefLoot.visible){const p=products[t.loot];if(p.icon>=8)this.thiefLoot.setTexture('extra'+p.icon);else this.thiefLoot.setTexture('products',p.icon);this.thiefLoot.setScale(Math.min(30/this.thiefLoot.width,30/this.thiefLoot.height)).setVisible(true);}
 }
 private react(){
  for(const e of this.model.events){
   if(e.type==='thief'){sound.fx('warn');continue;}
   if(e.type==='steal'){sound.fx('alarm');this.pop(Math.max(80,Math.min(WIDTH-80,e.x)),CART_Y-70,e.label,'#aa4933',false);if(!this.reduced)this.cameras.main.shake(140,.006);continue;}
   if(e.type==='shoo'){sound.fx('crash');this.pop(Math.max(80,Math.min(WIDTH-80,e.x)),CART_Y-70,e.label,'#286b56',false);continue;}
   if(e.type==='heavy'){sound.fx('thud');if(!this.reduced)this.cameras.main.shake(220,.01);}
   const bad=e.type==='slip'||e.type==='timeout';if(bad)haptics.cue('error');
   if(e.type==='clear'){sound.fx('powerup');this.flash(e.label);continue;}if(e.type==='dup')sound.fx('buzz');
   this.pop(Math.max(60,Math.min(WIDTH-60,e.x)),CART_Y-60,e.type==='slip'?'МИНУС ЖИЗНЬ':e.label,bad?'#aa4933':e.type==='swap'?'#9b5725':'#286b56',e.type!=='dup');
   if(bad&&!this.reduced)this.cameras.main.shake(140,.006);
  }
 }
 private flash(label:string){this.banner.setText(label).setVisible(true).setAlpha(1);this.tweens.killTweensOf(this.banner);this.tweens.add({targets:this.banner,alpha:0,delay:1200,duration:400,onComplete:()=>this.banner.setVisible(false)});}
 private result(){const s=this.model;if(s.status==='lost'){this.finish(false,'Магазин закрылся. Ужин — не весь.',`Дошёл до списка «${level(s).name}». Лови только то, что в списке, следи за бюджетом и не хватай просрочку. Дешёвая копия по акции спасает от перерасхода.`);return;}
  const saved=saveBest('shop-best',s.score),stars=cartRating(s);
  this.finish(true,`${'★'.repeat(stars)}${'☆'.repeat(3-stars)} Всё куплено! ${s.score} очков`,`Три списка за ${(s.cleared.reduce((n,c)=>n+c.time,0)/1000).toFixed(0)} с, жизней осталось ${s.lives}, лучшая серия ${s.best}. ${s.medals.length?'Медали: '+s.medals.join(', ')+' (+'+s.medals.length*MEDAL_POINTS+'). ':'Медали: без промахов, две акции, все списки за 60 с, серия из 10. '}${saved.record?'Новый личный рекорд!':'Рекорд: '+saved.best+'.'}`);}
 protected sync(){const s=this.model,lv=level(s);this.view={status:'playing',title:`Список ${s.level+1}/${LEVELS.length} «${lv.name}» · ${cartCost(s)} / ${lv.budget} монет · ★ ${s.score}`,detail:s.notice,actions:[]};this.bridge.publish(this.view);}
 update(_time:number,delta:number){
  if(!this.running)return;
  const before=this.model;this.model=tickCart(this.model,Math.min(50,delta));
  // The last seconds of a list count down out loud.
  const left=Math.ceil((level(this.model).ms-this.model.levelTime)/1000);if(left<=5&&left>0&&left!==this.countdown){this.countdown=left;sound.fx('warn');}
  this.react();if(this.model.level!==this.drawnLevel)this.drawList();
  this.lane.setX(this.model.cartX);this.cartBody.setX(this.model.cartX).setAngle(this.reduced?0:Phaser.Math.Clamp((this.model.cartX-before.cartX)*.8,-6,6));
  this.syncItems();this.syncThief();this.refreshHud();
  if(!this.reduced)this.cartBody.setY(CART_Y+(this.model.stun>0?Math.sin(this.model.time/25)*3:0));
  if(this.model.status!=='playing'){this.result();return;}
  if(this.model.time-this.lastHud>=150||this.model.events.length){this.lastHud=this.model.time;this.sync();}
 }
}
