import PagedPanel from '../PagedPanel';
import { products } from './model';
import { useId } from 'react';

export const shopPanels = [
  { title: 'Холодильник полон возможностей.', words: 'Горчица и свет. Неплохое начало ужина.', position: '0% 0%' },
  { title: 'План почти готов.', words: 'Курица, рис и овощи. Начну с нормальных продуктов.', position: '100% 0%' },
  { title: 'Ничего лишнего.', words: 'Пять покупок. Десять минут. Никаких глупостей.', position: '0% 100%' },
  { title: 'Добро пожаловать в отдел соблазнов.', words: 'АКЦИЯ! Купи больше, чем собирался. Спасибо, я со списком.', position: '100% 100%' },
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
  return <PagedPanel className="paper-panel shop-intro"><span className="eyebrow">ЭТАП 03 / ПРАВИЛЬНАЯ ЗАКУПКА</span>
    <h1>За ужином.<br/><em>По списку.</em></h1>
    <div className="shopping-preview">{[0,1,2,3,4].map(index => <ProductArt key={index} index={index}/>)}</div>
    <p>На ужин — курица с рисом и овощами. Купи пять продуктов за <strong>35 монет</strong>. У тебя 60 секунд.</p>
    <div className="rules"><b>↘</b><p>Лови товары на движущейся ленте: нажимай или перетаскивай в корзину. Лишнее можно вернуть нажатием на покупку.</p></div>
    <div className="boss-notice"><b>ЛЕНТА УСКОРЯЕТСЯ. СПИСОК НЕ МЕНЯЕТСЯ.</b><p>«Фитнес» на обёртке не заменяет список. Собери всё нужное, уложись в бюджет и оплати корзину. Правильные покупки подряд дают серию и очки. Две стоп-ленты останавливают товары на 3 секунды, но не таймер. Касса открывается на 45-й секунде; в конце раунда готовая корзина оплачивается автоматически. Пропустил товар? Он вернётся.</p></div>
    <p className="facts-note">Цены и монеты игровые. Здесь «правильная покупка» — та, что подходит к рецепту и бюджету.</p>
    <button className="full-button" onClick={onContinue}>В магазин →</button><button className="text-button" onClick={onComic}>Прочитать комикс</button>
  </PagedPanel>;
}

