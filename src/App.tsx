import PagedPanel from './PagedPanel';
import {useComicFit} from './useComicFit';
import NightChapter from './night/NightChapter';
import DeliveryChapter from './delivery/DeliveryChapter';
import RemoteChapter from './remote/RemoteChapter';
import ScheduleGame from './schedule/ScheduleGame';
import { ScheduleBrief, schedulePanels, scheduleComicStyle } from './schedule/ScheduleIntro';
import { useCallback, useEffect, useState } from 'react';
import Game from './Game';
import PoolGame from './pool/PoolGame';
import ShopGame from './shop/ShopGame';
import RunGame from './run/RunGame';
import { RunBrief, runPanels, runComicStyle } from './run/RunIntro';
import SleepGame from './sleep/SleepGame';
import { SleepBrief, sleepPanels, sleepComicStyle } from './sleep/SleepIntro';
import GymGame from './gym/GymGame';
import { GymBrief, gymPanels, gymComicStyle } from './gym/GymIntro';
import CookGame from './cook/CookGame';
import { CookBrief, cookPanels, cookComicStyle } from './cook/CookIntro';
import { ShopBrief, shopPanels, shopComicStyle } from './shop/ShopIntro';
import { PoolBrief, PoolFacts, poolPanels } from './pool/PoolIntro';
import { isTelegram, progress, telegram } from './telegram';

function CastIcon({ viewBox }: { viewBox: string }) {
  return <svg className="cast-portrait" viewBox={viewBox} aria-hidden="true"><image href="/art/chapter-01-sprites.png" width="1000" height="1000" /></svg>;
}

const bikePanels = [
  { title: 'Обычное утро.', words: 'Так. Посмотрим, что скажут весы…', position: '0% 0%' },
  { title: 'Дело не только в цифрах.', words: 'Хочу больше энергии. Пора заняться собой!', position: '100% 0%' },
  { title: 'Начну с малого.', words: 'Шлем на месте. Велосипед готов. Поехали?', position: '0% 100%' },
  { title: 'Первый шаг. Точнее — оборот.', words: 'Всего один круг по парку. Главное — смотреть на дорогу!', position: '100% 100%' },
];
export default function App({initialChapter}:{initialChapter?:1|2|3|4|5|6|7|8|9|10|11}={}) {
  const comicRef=useComicFit();
  const [chapter, setChapter] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11>(initialChapter ?? 1);
  const panels = chapter === 8 ? schedulePanels : chapter === 7 ? runPanels : chapter === 6 ? sleepPanels : chapter === 5 ? gymPanels : chapter === 4 ? cookPanels : chapter === 3 ? shopPanels : chapter === 2 ? poolPanels : bikePanels;
  const [completed, setCompleted] = useState(0);
  const [panel, setPanel] = useState(0);
  const [screen, setScreen] = useState<'map' | 'comic' | 'brief' | 'facts' | 'game' | 'win'>(initialChapter ? initialChapter >= 9 ? 'game' : 'comic' : 'map');
  const [busy, setBusy] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setBusy(true); setError('');
    try { setCompleted(await progress()); setLoaded(true); }
    catch (e) { setError(e instanceof Error ? e.message : 'Ошибка загрузки'); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => { telegram?.ready(); telegram?.expand(); void load(); }, [load]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [screen, panel]);
  const win = useCallback(() => setScreen('win'), []);
  const exit = useCallback(() => { setError(''); setScreen('map'); }, []);
  async function save() {
    setBusy(true); setError('');
    try { setCompleted(await progress(chapter)); setScreen('map'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Ошибка сохранения'); }
    finally { setBusy(false); }
  }
  return <main className={screen === 'game' ? 'playing-page' : ''}>
    <nav className="masthead"><button className="wordmark" onClick={exit}>С НУЛЯ<span>!</span></button><span>МАЛЕНЬКАЯ ИСТОРИЯ<br/>БОЛЬШИХ ПЕРЕМЕН</span><span className="issue">ВЫПУСК {String(chapter).padStart(2, '0')}</span></nav>
    {error && <div role="alert" className="error">{error}{!loaded && <button onClick={() => void load()} disabled={busy}>Повторить</button>}</div>}
    {screen === 'map' && <>
      <header className="cover"><div className="cover-copy"><span className="eyebrow">ИНТЕРАКТИВНЫЙ КОМИКС</span><h1>Всё начинается<br/>с <em>одного<br/> оборота.</em></h1><p>Наш герой решил заняться собой.<br/>Помоги ему не свернуть с пути.</p><button disabled={busy || !loaded} onClick={() => { setChapter(1); setPanel(0); setScreen('comic'); }}>{busy ? 'Загрузка…' : completed >= 1 ? 'Перечитать историю →' : 'Начать историю →'}</button><span className="cover-note">КОМИКС + ВЕЛОЗАЕЗД · ОКОЛО 2 МИНУТ</span></div><div className="cover-art" role="img" aria-label="Рыжеволосый герой едет на велосипеде по парку"><span className="sticker">ПОЕХАЛИ!</span></div></header>
      <div className="chapter-heading"><h2>Путь к себе</h2><span>11 ЭТАПОВ · ОДИН ГЕРОЙ</span></div>
      <button className="chapter-card" disabled={busy || !loaded} onClick={() => { setChapter(1); setScreen('brief'); }}><span className="chapter-number">01</span><div><span className="eyebrow">{completed >= 1 ? 'ПРОЙДЕНО ✓' : 'ПЕРВЫЙ ЭТАП'}</span><h3>Крути педали</h3><p>Парк, велосипед и немного неожиданностей.</p></div><span className="chapter-arrow">↗</span></button>
      <button className="chapter-card pool-chapter" disabled={busy || !loaded || completed < 1} onClick={() => { setChapter(2); setPanel(0); setScreen('comic'); }}><span className="chapter-number">02</span><div><span className="eyebrow">{completed >= 2 ? 'ПРОЙДЕНО ✓' : completed >= 1 ? 'ВТОРОЙ ЭТАП' : 'ПОСЛЕ ВЕЛОЗАЕЗДА'}</span><h3>Заплыв с сюрпризом</h3><p>Бассейн, неожиданные препятствия и босс Какун.</p></div><span className="chapter-arrow">{completed >= 1 ? '↗' : '🔒'}</span></button>
      <button className="chapter-card shop-chapter" disabled={busy || !loaded || completed < 2} onClick={() => { setChapter(3); setPanel(0); setScreen('comic'); }}><span className="chapter-number">03</span><div><span className="eyebrow">{completed >= 3 ? 'ПРОЙДЕНО ✓' : completed >= 2 ? 'ТРЕТИЙ ЭТАП' : 'ПОСЛЕ БАССЕЙНА'}</span><h3>Правильная закупка</h3><p>Пять продуктов, один список и слишком много акций.</p></div><span className="chapter-arrow">{completed >= 2 ? '↗' : '🔒'}</span></button>
      <button className="chapter-card cook-chapter" disabled={busy || !loaded || completed < 3} onClick={() => { setChapter(4); setPanel(0); setScreen('comic'); }}><span className="chapter-number">04</span><div><span className="eyebrow">{completed >= 4 ? 'ПРОЙДЕНО ✓' : completed >= 3 ? 'ЧЕТВЁРТЫЙ ЭТАП' : 'ПОСЛЕ ЗАКУПКИ'}</span><h3>Диетический ужин</h3><p>Простой рецепт, две конфорки и один звонок.</p></div><span className="chapter-arrow">{completed >= 3 ? '↗' : '🔒'}</span></button>
      <button className="chapter-card gym-chapter" disabled={busy || !loaded || completed < 4} onClick={() => { setChapter(5); setPanel(0); setScreen('comic'); }}><span className="chapter-number">05</span><div><span className="eyebrow">{completed >= 5 ? 'ПРОЙДЕНО ✓' : completed >= 4 ? 'ПЯТЫЙ ЭТАП' : 'ПОСЛЕ УЖИНА'}</span><h3>Качай в ритм</h3><p>Три подхода и бесконечный последний повтор.</p></div><span className="chapter-arrow">{completed >= 4 ? '↗' : '🔒'}</span></button>
      <button className="chapter-card sleep-chapter" disabled={busy || !loaded || completed < 5} onClick={() => { setChapter(6); setPanel(0); setScreen('comic'); }}><span className="chapter-number">06</span><div><span className="eyebrow">{completed >= 6 ? 'ПРОЙДЕНО ✓' : completed >= 5 ? 'ШЕСТОЙ ЭТАП' : 'ПОСЛЕ СПОРТЗАЛА'}</span><h3>Ещё пять минут</h3><p>Уведомления не спят. А тебе пора.</p></div><span className="chapter-arrow">{completed >= 5 ? '↗' : '🔒'}</span></button>
      <button className="chapter-card run-chapter" disabled={busy || !loaded || completed < 6} onClick={() => { setChapter(7); setPanel(0); setScreen('comic'); }}><span className="chapter-number">07</span><div><span className="eyebrow">{completed >= 7 ? 'ПРОЙДЕНО ✓' : completed >= 6 ? 'СЕДЬМОЙ ЭТАП' : 'ПОСЛЕ ХОРОШЕГО СНА'}</span><h3>Утренний бег</h3><p>Один километр. Ни одного скучного шага.</p></div><span className="chapter-arrow">{completed >= 6 ? '↗' : '🔒'}</span></button>
      <button className="chapter-card" disabled={busy || !loaded || completed < 7} onClick={() => { setChapter(8); setPanel(0); setScreen('comic'); }}><span className="chapter-number">08</span><div><span className="eyebrow">{completed >= 8 ? 'ПРОЙДЕНО ✓' : completed >= 7 ? 'ВОСЬМОЙ ЭТАП' : 'ПОСЛЕ ПРОБЕЖКИ'}</span><h3>Всё по расписанию</h3><p>Дел много. День один. Отдых тоже в списке.</p></div><span className="chapter-arrow">{completed >= 7 ? '↗' : '🔒'}</span></button>
      <button className="chapter-card" disabled={busy || !loaded || completed < 8} onClick={() => { setChapter(9); setScreen('game'); }}><span className="chapter-number">09</span><div><span className="eyebrow">{completed >= 9 ? 'ПРОЙДЕНО ✓' : 'ПРОДОЛЖЕНИЕ ИСТОРИИ'}</span><h3>{completed >= 8 ? 'Следующая глава' : 'Впереди ещё многое'}</h3><p>{completed >= 8 ? 'Открой следующую страницу.' : 'После распорядка дня.'}</p></div><span className="chapter-arrow">{completed >= 8 ? '↗' : '🔒'}</span></button><button className="chapter-card" disabled={busy || !loaded || completed < 9} onClick={() => { setChapter(10); setScreen('game'); }}><span className="chapter-number">10</span><div><span className="eyebrow">{completed >= 10 ? 'ПРОЙДЕНО ✓' : 'ПРОДОЛЖЕНИЕ ИСТОРИИ'}</span><h3>{completed >= 9 ? 'Операция «Обед»' : 'Ещё одна история'}</h3><p>{completed >= 9 ? 'Аппетит требует изобретательности.' : 'После девятой главы.'}</p></div><span className="chapter-arrow">{completed >= 9 ? '↗' : '🔒'}</span></button><button className="chapter-card" disabled={busy || !loaded || completed < 10} onClick={() => { setChapter(11); setScreen('game'); }}><span className="chapter-number">11</span><div><span className="eyebrow">{completed >= 11 ? 'ПРОЙДЕНО ✓' : 'ФИНАЛЬНАЯ ГЛАВА'}</span><h3>{completed >= 10 ? 'Ночной маршрут' : 'Последняя страница'}</h3><p>{completed >= 10 ? 'Тапочки надеты. Главное — успеть.' : 'После десятой главы.'}</p></div><span className="chapter-arrow">{completed >= 10 ? '↗' : '🔒'}</span></button>
      <div className="save-note"><span className="save-dot"/>{isTelegram ? 'Прогресс сохраняется в твоём Telegram-профиле' : 'Деморежим · прогресс сохраняется в этом браузере'}</div>
    </>}
    {screen === 'comic' && <section ref={comicRef} className="comic-reader">
      <div className="section-heading"><button className="text-button" onClick={exit}>← К главам</button><span className="eyebrow">ПРОЛОГ / {panel + 1} ИЗ 4</span></div>
      <div className="comic-panel" style={chapter === 8 ? scheduleComicStyle(panel) : chapter === 7 ? runComicStyle(panel) : chapter === 6 ? sleepComicStyle(panel) : chapter === 5 ? gymComicStyle(panel) : chapter === 4 ? cookComicStyle(panel) : chapter === 3 ? shopComicStyle(panel) : { backgroundPosition: panels[panel].position, backgroundImage: `url(/art/chapter-0${chapter}-comic.png)`, ...(chapter === 1 ? {backgroundSize: `200% ${1536 / (panel < 2 ? 712 : 824) * 100}%`, aspectRatio: `512 / ${panel < 2 ? 712 : 824}`} : {}) }} role="group" aria-label={panels[panel].title}><span className="narration">{panels[panel].title}</span></div><div className="speech comic-dialogue">{panels[panel].words}</div>
      <div className="comic-navigation"><button className="small-button" disabled={panel === 0} onClick={() => setPanel(value => value - 1)}>← Назад</button><div className="dots" aria-label={`Кадр ${panel + 1} из 4`}>{panels.map((_, index) => <span key={index} className={index === panel ? 'active' : ''}/>)}</div><button onClick={() => panel < 3 ? setPanel(value => value + 1) : setScreen('brief')}>{panel < 3 ? 'Дальше →' : chapter === 8 ? 'К ежедневнику →' : chapter === 7 ? 'На пробежку →' : chapter === 6 ? 'Ко сну →' : chapter === 5 ? 'В зал →' : chapter === 4 ? 'На кухню →' : chapter === 3 ? 'За покупками →' : chapter === 2 ? 'В бассейн →' : 'Поехали →'}</button></div>
    </section>}
    {screen === 'brief' && chapter === 8 && <ScheduleBrief onContinue={() => setScreen('game')} onComic={() => { setPanel(0); setScreen('comic'); }}/> }
    {screen === 'brief' && chapter === 7 && <RunBrief onContinue={() => setScreen('game')} onComic={() => { setPanel(0); setScreen('comic'); }}/> }
    {screen === 'brief' && chapter === 6 && <SleepBrief onContinue={() => setScreen('game')} onComic={() => { setPanel(0); setScreen('comic'); }}/> }
    {screen === 'brief' && chapter === 5 && <GymBrief onContinue={() => setScreen('game')} onComic={() => { setPanel(0); setScreen('comic'); }}/> }
    {screen === 'brief' && chapter === 4 && <CookBrief onContinue={() => setScreen('game')} onComic={() => { setPanel(0); setScreen('comic'); }}/>}
    {screen === 'brief' && chapter === 3 && <ShopBrief onContinue={() => setScreen('game')} onComic={() => { setPanel(0); setScreen('comic'); }}/>}
    {screen === 'brief' && chapter === 2 && <PoolBrief onContinue={() => setScreen('facts')} onComic={() => { setPanel(0); setScreen('comic'); }}/>}
    {screen === 'brief' && chapter === 1 && <PagedPanel className="brief paper-panel"><span className="eyebrow">ЭТАП 01 / КРУТИ ПЕДАЛИ</span><h1>Парк полон<br/><em>сюрпризов.</em></h1><p>Проедь 500 метров. Перестраивайся между тремя полосами и оставляй прохожим достаточно места.</p><div className="obstacle-legend"><div><CastIcon viewBox="580 30 300 550"/><b>Бабушки</b><small>Гуляют по парку</small></div><div><CastIcon viewBox="140 600 230 380"/><b>Дети</b><small>Играют с мячом</small></div><div><CastIcon viewBox="520 640 410 310"/><b>Кожура</b><small>Лучше объехать</small></div></div><div className="rules"><b>← →</b><p>Стрелки на клавиатуре или кнопки на экране.<br/>Три ошибки — перезапуск. Один заезд — 40 секунд.</p></div><button className="full-button" onClick={() => setScreen('facts')}>Дальше →</button><button className="text-button" onClick={() => { setPanel(0); setScreen('comic'); }}>Прочитать комикс</button></PagedPanel>}
    {screen === 'facts' && chapter === 2 && <PoolFacts onContinue={() => setScreen('game')}/>}
    {screen === 'facts' && chapter === 1 && <PagedPanel className="paper-panel facts" aria-labelledby="facts-title">
      <span className="eyebrow">ПЕРЕД ЗАЕЗДОМ / МИР · 2021 ГОД</span>
      <h1 id="facts-title">Немного<br/><em>статистики.</em></h1>
      <dl className="facts-numbers">
        <div><dt>Дорожные травмы велосипедистов</dt><dd>≈ 9,8 млн</dd><p>Оценка числа случаев за 2021 год по данным GBD. Диапазон неопределённости: 8,3–11,7 млн.</p></div>
        <div><dt>Погибшие велосипедисты</dt><dd>≈ 71 000</dd><p>Оценка ВОЗ числа погибших на дорогах во всём мире за 2021 год.</p></div>
      </dl>
      <p className="facts-note">Это оценки из разных источников, а не единый реестр всех травм при катании.</p>
      <div className="facts-sources">Источники: <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC11997400/" target="_blank" rel="noopener noreferrer">исследование GBD 2021, таблица 1</a> · <a href="https://www.who.int/news/item/13-12-2023-despite-notable-progress-road-safety-remains-urgent-global-issue" target="_blank" rel="noopener noreferrer">ВОЗ, отчёт 2023</a></div>
      <button className="full-button" onClick={() => setScreen('game')}>Продолжить →</button>
    </PagedPanel>}
    {screen === 'game' && (chapter === 11 ? <NightChapter onComplete={() => void save()} onExit={exit} busy={busy}/> : chapter === 10 ? <DeliveryChapter onComplete={() => void save()} onExit={exit} busy={busy}/> : chapter === 9 ? <RemoteChapter onComplete={() => void save()} onExit={exit} busy={busy}/> : chapter === 8 ? <ScheduleGame onWin={win} onExit={exit}/> : chapter === 7 ? <RunGame onWin={win} onExit={exit}/> : chapter === 6 ? <SleepGame onWin={win} onExit={exit}/> : chapter === 5 ? <GymGame onWin={win} onExit={exit}/> : chapter === 4 ? <CookGame onWin={win} onExit={exit}/> : chapter === 3 ? <ShopGame onWin={win} onExit={exit}/> : chapter === 2 ? <PoolGame onWin={win} onExit={exit}/> : <Game onWin={win} onExit={exit}/>)}
    {screen === 'win' && <section className="paper-panel finish"><span className="eyebrow">ЭТАП {String(chapter).padStart(2, '0')} / ФИНИШ</span><span className="finish-burst">{chapter === 8 ? 'БАЛАНС!' : chapter === 7 ? '1 КМ!' : chapter === 6 ? 'ZZZ…' : chapter === 5 ? 'В РИТМ!' : chapter === 4 ? 'ГОТОВО!' : chapter === 3 ? '5 / 5!' : chapter === 2 ? '45 с!' : '500 м!'}</span><h1>{chapter === 8 ? 'В плане есть' : chapter === 7 ? 'Утро без' : chapter === 6 ? 'Ещё пять минут…' : chapter === 5 ? 'Последний —' : chapter === 4 ? 'Мам, теперь' : chapter === 3 ? 'Ужин почти' : chapter === 2 ? 'Какун остался' : 'Вот это'}<br/><em>{chapter === 8 ? 'место для себя.' : chapter === 7 ? 'стресса. Почти.' : chapter === 6 ? 'посплю.' : chapter === 5 ? 'значит последний!' : chapter === 4 ? 'я поел!' : chapter === 3 ? 'на столе!' : chapter === 2 ? 'с носом!' : 'начало!'}</em></h1><p>{chapter === 8 ? 'Неделя собрана. Работа, движение, еда и отдых наконец поместились. Идеальный план — тот, который можно менять, не забывая о себе.' : chapter === 7 ? 'Километр позади. Лужи, самокат и ветки не помешали начать день с движения. Осталось успеть на автобус. Кажется, разминка закончилась…' : chapter === 6 ? 'Уведомления замолчали, ролики закончились, следующий матч отменён. Ты добрался до кровати. Иногда лучший шаг к себе — просто выключить экран.' : chapter === 5 ? 'Три подхода позади. Ты поймал ритм, выдержал приседания и пережил тренерское «ещё один». Теперь мышцам нужен отдых. И тебе тоже.' : chapter === 4 ? 'Курица, гарнир и овощи — на тарелке. Первый домашний ужин готов. Рецепт обещал пятнадцать минут, зато гордости хватит на весь вечер.' : chapter === 3 ? 'Курица, рис, брокколи, помидоры и масло куплены. Бюджет выдержан. Осталось просто приготовить. В рецепте написано — пятнадцать минут…' : chapter === 2 ? 'Ты выбрался из бассейна! Кардио выполнено, абонемент мысленно сожжён. Пожалуй, пора попробовать здоровое питание…' : 'Первый круг позади. Не обязательно менять всю жизнь за один день — сегодня ты уже сделал шаг.'}</p><button disabled={busy} onClick={() => void save()}>{busy ? 'Сохраняем…' : 'Сохранить и к главам →'}</button><p className="control-hint">{chapter === 1 ? 'Дальше — заплыв с сюрпризом.' : chapter === 2 ? 'Дальше — правильная закупка.' : chapter === 3 ? 'Дальше — «Диетический ужин».' : chapter === 4 ? 'Дальше — «Качай в ритм».' : chapter === 5 ? 'Дальше — «Ещё пять минут».' : chapter === 6 ? 'Дальше — «Утренний бег».' : chapter === 7 ? 'Дальше — «Всё по расписанию».' : 'Следующая страница готова.'}</p></section>}
    {screen !== 'game' && <footer><b>С НУЛЯ!</b><span>ПРОДОЛЖЕНИЕ СЛЕДУЕТ…</span></footer>}
  </main>;
}








