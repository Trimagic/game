// Isolated local Vite preview; does not change saved progress or ship in the build.
import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import RunGame from '../src/run/RunGame';
import { RunBrief, RunFacts } from '../src/run/RunIntro';
import RunComic from '../src/run/RunComic';
import '../src/style.css';
import '../src/shop/shop.css';
function Preview(){
  const [screen,setScreen]=useState('brief');
  useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});},[screen]);
  return <main><nav className="masthead"><b className="wordmark">С НУЛЯ!</b><span>ПРОВЕРКА ГЛАВЫ 07</span></nav>
    {screen==='brief'&&<RunBrief onContinue={()=>setScreen('facts')} onComic={()=>setScreen('comic')}/>}
    {screen==='comic'&&<RunComic onContinue={()=>setScreen('brief')} onExit={()=>setScreen('brief')}/>}
    {screen==='facts'&&<RunFacts onContinue={()=>setScreen('game')} onBack={()=>setScreen('brief')}/>}
    {screen==='game'&&<RunGame onWin={()=>setScreen('won')} onExit={()=>setScreen('brief')}/>}
    {screen==='won'&&<section className="paper-panel"><h1>Километр позади!</h1><p>Главное — утро без стресса.</p><button onClick={()=>setScreen('brief')}>К началу</button></section>}
  </main>;
}
const root=createRoot(document.getElementById('root')!);root.render(<Preview/>);
if(import.meta.hot)import.meta.hot.dispose(()=>root.unmount());
