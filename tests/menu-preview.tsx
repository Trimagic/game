// Isolated menu states: does not read or mutate the player's saved progress.
import {createRoot} from 'react-dom/client';
import {useState} from 'react';
import MainMenu from '../src/MainMenu';
import '../src/style.css';
function Preview(){const [completed,setCompleted]=useState(0);const [opened,setOpened]=useState('');return <main><nav>{[0,5,10,11].map(n=><button key={n} onClick={()=>setCompleted(n)}>Прогресс {n}</button>)}</nav><p role="status">{opened}</p><MainMenu completed={completed} busy={false} isTelegram={false} onOpen={id=>setOpened(`Открыта глава ${id}`)}/></main>}
createRoot(document.getElementById('root')!).render(<Preview/>);
