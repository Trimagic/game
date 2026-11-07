import {cookReducer,createCookState,type CookState,type CookAction} from './model.ts';
import {actStove,answerPhone,createStove,tickStove,type Stove} from './stove.ts';
import {createChop,slice,sliceLowest,tickChop,type Chop} from './chop.ts';
export type PrecisionCook={cook:CookState;quality:number;combo:number;best:number;feedback:string;prepMs:number;prepBonus:number;chop:Chop;stove:Stove};
type Point={x:number;y:number};
export type PreciseAction=CookAction|{type:'burner';index:number}|{type:'answer'}|{type:'slice';from:Point;to:Point};
export const PREP_PAR=26_000;
export const precisionInitial=(seed?:number):PrecisionCook=>({cook:createCookState(),quality:0,combo:0,best:0,feedback:'Режь падающие овощи свайпом. Курицу — только на своей доске!',prepMs:0,prepBonus:0,chop:createChop(seed??1),stove:createStove(seed)});
export const cookRating=(quality:number)=>quality>=400?3:quality>=300?2:1;
/** Folds a new chopping board into the round; a finished board hands over to the stove. */
function withChop(s:PrecisionCook,chop:Chop):PrecisionCook{
 if(chop===s.chop)return s;
 const last=chop.events.at(-1);
 let next:PrecisionCook={...s,chop,quality:s.quality+chop.score-s.chop.score,combo:chop.combo,best:Math.max(s.best,chop.best),feedback:last?last.label:s.feedback};
 if(chop.board==='done'){
  const prepBonus=Math.max(0,Math.min(40,Math.round((PREP_PAR-s.prepMs)/250)));
  next={...next,cook:{...s.cook,stage:'ready',cuts:6,notice:'Нарезка готова. Включаем плиту?'},prepBonus,quality:next.quality+prepBonus,feedback:`Нарезка за ${(s.prepMs/1000).toFixed(1)} с${prepBonus?` — бонус за скорость +${prepBonus}`:''}. Включаем плиту?`};
 }
 return next;
}
/** Folds a new stove state into the round: points, streak and the hand-off to plating or defeat. */
function withStove(s:PrecisionCook,stove:Stove):PrecisionCook{
 if(stove===s.stove)return s;
 const cook:CookState=stove.status==='done'?{...s.cook,stage:'plate',notice:'Ещё немного — и можно к столу.'}:stove.status==='lost'?{...s.cook,stage:'lost',mistakes:stove.mistakes}:{...s.cook,mistakes:stove.mistakes};
 return {...s,stove,cook,quality:s.quality+stove.gained-s.stove.gained,combo:stove.combo,best:Math.max(s.best,stove.best),feedback:stove.feedback};
}
export function preciseAction(s:PrecisionCook,a:PreciseAction):PrecisionCook{
 if(s.cook.stage==='won'||s.cook.stage==='lost')return s;
 if(s.cook.stage==='prep'){
  if(a.type==='tick')return withChop({...s,prepMs:s.prepMs+Math.max(0,Math.min(a.delta,250))},tickChop(s.chop,a.delta));
  if(a.type==='slice')return withChop(s,slice(s.chop,a.from,a.to));
  if(a.type==='cut')return withChop(s,sliceLowest(s.chop));
  return s;
 }
 if(s.cook.stage==='stove'){
  if(a.type==='tick')return withStove(s,tickStove(s.stove,a.delta/1000));
  if(a.type==='burner')return withStove(s,actStove(s.stove,a.index));
  if(a.type==='answer')return withStove(s,answerPhone(s.stove));
  return s;
 }
 if(a.type==='burner'||a.type==='answer'||a.type==='slice'||a.type==='cut')return s;
 const cook=cookReducer(s.cook,a);if(cook===s.cook)return s;
 if(a.type==='start')return {...s,cook,feedback:s.stove.feedback};
 return {...s,cook,quality:s.quality+(a.type==='plate'?10:0),feedback:cook.notice};
}
