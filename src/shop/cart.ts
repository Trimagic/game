import {products,type Purchase} from './model.ts';
// Extra decoys drawn by the scene itself: icon numbers past the sprite sheet.
export const goods=[...products,
 {name:'Чипсы «Хруст»',key:'chips',amount:'150 г',price:4,icon:8,label:'ХРУСТЯТ'},
 {name:'Газировка',key:'soda',amount:'1,5 л',price:3,icon:9,label:'ОСВЕЖАЕТ'},
 {name:'Пончик',key:'donut',amount:'1 шт',price:2,icon:10,label:'СВЕЖАЯ ВЫПЕЧКА'},
 {name:'Сосиски',key:'sausage',amount:'400 г',price:5,icon:11,label:'КАК В ДЕТСТВЕ'},
 {name:'Арбуз',key:'melon',amount:'7 кг',price:7,icon:12,label:'ТЯЖЁЛЫЙ'},
] as const;
export const MELON=goods.length-1;
// Products fall from the shelves; the player steers a cart to catch the list and dodge the rest.
export const WIDTH=420;
export const CART_Y=486;
export const SPAWN_Y=100;
export const CART_HALF=52;
export const CART_SPEED=760;
// Anything touching the cart counts, not just items whose middle lands in it.
export const CATCH_REACH=CART_HALF+18;
// The thief: shows a warning, walks after the cart, and is chased off by a cart rammed into him at speed.
export const THIEF={warn:1.1,walk:115,flee:280,ram:300,reach:CART_HALF+14,first:[9000,6000,5000],every:[14000,10000,8000]};
export const BREAK_MS=1800;
export const MEDAL_POINTS=40;
export const LEVELS=[
 {name:'Ужин',list:['chicken','rice','broccoli'],budget:25,ms:30_000,fall:90,spawn:1050,decoy:.38,drift:0},
 {name:'Гости придут',list:['chicken','rice','tomato','oil'],budget:30,ms:30_000,fall:112,spawn:950,decoy:.46,drift:55},
 {name:'Распродажа',list:['chicken','rice','broccoli','tomato','oil'],budget:35,ms:36_000,fall:135,spawn:850,decoy:.5,drift:90},
] as const;
const listed=[0,1,2,3,4];
const decoys=[5,6,7,8,9,10,11,12,13];
export type Item={id:number;product:number;x:number;y:number;sale:boolean;expired:boolean;speed:number;vx?:number};
export type Thief={x:number;dir:number;phase:'warn'|'walk'|'flee';t:number;loot:number|null};
export type CartEvent={type:'catch'|'swap'|'slip'|'dup'|'over'|'clear'|'timeout'|'thief'|'steal'|'shoo'|'heavy';x:number;label:string};
export type Medal='Железная воля'|'Охотник за скидками'|'Спринтер'|'Ловкие руки';
export type CartState={time:number;level:number;levelTime:number;cartX:number;target:number|null;dir:number;items:Item[];cart:Purchase[];nextSpawn:number;serial:number;lives:number;combo:number;best:number;score:number;slips:number;deals:number;breakMs:number;status:'playing'|'won'|'lost';notice:string;events:CartEvent[];thief:Thief|null;nextThief:number;stolen:number;shooed:number;stun:number;cleared:{time:number;savings:number;bonus:number}[];medals:Medal[]};
export const cartInitial=():CartState=>({time:0,level:0,levelTime:0,cartX:WIDTH/2,target:null,dir:0,items:[],cart:[],nextSpawn:600,serial:0,lives:3,combo:0,best:0,score:0,slips:0,deals:0,breakMs:0,status:'playing',notice:'Лови тележкой продукты из списка. Остальное пропускай.',events:[],thief:null,nextThief:THIEF.first[0],stolen:0,shooed:0,stun:0,cleared:[],medals:[]});
const paid=(p:Purchase)=>p.price??goods[p.product].price;
export const cartCost=(s:CartState)=>s.cart.reduce((n,p)=>n+paid(p),0);
export const level=(s:CartState)=>LEVELS[Math.min(s.level,LEVELS.length-1)];
export const have=(s:CartState,key:string)=>s.cart.find(p=>goods[p.product].key===key);
export const missing=(s:CartState)=>level(s).list.filter(k=>!have(s,k));
export const cartRating=(s:CartState)=>s.score>=720?3:s.score>=520?2:1;
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
  const need=missing(s).map(k=>listed.find(p=>goods[p].key===k)!);
  const pool=need.length&&random()<.7?need:lv.list.map(k=>listed.find(p=>goods[p].key===k)!);
  product=pool[Math.floor(random()*pool.length)];
  const roll=random();if(late&&roll<.18)expired=true;else if(late&&roll<.4)sale=true;
 }
 // Decoys sway sideways in later lists, so they have to be watched, not just read.
 const decoy=decoys.includes(product);const vx=decoy&&lv.drift?(random()-.5)*2*lv.drift:0;
 return {id:s.serial,product,x:40+random()*(WIDTH-80),y:SPAWN_Y,sale,expired,speed:lv.fall*(.9+random()*.25)*(product===MELON?1.25:1),vx};
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
 return {...next,level:s.level+1,levelTime:0,cart:[],items:[],thief:null,nextThief:THIEF.first[s.level+1],nextSpawn:BREAK_MS+500,breakMs:BREAK_MS,notice:`Следующий список: «${LEVELS[s.level+1].name}».`};
}
function catchItem(s:CartState,item:Item):CartState{
 const p=goods[item.product];const lv=level(s);const price=item.sale?Math.ceil(p.price/2):p.price;
 const wanted=(lv.list as readonly string[]).includes(p.key);const owned=have(s,p.key);
 const hurt=(label:string):CartState=>({...s,lives:s.lives-1,combo:0,slips:s.slips+1,status:s.lives<=1?'lost':s.status,notice:label,events:[...s.events,{type:'slip',x:item.x,label}]});
 if(item.expired)return hurt('Просрочено! Минус жизнь.');
 // A melon dents the cart: a life, and the cart is stuck for a moment.
 if(item.product===MELON)return {...hurt('Арбуз! Тележку заклинило.'),stun:700,events:[...s.events,{type:'heavy',x:item.x,label:'БУМ! АРБУЗ'}]};
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
/** The thief appears at the far side, follows the cart, and steals the last thing in it unless rammed away. */
function moveThief(state:CartState,dt:number,velocity:number,random:()=>number):CartState{
 let s=state;const lv=Math.min(s.level,LEVELS.length-1);
 if(!s.thief){
  if(s.levelTime<s.nextThief)return s;
  if(!s.cart.length){s={...s,nextThief:s.levelTime+1500};return s;}
  const left=s.cartX>WIDTH/2||(s.cartX===WIDTH/2&&random()<.5);const x=left?-34:WIDTH+34;
  return {...s,thief:{x,dir:left?1:-1,phase:'warn',t:THIEF.warn,loot:null},notice:'Кто-то крадётся к тележке! Толкни его тележкой на скорости.',events:[...s.events,{type:'thief',x:left?20:WIDTH-20,label:'ВОР!'}]};
 }
 let t={...s.thief};
 if(t.phase==='warn'){t.t-=dt;if(t.t<=0)t={...t,phase:'walk'};return {...s,thief:t};}
 if(t.phase==='walk'){
  t.dir=Math.sign(s.cartX-t.x)||t.dir;t.x+=t.dir*THIEF.walk*dt;
  if(Math.abs(t.x-s.cartX)<THIEF.reach){
   const away=Math.sign(t.x-s.cartX)||1;
   // Rammed: the cart was moving into him fast enough.
   if(velocity*away>THIEF.ram)return {...s,thief:{...t,phase:'flee',dir:away},score:s.score+25,shooed:s.shooed+1,notice:'Прогнал! +25',events:[...s.events,{type:'shoo',x:t.x,label:'ПРОГНАЛ! +25'}]};
   if(!s.cart.length)return {...s,thief:{...t,phase:'flee',dir:away}};
   const taken=s.cart[s.cart.length-1];const name=goods[taken.product].name;
   return {...s,cart:s.cart.slice(0,-1),combo:0,stolen:s.stolen+1,thief:{...t,phase:'flee',dir:away,loot:taken.product},notice:`Украли: ${name}! Лови заново.`,events:[...s.events,{type:'steal',x:t.x,label:`УКРАЛИ: ${name.toUpperCase()}`}]};
  }
  return {...s,thief:t};
 }
 t.x+=t.dir*THIEF.flee*dt;
 if(t.x<-60||t.x>WIDTH+60)return {...s,thief:null,nextThief:s.levelTime+THIEF.every[lv]};
 return {...s,thief:t};
}
export function tickCart(state:CartState,delta:number,random=Math.random):CartState{
 if(state.status!=='playing')return state;
 const ms=Math.max(0,Math.min(delta,50));const dt=ms/1000;
 let s:CartState={...state,time:state.time+ms,events:[]};
 const move=s.stun>0?0:CART_SPEED*dt;s.stun=Math.max(0,s.stun-ms);
 const x=s.target===null?s.cartX+s.dir*move:s.cartX+Math.max(-move,Math.min(move,s.target-s.cartX));
 const from=s.cartX;s.cartX=Math.max(CART_HALF,Math.min(WIDTH-CART_HALF,x));const velocity=dt?(s.cartX-from)/dt:0;
 if(s.breakMs>0){s.breakMs=Math.max(0,s.breakMs-ms);return s;}
 s.levelTime+=ms;
 s=moveThief(s,dt,velocity,random);
 if(s.levelTime>=s.nextSpawn){s={...s,items:[...s.items,spawn(s,random)],serial:s.serial+1,nextSpawn:s.nextSpawn+level(s).spawn};}
 const items:Item[]=[];
 for(const item of s.items){
  const y=item.y+item.speed*dt;let ix=item.x,vx=item.vx??0;ix+=vx*dt;if(ix<30||ix>WIDTH-30){vx=-vx;ix=Math.max(30,Math.min(WIDTH-30,ix));}
  if(s.status==='playing'&&item.y<CART_Y-12&&y>=CART_Y-12&&Math.abs(ix-s.cartX)<CATCH_REACH){
   const before=s.level;s=catchItem(s,{...item,x:ix,y});
   if(s.level!==before)return s;
   continue;
  }
  if(y<600)items.push({...item,x:ix,y,vx});
 }
 s={...s,items};
 if(s.status==='playing'&&s.levelTime>=level(s).ms){
  // Running out of time costs a heart and buys fifteen more seconds.
  const lives=s.lives-1;
  s={...s,lives,combo:0,status:lives<=0?'lost':'playing',levelTime:level(s).ms-15_000,nextSpawn:level(s).ms-15_000+level(s).spawn,notice:lives<=0?'Магазин закрывается…':'Время вышло! Минус жизнь, ещё 15 секунд.',events:[...s.events,{type:'timeout',x:WIDTH/2,label:'ВРЕМЯ!'}]};
 }
 return s;
}
