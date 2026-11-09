import { useState } from 'react';
import { END, phases, FEVER_STREAK, BONUS_POINTS } from './model';
import '../bike/bike-intro.css';
import './gym-intro.css';
import './gym.css';

export const gymPanels = [
 {place:'УЖИН ПОЗАДИ · ЗАЛ',title:'Кухню пережил. Теперь — разминка.',words:'Поел нормально. Теперь бы мышцы узнали, что мы начали новую жизнь.',aside:'Сумка лёгкая. Предчувствие — нет.',position:'0% 0%',description:'Герой со спортивной сумкой входит в зал. Позади стойки с гантелями.'},
 {place:'ТРЕНЕР · ВВОДНЫЙ ИНСТРУКТАЖ',title:'«Всего три подхода», — сказал он.',words:'Три подхода. Даже звучит недолго. Почему он так подозрительно улыбается?',aside:'Слово «лёгкий» в договор не попало.',position:'100% 0%',description:'Улыбающийся тренер предлагает герою гантель. Герой задумчиво смотрит на неё.'},
 {place:'ПРИСЕДАНИЯ · ДЕРЖИМ',title:'У тренера свои секунды.',words:'Вниз. Держим… Ещё держим? А можно включить обычную скорость времени?',aside:'Мышцы уже всё поняли.',position:'0% 100%',description:'Герой приседает с гантелью перед грудью, тренер за его спиной отсчитывает время.'},
 {place:'ФИНАЛ · ПОВТОР ПОСЛЕДНЕГО ПОВТОРА',title:'Последний. Версия третья.',words:'«Ещё один» — это число или образ жизни? Последний же уже был!',aside:'Ты управляешь ритмом. Тренер только считает.',position:'100% 100%',description:'Герой выжимает две гантели над головой, а тренер снова показывает один палец.'},
];
export function gymComicStyle(panel:number){const height=panel<2?744:792;return {backgroundImage:'url(/art/chapter-05-comic.png)',backgroundPosition:gymPanels[panel].position,backgroundSize:'200% '+1536/height*100+'%',aspectRatio:'512 / '+height};}

export function GymBrief({onContinue,onComic}:{onContinue:()=>void;onComic:()=>void}){
 return <section className="paper-panel bike-intro training-brief" aria-labelledby="gym-brief-title">
  <header className="bike-intro-heading"><span className="eyebrow">05 / КАЧАЙ В РИТМ</span><span className="bike-intro-step">Как играть · 1/2</span></header>
  <h1 id="gym-brief-title">Поймай ритм.<br/><em>Переживи «ещё один».</em></h1>
  <p className="bike-intro-lead">Дойди до конца и сохрани точность.</p>
  <dl className="bike-ride-stats" aria-label="Условия тренировки"><div><dt>Подхода</dt><dd>{phases.length}</dd></div><div><dt>До финиша</dt><dd>{END/1000} <small>сек</small></dd></div><div><dt>Нужна точность</dt><dd>65 <small>%</small></dd></div></dl>
  <ul className="bike-quick-rules">
   <li><span className="bike-rule-icon" aria-hidden="true">●</span><div><strong>Круг — нажми на белой линии.</strong><p>Две кнопки на экране или ← → / A D. Двойная нота — обе руки сразу.</p></div></li>
   <li><span className="bike-rule-icon" aria-hidden="true">┃</span><div><strong>Длинную ноту удерживай.</strong><p>Отпусти, когда хвост дойдёт до линии. Другой рукой лови короткие ноты.</p></div></li>
   <li><span className="bike-rule-icon" aria-hidden="true">♥</span><div><strong>Береги силы.</strong><p>Промах: −12. Попадание: +2. После серии из 8 жми пробел — +25 сил, один раз за игру.</p></div></li>
  </ul>
  <div className="bike-pickup-tip"><span aria-hidden="true">★</span><p><strong>Темп растёт: 90 → 108 → 126 BPM.</strong><br/>Золотые ноты можно пропускать без штрафа.</p></div>
  <details className="bike-facts-sources training-extra"><summary>Серии, бонусы и звук</summary><p>Серия умножает очки до ×4. Каждые {FEVER_STREAK} попаданий подряд — 6 секунд двойных очков. Золотая нота стоит {BONUS_POINTS} очков с множителем. Второе дыхание доступно и кнопкой. Без звука ориентируйся на белую линию.</p></details>
  <div className="bike-intro-actions"><button className="full-button" onClick={onContinue}>Дальше: цена нагрузки →</button><button className="text-button" onClick={onComic}>Перечитать комикс</button></div>
 </section>;
}

const injuryFields=[
 {tab:'Сразу',title:'Ушиб. Растяжение. Разрыв.',text:'Упавший снаряд и сорванное движение могут закончиться болью, отёком и потерей подвижности. Тяжёлые повреждения требуют реабилитации, иногда операции.'},
 {tab:'Со временем',title:'Перегрузка накапливается.',text:'Повторная перегрузка повреждает сухожилия и кости. Развиваются хронические травмы, в том числе тендинит и стрессовые переломы. Боль возвращается при нагрузке и ограничивает движения.'},
];
export function GymFacts({onContinue,onBack}:{onContinue:()=>void;onBack:()=>void}){
 const [tab,setTab]=useState(0);
 return <section className="paper-panel bike-intro training-brief training-facts" aria-labelledby="gym-facts-title">
  <header className="bike-intro-heading"><span className="eyebrow">ДОСЬЕ ЗАЛА</span><span className="bike-intro-step">Цена нагрузки · 2/2</span></header>
  <h1 id="gym-facts-title">Подход закончится.<br/><em>Травма — не всегда.</em></h1>
  <p className="bike-intro-lead">Одни травмы случаются сразу. Другие накапливаются с перегрузкой.</p>
  <dl className="training-injury-stats">
   <div><dt>травм с отягощениями, леченных в неотложке</dt><dd>≈ 547 <small>тыс.</small></dd><p>США · 2014–2023 · оценка NEISS</p></div>
   <div><dt>травм плеча — симптомы дольше 4 недель</dt><dd>93 <small>%</small></dd><p>Исследование элитных тяжелоатлетов и пауэрлифтеров · 2002</p></div>
  </dl>
  <div className="training-info-tabs" aria-label="Травмы и последствия">{injuryFields.map((item,index)=><button key={item.tab} aria-pressed={tab===index} onClick={()=>setTab(index)}>{item.tab}</button>)}</div>
  <div className="training-info-field" aria-live="polite" aria-atomic="true"><strong>{injuryFields[tab].title}</strong><p>{injuryFields[tab].text}</p></div>
  <p className="bike-facts-takeaway"><strong className="bike-underline">Повтор — секунды. Восстановление — недели.</strong></p>
  <details className="bike-facts-sources"><summary>Источники</summary><p><a href="https://pubmed.ncbi.nlm.nih.gov/42367316/" target="_blank" rel="noopener noreferrer">NEISS · анализ травм за 2014–2023 годы</a>: национальная оценка — 546 655 травм с отягощениями, леченных в отделениях неотложной помощи США. <a href="https://bjsm.bmj.com/content/51/4/211" target="_blank" rel="noopener noreferrer">Систематический обзор 2017</a> приводит результат Raske и Norlin: симптомы более 4 недель при 93% травм плеча, 85% травм поясницы и 80% травм колена у обследованных элитных атлетов. <a href="https://www.niams.nih.gov/health-topics/sports-injuries" target="_blank" rel="noopener noreferrer">NIAMS · острые и хронические спортивные травмы</a>.</p></details>
  <div className="bike-intro-actions"><button className="full-button" onClick={onContinue}>Начать тренировку →</button><button className="text-button" onClick={onBack}>← Как играть</button></div>
 </section>;
}
