// Isolated local Vite preview; does not change saved progress or ship in the build.
import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import GymGame from '../src/gym/GymGame';
import { GymBrief, gymComicStyle, gymPanels } from '../src/gym/GymIntro';
import '../src/style.css';
import '../src/shop/shop.css';
function Preview(){
  const [screen,setScreen]=useState('brief');const [panel,setPanel]=useState(0);
  useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});},[screen,panel]);
  return <main><nav className="masthead"><b className="wordmark">С НУЛЯ!</b><span>ПРОВЕРКА ГЛАВЫ 05</span></nav>
    {screen==='brief'&&<GymBrief onContinue={()=>setScreen('game')} onComic={()=>{setPanel(0);setScreen('comic');}}/>}
    {screen==='comic'&&<section className="comic-reader"><div className="comic-panel" style={gymComicStyle(panel)}><span className="narration">{gymPanels[panel].title}</span><div className="speech">{gymPanels[panel].words}</div></div><button onClick={()=>panel<3?setPanel(panel+1):setScreen('brief')}>Дальше →</button></section>}
    {screen==='game'&&<GymGame onWin={()=>setScreen('won')} onExit={()=>setScreen('brief')}/>}
    {screen==='won'&&<section className="paper-panel"><h1>Три подхода позади!</h1><p>Ритм пойман.</p><button onClick={()=>setScreen('brief')}>К началу</button></section>}
  </main>;
}
const root=createRoot(document.getElementById('root')!);root.render(<Preview/>);
if(import.meta.hot)import.meta.hot.dispose(()=>root.unmount());
