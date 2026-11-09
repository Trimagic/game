import {useState} from 'react';
import NightComic from './NightComic';
import './epilogue.css';
const moods=[
 {label:'Вечер без подвигов',line:'Бургер тёплый. Матч найден. Никто не считает повторения.',stamp:'ОТДЫХ ОДОБРЕН'},
 {label:'Фикус на каникулах',line:'Фикус полит по инструкции. У него тоже сегодня выходной.',stamp:'ФИКУС СПАСЁН'},
 {label:'Пульт без конкурентов',line:'Канал выбираешь ты. Бабушка временно занята другим сериалом.',stamp:'ПУЛЬТ ВЕРНУЛСЯ'},
];
export function Celebration({onComplete,onReplay,busy=false}:{onComplete:()=>void;onReplay:()=>void;busy?:boolean}){
 const [mood,setMood]=useState(0);
 return <section className="finale-ticket" aria-labelledby="finale-title">
  <div className="finale-kicker"><span>С НУЛЯ! / ТИТРЫ</span><strong>11 / 11</strong></div>
  <div className="finale-art">
   <svg viewBox="0 0 440 260" role="img" aria-label="Шуточный герб счастливого вечера: коронованный бургер, геймпад и золотые лавры" className="finale-emblem">
    <defs><pattern id="finale-dots" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#355750" opacity=".16"/></pattern></defs>
    <path d="M25 84L53 71 45 38 82 46 96 18 123 38 157 13 173 38 220 9 249 37 283 17 302 39 341 20 348 51 389 43 386 76 419 90 395 119 418 151 384 162 386 200 347 195 327 227 297 210 271 243 245 222 212 250 186 223 150 241 134 217 96 229 89 200 50 207 54 172 22 161 43 126Z" fill="#f0c758" stroke="#263d38" strokeWidth="3"/>
    <ellipse cx="220" cy="127" rx="157" ry="102" fill="#fbf1d6" stroke="#263d38" strokeWidth="2"/><ellipse cx="220" cy="127" rx="157" ry="102" fill="url(#finale-dots)"/>
    <g className="finale-laurel" fill="#5d917b" stroke="#263d38" strokeWidth="2"><path d="M112 194Q53 144 104 72" fill="none" strokeWidth="4"/><path d="M88 169Q54 169 56 142Q85 143 88 169M79 140Q51 130 63 105Q91 117 79 140M86 110Q68 88 88 69Q107 93 86 110M101 87Q88 61 112 49Q123 75 101 87"/><path d="M328 194Q387 144 336 72" fill="none" strokeWidth="4"/><path d="M352 169Q386 169 384 142Q355 143 352 169M361 140Q389 130 377 105Q349 117 361 140M354 110Q372 88 352 69Q333 93 354 110M339 87Q352 61 328 49Q317 75 339 87"/></g>
    <g stroke="#263d38" strokeWidth="3" strokeLinejoin="round"><path d="M182 66L170 34 198 49 218 22 240 49 268 34 256 66Z" fill="#ec8950"/><path d="M169 117Q170 71 220 71Q270 71 271 117Z" fill="#e9a357"/><path d="M167 120Q179 111 191 120T215 120T239 120T273 120L270 132H170Z" fill="#6b9b63"/><rect x="169" y="132" width="102" height="15" rx="7" fill="#8b5032"/><path d="M171 147H270Q268 165 253 166H187Q172 165 171 147Z" fill="#e9a357"/><path d="M171 146L193 157 210 146" fill="#f6d269"/></g>
    <g stroke="#fff4d8" strokeWidth="3" strokeLinecap="round"><path d="M191 96l5 -3m20 -7l5 2m17 6l5 3"/></g>
    <g className="finale-pad" stroke="#263d38" strokeWidth="3"><path d="M174 158Q153 156 144 178L134 207Q130 225 146 226Q154 226 170 207H270Q286 226 294 226Q309 224 306 208L296 178Q288 155 266 158Z" fill="#dae6d9"/><path d="M159 186h25m-12 -12v25" strokeWidth="6" strokeLinecap="round"/><circle cx="274" cy="179" r="5" fill="#e67949"/><circle cx="287" cy="192" r="5" fill="#dcb33d"/><circle cx="261" cy="192" r="5" fill="#5d917b"/><path d="M209 183h22" strokeWidth="4" strokeLinecap="round"/></g>
    <g className="finale-sparks" fill="#e4784b" stroke="#263d38" strokeWidth="1.5"><path d="M37 30l4 9 10 2 -8 6 1 10 -8 -6 -10 3 4 -10 -5 -8 10 1Z"/><path d="M402 26l3 8 9 1 -7 6 1 9 -7 -5 -8 3 3 -8 -5 -7 8 1Z"/><path d="M19 210l8 -3 4 8 -8 3Z"/><path d="M407 210l9 -3 4 9 -9 3Z"/></g>
   </svg>
   <span className="finale-sticker">ДОСТИЖЕНИЕ<br/><b>ПРОСТО ЖИТЬ</b></span>
  </div>
  <div className="finale-copy"><span className="finale-overline">ДИПЛОМ ПО ВЫЖИВАНИЮ В САМОРАЗВИТИИ</span><h1 id="finale-title">Поздравляем.<br/><em>Вы — живой!</em></h1><p className="finale-lead">Один велосипед. Один очень длинный сон.<br/>И наконец — вечер по собственному желанию.</p></div>
  <div className="finale-achievements" aria-label="Достижения истории"><span><b>11</b> глав пережито</span><span><b>40</b> лет приснилось</span><span><b>1</b> фикус потрясён</span></div>
  <div className="finale-route" aria-label="Пройдено одиннадцать глав">{Array.from({length:11},(_,i)=><span key={i}>{String(i+1).padStart(2,'0')}</span>)}</div>
  <div className="finale-evening" aria-live="polite" aria-atomic="true"><span className="finale-stamp">{moods[mood].stamp}</span><strong>{moods[mood].label}</strong><p>{moods[mood].line}</p><button className="text-button" onClick={()=>setMood(i=>(i+1)%moods.length)}>Ещё один хороший вариант ↻</button></div>
  <p className="finale-wish">Пусть в жизни будет больше радости,<br/>а обязательных квестов — поменьше.</p>
  <div className="finale-actions"><button disabled={busy} onClick={onComplete}>{busy?'Сохраняем финал…':'Сохранить победу и выдохнуть →'}</button><button className="text-button" disabled={busy} onClick={onReplay}>Ещё раз увидеть этот поворот</button></div>
  <div className="finale-footer"><span>РАСПИСАНИЕ НА ЗАВТРА: ПОЖИВЁМ — УВИДИМ</span><b>КОНЕЦ!</b></div>
 </section>;
}
export default function Epilogue({onComplete,onExit,busy=false}:{onComplete:()=>void;onExit:()=>void;busy?:boolean}){
 const [finished,setFinished]=useState(false);
 return finished?<Celebration onComplete={onComplete} onReplay={()=>{window.scrollTo({top:0,behavior:"instant"});setFinished(false);}} busy={busy}/>:<NightComic variant="epilogue" busy={busy} onExit={onExit} onContinue={()=>{window.scrollTo({top:0,behavior:'instant'});setFinished(true);}}/>;
}
