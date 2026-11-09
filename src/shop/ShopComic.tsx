import { useState } from 'react';
import { useComicFit } from '../useComicFit';
import '../bike/bike-comic.css';
import './shop-intro.css';
import { shopPanels as frames } from './ShopIntro';

export default function ShopComic({ onContinue, onExit }: { onContinue: () => void; onExit: () => void }) {
  const [frame, setFrame] = useState(0);
  const ref = useComicFit();
  const current = frames[frame];
  const last = frame === frames.length - 1;
  const next = () => last ? onContinue() : setFrame(value => value + 1);
  return <section ref={ref} className={`comic-reader bike-comic shop-comic shop-comic-frame-${frame}`} aria-label="Глава 3. Правильная закупка" onKeyDown={event => {
    if (event.key === 'ArrowRight') { event.preventDefault(); next(); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); setFrame(value => Math.max(0, value - 1)); }
  }}>
    <div className="section-heading"><button className="text-button" onClick={onExit}>← К главам</button><span className="eyebrow">ЗАКУПКА / {frame + 1} ИЗ {frames.length}</span></div>
    <div className="bike-comic-caption"><span>{current.place}</span><h1>{current.title}</h1></div>
    <div className="comic-panel bike-comic-panel">
      <svg key={frame} className="bike-comic-art" role="img" aria-label={current.description} viewBox={`${frame % 2 * 512} ${frame < 2 ? 0 : 715} 512 ${frame < 2 ? 715 : 821}`} preserveAspectRatio="xMidYMid slice"><image href="/art/chapter-03-comic.png" width="1024" height="1536"/></svg>
      {last && <span className="bike-comic-lettering shop-comic-sale" aria-hidden="true">−50%</span>}
      <div className="bike-comic-dialogue" key={`words-${frame}`} aria-label={'Мысли героя'} aria-live="polite" aria-atomic="true">
        <svg className="bike-dialogue-outline" viewBox="0 0 360 160" preserveAspectRatio="none" aria-hidden="true">
          {frame === 0 ? <><path vectorEffect="non-scaling-stroke" d="M180 35 C279 33 348 53 349 94 C350 133 288 151 180 151 C72 151 10 133 11 94 C12 53 81 33 180 35 Z"/><ellipse vectorEffect="non-scaling-stroke" cx="110" cy="22" rx="8" ry="6"/><ellipse vectorEffect="non-scaling-stroke" cx="96" cy="7" rx="4" ry="3.5"/></> : <path vectorEffect="non-scaling-stroke" d="M134 38 Q150 26 154 7 Q174 22 166 35 C282 32 348 53 349 94 C350 133 288 151 180 151 C72 151 10 133 11 94 C12 60 54 40 134 38 Z"/>}
        </svg><p>{current.words}</p>
      </div>
      <p className="bike-comic-narrator" key={`aside-${frame}`}>{current.aside}</p>
    </div>
    <div className="comic-navigation bike-comic-navigation"><button className="small-button" disabled={frame === 0} onClick={() => setFrame(value => value - 1)}>← Назад</button><div className="bike-comic-progress" aria-label="Выбор кадра">{frames.map((item, index) => <button key={item.title} className={index <= frame ? 'reached' : ''} aria-label={`Кадр ${index + 1}: ${item.title}`} aria-current={frame === index ? 'step' : undefined} onClick={() => setFrame(index)}><span/></button>)}</div><button onClick={next}>{last ? 'Беру тележку →' : 'Дальше →'}</button></div>
  </section>;
}
