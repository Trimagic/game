import PagedPanel from '../PagedPanel';
import './run.css';
export const runPanels=[
  {title:'Наконец-то выспался.',words:'Вот что значит вовремя убрать телефон. Даже кроссовки радуются.',position:'0% 0%'},
  {title:'План на утро: без стресса.',words:'Один спокойный километр. Часы обещают лёгкую тренировку.',position:'100% 0%'},
  {title:'У парка своё мнение.',words:'У нас с часами разные определения слова «лёгкая».',position:'0% 100%'},
  {title:'Главное — смотреть вперёд.',words:'Лужу перепрыгну. Под веткой пригнусь. Поехали… то есть побежали!',position:'100% 100%'},
];
export function runComicStyle(panel:number){const h=panel<2?744:792;return{backgroundImage:'url(/art/chapter-07-comic.png)',backgroundPosition:runPanels[panel].position,backgroundSize:`200% ${1536/h*100}%`,aspectRatio:`512 / ${h}`};}
export function RunBrief({onContinue,onComic}:{onContinue:()=>void;onComic:()=>void}){
  return <PagedPanel className="paper-panel run-intro"><span className="eyebrow">ЭТАП 07 / УТРЕННИЙ БЕГ</span><h1>Лёгкий бег.<br/><em>По версии часов.</em></h1><p>Пробеги <b>1 км за игровой раунд в 60 секунд</b>. Герой бежит сам, а ты выбираешь момент для прыжка или пригибания.</p><ol><li><b>Первые 300 метров:</b> перепрыгивай лужи, пакеты и самокат.</li><li><b>Середина:</b> под низкими ветками нужно пригнуться. Скорость растёт.</li><li><b>Финиш:</b> чередуй действия и перепрыгивай барьеры и два пакета за один раз.</li></ol><div className="rules"><b>↑ ↓</b><p>Пробел / ↑ / W — прыжок. Удерживай ↓ / S, чтобы пригнуться. На телефоне — две кнопки.</p></div><p><b>Искры и фокус.</b> Собирай золотые искры в прыжке и под ветками. Пять искр дают 3 секунды замедления: нажми F или «Фокус». Дистанция в замедлении тоже идёт медленнее. Препятствия без столкновений растят серию и приносят больше очков.</p><p>Три сердца. Каждое столкновение забирает одно; после удара есть короткая защита. Третья ошибка — повторная попытка.</p><p className="control-hint">Во время прыжка повторное нажатие не подбрасывает героя выше. Дистанция и темп условные, не спортивный норматив.</p><button className="full-button" onClick={onContinue}>На пробежку →</button><button className="text-button" onClick={onComic}>Прочитать комикс</button></PagedPanel>;
}


