import {createRoot} from 'react-dom/client';
import {useState} from 'react';
import Epilogue from '../src/night/Epilogue';
import '../src/style.css';
import '../src/night/night.css';
function Preview(){const [version,setVersion]=useState(0),[done,setDone]=useState(false);return <main className="playing-page"><nav className="masthead"><b>С НУЛЯ!</b><span>ПРОВЕРКА ФИНАЛА</span></nav>{done?<section className="paper-panel"><h1>Конец.</h1><p>Предпросмотр завершён. Прогресс основной игры не изменён.</p><button onClick={()=>{setDone(false);setVersion(v=>v+1);}}>Перечитать</button></section>:<Epilogue key={version} onComplete={()=>setDone(true)} onExit={()=>setVersion(v=>v+1)}/>}</main>}
const root=createRoot(document.getElementById('root')!);root.render(<Preview/>);if(import.meta.hot)import.meta.hot.dispose(()=>root.unmount());
