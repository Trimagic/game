import {useEffect,useRef,useSyncExternalStore} from 'react';
import {sound} from './sound';
import './sound.css';
export function SoundButton(){const enabled=useSyncExternalStore(sound.subscribe,sound.snapshot);return <button className="sound-toggle" aria-label={enabled?'Выключить звук':'Включить звук'} aria-pressed={enabled} onClick={()=>sound.toggle()}>{enabled?'♫':'♪'}<span>{enabled?'Звук вкл.':'Звук выкл.'}</span></button>;}
export function useSound(theme:string,status:string,score=0,lives=3){
 const prev=useRef({status,score,lives});
 useEffect(()=>{const unlock=()=>{if(!document.hidden){sound.foreground();sound.unlock();}};const hide=()=>{if(document.hidden)sound.suspend();else sound.foreground();};const blur=()=>sound.suspend();const focus=()=>sound.foreground();if(!document.hidden&&document.hasFocus())sound.foreground();window.addEventListener('pointerdown',unlock,{capture:true});window.addEventListener('keydown',unlock,{capture:true});window.addEventListener('blur',blur);window.addEventListener('focus',focus);document.addEventListener('visibilitychange',hide);return()=>{sound.stop();window.removeEventListener('pointerdown',unlock,true);window.removeEventListener('keydown',unlock,true);window.removeEventListener('blur',blur);window.removeEventListener('focus',focus);document.removeEventListener('visibilitychange',hide);};},[]);
 useEffect(()=>{sound.set(theme,status==='playing');if(prev.current.status!==status){if(status==='lost')sound.cue('lose');if(status==='story')sound.fx('ding');if(status==='won')sound.cue('win');}if(status==='playing'){if(lives<prev.current.lives)sound.cue('hit');else if(score>prev.current.score)sound.cue('good');}prev.current={status,score,lives};},[theme,status,score,lives]);
}
