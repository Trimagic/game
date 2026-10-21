import PagedPanel from '../PagedPanel';
import './sleep.css';
export const sleepPanels = [
  {title:'День прошёл с пользой.',words:'Спорт, нормальный ужин. Теперь — восемь часов сна.',position:'0% 0%'},
  {title:'Одна маленькая проверка.',words:'Только посмотрю уведомления. Пять минут.',position:'100% 0%'},
  {title:'У интернета другие планы.',words:'Ещё ролик. Ещё серия. Ещё один матч. А спать когда?',position:'0% 100%'},
  {title:'Новая полезная привычка.',words:'Всё. «Не беспокоить». Увидимся завтра.',position:'100% 100%'},
];
export function sleepComicStyle(panel:number){const h=panel<2?744:792;return {backgroundImage:'url(/art/chapter-06-sleep-comic.png)',backgroundPosition:sleepPanels[panel].position,backgroundSize:`200% ${1536/h*100}%`,aspectRatio:`512 / ${h}`};}
export function SleepBrief({onContinue,onComic}:{onContinue:()=>void;onComic:()=>void}){
  return <PagedPanel className="paper-panel sleep-intro"><span className="eyebrow">ЭТАП 06 / ЕЩЁ ПЯТЬ МИНУТ</span><h1>Спать пора.<br/><em>Но ещё ролик…</em></h1><p>Собери <b>600 очков сна</b> в ночном лабиринте, затем вернись к кровати наверху. Каждая светящаяся искра даёт 10 очков.</p><div className="sleep-cast"><span>! Уведомления</span><span>▶ YouTube</span><span>▤ Кино</span><span>✚ Игры</span></div><p>Они просыпаются по очереди и преследуют тебя. После 300 очков становятся быстрее; когда кровать откроется, начнётся финальная погоня.</p><div className="rules"><b>☾</b><p>Четыре луны включают «Не беспокоить» на 7 секунд. Преследователи убегают; при встрече можно отправить их отдыхать.</p></div><p>У тебя три попытки не отвлечься. При столкновении очки сохраняются, герой возвращается вниз. После третьего — новый раунд.</p><p className="control-hint">Стрелки / WASD, четыре кнопки или свайпы по лабиринту. Направление задаётся нажатием; герой движется сам. Поворот можно задать заранее. Очки сна — игровая условность.</p><button className="full-button" onClick={onContinue}>Пора выключаться →</button><button className="text-button" onClick={onComic}>Прочитать комикс</button></PagedPanel>;
}

