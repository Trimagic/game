import PagedPanel from '../PagedPanel';
import './schedule.css';
export const schedulePanels=[
  {title:'Новая жизнь. Новый ежедневник.',words:'Спорт есть. Ужин умею. Сон наладил. Осталось всё это куда-то поместить.',position:'0% 0%'},
  {title:'Идеальный план.',words:'Теперь осталось просто всё распланировать. Главное, чтобы дела не начали падать сверху.',position:'100% 0%'},
  {title:'Есть минутка?',words:'Срочный созвон идеально помещается туда, где я собирался ничего не делать.',position:'0% 100%'},
  {title:'Место для жизни.',words:'Планы можно передвинуть. Себя из них вычёркивать не буду.',position:'100% 100%'},
];
export function scheduleComicStyle(panel:number){return {backgroundImage:'url(/art/chapter-08-comic.png)',backgroundPosition:schedulePanels[panel].position,backgroundSize:'200% 200%',aspectRatio:'512 / 768'};}

export function ScheduleBrief({onContinue,onComic}:{onContinue:()=>void;onComic:()=>void}){return <PagedPanel className="paper-panel"><span className="eyebrow">ЭТАП 08 / РАСПОРЯДОК ДНЯ</span><h1>Впихнуть<br/><em>невпихуемое.</em></h1><p>Работа, сон, спорт и ужин падают сверху. Уложи дела без дыр: полная горизонтальная линия исчезает, освобождая время.</p><ol className="agenda-rules"><li><b>Семь линий — неделя.</b> Собери их, чтобы закончить главу. Можно убрать несколько линий одним ходом и получить больше очков.</li><li><b>Планы ускоряются.</b> Чем дальше, тем быстрее падают дела. Каждое пятое приходит под видом срочного созвона.</li><li><b>Завтра не резиновое.</b> Один раз можно заменить текущую фигуру следующей кнопкой «Перенести на завтра».</li></ol><div className="rules"><b>▦</b><p>← → — двигать, ↑ — повернуть, ↓ — опустить, пробел — сразу поставить на контур. C — перенос. На телефоне пользуйся кнопками под полем.</p></div><p>Справа показана следующая фигура. Контур на поле помогает выбрать место. Если новое дело не помещается сверху — попробуй собрать неделю заново. Пауза останавливает падение.</p><button className="full-button" onClick={onContinue}>Открыть ежедневник →</button><button className="text-button" onClick={onComic}>Прочитать комикс</button></PagedPanel>;}

