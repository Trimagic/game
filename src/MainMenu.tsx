import { chapters, canOpenChapter, resumeChapter, type Chapter } from './chapters';
import { GameIcon } from './night/ChapterOrbit';
import './menu.css';

function Lock(){return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15" r="1"/></svg>}
export default function MainMenu({completed,busy,isTelegram,onOpen}:{completed:number;busy:boolean;isTelegram:boolean;onOpen:(chapter:Chapter)=>void}){
 const next=resumeChapter(completed),finished=completed===11;
 return <div className="journey-menu">
  <header className="journey-hero">
   <div className="journey-art"><img src="/art/main-menu-cover.png" alt="Рыжий герой с велосипедом: впереди бассейн, покупки и ещё целая история"/><span className="journey-stamp">11 ГЛАВ<br/><b>ОДИН ГЕРОЙ</b></span></div>
   <div className="journey-copy"><span className="eyebrow">КОМИКС, В КОТОРЫЙ ИГРАЮТ</span><h1>Ещё один<br/><em>годик.</em><span aria-hidden="true">✦</span></h1><p>Началось с «займусь собой».<br/>А дальше… лучше сыграть самому.</p><button disabled={busy} onClick={()=>onOpen(next)}>{busy?'Загружаем историю…':finished?'Пережить всё ещё раз →':completed?`Продолжить · глава ${String(next).padStart(2,'0')} →`:'Ну что, поехали? →'}</button><span className="journey-small">КОМИКС → ЗАДАНИЕ → НОВАЯ ГЛАВА</span></div>
  </header>
  <section className="journey-progress" aria-label={`Пройдено ${completed} из 11 глав`}><div><span className="eyebrow">ТВОЯ ИСТОРИЯ</span><h2>{finished?'Вот это приключение!':completed?'Уже есть что вспомнить.':'Всё ещё впереди.'}</h2></div><strong>{String(completed).padStart(2,'0')}<span> / 11</span></strong><div className="journey-track" aria-hidden="true">{chapters.map((_,i)=><span key={i} className={i<completed?'done':i===completed?'current':''}/>)}</div></section>
  <div className="journey-heading"><h2>Карта приключений</h2><span>ПО ОДНОЙ ГЛАВЕ ЗА РАЗ</span></div>
  <div className="journey-chapters">{chapters.map(([title,task,kind],i)=>{
   const id=i+1 as Chapter,done=id<=completed,locked=!canOpenChapter(completed,id);
   return <button key={id} disabled={busy||locked} className={`journey-card ${done?'is-done':locked?'is-locked':'is-current'}`} onClick={()=>onOpen(id)} aria-label={`Глава ${id}. ${title}. ${done?'Пройдено. Играть снова':locked?`Закрыто. После главы ${id-1}`:'Доступно'}`}>
    <span className="journey-icon"><svg viewBox="0 0 64 64" aria-hidden="true"><GameIcon index={i}/></svg><small>{String(id).padStart(2,'0')}</small></span>
    <span className="journey-card-copy"><span className="journey-kind">{kind}</span><h3>{title}</h3><span className="journey-task">{task}</span><span className="journey-state">{done?'✓ Пройдено · сыграть ещё':locked?`Откроется после главы ${String(id-1).padStart(2,'0')}`:'Твой следующий шаг'}</span></span>
    <span className="journey-card-end">{locked?<Lock/>:done?'↻':'→'}</span>
   </button>;
  })}</div>
  <p className="journey-save"><span aria-hidden="true">●</span> {isTelegram?'Прогресс сохраняется в твоём Telegram-профиле':'Прогресс сохраняется в этом браузере'}</p>
 </div>;
}
