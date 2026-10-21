import {test} from 'node:test';
import assert from 'node:assert/strict';
import {course,HERO_X,obstacleX} from '../src/run/model.ts';
import {runInitial,runAction,runTick,tokens} from '../src/run/round.ts';
test('full run with sparks, barriers and focus remains winnable without damage',()=>{
 let s=runInitial();const jumped=new Set<number>();let focusUsed=false;
 for(let frame=0;frame<120*80&&s.runner.status==='playing';frame++){
  const o=course.find(o=>obstacleX(o,s.runner.time)+o.width/2>HERO_X-12);
  s=runAction(s,o?.kind==='branch'&&o.at-s.runner.time<.6?'down':'up');
  if(o&&o.kind!=='branch'&&!jumped.has(o.id)&&o.at-s.runner.time<.36){s=runAction(s,'jump');jumped.add(o.id);}
  if(!focusUsed&&s.collected.length>=5){s=runAction(s,'focus');focusUsed=true;}
  s=runTick(s,1/120);
 }
 assert.equal(s.runner.status,'won');assert.equal(s.runner.lives,3);assert.equal(s.runner.cleared,course.length);assert.equal(s.best,course.length);assert.ok(focusUsed);assert.ok(s.collected.length>=20);assert.equal(new Set(s.collected).size,s.collected.length);assert.ok(s.score>500);
});
test('focus costs five sparks, slows simulation and cannot stack or activate without charge',()=>{
 const base=runInitial();assert.equal(runAction(base,'focus'),base);
 let s=runAction({...base,collected:tokens.slice(0,5).map(t=>t.id)},'focus');assert.equal(s.spent,5);assert.equal(runAction(s,'focus'),s);
 for(let i=0;i<30;i++)s=runTick(s,.1);
 assert.ok(Math.abs(s.runner.time-1.65)<.01);assert.ok(s.focus<1e-6);assert.equal(runAction(s,'focus'),s);
 assert.equal(runTick({...s,runner:{...s.runner,status:'won'}},.1).runner.time,s.runner.time);
});
test('damage resets clean streak and an obstacle cannot pay twice',()=>{
 let s=runTick({...runInitial(),runner:{...runInitial().runner,time:4.3},combo:3},.1);const paid=s.score;
 s=runTick(s,.1);assert.equal(s.score,paid);
 s=runTick({...s,runner:{...s.runner,time:7.4,shield:0}},.1);assert.equal(s.combo,0);assert.equal(s.runner.lives,2);
});
