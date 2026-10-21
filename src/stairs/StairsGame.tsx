import { useEffect, useRef, useState } from 'react';
import { HEIGHT, FINISH, hazards, initial, platformX, platforms, resume, step } from './model';
import './stairs.css';

function Sprite({ frame, x, y, w = 70, h = 70, flip = false }: { frame: number; x: number; y: number; w?: number; h?: number; flip?: boolean }) {
  const regions = ['50 0 460 580','550 0 490 580','1060 0 450 580','45 595 480 400','560 580 450 440','1060 575 440 449'];
  return <g transform={`translate(${x},${y})${flip ? ` translate(${w},0) scale(-1,1)` : ''}`}><svg width={w} height={h} viewBox={regions[frame]} preserveAspectRatio="xMidYMax meet" overflow="hidden"><image href="/art/chapter-06-sprites.png" width="1536" height="1024"/></svg></g>;
}
export default function StairsGame({ onWin, onExit }: { onWin: () => void; onExit: () => void }) {
  const state = useRef(initial()); const active = useRef(false);
  const keys = useRef(new Set<string>()); const pointers = useRef(new Map<number, number>());
  const [view, setView] = useState(state.current); const [mode, setMode] = useState<'ready' | 'playing' | 'paused'>('ready');
  const [artError, setArtError] = useState(false);
  const facing = useRef(1);
  function nudge(direction: number) {
    if (!active.current) return;
    facing.current = direction;
    state.current = { ...state.current, x: Math.max(18, Math.min(342, state.current.x + direction * 10)) };
    setView(state.current);
  }
  function pause() { if (!active.current) return; active.current = false; keys.current.clear(); pointers.current.clear(); setMode('paused'); }
  function start() { keys.current.clear(); pointers.current.clear(); state.current = resume(state.current); setView(state.current); active.current = true; setMode('playing'); }
  useEffect(() => {
    let frame = 0; let previous = performance.now();
    function animate(now: number) {
      const dt = (now - previous) / 1000; previous = now;
      if (active.current) {
        {
          const left = keys.current.has('ArrowLeft') || keys.current.has('KeyA') || [...pointers.current.values()].includes(-1);
          const right = keys.current.has('ArrowRight') || keys.current.has('KeyD') || [...pointers.current.values()].includes(1);
          const direction = Number(right) - Number(left);
          if (direction) facing.current = direction;
          state.current = step(state.current, direction, Math.min(dt, 0.05) * 0.6); setView(state.current);
          if (state.current.status !== 'playing') { active.current = false; keys.current.clear(); pointers.current.clear(); }
        }
      }
      frame = requestAnimationFrame(animate);
    }
    const down = (e: KeyboardEvent) => { if (['ArrowLeft','ArrowRight','KeyA','KeyD'].includes(e.code) && active.current) { e.preventDefault(); if (!e.repeat && !keys.current.has(e.code)) nudge(e.code==='ArrowLeft'||e.code==='KeyA'?-1:1); keys.current.add(e.code); } if(e.code === 'Escape') pause(); };
    const up = (e: KeyboardEvent) => keys.current.delete(e.code);
    const hidden = () => { if(document.hidden) pause(); };
    window.addEventListener('keydown',down); window.addEventListener('keyup',up); window.addEventListener('blur',pause); document.addEventListener('visibilitychange',hidden);
    frame = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('keydown',down); window.removeEventListener('keyup',up); window.removeEventListener('blur',pause); document.removeEventListener('visibilitychange',hidden); };
  }, []);
  const y = (height: number) => HEIGHT - 60 - (height - view.camera);
  const floor = Math.min(10, 1 + Math.floor(view.high / 400));
  const visible = platforms.filter(p => y(p.y) > -50 && y(p.y) < HEIGHT + 60);
  const overlay = mode !== 'playing' || view.status !== 'playing' || artError;
  return <section className="stairs-game" aria-label="Лифт не для нас">
    <div className="stairs-toolbar"><button className="small-button" onClick={onExit}>← Главы</button><b>ЭТАЖ {floor} / 10</b><button className="small-button" disabled={!active.current} onClick={pause}>Пауза</button></div>
    <div className="stairs-progress" role="progressbar" aria-label="Подъём к квартире" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.min(100, view.high / FINISH * 100))}><span style={{width:`${Math.min(100,view.high / FINISH * 100)}%`}}/></div>
    <div className="stairs-stage">
      <svg className="stairs-world" viewBox="0 0 360 500" role="img" aria-label={`Герой поднимается по лестнице. Этаж ${floor}. Стрелками выбирай площадку.`}>
        <defs><pattern id="stairs-wall" width="60" height="40" patternUnits="userSpaceOnUse"><rect width="60" height="40" fill="#ede0c5"/><path d="M0 40H60M30 0V40" stroke="#d6c4a5" strokeWidth="1"/></pattern></defs>
        <rect width="360" height="500" fill="url(#stairs-wall)"/><rect x="0" width="13" height="500" fill="#235457"/><rect x="347" width="13" height="500" fill="#235457"/>
        {Array.from({length:10},(_,i)=>i).filter(i=>y(i*400)>-100&&y(i*400)<620).map(i=><g key={i} transform={`translate(0,${y(i*400)-85})`}><rect x="143" width="74" height="85" rx="4" fill="#26716e" stroke="#243332" strokeWidth="3"/><rect x="156" y="12" width="48" height="29" fill="#fff1d5"/><text x="180" y="33" textAnchor="middle" fill="#243332" fontSize="20" fontWeight="900">{i+1}</text><circle cx="204" cy="60" r="3" fill="#f2bc61"/><path d="M20 68H125M235 68H340" stroke="#b8a682" strokeWidth="4"/></g>)}
        {visible.map(p=><g key={p.id} transform={`translate(${platformX(p,view.time)-p.w/2},${y(p.y)})`}>
          <rect width={p.w} height="12" rx="3" fill={p.kind==='spring'?'#ed8547':p.kind==='rest'?'#7ab6a0':p.kind==='moving'?'#f2c657':'#537878'} stroke="#243332" strokeWidth="2"/>
          <path d={`M4 13H${p.w-4}`} stroke="#243332" strokeWidth="3"/>
          {p.kind==='spring'&&<path d={`M${p.w/2-9} 0l18-6-18-6 18-6-18-6h18`} stroke="#243332" strokeWidth="3" fill="none"/>}
          {p.kind==='moving'&&<text x={p.w/2} y="10" textAnchor="middle" fontSize="13" fill="#243332">↔</text>}
          {p.kind==='rest'&&<><path d="M14 0v-32h30v18H14" fill="#ed8547" stroke="#243332" strokeWidth="2"/><text x={p.w/2} y="-12" textAnchor="middle" fontSize="11" fontWeight="900" fill="#243332">ПЕРЕДЫШКА · {p.y===1200?'4':'7'} ЭТАЖ</text></>}
        </g>)}
        {hazards(view.time).filter(o=>y(o.y)>-60&&y(o.y)<560).map((o,i)=>o.kind==='door'?<g key={`h${i}`} transform={`translate(${o.x<180?12:300},${y(o.y)-55})`}><rect width={o.active?48:12} height="72" fill={o.active?'#dd824c':'#577775'} stroke={o.warning?'#ffae30':'#243332'} strokeWidth={o.warning?5:2}/>{o.warning&&<text x="24" y="-8" textAnchor="middle" fontWeight="900" fill="#a33b27">!</text>}</g>:<Sprite key={`h${i}`} frame={o.kind==='cat'?3:4} x={o.x-25} y={y(o.y)-30} w={50} h={50}/>)}
        {y(FINISH)>-120&&<Sprite frame={5} x={225} y={y(FINISH)-110} w={110} h={110}/>}
        <g opacity={view.invincible>0&&Math.floor(view.time*12)%2===0?0.55:1}><ellipse cx={view.x} cy={y(view.y)+3} rx="19" ry="4" fill="#243332" opacity=".15"/><Sprite frame={view.status==='rest'||view.status==='won'?2:view.vy>0?0:1} x={view.x-36} y={y(view.y)-69} w={72} h={72} flip={facing.current<0}/></g>
      </svg>
      <img className="stairs-preload" src="/art/chapter-06-sprites.png" alt="" onError={()=>{pause();setArtError(true);}}/>
      {overlay&&<div className="stairs-overlay"><div className="paper-panel" role="dialog" aria-modal="true" aria-label="Подъём по лестнице">
        <span className="eyebrow">ЛИФТ НЕ ДЛЯ НАС / 06</span><h2>{artError?'Не загрузился герой':view.status==='won'?'Десятый. Дошли!':view.status==='rest'?'Можно выдохнуть.':view.status==='fallen'?'Перила выручили.':mode==='paused'?'Лестница подождёт.':'Арбуз с нами?'}</h2>
        <p>{artError?'Вернись к главам и попробуй открыть игру снова.':view.status==='won'?`Прыжков: ${view.bounces}. Возвращений: ${view.falls}. Отлично. Ключи остались в машине.`:view.status==='rest'?`Контрольная точка: ${view.checkpoint===1200?4:7}-й этаж. После падения вернёшься сюда.`:view.status==='fallen'?`Продолжим с ${1+view.checkpoint/400}-го этажа. Попытки не ограничены.`:mode==='paused'?'Время остановлено. Движение продолжится только после нажатия кнопки.':'Прыжки автоматические. Удерживай ← / → или кнопки, чтобы попадать на площадки. Первый шаг — налево.'}</p>
        {!artError&&<button autoFocus onClick={view.status==='won'?onWin:start}>{view.status==='won'?'К квартире →':mode==='ready'?'Начать подъём':view.status==='fallen'?'Попробовать снова':'Продолжить'}</button>}<button className="text-button" onClick={onExit}>К главам</button>
      </div></div>}
    </div>
    <p className="stairs-caption" aria-live="polite">{view.message}</p>
    <div className="stairs-controls">{[-1,1].map(dir=><button key={dir} aria-label={dir<0?'Двигаться влево':'Двигаться вправо'} disabled={overlay} onContextMenu={e=>e.preventDefault()}
      onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);pointers.current.set(e.pointerId,dir);nudge(dir);}}
      onPointerUp={e=>pointers.current.delete(e.pointerId)} onPointerCancel={e=>pointers.current.delete(e.pointerId)}
      onKeyDown={e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();if(!e.repeat)nudge(dir);keys.current.add(dir<0?'ArrowLeft':'ArrowRight');}}} onKeyUp={e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();keys.current.delete(dir<0?'ArrowLeft':'ArrowRight');}}}
    >{dir<0?'← ВЛЕВО':'ВПРАВО →'}</button>)}</div>
    <p className="control-hint">Удерживай направление · ⚑ {view.checkpoint?`${1+view.checkpoint/400}-й этаж`:'пока без контрольной точки'}</p>
  </section>;
}
