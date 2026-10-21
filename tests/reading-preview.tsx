// Exercise the real App readers without changing completion or unlocking chapters.
import {createRoot} from 'react-dom/client';
import {useState} from 'react';
import App from '../src/App';
import '../src/style.css';
type Chapter=1|2|3|4|5|6|7|8|9|10|11;
function Preview(){const [chapter,setChapter]=useState<Chapter>();return chapter?<App initialChapter={chapter}/>:<main className="mobile-qa-menu">{Array.from({length:11},(_,i)=><button key={i} onClick={()=>setChapter(i+1 as Chapter)}>Глава {i+1}</button>)}</main>}
const root=createRoot(document.getElementById('root')!);root.render(<Preview/>);if(import.meta.hot)import.meta.hot.dispose(()=>root.unmount());
