// Isolated local Vite preview; does not change saved progress or ship in the build.
import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import GymGame from '../src/gym/GymGame';
import { GymBrief, GymFacts } from '../src/gym/GymIntro';
import GymComic from '../src/gym/GymComic';
import '../src/style.css';
import '../src/shop/shop.css';
function Preview(){
  const [screen,setScreen]=useState('brief');
  useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});},[screen]);
  return <main><nav className="masthead"><b className="wordmark game-wordmark"><span>ЕЩЁ ОДИН</span><strong>ГОДИК</strong></b><span>ПРОВЕРКА ГЛАВЫ 05</span></nav>
    {screen==='brief'&&<GymBrief onContinue={()=>setScreen('facts')} onComic={()=>setScreen('comic')}/>}
    {screen==='comic'&&<GymComic onContinue={()=>setScreen('brief')} onExit={()=>setScreen('brief')}/>}
    {screen==='facts'&&<GymFacts onContinue={()=>setScreen('game')} onBack={()=>setScreen('brief')}/>}
    {screen==='game'&&<GymGame onWin={()=>setScreen('won')} onExit={()=>setScreen('brief')}/>}
    {screen==='won'&&<section className="paper-panel"><h1>Три подхода позади!</h1><p>Ритм пойман.</p><button onClick={()=>setScreen('brief')}>К началу</button></section>}
  </main>;
}
const root=createRoot(document.getElementById('root')!);root.render(<Preview/>);
if(import.meta.hot)import.meta.hot.dispose(()=>root.unmount());
