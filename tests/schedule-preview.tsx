// Isolated local Vite preview; does not change saved progress or ship in the build.
import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import ScheduleGame from '../src/schedule/ScheduleGame';
import { ScheduleBrief, ScheduleFacts } from '../src/schedule/ScheduleIntro';
import ScheduleComic from '../src/schedule/ScheduleComic';
import '../src/style.css';
import '../src/shop/shop.css';
function Preview(){
  const [screen,setScreen]=useState('brief');
  useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});},[screen]);
  return <main><nav className="masthead"><b className="wordmark">С НУЛЯ!</b><span>ПРОВЕРКА ГЛАВЫ 08</span></nav>
    {screen==='brief'&&<ScheduleBrief onContinue={()=>setScreen('facts')} onComic={()=>setScreen('comic')}/>}
    {screen==='comic'&&<ScheduleComic onContinue={()=>setScreen('brief')} onExit={()=>setScreen('brief')}/>}
    {screen==='facts'&&<ScheduleFacts onContinue={()=>setScreen('game')} onBack={()=>setScreen('brief')}/>}
    {screen==='game'&&<ScheduleGame onWin={()=>setScreen('won')} onExit={()=>setScreen('brief')}/>}
    {screen==='won'&&<section className="paper-panel"><h1>Всё по расписанию!</h1><p>Время для себя сохранено.</p><button onClick={()=>setScreen('brief')}>К началу</button></section>}
  </main>;
}
const root=createRoot(document.getElementById('root')!);root.render(<Preview/>);
if(import.meta.hot)import.meta.hot.dispose(()=>root.unmount());

