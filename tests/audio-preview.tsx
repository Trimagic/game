import {createRoot} from 'react-dom/client';
import {useEffect,useState} from 'react';
import {MUSIC,musicStep,gymBeat,type MusicNote} from '../src/audio/music';
import {sound,EFFECTS,type Fx} from '../src/audio/sound';
import {SoundButton,useSound} from '../src/audio/useSound';
import '../src/style.css';
const themes=['bike','pool','shop','cook','gym','sleep','run','schedule','remote','delivery','night'];
const names=['Велосипед','Бассейн','Магазин','Кухня','Спортзал','Сон','Бег','Расписание','Пульт','Доставка','Ночной маршрут'];
async function render(theme:string){
 const pace=theme==='gym'?60/100:30/MUSIC[theme].bpm,seconds=pace*16+1;
 const c=new OfflineAudioContext(1,Math.ceil(seconds*22050),22050);
 const note=(n:MusicNote,t:number)=>{const o=c.createOscillator(),g=c.createGain();o.type=n.type;o.frequency.setValueAtTime(n.hz,t);if(n.endHz)o.frequency.exponentialRampToValueAtTime(n.endHz,t+n.duration);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(n.gain*.18,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+n.duration);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+n.duration+.01);};
 for(let i=0;i<16;i++)for(const n of theme==='gym'?gymBeat(0,i):musicStep(theme,i))note(n,.02+i*pace);
 const data=(await c.startRendering()).getChannelData(0);let peak=0,sum=0;for(const x of data){peak=Math.max(peak,Math.abs(x));sum+=x*x;}
 const rms=Math.sqrt(sum/data.length);return `${theme}: ${rms>.0005&&peak<.95?'OK':'FAIL'} · RMS ${rms.toFixed(4)} · peak ${peak.toFixed(3)}`;
}
function Preview(){
 const [theme,setTheme]=useState('bike'),[playing,setPlaying]=useState(false),[report,setReport]=useState<string[]>([]);
 useSound(theme,playing?'playing':'paused');
 useEffect(()=>{if(theme!=='gym'||!playing)return;let beat=0;const id=setInterval(()=>{for(const n of gymBeat(0,beat++))sound.tone(n.hz,n.duration,n.type,n.gain,0,n.endHz)},600);return()=>clearInterval(id)},[theme,playing]);
 return <main><h1>Звуковая проверка · 11 игр</h1><SoundButton/><p>Выбери тему. Кнопки запускают настоящий игровой аудиодвижок.</p><div style={{display:'flex',flexWrap:'wrap',gap:8}}>{themes.map((t,i)=><button key={t} onClick={()=>{sound.unlock();setTheme(t);setPlaying(true)}}>{i+1}. {names[i]}</button>)}</div><h2>{theme} · {playing?'Играет':'Пауза'}</h2><button onClick={()=>setPlaying(p=>!p)}>{playing?'Пауза':'Продолжить'}</button><h2>Действия</h2><div style={{display:'flex',flexWrap:'wrap',gap:8}}>{Object.keys(EFFECTS).map(fx=><button key={fx} onClick={()=>sound.fx(fx as Fx)}>{fx}</button>)}<button onClick={()=>{setPlaying(false);sound.cue('win')}}>Победа</button><button onClick={()=>{setPlaying(false);sound.cue('lose')}}>Поражение</button></div><h2>Рендер в настоящем Web Audio</h2><button onClick={async()=>{setPlaying(false);setReport(['Проверка…']);const out=[];for(const t of themes)out.push(await render(t));setReport(out)}}>Проверить синтез 11 тем</button><pre role="status">{report.join('\n')}</pre></main>;
}
const root=createRoot(document.getElementById('root')!);root.render(<Preview/>);if(import.meta.hot)import.meta.hot.dispose(()=>root.unmount());
