import Phaser from 'phaser';
import {BED,GOAL,HERO_STEP,MAP,MILK,SIZE,STAGES,enemyInterval,initial,key,sees,stageAt,step,turn,type Direction,type State} from './model';

export type SleepControls={choose:(direction:Direction)=>void;start:(retry:boolean)=>void;pause:()=>void};
const CELL=24;
const colors=[0xffbc59,0xef6c70,0xb499ef,0x6dd4ba];
const icons=['!','▶','▤','✚'];
const keys:Record<string,Direction>={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};
const captured=['UP','DOWN','LEFT','RIGHT','W','A','S','D'];

export default class SleepScene extends Phaser.Scene {
  private model=initial(Date.now());
  private queuedDot!:Phaser.GameObjects.Arc;
  private banner!:Phaser.GameObjects.Text;
  private dark:Phaser.GameObjects.Rectangle[]=[];
  private popups=new Map<string,Phaser.GameObjects.Container>();
  private stage=0;
  private running=false;
  private lastHud=0;
  private player!:Phaser.GameObjects.Container;
  private ring!:Phaser.GameObjects.Arc;
  private direction!:Phaser.GameObjects.Arc;
  private enemies:Phaser.GameObjects.Container[]=[];
  private enemyBodies:Phaser.GameObjects.Rectangle[]=[];
  private labels:Phaser.GameObjects.Text[]=[];
  private dots=new Map<string,Phaser.GameObjects.Arc>();
  private moons=new Map<string,Phaser.GameObjects.Container>();
  private bed!:Phaser.GameObjects.Rectangle;
  private bedLabel!:Phaser.GameObjects.Text;
  private milk!:Phaser.GameObjects.Container;
  private swipe:{x:number;y:number;id:number}|null=null;
  private swiped=false;
  private reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  constructor(private publish:(state:State)=>void,private loaded:(controls:SleepControls)=>void,private paused:()=>void,private failed:()=>void){super('sleep');}
  preload(){this.load.image('sleep-cast','/art/chapter-06-sprites.png');this.load.on('loaderror',this.failed);}
  create(){
    if(!this.textures.exists('sleep-cast'))return;
    const walls=this.add.graphics();walls.fillStyle(0x294c5a);walls.lineStyle(1.2,0x527a81);
    MAP.forEach((row,y)=>[...row].forEach((cell,x)=>{if(cell==='#'){walls.fillRoundedRect(x*CELL+2,y*CELL+2,20,20,5);walls.strokeRoundedRect(x*CELL+2,y*CELL+2,20,20,5);}}));
    for(const id of this.model.dots){const [x,y]=id.split(',').map(Number);this.dots.set(id,this.add.circle(x*CELL+12,y*CELL+12,2.6,0xf5dfa8));}
    for(const id of this.model.powers){const [x,y]=id.split(',').map(Number);this.moons.set(id,this.add.container(x*CELL+12,y*CELL+12,[this.add.circle(0,0,8,0x97ded2),this.add.circle(3,-2,5,0x214952)]));}
    this.bed=this.add.rectangle(BED.x*CELL+12,BED.y*CELL+12,22,20,0x8a8d9b).setDepth(6);
    this.add.rectangle(BED.x*CELL+12,BED.y*CELL+6,16,5,0xfff7de).setDepth(6);
    this.bedLabel=this.add.text(BED.x*CELL+12,BED.y*CELL+14,String(GOAL),{fontSize:'8px',color:'#172735'}).setOrigin(.5).setDepth(6);
    this.milk=this.add.container(MILK.x*CELL+12,MILK.y*CELL+12,[this.add.rectangle(0,2,13,16,0xfffaf0).setStrokeStyle(2,0x8a6a45),this.add.rectangle(0,-3,13,4,0xf3e2c0),this.add.rectangle(9,2,4,8,0xfffaf0).setStrokeStyle(2,0x8a6a45),this.add.text(0,-14,'~',{fontSize:'10px',color:'#fff6dc'}).setOrigin(.5)]).setDepth(6).setVisible(false);
    // Lights-out is a grid of shades, so the room fades with distance from the hero.
    for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++)this.dark.push(this.add.rectangle(x*CELL+12,y*CELL+12,CELL,CELL,0x050b12,0).setDepth(4).setVisible(false));
    this.model.enemies.forEach((e,i)=>{
      const body=this.add.rectangle(0,0,20,20,colors[i]).setStrokeStyle(2,0x101e2a);
      const label=this.add.text(0,0,icons[i],{fontFamily:'sans-serif',fontSize:'14px',fontStyle:'bold',color:'#172735'}).setOrigin(.5);
      this.enemyBodies.push(body);this.labels.push(label);this.enemies.push(this.add.container(e.pos.x*CELL+12,e.pos.y*CELL+12,[body,label]).setDepth(6));
    });
    this.textures.get('sleep-cast').add('portrait',0,1200,0,240,240);
    this.ring=this.add.circle(0,0,11,0xffe5a9).setStrokeStyle(2,0xfff6dc);
    const portrait=this.add.image(0,0,'sleep-cast','portrait').setDisplaySize(19,19);
    this.direction=this.add.circle(0,-11,2,0xffffff);
    this.queuedDot=this.add.circle(0,-14,3,0xffc94d).setStrokeStyle(1,0x172735).setVisible(false);
    this.player=this.add.container(0,0,[this.ring,portrait,this.direction,this.queuedDot]).setDepth(7);
    this.banner=this.add.text(180,3,'',{fontFamily:'sans-serif',fontSize:'12px',fontStyle:'bold',color:'#fff3d6',backgroundColor:'#263b43',align:'center',padding:{x:8,y:4},wordWrap:{width:340}}).setOrigin(.5,0).setDepth(20).setVisible(false);
    this.input.keyboard?.on('keydown',(e:KeyboardEvent)=>{if(!this.running)return;if(keys[e.code])this.choose(keys[e.code]);if(e.code==='Escape')this.pause();});
    // A swipe turns as soon as the finger has moved, without waiting for release, and can keep going.
    const axis=(dx:number,dy:number):Direction=>Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';
    this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(this.running){this.swipe={x:p.x,y:p.y,id:p.id};this.swiped=false;}});
    this.input.on('pointermove',(p:Phaser.Input.Pointer)=>{const start=this.swipe;if(!start||start.id!==p.id||!p.isDown||!this.running)return;const dx=p.x-start.x,dy=p.y-start.y;if(Math.max(Math.abs(dx),Math.abs(dy))<10)return;this.choose(axis(dx,dy));this.swipe={x:p.x,y:p.y,id:p.id};this.swiped=true;});
    // A plain tap steers toward the tapped spot, measured from the hero.
    this.input.on('pointerup',(p:Phaser.Input.Pointer)=>{const start=this.swipe;this.swipe=null;if(!start||start.id!==p.id||!this.running||this.swiped)return;this.choose(axis(p.x-(this.model.pos.x*CELL+12),p.y-(this.model.pos.y*CELL+12)));});
    this.input.on('pointerupoutside',()=>{this.swipe=null;});
    this.input.on('gameout',()=>{this.swipe=null;});
    this.paint(true);
    this.loaded({choose:d=>this.choose(d),start:retry=>this.start(retry),pause:()=>this.pause()});
  }
  private choose(d:Direction){if(!this.running)return;this.model=turn(this.model,d);this.publish(this.model);}
  private start(retry:boolean){if(retry){this.model=initial(Date.now());this.lastHud=0;this.stage=0;this.paint(true);}this.scene.resume();this.running=true;this.input.keyboard?.addCapture(captured);this.publish(this.model);}
  private pause(){if(!this.running)return;this.running=false;this.swipe=null;this.input.keyboard?.removeCapture(captured);this.scene.pause();this.publish(this.model);this.paused();}
  private move(object:Phaser.GameObjects.Container,x:number,y:number,snap:boolean,duration=90){
    if(snap){this.tweens.killTweensOf(object);object.setPosition(x,y);return;}
    this.tweens.killTweensOf(object);this.tweens.add({targets:object,x,y,duration:this.reducedMotion?0:duration,ease:'Linear'});
  }
  private paint(snap=false,previous?:State){
    const s=this.model;
    const remaining=new Set(s.dots),powers=new Set(s.powers);
    for(const [id,dot] of this.dots)dot.setVisible(remaining.has(id));
    for(const [id,moon] of this.moons)moon.setVisible(powers.has(id));
    this.bed.setFillStyle(s.score>=GOAL?0x8ee2bf:0x8a8d9b);this.bedLabel.setVisible(s.score<GOAL);
    if(snap||!previous||s.pos.x!==previous.pos.x||s.pos.y!==previous.pos.y)this.move(this.player,s.pos.x*CELL+12,s.pos.y*CELL+12,snap||!!previous&&s.lives<previous.lives,HERO_STEP*1000);
    this.milk.setVisible(s.milk>0).setScale(this.reducedMotion?1:1+Math.sin(s.time*6)*.08).setAlpha(s.milk<2?.5+.5*Math.abs(Math.sin(s.time*8)):1);
    if(previous&&s.bonus>previous.bonus)this.floatText(`+${s.bonus-previous.bonus}`,s.pos.x*CELL+12,s.pos.y*CELL);
    this.player.setAlpha(s.shield>0?.7:1);this.ring.setStrokeStyle(2,s.quiet>0?0x85ead5:0xfff6dc);
    const q={left:[-14,0],right:[14,0],up:[0,-14],down:[0,14]}[s.queued];this.queuedDot.setVisible(s.queued!==s.dir).setPosition(q[0],q[1]);
    this.paintStage(s,snap,previous);
    this.direction.setPosition(s.dir==='left'?-11:s.dir==='right'?11:0,s.dir==='up'?-11:s.dir==='down'?11:0);
    s.enemies.forEach((e,i)=>{const old=previous?.enemies[i];if(snap||!old||e.pos.x!==old.pos.x||e.pos.y!==old.pos.y)this.move(this.enemies[i],e.pos.x*CELL+12,e.pos.y*CELL+12,snap||!!old&&e.wait>old.wait,enemyInterval(s,e)*1000);this.enemies[i].setAlpha(e.wait>0?.4:1);const alert=sees(s,e)&&e.wait===0;this.enemies[i].setScale(alert?1.18:1);this.enemyBodies[i].setStrokeStyle(2,alert?0xffffff:0x101e2a).setFillStyle(s.quiet>0?0x718ba2:s.drowsy>0?0x8c95b8:colors[i]);this.labels[i].setText(e.wait>0?String(Math.ceil(e.wait)):s.drowsy>0&&s.quiet===0?'z':icons[i]);});
  }
  private paintStage(s:State,snap:boolean,previous?:State){
    const stage=stageAt(s.score);
    if(stage>this.stage&&!snap){this.banner.setText(STAGES[stage].news).setVisible(true).setAlpha(1);this.tweens.killTweensOf(this.banner);this.tweens.add({targets:this.banner,alpha:0,delay:1800,duration:400,onComplete:()=>this.banner.setVisible(false)});}
    this.stage=stage;
    const ids=new Set(s.popups.map(w=>key(w.pos)));
    for(const [id,box] of this.popups)if(!ids.has(id)){box.destroy();this.popups.delete(id);}
    for(const w of s.popups){const id=key(w.pos);let box=this.popups.get(id);if(!box){box=this.add.container(w.pos.x*CELL+12,w.pos.y*CELL+12,[this.add.rectangle(0,0,20,20,0xfdf6e3).setStrokeStyle(2,0xc4302b),this.add.rectangle(0,-7,20,6,0xc4302b),this.add.text(0,3,'×',{fontFamily:'sans-serif',fontSize:'13px',fontStyle:'bold',color:'#c4302b'}).setOrigin(.5)]).setDepth(3);this.popups.set(id,box);}box.setAlpha(w.warn>0?.25+.35*Math.abs(Math.sin(s.time*10)):1);}
    const lightsOut=stage===3;
    if(lightsOut&&(snap||!previous||stageAt(previous.score)<3||key(previous.pos)!==key(s.pos)))this.dark.forEach((shade,i)=>{const d=Math.hypot((i%SIZE)-s.pos.x,Math.floor(i/SIZE)-s.pos.y);shade.setVisible(true).setFillStyle(0x050b12,d<=2.5?0:d<=3.5?.45:d<=4.5?.78:.95);});
    else if(!lightsOut&&this.dark[0]?.visible)this.dark.forEach(shade=>shade.setVisible(false));
  }
  private floatText(text:string,x:number,y:number){const t=this.add.text(x,y,text,{fontFamily:'sans-serif',fontSize:'13px',fontStyle:'bold',color:'#ffe5a9',stroke:'#172735',strokeThickness:3}).setOrigin(.5).setDepth(8);this.tweens.add({targets:t,y:y-22,alpha:0,duration:this.reducedMotion?200:800,onComplete:()=>t.destroy()});}
  update(_time:number,delta:number){
    if(!this.running)return;
    const previous=this.model;this.model=step(previous,Math.min(.05,delta/1000));this.paint(false,previous);
    if(this.model.time-this.lastHud>=.1||this.model.score!==previous.score||this.model.lives!==previous.lives||this.model.status!=='playing'){this.lastHud=this.model.time;this.publish(this.model);}
    if(this.model.status!=='playing'){this.running=false;this.input.keyboard?.removeCapture(captured);this.tweens.killAll();this.paint(true);}
  }
}
