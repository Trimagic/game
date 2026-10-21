import {useComicFit} from '../useComicFit';
import {useEffect, useState} from 'react';
import './epilogue.css';

const panels = [
  ['Тихий час. Громкие мысли.', 'Герой сидит на краю кровати. За окном прекрасный день. Внутри — тоска.'],
  ['Поговорим о вашем поведении.', 'Врач: «Пульт, доставка, теперь ещё фикус… Вы вообще собираетесь соблюдать распорядок?»'],
  ['Один маленький вопрос.', 'Герой: «Доктор… а долго мне ещё здесь быть?»'],
  ['Постоянный контроль.', 'Врач: «Вы уже в возрасте. Вам нужен постоянный контроль. Так что теперь это ваш дом. Навсегда».'],
  ['И хорошая новость!', 'Врач: «Благодаря правильному образу жизни и питанию проживёте ещё очень долго! А с годами привыкнете к этому месту».'],
  ['Очень. Долго.', 'Герой: «Да вы… охренели?..» Последние слова врача растягиваются в гул. Свет гаснет.'],
  ['Эй. Ты как?', 'Асфальт. Парк. Велосипед рядом. Герой приходит в себя: он упал и ударился головой ещё на своей первой велопрогулке. Всё остальное ему привиделось.'],
  ['Снова с нуля.', 'Он поднимается, пытается прийти в себя и смотрит на свои руки. Молодые. Затем — на велосипед. Кажется, пора сделать правильный выбор.'],
  ['Выбор сделан.', 'Велосипед летит в мусорный контейнер. Шлем — следом. «На сегодня саморазвития достаточно».'],
  ['Новый маршрут.', 'Счастливый герой направляется в Макдональдс. На этот раз никакой брокколи.'],
  ['Планы на вечер.', 'Дома он запускает Call of Duty. В расписании — только одна задача: хорошо провести время.'],
  ['Вот теперь — хорошо.', 'Бургер. Кола. Любимая игра. Герой устраивается поудобнее и впервые за всю эту историю просто счастлив.'],
];

export default function Epilogue({onComplete,onExit,busy=false}:{onComplete:()=>void;onExit:()=>void;busy?:boolean}) {
  const comicRef=useComicFit();
  const [page,setPage]=useState(0);
  useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});},[page]);
  if(page===panels.length)return <section className="paper-panel epilogue-end">
    <span className="eyebrow">С НУЛЯ! / КОНЕЦ</span><h1>Поздравляем!</h1>
    <p className="epilogue-wish">Желаю недолгих, но очень счастливых и радостных лет жизни! )))</p>
    <p>Все 11 глав пройдены. Правильный выбор сделан.</p>
    <button disabled={busy} onClick={onComplete}>{busy?'Сохраняем…':'Завершить историю →'}</button>
    <button className="text-button" disabled={busy} onClick={()=>setPage(0)}>Перечитать финал</button>
  </section>;
  const cell=page%6;
  return <section ref={comicRef} className="comic-reader epilogue-reader">
    <div className="section-heading"><button className="text-button" onClick={onExit}>← К главам</button><span className="eyebrow">ПОСЛЕДНИЙ ПОВОРОТ / {page+1} ИЗ {panels.length}</span></div>
    <div key={page} className={`comic-panel epilogue-panel${page===5?' epilogue-blackout':''}`} style={{backgroundImage:`url('/art/epilogue-${page<6?'doctor':'choice'}.png')`,backgroundPosition:`${(cell%3)*50}% ${cell<3?0:100}%`}} role="img" aria-label={panels[page][0]}><span className="narration">{panels[page][0]}</span></div>
    <p className="night-speech" aria-live="polite">{panels[page][1]}</p>
    <div className="comic-navigation"><button className="small-button" disabled={page===0} onClick={()=>setPage(p=>p-1)}>← Назад</button><button className={page===7?'epilogue-choice':''} onClick={()=>setPage(p=>p+1)}>{page===7?'Сделать правильный выбор':page===5?'Прийти в себя →':page===11?'Финал →':'Дальше →'}</button></div>
  </section>;
}

