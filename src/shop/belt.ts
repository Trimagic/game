import {products,recipe,BUDGET,type Purchase} from './model.ts';
export const BELT_MS=60_000;
const classic=[0,5,1,8,2,6,3,7,4];
export type Belt={elapsed:number;distance:number;cart:Purchase[];taken:number[];rewarded:string[];combo:number;best:number;score:number;freezes:number;freeze:number;status:'playing'|'won'|'lost';notice:string;order:number[];sale:number[];savings:number;timeBonus:number};
function rng(seed:number){let a=seed>>>0;return()=>{a=(a+0x6d2b79f5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
/** Without a seed the belt keeps the classic fixed order; a seed shuffles every cycle and adds sales. */
export function beltLayout(seed?:number){
 if(seed===undefined)return {order:classic,sale:[] as number[]};
 const random=rng(seed);const order:number[]=[];
 for(let cycle=0;cycle<8;cycle++){const deck=[0,1,2,3,4,5,6,7,8];for(let i=deck.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}if(deck[0]===order.at(-1))deck.push(deck.shift()!);order.push(...deck);}
 // Sales start after the first cycle, so the opening is about reading the list, not bargains.
 const sale=order.flatMap((product,id)=>id>=9&&product<5&&random()<.35?[id]:[]);
 return {order,sale};
}
export const beltInitial=(seed?:number):Belt=>({elapsed:0,distance:0,cart:[],taken:[],rewarded:[],combo:0,best:0,score:0,freezes:2,freeze:0,status:'playing',notice:'Лови продукты по списку. Приманки можно просто пропускать.',...beltLayout(seed),savings:0,timeBonus:0});
export const productAt=(s:Belt,id:number)=>s.order[id%s.order.length];
export const onSale=(s:Belt,id:number)=>s.sale.includes(id);
export const priceAt=(s:Belt,id:number)=>{const base=products[productAt(s,id)].price;return onSale(s,id)?Math.ceil(base/2):base;};
const paid=(p:Purchase)=>p.price??products[p.product].price;
export const beltCost=(s:Belt)=>s.cart.reduce((n,p)=>n+paid(p),0);
export const beltCount=(s:Belt)=>recipe.filter(r=>s.cart.some(p=>products[p.product].key===r.key)).length;
export const beltReady=(s:Belt)=>beltCount(s)===5&&beltCost(s)<=BUDGET;
export const beltSpeed=(elapsed:number)=>elapsed<30_000?55:elapsed<45_000?70:85;
export function beltOffers(s:Belt){const first=Math.max(0,Math.floor((s.distance-180)/145));return Array.from({length:6},(_,n)=>first+n).map(id=>({id,product:productAt(s,id),sale:onSale(s,id),price:priceAt(s,id),x:100+id*145-s.distance})).filter(o=>o.x>-65&&o.x<485&&!s.taken.includes(o.id));}
/** Paying early leaves seconds on the clock; unspent coins and spare seconds both become points. */
function settle(s:Belt):Belt{const savings=BUDGET-beltCost(s);const timeBonus=Math.floor((BELT_MS-s.elapsed)/1000)*3;return {...s,status:'won',savings,timeBonus,score:s.score+savings*5+timeBonus};}
export const beltRating=(s:Belt)=>s.score>=260?3:s.score>=190?2:1;
export type BeltAction={type:'tick';delta:number}|{type:'buy'|'remove';id:number}|{type:'freeze'|'checkout'};
export function beltStep(s:Belt,a:BeltAction):Belt{
 if(s.status!=='playing')return s;
 if(a.type==='tick'){const dt=Math.min(100,Math.max(0,a.delta),BELT_MS-s.elapsed),moving=Math.max(0,dt-s.freeze);const elapsed=s.elapsed+dt;const next={...s,elapsed,distance:s.distance+moving/1000*beltSpeed(s.elapsed),freeze:Math.max(0,s.freeze-dt)};return elapsed>=BELT_MS?(beltReady(s)?settle(next):{...next,status:'lost'}):next;}
 if(a.type==='freeze')return s.freezes>0&&s.freeze===0?{...s,freezes:s.freezes-1,freeze:3000,notice:'Лента замерла на 3 секунды. Часы магазина продолжают идти!'}:s;
 if(a.type==='remove')return {...s,cart:s.cart.filter(p=>p.offer!==a.id),notice:'Лишнее вернули. Монеты снова в бюджете.'};
 if(a.type==='buy'){
  const offer=beltOffers(s).find(o=>o.id===a.id&&o.x>-58&&o.x<478);if(!offer||s.cart.length>=10)return s;
  const key=products[offer.product].key;const listed=recipe.some(r=>r.key===key);const owned=s.cart.find(p=>products[p.product].key===key);
  const item={offer:offer.id,product:offer.product,price:offer.price};
  if(listed&&owned&&offer.price<paid(owned)){
   // A cheaper copy of something already in the cart swaps in automatically.
   const diff=paid(owned)-offer.price;const combo=s.combo+1;
   return {...s,cart:[...s.cart.filter(p=>p!==owned),item],taken:[...s.taken,offer.id],combo,best:Math.max(s.best,combo),score:s.score+diff*3,notice:`Обмен по акции! ${products[offer.product].name} дешевле на ${diff}. Серия ${combo}!`};
  }
  const useful=listed&&!owned;const fresh=useful&&!s.rewarded.includes(key);const combo=useful?s.combo+1:0;
  const next={...s,cart:[...s.cart,item],taken:[...s.taken,offer.id],combo,best:Math.max(s.best,combo),score:s.score+(fresh?10+combo*5:0),rewarded:fresh?[...s.rewarded,key]:s.rewarded};
  return {...next,notice:beltCost(next)>BUDGET?'Бюджет превышен! Верни лишнее из корзины.':useful?`${products[offer.product].name} ✓ Серия ${combo}!`:'Этого в списке не было. Серия сброшена — покупку можно вернуть.'};
 }
 return beltReady(s)?settle(s):{...s,notice:'Нужны все пять продуктов и сумма не больше 35 монет.'};
}
