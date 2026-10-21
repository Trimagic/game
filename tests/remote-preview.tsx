import {createRoot} from 'react-dom/client';
import {useState} from 'react';
import RemoteChapter from '../src/remote/RemoteChapter';
import '../src/style.css';
function Preview(){const [key,setKey]=useState(0),[done,setDone]=useState(false);return <main><nav className="masthead"><b>С НУЛЯ!</b><span>ПРОВЕРКА ГЛАВЫ 09</span></nav>{done?<section className="paper-panel"><h1>Пульт потерян.</h1><p>Глава завершена. Это часть истории.</p><button onClick={()=>{setKey(k=>k+1);setDone(false);}}>Начать заново</button></section>:<RemoteChapter key={key} onComplete={()=>setDone(true)} onExit={()=>setKey(k=>k+1)}/>}</main>;}const root=createRoot(document.getElementById('root')!);root.render(<Preview/>);if(import.meta.hot)import.meta.hot.dispose(()=>root.unmount());
