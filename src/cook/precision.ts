import {cookReducer,createCookState,phoneActive,nextTask,type CookState,type CookAction,type Station} from './model.ts';
export type PrecisionCook={cook:CookState;quality:number;combo:number;best:number;feedback:string};
export const precisionInitial=():PrecisionCook=>({cook:createCookState(),quality:0,combo:0,best:0,feedback:'Шесть разрезов. Затем две конфорки одновременно.'});
export const needle=(elapsed:number,station:Station)=>.5-.5*Math.cos((elapsed+(station==='pot'?700:0))/1700*Math.PI*2);
export const inGreen=(value:number)=>value>=.24&&value<=.76;
export function preciseAction(s:PrecisionCook,a:CookAction):PrecisionCook{
 if(s.cook.stage==='won'||s.cook.stage==='lost')return s;
 if(a.type==='act'){
  const task=nextTask(s.cook,a.station);
  if(!task||s.cook.stage!=='stove'||phoneActive(s.cook)||s.cook.elapsed<task.at||s.cook.elapsed>task.until)return s;
  const position=needle(s.cook.elapsed,a.station);
  if(!inGreen(position))return {...s,feedback:'Чуть мимо! Дождись зелёной зоны и повтори до конца окна.'};
  const perfect=position>=.42&&position<=.58;const combo=s.combo+1;
  return {...s,cook:cookReducer(s.cook,a),quality:s.quality+(perfect?30:20),combo,best:Math.max(s.best,combo),feedback:perfect?`Идеально! +30 · серия ${combo}`:`Вовремя! +20 · серия ${combo}`};
 }
 const cook=cookReducer(s.cook,a);if(cook===s.cook)return s;
 return {...s,cook,quality:s.quality+(a.type==='cut'?5:a.type==='plate'?10:0),combo:cook.mistakes>s.cook.mistakes?0:s.combo,feedback:cook.mistakes>s.cook.mistakes?cook.notice:a.type==='tick'?s.feedback:cook.notice};
}
