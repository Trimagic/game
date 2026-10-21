import PagedPanel from '../PagedPanel';
import {useComicFit} from '../useComicFit';
import Epilogue from './Epilogue';
import {useEffect,useState} from 'react';
import ArcadeGame from '../arcade/ArcadeGame';
import './night.css';
const intro=[
 ['Три часа ночи.','Проснулся. Будильник молчит. Зато мочевой пузырь объявил срочное совещание.'],
 ['Компромисс не принят.','Утка у кровати? Нет уж. До настоящего туалета я ещё дойду сам.'],
 ['Коридор возможностей.','Днём здесь просто коридор. Ночью — полоса препятствий с очень конкретной мотивацией.'],
 ['Главное — успеть.','Тапочки надеты. Маршрут понятен. Теперь бы колени не попросили перерыв.'],
];
const outro=[
 ['Финиш под замком.','Дошёл. Даже не опоздал. Только туалет закрыт на ночь. Очень предусмотрительно.'],
 ['Экстренное озеленение.','Герой исчезает за ширмой рядом с фикусом. Цветок такого ухода не заказывал.'],
 ['Ночной обход.','Щёлк — загорается свет. «Так. А кто это у нас поливает растения по ночам?»'],
 ['Новый уровень комфорта.','Медсестра вручает упаковку: «Теперь на ночь — подгузники». Сорок лет дисциплины. И вот — новая экипировка.'],
];
export default function NightChapter({onComplete,onExit,busy=false}:{onComplete:()=>void;onExit:()=>void;busy?:boolean}){
 const comicRef=useComicFit();
 const [stage,setStage]=useState<'intro'|'brief'|'game'|'outro'|'epilogue'>('intro'),[panel,setPanel]=useState(0);
 useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});},[stage,panel]);
 if(stage==='epilogue')return <Epilogue onComplete={onComplete} onExit={onExit} busy={busy}/>;
 if(stage==='game')return <ArcadeGame kind="night" onWin={()=>{setPanel(0);setStage('outro');}} onExit={onExit}/>;
 if(stage==='brief')return <PagedPanel className="paper-panel"><span className="eyebrow">ГЛАВА 11 / НОЧНОЙ МАРШРУТ</span><h1>Всего один<br/><em>коридор.</em></h1><p>Доберись до туалета, пока не закончится терпение. По дороге — тумбочки, ремонтные участки, мокрый пол и забытая тележка.</p><div className="rules"><b>↑</b><p>← → / A D — идти. Пробел / ↑ / W — прыгать. Удерживай прыжок для большей высоты. На телефоне можно одновременно держать движение и прыжок.</p></div><p>Лунные жетоны возвращают 12 терпения. Лужа или тележка отнимает 18. Падение в ремонтный участок — повторная попытка.</p><button onClick={()=>setStage('game')}>В коридор →</button><button className="text-button" onClick={onExit}>К главам</button></PagedPanel>;
 const ending=stage==='outro',panels=ending?outro:intro,cell=panel+(ending?4:0);
 return <section ref={comicRef} className="comic-reader"><div className="section-heading"><button className="text-button" onClick={onExit}>← К главам</button><span className="eyebrow">{ending?'ПОСЛЕ ОТБОЯ':'НОЧНОЙ МАРШРУТ'} / {panel+1} ИЗ 4</span></div><div className="comic-panel night-panel" style={{backgroundSize:ending?'400% 186.86%':'400% 215.13%',aspectRatio:ending?'384/548':'384/476',backgroundPosition:`${(cell%4)*100/3}% ${cell<4?0:100}%`}} role="group" aria-label={panels[panel][0]}><span className="narration">{panels[panel][0]}</span></div><p className="night-speech">{panels[panel][1]}</p><div className="comic-navigation"><button className="small-button" disabled={panel===0||busy} onClick={()=>setPanel(p=>p-1)}>← Назад</button><button disabled={busy} onClick={()=>panel<3?setPanel(p=>p+1):ending?setStage('epilogue'):setStage('brief')}>{busy?'Сохраняем…':panel<3?'Дальше →':ending?'Последний поворот →':'Пора идти →'}</button></div>{ending&&panel===3&&<p className="control-hint">Но история ещё не закончилась.</p>}</section>;
}




