import {useState} from 'react';
import '../bike/bike-intro.css';
import './run-intro.css';
import './run.css';
export const runPanels=[
 {place:'УТРО · У ДВЕРИ',title:'Выспался. Уже достижение.',words:'Телефон выключил. Глаза открыл. Теперь бы завязать шнурки и не передумать.',aside:'Новый день. Те же переговоры с собой.',position:'0% 0%',description:'Герой сидит у двери и завязывает шнурки оранжевых кроссовок.'},
 {place:'ПАРК · ПЛАН НА ЧАСАХ',title:'Часы обещают лёгкий бег.',words:'Один километр. Без рекордов. Часы, ты ведь понимаешь слово «лёгкий»?',aside:'Устройство согласно. Ноги пока не спрашивали.',position:'100% 0%',description:'Герой стоит на солнечной аллее парка и смотрит на спортивные часы.'},
 {place:'НАЧАЛО МАРШРУТА · ПЕРВЫЙ СЮРПРИЗ',title:'Маршрут забыл про договор.',words:'Ступени? Серьёзно? Я заказывал ровную дорожку, а не вступительный экзамен.',aside:'Навигатор считает подъём особенностью пейзажа.',position:'0% 100%',description:'Герой проверяет часы у высокой каменной лестницы среди деревьев.'},
 {place:'АЛЛЕЯ · ОБРАТНОГО ПУТИ НЕТ',title:'Ладно. Смотрим под ноги.',words:'Лужа — прыгаю. Ветка — пригибаюсь. Автобус… Стоп, это уже следующая проблема!',aside:'Утро без стресса. По версии часов.',position:'100% 100%',description:'Герой бежит под низкой веткой, разбрызгивая воду из лужи.'},
];
export function runComicStyle(panel:number){const h=panel<2?744:792;return {backgroundImage:'url(/art/chapter-07-comic.png)',backgroundPosition:runPanels[panel].position,backgroundSize:`200% ${1536/h*100}%`,aspectRatio:`512 / ${h}`};}
export function RunBrief({onContinue,onComic}:{onContinue:()=>void;onComic:()=>void}){
 return <section className="paper-panel bike-intro runner-brief" aria-labelledby="run-brief-title">
  <header className="bike-intro-heading"><span className="eyebrow">07 / УТРЕННИЙ БЕГ</span><span className="bike-intro-step">Как играть · 1/2</span></header>
  <h1 id="run-brief-title">Лёгкий бег.<br/><em>По версии часов.</em></h1>
  <p className="bike-intro-lead">Герой бежит сам. Ты разбираешься с парком.</p>
  <dl className="bike-ride-stats" aria-label="Условия пробежки"><div><dt>До финиша</dt><dd>1 <small>км</small></dd></div><div><dt>Игровое время</dt><dd>60 <small>с</small></dd></div><div><dt>Сердца</dt><dd>3 <small>♥</small></dd></div></dl>
  <ul className="bike-quick-rules">
   <li><span className="bike-rule-icon" aria-hidden="true">↑</span><div><strong>Перепрыгивай всё, что внизу.</strong><p>Лужи, самокат, собаки. Кнопка прыжка, пробел, ↑ или W.</p></div></li>
   <li><span className="bike-rule-icon" aria-hidden="true">↓</span><div><strong>Под веткой — пригнись.</strong><p>Удерживай кнопку, ↓ или S. Под голубями просто беги, без прыжка.</p></div></li>
   <li><span className="bike-rule-icon" aria-hidden="true">✦</span><div><strong>Пять искр включают «Фокус».</strong><p>Нажми F или «Фокус»: 3 секунды замедления. Дистанция тоже замедлится.</p></div></li>
  </ul>
  <div className="bike-pickup-tip"><span aria-hidden="true">!</span><p><strong>Столкновение — минус сердце.</strong><br/>Потеряешь три — начнёшь заново.</p></div>
  <details className="bike-facts-sources"><summary>Маршрут и находки</summary><p>Аллея → собачья площадка → дождь → рывок к автобусу. Препятствия перемешиваются, темп растёт. Кроссовки дают двойной прыжок на 8 секунд; без них повторное нажатие в воздухе не помогает. Вода возвращает одно сердце, максимум — три. Золотые искры лежат в прыжке и под препятствиями; серия без столкновений увеличивает очки. После удара действует короткая защита. 60 секунд — игровое время движения; «Фокус» растягивает раунд. Дистанция и темп условные.</p></details>
  <div className="bike-intro-actions"><button className="full-button" onClick={onContinue}>Дальше: цена дистанции →</button><button className="text-button" onClick={onComic}>Перечитать комикс</button></div>
 </section>;
}
const fields=[
 {tab:'Травмы',title:'Не всякая травма начинается с падения.',text:'Подворот стопы и падение могут повредить связки и кости. Перегрузка копится тише: боль в колене, ахилловом сухожилии, стрессовая травма кости. Продолжение нагрузки может превратить стрессовую реакцию кости в перелом.',note:'Последствия: хромота, боль при обычной ходьбе, перерыв в беге и длительное восстановление.'},
 {tab:'Заболевания',title:'Нагрузка может выйти за пределы ног.',text:'В жару возможны тепловое истощение и тепловой удар. Чрезмерная нагрузка способна вызвать рабдомиолиз — разрушение мышц с риском повреждения почек. «Колено бегуна» и ахиллова тендинопатия могут сделать болезненными лестницы и обычную ходьбу.',note:'Тепловой удар и тяжёлый рабдомиолиз могут привести к инвалидности или смерти.'},
 {tab:'Смертельные случаи',title:'За финишной статистикой — реальные люди.',text:'В реестре марафонов и полумарафонов США за 2010–2023 годы зарегистрировали 176 остановок сердца и 59 смертей при 29,3 млн финишировавших. Это около одной смерти на 500 тысяч участников. Данные относятся к длинным забегам, а не к километру в парке.',note:'Счётчик сердец перезапускается только в игре.'},
];
export function RunFacts({onContinue,onBack}:{onContinue:()=>void;onBack:()=>void}){
 const [tab,setTab]=useState(0);
 return <section className="paper-panel bike-intro runner-brief runner-facts" aria-labelledby="run-facts-title">
  <header className="bike-intro-heading"><span className="eyebrow">ЦЕНА ДИСТАНЦИИ</span><span className="bike-intro-step">Досье пробежки · 2/2</span></header>
  <h1 id="run-facts-title">Финиш позади.<br/><em>Боль — ещё нет.</em></h1>
  <p className="bike-intro-lead">Падения заметны сразу. Перегрузка умеет ждать.</p>
  <div className="runner-risk-card"><strong>17,8</strong><div><b>травмы на 1000 часов бега</b><span>У начинающих бегунов · метаанализ, 2015.<br/>Частота травм, не процент участников.</span></div></div>
  <div className="runner-info-tabs" aria-label="Риски пробежки">{fields.map((item,index)=><button key={item.tab} aria-pressed={tab===index} onClick={()=>setTab(index)}>{item.tab}</button>)}</div>
  <div className="runner-info-field" aria-live="polite" aria-atomic="true"><strong>{fields[tab].title}</strong><p>{fields[tab].text}</p><p className="runner-consequence">{fields[tab].note}</p></div>
  <details className="bike-facts-sources"><summary>Источники и границы данных</summary><p><a href="https://pubmed.ncbi.nlm.nih.gov/25951917/" target="_blank" rel="noopener noreferrer">Метаанализ травм, 2015</a>: частота у начинающих — 17,8 травмы на 1000 часов; определения травм различались. <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC11955904/" target="_blank" rel="noopener noreferrer">JAMA, 2025 · реестр RACER</a>: марафоны и полумарафоны США, 2010–2023; 29 311 597 финишировавших, 176 остановок сердца, 59 смертей. Это не оценка всех смертей, связанных с бегом. <a href="https://www.orthoinfo.org/diseases--conditions/sports-injuries/stress-fractures/" target="_blank" rel="noopener noreferrer">AAOS · стрессовые переломы</a>, <a href="https://www.orthoinfo.org/diseases--conditions/achilles-tendinitis/" target="_blank" rel="noopener noreferrer">ахиллово сухожилие</a> и <a href="https://www.orthoinfo.org/bodypart/kneelower-leg/patellofemoral-pain-syndrome/" target="_blank" rel="noopener noreferrer">боль в колене</a>. <a href="https://www.cdc.gov/niosh/heat-stress/about/illnesses.html" target="_blank" rel="noopener noreferrer">CDC · перегрев</a> и <a href="https://www.cdc.gov/niosh/rhabdo/about/" target="_blank" rel="noopener noreferrer">рабдомиолиз</a>.</p></details>
  <div className="bike-intro-actions"><button className="full-button" onClick={onContinue}>На пробежку →</button><button className="text-button" onClick={onBack}>← Как играть</button></div>
 </section>;
}
