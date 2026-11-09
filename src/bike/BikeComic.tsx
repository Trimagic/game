import { useEffect, useState, type CSSProperties } from 'react';
import { useComicFit } from '../useComicFit';
import './bike-comic.css';

const frames = [
  {
    place: '08:07 · ДОМА', title: 'Понедельник всё-таки наступил.',
    words: 'Так. «Начну с понедельника» больше не работает. Сегодня как раз он.',
    aside: 'Весы молчат. Отговорки тоже закончились.',
    effect: 'Хм…', lettering: 'thought', position: '0% 0%',
    description: 'Сонный рыжеволосый герой стоит на весах в ванной и задумчиво смотрит вниз.',
  },
  {
    place: '08:09 · ПЛАН СОЗРЕЛ', title: 'А если без великих подвигов?',
    words: 'Марафон подождёт. Для начала — один круг по парку. Это я могу.',
    aside: 'Впервые план звучит лучше, чем «ещё пять минут».',
    effect: 'А если\nпросто начать?', lettering: 'idea', position: '100% 0%',
    description: 'Герой подпирает подбородок рукой: вместо сомнений у него появляется идея.',
  },
  {
    place: '08:24 · УЖЕ НА УЛИЦЕ', title: 'Самое сложное — выйти из дома.',
    words: 'Шлем застегнул. Велосипед нашёл. Главное — не передумать у подъезда.',
    aside: 'Поздно. Он уже улыбается.',
    effect: 'ЩЁЛК!', lettering: 'snap', position: '0% 100%',
    description: 'На улице герой улыбается и застёгивает ремешок оранжевого велосипедного шлема.',
  },
  {
    place: '08:30 · ПАРК', title: 'Пока всё идёт по плану.',
    words: 'О, а это приятно. Ветер, солнце… Может, даже второй круг?',
    aside: 'Кажется, он слишком рано расслабился.',
    effect: 'ФР-Р…', lettering: 'ride', position: '100% 100%',
    description: 'Герой едет на бирюзовом велосипеде по солнечному парку. Впереди его первый заезд.',
  },
  {
    place: '08:31 · ПАРК ОЖИЛ', title: 'А у парка — свои планы.',
    words: 'Так. Бабушку пропускаем, мяч объезжаем… А звонок здесь вообще есть?',
    aside: 'Есть. И руль тоже. Теперь твой выход.',
    effect: 'ДЗЫНЬ!', lettering: 'bell', position: '50% 50%',
    description: 'Вид из-за плеча велосипедиста: впереди дорожку пересекает бабушка, с газона катится мяч. Герой готовится уступить дорогу.',
  },
];

export default function BikeComic({ onContinue, onExit }: { onContinue: () => void; onExit: () => void }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const image = new Image();
    image.decoding = 'async';
    image.src = '/art/chapter-01-park-surprise.png';
  }, []);
  const ref = useComicFit();
  const current = frames[frame];
  const last = frame === frames.length - 1;
  const height = frame < 2 ? 712 : 824;
  const extraScene = frame === 4;
  const next = () => last ? onContinue() : setFrame(value => value + 1);
  return <section ref={ref} className="comic-reader bike-comic" aria-label="Глава 1. Один круг" onKeyDown={event => {
    if (event.key === 'ArrowRight') { event.preventDefault(); next(); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); setFrame(value => Math.max(0, value - 1)); }
  }}>
    <div className="section-heading"><button className="text-button" onClick={onExit}>← К главам</button><span className="eyebrow">ОДИН КРУГ / {frame + 1} ИЗ {frames.length}</span></div>
    <div className="bike-comic-caption"><span>{current.place}</span><h1>{current.title}</h1></div>
    <div className={`comic-panel bike-comic-panel bike-comic-frame-${frame}`} style={{ aspectRatio: extraScene ? '2 / 3' : `512 / ${height}` }}>
      <div key={frame} className="bike-comic-art" role="img" aria-label={current.description} style={{ backgroundImage: extraScene ? 'url(/art/chapter-01-park-surprise.png)' : undefined, backgroundPosition: current.position, backgroundSize: extraScene ? 'cover' : `200% ${1536 / height * 100}%`, '--comic-drift': frame === 1 ? '1.025' : '1.012' } as CSSProperties}/>
      <span key={`effect-${frame}`} className={`bike-comic-lettering bike-lettering-${current.lettering}`} aria-hidden="true">{current.lettering === 'snap' || current.lettering === 'bell' ? <svg className="bike-lettering-rays" viewBox="0 0 160 90"><path d="M15 30 2 20M25 15 20 2M52 12 51 0M115 12 122 0M141 28 157 17M143 60 159 67M117 78 122 89M35 73 28 87M14 53 0 57"/></svg> : null}<span>{current.effect}</span></span>
    </div>
    <div className="bike-comic-dialogue" key={`dialogue-${frame}`} aria-live="polite" aria-atomic="true"><span className="bike-comic-voice">{last ? 'ГЕРОЙ · УЖЕ В ДВИЖЕНИИ' : 'ГЕРОЙ · МЫСЛИ ВСЛУХ'}</span><p>{current.words}</p><small>{current.aside}</small></div>
    <div className="comic-navigation bike-comic-navigation"><button className="small-button" disabled={frame === 0} onClick={() => setFrame(value => value - 1)}>← Назад</button><div className="bike-comic-progress" aria-label="Выбор кадра">{frames.map((item, index) => <button key={item.place} className={index <= frame ? 'reached' : ''} aria-label={`Кадр ${index + 1}: ${item.title}`} aria-current={index === frame ? 'step' : undefined} onClick={() => setFrame(index)}><span/></button>)}</div><button onClick={next}>{last ? 'Беру руль →' : 'Дальше →'}</button></div>
  </section>;
}
