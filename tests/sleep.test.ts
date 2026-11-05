import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BED, directions, distances, GOAL, initial, key, MAP, neighbor, same, START, step, turn, walkable, type State } from '../src/sleep/model.ts';

test('all corridors, powers and bed are reachable; enough points exist',()=>{
  assert.ok(MAP.every(r=>r.length===15));
  const field=distances(START);assert.equal(field.size,MAP.join('').replaceAll('#','').length);
  assert.ok(field.has(key(BED)));const s=initial();assert.ok(s.dots.length*10>GOAL);assert.equal(s.powers.length,4);
});
test('buffered turn waits for a junction and walls are impassable',()=>{
  let s=turn(initial(),'left');s=step(s,.19);
  assert.deepEqual(s.pos,{x:7,y:12});assert.equal(s.queued,'left');
  s=step(s,.18);assert.deepEqual(s.pos,{x:7,y:11});
  s=step(s,.18);assert.deepEqual(s.pos,{x:6,y:11});
  for(let i=0;i<100;i++)s=step(s,.18);
  assert.ok(walkable(s.pos));
});
test('dots score once; collecting the goal alone does not win',()=>{
  let s=step(initial(),.19);assert.equal(s.score,10);assert.equal(s.dots.includes('7,12'),false);
  s=turn(s,'down');s=step(s,.18);s=turn(s,'up');s=step(s,.18);assert.equal(s.score,10);
  s={...s,score:GOAL};s=step(s,.18);assert.equal(s.status,'playing');
});
test('bed needs enough points and victory is terminal',()=>{
  let s:State={...initial(),pos:{x:7,y:2},dir:'up',queued:'up'};
  assert.equal(step(s,.19).status,'playing');
  s=step({...s,score:GOAL},.19);assert.equal(s.status,'won');assert.deepEqual(step(s,.25),s);
});
test('collision preserves points, resets actors, and third distraction loses',()=>{
  const base=initial();
  const setup=(lives:number):State=>({...base,lives,score:200,shield:0,enemies:base.enemies.map((e,i)=>i===0?{...e,pos:{x:7,y:12},wait:0}:e)});
  const hit=step(setup(3),.19);assert.equal(hit.lives,2);assert.equal(hit.score,210);assert.ok(same(hit.pos,START));assert.ok(hit.shield>0);
  assert.equal(step(setup(1),.19).status,'lost');
});
test('moon grants quiet mode, repels enemies, and sends a touched screen away',()=>{
  let s:State={...initial(),pos:{x:2,y:13},dir:'left',queued:'left',shield:0};s=step(s,.19);assert.ok(s.quiet>6);assert.equal(s.powers.includes('1,13'),false);
  s={...s,pos:START,dir:'up',queued:'up',meter:0,enemies:s.enemies.map((e,i)=>i===0?{...e,pos:{x:7,y:12},wait:0,meter:0}:e)};
  s=step(s,.19);assert.equal(s.lives,3);assert.equal(s.caught,1);assert.ok(s.enemies[0].wait>3);
});
test('enemy release is staggered and chase never crosses walls',()=>{
  let s=initial();assert.deepEqual(s.enemies.map(e=>e.wait),[3,10,17,24]);
  for(let i=0;i<120;i++){s=step({...s,shield:1},.25);assert.ok(s.enemies.every(e=>walkable(e.pos)));}
});
test('quiet mode expires with an honest status message',()=>{
  const s=step({...initial(),quiet:.01,message:'НЕ БЕСПОКОИТЬ'},.02);
  assert.equal(s.quiet,0);assert.match(s.message,/Тишина закончилась/);
});
test('a complete collection route can reach the bed without missing pellets',()=>{
  let s=initial();
  // Isolate route/collection from combat, which is covered by collision tests.
  for(let i=0;i<1500&&s.status==='playing';i++){
    const field=distances(s.pos);
    const target=s.score>=GOAL?BED:s.dots.map(id=>{const[x,y]=id.split(',').map(Number);return{x,y};}).sort((a,b)=>field.get(key(a))!-field.get(key(b))!)[0];
    const targetField=distances(target);
    const d=directions.filter(d=>walkable(neighbor(s.pos,d))).sort((a,b)=>targetField.get(key(neighbor(s.pos,a)))!-targetField.get(key(neighbor(s.pos,b)))!)[0];
    s=step(turn({...s,shield:10},d),.18);
  }
  assert.equal(s.status,'won');assert.ok(s.score>=GOAL);
});

import { clock, MILK, MILK_TIMES, MILK_LIFE, DROWSY, YAWN, PAR, timeBonus, sleepRating } from '../src/sleep/model.ts';
test('night clock starts at 23:58 and wraps past midnight',()=>{
  assert.equal(clock(0),'23:58');assert.equal(clock(2),'00:00');assert.equal(clock(45.9),'00:43');
});
test('eating sparks without a gap builds a yawn bonus that a hit resets',()=>{
  let s:State={...initial(),pos:{x:1,y:11},dir:'right',queued:'right',shield:10,enemies:initial().enemies.map(e=>({...e,wait:99}))};const start=s.score;for(let i=0;i<YAWN;i++)s=step(s,.18);
  assert.equal(s.score-start,YAWN*10);assert.equal(s.yawns,1);assert.equal(s.bonus,30);s=step({...s,lastSpark:s.time-1},.18);assert.equal(s.streak,1);
  const base=initial();const hit=step({...base,streak:5,shield:0,enemies:base.enemies.map((e,i)=>i===0?{...e,pos:{x:7,y:12},wait:0}:e)},.19);assert.equal(hit.streak,0);
});
test('warm milk appears on schedule, slows screens and expires',()=>{
  let s=step({...initial(),time:MILK_TIMES[0]-.01},.02);assert.equal(s.milk>MILK_LIFE-.1,true);assert.ok(walkable(MILK));
  const drink=step({...s,pos:{x:MILK.x,y:MILK.y+1},dir:'up',queued:'up',meter:0},.19);assert.ok(same(drink.pos,MILK));assert.equal(drink.milk,0);assert.ok(drink.drowsy>DROWSY-.3);assert.equal(drink.bonus-s.bonus,50);
  let gone=s;for(let i=0;i<60;i++)gone=step({...gone,pos:START,shield:10},.2);assert.equal(gone.milk,0);
  // Drowsy screens step less often than alert ones.
  const awake={...initial(),shield:10,enemies:initial().enemies.map(e=>({...e,wait:0}))};
  let a:State=awake,d:State={...awake,drowsy:10};let movesA=0,movesD=0;
  for(let i=0;i<20;i++){const na=step(a,.1),nd=step(d,.1);movesA+=na.enemies.filter((e,j)=>!same(e.pos,a.enemies[j].pos)).length;movesD+=nd.enemies.filter((e,j)=>!same(e.pos,d.enemies[j].pos)).length;a={...na,pos:START};d={...nd,pos:START};}
  assert.ok(movesD<movesA);
});
test('catching a screen in quiet mode and an early bedtime both pay; rating rewards a fast clean night',()=>{
  const base=initial();const caught=step({...base,quiet:5,enemies:base.enemies.map((e,i)=>i===0?{...e,pos:{x:7,y:12},wait:0}:e)},.19);assert.equal(caught.bonus,50);
  const won=step({...base,pos:{x:7,y:2},dir:'up',queued:'up',score:GOAL,bonus:100,time:30},.19);
  assert.equal(won.status,'won');assert.equal(won.points,GOAL+100+timeBonus(won.time));assert.equal(timeBonus(PAR+5),0);
  assert.equal(sleepRating(won),3);assert.equal(sleepRating({...won,lives:2,time:70}),2);assert.equal(sleepRating({...won,lives:1,time:90}),1);assert.equal(sleepRating(base),0);
});
