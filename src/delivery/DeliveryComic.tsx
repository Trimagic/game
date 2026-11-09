import { useState } from 'react';
import { useComicFit } from '../useComicFit';
import '../bike/bike-comic.css';
import './delivery.css';
import { introFrames, outroFrames } from './DeliveryIntro';

export default function DeliveryComic({ onContinue, onExit, ending=false, busy=false }: { onContinue: () => void; onExit: () => void; ending?: boolean; busy?: boolean }) {
  const [frame, setFrame] = useState(0);
  const frames = ending ? outroFrames : introFrames;
  const ref = useComicFit();
  const current = frames[frame];
  const last = frame === frames.length - 1;
  const next = () => { if (!busy) last ? onContinue() : setFrame(value => value + 1); };
  return <section ref={ref} className={`comic-reader bike-comic delivery-comic ${ending ? "delivery-comic-ending" : "delivery-comic-intro"} delivery-comic-frame-${frame}`} aria-label={ending ? "Глава 10. Обед подан" : "Глава 10. Операция «Обед»"} onKeyDown={event => {
    if (event.key === 'ArrowRight') { event.preventDefault(); next(); }
    if (!busy && event.key === 'ArrowLeft') { event.preventDefault(); setFrame(value => Math.max(0, value - 1)); }
  }}>
    <div className="section-heading"><button className="text-button" onClick={onExit}>← К главам</button><span className="eyebrow">{ending ? 'ДОСТАВКА ПРИБЫЛА' : 'ОПЕРАЦИЯ «ОБЕД»'} / {frame + 1} ИЗ {frames.length}</span></div>
    <div className="bike-comic-caption"><span>{current.place}</span><h1>{current.title}</h1></div>
    <div className="comic-panel bike-comic-panel">
      <svg key={frame} className="bike-comic-art" role="img" aria-label={current.description} viewBox={`${frame * 384} ${ending ? 512 : 0} 384 512`} preserveAspectRatio="xMidYMid slice"><image href="/art/chapter-10-comic.png" width="1536" height="1024"/></svg>
      {!ending && frame === 2 && <span className="bike-comic-lettering delivery-comic-ping" aria-hidden="true">ЗАКАЗ ПРИНЯТ!</span>}
      <div className="bike-comic-dialogue" key={`words-${frame}`} aria-label={current.speaker} aria-live="polite" aria-atomic="true">
        <svg className="bike-dialogue-outline" viewBox="0 0 360 160" preserveAspectRatio="none" aria-hidden="true">
          {frame === 0 ? <><path vectorEffect="non-scaling-stroke" d="M180 35 C279 33 348 53 349 94 C350 133 288 151 180 151 C72 151 10 133 11 94 C12 53 81 33 180 35 Z"/><ellipse vectorEffect="non-scaling-stroke" cx="110" cy="22" rx="8" ry="6"/><ellipse vectorEffect="non-scaling-stroke" cx="96" cy="7" rx="4" ry="3.5"/></> : <path vectorEffect="non-scaling-stroke" d="M134 38 Q150 26 154 7 Q174 22 166 35 C282 32 348 53 349 94 C350 133 288 151 180 151 C72 151 10 133 11 94 C12 60 54 40 134 38 Z"/>}
        </svg><p>{current.words}</p>
      </div>
      <p className="bike-comic-narrator" key={`aside-${frame}`}>{current.aside}</p>
    </div>
    <div className="comic-navigation bike-comic-navigation"><button className="small-button" disabled={frame === 0 || busy} onClick={() => setFrame(value => value - 1)}>← Назад</button><div className="bike-comic-progress" aria-label="Выбор кадра">{frames.map((item, index) => <button key={item.title} className={index <= frame ? 'reached' : ''} aria-label={`Кадр ${index + 1}: ${item.title}`} aria-current={frame === index ? 'step' : undefined} disabled={busy} onClick={() => setFrame(index)}><span/></button>)}</div><button disabled={busy} onClick={next}>{busy ? 'Сохраняем…' : last ? ending ? 'К главам →' : 'К маршруту →' : 'Дальше →'}</button></div>
  </section>;
}
