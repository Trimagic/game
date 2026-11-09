import {useEffect,useState} from 'react';
import ArcadeGame from '../arcade/ArcadeGame';
import NightComic from './NightComic';
import {NightBrief} from './NightIntro';
import Epilogue from './Epilogue';
export default function NightChapter({onComplete,onExit,busy=false}:{onComplete:()=>void;onExit:()=>void;busy?:boolean}){
 const [stage,setStage]=useState<'intro'|'brief'|'game'|'outro'|'epilogue'>('intro');
 useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});},[stage]);
 if(stage==='epilogue')return <Epilogue onComplete={onComplete} onExit={onExit} busy={busy}/>;
 if(stage==='game')return <ArcadeGame kind="night" onWin={()=>setStage('outro')} onExit={onExit}/>;
 if(stage==='brief')return <NightBrief onContinue={()=>setStage('game')} onComic={()=>setStage('intro')}/>;
 return <NightComic key={stage} variant={stage} busy={busy} onExit={onExit} onContinue={()=>setStage(stage==='outro'?'epilogue':'brief')}/>;
}
