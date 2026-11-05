// Isolated local Vite preview; does not change saved progress or ship in the build.
import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import Game from '../src/Game';
import '../src/style.css';
function Preview(){
  const [screen,setScreen]=useState('game');
  return <main className="playing-page"><nav className="masthead"><b className="wordmark">С НУЛЯ!</b><span>ПРОВЕРКА ГЛАВЫ 01</span></nav>
    {screen==='game'&&<Game onWin={()=>setScreen('won')} onExit={()=>setScreen('exit')}/>}
    {screen!=='game'&&<section className="paper-panel"><h1>{screen==='won'?'500 м!':'Выход'}</h1><button onClick={()=>setScreen('game')}>Ещё раз</button></section>}
  </main>;
}
const root=createRoot(document.getElementById('root')!);root.render(<Preview/>);
if(import.meta.hot)import.meta.hot.dispose(()=>root.unmount());
