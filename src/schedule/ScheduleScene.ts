import Phaser from 'phaser';
import SceneBase from '../arcade/SceneBase';
import type {ArcadeEvents} from '../arcade/types';
import {cells,ghost,GOAL,names,planAction,planInitial,planTick,interval,type PlanAction} from './tetris';
const palette=[0x6dbebc,0xe1b965,0xc394ae,0x84b287,0xe59370,0x8ca9c9,0xc8b17c];
const actions:PlanAction[]=['left','rotate','right','down','drop','skip'];
export default class ScheduleScene extends SceneBase{
 private model=planInitial();private ink!:Phaser.GameObjects.Graphics;private hud!:Phaser.GameObjects.Text;private detail!:Phaser.GameObjects.Text;private current!:Phaser.GameObjects.Text;private next!:Phaser.GameObjects.Text;private note!:Phaser.GameObjects.Text;private published=0;
 constructor(events:ArcadeEvents){super('schedule',events);}
 create(){this.view={status:'ready',title:'Впихнуть невпихуемое.',detail:'Дела падают сверху. Двигай и поворачивай фигуры, заполняй линии без дыр. Семь линий — неделя организованной жизни! Контур показывает место приземления. Один раз можно перенести фигуру на завтра.',actions:[]};this.setup();
  this.box(210,31,420,62,0x274e49);this.hud=this.text(14,14,'',15,'#fff3d6');this.ink=this.add.graphics();
  this.text(297,81,'СЕЙЧАС',10);this.current=this.text(297,100,'',14);this.text(297,148,'ДАЛЬШЕ',10);this.next=this.text(297,218,'',12);this.detail=this.text(297,260,'',11);this.detail.setWordWrapWidth(108);
  this.note=this.text(210,485,'',12,'#29473e',true);this.note.setWordWrapWidth(390);
  const buttons:[PlanAction,string][]=[['left','←'],['rotate','↻'],['right','→'],['down','↓'],['drop','СБРОС']];buttons.forEach(([id,label],i)=>this.button(43+i*83,534,76,40,label,()=>this.action(id),id==='drop'?0xeeb66f:0xbcd7ca));
  this.input.keyboard?.on('keydown',(e:KeyboardEvent)=>{if(this.running&&e.repeat&&['ArrowLeft','ArrowRight','ArrowDown'].includes(e.code)){e.preventDefault();this.action(e.code==='ArrowLeft'?'left':e.code==='ArrowRight'?'right':'down');}});this.paint();}
 protected key(e:KeyboardEvent){const map:Record<string,PlanAction>={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'rotate',KeyW:'rotate',ArrowDown:'down',KeyS:'down',Space:'drop',KeyC:'skip'};const a=map[e.code];if(a){if(e.code==='Space'&&e.target instanceof HTMLButtonElement)return;e.preventDefault();this.action(a);}}
 action(id:string){if(!this.running||!actions.includes(id as PlanAction))return;const old=this.model;this.model=planAction(old,id as PlanAction);this.changed(old.lines);}
 private changed(lines:number){this.paint();if(this.model.lines>lines){this.pop(145,270,`+${this.model.lines-lines} ЛИНИИ`,'#286b56');}if(this.model.status!=='playing'){this.finish(this.model.status==='won',this.model.status==='won'?'Неделя сложилась!':'В сутках не хватило часов.',`${this.model.lines} / ${GOAL} линий · ${this.model.score} очков. ${this.model.status==='won'?'Работа, сон и жизнь наконец поместились.':'Смотри на следующую фигуру и оставляй меньше пустот.'}`);}else this.sync();}
 protected sync(){const s=this.model;this.view={status:'playing',title:`Неделя: ${Math.min(GOAL,s.lines)} / ${GOAL} · ${s.score} очков`,detail:s.message,actions:[{id:'left',label:'← Влево'},{id:'rotate',label:'↻ Повернуть'},{id:'right',label:'Вправо →'},{id:'down',label:'↓ Опустить'},{id:'drop',label:'Сбросить · пробел'},{id:'skip',label:s.skipUsed?'Перенос использован':'Перенести на завтра · C',disabled:s.skipUsed}]};this.bridge.publish(this.view);}
 private paint(){const s=this.model,g=this.ink;g.clear();this.hud.setText(`НЕДЕЛЯ ${Math.min(s.lines,GOAL)} / ${GOAL}    ОЧКИ ${s.score}\nРАСПОРЯДОК ПАДАЕТ. СОБЕРИ ЕГО.`);this.current.setText((s.placed+1)%5===0?'СОЗВОН!':names[s.piece.type]);this.next.setText(names[s.queue[0]]);this.detail.setText(`ТЕМП\n${(1/interval(s)).toFixed(1)} кл/с\n\nЗАВТРА\n${s.skipUsed?'Уже занято':'1 перенос'}\n\nЦЕЛЬ\n7 линий`);this.note.setText(s.message);
  g.fillStyle(0x193e40);g.fillRoundedRect(12,74,272,388,5);for(let y=0;y<16;y++)for(let x=0;x<10;x++){g.lineStyle(1,0x45635d,.5);g.strokeRect(18+x*26,80+y*23,26,23);if(s.board[y][x])this.block(x,y,s.board[y][x]-1);}
  if(s.status==='playing'){for(const [x,y] of cells(ghost(s))){g.lineStyle(2,palette[s.piece.type],.65);g.strokeRoundedRect(20+x*26,82+y*23,22,19,3);}for(const [x,y] of cells(s.piece))this.block(x,y,s.piece.type);}
  for(const [x,y] of cells({type:s.queue[0],rotation:0,x:0,y:0})){g.fillStyle(palette[s.queue[0]]);g.fillRoundedRect(298+x*23,170+y*20,21,18,3);}
  for(let i=0;i<GOAL;i++){g.fillStyle(i<s.lines?0x6eb394:0xd8c8a5);g.fillRoundedRect(298+i*14,443,11,12,2);}
 }
 private block(x:number,y:number,type:number){const g=this.ink;g.fillStyle(palette[type]);g.fillRoundedRect(20+x*26,82+y*23,22,19,3);g.lineStyle(1,0xfff3d4,.6);g.lineBetween(23+x*26,85+y*23,38+x*26,85+y*23);}
 update(_time:number,delta:number){if(!this.running)return;if(delta>500){this.pause();return;}const old=this.model;this.model=planTick(old,delta/1000);this.paint();if(this.model.placed!==old.placed||this.model.status!==old.status)this.changed(old.lines);else{this.published+=delta;if(this.published>200){this.published=0;this.sync();}}}
}
