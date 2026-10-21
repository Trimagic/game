import {createRoot} from 'react-dom/client';
import {useState} from 'react';
import DeliveryChapter from '../src/delivery/DeliveryChapter';
import '../src/style.css';
function Preview(){const [key,setKey]=useState(0),[done,setDone]=useState(false);return <main className="playing-page"><nav className="masthead"><b>С НУЛЯ!</b><span>ПРОВЕРКА ГЛАВЫ 10</span></nav>{done?<section className="paper-panel"><h1>Брокколи поданы.</h1><p>Глава завершена. Продолжение — в главе 11.</p><button onClick={()=>{setKey(k=>k+1);setDone(false);}}>Начать заново</button></section>:<DeliveryChapter key={key} onComplete={()=>setDone(true)} onExit={()=>setKey(k=>k+1)}/>}</main>;}
const root=createRoot(document.getElementById('root')!);root.render(<Preview/>);if(import.meta.hot)import.meta.hot.dispose(()=>root.unmount());
