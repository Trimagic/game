// Local QA entry only. Does not unlock chapters or write saved progress.
import {createRoot} from 'react-dom/client';
import {useState,useEffect} from 'react';
import Game from '../src/Game';
import PoolGame from '../src/pool/PoolGame';
import SleepGame from '../src/sleep/SleepGame';
import ArcadeGame from '../src/arcade/ArcadeGame';
import '../src/style.css';
const names=['Велосипед','Бассейн','Закупка','Ужин','Спортзал','Сон','Бег','Расписание','Пульт','Доставка','Ночной маршрут'];
const kinds={3:'shop',4:'cook',5:'gym',7:'run',8:'schedule',9:'remote',10:'delivery',11:'night'} as const;
function Preview(){const [chapter,setChapter]=useState(0);const exit=()=>setChapter(0);useEffect(()=>{window.scrollTo(0,0);},[chapter]);return <main className="playing-page"><nav className="masthead"><b>С НУЛЯ!</b><span>ПРОВЕРКА / {chapter||'11 ИГР'}</span></nav>{!chapter?<section className="mobile-qa-menu">{names.map((name,i)=><button key={name} onClick={()=>setChapter(i+1)}>{i+1}. {name}</button>)}</section>:chapter===1?<Game onWin={exit} onExit={exit}/>:chapter===2?<PoolGame onWin={exit} onExit={exit}/>:chapter===6?<SleepGame onWin={exit} onExit={exit}/>:<ArcadeGame kind={kinds[chapter as keyof typeof kinds]} onWin={exit} onExit={exit}/>}</main>}
const root=createRoot(document.getElementById('root')!);root.render(<Preview/>);if(import.meta.hot)import.meta.hot.dispose(()=>root.unmount());
