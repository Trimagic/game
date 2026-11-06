import {test} from 'node:test';
import assert from 'node:assert/strict';
import {course,HERO_X,obstacleX} from '../src/run/model.ts';
import {runInitial,runAction,runRating,runTick,tokens} from '../src/run/round.ts';
function run(seed:number){
 let s=runInitial(seed);const jumped=new Set<number>();let focusUsed=false;
 for(let frame=0;frame<120*80&&s.runner.status==='playing';frame++){
  const o=s.runner.course.obstacles.find(o=>obstacleX(o,s.runner.time)+o.width/2>HERO_X-12);
  s=runAction(s,(o?.kind==='branch'||o?.kind==='pigeons')&&o.at-s.runner.time<.6?'down':'up');
  if(o&&o.kind!=='branch'&&o.kind!=='pigeons'&&!jumped.has(o.id)&&o.at-s.runner.time<.36){s=runAction(s,'jump');jumped.add(o.id);}
  if(!focusUsed&&s.collected.length>=5){s=runAction(s,'focus');focusUsed=true;}
  s=runTick(s,1/120);
 }
 return {s,focusUsed};
}
test('full run with sparks, new obstacles and focus remains winnable without damage',()=>{
 for(const seed of [1,2,3,4,5,6,7,8]){
  const {s,focusUsed}=run(seed);const total=s.runner.course.obstacles.length;
  assert.equal(s.runner.status,'won',`seed ${seed}`);assert.equal(s.runner.lives,3,`seed ${seed}`);assert.equal(s.runner.cleared,total);assert.equal(s.best,total);assert.ok(focusUsed);
  assert.equal(new Set(s.collected).size,s.collected.length);assert.ok(s.score>500);assert.ok(s.collected.length>=s.tokens.length*.5,`seed ${seed} ${s.collected.length}/${s.tokens.length}`);
  assert.equal(runRating(s),s.collected.length>=s.tokens.length*.6?3:2);
 }
});
test('focus costs five sparks, slows simulation and cannot stack or activate without charge',()=>{
 const base=runInitial();assert.equal(runAction(base,'focus'),base);
 let s=runAction({...base,collected:tokens.slice(0,5).map(t=>t.id)},'focus');assert.equal(s.spent,5);assert.equal(runAction(s,'focus'),s);
 for(let i=0;i<30;i++)s=runTick(s,.1);
 assert.ok(Math.abs(s.runner.time-1.65)<.01);assert.ok(s.focus<1e-6);assert.equal(runAction(s,'focus'),s);
 assert.equal(runTick({...s,runner:{...s.runner,status:'won'}},.1).runner.time,s.runner.time);
});
test('damage resets clean streak and an obstacle cannot pay twice',()=>{
 let s=runTick({...runInitial(),runner:{...runInitial().runner,time:course[0].at+.3},combo:3},.1);const paid=s.score;
 s=runTick(s,.1);assert.equal(s.score,paid);
 s=runTick({...s,runner:{...s.runner,time:course[1].at-.1,shield:0}},.1);assert.equal(s.combo,0);assert.equal(s.runner.lives,2);
});
test('stars need a clean run with most sparks, and a loss earns none',()=>{
 const won=(extra:object)=>({...runInitial(),collected:runInitial().tokens.map(t=>t.id),runner:{...runInitial().runner,status:'won' as const,...extra}});
 assert.equal(runRating(won({})),3);assert.equal(runRating(won({hits:[1],lives:2})),2);assert.equal(runRating(won({hits:[1,2],lives:1})),1);
 assert.equal(runRating({...won({}),collected:[]}),2);assert.equal(runRating(runInitial()),0);
});
