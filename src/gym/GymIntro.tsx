import PagedPanel from '../PagedPanel';
import './gym.css';
export const gymPanels = [
  { title: 'Ужин был правильным.', words: 'Теперь бы ещё мышцы узнали, что мы начали новую жизнь.', position: '0% 0%' },
  { title: 'Тренер обещал лёгкую разминку.', words: 'Всего три подхода. Даже звучит недолго.', position: '100% 0%' },
  { title: 'Вниз. Держим. Вверх.', words: 'Почему у него секунды длиннее обычных?', position: '0% 100%' },
  { title: 'Последний повтор. Версия третья.', words: '«Ещё один» — это число или образ жизни?', position: '100% 100%' },
];
export function gymComicStyle(panel: number) {
  const height = panel < 2 ? 744 : 792;
  return { backgroundImage: 'url(/art/chapter-05-comic.png)', backgroundPosition: gymPanels[panel].position, backgroundSize: `200% ${1536 / height * 100}%`, aspectRatio: `512 / ${height}` };
}
export function GymBrief({ onContinue, onComic }: { onContinue: () => void; onComic: () => void }) {
  return <PagedPanel className="paper-panel gym-intro"><span className="eyebrow">ЭТАП 05 / КАЧАЙ В РИТМ</span><h1>Ещё один.<br/><em>Честно.</em></h1><p>Три подхода, 56 секунд и тренер с очень свободным пониманием слова «последний».</p><ol><li><b>Гантели · 90 BPM.</b> Нажимай, когда круг доходит до белой линии.</li><li><b>Приседания · 108 BPM.</b> Одной рукой удерживай длинную ноту, другой лови короткую. Отпусти удержание, когда хвост дойдёт до линии.</li><li><b>Финал · 126 BPM.</b> Чередование, удержания и две ноты одновременно.</li></ol><div className="rules"><b>← →</b><p>Клавиши ← / → или A / D. На телефоне — две большие кнопки. Для двойных нот нужны оба пальца.</p></div><p>Пройди до конца с точностью от 65%. Промах забирает 12 сил, попадание возвращает 2. Нажатия мимо ритма тоже тратят силы.</p><p><b>Второе дыхание.</b> Собери серию из 8 попаданий и нажми пробел или кнопку: один раз за тренировку вернёшь 25 сил. Сохрани этот шанс для трудного подхода.</p><p className="control-hint">Звук включается при старте. Можно играть без него: ориентируйся на дорожки. Это игровая условность, а не программа тренировки.</p><button className="full-button" onClick={onContinue}>В зал →</button><button className="text-button" onClick={onComic}>Прочитать комикс</button></PagedPanel>;
}


