import {Children,isValidElement,useEffect,useState,type ComponentProps,type ReactNode,type ReactElement} from 'react';
import './paged-panel.css';
export default function PagedPanel({children,className='',...props}:ComponentProps<'section'>){
 const [phone,setPhone]=useState(()=>matchMedia('(max-width:650px)').matches),[page,setPage]=useState(0);
 useEffect(()=>{const media=matchMedia('(max-width:650px)');const change=()=>setPhone(media.matches);media.addEventListener('change',change);return()=>media.removeEventListener('change',change);},[]);
 const nodes=Children.toArray(children);const header:ReactNode[]=[],body:ReactNode[]=[],actions:ReactNode[]=[];
 nodes.forEach(node=>{
  if(!isValidElement(node)){body.push(node);return;}
  const el=node as ReactElement<{className?:string;children?:ReactNode}>;
  if(el.type==='button')actions.push(el);
  else if(el.type==='h1'||el.props.className==='eyebrow')header.push(el);
  else if(el.type==='dl')Children.toArray(el.props.children).forEach((child,i)=>body.push(<dl key={`fact-${i}`} className={el.props.className}>{child}</dl>));
  else if(el.type==='ol'&&el.props.className==='agenda-rules')Children.toArray(el.props.children).forEach((child,i)=>body.push(<ol start={i+1} key={`rule-${i}`} className={el.props.className}>{child}</ol>));
  else body.push(el);
 });
 if(!phone)return <section className={className} {...props}>{children}</section>;
 const last=page>=body.length-1;
 return <section className={`${className} paged-panel`} {...props}>
  <header>{header}</header><div className="paged-panel-body" key={page}>{body[page]}</div>
  <div className="paged-panel-footer"><div className="paged-panel-navigation"><button className="small-button" disabled={!page} onClick={()=>setPage(p=>p-1)}>← Назад</button><span>{page+1} / {Math.max(1,body.length)}</span>{!last&&<button onClick={()=>setPage(p=>p+1)}>Дальше →</button>}</div>{last&&<div className="paged-panel-actions">{actions}</div>}</div>
 </section>;
}
