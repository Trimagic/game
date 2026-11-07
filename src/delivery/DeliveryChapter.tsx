import PagedPanel from '../PagedPanel';
import {useComicFit} from '../useComicFit';
import {useEffect,useState} from 'react';
import ArcadeGame from '../arcade/ArcadeGame';
import './delivery.css';
const intro=[
 ['Обед по расписанию.','В мечтах — стейк. Рядом суши. Можно без хлеба: я всё-таки слежу за собой.'],
 ['Ожидание встретило поднос.','На подносе — паровые овощи. Кажется, они тоже не рады этой встрече.'],
 ['План Б. С доставкой.','Пара нажатий — и настоящий обед уже едет. Осталось забрать его так, чтобы никто не заметил.'],
 ['Большой путь к маленькому пакету.','Столовая, коридор, вестибюль. Медсёстры, врач, охрана. Аппетит ещё никогда не требовал такой подготовки.'],
];
const outro=[
 ['На расстоянии вытянутой руки.','Вот он. Пакет, ради которого стоило обойти половину здания.'],
 ['У доставки появился получатель.','«А это у нас что за самостоятельная экспедиция?» Голос за спиной был подозрительно знакомым.'],
 ['Специальное предложение.','«За самовольную прогулку — брокколи и вода», — объявляет медсестра. Сервис здесь, конечно, своеобразный.'],
 ['Комплимент от заведения.','Стейк остался в мечтах. Брокколи — на столе. Стакан воды — без права на добавку льда.'],
];
export default function DeliveryChapter({onComplete,onExit,busy=false}:{onComplete:()=>void;onExit:()=>void;busy?:boolean}){
 const comicRef=useComicFit();
 const [stage,setStage]=useState<'intro'|'brief'|'game'|'outro'>('intro'),[panel,setPanel]=useState(0);
 useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});},[stage,panel]);
 if(stage==='game')return <ArcadeGame kind="delivery" onWin={()=>{setPanel(0);setStage('outro');}} onExit={onExit}/>;
 if(stage==='brief')return <PagedPanel className="paper-panel"><span className="eyebrow">ГЛАВА 10 / ОПЕРАЦИЯ «ОБЕД»</span><h1>Доставка<br/><em>без свидетелей.</em></h1><p>Пройди столовую, коридор и вестибюль. В каждой комнате доберись до зелёной двери, а по пути собирай приправы: они лежат в рискованных местах.</p><div className="rules"><b>!</b><p>Жёлтые клетки — зона обзора. На виду растёт шкала подозрения, а с 60% персонал ускоряется. В кадке с фикусом тебя не видно. Врач видит дальше, охранник оглядывается после «!», в вестибюле поворачивается камера.</p></div><p><b>Шум.</b> Кнопка «Шум» на пару секунд всех останавливает и ослепляет. Зарядов мало. На мокром полу скользко: проедешь лишнюю клетку.</p><p>Левым пальцем веди джойстик или прямо по полю, отпусти — ждать. На клавиатуре WASD / стрелки и пробел. Три сердца: если поймали, вернёшься к двери этой комнаты. После двух поражений подряд сердец становится больше.</p><button onClick={()=>setStage('game')}>Курьер уже близко →</button><button className="text-button" onClick={onExit}>К главам</button></PagedPanel>;
 const ending=stage==='outro',panels=ending?outro:intro,cell=panel+(ending?4:0);
 return <section ref={comicRef} className="comic-reader"><div className="section-heading"><button className="text-button" onClick={onExit}>← К главам</button><span className="eyebrow">{ending?'ДОСТАВКА ПРИБЫЛА':'ОПЕРАЦИЯ «ОБЕД»'} / {panel+1} ИЗ 4</span></div><div className="comic-panel delivery-panel" style={{backgroundPosition:`${(cell%4)*100/3}% ${cell<4?0:100}%`}} role="group" aria-label={panels[panel][0]}><span className="narration">{panels[panel][0]}</span></div><p className="delivery-speech">{panels[panel][1]}</p><div className="comic-navigation"><button className="small-button" disabled={panel===0||busy} onClick={()=>setPanel(p=>p-1)}>← Назад</button><button disabled={busy} onClick={()=>panel<3?setPanel(p=>p+1):ending?onComplete():setStage('brief')}>{busy?'Сохраняем…':panel<3?'Дальше →':ending?'Завершить главу →':'За доставкой →'}</button></div>{ending&&panel===3&&<p className="control-hint">Доставка не удалась. История продолжается.</p>}</section>;
}


