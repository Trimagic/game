import {useRef,useState} from 'react';
type Dir='left'|'right';
// Left thumb walks on one gapless surface; right thumb has a big jump and a hide button above it.
export default function NightPad({action,disabled,hideLabel,canHide}:{action:(id:string)=>void;disabled:boolean;hideLabel:string;canHide:boolean}){
 const [active,setActive]=useState<Dir|null>(null);const pointer=useRef<number|null>(null);const current=useRef<Dir|null>(null);
 const choose=(e:React.PointerEvent<HTMLDivElement>)=>{
  const r=e.currentTarget.getBoundingClientRect();const next:Dir=e.clientX<r.left+r.width/2?'left':'right';
  if(next===current.current)return;current.current=next;setActive(next);action(`down:${next}:walk`);
 };
 const stop=()=>{pointer.current=null;current.current=null;setActive(null);action('up:walk');};
 const hold=(dir:string,source:string)=>({
  onContextMenu:(e:React.MouseEvent)=>e.preventDefault(),
  onPointerDown:(e:React.PointerEvent<HTMLButtonElement>)=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);action(`down:${dir}:${source}`);},
  onPointerUp:()=>action(`up:${source}`),onPointerCancel:()=>action(`up:${source}`),onLostPointerCapture:()=>action(`up:${source}`),
  onKeyDown:(e:React.KeyboardEvent)=>{if([' ','Enter'].includes(e.key)){e.preventDefault();if(!e.repeat)action(`down:${dir}:${source}`);}},
  onKeyUp:(e:React.KeyboardEvent)=>{if([' ','Enter'].includes(e.key)){e.preventDefault();action(`up:${source}`);}},
  onBlur:()=>action(`up:${source}`),
 });
 return <div className="night-pads">
  <div className="night-walk" role="application" aria-label="Идти влево и вправо" onContextMenu={e=>e.preventDefault()}
   onPointerDown={e=>{if(disabled)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);pointer.current=e.pointerId;choose(e);}}
   onPointerMove={e=>{if(pointer.current===e.pointerId)choose(e);}} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}>
   <span className={active==='left'?'active':''}>←</span><span className={active==='right'?'active':''}>→</span>
  </div>
  <div className="night-actions">
   <button className="night-hide" disabled={disabled||!canHide} {...hold('hide','hidebtn')}>{hideLabel}</button>
   <button className="night-jump" disabled={disabled} {...hold('jump','jumpbtn')}>ПРЫЖОК</button>
  </div>
 </div>;
}
