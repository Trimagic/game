import {cookReducer,createCookState,phoneActive,nextTask,type CookState,type CookAction,type Station} from './model.ts';
export type Splash={at:number;station:Station};
export type PrecisionCook={cook:CookState;quality:number;combo:number;best:number;feedback:string;prepMs:number;prepBonus:number;splashes:Splash[];splashResults:Record<number,'done'|'missed'>};
export type PreciseAction=CookAction|{type:'splash'};
export const SPLASH_MS=1600;
export const PREP_PAR=16_000;
const fixedSplashes:Splash[]=[{at:9500,station:'pot'},{at:17500,station:'pan'},{at:22500,station:'pot'},{at:37000,station:'pot'}];
// Slots stay clear of the phone call (26–31 s) so a splash never hides behind it.
const slots=[[8000,11000],[15000,19500],[21000,24000],[32000,38500]];
export function splashPlan(seed?:number):Splash[]{
 if(seed===undefined)return fixedSplashes;
 let a=seed>>>0;const random=()=>{a=(a*1664525+1013904223)>>>0;return a/4294967296;};
 return slots.map(([from,to])=>({at:Math.round(from+random()*(to-from)),station:random()<.5?'pan':'pot'}));
}
export const precisionInitial=(seed?:number):PrecisionCook=>({cook:createCookState(),quality:0,combo:0,best:0,feedback:'Шесть разрезов. Затем две конфорки одновременно.',prepMs:0,prepBonus:0,splashes:splashPlan(seed),splashResults:{}});
// The needle speeds up after 20 s; integrating the period keeps its motion continuous.
const turns=(t:number)=>t<20_000?t/1700:20_000/1700+(t-20_000)/1300;
export const needle=(elapsed:number,station:Station)=>.5-.5*Math.cos(turns(elapsed+(station==='pot'?700:0))*Math.PI*2);
export const inGreen=(value:number)=>value>=.24&&value<=.76;
export const activeSplash=(s:PrecisionCook)=>s.cook.stage!=='stove'||phoneActive(s.cook)?-1:s.splashes.findIndex((p,i)=>!s.splashResults[i]&&s.cook.elapsed>=p.at&&s.cook.elapsed<p.at+SPLASH_MS);
export const cookRating=(quality:number)=>quality>=250?3:quality>=170?2:1;
export function preciseAction(s:PrecisionCook,a:PreciseAction):PrecisionCook{
 if(s.cook.stage==='won'||s.cook.stage==='lost')return s;
 if(a.type==='tick'&&s.cook.stage==='prep')return {...s,prepMs:s.prepMs+Math.max(0,Math.min(a.delta,250))};
 if(a.type==='splash'){
  const index=activeSplash(s);if(index<0)return s;const combo=s.combo+1;
  return {...s,splashResults:{...s.splashResults,[index]:'done'},quality:s.quality+15,combo,best:Math.max(s.best,combo),feedback:`${s.splashes[index].station==='pot'?'Пену поймал':'Брызги накрыл'}! +15 · серия ${combo}`};
 }
 if(a.type==='act'){
  const task=nextTask(s.cook,a.station);
  if(!task||s.cook.stage!=='stove'||phoneActive(s.cook)||s.cook.elapsed<task.at||s.cook.elapsed>task.until)return s;
  const position=needle(s.cook.elapsed,a.station);
  if(!inGreen(position))return {...s,feedback:'Чуть мимо! Дождись зелёной зоны и повтори до конца окна.'};
  const perfect=position>=.42&&position<=.58;const combo=s.combo+1;
  return {...s,cook:cookReducer(s.cook,a),quality:s.quality+(perfect?30:20),combo,best:Math.max(s.best,combo),feedback:perfect?`Идеально! +30 · серия ${combo}`:`Вовремя! +20 · серия ${combo}`};
 }
 const cook=cookReducer(s.cook,a);if(cook===s.cook)return s;
 if(a.type==='cut'){
  const gain=a.precise?10:5;
  if(cook.stage!=='ready')return {...s,cook,quality:s.quality+gain,feedback:a.precise?`Ровно по линии! +10 · ${cook.notice}`:cook.notice};
  const prepBonus=Math.max(0,Math.min(40,Math.round((PREP_PAR-s.prepMs)/250)));
  return {...s,cook,quality:s.quality+gain+prepBonus,prepBonus,feedback:`Нарезка за ${(s.prepMs/1000).toFixed(1)} с${prepBonus?` — бонус за скорость +${prepBonus}`:''}. Включаем плиту?`};
 }
 let next={...s,cook,quality:s.quality+(a.type==='plate'?10:0),combo:cook.mistakes>s.cook.mistakes?0:s.combo,feedback:cook.mistakes>s.cook.mistakes?cook.notice:a.type==='tick'?s.feedback:cook.notice};
 if(a.type==='tick'){
  const missed=s.splashes.flatMap((p,i)=>!s.splashResults[i]&&cook.elapsed>=p.at+SPLASH_MS?[i]:[]);
  if(missed.length)next={...next,combo:0,splashResults:{...s.splashResults,...Object.fromEntries(missed.map(i=>[i,'missed']))},feedback:'Пена убежала! Не страшно, но серия сброшена.'};
 }
 return next;
}
