import {guardTouches} from '../arcade/touches';
import {SoundButton,useSound} from '../audio/useSound';
import { useEffect, useRef, useState } from 'react';
import { clock, enemyNames, GOAL, initial, sleepRating, stageAt, STAGES, timeBonus, type Direction } from './model';
import { saveBest } from '../best';
import {sound} from '../audio/sound';
import './sleep.css';
import type { SleepControls } from './SleepScene';
const colors=['#ffbc59','#ef6c70','#b499ef','#6dd4ba'];
const icons=['!','▶','▤','✚'];
export default function SleepGame({onWin,onExit}:{onWin:()=>void;onExit:()=>void}){
  const host=useRef<HTMLDivElement>(null),controls=useRef<SleepControls|null>(null);
  const [view,setView]=useState(initial),[attempt,setAttempt]=useState(0);
  const [mode,setMode]=useState<'loading'|'error'|'ready'|'playing'|'paused'>('loading');
  useSound('sleep',view.status==='playing'?mode:view.status,view.score,view.lives);
  const heard=useRef(view);
  useEffect(()=>{const was=heard.current;heard.current=view;if(view.status!=='playing')return;if((view.quiet>0&&was.quiet<=0)||(view.drowsy>0&&was.drowsy<=0))sound.fx('powerup');if(view.caught>was.caught)sound.fx('coin');if(view.yawns>was.yawns)sound.fx('ding');if(stageAt(view.score)>stageAt(was.score))sound.fx('alarm');},[view]);
  function choose(d:Direction){controls.current?.choose(d);}
  function pause(){controls.current?.pause();}
  function start(retry=false){controls.current?.start(retry);setMode('playing');}
  useEffect(()=>{
    let disposed=false;let game:import('phaser').Game|undefined;const unguard=host.current?guardTouches(host.current,()=>game?.input?.pointers):()=>{};
    setMode('loading');setView(initial());
    const hide=()=>{if(document.hidden)controls.current?.pause();};
    const blur=()=>controls.current?.pause();
    window.addEventListener('blur',blur);document.addEventListener('visibilitychange',hide);
    void Promise.all([import('phaser'),import('./SleepScene')]).then(([{default:Phaser},{default:SleepScene}])=>{
      if(disposed)return;
      const scene=new SleepScene(s=>{if(!disposed)setView(s);},c=>{if(!disposed){controls.current=c;setMode('ready');}},()=>{if(!disposed)setMode('paused');},()=>{if(!disposed)setMode('error');});
      game=new Phaser.Game({type:Phaser.AUTO,parent:host.current!,width:360,height:360,backgroundColor:'#172735',scene,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},input:{activePointers:2,keyboard:{capture:[]}},render:{antialias:true}});
    }).catch(()=>{if(!disposed)setMode('error');});
    return()=>{disposed=true;unguard();controls.current=null;game?.destroy(true);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',hide);};
  },[attempt]);
  const [record,setRecord]=useState<{best:number;record:boolean}|null>(null);
  useEffect(()=>{if(view.status==='won')setRecord(saveBest('sleep-best',view.points));else if(view.status==='playing')setRecord(null);},[view.status,view.points]);
  const stars=sleepRating(view);
  const ready=view.score>=GOAL;
  const overlay=mode!=='playing'||view.status!=='playing';
  const stage=ready?'СВЕТ ВЫКЛЮЧЕН: К КРОВАТИ!':STAGES[stageAt(view.score)].name;
  return <section className={`sleep-game ${view.quiet>0?'quiet':''}`} aria-label="Ещё пять минут"><SoundButton/>
    <div className="sleep-toolbar"><button className="small-button" onClick={onExit}>← Главы</button><span>{clock(view.time)} · {stage}</span><button className="small-button" onClick={pause} disabled={overlay}>Пауза</button></div>
    <div className="sleep-hud"><div><small>ОЧКИ СНА</small><strong>{view.score}<i> / {GOAL}</i></strong></div><div><small>БОНУС · ЗЕВОК {view.streak%8}/8</small><strong>+{view.bonus}</strong></div><div><small>НЕ ОТВЛЕЧЬСЯ</small><strong aria-label={`Осталось попыток: ${view.lives}`}>{'♥'.repeat(view.lives)}{'♡'.repeat(3-view.lives)}</strong></div></div>
    <div className="sleep-meter" role="progressbar" aria-label="Накопленный сон" aria-valuemin={0} aria-valuemax={GOAL} aria-valuenow={Math.min(GOAL,view.score)}><span style={{width:`${Math.min(100,view.score/GOAL*100)}%`}}/></div>
    <div className="sleep-board">
      <div ref={host} className="sleep-phaser" role="img" aria-label="Ночной лабиринт. Кровать наверху, герой начинает снизу. Собирай искры и избегай четырёх экранов."/>
      {overlay&&<div className="sleep-overlay"><div role="dialog" aria-modal="true" aria-label="Сонный лабиринт"><span className="eyebrow">ЕЩЁ ПЯТЬ МИНУТ / 06</span><h2>{mode==='loading'?'Гасим свет…':mode==='error'?'Лабиринт не загрузился.':view.status==='won'?`${'★'.repeat(stars)}${'☆'.repeat(3-stars)} Уснул в ${clock(view.time)}`:view.status==='lost'?'Уже утро?..':mode==='paused'?'Пауза без уведомлений.':'Последний ролик?'}</h2><p>{mode==='loading'?'Готовим ночной лабиринт.':mode==='error'?'Попробуй загрузить игру ещё раз.':view.status==='won'?`${view.points} очков: сон ${view.score}, бонусы +${view.bonus} (зевков ${view.yawns}, экранов отправлено спать ${view.caught}), ранний отбой +${timeBonus(view.time)}. ${record?.record?'Новый личный рекорд!':record?`Рекорд: ${record.best}.`:''} Все экраны подождут до завтра.`:view.status==='lost'?`Собрано ${view.score} очков. Три отвлечения — и ночь ушла. Попробуй использовать луны «Не беспокоить».`:mode==='paused'?'Герой и преследователи остановлены. Можно выдохнуть.':`Собери ${GOAL} очков и доберись до кровати наверху. Свайп, нажатие в нужную сторону, кнопки или стрелки. Герой идёт сам. С каждым этапом ночь сложнее.`}</p><button autoFocus disabled={mode==='loading'} onClick={()=>mode==='error'?setAttempt(n=>n+1):view.status==='won'?onWin():start(view.status==='lost')}>{mode==='loading'?'Загрузка…':mode==='error'?'Повторить загрузку':view.status==='won'?'Спокойной ночи →':view.status==='lost'?'Ещё попытка':mode==='paused'?'Продолжить':'Выключить свет'}</button><button className="text-button" onClick={onExit}>К главам</button></div></div>}
    </div>
    <div className="sleep-status" aria-live="polite">{view.quiet>0?`☾ НЕ БЕСПОКОИТЬ · ${Math.ceil(view.quiet)} с`:view.drowsy>0?`☕ ЭКРАНЫ ЗАСЫПАЮТ · ${Math.ceil(view.drowsy)} с`:view.message}</div>
    <div className="sleep-legend">{enemyNames.map((name,i)=><span key={name}><b style={{background:colors[i]}}>{icons[i]}</b>{name}</span>)}</div>
    <div className="sleep-dpad" aria-label="Направление движения">{(['up','left','down','right'] as Direction[]).map((d,i)=><button key={d} className={`direction-${d} ${view.queued===d?'selected':''}`} aria-label={['Вверх','Влево','Вниз','Вправо'][i]} disabled={overlay} onPointerDown={e=>{e.preventDefault();choose(d);}} onClick={()=>choose(d)}>{['↑','←','↓','→'][i]}</button>)}</div>
    <p className="control-hint">Поворот можно задать заранее · Esc — пауза</p>
  </section>;
}

