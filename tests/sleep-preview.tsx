// Isolated local Vite preview; does not change saved progress or ship in the build.
import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import SleepGame from '../src/sleep/SleepGame';
import { SleepBrief, SleepFacts } from '../src/sleep/SleepIntro';
import SleepComic from '../src/sleep/SleepComic';
import '../src/style.css';
import '../src/shop/shop.css';
function Preview(){
  const [screen,setScreen]=useState('brief');
  useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});},[screen]);
  return <main><nav className="masthead"><b className="wordmark">С НУЛЯ!</b><span>ПРОВЕРКА ГЛАВЫ 06</span></nav>
    {screen==='brief'&&<SleepBrief onContinue={()=>setScreen('facts')} onComic={()=>setScreen('comic')}/>}
    {screen==='comic'&&<SleepComic onContinue={()=>setScreen('brief')} onExit={()=>setScreen('brief')}/>}
    {screen==='facts'&&<SleepFacts onContinue={()=>setScreen('game')} onBack={()=>setScreen('brief')}/>}
    {screen==='game'&&<SleepGame onWin={()=>setScreen('won')} onExit={()=>setScreen('brief')}/>}
    {screen==='won'&&<section className="paper-panel"><h1>Спокойной ночи!</h1><p>Уведомления подождут до завтра.</p><button onClick={()=>setScreen('brief')}>К началу</button></section>}
  </main>;
}
const root=createRoot(document.getElementById('root')!);root.render(<Preview/>);
if(import.meta.hot)import.meta.hot.dispose(()=>root.unmount());
