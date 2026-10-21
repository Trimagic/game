import {BUDGET,products,recipe} from './model.ts';
export const MARKET_MS=90_000;
export const aisles=[{name:'Холодильник',items:[0,6,5]},{name:'Крупы и овощи',items:[1,2,8]},{name:'Для салата',items:[3,4,7]}];
export type Market={aisle:number;cart:number[];elapsed:number;status:'playing'|'won'|'lost';notice:string};
export type MarketAction={type:'tick';delta:number}|{type:'aisle';index:number}|{type:'buy'|'remove';product:number}|{type:'checkout'};
export const marketInitial=():Market=>({aisle:0,cart:[],elapsed:0,status:'playing',notice:'Пять продуктов. Три отдела. Не переплачивай за красивую этикетку.'});
export const marketCost=(s:Market)=>s.cart.reduce((n,id)=>n+products[id].price,0);
export const marketCount=(s:Market)=>recipe.filter(r=>s.cart.some(id=>products[id].key===r.key)).length;
export const marketReady=(s:Market)=>marketCost(s)<=BUDGET&&marketCount(s)===5;
export function marketStep(s:Market,a:MarketAction):Market{
 if(s.status!=='playing')return s;
 if(a.type==='tick'){const elapsed=Math.min(MARKET_MS,s.elapsed+Math.max(0,Math.min(a.delta,100)));return {...s,elapsed,status:elapsed>=MARKET_MS?'lost':'playing'};}
 if(a.type==='aisle')return Number.isInteger(a.index)&&a.index>=0&&a.index<aisles.length?{...s,aisle:a.index,notice:`${aisles[a.index].name}. Сравни цены и сверься со списком.`}:s;
 if(a.type==='remove')return {...s,cart:s.cart.filter(id=>id!==a.product),notice:'Вернули товар. Монеты тоже вернулись.'};
 if(a.type==='buy'){
  if(!aisles[s.aisle].items.includes(a.product)||s.cart.includes(a.product))return s;
  const next={...s,cart:[...s.cart,a.product]};return {...next,notice:marketCost(next)>BUDGET?'Слишком дорого! Нажми на товар в корзине, чтобы вернуть.':`${products[a.product].name} — в корзине.`};
 }
 return marketReady(s)?{...s,status:'won'}:{...s,notice:marketCost(s)>BUDGET?'Бюджет превышен. Верни лишнее или замени премиальный рис обычным.':'Не всё по списку. Посети остальные отделы.'};
}
