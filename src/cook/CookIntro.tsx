import PagedPanel from '../PagedPanel';
import { ProductArt } from '../shop/ShopIntro';
import './cook.css';

export const cookPanels = [
  { title: 'Закупка прошла по плану.', words: 'Всё по списку. Даже без ведра соуса. Теперь-то будет просто.', position: '0% 0%' },
  { title: 'Рецепт обещает многое.', words: '«Лёгкий ужин за пятнадцать минут». Засекаю.', position: '100% 0%' },
  { title: 'Сорок минут спустя.', words: 'Ингредиенты подготовлены. Видимо, эти минуты не считались.', position: '0% 100%' },
  { title: 'Две конфорки. Один повар.', words: 'Главное — не отвлекаться. Мама? Да, я как раз готовлю…', position: '100% 100%' },
];
export function cookComicStyle(panel:number) {
  const height=panel<2?715:821;
  return {backgroundImage:'url(/art/chapter-04-comic.png)',backgroundPosition:cookPanels[panel].position,backgroundSize:`200% ${1536/height*100}%`,aspectRatio:`512 / ${height}`};
}
export function CookBrief({onContinue,onComic}:{onContinue:()=>void;onComic:()=>void}) {
  return <PagedPanel className="paper-panel cook-intro"><span className="eyebrow">ЭТАП 04 / ДИЕТИЧЕСКИЙ УЖИН</span>
    <h1>Рецепт простой.<br/><em>Почти.</em></h1>
    <div className="cook-ingredients">{[0,1,2,3,4].map(index=><ProductArt key={index} index={index}/>)}</div>
    <p>Покупки из третьей главы уже на кухне. На ужин — курица с рисом, брокколи и помидорами.</p>
    <ol className="cook-steps"><li><b>Нарежь.</b> Продукты падают на доску — режь их свайпом прямо на лету. Сначала доска для овощей: 4 помидора и 4 брокколи, сырую курицу не трогай. Потом отдельная доска для курицы — там не трогай овощи. Несколько кусков одним движением — бонус, быстрая нарезка — ещё бонус.</li><li><b>Уследи за плитой.</b> Курица, рис и брокколи готовятся одновременно на трёх конфорках. Полоска каждой сама ползёт к зелёной зоне — тогда жми на конфорку: перевернуть, перемешать, снять. Тёмно-зелёный центр — идеально (+30). Не успел — подгорит. Со временем огонь сильнее, и окна накладываются друг на друга.</li><li><b>Подай ужин.</b> Перетащи три части блюда в подписанные области тарелки или используй кнопки.</li></ol>
    <div className="boss-notice"><b>МАМА ПОЗВОНИТ ВОВРЕМЯ. КАК ВСЕГДА.</b><p>Пока телефон звонит, руки заняты — ответь (+10) и возвращайся к плите. Три подгорания — повторная попытка. Нажатие раньше зелёной зоны только сбрасывает серию. Собирай серии точных действий и звёзды мастерства.</p></div>
    <p className="cook-small">Время готовки в игре условное и ускоренное.</p>
    <button className="full-button" onClick={onContinue}>Надеть фартук →</button><button className="text-button" onClick={onComic}>Прочитать комикс</button>
  </PagedPanel>;
}

