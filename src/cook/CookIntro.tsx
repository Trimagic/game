import { NEED } from './chop';
import { DISHES } from './stove';
import '../bike/bike-intro.css';
import './cook-intro.css';
import './cook.css';

export const cookPanels = [
 {place:'ПОСЛЕ МАГАЗИНА · КУХНЯ',title:'Продукты дома. Герой тоже.',words:'Курица, рис, овощи. Без волшебного порошка и секретного соуса. Пока справляюсь.',aside:'Самая простая часть рецепта позади: всё купить.',position:'0% 0%',description:'Герой в бирюзовом фартуке достаёт из сумки курицу, рис, овощи и масло.'},
 {place:'РЕЦЕПТ · ОЖИДАНИЯ',title:'Обещают пятнадцать минут.',words:'На фото — идеальный ужин. В рецепте — «очень просто». Подозрительно хороший расклад.',aside:'Таймер пока верит автору.',position:'100% 0%',description:'Герой смотрит на красивое фото ужина в телефоне. За спиной висят кухонные часы.'},
 {place:'СОРОК МИНУТ СПУСТЯ · РЕАЛЬНОСТЬ',title:'Быстро — это прочитать рецепт.',words:'Так. Всё помыл, всё нарезал. Если считать только готовку, автор почти не соврал.',aside:'Ужин уже не быстрый. Зато будет домашний.',position:'0% 100%',description:'Герой вытирает лоб. Перед ним много мисок и подготовленные ингредиенты.'},
 {place:'У ПЛИТЫ · СЕМЕЙНЫЙ КОНТРОЛЬ',title:'Всё под контролем. Почти.',words:'Перевернуть курицу, помешать рис… Мам? Да, я поел. Почти. Нет, не подгорело!',aside:'Три конфорки. Один повар. И звонок мамы.',position:'100% 100%',description:'Герой готовит на плите, отвлекаясь на звонящий телефон. На огне сковорода и кастрюля.'},
];
export function cookComicStyle(panel:number){const height=panel<2?715:821;return {backgroundImage:'url(/art/chapter-04-comic.webp)',backgroundPosition:cookPanels[panel].position,backgroundSize:'200% '+1536/height*100+'%',aspectRatio:'512 / '+height};}

export function CookBrief({onContinue,onComic}:{onContinue:()=>void;onComic:()=>void}){
 return <section className="paper-panel bike-intro kitchen-brief" aria-labelledby="cook-brief-title">
  <header className="bike-intro-heading"><span className="eyebrow">04 / ДИЕТИЧЕСКИЙ УЖИН</span><span className="bike-intro-step">Как играть · 1/2</span></header>
  <h1 id="cook-brief-title">Приготовь ужин.<br/><em>Сохрани кухню.</em></h1>
  <p className="bike-intro-lead">Нарежь, приготовь и собери тарелку.</p>
  <dl className="bike-ride-stats" aria-label="Этапы готовки"><div><dt>Этапа</dt><dd>3</dd></div><div><dt>Конфорки</dt><dd>{DISHES.length}</dd></div><div><dt>Подгорания</dt><dd>3 <small>→ повтор</small></dd></div></dl>
  <ul className="bike-quick-rules">
   <li><span className="bike-rule-icon" aria-hidden="true">╱</span><div><strong>Овощи, потом — курица.</strong><p>Режь свайпом. Гниль, кота и продукты не с той доски пропускай.</p></div></li>
   <li><span className="bike-rule-icon" aria-hidden="true">◉</span><div><strong>У плиты жми в зелёной зоне.</strong><p>Следи за тремя конфорками. Вспыхнуло — нажми потушить.</p></div></li>
   <li><span className="bike-rule-icon" aria-hidden="true">♪</span><div><strong>Ответь маме. Подай ужин.</strong><p>Звонит мама — нажатие отвечает ей. В финале собери тарелку.</p></div></li>
  </ul>
  <div className="bike-pickup-tip"><span aria-hidden="true">★</span><p><strong>Золотой перец замедлит время.</strong><br/>Лови солонку нажатием — получишь бонус.</p></div>
  <details className="bike-facts-sources kitchen-extra-rules"><summary>Нарезка и клавиши</summary><p>Сначала {NEED.veg.tomato} помидоров и {NEED.veg.broccoli} брокколи, затем {NEED.meat.chicken} кусков курицы на отдельной доске. Пробел — нарезка, 1 / 2 / 3 — конфорки, M — ответить маме. Время и количество продуктов в игре условные.</p></details>
  <div className="bike-intro-actions"><button className="full-button" onClick={onContinue}>Дальше: месяц на диете →</button><button className="text-button" onClick={onComic}>Перечитать комикс</button></div>
 </section>;
}

export function CookFacts({onContinue,onBack}:{onContinue:()=>void;onBack:()=>void}){
 return <section className="paper-panel bike-intro kitchen-brief kitchen-facts" aria-labelledby="cook-facts-title">
  <header className="bike-intro-heading"><span className="eyebrow">ПЕРЕД ГОТОВКОЙ</span><span className="bike-intro-step">Научная справка · 2/2</span></header>
  <h1 id="cook-facts-title">ПП на месяц.<br/><em>Курс закончился. Рацион прежний.</em></h1>
  <p className="bike-intro-lead">Садиться на «правильное питание» на месяц 2–4 раза в год бессмысленно, если цель — надолго изменить рацион, а после каждого курса возвращается прежнее меню. Повторение курса оставляет ту же проблему: всё, что менялось, было привязано к сроку.</p>
  <div className="kitchen-info-field">
   <strong>Что показали исследования диет.</strong>
   <p>Согласно <a href="https://doi.org/10.1136/bmj.m696" target="_blank" rel="noopener noreferrer">обзору 121 исследования в BMJ</a>, многие популярные диеты помогали немного снизить вес и артериальное давление к шести месяцам. Через год эффект на вес был слабее, а большинство улучшений показателей сердечно-сосудистого риска почти исчезло.</p>
   <p>Согласно <a href="https://doi.org/10.1136/bmj.n1840" target="_blank" rel="noopener noreferrer">другому обзору BMJ</a>, после окончания программ снижения веса участники в среднем постепенно набирали часть потерянного веса обратно.</p>
  </div>
  <p className="bike-facts-takeaway"><strong className="bike-underline">Очередной месяц ПП заканчивается. Прежние привычки остаются.</strong></p>
  <details className="bike-facts-sources">
   <summary>Источники и подробности</summary>
   <p><a href="https://doi.org/10.1136/bmj.m696" target="_blank" rel="noopener noreferrer">BMJ · сравнение популярных диет через полгода и год</a><br/><a href="https://doi.org/10.1136/bmj.n1840" target="_blank" rel="noopener noreferrer">BMJ · изменение веса после окончания программы</a></p>
  </details>
  <div className="bike-intro-actions"><button className="full-button" onClick={onContinue}>Начать готовить →</button><button className="text-button" onClick={onBack}>← Как играть</button></div>
 </section>;
}
