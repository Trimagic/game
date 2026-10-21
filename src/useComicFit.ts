import {useLayoutEffect,useRef} from 'react';

/** Preserve atlas proportions while reserving space for dialogue and navigation. */
export function useComicFit(){
 const ref=useRef<HTMLElement>(null);
 useLayoutEffect(()=>{
  const reader=ref.current;
  if(!reader)return;
  const panel=reader.querySelector<HTMLElement>('.comic-panel');
  if(!panel)return;
  let frame=0;
  const fit=()=>{
   if(!matchMedia('(max-width:650px)').matches){panel.style.removeProperty('width');return;}
   const [a,b=1]=getComputedStyle(panel).aspectRatio.split('/').map(Number);
   const ratio=a/b||2/3;
   const rest=Array.from(reader.children).filter(el=>el!==panel).reduce((sum,el)=>{
    const s=getComputedStyle(el);return sum+el.getBoundingClientRect().height+parseFloat(s.marginTop)+parseFloat(s.marginBottom);
   },0);
   const available=reader.clientHeight-rest-8;
   panel.style.width=`${Math.max(60,Math.min(reader.clientWidth,available*ratio))}px`;
  };
  const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(fit);};
  const observer=new ResizeObserver(schedule);
  observer.observe(reader);Array.from(reader.children).filter(el=>el!==panel).forEach(el=>observer.observe(el));
  window.visualViewport?.addEventListener('resize',schedule);fit();
  return()=>{cancelAnimationFrame(frame);observer.disconnect();window.visualViewport?.removeEventListener('resize',schedule);};
 });
 return ref;
}
