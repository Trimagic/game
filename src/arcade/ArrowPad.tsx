import {useRef,useState} from 'react';
import {HoldButton} from './StickPad';
type Dir='up'|'down'|'left'|'right';
const VECTOR:Record<Dir,string>={up:'0,-1',down:'0,1',left:'-1,0',right:'1,0'};
const GLYPH:Record<Dir,string>={up:'↑',down:'↓',left:'←',right:'→'};
// One touch surface: the nearest arrow wins, so there are no gaps to miss and a thumb can slide between arrows.
export default function ArrowPad({action,disabled,label,hint}:{action:(id:string)=>void;disabled:boolean;label:string;hint:string}){
 const [active,setActive]=useState<Dir|null>(null);const pointer=useRef<number|null>(null);const current=useRef<Dir|null>(null);
 const choose=(e:React.PointerEvent<HTMLDivElement>)=>{
  const r=e.currentTarget.getBoundingClientRect();const dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);
  // Compare in units of the pad's own shape, so a wide pad still splits along its diagonals.
  const next:Dir=Math.abs(dx/r.width)>Math.abs(dy/r.height)?dx>0?'right':'left':dy>0?'down':'up';
  if(next===current.current)return;current.current=next;setActive(next);action(`stick:${VECTOR[next]}`);
 };
 const stop=()=>{pointer.current=null;current.current=null;setActive(null);action('stick:0,0');};
 return <div className="arrow-pads">
  <div className="arrow-pad" role="application" aria-label="Стрелки: нажми или веди пальцем в нужную сторону" onContextMenu={e=>e.preventDefault()}
   onPointerDown={e=>{if(disabled)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);pointer.current=e.pointerId;choose(e);}}
   onPointerMove={e=>{if(pointer.current===e.pointerId)choose(e);}} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}>
   {(['up','left','right','down'] as Dir[]).map(d=><span key={d} className={`arrow-${d} ${active===d?'active':''}`}>{GLYPH[d]}</span>)}
  </div>
  <HoldButton action={action} disabled={disabled} label={label} hint={hint}/>
 </div>;
}
