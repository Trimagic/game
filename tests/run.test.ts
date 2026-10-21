import { test } from 'node:test';
import assert from 'node:assert/strict';
import {course,DURATION,duck,HERO_X,initial,jump,obstacleX,step,travel} from '../src/run/model.ts';
test('jump is automatic ballistic arc with no double jump',()=>{
  let s=jump(initial());s=step(s,.1);assert.ok(s.y>0);assert.deepEqual(jump(s),s);
  for(let i=0;i<9;i++)s=step(s,.1);assert.equal(s.y,0);assert.equal(s.vy,0);
});
test('duck clears branches but does not clear ground obstacles',()=>{
  const b=course.find(o=>o.kind==='branch')!;
  let s=step({...initial(),time:b.at-.01,duck:true},.02);assert.equal(s.lives,3);
  s=step({...initial(),time:b.at-.01},.02);assert.equal(s.lives,2);
  s=step({...initial(),time:course[1].at-.01,duck:true},.02);assert.equal(s.lives,2);
});
test('full round including double obstacles is winnable without damage',()=>{
  let s=initial();const jumped=new Set<number>();
  while(s.time<DURATION&&s.status==='playing'){
    const o=course.find(o=>obstacleX(o,s.time)+o.width/2>HERO_X-12);
    s=duck(s,!!o&&o.kind==='branch'&&o.at-s.time<.6);
    if(o&&o.kind!=='branch'&&!jumped.has(o.id)&&o.at-s.time<.36){s=jump(s);jumped.add(o.id);}
    s=step(s,1/120);
  }
  assert.equal(s.status,'won');assert.equal(s.lives,3,JSON.stringify(s.hits));assert.equal(s.cleared,course.length);
});
test('one obstacle cannot repeatedly damage; three hits lose',()=>{
  let s=step({...initial(),time:course[0].at-.1},.1);assert.equal(s.lives,2);
  for(let i=0;i<5;i++)s=step(s,.1);assert.equal(s.lives,2);
  s=step({...s,time:course[1].at-.1,shield:0},.1);assert.equal(s.lives,1);
  s=step({...s,time:course[2].at-.1,shield:0},.1);assert.equal(s.status,'lost');assert.deepEqual(step(s,60),s);
});
test('course speeds up with time and leaves space between actions',()=>{
  assert.ok(travel(60)-travel(59)>travel(1));
  for(let i=1;i<course.length;i++)assert.ok(course[i].at-course[i-1].at>=2);
  assert.ok(course.slice(0,5).every(o=>o.kind!=='branch'));
  assert.ok(course.slice(-8).some(o=>o.kind==='double'));
});
test('loss takes precedence and win requires finishing the full distance',()=>{
  assert.equal(step({...initial(),time:59.8},.1).status,'playing');
  const won=step({...initial(),time:59.99},.02);assert.equal(won.status,'won');assert.equal(won.time,60);
  assert.deepEqual(jump(won),won);assert.deepEqual(duck(won,true),won);
});
