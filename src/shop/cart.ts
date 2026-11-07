import {products,type Purchase} from './model.ts';
// Products fall from the shelves; the player steers a cart to catch the list and dodge the rest.
export const WIDTH=420;
export const CART_Y=486;
export const SPAWN_Y=100;
export const CART_HALF=52;
export const CART_SPEED=760;
export const BREAK_MS=1800;
export const MEDAL_POINTS=40;
export const LEVELS=[
 {name:'Ужин',list:['chicken','rice','broccoli'],budget:25,ms:30_000,fall:90,spawn:1050,decoy:.35},
 {name:'Гости придут',list:['chicken','rice','tomato','oil'],budget:30,ms:30_000,fall:112,spawn:950,decoy:.42},
 {name:'Распродажа',list:['chicken','rice','broccoli','tomato','oil'],budget:35,ms:36_000,fall:135,spawn:850,decoy:.45},
] as const;
const listed=[0,1,2,3,4];
const decoys=[5,6,7,8];
export type Item={id:number;product:number;x:number;y:number;sale:boolean;expired:boolean;speed:number};
export type CartEvent={type:'catch'|'swap'|'slip'|'dup'|'over'|'clear'|'timeout';x:number;label:string};
export type Medal='Железная воля'|'Охотник за скидками'|'Спринтер'|'Ловкие руки';
export type CartState={time:number;level:number;levelTime:number;cartX:number;target:number|null;dir:number;items:Item[];cart:Purchase[];nextSpawn:number;serial:number;lives:number;combo:number;best:number;score:number;slips:number;deals:number;breakMs:number;status:'playing'|'won'|'lost';notice:string;events:CartEvent[];cleared:{time:number;savings:number;bonus:number}[];medals:Medal[]};
export const cartInitial=():CartState=>({time:0,level:0,levelTime:0,cartX:WIDTH/2,target:null,dir:0,items:[],cart:[],nextSpawn:600,serial:0,lives:3,combo:0,best:0,score:0,slips:0,deals:0,breakMs:0,status:'playing',notice:'Лови тележкой продукты из списка. Остальное пропускай.',events:[],cleared:[],medals:[]});
const paid=(p:Purchase)=>p.price??products[p.product].price;
export const cartCost=(s:CartState)=>s.cart.reduce((n,p)=>n+paid(p),0);
export const level=(s:CartState)=>LEVELS[Math.min(s.level,LEVELS.length-1)];
export const have=(s:CartState,key:string)=>s.cart.find(p=>products[p.product].key===key);
export const missing=(s:CartState)=>level(s).list.filter(k=>!have(s,k));
export const cartRating=(s:CartState)=>s.score>=870?3:s.score>=560?2:1;
const steer=(s:CartState,x:number|null,dir:number)=>({...s,target:x===null?null:Math.max(CART_HALF,Math.min(WIDTH-CART_HALF,x)),dir});
/** Pointer aims the cart at an x; keys hold a direction. Either clears the other. */
export const aim=(s:CartState,x:number)=>s.status==='playing'?steer(s,x,0):s;
export const hold=(s:CartState,dir:number)=>s.status==='playing'?steer(s,null,Math.sign(dir)):s;
function spawn(s:CartState,random:()=>number):Item{
 const lv=level(s);const late=s.levelTime>4000;
 let product:number,sale=false,expired=false;
 if(random()<lv.decoy)product=decoys[Math.floor(random()*decoys.length)];
 else{
  // Prefer what is still missing so a level never starves.
  const need=missing(s).map(k=>listed.find(p=>products[p].key===k)!);
  const pool=need.length&&random()<.7?need:lv.list.map(k=>listed.find(p=>products[p].key===k)!);
  product=pool[Math.floor(random()*pool.length)];
  const roll=random();if(late&&roll<.18)expired=true;else if(late&&roll<.4)sale=true;
 }
 return {id:s.serial,product,x:40+random()*(WIDTH-80),y:SPAWN_Y,sale,expired,speed:lv.fall*(.9+random()*.25)};
}
function settleLevel(s:CartState):CartState{
 const lv=level(s);const savings=lv.budget-cartCost(s);const bonus=Math.floor((lv.ms-s.levelTime)/1000)*3+savings*5;
 const cleared=[...s.cleared,{time:s.levelTime,savings,bonus}];
 const next={...s,score:s.score+bonus,cleared,events:[...s.events,{type:'clear' as const,x:WIDTH/2,label:`«${lv.name}» собран! +${bonus}`}]};
 if(s.level+1>=LEVELS.length){
  const medals:Medal[]=[];
  if(s.slips===0)medals.push('Железная воля');
  if(s.deals>=2)medals.push('Охотник за скидками');
  if(cleared.reduce((n,c)=>n+c.time,0)<=60_000)medals.push('Спринтер');
  if(s.best>=10)medals.push('Ловкие руки');
  return {...next,status:'won',medals,score:next.score+medals.length*MEDAL_POINTS,notice:'Все три списка собраны!'};
 }
 return {...next,level:s.level+1,levelTime:0,cart:[],items:[],nextSpawn:BREAK_MS+500,breakMs:BREAK_MS,notice:`Следующий список: «${LEVELS[s.level+1].name}».`};
}
function catchItem(s:CartState,item:Item):CartState{
 const p=products[item.product];const lv=level(s);const price=item.sale?Math.ceil(p.price/2):p.price;
 const wanted=(lv.list as readonly string[]).includes(p.key);const owned=have(s,p.key);
 const hurt=(label:string):CartState=>({...s,lives:s.lives-1,combo:0,slips:s.slips+1,status:s.lives<=1?'lost':s.status,notice:label,events:[...s.events,{type:'slip',x:item.x,label}]});
 if(item.expired)return hurt('Просрочено! Минус жизнь.');
 if(!wanted)return hurt(`${p.name} — не по списку! Минус жизнь.`);
 const entry:Purchase={offer:item.id,product:item.product,price};
 if(owned){
  if(price>=paid(owned))return {...s,notice:`${p.name} уже в тележке.`,events:[...s.events,{type:'dup',x:item.x,label:'УЖЕ ЕСТЬ'}]};
  const diff=paid(owned)-price;const combo=s.combo+1;
  return {...s,cart:[...s.cart.filter(c=>c!==owned),entry],combo,best:Math.max(s.best,combo),score:s.score+diff*3,deals:s.deals+(item.sale?1:0),notice:`Дешевле на ${diff}! Старый вернули на полку.`,events:[...s.events,{type:'swap',x:item.x,label:`−${diff} МОНЕТ`}]};
 }
 if(cartCost(s)+price>lv.budget)return hurt(`Не по карману: ${cartCost(s)+price} из ${lv.budget}. Минус жизнь.`);
 const combo=s.combo+1;const gain=10+combo*5;
 const next={...s,cart:[...s.cart,entry],combo,best:Math.max(s.best,combo),score:s.score+gain,deals:s.deals+(item.sale?1:0),notice:`${p.name} ✓ серия ${combo}`,events:[...s.events,{type:'catch' as const,x:item.x,label:`+${gain}`}]};
 return missing(next).length?next:settleLevel(next);
}
export function tickCart(state:CartState,delta:number,random=Math.random):CartState{
 if(state.status!=='playing')return state;
 const ms=Math.max(0,Math.min(delta,50));const dt=ms/1000;
 let s:CartState={...state,time:state.time+ms,events:[]};
 const move=CART_SPEED*dt;
 const x=s.target===null?s.cartX+s.dir*move:s.cartX+Math.max(-move,Math.min(move,s.target-s.cartX));
 s.cartX=Math.max(CART_HALF,Math.min(WIDTH-CART_HALF,x));
 if(s.breakMs>0){s.breakMs=Math.max(0,s.breakMs-ms);return s;}
 s.levelTime+=ms;
 if(s.levelTime>=s.nextSpawn){s={...s,items:[...s.items,spawn(s,random)],serial:s.serial+1,nextSpawn:s.nextSpawn+level(s).spawn};}
 const items:Item[]=[];
 for(const item of s.items){
  const y=item.y+item.speed*dt;
  if(s.status==='playing'&&item.y<CART_Y-12&&y>=CART_Y-12&&Math.abs(item.x-s.cartX)<CART_HALF){
   const before=s.level;s=catchItem(s,{...item,y});
   if(s.level!==before)return s;
   continue;
  }
  if(y<600)items.push({...item,y});
 }
 s={...s,items};
 if(s.status==='playing'&&s.levelTime>=level(s).ms){
  // Running out of time costs a heart and buys fifteen more seconds.
  const lives=s.lives-1;
  s={...s,lives,combo:0,status:lives<=0?'lost':'playing',levelTime:level(s).ms-15_000,nextSpawn:level(s).ms-15_000+level(s).spawn,notice:lives<=0?'Магазин закрывается…':'Время вышло! Минус жизнь, ещё 15 секунд.',events:[...s.events,{type:'timeout',x:WIDTH/2,label:'ВРЕМЯ!'}]};
 }
 return s;
}
