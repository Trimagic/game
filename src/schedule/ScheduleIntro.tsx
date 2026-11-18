import {useState} from 'react';
import {GOAL, DAYS} from './tetris';
import '../bike/bike-intro.css';
import './schedule-intro.css';
import './schedule.css';
export const schedulePanels=[
 {place:'УТРО · ЧИСТАЯ СТРАНИЦА',title:'Новая жизнь. Новый блокнот.',words:'Бег есть. Ужин умею. Даже выспался. Осталось найти день, в который всё это влезет.',aside:'Ежедневник пока не подозревает о нагрузке.',position:'0% 0%',description:'Герой с карандашом задумался над пустыми страницами ежедневника на кухне.'},
 {place:'ЗА СТОЛОМ · ПЛАН БЕЗ ЗАЗОРОВ',title:'Каждой минуте — своё дело.',words:'Работа сюда. Спорт сюда. Отдых… Втисну между дорогой и ужином. Очень эффективные четыре минуты.',aside:'На бумаге всё помещается. Почти как тетрис.',position:'100% 0%',description:'Герой сосредоточенно заполняет ежедневник цветными блоками дел. Над столом часы.'},
 {place:'ВХОДЯЩИЙ · «ЭТО НЕНАДОЛГО»',title:'Есть минутка? Уже нет.',words:'Срочный созвон? Как удачно: я как раз собирался ничего не делать. Теперь не собираюсь.',aside:'У чужого «на минутку» нет кнопки завершения.',position:'0% 100%',description:'На заваленном заметками столе загорается телефон. Герой отвлекается от ежедневника.'},
 {place:'ПЕРЕДЫШКА · ПЛАН МОЖНО МЕНЯТЬ',title:'В расписании появился я.',words:'Это перенесу. Это отменю. А чай выпью сейчас — без таймера и отчёта о пользе.',aside:'Пустое место в плане. Наконец-то не ошибка.',position:'100% 100%',description:'Герой расслабленно пьёт чай за столом. Рядом лежит ежедневник с более свободным планом.'},
];
export function scheduleComicStyle(panel:number){const h=panel<2?744:792;return {backgroundImage:'url(/art/chapter-08-comic.webp)',backgroundPosition:schedulePanels[panel].position,backgroundSize:`200% ${1536/h*100}%`,aspectRatio:`512 / ${h}`};}
export function ScheduleBrief({onContinue,onComic}:{onContinue:()=>void;onComic:()=>void}){
 return <section className="paper-panel bike-intro planner-brief" aria-labelledby="schedule-brief-title">
  <header className="bike-intro-heading"><span className="eyebrow">08 / ВСЁ ПО РАСПИСАНИЮ</span><span className="bike-intro-step">Как играть · 1/2</span></header>
  <h1 id="schedule-brief-title">Дел много.<br/><em>Неделя одна.</em></h1>
  <p className="bike-intro-lead">Складывай дела так, чтобы осталось место для жизни.</p>
  <dl className="bike-ride-stats" aria-label="Условия игровой недели"><div><dt>До победы</dt><dd>{GOAL} <small>линий</small></dd></div><div><dt>Дней</dt><dd>{DAYS.length}</dd></div><div><dt>Запас отмен</dt><dd>до 2</dd></div></dl>
  <ul className="bike-quick-rules">
   <li><span className="bike-rule-icon" aria-hidden="true">↔</span><div><strong>Двигай и поворачивай дела.</strong><p>Пальцем по полю — двигать, касание — поворот. Или кнопки / стрелки.</p></div></li>
   <li><span className="bike-rule-icon" aria-hidden="true">↓</span><div><strong>Закрой строку без пробелов.</strong><p>Полная линия исчезнет. Свайп вниз или пробел сразу ставит фигуру.</p></div></li>
   <li><span className="bike-rule-icon" aria-hidden="true">♡</span><div><strong>Оставляй место отдыху.</strong><p>Линия со сном или отдыхом замедляет падение на 6 секунд.</p></div></li>
  </ul>
  <div className="bike-pickup-tip"><span aria-hidden="true">!</span><p><strong>Дела дошли до верха — неделя сорвалась.</strong><br/>«На завтра» — C. «Отмена» — X.</p></div>
  <details className="bike-facts-sources"><summary>Баланс, переносы и сюрпризы недели</summary><p>← / → — двигать, ↑ — повернуть, ↓ — опускать; на телефоне доступны кнопки. Контур показывает место падения, справа — следующая фигура. «На завтра» хранит одно дело: C убирает текущее или меняет его с отложенным, один раз между установками фигур. Пять разных видов дел в линии дают «Баланс»: +150 очков и отмену. Две линии за раз тоже дают отмену; запас до двух. X вызывает штамп: поставь его, чтобы стереть клетки рядом с местом падения. Со среды срочные созвоны падают втрое быстрее, с четверга снизу подступают дедлайны, в пятницу дарят отмену, в субботу появляются гости, в воскресенье темп растёт. Пауза останавливает игру. Дни и линии — игровая условность.</p></details>
  <div className="bike-intro-actions"><button className="full-button" onClick={onContinue}>Дальше: цена плотного графика →</button><button className="text-button" onClick={onComic}>Перечитать комикс</button></div>
 </section>;
}
const fields=[
 {tab:'Монотонность',title:'Монотонность может сказываться и после работы.',text:'Согласно исследованию молодых сотрудников, скука на работе была связана со снижением удовлетворённости жизнью и усилением симптомов тревоги и депрессии при повторном опросе.',note:'Если дни заполнены однообразными задачами, а поменять их порядок или содержание нельзя, психологическая нагрузка может сохраняться даже при умеренном темпе.'},
 {tab:'Депрессия',title:'Высокие требования особенно тяжело переносить без контроля.',text:'Согласно метаанализу Мадсена и соавторов, у сотрудников с высокими требованиями и малой возможностью влиять на свою работу чаще диагностировали депрессию.',note:'В двух наборах данных относительный риск был выше на 27% и 77%. Исследователи сравнивали условия труда, включая возможность принимать решения о своей работе.'},
 {tab:'Выгорание',title:'Возможность менять график может снизить истощение.',text:'По определению ВОЗ, выгорание связано с хроническим рабочим стрессом и проявляется истощением, отстранением от работы и снижением профессиональной эффективности.',note:'В эксперименте среди сотрудников ИТ-компании в части выборки выгорание и психологическое напряжение снизились после того, как людям дали больше контроля над рабочим временем и усилили поддержку руководителей.'},
];
export function ScheduleFacts({onContinue,onBack}:{onContinue:()=>void;onBack:()=>void}){
 const [tab,setTab]=useState(0);
 return <section className="paper-panel bike-intro planner-brief planner-facts" aria-labelledby="schedule-facts-title">
  <header className="bike-intro-heading"><span className="eyebrow">ДОСЬЕ НЕДЕЛИ</span><span className="bike-intro-step">Научная справка · 2/2</span></header>
  <h1 id="schedule-facts-title">Жёсткий распорядок.<br/><em>Когда дни сливаются.</em></h1>
  <p className="bike-intro-lead">Строгое соблюдение расписания может превратить день в повтор вчерашнего: те же дела, в том же порядке, без возможности что-то поменять. Согласно исследованиям условий труда, такая монотонность связана с усилением тревожных и депрессивных симптомов. Когда к ней добавляются постоянные требования и мало контроля над своим временем, растёт риск истощения и выгорания.</p>
  <div className="planner-risk-card"><strong>+27 <small>%</small></strong><div><b>относительный риск клинической депрессии</b><span>Одна из оценок для сочетания высоких рабочих требований и низкого контроля · метаанализ, 2017.</span></div></div>
  <div className="planner-info-tabs" aria-label="Последствия монотонного и жёсткого графика">{fields.map((item,index)=><button key={item.tab} aria-pressed={tab===index} onClick={()=>setTab(index)}>{item.tab}</button>)}</div>
  <div className="planner-info-field" aria-live="polite" aria-atomic="true"><strong>{fields[tab].title}</strong><p>{fields[tab].text}</p><p className="planner-consequence">{fields[tab].note}</p></div>
  <details className="bike-facts-sources">
   <summary>Источники и подробности</summary>
   <p><a href="https://doi.org/10.1186/s12889-024-18430-z" target="_blank" rel="noopener noreferrer">BMC Public Health · скука на работе, тревожные и депрессивные симптомы</a><br/>
    <a href="https://pubmed.ncbi.nlm.nih.gov/28122650/" target="_blank" rel="noopener noreferrer">Psychological Medicine · высокие требования, низкий контроль и депрессия</a><br/>
    <a href="https://doi.org/10.1177/0003122415622391" target="_blank" rel="noopener noreferrer">American Sociological Review · эксперимент с гибкостью графика и поддержкой</a><br/>
    <a href="https://www.who.int/standards/classifications/frequently-asked-questions/burn-out-an-occupational-phenomenon" target="_blank" rel="noopener noreferrer">ВОЗ · выгорание и хронический стресс на работе</a>
   </p>
  </details>
  <div className="bike-intro-actions"><button className="full-button" onClick={onContinue}>Открыть ежедневник →</button><button className="text-button" onClick={onBack}>← Как играть</button></div>
 </section>;
}
