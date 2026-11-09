import { useState } from 'react';
import { useComicFit } from '../useComicFit';
import '../bike/bike-comic.css';
import './night.css';
import {introFrames,outroFrames,epilogueFrames} from './NightIntro';

export default function NightComic({ onContinue, onExit, variant="intro", busy=false }: { onContinue: () => void; onExit: () => void; variant?: "intro"|"outro"|"epilogue"; busy?: boolean }) {
  const [frame, setFrame] = useState(0);
  const ending = variant === "outro";
  const epilogue = variant === "epilogue";
  const frames = epilogue ? epilogueFrames : ending ? outroFrames : introFrames;
  const ref = useComicFit();
  const current = frames[frame];
  const last = frame === frames.length - 1;
  const next = () => { if (!busy) last ? onContinue() : setFrame(value => value + 1); };
  return <section ref={ref} className={`comic-reader bike-comic night-comic ${epilogue ? "night-epilogue" : ending ? "night-comic-ending" : "night-comic-intro"} night-comic-frame-${frame}`} aria-label={epilogue ? "Последний поворот" : ending ? "Глава 11. После отбоя" : "Глава 11. Ночной маршрут"} onKeyDown={event => {
    if (event.key === 'ArrowRight') { event.preventDefault(); next(); }
    if (!busy && event.key === 'ArrowLeft') { event.preventDefault(); setFrame(value => Math.max(0, value - 1)); }
  }}>
    <div className="section-heading"><button className="text-button" onClick={onExit}>← К главам</button><span className="eyebrow">{epilogue ? 'ПОСЛЕДНИЙ ПОВОРОТ' : ending ? 'ПОСЛЕ ОТБОЯ' : 'НОЧНОЙ МАРШРУТ'} / {frame + 1} ИЗ {frames.length}</span></div>
    <div className="bike-comic-caption"><span>{current.place}</span><h1>{current.title}</h1></div>
    <div className="comic-panel bike-comic-panel">
      <svg key={frame} className="bike-comic-art" role="img" aria-label={current.description} viewBox={epilogue ? `${frame % 3 * 512} ${frame % 6 < 3 ? 0 : 512} 512 512` : `${frame * 384} ${ending ? 476 : 0} 384 ${ending ? 548 : 476}`} preserveAspectRatio="xMidYMid slice"><image href={epilogue ? `/art/epilogue-${frame < 6 ? "doctor" : "choice"}.png` : "/art/chapter-11-comic.png"} width="1536" height="1024"/></svg>
      {!epilogue && ending && frame === 2 && <span className="bike-comic-lettering night-comic-click" aria-hidden="true">ЩЁЛК!</span>}
      <div className="bike-comic-dialogue" key={`words-${frame}`} aria-label={current.speaker} aria-live="polite" aria-atomic="true">
        <svg className="bike-dialogue-outline" viewBox="0 0 360 160" preserveAspectRatio="none" aria-hidden="true">
          {frame === 0 ? <><path vectorEffect="non-scaling-stroke" d="M180 35 C279 33 348 53 349 94 C350 133 288 151 180 151 C72 151 10 133 11 94 C12 53 81 33 180 35 Z"/><ellipse vectorEffect="non-scaling-stroke" cx="110" cy="22" rx="8" ry="6"/><ellipse vectorEffect="non-scaling-stroke" cx="96" cy="7" rx="4" ry="3.5"/></> : <path vectorEffect="non-scaling-stroke" d="M134 38 Q150 26 154 7 Q174 22 166 35 C282 32 348 53 349 94 C350 133 288 151 180 151 C72 151 10 133 11 94 C12 60 54 40 134 38 Z"/>}
        </svg><p>{current.words}</p>
      </div>
      <p className="bike-comic-narrator" key={`aside-${frame}`}>{current.aside}</p>
    </div>
    <div className="comic-navigation bike-comic-navigation"><button className="small-button" disabled={frame === 0 || busy} onClick={() => setFrame(value => value - 1)}>← Назад</button>{epilogue ? <span className="night-page-count" aria-label={`Кадр ${frame+1} из ${frames.length}`}>{frame+1}/{frames.length}</span> : <div className="bike-comic-progress" aria-label="Выбор кадра">{frames.map((item, index) => <button key={item.title} className={index <= frame ? 'reached' : ''} aria-label={`Кадр ${index + 1}: ${item.title}`} aria-current={frame === index ? 'step' : undefined} disabled={busy} onClick={() => setFrame(index)}><span/></button>)}</div>}<button className={epilogue && frame === 7 ? "night-choice-button" : undefined} disabled={busy} onClick={next}>{busy ? 'Сохраняем…' : epilogue && frame === 7 ? 'Выбрать правильный путь →' : last ? epilogue ? 'Забрать награду →' : ending ? 'Последний поворот →' : 'Выбрать правильный путь →' : epilogue && frame === 5 ? 'Открыть глаза →' : 'Дальше →'}</button></div>
  </section>;
}
