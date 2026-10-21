import './stairs.css';
export const stairsPanels = [
  { title: 'После спортзала.', words: 'Надо больше двигаться в обычной жизни.', position: '0% 0%' },
  { title: 'Момент выбора.', words: 'Лифт? Начну новую привычку прямо сейчас.', position: '100% 0%' },
  { title: 'Уверенный первый шаг.', words: 'Всего-то десятый этаж.', position: '0% 100%' },
  { title: 'Дополнительная нагрузка.', words: 'Арбуз тоже будет заниматься.', position: '100% 100%' },
];
export function stairsComicStyle(panel: number) { const h = panel < 2 ? 744 : 792; return { backgroundImage: 'url(/art/chapter-06-comic.png)', backgroundPosition: stairsPanels[panel].position, backgroundSize: `200% ${1536 / h * 100}%`, aspectRatio: `512 / ${h}` }; }
export function StairsBrief({ onContinue, onComic }: { onContinue: () => void; onComic: () => void }) {
  return <section className="paper-panel stairs-intro"><span className="eyebrow">ЭТАП 06 / ЛИФТ НЕ ДЛЯ НАС</span><h1>Всего-то<br/><em>десятый этаж.</em></h1><p>Герой прыгает сам. Направляй его на площадки и доберись до квартиры вместе с арбузом.</p><ol><li><b>1–3 этажи:</b> широкие площадки. Приземляйся сверху и выбирай следующий шаг.</li><li><b>4–6 этажи:</b> пакеты и открывающиеся двери. Мигающая рамка предупреждает о двери.</li><li><b>7–10 этажи:</b> движущиеся площадки и кот, который здесь главный.</li></ol><div className="stairs-legend"><span>━ Обычная</span><span>↔ Подвижная</span><span>↑ Пружина-срез</span><span>⚑ Передышка</span></div><div className="rules"><b>← →</b><p>Удерживай стрелки, A / D или кнопки на экране. Отпусти — герой перестанет двигаться вбок.</p></div><p>На 4-м и 7-м этажах — контрольные точки. После падения можно продолжить оттуда. Спешить необязательно: сосед на финише дождётся.</p><p className="control-hint">Пружины — необязательный рискованный срез. Обычный маршрут проходит без них. Прыжки по лестнице — только игровая условность.</p><button className="full-button" onClick={onContinue}>Лифт подождёт →</button><button className="text-button" onClick={onComic}>Прочитать комикс</button></section>;
}
