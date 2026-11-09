import { useState, type CSSProperties } from 'react';
import { useComicFit } from '../useComicFit';
import './bike-comic.css';

const frames = [
  {
    place: '08:07 · ДОМА', title: 'Понедельник всё-таки наступил.',
    words: 'Так. «Начну с понедельника» больше не работает. Сегодня как раз он.',
    aside: 'Весы молчат. Отговорки тоже закончились.',
    effect: 'ХМ…', position: '0% 0%',
    description: 'Сонный рыжеволосый герой стоит на весах в ванной и задумчиво смотрит вниз.',
  },
  {
    place: '08:09 · ПЛАН СОЗРЕЛ', title: 'А если без великих подвигов?',
    words: 'Марафон подождёт. Для начала — один круг по парку. Это я могу.',
    aside: 'Впервые план звучит лучше, чем «ещё пять минут».',
    effect: 'А ЧТО, ЕСЛИ…', position: '100% 0%',
    description: 'Герой подпирает подбородок рукой: вместо сомнений у него появляется идея.',
  },
  {
    place: '08:24 · УЖЕ НА УЛИЦЕ', title: 'Самое сложное — выйти из дома.',
    words: 'Шлем застегнул. Велосипед нашёл. Главное — не передумать у подъезда.',
    aside: 'Поздно. Он уже улыбается.',
    effect: 'ЩЁЛК!', position: '0% 100%',
    description: 'На улице герой улыбается и застёгивает ремешок оранжевого велосипедного шлема.',
  },
  {
    place: '08:30 · ПАРК', title: 'Один круг. Что может пойти не так?',
    words: 'Так, педали крутятся. Ветер в лицо. А это… кто там впереди?',
    aside: 'В парке своя жизнь. Теперь руль у тебя.',
    effect: 'ТВОЙ ХОД!', position: '100% 100%',
    description: 'Герой едет на бирюзовом велосипеде по солнечному парку. Впереди его первый заезд.',
  },
];

export default function BikeComic({ onContinue, onExit }: { onContinue: () => void; onExit: () => void }) {
  const [frame, setFrame] = useState(0);
  const ref = useComicFit();
  const current = frames[frame];
  const last = frame === frames.length - 1;
  const height = frame < 2 ? 712 : 824;
  const next = () => last ? onContinue() : setFrame(value => value + 1);
  return <section ref={ref} className="comic-reader bike-comic" aria-label="Глава 1. Один круг" onKeyDown={event => {
    if (event.key === 'ArrowRight') { event.preventDefault(); next(); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); setFrame(value => Math.max(0, value - 1)); }
  }}>
    <div className="section-heading"><button className="text-button" onClick={onExit}>← К главам</button><span className="eyebrow">ОДИН КРУГ / {frame + 1} ИЗ {frames.length}</span></div>
    <div className="bike-comic-caption"><span>{current.place}</span><h1>{current.title}</h1></div>
    <div className={`comic-panel bike-comic-panel bike-comic-frame-${frame}`} style={{ aspectRatio: `512 / ${height}` }}>
      <div key={frame} className="bike-comic-art" role="img" aria-label={current.description} style={{ backgroundPosition: current.position, backgroundSize: `200% ${1536 / height * 100}%`, '--comic-drift': frame === 1 ? '1.025' : '1.012' } as CSSProperties}/>
      <span key={`effect-${frame}`} className="bike-comic-effect" aria-hidden="true">{current.effect}</span>
    </div>
    <div className="bike-comic-dialogue" key={`dialogue-${frame}`} aria-live="polite" aria-atomic="true"><span className="bike-comic-voice">{last ? 'ГЕРОЙ · УЖЕ В ДВИЖЕНИИ' : 'ГЕРОЙ · МЫСЛИ ВСЛУХ'}</span><p>{current.words}</p><small>{current.aside}</small></div>
    <div className="comic-navigation bike-comic-navigation"><button className="small-button" disabled={frame === 0} onClick={() => setFrame(value => value - 1)}>← Назад</button><div className="bike-comic-progress" aria-label="Выбор кадра">{frames.map((item, index) => <button key={item.place} className={index <= frame ? 'reached' : ''} aria-label={`Кадр ${index + 1}: ${item.title}`} aria-current={index === frame ? 'step' : undefined} onClick={() => setFrame(index)}><span/></button>)}</div><button onClick={next}>{last ? 'Беру руль →' : 'Дальше →'}</button></div>
  </section>;
}
