import { useState } from 'react';
import { useComicFit } from '../useComicFit';
import '../bike/bike-comic.css';
import './pool-intro.css';

const frames = [
  { place: 'НА СЛЕДУЮЩЕЕ УТРО · БАССЕЙН', title: 'Здесь-то точно будет спокойно.', words: 'Никаких велосипедов. Никакой кожуры. Просто вода и спокойное кардио.', aside: 'Абонемент куплен. Ожидания — тоже.', description: 'Рыжеволосый герой в оранжевой шапочке стоит у бассейна с полотенцем на плече.' },
  { place: 'ЧЕРЕЗ МИНУТУ · ПЕРВЫЙ СЮРПРИЗ', title: 'Спокойствие продержалось недолго.', words: 'Стоп. Это ведь не… Нет. Проверять не будем. Разворачиваемся!', aside: 'Коричневый поплавок в программу не входил.', description: 'Герой в воде с ужасом смотрит на коричневый сюрприз, плывущий прямо к нему.' },
  { place: 'ДОРОЖКА № 2 · ВНЕПЛАНОВОЕ УСКОРЕНИЕ', title: 'Вот теперь настоящее кардио.', words: 'Зря я ругал банановую кожуру. Там хотя бы был тротуар!', aside: 'Техника спорная. Мотивация безупречная.', description: 'Герой изо всех сил плывёт кролем, оглядываясь на неприятный сюрприз позади.' },
  { place: 'ТЕМ ВРЕМЕНЕМ · НА СОСЕДНЕЙ ДОРОЖКЕ', title: 'Знакомься. Местная легенда.', words: 'Ты куда? У нас тут всё включено. Даже то, что не просили!', aside: 'Какун. Спокойного заплыва не обещает.', description: 'Усатый босс Какун в фиолетовой шапочке ухмыляется. Герой позади пытается привлечь внимание.' },
];

export default function PoolComic({ onContinue, onExit }: { onContinue: () => void; onExit: () => void }) {
  const [frame, setFrame] = useState(0);
  const ref = useComicFit();
  const current = frames[frame];
  const last = frame === frames.length - 1;
  const next = () => last ? onContinue() : setFrame(value => value + 1);
  return <section ref={ref} className={`comic-reader bike-comic pool-comic pool-comic-frame-${frame}`} aria-label="Глава 2. Заплыв с сюрпризом" onKeyDown={event => {
    if (event.key === 'ArrowRight') { event.preventDefault(); next(); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); setFrame(value => Math.max(0, value - 1)); }
  }}>
    <div className="section-heading"><button className="text-button" onClick={onExit}>← К главам</button><span className="eyebrow">ЗАПЛЫВ / {frame + 1} ИЗ {frames.length}</span></div>
    <div className="bike-comic-caption"><span>{current.place}</span><h1>{current.title}</h1></div>
    <div className="comic-panel bike-comic-panel">
      <svg key={frame} className="bike-comic-art" role="img" aria-label={current.description} viewBox={`${frame % 2 * 512} ${frame < 2 ? 0 : 768} 512 768`} preserveAspectRatio="xMidYMid slice"><image href="/art/chapter-02-comic.png" width="1024" height="1536"/></svg>
      {frame === 2 && <span className="bike-comic-lettering pool-comic-splash" aria-hidden="true">ПЛЮХ!</span>}
      <div className="bike-comic-dialogue" key={`words-${frame}`} aria-label={last ? 'Реплика Какуна' : frame === 0 ? 'Мысли героя' : 'Реплика героя'} aria-live="polite" aria-atomic="true">
        <svg className="bike-dialogue-outline" viewBox="0 0 360 160" preserveAspectRatio="none" aria-hidden="true">
          {frame === 0 ? <><path vectorEffect="non-scaling-stroke" d="M180 35 C279 33 348 53 349 94 C350 133 288 151 180 151 C72 151 10 133 11 94 C12 53 81 33 180 35 Z"/><ellipse vectorEffect="non-scaling-stroke" cx="110" cy="22" rx="8" ry="6"/><ellipse vectorEffect="non-scaling-stroke" cx="96" cy="7" rx="4" ry="3.5"/></> : <path vectorEffect="non-scaling-stroke" d="M134 38 Q150 26 154 7 Q174 22 166 35 C282 32 348 53 349 94 C350 133 288 151 180 151 C72 151 10 133 11 94 C12 60 54 40 134 38 Z"/>}
        </svg><p>{current.words}</p>
      </div>
      <p className="bike-comic-narrator" key={`aside-${frame}`}>{current.aside}</p>
    </div>
    <div className="comic-navigation bike-comic-navigation"><button className="small-button" disabled={frame === 0} onClick={() => setFrame(value => value - 1)}>← Назад</button><div className="bike-comic-progress" aria-label="Выбор кадра">{frames.map((item, index) => <button key={item.title} className={index <= frame ? 'reached' : ''} aria-label={`Кадр ${index + 1}: ${item.title}`} aria-current={frame === index ? 'step' : undefined} onClick={() => setFrame(index)}><span/></button>)}</div><button onClick={next}>{last ? 'Ищу выход →' : 'Дальше →'}</button></div>
  </section>;
}
