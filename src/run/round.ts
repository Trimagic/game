import {course,duck,HERO_X,initial,jump,obstacleX,step,travel,type State} from './model.ts';
export const tokens=course.flatMap(o=>[-.09,0,.09].map((offset,i)=>({id:o.id*3+i,at:o.at+offset,y:o.kind==='branch'?17:91})));
export type RunRound={runner:State;collected:number[];passed:number[];score:number;combo:number;best:number;spent:number;focus:number};
export const runInitial=():RunRound=>({runner:initial(),collected:[],passed:[],score:0,combo:0,best:0,spent:0,focus:0});
export const tokenX=(at:number,time:number)=>HERO_X+travel(at)-travel(time);
export function runAction(s:RunRound,action:'jump'|'down'|'up'|'focus'):RunRound{
 if(s.runner.status!=='playing')return s;
 if(action==='focus')return s.collected.length-s.spent>=5&&s.focus===0?{...s,spent:s.spent+5,focus:3}:s;
 return {...s,runner:action==='jump'?jump(s.runner):duck(s.runner,action==='down')};
}
export function runTick(state:RunRound,dt:number):RunRound{
 if(state.runner.status!=='playing')return state;
 let s=state,remaining=Math.min(.1,Math.max(0,dt));
 while(remaining>1e-6&&s.runner.status==='playing'){
  const h=Math.min(remaining,1/120);remaining-=h;
  const runner=step(s.runner,h*(s.focus>0?.55:1));
  const hit=runner.hits.length>s.runner.hits.length;
  const center=runner.y+(runner.duck&&runner.y===0?15:29);
  const collected=tokens.filter(c=>!s.collected.includes(c.id)&&(c.y===17?runner.duck&&runner.y===0:runner.y>0)&&Math.abs(tokenX(c.at,runner.time)-HERO_X)<19&&Math.abs(center-c.y)<27);
  const passed=course.filter(o=>!s.passed.includes(o.id)&&obstacleX(o,runner.time)+o.width/2<HERO_X-12);
  let combo=hit?0:s.combo,score=s.score+collected.length*10,best=s.best;
  for(const o of passed){if(!runner.hits.includes(o.id)){combo++;score+=25+Math.min(combo,10)*5;best=Math.max(best,combo);}}
  s={...s,runner,collected:[...s.collected,...collected.map(c=>c.id)],passed:[...s.passed,...passed.map(o=>o.id)],score,combo,best,focus:Math.max(0,s.focus-h)};
 }
 return s;
}

