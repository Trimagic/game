import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initial,step,solids,puddles,cartX,GOAL,type State} from '../src/night/model.ts';
const idle=(s:State,n:number)=>{for(let i=0;i<n;i++)s=step(s,1/60,{move:0,jump:false});return s;};
test('Walking cannot pass through furniture; jumping clears it',()=>{
 let s={...initial(),x:270};s=step(s,.1,{move:1,jump:false});assert.ok(s.x<=278);
 for(let i=0;i<55;i++)s=step(s,1/60,{move:1,jump:i<45});assert.ok(s.x>355);assert.equal(s.status,'playing');
});
test('Holding jump gives more height and no repeat jump while holding on landing',()=>{
 let held=initial(),tap=initial(),minHeld=400,minTap=400;
 for(let i=0;i<100;i++){held=step(held,1/60,{move:0,jump:true});tap=step(tap,1/60,{move:0,jump:i===0});minHeld=Math.min(minHeld,held.y);minTap=Math.min(minTap,tap.y);}
 assert.ok(minHeld<minTap-20);assert.equal(held.y,400);assert.equal(held.vy,0);
});
test('Falling and running out of patience require retry; terminal state is frozen',()=>{
 const fallen=idle({...initial(),x:680,grounded:false},90);assert.equal(fallen.status,'lost');assert.match(fallen.reason,/ремонтный/);
 const tired=idle({...initial(),patience:.01},1);assert.equal(tired.status,'lost');assert.equal(idle(tired,100),tired);assert.equal(initial().patience,100);
});
test('Hazards have an invulnerability window and moon tokens collect only once',()=>{
 let s=step({...initial(),x:820},.025,{move:0,jump:false});assert.equal(s.hits,1);s=idle(s,30);assert.equal(s.hits,1);
 let b=step({...initial(),x:505,y:322,grounded:false,patience:50},.025,{move:0,jump:false});assert.deepEqual(b.collected,[0]);assert.ok(b.patience>61);b=idle(b,2);assert.deepEqual(b.collected,[0]);assert.ok(b.patience<62);
});
test('Only reaching the door triggers the scripted ending',()=>{
 let s=step({...initial(),x:GOAL},.025,{move:0,jump:false});assert.equal(s.status,'ending');s=idle(s,200);assert.equal(s.status,'done');assert.equal(idle(s,100),s);
});
test('The whole corridor is reachable with ordinary movement and jumps',()=>{
 let s=initial();
 for(let i=0;i<2400&&s.status==='playing';i++){
  const targets=[...solids.filter(b=>b.y<400).map(b=>b.x),...puddles.map(p=>p.x),cartX(s.time)-22];
  const obstacle=targets.some(x=>x-s.x>=-5&&x-s.x<55)||[650,1450].some(x=>x-s.x>=-5&&x-s.x<35);
  s=step(s,1/60,{move:1,jump:(s.jumpHeld&&!s.grounded)||obstacle});
 }
 assert.equal(s.status,'ending',`stopped at ${s.x}, ${s.y}: ${s.reason}`);assert.ok(s.patience>0);
});

