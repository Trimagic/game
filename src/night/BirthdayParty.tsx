import {useEffect,useState,type CSSProperties} from 'react';
import {SoundButton,useSound} from '../audio/useSound';
import {sound} from '../audio/sound';
const colors=['#ed8657','#f4cc65','#85b49a','#a8bdde','#d8a5b4'];
export default function BirthdayParty(){
 const [burst,setBurst]=useState(0),[visible,setVisible]=useState(true);
 useSound('birthday','playing');
 useEffect(()=>{sound.foreground();sound.unlock();},[]);
 useEffect(()=>{setVisible(true);const timer=setTimeout(()=>setVisible(false),6500);return()=>clearTimeout(timer);},[burst]);
 return <><div className="birthday-party-controls"><SoundButton/><button className="birthday-confetti-button" onClick={()=>setBurst(n=>n+1)} aria-label="Ещё конфетти">✦ Ещё конфетти</button></div>{visible&&<div className="birthday-confetti" key={burst} aria-hidden="true">{Array.from({length:64},(_,i)=><span key={i} style={{left:`${(i*37)%101}%`,background:colors[i%colors.length],borderRadius:i%4===0?'50%':'1px','--confetti-delay':`${i%8*.09}s`,'--confetti-duration':`${3.4+i%5*.36}s`,'--confetti-drift':`${(i%2?1:-1)*(30+i%9*12)}px`,'--confetti-spin':`${(i%2?1:-1)*(360+i%4*180)}deg`} as CSSProperties}/>)}</div>}</>;
}
