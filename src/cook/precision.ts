import {cookReducer,createCookState,type CookState,type CookAction} from './model.ts';
import {actStove,answerPhone,createStove,tickStove,type Stove} from './stove.ts';
export type PrecisionCook={cook:CookState;quality:number;combo:number;best:number;feedback:string;prepMs:number;prepBonus:number;stove:Stove};
export type PreciseAction=CookAction|{type:'burner';index:number}|{type:'answer'};
export const PREP_PAR=16_000;
export const precisionInitial=(seed?:number):PrecisionCook=>({cook:createCookState(),quality:0,combo:0,best:0,feedback:'Шесть разрезов. Затем три конфорки одновременно.',prepMs:0,prepBonus:0,stove:createStove(seed)});
export const cookRating=(quality:number)=>quality>=300?3:quality>=220?2:1;
/** Folds a new stove state into the round: points, streak and the hand-off to plating or defeat. */
function withStove(s:PrecisionCook,stove:Stove):PrecisionCook{
 if(stove===s.stove)return s;
 const cook:CookState=stove.status==='done'?{...s.cook,stage:'plate',notice:'Ещё немного — и можно к столу.'}:stove.status==='lost'?{...s.cook,stage:'lost',mistakes:stove.mistakes}:{...s.cook,mistakes:stove.mistakes};
 return {...s,stove,cook,quality:s.quality+stove.gained-s.stove.gained,combo:stove.combo,best:Math.max(s.best,stove.best),feedback:stove.feedback};
}
export function preciseAction(s:PrecisionCook,a:PreciseAction):PrecisionCook{
 if(s.cook.stage==='won'||s.cook.stage==='lost')return s;
 if(a.type==='tick'&&s.cook.stage==='prep')return {...s,prepMs:s.prepMs+Math.max(0,Math.min(a.delta,250))};
 if(s.cook.stage==='stove'){
  if(a.type==='tick')return withStove(s,tickStove(s.stove,a.delta/1000));
  if(a.type==='burner')return withStove(s,actStove(s.stove,a.index));
  if(a.type==='answer')return withStove(s,answerPhone(s.stove));
  return s;
 }
 if(a.type==='burner'||a.type==='answer')return s;
 const cook=cookReducer(s.cook,a);if(cook===s.cook)return s;
 if(a.type==='cut'){
  const gain=a.precise?10:5;
  if(cook.stage!=='ready')return {...s,cook,quality:s.quality+gain,feedback:a.precise?`Ровно по линии! +10 · ${cook.notice}`:cook.notice};
  const prepBonus=Math.max(0,Math.min(40,Math.round((PREP_PAR-s.prepMs)/250)));
  return {...s,cook,quality:s.quality+gain+prepBonus,prepBonus,feedback:`Нарезка за ${(s.prepMs/1000).toFixed(1)} с${prepBonus?` — бонус за скорость +${prepBonus}`:''}. Включаем плиту?`};
 }
 if(a.type==='start')return {...s,cook,feedback:s.stove.feedback};
 return {...s,cook,quality:s.quality+(a.type==='plate'?10:0),feedback:cook.notice};
}
