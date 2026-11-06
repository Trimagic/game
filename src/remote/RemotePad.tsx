import {useRef,useState} from 'react';
const REACH=38;
// A floating stick: it centres wherever the thumb lands, so there is no spot to aim for.
export default function RemotePad({action,disabled}:{action:(id:string)=>void;disabled:boolean}){
 const origin=useRef<{x:number;y:number;id:number}|null>(null);const knob=useRef<HTMLSpanElement>(null);const [active,setActive]=useState(false);
 const place=(x:number,y:number)=>{if(knob.current)knob.current.style.transform=`translate(${x}px,${y}px)`;};
 const stop=()=>{origin.current=null;setActive(false);place(0,0);action('stick:0,0');};
 return <div className="remote-pads">
  <div className={`remote-stick ${active?'active':''}`} role="application" aria-label="Джойстик: веди пальцем в нужную сторону" onContextMenu={e=>e.preventDefault()}
   onPointerDown={e=>{if(disabled)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);origin.current={x:e.clientX,y:e.clientY,id:e.pointerId};setActive(true);}}
   onPointerMove={e=>{const o=origin.current;if(!o||o.id!==e.pointerId)return;const dx=e.clientX-o.x,dy=e.clientY-o.y,len=Math.hypot(dx,dy);const k=len>REACH?REACH/len:1;place(dx*k,dy*k);action(`stick:${(dx*k/REACH).toFixed(2)},${(dy*k/REACH).toFixed(2)}`);}}
   onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}>
   <span className="remote-knob" ref={knob}/><small>ВЕДИ ПАЛЬЦЕМ</small>
  </div>
  <button className="remote-fire" disabled={disabled} onContextMenu={e=>e.preventDefault()}
   onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);action('press:fire');}} onPointerUp={()=>action('release:fire')} onPointerCancel={()=>action('release:fire')} onLostPointerCapture={()=>action('release:fire')}
   onKeyDown={e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();if(!e.repeat)action('press:fire');}}} onKeyUp={e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();action('release:fire');}}} onBlur={()=>action('release:fire')}>ОРЕШЕК<small>держи, чтобы бросать</small></button>
 </div>;
}
