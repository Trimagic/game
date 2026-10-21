import Phaser from 'phaser';
import type {ArcadeEvents,ArcadeView} from './types';
export default abstract class SceneBase extends Phaser.Scene{
 protected running=false;
 protected root!:Phaser.GameObjects.Container;
 protected view:ArcadeView={title:'',detail:'',status:'ready',actions:[]};
 protected reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 constructor(key:string,protected bridge:ArcadeEvents){super(key);}
 protected setup(){
  this.root=this.add.container(0,0);this.input.dragDistanceThreshold=8;
  this.bridge.ready({start:()=>{this.running=true;this.scene.resume();this.view.status='playing';this.sync();},pause:()=>this.pause(),action:id=>{if(this.running)this.action(id);}});
  this.input.keyboard?.on('keydown',(e:KeyboardEvent)=>{if(!this.running||e.repeat)return;if(e.code==='Escape')this.pause();else this.key(e);});
  this.bridge.publish(this.view);
 }
 protected pause(){if(!this.running)return;this.running=false;this.scene.pause();this.bridge.publish({...this.view,status:'paused',title:'Можно выдохнуть.',detail:'Игра и таймер остановлены. Продолжим, когда будешь готов.'});}
 protected finish(won:boolean,title:string,detail:string){this.running=false;this.view={title,detail,status:won?'won':'lost',actions:[]};this.bridge.publish(this.view);}
 protected clear(){this.root.removeAll(true);}
 protected box(x:number,y:number,w:number,h:number,color:number,stroke=0x293a34){const r=this.add.rectangle(x,y,w,h,color).setStrokeStyle(2,stroke);this.root.add(r);return r;}
 protected text(x:number,y:number,text:string,size=14,color='#293a34',center=false){const t=this.add.text(x,y,text,{fontFamily:'Arial, sans-serif',fontSize:`${size}px`,fontStyle:'bold',resolution:2,color,wordWrap:{width:380},align:center?'center':'left'});if(center)t.setOrigin(.5);this.root.add(t);return t;}
 protected button(x:number,y:number,w:number,h:number,label:string,action:()=>void,color=0xe9bb6e){const b=this.box(x,y,w,h,color).setInteractive({useHandCursor:true});this.text(x,y,label,12,'#293a34',true);b.on('pointerup',()=>{if(this.running)action();});return b;}
 protected image(x:number,y:number,key:string,frame:string|number,w:number,h:number){const i=this.add.image(x,y,key,frame);i.setScale(Math.min(w/i.width,h/i.height));this.root.add(i);return i;}
 protected pop(x:number,y:number,label:string,color='#286b56'){const t=this.add.text(x,y,label,{fontFamily:'Arial',fontSize:'17px',fontStyle:'bold',color,backgroundColor:'#fff5dd',padding:{x:6,y:4}}).setOrigin(.5).setDepth(50);this.tweens.add({targets:t,y:y-30,alpha:0,duration:this.reduced?200:850,onComplete:()=>t.destroy()});}
 protected abstract key(e:KeyboardEvent):void;
 protected abstract sync():void;
 abstract action(id:string):void;
}
