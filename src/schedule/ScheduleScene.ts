import Phaser from 'phaser';
import SceneBase from '../arcade/SceneBase';
import type {ArcadeEvents} from '../arcade/types';
import {haptics} from '../haptics';
import {sound} from '../audio/sound';
import {saveBest} from '../best';
import {cells,dayOf,DAYS,DEADLINE,ghost,GOAL,GUEST,names,planAction,planInitial,planRating,planTick,interval,STAMP,type PlanAction,type PlanGame} from './tetris';
const palette=[0x6dbebc,0xe1b965,0xc394ae,0x84b287,0xe59370,0x8ca9c9,0xc8b17c,0xd9473a];
const actions:PlanAction[]=['left','rotate','right','down','drop','hold','stamp'];
const CELL_W=26,CELL_H=23,LEFT=18,TOP=80;
const REPEATS:PlanAction[]=['left','right','down'];
const REPEAT_DELAY=170,REPEAT_EVERY=55;
export default class ScheduleScene extends SceneBase{
 private model=planInitial();private ink!:Phaser.GameObjects.Graphics;private hud!:Phaser.GameObjects.Text;private current!:Phaser.GameObjects.Text;private next!:Phaser.GameObjects.Text;private later!:Phaser.GameObjects.Text;private pace!:Phaser.GameObjects.Text;private note!:Phaser.GameObjects.Text;private stampLabel!:Phaser.GameObjects.Text;private holdLabel!:Phaser.GameObjects.Text;private published=0;
 private touch:{id:number;x:number;y:number;at:number;moved:boolean}|null=null;
 private repeat:{action:PlanAction;next:number}|null=null;
 constructor(events:ArcadeEvents){super('schedule',events);}
 create(){this.view={status:'ready',title:'Впихнуть невпихуемое.',detail:'Неделя из семи дней, и у каждого свой характер: со среды срочные созвоны, с четверга дедлайны снизу, в субботу гости. Пять разных дел в линии — «Баланс» и отмена встречи. Линия со сном или отдыхом замедляет падение. На телефоне: води пальцем по полю, нажатие поворачивает, резкий свайп вниз ставит.',actions:[]};this.setup();
  this.box(210,31,420,62,0x274e49);this.hud=this.text(14,14,'',15,'#fff3d6');this.ink=this.add.graphics();
  this.text(297,78,'СЕЙЧАС',10);this.current=this.text(297,92,'',13);this.text(297,116,'ДАЛЬШЕ',10);this.next=this.text(297,180,'',11);this.text(297,200,'ЗАВТРА',10);this.later=this.text(297,262,'',11);
  this.pace=this.text(297,376,'',11);
  this.note=this.text(210,510,'',14,'#29473e',true);this.note.setWordWrapWidth(390);
  this.box(348,298,118,36,0xcfe0d6).setInteractive({useHandCursor:true}).on('pointerup',()=>this.action('hold'));this.holdLabel=this.text(348,298,'',11,'#293a34',true);
  this.box(348,340,118,36,0xf0c0a8).setInteractive({useHandCursor:true}).on('pointerup',()=>this.action('stamp'));this.stampLabel=this.text(348,340,'',11,'#293a34',true);
  // Finger on the board: drag steers by whole cells, a tap rotates, a quick flick down drops.
  this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(this.running&&p.x>=12&&p.x<=284&&p.y>=74&&p.y<=462)this.touch={id:p.id,x:p.x,y:p.y,at:this.time.now,moved:false};});
  this.input.on('pointermove',(p:Phaser.Input.Pointer)=>{const t=this.touch;if(!t||t.id!==p.id||!p.isDown||!this.running)return;
   while(p.x-t.x>=CELL_W*.8){t.x+=CELL_W*.8;t.moved=true;this.action('right');}while(t.x-p.x>=CELL_W*.8){t.x-=CELL_W*.8;t.moved=true;this.action('left');}
   while(p.y-t.y>=CELL_H){t.y+=CELL_H;t.moved=true;this.action('down');}});
  const end=(p:Phaser.Input.Pointer)=>{const t=this.touch;this.touch=null;if(!t||t.id!==p.id||!this.running)return;const quick=this.time.now-t.at<260;if(quick&&p.y-p.downY>70&&Math.abs(p.x-p.downX)<60)this.action('drop');else if(!t.moved&&quick)this.action('rotate');};
  this.input.on('pointerup',end);this.input.on('pointerupoutside',()=>{this.touch=null;});
  this.input.keyboard?.on('keydown',(e:KeyboardEvent)=>{if(this.running&&e.repeat&&['ArrowLeft','ArrowRight','ArrowDown'].includes(e.code)){e.preventDefault();this.action(e.code==='ArrowLeft'?'left':e.code==='ArrowRight'?'right':'down');}});this.paint();}
 protected pause(){this.touch=null;this.repeat=null;super.pause();}
 protected key(e:KeyboardEvent){const map:Record<string,PlanAction>={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'rotate',KeyW:'rotate',ArrowDown:'down',KeyS:'down',Space:'drop',KeyC:'hold',KeyX:'stamp'};const a=map[e.code];if(a){if(e.code==='Space'&&e.target instanceof HTMLButtonElement)return;e.preventDefault();this.action(a);}}
 action(id:string){
  if(!this.running)return;
  // Pad buttons act on touch; holding a move button keeps it going, like a held key.
  const [kind,name]=id.split(':');
  if(kind==='release'){if(this.repeat?.action===name)this.repeat=null;return;}
  if(kind==='press'){sound.cue('tap');if(REPEATS.includes(name as PlanAction))this.repeat={action:name as PlanAction,next:this.time.now+REPEAT_DELAY};this.action(name);return;}
  if(!actions.includes(id as PlanAction))return;const old=this.model;this.model=planAction(old,id as PlanAction);this.changed(old);}
 private changed(old:PlanGame){const s=this.model;this.paint();
  if(s.lines>old.lines)this.pop(145,270,`+${s.lines-old.lines} ${s.lines-old.lines>1?'ЛИНИИ':'ЛИНИЯ'}`,'#286b56');
  if(s.news>old.news){const bad=s.flash==='ДЕДЛАЙН!'||s.flash==='ГОСТИ!';this.pop(145,215,s.flash,bad?'#aa4933':'#9b5725',s.lines===old.lines);if(bad){haptics.cue('error');if(!this.reduced)this.cameras.main.shake(130,.005);}}
  if(s.status==='won'){const stars=planRating(s),saved=saveBest('plan-best',s.score);this.finish(true,`${'★'.repeat(stars)}${'☆'.repeat(3-stars)} Неделя сложилась! ${s.score} очков`,`Дел разложено: ${s.placed}. Сбалансированных линий: ${s.balanced}, линий с отдыхом: ${s.rested}. ${saved.record?'Новый личный рекорд!':`Рекорд: ${saved.best}.`} Работа, сон и жизнь наконец поместились.`);}
  else if(s.status==='lost')this.finish(false,'В сутках не хватило часов.',`Дошли до дня «${DAYS[dayOf(s.lines)].name}», ${s.lines} / ${GOAL} линий, ${s.score} очков. Лишнее можно отложить на завтра, а штамп «Отмена» расчищает завал.`);
  else this.sync();}
 protected sync(){const s=this.model;this.view={status:'playing',title:`${DAYS[dayOf(s.lines)].name} · ${Math.min(GOAL,s.lines)} / ${GOAL} · ${s.score} очков`,detail:s.message,actions:[{id:'hold',label:'На завтра · C',disabled:s.held||s.piece.type===STAMP},{id:'stamp',label:`Отмена ×${s.stamps} · X`,disabled:s.stamps===0||s.piece.type===STAMP}]};this.bridge.publish(this.view);}
 private paint(){const s=this.model,g=this.ink,day=dayOf(s.lines);g.clear();
  this.hud.setText(`${DAYS[day].name.toUpperCase()}\nЛИНИИ ${Math.min(s.lines,GOAL)} / ${GOAL}    ОЧКИ ${s.score}`);
  this.current.setText(s.piece.type===STAMP?'ОТМЕНА!':s.urgent?'СОЗВОН!':names[s.piece.type]).setColor(s.urgent||s.piece.type===STAMP?'#c4302b':'#293a34');
  this.next.setText(names[s.queue[0]]);this.later.setText(s.hold===null?'пусто':names[s.hold]);
  this.pace.setText(`${s.slow>0?'ПЕРЕДЫШКА':'ТЕМП'} ${(1/interval(s)).toFixed(1)} кл/с`);this.note.setText(s.message);
  this.holdLabel.setText(s.held?'УЖЕ ПЕРЕНЕСЛИ':s.hold===null?'НА ЗАВТРА · C':'ЗАБРАТЬ · C').setAlpha(s.held?.5:1);
  this.stampLabel.setText(`ОТМЕНА ×${s.stamps} · X`).setAlpha(s.stamps?1:.5);
  g.fillStyle(s.slow>0?0x234f55:0x193e40);g.fillRoundedRect(12,74,272,388,5);
  for(let y=0;y<16;y++)for(let x=0;x<10;x++){g.lineStyle(1,0x45635d,.5);g.strokeRect(LEFT+x*CELL_W,TOP+y*CELL_H,CELL_W,CELL_H);if(s.board[y][x])this.block(x,y,s.board[y][x]);}
  if(s.status==='playing'){
   for(const [x,y] of cells(ghost(s))){g.lineStyle(2,palette[s.piece.type],.65);g.strokeRoundedRect(LEFT+2+x*CELL_W,TOP+2+y*CELL_H,22,19,3);}
   for(const [x,y] of cells(s.piece)){this.block(x,y,s.piece.type+1);if(s.urgent){g.lineStyle(2,0xd9473a,1);g.strokeRoundedRect(LEFT+2+x*CELL_W,TOP+2+y*CELL_H,22,19,3);}}
  }
  this.preview(s.queue[0],130);if(s.hold!==null)this.preview(s.hold,214);
  // One pip per day of the week, lit once that day is done.
  DAYS.forEach((d,i)=>{g.fillStyle(i<day?0x6eb394:i===day?0xeeb66f:0xd8c8a5);g.fillRoundedRect(298+i*16,420,13,22,2);});
  for(let i=0;i<GOAL;i++){g.fillStyle(i<s.lines?0x6eb394:0xd8c8a5);g.fillRect(298+i*9.3,448,7,5);}
 }
 private preview(type:number,top:number){const g=this.ink;for(const [x,y] of cells({type,rotation:0,x:0,y:0})){g.fillStyle(palette[type]);g.fillRoundedRect(298+x*23,top+y*20,21,18,3);}}
 private block(x:number,y:number,value:number){const g=this.ink;const left=LEFT+2+x*CELL_W,top=TOP+2+y*CELL_H;
  const color=value===DEADLINE?0x7a7f86:value===GUEST?0x8d6bb0:palette[value-1];g.fillStyle(color);g.fillRoundedRect(left,top,22,19,3);g.lineStyle(1,0xfff3d4,.6);g.lineBetween(left+3,top+3,left+18,top+3);
  if(value===STAMP+1){g.lineStyle(3,0xfff3d4);g.lineBetween(left+5,top+4,left+17,top+15);g.lineBetween(left+17,top+4,left+5,top+15);}
  if(value===DEADLINE){g.lineStyle(2,0x4a4e54);g.lineBetween(left+4,top+15,left+18,top+6);}
  if(value===GUEST){g.fillStyle(0xfff3d4);g.fillCircle(left+11,top+7,3);g.fillRect(left+7,top+11,8,5);}}
 update(_time:number,delta:number){if(!this.running)return;if(delta>500){this.pause();return;}while(this.repeat&&this.time.now>=this.repeat.next){this.repeat.next+=REPEAT_EVERY;this.action(this.repeat.action);if(!this.running)return;}const old=this.model;this.model=planTick(old,delta/1000);this.paint();if(this.model.placed!==old.placed||this.model.status!==old.status)this.changed(old);else{this.published+=delta;if(this.published>200){this.published=0;this.sync();}}}
}
