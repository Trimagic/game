import { useState } from 'react';
import { GOAL, enemyNames, STAGES } from './model';
import '../bike/bike-intro.css';
import './sleep-intro.css';
import './sleep.css';

export const sleepPanels = [
 {place:'ПОСЛЕ ЗАЛА · ДОМА',title:'День закончен. Почти.',words:'Всё. День выполнен. Теперь хочу спать, а не выполнять ещё один пункт плана.',aside:'Кровать близко. Телефон, к сожалению, тоже.',position:'0% 0%',description:'Герой в клетчатой пижаме сидит на краю кровати. Комната освещена тёплым светом.'},
 {place:'В КРОВАТИ · ОДНА ПРОВЕРКА',title:'Пять минут. И никаких больше.',words:'Только гляну уведомления. Одно сообщение. Ну и ролик, раз уж прислали.',aside:'У «пяти минут» включено автопродление.',position:'100% 0%',description:'Герой лежит под одеялом, увлечённо глядя в яркий экран телефона.'},
 {place:'ВНУТРИ ЛЕНТЫ · БЕЗ ВЫХОДНЫХ',title:'Лента не умеет уставать.',words:'Уведомления, серия, ещё один матч… Я хотел в кровать, а попал в лабиринт.',aside:'Теперь даже сон приходится собирать по крупицам.',position:'0% 100%',description:'Во сне герой бежит по лабиринту с подушкой. За ним гонятся экраны уведомлений, видео, кино и игр.'},
 {place:'СНОВА СПАЛЬНЯ · ТВОЁ РЕШЕНИЕ',title:'Ночь снова принадлежит тебе.',words:'Планы подождут. Телефон тоже. Я правда устал — значит, пора выключаться.',aside:'Одна кнопка. И наконец-то тишина.',position:'100% 100%',description:'Герой решительно нажимает кнопку выключения на телефоне. За окном луна.'},
];
export function sleepComicStyle(panel:number){const h=panel<2?744:792;return {backgroundImage:'url(/art/chapter-06-sleep-comic.webp)',backgroundPosition:sleepPanels[panel].position,backgroundSize:'200% '+1536/h*100+'%',aspectRatio:'512 / '+h};}

export function SleepBrief({onContinue,onComic}:{onContinue:()=>void;onComic:()=>void}){
 return <section className="paper-panel bike-intro night-brief" aria-labelledby="sleep-brief-title">
  <header className="bike-intro-heading"><span className="eyebrow">06 / ЕЩЁ ПЯТЬ МИНУТ</span><span className="bike-intro-step">Как играть · 1/2</span></header>
  <h1 id="sleep-brief-title">Найди дорогу<br/><em>к своей кровати.</em></h1>
  <p className="bike-intro-lead">Собери сон раньше, чем экраны заберут ночь.</p>
  <dl className="bike-ride-stats" aria-label="Условия ночного лабиринта"><div><dt>Очков до выхода</dt><dd>{GOAL}</dd></div><div><dt>Попытки</dt><dd>3 <small>♥</small></dd></div><div><dt>Преследователя</dt><dd>{enemyNames.length}</dd></div></dl>
  <ul className="bike-quick-rules">
   <li><span className="bike-rule-icon" aria-hidden="true">↱</span><div><strong>Задавай повороты заранее.</strong><p>Свайп, кнопки или стрелки / WASD. Герой идёт сам.</p></div></li>
   <li><span className="bike-rule-icon" aria-hidden="true">✦</span><div><strong>Собери сон. Найди кровать.</strong><p>Искра даёт 10 очков. Набери {GOAL} и вернись к кровати наверху.</p></div></li>
   <li><span className="bike-rule-icon" aria-hidden="true">☾</span><div><strong>Луна — 7 секунд тишины.</strong><p>Экраны убегают. Столкновение забирает попытку; очки остаются.</p></div></li>
  </ul>
  <div className="bike-pickup-tip"><span aria-hidden="true">!</span><p><strong>{STAGES[1].from} — окна. {STAGES[2].from} — экраны ускоряются.</strong><br/>{GOAL} — темнота. Беги к кровати.</p></div>
  <details className="bike-facts-sources night-extra"><summary>Молоко, бонусы и преследователи</summary><p>Жёлтая точка показывает заранее заданный поворот. В центре появляется молоко: +50 очков и 6 секунд замедления экранов. Восемь искр подряд без остановки — +30. Под «Не беспокоить» пойманный экран приносит +50. На этапе 650 очков возвращаются две луны, а экраны ускоряются, заметив тебя в прямом коридоре. Чем раньше доберёшься до кровати, тем больше бонус. Очки сна — игровая условность.</p></details>
  <div className="bike-intro-actions"><button className="full-button" onClick={onContinue}>Дальше: досье ночи →</button><button className="text-button" onClick={onComic}>Перечитать комикс</button></div>
 </section>;
}

const sleepFields=[
 {tab:'Плацебо',title:'Положительная оценка меняла результаты тестов.',text:'В экспериментах Драганич и Эрдал участникам сообщили, что доля быстрого сна у них была выше или ниже среднего. Эту оценку назначали исследователи. Группа с положительной оценкой лучше справлялась с отдельными заданиями на устный счёт и словесную беглость.'},
 {tab:'Ноцебо',title:'Плохая оценка сна усиливала ощущение усталости.',text:'В эксперименте с 63 людьми с бессонницей часы показывали случайно назначенную оценку уже прошедшей ночи. Те, кому сказали, что они спали хорошо, к вечеру сообщали о меньшей усталости и сонливости, чем те, кому сказали обратное. В тесте скорости реакции значимой разницы между группами не обнаружили.'},
 {tab:'График',title:'Небольшой сдвиг времени сна можно перенести.',text:'Внутренние часы способны постепенно подстроиться под новое время сна. Если ты лёг чуть позже и проспал столько же, мысль «я сбился с графика, завтра буду разбит» сама может усилить ощущение усталости. На самочувствие влияют и ожидания, и то, сколько и как ты спал.'},
];
export function SleepFacts({onContinue,onBack}:{onContinue:()=>void;onBack:()=>void}){
 const [tab,setTab]=useState(0);
 return <section className="paper-panel bike-intro night-brief night-facts" aria-labelledby="sleep-facts-title">
  <header className="bike-intro-heading"><span className="eyebrow">ДОСЬЕ НОЧИ</span><span className="bike-intro-step">Научная справка · 2/2</span></header>
  <h1 id="sleep-facts-title">График сна.<br/><em>Эффект ожиданий.</em></h1>
  <p className="bike-intro-lead">Лёг чуть позже обычного и уже ждёшь, что весь день будешь разбит? В экспериментах даже сообщение о том, что ночь прошла хорошо или плохо, меняло то, насколько уставшими люди чувствовали себя на следующий день.</p>
  <div className="night-info-tabs" aria-label="Ожидания от сна">{sleepFields.map((item,index)=><button key={item.tab} aria-pressed={tab===index} onClick={()=>setTab(index)}>{item.tab}</button>)}</div>
  <div className="night-info-field" aria-live="polite" aria-atomic="true"><strong>{sleepFields[tab].title}</strong><p>{sleepFields[tab].text}</p></div>
  <details className="bike-facts-sources">
   <summary>Источники и подробности</summary>
   <p><a href="https://pubmed.ncbi.nlm.nih.gov/24417326/" target="_blank" rel="noopener noreferrer">Draganich и Erdal · плацебо сна и результаты тестов · 2014</a><br/>
    <a href="https://pubmed.ncbi.nlm.nih.gov/29989248/" target="_blank" rel="noopener noreferrer">Gavriloff и соавторы · подставная оценка сна и дневная усталость</a><br/>
    <a href="https://www.nhlbi.nih.gov/health/sleep-deprivation/healthy-sleep-habits" target="_blank" rel="noopener noreferrer">NHLBI · регулярность и продолжительность сна</a><br/>
    <a href="https://www.nhlbi.nih.gov/news/2018/sweet-dreams-researchers-explore-link-between-sleep-and-health" target="_blank" rel="noopener noreferrer">NHLBI · постепенная адаптация к новому расписанию</a>
   </p>
  </details>
  <div className="bike-intro-actions"><button className="full-button" onClick={onContinue}>В ночной лабиринт →</button><button className="text-button" onClick={onBack}>← Как играть</button></div>
 </section>;
}
