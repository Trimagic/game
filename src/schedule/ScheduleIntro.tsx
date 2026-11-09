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
export function scheduleComicStyle(panel:number){const h=panel<2?744:792;return {backgroundImage:'url(/art/chapter-08-comic.png)',backgroundPosition:schedulePanels[panel].position,backgroundSize:`200% ${1536/h*100}%`,aspectRatio:`512 / ${h}`};}
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
 {tab:'Переработки',title:'Дополнительные часы не проходят бесследно.',text:'Работа по 55 и более часов в неделю связана с повышенным риском инсульта и смерти от ишемической болезни сердца по сравнению с 35–40 часами. ВОЗ и МОТ оценили связанную с такими переработками смертность в 745 тысяч случаев в мире за 2016 год.',note:'Это оценка последствий длительной рабочей нагрузки, а не одного насыщенного дня.'},
 {tab:'Выгорание',title:'Всё выполнено. Сил больше нет.',text:'Хронический стресс на работе, с которым не удалось справиться, может привести к выгоранию: истощению, отчуждению или цинизму по отношению к работе и снижению профессиональной эффективности.',note:'В определении ВОЗ выгорание относится именно к работе. Полный ежедневник сам по себе не ставит диагноз.'},
 {tab:'Без отдыха',title:'Недосып крадёт время обратно.',text:'Когда график отнимает сон, задачи могут занимать больше времени: реакция замедляется, ошибок становится больше. Труднее принимать решения, удерживать эмоции и справляться с изменениями. Так перегруженный день создаёт новые переделки и задержки.',note:'В игре отдых замедляет падающие дела. В жизни потерянный сон не заменяется ещё одним пунктом плана.'},
];
export function ScheduleFacts({onContinue,onBack}:{onContinue:()=>void;onBack:()=>void}){
 const [tab,setTab]=useState(0);
 return <section className="paper-panel bike-intro planner-brief planner-facts" aria-labelledby="schedule-facts-title">
  <header className="bike-intro-heading"><span className="eyebrow">ЦЕНА ПЛОТНОГО ГРАФИКА</span><span className="bike-intro-step">Досье недели · 2/2</span></header>
  <h1 id="schedule-facts-title">Всё по плану.<br/><em>А сил — нет.</em></h1>
  <p className="bike-intro-lead">Забитое расписание не увеличивает запас сил.</p>
  <div className="planner-risk-card"><strong>55+ <small>ч/нед.</small></strong><div><b>рабочих часов</b><span>Нагрузка, связанная с повышенным риском.<br/>Сравнение: 35–40 часов · ВОЗ / МОТ, 2021.</span></div></div>
  <div className="planner-info-tabs" aria-label="Последствия перегруженного графика">{fields.map((item,index)=><button key={item.tab} aria-pressed={tab===index} onClick={()=>setTab(index)}>{item.tab}</button>)}</div>
  <div className="planner-info-field" aria-live="polite" aria-atomic="true"><strong>{fields[tab].title}</strong><p>{fields[tab].text}</p><p className="planner-consequence">{fields[tab].note}</p></div>
  <details className="bike-facts-sources"><summary>Источники и границы данных</summary><p><a href="https://www.who.int/news/item/17-05-2021-long-working-hours-increasing-deaths-from-heart-disease-and-stroke-who-ilo" target="_blank" rel="noopener noreferrer">ВОЗ / МОТ, 2021 · длительная работа</a>: глобальная оценка за 2016 год — 745 000 смертей от инсульта и ишемической болезни сердца, связанных с работой от 55 часов в неделю. Это модельная оценка для населения, не индивидуальный прогноз и не риск любого расписания. <a href="https://www.who.int/standards/classifications/frequently-asked-questions/burn-out-an-occupational-phenomenon" target="_blank" rel="noopener noreferrer">ВОЗ · выгорание</a>: профессиональный феномен, не отдельное заболевание в МКБ-11. <a href="https://www.nhlbi.nih.gov/health/sleep-deprivation/health-effects" target="_blank" rel="noopener noreferrer">NHLBI · последствия дефицита сна</a>: ошибки, реакция, решения и эмоциональная регуляция.</p></details>
  <div className="bike-intro-actions"><button className="full-button" onClick={onContinue}>Открыть ежедневник →</button><button className="text-button" onClick={onBack}>← Как играть</button></div>
 </section>;
}
