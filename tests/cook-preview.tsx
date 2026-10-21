// Isolated local Vite preview; does not change saved progress or ship in the build.
import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import CookGame from '../src/cook/CookGame';
import { CookBrief, cookComicStyle, cookPanels } from '../src/cook/CookIntro';
import '../src/style.css';
import '../src/shop/shop.css';
function Preview(){
  const [screen,setScreen]=useState('brief');const [panel,setPanel]=useState(0);
  useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});},[screen,panel]);
  return <main><nav className="masthead"><b className="wordmark">С НУЛЯ!</b><span>ПРОВЕРКА ГЛАВЫ 04</span></nav>
    {screen==='brief'&&<CookBrief onContinue={()=>setScreen('game')} onComic={()=>{setPanel(0);setScreen('comic');}}/>}
    {screen==='comic'&&<section className="comic-reader"><div className="comic-panel" style={cookComicStyle(panel)}><span className="narration">{cookPanels[panel].title}</span><div className="speech">{cookPanels[panel].words}</div></div><button onClick={()=>panel<3?setPanel(panel+1):setScreen('brief')}>Дальше →</button></section>}
    {screen==='game'&&<CookGame onWin={()=>setScreen('won')} onExit={()=>setScreen('brief')}/>}
    {screen==='won'&&<section className="paper-panel"><h1>Мам, теперь я поел!</h1><p>Домашний ужин готов.</p><button onClick={()=>setScreen('brief')}>К началу</button></section>}
  </main>;
}
const root=createRoot(document.getElementById('root')!);root.render(<Preview/>);
if(import.meta.hot)import.meta.hot.dispose(()=>root.unmount());
