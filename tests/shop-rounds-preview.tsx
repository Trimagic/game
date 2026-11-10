// Reproducible real-Phaser render cases. Not included in the production entry point.
import {createRoot} from 'react-dom/client';
import {useEffect,useRef,useState} from 'react';
import {cartInitial,CART_Y,LEVELS,goods,type CartState} from '../src/shop/cart';
import type {ArcadeControls,ArcadeView} from '../src/arcade/types';
import '../src/style.css';
const labels=['Переход 1 → 2','Переход 2 → 3','Финал третьего раунда','Повтор: 28 из 25','Метка повтора'];
function preset(mode:number):CartState{
 const s=cartInitial();s.nextSpawn=999999;s.nextThief=999999;
 const item=(product:number,y=CART_Y-14)=>({id:999,product,x:210,y,sale:false,expired:false,speed:100});
 if(mode<3){s.level=mode;const list=LEVELS[mode].list;s.cart=list.slice(0,-1).map((key,i)=>({offer:100+i,product:goods.findIndex(p=>p.key===key)}));s.items=[item(goods.findIndex(p=>p.key===list.at(-1)))];}
 else{s.cart=[{offer:100,product:0},{offer:101,product:0}];s.items=[item(mode===3?1:0,mode===3?CART_Y-14:190)];if(mode===4)s.items[0].speed=1;}
 return s;
}
function Case({mode}:{mode:number}){
 const host=useRef<HTMLDivElement>(null),controls=useRef<ArcadeControls|null>(null);const [view,setView]=useState<ArcadeView>();
 useEffect(()=>{let disposed=false,game:import('phaser').Game|undefined;
  void Promise.all([import('phaser'),import('../src/shop/ShopScene')]).then(([{default:Phaser},{default:ShopScene}])=>{
   if(disposed)return;const scene=new ShopScene({publish:v=>{if(!disposed)setView(v)},ready:c=>{controls.current=c},error:()=>{throw Error('Asset failed')}},preset(mode));
   game=new Phaser.Game({type:Phaser.AUTO,parent:host.current!,width:420,height:560,backgroundColor:'#f6ecd4',scene,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH}});
  });return()=>{disposed=true;game?.destroy(true);controls.current=null};
 },[mode]);
 return <><div ref={host} style={{width:'100%',aspectRatio:'420/560'}}/><p role="status">{view?.title}</p><p>{view?.detail}</p><button disabled={!view||view.status!=='ready'} onClick={()=>controls.current?.start()}>Запустить сценарий</button></>;
}
function Preview(){const [mode,setMode]=useState<number>();return <main style={{maxWidth:460,padding:12}}><nav style={{display:'flex',gap:6,flexWrap:'wrap'}}>{labels.map((s,i)=><button key={s} style={{fontSize:11,padding:8}} onClick={()=>setMode(i)}>{s}</button>)}</nav>{mode!==undefined&&<Case key={mode} mode={mode}/>}</main>}
const root=createRoot(document.getElementById('root')!);root.render(<Preview/>);if(import.meta.hot)import.meta.hot.dispose(()=>root.unmount());
