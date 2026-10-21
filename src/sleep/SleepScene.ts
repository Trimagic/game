import Phaser from 'phaser';
import {BED,GOAL,MAP,initial,step,turn,type Direction,type State} from './model';

export type SleepControls={choose:(direction:Direction)=>void;start:(retry:boolean)=>void;pause:()=>void};
const CELL=24;
const colors=[0xffbc59,0xef6c70,0xb499ef,0x6dd4ba];
const icons=['!','▶','▤','✚'];
const keys:Record<string,Direction>={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};
const captured=['UP','DOWN','LEFT','RIGHT','W','A','S','D'];

export default class SleepScene extends Phaser.Scene {
  private model=initial();
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
  private swipe:{x:number;y:number;id:number}|null=null;
  private reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  constructor(private publish:(state:State)=>void,private loaded:(controls:SleepControls)=>void,private paused:()=>void,private failed:()=>void){super('sleep');}
  preload(){this.load.image('sleep-cast','/art/chapter-06-sprites.png');this.load.on('loaderror',this.failed);}
  create(){
    if(!this.textures.exists('sleep-cast'))return;
    const walls=this.add.graphics();walls.fillStyle(0x294c5a);walls.lineStyle(1.2,0x527a81);
    MAP.forEach((row,y)=>[...row].forEach((cell,x)=>{if(cell==='#'){walls.fillRoundedRect(x*CELL+2,y*CELL+2,20,20,5);walls.strokeRoundedRect(x*CELL+2,y*CELL+2,20,20,5);}}));
    for(const id of this.model.dots){const [x,y]=id.split(',').map(Number);this.dots.set(id,this.add.circle(x*CELL+12,y*CELL+12,2.6,0xf5dfa8));}
    for(const id of this.model.powers){const [x,y]=id.split(',').map(Number);this.moons.set(id,this.add.container(x*CELL+12,y*CELL+12,[this.add.circle(0,0,8,0x97ded2),this.add.circle(3,-2,5,0x214952)]));}
    this.bed=this.add.rectangle(BED.x*CELL+12,BED.y*CELL+12,22,20,0x8a8d9b);
    this.add.rectangle(BED.x*CELL+12,BED.y*CELL+6,16,5,0xfff7de);
    this.bedLabel=this.add.text(BED.x*CELL+12,BED.y*CELL+14,'600',{fontSize:'8px',color:'#172735'}).setOrigin(.5);
    this.model.enemies.forEach((e,i)=>{
      const body=this.add.rectangle(0,0,20,20,colors[i]).setStrokeStyle(2,0x101e2a);
      const label=this.add.text(0,0,icons[i],{fontFamily:'sans-serif',fontSize:'14px',fontStyle:'bold',color:'#172735'}).setOrigin(.5);
      this.enemyBodies.push(body);this.labels.push(label);this.enemies.push(this.add.container(e.pos.x*CELL+12,e.pos.y*CELL+12,[body,label]));
    });
    this.textures.get('sleep-cast').add('portrait',0,1200,0,240,240);
    this.ring=this.add.circle(0,0,11,0xffe5a9).setStrokeStyle(2,0xfff6dc);
    const portrait=this.add.image(0,0,'sleep-cast','portrait').setDisplaySize(19,19);
    this.direction=this.add.circle(0,-11,2,0xffffff);
    this.player=this.add.container(0,0,[this.ring,portrait,this.direction]).setDepth(5);
    this.input.keyboard?.on('keydown',(e:KeyboardEvent)=>{if(!this.running)return;if(keys[e.code])this.choose(keys[e.code]);if(e.code==='Escape')this.pause();});
    this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(this.running)this.swipe={x:p.x,y:p.y,id:p.id};});
    this.input.on('pointerup',(p:Phaser.Input.Pointer)=>{const start=this.swipe;this.swipe=null;if(!start||start.id!==p.id||!this.running)return;const dx=p.x-start.x,dy=p.y-start.y;if(Math.max(Math.abs(dx),Math.abs(dy))<12)return;this.choose(Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up');});
    this.input.on('pointerupoutside',()=>{this.swipe=null;});
    this.input.on('gameout',()=>{this.swipe=null;});
    this.paint(true);
    this.loaded({choose:d=>this.choose(d),start:retry=>this.start(retry),pause:()=>this.pause()});
  }
  private choose(d:Direction){if(!this.running)return;this.model=turn(this.model,d);this.publish(this.model);}
  private start(retry:boolean){if(retry){this.model=initial();this.lastHud=0;this.paint(true);}this.scene.resume();this.running=true;this.input.keyboard?.addCapture(captured);this.publish(this.model);}
  private pause(){if(!this.running)return;this.running=false;this.swipe=null;this.input.keyboard?.removeCapture(captured);this.scene.pause();this.publish(this.model);this.paused();}
  private move(object:Phaser.GameObjects.Container,x:number,y:number,snap:boolean){
    if(snap){this.tweens.killTweensOf(object);object.setPosition(x,y);return;}
    this.tweens.killTweensOf(object);this.tweens.add({targets:object,x,y,duration:this.reducedMotion?0:90,ease:'Linear'});
  }
  private paint(snap=false,previous?:State){
    const s=this.model;
    const remaining=new Set(s.dots),powers=new Set(s.powers);
    for(const [id,dot] of this.dots)dot.setVisible(remaining.has(id));
    for(const [id,moon] of this.moons)moon.setVisible(powers.has(id));
    this.bed.setFillStyle(s.score>=GOAL?0x8ee2bf:0x8a8d9b);this.bedLabel.setVisible(s.score<GOAL);
    if(snap||!previous||s.pos.x!==previous.pos.x||s.pos.y!==previous.pos.y)this.move(this.player,s.pos.x*CELL+12,s.pos.y*CELL+12,snap||!!previous&&s.lives<previous.lives);
    this.player.setAlpha(s.shield>0?.7:1);this.ring.setStrokeStyle(2,s.quiet>0?0x85ead5:0xfff6dc);
    this.direction.setPosition(s.dir==='left'?-11:s.dir==='right'?11:0,s.dir==='up'?-11:s.dir==='down'?11:0);
    s.enemies.forEach((e,i)=>{const old=previous?.enemies[i];if(snap||!old||e.pos.x!==old.pos.x||e.pos.y!==old.pos.y)this.move(this.enemies[i],e.pos.x*CELL+12,e.pos.y*CELL+12,snap||!!old&&e.wait>old.wait);this.enemies[i].setAlpha(e.wait>0?.4:1);this.enemyBodies[i].setFillStyle(s.quiet>0?0x718ba2:colors[i]);this.labels[i].setText(e.wait>0?String(Math.ceil(e.wait)):icons[i]);});
  }
  update(_time:number,delta:number){
    if(!this.running)return;
    const previous=this.model;this.model=step(previous,Math.min(.05,delta/1000));this.paint(false,previous);
    if(this.model.time-this.lastHud>=.1||this.model.score!==previous.score||this.model.lives!==previous.lives||this.model.status!=='playing'){this.lastHud=this.model.time;this.publish(this.model);}
    if(this.model.status!=='playing'){this.running=false;this.input.keyboard?.removeCapture(captured);this.tweens.killAll();this.paint(true);}
  }
}
