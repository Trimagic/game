import {useEffect,useState} from 'react';
import ArcadeGame from '../arcade/ArcadeGame';
import DeliveryComic from './DeliveryComic';
import {DeliveryBrief} from './DeliveryIntro';
export default function DeliveryChapter({onComplete,onExit,busy=false}:{onComplete:()=>void;onExit:()=>void;busy?:boolean}){
 const [stage,setStage]=useState<'intro'|'brief'|'game'|'outro'>('intro');
 useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});},[stage]);
 if(stage==='game')return <ArcadeGame kind="delivery" onWin={()=>setStage('outro')} onExit={onExit}/>;
 if(stage==='brief')return <DeliveryBrief onContinue={()=>setStage('game')} onComic={()=>setStage('intro')}/>;
 return <DeliveryComic key={stage} ending={stage==='outro'} busy={busy} onExit={onExit} onContinue={stage==='outro'?onComplete:()=>setStage('brief')}/>;
}
