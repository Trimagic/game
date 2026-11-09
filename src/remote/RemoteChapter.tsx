import {useEffect,useState} from 'react';
import ArcadeGame from '../arcade/ArcadeGame';
import RemoteComic from './RemoteComic';
import {RemoteBrief} from './RemoteIntro';
export default function RemoteChapter({onComplete,onExit,busy=false}:{onComplete:()=>void;onExit:()=>void;busy?:boolean}){
 const [stage,setStage]=useState<'intro'|'brief'|'game'|'outro'>('intro');
 useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});},[stage]);
 if(stage==='game')return <ArcadeGame kind="remote" onWin={()=>setStage('outro')} onExit={onExit}/>;
 if(stage==='brief')return <RemoteBrief onContinue={()=>setStage('game')} onComic={()=>setStage('intro')}/>;
 return <RemoteComic key={stage} ending={stage==='outro'} busy={busy} onExit={onExit} onContinue={stage==='outro'?onComplete:()=>setStage('brief')}/>;
}
