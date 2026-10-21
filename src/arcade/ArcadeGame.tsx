import {useEffect,useRef,useState} from 'react';
import type {ArcadeControls,ArcadeView} from './types';
import './arcade.css';
const blank:ArcadeView={title:'Готовим сцену…',detail:'Загружаем игру и иллюстрации.',status:'loading',actions:[]};
export default function ArcadeGame({kind,onWin,onExit}:{kind:'shop'|'cook'|'gym'|'run'|'schedule'|'remote'|'delivery'|'night';onWin:()=>void;onExit:()=>void}){
 const host=useRef<HTMLDivElement>(null),controls=useRef<ArcadeControls|null>(null);
 const [view,setView]=useState(blank),[attempt,setAttempt]=useState(0);
 useEffect(()=>{
  let disposed=false;let game:import('phaser').Game|undefined;setView(blank);
  const pause=()=>controls.current?.pause();const hidden=()=>{if(document.hidden)pause();};
  window.addEventListener('blur',pause);document.addEventListener('visibilitychange',hidden);
  void Promise.all([import('phaser'),kind==='shop'?import('../shop/ShopScene'):kind==='gym'?import('../gym/GymScene'):kind==='run'?import('../run/RunScene'):kind==='schedule'?import('../schedule/ScheduleScene'):kind==='night'?import('../night/NightScene'):kind==='delivery'?import('../delivery/DeliveryScene'):kind==='remote'?import('../remote/RemoteScene'):import('../cook/CookScene')]).then(([{default:Phaser},{default:Scene}])=>{
   if(disposed)return;
   const scene=new Scene({publish:v=>{if(!disposed)setView(v);},ready:c=>{if(!disposed)controls.current=c;},error:()=>{if(!disposed)setView({...blank,status:'error',title:'Не удалось загрузить игру',detail:'Проверь подключение и попробуй ещё раз.'});}});
   game=new Phaser.Game({type:Phaser.AUTO,parent:host.current!,width:420,height:560,backgroundColor:'#f6ecd4',scene,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},input:{activePointers:2,keyboard:{capture:[]}},render:{antialias:true}});
  }).catch(()=>{if(!disposed)setView({...blank,status:'error',title:'Не удалось загрузить игру',detail:'Попробуй загрузить сцену ещё раз.'});});
  return()=>{disposed=true;controls.current=null;game?.destroy(true);window.removeEventListener('blur',pause);document.removeEventListener('visibilitychange',hidden);};
 },[attempt,kind]);
 const overlay=view.status!=='playing';
 const start=()=>{controls.current?.start();if(kind==='gym')controls.current?.action('unlock');};
 const title=kind==='shop'?'03 / ПРАВИЛЬНАЯ ЗАКУПКА':kind==='gym'?'05 / КАЧАЙ В РИТМ':kind==='run'?'07 / УТРЕННИЙ БЕГ':kind==='schedule'?'08 / РАСПОРЯДОК ДНЯ':kind==='night'?'11 / НОЧНОЙ МАРШРУТ':kind==='delivery'?'10 / ОПЕРАЦИЯ «ОБЕД»':kind==='remote'?'09 / БИТВА ЗА ПУЛЬТ':'04 / ДИЕТИЧЕСКИЙ УЖИН';
 return <section className="arcade-game"><div className="arcade-toolbar"><button className="small-button" onClick={onExit}>← Главы</button><span>{title}</span><button className="small-button" onClick={()=>controls.current?.pause()} disabled={overlay}>Пауза</button></div>
 <div className="arcade-stage"><div ref={host} className="arcade-canvas" role="img" aria-label={kind==='shop'?'Движущаяся лента товаров и корзина покупок':kind==='gym'?'Спортзал: две дорожки ритма, герой и линия попадания':kind==='run'?'Парк: бег, прыжки, препятствия и золотые искры':kind==='schedule'?'Тетрис дел: поле, падающая фигура и следующая фигура':kind==='night'?'Ночной коридор: платформы, препятствия и дверь туалета':kind==='delivery'?'Маршрут к курьеру: герой, стены и зоны обзора персонала':kind==='remote'?'Гостиная: герой с пультом и соперники':'Кухня: нарезка, две конфорки и подача блюда'}/>
 {overlay&&<div className="arcade-overlay"><div role="dialog" aria-modal="true" aria-label={view.title}><span className="eyebrow">С НУЛЯ! / {kind==='shop'?'МАГАЗИН':kind==='gym'?'СПОРТЗАЛ':kind==='run'?'ПРОБЕЖКА':kind==='schedule'?'РАСПОРЯДОК':kind==='night'?'НОЧНОЙ КОРИДОР':kind==='delivery'?'ТАЙНЫЙ ОБЕД':kind==='remote'?'ГОСТИНАЯ':'КУХНЯ'}</span><h2>{view.title}</h2><p>{view.detail}</p>{kind==='gym'&&view.status==='paused'&&<p>Длинную ноту после продолжения зажми снова.</p>}<button autoFocus disabled={view.status==='loading'} onClick={()=>(view.status==='won'||view.status==='story')?onWin():['lost','error'].includes(view.status)?setAttempt(n=>n+1):start()}>{view.status==='loading'?'Загрузка…':view.status==='story'?'Что было дальше →':view.status==='won'?'Завершить главу →':['lost','error'].includes(view.status)?'Попробовать снова →':view.status==='paused'?'Продолжить':'Начать →'}</button><button className="text-button" onClick={onExit}>К главам</button></div></div>}
 </div>
 {kind==='gym'&&<div className="arcade-gym-pads">{[0,1].map(lane=><button key={lane} disabled={overlay} aria-label={lane?'Правая рука':'Левая рука'} onContextMenu={e=>e.preventDefault()}
 onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);controls.current?.action(`down:${lane}:html${e.pointerId}`);}}
 onPointerUp={e=>controls.current?.action(`up:${lane}:html${e.pointerId}`)} onPointerCancel={()=>controls.current?.pause()}
 onKeyDown={e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();if(!e.repeat)controls.current?.action(`down:${lane}:htmlkey`);}}}
 onKeyUp={e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();controls.current?.action(`up:${lane}:htmlkey`);}}}
 onBlur={()=>controls.current?.action(`up:${lane}:htmlkey`)}>{lane?'ПРАВАЯ →':'← ЛЕВАЯ'}<small>{lane?'D / →':'A / ←'}</small></button>)}</div>}
 {kind==='run'&&<div className="arcade-gym-pads">
 <button disabled={overlay} onClick={()=>controls.current?.action('jump')}>Прыжок</button>
 <button disabled={overlay} onContextMenu={e=>e.preventDefault()} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);controls.current?.action(`down:html${e.pointerId}`);}}
 onPointerUp={e=>controls.current?.action(`up:html${e.pointerId}`)} onPointerCancel={()=>controls.current?.pause()}
 onKeyDown={e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();if(!e.repeat)controls.current?.action('down:htmlkey');}}}
 onKeyUp={e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();controls.current?.action('up:htmlkey');}}}
 onBlur={()=>controls.current?.action('up:htmlkey')}>Пригнуться</button></div>}
 {kind==='night'&&<div className="arcade-gym-pads">{(['left','right','jump'] as const).map((dir,i)=><button key={dir} disabled={overlay} onContextMenu={e=>e.preventDefault()} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);controls.current?.action(`down:${dir}:html${e.pointerId}`);}} onPointerUp={e=>controls.current?.action(`up:html${e.pointerId}`)} onPointerCancel={()=>controls.current?.pause()} onKeyDown={e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();if(!e.repeat)controls.current?.action(`down:${dir}:key${dir}`);}}} onKeyUp={e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();controls.current?.action(`up:key${dir}`);}}} onBlur={()=>controls.current?.action(`up:key${dir}`)}>{['←','→','Прыжок'][i]}</button>)}</div>}
 <div className="arcade-copy" role="status"><b>{view.title}</b><p>{view.detail}</p></div><div className="arcade-actions" aria-label="Управление игрой">{view.actions.map(a=><button key={a.id} className="small-button" disabled={overlay||a.disabled} onClick={()=>controls.current?.action(a.id)}>{a.label}</button>)}</div>
 <p className="control-hint">{kind==='shop'?'Товары слева направо: 1–3 · Стоп-лента: пробел · Касса: Enter':kind==='gym'?'Руки: A / D или ← / → · Второе дыхание: пробел · Звук: M':kind==='run'?'Прыжок: пробел / ↑ / W · Пригнуться: ↓ / S · Фокус: F':kind==='schedule'?'← → — движение · ↑ — поворот · ↓ — вниз · Пробел — сброс · C — перенос':kind==='night'?'← → / A D — идти · Пробел / ↑ / W — прыжок':kind==='delivery'?'WASD / стрелки — движение · Отпусти — ждать · Enter — дальше':kind==='remote'?'WASD / стрелки — движение · Пробел — орешек':'Нарезка: пробел · Конфорки: 1 / 2 · Телефон: M'} · Esc — пауза</p></section>;
}



