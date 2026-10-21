import {products,recipe,BUDGET,type Purchase} from './model.ts';
export const BELT_MS=60_000;
const sequence=[0,5,1,8,2,6,3,7,4];
export type Belt={elapsed:number;distance:number;cart:Purchase[];taken:number[];rewarded:string[];combo:number;best:number;score:number;freezes:number;freeze:number;status:'playing'|'won'|'lost';notice:string};
export const beltInitial=():Belt=>({elapsed:0,distance:0,cart:[],taken:[],rewarded:[],combo:0,best:0,score:0,freezes:2,freeze:0,status:'playing',notice:'Лови продукты по списку. Приманки можно просто пропускать.'});
export const beltCost=(s:Belt)=>s.cart.reduce((n,p)=>n+products[p.product].price,0);
export const beltCount=(s:Belt)=>recipe.filter(r=>s.cart.some(p=>products[p.product].key===r.key)).length;
export const beltReady=(s:Belt)=>beltCount(s)===5&&beltCost(s)<=BUDGET;
export const beltSpeed=(elapsed:number)=>elapsed<30_000?55:elapsed<45_000?70:85;
export function beltOffers(s:Belt){const first=Math.max(0,Math.floor((s.distance-180)/145));return Array.from({length:6},(_,n)=>first+n).map(id=>({id,product:sequence[id%sequence.length],x:100+id*145-s.distance})).filter(o=>o.x>-65&&o.x<485&&!s.taken.includes(o.id));}
export type BeltAction={type:'tick';delta:number}|{type:'buy'|'remove';id:number}|{type:'freeze'|'checkout'};
export function beltStep(s:Belt,a:BeltAction):Belt{
 if(s.status!=='playing')return s;
 if(a.type==='tick'){const dt=Math.min(100,Math.max(0,a.delta),BELT_MS-s.elapsed),moving=Math.max(0,dt-s.freeze);const elapsed=s.elapsed+dt;return {...s,elapsed,distance:s.distance+moving/1000*beltSpeed(s.elapsed),freeze:Math.max(0,s.freeze-dt),status:elapsed>=BELT_MS?(beltReady(s)?'won':'lost'):'playing'};}
 if(a.type==='freeze')return s.freezes>0&&s.freeze===0?{...s,freezes:s.freezes-1,freeze:3000,notice:'Лента замерла на 3 секунды. Часы магазина продолжают идти!'}:s;
 if(a.type==='remove')return {...s,cart:s.cart.filter(p=>p.offer!==a.id),notice:'Лишнее вернули. Монеты снова в бюджете.'};
 if(a.type==='buy'){
  const offer=beltOffers(s).find(o=>o.id===a.id&&o.x>-58&&o.x<478);if(!offer||s.cart.length>=10)return s;
  const key=products[offer.product].key;const useful=recipe.some(r=>r.key===key)&&!s.cart.some(p=>products[p.product].key===key);const fresh=useful&&!s.rewarded.includes(key);const combo=useful?s.combo+1:0;
  const next={...s,cart:[...s.cart,{offer:offer.id,product:offer.product}],taken:[...s.taken,offer.id],combo,best:Math.max(s.best,combo),score:s.score+(fresh?10+combo*5:0),rewarded:fresh?[...s.rewarded,key]:s.rewarded};
  return {...next,notice:beltCost(next)>BUDGET?'Бюджет превышен! Верни лишнее из корзины.':useful?`${products[offer.product].name} ✓ Серия ${combo}!`:'Этого в списке не было. Серия сброшена — покупку можно вернуть.'};
 }
 return s.elapsed>=45_000&&beltReady(s)?{...s,status:'won'}:{...s,notice:s.elapsed<45_000?'Касса откроется на 45-й секунде. Пока проверь корзину.':'Нужны все пять продуктов и сумма не больше 35 монет.'};
}

