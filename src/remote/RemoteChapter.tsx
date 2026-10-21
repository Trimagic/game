import PagedPanel from '../PagedPanel';
import {useComicFit} from '../useComicFit';
import {useEffect,useState} from 'react';
import ArcadeGame from '../arcade/ArcadeGame';
import './remote.css';
const intro=[
 ['40 лет спустя.','Знакомый будильник. Незнакомая комната. И колени теперь тоже подают голос.'],
 ['Дом с круглосуточной заботой.','«Вы перенесли небольшой инсульт. Сейчас вам нужны помощь и наблюдение», — объясняет сотрудница. «Но я же сорок лет занимался собой…»'],
 ['У каждого свои новости.','Общая гостиная. Общий телевизор. Личных мнений — восемь.'],
 ['Новая цель на сегодня.','Всего-то посмотреть передачу. Пульт уже у меня. Что может пойти не так?'],
];
const outro=[
 ['Почти спокойный вечер.','Все соперники впереди. Очень удобная мысль, если не смотреть назад.'],
 ['Аргумент без обсуждения.','БДЫЩ! На секунду в эфире остались только звёздочки.'],
 ['Быстрая смена руководства.','«Спасибо, милок. Ты как раз держал мой пульт».'],
 ['Другой канал.','Герой приходит в себя. Бабушка уже смотрит сериал. Сорок лет дисциплины — и ни одного урока защиты пульта.'],
];
export default function RemoteChapter({onComplete,onExit,busy=false}:{onComplete:()=>void;onExit:()=>void;busy?:boolean}){
 const comicRef=useComicFit();
 const [stage,setStage]=useState<'intro'|'brief'|'game'|'outro'>('intro'),[panel,setPanel]=useState(0);
 useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});},[stage,panel]);
 if(stage==='game')return <ArcadeGame kind="remote" onWin={()=>{setPanel(0);setStage('outro');}} onExit={onExit}/>;
 if(stage==='brief')return <PagedPanel className="paper-panel"><span className="eyebrow">ЧАСТЬ II / ГЛАВА 09</span><h1>Битва<br/><em>за пульт.</em></h1><p>Передача начнётся через 40 секунд. Удержи пульт, бегая по общей гостиной между диванами.</p><p>Орешек ненадолго отвлекает ближайшего соперника. Если тебя догнал соперник, раунд проигран — придётся пробовать заново.</p><div className="rules"><b>↔</b><p>WASD / стрелки — движение. Пробел — бросать орешки. На телефоне — крестовина и кнопка «Орешек». Броски можно удерживать.</p></div><button onClick={()=>setStage('game')}>В гостиную →</button><button className="text-button" onClick={onExit}>К главам</button></PagedPanel>;
 const ending=stage==='outro',panels=ending?outro:intro,cell=panel+(ending?4:0);
 return <section ref={comicRef} className="comic-reader"><div className="section-heading"><button className="text-button" onClick={onExit}>← К главам</button><span className="eyebrow">{ending?'ПОСЛЕ ПЕРЕДАЧИ':'ЧАСТЬ II'} / {panel+1} ИЗ 4</span></div><div className="comic-panel remote-panel" style={{backgroundPosition:`${(cell%4)*100/3}% ${cell<4?0:100}%`}} role="group" aria-label={panels[panel][0]}><span className="narration">{panels[panel][0]}</span></div><p className="remote-speech">{panels[panel][1]}</p><div className="comic-navigation"><button className="small-button" disabled={panel===0||busy} onClick={()=>setPanel(p=>p-1)}>← Назад</button><button disabled={busy} onClick={()=>panel<3?setPanel(p=>p+1):ending?onComplete():setStage('brief')}>{busy?'Сохраняем…':panel<3?'Дальше →':ending?'Завершить главу →':'К телевизору →'}</button></div>{ending&&panel===3&&<p className="control-hint">Пульт потерян. История продолжается.</p>}</section>;
}



