import { LEVELS } from './cart';
import '../bike/bike-intro.css';
import './shop-intro.css';
import { products } from './model';
import { useId } from 'react';

export const shopPanels = [
  { place: 'ПОСЛЕ БАССЕЙНА · ДОМА', title: 'В холодильнике — горчица и свет.', words: 'Горчица есть. Свет есть. Осталось купить всё остальное.', aside: 'Ужин сам себя не приготовит.', position: '0% 0%', description: 'Герой заглядывает в почти пустой холодильник. На полке стоит только банка горчицы.' },
  { place: 'ПЛАН НА ВЕЧЕР · УЖИН', title: 'Начнём с обычного ужина.', words: 'Курица, рис, овощи. Без чудо-диеты и соуса «минус пять кило».', aside: 'У рецепта пока только один недостаток: нет продуктов.', position: '100% 0%', description: 'Герой смотрит рецепт в телефоне и представляет тарелку с курицей, рисом и овощами.' },
  { place: 'ДО ВЫХОДА · СПИСОК', title: 'Покупки — по списку.', words: 'Беру нужное. Смотрю цену и срок. На кассе никаких «ой».', aside: 'Бюджет записан. Самоуверенность — нет.', position: '0% 100%', description: 'Герой записывает список покупок. Рядом стоит сумка для продуктов.' },
  { place: 'МАРКЕТ · ОТДЕЛ ОБЕЩАНИЙ', title: 'Польза — крупно. Состав — мелко.', words: '«Фитнес», «премиум», «натуральный»… А можно просто рис по нормальной цене?', aside: 'Собери покупки, а не обещания.', position: '100% 100%', description: 'Герой с корзиной стоит между полками магазина. Над ним висят огромные яркие ценники.' },
];
export function shopComicStyle(panel: number) {
  // The generated page has a slightly taller lower row; crop along its actual gutter.
  const height = panel < 2 ? 715 : 821;
  return { backgroundImage: 'url(/art/chapter-03-comic.webp)', backgroundPosition: shopPanels[panel].position, backgroundSize: `200% ${1536 / height * 100}%`, aspectRatio: `512 / ${height}` };
}
export function ProductArt({ index }: { index: number }) {
  const icon = products[index].icon;
  const clip = useId();
  const frames = ['0 70 405 400', '410 40 330 455', '745 45 405 435', '1150 60 385 420', '65 490 215 480', '350 550 405 410', '770 530 380 405', '1165 535 371 440'];
  const [x,y,width,height] = frames[icon].split(' ').map(Number);
  return <svg className="product-art" viewBox={frames[icon]} aria-hidden="true"><defs><clipPath id={clip}><rect x={x} y={y} width={width} height={height}/></clipPath></defs><image href="/art/chapter-03-products.webp" width="1536" height="1024" clipPath={`url(#${clip})`}/></svg>;
}

export function ShopBrief({ onContinue, onComic }: { onContinue: () => void; onComic: () => void }) {
  return <section className="paper-panel bike-intro market-brief" aria-labelledby="shop-brief-title">
    <header className="bike-intro-heading"><span className="eyebrow">03 / ПРАВИЛЬНАЯ ЗАКУПКА</span><span className="bike-intro-step">Как играть · 1/2</span></header>
    <h1 id="shop-brief-title">Лови продукты.<br/><em>Не ведись на обёртку.</em></h1>
    <p className="bike-intro-lead">Три раунда. В каждом — новый список и свой бюджет.</p>
    <dl className="bike-ride-stats" aria-label="Условия закупки"><div><dt>Раундов</dt><dd>{LEVELS.length}</dd></div><div><dt>На всю игру</dt><dd>3 <small>♥</small></dd></div><div><dt>Монет на раунд</dt><dd>25–35</dd></div></dl>
    <ul className="bike-quick-rules">
      <li><span className="bike-rule-icon" aria-hidden="true">↔</span><div><strong>Веди тележку за нужным.</strong><p>Веди пальцем по полю или держи ← →. Лови по списку.</p></div></li>
      <li><span className="bike-rule-icon" aria-hidden="true">!</span><div><strong>Повтор — тоже покупка.</strong><p>Уже есть в тележке? Пропусти. За повтор снова спишутся монеты. Превысишь бюджет — проиграешь.</p></div></li>
      <li><span className="bike-rule-icon" aria-hidden="true">↗</span><div><strong>Защищай покупки.</strong><p>Вор рядом? Толкни его тележкой на скорости. Арбуз заклинит колёса.</p></div></li>
    </ul>
    <div className="bike-pickup-tip"><span aria-hidden="true">★</span><p><strong>Быстро и экономно — больше очков.</strong><br/>Просрочка и товары вне списка: −♥. Таймер вышел: −♥ и ещё 15 сек.</p></div>
    <details className="bike-facts-sources market-extra-rules"><summary>Скидки, раунды и медали</summary><p>{LEVELS.map(item => `${item.name} — ${item.budget} мон.`).join(' · ')}. Цены игровые. Скидка уменьшает цену, но повтор всё равно оплачивается и не заменяет старую покупку. Новый раунд обнуляет покупки и расходы. Медали дают по 40 очков: без ошибок, за две нужные покупки по акции, три раунда за 90 секунд или серию из 10 нужных продуктов.</p></details>
    <div className="bike-intro-actions"><button className="full-button" onClick={onContinue}>Дальше: сравниваем продукты →</button><button className="text-button" onClick={onComic}>Перечитать комикс</button></div>
  </section>;
}

export function ShopFacts({ onContinue, onBack }: { onContinue: () => void; onBack: () => void }) {
  return <section className="paper-panel bike-intro market-brief market-facts" aria-labelledby="shop-facts-title">
    <header className="bike-intro-heading"><span className="eyebrow">ПЕРЕД ПОКУПКАМИ</span><span className="bike-intro-step">Научная справка · 2/2</span></header>
    <h1 id="shop-facts-title">«Правильные» продукты.<br/><em>Что может навредить?</em></h1>
    <p className="bike-intro-lead">У «здорового» гарнира могут быть свои риски. Рис способен накапливать мышьяк, картофель при прорастании — гликоалкалоиды, а на овощах могут оставаться следы обработки пестицидами.</p>
    <div className="market-info-field">
      <strong>Белый рис и варёный картофель</strong>
      <p>В равной порции варёного картофеля меньше калорий и больше клетчатки, чем в белом рисе. При этом позеленевший или проросший картофель может содержать повышенное количество гликоалкалоидов. Отравление ими вызывает тошноту, рвоту и диарею.</p>
      <p>В рисе может присутствовать неорганический мышьяк. Длительное воздействие этого вещества связано с повышенным риском рака лёгких и мочевого пузыря.</p>
    </div>
    <div className="market-info-field">
      <strong>Брокколи, помидоры и остатки пестицидов</strong>
      <p>Клетчатка в овощах не отменяет риска загрязнения. В европейской программе контроля за 2024 год допустимые уровни остатков пестицидов были превышены в 2,2% проб брокколи. Помидоры тоже проверяли в рамках программы за 2022 год.</p>
      <p>Высокая доза некоторых пестицидов может вызвать острое отравление. Риск зависит от вещества, концентрации и количества съеденного.</p>
    </div>
    <details className="bike-facts-sources">
      <summary>Источники и подробности</summary>
      <p>На 100 г готового белого риса — 130 ккал и 0,4 г клетчатки. У варёного картофеля без кожуры — 87 ккал и 1,8 г клетчатки. У сырой брокколи и помидоров — 2,6 и 1,2 г клетчатки соответственно.</p>
      <p>USDA FoodData Central<br/>
        <a href="https://fdc.nal.usda.gov/food-details/169757/nutrients" target="_blank" rel="noopener noreferrer">Белый рис</a> · <a href="https://fdc.nal.usda.gov/food-details/170438/nutrients" target="_blank" rel="noopener noreferrer">Варёный картофель</a><br/>
        <a href="https://fdc.nal.usda.gov/food-details/170379/nutrients" target="_blank" rel="noopener noreferrer">Брокколи</a> · <a href="https://fdc.nal.usda.gov/food-details/170457/nutrients" target="_blank" rel="noopener noreferrer">Помидоры</a>
      </p>
      <p>Отчёты EFSA об остатках пестицидов<br/>
        <a href="https://doi.org/10.2903/j.efsa.2026.10054" target="_blank" rel="noopener noreferrer">Брокколи · данные 2024 года</a><br/>
        <a href="https://doi.org/10.2903/j.efsa.2024.8753" target="_blank" rel="noopener noreferrer">Помидоры · данные 2022 года</a>
      </p>
      <p><a href="https://www.who.int/news-room/fact-sheets/detail/pesticide-residues-in-food" target="_blank" rel="noopener noreferrer">ВОЗ · влияние пестицидов на здоровье</a><br/>
        <a href="https://www.fda.gov/food/risk-and-safety-assessments-food/arsenic-rice-and-rice-products-risk-assessment" target="_blank" rel="noopener noreferrer">FDA · оценка риска мышьяка в рисе</a><br/>
        <a href="https://doi.org/10.2903/j.efsa.2020.6222" target="_blank" rel="noopener noreferrer">EFSA · гликоалкалоиды картофеля</a>
      </p>
    </details>
    <div className="bike-intro-actions"><button className="full-button" onClick={onContinue}>Начать закупку →</button><button className="text-button" onClick={onBack}>← Как играть</button></div>
  </section>;
}
