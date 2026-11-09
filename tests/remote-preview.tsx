import {createRoot} from 'react-dom/client';
import {useState} from 'react';
import RemoteChapter from '../src/remote/RemoteChapter';
import RemoteComic from '../src/remote/RemoteComic';
import '../src/style.css';
function Preview(){
 const [mode,setMode]=useState<'chapter'|'ending'>(),[key,setKey]=useState(0),[done,setDone]=useState(false);
 return <main><nav className="masthead"><b className="wordmark">С НУЛЯ!</b><span>ПРОВЕРКА ГЛАВЫ 09</span></nav>{done?<section className="paper-panel"><h1>Пульт потерян.</h1><p>Глава завершена. Это часть истории.</p><button onClick={()=>{setKey(k=>k+1);setDone(false);setMode(undefined);}}>Начать заново</button></section>:mode==='ending'?<RemoteComic key={key} ending onContinue={()=>setDone(true)} onExit={()=>setMode(undefined)}/>:mode==='chapter'?<RemoteChapter key={key} onComplete={()=>setDone(true)} onExit={()=>setMode(undefined)}/>:<section className="paper-panel"><button onClick={()=>setMode('chapter')}>Начало главы</button><button onClick={()=>setMode('ending')}>Финальный комикс</button></section>}</main>;
}
const root=createRoot(document.getElementById('root')!);root.render(<Preview/>);if(import.meta.hot)import.meta.hot.dispose(()=>root.unmount());
