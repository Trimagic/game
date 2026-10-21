// Local Vite fixture. Not an application entry point or a production unlock route.
import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import ShopGame from '../src/shop/ShopGame';
import { ShopBrief, shopPanels, shopComicStyle } from '../src/shop/ShopIntro';
import '../src/style.css';
function Preview() {
  const [screen,setScreen]=useState('brief');
  const [panel,setPanel]=useState(0);
  return <main><nav className="masthead"><b className="wordmark">С НУЛЯ!</b><span>ПРОВЕРКА ГЛАВЫ 03</span></nav>
    {screen==='brief' && <ShopBrief onContinue={()=>setScreen('game')} onComic={()=>setScreen('comic')}/>}
    {screen==='comic' && <><div className="comic-panel" style={shopComicStyle(panel)}><span className="narration">{shopPanels[panel].title}</span><div className="speech">{shopPanels[panel].words}</div></div><button onClick={()=>panel<3?setPanel(panel+1):setScreen('brief')}>Дальше →</button></>}
    {screen==='game' && <ShopGame onWin={()=>setScreen('won')} onExit={()=>setScreen('brief')}/>}
    {screen==='won' && <section className="paper-panel"><h1>Ужин почти на столе!</h1><p>Покупки собраны в пределах бюджета.</p><button onClick={()=>setScreen('game')}>Ещё раз</button></section>}
  </main>;
}
const root = createRoot(document.getElementById('root')!);
root.render(<Preview/>);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
