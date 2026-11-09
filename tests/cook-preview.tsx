// Isolated local Vite preview; does not change saved progress or ship in the build.
import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import CookGame from '../src/cook/CookGame';
import { CookBrief, CookFacts } from '../src/cook/CookIntro';
import CookComic from '../src/cook/CookComic';
import '../src/style.css';
import '../src/shop/shop.css';
function Preview(){
  const [screen,setScreen]=useState('brief');
  useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});},[screen]);
  return <main><nav className="masthead"><b className="wordmark">С НУЛЯ!</b><span>ПРОВЕРКА ГЛАВЫ 04</span></nav>
    {screen==='brief'&&<CookBrief onContinue={()=>setScreen('facts')} onComic={()=>setScreen('comic')}/>}
    {screen==='comic'&&<CookComic onContinue={()=>setScreen('brief')} onExit={()=>setScreen('brief')}/>}
    {screen==='facts'&&<CookFacts onContinue={()=>setScreen('game')} onBack={()=>setScreen('brief')}/>}
    {screen==='game'&&<CookGame onWin={()=>setScreen('won')} onExit={()=>setScreen('brief')}/>}
    {screen==='won'&&<section className="paper-panel"><h1>Мам, теперь я поел!</h1><p>Домашний ужин готов.</p><button onClick={()=>setScreen('brief')}>К началу</button></section>}
  </main>;
}
const root=createRoot(document.getElementById('root')!);root.render(<Preview/>);
if(import.meta.hot)import.meta.hot.dispose(()=>root.unmount());
