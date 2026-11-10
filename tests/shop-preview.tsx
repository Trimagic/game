// Local Vite fixture. Not an application entry point or a production unlock route.
import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import ShopGame from '../src/shop/ShopGame';
import { ShopBrief, ShopFacts } from '../src/shop/ShopIntro';
import ShopComic from '../src/shop/ShopComic';
import '../src/style.css';
function Preview() {
  const [screen,setScreen]=useState('brief');
  return <main><nav className="masthead"><b className="wordmark game-wordmark"><span>ЕЩЁ ОДИН</span><strong>ГОДИК</strong></b><span>ПРОВЕРКА ГЛАВЫ 03</span></nav>
    {screen==='brief' && <ShopBrief onContinue={()=>setScreen('facts')} onComic={()=>setScreen('comic')}/>}
    {screen==='comic' && <ShopComic onContinue={()=>setScreen('brief')} onExit={()=>setScreen('brief')}/>}
    {screen==='facts' && <ShopFacts onContinue={()=>setScreen('game')} onBack={()=>setScreen('brief')}/>}
    {screen==='game' && <ShopGame onWin={()=>setScreen('won')} onExit={()=>setScreen('brief')}/>}
    {screen==='won' && <section className="paper-panel"><h1>Ужин почти на столе!</h1><p>Покупки собраны в пределах бюджета.</p><button onClick={()=>setScreen('game')}>Ещё раз</button></section>}
  </main>;
}
const root = createRoot(document.getElementById('root')!);
root.render(<Preview/>);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
