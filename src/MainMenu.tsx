import { chapters, canOpenChapter, resumeChapter, type Chapter } from './chapters';
import { GameIcon } from './night/ChapterOrbit';
import './menu.css';

export default function MainMenu({completed,busy,isTelegram,onOpen}:{completed:number;busy:boolean;isTelegram:boolean;onOpen:(chapter:Chapter)=>void}){
 const next=resumeChapter(completed),finished=completed===11;
 return <div className="journey-menu">
  <header className="journey-hero">
   <div className="journey-art"><img src="/art/main-menu-cover.png" alt="Рыжий герой с велосипедом, золотая дорожка и комиксные значки"/><span className="journey-stamp">ВЫПУСК<br/><b>28</b></span></div>
   <div className="journey-copy"><span className="eyebrow">КОМИКС, В КОТОРЫЙ ИГРАЮТ</span><h1 className="journey-logo"><img src="/art/game-logo.svg" alt="Ещё один годик"/></h1><p className="journey-tagline"><span className="tagline-plan">У героя был план.</span><span className="tagline-twist"><span>У жизни —</span><strong>чувство юмора.<svg viewBox="0 0 260 14" preserveAspectRatio="none" aria-hidden="true"><path d="M4 8Q105 1 253 5M24 12q112-5 211-2"/></svg></strong><svg className="tagline-spark" viewBox="0 0 32 32" aria-hidden="true"><path d="m16 2 3 10 11 4-11 3-3 11-4-11-10-3 10-4Z"/></svg></span></p><button disabled={busy} onClick={()=>onOpen(next)}>{busy?'Загружаем историю…':finished?'Пережить всё ещё раз →':completed?`Продолжить · глава ${String(next).padStart(2,'0')} →`:'Ну что, поехали? →'}</button><span className="journey-small">КОМИКС → ЗАДАНИЕ → НОВАЯ ГЛАВА</span></div>
  </header>
  <section className="journey-progress" aria-label={`Пройдено ${completed} из 11 глав`}><div><span className="eyebrow">ТВОЯ ИСТОРИЯ</span><h2>{finished?'Вот это приключение!':completed?'Уже есть что вспомнить.':'Всё ещё впереди.'}</h2></div><strong>{String(completed).padStart(2,'0')}<span> / 11</span></strong><div className="journey-track" aria-hidden="true">{chapters.map((_,i)=><span key={i} className={i<completed?'done':i===completed?'current':''}/>)}</div></section>
  <div className="journey-heading"><h2>Карта приключений</h2><span>ПО ОДНОЙ ГЛАВЕ ЗА РАЗ</span></div>
  <div className="journey-chapters">{chapters.map(([title,task,kind],i)=>{
   const id=i+1 as Chapter,done=id<=completed,locked=!canOpenChapter(completed,id);
   if(locked)return null;
   return <button key={id} disabled={busy} className={`journey-card ${done?'is-done':'is-current'}`} onClick={()=>onOpen(id)} aria-label={`Глава ${id}. ${title}. ${done?'Пройдено. Играть снова':'Доступно'}`}>
    <span className="journey-icon"><svg viewBox="0 0 64 64" aria-hidden="true"><GameIcon index={i}/></svg><small>{String(id).padStart(2,'0')}</small></span>
    <span className="journey-card-copy"><span className="journey-kind">{kind}</span><h3>{title}</h3><span className="journey-task">{task}</span><span className="journey-state">{done?'✓ Пройдено · сыграть ещё':'Твой следующий шаг'}</span></span>
    <span className="journey-card-end">{done?'↻':'→'}</span>
   </button>;
  })}</div>
  {!finished&&<p className="journey-mystery"><span aria-hidden="true">✦</span> Дальше — сюрприз.<small>Новая глава появится, когда закончишь эту.</small></p>}
  <p className="journey-save"><span aria-hidden="true">●</span> {isTelegram?'Прогресс сохраняется в твоём Telegram-профиле':'Прогресс сохраняется в этом браузере'}</p>
 </div>;
}
