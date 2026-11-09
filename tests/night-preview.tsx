import {createRoot} from 'react-dom/client';
import {useState} from 'react';
import NightChapter from '../src/night/NightChapter';
import NightComic from '../src/night/NightComic';
import Epilogue,{Celebration} from '../src/night/Epilogue';
import '../src/style.css';
function Preview(){const [mode,setMode]=useState<'chapter'|'ending'|'epilogue'|'celebration'>(),[done,setDone]=useState(false);return <main className="playing-page"><nav className="masthead"><b className="wordmark">С НУЛЯ!</b><span>ПРОВЕРКА ГЛАВЫ 11</span></nav>{done?<section className="paper-panel"><h1>История сохранена.</h1><button onClick={()=>{setDone(false);setMode(undefined);}}>Начать заново</button></section>:mode==='chapter'?<NightChapter onComplete={()=>setDone(true)} onExit={()=>setMode(undefined)}/>:mode==='ending'?<NightComic variant="outro" onContinue={()=>setMode('epilogue')} onExit={()=>setMode(undefined)}/>:mode==='epilogue'?<Epilogue onComplete={()=>setDone(true)} onExit={()=>setMode(undefined)}/>:mode==='celebration'?<Celebration onComplete={()=>setDone(true)} onReplay={()=>setMode('epilogue')}/>:<section className="paper-panel">{(['chapter','ending','epilogue','celebration'] as const).map((item,i)=><button key={item} onClick={()=>setMode(item)}>{['Начало главы','Финальный комикс','Эпилог','Поздравление'][i]}</button>)}</section>}</main>;}
const root=createRoot(document.getElementById('root')!);root.render(<Preview/>);if(import.meta.hot)import.meta.hot.dispose(()=>root.unmount());
