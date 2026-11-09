import { useState } from 'react';
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
  return { backgroundImage: 'url(/art/chapter-03-comic.png)', backgroundPosition: shopPanels[panel].position, backgroundSize: `200% ${1536 / height * 100}%`, aspectRatio: `512 / ${height}` };
}
export function ProductArt({ index }: { index: number }) {
  const icon = products[index].icon;
  const clip = useId();
  const frames = ['0 70 405 400', '410 40 330 455', '745 45 405 435', '1150 60 385 420', '65 490 215 480', '350 550 405 410', '770 530 380 405', '1165 535 371 440'];
  const [x,y,width,height] = frames[icon].split(' ').map(Number);
  return <svg className="product-art" viewBox={frames[icon]} aria-hidden="true"><defs><clipPath id={clip}><rect x={x} y={y} width={width} height={height}/></clipPath></defs><image href="/art/chapter-03-products.png" width="1536" height="1024" clipPath={`url(#${clip})`}/></svg>;
}

export function ShopBrief({ onContinue, onComic }: { onContinue: () => void; onComic: () => void }) {
  return <section className="paper-panel bike-intro market-brief" aria-labelledby="shop-brief-title">
    <header className="bike-intro-heading"><span className="eyebrow">03 / ПРАВИЛЬНАЯ ЗАКУПКА</span><span className="bike-intro-step">Как играть · 1/2</span></header>
    <h1 id="shop-brief-title">Лови продукты.<br/><em>Не ведись на обёртку.</em></h1>
    <p className="bike-intro-lead">Собери все списки и уложись в бюджет.</p>
    <dl className="bike-ride-stats" aria-label="Условия закупки"><div><dt>Списков</dt><dd>{LEVELS.length}</dd></div><div><dt>На всю игру</dt><dd>3 <small>♥</small></dd></div><div><dt>Монет на список</dt><dd>25–35</dd></div></dl>
    <ul className="bike-quick-rules">
      <li><span className="bike-rule-icon" aria-hidden="true">↔</span><div><strong>Веди тележку за нужным.</strong><p>Веди пальцем по полю или держи ← →. Лови по списку.</p></div></li>
      <li><span className="bike-rule-icon" aria-hidden="true">!</span><div><strong>Сверяй срок и цену.</strong><p>Лишнее, просрочка и нехватка денег — минус жизнь.</p></div></li>
      <li><span className="bike-rule-icon" aria-hidden="true">↗</span><div><strong>Защищай покупки.</strong><p>Вор рядом? Толкни его тележкой на скорости. Арбуз заклинит колёса.</p></div></li>
    </ul>
    <div className="bike-pickup-tip"><span aria-hidden="true">★</span><p><strong>Быстро и экономно — больше очков.</strong><br/>Таймер вышел: −♥ и ещё 15 сек.</p></div>
    <details className="bike-facts-sources market-extra-rules"><summary>Скидки, списки и медали</summary><p>{LEVELS.map(item => `${item.name} — ${item.budget} мон.`).join(' · ')}. Цены игровые. Дешёвая копия по акции заменяет дорогую. Медали дают по 40 очков: без потери жизней, за две покупки по акции, все списки за 110 секунд или серию из 10 нужных продуктов.</p></details>
    <div className="bike-intro-actions"><button className="full-button" onClick={onContinue}>Дальше: читаем этикетку →</button><button className="text-button" onClick={onComic}>Перечитать комикс</button></div>
  </section>;
}

export function ShopFacts({ onContinue, onBack }: { onContinue: () => void; onBack: () => void }) {
  const [tab, setTab] = useState<'label' | 'additives'>('label');
  return <section className="paper-panel bike-intro market-brief market-facts" aria-labelledby="shop-facts-title">
    <header className="bike-intro-heading"><span className="eyebrow">ПЕРЕД ПОКУПКАМИ</span><span className="bike-intro-step">Читаем этикетку · 2/2</span></header>
    <h1 id="shop-facts-title">Полезно на вид.<br/><em>А по составу?</em></h1>
    <p className="bike-intro-lead">На лицевой стороне — «Фитнес». Перевернём упаковку.</p>
    <div className="market-label-example"><span className="market-example-tag">ВЫМЫШЛЕННЫЙ ТОВАР · УЧЕБНАЯ ЭТИКЕТКА</span><dl><div><dt>сахара на 100 г</dt><dd>28 <small>г</small></dd></div><div><dt>срок годности</dt><dd>180 <small>дней</small></dd></div></dl><p>Цифры придуманы для этой игры.</p></div>
    <div className="market-info-tabs" aria-label="Что проверить"><button aria-pressed={tab === 'label'} onClick={() => setTab('label')}>Состав и обещания</button><button aria-pressed={tab === 'additives'} onClick={() => setTab('additives')}>Добавки и хранение</button></div>
    <div className="market-info-field" aria-live="polite" aria-atomic="true">{tab === 'label' ? <><strong>Обёртка не меняет состав.</strong><p>Сравни сахар, соль, белок и клетчатку на 100 г. Слова «ГОСТ», «натуральный» и «фитнес» не заменяют таблицу пищевой ценности.</p></> : <><strong>Долгий срок — не мера пользы.</strong><p>Консерванты замедляют порчу, эмульгаторы помогают сохранять текстуру. Их наличие само по себе не делает еду бесполезной. Смотри на продукт целиком.</p></>}</div>
    <p className="bike-facts-takeaway"><strong className="bike-underline">Плати за продукт. Не за обещание.</strong></p>
    <details className="bike-facts-sources"><summary>Что здесь игровое, а что реальное</summary><p>28 г и 180 дней — вымышленные значения учебного товара, не статистика качества продуктов в магазинах. Реальные сведения о назначении добавок: <a href="https://www.efsa.europa.eu/en/safe2eat/food-additives" target="_blank" rel="noopener noreferrer">EFSA</a> и <a href="https://www.fda.gov/food/food-ingredients-packaging/food-additives-and-gras-ingredients-information-consumers" target="_blank" rel="noopener noreferrer">FDA</a>. Безопасность, срок хранения и пищевая ценность — разные характеристики. «Без добавок» также не означает автоматически «полезнее».</p></details>
    <div className="bike-intro-actions"><button className="full-button" onClick={onContinue}>Начать закупку →</button><button className="text-button" onClick={onBack}>← Как играть</button></div>
  </section>;
}
